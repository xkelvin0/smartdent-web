import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  OdontologoAdminResponse,
  ServicioAdminResponse,
} from '../../core/models/smartdent.models';
import { ToastStore } from '../../core/notifications/toast.store';
import { SmartDentApiService } from '../../core/services/smartdent-api.service';
import { FieldErrorComponent } from '../../shared/ui/field-error.component';
import { resolveOdontologoImg } from '../../shared/utils/asset-url.util';
import {
  SmartDentValidators,
  applyServerValidationErrors,
} from '../../shared/validators/smartdent.validators';

@Component({
  selector: 'sd-admin-odontologos',
  imports: [ReactiveFormsModule, FieldErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h1 class="text-2xl font-extrabold text-navy">Gestión de Odontólogos</h1>
      <p class="text-sm text-slate-500">
        Registra especialistas, actualiza colegiaturas y asigna los tratamientos que pueden atender.
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
            {{ editingId() ? 'Editar Odontólogo' : 'Registrar Odontólogo' }}
          </h2>
          @if (editingId()) {
            <button
              type="button"
              (click)="nuevoModo()"
              class="text-xs font-semibold text-gold hover:underline"
            >
              + Nuevo registro
            </button>
          }
        </div>

        @if (!editingId()) {
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="doc-codigo" class="sd-label">Código *</label>
              <input id="doc-codigo" type="text" formControlName="codigo" class="sd-input" placeholder="DOC-ANA" />
              <sd-field-error [control]="form.controls.codigo" />
            </div>
            <div>
              <label for="doc-dni" class="sd-label">DNI (8 dígitos) *</label>
              <input id="doc-dni" type="text" maxlength="8" formControlName="dni" class="sd-input" />
              <sd-field-error [control]="form.controls.dni" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="doc-email" class="sd-label">Correo *</label>
              <input id="doc-email" type="email" formControlName="email" class="sd-input" />
              <sd-field-error [control]="form.controls.email" />
            </div>
            <div>
              <label for="doc-pwd" class="sd-label">Clave inicial *</label>
              <input id="doc-pwd" type="password" formControlName="password" class="sd-input" />
              <sd-field-error [control]="form.controls.password" />
            </div>
          </div>
        }

        <div>
          <label for="doc-nombre" class="sd-label">Nombre completo *</label>
          <input id="doc-nombre" type="text" formControlName="nombreCompleto" class="sd-input" />
          <sd-field-error [control]="form.controls.nombreCompleto" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="doc-esp" class="sd-label">Especialidad *</label>
            <input id="doc-esp" type="text" formControlName="especialidad" class="sd-input" />
            <sd-field-error [control]="form.controls.especialidad" />
          </div>
          <div>
            <label for="doc-col" class="sd-label">Colegiatura *</label>
            <input id="doc-col" type="text" formControlName="colegiatura" class="sd-input" placeholder="COP-10234" />
            <sd-field-error [control]="form.controls.colegiatura" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="doc-tel" class="sd-label">Teléfono</label>
            <input id="doc-tel" type="tel" formControlName="telefono" class="sd-input" />
            <sd-field-error [control]="form.controls.telefono" />
          </div>
          <div>
            <label for="doc-foto" class="sd-label">Foto URL / Archivo</label>
            <input id="doc-foto" type="text" formControlName="fotoUrl" class="sd-input" />
          </div>
        </div>

        @if (editingId()) {
          <label class="flex items-center gap-2 text-xs font-semibold text-navy">
            <input type="checkbox" formControlName="activo" class="rounded border-slate-300 text-gold" />
            <span>Cuenta de odontólogo activa</span>
          </label>
        }

        <div>
          <span class="sd-label">Servicios asignados ({{ selectedServices().length }}) *</span>
          <div class="max-h-44 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 p-3">
            @for (srv of servicios(); track srv.id) {
              <label class="flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  [checked]="selectedServices().includes(srv.id)"
                  (change)="toggleServicio(srv.id)"
                  class="rounded border-slate-300 text-gold"
                />
                <span>{{ srv.nombre }}</span>
              </label>
            }
          </div>
          @if (serviceSelectionTouched() && selectedServices().length === 0) {
            <p class="mt-1 text-xs font-medium text-error">Selecciona al menos un servicio</p>
          }
        </div>

        <button type="submit" [disabled]="saving()" class="sd-btn-gold w-full">
          {{ saving() ? 'Guardando...' : editingId() ? 'Actualizar Odontólogo' : 'Crear Odontólogo' }}
        </button>
      </form>

      <section class="space-y-3 lg:col-span-3">
        @for (doc of odontologos(); track doc.id) {
          <article class="sd-card flex flex-wrap items-center justify-between gap-4 py-4">
            <div class="flex items-center gap-3.5">
              <img
                [src]="odontologoImg(doc.fotoUrl)"
                [alt]="doc.nombreCompleto"
                class="h-14 w-14 rounded-full border border-slate-200 object-cover"
              />
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-navy">{{ doc.nombreCompleto }}</h3>
                  <span
                    class="rounded-full px-2 py-0.5 text-xs font-semibold"
                    [class]="doc.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'"
                  >
                    {{ doc.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>
                <p class="text-xs text-gold font-semibold">
                  {{ doc.especialidad }} · {{ doc.colegiatura }}
                </p>
                <p class="text-xs text-slate-500">
                  {{ doc.email }} · {{ doc.servicioIds.length }} servicios asignados
                </p>
              </div>
            </div>

            <button type="button" (click)="editar(doc)" class="sd-btn-outline py-1.5 text-xs">
              Editar / Asignar
            </button>
          </article>
        }
      </section>
    </div>
  `,
})
export class AdminOdontologosComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(SmartDentApiService);
  private readonly toastStore = inject(ToastStore);

  protected readonly odontologos = signal<readonly OdontologoAdminResponse[]>([]);
  protected readonly servicios = signal<readonly ServicioAdminResponse[]>([]);
  protected readonly selectedServices = signal<readonly number[]>([]);
  protected readonly serviceSelectionTouched = signal<boolean>(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly saving = signal<boolean>(false);
  protected readonly odontologoImg = resolveOdontologoImg;

  protected readonly form = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(40)]],
    dni: ['', [Validators.required, SmartDentValidators.dniPeru()]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, SmartDentValidators.passwordCompleja()]],
    nombreCompleto: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    telefono: ['', [SmartDentValidators.telefono(false)]],
    especialidad: ['', [Validators.required, Validators.maxLength(100)]],
    colegiatura: ['', [Validators.required, Validators.maxLength(30)]],
    fotoUrl: ['carlos-mendoza.webp', [Validators.maxLength(500)]],
    activo: [true],
  });

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    forkJoin({
      odontologos: this.api.listarOdontologosAdmin(),
      servicios: this.api.listarServiciosAdmin(),
    }).subscribe({
      next: ({ odontologos, servicios }) => {
        this.odontologos.set(odontologos);
        this.servicios.set(servicios);
      },
    });
  }

  protected toggleServicio(id: number): void {
    this.serviceSelectionTouched.set(true);
    this.selectedServices.update((curr) =>
      curr.includes(id) ? curr.filter((item) => item !== id) : [...curr, id]
    );
  }

  protected editar(doc: OdontologoAdminResponse): void {
    this.editingId.set(doc.id);
    this.selectedServices.set([...doc.servicioIds]);
    this.form.controls.codigo.clearValidators();
    this.form.controls.dni.clearValidators();
    this.form.controls.email.clearValidators();
    this.form.controls.password.clearValidators();
    this.form.controls.codigo.updateValueAndValidity();
    this.form.controls.dni.updateValueAndValidity();
    this.form.controls.email.updateValueAndValidity();
    this.form.controls.password.updateValueAndValidity();

    this.form.patchValue({
      nombreCompleto: doc.nombreCompleto,
      telefono: doc.telefono ?? '',
      especialidad: doc.especialidad,
      colegiatura: doc.colegiatura,
      fotoUrl: doc.fotoUrl ?? '',
      activo: doc.activo,
    });
  }

  protected nuevoModo(): void {
    this.editingId.set(null);
    this.selectedServices.set([]);
    this.serviceSelectionTouched.set(false);
    this.form.controls.codigo.setValidators([Validators.required, Validators.maxLength(40)]);
    this.form.controls.dni.setValidators([Validators.required, SmartDentValidators.dniPeru()]);
    this.form.controls.email.setValidators([Validators.required, Validators.email]);
    this.form.controls.password.setValidators([
      Validators.required,
      SmartDentValidators.passwordCompleja(),
    ]);
    this.form.reset({
      codigo: '',
      dni: '',
      email: '',
      password: '',
      nombreCompleto: '',
      telefono: '',
      especialidad: '',
      colegiatura: '',
      fotoUrl: 'carlos-mendoza.webp',
      activo: true,
    });
  }

  protected guardar(): void {
    this.serviceSelectionTouched.set(true);
    if (this.form.invalid || this.selectedServices().length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const id = this.editingId();

    const obs$ = id
      ? this.api.actualizarOdontologoAdmin(id, {
          nombreCompleto: raw.nombreCompleto.trim(),
          telefono: raw.telefono.trim(),
          especialidad: raw.especialidad.trim(),
          colegiatura: raw.colegiatura.trim(),
          fotoUrl: raw.fotoUrl.trim(),
          activo: raw.activo,
          servicioIds: this.selectedServices(),
        })
      : this.api.crearOdontologoAdmin({
          codigo: raw.codigo.trim(),
          nombreCompleto: raw.nombreCompleto.trim(),
          dni: raw.dni.trim(),
          email: raw.email.trim(),
          password: raw.password,
          telefono: raw.telefono.trim(),
          especialidad: raw.especialidad.trim(),
          colegiatura: raw.colegiatura.trim(),
          fotoUrl: raw.fotoUrl.trim(),
          servicioIds: this.selectedServices(),
        });

    obs$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toastStore.success(
          id ? 'Odontólogo actualizado correctamente.' : 'Odontólogo registrado.'
        );
        this.nuevoModo();
        this.cargar();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.toastStore.error(applyServerValidationErrors(this.form, err));
      },
    });
  }
}
