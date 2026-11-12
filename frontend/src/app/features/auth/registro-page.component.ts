import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastStore } from '../../core/notifications/toast.store';
import { SmartDentApiService } from '../../core/services/smartdent-api.service';
import {
  SmartDentValidators,
  applyServerValidationErrors,
  resolveControlError,
} from '../../shared/validators/smartdent.validators';

@Component({
  selector: 'sd-registro-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page register-page">
      <main class="register-main">
        <header class="brand-header">
          <a routerLink="/login" aria-label="Ir al inicio de sesión">SmartDent</a>
          <p>Excelencia Clínica a través de la Sofisticación.</p>
        </header>

        <section class="register-card" aria-labelledby="register-title">
          <div class="register-card-heading">
            <h1 id="register-title">Crear Cuenta</h1>
            <p>Por favor, complete sus datos para registrarse.</p>
          </div>

          @if (registeredEmail(); as email) {
            <p class="form-message is-success" aria-live="polite">
              Cuenta creada. Enviamos un enlace de verificación a <strong>{{ email }}</strong>.
            </p>
            <div class="login-prompt">
              <a routerLink="/login">Ir a Iniciar Sesión</a>
            </div>
          } @else {
            <form [formGroup]="form" (ngSubmit)="registrar()" class="auth-form register-form" novalidate>
              <div class="form-group">
                <label for="full-name">Nombre Completo</label>
                <div class="input-wrapper">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="3" />
                    <path d="M6 20v-2a6 6 0 0112 0v2" />
                  </svg>
                  <input
                    id="full-name"
                    type="text"
                    formControlName="nombreCompleto"
                    autocomplete="name"
                    minlength="3"
                    placeholder="Ej. Juan Pérez"
                    [class.is-invalid]="form.controls.nombreCompleto.touched && form.controls.nombreCompleto.invalid"
                  />
                </div>
                @if (controlError(form.controls.nombreCompleto); as err) {
                  <small class="field-error" aria-live="polite">{{ err }}</small>
                }
              </div>

              <div class="form-group">
                <label for="dni">DNI / Documento de Identidad</label>
                <div class="input-wrapper">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <circle cx="8" cy="11" r="2" />
                    <path d="M5.5 16c.6-1.5 1.4-2 2.5-2s1.9.5 2.5 2M13 10h5M13 14h5" />
                  </svg>
                  <input
                    id="dni"
                    type="text"
                    formControlName="dni"
                    inputmode="numeric"
                    autocomplete="off"
                    maxlength="8"
                    placeholder="Ej. 12345678"
                    [class.is-invalid]="form.controls.dni.touched && form.controls.dni.invalid"
                  />
                </div>
                @if (controlError(form.controls.dni); as err) {
                  <small class="field-error" aria-live="polite">{{ err }}</small>
                }
              </div>

              <div class="form-group">
                <label for="register-email">Correo Electrónico</label>
                <div class="input-wrapper">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M4 6h16v12H4zM4 7l8 6 8-6" />
                  </svg>
                  <input
                    id="register-email"
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    placeholder="correo@ejemplo.com"
                    [class.is-invalid]="form.controls.email.touched && form.controls.email.invalid"
                  />
                </div>
                @if (controlError(form.controls.email); as err) {
                  <small class="field-error" aria-live="polite">{{ err }}</small>
                }
              </div>

              <div class="form-group">
                <label for="register-password">Contraseña</label>
                <div class="input-wrapper">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <rect x="5" y="10" width="14" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 018 0v3M12 14v3" />
                  </svg>
                  <input
                    id="register-password"
                    [type]="showPassword() ? 'text' : 'password'"
                    formControlName="password"
                    (input)="passwordDraft.set(form.controls.password.value)"
                    minlength="8"
                    autocomplete="new-password"
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
                <small class="field-help">Mínimo 8 caracteres, al menos una letra y un número.</small>

                <div class="password-strength" aria-live="polite">
                  <div class="password-strength-heading">
                    <span>Fortaleza de la contraseña</span>
                    <strong>{{ strengthLabel() }}</strong>
                  </div>
                  <div
                    class="password-strength-track"
                    role="progressbar"
                    aria-label="Fortaleza de la contraseña"
                    aria-valuemin="0"
                    aria-valuemax="4"
                    [attr.aria-valuenow]="strengthScore()"
                    [attr.data-score]="strengthScore()"
                  >
                    <span class="password-strength-fill"></span>
                  </div>
                  <ul class="password-requirements">
                    <li [class.is-complete]="hasMinLength()">8 caracteres</li>
                    <li [class.is-complete]="hasLetter()">Una letra</li>
                    <li [class.is-complete]="hasNumber()">Un número</li>
                    <li [class.is-complete]="hasSymbol()">Un símbolo (recomendado)</li>
                  </ul>
                </div>

                @if (controlError(form.controls.password); as err) {
                  <small class="field-error" aria-live="polite">{{ err }}</small>
                }
              </div>

              @if (serverError(); as err) {
                <p class="form-message" aria-live="polite">{{ err }}</p>
              }

              <button class="primary-button register-button" type="submit" [disabled]="submitting()">
                {{ submitting() ? 'Registrando...' : 'Registrarse' }}
              </button>
            </form>

            <div class="login-prompt">
              <span>¿Ya tienes una cuenta?</span>
              <a routerLink="/login">Inicia Sesión</a>
            </div>
          }
        </section>

        <p class="legal-note">
          Al registrarte, aceptas nuestros
          <a routerLink="/nosotros">Términos de Servicio</a> y
          <a routerLink="/nosotros">Política de Privacidad</a>.
        </p>
      </main>
    </div>
  `,
})
export class RegistroPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(SmartDentApiService);
  private readonly toastStore = inject(ToastStore);

  protected readonly showPassword = signal<boolean>(false);
  protected readonly submitting = signal<boolean>(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly registeredEmail = signal<string | null>(null);
  protected readonly passwordDraft = signal<string>('');

  protected readonly controlError = resolveControlError;

  protected readonly hasMinLength = computed<boolean>(() => this.passwordDraft().length >= 8);
  protected readonly hasLetter = computed<boolean>(() => /[A-Za-z]/.test(this.passwordDraft()));
  protected readonly hasNumber = computed<boolean>(() => /\d/.test(this.passwordDraft()));
  protected readonly hasSymbol = computed<boolean>(() => /[^A-Za-z0-9]/.test(this.passwordDraft()));

  protected readonly strengthScore = computed<number>(() => {
    let score = 0;
    if (this.hasMinLength()) score++;
    if (this.hasLetter()) score++;
    if (this.hasNumber()) score++;
    if (this.hasSymbol()) score++;
    return score;
  });

  protected readonly strengthLabel = computed<string>(() => {
    switch (this.strengthScore()) {
      case 0:
        return 'Sin contraseña';
      case 1:
        return 'Débil';
      case 2:
        return 'Regular';
      case 3:
        return 'Buena';
      default:
        return 'Fuerte';
    }
  });

  protected readonly form = this.fb.group({
    nombreCompleto: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    dni: ['', [Validators.required, SmartDentValidators.dniPeru()]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    password: ['', [Validators.required, SmartDentValidators.passwordCompleja()]],
  });

  protected registrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.serverError.set(null);

    const { nombreCompleto, dni, email, password } = this.form.getRawValue();
    this.api
      .registrarPaciente({
        nombreCompleto: nombreCompleto.trim(),
        dni: dni.trim(),
        email: email.trim(),
        password,
      })
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.registeredEmail.set(res.email);
          this.toastStore.success('Cuenta creada. Revisa tu correo para activarla.');
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          this.serverError.set(applyServerValidationErrors(this.form, err));
        },
      });
  }
}
