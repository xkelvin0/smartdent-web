import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BloqueoHorarioResponse } from '../../core/models/smartdent.models';
import { ToastStore } from '../../core/notifications/toast.store';
import { SmartDentApiService } from '../../core/services/smartdent-api.service';
import { FieldErrorComponent } from '../../shared/ui/field-error.component';
import { formatHoraCorta, getTomorrowIsoDate } from '../../shared/utils/asset-url.util';
import {
  SmartDentValidators,
  applyServerValidationErrors,
  extractApiErrorMessage,
} from '../../shared/validators/smartdent.validators';

@Component({
  selector: 'sd-odontologo-bloqueos',
  imports: [ReactiveFormsModule, FieldErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h1 class="text-2xl font-extrabold text-navy">Bloqueos de Horario</h1>
      <p class="mt-1 text-sm text-slate-500">
        Registra ausencias por congresos, capacitaciones o descansos para impedir reservas en ese rango.
      </p>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-5">
      <form
        [formGroup]="form"
        (ngSubmit)="crearBloqueo()"
        novalidate
        class="sd-card h-fit space-y-4 lg:col-span-2"
      >
        <h2 class="text-base font-bold text-navy">Nuevo Bloqueo de Agenda</h2>

        <div>
          <label for="bloq-fecha" class="sd-label">Fecha *</label>
          <input id="bloq-fecha" type="date" formControlName="fecha" class="sd-input" />
          <sd-field-error [control]="form.controls.fecha" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="bloq-inicio" class="sd-label">Hora inicio *</label>
            <input id="bloq-inicio" type="time" formControlName="horaInicio" class="sd-input" />
            <sd-field-error [control]="form.controls.horaInicio" />
          </div>
          <div>
            <label for="bloq-fin" class="sd-label">Hora fin *</label>
            <input id="bloq-fin" type="time" formControlName="horaFin" class="sd-input" />
            <sd-field-error [control]="form.controls.horaFin" />
          </div>
        </div>

        @if (form.touched && form.hasError('rangoHorarioInvalido')) {
          <p class="text-xs font-medium text-error">
            La hora de fin debe ser posterior a la hora de inicio
          </p>
        }

        <div>
          <label for="bloq-motivo" class="sd-label">Motivo del bloqueo *</label>
          <input
            id="bloq-motivo"
            type="text"
            formControlName="motivo"
            class="sd-input"
            placeholder="Ej. Junta médica / Capacitación"
          />
          <sd-field-error [control]="form.controls.motivo" />
        </div>

        <button type="submit" [disabled]="submitting()" class="sd-btn-primary w-full">
          {{ submitting() ? 'Registrando...' : 'Bloquear Rango Horario' }}
        </button>
      </form>

      <section class="space-y-3 lg:col-span-3">
        @for (item of bloqueos(); track item.id) {
          <article class="sd-card flex items-center justify-between gap-4 py-4">
            <div>
              <p class="text-sm font-bold text-navy">
                {{ item.fecha }} · {{ horaCorta(item.horaInicio) }} a {{ horaCorta(item.horaFin) }}
              </p>
              <p class="text-xs text-slate-600">{{ item.motivo }}</p>
            </div>
            <button
              type="button"
              (click)="eliminar(item.id)"
              class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
            >
              Eliminar
            </button>
          </article>
        } @empty {
          <div class="sd-card py-10 text-center text-sm text-slate-500">
            No tienes bloqueos horarios activos registrados.
          </div>
        }
      </section>
    </div>
  `,
})
export class OdontologoBloqueosComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(SmartDentApiService);
  private readonly toastStore = inject(ToastStore);

  protected readonly bloqueos = signal<readonly BloqueoHorarioResponse[]>([]);
  protected readonly submitting = signal<boolean>(false);
  protected readonly horaCorta = formatHoraCorta;

  protected readonly form = this.fb.group(
    {
      fecha: [getTomorrowIsoDate(), [Validators.required, SmartDentValidators.fechaLaborable(true)]],
      horaInicio: ['09:00', [Validators.required]],
      horaFin: ['11:00', [Validators.required]],
      motivo: ['', [Validators.required, Validators.maxLength(120)]],
    },
    { validators: [SmartDentValidators.rangoHorario('horaInicio', 'horaFin')] }
  );

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.api.listarMisBloqueos().subscribe({
      next: (list) => this.bloqueos.set(list),
    });
  }

  protected crearBloqueo(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const raw = this.form.getRawValue();
    this.api
      .crearBloqueo({
        fecha: raw.fecha,
        horaInicio: raw.horaInicio,
        horaFin: raw.horaFin,
        motivo: raw.motivo.trim(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.form.controls.motivo.reset('');
          this.toastStore.success('Bloqueo horario registrado.');
          this.cargar();
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          this.toastStore.error(applyServerValidationErrors(this.form, err));
        },
      });
  }

  protected eliminar(id: number): void {
    this.api.eliminarBloqueo(id).subscribe({
      next: () => {
        this.toastStore.info('Bloqueo eliminado.');
        this.cargar();
      },
      error: (err: unknown) => this.toastStore.error(extractApiErrorMessage(err)),
    });
  }
}
