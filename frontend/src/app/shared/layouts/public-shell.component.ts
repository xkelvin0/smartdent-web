import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { ToastStore } from '../../core/notifications/toast.store';

@Component({
  selector: 'sd-public-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex flex-col bg-background font-body-md text-body-md text-on-background selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      <header class="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/75 shadow-sm backdrop-blur-md transition-colors duration-300">
        <div class="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 lg:px-8">
          <a class="flex shrink-0 items-center" routerLink="/" aria-label="SmartDent - Inicio">
            <img class="h-10 w-auto" src="/img/branding/logo-smartdent.png" alt="SmartDent" />
          </a>

          <nav class="hidden items-center gap-7 text-sm font-medium lg:flex" aria-label="Navegación principal">
            <a
              routerLink="/"
              [routerLinkActiveOptions]="{ exact: true }"
              routerLinkActive="border-b-2 border-[#8a6d00] pb-1 font-bold text-[#071426]"
              class="text-slate-600 transition hover:text-[#8a6d00]"
            >Inicio</a>
            <a
              routerLink="/servicios"
              routerLinkActive="border-b-2 border-[#8a6d00] pb-1 font-bold text-[#071426]"
              class="text-slate-600 transition hover:text-[#8a6d00]"
            >Servicios</a>
            <a
              routerLink="/nosotros"
              routerLinkActive="border-b-2 border-[#8a6d00] pb-1 font-bold text-[#071426]"
              class="text-slate-600 transition hover:text-[#8a6d00]"
            >Nosotros</a>
            <a
              routerLink="/contacto"
              routerLinkActive="border-b-2 border-[#8a6d00] pb-1 font-bold text-[#071426]"
              class="text-slate-600 transition hover:text-[#8a6d00]"
            >Contacto</a>
          </nav>

          @if (!authStore.isAuthenticated()) {
            <div class="flex shrink-0 items-center gap-3">
              <a
                class="hidden rounded-lg border border-[#071426] px-4 py-2.5 text-xs font-semibold text-[#071426] transition hover:bg-slate-100 lg:inline-flex"
                routerLink="/login"
              >Iniciar Sesión</a>
              <button
                class="hidden rounded-lg bg-[#8a6d00] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#735c00] hover:shadow-md lg:inline-flex"
                type="button"
                (click)="onAgendarCita()"
              >Agendar Cita</button>
              <button
                class="ml-1 flex items-center justify-center rounded-lg p-2 text-[#071426] transition hover:bg-slate-100 lg:hidden"
                type="button"
                aria-label="Abrir menú"
                (click)="mobileOpen.set(!mobileOpen())"
              >
                <span class="material-symbols-outlined text-2xl">menu</span>
              </button>
            </div>
          } @else {
            <div class="flex shrink-0 items-center gap-2 sm:gap-3">
              <div class="hidden text-right xl:block">
                <p class="m-0 text-xs font-semibold leading-tight text-[#071426]">
                  Bienvenido, {{ authStore.session()?.nombreCompleto }}
                </p>
                <p class="m-0 text-[10px] leading-tight text-slate-500">{{ roleLabel() }}</p>
              </div>
              @if (authStore.role() === 'PACIENTE') {
                <a
                  routerLink="/paciente"
                  class="hidden rounded-lg border border-[#071426] px-3 py-2.5 text-xs font-semibold text-[#071426] transition hover:bg-slate-100 lg:inline-flex"
                >Mi Panel</a>
                <a
                  routerLink="/paciente/reservar"
                  class="hidden rounded-lg bg-[#8a6d00] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#735c00] hover:shadow-md lg:inline-flex"
                >Agendar Cita</a>
              } @else if (authStore.role() === 'ODONTOLOGO') {
                <a
                  routerLink="/odontologo"
                  class="hidden rounded-lg bg-[#8a6d00] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#735c00] hover:shadow-md lg:inline-flex"
                >Mi Agenda</a>
              } @else {
                <a
                  routerLink="/admin"
                  class="hidden rounded-lg bg-[#8a6d00] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#735c00] hover:shadow-md lg:inline-flex"
                >Panel Administrativo</a>
              }
              <button
                type="button"
                (click)="cerrarSesion()"
                class="hidden rounded-lg border border-[#071426] px-3 py-2.5 text-xs font-semibold text-[#071426] transition hover:bg-slate-100 lg:inline-flex"
              >Cerrar Sesión</button>
              <button
                class="ml-1 flex items-center justify-center rounded-lg p-2 text-[#071426] transition hover:bg-slate-100 lg:hidden"
                type="button"
                aria-label="Abrir menú"
                (click)="mobileOpen.set(!mobileOpen())"
              >
                <span class="material-symbols-outlined text-2xl">menu</span>
              </button>
            </div>
          }
        </div>

        @if (mobileOpen()) {
          <div class="flex flex-col gap-4 border-t border-slate-200 bg-white px-5 py-6 shadow-lg lg:hidden absolute w-full left-0 top-20">
            @if (authStore.isAuthenticated()) {
              <div class="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100 mb-1">
                <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#071426] text-white">
                  <span class="material-symbols-outlined text-xl">person</span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-bold text-[#071426]">
                    Bienvenido, {{ authStore.session()?.nombreCompleto }}
                  </p>
                  <p class="text-xs text-slate-500 font-medium">{{ roleLabel() }}</p>
                </div>
              </div>
            }
            <a routerLink="/" (click)="mobileOpen.set(false)" class="text-base text-slate-600 transition hover:text-[#8a6d00]">Inicio</a>
            <a routerLink="/servicios" (click)="mobileOpen.set(false)" class="text-base text-slate-600 transition hover:text-[#8a6d00]">Servicios</a>
            <a routerLink="/nosotros" (click)="mobileOpen.set(false)" class="text-base text-slate-600 transition hover:text-[#8a6d00]">Nosotros</a>
            <a routerLink="/contacto" (click)="mobileOpen.set(false)" class="text-base text-slate-600 transition hover:text-[#8a6d00]">Contacto</a>

            <div class="mt-2 flex flex-col gap-3 border-t border-slate-100 pt-4">
              @if (!authStore.isAuthenticated()) {
                <button
                  class="flex items-center justify-center rounded-lg bg-[#8a6d00] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#735c00]"
                  type="button"
                  (click)="mobileOpen.set(false); onAgendarCita()"
                >Agendar Cita</button>
                <a
                  class="flex items-center justify-center rounded-lg border border-[#071426] px-4 py-3 text-sm font-semibold text-[#071426] transition hover:bg-slate-50"
                  routerLink="/login"
                  (click)="mobileOpen.set(false)"
                >Iniciar Sesión</a>
              } @else {
                @if (authStore.role() === 'PACIENTE') {
                  <a
                    class="flex items-center justify-center rounded-lg bg-[#8a6d00] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#735c00]"
                    routerLink="/paciente/reservar"
                    (click)="mobileOpen.set(false)"
                  >Agendar Cita</a>
                  <a
                    class="flex items-center justify-center rounded-lg border border-[#071426] px-4 py-3 text-sm font-semibold text-[#071426] transition hover:bg-slate-50"
                    routerLink="/paciente"
                    (click)="mobileOpen.set(false)"
                  >Mi Panel</a>
                } @else {
                  <a
                    class="flex items-center justify-center rounded-lg bg-[#8a6d00] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#735c00]"
                    [routerLink]="authStore.dashboardPath()"
                    (click)="mobileOpen.set(false)"
                  >{{ authStore.role() === 'ODONTOLOGO' ? 'Mi Agenda' : 'Panel Administrativo' }}</a>
                }
                <button
                  class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                  type="button"
                  (click)="cerrarSesion()"
                >Cerrar Sesión</button>
              }
            </div>
          </div>
        }
      </header>

      <main class="flex-grow">
        <router-outlet />
      </main>

      <footer id="contacto" class="bg-[#040d19] text-slate-300">
        <div class="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1.2fr] lg:px-8">
          <section aria-labelledby="footer-brand-title">
            <a class="inline-flex rounded-xl bg-white p-3 shadow-sm" routerLink="/" aria-label="SmartDent - Inicio">
              <img class="h-11 w-auto" src="/img/branding/logo-smartdent.png" alt="SmartDent" />
            </a>
            <h2 id="footer-brand-title" class="mt-5 text-base font-bold text-white">Cuidado dental con confianza</h2>
            <p class="mt-3 max-w-sm text-xs leading-6 text-slate-400">
              Atención odontológica integral, tecnología moderna y especialistas comprometidos con la salud de cada paciente.
            </p>
            <nav class="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs" aria-label="Enlaces del pie de página">
              <a class="transition hover:text-[#f4d77d]" routerLink="/">Inicio</a>
              <a class="transition hover:text-[#f4d77d]" routerLink="/servicios">Servicios</a>
              <a class="transition hover:text-[#f4d77d]" routerLink="/nosotros">Nosotros</a>
              <a class="transition hover:text-[#f4d77d]" routerLink="/contacto">Contacto</a>
            </nav>
          </section>

          <section aria-labelledby="footer-contact-title">
            <h2 id="footer-contact-title" class="text-sm font-bold text-white">Contacto y atención</h2>
            <address class="mt-5 space-y-3 text-xs not-italic leading-5 text-slate-400">
              <p>
                <strong class="block text-slate-200">Ubicación</strong>
                <a
                  class="hover:text-[#f4d77d]"
                  href="https://www.google.com/maps/dir/?api=1&destination=-11.877606280714636%2C-77.13048624306016"
                  target="_blank"
                  rel="noopener noreferrer"
                >Av. La Playa Manzana D, Ventanilla 07061</a>
                <span class="mt-0.5 block text-[10px]">Cómo llegar al negocio</span>
              </p>
              <p>
                <strong class="block text-slate-200">Teléfono</strong>
                <a class="hover:text-[#f4d77d]" href="tel:+51987654321">+51 987 654 321</a>
              </p>
              <p>
                <strong class="block text-slate-200">Correo electrónico</strong>
                <a class="hover:text-[#f4d77d]" href="mailto:contacto@smartdent.pe">contacto&#64;smartdent.pe</a>
              </p>
              <p>
                <strong class="block text-slate-200">Horario</strong>
                Lunes a sábado · 8:00 a. m. – 8:00 p. m.
              </p>
            </address>
          </section>

          <section aria-labelledby="footer-team-title">
            <div class="inline-flex rounded-lg bg-white p-2.5">
              <img class="h-10 w-auto" src="/img/branding/logo-utp.svg" alt="Universidad Tecnológica del Perú" />
            </div>
            <h2 id="footer-team-title" class="mt-5 text-sm font-bold text-white">Integrantes del grupo</h2>
            <ul class="mt-3 space-y-2 text-xs leading-5 text-slate-400">
              <li><strong class="block text-slate-200">Acevedo Huarachi Kelvin Jesus</strong>Código: U23309803</li>
              <li><strong class="block text-slate-200">Añorga Pinedo Paolo Alexander</strong>Código: U23305864</li>
              <li><strong class="block text-slate-200">Calle Paredes Maykol Adan</strong>Código: U23242558</li>
              <li><strong class="block text-slate-200">Salinas Perez Joseph Sebastian</strong>Código: U23325202</li>
            </ul>
            <p class="mt-4 text-[10px] uppercase tracking-[.14em] text-slate-500">Proyecto académico · Desarrollo Web Integrado</p>
          </section>
        </div>
        <div class="border-t border-white/10">
          <div class="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-center text-[11px] text-slate-500 sm:flex-row sm:justify-between sm:text-left lg:px-8">
            <p>© 2026 SmartDent. Todos los derechos reservados.</p>
            <p>Excelencia clínica a través de la sofisticación.</p>
          </div>
        </div>
      </footer>

      @if (authModalOpen()) {
        <div
          class="fixed inset-0 z-[100] flex items-center justify-center bg-[#071426]/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shared-auth-title"
        >
          <button
            class="absolute inset-0 cursor-default"
            type="button"
            aria-label="Cerrar ventana"
            (click)="authModalOpen.set(false)"
          ></button>
          <div class="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <button
              class="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#071426]"
              type="button"
              aria-label="Cerrar"
              (click)="authModalOpen.set(false)"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
            <span class="material-symbols-outlined mb-5 inline-block rounded-lg bg-yellow-50 p-3 text-3xl text-[#8a6d00]">calendar_month</span>
            <h2 id="shared-auth-title" class="text-2xl font-bold text-[#071426]">Inicia sesión para reservar</h2>
            <p class="mt-3 leading-6 text-slate-600">Necesitas una cuenta de paciente para guardar y gestionar tus citas.</p>
            <div class="mt-7 grid gap-3 sm:grid-cols-2">
              <a
                routerLink="/login"
                (click)="authModalOpen.set(false)"
                class="rounded-lg bg-[#071426] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-slate-800"
              >Iniciar Sesión</a>
              <a
                routerLink="/registro"
                (click)="authModalOpen.set(false)"
                class="rounded-lg border border-[#071426] px-5 py-3 text-center text-sm font-bold text-[#071426] transition hover:bg-slate-50"
              >Crear una cuenta</a>
            </div>
            <button
              class="mt-5 w-full text-xs font-semibold text-slate-500 hover:text-[#071426]"
              type="button"
              (click)="authModalOpen.set(false)"
            >Ahora no</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class PublicShellComponent {
  protected readonly authStore = inject(AuthStore);
  private readonly toastStore = inject(ToastStore);
  private readonly router = inject(Router);
  protected readonly mobileOpen = signal<boolean>(false);
  protected readonly authModalOpen = signal<boolean>(false);

  protected readonly roleLabel = computed<string>(() => {
    const role = this.authStore.role();
    if (role === 'ADMIN') return 'Administrador';
    if (role === 'ODONTOLOGO') return 'Odontólogo';
    return 'Paciente';
  });

  protected onAgendarCita(): void {
    const role = this.authStore.role();
    if (role === 'PACIENTE') {
      void this.router.navigate(['/paciente/reservar']);
      return;
    }
    if (role === 'ODONTOLOGO') {
      void this.router.navigate(['/odontologo']);
      return;
    }
    if (role === 'ADMIN') {
      void this.router.navigate(['/admin']);
      return;
    }
    this.authModalOpen.set(true);
  }

  protected cerrarSesion(): void {
    this.authStore.clear();
    this.mobileOpen.set(false);
    this.toastStore.info('Has cerrado sesión exitosamente.');
    void this.router.navigate(['/']);
  }
}
