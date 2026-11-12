import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdminFinanzasResponse } from '../../core/models/smartdent.models';
import { ToastStore } from '../../core/notifications/toast.store';
import { SmartDentApiService } from '../../core/services/smartdent-api.service';
import { FieldErrorComponent } from '../../shared/ui/field-error.component';
import { applyServerValidationErrors } from '../../shared/validators/smartdent.validators';

@Component({
  selector: 'sd-admin-finanzas',
  imports: [ReactiveFormsModule, DecimalPipe, FieldErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h1 class="text-2xl font-extrabold text-navy">Reportes Financieros y Costos Fijos</h1>
      <p class="text-sm text-slate-500">
        Analiza ingresos, costos variables por atención, gastos operativos mensuales y margen neto.
      </p>
    </div>

    @if (finanzas(); as fin) {
      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div class="sd-card py-4">
          <p class="text-xs font-semibold uppercase text-slate-500">Ingresos del Mes</p>
          <p class="mt-1 text-xl font-extrabold text-emerald-700">
            S/ {{ fin.ingresosMesActual | number: '1.2-2' }}
          </p>
        </div>
        <div class="sd-card py-4">
          <p class="text-xs font-semibold uppercase text-slate-500">Costos Variables</p>
          <p class="mt-1 text-xl font-extrabold text-slate-700">
            S/ {{ fin.costosVariablesMesActual | number: '1.2-2' }}
          </p>
        </div>
        <div class="sd-card py-4">
          <p class="text-xs font-semibold uppercase text-slate-500">Gastos Fijos</p>
          <p class="mt-1 text-xl font-extrabold text-slate-700">
            S/ {{ fin.gastosFijosMensuales | number: '1.2-2' }}
          </p>
        </div>
        <div class="sd-card py-4">
          <p class="text-xs font-semibold uppercase text-slate-500">Utilidad Estimada</p>
          <p
            class="mt-1 text-xl font-extrabold"
            [class]="fin.utilidadMesActual >= 0 ? 'text-navy' : 'text-rose-700'"
          >
            S/ {{ fin.utilidadMesActual | number: '1.2-2' }}
          </p>
        </div>
        <div class="sd-card py-4">
          <p class="text-xs font-semibold uppercase text-slate-500">Margen Operativo</p>
          <p class="mt-1 text-xl font-extrabold text-gold">{{ fin.margenMesActual }}%</p>
        </div>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-5">
        <form
          [formGroup]="form"
          (ngSubmit)="guardarCostos()"
          novalidate
          class="sd-card space-y-3.5 lg:col-span-2"
        >
          <h2 class="text-base font-bold text-navy">Estructura de Gastos Fijos Mensuales (S/)</h2>

          <div>
            <label for="cf-alquiler" class="sd-label">Alquiler de local *</label>
            <input id="cf-alquiler" type="number" step="0.01" formControlName="alquiler" class="sd-input" />
            <sd-field-error [control]="form.controls.alquiler" />
          </div>

          <div>
            <label for="cf-planilla" class="sd-label">Planilla administrativa *</label>
            <input id="cf-planilla" type="number" step="0.01" formControlName="planilla" class="sd-input" />
            <sd-field-error [control]="form.controls.planilla" />
          </div>

          <div>
            <label for="cf-servicios" class="sd-label">Servicios básicos e internet *</label>
            <input id="cf-servicios" type="number" step="0.01" formControlName="servicios" class="sd-input" />
            <sd-field-error [control]="form.controls.servicios" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="cf-mkt" class="sd-label">Marketing *</label>
              <input id="cf-mkt" type="number" step="0.01" formControlName="marketing" class="sd-input" />
              <sd-field-error [control]="form.controls.marketing" />
            </div>
            <div>
              <label for="cf-otros" class="sd-label">Otros costos *</label>
              <input id="cf-otros" type="number" step="0.01" formControlName="otros" class="sd-input" />
              <sd-field-error [control]="form.controls.otros" />
            </div>
          </div>

          <button type="submit" [disabled]="saving()" class="sd-btn-primary w-full">
            {{ saving() ? 'Recalculando...' : 'Actualizar Costos Fijos' }}
          </button>
        </form>

        <div class="space-y-6 lg:col-span-3">
          <section class="sd-card">
            <h2 class="text-base font-bold text-navy">Evolución Semestral (Ingresos vs Costos)</h2>
            <div class="mt-4 space-y-3">
              @for (item of fin.mensual; track item.periodo) {
                <div class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-xs">
                  <span class="font-bold uppercase text-navy">{{ item.etiqueta }} ({{ item.periodo }})</span>
                  <div class="flex gap-4">
                    <span class="font-semibold text-emerald-700">
                      Ingresos: S/ {{ item.ingresos | number: '1.2-2' }}
                    </span>
                    <span class="font-semibold text-rose-700">
                      Costos: S/ {{ item.costos | number: '1.2-2' }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </section>

          <section class="sd-card">
            <h2 class="text-base font-bold text-navy">Tratamientos con Mayor Demanda</h2>
            <div class="mt-4 space-y-2.5">
              @for (dem of fin.demandaServicios; track dem.servicio) {
                <div class="flex items-center justify-between text-xs">
                  <span class="font-medium text-ink">{{ dem.servicio }}</span>
                  <span class="rounded-full bg-surface-container px-2.5 py-0.5 font-bold text-navy">
                    {{ dem.reservas }} reservas
                  </span>
                </div>
              } @empty {
                <p class="text-xs text-slate-500">Sin reservas activas contabilizadas.</p>
              }
            </div>
          </section>
        </div>
      </div>
    }
  `,
})
export class AdminFinanzasComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(SmartDentApiService);
  private readonly toastStore = inject(ToastStore);

  protected readonly finanzas = signal<AdminFinanzasResponse | null>(null);
  protected readonly saving = signal<boolean>(false);

  protected readonly form = this.fb.group({
    alquiler: [0, [Validators.required, Validators.min(0)]],
    planilla: [0, [Validators.required, Validators.min(0)]],
    servicios: [0, [Validators.required, Validators.min(0)]],
    marketing: [0, [Validators.required, Validators.min(0)]],
    otros: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    forkJoin({
      finanzas: this.api.obtenerFinanzasAdmin(),
      costos: this.api.obtenerCostosFijos(),
    }).subscribe({
      next: ({ finanzas, costos }) => {
        this.finanzas.set(finanzas);
        this.form.patchValue({
          alquiler: costos.alquiler,
          planilla: costos.planilla,
          servicios: costos.servicios,
          marketing: costos.marketing,
          otros: costos.otros,
        });
      },
    });
  }

  protected guardarCostos(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.api.actualizarCostosFijos(this.form.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.toastStore.success('Costos fijos actualizados.');
        this.cargar();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.toastStore.error(applyServerValidationErrors(this.form, err));
      },
    });
  }
}
