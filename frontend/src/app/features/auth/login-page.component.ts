import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { ToastStore } from '../../core/notifications/toast.store';
import { SmartDentApiService } from '../../core/services/smartdent-api.service';
import {
  applyServerValidationErrors,
  extractApiErrorMessage,
  resolveControlError,
} from '../../shared/validators/smartdent.validators';

@Component({
  selector: 'sd-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page">
      <main class="auth-main">
        <section class="auth-card" aria-labelledby="login-title">
          <header class="auth-header">
            <h1 id="login-title">SmartDent</h1>
            <p>Excelencia Clínica a través de la Sofisticación.</p>
          </header>

          @if (verifyBanner(); as banner) {
            <p
              class="form-message mb-4"
              [class.is-success]="banner.ok"
              aria-live="polite"
            >{{ banner.text }}</p>
          }

          <form [formGroup]="form" (ngSubmit)="iniciarSesion()" class="auth-form" novalidate>
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
                  autocomplete="email"
                  placeholder="tu@correo.com"
                  [class.is-invalid]="form.controls.email.touched && form.controls.email.invalid"
                />
              </div>
              @if (controlError(form.controls.email); as err) {
                <small class="field-error" aria-live="polite">{{ err }}</small>
              }
            </div>

            <div class="form-group">
              <div class="label-row">
                <label for="password">Contraseña</label>
                <a routerLink="/recuperar" class="forgot-link">¿Olvidaste tu contraseña?</a>
              </div>
              <div class="input-wrapper">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <rect x="5" y="10" width="14" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 018 0v3M12 14v3" />
                </svg>
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  minlength="8"
                  autocomplete="current-password"
                  placeholder="••••••••"
                  [class.is-invalid]="form.controls.password.touched && form.controls.password.invalid"
                />
                <button
                  class="password-toggle"
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  aria-label="Mostrar contraseña"
                  [attr.aria-pressed]="showPassword()"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                </button>
              </div>
              @if (controlError(form.controls.password); as err) {
                <small class="field-error" aria-live="polite">{{ err }}</small>
              }
            </div>

            @if (authError(); as err) {
              <p class="form-message" aria-live="polite">{{ err }}</p>
            }

            <button class="primary-button" type="submit" [disabled]="submitting()">
              {{ submitting() ? 'Verificando...' : 'Iniciar Sesión' }}
            </button>
          </form>

          <div class="register-separator"><span>¿Eres nuevo paciente?</span></div>
          <a class="register-link" routerLink="/registro">
            Crear una cuenta
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M5 12h14M14 7l5 5-5 5" />
            </svg>
          </a>
          <div style="margin-top: 25px; text-align: center;">
            <a
              class="register-link"
              routerLink="/"
              style="font-size: 14px; justify-content: center; opacity: 0.8;"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                style="transform: rotate(180deg); margin-right: 5px;"
              >
                <path d="M5 12h14M14 7l5 5-5 5" />
              </svg>
              Volver a la página principal
            </a>
          </div>
        </section>

        <p class="security-note">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12 3l7 3v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6zM9 12l2 2 4-4" />
          </svg>
          Acceso seguro y encriptado
        </p>
      </main>
    </div>
  `,
})
export class LoginPageComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(SmartDentApiService);
  private readonly authStore = inject(AuthStore);
  private readonly toastStore = inject(ToastStore);
  private readonly router = inject(Router);

  readonly verificar = input<string | undefined>();
  readonly servicioId = input<string | undefined>();

  protected readonly showPassword = signal<boolean>(false);
  protected readonly submitting = signal<boolean>(false);
  protected readonly authError = signal<string | null>(null);
  protected readonly verifyBanner = signal<{ readonly ok: boolean; readonly text: string } | null>(
    null
  );

  protected readonly controlError = resolveControlError;

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    const token = this.verificar();
    if (token) {
      this.api.verificarCuenta({ token }).subscribe({
        next: () => {
          this.verifyBanner.set({
            ok: true,
            text: 'Cuenta verificada con éxito. Ya puedes iniciar sesión.',
          });
          this.toastStore.success('Tu cuenta ha sido activada.');
        },
        error: (err: unknown) => {
          this.verifyBanner.set({
            ok: false,
            text: extractApiErrorMessage(err, 'El enlace de verificación es inválido o expiró.'),
          });
        },
      });
    }
  }

  protected iniciarSesion(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.authError.set(null);

    this.api.login(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.submitting.set(false);
        const session = this.authStore.setSession(res);
        this.toastStore.success(`Bienvenido, ${session.nombreCompleto}`);

        const preselectedService = this.servicioId();
        if (session.rol === 'PACIENTE' && preselectedService) {
          void this.router.navigate(['/paciente/reservar'], {
            queryParams: { servicioId: preselectedService },
          });
          return;
        }
        void this.router.navigateByUrl(this.authStore.dashboardPath());
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.authError.set(applyServerValidationErrors(this.form, err));
      },
    });
  }
}
