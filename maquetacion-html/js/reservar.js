const session = (() => {
  try {
    return JSON.parse(localStorage.getItem("smartdent_session") || "null");
  } catch {
    return null;
  }
})();

if (!session || session.role !== "PACIENTE") {
  window.location.replace("index.html");
} else {
  initializeBookingPage();
}

function initializeBookingPage() {
  const form = document.querySelector("#booking-form");
  const service = document.querySelector("#service");
  const dentist = document.querySelector("#dentist");
  const date = document.querySelector("#appointment-date");
  const time = document.querySelector("#appointment-time");
  const phone = document.querySelector("#phone");
  const notes = document.querySelector("#notes");
  const error = document.querySelector("#booking-error");
  const rebookId = sessionStorage.getItem("smartdent_rebook_id");
  const rebookAppointment = getAppointments().find((item) => item.id === rebookId && item.patientEmail === session.email && ["PENDIENTE", "CONFIRMADA"].includes(item.status));

  const professionalsByService = {
    "Implantología Avanzada": ["Dr. Carlos Mendoza"],
    "Diseño de Sonrisa": ["Dra. Elena Ruiz"],
    "Endodoncia Microscópica": ["Dr. Miguel Silva"],
    "Periodoncia y Encías": ["Dra. Lucía Torres"],
    "Consulta y Diagnóstico": ["Dr. Carlos Mendoza", "Dra. Elena Ruiz", "Dr. Miguel Silva"],
    "Limpieza y Profilaxis": ["Dra. Lucía Torres", "Dra. Elena Ruiz"],
    "Urgencias Dentales": ["Dr. Carlos Mendoza", "Dr. Miguel Silva"],
    "Restauraciones con Resina": ["Dra. Elena Ruiz", "Dra. Lucía Torres"],
    "Blanqueamiento Dental": ["Dra. Elena Ruiz"],
    "Carillas Dentales": ["Dra. Elena Ruiz"],
    "Ortodoncia Convencional": ["Dra. Elena Ruiz"],
    "Ortodoncia Invisible": ["Dra. Elena Ruiz"],
    "Odontopediatría": ["Dra. Lucía Torres"],
    "Prótesis Dentales": ["Dr. Carlos Mendoza"],
    "Extracciones Dentales": ["Dr. Carlos Mendoza", "Dr. Miguel Silva"],
    "Cirugía de Terceros Molares": ["Dr. Carlos Mendoza"]
  };

  const servicesByCategory = {
    PREVENCION: ["Consulta y Diagnóstico", "Limpieza y Profilaxis", "Urgencias Dentales"],
    ESTETICA: ["Diseño de Sonrisa", "Restauraciones con Resina", "Blanqueamiento Dental", "Carillas Dentales"],
    ORTODONCIA: ["Ortodoncia Convencional", "Ortodoncia Invisible"],
    REHABILITACION: ["Implantología Avanzada", "Prótesis Dentales"],
    CIRUGIA: ["Endodoncia Microscópica", "Extracciones Dentales", "Cirugía de Terceros Molares"],
    ESPECIALIZADA: ["Periodoncia y Encías", "Odontopediatría"]
  };

  const professionalProfiles = {
    "Dr. Carlos Mendoza": { id: "DOC-CARLOS-MENDOZA", email: "carlos.mendoza@smartdent.com", image: "carlos-mendoza.webp", specialty: "Implantología y Cirugía Oral" },
    "Dra. Elena Ruiz": { id: "DOC-ELENA-RUIZ", email: "elena.ruiz@smartdent.com", image: "elena-ruiz.webp", specialty: "Estética y Ortodoncia" },
    "Dr. Miguel Silva": { id: "DOC-MIGUEL-SILVA", email: "miguel.silva@smartdent.com", image: "miguel-silva.webp", specialty: "Endodoncia Microscópica" },
    "Dra. Lucía Torres": { id: "DOC-LUCIA-TORRES", email: "lucia.torres@smartdent.com", image: "lucia-torres.webp", specialty: "Periodoncia y Odontopediatría" }
  };

  const minimumDate = new Date();
  minimumDate.setHours(0, 0, 0, 0);
  minimumDate.setDate(minimumDate.getDate() + 1);
  let visibleMonth = new Date(minimumDate.getFullYear(), minimumDate.getMonth(), 1);
  document.querySelector("#patient-name").value = session.name;

  document.querySelectorAll(".category-option").forEach((button) => {
    button.addEventListener("click", () => selectCategory(button.dataset.category));
  });

  function selectCategory(category) {
    document.querySelectorAll(".category-option").forEach((button) => {
      const selected = button.dataset.category === category;
      button.classList.toggle("border-navy", selected);
      button.classList.toggle("bg-navy", selected);
      button.classList.toggle("text-white", selected);
      button.querySelector(".material-symbols-outlined").classList.toggle("text-gold", !selected);
      button.querySelector(".material-symbols-outlined").classList.toggle("text-gold-soft", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    const activeServices = new Map(window.SmartDentCatalog.get().filter((item) => item.active).map((item) => [item.name, item]));
    const categoryServices = (servicesByCategory[category] || []).filter((name) => activeServices.has(name));
    service.innerHTML = `<option value="">Selecciona un tratamiento</option>${categoryServices.map((name) => `<option value="${name}">${name} — S/ ${Number(activeServices.get(name).price).toFixed(2)}</option>`).join("")}`;
    service.disabled = categoryServices.length === 0;
    dentist.value = "";
    renderProfessionalCards([]);
    updateSummary();
    clearBookingError();
  }

  service.addEventListener("change", () => {
    dentist.value = "";
    renderProfessionalCards(professionalsByService[service.value] || []);
    updateSummary();
    clearBookingError();
  });

  function renderProfessionalCards(professionals) {
    const container = document.querySelector("#dentist-options");
    if (!professionals.length) {
      container.innerHTML = '<p class="col-span-full rounded-lg border border-dashed border-slate-300 p-5 text-center text-xs text-slate-400">Selecciona un tratamiento para ver profesionales disponibles.</p>';
      return;
    }
    container.innerHTML = professionals.map((name) => {
      const profile = professionalProfiles[name];
      return `<button class="dentist-option flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-gold hover:bg-yellow-50" data-dentist="${name}" type="button"><img class="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-slate-200" src="img/odontologos/${profile.image}" alt="Retrato de ${name}"><span><strong class="block text-xs text-navy">${name}</strong><small class="mt-1 block text-[9px] text-slate-500">${profile.specialty}</small></span></button>`;
    }).join("");
    container.querySelectorAll(".dentist-option").forEach((button) => {
      button.addEventListener("click", () => {
        dentist.value = button.dataset.dentist;
        container.querySelectorAll(".dentist-option").forEach((option) => {
          const selected = option === button;
          option.classList.toggle("border-gold", selected);
          option.classList.toggle("ring-2", selected);
          option.classList.toggle("ring-gold-soft", selected);
          option.setAttribute("aria-pressed", String(selected));
        });
        updateSummary();
        clearBookingError();
      });
    });
  }

  const selectedService = sessionStorage.getItem("smartdent_selected_service");
  if (selectedService && professionalsByService[selectedService]) {
    const selectedCategory = Object.entries(servicesByCategory).find(([, services]) => services.includes(selectedService))?.[0];
    if (selectedCategory) selectCategory(selectedCategory);
    service.value = selectedService;
    service.dispatchEvent(new Event("change"));
  }
  sessionStorage.removeItem("smartdent_selected_service");

  document.querySelector("#previous-month").addEventListener("click", () => {
    const previous = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
    const minimumMonth = new Date(minimumDate.getFullYear(), minimumDate.getMonth(), 1);
    if (previous < minimumMonth) return;
    visibleMonth = previous;
    renderCalendar();
  });

  document.querySelector("#next-month").addEventListener("click", () => {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  function renderCalendar() {
    const daysContainer = document.querySelector("#calendar-days");
    const monthLabel = document.querySelector("#calendar-month");
    const previousButton = document.querySelector("#previous-month");
    const minimumMonth = new Date(minimumDate.getFullYear(), minimumDate.getMonth(), 1);
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
    const leadingSpaces = (firstDay.getDay() + 6) % 7;

    monthLabel.textContent = new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric" }).format(firstDay);
    previousButton.disabled = visibleMonth <= minimumMonth;
    daysContainer.innerHTML = "";

    for (let index = 0; index < leadingSpaces; index += 1) {
      const spacer = document.createElement("span");
      spacer.setAttribute("aria-hidden", "true");
      daysContainer.appendChild(spacer);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const calendarDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
      const dateValue = formatLocalDate(calendarDate);
      const button = document.createElement("button");
      const isUnavailable = calendarDate < minimumDate;
      const isSelected = date.value === dateValue;

      button.type = "button";
      button.textContent = String(day);
      button.disabled = isUnavailable;
      button.setAttribute("aria-label", new Intl.DateTimeFormat("es-PE", { dateStyle: "long" }).format(calendarDate));
      button.setAttribute("aria-pressed", String(isSelected));
      button.className = isSelected
        ? "grid h-8 w-8 place-items-center rounded-full bg-navy text-[10px] font-bold text-white shadow-sm"
        : isUnavailable
          ? "grid h-8 w-8 cursor-not-allowed place-items-center rounded-full text-[10px] text-slate-300"
          : "grid h-8 w-8 place-items-center rounded-full text-[10px] font-medium text-slate-700 transition hover:bg-yellow-50 hover:text-gold";

      button.addEventListener("click", () => {
        date.value = dateValue;
        updateSummary();
        clearBookingError();
        renderCalendar();
      });
      daysContainer.appendChild(button);
    }
  }

  function formatLocalDate(value) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  renderCalendar();

  document.querySelectorAll(".time-option").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".time-option").forEach((option) => {
        option.classList.remove("border-navy", "bg-navy", "text-white");
      });
      button.classList.add("border-navy", "bg-navy", "text-white");
      time.value = button.dataset.time;
      updateSummary();
      clearBookingError();
    });
  });

  if (rebookAppointment && professionalsByService[rebookAppointment.service]) {
    const category = Object.entries(servicesByCategory).find(([, services]) => services.includes(rebookAppointment.service))?.[0];
    if (category) selectCategory(category);
    service.value = rebookAppointment.service;
    service.dispatchEvent(new Event("change"));
    dentist.value = rebookAppointment.dentist;
    document.querySelector(`[data-dentist="${rebookAppointment.dentist}"]`)?.click();
    const originalDate = new Date(`${rebookAppointment.date}T12:00:00`);
    if (originalDate >= minimumDate) {
      date.value = rebookAppointment.date;
      visibleMonth = new Date(originalDate.getFullYear(), originalDate.getMonth(), 1);
      renderCalendar();
    }
    document.querySelector(`.time-option[data-time="${rebookAppointment.time}"]`)?.click();
    phone.value = rebookAppointment.phone || "";
    notes.value = rebookAppointment.notes || "";
    document.querySelector("#booking-form button[type='submit']").textContent = "Confirmar reprogramación";
    updateSummary();
  } else if (rebookId) {
    sessionStorage.removeItem("smartdent_rebook_id");
  }

  phone.addEventListener("input", clearBookingError);

  function clearBookingError() {
    error.classList.add("hidden");
    error.textContent = "";
  }

  function updateSummary() {
    document.querySelector("#summary-service").textContent = service.value || "Sin seleccionar";
    document.querySelector("#summary-dentist").textContent = dentist.value || "Sin seleccionar";
    document.querySelector("#summary-date").textContent = date.value
      ? new Intl.DateTimeFormat("es-PE", { dateStyle: "long" }).format(new Date(`${date.value}T12:00:00`))
      : "Sin seleccionar";
    document.querySelector("#summary-time").textContent = time.value || "Sin seleccionar";
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearBookingError();

    const phoneDigits = phone.value.replace(/\D/g, "");
    const missingFields = [];
    if (!service.value) missingFields.push("servicio");
    if (!dentist.value) missingFields.push("especialista");
    if (!date.value) missingFields.push("fecha");
    if (!time.value) missingFields.push("hora");
    if (phoneDigits.length < 9 || phoneDigits.length > 15) missingFields.push("teléfono válido");

    if (missingFields.length) {
      error.textContent = `Revisa: ${formatFieldList(missingFields)}.`;
      error.classList.remove("hidden");
      error.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const appointments = getAppointments();
    const selectedProfessional = professionalProfiles[dentist.value];
    const scheduleIsOccupied = appointments.some((appointment) =>
      appointment.id !== rebookAppointment?.id
      && (appointment.dentistId === selectedProfessional.id || appointment.dentist === dentist.value)
      && appointment.date === date.value
      && appointment.time === time.value
      && appointment.status !== "CANCELADA"
    );
    const scheduleIsBlocked = getDoctorBlocks().some((block) =>
      block.dentistId === selectedProfessional.id
      && block.date === date.value
      && block.time === time.value
    );

    if (scheduleIsOccupied || scheduleIsBlocked) {
      error.textContent = scheduleIsBlocked
        ? "El especialista bloqueó ese horario. Selecciona otra hora."
        : "Ese horario ya no está disponible. Selecciona otra hora.";
      error.classList.remove("hidden");
      return;
    }

    const appointmentData = {
      id: `SD-${Date.now()}`,
      patientEmail: session.email,
      patientName: session.name,
      service: service.value,
      dentist: dentist.value,
      dentistId: selectedProfessional.id,
      dentistEmail: selectedProfessional.email,
      date: date.value,
      time: time.value,
      phone: phone.value.trim(),
      notes: notes.value.trim(),
      status: "PENDIENTE",
      createdAt: new Date().toISOString()
    };
    if (rebookAppointment) {
      const targetIndex = appointments.findIndex((item) => item.id === rebookAppointment.id);
      appointmentData.id = rebookAppointment.id;
      appointmentData.createdAt = rebookAppointment.createdAt;
      appointmentData.updatedAt = new Date().toISOString();
      appointments[targetIndex] = appointmentData;
      sessionStorage.removeItem("smartdent_rebook_id");
      sessionStorage.setItem("smartdent_booking_result", "reprogramada");
    } else {
      appointments.push(appointmentData);
      sessionStorage.setItem("smartdent_booking_result", "registrada");
    }

    localStorage.setItem("smartdent_appointments", JSON.stringify(appointments));
    sessionStorage.setItem("smartdent_booking_id", appointmentData.id);
    window.location.href = "paciente.html?reserva=exitosa";
  });
}

function formatFieldList(fields) {
  if (fields.length === 1) return fields[0];
  return `${fields.slice(0, -1).join(", ")} y ${fields.at(-1)}`;
}

function getAppointments() {
  try {
    return JSON.parse(localStorage.getItem("smartdent_appointments") || "[]");
  } catch {
    return [];
  }
}

function getDoctorBlocks() {
  try {
    return JSON.parse(localStorage.getItem("smartdent_doctor_blocks") || "[]");
  } catch {
    return [];
  }
}
