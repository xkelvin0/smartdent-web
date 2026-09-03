const session = SmartDentApi.getSession();

if (!session || session.role !== "PACIENTE" || !session.token) {
  sessionStorage.setItem("smartdent_redirect", "reservar.html");
  window.location.replace("login.html");
} else {
  initializeBookingPage();
}

async function initializeBookingPage() {
  const form = document.querySelector("#booking-form");
  const serviceInput = document.querySelector("#service");
  const dentistInput = document.querySelector("#dentist");
  const dateInput = document.querySelector("#appointment-date");
  const timeInput = document.querySelector("#appointment-time");
  const phoneInput = document.querySelector("#phone");
  const notesInput = document.querySelector("#notes");
  const errorBox = document.querySelector("#booking-error");
  const submitButton = form.querySelector("button[type='submit']");
  const dentistContainer = document.querySelector("#dentist-options");
  const timeContainer = document.querySelector("#time-options");
  const rebookId = sessionStorage.getItem("smartdent_rebook_id");
  const servicesByCategory = {
    PREVENCION: ["SRV-CONSULTA", "SRV-CONTROL", "SRV-LIMPIEZA", "SRV-URGENCIA"],
    ESTETICA: ["SRV-DISENO", "SRV-RESINA", "SRV-BLANQUEAMIENTO", "SRV-CARILLAS"],
    ORTODONCIA: ["SRV-ORTODONCIA", "SRV-ORTODONCIA-INVISIBLE"],
    REHABILITACION: ["SRV-IMPLANTE", "SRV-PROTESIS"],
    CIRUGIA: ["SRV-ENDODONCIA", "SRV-EXTRACCION", "SRV-TERCEROS-MOLARES"],
    ESPECIALIZADA: ["SRV-PERIODONCIA", "SRV-ODONTOPEDIATRIA"]
  };
  const minimumDate = new Date();
  minimumDate.setHours(0, 0, 0, 0);
  minimumDate.setDate(minimumDate.getDate() + 1);
  let visibleMonth = new Date(minimumDate.getFullYear(), minimumDate.getMonth(), 1);
  let services = [];
  let dentists = [];
  let selectedDentist = null;
  let availabilitySequence = 0;
  let rebookAppointment = null;

  document.querySelector("#patient-name").value = session.name;
  phoneInput.value = session.phone || "";
  showTimesMessage("Selecciona servicio, especialista y fecha.");

  try {
    [services] = await Promise.all([
      SmartDentApi.request("/servicios", { auth: false }),
      rebookId ? SmartDentAppointments.listPatient().then((appointments) => {
        rebookAppointment = appointments.find((item) =>
          item.id === String(rebookId) && ["PENDIENTE", "CONFIRMADA"].includes(item.status));
      }) : Promise.resolve()
    ]);
  } catch (error) {
    showError(error);
    disableForm();
    return;
  }

  document.querySelectorAll(".category-option").forEach((button) => {
    button.addEventListener("click", () => selectCategory(button.dataset.category));
  });

  function selectCategory(category) {
    document.querySelectorAll(".category-option").forEach((button) => {
      const selected = button.dataset.category === category;
      button.classList.toggle("border-navy", selected);
      button.classList.toggle("bg-navy", selected);
      button.classList.toggle("text-white", selected);
      button.classList.toggle("border-slate-200", !selected);
      button.classList.toggle("bg-white", !selected);
      button.classList.toggle("text-slate-700", !selected);
      button.querySelector(".material-symbols-outlined").classList.toggle("text-gold", !selected);
      button.querySelector(".material-symbols-outlined").classList.toggle("text-gold-soft", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    const codes = servicesByCategory[category] || [];
    const categoryServices = services.filter((item) => codes.includes(item.codigo));
    serviceInput.innerHTML = `<option value="">Selecciona un tratamiento</option>${categoryServices
      .map((item) => `<option value="${item.id}">${escapeHtml(item.nombre)} — S/ ${Number(item.precio).toFixed(2)}</option>`)
      .join("")}`;
    serviceInput.disabled = categoryServices.length === 0;
    resetDentist();
    resetAvailability();
    updateSummary();
    clearError();
  }

  serviceInput.addEventListener("change", async () => {
    resetDentist();
    resetAvailability();
    updateSummary();
    clearError();
    if (!serviceInput.value) return;
    dentistContainer.innerHTML = '<p class="col-span-full p-5 text-center text-xs text-slate-500">Cargando especialistas...</p>';
    try {
      dentists = await SmartDentApi.request(`/odontologos?servicioId=${serviceInput.value}`, { auth: false });
      renderDentists();
    } catch (error) {
      showError(error);
      resetDentist();
    }
  });

  function renderDentists() {
    if (!dentists.length) {
      dentistContainer.innerHTML = '<p class="col-span-full rounded-lg border border-dashed border-slate-300 p-5 text-center text-xs text-slate-400">No hay especialistas disponibles para este servicio.</p>';
      return;
    }
    dentistContainer.innerHTML = dentists.map((dentist) => `
      <button class="dentist-option flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-gold hover:bg-yellow-50" data-dentist-id="${dentist.id}" type="button">
        <img class="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-slate-200" src="img/odontologos/${escapeHtml(dentist.fotoUrl || "carlos-mendoza.webp")}" alt="Retrato de ${escapeHtml(dentist.nombreCompleto)}">
        <span><strong class="block text-xs text-navy">${escapeHtml(dentist.nombreCompleto)}</strong><small class="mt-1 block text-[9px] text-slate-500">${escapeHtml(dentist.especialidad)}</small></span>
      </button>`).join("");
    dentistContainer.querySelectorAll(".dentist-option").forEach((button) => {
      button.addEventListener("click", () => selectDentist(button.dataset.dentistId));
    });
  }

  function selectDentist(id) {
    selectedDentist = dentists.find((item) => String(item.id) === String(id)) || null;
    dentistInput.value = selectedDentist?.id || "";
    dentistContainer.querySelectorAll(".dentist-option").forEach((option) => {
      const selected = option.dataset.dentistId === String(id);
      option.classList.toggle("border-gold", selected);
      option.classList.toggle("ring-2", selected);
      option.classList.toggle("ring-gold-soft", selected);
      option.setAttribute("aria-pressed", String(selected));
    });
    resetAvailability();
    updateSummary();
    clearError();
    refreshAvailability();
  }

  function resetDentist() {
    dentists = [];
    selectedDentist = null;
    dentistInput.value = "";
    dentistContainer.innerHTML = '<p class="col-span-full rounded-lg border border-dashed border-slate-300 p-5 text-center text-xs text-slate-400">Selecciona un tratamiento para ver profesionales disponibles.</p>';
  }

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
      daysContainer.appendChild(document.createElement("span"));
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const calendarDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
      const dateValue = formatLocalDate(calendarDate);
      const button = document.createElement("button");
      const unavailable = calendarDate < minimumDate || calendarDate.getDay() === 0;
      const selected = dateInput.value === dateValue;
      button.type = "button";
      button.textContent = String(day);
      button.disabled = unavailable;
      button.setAttribute("aria-label", new Intl.DateTimeFormat("es-PE", { dateStyle: "long" }).format(calendarDate));
      button.setAttribute("aria-pressed", String(selected));
      button.className = selected
        ? "grid h-8 w-8 place-items-center rounded-full bg-navy text-[10px] font-bold text-white shadow-sm"
        : unavailable
          ? "grid h-8 w-8 cursor-not-allowed place-items-center rounded-full text-[10px] text-slate-300"
          : "grid h-8 w-8 place-items-center rounded-full text-[10px] font-medium text-slate-700 transition hover:bg-yellow-50 hover:text-gold";
      button.addEventListener("click", () => {
        dateInput.value = dateValue;
        resetAvailability();
        renderCalendar();
        updateSummary();
        clearError();
        refreshAvailability();
      });
      daysContainer.appendChild(button);
    }
  }

  async function refreshAvailability() {
    if (!serviceInput.value || !dentistInput.value || !dateInput.value) {
      showTimesMessage("Selecciona servicio, especialista y fecha.");
      return;
    }
    const sequence = ++availabilitySequence;
    showTimesMessage("Consultando horarios...");
    try {
      const result = await SmartDentApi.request(
        `/pacientes/citas/disponibilidad?odontologoId=${dentistInput.value}&servicioId=${serviceInput.value}&fecha=${dateInput.value}`
      );
      if (sequence !== availabilitySequence) return;
      renderTimes(result.horariosDisponibles || []);
    } catch (error) {
      if (sequence !== availabilitySequence) return;
      showTimesMessage(error.message, true);
    }
  }

  function renderTimes(times) {
    timeInput.value = "";
    updateSummary();
    if (!times.length) {
      showTimesMessage("No quedan horarios disponibles para esta fecha.");
      return;
    }
    timeContainer.innerHTML = times.map((time) => {
      const normalized = String(time).slice(0, 5);
      return `<button class="time-option rounded-md border border-slate-300 px-3 py-3 text-xs font-semibold transition hover:border-gold hover:bg-yellow-50" type="button" data-time="${normalized}">${formatTime(normalized)}</button>`;
    }).join("");
    timeContainer.querySelectorAll(".time-option").forEach((button) => {
      button.addEventListener("click", () => {
        timeContainer.querySelectorAll(".time-option").forEach((option) => option.classList.remove("border-navy", "bg-navy", "text-white"));
        button.classList.add("border-navy", "bg-navy", "text-white");
        timeInput.value = button.dataset.time;
        updateSummary();
        clearError();
      });
    });
  }

  function resetAvailability() {
    availabilitySequence += 1;
    timeInput.value = "";
    showTimesMessage("Selecciona servicio, especialista y fecha.");
  }

  function showTimesMessage(message, isError = false) {
    timeContainer.innerHTML = `<p class="col-span-full rounded-lg border border-dashed ${isError ? "border-red-200 text-red-600" : "border-slate-300 text-slate-400"} p-4 text-center text-xs">${escapeHtml(message)}</p>`;
  }

  function updateSummary() {
    const selectedService = getSelectedService();
    document.querySelector("#summary-service").textContent = selectedService?.nombre || "Sin seleccionar";
    document.querySelector("#summary-dentist").textContent = selectedDentist?.nombreCompleto || "Sin seleccionar";
    document.querySelector("#summary-date").textContent = dateInput.value
      ? new Intl.DateTimeFormat("es-PE", { dateStyle: "long" }).format(new Date(`${dateInput.value}T12:00:00`))
      : "Sin seleccionar";
    document.querySelector("#summary-time").textContent = timeInput.value ? formatTime(timeInput.value) : "Sin seleccionar";
  }

  function getSelectedService() {
    return services.find((item) => String(item.id) === serviceInput.value);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError();
    const phoneDigits = phoneInput.value.replace(/\D/g, "");
    const missing = [];
    if (!serviceInput.value) missing.push("servicio");
    if (!dentistInput.value) missing.push("especialista");
    if (!dateInput.value) missing.push("fecha");
    if (!timeInput.value) missing.push("hora disponible");
    if (phoneDigits.length < 7 || phoneDigits.length > 15) missing.push("teléfono válido");
    if (missing.length) {
      showError({ message: `Revisa: ${formatFieldList(missing)}.` });
      return;
    }

    submitButton.disabled = true;
    submitButton.firstChild.textContent = rebookAppointment ? "Reprogramando... " : "Reservando... ";
    try {
      const response = rebookAppointment
        ? await SmartDentApi.request(`/pacientes/citas/${rebookAppointment.id}/reprogramar`, {
            method: "PUT",
            body: JSON.stringify({ fecha: dateInput.value, horaInicio: timeInput.value })
          })
        : await SmartDentApi.request("/pacientes/citas", {
            method: "POST",
            body: JSON.stringify({
              odontologoId: Number(dentistInput.value),
              servicioId: Number(serviceInput.value),
              fecha: dateInput.value,
              horaInicio: timeInput.value,
              motivo: notesInput.value.trim() || null,
              telefono: phoneInput.value.trim()
            })
          });
      sessionStorage.removeItem("smartdent_rebook_id");
      sessionStorage.setItem("smartdent_booking_result", rebookAppointment ? "reprogramada" : "registrada");
      sessionStorage.setItem("smartdent_booking_id", String(response.id));
      window.location.href = "paciente.html?reserva=exitosa";
    } catch (error) {
      showError(error);
      submitButton.disabled = false;
      submitButton.firstChild.textContent = rebookAppointment ? "Confirmar reprogramación " : "Confirmar Reserva ";
      if (error.status === 401) window.setTimeout(() => window.location.replace("login.html"), 1200);
      if (error.status === 409) refreshAvailability();
    }
  });

  function showError(error) {
    errorBox.textContent = error.message || "No se pudo completar la reserva.";
    errorBox.classList.remove("hidden");
    errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function clearError() {
    errorBox.classList.add("hidden");
    errorBox.textContent = "";
  }

  function disableForm() {
    form.querySelectorAll("button, input, select, textarea").forEach((element) => { element.disabled = true; });
  }

  renderCalendar();
  const requestedService = rebookAppointment?.service || sessionStorage.getItem("smartdent_selected_service");
  sessionStorage.removeItem("smartdent_selected_service");
  if (requestedService) {
    const requested = services.find((item) => item.nombre === requestedService || item.codigo === requestedService);
    if (requested) {
      const category = Object.entries(servicesByCategory).find(([, codes]) => codes.includes(requested.codigo))?.[0];
      if (category) selectCategory(category);
      serviceInput.value = String(requested.id);
      await loadDentistsForSelectedService();
      if (rebookAppointment) await prepareRebooking();
    }
  }

  async function loadDentistsForSelectedService() {
    dentists = await SmartDentApi.request(`/odontologos?servicioId=${serviceInput.value}`, { auth: false });
    renderDentists();
    updateSummary();
  }

  async function prepareRebooking() {
    const dentist = dentists.find((item) => String(item.id) === rebookAppointment.dentistId)
      || dentists.find((item) => item.nombreCompleto === rebookAppointment.dentist);
    if (dentist) selectDentist(dentist.id);
    const originalDate = new Date(`${rebookAppointment.date}T12:00:00`);
    if (originalDate >= minimumDate) {
      dateInput.value = rebookAppointment.date;
      visibleMonth = new Date(originalDate.getFullYear(), originalDate.getMonth(), 1);
      renderCalendar();
      await refreshAvailability();
    }
    phoneInput.value = rebookAppointment.phone || session.phone || "";
    notesInput.value = rebookAppointment.notes || "";
    submitButton.firstChild.textContent = "Confirmar reprogramación ";
    document.querySelectorAll(".category-option").forEach((button) => { button.disabled = true; });
    serviceInput.disabled = true;
    dentistContainer.querySelectorAll(".dentist-option").forEach((button) => { button.disabled = true; });
    updateSummary();
  }
}

function formatLocalDate(value) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function formatTime(value) {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("es-PE", { hour: "numeric", minute: "2-digit", hour12: true })
    .format(new Date(2000, 0, 1, hour, minute));
}

function formatFieldList(fields) {
  return fields.length === 1 ? fields[0] : `${fields.slice(0, -1).join(", ")} y ${fields.at(-1)}`;
}

function escapeHtml(value) {
  const element = document.createElement("span");
  element.textContent = String(value || "");
  return element.innerHTML;
}
