import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServicioAdminResponse } from '../../core/models/smartdent.models';
import { ToastStore } from '../../core/notifications/toast.store';
import { SmartDentApiService } from '../../core/services/smartdent-api.service';
import { FieldErrorComponent } from '../../shared/ui/field-error.component';
import {
  SmartDentValidators,
  applyServerValidationErrors,
  extractApiErrorMessage,
} from '../../shared/validators/smartdent.validators';

@Component({
  selector: 'sd-admin-servicios',
  imports: [ReactiveFormsModule, DecimalPipe, FieldErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h1 class="text-2xl font-extrabold text-navy">Gestión de Servicios y Tarifas</h1>
      <p class="text-sm text-slate-500">
        Administra precios al público, costos operativos, duración y disponibilidad del catálogo.
      </p>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-5">
      <form
        [formGroup]="form"
        (ngSubmit)="guardar()"
        novalidate
        class="sd-card h-fit space-y-3.5 lg:col-span-2"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-base font-bold text-navy">
            {{ editingId() ? 'Editar Servicio' : 'Nuevo Servicio' }}
          </h2>
          @if (editingId()) {
            <button
              type="button"
              (click)="limpiarFormulario()"
              class="text-xs font-semibold text-gold hover:underline"
            >
              + Crear nuevo
            </button>
          }
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="srv-codigo" class="sd-label">Código *</label>
            <input
              id="srv-codigo"
              type="text"
              formControlName="codigo"
              class="sd-input"
              placeholder="SRV-NUEVO"
            />
            <sd-field-error [control]="form.controls.codigo" />
          </div>
          <div>
            <label for="srv-esp" class="sd-label">Especialidad *</label>
            <input
              id="srv-esp"
              type="text"
              formControlName="especialidad"
              class="sd-input"
              placeholder="Estética"
            />
            <sd-field-error [control]="form.controls.especialidad" />
          </div>
        </div>

        <div>
          <label for="srv-nombre" class="sd-label">Nombre del tratamiento *</label>
          <input id="srv-nombre" type="text" formControlName="nombre" class="sd-input" />
          <sd-field-error [control]="form.controls.nombre" />
        </div>

        <div>
          <label for="srv-desc" class="sd-label">Descripción *</label>
          <textarea id="srv-desc" rows="2" formControlName="descripcion" class="sd-input"></textarea>
          <sd-field-error [control]="form.controls.descripcion" />
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label for="srv-precio" class="sd-label">Precio (S/) *</label>
            <input id="srv-precio" type="number" step="0.01" formControlName="precio" class="sd-input" />
            <sd-field-error [control]="form.controls.precio" />
          </div>
          <div>
            <label for="srv-costo" class="sd-label">Costo (S/) *</label>
            <input id="srv-costo" type="number" step="0.01" formControlName="costo" class="sd-input" />
            <sd-field-error [control]="form.controls.costo" />
          </div>
          <div>
            <label for="srv-duracion" class="sd-label">Minutos *</label>
            <input id="srv-duracion" type="number" formControlName="duracionMinutos" class="sd-input" />
            <sd-field-error [control]="form.controls.duracionMinutos" />
          </div>
        </div>

        @if (form.touched && form.hasError('margenNegativo')) {
          <p class="text-xs font-medium text-error">
            El precio al público no debe ser menor al costo operativo
          </p>
        }

        <div>
          <label for="srv-img" class="sd-label">Imagen (archivo o URL)</label>
          <input
            id="srv-img"
            type="text"
            formControlName="imagenUrl"
            class="sd-input"
            placeholder="consulta-diagnostico.png"
          />
        </div>

        <label class="flex items-center gap-2 text-xs font-semibold text-navy">
          <input type="checkbox" formControlName="activo" class="rounded border-slate-300 text-gold" />
          <span>Disponible en el catálogo público</span>
        </label>

        <button type="submit" [disabled]="saving()" class="sd-btn-gold w-full">
          {{ saving() ? 'Guardando...' : editingId() ? 'Actualizar Servicio' : 'Crear Servicio' }}
        </button>
      </form>

      <section class="space-y-3 lg:col-span-3">
        @for (srv of servicios(); track srv.id) {
          <article class="sd-card flex flex-wrap items-center justify-between gap-4 py-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs font-bold text-slate-500">{{ srv.codigo }}</span>
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-semibold"
                  [class]="srv.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'"
                >
                  {{ srv.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
              <h3 class="mt-1 font-bold text-navy">{{ srv.nombre }} ({{ srv.especialidad }})</h3>
              <p class="text-xs text-slate-600">
                Precio: <strong>S/ {{ srv.precio | number: '1.2-2' }}</strong> · Costo: S/
                {{ srv.costo | number: '1.2-2' }} · {{ srv.duracionMinutos }} min
              </p>
            </div>
            <div class="flex gap-2">
              <button type="button" (click)="editar(srv)" class="sd-btn-outline py-1.5 text-xs">
                Editar
              </button>
              <button
                type="button"
                (click)="alternarEstado(srv)"
                class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {{ srv.activo ? 'Inactivar' : 'Activar' }}
              </button>
            </div>
          </article>
        }
      </section>
    </div>
  `,
})
export class AdminServiciosComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(SmartDentApiService);
  private readonly toastStore = inject(ToastStore);

  protected readonly servicios = signal<readonly ServicioAdminResponse[]>([]);
  protected readonly editingId = signal<number | null>(null);
  protected readonly saving = signal<boolean>(false);

  protected readonly form = this.fb.group(
    {
      codigo: ['', [Validators.required, Validators.maxLength(40)]],
      nombre: ['', [Validators.required, Validators.maxLength(120)]],
      especialidad: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', [Validators.required, Validators.maxLength(600)]],
      precio: [120, [Validators.required, Validators.min(0)]],
      costo: [35, [Validators.required, Validators.min(0)]],
      duracionMinutos: [45, [Validators.required, Validators.min(15), Validators.max(480)]],
      imagenUrl: ['consulta-diagnostico.png', [Validators.maxLength(500)]],
      activo: [true],
    },
    { validators: [SmartDentValidators.margenPositivo('precio', 'costo')] }
  );

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.api.listarServiciosAdmin().subscribe({
      next: (list) => this.servicios.set(list),
    });
  }

  protected editar(srv: ServicioAdminResponse): void {
    this.editingId.set(srv.id);
    this.form.patchValue({
      codigo: srv.codigo,
      nombre: srv.nombre,
      especialidad: srv.especialidad,
      descripcion: srv.descripcion,
      precio: srv.precio,
      costo: srv.costo,
      duracionMinutos: srv.duracionMinutos,
      imagenUrl: srv.imagenUrl ?? '',
      activo: srv.activo,
    });
  }

  protected limpiarFormulario(): void {
    this.editingId.set(null);
    this.form.reset({
      codigo: '',
      nombre: '',
      especialidad: '',
      descripcion: '',
      precio: 120,
      costo: 35,
      duracionMinutos: 45,
      imagenUrl: 'consulta-diagnostico.png',
      activo: true,
    });
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const payload = this.form.getRawValue();
    const id = this.editingId();

    const request$ = id
      ? this.api.actualizarServicioAdmin(id, payload)
      : this.api.crearServicioAdmin(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toastStore.success(id ? 'Servicio actualizado.' : 'Servicio creado.');
        this.limpiarFormulario();
        this.cargar();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.toastStore.error(applyServerValidationErrors(this.form, err));
      },
    });
  }

  protected alternarEstado(srv: ServicioAdminResponse): void {
    this.api.cambiarEstadoServicioAdmin(srv.id, !srv.activo).subscribe({
      next: () => {
        this.toastStore.info(`Servicio ${srv.codigo} actualizado.`);
        this.cargar();
      },
      error: (err: unknown) => this.toastStore.error(extractApiErrorMessage(err)),
    });
  }
}
