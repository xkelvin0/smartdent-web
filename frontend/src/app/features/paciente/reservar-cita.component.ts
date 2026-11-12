import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthStore } from '../../core/auth/auth.store';
import {
  CitaResponse,
  OdontologoResponse,
  ServicioResponse,
} from '../../core/models/smartdent.models';
import { NotificationStore } from '../../core/notifications/notification.store';
import { ToastStore } from '../../core/notifications/toast.store';
import { SmartDentApiService } from '../../core/services/smartdent-api.service';
import { FieldErrorComponent } from '../../shared/ui/field-error.component';
import { resolveOdontologoImg } from '../../shared/utils/asset-url.util';
import {
  SmartDentValidators,
  applyServerValidationErrors,
  extractApiErrorMessage,
} from '../../shared/validators/smartdent.validators';

interface CategoryOption {
  readonly code: string;
  readonly label: string;
  readonly icon: string;
  readonly serviceCodes: readonly string[];
}

interface CalendarDayCell {
  readonly day: number | null;
  readonly dateValue: string;
  readonly unavailable: boolean;
  readonly selected: boolean;
  readonly ariaLabel: string;
}

const CATEGORIES: readonly CategoryOption[] = [
  {
    code: 'PREVENCION',
    label: 'Prevención',
    icon: 'health_and_safety',
    serviceCodes: ['SRV-CONSULTA', 'SRV-LIMPIEZA', 'SRV-URGENCIA'],
  },
  {
    code: 'ESTETICA',
    label: 'Estética',
    icon: 'auto_awesome',
    serviceCodes: ['SRV-DISENO', 'SRV-RESINA', 'SRV-BLANQUEAMIENTO', 'SRV-CARILLAS'],
  },
  {
    code: 'ORTODONCIA',
    label: 'Ortodoncia',
    icon: 'align_horizontal_center',
    serviceCodes: ['SRV-ORTODONCIA', 'SRV-ORTODONCIA-INVISIBLE'],
  },
  {
    code: 'REHABILITACION',
    label: 'Implantes',
    icon: 'dentistry',
    serviceCodes: ['SRV-IMPLANTE', 'SRV-PROTESIS'],
  },
  {
    code: 'CIRUGIA',
    label: 'Cirugía',
    icon: 'medical_services',
    serviceCodes: ['SRV-ENDODONCIA', 'SRV-EXTRACCION', 'SRV-TERCEROS-MOLARES'],
  },
  {
    code: 'ESPECIALIZADA',
    label: 'Especializada',
    icon: 'child_care',
    serviceCodes: ['SRV-PERIODONCIA', 'SRV-ODONTOPEDIATRIA'],
  },
];

@Component({
  selector: 'sd-reservar-cita',
  imports: [ReactiveFormsModule, DecimalPipe, FieldErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
      <div class="mb-10">
        <p class="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Reserva en línea</p>
        <h1 class="text-3xl font-bold tracking-tight text-navy md:text-4xl">
          {{
            rebookCita()
              ? 'Reprogramar Consulta'
              : isContinuation()
                ? 'Continuación de Tratamiento'
                : 'Programar Consulta'
          }}
        </h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          {{
            isContinuation()
              ? 'Agenda tu siguiente sesión programada sin costo adicional (incluida en tu tratamiento).'
              : 'Completa los detalles para asegurar tu cita. Selecciona el servicio, profesional y horario que prefieras.'
          }}
        </p>
      </div>

      <form
        id="booking-form"
        [formGroup]="form"
        (ngSubmit)="confirmarReserva()"
        class="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_330px]"
        novalidate
      >
        <div class="space-y-6">
          @if (isContinuation()) {
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-gold bg-yellow-50/90 p-4 shadow-xs">
              <div class="flex items-center gap-3">
                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold text-white shadow-xs">
                  <span class="material-symbols-outlined text-xl">event_repeat</span>
                </span>
                <div>
                  <div class="flex items-center gap-2">
                    <strong class="text-xs font-bold text-navy">
                      Sesión {{ nextSessionNum() }} de {{ totalSessionsNum() }}
                    </strong>
                    <span class="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-800">
                      Incluida S/ 0.00
                    </span>
                  </div>
                  <p class="mt-0.5 text-xs text-slate-600">
                    Tratamiento en curso. El especialista y servicio están asignados; selecciona fecha y horario.
                  </p>
                </div>
              </div>
            </div>
          }
          <section
            class="rounded-xl border border-slate-200 border-t-2 border-t-gold bg-white p-6 shadow-sm"
            aria-labelledby="professional-title"
          >
            <h2 id="professional-title" class="mb-6 flex items-center gap-2 text-sm font-bold text-navy">
              <span class="material-symbols-outlined text-lg text-gold">medical_services</span>
              Especialidad y Profesional
            </h2>
            <fieldset>
              <legend class="text-xs font-semibold text-slate-700">Selecciona una categoría</legend>
              <div id="category-options" class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                @for (cat of categories; track cat.code) {
                  <button
                    type="button"
                    [disabled]="rebookCita() !== null || isContinuation()"
                    (click)="selectCategory(cat.code)"
                    [attr.aria-pressed]="selectedCategory() === cat.code"
                    class="category-option flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border p-3 text-center text-[10px] font-semibold transition hover:border-gold hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-60"
                    [class]="
                      selectedCategory() === cat.code
                        ? 'border-navy bg-navy text-white'
                        : 'border-slate-200 bg-white text-slate-700'
                    "
                  >
                    <span
                      class="material-symbols-outlined text-xl"
                      [class]="selectedCategory() === cat.code ? 'text-gold-soft' : 'text-gold'"
                    >
                      {{ cat.icon }}
                    </span>
                    {{ cat.label }}
                  </button>
                }
              </div>
            </fieldset>

            <label class="mt-6 block text-xs font-semibold text-slate-700">
              Tratamiento específico
              <select
                id="service"
                formControlName="servicioId"
                [disabled]="categoryServices().length === 0 || rebookCita() !== null || isContinuation()"
                (change)="onServicioChanged()"
                class="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-gold focus:ring-2 focus:ring-gold-soft/40 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option [ngValue]="0">
                  {{ selectedCategory() ? 'Selecciona un tratamiento' : 'Primero selecciona una categoría' }}
                </option>
                @for (srv of categoryServices(); track srv.id) {
                  <option [ngValue]="srv.id">
                    {{ srv.nombre }} — S/ {{ srv.precio | number: '1.2-2' }}{{ srv.sesionesIncluidas > 1 ? ' · ' + srv.sesionesIncluidas + ' sesiones' : '' }}
                  </option>
                }
              </select>
              <sd-field-error [control]="form.controls.servicioId" />
            </label>

            <fieldset class="mt-6">
              <legend class="text-xs font-semibold text-slate-700">Selecciona un especialista</legend>
              <div id="dentist-options" class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                @if (loadingDentists()) {
                  <p class="col-span-full p-5 text-center text-xs text-slate-500">Cargando especialistas...</p>
                } @else if (selectedServicioId() <= 0) {
                  <p class="col-span-full rounded-lg border border-dashed border-slate-300 p-5 text-center text-xs text-slate-400">
                    Selecciona un tratamiento para ver profesionales disponibles.
                  </p>
                } @else if (odontologos().length === 0) {
                  <p class="col-span-full rounded-lg border border-dashed border-slate-300 p-5 text-center text-xs text-slate-400">
                    No hay especialistas disponibles para este servicio.
                  </p>
                } @else {
                  @for (dentist of odontologos(); track dentist.id) {
                    <button
                      type="button"
                      [disabled]="rebookCita() !== null || isContinuation()"
                      (click)="selectDentist(dentist.id)"
                      [attr.aria-pressed]="selectedDentistId() === dentist.id"
                      class="dentist-option flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-gold hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-75"
                      [class.border-gold]="selectedDentistId() === dentist.id"
                      [class.ring-2]="selectedDentistId() === dentist.id"
                      [class.ring-gold-soft]="selectedDentistId() === dentist.id"
                    >
                      <img
                        class="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                        [src]="resolveAsset(dentist.fotoUrl)"
                        [alt]="'Retrato de ' + dentist.nombreCompleto"
                      />
                      <span>
                        <strong class="block text-xs text-navy">{{ dentist.nombreCompleto }}</strong>
                        <small class="mt-1 block text-[9px] text-slate-500">{{ dentist.especialidad }}</small>
                      </span>
                    </button>
                  }
                }
              </div>
              <sd-field-error [control]="form.controls.odontologoId" />
            </fieldset>
          </section>

          <section
            class="rounded-xl border border-slate-200 border-t-2 border-t-gold bg-white p-6 shadow-sm"
            aria-labelledby="datetime-title"
          >
            <h2 id="datetime-title" class="mb-6 flex items-center gap-2 text-sm font-bold text-navy">
              <span class="material-symbols-outlined text-lg text-gold">calendar_month</span>
              Fecha y Hora
            </h2>
            <div class="grid gap-7 md:grid-cols-[1fr_1.25fr]">
              <div>
                <p class="text-xs font-semibold text-slate-700">Fecha de la consulta</p>
                <div class="mt-2 rounded-lg border border-slate-200 bg-white p-4" aria-label="Calendario de citas">
                  <div class="mb-4 flex items-center justify-between">
                    <button
                      id="previous-month"
                      type="button"
                      [disabled]="isPreviousMonthDisabled()"
                      (click)="previousMonth()"
                      class="grid h-8 w-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-navy disabled:cursor-not-allowed disabled:opacity-25"
                      aria-label="Mes anterior"
                    >
                      <span class="material-symbols-outlined text-lg">chevron_left</span>
                    </button>
                    <p id="calendar-month" class="text-xs font-bold capitalize text-navy" aria-live="polite">
                      {{ calendarMonthLabel() }}
                    </p>
                    <button
                      id="next-month"
                      type="button"
                      (click)="nextMonth()"
                      class="grid h-8 w-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-navy"
                      aria-label="Mes siguiente"
                    >
                      <span class="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                  </div>
                  <div class="mb-2 grid grid-cols-7 text-center text-[9px] font-bold uppercase text-slate-400" aria-hidden="true">
                    <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
                  </div>
                  <div id="calendar-days" class="grid grid-cols-7 place-items-center gap-y-1">
                    @for (cell of calendarDays(); track $index) {
                      @if (cell.day === null) {
                        <span></span>
                      } @else {
                        <button
                          type="button"
                          [disabled]="cell.unavailable"
                          [attr.aria-label]="cell.ariaLabel"
                          [attr.aria-pressed]="cell.selected"
                          (click)="selectCalendarDate(cell.dateValue)"
                          [class]="
                            cell.selected
                              ? 'grid h-8 w-8 place-items-center rounded-full bg-navy text-[10px] font-bold text-white shadow-sm'
                              : cell.unavailable
                                ? 'grid h-8 w-8 cursor-not-allowed place-items-center rounded-full text-[10px] text-slate-300'
                                : 'grid h-8 w-8 place-items-center rounded-full text-[10px] font-medium text-slate-700 transition hover:bg-yellow-50 hover:text-gold'
                          "
                        >
                          {{ cell.day }}
                        </button>
                      }
                    }
                  </div>
                </div>
                <span class="mt-2 block text-[10px] font-normal text-slate-500">
                  Las fechas anteriores no están disponibles.
                </span>
                <sd-field-error [control]="form.controls.fecha" />
              </div>

              <fieldset>
                <legend class="text-xs font-semibold text-slate-700">Horarios disponibles</legend>
                <div id="time-options" class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  @if (loadingSlots()) {
                    <p class="col-span-full rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400">
                      Consultando horarios...
                    </p>
                  } @else if (slotsMessage()) {
                    <p
                      class="col-span-full rounded-lg border border-dashed p-4 text-center text-xs"
                      [class]="slotsError() ? 'border-red-200 text-red-600' : 'border-slate-300 text-slate-400'"
                    >
                      {{ slotsMessage() }}
                    </p>
                  } @else {
                    @for (slot of horarios(); track slot) {
                      <button
                        type="button"
                        (click)="seleccionarHora(slot)"
                        class="time-option rounded-md border px-3 py-3 text-xs font-semibold transition hover:border-gold hover:bg-yellow-50"
                        [class]="
                          selectedTime() === slot
                            ? 'border-navy bg-navy text-white'
                            : 'border-slate-300 text-ink'
                        "
                      >
                        {{ formatTime12h(slot) }}
                      </button>
                    }
                  }
                </div>
                <sd-field-error [control]="form.controls.horaInicio" />
              </fieldset>
            </div>
          </section>

          <section
            class="rounded-xl border border-slate-200 border-t-2 border-t-gold bg-white p-6 shadow-sm"
            aria-labelledby="patient-data-title"
          >
            <h2 id="patient-data-title" class="mb-6 flex items-center gap-2 text-sm font-bold text-navy">
              <span class="material-symbols-outlined text-lg text-gold">person</span>
              Tus Datos
            </h2>
            <div class="grid gap-5 md:grid-cols-2">
              <label class="text-xs font-semibold text-slate-700">
                Nombre completo
                <input
                  id="patient-name"
                  class="mt-2 h-11 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm font-normal text-slate-600"
                  type="text"
                  [value]="authStore.userName()"
                  readonly
                />
              </label>
              <label class="text-xs font-semibold text-slate-700">
                Teléfono de contacto
                <input
                  id="phone"
                  formControlName="telefono"
                  class="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-normal outline-none focus:border-gold focus:ring-2 focus:ring-gold-soft/40"
                  type="tel"
                  inputmode="tel"
                  autocomplete="tel"
                  placeholder="Ej. +51 987 654 321"
                  maxlength="22"
                />
                <sd-field-error [control]="form.controls.telefono" />
              </label>
              <label class="text-xs font-semibold text-slate-700 md:col-span-2">
                Notas adicionales <span class="font-normal text-slate-400">(opcional)</span>
                <textarea
                  id="notes"
                  formControlName="motivo"
                  class="mt-2 min-h-24 w-full resize-y rounded-md border border-slate-300 p-3 text-sm font-normal outline-none focus:border-gold focus:ring-2 focus:ring-gold-soft/40"
                  maxlength="300"
                  placeholder="Motivo de la consulta o necesidades especiales..."
                ></textarea>
              </label>
            </div>
          </section>
        </div>

        <aside class="rounded-xl border border-slate-200 bg-white p-6 shadow-lg lg:sticky lg:top-24" aria-labelledby="summary-title">
          <h2 id="summary-title" class="border-b border-slate-200 pb-4 text-base font-bold text-navy">
            Resumen de Reserva
          </h2>
          <dl class="divide-y divide-slate-100 text-sm">
            <div class="flex gap-3 py-4">
              <span class="material-symbols-outlined text-xl text-slate-400">medical_services</span>
              <div>
                <dt class="text-[10px] font-bold uppercase text-slate-400">Servicio</dt>
                <dd id="summary-service" class="mt-1 font-semibold text-navy">
                  {{ servicioSeleccionado()?.nombre ?? 'Sin seleccionar' }}
                </dd>
              </div>
            </div>
            <div class="flex gap-3 py-4">
              <span class="material-symbols-outlined text-xl text-slate-400">person</span>
              <div>
                <dt class="text-[10px] font-bold uppercase text-slate-400">Especialista</dt>
                <dd id="summary-dentist" class="mt-1 font-semibold text-navy">
                  {{ odontologoSeleccionado()?.nombreCompleto ?? 'Sin seleccionar' }}
                </dd>
              </div>
            </div>
            <div class="flex gap-3 py-4">
              <span class="material-symbols-outlined text-xl text-slate-400">calendar_month</span>
              <div>
                <dt class="text-[10px] font-bold uppercase text-slate-400">Fecha</dt>
                <dd id="summary-date" class="mt-1 font-semibold text-navy">
                  {{ summaryDateLabel() }}
                </dd>
              </div>
            </div>
            <div class="flex gap-3 py-4">
              <span class="material-symbols-outlined text-xl text-slate-400">schedule</span>
              <div>
                <dt class="text-[10px] font-bold uppercase text-slate-400">Hora</dt>
                <dd id="summary-time" class="mt-1 font-semibold text-navy">
                  {{ selectedTime() ? formatTime12h(selectedTime()) : 'Sin seleccionar' }}
                </dd>
              </div>
            </div>
            <div class="flex gap-3 py-4">
              <span class="material-symbols-outlined text-xl text-slate-400">payments</span>
              <div>
                <dt class="text-[10px] font-bold uppercase text-slate-400">Tratamiento</dt>
                <dd id="summary-treatment" class="mt-1 font-semibold text-navy">
                  {{ treatmentPreviewLabel() }}
                </dd>
              </div>
            </div>
            <div class="flex gap-3 py-4">
              <span class="material-symbols-outlined text-xl text-slate-400">location_on</span>
              <div>
                <dt class="text-[10px] font-bold uppercase text-slate-400">Ubicación</dt>
                <dd class="mt-1 font-semibold text-navy">Clínica Central SmartDent</dd>
              </div>
            </div>
          </dl>
          <p class="my-5 text-[10px] leading-4 text-slate-500">
            Al confirmar, aceptas nuestros términos de servicio y la política de cancelación con 24 horas de anticipación.
          </p>
          @if (errorBanner(); as err) {
            <p id="booking-error" class="mb-4 rounded-md bg-red-50 p-3 text-xs text-red-700" role="alert">
              {{ err }}
            </p>
          }
          <button
            class="flex w-full items-center justify-center gap-2 rounded-md bg-gold px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-yellow-700 disabled:opacity-60"
            type="submit"
            [disabled]="submitting()"
          >
            {{
              submitting()
                ? rebookCita()
                  ? 'Reprogramando...'
                  : isContinuation()
                    ? 'Agendando sesión...'
                    : 'Reservando...'
                : rebookCita()
                  ? 'Confirmar reprogramación'
                  : isContinuation()
                    ? 'Confirmar Sesión ' + nextSessionNum() + ' (S/ 0.00)'
                    : 'Confirmar Reserva'
            }}
            <span class="material-symbols-outlined text-base">check_circle</span>
          </button>
        </aside>
      </form>
    </main>
  `,
})
export class ReservarCitaComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(SmartDentApiService);
  protected readonly authStore = inject(AuthStore);
  private readonly notificationStore = inject(NotificationStore);
  private readonly toastStore = inject(ToastStore);
  private readonly router = inject(Router);

  readonly servicioId = input<string | undefined>();
  readonly reprogramarId = input<string | undefined>();
  readonly continuarTratamiento = input<string | undefined>();
  readonly odontologoIdParam = input<string | undefined>(undefined, { alias: 'odontologoId' });
  readonly siguienteSesion = input<string | undefined>();
  readonly totalSesiones = input<string | undefined>();
  readonly fechaSugerida = input<string | undefined>();

  protected readonly isContinuation = computed<boolean>(() => Boolean(this.continuarTratamiento()));
  protected readonly nextSessionNum = computed<number>(() => Number(this.siguienteSesion() || 2));
  protected readonly totalSessionsNum = computed<number>(() => Number(this.totalSesiones() || 2));

  protected readonly categories = CATEGORIES;
  protected readonly resolveAsset = resolveOdontologoImg;

  protected readonly servicios = signal<readonly ServicioResponse[]>([]);
  protected readonly patientAppointments = signal<readonly CitaResponse[]>([]);
  protected readonly odontologos = signal<readonly OdontologoResponse[]>([]);
  protected readonly horarios = signal<readonly string[]>([]);

  protected readonly selectedCategory = signal<string>('');
  protected readonly selectedServicioId = signal<number>(0);
  protected readonly selectedDentistId = signal<number>(0);
  protected readonly selectedDate = signal<string>('');
  protected readonly selectedTime = signal<string>('');
  protected readonly rebookCita = signal<CitaResponse | null>(null);

  protected readonly loadingDentists = signal<boolean>(false);
  protected readonly loadingSlots = signal<boolean>(false);
  protected readonly slotsMessage = signal<string | null>('Selecciona servicio, especialista y fecha.');
  protected readonly slotsError = signal<boolean>(false);
  protected readonly submitting = signal<boolean>(false);
  protected readonly errorBanner = signal<string | null>(null);

  private readonly minDate = this.computeTomorrow();
  protected readonly visibleMonth = signal<Date>(
    new Date(this.minDate.getFullYear(), this.minDate.getMonth(), 1)
  );

  protected readonly form = this.fb.group({
    servicioId: [0, [Validators.required, Validators.min(1)]],
    odontologoId: [0, [Validators.required, Validators.min(1)]],
    fecha: ['', [Validators.required, SmartDentValidators.fechaLaborable(false)]],
    horaInicio: ['', [Validators.required]],
    telefono: [
      this.authStore.session()?.telefono ?? '',
      [SmartDentValidators.telefono(true)],
    ],
    motivo: ['', [Validators.maxLength(300)]],
  });

  protected readonly categoryServices = computed<readonly ServicioResponse[]>(() => {
    const catCode = this.selectedCategory();
    if (!catCode) return [];
    const cat = CATEGORIES.find((c) => c.code === catCode);
    if (!cat) return [];
    return this.servicios().filter((srv) => cat.serviceCodes.includes(srv.codigo));
  });

  protected readonly servicioSeleccionado = computed<ServicioResponse | undefined>(() => {
    const id = this.selectedServicioId();
    return this.servicios().find((item) => item.id === id);
  });

  protected readonly odontologoSeleccionado = computed<OdontologoResponse | undefined>(() => {
    const id = this.selectedDentistId();
    return this.odontologos().find((item) => item.id === id);
  });

  protected readonly calendarMonthLabel = computed<string>(() =>
    new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(
      this.visibleMonth()
    )
  );

  protected readonly isPreviousMonthDisabled = computed<boolean>(() => {
    const minMonth = new Date(this.minDate.getFullYear(), this.minDate.getMonth(), 1);
    return this.visibleMonth() <= minMonth;
  });

  protected readonly calendarDays = computed<readonly CalendarDayCell[]>(() => {
    const currentMonth = this.visibleMonth();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const leadingSpaces = (firstDay.getDay() + 6) % 7;
    const cells: CalendarDayCell[] = [];
    const activeDate = this.selectedDate();

    for (let i = 0; i < leadingSpaces; i += 1) {
      cells.push({
        day: null,
        dateValue: '',
        unavailable: true,
        selected: false,
        ariaLabel: '',
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateValue = this.formatLocalDate(dateObj);
      const unavailable = dateObj < this.minDate || dateObj.getDay() === 0;
      cells.push({
        day,
        dateValue,
        unavailable,
        selected: activeDate === dateValue,
        ariaLabel: new Intl.DateTimeFormat('es-PE', { dateStyle: 'long' }).format(dateObj),
      });
    }
    return cells;
  });

  protected readonly summaryDateLabel = computed<string>(() => {
    const d = this.selectedDate();
    if (!d) return 'Sin seleccionar';
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'long' }).format(
      new Date(`${d}T12:00:00`)
    );
  });

  protected readonly treatmentPreviewLabel = computed<string>(() => {
    const srv = this.servicioSeleccionado();
    if (!srv) return 'Sin seleccionar';
    const total = Number(srv.sesionesIncluidas || 1);
    if (total <= 1) {
      return `Pago por atención: S/ ${Number(srv.precio).toFixed(2)}`;
    }
    const previous = [...this.patientAppointments()]
      .filter((item) => item.servicioId === srv.id && item.estado !== 'CANCELADA')
      .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())[0];
    const previousNumber = Number(previous?.numeroSesion ?? 1);
    const previousTotal = Number(previous?.tratamientoCodigo ? previous.totalSesiones : total);
    if (previous && previousNumber < previousTotal) {
      return `Sesión ${previousNumber + 1} de ${previousTotal} · incluida, S/ 0.00`;
    }
    return `Sesión 1 de ${total} · pago único S/ ${Number(srv.precio).toFixed(2)}`;
  });

  ngOnInit(): void {
    forkJoin({
      servicios: this.api.listarServiciosPublicos(),
      citas: this.api.listarMisCitas(),
    }).subscribe({
      next: ({ servicios, citas }) => {
        this.servicios.set(servicios);
        this.patientAppointments.set(citas);

        const rebookParamId =
          this.reprogramarId() ??
          (typeof sessionStorage !== 'undefined'
            ? sessionStorage.getItem('smartdent_rebook_id')
            : null);

        if (rebookParamId) {
          const foundRebook = citas.find(
            (c) =>
              (String(c.id) === String(rebookParamId) || c.codigo === String(rebookParamId)) &&
              (c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA')
          );
          if (foundRebook) {
            this.rebookCita.set(foundRebook);
            this.inicializarServicioSeleccionado(foundRebook.servicioId, foundRebook);
            return;
          }
        }

        const initialSrvId = Number(this.servicioId() ?? 0);
        if (initialSrvId > 0) {
          this.inicializarServicioSeleccionado(initialSrvId, null);
        }
      },
      error: (err: unknown) => {
        this.errorBanner.set(extractApiErrorMessage(err));
      },
    });
  }

  private inicializarServicioSeleccionado(
    srvId: number,
    rebookTarget: CitaResponse | null
  ): void {
    const srv = this.servicios().find((item) => item.id === srvId);
    if (!srv) return;
    const cat = CATEGORIES.find((c) => c.serviceCodes.includes(srv.codigo));
    if (cat) {
      this.selectedCategory.set(cat.code);
    }
    this.selectedServicioId.set(srv.id);
    this.form.controls.servicioId.setValue(srv.id);

    this.loadingDentists.set(true);
    this.api.listarOdontologosPublicos(srv.id).subscribe({
      next: (docs) => {
        this.loadingDentists.set(false);
        this.odontologos.set(docs);
        if (rebookTarget) {
          this.selectDentist(rebookTarget.odontologoId);
          const originalDate = new Date(`${rebookTarget.fecha}T12:00:00`);
          if (originalDate >= this.minDate) {
            this.visibleMonth.set(
              new Date(originalDate.getFullYear(), originalDate.getMonth(), 1)
            );
            this.selectCalendarDate(rebookTarget.fecha);
          }
          this.form.controls.telefono.setValue(
            rebookTarget.telefonoContacto || (this.authStore.session()?.telefono ?? '')
          );
          this.form.controls.motivo.setValue(rebookTarget.motivo ?? '');
        } else if (this.isContinuation()) {
          const docId = Number(this.odontologoIdParam() ?? 0);
          if (docId > 0 && docs.some((d) => d.id === docId)) {
            this.selectDentist(docId);
          } else if (docs.length > 0) {
            this.selectDentist(docs[0].id);
          }
          const suggested = this.fechaSugerida();
          if (suggested) {
            const dateObj = new Date(`${suggested}T12:00:00`);
            if (dateObj >= this.minDate) {
              this.visibleMonth.set(new Date(dateObj.getFullYear(), dateObj.getMonth(), 1));
              this.selectCalendarDate(suggested);
            }
          }
          const previousCitaPhone = this.patientAppointments().find(
            (c) => Boolean(c.telefonoContacto?.trim())
          )?.telefonoContacto?.trim();
          const userPhone =
            previousCitaPhone || (this.authStore.session()?.telefono ?? '');
          if (userPhone) {
            this.form.controls.telefono.setValue(userPhone);
          }
          this.form.controls.motivo.setValue(
            `Continuación de tratamiento - Sesión ${this.nextSessionNum()} de ${this.totalSessionsNum()}`
          );
        }
      },
      error: () => {
        this.loadingDentists.set(false);
      },
    });
  }

  protected selectCategory(code: string): void {
    if (this.rebookCita() || this.isContinuation()) return;
    this.selectedCategory.set(code);
    this.selectedServicioId.set(0);
    this.form.controls.servicioId.setValue(0);
    this.resetDentistAndSlots();
  }

  protected onServicioChanged(): void {
    if (this.rebookCita() || this.isContinuation()) return;
    const srvId = Number(this.form.controls.servicioId.value);
    this.selectedServicioId.set(srvId);
    this.resetDentistAndSlots();
    if (srvId <= 0) return;

    this.loadingDentists.set(true);
    this.api.listarOdontologosPublicos(srvId).subscribe({
      next: (docs) => {
        this.loadingDentists.set(false);
        this.odontologos.set(docs);
      },
      error: (err: unknown) => {
        this.loadingDentists.set(false);
        this.errorBanner.set(extractApiErrorMessage(err));
      },
    });
  }

  protected selectDentist(dentistId: number): void {
    this.selectedDentistId.set(dentistId);
    this.form.controls.odontologoId.setValue(dentistId);
    this.selectedTime.set('');
    this.form.controls.horaInicio.setValue('');
    this.errorBanner.set(null);
    this.consultarHorarios();
  }

  protected previousMonth(): void {
    if (this.isPreviousMonthDisabled()) return;
    const cur = this.visibleMonth();
    this.visibleMonth.set(new Date(cur.getFullYear(), cur.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    const cur = this.visibleMonth();
    this.visibleMonth.set(new Date(cur.getFullYear(), cur.getMonth() + 1, 1));
  }

  protected selectCalendarDate(dateValue: string): void {
    this.selectedDate.set(dateValue);
    this.form.controls.fecha.setValue(dateValue);
    this.selectedTime.set('');
    this.form.controls.horaInicio.setValue('');
    this.errorBanner.set(null);
    this.consultarHorarios();
  }

  protected consultarHorarios(): void {
    const srvId = this.selectedServicioId();
    const docId = this.selectedDentistId();
    const fecha = this.selectedDate();

    if (srvId <= 0 || docId <= 0 || !fecha) {
      this.horarios.set([]);
      this.slotsError.set(false);
      this.slotsMessage.set('Selecciona servicio, especialista y fecha.');
      return;
    }

    this.loadingSlots.set(true);
    this.slotsMessage.set(null);
    this.api.consultarDisponibilidad(docId, srvId, fecha).subscribe({
      next: (res) => {
        this.loadingSlots.set(false);
        const list = res.horariosDisponibles.map((t) => String(t).slice(0, 5));
        this.horarios.set(list);
        if (list.length === 0) {
          this.slotsError.set(false);
          this.slotsMessage.set('No quedan horarios disponibles para esta fecha.');
        }
      },
      error: (err: unknown) => {
        this.loadingSlots.set(false);
        this.horarios.set([]);
        this.slotsError.set(true);
        this.slotsMessage.set(extractApiErrorMessage(err));
      },
    });
  }

  protected seleccionarHora(slot: string): void {
    this.selectedTime.set(slot);
    this.form.controls.horaInicio.setValue(slot);
    this.errorBanner.set(null);
  }

  protected confirmarReserva(): void {
    this.errorBanner.set(null);
    const missing: string[] = [];
    if (this.selectedServicioId() <= 0) missing.push('servicio');
    if (this.selectedDentistId() <= 0) missing.push('especialista');
    if (!this.selectedDate()) missing.push('fecha');
    if (!this.selectedTime()) missing.push('hora disponible');
    const phoneDigits = this.form.controls.telefono.value.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) missing.push('teléfono válido');

    if (missing.length > 0) {
      const listStr =
        missing.length === 1
          ? missing[0]
          : `${missing.slice(0, -1).join(', ')} y ${missing[missing.length - 1]}`;
      this.errorBanner.set(`Revisa: ${listStr}.`);
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const rebook = this.rebookCita();

    if (rebook) {
      this.api
        .reprogramarCita(rebook.id, {
          fecha: this.selectedDate(),
          horaInicio: this.selectedTime(),
        })
        .subscribe({
          next: (res) => {
            this.submitting.set(false);
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.removeItem('smartdent_rebook_id');
              sessionStorage.setItem('smartdent_booking_result', 'reprogramada');
              sessionStorage.setItem('smartdent_booking_id', String(res.codigo || res.id));
            }
            this.toastStore.success('¡Cita reprogramada con éxito!');
            this.notificationStore.refresh(false);
            void this.router.navigate(['/paciente'], { queryParams: { reserva: 'exitosa' } });
          },
          error: (err: unknown) => {
            this.submitting.set(false);
            this.errorBanner.set(applyServerValidationErrors(this.form, err));
            this.consultarHorarios();
          },
        });
      return;
    }

    const raw = this.form.getRawValue();
    this.api
      .reservarCita({
        servicioId: this.selectedServicioId(),
        odontologoId: this.selectedDentistId(),
        fecha: this.selectedDate(),
        horaInicio: this.selectedTime(),
        telefono: raw.telefono.trim(),
        motivo: raw.motivo.trim(),
      })
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('smartdent_rebook_id');
            sessionStorage.setItem(
              'smartdent_booking_result',
              this.isContinuation() ? 'continuacion' : 'registrada'
            );
            sessionStorage.setItem('smartdent_booking_id', String(res.codigo || res.id));
          }
          this.toastStore.success(
            this.isContinuation()
              ? `¡Sesión ${res.numeroSesion} de ${res.totalSesiones} agendada con éxito!`
              : `Reserva ${res.codigo} registrada con éxito.`
          );
          this.notificationStore.refresh(false);
          void this.router.navigate(['/paciente'], { queryParams: { reserva: 'exitosa' } });
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          this.errorBanner.set(applyServerValidationErrors(this.form, err));
          this.consultarHorarios();
        },
      });
  }

  protected formatTime12h(value: string): string {
    const [hourStr, minStr] = value.slice(0, 5).split(':');
    const hour = Number(hourStr || 0);
    const minute = Number(minStr || 0);
    return new Intl.DateTimeFormat('es-PE', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(2000, 0, 1, hour, minute));
  }

  private resetDentistAndSlots(): void {
    this.odontologos.set([]);
    this.selectedDentistId.set(0);
    this.form.controls.odontologoId.setValue(0);
    this.selectedTime.set('');
    this.form.controls.horaInicio.setValue('');
    this.horarios.set([]);
    this.slotsError.set(false);
    this.slotsMessage.set('Selecciona servicio, especialista y fecha.');
  }

  private computeTomorrow(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    return d;
  }

  private formatLocalDate(value: Date): string {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(
      value.getDate()
    ).padStart(2, '0')}`;
  }
}
