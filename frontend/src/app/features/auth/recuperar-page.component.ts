import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastStore } from '../../core/notifications/toast.store';
import { SmartDentApiService } from '../../core/services/smartdent-api.service';
import {
  SmartDentValidators,
  extractApiErrorMessage,
  resolveControlError,
} from '../../shared/validators/smartdent.validators';

@Component({
  selector: 'sd-recuperar-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page">
      <main class="auth-main">
        <section class="auth-card">
          <header class="auth-header">
            <h1>{{ hasResetToken() ? 'Nueva Contraseña' : 'Recuperar Contraseña' }}</h1>
            <p style="color:#64748b; font-size:14px; margin-top:5px;">
              {{
                hasResetToken()
                  ? 'Ingresa tu nueva contraseña para acceder a SmartDent.'
                  : 'Ingresa tu correo para enviarte un enlace de recuperación.'
              }}
            </p>
          </header>

          @if (!hasResetToken()) {
            <form [formGroup]="requestForm" (ngSubmit)="solicitarEnlace()" class="auth-form" novalidate>
              <div class="form-group">
                <label for="email">Correo Electrónico</label>
                <div class="input-wrapper">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M4 6h16v12H4zM4 7l8 6 8-6" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    formControlName="email"
                    placeholder="tu@correo.com"
                  />
                </div>
                @if (controlError(requestForm.controls.email); as err) {
                  <small class="field-error">{{ err }}</small>
                }
              </div>

              @if (emailSent()) {
                <p class="form-message is-success" style="margin-top:10px; font-size:12px; font-weight:600;">
                  Si el correo está registrado, te hemos enviado un enlace.
                </p>
              }
              @if (errorMsg(); as err) {
                <p class="form-message" style="margin-top:10px; font-size:12px; font-weight:600;">{{ err }}</p>
              }

              <button class="primary-button" type="submit" [disabled]="submitting()">
                {{ submitting() ? 'Enviando correo...' : 'Enviar enlace' }}
              </button>
            </form>
          } @else {
            <form [formGroup]="resetForm" (ngSubmit)="guardarNuevaClave()" class="auth-form" novalidate>
              <div class="form-group">
                <label for="new-password">Nueva Contraseña</label>
                <div class="input-wrapper">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <rect x="5" y="10" width="14" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 018 0v3M12 14v3" />
                  </svg>
                  <input
                    id="new-password"
                    [type]="showNewPwd() ? 'text' : 'password'"
                    formControlName="nuevaPassword"
                    minlength="8"
                    placeholder="••••••••"
                  />
                  <button
                    class="password-toggle"
                    type="button"
                    (click)="showNewPwd.set(!showNewPwd())"
                    aria-label="Mostrar contraseña"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  </button>
                </div>
                @if (controlError(resetForm.controls.nuevaPassword); as err) {
                  <small class="field-error">{{ err }}</small>
                }
              </div>

              <div class="form-group">
                <label for="confirm-password">Confirmar Contraseña</label>
                <div class="input-wrapper">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <rect x="5" y="10" width="14" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 018 0v3M12 14v3" />
                  </svg>
                  <input
                    id="confirm-password"
                    [type]="showConfirmPwd() ? 'text' : 'password'"
                    formControlName="confirmarPassword"
                    minlength="8"
                    placeholder="••••••••"
                  />
                  <button
                    class="password-toggle"
                    type="button"
                    (click)="showConfirmPwd.set(!showConfirmPwd())"
                    aria-label="Mostrar contraseña"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  </button>
                </div>
                @if (resetForm.touched && resetForm.hasError('passwordMismatch')) {
                  <small class="field-error">Las contraseñas no coinciden.</small>
                }
              </div>

              @if (errorMsg(); as err) {
                <p class="form-message" style="margin-top:10px; font-size:12px; font-weight:600;">{{ err }}</p>
              }

              <button class="primary-button" type="submit" [disabled]="submitting()">
                {{ submitting() ? 'Guardando...' : 'Guardar Contraseña' }}
              </button>
            </form>
          }

          <div style="margin-top: 25px; text-align: center;">
            <a class="register-link" routerLink="/login" style="font-size:14px;">Volver a iniciar sesión</a>
          </div>
        </section>
      </main>
    </div>
  `,
})
export class RecuperarPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(SmartDentApiService);
  private readonly toastStore = inject(ToastStore);
  private readonly router = inject(Router);

  readonly token = input<string | undefined>();
  protected readonly hasResetToken = computed<boolean>(() => Boolean(this.token()?.trim()));

  protected readonly showNewPwd = signal<boolean>(false);
  protected readonly showConfirmPwd = signal<boolean>(false);
  protected readonly submitting = signal<boolean>(false);
  protected readonly emailSent = signal<boolean>(false);
  protected readonly errorMsg = signal<string | null>(null);

  protected readonly controlError = resolveControlError;

  protected readonly requestForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly resetForm = this.fb.group(
    {
      nuevaPassword: ['', [Validators.required, SmartDentValidators.passwordCompleja()]],
      confirmarPassword: ['', [Validators.required]],
    },
    { validators: [SmartDentValidators.confirmarPassword('nuevaPassword', 'confirmarPassword')] }
  );

  protected solicitarEnlace(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMsg.set(null);

    this.api.solicitarRecuperacion(this.requestForm.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.emailSent.set(true);
        this.toastStore.info('Si el correo está registrado, te hemos enviado un enlace.');
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.errorMsg.set(extractApiErrorMessage(err));
      },
    });
  }

  protected guardarNuevaClave(): void {
    const tokenValue = this.token()?.trim();
    if (!tokenValue || this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMsg.set(null);

    this.api
      .resetearPassword({
        token: tokenValue,
        nuevaPassword: this.resetForm.controls.nuevaPassword.value,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.toastStore.success('¡Contraseña guardada! Redirigiendo...');
          void this.router.navigate(['/login']);
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          this.errorMsg.set(extractApiErrorMessage(err));
        },
      });
  }
}
