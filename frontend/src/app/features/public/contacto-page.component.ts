import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { ToastStore } from '../../core/notifications/toast.store';
import { SmartDentApiService } from '../../core/services/smartdent-api.service';
import { FieldErrorComponent } from '../../shared/ui/field-error.component';
import {
  SmartDentValidators,
  applyServerValidationErrors,
} from '../../shared/validators/smartdent.validators';

@Component({
  selector: 'sd-contacto-page',
  imports: [ReactiveFormsModule, RouterLink, FieldErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="relative overflow-hidden bg-navy py-20 text-white md:py-28">
      <div class="absolute inset-0">
        <img
          class="h-full w-full object-cover object-center"
          src="/img/heroes/hero-contacto.png"
          alt="Recepción y atención al paciente en SmartDent"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/35"></div>
        <div class="absolute inset-0 bg-navy/20"></div>
      </div>
      <div class="relative mx-auto max-w-7xl px-5 lg:px-8">
        <p class="text-xs font-bold uppercase tracking-[.22em] text-gold-soft">Estamos para ayudarte</p>
        <h1 class="mt-4 text-4xl font-bold md:text-5xl">Contacta con SmartDent</h1>
        <p class="mt-5 max-w-2xl leading-7 text-slate-300">
          Resolvemos tus consultas sobre tratamientos, horarios y reservas. Escríbenos y nuestro equipo se comunicará contigo.
        </p>
      </div>
    </section>

    <section class="mx-auto grid max-w-7xl items-start gap-8 px-5 py-16 lg:grid-cols-[.8fr_1.2fr] lg:px-8 lg:py-20">
      <div class="space-y-6">
        <article class="rounded-xl border border-slate-200 border-t-2 border-t-gold bg-white p-7 shadow-sm">
          <h2 class="text-xl font-bold text-navy">Información de contacto</h2>
          <div class="mt-6 space-y-5">
            <div class="flex gap-4">
              <span class="material-symbols-outlined text-gold">location_on</span>
              <div>
                <h3 class="text-xs font-bold text-navy">Ubicación</h3>
                <p class="mt-1 text-sm leading-6 text-slate-500">Av. La Playa Manzana D, Ventanilla 07061</p>
              </div>
            </div>
            <div class="flex gap-4">
              <span class="material-symbols-outlined text-gold">call</span>
              <div>
                <h3 class="text-xs font-bold text-navy">Teléfono</h3>
                <a class="mt-1 block text-sm text-slate-500 hover:text-gold" href="tel:+51987654321">+51 987 654 321</a>
              </div>
            </div>
            <div class="flex gap-4">
              <span class="material-symbols-outlined text-gold">mail</span>
              <div>
                <h3 class="text-xs font-bold text-navy">Correo electrónico</h3>
                <a class="mt-1 block text-sm text-slate-500 hover:text-gold" href="mailto:contacto@smartdent.pe">contacto&#64;smartdent.pe</a>
              </div>
            </div>
          </div>
        </article>

        <article class="rounded-xl bg-navy p-7 text-white shadow-sm">
          <span class="material-symbols-outlined text-3xl text-gold-soft">schedule</span>
          <h2 class="mt-4 text-xl font-bold">Horario de atención</h2>
          <dl class="mt-5 space-y-3 text-sm text-slate-300">
            <div class="flex justify-between gap-4">
              <dt>Lunes a viernes</dt>
              <dd class="font-semibold text-white">8:00 – 20:00</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt>Sábados</dt>
              <dd class="font-semibold text-white">8:00 – 20:00</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt>Domingos</dt>
              <dd class="font-semibold text-gold-soft">Solo urgencias</dd>
            </div>
          </dl>
        </article>

        <a
          class="flex items-center justify-center gap-2 rounded-xl border border-gold bg-yellow-50 p-5 text-sm font-bold text-navy transition hover:bg-gold-soft"
          [routerLink]="authStore.role() === 'PACIENTE' ? '/paciente/reservar' : '/login'"
        >
          <span class="material-symbols-outlined">calendar_month</span>
          ¿Prefieres reservar? Agenda una cita
        </a>
      </div>

      <section
        class="rounded-xl border border-slate-200 bg-white p-7 shadow-sm md:p-9"
        aria-labelledby="contact-form-title"
      >
        <p class="text-xs font-bold uppercase tracking-[.18em] text-gold">Envíanos un mensaje</p>
        <h2 id="contact-form-title" class="mt-3 text-2xl font-bold text-navy">Cuéntanos cómo podemos ayudarte</h2>
        <p class="mt-3 text-sm leading-6 text-slate-500">Completa el formulario y responderemos a la brevedad.</p>

        <form [formGroup]="form" (ngSubmit)="enviar()" class="mt-8 grid gap-5 md:grid-cols-2" novalidate>
          <label class="text-xs font-semibold text-slate-700">
            Nombre completo
            <input
              formControlName="nombre"
              class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold-soft/40"
              type="text"
              autocomplete="name"
            />
            <sd-field-error [control]="form.controls.nombre" />
          </label>

          <label class="text-xs font-semibold text-slate-700">
            Correo electrónico
            <input
              formControlName="email"
              class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold-soft/40"
              type="email"
              autocomplete="email"
            />
            <sd-field-error [control]="form.controls.email" />
          </label>

          <label class="text-xs font-semibold text-slate-700">
            Teléfono <span class="font-normal text-slate-400">(opcional)</span>
            <input
              formControlName="telefono"
              class="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold-soft/40"
              type="tel"
              autocomplete="tel"
              maxlength="20"
              placeholder="+51 987 654 321"
            />
            <sd-field-error [control]="form.controls.telefono" />
          </label>

          <label class="text-xs font-semibold text-slate-700">
            Motivo de consulta
            <select
              formControlName="asunto"
              class="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold-soft/40"
            >
              <option value="">Selecciona una opción</option>
              <option value="Información de tratamientos">Información de tratamientos</option>
              <option value="Consulta sobre una cita">Consulta sobre una cita</option>
              <option value="Facturación">Facturación</option>
              <option value="Sugerencia o reclamo">Sugerencia o reclamo</option>
              <option value="Otro">Otro</option>
            </select>
            <sd-field-error [control]="form.controls.asunto" />
          </label>

          <label class="text-xs font-semibold text-slate-700 md:col-span-2">
            Mensaje
            <textarea
              formControlName="mensaje"
              class="mt-2 min-h-32 w-full resize-y rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold-soft/40"
              maxlength="600"
            ></textarea>
            <sd-field-error [control]="form.controls.mensaje" />
          </label>

          <div class="md:col-span-2">
            @if (generalError(); as err) {
              <p class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700" role="status" aria-live="polite">
                {{ err }}
              </p>
            }
            @if (successMsg(); as msg) {
              <p class="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700" role="status" aria-live="polite">
                {{ msg }}
              </p>
            }
            <button
              class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-6 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 sm:w-auto disabled:opacity-60"
              type="submit"
              [disabled]="submitting()"
            >
              <span>{{ submitting() ? 'Enviando...' : 'Enviar mensaje' }}</span>
              <span class="material-symbols-outlined text-lg">send</span>
            </button>
          </div>
        </form>
      </section>
    </section>

    <section class="border-y border-slate-200 bg-white py-16">
      <div class="mx-auto grid w-[calc(100%-2.5rem)] max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-navy shadow-lg lg:w-[calc(100%-4rem)] lg:grid-cols-[340px_1fr]">
        <div class="flex flex-col justify-between p-8 text-white md:p-10">
          <div>
            <span class="material-symbols-outlined rounded-lg bg-gold-soft p-3 text-3xl text-navy">location_on</span>
            <p class="mt-7 text-xs font-bold uppercase tracking-[.18em] text-gold-soft">Nuestra ubicación</p>
            <h2 class="mt-3 text-2xl font-bold">Visítanos en SmartDent</h2>
            <p class="mt-4 text-sm leading-6 text-slate-300">
              Av. La Playa Manzana D, Ventanilla 07061. Ubicación accesible mediante las principales vías de Ventanilla.
            </p>
            <dl class="mt-7 space-y-4 text-xs">
              <div>
                <dt class="text-slate-400">Coordenadas</dt>
                <dd class="mt-1 font-semibold">-11.877606, -77.130486</dd>
              </div>
              <div>
                <dt class="text-slate-400">Atención presencial</dt>
                <dd class="mt-1 font-semibold">Lunes a sábado · 8:00 – 20:00</dd>
              </div>
            </dl>
          </div>
          <a
            class="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-gold-soft px-5 py-3 text-xs font-bold text-navy transition hover:bg-yellow-300"
            href="https://www.google.com/maps/dir/?api=1&destination=-11.877606280714636%2C-77.13048624306016"
            target="_blank"
            rel="noopener noreferrer"
          >
            Cómo llegar al negocio
            <span class="material-symbols-outlined text-base">directions</span>
          </a>
        </div>
        <iframe
          class="h-[420px] w-full border-0 lg:h-full lg:min-h-[480px]"
          src="https://www.google.com/maps?q=-11.877606280714636,-77.13048624306016&z=17&output=embed"
          title="Ubicación exacta de SmartDent en Av. La Playa Manzana D, Ventanilla"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          allowfullscreen
        ></iframe>
      </div>
    </section>
  `,
})
export class ContactoPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(SmartDentApiService);
  private readonly toastStore = inject(ToastStore);
  protected readonly authStore = inject(AuthStore);

  protected readonly submitting = signal<boolean>(false);
  protected readonly generalError = signal<string | null>(null);
  protected readonly successMsg = signal<string | null>(null);

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    telefono: ['', [SmartDentValidators.telefono(false)]],
    asunto: ['', [Validators.required, Validators.maxLength(80)]],
    mensaje: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(600)]],
  });

  protected enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.generalError.set(null);
    this.successMsg.set(null);

    this.api.enviarMensajeContacto(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.form.reset({ nombre: '', email: '', telefono: '', asunto: '', mensaje: '' });
        this.successMsg.set('Mensaje enviado correctamente. Nuestro equipo se comunicará contigo pronto.');
        this.toastStore.success('Mensaje registrado correctamente.');
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.generalError.set(applyServerValidationErrors(this.form, err));
      },
    });
  }
}
