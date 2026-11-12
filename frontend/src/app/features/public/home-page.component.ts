import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  selector: 'sd-home-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hero Section -->
    <section
      id="inicio"
      class="relative w-full overflow-hidden bg-primary text-on-primary min-h-[819px] flex items-center"
    >
      <div class="absolute inset-0 z-0">
        <div
          class="bg-cover bg-center w-full h-full opacity-40"
          style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCOxLYrrV8-oxj6QzOVFgJ8oXw5F2jZ5_lKdKOQTkU8KmiyFgHG1cdz6hNReTA0pFEou3trA4yOQb90ETrb8IVyy4JTvNQk1w988ut7Fj6db31asNnjjtvDmrOkNtWSxN1pLNEPO62cYW8LNol7jAAbeDcxLb903kV43nunxTrS3ItvVqJFHyODT-KsiASk-8wC2XaJN65pnOHtyO1IAcUEbJ_XGtxNpUAyP9RtcS0izaeq9BM-NrEB')"
        ></div>
        <div class="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent"></div>
      </div>
      <div class="relative z-10 w-full max-w-container-max mx-auto px-8 md:px-20 grid md:grid-cols-2 gap-12 items-center">
        <div class="flex flex-col gap-6 items-start">
          <span class="font-label-md text-label-md uppercase tracking-wider text-secondary-fixed">
            Odontología de Precisión
          </span>
          <h1 class="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-white leading-tight">
            Excelencia Clínica a través de la Sofisticación.
          </h1>
          <p class="font-body-lg text-body-lg text-primary-fixed-dim max-w-lg">
            Experimente una atención dental de primer nivel en un entorno diseñado para su confort y tranquilidad. Tecnología avanzada en manos expertas.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            <button
              type="button"
              (click)="onAgendarCita()"
              class="font-label-md text-label-md bg-secondary text-white px-8 py-3 rounded-lg shadow-sm hover:shadow-md hover:bg-[#8a6d00] transition-all w-full sm:w-auto text-center flex items-center justify-center gap-2"
            >
              Agendar Cita
              <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            <a
              routerLink="/nosotros"
              class="font-label-md text-label-md bg-transparent border border-primary-fixed text-primary-fixed px-8 py-3 rounded-lg hover:bg-white/10 transition-all w-full sm:w-auto text-center inline-block"
            >
              Conocer la Clínica
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Services Section -->
    <section id="servicios" class="py-xl md:py-[120px] bg-background w-full">
      <div class="max-w-container-max mx-auto px-8 md:px-20">
        <div class="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div class="max-w-2xl">
            <h2 class="font-headline-md text-headline-md text-primary mb-4">
              Nuestros Servicios Especializados
            </h2>
            <p class="font-body-md text-body-md text-on-surface-variant">
              Soluciones integrales para su salud y estética dental, respaldadas por tecnología de vanguardia y especialistas altamente cualificados.
            </p>
          </div>
          <a
            routerLink="/servicios"
            class="font-label-md text-label-md text-secondary hover:text-secondary-fixed transition-colors flex items-center gap-1 group"
          >
            Ver todos los servicios
            <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
          <article class="bg-white rounded-xl border border-outline-variant/30 flex flex-col hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(30,41,59,0.10)] transition-all duration-300 group overflow-hidden">
            <div class="aspect-[4/3] overflow-hidden bg-surface-container-low">
              <img
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                src="/img/servicios/implantologia-avanzada.webp"
                alt="Odontólogo planificando un tratamiento de implantología con tecnología digital"
                loading="lazy"
              />
            </div>
            <div class="p-6 flex flex-col flex-1 border-t-2 border-secondary">
              <span class="font-label-sm text-label-sm uppercase tracking-wider text-secondary mb-3">Implantología</span>
              <h3 class="font-headline-sm text-headline-sm text-primary mb-3">Implantología Avanzada</h3>
              <p class="font-body-md text-body-md text-on-surface-variant">
                Restauración funcional y estética permanente mediante implantes guiados por computadora 3D.
              </p>
            </div>
          </article>

          <article class="bg-white rounded-xl border border-outline-variant/30 flex flex-col hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(30,41,59,0.10)] transition-all duration-300 group overflow-hidden">
            <div class="aspect-[4/3] overflow-hidden bg-surface-container-low">
              <img
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                src="/img/servicios/diseno-sonrisa.webp"
                alt="Odontóloga mostrando a una paciente su diseño digital de sonrisa"
                loading="lazy"
              />
            </div>
            <div class="p-6 flex flex-col flex-1 border-t-2 border-secondary">
              <span class="font-label-sm text-label-sm uppercase tracking-wider text-secondary mb-3">Estética dental</span>
              <h3 class="font-headline-sm text-headline-sm text-primary mb-3">Diseño de Sonrisa</h3>
              <p class="font-body-md text-body-md text-on-surface-variant">
                Carillas de porcelana ultra delgadas y planificación digital personalizada.
              </p>
            </div>
          </article>

          <article class="bg-white rounded-xl border border-outline-variant/30 flex flex-col hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(30,41,59,0.10)] transition-all duration-300 group overflow-hidden">
            <div class="aspect-[4/3] overflow-hidden bg-surface-container-low">
              <img
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                src="/img/servicios/endodoncia-microscopica.webp"
                alt="Especialista realizando una endodoncia con microscopio odontológico"
                loading="lazy"
              />
            </div>
            <div class="p-6 flex flex-col flex-1 border-t-2 border-secondary">
              <span class="font-label-sm text-label-sm uppercase tracking-wider text-secondary mb-3">Alta precisión</span>
              <h3 class="font-headline-sm text-headline-sm text-primary mb-3">Endodoncia Microscópica</h3>
              <p class="font-body-md text-body-md text-on-surface-variant">
                Tratamientos de conducto precisos, seguros y con mayor comodidad para el paciente.
              </p>
            </div>
          </article>

          <article class="bg-white rounded-xl border border-outline-variant/30 flex flex-col hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(30,41,59,0.10)] transition-all duration-300 group overflow-hidden">
            <div class="aspect-[4/3] overflow-hidden bg-surface-container-low">
              <img
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                src="/img/servicios/periodoncia-laser.webp"
                alt="Periodoncista explicando a una paciente un tratamiento dental con láser"
                loading="lazy"
              />
            </div>
            <div class="p-6 flex flex-col flex-1 border-t-2 border-secondary">
              <span class="font-label-sm text-label-sm uppercase tracking-wider text-secondary mb-3">Tecnología láser</span>
              <h3 class="font-headline-sm text-headline-sm text-primary mb-3">Periodoncia y Encías</h3>
              <p class="font-body-md text-body-md text-on-surface-variant">
                Tratamientos mínimamente invasivos para proteger y recuperar la salud gingival.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Staff Médico Section -->
    <section id="nosotros" class="py-xl md:py-[120px] bg-surface w-full">
      <div class="max-w-container-max mx-auto px-8 md:px-20">
        <div class="text-center mb-12">
          <h2 class="font-headline-md text-headline-md text-primary mb-4">Nuestro Equipo de Especialistas</h2>
          <p class="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
            Profesionales dedicados a tu salud y bienestar dental.
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          <div class="bg-white rounded-xl border border-outline-variant/30 overflow-hidden hover:shadow-md transition-all group">
            <div class="aspect-[4/5] bg-surface-container relative overflow-hidden">
              <img
                class="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                src="/img/odontologos/carlos-mendoza.webp"
                alt="Dr. Carlos Mendoza"
                loading="lazy"
              />
            </div>
            <div class="p-6 text-center">
              <h4 class="font-headline-sm text-headline-sm text-primary">Dr. Carlos Mendoza</h4>
              <p class="text-secondary font-label-sm uppercase tracking-wider mb-2">Director Médico</p>
              <p class="font-body-md text-body-md text-on-surface-variant">Especialista en Cirugía Maxilofacial</p>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-outline-variant/30 overflow-hidden hover:shadow-md transition-all group">
            <div class="aspect-[4/5] bg-surface-container relative overflow-hidden">
              <img
                class="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                src="/img/odontologos/elena-ruiz.webp"
                alt="Dra. Elena Ruiz"
                loading="lazy"
              />
            </div>
            <div class="p-6 text-center">
              <h4 class="font-headline-sm text-headline-sm text-primary">Dra. Elena Ruiz</h4>
              <p class="text-secondary font-label-sm uppercase tracking-wider mb-2">Ortodoncista</p>
              <p class="font-body-md text-body-md text-on-surface-variant">Experta en Ortodoncia Invisible</p>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-outline-variant/30 overflow-hidden hover:shadow-md transition-all group">
            <div class="aspect-[4/5] bg-surface-container relative overflow-hidden">
              <img
                class="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                src="/img/odontologos/miguel-silva.webp"
                alt="Dr. Miguel Silva"
                loading="lazy"
              />
            </div>
            <div class="p-6 text-center">
              <h4 class="font-headline-sm text-headline-sm text-primary">Dr. Miguel Silva</h4>
              <p class="text-secondary font-label-sm uppercase tracking-wider mb-2">Endodoncista</p>
              <p class="font-body-md text-body-md text-on-surface-variant">Especialista en Endodoncia Microscópica</p>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-outline-variant/30 overflow-hidden hover:shadow-md transition-all group">
            <div class="aspect-[4/5] bg-surface-container relative overflow-hidden">
              <img
                class="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                src="/img/odontologos/lucia-torres.webp"
                alt="Dra. Lucía Torres"
                loading="lazy"
              />
            </div>
            <div class="p-6 text-center">
              <h4 class="font-headline-sm text-headline-sm text-primary">Dra. Lucía Torres</h4>
              <p class="text-secondary font-label-sm uppercase tracking-wider mb-2">Periodoncista</p>
              <p class="font-body-md text-body-md text-on-surface-variant">Especialista en Periodoncia y Odontopediatría</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Call to Action Section -->
    <section id="clinica" class="py-xl bg-primary-container text-on-primary w-full relative overflow-hidden">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-secondary via-transparent to-transparent"></div>
      </div>
      <div class="max-w-container-max mx-auto px-8 md:px-20 relative z-10 text-center">
        <h2 class="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-white mb-6">
          ¿Listo para transformar tu sonrisa?
        </h2>
        <p class="font-body-lg text-body-lg text-primary-fixed-dim max-w-2xl mx-auto mb-10">
          Agenda tu primera consulta de evaluación hoy mismo y descubre la excelencia en cuidado dental.
        </p>
        <button
          type="button"
          (click)="onAgendarCita()"
          class="font-label-md text-label-md bg-secondary text-white px-10 py-4 rounded-lg shadow-sm hover:shadow-md hover:bg-[#8a6d00] transition-all inline-flex items-center gap-2"
        >
          Agendar Cita Ahora
          <span class="material-symbols-outlined">calendar_today</span>
        </button>
      </div>
    </section>

    <!-- Modal de autenticación para reservar -->
    @if (authModalOpen()) {
      <div
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          type="button"
          class="absolute inset-0 bg-primary/70 backdrop-blur-sm"
          aria-label="Cerrar ventana"
          (click)="authModalOpen.set(false)"
        ></button>
        <div class="relative w-full max-w-md rounded-xl bg-white p-8 shadow-2xl border border-outline-variant/40">
          <button
            type="button"
            class="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors"
            aria-label="Cerrar"
            (click)="authModalOpen.set(false)"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
          <div class="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-fixed">
            <span class="material-symbols-outlined text-secondary" style="font-variation-settings: 'FILL' 1;">calendar_month</span>
          </div>
          <h2 id="auth-modal-title" class="font-headline-md text-headline-md text-primary mb-3">
            Inicia sesión para agendar
          </h2>
          <p class="font-body-md text-body-md text-on-surface-variant mb-7">
            Para consultar horarios disponibles y guardar tu cita necesitas acceder a tu cuenta de paciente.
          </p>
          <div class="flex flex-col sm:flex-row gap-3">
            <a
              routerLink="/login"
              (click)="authModalOpen.set(false)"
              class="flex-1 rounded-lg bg-primary px-5 py-3 text-center font-label-md text-label-md text-white hover:bg-primary-container transition-colors"
            >Iniciar Sesión</a>
            <a
              routerLink="/registro"
              (click)="authModalOpen.set(false)"
              class="flex-1 rounded-lg border border-primary px-5 py-3 text-center font-label-md text-label-md text-primary hover:bg-surface-container-low transition-colors"
            >Crear una cuenta</a>
          </div>
          <button
            type="button"
            class="mt-5 w-full font-label-sm text-label-sm text-on-surface-variant hover:text-primary"
            (click)="authModalOpen.set(false)"
          >Ahora no</button>
        </div>
      </div>
    }
  `,
})
export class HomePageComponent {
  protected readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  protected readonly authModalOpen = signal<boolean>(false);

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
}
