import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AuthStore } from '../../core/auth/auth.store';
import { ToastStore } from '../../core/notifications/toast.store';
import { SmartDentApiService } from '../../core/services/smartdent-api.service';
import { FieldErrorComponent } from '../../shared/ui/field-error.component';
import {
  SmartDentValidators,
  applyServerValidationErrors,
} from '../../shared/validators/smartdent.validators';

@Component({
  selector: 'sd-paciente-configuracion',
  imports: [ReactiveFormsModule, FieldErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-xl">
      <h1 class="text-2xl font-extrabold text-navy">Preferencias de Contacto y Recordatorios</h1>
      <p class="mt-1 text-sm text-slate-500">
        Actualiza tu teléfono de contacto y elige cómo deseas recibir avisos de tus citas.
      </p>

      <form [formGroup]="form" (ngSubmit)="guardar()" novalidate class="sd-card mt-6 space-y-5">
        <div>
          <label for="cfg-telefono" class="sd-label">Teléfono móvil o fijo</label>
          <input
            id="cfg-telefono"
            type="tel"
            formControlName="telefono"
            class="sd-input"
            placeholder="987 654 321"
          />
          <sd-field-error [control]="form.controls.telefono" />
        </div>

        <div class="space-y-3 border-t border-slate-100 pt-4">
          <label class="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-3.5">
            <div>
              <span class="block text-sm font-semibold text-navy">Recordatorios por Correo</span>
              <span class="text-xs text-slate-500">Confirmaciones y avisos 24 h antes de la cita</span>
            </div>
            <input
              type="checkbox"
              formControlName="recordatoriosEmail"
              class="h-4 w-4 rounded border-slate-300 text-gold focus:ring-gold"
            />
          </label>

          <label class="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-3.5">
            <div>
              <span class="block text-sm font-semibold text-navy">Recordatorios Telefónicos</span>
              <span class="text-xs text-slate-500">Contacto directo ante reprogramaciones clínicas</span>
            </div>
            <input
              type="checkbox"
              formControlName="recordatoriosTelefono"
              class="h-4 w-4 rounded border-slate-300 text-gold focus:ring-gold"
            />
          </label>
        </div>

        @if (errorMsg(); as err) {
          <div class="rounded-lg bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800">
            {{ err }}
          </div>
        }

        <button type="submit" [disabled]="saving()" class="sd-btn-primary">
          <span class="material-symbols-outlined text-lg">save</span>
          <span>{{ saving() ? 'Guardando cambios...' : 'Guardar Preferencias' }}</span>
        </button>
      </form>
    </div>
  `,
})
export class PacienteConfiguracionComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(SmartDentApiService);
  private readonly authStore = inject(AuthStore);
  private readonly toastStore = inject(ToastStore);

  protected readonly saving = signal<boolean>(false);
  protected readonly errorMsg = signal<string | null>(null);

  protected readonly form = this.fb.group({
    telefono: ['', [SmartDentValidators.telefono(false)]],
    recordatoriosEmail: [true],
    recordatoriosTelefono: [false],
  });

  ngOnInit(): void {
    this.api.obtenerConfiguracionPaciente().subscribe({
      next: (cfg) => {
        this.form.patchValue({
          telefono: cfg.telefono ?? '',
          recordatoriosEmail: cfg.recordatoriosEmail,
          recordatoriosTelefono: cfg.recordatoriosTelefono,
        });
      },
    });
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorMsg.set(null);

    const raw = this.form.getRawValue();
    this.api
      .actualizarConfiguracionPaciente({
        telefono: raw.telefono.trim(),
        recordatoriosEmail: raw.recordatoriosEmail,
        recordatoriosTelefono: raw.recordatoriosTelefono,
      })
      .subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.authStore.updatePhone(updated.telefono);
          this.toastStore.success('Preferencias actualizadas correctamente.');
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.errorMsg.set(applyServerValidationErrors(this.form, err));
        },
      });
  }
}
