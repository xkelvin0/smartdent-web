import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, map } from 'rxjs';
import { AuthStore } from '../../core/auth/auth.store';
import {
  BloqueoHorarioResponse,
  CitaEstado,
  CitaResponse,
  EtapaTratamiento,
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

type AgendaPeriod = 'DAY' | 'WEEK' | 'MONTH';

interface AssignedPatientCard {
  readonly patientName: string;
  readonly patientEmail: string;
  readonly phone: string;
  readonly visitsCount: number;
  readonly attendedCount: number;
  readonly lastVisitDate: string | null;
  readonly upcomingVisit: CitaResponse | undefined;
  readonly visits: readonly CitaResponse[];
  readonly treatmentName: string;
  readonly isCompleted: boolean;
  readonly sessionProgress: string;
}

interface DoctorAlertItem {
  readonly icon: string;
  readonly label: string;
  readonly tone: string;
}

@Component({
  selector: 'sd-odontologo-agenda',
  imports: [ReactiveFormsModule, FieldErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-8">
      <p class="text-xs font-bold uppercase tracking-[.18em] text-gold">Área profesional</p>
      <div class="mt-2 flex flex-wrap items-center gap-3">
        <h1 id="welcome-title" class="text-3xl font-bold text-navy">
          Bienvenido, {{ authStore.userName() }}
        </h1>
        <span
          id="doctor-badge-specialty"
          class="inline-flex items-center gap-1.5 rounded-full bg-gold-soft/50 border border-gold/30 px-3.5 py-1 text-xs font-bold text-navy shadow-sm"
        >
          <span class="material-symbols-outlined text-sm">medical_services</span>
          <span id="doctor-specialty-text">{{ doctorSpecialty() }}</span>
        </span>
      </div>
      <p class="mt-2 text-sm text-slate-500">
        Consulta tu agenda y actualiza el estado de tus atenciones.
      </p>
    </header>

    @if (activeVista() === 'summary') {
      <section id="summary" data-dashboard-view aria-label="Resumen profesional">
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article class="rounded-xl border border-slate-200 border-t-2 border-t-gold bg-white p-5 shadow-sm">
            <p class="text-xs text-slate-500">Citas asignadas</p>
            <strong id="total-count" class="mt-2 block text-3xl text-navy">
              {{ citas().length }}
            </strong>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs text-slate-500">Pendientes</p>
            <strong id="pending-count" class="mt-2 block text-3xl text-amber-600">
              {{ pendingCount() }}
            </strong>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs text-slate-500">Confirmadas</p>
            <strong id="confirmed-count" class="mt-2 block text-3xl text-blue-700">
              {{ confirmedCount() }}
            </strong>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs text-slate-500">Atendidas</p>
            <strong id="attended-count" class="mt-2 block text-3xl text-green-700">
              {{ attendedCount() }}
            </strong>
          </article>
        </div>

        <div class="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <article class="rounded-xl border border-slate-200 border-t-2 border-t-gold bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between">
              <h2 class="flex items-center gap-2 font-bold text-navy">
                <span class="material-symbols-outlined text-gold">event_upcoming</span>
                Próxima cita
              </h2>
              <button
                class="text-xs font-bold text-gold hover:underline"
                type="button"
                (click)="goToVista('agenda')"
              >
                Ver agenda
              </button>
            </div>
            <div id="doctor-next-appointment" class="mt-5">
              @if (nextAppointment(); as next) {
                <div class="flex flex-col gap-4 rounded-lg bg-slate-50 p-5 sm:flex-row sm:items-center">
                  <div class="grid h-14 w-14 place-items-center rounded-lg bg-navy text-center text-white">
                    <span>
                      <strong class="block text-lg">{{ dayNumber(next.fecha) }}</strong>
                      <small class="text-[9px] uppercase">{{ monthShort(next.fecha) }}</small>
                    </span>
                  </div>
                  <div class="flex-1">
                    <strong class="text-sm text-navy">{{ next.pacienteNombre }}</strong>
                    <p class="mt-1 text-xs text-slate-500">{{ next.servicioNombre }}</p>
                    <p class="mt-1 text-[10px] text-slate-400">
                      {{ formatDate(next.fecha) }} · {{ formatTime(next.horaInicio) }}
                    </p>
                  </div>
                  <span
                    class="rounded-full px-3 py-1 text-[9px] font-bold"
                    [class]="statusClass(next.estado)"
                  >
                    {{ next.estado }}
                  </span>
                </div>
              } @else {
                <div class="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                  No tienes citas próximas.
                </div>
              }
            </div>
          </article>

          <article class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="flex items-center gap-2 font-bold text-navy">
              <span class="material-symbols-outlined text-gold">notifications_active</span>
              Alertas pendientes
            </h2>
            <div id="doctor-alerts" class="mt-5 space-y-3">
              @for (alert of doctorAlerts(); track alert.label) {
                <div class="flex items-center gap-3 rounded-lg p-3" [class]="alert.tone">
                  <span class="material-symbols-outlined text-lg">{{ alert.icon }}</span>
                  <span class="text-xs font-semibold">{{ alert.label }}</span>
                </div>
              }
            </div>
          </article>
        </div>

        <div class="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <article class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="font-bold text-navy">Agenda de hoy</h2>
                <p id="today-label" class="mt-1 text-xs text-slate-500">{{ todayLongLabel() }}</p>
              </div>
              <span
                id="today-count"
                class="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600"
              >
                {{ todayAppointments().length }}
                {{ todayAppointments().length === 1 ? 'cita' : 'citas' }}
              </span>
            </div>
            <div id="doctor-today-list" class="mt-5 space-y-3">
              @for (item of todayAppointments(); track item.id) {
                <div class="flex items-center gap-4 rounded-lg border border-slate-200 p-4">
                  <strong class="w-16 text-xs text-navy">{{ formatTime(item.horaInicio) }}</strong>
                  <div class="flex-1">
                    <p class="text-xs font-bold text-navy">{{ item.pacienteNombre }}</p>
                    <p class="mt-1 text-[10px] text-slate-500">{{ item.servicioNombre }}</p>
                  </div>
                  <span
                    class="rounded-full px-2 py-1 text-[9px] font-bold"
                    [class]="statusClass(item.estado)"
                  >
                    {{ item.estado }}
                  </span>
                </div>
              } @empty {
                <div class="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                  No hay atenciones programadas para hoy.
                </div>
              }
            </div>
          </article>

          <article class="rounded-xl bg-navy p-6 text-white shadow-sm">
            <h2 class="font-bold">Acciones rápidas</h2>
            <div class="mt-5 grid gap-3">
              <button
                class="flex items-center justify-between rounded-lg bg-white/10 px-4 py-3 text-left text-xs font-semibold transition hover:bg-white/20"
                type="button"
                (click)="goToVista('agenda')"
              >
                <span class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-lg text-gold-soft">calendar_month</span>
                  Ver agenda completa
                </span>
                <span>→</span>
              </button>
              <button
                class="flex items-center justify-between rounded-lg bg-white/10 px-4 py-3 text-left text-xs font-semibold transition hover:bg-white/20"
                type="button"
                (click)="goToVista('patients')"
              >
                <span class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-lg text-gold-soft">person_search</span>
                  Buscar paciente
                </span>
                <span>→</span>
              </button>
              <button
                class="flex items-center justify-between rounded-lg bg-gold-soft px-4 py-3 text-left text-xs font-bold text-navy transition hover:bg-yellow-300"
                type="button"
                (click)="irARegistrarAtencion()"
              >
                <span class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-lg">clinical_notes</span>
                  Registrar atención
                </span>
                <span>→</span>
              </button>
            </div>
          </article>
        </div>

        <div class="mt-6 grid gap-6 lg:grid-cols-2">
          <article class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="font-bold text-navy">Rendimiento de la semana</h2>
            <p id="week-range" class="mt-1 text-xs text-slate-500">{{ weekStats().rangeLabel }}</p>
            <div class="mt-6 space-y-5">
              <div>
                <div class="flex justify-between text-xs">
                  <span>Atendidas</span>
                  <strong id="week-attended">{{ weekStats().attended }}</strong>
                </div>
                <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    id="week-attended-bar"
                    class="h-full rounded-full bg-green-600 transition-all"
                    [style.width.%]="weekStats().attendedPct"
                  ></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs">
                  <span>Confirmadas</span>
                  <strong id="week-confirmed">{{ weekStats().confirmed }}</strong>
                </div>
                <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    id="week-confirmed-bar"
                    class="h-full rounded-full bg-blue-600 transition-all"
                    [style.width.%]="weekStats().confirmedPct"
                  ></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs">
                  <span>Canceladas</span>
                  <strong id="week-cancelled">{{ weekStats().cancelled }}</strong>
                </div>
                <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    id="week-cancelled-bar"
                    class="h-full rounded-full bg-red-500 transition-all"
                    [style.width.%]="weekStats().cancelledPct"
                  ></div>
                </div>
              </div>
            </div>
          </article>

          <article class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between">
              <h2 class="font-bold text-navy">Pacientes recientes</h2>
              <button
                class="text-xs font-bold text-gold hover:underline"
                type="button"
                (click)="goToVista('patients')"
              >
                Ver todos
              </button>
            </div>
            <div id="doctor-recent-patients" class="mt-5 space-y-3">
              @for (item of recentPatients(); track item.pacienteEmail) {
                <div class="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                  <span class="grid h-9 w-9 place-items-center rounded-full bg-navy text-[10px] font-bold text-white">
                    {{ initials(item.pacienteNombre) }}
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-xs font-bold text-navy">{{ item.pacienteNombre }}</p>
                    <p class="mt-1 truncate text-[9px] text-slate-500">
                      {{ item.servicioNombre }} · {{ formatDate(item.fecha) }}
                    </p>
                  </div>
                </div>
              } @empty {
                <p class="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                  Aún no hay pacientes recientes.
                </p>
              }
            </div>
          </article>
        </div>
      </section>
    }

    @if (activeVista() === 'agenda') {
      <section
        id="agenda"
        data-dashboard-view
        class="mt-6 rounded-xl border border-slate-200 border-t-2 border-t-gold bg-white p-6 shadow-sm"
      >
        <div class="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <h2 class="font-bold text-navy">Mi agenda de citas</h2>
            <p class="mt-1 text-xs text-slate-500">
              Organiza tus atenciones por fecha, estado o paciente.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              id="block-time-button"
              class="rounded-lg border border-navy px-4 py-2.5 text-xs font-bold text-navy hover:bg-slate-50"
              type="button"
              (click)="openBlockModal()"
            >
              Bloquear horario
            </button>
            <span
              id="agenda-count"
              class="inline-flex items-center rounded-lg bg-gold-soft px-4 py-2.5 text-xs font-bold text-navy"
            >
              {{ visibleAgendaCitas().length }}
              {{ visibleAgendaCitas().length === 1 ? 'cita' : 'citas' }}
            </span>
          </div>
        </div>

        <div class="mb-5 grid gap-3 rounded-lg bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-[1fr_auto_auto]">
          <label class="relative">
            <span class="material-symbols-outlined absolute left-3 top-2.5 text-lg text-slate-400">
              search
            </span>
            <input
              id="agenda-search"
              class="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-xs"
              type="search"
              [value]="agendaSearch()"
              (input)="onAgendaSearch($event)"
              placeholder="Buscar paciente o tratamiento"
            />
          </label>
          <div class="flex rounded-lg border border-slate-300 bg-white p-1" role="group" aria-label="Vista de agenda">
            <button
              class="agenda-period rounded-md px-3 py-2 text-[10px] font-bold"
              [class.bg-navy]="agendaPeriod() === 'DAY'"
              [class.text-white]="agendaPeriod() === 'DAY'"
              type="button"
              (click)="agendaPeriod.set('DAY')"
            >
              Día
            </button>
            <button
              class="agenda-period rounded-md px-3 py-2 text-[10px] font-bold"
              [class.bg-navy]="agendaPeriod() === 'WEEK'"
              [class.text-white]="agendaPeriod() === 'WEEK'"
              type="button"
              (click)="agendaPeriod.set('WEEK')"
            >
              Semana
            </button>
            <button
              class="agenda-period rounded-md px-3 py-2 text-[10px] font-bold"
              [class.bg-navy]="agendaPeriod() === 'MONTH'"
              [class.text-white]="agendaPeriod() === 'MONTH'"
              type="button"
              (click)="agendaPeriod.set('MONTH')"
            >
              Mes
            </button>
          </div>
          <div class="flex gap-2">
            <input
              id="agenda-date"
              class="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs"
              type="date"
              [value]="agendaDate()"
              (change)="onAgendaDateChange($event)"
            />
            <select
              id="status-filter"
              class="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs"
              [value]="statusFilter()"
              (change)="onStatusFilterChange($event)"
            >
              <option value="ALL">Todos los estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="CONFIRMADA">Confirmadas</option>
              <option value="ATENDIDA">Atendidas</option>
              <option value="CANCELADA">Canceladas</option>
            </select>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[760px] text-left text-xs">
            <thead class="border-b border-slate-200 text-[9px] uppercase tracking-wider text-slate-400">
              <tr>
                <th class="px-3 py-3">Fecha</th>
                <th class="px-3 py-3">Paciente</th>
                <th class="px-3 py-3">Tratamiento</th>
                <th class="px-3 py-3">Contacto</th>
                <th class="px-3 py-3">Estado</th>
                <th class="px-3 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody id="doctor-appointments" class="divide-y divide-slate-100">
              @for (item of visibleAgendaCitas(); track item.id) {
                <tr>
                  <td class="px-3 py-4">
                    <strong class="block text-navy">{{ formatDate(item.fecha) }}</strong>
                    <span class="text-[10px] text-slate-500">{{ formatTime(item.horaInicio) }}</span>
                  </td>
                  <td class="px-3 py-4">
                    <strong>{{ item.pacienteNombre }}</strong>
                    <span class="mt-1 block text-[10px] text-slate-500">{{ item.pacienteEmail }}</span>
                  </td>
                  <td class="px-3 py-4">{{ item.servicioNombre }}</td>
                  <td class="px-3 py-4">{{ item.telefonoContacto || 'Sin teléfono' }}</td>
                  <td class="px-3 py-4">
                    <span
                      class="rounded-full px-2.5 py-1 text-[9px] font-bold"
                      [class]="statusClass(item.estado)"
                    >
                      {{ item.estado }}
                    </span>
                  </td>
                  <td class="px-3 py-4 text-right">
                    <div class="flex justify-end gap-2">
                      <button
                        class="rounded-md border border-slate-300 px-3 py-2 text-[10px] font-bold text-navy"
                        type="button"
                        (click)="detailModalCita.set(item)"
                      >
                        Detalle
                      </button>
                      @if (item.estado === 'PENDIENTE' || item.estado === 'CONFIRMADA') {
                        <button
                          class="rounded-md bg-red-50 px-3 py-2 text-[10px] font-bold text-red-700"
                          type="button"
                          (click)="cambiarEstado(item, 'CANCELADA')"
                        >
                          Cancelar
                        </button>
                      }
                      @if (item.estado === 'PENDIENTE') {
                        <button
                          class="rounded-md bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700"
                          type="button"
                          (click)="cambiarEstado(item, 'CONFIRMADA')"
                        >
                          Confirmar
                        </button>
                      }
                      @if (item.estado === 'CONFIRMADA') {
                        <button
                          class="rounded-md bg-green-50 px-3 py-2 text-[10px] font-bold text-green-700"
                          type="button"
                          (click)="openPatientRecordModal(item.pacienteEmail, item.id)"
                        >
                          Registrar atención
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (visibleAgendaCitas().length === 0) {
          <div id="doctor-empty" class="py-12 text-center">
            <span class="material-symbols-outlined text-5xl text-slate-300">event_busy</span>
            <h3 class="mt-3 font-bold text-navy">No hay citas en esta vista</h3>
            <p class="mt-2 text-xs text-slate-500">
              Las nuevas reservas asignadas a ti aparecerán aquí.
            </p>
          </div>
        }

        @if (bloqueos().length > 0) {
          <div id="blocked-schedule" class="mt-6 border-t border-slate-200 pt-5">
            <h3 class="text-xs font-bold text-navy">Horarios bloqueados</h3>
            <div id="blocked-schedule-list" class="mt-3 flex flex-wrap gap-2">
              @for (b of bloqueos(); track b.id) {
                <span class="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-[10px] text-red-700">
                  <strong>
                    {{ formatDate(b.fecha) }} · {{ formatTime(b.horaInicio) }}-{{ formatTime(b.horaFin) }}
                  </strong>
                  {{ b.motivo || 'Horario no disponible' }}
                  <button
                    class="grid h-5 w-5 place-items-center rounded-full hover:bg-red-100"
                    type="button"
                    aria-label="Eliminar bloqueo"
                    (click)="eliminarBloqueo(b.id)"
                  >
                    ×
                  </button>
                </span>
              }
            </div>
          </div>
        }
      </section>
    }

    @if (activeVista() === 'patients') {
      <section
        id="patients"
        data-dashboard-view
        class="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 class="font-bold text-navy">Pacientes asignados</h2>
            <p class="mt-1 text-xs text-slate-500">Busca por nombre, correo o tratamiento.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <div class="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
              <button
                type="button"
                class="rounded-md px-3 py-1.5 font-bold transition"
                [class]="patientStatusFilter() === 'ALL' ? 'bg-navy text-white shadow-sm' : 'text-slate-600 hover:text-navy'"
                (click)="patientStatusFilter.set('ALL')"
              >
                Todos
              </button>
              <button
                type="button"
                class="rounded-md px-3 py-1.5 font-bold transition"
                [class]="patientStatusFilter() === 'ACTIVE' ? 'bg-navy text-white shadow-sm' : 'text-slate-600 hover:text-navy'"
                (click)="patientStatusFilter.set('ACTIVE')"
              >
                En tratamiento
              </button>
              <button
                type="button"
                class="rounded-md px-3 py-1.5 font-bold transition"
                [class]="patientStatusFilter() === 'COMPLETED' ? 'bg-navy text-white shadow-sm' : 'text-slate-600 hover:text-navy'"
                (click)="patientStatusFilter.set('COMPLETED')"
              >
                Completados
              </button>
            </div>
            <label class="relative">
              <span class="material-symbols-outlined absolute left-3 top-2.5 text-lg text-slate-400">
                search
              </span>
              <input
                id="doctor-patient-search"
                class="h-10 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-xs sm:w-64"
                type="search"
                [value]="patientSearch()"
                (input)="onPatientSearch($event)"
                placeholder="Buscar paciente o tratamiento"
              />
            </label>
          </div>
        </div>

        <div id="patient-list" class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          @for (pat of assignedPatients(); track pat.patientEmail) {
            <article class="relative rounded-xl border border-slate-200 p-5 transition hover:border-gold hover:shadow-sm">
              <div class="flex items-start gap-3">
                <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-white">
                  {{ initials(pat.patientName) }}
                </span>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <strong class="block truncate text-xs text-navy">{{ pat.patientName }}</strong>
                    @if (pat.isCompleted) {
                      <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                        <span class="material-symbols-outlined text-[12px]">check_circle</span>
                        Alta
                      </span>
                    } @else {
                      <span class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                        <span class="material-symbols-outlined text-[12px]">sync</span>
                        En curso
                      </span>
                    }
                  </div>
                  <span class="mt-0.5 block truncate text-[11px] font-semibold text-gold">
                    {{ pat.treatmentName }}
                  </span>
                  <span class="mt-0.5 block truncate text-[10px] text-slate-500">
                    {{ pat.patientEmail }} · {{ pat.phone || 'Sin teléfono' }}
                  </span>
                </div>
              </div>
              <dl class="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-3 text-[10px]">
                <div>
                  <dt class="text-slate-400">Progreso</dt>
                  <dd class="mt-1 font-bold text-navy">{{ pat.sessionProgress }}</dd>
                </div>
                <div>
                  <dt class="text-slate-400">Última visita</dt>
                  <dd class="mt-1 font-bold text-navy">
                    {{ pat.lastVisitDate ? formatDate(pat.lastVisitDate) : 'Sin registro' }}
                  </dd>
                </div>
                <div class="col-span-2">
                  <dt class="text-slate-400">Próxima cita</dt>
                  <dd class="mt-1 font-bold text-navy">
                    @if (pat.upcomingVisit; as up) {
                      {{ formatDate(up.fecha) }} · {{ formatTime(up.horaInicio) }}
                    } @else if (pat.isCompleted) {
                      <span class="text-emerald-700 font-semibold">Tratamiento finalizado</span>
                    } @else {
                      <span class="text-slate-400">Pendiente de agendar</span>
                    }
                  </dd>
                </div>
              </dl>
              <button
                class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-[10px] font-bold text-navy hover:bg-gold-soft transition"
                type="button"
                (click)="openPatientRecordModal(pat.patientEmail, null)"
              >
                <span class="material-symbols-outlined text-base">clinical_notes</span>
                Ver expediente
              </button>
            </article>
          } @empty {
            <p class="text-xs text-slate-500">
              {{
                patientSearch().trim()
                  ? 'No se encontraron pacientes con esa búsqueda.'
                  : 'No hay pacientes con el filtro seleccionado.'
              }}
            </p>
          }
        </div>
      </section>
    }

    @if (detailModalCita(); as item) {
      <div
        id="appointment-detail-modal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-navy/75 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-detail-title"
        (click)="onBackdropClose($event, 'appointment-detail-modal')"
      >
        <div class="relative w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl">
          <button
            class="absolute right-4 top-4 text-slate-500"
            type="button"
            aria-label="Cerrar"
            (click)="detailModalCita.set(null)"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
          <h2 id="appointment-detail-title" class="text-xl font-bold text-navy">
            Detalle de la cita
          </h2>
          <div id="appointment-detail-content" class="mt-6">
            <div class="grid gap-4 rounded-xl bg-slate-50 p-5 sm:grid-cols-2">
              <div>
                <span class="text-[10px] uppercase text-slate-400">Paciente</span>
                <strong class="mt-1 block text-sm text-navy">{{ item.pacienteNombre }}</strong>
                <span class="text-xs text-slate-500">{{ item.pacienteEmail }}</span>
              </div>
              <div>
                <span class="text-[10px] uppercase text-slate-400">Contacto</span>
                <strong class="mt-1 block text-sm text-navy">
                  {{ item.telefonoContacto || 'Sin teléfono' }}
                </strong>
              </div>
              <div>
                <span class="text-[10px] uppercase text-slate-400">Fecha y hora</span>
                <strong class="mt-1 block text-sm text-navy">
                  {{ formatDate(item.fecha) }} · {{ formatTime(item.horaInicio) }}
                </strong>
              </div>
              <div>
                <span class="text-[10px] uppercase text-slate-400">Tratamiento</span>
                <strong class="mt-1 block text-sm text-navy">{{ item.servicioNombre }}</strong>
              </div>
              <div class="sm:col-span-2">
                <span class="text-[10px] uppercase text-slate-400">Motivo o notas</span>
                <p class="mt-1 text-xs text-slate-600">
                  {{ item.motivo || 'Sin notas adicionales' }}
                </p>
              </div>
            </div>
          </div>
          <div id="appointment-detail-actions" class="mt-6 flex flex-wrap justify-end gap-3">
            <button
              class="rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-bold text-navy"
              type="button"
              (click)="detailModalCita.set(null)"
            >
              Cerrar
            </button>
            @if (item.estado === 'PENDIENTE' || item.estado === 'CONFIRMADA') {
              <button
                class="rounded-lg bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700"
                type="button"
                (click)="cambiarEstadoDesdeModal(item, 'CANCELADA')"
              >
                Cancelar cita
              </button>
            }
            @if (item.estado === 'PENDIENTE') {
              <button
                class="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white"
                type="button"
                (click)="cambiarEstadoDesdeModal(item, 'CONFIRMADA')"
              >
                Confirmar cita
              </button>
            }
            @if (item.estado === 'CONFIRMADA') {
              <button
                class="rounded-lg bg-green-700 px-4 py-2.5 text-xs font-bold text-white"
                type="button"
                (click)="abrirExpedienteDesdeModal(item)"
              >
                Registrar atención
              </button>
            }
          </div>
        </div>
      </div>
    }

    @if (activeRecordPatient(); as pat) {
      <div
        id="patient-record-modal"
        class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/75 p-3 sm:p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-record-title"
        (click)="onBackdropClose($event, 'patient-record-modal')"
      >
        <div class="relative my-4 sm:my-8 w-full max-w-3xl rounded-2xl bg-white p-5 sm:p-7 shadow-2xl">
          <button
            class="absolute right-4 top-4 text-slate-500"
            type="button"
            aria-label="Cerrar"
            (click)="activeRecordPatient.set(null)"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
          <h2 id="patient-record-title" class="text-xl font-bold text-navy">
            Expediente del paciente
          </h2>
          <div id="patient-record-profile" class="mt-5">
            <div class="flex flex-col gap-4 rounded-xl bg-slate-50 p-5 sm:flex-row sm:items-center">
              <span class="grid h-14 w-14 place-items-center rounded-full bg-navy font-bold text-white">
                {{ initials(pat.patientName) }}
              </span>
              <div class="flex-1">
                <strong class="text-base text-navy">{{ pat.patientName }}</strong>
                <p class="mt-1 text-xs text-slate-500">
                  {{ pat.patientEmail }} · {{ pat.phone || 'Sin teléfono' }}
                </p>
              </div>
              <span class="inline-flex w-fit items-center rounded-full bg-gold-soft px-3 py-1 text-[10px] font-bold text-navy">
                {{ pat.visits.length }} {{ pat.visits.length === 1 ? 'cita' : 'citas' }}
              </span>
            </div>
          </div>

          <div id="patient-record-history" class="mt-6">
            <h3 class="text-xs font-bold text-navy">Historial de citas</h3>
            <div class="mt-3 max-h-44 space-y-2 overflow-y-auto">
              @for (visit of pat.visits; track visit.id) {
                <div class="grid grid-cols-[1fr_auto] gap-3 rounded-lg border border-slate-200 p-3 text-xs">
                  <div>
                    <strong class="text-navy">{{ visit.servicioNombre }}</strong>
                    <p class="mt-1 text-[10px] text-slate-500">
                      {{ formatDate(visit.fecha) }} · {{ formatTime(visit.horaInicio) }}
                    </p>
                  </div>
                  <span
                    class="self-center rounded-full px-2 py-1 text-[9px] font-bold"
                    [class]="statusClass(visit.estado)"
                  >
                    {{ visit.estado }}
                  </span>
                </div>
              }
            </div>
          </div>

          <form
            id="clinical-record-form"
            [formGroup]="historiaForm"
            (ngSubmit)="guardarAtencion()"
            class="mt-6 grid gap-4 border-t border-slate-200 pt-6 md:grid-cols-2"
            novalidate
          >
            @if (activeMultiSessionInfo(); as info) {
              <div class="col-span-full rounded-xl border border-gold/60 bg-amber-50/80 p-4">
                <div class="flex items-start gap-3">
                  <span class="material-symbols-outlined text-xl text-gold shrink-0 mt-0.5">info</span>
                  <div class="text-xs">
                    <strong class="font-bold text-navy">
                      Atención de Tratamiento en Curso: Sesión {{ info.numeroSesion }} de {{ info.totalSesiones }}
                    </strong>
                    <p class="mt-1 text-slate-600 leading-relaxed">
                      {{ info.servicioNombre }} · Recuerda ingresar la fecha del <strong>Próximo control</strong> para que el paciente pueda agendar la <strong>Sesión {{ info.numeroSesion + 1 }}</strong> en su panel.
                    </p>
                  </div>
                </div>
              </div>
            } @else if (isFinalSessionOrSingle()) {
              <div class="col-span-full rounded-xl border border-emerald-300 bg-emerald-50/80 p-4">
                <div class="flex items-start gap-3">
                  <span class="material-symbols-outlined text-xl text-emerald-600 shrink-0 mt-0.5">check_circle</span>
                  <div class="text-xs">
                    <strong class="font-bold text-emerald-950">
                      Sesión Final / Conclusión de Tratamiento
                    </strong>
                    <p class="mt-1 text-emerald-800 leading-relaxed">
                      Esta es la última sesión del tratamiento. El campo <strong>Próximo control</strong> es opcional (no requiere agendar sesión posterior a menos que requiera un control preventivo futuro).
                    </p>
                  </div>
                </div>
              </div>
            }

            <label class="text-xs font-semibold text-slate-700">
              Etapa del tratamiento
              <select
                id="record-stage"
                formControlName="etapaTratamiento"
                class="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="CONSULTA">Consulta inicial</option>
                <option value="DIAGNOSTICO">Diagnóstico y planificación</option>
                <option value="TRATAMIENTO">Tratamiento en curso</option>
                <option value="COMPLETADO">Control final y alta</option>
              </select>
            </label>
            <label class="text-xs font-semibold text-slate-700">
              Próximo control
              <span class="text-[10px] font-normal text-slate-500">
                {{ isFinalSessionOrSingle() ? '(Opcional / Alta)' : '(Requerido para siguiente sesión)' }}
              </span>
              <input
                id="record-next-control"
                formControlName="proximoControl"
                class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
                type="date"
              />
              <sd-field-error [control]="historiaForm.controls.proximoControl" />
            </label>
            <label class="text-xs font-semibold text-slate-700">
              Alergias y antecedentes
              <textarea
                id="record-allergies"
                formControlName="alergias"
                class="mt-2 min-h-24 w-full rounded-lg border border-slate-300 p-3 text-sm"
                placeholder="Sin antecedentes registrados"
              ></textarea>
            </label>
            <label class="text-xs font-semibold text-slate-700">
              Diagnóstico
              <textarea
                id="record-diagnosis"
                formControlName="diagnostico"
                class="mt-2 min-h-24 w-full rounded-lg border border-slate-300 p-3 text-sm"
              ></textarea>
              <sd-field-error [control]="historiaForm.controls.diagnostico" />
            </label>
            <label class="text-xs font-semibold text-slate-700">
              Tratamiento realizado
              <textarea
                id="record-treatment"
                formControlName="tratamiento"
                class="mt-2 min-h-24 w-full rounded-lg border border-slate-300 p-3 text-sm"
              ></textarea>
              <sd-field-error [control]="historiaForm.controls.tratamiento" />
            </label>
            <label class="text-xs font-semibold text-slate-700">
              Indicaciones y receta
              <textarea
                id="record-instructions"
                formControlName="indicaciones"
                class="mt-2 min-h-24 w-full rounded-lg border border-slate-300 p-3 text-sm"
              ></textarea>
            </label>
            <label class="text-xs font-semibold text-slate-700 md:col-span-2">
              Observaciones
              <input
                id="record-notes"
                formControlName="observaciones"
                class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
                type="text"
              />
            </label>
            <div class="md:col-span-2">
              @if (recordMessage(); as msg) {
                <p
                  id="record-message"
                  class="mb-3 rounded-lg p-3 text-xs"
                  [class]="recordError() ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'"
                  role="status"
                >
                  {{ msg }}
                </p>
              }
              <button
                class="rounded-lg bg-navy px-5 py-3 text-xs font-bold text-white disabled:opacity-60"
                type="submit"
                [disabled]="savingHistoria()"
              >
                {{ savingHistoria() ? 'Guardando...' : 'Guardar atención clínica' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (blockModalOpen()) {
      <div
        id="block-time-modal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-navy/75 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="block-time-title"
        (click)="onBackdropClose($event, 'block-time-modal')"
      >
        <form
          id="block-time-form"
          [formGroup]="blockForm"
          (ngSubmit)="guardarBloqueo()"
          class="relative w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl"
          novalidate
        >
          <button
            class="absolute right-4 top-4 text-slate-500"
            type="button"
            aria-label="Cerrar"
            (click)="blockModalOpen.set(false)"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
          <h2 id="block-time-title" class="text-xl font-bold text-navy">Bloquear horario</h2>
          <p class="mt-2 text-xs text-slate-500">
            Evita que se asignen nuevas citas durante un periodo no disponible.
          </p>
          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <label class="text-xs font-semibold sm:col-span-2">
              Fecha
              <input
                id="block-date"
                formControlName="fecha"
                class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
                type="date"
              />
              <sd-field-error [control]="blockForm.controls.fecha" />
            </label>
            <label class="text-xs font-semibold">
              Desde
              <input
                id="block-time"
                formControlName="horaInicio"
                (change)="onBlockStartChange()"
                class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
                type="time"
                min="09:00"
                max="17:30"
                step="1800"
              />
            </label>
            <label class="text-xs font-semibold">
              Hasta
              <input
                id="block-end-time"
                formControlName="horaFin"
                class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
                type="time"
                min="09:30"
                max="18:00"
                step="1800"
              />
            </label>
            <label class="text-xs font-semibold sm:col-span-2">
              Motivo
              <input
                id="block-reason"
                formControlName="motivo"
                class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
                type="text"
                maxlength="120"
                placeholder="Reunión, descanso, capacitación..."
              />
              <sd-field-error [control]="blockForm.controls.motivo" />
            </label>
          </div>
          @if (blockFormError(); as err) {
            <p id="block-form-error" class="mt-5 rounded-lg bg-red-50 p-3 text-xs text-red-700">
              {{ err }}
            </p>
          }
          <button
            id="block-submit"
            class="mt-6 w-full rounded-lg bg-navy px-5 py-3 text-xs font-bold text-white disabled:opacity-60"
            type="submit"
            [disabled]="savingBlock()"
          >
            {{ savingBlock() ? 'Guardando...' : 'Guardar bloqueo' }}
          </button>
        </form>
      </div>
    }
  `,
})
export class OdontologoAgendaComponent implements OnInit {
  private readonly api = inject(SmartDentApiService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly authStore = inject(AuthStore);
  private readonly notificationStore = inject(NotificationStore);
  private readonly toastStore = inject(ToastStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly citas = signal<readonly CitaResponse[]>([]);
  protected readonly bloqueos = signal<readonly BloqueoHorarioResponse[]>([]);

  protected readonly agendaSearch = signal<string>('');
  protected readonly agendaPeriod = signal<AgendaPeriod>('WEEK');
  protected readonly agendaDate = signal<string>(this.defaultWorkingAgendaDate());
  protected readonly statusFilter = signal<string>('ALL');
  protected readonly patientSearch = signal<string>('');
  protected readonly patientStatusFilter = signal<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  private preserveFiltersOnNextAgendaNav = false;

  constructor() {
    effect(() => {
      const incoming = this.notificationStore.incomingEvent();
      if (incoming) {
        this.cargarDatos();
      }
    });
  }

  protected readonly detailModalCita = signal<CitaResponse | null>(null);
  protected readonly activeRecordPatient = signal<AssignedPatientCard | null>(null);
  protected readonly activeRecordCitaId = signal<number | null>(null);

  protected readonly activeMultiSessionInfo = computed<CitaResponse | null>(() => {
    const cId = this.activeRecordCitaId();
    if (!cId) return null;
    const c = this.citas().find((item) => item.id === cId);
    if (c && c.totalSesiones > 1 && c.numeroSesion < c.totalSesiones) {
      return c;
    }
    return null;
  });

  protected readonly isFinalSessionOrSingle = computed<boolean>(() => {
    const cId = this.activeRecordCitaId();
    if (!cId) return false;
    const c = this.citas().find((item) => item.id === cId);
    if (!c) return false;
    return c.totalSesiones <= 1 || c.numeroSesion >= c.totalSesiones;
  });

  protected readonly savingHistoria = signal<boolean>(false);
  protected readonly recordMessage = signal<string | null>(null);
  protected readonly recordError = signal<boolean>(false);

  protected readonly blockModalOpen = signal<boolean>(false);
  protected readonly savingBlock = signal<boolean>(false);
  protected readonly blockFormError = signal<string | null>(null);

  private readonly rawVista = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('vista'))),
    { initialValue: null }
  );

  protected readonly activeVista = computed<string>(() => this.rawVista() ?? 'summary');

  protected readonly doctorSpecialty = computed<string>(() => {
    const rawName = (this.authStore.userName() ?? '')
      .toLowerCase()
      .replace(/^dr(a)?\.\s*/i, '')
      .trim();
    const known: Record<string, string> = {
      'carlos mendoza': 'Implantología y Cirugía Oral',
      'elena ruiz': 'Estética y Ortodoncia',
      'miguel silva': 'Endodoncia Microscópica',
      'lucía torres': 'Periodoncia y Odontopediatría',
      'lucia torres': 'Periodoncia y Odontopediatría',
    };
    return known[rawName] ?? 'Odontología Especializada';
  });

  protected readonly pendingCount = computed<number>(
    () => this.citas().filter((c) => c.estado === 'PENDIENTE').length
  );
  protected readonly confirmedCount = computed<number>(
    () => this.citas().filter((c) => c.estado === 'CONFIRMADA').length
  );
  protected readonly attendedCount = computed<number>(
    () => this.citas().filter((c) => c.estado === 'ATENDIDA').length
  );

  protected readonly nextAppointment = computed<CitaResponse | undefined>(() => {
    const now = new Date();
    return this.citas()
      .filter((c) => !['CANCELADA', 'ATENDIDA'].includes(c.estado))
      .find((c) => new Date(`${c.fecha}T${c.horaInicio}`) >= now);
  });

  protected readonly todayAppointments = computed<readonly CitaResponse[]>(() => {
    const today = this.localDateValue(new Date());
    return this.citas().filter((c) => c.fecha === today && c.estado !== 'CANCELADA');
  });

  protected readonly todayLongLabel = computed<string>(() =>
    new Intl.DateTimeFormat('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date())
  );

  protected readonly doctorAlerts = computed<readonly DoctorAlertItem[]>(() => {
    const pending = this.pendingCount();
    const confirmedToday = this.todayAppointments().filter(
      (c) => c.estado === 'CONFIRMADA'
    ).length;
    return [
      {
        icon: 'pending_actions',
        label: `${pending} ${pending === 1 ? 'cita pendiente' : 'citas pendientes'} de confirmar`,
        tone: pending ? 'text-amber-700 bg-amber-50' : 'text-slate-500 bg-slate-50',
      },
      {
        icon: 'event_available',
        label: `${confirmedToday} ${confirmedToday === 1 ? 'atención confirmada' : 'atenciones confirmadas'} para hoy`,
        tone: confirmedToday ? 'text-blue-700 bg-blue-50' : 'text-slate-500 bg-slate-50',
      },
    ];
  });

  protected readonly weekStats = computed(() => {
    const now = new Date();
    if (now.getDay() === 0) {
      now.setDate(now.getDate() + 1);
    }
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const weekly = this.citas().filter((item) => {
      const dt = new Date(`${item.fecha}T${item.horaInicio}`);
      return dt >= start && dt <= end;
    });
    const attended = weekly.filter((c) => c.estado === 'ATENDIDA').length;
    const confirmed = weekly.filter((c) => c.estado === 'CONFIRMADA').length;
    const cancelled = weekly.filter((c) => c.estado === 'CANCELADA').length;
    const max = Math.max(1, weekly.length);

    return {
      rangeLabel: `${this.formatDate(this.localDateValue(start))} – ${this.formatDate(
        this.localDateValue(end)
      )}`,
      attended,
      confirmed,
      cancelled,
      attendedPct: Math.round((attended / max) * 100),
      confirmedPct: Math.round((confirmed / max) * 100),
      cancelledPct: Math.round((cancelled / max) * 100),
    };
  });

  protected readonly recentPatients = computed<readonly CitaResponse[]>(() => {
    const list: CitaResponse[] = [];
    const seen = new Set<string>();
    [...this.citas()].reverse().forEach((item) => {
      if (!seen.has(item.pacienteEmail) && list.length < 4) {
        seen.add(item.pacienteEmail);
        list.push(item);
      }
    });
    return list;
  });

  protected readonly visibleAgendaCitas = computed<readonly CitaResponse[]>(() => {
    const term = this.agendaSearch().trim().toLowerCase();
    const status = this.statusFilter();
    const dateVal = this.agendaDate();
    const period = this.agendaPeriod();

    return this.citas().filter((item) => {
      const matchesStatus = status === 'ALL' || item.estado === status;
      const matchesTerm = [
        item.pacienteNombre,
        item.pacienteEmail,
        item.servicioNombre,
        item.telefonoContacto,
      ].some((v) =>
        String(v || '')
          .toLowerCase()
          .includes(term)
      );
      return (
        matchesStatus &&
        matchesTerm &&
        this.dateMatchesPeriod(item.fecha, dateVal, period)
      );
    });
  });

  protected readonly assignedPatients = computed<readonly AssignedPatientCard[]>(() => {
    const term = this.patientSearch().trim().toLowerCase();
    const now = new Date();
    const emails = [...new Set(this.citas().map((c) => c.pacienteEmail))];

    return emails
      .map((email) => {
        const visits = this.citas().filter((c) => c.pacienteEmail === email);
        const latest = visits[visits.length - 1]!;
        const attended = visits.filter((c) => c.estado === 'ATENDIDA');
        const upcoming = visits.find(
          (c) =>
            !['ATENDIDA', 'CANCELADA'].includes(c.estado) &&
            new Date(`${c.fecha}T${c.horaInicio}`) >= now
        );

        // Determinación de si el paciente concluyó su plan de atención
        const maxTotalSesiones = Math.max(...visits.map((v) => v.totalSesiones || 1));
        const maxSesionAtendida = Math.max(...attended.map((v) => v.numeroSesion || 1), 0);
        const isCompleted = maxSesionAtendida >= maxTotalSesiones && !upcoming;
        const sessionProgress = `${Math.min(maxSesionAtendida, maxTotalSesiones)}/${maxTotalSesiones} sesiones`;

        return {
          patientName: latest.pacienteNombre,
          patientEmail: latest.pacienteEmail,
          phone: latest.telefonoContacto,
          visitsCount: visits.length,
          attendedCount: attended.length,
          lastVisitDate: attended[attended.length - 1]?.fecha ?? null,
          upcomingVisit: upcoming,
          treatmentName: latest.servicioNombre,
          isCompleted,
          sessionProgress,
          visits: [...visits].reverse(),
        };
      })
      .filter((item) => {
        const matchesTerm = [item.patientName, item.patientEmail, item.phone, item.treatmentName].some((v) =>
          String(v || '')
            .toLowerCase()
            .includes(term)
        );
        const filter = this.patientStatusFilter();
        const matchesStatus =
          filter === 'ALL' ||
          (filter === 'COMPLETED' && item.isCompleted) ||
          (filter === 'ACTIVE' && !item.isCompleted);

        return matchesTerm && matchesStatus;
      });
  });

  protected readonly historiaForm = this.fb.group({
    etapaTratamiento: ['CONSULTA' as EtapaTratamiento, [Validators.required]],
    alergias: ['', [Validators.maxLength(1500)]],
    diagnostico: ['', [Validators.required, Validators.maxLength(2500)]],
    tratamiento: ['', [Validators.required, Validators.maxLength(2500)]],
    indicaciones: ['', [Validators.maxLength(2500)]],
    proximoControl: ['', [SmartDentValidators.fechaLaborable(true)]],
    observaciones: ['', [Validators.maxLength(1500)]],
  });

  protected readonly blockForm = this.fb.group({
    fecha: [
      this.localDateValue(new Date()),
      [Validators.required, SmartDentValidators.fechaLaborable(false)],
    ],
    horaInicio: ['09:00', [Validators.required]],
    horaFin: ['09:30', [Validators.required]],
    motivo: ['', [Validators.required, Validators.maxLength(120)]],
  });

  ngOnInit(): void {
    this.cargarDatos();
    this.route.queryParamMap.subscribe((params) => {
      const vista = params.get('vista') ?? 'summary';
      if (vista === 'agenda') {
        if (this.preserveFiltersOnNextAgendaNav) {
          this.preserveFiltersOnNextAgendaNav = false;
        } else {
          this.statusFilter.set('ALL');
          this.agendaSearch.set('');
          this.syncAgendaDateWithAppointments(this.citas());
        }
      } else if (vista === 'patients') {
        this.patientSearch.set('');
        if (typeof document !== 'undefined') {
          setTimeout(() => {
            document
              .querySelector<HTMLInputElement>('#doctor-patient-search')
              ?.focus({ preventScroll: true });
          }, 100);
        }
      }
    });
  }

  private cargarDatos(): void {
    forkJoin({
      citas: this.api.listarMiAgendaOdontologo(),
      bloqueos: this.api.listarMisBloqueos(),
    }).subscribe({
      next: ({ citas, bloqueos }) => {
        const sortedCitas = [...citas].sort((a, b) =>
          `${a.fecha}T${a.horaInicio}`.localeCompare(`${b.fecha}T${b.horaInicio}`)
        );
        const sortedBloqueos = [...bloqueos].sort((a, b) =>
          `${a.fecha}T${a.horaInicio}`.localeCompare(`${b.fecha}T${b.horaInicio}`)
        );
        this.citas.set(sortedCitas);
        this.bloqueos.set(sortedBloqueos);
        this.syncAgendaDateWithAppointments(sortedCitas);
      },
      error: (err: unknown) => this.toastStore.error(extractApiErrorMessage(err)),
    });
  }

  private syncAgendaDateWithAppointments(citas: readonly CitaResponse[]): void {
    if (citas.length === 0) return;
    const currentDate = this.agendaDate();
    const currentPeriod = this.agendaPeriod();
    const hasMatchInCurrentPeriod = citas.some((item) =>
      this.dateMatchesPeriod(item.fecha, currentDate, currentPeriod)
    );
    if (!hasMatchInCurrentPeriod) {
      const now = new Date();
      const nextActive = citas.find(
        (c) =>
          !['CANCELADA', 'ATENDIDA'].includes(c.estado) &&
          new Date(`${c.fecha}T${c.horaInicio}`) >= now
      );
      const fallback = nextActive ?? citas[citas.length - 1];
      if (fallback) {
        this.agendaDate.set(fallback.fecha.slice(0, 10));
      }
    }
  }

  protected goToVista(vista: string): void {
    if (vista === 'agenda') {
      this.statusFilter.set('ALL');
      this.agendaSearch.set('');
      this.syncAgendaDateWithAppointments(this.citas());
    } else if (vista === 'patients') {
      this.patientSearch.set('');
    }
    void this.router.navigate(['/odontologo'], { queryParams: { vista } });
  }

  protected irARegistrarAtencion(): void {
    this.agendaSearch.set('');
    const confirmed = this.citas().filter((c) => c.estado === 'CONFIRMADA');
    const pending = this.citas().filter((c) => c.estado === 'PENDIENTE');

    if (confirmed.length > 0) {
      this.statusFilter.set('CONFIRMADA');
      const target =
        confirmed.find((c) => new Date(`${c.fecha}T${c.horaInicio}`) >= new Date()) ??
        confirmed[0]!;
      this.agendaDate.set(target.fecha.slice(0, 10));
    } else if (pending.length > 0) {
      this.statusFilter.set('ALL');
      const target =
        pending.find((c) => new Date(`${c.fecha}T${c.horaInicio}`) >= new Date()) ??
        pending[0]!;
      this.agendaDate.set(target.fecha.slice(0, 10));
      this.toastStore.info(
        'Confirma primero la cita pendiente para habilitar el botón "Registrar atención".'
      );
    } else {
      this.statusFilter.set('ALL');
      this.syncAgendaDateWithAppointments(this.citas());
    }

    this.preserveFiltersOnNextAgendaNav = true;
    void this.router.navigate(['/odontologo'], { queryParams: { vista: 'agenda' } });
  }

  protected onAgendaSearch(event: Event): void {
    this.agendaSearch.set((event.target as HTMLInputElement).value);
  }

  protected onAgendaDateChange(event: Event): void {
    this.agendaDate.set((event.target as HTMLInputElement).value);
  }

  protected onStatusFilterChange(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
  }

  protected onPatientSearch(event: Event): void {
    this.patientSearch.set((event.target as HTMLInputElement).value);
  }

  protected cambiarEstado(cita: CitaResponse, estado: CitaEstado): void {
    this.api.cambiarEstadoCitaOdontologo(cita.id, estado).subscribe({
      next: () => {
        this.toastStore.success(`Cita ${cita.codigo} actualizada a ${estado}.`);
        this.cargarDatos();
        this.notificationStore.refresh(false);
      },
      error: (err: unknown) => this.toastStore.error(extractApiErrorMessage(err)),
    });
  }

  protected cambiarEstadoDesdeModal(cita: CitaResponse, estado: CitaEstado): void {
    this.detailModalCita.set(null);
    this.cambiarEstado(cita, estado);
  }

  protected abrirExpedienteDesdeModal(cita: CitaResponse): void {
    this.detailModalCita.set(null);
    this.openPatientRecordModal(cita.pacienteEmail, cita.id);
  }

  protected openPatientRecordModal(email: string, citaId: number | null): void {
    const visits = this.citas().filter((c) => c.pacienteEmail === email);
    const latest = visits[visits.length - 1];
    if (!latest) return;

    this.activeRecordCitaId.set(citaId);
    this.recordMessage.set(null);
    this.recordError.set(false);
    this.activeRecordPatient.set({
      patientName: latest.pacienteNombre,
      patientEmail: latest.pacienteEmail,
      phone: latest.telefonoContacto,
      visitsCount: visits.length,
      attendedCount: visits.filter((v) => v.estado === 'ATENDIDA').length,
      lastVisitDate: null,
      upcomingVisit: undefined,
      treatmentName: latest.servicioNombre,
      isCompleted: false,
      sessionProgress: '',
      visits: [...visits].reverse(),
    });

    this.historiaForm.reset({
      etapaTratamiento: 'CONSULTA',
      alergias: '',
      diagnostico: '',
      tratamiento: '',
      indicaciones: '',
      proximoControl: '',
      observaciones: '',
    });

    this.api.consultarHistoriaPaciente(email).subscribe({
      next: (hc) => {
        const isFinal = this.isFinalSessionOrSingle();
        this.historiaForm.patchValue({
          etapaTratamiento:
            hc.etapaTratamiento ||
            (isFinal ? 'COMPLETADO' : hc.tratamiento ? 'TRATAMIENTO' : hc.diagnostico ? 'DIAGNOSTICO' : 'CONSULTA'),
          alergias: hc.alergias ?? '',
          diagnostico: hc.diagnostico ?? '',
          tratamiento: hc.tratamiento ?? '',
          indicaciones: hc.indicaciones ?? '',
          // Si es la sesión final o alta, no arrastrar la fecha anterior
          proximoControl: isFinal ? '' : (hc.proximoControl ?? ''),
          observaciones: hc.observaciones ?? '',
        });
      },
    });
  }

  protected guardarAtencion(): void {
    const pat = this.activeRecordPatient();
    if (!pat || this.historiaForm.invalid) {
      this.historiaForm.markAllAsTouched();
      return;
    }

    const raw = this.historiaForm.getRawValue();
    const multiInfo = this.activeMultiSessionInfo();

    // Alerta preventiva si es multi-sesión y no se especificó próximo control o la etapa quedó rezagada
    if (multiInfo) {
      const nextSession = multiInfo.numeroSesion + 1;
      const controlVacio = !raw.proximoControl.trim();
      const etapaIncompleta = raw.etapaTratamiento === 'CONSULTA';

      if (controlVacio || etapaIncompleta) {
        let motivoAlerta = '';
        if (controlVacio && etapaIncompleta) {
          motivoAlerta = `no has establecido la fecha de "Próximo control" ni avanzado la etapa de tratamiento.`;
        } else if (controlVacio) {
          motivoAlerta = `no has establecido la fecha de "Próximo control" para la Sesión ${nextSession}.`;
        } else {
          motivoAlerta = `la etapa de tratamiento aún figura como "Consulta inicial".`;
        }

        const proceed = window.confirm(
          `Advertencia clínica:\n\n` +
          `Esta atención corresponde a la Sesión ${multiInfo.numeroSesion} de ${multiInfo.totalSesiones} (${multiInfo.servicioNombre}), pero ${motivoAlerta}\n\n` +
          `Sin la fecha de próximo control, el paciente no recibirá la recomendación para agendar su siguiente sesión.\n\n` +
          `¿Deseas guardar de todos modos?`
        );

        if (!proceed) {
          return;
        }
      }
    }

    this.savingHistoria.set(true);
    this.recordMessage.set(null);
    this.recordError.set(false);
    const citaId = this.activeRecordCitaId();

    this.api
      .guardarHistoriaPaciente(pat.patientEmail, {
        citaId,
        etapaTratamiento: raw.etapaTratamiento,
        alergias: raw.alergias.trim(),
        diagnostico: raw.diagnostico.trim(),
        tratamiento: raw.tratamiento.trim(),
        indicaciones: raw.indicaciones.trim(),
        proximoControl: raw.proximoControl.trim() ? raw.proximoControl.trim() : null,
        observaciones: raw.observaciones.trim(),
      })
      .subscribe({
        next: () => {
          this.savingHistoria.set(false);
          this.activeRecordCitaId.set(null);
          this.activeRecordPatient.set(null);
          this.toastStore.success(
            citaId
              ? 'Atención guardada y cita marcada como atendida.'
              : 'Expediente clínico actualizado correctamente.'
          );
          this.cargarDatos();
          this.notificationStore.refresh(false);
        },
        error: (err: unknown) => {
          this.savingHistoria.set(false);
          this.recordError.set(true);
          this.recordMessage.set(applyServerValidationErrors(this.historiaForm, err));
        },
      });
  }

  protected openBlockModal(): void {
    this.blockFormError.set(null);
    this.blockForm.reset({
      fecha: this.localDateValue(new Date()),
      horaInicio: '09:00',
      horaFin: '09:30',
      motivo: '',
    });
    this.blockModalOpen.set(true);
  }

  protected onBlockStartChange(): void {
    const val = this.blockForm.controls.horaInicio.value;
    if (!val) return;
    const [h, m] = val.split(':').map(Number);
    const end = new Date(2026, 0, 1, h || 0, (m || 0) + 30);
    this.blockForm.controls.horaFin.setValue(
      `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
    );
  }

  protected guardarBloqueo(): void {
    this.blockFormError.set(null);
    if (this.blockForm.invalid) {
      this.blockForm.markAllAsTouched();
      return;
    }
    this.savingBlock.set(true);
    const raw = this.blockForm.getRawValue();
    this.api
      .crearBloqueo({
        fecha: raw.fecha,
        horaInicio: raw.horaInicio,
        horaFin: raw.horaFin,
        motivo: raw.motivo.trim(),
      })
      .subscribe({
        next: () => {
          this.savingBlock.set(false);
          this.blockModalOpen.set(false);
          this.toastStore.success('Horario bloqueado correctamente.');
          this.cargarDatos();
        },
        error: (err: unknown) => {
          this.savingBlock.set(false);
          this.blockFormError.set(applyServerValidationErrors(this.blockForm, err));
        },
      });
  }

  protected eliminarBloqueo(id: number): void {
    this.api.eliminarBloqueo(id).subscribe({
      next: () => {
        this.toastStore.info('Bloqueo eliminado.');
        this.cargarDatos();
      },
      error: (err: unknown) => this.toastStore.error(extractApiErrorMessage(err)),
    });
  }

  protected onBackdropClose(event: MouseEvent, modalId: string): void {
    if ((event.target as HTMLElement).id === modalId) {
      if (modalId === 'appointment-detail-modal') this.detailModalCita.set(null);
      if (modalId === 'patient-record-modal') this.activeRecordPatient.set(null);
      if (modalId === 'block-time-modal') this.blockModalOpen.set(false);
    }
  }

  private dateMatchesPeriod(
    dateValue: string,
    selectedValue: string,
    period: AgendaPeriod
  ): boolean {
    if (!selectedValue) return true;
    const date = new Date(`${dateValue.slice(0, 10)}T12:00:00`);
    const selected = new Date(`${selectedValue.slice(0, 10)}T12:00:00`);
    if (period === 'DAY') return dateValue.slice(0, 10) === selectedValue.slice(0, 10);
    if (period === 'MONTH') {
      return (
        date.getFullYear() === selected.getFullYear() &&
        date.getMonth() === selected.getMonth()
      );
    }
    const start = new Date(selected);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return date >= start && date <= end;
  }

  protected statusClass(status: string): string {
    const mapClasses: Record<string, string> = {
      PENDIENTE: 'bg-amber-50 text-amber-700',
      CONFIRMADA: 'bg-blue-50 text-blue-700',
      ATENDIDA: 'bg-green-50 text-green-700',
      CANCELADA: 'bg-red-50 text-red-700',
    };
    return mapClasses[status] ?? 'bg-slate-100 text-slate-600';
  }

  protected initials(name: string): string {
    return (name || 'SD')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toUpperCase();
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
    return new Intl.DateTimeFormat('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(`2026-01-01T${value.slice(0, 5)}:00`));
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

  private defaultWorkingAgendaDate(): string {
    const d = new Date();
    if (d.getDay() === 0) {
      d.setDate(d.getDate() + 1);
    }
    return this.localDateValue(d);
  }

  private localDateValue(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
