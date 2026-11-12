import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, map } from 'rxjs';
import {
  AdminFinanzasResponse,
  AdminResumenResponse,
  CitaEstado,
  CitaResponse,
  MensajeContactoEstado,
  MensajeContactoResponse,
  OdontologoAdminResponse,
  ServicioAdminResponse,
  UsuarioAdminResponse,
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

interface StatusLegendItem {
  readonly key: string;
  readonly label: string;
  readonly color: string;
  readonly count: number;
}

interface WeeklyBarItem {
  readonly date: string;
  readonly label: string;
  readonly count: number;
  readonly heightPx: number;
}

interface MonthlyBarItem {
  readonly label: string;
  readonly ingresos: number;
  readonly costos: number;
  readonly ingresosHeightPx: number;
  readonly costosHeightPx: number;
}

interface DemandBarItem {
  readonly servicio: string;
  readonly reservas: number;
  readonly widthPct: number;
}

interface CombinedUserRow {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly dni: string;
  readonly role: string;
  readonly active: boolean;
  readonly dentistId: number | null;
  readonly specialty: string;
  readonly license: string;
  readonly activity: string;
}

@Component({
  selector: 'sd-admin-agenda',
  imports: [ReactiveFormsModule, DecimalPipe, FieldErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-8">
      <p class="text-xs font-bold uppercase tracking-[.18em] text-gold">Gestión general</p>
      <h1 class="mt-2 text-3xl font-bold text-navy">Panel de Administración</h1>
      <p class="mt-2 text-sm text-slate-500">
        Supervisa la operación de SmartDent sin intervenir en las notas clínicas.
      </p>
    </header>

    @if (activeVista() === 'overview') {
      <section id="overview" data-dashboard-view>
        <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores administrativos">
          <article class="rounded-xl border border-slate-200 border-t-2 border-t-gold bg-white p-5 shadow-sm">
            <p class="text-xs text-slate-500">Citas registradas</p>
            <strong id="appointment-count" class="mt-2 block text-3xl text-navy">
              {{ resumen()?.totalCitas ?? citas().length }}
            </strong>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs text-slate-500">Por confirmar</p>
            <strong id="pending-count" class="mt-2 block text-3xl text-amber-600">
              {{ resumen()?.citasPendientes ?? pendingCitasCount() }}
            </strong>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs text-slate-500">Pacientes registrados</p>
            <strong id="patient-count" class="mt-2 block text-3xl text-blue-700">
              {{ resumen()?.pacientesRegistrados ?? patientsUsersCount() }}
            </strong>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-xs text-slate-500">Atenciones completadas</p>
            <strong id="attended-count" class="mt-2 block text-3xl text-green-700">
              {{ resumen()?.citasAtendidas ?? attendedCitasCount() }}
            </strong>
          </article>
        </section>

        <div class="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <article class="rounded-xl border border-slate-200 border-t-2 border-t-gold bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="font-bold text-navy">Operación de hoy</h2>
                <p id="admin-today-label" class="mt-1 text-xs text-slate-500">{{ todayLongLabel() }}</p>
              </div>
              <span
                id="admin-today-count"
                class="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600"
              >
                {{ todayAppointments().length }}
                {{ todayAppointments().length === 1 ? 'cita' : 'citas' }}
              </span>
            </div>
            <div id="admin-today-list" class="mt-5 space-y-3">
              @for (item of todayAppointments().slice(0, 5); track item.id) {
                <div class="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
                  <strong class="w-16 text-xs text-navy">{{ formatTime(item.horaInicio) }}</strong>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-xs font-bold text-navy">{{ item.pacienteNombre }}</p>
                    <p class="mt-1 truncate text-[10px] text-slate-500">
                      {{ item.servicioNombre }} · {{ item.odontologoNombre }}
                    </p>
                  </div>
                  <span
                    class="rounded-full px-2 py-1 text-[9px] font-bold"
                    [class]="statusClass(item.estado)"
                  >
                    {{ item.estado }}
                  </span>
                </div>
              } @empty {
                <div class="rounded-lg border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                  No hay citas programadas para hoy.
                </div>
              }
            </div>
          </article>

          <article class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="flex items-center gap-2 font-bold text-navy">
              <span class="material-symbols-outlined text-gold">notifications_active</span>
              Alertas operativas
            </h2>
            <div id="admin-alerts" class="mt-5 space-y-3">
              <div class="flex items-center gap-3 rounded-lg bg-amber-50 p-4 text-amber-700">
                <span class="material-symbols-outlined text-lg">pending_actions</span>
                <span class="text-xs font-semibold">
                  {{ resumen()?.citasPendientes ?? pendingCitasCount() }} citas pendientes de confirmación
                </span>
              </div>
              <div class="flex items-center gap-3 rounded-lg bg-green-50 p-4 text-green-700">
                <span class="material-symbols-outlined text-lg">dentistry</span>
                <span class="text-xs font-semibold">
                  {{ activeServicesCount() }} servicios disponibles para reservar
                </span>
              </div>
              <div class="flex items-center gap-3 rounded-lg bg-slate-50 p-4 text-slate-600">
                <span class="material-symbols-outlined text-lg">event_busy</span>
                <span class="text-xs font-semibold">
                  {{ resumen()?.citasCanceladas ?? cancelledCitasCount() }} citas canceladas
                </span>
              </div>
            </div>
          </article>
        </div>

        <div class="mt-6 grid gap-6 md:grid-cols-3">
          <article class="rounded-xl bg-navy p-6 text-white">
            <p class="text-xs text-slate-300">Ocupación estimada</p>
            <strong id="overview-occupancy" class="mt-2 block text-3xl">
              {{ occupancyPercent() }}%
            </strong>
            <div class="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                id="overview-occupancy-bar"
                class="h-full rounded-full bg-gold"
                [style.width.%]="occupancyPercent()"
              ></div>
            </div>
          </article>

          <article class="rounded-xl border border-slate-200 bg-white p-6">
            <p class="text-xs text-slate-500">Ingresos estimados</p>
            <strong id="estimated-revenue" class="mt-2 block text-3xl text-navy">
              S/ {{ estimatedRevenue() | number: '1.2-2' }}
            </strong>
            <p class="mt-2 text-[10px] text-slate-400">Basado en atenciones completadas.</p>
          </article>

          <article class="rounded-xl border border-slate-200 bg-white p-6">
            <p class="text-xs text-slate-500">Servicios disponibles</p>
            <strong id="overview-active-services" class="mt-2 block text-3xl text-green-700">
              {{ activeServicesCount() }}
            </strong>
            <button
              class="mt-3 text-xs font-bold text-gold"
              type="button"
              (click)="goToVista('services')"
            >
              Gestionar tarifas →
            </button>
          </article>
        </div>

        <div class="mt-6 grid gap-6 xl:grid-cols-2">
          <article class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="font-bold text-navy">Citas por estado</h2>
                <p class="mt-1 text-xs text-slate-500">Distribución de todas las reservas.</p>
              </div>
              <button
                class="text-xs font-bold text-gold"
                type="button"
                (click)="goToVista('appointments')"
              >
                Ver agenda
              </button>
            </div>
            <div class="mt-6 flex flex-col items-center gap-7 sm:flex-row">
              <div
                id="status-donut"
                class="relative h-44 w-44 shrink-0 rounded-full"
                [style.background]="donutGradient()"
              >
                <div class="absolute inset-7 grid place-items-center rounded-full bg-white text-center">
                  <span>
                    <strong id="status-donut-total" class="block text-2xl text-navy">
                      {{ citas().length }}
                    </strong>
                    <small class="text-[9px] text-slate-400">TOTAL</small>
                  </span>
                </div>
              </div>
              <div id="status-chart-legend" class="grid flex-1 grid-cols-2 gap-3">
                @for (leg of statusLegend(); track leg.key) {
                  <div class="rounded-lg bg-slate-50 p-3">
                    <span class="flex items-center gap-2 text-[10px] text-slate-500">
                      <i class="h-2.5 w-2.5 rounded-full" [style.background]="leg.color"></i>
                      {{ leg.label }}
                    </span>
                    <strong class="mt-1 block text-lg text-navy">{{ leg.count }}</strong>
                  </div>
                }
              </div>
            </div>
          </article>

          <article class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 class="font-bold text-navy">Actividad de los últimos 7 días</h2>
              <p class="mt-1 text-xs text-slate-500">Cantidad de citas programadas por día.</p>
            </div>
            <div
              id="weekly-appointments-chart"
              class="mt-7 flex h-48 items-end gap-3 border-b border-l border-slate-200 px-4"
            >
              @for (day of weeklyBars(); track day.date) {
                <div class="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span class="text-[9px] font-bold text-navy">{{ day.count }}</span>
                  <div
                    class="w-full max-w-12 rounded-t bg-navy transition-all"
                    [style.height.px]="day.heightPx"
                  ></div>
                  <span class="text-[9px] capitalize text-slate-400">{{ day.label }}</span>
                </div>
              }
            </div>
          </article>
        </div>
      </section>
    }

    @if (activeVista() === 'appointments') {
      <div class="mt-6">
        <section
          id="appointments"
          data-dashboard-view
          class="rounded-xl border border-slate-200 border-t-2 border-t-gold bg-white p-6 shadow-sm"
        >
          <div class="mb-5 flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
            <div>
              <h2 class="font-bold text-navy">Agenda global</h2>
              <p class="mt-1 text-xs text-slate-500">
                Todas las reservas realizadas en la clínica.
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <label class="relative">
                <span class="material-symbols-outlined absolute left-3 top-2.5 text-lg text-slate-400">
                  search
                </span>
                <input
                  id="admin-search"
                  class="h-10 rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-xs"
                  type="search"
                  [value]="agendaSearch()"
                  (input)="onAgendaSearch($event)"
                  placeholder="Paciente, doctor o tratamiento"
                />
              </label>
              <input
                id="admin-date-filter"
                class="h-10 rounded-lg border border-slate-300 px-3 text-xs"
                type="date"
                [value]="agendaDateFilter()"
                (change)="onAgendaDateChange($event)"
              />
              <select
                id="admin-dentist-filter"
                class="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs"
                [value]="agendaDentistFilter()"
                (change)="onAgendaDentistChange($event)"
              >
                <option value="ALL">Todos los odontólogos</option>
                @for (doc of activeDentists(); track doc.id) {
                  <option [value]="doc.nombreCompleto">{{ doc.nombreCompleto }}</option>
                }
              </select>
              <select
                id="status-filter"
                class="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs"
                [value]="agendaStatusFilter()"
                (change)="onAgendaStatusChange($event)"
              >
                <option value="ALL">Todos los estados</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="CONFIRMADA">Confirmadas</option>
                <option value="ATENDIDA">Atendidas</option>
                <option value="CANCELADA">Canceladas</option>
              </select>
              <button
                id="export-appointments"
                class="h-10 rounded-lg bg-navy px-4 text-xs font-bold text-white"
                type="button"
                (click)="exportarCsv()"
              >
                Exportar CSV
              </button>
            </div>
          </div>

          <p id="admin-agenda-count" class="mb-4 text-[10px] font-semibold text-slate-500">
            Mostrando {{ visibleAppointments().length }} de {{ citas().length }}
            {{ citas().length === 1 ? 'cita' : 'citas' }}
          </p>

          <div class="overflow-x-auto">
            <table class="w-full min-w-[900px] text-left text-xs">
              <thead class="border-b border-slate-200 text-[9px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th class="px-3 py-3">Fecha</th>
                  <th class="px-3 py-3">Paciente</th>
                  <th class="px-3 py-3">Tratamiento</th>
                  <th class="px-3 py-3">Odontólogo</th>
                  <th class="px-3 py-3">Estado</th>
                  <th class="px-3 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody id="admin-appointments" class="divide-y divide-slate-100">
                @for (item of visibleAppointments(); track item.id) {
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
                    <td class="px-3 py-4">{{ item.odontologoNombre }}</td>
                    <td class="px-3 py-4">
                      <span
                        class="rounded-full px-2.5 py-1 text-[9px] font-bold"
                        [class]="statusClass(item.estado)"
                      >
                        {{ item.estado }}
                      </span>
                    </td>
                    <td class="px-3 py-4 text-right">
                      <button
                        class="rounded-md border border-slate-300 px-3 py-2 text-[10px] font-bold text-navy"
                        type="button"
                        (click)="detailModalCita.set(item)"
                      >
                        Detalle
                      </button>
                      @if (item.estado === 'PENDIENTE') {
                        <button
                          class="ml-2 rounded-md bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700"
                          type="button"
                          (click)="cambiarEstadoCita(item, 'CONFIRMADA')"
                        >
                          Confirmar
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (visibleAppointments().length === 0) {
            <div id="admin-empty" class="py-12 text-center">
              <span class="material-symbols-outlined text-5xl text-slate-300">calendar_month</span>
              <h3 class="mt-3 font-bold text-navy">No hay citas para mostrar</h3>
            </div>
          }
        </section>
      </div>
    }

    @if (activeVista() === 'users') {
      <section
        id="users"
        data-dashboard-view
        class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div class="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <h2 class="font-bold text-navy">Gestión de usuarios</h2>
            <p class="mt-1 text-xs text-slate-500">Cuentas reales registradas en SmartDent.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <input
              id="admin-user-search"
              class="h-10 rounded-lg border border-slate-300 px-3 text-xs"
              type="search"
              [value]="userSearch()"
              (input)="onUserSearch($event)"
              placeholder="Buscar nombre, correo o DNI"
            />
            <select
              id="admin-role-filter"
              class="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs"
              [value]="userRoleFilter()"
              (change)="onUserRoleChange($event)"
            >
              <option value="ALL">Todos los roles</option>
              <option value="PACIENTE">Pacientes</option>
              <option value="ODONTOLOGO">Odontólogos</option>
              <option value="ADMIN">Administradores</option>
            </select>
            <button
              id="new-dentist"
              class="h-10 rounded-lg bg-navy px-4 text-xs font-bold text-white"
              type="button"
              (click)="openDentistModal(null)"
            >
              <span class="material-symbols-outlined mr-1 align-middle text-base">person_add</span>
              Nuevo odontólogo
            </button>
          </div>
        </div>

        <div class="mt-5 grid gap-4 sm:grid-cols-3">
          <article class="rounded-lg bg-slate-50 p-4">
            <span class="text-xs text-slate-500">Administradores</span>
            <strong id="users-admin-count" class="mt-2 block text-2xl text-navy">
              {{ adminUsersCount() }}
            </strong>
          </article>
          <article class="rounded-lg bg-slate-50 p-4">
            <span class="text-xs text-slate-500">Odontólogos activos</span>
            <strong id="users-dentist-count" class="mt-2 block text-2xl text-navy">
              {{ activeDentists().length }}
            </strong>
          </article>
          <article class="rounded-lg bg-slate-50 p-4">
            <span class="text-xs text-slate-500">Pacientes</span>
            <strong id="users-patient-count" class="mt-2 block text-2xl text-navy">
              {{ patientsUsersCount() }}
            </strong>
          </article>
        </div>

        <div class="mt-6 overflow-x-auto">
          <table class="w-full min-w-[850px] text-left text-xs">
            <thead class="border-b border-slate-200 text-[9px] uppercase text-slate-400">
              <tr>
                <th class="px-3 py-3">Usuario</th>
                <th class="px-3 py-3">Rol / especialidad</th>
                <th class="px-3 py-3">Actividad</th>
                <th class="px-3 py-3">Estado</th>
                <th class="px-3 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody id="admin-users-table" class="divide-y divide-slate-100">
              @for (user of filteredUsers(); track user.id) {
                <tr>
                  <td class="px-3 py-4">
                    <strong class="text-navy">{{ user.name }}</strong>
                    <span class="mt-1 block text-[10px] text-slate-500">
                      {{ user.email }} · DNI {{ user.dni }}
                    </span>
                  </td>
                  <td class="px-3 py-4">
                    <span class="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-bold text-slate-600">
                      {{ roleLabel(user.role) }}
                    </span>
                    @if (user.role === 'ODONTOLOGO' && user.specialty) {
                      <span class="mt-1 block text-[10px] text-slate-500">
                        {{ user.specialty }} · {{ user.license }}
                      </span>
                    }
                  </td>
                  <td class="px-3 py-4">{{ user.activity }}</td>
                  <td class="px-3 py-4">
                    <span
                      class="rounded-full px-3 py-1 text-[9px] font-bold"
                      [class]="
                        user.active
                          ? 'bg-green-50 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      "
                    >
                      {{ user.active ? 'ACTIVO' : 'INACTIVO' }}
                    </span>
                  </td>
                  <td class="px-3 py-4 text-right">
                    @if (user.role === 'ODONTOLOGO' && user.dentistId !== null) {
                      <button
                        class="rounded-lg border border-slate-300 px-3 py-2 text-[10px] font-bold text-navy"
                        type="button"
                        (click)="openDentistModalById(user.dentistId)"
                      >
                        Editar
                      </button>
                    } @else {
                      <span class="text-[10px] text-slate-400">Solo consulta</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (filteredUsers().length === 0) {
          <div id="admin-users-empty" class="py-10 text-center text-xs text-slate-500">
            No se encontraron usuarios.
          </div>
        }
      </section>
    }

    @if (activeVista() === 'messages') {
      <section
        id="messages"
        data-dashboard-view
        class="rounded-xl border border-slate-200 border-t-2 border-t-gold bg-white p-6 shadow-sm"
      >
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 class="font-bold text-navy">Bandeja de mensajes</h2>
            <p class="mt-1 text-xs text-slate-500">
              Consultas enviadas desde la página de contacto.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <input
              id="message-search"
              class="h-10 rounded-lg border border-slate-300 px-3 text-xs"
              type="search"
              [value]="messageSearch()"
              (input)="onMessageSearch($event)"
              placeholder="Buscar nombre, correo o asunto"
            />
            <select
              id="message-status-filter"
              class="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs"
              [value]="messageStatusFilter()"
              (change)="onMessageStatusChange($event)"
            >
              <option value="ALL">Todos los estados</option>
              <option value="NUEVO">Nuevos</option>
              <option value="LEIDO">Leídos</option>
              <option value="RESPONDIDO">Respondidos</option>
            </select>
          </div>
        </div>

        <div class="mt-5 grid gap-4 sm:grid-cols-3">
          <article class="rounded-lg bg-amber-50 p-4">
            <span class="text-xs text-amber-700">Mensajes nuevos</span>
            <strong id="messages-new-count" class="mt-2 block text-2xl text-amber-700">
              {{ newMessagesCount() }}
            </strong>
          </article>
          <article class="rounded-lg bg-slate-50 p-4">
            <span class="text-xs text-slate-500">Total recibidos</span>
            <strong id="messages-total-count" class="mt-2 block text-2xl text-navy">
              {{ mensajes().length }}
            </strong>
          </article>
          <article class="rounded-lg bg-green-50 p-4">
            <span class="text-xs text-green-700">Respondidos</span>
            <strong id="messages-replied-count" class="mt-2 block text-2xl text-green-700">
              {{ repliedMessagesCount() }}
            </strong>
          </article>
        </div>

        @if (filteredMessages().length > 0) {
          <div id="admin-message-list" class="mt-6 space-y-4">
            @for (msg of filteredMessages(); track msg.id) {
              <article class="rounded-xl border border-slate-200 p-5">
                <div class="flex flex-col justify-between gap-3 sm:flex-row">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <strong class="text-sm text-navy">{{ msg.nombre }}</strong>
                      <span
                        class="rounded-full px-2.5 py-1 text-[9px] font-bold"
                        [class]="messageBadgeClass(msg.estado)"
                      >
                        {{ msg.estado }}
                      </span>
                    </div>
                    <a
                      class="mt-1 block text-xs text-blue-700 hover:underline"
                      [href]="'mailto:' + msg.email"
                    >
                      {{ msg.email }}
                    </a>
                    <p class="mt-1 text-[10px] text-slate-400">
                      {{ formatMessageDate(msg.creadoEn) }}
                      @if (msg.telefono) {
                        · {{ msg.telefono }}
                      }
                    </p>
                  </div>
                  <div class="flex shrink-0 flex-wrap gap-2">
                    @if (msg.estado === 'NUEVO') {
                      <button
                        class="rounded-lg border border-slate-300 px-3 py-2 text-[10px] font-bold text-navy"
                        type="button"
                        (click)="cambiarEstadoMensaje(msg, 'LEIDO')"
                      >
                        Marcar leído
                      </button>
                    }
                    @if (msg.estado !== 'RESPONDIDO') {
                      <button
                        class="rounded-lg bg-navy px-3 py-2 text-[10px] font-bold text-white"
                        type="button"
                        (click)="cambiarEstadoMensaje(msg, 'RESPONDIDO')"
                      >
                        Marcar respondido
                      </button>
                    }
                  </div>
                </div>
                <div class="mt-4 rounded-lg bg-slate-50 p-4">
                  <strong class="text-xs text-navy">{{ msg.asunto }}</strong>
                  <p class="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                    {{ msg.mensaje }}
                  </p>
                </div>
              </article>
            }
          </div>
        } @else {
          <div
            id="admin-messages-empty"
            class="mt-6 rounded-lg border border-dashed border-slate-300 p-10 text-center text-xs text-slate-500"
          >
            No hay mensajes para mostrar.
          </div>
        }
      </section>
    }

    @if (activeVista() === 'services') {
      <section
        id="services"
        data-dashboard-view
        class="rounded-xl border border-slate-200 border-t-2 border-t-gold bg-white p-6 shadow-sm"
      >
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 class="font-bold text-navy">Servicios y Tarifas</h2>
            <p class="mt-1 text-xs text-slate-500">
              Administra precios, costos clínicos y disponibilidad.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <label class="relative">
              <span class="material-symbols-outlined absolute left-3 top-2.5 text-lg text-slate-400">
                search
              </span>
              <input
                id="admin-service-search"
                class="h-10 rounded-lg border border-slate-300 pl-10 pr-3 text-xs"
                type="search"
                [value]="serviceSearch()"
                (input)="onServiceSearch($event)"
                placeholder="Buscar servicio"
              />
            </label>
            <button
              id="new-service"
              class="flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-navy px-4 text-xs font-bold text-white"
              type="button"
              (click)="openServiceModal(null)"
            >
              <span class="material-symbols-outlined text-base">add_circle</span>
              Nuevo servicio
            </button>
          </div>
        </div>

        <div class="mt-5 grid gap-4 sm:grid-cols-3">
          <article class="rounded-lg bg-slate-50 p-4">
            <span class="text-xs text-slate-500">Servicios activos</span>
            <strong id="active-service-count" class="mt-2 block text-2xl text-navy">
              {{ activeServicesCount() }}
            </strong>
          </article>
          <article class="rounded-lg bg-slate-50 p-4">
            <span class="text-xs text-slate-500">Precio promedio</span>
            <strong id="average-service-price" class="mt-2 block text-2xl text-navy">
              S/ {{ averageServicePrice() | number: '1.2-2' }}
            </strong>
          </article>
          <article class="rounded-lg bg-slate-50 p-4">
            <span class="text-xs text-slate-500">Margen bruto promedio</span>
            <strong id="average-service-margin" class="mt-2 block text-2xl text-green-700">
              {{ averageServiceMargin() }}%
            </strong>
          </article>
        </div>

        <div class="mt-6 overflow-x-auto">
          <table class="w-full min-w-[850px] text-left text-xs">
            <thead class="border-b border-slate-200 text-[9px] uppercase text-slate-400">
              <tr>
                <th class="px-3 py-3">Servicio</th>
                <th class="px-3 py-3">Especialidad</th>
                <th class="px-3 py-3">Precio</th>
                <th class="px-3 py-3">Costo</th>
                <th class="px-3 py-3">Margen</th>
                <th class="px-3 py-3">Duración</th>
                <th class="px-3 py-3">Estado</th>
                <th class="px-3 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody id="admin-services-table" class="divide-y divide-slate-100">
              @for (item of filteredServices(); track item.id) {
                <tr>
                  <td class="px-3 py-4 font-bold text-navy">{{ item.nombre }}</td>
                  <td class="px-3 py-4">{{ item.especialidad }}</td>
                  <td class="px-3 py-4 font-semibold">S/ {{ item.precio | number: '1.2-2' }}</td>
                  <td class="px-3 py-4">S/ {{ item.costo | number: '1.2-2' }}</td>
                  <td class="px-3 py-4">
                    <strong [class]="item.precio - item.costo >= 0 ? 'text-green-700' : 'text-red-600'">
                      S/ {{ item.precio - item.costo | number: '1.2-2' }}
                    </strong>
                    <span class="ml-1 text-[9px] text-slate-400">
                      ({{ serviceMarginPercent(item) }}%)
                    </span>
                  </td>
                  <td class="px-3 py-4">{{ item.duracionMinutos }} min</td>
                  <td class="px-3 py-4">
                    <span
                      class="rounded-full px-3 py-1 text-[9px] font-bold"
                      [class]="
                        item.activo
                          ? 'bg-green-50 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      "
                    >
                      {{ item.activo ? 'ACTIVO' : 'INACTIVO' }}
                    </span>
                  </td>
                  <td class="px-3 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        class="rounded-lg border border-slate-300 px-3 py-2 text-[10px] font-bold text-navy hover:bg-slate-50"
                        type="button"
                        (click)="openServiceModal(item)"
                      >
                        Editar
                      </button>
                      <button
                        class="rounded-lg px-3 py-2 text-[10px] font-bold transition"
                        [class]="
                          item.activo
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        "
                        type="button"
                        (click)="toggleServiceStatus(item)"
                      >
                        {{ item.activo ? 'Desactivar' : 'Activar' }}
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    }

    @if (activeVista() === 'finance') {
      <section id="finance" data-dashboard-view class="space-y-6">
        <div>
          <h2 class="text-xl font-bold text-navy">Finanzas y Reportes</h2>
          <p class="mt-2 text-xs text-slate-500">
            Estimaciones operativas calculadas a partir de las atenciones completadas.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article class="rounded-xl border border-slate-200 border-t-2 border-t-gold bg-white p-5">
            <p class="text-xs text-slate-500">Ingresos</p>
            <strong id="finance-revenue" class="mt-2 block text-2xl text-navy">
              S/ {{ finanzas()?.ingresosMesActual ?? 0 | number: '1.2-2' }}
            </strong>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-5">
            <p class="text-xs text-slate-500">Costos variables</p>
            <strong id="finance-variable-cost" class="mt-2 block text-2xl text-amber-700">
              S/ {{ finanzas()?.costosVariablesMesActual ?? 0 | number: '1.2-2' }}
            </strong>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-5">
            <p class="text-xs text-slate-500">Gastos fijos</p>
            <strong id="finance-fixed-cost" class="mt-2 block text-2xl text-red-600">
              S/ {{ finanzas()?.gastosFijosMensuales ?? 0 | number: '1.2-2' }}
            </strong>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-5">
            <p class="text-xs text-slate-500">Utilidad estimada</p>
            <strong
              id="finance-profit"
              class="mt-2 block text-2xl"
              [class]="
                (finanzas()?.utilidadMesActual ?? 0) >= 0 ? 'text-green-700' : 'text-red-600'
              "
            >
              S/ {{ finanzas()?.utilidadMesActual ?? 0 | number: '1.2-2' }}
            </strong>
            <span id="finance-margin" class="mt-1 block text-[10px] text-slate-500">
              Margen: {{ finanzas()?.margenMesActual ?? 0 }}% · mes actual
            </span>
          </article>
        </div>

        <div class="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <article class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 class="font-bold text-navy">Ingresos vs. costos — últimos 6 meses</h3>
            <p class="mt-1 text-xs text-slate-500">Comparación mensual estimada.</p>
            <div
              id="monthly-finance-chart"
              class="mt-7 flex h-64 items-end gap-4 border-b border-l border-slate-200 px-4"
            >
              @for (m of monthlyFinanceBars(); track m.label) {
                <div class="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div class="flex h-[190px] items-end gap-1">
                    <div
                      class="w-4 rounded-t bg-navy"
                      [title]="'Ingresos: S/ ' + m.ingresos.toFixed(2)"
                      [style.height.px]="m.ingresosHeightPx"
                    ></div>
                    <div
                      class="w-4 rounded-t bg-gold"
                      [title]="'Costos: S/ ' + m.costos.toFixed(2)"
                      [style.height.px]="m.costosHeightPx"
                    ></div>
                  </div>
                  <span class="text-[9px] capitalize text-slate-400">{{ m.label }}</span>
                </div>
              }
            </div>
            <div class="mt-4 flex justify-center gap-5 text-[10px]">
              <span class="flex items-center gap-2">
                <i class="h-2.5 w-2.5 rounded-sm bg-navy"></i>
                Ingresos
              </span>
              <span class="flex items-center gap-2">
                <i class="h-2.5 w-2.5 rounded-sm bg-gold"></i>
                Costos
              </span>
            </div>
          </article>

          <article class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 class="font-bold text-navy">Gastos fijos mensuales</h3>
            <p class="mt-1 text-xs text-slate-500">
              Puedes ajustar estos valores para mejorar la estimación.
            </p>
            <form
              id="fixed-cost-form"
              [formGroup]="fixedCostForm"
              (ngSubmit)="guardarCostosFijos()"
              class="mt-5 space-y-3"
              novalidate
            >
              <label class="flex items-center justify-between gap-4 text-xs">
                <span>Alquiler</span>
                <input
                  id="cost-rent"
                  formControlName="alquiler"
                  class="h-9 w-32 rounded-lg border border-slate-300 px-3 text-right"
                  type="number"
                  min="0"
                  step="10"
                />
              </label>
              <label class="flex items-center justify-between gap-4 text-xs">
                <span>Planilla</span>
                <input
                  id="cost-payroll"
                  formControlName="planilla"
                  class="h-9 w-32 rounded-lg border border-slate-300 px-3 text-right"
                  type="number"
                  min="0"
                  step="10"
                />
              </label>
              <label class="flex items-center justify-between gap-4 text-xs">
                <span>Servicios</span>
                <input
                  id="cost-utilities"
                  formControlName="servicios"
                  class="h-9 w-32 rounded-lg border border-slate-300 px-3 text-right"
                  type="number"
                  min="0"
                  step="10"
                />
              </label>
              <label class="flex items-center justify-between gap-4 text-xs">
                <span>Marketing</span>
                <input
                  id="cost-marketing"
                  formControlName="marketing"
                  class="h-9 w-32 rounded-lg border border-slate-300 px-3 text-right"
                  type="number"
                  min="0"
                  step="10"
                />
              </label>
              <label class="flex items-center justify-between gap-4 text-xs">
                <span>Otros</span>
                <input
                  id="cost-other"
                  formControlName="otros"
                  class="h-9 w-32 rounded-lg border border-slate-300 px-3 text-right"
                  type="number"
                  min="0"
                  step="10"
                />
              </label>
              @if (fixedCostSavedMessage()) {
                <p id="fixed-cost-message" class="rounded-lg bg-green-50 p-3 text-[10px] text-green-700">
                  Costos actualizados.
                </p>
              }
              <button
                class="w-full rounded-lg bg-navy px-4 py-3 text-xs font-bold text-white disabled:opacity-60"
                type="submit"
                [disabled]="savingFixedCosts()"
              >
                {{ savingFixedCosts() ? 'Guardando...' : 'Guardar costos' }}
              </button>
            </form>
          </article>
        </div>

        <article class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="font-bold text-navy">Servicios más solicitados</h3>
          <p class="mt-1 text-xs text-slate-500">
            Participación según las reservas registradas.
          </p>
          <div id="services-demand-chart" class="mt-6 space-y-4">
            @for (dem of demandBars(); track dem.servicio) {
              <div>
                <div class="flex justify-between gap-4 text-xs">
                  <span class="truncate text-slate-600">{{ dem.servicio }}</span>
                  <strong class="text-navy">{{ dem.reservas }}</strong>
                </div>
                <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full bg-gold"
                    [style.width.%]="dem.widthPct"
                  ></div>
                </div>
              </div>
            } @empty {
              <div class="rounded-lg border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                No hay reservas suficientes para generar este gráfico.
              </div>
            }
          </div>
        </article>
      </section>
    }

    @if (detailModalCita(); as item) {
      <div
        id="admin-appointment-modal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-navy/75 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-appointment-title"
        (click)="onBackdropClose($event, 'admin-appointment-modal')"
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
          <h2 id="admin-appointment-title" class="text-xl font-bold text-navy">
            Detalle de la cita
          </h2>
          <div id="admin-appointment-detail" class="mt-6">
            <div class="grid gap-4 rounded-xl bg-slate-50 p-5 sm:grid-cols-2">
              <div>
                <span class="text-[10px] uppercase text-slate-400">Paciente</span>
                <strong class="mt-1 block text-sm text-navy">{{ item.pacienteNombre }}</strong>
                <span class="text-xs text-slate-500">{{ item.pacienteEmail }}</span>
              </div>
              <div>
                <span class="text-[10px] uppercase text-slate-400">Odontólogo</span>
                <strong class="mt-1 block text-sm text-navy">{{ item.odontologoNombre }}</strong>
              </div>
              <div>
                <span class="text-[10px] uppercase text-slate-400">Fecha y hora</span>
                <strong class="mt-1 block text-sm text-navy">
                  {{ formatDate(item.fecha) }} · {{ formatTime(item.horaInicio) }}
                </strong>
              </div>
              <div>
                <span class="text-[10px] uppercase text-slate-400">Servicio</span>
                <strong class="mt-1 block text-sm text-navy">{{ item.servicioNombre }}</strong>
              </div>
              <div class="sm:col-span-2">
                <span class="text-[10px] uppercase text-slate-400">Contacto y notas</span>
                <p class="mt-1 text-xs text-slate-600">
                  {{ item.telefonoContacto || 'Sin teléfono' }} · {{ item.motivo || 'Sin notas' }}
                </p>
              </div>
            </div>
          </div>
          <div id="admin-appointment-actions" class="mt-6 flex flex-wrap justify-end gap-3">
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
                (click)="cambiarEstadoCitaModal(item, 'CANCELADA')"
              >
                Cancelar cita
              </button>
            }
            @if (item.estado === 'PENDIENTE') {
              <button
                class="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white"
                type="button"
                (click)="cambiarEstadoCitaModal(item, 'CONFIRMADA')"
              >
                Confirmar cita
              </button>
            }
          </div>
        </div>
      </div>
    }

    @if (dentistModalOpen()) {
      <div
        id="dentist-modal"
        class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/75 p-3 sm:p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dentist-modal-title"
        (click)="onBackdropClose($event, 'dentist-modal')"
      >
        <form
          id="dentist-form"
          [formGroup]="dentistForm"
          (ngSubmit)="guardarOdontologo()"
          class="relative my-auto w-full max-w-3xl rounded-2xl bg-white p-7 shadow-2xl"
          novalidate
        >
          <button
            class="absolute right-4 top-4 text-slate-500"
            type="button"
            aria-label="Cerrar"
            (click)="dentistModalOpen.set(false)"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
          <h2 id="dentist-modal-title" class="text-xl font-bold text-navy">
            {{ editingDentist() ? 'Editar odontólogo' : 'Nuevo odontólogo' }}
          </h2>
          <p class="mt-2 text-xs text-slate-500">
            El profesional podrá iniciar sesión y recibir citas de los servicios seleccionados.
          </p>

          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <label class="text-xs font-semibold">
              Código profesional
              <input
                id="dentist-code"
                formControlName="codigo"
                [readonly]="editingDentist() !== null"
                class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 uppercase read-only:bg-slate-50"
                maxlength="40"
                placeholder="DOC-NOMBRE-APELLIDO"
              />
            </label>
            <label class="text-xs font-semibold">
              Nombre completo
              <input
                id="dentist-name"
                formControlName="nombreCompleto"
                class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
                maxlength="120"
              />
              <sd-field-error [control]="dentistForm.controls.nombreCompleto" />
            </label>
            <label class="text-xs font-semibold">
              DNI
              <input
                id="dentist-dni"
                formControlName="dni"
                [readonly]="editingDentist() !== null"
                class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 read-only:bg-slate-50"
                inputmode="numeric"
                maxlength="8"
              />
              <sd-field-error [control]="dentistForm.controls.dni" />
            </label>
            <label class="text-xs font-semibold">
              Correo electrónico
              <input
                id="dentist-email"
                formControlName="email"
                [readonly]="editingDentist() !== null"
                class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 read-only:bg-slate-50"
                type="email"
              />
              <sd-field-error [control]="dentistForm.controls.email" />
            </label>
            @if (!editingDentist()) {
              <label id="dentist-password-field" class="text-xs font-semibold">
                Contraseña temporal
                <input
                  id="dentist-password"
                  formControlName="password"
                  class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
                  type="password"
                  maxlength="72"
                  autocomplete="new-password"
                />
                <span class="mt-1 block text-[9px] font-normal text-slate-400">
                  Mínimo 8 caracteres, una letra y un número.
                </span>
              </label>
            }
            <label class="text-xs font-semibold">
              Teléfono
              <input
                id="dentist-phone"
                formControlName="telefono"
                class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
                maxlength="20"
              />
            </label>
            <label class="text-xs font-semibold">
              Especialidad
              <input
                id="dentist-specialty"
                formControlName="especialidad"
                class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
                maxlength="100"
              />
            </label>
            <label class="text-xs font-semibold">
              Colegiatura
              <input
                id="dentist-license"
                formControlName="colegiatura"
                class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 uppercase"
                maxlength="30"
                placeholder="COP-00000"
              />
            </label>
            <label class="text-xs font-semibold sm:col-span-2">
              Archivo de fotografía
              <input
                id="dentist-photo"
                formControlName="fotoUrl"
                class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
                maxlength="500"
                placeholder="nombre-apellido.webp"
              />
              <span class="mt-1 block text-[9px] font-normal text-slate-400">
                La imagen debe existir en img/odontologos.
              </span>
            </label>
          </div>

          <fieldset class="mt-5">
            <legend class="text-xs font-bold text-navy">Servicios que atenderá</legend>
            <div
              id="dentist-service-options"
              class="mt-3 grid max-h-48 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-4 sm:grid-cols-2"
            >
              @for (srv of servicios(); track srv.id) {
                <label class="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-[10px]">
                  <input
                    class="mt-0.5 h-4 w-4 rounded border-slate-300 text-gold"
                    type="checkbox"
                    [checked]="selectedDentistServiceIds().has(srv.id)"
                    (change)="toggleDentistService(srv.id, $event)"
                  />
                  <span>
                    <strong class="block text-navy">{{ srv.nombre }}</strong>
                    <small class="text-slate-400">{{ srv.especialidad }}</small>
                  </span>
                </label>
              }
            </div>
          </fieldset>

          @if (editingDentist()) {
            <label id="dentist-active-field" class="mt-5 flex items-center gap-3 text-xs font-semibold">
              <input
                id="dentist-active"
                formControlName="activo"
                class="h-4 w-4 rounded border-slate-300 text-gold"
                type="checkbox"
              />
              Cuenta activa y disponible
            </label>
          }

          @if (dentistFormError(); as err) {
            <p id="dentist-form-error" class="mt-5 rounded-lg bg-red-50 p-3 text-xs text-red-700">
              {{ err }}
            </p>
          }

          <button
            id="dentist-submit"
            class="mt-5 w-full rounded-lg bg-navy px-5 py-3 text-xs font-bold text-white disabled:opacity-60"
            type="submit"
            [disabled]="savingDentist()"
          >
            {{
              savingDentist()
                ? 'Guardando...'
                : editingDentist()
                  ? 'Guardar cambios'
                  : 'Crear cuenta de odontólogo'
            }}
          </button>
        </form>
      </div>
    }

    @if (serviceModalOpen()) {
      <div
        id="service-modal"
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy/75 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-modal-title"
        (click)="onBackdropClose($event, 'service-modal')"
      >
        <form
          id="service-form"
          [formGroup]="serviceForm"
          (ngSubmit)="guardarServicio()"
          class="relative my-auto w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl"
          novalidate
        >
          <button
            class="absolute right-4 top-4 text-slate-500"
            type="button"
            aria-label="Cerrar"
            (click)="serviceModalOpen.set(false)"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
          <h2 id="service-modal-title" class="text-xl font-bold text-navy">
            {{ editingService() ? 'Editar servicio' : 'Nuevo servicio odontológico' }}
          </h2>

          @if (editingService(); as editSrv) {
            <div id="service-edit-header" class="mt-6 rounded-lg bg-slate-50 p-4">
              <strong id="service-edit-name" class="text-sm text-navy">{{ editSrv.nombre }}</strong>
              <p id="service-edit-specialty" class="mt-1 text-xs text-slate-500">
                {{ editSrv.especialidad }}
              </p>
            </div>
          } @else {
            <div id="service-create-fields" class="mt-6 grid gap-4 sm:grid-cols-2">
              <label class="text-xs font-semibold">
                Código
                <input
                  id="service-code"
                  formControlName="codigo"
                  class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 uppercase"
                  maxlength="40"
                  placeholder="SRV-BLANQUEAMIENTO"
                />
              </label>
              <label class="text-xs font-semibold">
                Especialidad
                <input
                  id="service-specialty-input"
                  formControlName="especialidad"
                  class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
                  maxlength="100"
                  placeholder="Ej: Estética"
                />
              </label>
              <label class="text-xs font-semibold sm:col-span-2">
                Nombre del servicio
                <input
                  id="service-name-input"
                  formControlName="nombre"
                  class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
                  maxlength="120"
                  placeholder="Ej: Blanqueamiento Dental Láser"
                />
              </label>
              <label class="text-xs font-semibold sm:col-span-2">
                Descripción
                <textarea
                  id="service-description"
                  formControlName="descripcion"
                  class="mt-2 h-20 w-full rounded-lg border border-slate-300 p-3 text-xs"
                  maxlength="600"
                  placeholder="Breve descripción del procedimiento para el paciente..."
                ></textarea>
              </label>
            </div>
          }

          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <label class="text-xs font-semibold">
              Precio al paciente (S/)
              <input
                id="service-price"
                formControlName="precio"
                class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
                type="number"
                min="0"
                step="0.01"
              />
            </label>
            <label class="text-xs font-semibold">
              Costo clínico (S/)
              <input
                id="service-cost"
                formControlName="costo"
                class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
                type="number"
                min="0"
                step="0.01"
              />
            </label>
            <label class="text-xs font-semibold">
              Duración (minutos)
              <input
                id="service-duration"
                formControlName="duracionMinutos"
                class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
                type="number"
                min="15"
                max="480"
                step="5"
              />
            </label>
            <label class="flex items-center gap-3 pt-7 text-xs font-semibold">
              <input
                id="service-active"
                formControlName="activo"
                class="h-4 w-4 rounded border-slate-300 text-gold"
                type="checkbox"
              />
              Disponible para reservas
            </label>
          </div>

          <div class="mt-5 rounded-lg bg-yellow-50 p-4 text-xs">
            <span class="text-slate-600">Margen bruto calculado:</span>
            <strong id="service-margin-preview" class="ml-2 text-navy">
              {{ serviceModalMarginPreview() }}
            </strong>
          </div>

          @if (serviceFormError(); as err) {
            <p id="service-form-error" class="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">
              {{ err }}
            </p>
          }

          <button
            id="service-submit-btn"
            class="mt-5 w-full rounded-lg bg-navy px-5 py-3 text-xs font-bold text-white disabled:opacity-60"
            type="submit"
            [disabled]="savingService()"
          >
            {{
              savingService()
                ? 'Guardando...'
                : editingService()
                  ? 'Guardar cambios'
                  : 'Crear servicio'
            }}
          </button>
        </form>
      </div>
    }
  `,
})
export class AdminAgendaComponent implements OnInit {
  private readonly api = inject(SmartDentApiService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly notificationStore = inject(NotificationStore);
  private readonly toastStore = inject(ToastStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly resumen = signal<AdminResumenResponse | null>(null);
  protected readonly citas = signal<readonly CitaResponse[]>([]);
  protected readonly usuarios = signal<readonly UsuarioAdminResponse[]>([]);
  protected readonly odontologos = signal<readonly OdontologoAdminResponse[]>([]);
  protected readonly servicios = signal<readonly ServicioAdminResponse[]>([]);
  protected readonly finanzas = signal<AdminFinanzasResponse | null>(null);
  protected readonly mensajes = signal<readonly MensajeContactoResponse[]>([]);

  protected readonly agendaSearch = signal<string>('');
  protected readonly agendaDateFilter = signal<string>('');
  protected readonly agendaDentistFilter = signal<string>('ALL');
  protected readonly agendaStatusFilter = signal<string>('ALL');

  protected readonly userSearch = signal<string>('');
  protected readonly userRoleFilter = signal<string>('ALL');
  protected readonly messageSearch = signal<string>('');
  protected readonly messageStatusFilter = signal<string>('ALL');
  protected readonly serviceSearch = signal<string>('');

  protected readonly detailModalCita = signal<CitaResponse | null>(null);

  protected readonly dentistModalOpen = signal<boolean>(false);
  protected readonly editingDentist = signal<OdontologoAdminResponse | null>(null);
  protected readonly selectedDentistServiceIds = signal<ReadonlySet<number>>(new Set());
  protected readonly savingDentist = signal<boolean>(false);
  protected readonly dentistFormError = signal<string | null>(null);

  protected readonly serviceModalOpen = signal<boolean>(false);
  protected readonly editingService = signal<ServicioAdminResponse | null>(null);
  protected readonly savingService = signal<boolean>(false);
  protected readonly serviceFormError = signal<string | null>(null);

  protected readonly savingFixedCosts = signal<boolean>(false);
  protected readonly fixedCostSavedMessage = signal<boolean>(false);

  private readonly rawVista = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('vista'))),
    { initialValue: null }
  );

  protected readonly activeVista = computed<string>(() => this.rawVista() ?? 'overview');

  protected readonly dentistForm = this.fb.group({
    codigo: ['', [Validators.required]],
    nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
    dni: ['', [Validators.required, SmartDentValidators.dniPeru()]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    telefono: [''],
    especialidad: ['', [Validators.required]],
    colegiatura: ['', [Validators.required]],
    fotoUrl: [''],
    activo: [true],
  });

  protected readonly serviceForm = this.fb.group({
    codigo: [''],
    nombre: [''],
    especialidad: [''],
    descripcion: [''],
    precio: [150, [Validators.required, Validators.min(0)]],
    costo: [45, [Validators.required, Validators.min(0)]],
    duracionMinutos: [45, [Validators.required, Validators.min(15)]],
    activo: [true],
  });

  protected readonly fixedCostForm = this.fb.group({
    alquiler: [2500, [Validators.required, Validators.min(0)]],
    planilla: [8000, [Validators.required, Validators.min(0)]],
    servicios: [600, [Validators.required, Validators.min(0)]],
    marketing: [300, [Validators.required, Validators.min(0)]],
    otros: [400, [Validators.required, Validators.min(0)]],
  });

  private readonly servicePriceSignal = toSignal(
    this.serviceForm.controls.precio.valueChanges,
    { initialValue: 150 }
  );
  private readonly serviceCostSignal = toSignal(
    this.serviceForm.controls.costo.valueChanges,
    { initialValue: 45 }
  );

  protected readonly serviceModalMarginPreview = computed<string>(() => {
    const p = Number(this.servicePriceSignal() || 0);
    const c = Number(this.serviceCostSignal() || 0);
    const margin = p - c;
    const pct = p > 0 ? Math.round((margin / p) * 100) : 0;
    return `S/ ${margin.toFixed(2)} (${pct}%)`;
  });

  protected readonly pendingCitasCount = computed<number>(
    () => this.citas().filter((c) => c.estado === 'PENDIENTE').length
  );
  protected readonly attendedCitasCount = computed<number>(
    () => this.citas().filter((c) => c.estado === 'ATENDIDA').length
  );
  protected readonly cancelledCitasCount = computed<number>(
    () => this.citas().filter((c) => c.estado === 'CANCELADA').length
  );

  protected readonly adminUsersCount = computed<number>(
    () => this.usuarios().filter((u) => u.rol === 'ADMIN').length
  );
  protected readonly patientsUsersCount = computed<number>(
    () => this.usuarios().filter((u) => u.rol === 'PACIENTE').length
  );
  protected readonly activeDentists = computed<readonly OdontologoAdminResponse[]>(() =>
    this.odontologos().filter((d) => d.activo)
  );

  protected readonly activeServicesCount = computed<number>(
    () =>
      this.resumen()?.serviciosActivos ??
      this.servicios().filter((s) => s.activo).length
  );

  protected readonly occupancyPercent = computed<number>(() => {
    const active =
      this.resumen()?.citasActivas ??
      this.citas().filter((c) => !['CANCELADA', 'ATENDIDA'].includes(c.estado)).length;
    return Math.min(100, Math.round((active / 40) * 100));
  });

  protected readonly estimatedRevenue = computed<number>(() => {
    if (this.resumen()?.ingresoEstimado !== undefined) {
      return this.resumen()!.ingresoEstimado;
    }
    return this.citas()
      .filter((c) => c.estado === 'ATENDIDA')
      .reduce((acc, c) => acc + (c.precioPactado || 0), 0);
  });

  protected readonly todayLongLabel = computed<string>(() =>
    new Intl.DateTimeFormat('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date())
  );

  protected readonly todayAppointments = computed<readonly CitaResponse[]>(() => {
    const today = this.localDateValue(new Date());
    return this.citas().filter((c) => c.fecha === today && c.estado !== 'CANCELADA');
  });

  protected readonly statusLegend = computed<readonly StatusLegendItem[]>(() => {
    const list = this.citas();
    return [
      {
        key: 'PENDIENTE',
        label: 'Pendientes',
        color: '#d97706',
        count: list.filter((c) => c.estado === 'PENDIENTE').length,
      },
      {
        key: 'CONFIRMADA',
        label: 'Confirmadas',
        color: '#2563eb',
        count: list.filter((c) => c.estado === 'CONFIRMADA').length,
      },
      {
        key: 'ATENDIDA',
        label: 'Atendidas',
        color: '#15803d',
        count: list.filter((c) => c.estado === 'ATENDIDA').length,
      },
      {
        key: 'CANCELADA',
        label: 'Canceladas',
        color: '#dc2626',
        count: list.filter((c) => c.estado === 'CANCELADA').length,
      },
    ];
  });

  protected readonly donutGradient = computed<string>(() => {
    const items = this.statusLegend();
    const total = items.reduce((acc, item) => acc + item.count, 0);
    if (total === 0) return '#e2e8f0';
    let cursor = 0;
    const segments = items.map((item) => {
      const start = cursor;
      cursor += (item.count / total) * 100;
      return `${item.color} ${start}% ${cursor}%`;
    });
    return `conic-gradient(${segments.join(',')})`;
  });

  protected readonly weeklyBars = computed<readonly WeeklyBarItem[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rawDays: { date: string; label: string; count: number }[] = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const d = new Date(today);
      d.setDate(d.getDate() - offset);
      const val = this.localDateValue(d);
      const label = new Intl.DateTimeFormat('es-PE', { weekday: 'short' })
        .format(d)
        .replace('.', '');
      const count = this.citas().filter(
        (c) => c.fecha === val && c.estado !== 'CANCELADA'
      ).length;
      rawDays.push({ date: val, label, count });
    }
    const max = Math.max(1, ...rawDays.map((r) => r.count));
    return rawDays.map((r) => ({
      ...r,
      heightPx: r.count ? Math.max(12, Math.round((r.count / max) * 145)) : 4,
    }));
  });

  protected readonly visibleAppointments = computed<readonly CitaResponse[]>(() => {
    const term = this.agendaSearch().trim().toLowerCase();
    const status = this.agendaStatusFilter();
    const dentist = this.agendaDentistFilter();
    const dateVal = this.agendaDateFilter();

    return this.citas().filter((item) => {
      const matchesStatus = status === 'ALL' || item.estado === status;
      const matchesDoctor = dentist === 'ALL' || item.odontologoNombre === dentist;
      const matchesDate = !dateVal || item.fecha === dateVal;
      const matchesTerm = [
        item.pacienteNombre,
        item.pacienteEmail,
        item.servicioNombre,
        item.odontologoNombre,
        item.codigo,
      ].some((v) =>
        String(v || '')
          .toLowerCase()
          .includes(term)
      );
      return matchesStatus && matchesDoctor && matchesDate && matchesTerm;
    });
  });

  protected readonly combinedUsers = computed<readonly CombinedUserRow[]>(() => {
    const docsByEmail = new Map<string, OdontologoAdminResponse>();
    this.odontologos().forEach((d) => docsByEmail.set(d.email.toLowerCase(), d));

    return this.usuarios().map((u) => {
      const doc = docsByEmail.get(u.email.toLowerCase());
      const activity =
        u.rol === 'PACIENTE'
          ? `${this.citas().filter((c) => c.pacienteEmail === u.email).length} citas`
          : u.rol === 'ODONTOLOGO'
            ? `${this.citas().filter((c) => doc && c.odontologoId === doc.id).length} citas asignadas`
            : 'Gestión general';
      return {
        id: u.id,
        name: u.nombreCompleto,
        email: u.email,
        dni: u.dni,
        role: u.rol,
        active: doc ? doc.activo : u.activo,
        dentistId: doc?.id ?? null,
        specialty: doc?.especialidad ?? '',
        license: doc?.colegiatura ?? '',
        activity,
      };
    });
  });

  protected readonly filteredUsers = computed<readonly CombinedUserRow[]>(() => {
    const term = this.userSearch().trim().toLowerCase();
    const role = this.userRoleFilter();
    return this.combinedUsers().filter(
      (u) =>
        (role === 'ALL' || u.role === role) &&
        [u.name, u.email, u.dni, u.specialty, u.license].some((v) =>
          String(v || '')
            .toLowerCase()
            .includes(term)
        )
    );
  });

  protected readonly newMessagesCount = computed<number>(
    () => this.mensajes().filter((m) => m.estado === 'NUEVO').length
  );
  protected readonly repliedMessagesCount = computed<number>(
    () => this.mensajes().filter((m) => m.estado === 'RESPONDIDO').length
  );

  protected readonly filteredMessages = computed<readonly MensajeContactoResponse[]>(() => {
    const term = this.messageSearch().trim().toLowerCase();
    const status = this.messageStatusFilter();
    return this.mensajes().filter((m) => {
      const matchesStatus = status === 'ALL' || m.estado === status;
      const matchesTerm = [m.nombre, m.email, m.asunto, m.mensaje].some((v) =>
        String(v || '')
          .toLowerCase()
          .includes(term)
      );
      return matchesStatus && matchesTerm;
    });
  });

  protected readonly filteredServices = computed<readonly ServicioAdminResponse[]>(() => {
    const term = this.serviceSearch().trim().toLowerCase();
    return this.servicios().filter((s) =>
      [s.nombre, s.especialidad, s.codigo].some((v) =>
        String(v || '')
          .toLowerCase()
          .includes(term)
      )
    );
  });

  protected readonly averageServicePrice = computed<number>(() => {
    const active = this.servicios().filter((s) => s.activo);
    if (!active.length) return 0;
    return active.reduce((acc, s) => acc + Number(s.precio), 0) / active.length;
  });

  protected readonly averageServiceMargin = computed<number>(() => {
    const active = this.servicios().filter((s) => s.activo);
    if (!active.length) return 0;
    const sum = active.reduce((acc, s) => acc + this.serviceMarginPercent(s), 0);
    return Math.round(sum / active.length);
  });

  protected readonly monthlyFinanceBars = computed<readonly MonthlyBarItem[]>(() => {
    const monthly = this.finanzas()?.mensual ?? [];
    const max = Math.max(
      1,
      ...monthly.flatMap((m) => [Number(m.ingresos || 0), Number(m.costos || 0)])
    );
    return monthly.map((m) => ({
      label: m.etiqueta,
      ingresos: Number(m.ingresos || 0),
      costos: Number(m.costos || 0),
      ingresosHeightPx: Math.max(3, Math.round((Number(m.ingresos || 0) / max) * 185)),
      costosHeightPx: Math.max(3, Math.round((Number(m.costos || 0) / max) * 185)),
    }));
  });

  protected readonly demandBars = computed<readonly DemandBarItem[]>(() => {
    const demand = this.finanzas()?.demandaServicios ?? [];
    const max = Math.max(1, ...demand.map((d) => Number(d.reservas || 0)));
    return demand.map((d) => ({
      servicio: d.servicio,
      reservas: Number(d.reservas || 0),
      widthPct: Math.round((Number(d.reservas || 0) / max) * 100),
    }));
  });

  ngOnInit(): void {
    this.cargarTodo();
    this.route.queryParamMap.subscribe((params) => {
      const vista = params.get('vista') ?? 'overview';
      this.resetFiltersForVista(vista);
    });
  }

  private resetFiltersForVista(vista: string): void {
    if (vista === 'appointments') {
      this.agendaStatusFilter.set('ALL');
      this.agendaDentistFilter.set('ALL');
      this.agendaDateFilter.set('');
      this.agendaSearch.set('');
    } else if (vista === 'users') {
      this.userRoleFilter.set('ALL');
      this.userSearch.set('');
    } else if (vista === 'messages') {
      this.messageStatusFilter.set('ALL');
      this.messageSearch.set('');
    } else if (vista === 'services') {
      this.serviceSearch.set('');
    }
  }

  private cargarTodo(): void {
    forkJoin({
      resumen: this.api.obtenerResumenAdmin(),
      citas: this.api.listarTodasLasCitas(),
      usuarios: this.api.listarUsuariosAdmin(),
      odontologos: this.api.listarOdontologosAdmin(),
      servicios: this.api.listarServiciosAdmin(),
      finanzas: this.api.obtenerFinanzasAdmin(),
      costosFijos: this.api.obtenerCostosFijos(),
      mensajes: this.api.listarMensajesContactoAdmin(),
    }).subscribe({
      next: ({
        resumen,
        citas,
        usuarios,
        odontologos,
        servicios,
        finanzas,
        costosFijos,
        mensajes,
      }) => {
        this.resumen.set(resumen);
        this.citas.set(
          [...citas].sort((a, b) =>
            `${a.fecha}T${a.horaInicio}`.localeCompare(`${b.fecha}T${b.horaInicio}`)
          )
        );
        this.usuarios.set(usuarios);
        this.odontologos.set(odontologos);
        this.servicios.set(servicios);
        this.finanzas.set(finanzas);
        this.mensajes.set(mensajes);
        this.fixedCostForm.patchValue({
          alquiler: costosFijos.alquiler,
          planilla: costosFijos.planilla,
          servicios: costosFijos.servicios,
          marketing: costosFijos.marketing,
          otros: costosFijos.otros,
        });
      },
      error: (err: unknown) => this.toastStore.error(extractApiErrorMessage(err)),
    });
  }

  protected goToVista(vista: string): void {
    this.resetFiltersForVista(vista);
    void this.router.navigate(['/admin'], { queryParams: { vista } });
  }

  protected onAgendaSearch(event: Event): void {
    this.agendaSearch.set((event.target as HTMLInputElement).value);
  }
  protected onAgendaDateChange(event: Event): void {
    this.agendaDateFilter.set((event.target as HTMLInputElement).value);
  }
  protected onAgendaDentistChange(event: Event): void {
    this.agendaDentistFilter.set((event.target as HTMLSelectElement).value);
  }
  protected onAgendaStatusChange(event: Event): void {
    this.agendaStatusFilter.set((event.target as HTMLSelectElement).value);
  }

  protected onUserSearch(event: Event): void {
    this.userSearch.set((event.target as HTMLInputElement).value);
  }
  protected onUserRoleChange(event: Event): void {
    this.userRoleFilter.set((event.target as HTMLSelectElement).value);
  }

  protected onMessageSearch(event: Event): void {
    this.messageSearch.set((event.target as HTMLInputElement).value);
  }
  protected onMessageStatusChange(event: Event): void {
    this.messageStatusFilter.set((event.target as HTMLSelectElement).value);
  }

  protected onServiceSearch(event: Event): void {
    this.serviceSearch.set((event.target as HTMLInputElement).value);
  }

  protected cambiarEstadoCita(cita: CitaResponse, estado: CitaEstado): void {
    this.api.cambiarEstadoCitaAdmin(cita.id, estado).subscribe({
      next: () => {
        this.toastStore.success(`Cita ${cita.codigo} actualizada a ${estado}.`);
        this.cargarTodo();
        this.notificationStore.refresh(false);
      },
      error: (err: unknown) => this.toastStore.error(extractApiErrorMessage(err)),
    });
  }

  protected cambiarEstadoCitaModal(cita: CitaResponse, estado: CitaEstado): void {
    this.detailModalCita.set(null);
    this.cambiarEstadoCita(cita, estado);
  }

  protected openDentistModalById(dentistId: number): void {
    const doc = this.odontologos().find((d) => d.id === dentistId) ?? null;
    if (doc) this.openDentistModal(doc);
  }

  protected openDentistModal(dentist: OdontologoAdminResponse | null): void {
    this.editingDentist.set(dentist);
    this.dentistFormError.set(null);
    if (dentist) {
      this.dentistForm.patchValue({
        codigo: dentist.codigo,
        nombreCompleto: dentist.nombreCompleto,
        dni: dentist.dni,
        email: dentist.email,
        password: '',
        telefono: dentist.telefono ?? '',
        especialidad: dentist.especialidad,
        colegiatura: dentist.colegiatura,
        fotoUrl: dentist.fotoUrl ?? '',
        activo: dentist.activo,
      });
      this.selectedDentistServiceIds.set(new Set(dentist.servicioIds));
    } else {
      this.dentistForm.reset({
        codigo: '',
        nombreCompleto: '',
        dni: '',
        email: '',
        password: '',
        telefono: '',
        especialidad: '',
        colegiatura: '',
        fotoUrl: '',
        activo: true,
      });
      this.selectedDentistServiceIds.set(new Set());
    }
    this.dentistModalOpen.set(true);
  }

  protected toggleDentistService(srvId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const next = new Set(this.selectedDentistServiceIds());
    if (checked) next.add(srvId);
    else next.delete(srvId);
    this.selectedDentistServiceIds.set(next);
  }

  protected guardarOdontologo(): void {
    this.dentistFormError.set(null);
    const serviceIds = [...this.selectedDentistServiceIds()];
    if (serviceIds.length === 0) {
      this.dentistFormError.set('Selecciona al menos un servicio que atenderá el odontólogo.');
      return;
    }

    const editing = this.editingDentist();
    const raw = this.dentistForm.getRawValue();
    this.savingDentist.set(true);

    if (editing) {
      this.api
        .actualizarOdontologoAdmin(editing.id, {
          nombreCompleto: raw.nombreCompleto.trim(),
          telefono: raw.telefono.trim(),
          especialidad: raw.especialidad.trim(),
          colegiatura: raw.colegiatura.trim().toUpperCase(),
          fotoUrl: raw.fotoUrl.trim() || 'carlos-mendoza.webp',
          activo: raw.activo,
          servicioIds: serviceIds,
        })
        .subscribe({
          next: () => {
            this.savingDentist.set(false);
            this.dentistModalOpen.set(false);
            this.toastStore.success('Odontólogo actualizado correctamente.');
            this.cargarTodo();
          },
          error: (err: unknown) => {
            this.savingDentist.set(false);
            this.dentistFormError.set(applyServerValidationErrors(this.dentistForm, err));
          },
        });
      return;
    }

    this.api
      .crearOdontologoAdmin({
        codigo: raw.codigo.trim().toUpperCase(),
        nombreCompleto: raw.nombreCompleto.trim(),
        dni: raw.dni.trim(),
        email: raw.email.trim().toLowerCase(),
        password: raw.password,
        telefono: raw.telefono.trim(),
        especialidad: raw.especialidad.trim(),
        colegiatura: raw.colegiatura.trim().toUpperCase(),
        fotoUrl: raw.fotoUrl.trim() || 'carlos-mendoza.webp',
        servicioIds: serviceIds,
      })
      .subscribe({
        next: () => {
          this.savingDentist.set(false);
          this.dentistModalOpen.set(false);
          this.toastStore.success('Cuenta de odontólogo creada correctamente.');
          this.cargarTodo();
        },
        error: (err: unknown) => {
          this.savingDentist.set(false);
          this.dentistFormError.set(applyServerValidationErrors(this.dentistForm, err));
        },
      });
  }

  protected openServiceModal(item: ServicioAdminResponse | null): void {
    this.editingService.set(item);
    this.serviceFormError.set(null);
    if (item) {
      this.serviceForm.patchValue({
        codigo: item.codigo,
        nombre: item.nombre,
        especialidad: item.especialidad,
        descripcion: item.descripcion,
        precio: item.precio,
        costo: item.costo,
        duracionMinutos: item.duracionMinutos,
        activo: item.activo,
      });
    } else {
      this.serviceForm.reset({
        codigo: '',
        nombre: '',
        especialidad: '',
        descripcion: '',
        precio: 150,
        costo: 45,
        duracionMinutos: 45,
        activo: true,
      });
    }
    this.serviceModalOpen.set(true);
  }

  protected guardarServicio(): void {
    this.serviceFormError.set(null);
    const editing = this.editingService();
    const raw = this.serviceForm.getRawValue();
    this.savingService.set(true);

    if (editing) {
      this.api
        .actualizarServicioAdmin(editing.id, {
          codigo: editing.codigo,
          nombre: editing.nombre,
          especialidad: editing.especialidad,
          descripcion: editing.descripcion,
          precio: Math.max(0, Number(raw.precio)),
          costo: Math.max(0, Number(raw.costo)),
          duracionMinutos: Math.max(15, Number(raw.duracionMinutos)),
          imagenUrl: editing.imagenUrl || 'consulta-diagnostico.webp',
          activo: raw.activo,
        })
        .subscribe({
          next: () => {
            this.savingService.set(false);
            this.serviceModalOpen.set(false);
            this.toastStore.success('Servicio actualizado.');
            this.cargarTodo();
          },
          error: (err: unknown) => {
            this.savingService.set(false);
            this.serviceFormError.set(applyServerValidationErrors(this.serviceForm, err));
          },
        });
      return;
    }

    const rawCode = raw.codigo.trim().toUpperCase();
    const code = rawCode.startsWith('SRV-')
      ? rawCode
      : `SRV-${rawCode.replace(/\s+/g, '-')}`;

    this.api
      .crearServicioAdmin({
        codigo: code,
        nombre: raw.nombre.trim(),
        especialidad: raw.especialidad.trim(),
        descripcion: raw.descripcion.trim() || 'Tratamiento odontológico profesional.',
        precio: Math.max(0, Number(raw.precio)),
        costo: Math.max(0, Number(raw.costo)),
        duracionMinutos: Math.max(15, Number(raw.duracionMinutos || 30)),
        imagenUrl: 'consulta-diagnostico.webp',
        activo: raw.activo,
      })
      .subscribe({
        next: () => {
          this.savingService.set(false);
          this.serviceModalOpen.set(false);
          this.toastStore.success('Nuevo servicio creado.');
          this.cargarTodo();
        },
        error: (err: unknown) => {
          this.savingService.set(false);
          this.serviceFormError.set(applyServerValidationErrors(this.serviceForm, err));
        },
      });
  }

  protected toggleServiceStatus(item: ServicioAdminResponse): void {
    const willBeActive = !item.activo;
    const msg = willBeActive
      ? `¿Deseas activar el servicio "${item.nombre}" para que los pacientes puedan reservarlo?`
      : `¿Deseas desactivar el servicio "${item.nombre}"? (No aparecerá en el catálogo de reservas para los pacientes)`;
    if (typeof window !== 'undefined' && !window.confirm(msg)) return;

    this.api.cambiarEstadoServicioAdmin(item.id, willBeActive).subscribe({
      next: () => {
        this.toastStore.info(
          `Servicio ${item.nombre} ${willBeActive ? 'activado' : 'desactivado'}.`
        );
        this.cargarTodo();
      },
      error: (err: unknown) => this.toastStore.error(extractApiErrorMessage(err)),
    });
  }

  protected cambiarEstadoMensaje(
    msg: MensajeContactoResponse,
    estado: MensajeContactoEstado
  ): void {
    this.api.cambiarEstadoMensajeAdmin(msg.id, estado).subscribe({
      next: (updated) => {
        this.mensajes.set(
          this.mensajes().map((item) => (item.id === updated.id ? updated : item))
        );
      },
      error: (err: unknown) => this.toastStore.error(extractApiErrorMessage(err)),
    });
  }

  protected guardarCostosFijos(): void {
    this.savingFixedCosts.set(true);
    this.fixedCostSavedMessage.set(false);
    const raw = this.fixedCostForm.getRawValue();
    this.api
      .actualizarCostosFijos({
        alquiler: Math.max(0, Number(raw.alquiler || 0)),
        planilla: Math.max(0, Number(raw.planilla || 0)),
        servicios: Math.max(0, Number(raw.servicios || 0)),
        marketing: Math.max(0, Number(raw.marketing || 0)),
        otros: Math.max(0, Number(raw.otros || 0)),
      })
      .subscribe({
        next: () => {
          this.savingFixedCosts.set(false);
          this.fixedCostSavedMessage.set(true);
          this.cargarTodo();
        },
        error: (err: unknown) => {
          this.savingFixedCosts.set(false);
          this.toastStore.error(extractApiErrorMessage(err));
        },
      });
  }

  protected exportarCsv(): void {
    const items = this.visibleAppointments();
    if (!items.length || typeof document === 'undefined') return;
    const rows = [
      ['Código', 'Fecha', 'Hora', 'Paciente', 'Correo', 'Servicio', 'Odontólogo', 'Estado'],
      ...items.map((item) => [
        item.codigo,
        item.fecha,
        item.horaInicio,
        item.pacienteNombre,
        item.pacienteEmail,
        item.servicioNombre,
        item.odontologoNombre,
        item.estado,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((val) => `"${String(val || '').replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `agenda-smartdent-${this.localDateValue(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected onBackdropClose(event: MouseEvent, modalId: string): void {
    if ((event.target as HTMLElement).id === modalId) {
      if (modalId === 'admin-appointment-modal') this.detailModalCita.set(null);
      if (modalId === 'dentist-modal') this.dentistModalOpen.set(false);
      if (modalId === 'service-modal') this.serviceModalOpen.set(false);
    }
  }

  protected serviceMarginPercent(item: ServicioAdminResponse): number {
    const p = Number(item.precio || 0);
    const c = Number(item.costo || 0);
    return p > 0 ? Math.round(((p - c) / p) * 100) : 0;
  }

  protected roleLabel(role: string): string {
    const mapRole: Record<string, string> = {
      PACIENTE: 'PACIENTE',
      ODONTOLOGO: 'ODONTÓLOGO',
      ADMIN: 'ADMINISTRADOR',
    };
    return mapRole[role] ?? role;
  }

  protected statusClass(status: string): string {
    const mapStatus: Record<string, string> = {
      PENDIENTE: 'bg-amber-50 text-amber-700',
      CONFIRMADA: 'bg-blue-50 text-blue-700',
      ATENDIDA: 'bg-green-50 text-green-700',
      CANCELADA: 'bg-red-50 text-red-700',
    };
    return mapStatus[status] ?? 'bg-slate-100 text-slate-600';
  }

  protected messageBadgeClass(estado: MensajeContactoEstado): string {
    if (estado === 'NUEVO') return 'bg-amber-50 text-amber-700';
    if (estado === 'RESPONDIDO') return 'bg-green-50 text-green-700';
    return 'bg-blue-50 text-blue-700';
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

  protected formatMessageDate(value: string): string {
    if (!value) return '';
    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  private localDateValue(value: Date): string {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(
      value.getDate()
    ).padStart(2, '0')}`;
  }
}
