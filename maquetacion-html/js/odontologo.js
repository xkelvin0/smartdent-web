const doctorSession = readStorage("smartdent_session", null);

if (!doctorSession || doctorSession.role !== "ODONTOLOGO") {
  window.location.replace("index.html");
} else {
  initializeDoctorPanel();
}

function initializeDoctorPanel() {
  const table = document.querySelector("#doctor-appointments");
  const empty = document.querySelector("#doctor-empty");
  const filter = document.querySelector("#status-filter");
  const agendaSearch = document.querySelector("#agenda-search");
  const agendaDate = document.querySelector("#agenda-date");
  const patientSearch = document.querySelector("#doctor-patient-search");
  let agendaPeriod = "WEEK";
  let activeRecordAppointmentId = null;
  agendaDate.value = localDateValue(new Date());
  document.querySelector("#block-date").min = localDateValue(new Date());
  document.querySelector("#sidebar-user").textContent = doctorSession.name;
  document.querySelector("#welcome-title").textContent = `Bienvenido, ${doctorSession.name}`;

  function doctorAppointments() {
    return readStorage("smartdent_appointments", [])
      .filter(appointmentBelongsToDoctor)
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  }

  function render() {
    const appointments = doctorAppointments();
    document.querySelector("#total-count").textContent = appointments.length;
    document.querySelector("#pending-count").textContent = countStatus(appointments, "PENDIENTE");
    document.querySelector("#confirmed-count").textContent = countStatus(appointments, "CONFIRMADA");
    document.querySelector("#attended-count").textContent = countStatus(appointments, "ATENDIDA");
    renderDoctorSummary(appointments);
    const term = agendaSearch.value.trim().toLowerCase();
    const visible = appointments.filter((item) => {
      const matchesStatus = filter.value === "ALL" || item.status === filter.value;
      const matchesTerm = [item.patientName, item.patientEmail, item.service, item.phone]
        .some((value) => String(value || "").toLowerCase().includes(term));
      return matchesStatus && matchesTerm && dateMatchesPeriod(item.date, agendaDate.value, agendaPeriod);
    });
    document.querySelector("#agenda-count").textContent = `${visible.length} ${visible.length === 1 ? "cita" : "citas"}`;
    table.innerHTML = visible.map((item) => `<tr><td class="px-3 py-4"><strong class="block text-navy">${formatDate(item.date)}</strong><span class="text-[10px] text-slate-500">${formatTime(item.time)}</span></td><td class="px-3 py-4"><strong>${escapeHtml(item.patientName)}</strong><span class="mt-1 block text-[10px] text-slate-500">${escapeHtml(item.patientEmail)}</span></td><td class="px-3 py-4">${escapeHtml(item.service)}</td><td class="px-3 py-4">${escapeHtml(item.phone || "Sin teléfono")}</td><td class="px-3 py-4"><span class="rounded-full px-2.5 py-1 text-[9px] font-bold ${statusClass(item.status)}">${item.status}</span></td><td class="px-3 py-4 text-right">${actions(item)}</td></tr>`).join("");
    empty.classList.toggle("hidden", visible.length > 0);
    renderPatients(appointments, patientSearch.value);
    renderBlockedSchedule();
  }

  table.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.details) {
      openAppointmentDetail(doctorAppointments().find((item) => item.id === button.dataset.details));
      return;
    }
    if (button.dataset.record) {
      activeRecordAppointmentId = button.dataset.id || null;
      openPatientRecord(button.dataset.record, doctorAppointments());
      return;
    }
    if (!button.dataset.status) return;
    const appointments = readStorage("smartdent_appointments", []);
    const target = appointments.find((item) => item.id === button.dataset.id && appointmentBelongsToDoctor(item));
    if (!target) return;
    target.status = button.dataset.status;
    localStorage.setItem("smartdent_appointments", JSON.stringify(appointments));
    render();
  });
  filter.addEventListener("change", render);
  agendaSearch.addEventListener("input", render);
  agendaDate.addEventListener("change", render);
  document.querySelectorAll(".agenda-period").forEach((button) => button.addEventListener("click", () => {
    agendaPeriod = button.dataset.period;
    document.querySelectorAll(".agenda-period").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("bg-navy", selected);
      item.classList.toggle("text-white", selected);
    });
    render();
  }));
  patientSearch.addEventListener("input", () => renderPatients(doctorAppointments(), patientSearch.value));
  document.querySelector("#patient-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-patient-record]");
    if (!button) return;
    activeRecordAppointmentId = null;
    openPatientRecord(button.dataset.patientRecord, doctorAppointments());
  });
  document.querySelectorAll("[data-doctor-view]").forEach((button) => button.addEventListener("click", () => {
    document.querySelector(`aside nav a[href="#${button.dataset.doctorView}"]`)?.click();
    if (button.dataset.doctorView === "patients") window.setTimeout(() => patientSearch.focus({ preventScroll: true }), 250);
  }));
  document.querySelector("[data-doctor-action='attend']").addEventListener("click", () => {
    filter.value = "CONFIRMADA";
    render();
    document.querySelector('aside nav a[href="#agenda"]')?.click();
  });
  document.querySelector("#block-time-button").addEventListener("click", () => openModal("#block-time-modal"));
  document.querySelector("#block-time-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const date = document.querySelector("#block-date").value;
    const time = document.querySelector("#block-time").value;
    const reason = document.querySelector("#block-reason").value.trim();
    const blocks = readStorage("smartdent_doctor_blocks", []);
    const duplicate = blocks.some((item) => blockBelongsToDoctor(item) && item.date === date && item.time === time);
    if (!duplicate) {
      blocks.push({ id: `BL-${Date.now()}`, dentistId: doctorSession.professionalId || "", dentistEmail: doctorSession.email, date, time, reason });
      localStorage.setItem("smartdent_doctor_blocks", JSON.stringify(blocks));
    }
    event.target.reset();
    closeModal("#block-time-modal");
    render();
  });
  document.querySelector("#blocked-schedule-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-block]");
    if (!button) return;
    const blocks = readStorage("smartdent_doctor_blocks", []).filter((item) => item.id !== button.dataset.removeBlock);
    localStorage.setItem("smartdent_doctor_blocks", JSON.stringify(blocks));
    render();
  });
  document.querySelector("#clinical-record-form").addEventListener("submit", (event) => {
    event.preventDefault();
    saveClinicalRecord(activeRecordAppointmentId);
    activeRecordAppointmentId = null;
    closeModal("#patient-record-modal");
    render();
  });
  document.querySelector("#appointment-detail-actions").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.detailStatus) {
      updateAppointmentStatus(button.dataset.id, button.dataset.detailStatus);
      closeModal("#appointment-detail-modal");
    }
    if (button.dataset.detailRecord) {
      activeRecordAppointmentId = button.dataset.id;
      closeModal("#appointment-detail-modal");
      openPatientRecord(button.dataset.detailRecord, doctorAppointments());
    }
    render();
  });
  bindModalClose("#appointment-detail-modal", "[data-close-appointment-modal]");
  bindModalClose("#patient-record-modal", "[data-close-record-modal]");
  bindModalClose("#block-time-modal", "[data-close-block-modal]");
  window.addEventListener("storage", (event) => {
    if (event.key === "smartdent_appointments") render();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") render();
  });
  ["#logout", "#mobile-logout"].forEach((selector) => document.querySelector(selector).addEventListener("click", logout));
  render();
}

function renderDoctorSummary(appointments) {
  const now = new Date();
  const today = localDateValue(now);
  const activeAppointments = appointments.filter((item) => !["CANCELADA", "ATENDIDA"].includes(item.status));
  const next = activeAppointments.find((item) => new Date(`${item.date}T${item.time}`) >= now);
  const nextContainer = document.querySelector("#doctor-next-appointment");
  nextContainer.innerHTML = next
    ? `<div class="flex flex-col gap-4 rounded-lg bg-slate-50 p-5 sm:flex-row sm:items-center"><div class="grid h-14 w-14 place-items-center rounded-lg bg-navy text-center text-white"><span><strong class="block text-lg">${new Date(`${next.date}T12:00:00`).getDate()}</strong><small class="text-[9px] uppercase">${new Intl.DateTimeFormat("es-PE", { month: "short" }).format(new Date(`${next.date}T12:00:00`)).replace(".", "")}</small></span></div><div class="flex-1"><strong class="text-sm text-navy">${escapeHtml(next.patientName)}</strong><p class="mt-1 text-xs text-slate-500">${escapeHtml(next.service)}</p><p class="mt-1 text-[10px] text-slate-400">${formatDate(next.date)} · ${formatTime(next.time)}</p></div><span class="rounded-full px-3 py-1 text-[9px] font-bold ${statusClass(next.status)}">${escapeHtml(next.status)}</span></div>`
    : '<div class="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">No tienes citas próximas.</div>';

  const todayAppointments = appointments.filter((item) => item.date === today && item.status !== "CANCELADA");
  document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long" }).format(now);
  document.querySelector("#today-count").textContent = `${todayAppointments.length} ${todayAppointments.length === 1 ? "cita" : "citas"}`;
  document.querySelector("#doctor-today-list").innerHTML = todayAppointments.length
    ? todayAppointments.map((item) => `<div class="flex items-center gap-4 rounded-lg border border-slate-200 p-4"><strong class="w-16 text-xs text-navy">${formatTime(item.time)}</strong><div class="flex-1"><p class="text-xs font-bold text-navy">${escapeHtml(item.patientName)}</p><p class="mt-1 text-[10px] text-slate-500">${escapeHtml(item.service)}</p></div><span class="rounded-full px-2 py-1 text-[9px] font-bold ${statusClass(item.status)}">${escapeHtml(item.status)}</span></div>`).join("")
    : '<div class="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">No hay atenciones programadas para hoy.</div>';

  const pending = countStatus(appointments, "PENDIENTE");
  const confirmedToday = todayAppointments.filter((item) => item.status === "CONFIRMADA").length;
  const alerts = [
    { icon: "pending_actions", label: `${pending} ${pending === 1 ? "cita pendiente" : "citas pendientes"} de confirmar`, tone: pending ? "text-amber-700 bg-amber-50" : "text-slate-500 bg-slate-50" },
    { icon: "event_available", label: `${confirmedToday} ${confirmedToday === 1 ? "atención confirmada" : "atenciones confirmadas"} para hoy`, tone: confirmedToday ? "text-blue-700 bg-blue-50" : "text-slate-500 bg-slate-50" }
  ];
  document.querySelector("#doctor-alerts").innerHTML = alerts.map((alert) => `<div class="flex items-center gap-3 rounded-lg p-3 ${alert.tone}"><span class="material-symbols-outlined text-lg">${alert.icon}</span><span class="text-xs font-semibold">${alert.label}</span></div>`).join("");

  renderWeeklyPerformance(appointments, now);
  renderRecentPatients(appointments);
}

function renderWeeklyPerformance(appointments, now) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  const weekly = appointments.filter((item) => { const date = new Date(`${item.date}T${item.time}`); return date >= start && date <= end; });
  const values = { attended: countStatus(weekly, "ATENDIDA"), confirmed: countStatus(weekly, "CONFIRMADA"), cancelled: countStatus(weekly, "CANCELADA") };
  document.querySelector("#week-range").textContent = `${formatDate(localDateValue(start))} – ${formatDate(localDateValue(end))}`;
  const maximum = Math.max(1, weekly.length);
  Object.entries(values).forEach(([key, value]) => {
    document.querySelector(`#week-${key}`).textContent = value;
    document.querySelector(`#week-${key}-bar`).style.width = `${Math.round((value / maximum) * 100)}%`;
  });
}

function renderRecentPatients(appointments) {
  const recent = [];
  const seenEmails = new Set();
  [...appointments].reverse().forEach((item) => {
    if (!seenEmails.has(item.patientEmail) && recent.length < 4) {
      seenEmails.add(item.patientEmail);
      recent.push(item);
    }
  });
  document.querySelector("#doctor-recent-patients").innerHTML = recent.length
    ? recent.map((item) => `<div class="flex items-center gap-3 rounded-lg bg-slate-50 p-3"><span class="grid h-9 w-9 place-items-center rounded-full bg-navy text-[10px] font-bold text-white">${initials(item.patientName)}</span><div class="min-w-0 flex-1"><p class="truncate text-xs font-bold text-navy">${escapeHtml(item.patientName)}</p><p class="mt-1 truncate text-[9px] text-slate-500">${escapeHtml(item.service)} · ${formatDate(item.date)}</p></div></div>`).join("")
    : '<p class="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">Aún no hay pacientes recientes.</p>';
}

function appointmentBelongsToDoctor(appointment) {
  const idsByEmail = {
    "carlos.mendoza@smartdent.com": "DOC-CARLOS-MENDOZA",
    "elena.ruiz@smartdent.com": "DOC-ELENA-RUIZ",
    "miguel.silva@smartdent.com": "DOC-MIGUEL-SILVA",
    "lucia.torres@smartdent.com": "DOC-LUCIA-TORRES"
  };
  const sessionEmail = String(doctorSession.email || "").toLowerCase();
  const professionalId = doctorSession.professionalId || idsByEmail[sessionEmail];
  return Boolean(
    (appointment.dentistId && professionalId && appointment.dentistId === professionalId)
    || (appointment.dentistEmail && appointment.dentistEmail.toLowerCase() === sessionEmail)
    || normalizeDoctorName(appointment.dentist) === normalizeDoctorName(doctorSession.name)
  );
}

function normalizeDoctorName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(dra?|doctor|doctora)\.?\b/gi, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

function renderPatients(appointments, query = "") {
  const term = query.trim().toLowerCase();
  const patients = [...new Set(appointments.map((item) => item.patientEmail))]
    .map((email) => {
      const visits = appointments.filter((item) => item.patientEmail === email);
      const latest = visits.at(-1);
      const attended = visits.filter((item) => item.status === "ATENDIDA");
      const upcoming = visits.find((item) => !["ATENDIDA", "CANCELADA"].includes(item.status) && new Date(`${item.date}T${item.time}`) >= new Date());
      return { ...latest, visits, attended, upcoming, lastVisit: attended.at(-1) };
    })
    .filter((item) => [item.patientName, item.patientEmail, item.phone].some((value) => String(value || "").toLowerCase().includes(term)));
  document.querySelector("#patient-list").innerHTML = patients.length
    ? patients.map((item) => `<article class="rounded-xl border border-slate-200 p-5 transition hover:border-gold hover:shadow-sm"><div class="flex items-start gap-3"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-white">${initials(item.patientName)}</span><div class="min-w-0 flex-1"><strong class="block truncate text-xs text-navy">${escapeHtml(item.patientName)}</strong><span class="mt-1 block truncate text-[10px] text-slate-500">${escapeHtml(item.patientEmail)}</span><span class="mt-1 block text-[10px] text-slate-500">${escapeHtml(item.phone || "Sin teléfono")}</span></div></div><dl class="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-3 text-[10px]"><div><dt class="text-slate-400">Atenciones</dt><dd class="mt-1 font-bold text-navy">${item.attended.length}</dd></div><div><dt class="text-slate-400">Última visita</dt><dd class="mt-1 font-bold text-navy">${item.lastVisit ? formatDate(item.lastVisit.date) : "Sin registro"}</dd></div><div class="col-span-2"><dt class="text-slate-400">Próxima cita</dt><dd class="mt-1 font-bold text-navy">${item.upcoming ? `${formatDate(item.upcoming.date)} · ${formatTime(item.upcoming.time)}` : "Sin cita próxima"}</dd></div></dl><button class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-[10px] font-bold text-navy hover:bg-gold-soft" data-patient-record="${escapeHtml(item.patientEmail)}" type="button"><span class="material-symbols-outlined text-base">clinical_notes</span>Ver expediente</button></article>`).join("")
    : `<p class="text-xs text-slate-500">${term ? "No se encontraron pacientes con esa búsqueda." : "Aún no tienes pacientes asignados."}</p>`;
}

function actions(item) {
  const details = `<button class="rounded-md border border-slate-300 px-3 py-2 text-[10px] font-bold text-navy" data-details="${item.id}" type="button">Detalle</button>`;
  const cancel = `<button class="rounded-md bg-red-50 px-3 py-2 text-[10px] font-bold text-red-700" data-id="${item.id}" data-status="CANCELADA" type="button">Cancelar</button>`;
  if (item.status === "PENDIENTE") return `<div class="flex justify-end gap-2">${details}${cancel}<button class="rounded-md bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700" data-id="${item.id}" data-status="CONFIRMADA" type="button">Confirmar</button></div>`;
  if (item.status === "CONFIRMADA") return `<div class="flex justify-end gap-2">${details}${cancel}<button class="rounded-md bg-green-50 px-3 py-2 text-[10px] font-bold text-green-700" data-id="${item.id}" data-record="${escapeHtml(item.patientEmail)}" type="button">Registrar atención</button></div>`;
  return `<div class="flex justify-end">${details}</div>`;
}

function dateMatchesPeriod(dateValue, selectedValue, period) {
  if (!selectedValue) return true;
  const date = new Date(`${dateValue}T12:00:00`);
  const selected = new Date(`${selectedValue}T12:00:00`);
  if (period === "DAY") return dateValue === selectedValue;
  if (period === "MONTH") return date.getFullYear() === selected.getFullYear() && date.getMonth() === selected.getMonth();
  const start = new Date(selected);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return date >= start && date <= end;
}

function openAppointmentDetail(item) {
  if (!item) return;
  document.querySelector("#appointment-detail-content").innerHTML = `<div class="grid gap-4 rounded-xl bg-slate-50 p-5 sm:grid-cols-2"><div><span class="text-[10px] uppercase text-slate-400">Paciente</span><strong class="mt-1 block text-sm text-navy">${escapeHtml(item.patientName)}</strong><span class="text-xs text-slate-500">${escapeHtml(item.patientEmail)}</span></div><div><span class="text-[10px] uppercase text-slate-400">Contacto</span><strong class="mt-1 block text-sm text-navy">${escapeHtml(item.phone || "Sin teléfono")}</strong></div><div><span class="text-[10px] uppercase text-slate-400">Fecha y hora</span><strong class="mt-1 block text-sm text-navy">${formatDate(item.date)} · ${formatTime(item.time)}</strong></div><div><span class="text-[10px] uppercase text-slate-400">Tratamiento</span><strong class="mt-1 block text-sm text-navy">${escapeHtml(item.service)}</strong></div><div class="sm:col-span-2"><span class="text-[10px] uppercase text-slate-400">Motivo o notas</span><p class="mt-1 text-xs text-slate-600">${escapeHtml(item.notes || "Sin notas adicionales")}</p></div></div>`;
  const buttons = [`<button class="rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-bold text-navy" data-close-appointment-modal type="button">Cerrar</button>`];
  if (item.status === "PENDIENTE") buttons.push(`<button class="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white" data-id="${item.id}" data-detail-status="CONFIRMADA" type="button">Confirmar cita</button>`);
  if (item.status === "CONFIRMADA") buttons.push(`<button class="rounded-lg bg-green-700 px-4 py-2.5 text-xs font-bold text-white" data-id="${item.id}" data-detail-record="${escapeHtml(item.patientEmail)}" type="button">Registrar atención</button>`);
  if (["PENDIENTE", "CONFIRMADA"].includes(item.status)) buttons.splice(1, 0, `<button class="rounded-lg bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700" data-id="${item.id}" data-detail-status="CANCELADA" type="button">Cancelar cita</button>`);
  document.querySelector("#appointment-detail-actions").innerHTML = buttons.join("");
  openModal("#appointment-detail-modal");
}

function openPatientRecord(email, appointments) {
  const visits = appointments.filter((item) => item.patientEmail === email);
  const patient = visits.at(-1);
  if (!patient) return;
  const record = readStorage("smartdent_clinical_records", []).find((item) => item.patientEmail === email && recordBelongsToDoctor(item));
  document.querySelector("#patient-record-profile").innerHTML = `<div class="flex flex-col gap-4 rounded-xl bg-slate-50 p-5 sm:flex-row sm:items-center"><span class="grid h-14 w-14 place-items-center rounded-full bg-navy font-bold text-white">${initials(patient.patientName)}</span><div class="flex-1"><strong class="text-base text-navy">${escapeHtml(patient.patientName)}</strong><p class="mt-1 text-xs text-slate-500">${escapeHtml(email)} · ${escapeHtml(patient.phone || "Sin teléfono")}</p></div><span class="rounded-full bg-gold-soft px-3 py-1 text-[10px] font-bold text-navy">${visits.length} ${visits.length === 1 ? "cita" : "citas"}</span></div>`;
  document.querySelector("#patient-record-history").innerHTML = `<h3 class="text-xs font-bold text-navy">Historial de citas</h3><div class="mt-3 max-h-44 space-y-2 overflow-y-auto">${[...visits].reverse().map((item) => `<div class="grid grid-cols-[1fr_auto] gap-3 rounded-lg border border-slate-200 p-3 text-xs"><div><strong class="text-navy">${escapeHtml(item.service)}</strong><p class="mt-1 text-[10px] text-slate-500">${formatDate(item.date)} · ${formatTime(item.time)}</p></div><span class="self-center rounded-full px-2 py-1 text-[9px] font-bold ${statusClass(item.status)}">${escapeHtml(item.status)}</span></div>`).join("")}</div>`;
  document.querySelector("#record-patient-email").value = email;
  ["allergies", "diagnosis", "treatment", "instructions", "next-control", "notes"].forEach((field) => {
    const key = field.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    document.querySelector(`#record-${field}`).value = record?.[key] || "";
  });
  document.querySelector("#record-stage").value = record?.treatmentStage || (record?.treatment ? "TRATAMIENTO" : record?.diagnosis ? "DIAGNOSTICO" : "CONSULTA");
  setRecordMessage("");
  openModal("#patient-record-modal");
}

function saveClinicalRecord(appointmentId) {
  const email = document.querySelector("#record-patient-email").value;
  const records = readStorage("smartdent_clinical_records", []);
  const index = records.findIndex((item) => item.patientEmail === email && recordBelongsToDoctor(item));
  const record = {
    id: index >= 0 ? records[index].id : `HC-${Date.now()}`,
    patientEmail: email,
    dentistId: doctorSession.professionalId || "",
    dentistEmail: doctorSession.email,
    treatmentStage: document.querySelector("#record-stage").value,
    allergies: document.querySelector("#record-allergies").value.trim(),
    diagnosis: document.querySelector("#record-diagnosis").value.trim(),
    treatment: document.querySelector("#record-treatment").value.trim(),
    instructions: document.querySelector("#record-instructions").value.trim(),
    nextControl: document.querySelector("#record-next-control").value,
    notes: document.querySelector("#record-notes").value.trim(),
    updatedAt: new Date().toISOString()
  };
  if (index >= 0) records[index] = record; else records.push(record);
  localStorage.setItem("smartdent_clinical_records", JSON.stringify(records));
  if (appointmentId) updateAppointmentStatus(appointmentId, "ATENDIDA");
  setRecordMessage(appointmentId ? "Atención guardada y cita marcada como atendida." : "Expediente clínico actualizado correctamente.");
}

function renderBlockedSchedule() {
  const blocks = readStorage("smartdent_doctor_blocks", []).filter(blockBelongsToDoctor).sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  const section = document.querySelector("#blocked-schedule");
  section.classList.toggle("hidden", blocks.length === 0);
  document.querySelector("#blocked-schedule-list").innerHTML = blocks.map((item) => `<span class="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-[10px] text-red-700"><strong>${formatDate(item.date)} · ${formatTime(item.time)}</strong>${escapeHtml(item.reason)}<button class="grid h-5 w-5 place-items-center rounded-full hover:bg-red-100" data-remove-block="${item.id}" type="button" aria-label="Eliminar bloqueo">×</button></span>`).join("");
}

function blockBelongsToDoctor(item) { return recordBelongsToDoctor(item); }
function recordBelongsToDoctor(item) { return (item.dentistId && item.dentistId === doctorSession.professionalId) || String(item.dentistEmail || "").toLowerCase() === String(doctorSession.email || "").toLowerCase(); }
function updateAppointmentStatus(id, status) { const items = readStorage("smartdent_appointments", []); const item = items.find((entry) => entry.id === id && appointmentBelongsToDoctor(entry)); if (item) { item.status = status; localStorage.setItem("smartdent_appointments", JSON.stringify(items)); } }
function openModal(selector) { const modal = document.querySelector(selector); modal.classList.remove("hidden"); modal.classList.add("flex"); document.body.classList.add("overflow-hidden"); }
function closeModal(selector) { const modal = document.querySelector(selector); modal.classList.add("hidden"); modal.classList.remove("flex"); document.body.classList.remove("overflow-hidden"); }
function bindModalClose(modalSelector, closeSelector) { const modal = document.querySelector(modalSelector); modal.addEventListener("click", (event) => { if (event.target === modal || event.target.closest(closeSelector)) closeModal(modalSelector); }); }
function setRecordMessage(message) { const node = document.querySelector("#record-message"); node.textContent = message; node.classList.toggle("hidden", !message); node.className = `${message ? "mb-3 rounded-lg bg-green-50 p-3 text-xs text-green-700" : "hidden"}`; }

function readStorage(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
function countStatus(items, status) { return items.filter((item) => item.status === status).length; }
function formatDate(value) { return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)); }
function formatTime(value) { return new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit" }).format(new Date(`2026-01-01T${value}:00`)); }
function localDateValue(value) { const year = value.getFullYear(); const month = String(value.getMonth() + 1).padStart(2, "0"); const day = String(value.getDate()).padStart(2, "0"); return `${year}-${month}-${day}`; }
function statusClass(status) { return { PENDIENTE: "bg-amber-50 text-amber-700", CONFIRMADA: "bg-blue-50 text-blue-700", ATENDIDA: "bg-green-50 text-green-700", CANCELADA: "bg-red-50 text-red-700" }[status] || "bg-slate-100 text-slate-600"; }
function initials(name) { return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function escapeHtml(value) { const node = document.createElement("div"); node.textContent = String(value || ""); return node.innerHTML; }
function logout() { localStorage.removeItem("smartdent_session"); window.location.replace("index.html"); }
