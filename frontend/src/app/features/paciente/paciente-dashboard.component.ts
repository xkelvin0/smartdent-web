import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, map } from 'rxjs';
import { AuthStore } from '../../core/auth/auth.store';
import {
  CitaResponse,
  ConfiguracionPacienteResponse,
  EtapaTratamiento,
  HistoriaClinicaResponse,
} from '../../core/models/smartdent.models';
import { NotificationStore } from '../../core/notifications/notification.store';
import { ToastStore } from '../../core/notifications/toast.store';
import { SmartDentApiService } from '../../core/services/smartdent-api.service';
import { FieldErrorComponent } from '../../shared/ui/field-error.component';
import {
  SmartDentValidators,
  applyServerValidationErrors,
  extractApiErrorMessage,
} from '../../shared/validators/smartdent.validators';

interface TreatmentGroup {
  readonly treatmentName: string;
  readonly odontologoNombre: string;
  readonly isCompleted: boolean;
  readonly lastUpdate: string | null;
  readonly records: readonly HistoriaClinicaResponse[];
  readonly totalSessions?: number;
}

interface PatientReminder {
  readonly id?: number;
  readonly icon: string;
  readonly title: string;
  readonly detail: string;
  readonly tone: string;
  readonly status: 'PENDING' | 'DONE';
  readonly isNotification?: boolean;
}

interface PatientActivityItem {
  readonly date: string;
  readonly icon: string;
  readonly title: string;
  readonly detail: string;
}

interface TreatmentStepInfo {
  readonly code: EtapaTratamiento;
  readonly icon: string;
  readonly title: string;
  readonly subtitle: string;
  readonly completed: boolean;
  readonly current: boolean;
}

@Component({
  selector: 'sd-paciente-dashboard',
  imports: [RouterLink, ReactiveFormsModule, DecimalPipe, FieldErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
      <div>
        <p class="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-gold">Panel del paciente</p>
        <h1 id="welcome-title" class="text-3xl font-bold tracking-tight text-navy md:text-4xl">
          Bienvenido, {{ primerNombre() }}
        </h1>
        <p class="mt-2 text-sm text-slate-500">
          Tu salud dental está al día. Revisa tus citas y tratamientos.
        </p>
      </div>
      <a
        class="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
        routerLink="/reservar"
      >
        <span class="material-symbols-outlined text-base">calendar_add_on</span>
        Agendar Cita
      </a>
    </header>

    @if (activeVista() === 'overview') {
      <section id="overview" data-dashboard-view>
        <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article class="rounded-xl border border-slate-200 border-t-2 border-t-gold bg-white p-5 shadow-sm">
            <p class="text-xs text-slate-500">Próximas citas</p>
            <strong id="patient-upcoming-count" class="mt-2 block text-3xl text-navy">
              {{ upcomingCitas().length }}
            </strong>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs text-slate-500">Pendientes</p>
            <strong id="patient-pending-stat" class="mt-2 block text-3xl text-amber-600">
              {{ pendingOnlyCount() }}
            </strong>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs text-slate-500">Atenciones completadas</p>
            <strong id="patient-attended-stat" class="mt-2 block text-3xl text-green-700">
              {{ attendedCount() }}
            </strong>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs text-slate-500">Citas canceladas</p>
            <strong id="patient-cancelled-stat" class="mt-2 block text-3xl text-red-600">
              {{ cancelledCount() }}
            </strong>
          </article>
        </div>

        <div class="grid gap-6 xl:grid-cols-[320px_1fr]">
          <article class="rounded-xl border border-slate-200 border-t-2 border-t-gold bg-white p-6 shadow-sm">
            <div class="flex items-center gap-4">
              <div
                id="patient-avatar"
                class="grid h-16 w-16 place-items-center rounded-full bg-navy text-lg font-bold text-white"
              >
                {{ userInitials() }}
              </div>
              <div>
                <h2 id="patient-name" class="font-bold text-navy">{{ authStore.userName() }}</h2>
                <p class="mt-1 text-xs text-slate-500">Paciente SmartDent</p>
              </div>
            </div>
            <dl class="mt-6 divide-y divide-slate-100 text-xs">
              <div class="flex justify-between gap-4 py-3">
                <dt class="text-slate-500">Correo</dt>
                <dd id="patient-email" class="truncate font-medium text-navy">
                  {{ authStore.session()?.email }}
                </dd>
              </div>
              <div class="flex justify-between gap-4 py-3">
                <dt class="text-slate-500">Citas registradas</dt>
                <dd id="appointment-count" class="font-bold text-navy">{{ citas().length }}</dd>
              </div>
              <div class="flex justify-between gap-4 py-3">
                <dt class="text-slate-500">Estado de cuenta</dt>
                <dd class="font-bold text-gold">Activa</dd>
              </div>
            </dl>
          </article>

          <article class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="mb-5 flex items-center justify-between">
              <h2 class="flex items-center gap-2 text-base font-bold text-navy">
                <span class="material-symbols-outlined text-xl text-gold">event_upcoming</span>
                Próxima Cita
              </h2>
              <button
                class="text-xs font-semibold text-gold hover:underline"
                type="button"
                (click)="goToVista('appointments')"
              >
                Ver todas
              </button>
            </div>
            <div id="next-appointment">
              @if (nextAppointment(); as next) {
                <div class="flex flex-col gap-5 rounded-lg border border-slate-200 p-5 sm:flex-row sm:items-center">
                  <div class="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-slate-100 text-center">
                    <span class="block text-[9px] font-bold uppercase text-slate-400">
                      {{ monthShort(next.fecha) }}
                    </span>
                    <strong class="block text-xl text-navy">{{ dayNumber(next.fecha) }}</strong>
                  </div>
                  <div class="flex-1">
                    <h3 class="font-bold text-navy">{{ next.servicioNombre }}</h3>
                    <p class="mt-1 text-[10px] font-bold text-gold">{{ treatmentSessionLabel(next) }}</p>
                    <p class="mt-2 text-xs text-slate-500">
                      {{ formatDate(next.fecha) }} · {{ formatTime(next.horaInicio) }}
                    </p>
                    <p class="mt-1 text-xs text-slate-500">{{ next.odontologoNombre }}</p>
                  </div>
                  <span
                    class="self-start rounded-full px-3 py-1 text-[9px] font-bold"
                    [class]="statusClass(next.estado)"
                  >
                    {{ next.estado }}
                  </span>
                </div>
              } @else {
                <div class="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                  <span class="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
                  <p class="mt-2 text-sm font-semibold text-navy">No tienes citas próximas</p>
                  <a class="mt-4 inline-flex text-xs font-bold text-gold" routerLink="/reservar">
                    Agendar una cita →
                  </a>
                </div>
              }
            </div>
          </article>
        </div>

        <article class="mt-6 rounded-xl border border-slate-200 border-t-2 border-t-gold bg-white p-6 shadow-sm">
          <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 class="flex items-center gap-2 text-base font-bold text-navy">
                <span class="material-symbols-outlined text-xl text-gold">monitoring</span>
                Progreso de Tratamiento
              </h2>
              <p id="treatment-progress-description" class="mt-2 text-xs text-slate-500">
                {{ treatmentProgressDescription() }}
              </p>
            </div>
            <span
              id="treatment-progress-percent"
              class="rounded-full bg-gold-soft px-4 py-2 text-sm font-bold text-navy"
            >
              {{ treatmentProgressPercent() }}%
            </span>
          </div>

          @if (!hasStartedTreatment()) {
            <div
              id="treatment-progress-empty"
              class="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center"
            >
              <span class="material-symbols-outlined text-4xl text-slate-300">dentistry</span>
              <h3 class="mt-3 font-bold text-navy">Tu progreso aún no ha comenzado</h3>
              <p class="mt-2 text-xs text-slate-500">
                El odontólogo activará tu plan después de tu primera atención.
              </p>
            </div>
          } @else {
            <div id="treatment-progress-active" class="mt-7">
              <div class="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  id="treatment-progress-bar"
                  class="h-full rounded-full bg-gold transition-all duration-500"
                  [style.width.%]="treatmentProgressPercent()"
                ></div>
              </div>
              <ol class="mt-6 grid gap-3 sm:grid-cols-4">
                @for (step of treatmentSteps(); track step.code) {
                  <li
                    class="treatment-step rounded-lg border p-4"
                    [class.border-gold]="step.completed"
                    [class.bg-yellow-50]="step.completed"
                    [class.text-navy]="step.completed"
                    [class.border-slate-200]="!step.completed"
                    [class.ring-2]="step.current"
                    [class.ring-gold-soft]="step.current"
                  >
                    <span
                      class="material-symbols-outlined text-xl"
                      [class.text-gold]="step.completed"
                    >
                      {{ step.icon }}
                    </span>
                    <strong class="mt-2 block text-xs">{{ step.title }}</strong>
                    <small class="mt-1 block text-[9px] text-slate-500">{{ step.subtitle }}</small>
                  </li>
                }
              </ol>

              @if (pendingTreatmentContinuation(); as treatment) {
                <div class="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-gold bg-yellow-50/90 p-4 shadow-xs">
                  <div class="flex items-center gap-3">
                    <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold text-white font-bold shadow-xs">
                      <span class="material-symbols-outlined text-2xl">event_available</span>
                    </span>
                    <div>
                      <div class="flex items-center gap-2">
                        <strong class="text-xs font-bold text-navy">
                          Continuar Tratamiento: Sesión {{ treatment.numeroSesion + 1 }} de {{ treatment.totalSesiones }}
                        </strong>
                        <span class="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-800">
                          Incluida S/ 0.00
                        </span>
                      </div>
                      <p class="mt-0.5 text-xs text-slate-600">
                        {{ treatment.servicioNombre }} · {{ treatment.odontologoNombre }}
                        @if (nextControlDate(); as controlDate) {
                          <span class="ml-1 text-gold font-semibold">· Sugerido: {{ formatDate(controlDate) }}</span>
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    class="shrink-0 rounded-lg bg-navy px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
                    type="button"
                    (click)="agendarSiguienteSesion(treatment)"
                  >
                    Agendar sesión {{ treatment.numeroSesion + 1 }} de {{ treatment.totalSesiones }} →
                  </button>
                </div>
              }

              <div class="mt-5 flex flex-wrap gap-5 text-xs">
                <span>Citas atendidas: <strong id="attended-count">{{ attendedCount() }}</strong></span>
                <span>Citas pendientes: <strong id="pending-count">{{ activeCount() }}</strong></span>
              </div>
            </div>
          }
        </article>

        <div class="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <article class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 class="flex items-center gap-2 font-bold text-navy">
                  <span class="material-symbols-outlined text-xl text-gold">notifications_active</span>
                  Recordatorios
                </h2>
                <p class="mt-1 text-xs text-slate-500">
                  Información y seguimiento de tus atenciones.
                </p>
              </div>
              <div class="flex items-center gap-1.5 self-start sm:self-auto">
                <span
                  id="patient-reminder-count"
                  class="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 mr-1"
                >
                  {{ reminders().length }}
                </span>
                <button
                  type="button"
                  (click)="reminderFilter.set('PENDING')"
                  class="rounded-md px-2.5 py-1 text-[11px] font-semibold transition"
                  [class]="reminderFilter() === 'PENDING' ? 'bg-navy text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                >
                  Por hacer
                </button>
                <button
                  type="button"
                  (click)="reminderFilter.set('DONE')"
                  class="rounded-md px-2.5 py-1 text-[11px] font-semibold transition"
                  [class]="reminderFilter() === 'DONE' ? 'bg-navy text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                >
                  Completados
                </button>
                <button
                  type="button"
                  (click)="reminderFilter.set('ALL')"
                  class="rounded-md px-2.5 py-1 text-[11px] font-semibold transition"
                  [class]="reminderFilter() === 'ALL' ? 'bg-navy text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                >
                  Todos
                </button>
              </div>
            </div>
            <div id="patient-reminders" class="mt-5 space-y-3">
              @for (rem of reminders(); track $index) {
                <div class="flex items-start justify-between gap-3 rounded-lg p-3.5" [class]="rem.tone">
                  <div class="flex items-start gap-3 min-w-0">
                    <span class="material-symbols-outlined text-xl shrink-0 mt-0.5">{{ rem.icon }}</span>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <strong class="text-xs truncate">{{ rem.title }}</strong>
                        @if (rem.status === 'DONE') {
                          <span class="rounded-full bg-slate-200/80 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                            Realizado
                          </span>
                        }
                      </div>
                      <p class="mt-1 text-[10px] opacity-80 leading-relaxed">{{ rem.detail }}</p>
                    </div>
                  </div>
                  @if (rem.isNotification && rem.status === 'PENDING' && rem.id) {
                    <button
                      type="button"
                      (click)="completarRecordatorio(rem.id)"
                      class="shrink-0 rounded-md bg-white/80 px-2 py-1 text-[10px] font-bold text-slate-700 shadow-xs hover:bg-white transition"
                      title="Marcar como atendido"
                    >
                      Listo ✓
                    </button>
                  }
                </div>
              } @empty {
                <div class="rounded-lg border border-dashed border-slate-300 p-7 text-center text-xs text-slate-500">
                  {{ reminderFilter() === 'PENDING' ? 'No tienes recordatorios por hacer.' : 'No hay recordatorios en esta vista.' }}
                </div>
              }
            </div>
          </article>

          <article class="rounded-xl bg-navy p-6 text-white shadow-sm">
            <h2 class="font-bold">Accesos rápidos</h2>
            <div class="mt-5 grid gap-3">
              <a
                class="flex items-center justify-between rounded-lg bg-gold-soft px-4 py-3 text-xs font-bold text-navy hover:bg-yellow-300"
                routerLink="/reservar"
              >
                <span class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-lg">calendar_add_on</span>
                  Agendar nueva cita
                </span>
                <span>→</span>
              </a>
              <button
                class="flex items-center justify-between rounded-lg bg-white/10 px-4 py-3 text-left text-xs font-semibold hover:bg-white/20"
                type="button"
                (click)="goToVista('appointments')"
              >
                <span class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-lg text-gold-soft">event_note</span>
                  Gestionar mis citas
                </span>
                <span>→</span>
              </button>
              <button
                class="flex items-center justify-between rounded-lg bg-white/10 px-4 py-3 text-left text-xs font-semibold hover:bg-white/20"
                type="button"
                (click)="goToVista('history')"
              >
                <span class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-lg text-gold-soft">clinical_notes</span>
                  Ver historial clínico
                </span>
                <span>→</span>
              </button>
              <a
                class="flex items-center justify-between rounded-lg bg-white/10 px-4 py-3 text-xs font-semibold hover:bg-white/20"
                routerLink="/contacto"
              >
                <span class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-lg text-gold-soft">support_agent</span>
                  Contactar soporte
                </span>
                <span>→</span>
              </a>
            </div>
          </article>
        </div>

        <article class="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-bold text-navy">Actividad clínica reciente</h2>
              <p class="mt-1 text-xs text-slate-500">Tus últimos tratamientos y actualizaciones.</p>
            </div>
            <button
              class="text-xs font-bold text-gold hover:underline"
              type="button"
              (click)="goToVista('history')"
            >
              Ver historial
            </button>
          </div>
          <div id="patient-recent-activity" class="mt-5 grid gap-3 md:grid-cols-2">
            @for (act of recentActivities(); track $index) {
              <div class="flex gap-4 rounded-lg bg-slate-50 p-4">
                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy text-white">
                  <span class="material-symbols-outlined text-lg">{{ act.icon }}</span>
                </span>
                <div class="min-w-0">
                  <strong class="block truncate text-xs text-navy">{{ act.title }}</strong>
                  <p class="mt-1 line-clamp-2 text-[10px] text-slate-500">{{ act.detail }}</p>
                  <time class="mt-2 block text-[9px] font-semibold text-gold">
                    {{ formatActivityDate(act.date) }}
                  </time>
                </div>
              </div>
            } @empty {
              <p class="md:col-span-2 rounded-lg border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                Tu actividad clínica aparecerá después de completar una atención.
              </p>
            }
          </div>
        </article>
      </section>
    }

    @if (activeVista() === 'appointments') {
      <section
        id="appointments"
        data-dashboard-view
        class="rounded-xl border border-slate-200 border-t-2 border-t-gold bg-white p-6 shadow-sm"
      >
        <div class="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <h2 class="flex items-center gap-2 text-base font-bold text-navy">
              <span class="material-symbols-outlined text-xl text-gold">calendar_month</span>
              Mis Citas
            </h2>
            <p class="mt-1 text-xs text-slate-500">Consulta, reprograma o cancela tus reservas.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <input
              id="patient-appointment-search"
              class="h-10 rounded-lg border border-slate-300 px-3 text-xs"
              type="search"
              [value]="appointmentSearch()"
              (input)="onSearchInput($event)"
              placeholder="Buscar servicio o doctor"
            />
            <select
              id="patient-appointment-filter"
              class="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs"
              [value]="appointmentFilter()"
              (change)="onFilterChange($event)"
            >
              <option value="ALL">Todas</option>
              <option value="UPCOMING">Próximas</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="CONFIRMADA">Confirmadas</option>
              <option value="ATENDIDA">Atendidas</option>
              <option value="CANCELADA">Canceladas</option>
            </select>
            <a
              class="inline-flex h-10 items-center rounded-lg bg-navy px-4 text-xs font-bold text-white"
              routerLink="/reservar"
            >
              Nueva cita
            </a>
          </div>
        </div>
        <p id="patient-appointment-count" class="mb-4 text-[10px] font-semibold text-slate-500">
          Mostrando {{ filteredAppointments().length }} de {{ citas().length }}
          {{ citas().length === 1 ? 'cita' : 'citas' }}
        </p>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[720px] text-left text-xs">
            <thead class="border-b border-slate-200 text-[9px] uppercase tracking-wider text-slate-400">
              <tr>
                <th class="px-3 py-3">Fecha</th>
                <th class="px-3 py-3">Tratamiento</th>
                <th class="px-3 py-3">Especialista</th>
                <th class="px-3 py-3">Hora</th>
                <th class="px-3 py-3">Estado</th>
                <th class="px-3 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody id="appointments-table" class="divide-y divide-slate-100">
              @for (cita of filteredAppointments(); track cita.id) {
                <tr>
                  <td class="px-3 py-4 font-medium text-navy">{{ formatDate(cita.fecha) }}</td>
                  <td class="px-3 py-4">{{ cita.servicioNombre }}</td>
                  <td class="px-3 py-4 text-slate-600">{{ cita.odontologoNombre }}</td>
                  <td class="px-3 py-4">{{ formatTime(cita.horaInicio) }}</td>
                  <td class="px-3 py-4">
                    <span
                      class="rounded-full px-3 py-1 text-[9px] font-bold"
                      [class]="statusClass(cita.estado)"
                    >
                      {{ cita.estado }}
                    </span>
                  </td>
                  <td class="px-3 py-4 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-2.5">
                      <button
                        class="detail-button font-semibold text-gold hover:underline"
                        type="button"
                        (click)="openAppointmentModal(cita)"
                      >
                        Detalle
                      </button>
                      @if (cita.estado === 'PENDIENTE' || cita.estado === 'CONFIRMADA') {
                        <button
                          class="rebook-button font-semibold text-navy hover:text-gold"
                          type="button"
                          (click)="irAReprogramar(cita)"
                        >
                          Reprogramar
                        </button>
                        <button
                          class="cancel-button font-semibold text-red-600 hover:text-red-700"
                          type="button"
                          (click)="cancelarCita(cita)"
                        >
                          Cancelar
                        </button>
                      }
                      @if (puedeAgendarSiguienteSesion(cita)) {
                        <button
                          class="rounded-md bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700 hover:bg-green-100 transition"
                          type="button"
                          (click)="agendarSiguienteSesion(cita)"
                        >
                          Sesión {{ cita.numeroSesion + 1 }} →
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (filteredAppointments().length === 0) {
          <div id="appointments-empty" class="py-12 text-center">
            <span class="material-symbols-outlined text-5xl text-slate-300">calendar_month</span>
            <h3 class="mt-3 font-bold text-navy">No hay citas en esta vista</h3>
            <p class="mt-2 text-xs text-slate-500">
              Prueba con otro filtro o agenda una nueva consulta.
            </p>
            <a
              class="mt-5 inline-flex rounded-lg bg-gold px-5 py-3 text-xs font-bold text-white"
              routerLink="/reservar"
            >
              Agendar Cita
            </a>
          </div>
        }
      </section>
    }

    @if (activeVista() === 'history') {
      <section
        id="history"
        data-dashboard-view
        class="rounded-xl border border-slate-200 border-t-2 border-t-gold bg-white p-6 shadow-sm"
      >
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 class="flex items-center gap-2 font-bold text-navy">
              <span class="material-symbols-outlined text-xl text-gold">clinical_notes</span>
              Historial Clínico por Tratamiento
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              Expedientes organizados por plan dental, sesiones y altas clínicas.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <div class="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
              <button
                type="button"
                class="rounded-md px-3 py-1.5 font-bold transition"
                [class]="historyStatusFilter() === 'ALL' ? 'bg-navy text-white shadow-sm' : 'text-slate-600 hover:text-navy'"
                (click)="historyStatusFilter.set('ALL')"
              >
                Todos
              </button>
              <button
                type="button"
                class="rounded-md px-3 py-1.5 font-bold transition"
                [class]="historyStatusFilter() === 'ACTIVE' ? 'bg-navy text-white shadow-sm' : 'text-slate-600 hover:text-navy'"
                (click)="historyStatusFilter.set('ACTIVE')"
              >
                En curso
              </button>
              <button
                type="button"
                class="rounded-md px-3 py-1.5 font-bold transition"
                [class]="historyStatusFilter() === 'COMPLETED' ? 'bg-navy text-white shadow-sm' : 'text-slate-600 hover:text-navy'"
                (click)="historyStatusFilter.set('COMPLETED')"
              >
                Finalizados
              </button>
            </div>
            <label class="relative">
              <span class="material-symbols-outlined absolute left-3 top-2.5 text-lg text-slate-400">
                search
              </span>
              <input
                id="patient-history-search"
                class="h-9 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-xs sm:w-52"
                type="search"
                [value]="historySearch()"
                (input)="historySearch.set($any($event.target).value)"
                placeholder="Buscar tratamiento..."
              />
            </label>
          </div>
        </div>

        <div id="clinical-record-list" class="mt-6 space-y-5">
          @for (grp of groupedTreatments(); track grp.treatmentName) {
            <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-gold/50">
              <!-- Encabezado del Tratamiento -->
              <header
                class="flex cursor-pointer items-center justify-between border-b border-slate-100 bg-slate-50/80 p-4 transition hover:bg-slate-100/60"
                (click)="toggleTreatmentExpand(grp.treatmentName)"
              >
                <div class="flex items-center gap-3">
                  <span class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-navy text-white shadow-sm">
                    <span class="material-symbols-outlined text-xl text-gold">dentistry</span>
                  </span>
                  <div>
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-[10px] font-bold uppercase tracking-wider text-gold">
                        Servicio Dental:
                      </span>
                      <h3 class="font-bold text-navy text-sm">{{ grp.treatmentName }}</h3>
                      @if (grp.isCompleted) {
                        <span class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          <span class="material-symbols-outlined text-[13px]">check_circle</span>
                          Tratamiento Finalizado / Alta
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                          <span class="material-symbols-outlined text-[13px]">sync</span>
                          En tratamiento
                        </span>
                      }
                    </div>
                    <p class="mt-0.5 text-xs text-slate-500">
                      {{ grp.odontologoNombre }} · {{ grp.records.length }}
                      {{ grp.records.length === 1 ? 'sesión registrada' : 'sesiones registradas' }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-[11px] font-medium text-slate-400 hidden sm:inline">
                    Última atención: {{ formatRecordDate(grp.lastUpdate) }}
                  </span>
                  <span class="material-symbols-outlined text-slate-400 transition-transform duration-200"
                        [class.rotate-180]="isTreatmentExpanded(grp.treatmentName)">
                    expand_more
                  </span>
                </div>
              </header>

              <!-- Desglose de Sesiones del Tratamiento -->
              @if (isTreatmentExpanded(grp.treatmentName)) {
                <div class="divide-y divide-slate-100 p-2 sm:p-4 space-y-3">
                  @for (record of grp.records; track record.id; let idx = $index) {
                    <article class="rounded-lg border border-slate-100 bg-white p-4 transition hover:shadow-xs">
                      <div class="flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
                        <div class="flex items-center gap-2">
                          <span class="rounded-md bg-navy/10 px-2 py-0.5 text-[10px] font-bold text-navy">
                            Sesión {{ record.numeroSesion ? record.numeroSesion : (grp.records.length - idx) }}
                            {{ record.totalSesiones ? ('de ' + record.totalSesiones) : '' }}
                          </span>
                          @if (record.servicioNombre && record.servicioNombre !== grp.treatmentName) {
                            <span class="text-[10px] font-semibold text-slate-500">
                              · {{ record.servicioNombre }}
                            </span>
                          }
                          <span class="text-xs font-semibold text-slate-700">
                            {{ record.etapaTratamiento }}
                          </span>
                        </div>
                        <time class="text-[11px] text-slate-500">
                          {{ formatRecordDate(record.actualizadoEn) }}
                        </time>
                      </div>

                      <dl class="mt-3 grid gap-4 md:grid-cols-2 text-xs">
                        <div>
                          <dt class="text-[10px] font-bold uppercase text-slate-400">Diagnóstico</dt>
                          <dd class="mt-1 text-slate-800">{{ record.diagnostico || 'Sin diagnóstico' }}</dd>
                        </div>
                        <div>
                          <dt class="text-[10px] font-bold uppercase text-slate-400">Tratamiento / Procedimiento</dt>
                          <dd class="mt-1 text-slate-800">{{ record.tratamiento }}</dd>
                        </div>
                        <div>
                          <dt class="text-[10px] font-bold uppercase text-slate-400">Indicaciones y receta</dt>
                          <dd class="mt-1 text-slate-800">{{ record.indicaciones || 'Sin indicaciones' }}</dd>
                        </div>
                        <div>
                          <dt class="text-[10px] font-bold uppercase text-slate-400">Próximo control</dt>
                          <dd class="mt-1">
                            @if (record.etapaTratamiento === 'COMPLETADO' || grp.isCompleted) {
                              <span class="inline-flex items-center gap-1 font-semibold text-emerald-700">
                                <span class="material-symbols-outlined text-[13px]">verified</span>
                                Alta médica otorgada
                              </span>
                            } @else {
                              <span class="text-slate-800 font-medium">
                                {{ record.proximoControl ? formatDate(record.proximoControl) : 'No requerido' }}
                              </span>
                            }
                          </dd>
                        </div>
                        @if (record.observaciones) {
                          <div class="md:col-span-2">
                            <dt class="text-[10px] font-bold uppercase text-slate-400">Observaciones</dt>
                            <dd class="mt-1 text-slate-700">{{ record.observaciones }}</dd>
                          </div>
                        }
                      </dl>
                    </article>
                  }
                </div>
              }
            </section>
          } @empty {
            <div class="rounded-xl border border-dashed border-slate-300 p-10 text-center">
              <span class="material-symbols-outlined text-5xl text-slate-300">clinical_notes</span>
              <h3 class="mt-3 font-bold text-navy">
                {{ historySearch().trim() ? 'No se encontraron tratamientos' : 'Aún no tienes registros clínicos' }}
              </h3>
              <p class="mt-2 text-xs text-slate-500">
                {{ historySearch().trim() ? 'Prueba con otro término de búsqueda.' : 'Aquí se agruparán tus tratamientos organizados por sesiones y altas médicas.' }}
              </p>
            </div>
          }
        </div>
      </section>
    }

    @if (activeVista() === 'billing') {
      <section
        id="billing"
        data-dashboard-view
        class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div>
            <h2 class="flex items-center gap-2 font-bold text-navy">
              <span class="material-symbols-outlined text-xl text-gold">receipt_long</span>
              Facturación
            </h2>
            <p class="mt-2 text-xs text-slate-500">
              Consulta los comprobantes asociados a tus atenciones.
            </p>
          </div>
          <span
            id="billing-count"
            class="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600"
          >
            {{ attendedCitas().length }}
            {{ attendedCitas().length === 1 ? 'comprobante' : 'comprobantes' }}
          </span>
        </div>
        <div id="billing-list" class="mt-5">
          @if (attendedCitas().length > 0) {
            <div class="overflow-x-auto">
              <table class="w-full min-w-[620px] text-left text-xs">
                <thead class="border-b border-slate-200 text-[9px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th class="px-3 py-3">Comprobante</th>
                    <th class="px-3 py-3">Fecha</th>
                    <th class="px-3 py-3">Servicio</th>
                    <th class="px-3 py-3">Importe</th>
                    <th class="px-3 py-3 text-right">Descargar</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (item of attendedCitas(); track item.id) {
                    <tr>
                      <td class="px-3 py-4 font-bold text-navy">BOL-{{ item.codigo || item.id }}</td>
                      <td class="px-3 py-4">{{ formatDate(item.fecha) }}</td>
                      <td class="px-3 py-4">{{ item.servicioNombre }}</td>
                      <td class="px-3 py-4">S/ {{ item.precioPactado | number: '1.2-2' }}</td>
                      <td class="px-3 py-4 text-right">
                        <button
                          class="receipt-button font-bold text-gold hover:underline"
                          type="button"
                          (click)="downloadReceipt(item)"
                        >
                          Descargar
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="rounded-lg border border-dashed border-slate-300 p-8 text-center">
              <span class="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
              <p class="mt-2 text-sm font-semibold text-navy">No tienes comprobantes disponibles</p>
              <p class="mt-2 text-xs text-slate-500">
                Aparecerán después de completar una atención.
              </p>
            </div>
          }
        </div>
      </section>
    }

    @if (activeVista() === 'settings') {
      <section
        id="settings"
        data-dashboard-view
        class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 class="flex items-center gap-2 font-bold text-navy">
          <span class="material-symbols-outlined text-xl text-gold">settings</span>
          Configuración
        </h2>
        <p class="mt-2 text-xs text-slate-500">
          Personaliza tus datos de contacto y recordatorios.
        </p>
        <form
          id="patient-settings-form"
          [formGroup]="settingsForm"
          (ngSubmit)="guardarConfiguracion()"
          class="mt-6 grid gap-5 md:grid-cols-2"
          novalidate
        >
          <label class="text-xs font-semibold text-slate-700">
            Teléfono de contacto
            <input
              id="settings-phone"
              formControlName="telefono"
              class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-gold"
              type="tel"
              maxlength="22"
              placeholder="+51 987 654 321"
            />
            <sd-field-error [control]="settingsForm.controls.telefono" />
          </label>
          <div class="space-y-3 text-xs">
            <p class="font-semibold text-slate-700">Recordatorios</p>
            <label class="flex items-center gap-3">
              <input
                id="settings-email-reminders"
                formControlName="recordatoriosEmail"
                class="rounded border-slate-300 text-gold focus:ring-gold"
                type="checkbox"
              />
              Recibir recordatorios por correo
            </label>
            <label class="flex items-center gap-3">
              <input
                id="settings-phone-reminders"
                formControlName="recordatoriosTelefono"
                class="rounded border-slate-300 text-gold focus:ring-gold"
                type="checkbox"
              />
              Recibir recordatorios por teléfono
            </label>
          </div>
          <div class="md:col-span-2">
            @if (settingsMessage(); as msg) {
              <p
                id="settings-message"
                class="mb-3 rounded-lg p-3 text-xs"
                [class]="
                  settingsError() ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                "
                role="status"
              >
                {{ msg }}
              </p>
            }
            <button
              class="rounded-lg bg-navy px-5 py-3 text-xs font-bold text-white disabled:opacity-60"
              type="submit"
              [disabled]="savingSettings()"
            >
              {{ savingSettings() ? 'Guardando...' : 'Guardar configuración' }}
            </button>
          </div>
        </form>
      </section>
    }

    @if (selectedModalCita(); as modalCita) {
      <div
        id="patient-appointment-modal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-navy/75 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-appointment-title"
        (click)="onModalBackdropClick($event)"
      >
        <div class="relative w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl">
          <button
            class="absolute right-4 top-4 text-slate-500"
            type="button"
            aria-label="Cerrar"
            (click)="selectedModalCita.set(null)"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
          <h2 id="patient-appointment-title" class="text-xl font-bold text-navy">
            Detalle de la cita
          </h2>
          <div id="patient-appointment-detail" class="mt-6">
            <div class="grid gap-4 rounded-xl bg-slate-50 p-5 sm:grid-cols-2">
              <div>
                <span class="text-[10px] uppercase text-slate-400">Servicio</span>
                <strong class="mt-1 block text-sm text-navy">{{ modalCita.servicioNombre }}</strong>
                <small class="mt-1 block font-bold text-gold">
                  {{ treatmentSessionLabel(modalCita) }}
                </small>
              </div>
              <div>
                <span class="text-[10px] uppercase text-slate-400">Especialista</span>
                <strong class="mt-1 block text-sm text-navy">{{ modalCita.odontologoNombre }}</strong>
              </div>
              <div>
                <span class="text-[10px] uppercase text-slate-400">Fecha y hora</span>
                <strong class="mt-1 block text-sm text-navy">
                  {{ formatDate(modalCita.fecha) }} · {{ formatTime(modalCita.horaInicio) }}
                </strong>
              </div>
              <div>
                <span class="text-[10px] uppercase text-slate-400">Importe de esta cita</span>
                <strong class="mt-1 block text-sm text-navy">
                  S/ {{ modalCita.precioPactado | number: '1.2-2' }}
                </strong>
              </div>
              <div class="sm:col-span-2">
                <span class="text-[10px] uppercase text-slate-400">Código de reserva</span>
                <strong class="mt-1 block text-xs text-navy">{{ modalCita.codigo }}</strong>
              </div>
              <div class="sm:col-span-2">
                <span class="text-[10px] uppercase text-slate-400">Notas</span>
                <p class="mt-1 text-xs text-slate-600">
                  {{ modalCita.motivo || 'Sin notas adicionales' }}
                </p>
              </div>
            </div>
          </div>
          <div id="patient-appointment-actions" class="mt-6 flex flex-wrap justify-end gap-3">
            <button
              class="rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-bold text-navy"
              type="button"
              (click)="selectedModalCita.set(null)"
            >
              Cerrar
            </button>
            @if (puedeAgendarSiguienteSesion(modalCita)) {
              <button
                class="rounded-lg bg-gold px-4 py-2.5 text-xs font-bold text-white transition hover:bg-yellow-600"
                type="button"
                (click)="selectedModalCita.set(null); agendarSiguienteSesion(modalCita)"
              >
                Agendar sesión {{ modalCita.numeroSesion + 1 }} de {{ modalCita.totalSesiones }} →
              </button>
            }
            @if (modalCita.estado === 'PENDIENTE' || modalCita.estado === 'CONFIRMADA') {
              <button
                class="rounded-lg bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700"
                type="button"
                (click)="cancelarCita(modalCita)"
              >
                Cancelar
              </button>
              <button
                class="rounded-lg bg-navy px-4 py-2.5 text-xs font-bold text-white"
                type="button"
                (click)="irAReprogramar(modalCita)"
              >
                Reprogramar
              </button>
            }
          </div>
        </div>
      </div>
    }

    @if (successModalOpen()) {
      <div
        id="success-modal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-navy/75 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-title"
      >
        <div class="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <span
            class="material-symbols-outlined text-6xl text-green-600"
            style="font-variation-settings: 'FILL' 1;"
          >
            check_circle
          </span>
          <h2 id="success-title" class="mt-4 text-2xl font-bold text-navy">
            {{
              bookingResultType() === 'reprogramada'
                ? '¡Cita reprogramada!'
                : bookingResultType() === 'continuacion'
                  ? '¡Siguiente sesión agendada!'
                  : '¡Reserva registrada!'
            }}
          </h2>
          <p class="mt-3 text-sm leading-6 text-slate-600">
            {{
              bookingResultType() === 'reprogramada'
                ? 'Actualizamos la fecha y hora de tu cita. La reserva volvió al estado pendiente para su confirmación.'
                : bookingResultType() === 'continuacion'
                  ? 'Tu siguiente sesión quedó programada sin costo adicional (S/ 0.00). El odontólogo confirmará la disponibilidad.'
                  : 'Tu cita fue guardada con estado pendiente. Podrás revisar cualquier actualización desde este panel.'
            }}
          </p>
          @if (latestBookedCita(); as booked) {
            <div id="success-summary" class="mt-6 rounded-lg bg-slate-50 p-4 text-left text-xs">
              <p><strong>Servicio:</strong> {{ booked.servicioNombre }}</p>
              <p class="mt-2">
                <strong>Fecha:</strong> {{ formatDate(booked.fecha) }} a las
                {{ formatTime(booked.horaInicio) }}
              </p>
              <p class="mt-2"><strong>Código:</strong> {{ booked.codigo }}</p>
            </div>
          }
          <button
            id="close-success"
            class="mt-6 w-full rounded-lg bg-navy px-5 py-3 text-xs font-bold text-white"
            type="button"
            (click)="cerrarSuccessModal()"
          >
            Ver mis citas
          </button>
        </div>
      </div>
    }
  `,
})
export class PacienteDashboardComponent implements OnInit {
  private readonly api = inject(SmartDentApiService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly authStore = inject(AuthStore);
  private readonly notificationStore = inject(NotificationStore);
  private readonly toastStore = inject(ToastStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly citas = signal<readonly CitaResponse[]>([]);
  protected readonly historias = signal<readonly HistoriaClinicaResponse[]>([]);
  protected readonly appointmentSearch = signal<string>('');
  protected readonly appointmentFilter = signal<string>('ALL');
  protected readonly historySearch = signal<string>('');
  protected readonly historyStatusFilter = signal<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  protected readonly expandedTreatments = signal<Record<string, boolean>>({});
  protected readonly reminderFilter = signal<'ALL' | 'PENDING' | 'DONE'>('PENDING');
  protected readonly selectedModalCita = signal<CitaResponse | null>(null);
  protected readonly successModalOpen = signal<boolean>(false);
  protected readonly bookingResultType = signal<string>('registrada');

  protected readonly savingSettings = signal<boolean>(false);
  protected readonly settingsMessage = signal<string | null>(null);
  protected readonly settingsError = signal<boolean>(false);

  protected readonly settingsForm = this.fb.group({
    telefono: ['', [SmartDentValidators.telefono(false)]],
    recordatoriosEmail: [true],
    recordatoriosTelefono: [false],
  });

  constructor() {
    effect(() => {
      const incoming = this.notificationStore.incomingEvent();
      if (incoming) {
        this.recargarDatos();
      }
    });
  }

  private readonly rawVista = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('vista'))),
    { initialValue: null }
  );

  protected readonly activeVista = computed<string>(() => this.rawVista() ?? 'overview');

  protected toggleTreatmentExpand(treatmentKey: string): void {
    this.expandedTreatments.update((prev) => ({
      ...prev,
      [treatmentKey]: !prev[treatmentKey],
    }));
  }

  protected isTreatmentExpanded(treatmentKey: string): boolean {
    const state = this.expandedTreatments();
    // Expandido por defecto si no se ha toggleado
    return state[treatmentKey] ?? true;
  }

  protected readonly groupedTreatments = computed<readonly TreatmentGroup[]>(() => {
    const list = this.historias();
    const mapGroups = new Map<string, HistoriaClinicaResponse[]>();

    for (const h of list) {
      // Cruzar con las citas del paciente si ultimaCitaId coincide, para asegurar el nombre del servicio aunque el backend aún no se haya reiniciado
      let serviceName = h.servicioNombre;
      if (!serviceName && h.ultimaCitaId) {
        const matchedCita = this.citas().find((c) => c.id === h.ultimaCitaId);
        if (matchedCita) {
          serviceName = matchedCita.servicioNombre;
        }
      }
      // Fallback a citas por odontólogo
      if (!serviceName) {
        const citaDoctor = this.citas().find((c) => c.odontologoId === h.odontologoId);
        if (citaDoctor) {
          serviceName = citaDoctor.servicioNombre;
        }
      }

      const key = (serviceName || 'Tratamiento Odontológico').trim();
      const existing = mapGroups.get(key) ?? [];
      existing.push(h);
      mapGroups.set(key, existing);
    }

    const term = this.historySearch().trim().toLowerCase();
    const statusFilter = this.historyStatusFilter();

    const result: TreatmentGroup[] = [];

    for (const [treatmentName, records] of mapGroups.entries()) {
      const sortedRecords = [...records].sort(
        (a, b) => {
          const tB = b.actualizadoEn ? new Date(b.actualizadoEn).getTime() : 0;
          const tA = a.actualizadoEn ? new Date(a.actualizadoEn).getTime() : 0;
          return tB - tA;
        }
      );
      const isCompleted = sortedRecords.some((r) => r.etapaTratamiento === 'COMPLETADO');
      const latest = sortedRecords[0]!;

      // Citas relacionadas para contar sesiones
      const matchingCitas = this.citas().filter(
        (c) => c.servicioNombre.toLowerCase() === treatmentName.toLowerCase()
      );
      const totalSessions = matchingCitas[0]?.totalSesiones;

      // Filtro de texto
      const matchesSearch =
        !term ||
        treatmentName.toLowerCase().includes(term) ||
        (latest.odontologoNombre ?? '').toLowerCase().includes(term) ||
        sortedRecords.some(
          (r) =>
            (r.diagnostico ?? '').toLowerCase().includes(term) ||
            (r.indicaciones ?? '').toLowerCase().includes(term)
        );

      // Filtro de estado
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'COMPLETED' && isCompleted) ||
        (statusFilter === 'ACTIVE' && !isCompleted);

      if (matchesSearch && matchesStatus) {
        result.push({
          treatmentName,
          odontologoNombre: latest.odontologoNombre || latest.odontologoEmail || 'Odontólogo SmartDent',
          isCompleted,
          lastUpdate: latest.actualizadoEn,
          records: sortedRecords,
          totalSessions,
        });
      }
    }

    return result;
  });

  protected readonly primerNombre = computed<string>(() => {
    const full = this.authStore.userName() ?? 'Paciente';
    return full.split(/\s+/)[0] || 'Paciente';
  });

  protected readonly userInitials = computed<string>(() => {
    const full = this.authStore.userName() ?? 'SD';
    return full
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toUpperCase();
  });

  protected readonly upcomingCitas = computed<readonly CitaResponse[]>(() => {
    const now = new Date();
    return [...this.citas()]
      .filter(
        (c) =>
          (c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA') &&
          new Date(`${c.fecha}T${c.horaInicio}`) >= now
      )
      .sort(
        (a, b) =>
          new Date(`${a.fecha}T${a.horaInicio}`).getTime() -
          new Date(`${b.fecha}T${b.horaInicio}`).getTime()
      );
  });

  protected readonly nextAppointment = computed<CitaResponse | undefined>(
    () => this.upcomingCitas()[0]
  );

  protected readonly pendingOnlyCount = computed<number>(
    () => this.citas().filter((c) => c.estado === 'PENDIENTE').length
  );

  protected readonly activeCount = computed<number>(
    () =>
      this.citas().filter((c) => c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA').length
  );

  protected readonly attendedCitas = computed<readonly CitaResponse[]>(() =>
    this.citas().filter((c) => c.estado === 'ATENDIDA')
  );

  protected readonly attendedCount = computed<number>(() => this.attendedCitas().length);

  protected readonly cancelledCount = computed<number>(
    () => this.citas().filter((c) => c.estado === 'CANCELADA').length
  );

  protected readonly latestClinicalRecord = computed<HistoriaClinicaResponse | undefined>(() => {
    const list = [...this.historias()].sort(
      (a, b) =>
        new Date(b.actualizadoEn ?? 0).getTime() - new Date(a.actualizadoEn ?? 0).getTime()
    );
    return list[0];
  });

  protected readonly hasStartedTreatment = computed<boolean>(
    () => this.attendedCount() > 0 || Boolean(this.latestClinicalRecord())
  );

  protected readonly nextControlDate = computed<string | null>(() => {
    const todayVal = new Date();
    todayVal.setHours(0, 0, 0, 0);
    const valid = this.historias()
      .map((h) => h.proximoControl)
      .filter((val): val is string => Boolean(val && new Date(`${val}T00:00:00`) >= todayVal))
      .sort();
    return valid[0] ?? null;
  });

  protected readonly pendingTreatmentContinuation = computed<CitaResponse | null>(() => {
    const multiSessionAttended = this.attendedCitas()
      .filter((c) => c.totalSesiones > 1 && c.numeroSesion < c.totalSesiones)
      .sort(
        (a, b) =>
          new Date(`${b.fecha}T${b.horaInicio}`).getTime() -
          new Date(`${a.fecha}T${a.horaInicio}`).getTime()
      );

    for (const attended of multiSessionAttended) {
      const hasActiveNext = this.citas().some(
        (c) =>
          (c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA') &&
          ((attended.tratamientoCodigo && c.tratamientoCodigo === attended.tratamientoCodigo) ||
            c.servicioId === attended.servicioId)
      );
      if (!hasActiveNext) {
        return attended;
      }
    }
    return null;
  });

  protected readonly currentTreatmentStage = computed<EtapaTratamiento>(() => {
    const latest = this.latestClinicalRecord();
    const order: readonly EtapaTratamiento[] = [
      'CONSULTA',
      'DIAGNOSTICO',
      'TRATAMIENTO',
      'COMPLETADO',
    ];
    if (latest && order.includes(latest.etapaTratamiento)) {
      return latest.etapaTratamiento;
    }
    if (latest?.tratamiento) return 'TRATAMIENTO';
    if (latest?.diagnostico) return 'DIAGNOSTICO';
    return 'CONSULTA';
  });

  protected readonly treatmentProgressPercent = computed<number>(() => {
    if (!this.hasStartedTreatment()) return 0;
    const order: readonly EtapaTratamiento[] = [
      'CONSULTA',
      'DIAGNOSTICO',
      'TRATAMIENTO',
      'COMPLETADO',
    ];
    const idx = order.indexOf(this.currentTreatmentStage());
    return [25, 50, 75, 100][idx] ?? 25;
  });

  protected readonly treatmentProgressDescription = computed<string>(() => {
    if (!this.hasStartedTreatment()) {
      return 'Aún no existe un plan de tratamiento activo.';
    }
    const descriptions: Record<EtapaTratamiento, string> = {
      CONSULTA: 'Evaluación inicial realizada. Tu odontólogo preparará el diagnóstico.',
      DIAGNOSTICO: 'Diagnóstico registrado y plan de atención definido.',
      TRATAMIENTO: 'Tu tratamiento se encuentra actualmente en curso.',
      COMPLETADO: 'Tratamiento completado. Continúa con tus controles preventivos.',
    };
    return descriptions[this.currentTreatmentStage()];
  });

  protected readonly treatmentSteps = computed<readonly TreatmentStepInfo[]>(() => {
    const order: readonly EtapaTratamiento[] = [
      'CONSULTA',
      'DIAGNOSTICO',
      'TRATAMIENTO',
      'COMPLETADO',
    ];
    const currentIdx = order.indexOf(this.currentTreatmentStage());
    const meta: readonly {
      code: EtapaTratamiento;
      icon: string;
      title: string;
      subtitle: string;
    }[] = [
      {
        code: 'CONSULTA',
        icon: 'person_search',
        title: 'Consulta',
        subtitle: 'Evaluación inicial',
      },
      {
        code: 'DIAGNOSTICO',
        icon: 'diagnosis',
        title: 'Diagnóstico',
        subtitle: 'Plan definido',
      },
      {
        code: 'TRATAMIENTO',
        icon: 'dentistry',
        title: 'Tratamiento',
        subtitle: 'Procedimiento clínico',
      },
      {
        code: 'COMPLETADO',
        icon: 'verified',
        title: 'Control y alta',
        subtitle: 'Tratamiento finalizado',
      },
    ];
    return meta.map((m, idx) => ({
      ...m,
      completed: idx <= currentIdx,
      current: idx === currentIdx,
    }));
  });

  protected readonly allReminders = computed<readonly PatientReminder[]>(() => {
    const list: PatientReminder[] = [];

    // Notificaciones de usuario
    this.notificationStore
      .items()
      .slice(0, 8)
      .forEach((n) => {
        const isDone = n.leida || n.tipo === 'CITA_ATENDIDA';
        const tone = isDone
          ? 'bg-slate-50 text-slate-500 opacity-75'
          : n.tipo === 'CITA_CONFIRMADA'
            ? 'bg-green-50 text-green-700'
            : n.tipo === 'CITA_CANCELADA'
              ? 'bg-red-50 text-red-700'
              : 'bg-amber-50 text-amber-700';

        const icon =
          n.tipo === 'CITA_CONFIRMADA'
            ? 'verified'
            : n.tipo === 'CITA_CANCELADA'
              ? 'event_busy'
              : n.tipo === 'CITA_ATENDIDA'
                ? 'task_alt'
                : 'notifications_active';

        list.push({
          id: n.id,
          icon,
          title: n.titulo,
          detail: n.mensaje,
          tone,
          status: isDone ? 'DONE' : 'PENDING',
          isNotification: true,
        });
      });

    // Próximas citas activas (por hacer)
    this.upcomingCitas()
      .slice(0, 2)
      .forEach((item) => {
        const days = this.daysUntil(item.fecha);
        const statusSuffix =
          item.estado === 'CONFIRMADA' ? ' · Confirmada por odontólogo' : ' · Pendiente de confirmar';
        list.push({
          icon: item.estado === 'CONFIRMADA' ? 'event_available' : 'event_upcoming',
          title:
            days === 0
              ? 'Tu cita es hoy'
              : days === 1
                ? 'Tu cita es mañana'
                : `Cita dentro de ${days} días`,
          detail: `${item.servicioNombre} · ${this.formatDate(item.fecha)} a las ${this.formatTime(item.horaInicio)}${statusSuffix}`,
          tone: item.estado === 'CONFIRMADA' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700',
          status: 'PENDING',
        });
      });

    // Citas atendidas o pasadas recientes (completadas)
    this.attendedCitas()
      .slice(0, 2)
      .forEach((item) => {
        list.push({
          icon: 'task_alt',
          title: 'Atención realizada',
          detail: `${item.servicioNombre} con ${item.odontologoNombre} (${this.formatDate(item.fecha)}).`,
          tone: 'bg-slate-50 text-slate-500 opacity-75',
          status: 'DONE',
        });
      });

    // Citas pendientes de confirmación activas
    const pendingCount = this.pendingOnlyCount();
    if (pendingCount > 0) {
      list.push({
        icon: 'hourglass_top',
        title: `${pendingCount} ${pendingCount === 1 ? 'cita pendiente' : 'citas pendientes'} de confirmación`,
        detail: 'El especialista actualizará el estado desde su panel.',
        tone: 'bg-amber-50 text-amber-700',
        status: 'PENDING',
      });
    }

    // Próximo control clínico
    const todayVal = new Date();
    todayVal.setHours(0, 0, 0, 0);
    const nextControl = this.historias()
      .map((h) => h.proximoControl)
      .filter((val): val is string => Boolean(val && new Date(`${val}T00:00:00`) >= todayVal))
      .sort()[0];

    if (nextControl) {
      list.push({
        icon: 'dentistry',
        title: 'Control odontológico recomendado',
        detail: `Próximo control: ${this.formatDate(nextControl)}.`,
        tone: 'bg-green-50 text-green-700',
        status: 'PENDING',
      });
    }

    return list;
  });

  protected readonly reminders = computed<readonly PatientReminder[]>(() => {
    const f = this.reminderFilter();
    const all = this.allReminders();
    if (f === 'ALL') return all;
    return all.filter((r) => r.status === f);
  });

  protected readonly pendingRemindersCount = computed<number>(
    () => this.allReminders().filter((r) => r.status === 'PENDING').length
  );

  protected readonly recentActivities = computed<readonly PatientActivityItem[]>(() => {
    const clinical: PatientActivityItem[] = this.historias().map((record) => ({
      date: record.actualizadoEn ?? '',
      icon: 'clinical_notes',
      title: record.tratamiento || 'Expediente clínico actualizado',
      detail: record.diagnostico || 'Tu odontólogo actualizó tu información clínica.',
    }));
    const appt: PatientActivityItem[] = this.attendedCitas().map((item) => ({
      date: `${item.fecha}T${item.horaInicio}`,
      icon: 'task_alt',
      title: item.servicioNombre,
      detail: `Atención completada con ${item.odontologoNombre}.`,
    }));
    return [...clinical, ...appt]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  });

  protected readonly filteredAppointments = computed<readonly CitaResponse[]>(() => {
    const term = this.appointmentSearch().trim().toLowerCase();
    const filter = this.appointmentFilter();
    const now = new Date();
    return this.citas().filter((item) => {
      const matchesTerm = [item.servicioNombre, item.odontologoNombre, item.codigo].some((val) =>
        String(val || '')
          .toLowerCase()
          .includes(term)
      );
      const matchesFilter =
        filter === 'ALL' ||
        (filter === 'UPCOMING' &&
          !['ATENDIDA', 'CANCELADA'].includes(item.estado) &&
          new Date(`${item.fecha}T${item.horaInicio}`) >= now) ||
        item.estado === filter;
      return matchesTerm && matchesFilter;
    });
  });

  protected readonly latestBookedCita = computed<CitaResponse | undefined>(() => {
    const storedId =
      typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('smartdent_booking_id')
        : null;
    if (storedId) {
      const match = this.citas().find(
        (c) => c.codigo === storedId || String(c.id) === storedId
      );
      if (match) return match;
    }
    return this.citas()[0];
  });

  ngOnInit(): void {
    this.recargarDatos();
    const reservaParam = this.route.snapshot.queryParamMap.get('reserva');
    if (reservaParam === 'exitosa') {
      const resultType =
        typeof sessionStorage !== 'undefined'
          ? (sessionStorage.getItem('smartdent_booking_result') ?? 'registrada')
          : 'registrada';
      this.bookingResultType.set(resultType);
      this.successModalOpen.set(true);
    }
    this.route.queryParamMap.subscribe((params) => {
      const vista = params.get('vista') ?? 'overview';
      if (vista === 'appointments') {
        this.appointmentFilter.set('ALL');
        this.appointmentSearch.set('');
      }
    });
  }

  private recargarDatos(): void {
    forkJoin({
      citas: this.api.listarMisCitas(),
      historias: this.api.listarMisHistoriasClinicas(),
      config: this.api.obtenerConfiguracionPaciente(),
    }).subscribe({
      next: ({ citas, historias, config }) => {
        const sorted = [...citas].sort(
          (a, b) =>
            new Date(`${b.fecha}T${b.horaInicio}`).getTime() -
            new Date(`${a.fecha}T${a.horaInicio}`).getTime()
        );
        this.citas.set(sorted);
        this.historias.set(historias);
        this.hydrateSettings(config, sorted);
      },
      error: (err: unknown) => {
        this.toastStore.error(extractApiErrorMessage(err));
      },
    });
  }

  private hydrateSettings(
    config: ConfiguracionPacienteResponse,
    citas: readonly CitaResponse[]
  ): void {
    const fallbackPhone =
      config.telefono ||
      citas.find((c) => Boolean(c.telefonoContacto))?.telefonoContacto ||
      this.authStore.session()?.telefono ||
      '';
    this.settingsForm.patchValue({
      telefono: fallbackPhone,
      recordatoriosEmail: config.recordatoriosEmail ?? true,
      recordatoriosTelefono: config.recordatoriosTelefono ?? false,
    });
  }

  protected completarRecordatorio(id: number): void {
    this.notificationStore.markAsRead(id);
  }

  protected goToVista(vista: string): void {
    if (vista === 'appointments') {
      this.appointmentFilter.set('ALL');
      this.appointmentSearch.set('');
    }
    void this.router.navigate(['/paciente'], { queryParams: { vista } });
  }

  protected onSearchInput(event: Event): void {
    this.appointmentSearch.set((event.target as HTMLInputElement).value);
  }

  protected onFilterChange(event: Event): void {
    this.appointmentFilter.set((event.target as HTMLSelectElement).value);
  }

  protected openAppointmentModal(cita: CitaResponse): void {
    this.selectedModalCita.set(cita);
  }

  protected onModalBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).id === 'patient-appointment-modal') {
      this.selectedModalCita.set(null);
    }
  }

  protected irAReprogramar(cita: CitaResponse): void {
    this.selectedModalCita.set(null);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('smartdent_rebook_id', String(cita.id));
    }
    void this.router.navigate(['/reservar'], {
      queryParams: { reprogramarId: cita.id },
    });
  }

  protected agendarSiguienteSesion(cita: CitaResponse): void {
    this.selectedModalCita.set(null);
    const nextSession = (cita.numeroSesion || 1) + 1;
    const suggested = this.nextControlDate();
    void this.router.navigate(['/reservar'], {
      queryParams: {
        continuarTratamiento: cita.tratamientoCodigo || `TRA-${cita.id}`,
        servicioId: cita.servicioId,
        odontologoId: cita.odontologoId,
        siguienteSesion: nextSession,
        totalSesiones: cita.totalSesiones,
        ...(suggested ? { fechaSugerida: suggested } : {}),
      },
    });
  }

  protected puedeAgendarSiguienteSesion(cita: CitaResponse): boolean {
    if (cita.estado !== 'ATENDIDA' || cita.numeroSesion >= cita.totalSesiones) {
      return false;
    }
    // Solo permitir el botón en la última cita atendida del tratamiento
    const latestAttended = this.attendedCitas()
      .filter(
        (c) =>
          (cita.tratamientoCodigo && c.tratamientoCodigo === cita.tratamientoCodigo) ||
          c.servicioId === cita.servicioId
      )
      .sort((a, b) => (b.numeroSesion ?? 1) - (a.numeroSesion ?? 1))[0];

    if (!latestAttended || latestAttended.id !== cita.id) {
      return false;
    }

    // Verificar si ya existe una sesión en curso o posterior
    const hasActiveOrNext = this.citas().some(
      (c) =>
        ((cita.tratamientoCodigo && c.tratamientoCodigo === cita.tratamientoCodigo) ||
          c.servicioId === cita.servicioId) &&
        ((c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA') ||
          (c.numeroSesion ?? 1) > (cita.numeroSesion ?? 1))
    );
    return !hasActiveOrNext;
  }

  protected cancelarCita(cita: CitaResponse): void {
    if (typeof window !== 'undefined' && !window.confirm('¿Deseas cancelar esta cita?')) {
      return;
    }
    this.api.cancelarCitaPaciente(cita.id).subscribe({
      next: () => {
        this.selectedModalCita.set(null);
        this.toastStore.info(`Cita ${cita.codigo} cancelada.`);
        this.recargarDatos();
        this.notificationStore.refresh(false);
      },
      error: (err: unknown) => {
        this.toastStore.error(extractApiErrorMessage(err));
      },
    });
  }

  protected cerrarSuccessModal(): void {
    this.successModalOpen.set(false);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('smartdent_booking_result');
      sessionStorage.removeItem('smartdent_booking_id');
    }
    this.goToVista('appointments');
  }

  protected guardarConfiguracion(): void {
    this.settingsMessage.set(null);
    this.settingsError.set(false);
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      this.settingsError.set(true);
      this.settingsMessage.set('Ingresa un teléfono válido de 9 a 15 dígitos.');
      return;
    }
    this.savingSettings.set(true);
    const raw = this.settingsForm.getRawValue();
    this.api
      .actualizarConfiguracionPaciente({
        telefono: raw.telefono.trim(),
        recordatoriosEmail: raw.recordatoriosEmail,
        recordatoriosTelefono: raw.recordatoriosTelefono,
      })
      .subscribe({
        next: () => {
          this.savingSettings.set(false);
          this.settingsError.set(false);
          this.settingsMessage.set('Configuración guardada correctamente en tu cuenta.');
        },
        error: (err: unknown) => {
          this.savingSettings.set(false);
          this.settingsError.set(true);
          this.settingsMessage.set(applyServerValidationErrors(this.settingsForm, err));
        },
      });
  }

  protected downloadReceipt(item: CitaResponse): void {
    if (typeof document === 'undefined') return;
    const content = `SMARTDENT - COMPROBANTE DE ATENCIÓN\n\nCódigo: BOL-${item.codigo || item.id}\nPaciente: ${this.authStore.userName()}\nServicio: ${item.servicioNombre}\nOdontólogo: ${item.odontologoNombre}\nFecha: ${this.formatDate(item.fecha)}\nImporte: S/ ${Number(item.precioPactado).toFixed(2)}\n`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `comprobante-${item.codigo || item.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected treatmentSessionLabel(cita: CitaResponse): string {
    const total = Number(cita.totalSesiones || 1);
    if (total <= 1) return 'Atención individual';
    const remaining = Math.max(
      0,
      Number(cita.sesionesRestantes ?? total - cita.numeroSesion)
    );
    return `Sesión ${cita.numeroSesion} de ${total} · ${remaining} ${remaining === 1 ? 'sesión restante' : 'sesiones restantes'}`;
  }

  protected statusClass(status: string): string {
    if (status === 'CONFIRMADA') return 'bg-green-50 text-green-700';
    if (status === 'ATENDIDA') return 'bg-blue-50 text-blue-700';
    if (status === 'CANCELADA') return 'bg-red-50 text-red-700';
    return 'bg-yellow-50 text-yellow-700';
  }

  protected formatDate(value: string): string {
    if (!value) return 'Sin fecha';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
  }

  protected formatTime(value: string): string {
    if (!value) return '';
    const [hourStr, minStr] = value.slice(0, 5).split(':');
    return new Intl.DateTimeFormat('es-PE', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(2026, 0, 1, Number(hourStr || 0), Number(minStr || 0)));
  }

  protected monthShort(value: string): string {
    if (!value) return '';
    return new Intl.DateTimeFormat('es-PE', { month: 'short' })
      .format(new Date(`${value.slice(0, 10)}T12:00:00`))
      .replace('.', '');
  }

  protected dayNumber(value: string): number {
    if (!value) return 1;
    return new Date(`${value.slice(0, 10)}T12:00:00`).getDate();
  }

  protected formatRecordDate(value: string | null): string {
    if (!value) return 'Sin fecha';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  protected formatActivityDate(value: string): string {
    if (!value) return 'Sin fecha';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  }

  private daysUntil(value: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(`${value.slice(0, 10)}T00:00:00`);
    return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86400000));
  }
}
