const serviceCatalog = [
  { title: "Consulta y Diagnóstico", category: "Prevención", image: "periodoncia-laser.webp", icon: "clinical_notes", description: "Evaluación clínica integral, revisión de antecedentes y plan de tratamiento personalizado.", benefits: ["Diagnóstico completo", "Plan personalizado"], duration: "30–45 minutos", sessions: "Una sesión" },
  { title: "Limpieza y Profilaxis", category: "Prevención", image: "periodoncia-laser.webp", icon: "cleaning_services", description: "Eliminamos placa bacteriana y sarro para prevenir caries y enfermedades de las encías.", benefits: ["Prevención de caries", "Encías saludables"], duration: "30–45 minutos", sessions: "Cada 6 meses" },
  { title: "Urgencias Dentales", category: "Atención prioritaria", image: "endodoncia-microscopica.webp", icon: "emergency", description: "Atención rápida para dolor intenso, fracturas, traumatismos e infecciones odontológicas.", benefits: ["Evaluación prioritaria", "Control del dolor"], duration: "30–60 minutos", sessions: "Según diagnóstico" },
  { title: "Implantología Avanzada", category: "Implantología", image: "implantologia-avanzada.webp", icon: "dentistry", description: "Recupera dientes ausentes mediante implantes planificados digitalmente para lograr precisión y resultados naturales.", benefits: ["Planificación 3D", "Evaluación personalizada"], duration: "60–90 minutos", sessions: "Varias sesiones" },
  { title: "Diseño de Sonrisa", category: "Estética dental", image: "diseno-sonrisa.webp", icon: "sentiment_satisfied", description: "Diseñamos una sonrisa armónica respetando tus rasgos mediante fotografía clínica y planificación digital.", benefits: ["Simulación digital", "Resultado natural"], duration: "45–60 minutos", sessions: "Según tratamiento" },
  { title: "Restauraciones con Resina", category: "Restauración", image: "diseno-sonrisa.webp", icon: "format_color_fill", description: "Reconstrucciones del color del diente para recuperar forma, función y estética de piezas afectadas.", benefits: ["Acabado estético", "Conservación dental"], duration: "30–60 minutos", sessions: "Una sesión" },
  { title: "Blanqueamiento Dental", category: "Estética dental", image: "diseno-sonrisa.webp", icon: "flare", description: "Aclaramos el tono dental con un protocolo profesional, controlado y adaptado a tu sensibilidad.", benefits: ["Supervisión profesional", "Tono uniforme"], duration: "45–60 minutos", sessions: "Una o dos sesiones" },
  { title: "Carillas Dentales", category: "Estética dental", image: "diseno-sonrisa.webp", icon: "view_agenda", description: "Láminas estéticas para mejorar forma, tamaño, alineación y color de los dientes anteriores.", benefits: ["Diseño personalizado", "Apariencia natural"], duration: "60–90 minutos", sessions: "Dos o más sesiones" },
  { title: "Ortodoncia Convencional", category: "Ortodoncia", image: "diseno-sonrisa.webp", icon: "grid_on", description: "Brackets para corregir la posición dental y mejorar la función, alineación y estabilidad de la mordida.", benefits: ["Control especializado", "Corrección funcional"], duration: "30–45 minutos", sessions: "Controles mensuales" },
  { title: "Ortodoncia Invisible", category: "Ortodoncia", image: "diseno-sonrisa.webp", icon: "layers_clear", description: "Alineadores transparentes removibles diseñados digitalmente para corregir la posición dental.", benefits: ["Alineadores removibles", "Planificación digital"], duration: "30–45 minutos", sessions: "Controles periódicos" },
  { title: "Odontopediatría", category: "Atención infantil", image: "periodoncia-laser.webp", icon: "child_care", description: "Prevención y tratamientos adaptados a bebés, niños y adolescentes en un ambiente de confianza.", benefits: ["Atención amigable", "Prevención temprana"], duration: "30–45 minutos", sessions: "Según diagnóstico" },
  { title: "Prótesis Dentales", category: "Rehabilitación", image: "implantologia-avanzada.webp", icon: "settings_accessibility", description: "Coronas, puentes y prótesis diseñados para recuperar estética, comodidad y función masticatoria.", benefits: ["Diseño funcional", "Ajuste personalizado"], duration: "45–60 minutos", sessions: "Varias sesiones" },
  { title: "Endodoncia Microscópica", category: "Alta precisión", image: "endodoncia-microscopica.webp", icon: "biotech", description: "Tratamos conductos con magnificación para conservar la pieza afectada y mejorar la precisión clínica.", benefits: ["Microscopio clínico", "Mayor precisión"], duration: "60–120 minutos", sessions: "Una o dos sesiones" },
  { title: "Extracciones Dentales", category: "Cirugía oral", image: "implantologia-avanzada.webp", icon: "healing", description: "Extracción segura de piezas que no pueden conservarse, con evaluación y cuidados posteriores.", benefits: ["Procedimiento seguro", "Control posoperatorio"], duration: "30–60 minutos", sessions: "Una sesión" },
  { title: "Cirugía de Terceros Molares", category: "Cirugía oral", image: "implantologia-avanzada.webp", icon: "oral_disease", description: "Evaluación y extracción quirúrgica de muelas del juicio retenidas o con riesgo de complicaciones.", benefits: ["Evaluación radiográfica", "Seguimiento clínico"], duration: "45–90 minutos", sessions: "Una sesión" },
  { title: "Periodoncia y Encías", category: "Tecnología láser", image: "periodoncia-laser.webp", icon: "health_and_safety", description: "Prevenimos y tratamos enfermedades de las encías con procedimientos precisos y mínimamente invasivos.", benefits: ["Evaluación periodontal", "Tratamiento láser"], duration: "45–75 minutos", sessions: "Según diagnóstico" }
];

document.querySelector("#services-grid").innerHTML = serviceCatalog.map((service) => `
  <article class="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
    <div class="aspect-[4/3] overflow-hidden bg-slate-100">
      <img class="h-full w-full object-cover transition duration-500 group-hover:scale-105" src="img/servicios/${service.image}" alt="Servicio de ${service.title} en SmartDent" loading="lazy">
    </div>
    <div class="border-t-2 border-gold p-7">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div><p class="mb-2 text-xs font-bold uppercase tracking-wider text-gold">${service.category}</p><h3 class="text-2xl font-bold text-navy">${service.title}</h3></div>
        <span class="material-symbols-outlined rounded-xl bg-yellow-50 p-3 text-gold">${service.icon}</span>
      </div>
      <p class="min-h-[84px] leading-7 text-slate-600">${service.description}</p>
      <ul class="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
        <li class="flex gap-2"><span class="material-symbols-outlined text-base text-gold">check_circle</span>${service.benefits[0]}</li>
        <li class="flex gap-2"><span class="material-symbols-outlined text-base text-gold">check_circle</span>${service.benefits[1]}</li>
        <li class="flex gap-2"><span class="material-symbols-outlined text-base text-gold">schedule</span>${service.duration}</li>
        <li class="flex gap-2"><span class="material-symbols-outlined text-base text-gold">event</span>${service.sessions}</li>
      </ul>
      <button class="booking-button mt-8 inline-flex items-center gap-2 text-sm font-bold text-navy transition hover:text-gold" data-service="${service.title}" type="button">Reservar evaluación <span class="material-symbols-outlined text-lg">arrow_forward</span></button>
    </div>
  </article>
`).join("");

const session = (() => {
  try {
    return JSON.parse(localStorage.getItem("smartdent_session") || "null");
  } catch {
    return null;
  }
})();

const modal = document.querySelector("#auth-modal");

document.querySelectorAll(".booking-button").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.service) {
      sessionStorage.setItem("smartdent_selected_service", button.dataset.service);
    }
    if (session?.role === "PACIENTE") {
      window.location.href = "reservar.html";
      return;
    }

    if (session?.role === "ODONTOLOGO") {
      window.location.href = "odontologo.html";
      return;
    }

    if (session?.role === "ADMIN") {
      window.location.href = "admin.html";
      return;
    }

    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
    document.querySelector("#modal-login").focus({ preventScroll: true });
  });
});

function closeModal() {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.classList.remove("overflow-hidden");
}

document.querySelector("#close-modal").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

document.querySelector("#modal-login").addEventListener("click", () => {
  sessionStorage.setItem("smartdent_redirect", "reservar.html");
  window.location.href = "login.html";
});

document.querySelector("#modal-register").addEventListener("click", () => {
  sessionStorage.setItem("smartdent_redirect", "reservar.html");
  window.location.href = "registro.html";
});
