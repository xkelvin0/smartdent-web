import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sd-nosotros-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="relative overflow-hidden bg-navy py-20 text-white md:py-28">
      <div class="absolute inset-0">
        <img
          class="h-full w-full object-cover object-center"
          src="/img/heroes/hero-nosotros.png"
          alt="Equipo profesional de odontólogos de SmartDent"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/30"></div>
        <div class="absolute inset-0 bg-navy/15"></div>
      </div>
      <div class="relative mx-auto max-w-7xl px-5 lg:px-8">
        <div>
          <p class="text-xs font-bold uppercase tracking-[.22em] text-gold-soft">Quiénes somos</p>
          <h1 class="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
            Cuidamos sonrisas con precisión, cercanía y tecnología.
          </h1>
          <p class="mt-6 max-w-2xl leading-7 text-slate-300">
            SmartDent es una propuesta de clínica odontológica integral que conecta pacientes y especialistas mediante una experiencia digital clara, segura y humana.
          </p>
        </div>
      </div>
    </section>

    <section class="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-2 lg:px-8">
      <div>
        <p class="text-xs font-bold uppercase tracking-[.18em] text-gold">Nuestra historia</p>
        <h2 class="mt-3 text-3xl font-bold text-navy">Odontología pensada alrededor del paciente</h2>
        <p class="mt-5 leading-7 text-slate-600">
          El proyecto nació para resolver la gestión manual de citas, pacientes y tratamientos. SmartDent reúne la información necesaria en una sola plataforma y facilita la comunicación entre pacientes, odontólogos y administración.
        </p>
        <p class="mt-4 leading-7 text-slate-600">
          La clínica combina atención personalizada con herramientas digitales para reducir tiempos de espera y ofrecer seguimiento continuo.
        </p>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <article class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <span class="material-symbols-outlined text-3xl text-gold">verified</span>
          <h3 class="mt-4 font-bold text-navy">Atención confiable</h3>
          <p class="mt-2 text-sm leading-6 text-slate-500">Procesos claros y profesionales especializados.</p>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <span class="material-symbols-outlined text-3xl text-gold">devices</span>
          <h3 class="mt-4 font-bold text-navy">Experiencia digital</h3>
          <p class="mt-2 text-sm leading-6 text-slate-500">Reservas y seguimiento desde cualquier dispositivo.</p>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:col-span-2">
          <span class="material-symbols-outlined text-3xl text-gold">favorite</span>
          <h3 class="mt-4 font-bold text-navy">Trato humano</h3>
          <p class="mt-2 text-sm leading-6 text-slate-500">
            Escuchamos las necesidades de cada paciente para brindar una atención cercana.
          </p>
        </article>
      </div>
    </section>

    <section class="bg-white py-20">
      <div class="mx-auto grid max-w-7xl gap-6 px-5 md:grid-cols-3 lg:px-8">
        <article class="rounded-xl border-t-2 border-gold bg-canvas p-7">
          <p class="text-xs font-bold uppercase tracking-wider text-gold">Misión</p>
          <h2 class="mt-3 text-xl font-bold text-navy">Mejorar la salud bucal</h2>
          <p class="mt-4 text-sm leading-6 text-slate-600">
            Ofrecer atención odontológica integral y accesible mediante profesionales capacitados y procesos digitales eficientes.
          </p>
        </article>
        <article class="rounded-xl border-t-2 border-gold bg-canvas p-7">
          <p class="text-xs font-bold uppercase tracking-wider text-gold">Visión</p>
          <h2 class="mt-3 text-xl font-bold text-navy">Ser una clínica referente</h2>
          <p class="mt-4 text-sm leading-6 text-slate-600">
            Convertirnos en una propuesta reconocida por su calidad clínica, innovación tecnológica y confianza.
          </p>
        </article>
        <article class="rounded-xl border-t-2 border-gold bg-canvas p-7">
          <p class="text-xs font-bold uppercase tracking-wider text-gold">Valores</p>
          <h2 class="mt-3 text-xl font-bold text-navy">Ética y excelencia</h2>
          <p class="mt-4 text-sm leading-6 text-slate-600">
            Trabajamos con empatía, responsabilidad, transparencia, innovación y respeto por cada persona.
          </p>
        </article>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-5 py-20 lg:px-8">
      <div class="max-w-2xl">
        <p class="text-xs font-bold uppercase tracking-[.18em] text-gold">Equipo clínico</p>
        <h2 class="mt-3 text-3xl font-bold text-navy">Especialistas que te acompañan</h2>
        <p class="mt-4 text-slate-600">Profesionales de diferentes áreas para ofrecer diagnósticos y tratamientos integrales.</p>
      </div>
      <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <article class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <img class="h-64 w-full object-cover" src="/img/odontologos/carlos-mendoza.webp" alt="Dr. Carlos Mendoza" />
          <div class="p-5">
            <h3 class="font-bold text-navy">Dr. Carlos Mendoza</h3>
            <p class="mt-2 text-xs text-gold">Implantología y Cirugía Oral</p>
          </div>
        </article>
        <article class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <img class="h-64 w-full object-cover" src="/img/odontologos/elena-ruiz.webp" alt="Dra. Elena Ruiz" />
          <div class="p-5">
            <h3 class="font-bold text-navy">Dra. Elena Ruiz</h3>
            <p class="mt-2 text-xs text-gold">Estética y Ortodoncia</p>
          </div>
        </article>
        <article class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <img class="h-64 w-full object-cover" src="/img/odontologos/miguel-silva.webp" alt="Dr. Miguel Silva" />
          <div class="p-5">
            <h3 class="font-bold text-navy">Dr. Miguel Silva</h3>
            <p class="mt-2 text-xs text-gold">Endodoncia Microscópica</p>
          </div>
        </article>
        <article class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <img class="h-64 w-full object-cover" src="/img/odontologos/lucia-torres.webp" alt="Dra. Lucía Torres" />
          <div class="p-5">
            <h3 class="font-bold text-navy">Dra. Lucía Torres</h3>
            <p class="mt-2 text-xs text-gold">Periodoncia y Odontopediatría</p>
          </div>
        </article>
      </div>
    </section>
  `,
})
export class NosotrosPageComponent {}
