import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { ServicioResponse } from '../../core/models/smartdent.models';
import { SmartDentApiService } from '../../core/services/smartdent-api.service';
import { resolveServicioImg } from '../../shared/utils/asset-url.util';

interface ServicioCatalogoMeta {
  readonly benefits: readonly [string, string];
  readonly sessionsLabel: string;
}

const CATALOG_META: Readonly<Record<string, ServicioCatalogoMeta>> = {
  'consulta y diagnóstico': { benefits: ['Diagnóstico completo', 'Plan personalizado'], sessionsLabel: 'Una sesión' },
  'limpieza y profilaxis': { benefits: ['Prevención de caries', 'Encías saludables'], sessionsLabel: 'Cada 6 meses' },
  'urgencias dentales': { benefits: ['Evaluación prioritaria', 'Control del dolor'], sessionsLabel: 'Según diagnóstico' },
  'implantología avanzada': { benefits: ['Planificación 3D', 'Evaluación personalizada'], sessionsLabel: 'Varias sesiones' },
  'diseño de sonrisa': { benefits: ['Simulación digital', 'Resultado natural'], sessionsLabel: 'Según tratamiento' },
  'restauraciones con resina': { benefits: ['Acabado estético', 'Conservación dental'], sessionsLabel: 'Una sesión' },
  'blanqueamiento dental': { benefits: ['Supervisión profesional', 'Tono uniforme'], sessionsLabel: 'Una o dos sesiones' },
  'carillas dentales': { benefits: ['Diseño personalizado', 'Apariencia natural'], sessionsLabel: 'Dos o más sesiones' },
  'ortodoncia convencional': { benefits: ['Control especializado', 'Corrección funcional'], sessionsLabel: 'Controles mensuales' },
  'ortodoncia invisible': { benefits: ['Alineadores removibles', 'Planificación digital'], sessionsLabel: 'Controles periódicos' },
  odontopediatría: { benefits: ['Atención amigable', 'Prevención temprana'], sessionsLabel: 'Según diagnóstico' },
  'prótesis dentales': { benefits: ['Diseño funcional', 'Ajuste personalizado'], sessionsLabel: 'Varias sesiones' },
  'endodoncia microscópica': { benefits: ['Microscopio clínico', 'Mayor precisión'], sessionsLabel: 'Una o dos sesiones' },
  'extracciones dentales': { benefits: ['Procedimiento seguro', 'Control posoperatorio'], sessionsLabel: 'Una sesión' },
  'cirugía de terceros molares': { benefits: ['Evaluación radiográfica', 'Seguimiento clínico'], sessionsLabel: 'Una sesión' },
  'periodoncia y encías': { benefits: ['Evaluación periodontal', 'Tratamiento láser'], sessionsLabel: 'Según diagnóstico' },
};

@Component({
  selector: 'sd-servicios-page',
  imports: [RouterLink, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="relative overflow-hidden bg-navy py-20 text-white md:py-28">
      <div class="absolute inset-0">
        <img
          class="h-full w-full object-cover object-center"
          src="/img/heroes/hero-servicios.png"
          alt="Odontólogo utilizando tecnología de diagnóstico digital"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/35"></div>
        <div class="absolute inset-0 bg-navy/20"></div>
      </div>
      <div class="relative mx-auto max-w-7xl px-5 lg:px-8">
        <p class="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-gold-soft">Cuidado odontológico integral</p>
        <h1 class="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
          Servicios diseñados para cuidar y transformar tu sonrisa
        </h1>
        <p class="mt-6 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
          Combinamos especialistas experimentados, diagnóstico digital y procedimientos precisos para ofrecerte una atención segura y personalizada.
        </p>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24" aria-labelledby="services-title">
      <div class="mb-8 max-w-3xl">
        <p class="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-gold">Atención odontológica integral</p>
        <h2 id="services-title" class="text-3xl font-bold tracking-tight text-navy md:text-4xl">Todos nuestros servicios</h2>
        <p class="mt-4 text-sm leading-7 text-slate-600 md:text-base">
          Encuentra tratamientos preventivos, estéticos y especializados para cada etapa de tu salud bucal. La duración es referencial.
        </p>
      </div>

      <div class="mb-10 flex flex-col sm:flex-row gap-4 items-center">
        <div class="relative w-full sm:max-w-md">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            type="text"
            [value]="terminoBusqueda()"
            (input)="onSearch($event)"
            class="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy transition-colors"
            placeholder="Buscar tratamiento..."
          />
        </div>
        <select
          [value]="especialidadActiva()"
          (change)="onCategoryChange($event)"
          class="w-full sm:w-auto min-w-[220px] rounded-lg border border-slate-300 py-3 px-4 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy bg-white cursor-pointer transition-colors"
        >
          <option value="TODAS">Todas las categorías</option>
          @for (esp of especialidades(); track esp) {
            <option [value]="esp">{{ esp }}</option>
          }
        </select>
      </div>

      @if (loading()) {
        <div class="grid items-stretch gap-8 md:grid-cols-2">
          @for (n of [1, 2, 3, 4, 5, 6]; track n) {
            <article class="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div class="aspect-[4/3] bg-slate-200 animate-pulse"></div>
              <div class="border-t-2 border-gold p-7 h-[320px] flex flex-col justify-between">
                <div>
                  <div class="h-3 w-1/3 bg-slate-200 rounded animate-pulse mb-3"></div>
                  <div class="h-6 w-3/4 bg-slate-200 rounded animate-pulse mb-4"></div>
                  <div class="space-y-2">
                    <div class="h-3 w-full bg-slate-200 rounded animate-pulse"></div>
                    <div class="h-3 w-5/6 bg-slate-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </article>
          }
        </div>
      } @else {
        <div class="grid items-stretch gap-8 md:grid-cols-2">
          @for (servicio of serviciosFiltrados(); track servicio.id) {
            <article class="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div class="aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  [src]="servicioImg(servicio.imagenUrl)"
                  [alt]="'Servicio de ' + servicio.nombre + ' en SmartDent'"
                  loading="lazy"
                />
              </div>
              <div class="border-t-2 border-gold p-7 flex flex-col justify-between h-[320px]">
                <div>
                  <div class="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p class="mb-2 text-xs font-bold uppercase tracking-wider text-gold">{{ servicio.especialidad }}</p>
                      <h3 class="text-xl font-bold text-navy leading-tight">{{ servicio.nombre }}</h3>
                    </div>
                    <span class="material-symbols-outlined rounded-xl bg-yellow-50 p-3 text-gold flex-shrink-0">
                      {{ getCategoryIcon(servicio.especialidad) }}
                    </span>
                  </div>
                  <p class="line-clamp-3 text-sm leading-6 text-slate-600">{{ servicio.descripcion }}</p>
                  <ul class="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    <li class="flex gap-2">
                      <span class="material-symbols-outlined text-[18px] text-gold">check_circle</span>
                      <span class="truncate">{{ getMeta(servicio.nombre).benefits[0] }}</span>
                    </li>
                    <li class="flex gap-2">
                      <span class="material-symbols-outlined text-[18px] text-gold">check_circle</span>
                      <span class="truncate">{{ getMeta(servicio.nombre).benefits[1] }}</span>
                    </li>
                    <li class="flex gap-2">
                      <span class="material-symbols-outlined text-[18px] text-gold">schedule</span>
                      <span class="truncate">{{ servicio.duracionMinutos }} minutos</span>
                    </li>
                    <li class="flex gap-2">
                      <span class="material-symbols-outlined text-[18px] text-gold">event</span>
                      <span class="truncate">
                        {{ servicio.sesionesIncluidas > 1 ? servicio.sesionesIncluidas + ' sesiones' : getMeta(servicio.nombre).sessionsLabel }}
                      </span>
                    </li>
                  </ul>
                </div>
                <div class="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
                  <span class="text-sm font-bold text-slate-500">
                    Desde <strong class="text-lg text-navy">S/ {{ servicio.precio | number: '1.2-2' }}</strong>
                  </span>
                  <button
                    class="inline-flex items-center gap-1 text-sm font-bold text-navy transition hover:text-gold"
                    type="button"
                    (click)="onReservarServicio(servicio.id)"
                  >
                    Reservar <span class="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </div>
              </div>
            </article>
          } @empty {
            <div class="col-span-full py-12 text-center">
              <p class="text-lg text-slate-500">No encontramos servicios que coincidan con tu búsqueda.</p>
            </div>
          }
        </div>
      }
    </section>

    <section class="bg-navy py-16 text-center text-white">
      <div class="mx-auto max-w-3xl px-5">
        <p class="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gold-soft">Primera evaluación</p>
        <h2 class="text-3xl font-bold md:text-4xl">¿No sabes qué tratamiento necesitas?</h2>
        <p class="mx-auto mt-5 max-w-2xl leading-7 text-slate-300">
          Agenda una consulta de diagnóstico. Nuestro equipo evaluará tu salud bucal y te explicará las alternativas apropiadas.
        </p>
        <button
          class="mt-8 rounded-lg bg-gold-soft px-8 py-3 text-sm font-bold text-navy transition hover:bg-yellow-300"
          type="button"
          (click)="onReservarServicio(null)"
        >
          Agendar evaluación
        </button>
      </div>
    </section>

    @if (authModalOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-navy/75 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div class="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
          <button
            class="absolute right-4 top-4 text-slate-500 hover:text-navy"
            type="button"
            aria-label="Cerrar"
            (click)="authModalOpen.set(false)"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
          <span class="material-symbols-outlined mb-5 inline-block rounded-lg bg-yellow-50 p-3 text-3xl text-gold">calendar_month</span>
          <h2 id="modal-title" class="text-2xl font-bold text-navy">Inicia sesión para reservar</h2>
          <p class="mt-3 leading-6 text-slate-600">Necesitas una cuenta de paciente para guardar y gestionar tus citas.</p>
          <div class="mt-7 grid gap-3 sm:grid-cols-2">
            <a
              routerLink="/login"
              (click)="authModalOpen.set(false)"
              class="rounded-lg bg-navy px-5 py-3 text-center text-sm font-bold text-white"
            >Iniciar Sesión</a>
            <a
              routerLink="/registro"
              (click)="authModalOpen.set(false)"
              class="rounded-lg border border-navy px-5 py-3 text-center text-sm font-bold text-navy"
            >Crear una cuenta</a>
          </div>
        </div>
      </div>
    }
  `,
})
export class ServiciosPageComponent implements OnInit {
  private readonly api = inject(SmartDentApiService);
  protected readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly loading = signal<boolean>(true);
  protected readonly servicios = signal<readonly ServicioResponse[]>([]);
  protected readonly especialidadActiva = signal<string>('TODAS');
  protected readonly terminoBusqueda = signal<string>('');
  protected readonly authModalOpen = signal<boolean>(false);

  protected readonly servicioImg = resolveServicioImg;

  protected readonly especialidades = computed<readonly string[]>(() => {
    const set = new Set<string>();
    for (const item of this.servicios()) {
      set.add(item.especialidad);
    }
    return Array.from(set).sort();
  });

  protected readonly serviciosFiltrados = computed<readonly ServicioResponse[]>(() => {
    const esp = this.especialidadActiva();
    const query = this.terminoBusqueda().trim().toLowerCase();
    return this.servicios().filter((item) => {
      const matchEsp = esp === 'TODAS' || item.especialidad === esp;
      const matchQuery =
        !query ||
        item.nombre.toLowerCase().includes(query) ||
        item.descripcion.toLowerCase().includes(query);
      return matchEsp && matchQuery;
    });
  });

  ngOnInit(): void {
    this.api.listarServiciosPublicos().subscribe({
      next: (data) => {
        this.servicios.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminoBusqueda.set(input.value);
  }

  protected onCategoryChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.especialidadActiva.set(select.value || 'TODAS');
  }

  protected getCategoryIcon(especialidad: string): string {
    const norm = especialidad.toLowerCase();
    if (norm.includes('prevención')) return 'clinical_notes';
    if (norm.includes('urgencias')) return 'emergency';
    if (norm.includes('implant')) return 'dentistry';
    if (norm.includes('estética')) return 'sentiment_satisfied';
    if (norm.includes('ortodoncia')) return 'grid_on';
    if (norm.includes('odontopediatr')) return 'child_care';
    if (norm.includes('rehabilita')) return 'settings_accessibility';
    if (norm.includes('endodoncia')) return 'biotech';
    if (norm.includes('cirugía')) return 'healing';
    if (norm.includes('periodoncia')) return 'health_and_safety';
    return 'dentistry';
  }

  protected getMeta(nombre: string): ServicioCatalogoMeta {
    return (
      CATALOG_META[nombre.toLowerCase()] ?? {
        benefits: ['Evaluación completa', 'Atención profesional'],
        sessionsLabel: 'Según evaluación',
      }
    );
  }

  protected onReservarServicio(servicioId: number | null): void {
    const role = this.authStore.role();
    if (role === 'PACIENTE') {
      void this.router.navigate(['/paciente/reservar'], {
        queryParams: servicioId ? { servicioId } : undefined,
      });
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
