import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthStore } from '../../core/auth/auth.store';
import { NotificacionResponse, NotificacionTipo } from '../../core/models/smartdent.models';
import { NotificationStore } from '../../core/notifications/notification.store';
import { ToastStore } from '../../core/notifications/toast.store';

interface NavMenuItem {
  readonly label: string;
  readonly icon: string;
  readonly path: string;
  readonly vista: string;
}

@Component({
  selector: 'sd-dashboard-shell',
  imports: [RouterOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-canvas font-sans text-ink">
      @if (sidebarOpen()) {
        <div
          class="fixed inset-0 z-40 bg-navy/50 backdrop-blur-sm lg:hidden"
          (click)="sidebarOpen.set(false)"
        ></div>
      }

      <aside
        class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0"
        [class.-translate-x-full]="!sidebarOpen()"
      >
        <div class="flex h-24 items-center border-b border-slate-100 px-6">
          <a routerLink="/" class="flex items-center">
            <img class="h-10 w-auto" src="/img/branding/logo-smartdent.png" alt="SmartDent" />
          </a>
        </div>

        <div class="px-6 py-5">
          <p class="text-xs font-bold text-navy">{{ panelTitle() }}</p>
          @if (authStore.role() === 'ODONTOLOGO') {
            <p class="mt-1 text-xs font-semibold text-slate-800">{{ authStore.userName() }}</p>
            <span class="mt-1.5 inline-block rounded-md bg-gold-soft/40 px-2 py-0.5 text-[10px] font-bold text-navy">
              {{ doctorSpecialty() }}
            </span>
          } @else {
            <p class="mt-1 text-[10px] text-slate-500">{{ authStore.userName() }}</p>
          }
        </div>

        <nav class="flex-1 space-y-1 px-3 text-xs font-medium" aria-label="Menú del panel">
          @for (item of menuItems(); track item.vista) {
            <a
              [routerLink]="item.path"
              [queryParams]="{ vista: item.vista }"
              (click)="sidebarOpen.set(false)"
              class="flex items-center gap-3 rounded-lg px-4 py-3 transition"
              [class]="
                activeVista() === item.vista
                  ? 'bg-slate-100 font-bold text-navy'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-navy'
              "
            >
              <span class="material-symbols-outlined text-lg">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </a>
          }
          <button
            class="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-slate-600 transition hover:bg-slate-50 hover:text-navy"
            type="button"
            (click)="notificationStore.toggleDrawer(); sidebarOpen.set(false)"
          >
            <span class="flex items-center gap-3">
              <span class="material-symbols-outlined text-lg">notifications_active</span>
              <span>Notificaciones</span>
            </span>
            @if (notificationStore.unreadCount() > 0) {
              <span class="rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-bold text-navy">
                {{ notificationStore.unreadCount() }}
              </span>
            }
          </button>
          <a
            class="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-600 transition hover:bg-slate-50 hover:text-navy"
            routerLink="/"
            (click)="sidebarOpen.set(false)"
          >
            <span class="material-symbols-outlined text-lg">home</span>
            <span>Página Principal</span>
          </a>
        </nav>

        <div class="space-y-2 border-t border-slate-100 p-4">
          @if (authStore.role() === 'PACIENTE') {
            <a
              class="flex w-full items-center justify-center gap-2 rounded-lg bg-gold-soft px-4 py-3 text-xs font-bold text-navy transition hover:bg-yellow-300"
              routerLink="/reservar"
              (click)="sidebarOpen.set(false)"
            >
              <span class="material-symbols-outlined text-base">add</span>
              Nueva Cita
            </a>
            <a
              class="flex items-center gap-3 px-3 py-2 text-xs text-slate-600 hover:text-navy"
              routerLink="/contacto"
            >
              <span class="material-symbols-outlined text-base">help</span>
              Soporte
            </a>
          }
          <button
            class="flex w-full items-center gap-3 px-3 py-2 text-xs font-medium text-red-600"
            type="button"
            (click)="salir()"
          >
            <span class="material-symbols-outlined text-base">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <header class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-5 lg:hidden">
        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            class="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-300 text-navy hover:bg-slate-50 transition-colors"
            type="button"
            aria-label="Abrir menú"
            (click)="sidebarOpen.set(!sidebarOpen())"
          >
            <span class="material-symbols-outlined text-lg">menu</span>
          </button>
          <a routerLink="/" class="shrink-0 flex items-center">
            <img class="h-7 sm:h-8 w-auto max-w-[125px] sm:max-w-none object-contain" src="/img/branding/logo-smartdent.png" alt="SmartDent" />
          </a>
        </div>
        <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            id="notification-bell-mobile"
            class="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-300 text-navy hover:bg-slate-50 transition-colors"
            type="button"
            aria-label="Notificaciones"
            (click)="notificationStore.toggleDrawer()"
          >
            <span class="material-symbols-outlined text-lg">notifications</span>
            @if (notificationStore.unreadCount() > 0) {
              <span
                class="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white shadow-xs"
              >
                {{ notificationStore.unreadCount() > 9 ? '9+' : notificationStore.unreadCount() }}
              </span>
            }
          </button>
          @if (authStore.role() === 'PACIENTE') {
            <a
              class="hidden sm:inline-flex items-center rounded-lg bg-gold px-3 py-2 text-xs font-bold text-white shrink-0 hover:bg-yellow-600 transition-colors"
              routerLink="/reservar"
            >
              Nueva Cita
            </a>
          }
          <button
            class="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-300 text-red-600 hover:bg-red-50 transition-colors"
            type="button"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            (click)="salir()"
          >
            <span class="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </header>

      <!-- Desktop Topbar con Campana de Notificaciones y Perfil -->
      <div class="hidden lg:flex sticky top-0 z-30 h-16 items-center justify-end gap-3.5 border-b border-slate-200 bg-white/95 px-10 backdrop-blur-sm lg:ml-64">
        <button
          id="notification-bell-desktop"
          class="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-navy transition hover:border-gold hover:bg-gold-soft/30"
          type="button"
          aria-label="Centro de notificaciones"
          title="Centro de notificaciones"
          (click)="notificationStore.toggleDrawer()"
        >
          <span class="material-symbols-outlined text-xl">notifications</span>
          @if (notificationStore.unreadCount() > 0) {
            <span
              class="absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow"
            >
              {{ notificationStore.unreadCount() > 9 ? '9+' : notificationStore.unreadCount() }}
            </span>
          }
        </button>

        <div class="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs">
          <span class="grid h-7 w-7 place-items-center rounded-full bg-navy text-[10px] font-bold text-white">
            {{ userInitials() }}
          </span>
          <span class="font-bold text-navy">{{ authStore.userName() }}</span>
        </div>
      </div>

      @if (notificationStore.drawerOpen()) {
        <div
          id="notification-drawer-backdrop"
          class="fixed inset-0 z-50 flex justify-end bg-navy/60 backdrop-blur-xs"
          (click)="onDrawerBackdropClick($event)"
        >
          <aside
            class="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-drawer-title"
          >
            <header class="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div class="flex items-center gap-2.5">
                <span class="grid h-9 w-9 place-items-center rounded-xl bg-navy text-gold-soft">
                  <span class="material-symbols-outlined text-lg">notifications</span>
                </span>
                <div>
                  <h2 id="notification-drawer-title" class="text-sm font-bold text-navy">
                    Centro de Notificaciones
                  </h2>
                  <p class="text-[10px] text-slate-500">
                    {{ notificationStore.unreadCount() }} sin leer · Eventos en tiempo real
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                @if (notificationStore.unreadCount() > 0) {
                  <button
                    class="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-navy transition hover:bg-gold-soft"
                    type="button"
                    (click)="notificationStore.markAllAsRead()"
                  >
                    Marcar leídas
                  </button>
                }
                <button
                  class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                  type="button"
                  aria-label="Cerrar notificaciones"
                  (click)="notificationStore.closeDrawer()"
                >
                  <span class="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </header>

            <div class="flex-1 divide-y divide-slate-100 overflow-y-auto">
              @for (notif of notificationStore.items(); track notif.id) {
                <button
                  type="button"
                  class="flex w-full items-start gap-3.5 px-6 py-4 text-left transition hover:bg-slate-50"
                  [class.bg-amber-50]="!notif.leida"
                  (click)="onNotificationClick(notif)"
                >
                  <span
                    class="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                    [class]="notificationIconTone(notif.tipo)"
                  >
                    <span class="material-symbols-outlined text-lg">
                      {{ notificationIcon(notif.tipo) }}
                    </span>
                  </span>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-2">
                      <strong class="truncate text-xs font-bold text-navy">
                        {{ notif.titulo }}
                      </strong>
                      @if (!notif.leida) {
                        <span class="h-2 w-2 shrink-0 rounded-full bg-gold"></span>
                      }
                    </div>
                    <p class="mt-1 text-xs leading-5 text-slate-600">{{ notif.mensaje }}</p>
                    <div class="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{{ formatNotifDate(notif.creadoEn) }}</span>
                      <span class="font-semibold text-gold">Ir a la sección →</span>
                    </div>
                  </div>
                </button>
              } @empty {
                <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <span class="material-symbols-outlined text-5xl text-slate-300">
                    notifications_off
                  </span>
                  <p class="mt-3 text-sm font-bold text-navy">Sin notificaciones recientes</p>
                  <p class="mt-1 text-xs text-slate-500">
                    Aquí aparecerán las confirmaciones, reservas, cancelaciones y atenciones clínicas.
                  </p>
                </div>
              }
            </div>
          </aside>
        </div>
      }

      <main id="dashboard-top" class="min-h-screen px-5 py-8 lg:ml-64 lg:px-10 lg:py-10">
        <div [class]="authStore.role() === 'ADMIN' ? 'mx-auto max-w-7xl' : 'mx-auto max-w-6xl'">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
})
export class DashboardShellComponent implements OnInit, OnDestroy {
  protected readonly authStore = inject(AuthStore);
  protected readonly notificationStore = inject(NotificationStore);
  private readonly toastStore = inject(ToastStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly sidebarOpen = signal<boolean>(false);

  private readonly rawVista = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('vista'))),
    { initialValue: null }
  );

  protected readonly activeVista = computed<string>(() => {
    const v = this.rawVista();
    if (v) return v;
    return this.authStore.role() === 'ODONTOLOGO' ? 'summary' : 'overview';
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

  protected readonly panelTitle = computed<string>(() => {
    switch (this.authStore.role()) {
      case 'ADMIN':
        return 'Panel de Administración';
      case 'ODONTOLOGO':
        return 'Panel del Odontólogo';
      case 'PACIENTE':
      default:
        return 'Panel del Paciente';
    }
  });

  protected readonly menuItems = computed<readonly NavMenuItem[]>(() => {
    switch (this.authStore.role()) {
      case 'ADMIN':
        return [
          { label: 'Panel de Control', icon: 'dashboard', path: '/admin', vista: 'overview' },
          { label: 'Agenda Global', icon: 'calendar_month', path: '/admin', vista: 'appointments' },
          { label: 'Usuarios', icon: 'groups', path: '/admin', vista: 'users' },
          { label: 'Mensajes', icon: 'inbox', path: '/admin', vista: 'messages' },
          { label: 'Servicios y Tarifas', icon: 'dentistry', path: '/admin', vista: 'services' },
          { label: 'Finanzas y Reportes', icon: 'monitoring', path: '/admin', vista: 'finance' },
        ];
      case 'ODONTOLOGO':
        return [
          { label: 'Resumen', icon: 'dashboard', path: '/odontologo', vista: 'summary' },
          { label: 'Mi Agenda', icon: 'calendar_month', path: '/odontologo', vista: 'agenda' },
          { label: 'Mis Pacientes', icon: 'group', path: '/odontologo', vista: 'patients' },
        ];
      case 'PACIENTE':
      default:
        return [
          { label: 'Panel de Control', icon: 'dashboard', path: '/paciente', vista: 'overview' },
          { label: 'Mis Citas', icon: 'calendar_month', path: '/paciente', vista: 'appointments' },
          { label: 'Historial Clínico', icon: 'history', path: '/paciente', vista: 'history' },
          { label: 'Facturación', icon: 'receipt_long', path: '/paciente', vista: 'billing' },
          { label: 'Configuración', icon: 'settings', path: '/paciente', vista: 'settings' },
        ];
    }
  });

  ngOnInit(): void {
    this.notificationStore.startPolling();
  }

  ngOnDestroy(): void {
    this.notificationStore.stopPolling();
  }

  protected onDrawerBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).id === 'notification-drawer-backdrop') {
      this.notificationStore.closeDrawer();
    }
  }

  protected onNotificationClick(notif: NotificacionResponse): void {
    this.notificationStore.markAsRead(notif.id);
    this.notificationStore.closeDrawer();
    const role = this.authStore.role();
    const basePath =
      role === 'ADMIN' ? '/admin' : role === 'ODONTOLOGO' ? '/odontologo' : '/paciente';
    void this.router.navigate([basePath], {
      queryParams: { vista: notif.vistaDestino || undefined },
    });
  }

  protected notificationIcon(tipo: NotificacionTipo): string {
    switch (tipo) {
      case 'CITA_CONFIRMADA':
        return 'event_available';
      case 'CITA_ATENDIDA':
        return 'clinical_notes';
      case 'CITA_CANCELADA':
        return 'event_busy';
      case 'CITA_REPROGRAMADA':
        return 'update';
      case 'CONTACTO_NUEVO':
        return 'mail';
      case 'CITA_CREADA':
      default:
        return 'calendar_add_on';
    }
  }

  protected notificationIconTone(tipo: NotificacionTipo): string {
    switch (tipo) {
      case 'CITA_CONFIRMADA':
        return 'bg-blue-50 text-blue-700';
      case 'CITA_ATENDIDA':
        return 'bg-green-50 text-green-700';
      case 'CITA_CANCELADA':
        return 'bg-red-50 text-red-700';
      case 'CITA_REPROGRAMADA':
        return 'bg-amber-50 text-amber-700';
      case 'CONTACTO_NUEVO':
        return 'bg-purple-50 text-purple-700';
      case 'CITA_CREADA':
      default:
        return 'bg-gold-soft/60 text-navy';
    }
  }

  protected formatNotifDate(value: string): string {
    if (!value) return '';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  protected salir(): void {
    this.notificationStore.stopPolling();
    this.authStore.clear();
    this.sidebarOpen.set(false);
    this.toastStore.info('Has cerrado sesión exitosamente.');
    void this.router.navigate(['/']);
  }
}
