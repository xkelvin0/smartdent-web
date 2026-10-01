(() => {
  const footer = document.querySelector("#site-footer");
  if (!footer) return;

  footer.id = "contacto";
  footer.className = "bg-[#040d19] text-slate-300";
  footer.innerHTML = `
    <div class="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1.2fr] lg:px-8">
      <section aria-labelledby="footer-brand-title">
        <a class="inline-flex rounded-xl bg-white p-3 shadow-sm" href="index.html" aria-label="SmartDent - Inicio">
          <img class="h-11 w-auto" src="img/branding/logo-smartdent.png" alt="SmartDent">
        </a>
        <h2 id="footer-brand-title" class="mt-5 text-base font-bold text-white">Cuidado dental con confianza</h2>
        <p class="mt-3 max-w-sm text-xs leading-6 text-slate-400">Atención odontológica integral, tecnología moderna y especialistas comprometidos con la salud de cada paciente.</p>
        <nav class="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs" aria-label="Enlaces del pie de página">
          <a class="transition hover:text-[#f4d77d]" href="index.html">Inicio</a>
          <a class="transition hover:text-[#f4d77d]" href="servicios.html">Servicios</a>
          <a class="transition hover:text-[#f4d77d]" href="nosotros.html">Nosotros</a>
          <a class="transition hover:text-[#f4d77d]" href="contacto.html">Contacto</a>
        </nav>
      </section>

      <section aria-labelledby="footer-contact-title">
        <h2 id="footer-contact-title" class="text-sm font-bold text-white">Contacto y atención</h2>
        <address class="mt-5 space-y-3 text-xs not-italic leading-5 text-slate-400">
          <p><strong class="block text-slate-200">Ubicación</strong><a class="hover:text-[#f4d77d]" href="https://www.google.com/maps/dir/?api=1&amp;destination=-11.877606280714636%2C-77.13048624306016" target="_blank" rel="noopener noreferrer">Av. La Playa Manzana D, Ventanilla 07061</a><span class="mt-0.5 block text-[10px]">Cómo llegar al negocio</span></p>
          <p><strong class="block text-slate-200">Teléfono</strong><a class="hover:text-[#f4d77d]" href="tel:+51987654321">+51 987 654 321</a></p>
          <p><strong class="block text-slate-200">Correo electrónico</strong><a class="hover:text-[#f4d77d]" href="mailto:contacto@smartdent.pe">contacto@smartdent.pe</a></p>
          <p><strong class="block text-slate-200">Horario</strong>Lunes a sábado · 8:00 a. m. – 8:00 p. m.</p>
        </address>
      </section>

      <section aria-labelledby="footer-team-title">
        <div class="inline-flex rounded-lg bg-white p-2.5">
          <img class="h-10 w-auto" src="img/branding/logo-utp.svg" alt="Universidad Tecnológica del Perú">
        </div>
        <h2 id="footer-team-title" class="mt-5 text-sm font-bold text-white">Integrantes del grupo</h2>
        <ul class="mt-3 space-y-2 text-xs leading-5 text-slate-400">
          <li><strong class="block text-slate-200">Acevedo Huarachi Kelvin Jesus</strong>Código: U23309803</li>
          <li><strong class="block text-slate-200">Añorga Pinedo Paolo Alexander</strong>Código: U23305864</li>
          <li><strong class="block text-slate-200">Calle Paredes Maykol Adan</strong>Código: U23242558</li>
          <li><strong class="block text-slate-200">Salinas Perez Joseph Sebastian</strong>Código: U23325202</li>
        </ul>
        <p class="mt-4 text-[10px] uppercase tracking-[.14em] text-slate-500">Proyecto académico · Desarrollo Web Integrado</p>
      </section>
    </div>
    <div class="border-t border-white/10">
      <div class="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-center text-[11px] text-slate-500 sm:flex-row sm:justify-between sm:text-left lg:px-8">
        <p>© 2026 SmartDent. Todos los derechos reservados.</p>
        <p>Excelencia clínica a través de la sofisticación.</p>
      </div>
    </div>`;
})();
