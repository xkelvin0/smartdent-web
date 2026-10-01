const patientSession = SmartDentApi.getSession();

if (!patientSession || patientSession.role !== "PACIENTE" || !patientSession.token) {
  window.location.replace("login.html");
} else {
  initializePatientDashboard();
}

async function initializePatientDashboard() {
  setupLogout();
  let allAppointments = [];
  let clinicalRecords = [];
  let patientSettings = null;
  try {
    allAppointments = await SmartDentAppointments.listPatient();
  } catch (error) {
    SmartDentAppointments.saveCache([]);
    if (error.status === 401) {
      window.location.replace("login.html");
      return;
    }
    window.alert(error.message);
  }
  try {
    clinicalRecords = await SmartDentClinical.listPatient();
  } catch (error) {
    SmartDentClinical.saveCache([]);
    if (error.status !== 401) window.alert(error.message);
  }
  try {
    patientSettings = await SmartDentPatientSettings.get();
  } catch (error) {
    if (error.status === 401) {
      window.location.replace("login.html");
      return;
    }
    window.alert(error.message);
  }
  const patientAppointments = allAppointments
    .filter((appointment) => appointment.patientEmail === patientSession.email)
    .sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));
  const upcoming = [...patientAppointments]
    .filter((appointment) => ["PENDIENTE", "CONFIRMADA"].includes(appointment.status)
      && new Date(`${appointment.date}T${appointment.time}`) >= new Date())
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

  document.querySelector("#sidebar-user").textContent = patientSession.name;
  document.querySelector("#welcome-title").textContent = `Bienvenido, ${patientSession.name.split(" ")[0]}`;
  document.querySelector("#patient-name").textContent = patientSession.name;
  document.querySelector("#patient-email").textContent = patientSession.email;
  document.querySelector("#patient-avatar").textContent = initials(patientSession.name);
  document.querySelector("#appointment-count").textContent = String(patientAppointments.length);

  const attended = patientAppointments.filter((appointment) => appointment.status === "ATENDIDA").length;
  const pending = patientAppointments.filter((appointment) => appointment.status === "PENDIENTE" || appointment.status === "CONFIRMADA").length;
  document.querySelector("#attended-count").textContent = String(attended);
  document.querySelector("#pending-count").textContent = String(pending);
  renderTreatmentProgress(clinicalRecords, attended);
  renderPatientOverview(patientAppointments, upcoming, clinicalRecords);

  renderNextAppointment(upcoming[0]);
  setupAppointmentManagement(patientAppointments);
  renderClinicalHistory(patientAppointments, clinicalRecords);
  renderBilling(patientAppointments);
  setupPatientSettings(patientAppointments, patientSettings);
  showSuccessModal(patientAppointments);
  document.querySelectorAll("[data-patient-view]").forEach((button) => button.addEventListener("click", () => {
    document.querySelector(`aside nav a[href="#${button.dataset.patientView}"]`)?.click();
  }));
}

function renderTreatmentProgress(clinicalRecords, attended) {
  const records = clinicalRecords
    .filter((record) => record.patientEmail === patientSession.email)
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  const latestRecord = records[0];
  const hasStarted = attended > 0 || Boolean(latestRecord);
  const empty = document.querySelector("#treatment-progress-empty");
  const active = document.querySelector("#treatment-progress-active");
  empty.classList.toggle("hidden", hasStarted);
  active.classList.toggle("hidden", !hasStarted);
  if (!hasStarted) {
    document.querySelector("#treatment-progress-percent").textContent = "0%";
    document.querySelector("#treatment-progress-description").textContent = "Aún no existe un plan de tratamiento activo.";
    return;
  }

  const order = ["CONSULTA", "DIAGNOSTICO", "TRATAMIENTO", "COMPLETADO"];
  let stage = latestRecord?.treatmentStage;
  if (!order.includes(stage)) {
    stage = latestRecord?.treatment ? "TRATAMIENTO" : latestRecord?.diagnosis ? "DIAGNOSTICO" : "CONSULTA";
  }
  const index = order.indexOf(stage);
  const percent = [25, 50, 75, 100][index];
  const descriptions = {
    CONSULTA: "Evaluación inicial realizada. Tu odontólogo preparará el diagnóstico.",
    DIAGNOSTICO: "Diagnóstico registrado y plan de atención definido.",
    TRATAMIENTO: "Tu tratamiento se encuentra actualmente en curso.",
    COMPLETADO: "Tratamiento completado. Continúa con tus controles preventivos."
  };
  document.querySelector("#treatment-progress-percent").textContent = `${percent}%`;
  document.querySelector("#treatment-progress-description").textContent = descriptions[stage];
  document.querySelector("#treatment-progress-bar").style.width = `${percent}%`;
  document.querySelectorAll("[data-treatment-step]").forEach((item, stepIndex) => {
    const completed = stepIndex <= index;
    const current = stepIndex === index;
    item.classList.toggle("border-gold", completed);
    item.classList.toggle("bg-yellow-50", completed);
    item.classList.toggle("text-navy", completed);
    item.classList.toggle("ring-2", current);
    item.classList.toggle("ring-gold-soft", current);
    const icon = item.querySelector(".material-symbols-outlined");
    icon.classList.toggle("text-gold", completed);
  });
}

function renderPatientOverview(appointments, upcoming, clinicalRecords) {
  const records = clinicalRecords.filter((record) => record.patientEmail === patientSession.email);
  const pending = appointments.filter((item) => item.status === "PENDIENTE");
  document.querySelector("#patient-upcoming-count").textContent = String(upcoming.length);
  document.querySelector("#patient-pending-stat").textContent = String(pending.length);
  document.querySelector("#patient-attended-stat").textContent = String(appointments.filter((item) => item.status === "ATENDIDA").length);
  document.querySelector("#patient-cancelled-stat").textContent = String(appointments.filter((item) => item.status === "CANCELADA").length);

  const reminders = [];
  upcoming.slice(0, 2).forEach((item) => {
    const days = daysUntil(item.date);
    reminders.push({ icon: "event_upcoming", title: days === 0 ? "Tu cita es hoy" : days === 1 ? "Tu cita es mañana" : `Cita dentro de ${days} días`, detail: `${item.service} · ${formatDate(item.date)} a las ${formatTime(item.time)}`, tone: "bg-blue-50 text-blue-700" });
  });
  if (pending.length) reminders.push({ icon: "hourglass_top", title: `${pending.length} ${pending.length === 1 ? "cita pendiente" : "citas pendientes"} de confirmación`, detail: "El especialista actualizará el estado desde su panel.", tone: "bg-amber-50 text-amber-700" });
  const todayValue = new Date();
  todayValue.setHours(0, 0, 0, 0);
  const nextControl = records.map((item) => item.nextControl).filter((value) => value && new Date(`${value}T00:00:00`) >= todayValue).sort()[0];
  if (nextControl) reminders.push({ icon: "dentistry", title: "Control odontológico recomendado", detail: `Próximo control: ${formatDate(nextControl)}.`, tone: "bg-green-50 text-green-700" });
  document.querySelector("#patient-reminder-count").textContent = String(reminders.length);
  document.querySelector("#patient-reminders").innerHTML = reminders.length
    ? reminders.map((item) => `<div class="flex gap-3 rounded-lg p-4 ${item.tone}"><span class="material-symbols-outlined text-xl">${item.icon}</span><div><strong class="text-xs">${escapeHtml(item.title)}</strong><p class="mt-1 text-[10px] opacity-80">${escapeHtml(item.detail)}</p></div></div>`).join("")
    : '<div class="rounded-lg border border-dashed border-slate-300 p-7 text-center text-xs text-slate-500">No tienes recordatorios pendientes.</div>';

  const clinicalActivity = records.map((record) => ({
    date: record.updatedAt,
    icon: "clinical_notes",
    title: record.treatment || "Expediente clínico actualizado",
    detail: record.diagnosis || "Tu odontólogo actualizó tu información clínica."
  }));
  const appointmentActivity = appointments.filter((item) => item.status === "ATENDIDA").map((item) => ({
    date: `${item.date}T${item.time}`,
    icon: "task_alt",
    title: item.service,
    detail: `Atención completada con ${item.dentist}.`
  }));
  const activity = [...clinicalActivity, ...appointmentActivity].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
  document.querySelector("#patient-recent-activity").innerHTML = activity.length
    ? activity.map((item) => `<div class="flex gap-4 rounded-lg bg-slate-50 p-4"><span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy text-white"><span class="material-symbols-outlined text-lg">${item.icon}</span></span><div class="min-w-0"><strong class="block truncate text-xs text-navy">${escapeHtml(item.title)}</strong><p class="mt-1 line-clamp-2 text-[10px] text-slate-500">${escapeHtml(item.detail)}</p><time class="mt-2 block text-[9px] font-semibold text-gold">${formatActivityDate(item.date)}</time></div></div>`).join("")
    : '<p class="md:col-span-2 rounded-lg border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">Tu actividad clínica aparecerá después de completar una atención.</p>';
}

function setupAppointmentManagement(appointments) {
  const search = document.querySelector("#patient-appointment-search");
  const filter = document.querySelector("#patient-appointment-filter");
  const render = () => {
    const term = search.value.trim().toLowerCase();
    const now = new Date();
    const visible = appointments.filter((item) => {
      const matchesTerm = [item.service, item.dentist, item.id].some((value) => String(value || "").toLowerCase().includes(term));
      const matchesFilter = filter.value === "ALL"
        || (filter.value === "UPCOMING" && !["ATENDIDA", "CANCELADA"].includes(item.status) && new Date(`${item.date}T${item.time}`) >= now)
        || item.status === filter.value;
      return matchesTerm && matchesFilter;
    });
    document.querySelector("#patient-appointment-count").textContent = `Mostrando ${visible.length} de ${appointments.length} ${appointments.length === 1 ? "cita" : "citas"}`;
    renderAppointmentTable(visible);
  };
  search.addEventListener("input", render);
  filter.addEventListener("change", render);
  document.querySelector("#patient-appointment-actions").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.cancelAppointment) cancelAppointment(button.dataset.cancelAppointment);
    if (button.dataset.rebookAppointment) {
      sessionStorage.setItem("smartdent_rebook_id", button.dataset.rebookAppointment);
      window.location.href = "reservar.html";
    }
  });
  const modal = document.querySelector("#patient-appointment-modal");
  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-close-patient-appointment]")) closeAppointmentModal();
  });
  render();
}

function renderClinicalHistory(appointments, clinicalRecords) {
  const records = clinicalRecords
    .filter((record) => record.patientEmail === patientSession.email)
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  const container = document.querySelector("#clinical-record-list");
  document.querySelector("#clinical-record-count").textContent = `${records.length} ${records.length === 1 ? "registro" : "registros"}`;
  if (!records.length) {
    container.innerHTML = '<div class="rounded-xl border border-dashed border-slate-300 p-10 text-center"><span class="material-symbols-outlined text-5xl text-slate-300">clinical_notes</span><h3 class="mt-3 font-bold text-navy">Aún no tienes registros clínicos</h3><p class="mt-2 text-xs text-slate-500">Aquí aparecerán los diagnósticos e indicaciones después de una atención.</p></div>';
    return;
  }
  container.innerHTML = records.map((record) => {
    const related = [...appointments].reverse().find((item) => (record.dentistId && item.dentistId === record.dentistId) || item.dentistEmail === record.dentistEmail);
    const doctor = related?.dentist || record.dentistEmail || "Odontólogo SmartDent";
    return `<article class="overflow-hidden rounded-xl border border-slate-200"><header class="flex flex-col justify-between gap-3 bg-slate-50 p-5 sm:flex-row sm:items-center"><div><p class="text-[10px] font-bold uppercase tracking-wider text-gold">Atención odontológica</p><h3 class="mt-1 font-bold text-navy">${escapeHtml(record.treatment || "Tratamiento clínico")}</h3><p class="mt-1 text-xs text-slate-500">${escapeHtml(doctor)}</p></div><time class="text-xs font-semibold text-slate-500">Actualizado: ${formatRecordDate(record.updatedAt)}</time></header><dl class="grid gap-5 p-5 md:grid-cols-2"><div><dt class="text-[10px] font-bold uppercase text-slate-400">Diagnóstico</dt><dd class="mt-2 text-sm text-slate-700">${escapeHtml(record.diagnosis || "Sin diagnóstico registrado")}</dd></div><div><dt class="text-[10px] font-bold uppercase text-slate-400">Alergias y antecedentes</dt><dd class="mt-2 text-sm text-slate-700">${escapeHtml(record.allergies || "Sin antecedentes registrados")}</dd></div><div><dt class="text-[10px] font-bold uppercase text-slate-400">Indicaciones y receta</dt><dd class="mt-2 text-sm text-slate-700">${escapeHtml(record.instructions || "Sin indicaciones adicionales")}</dd></div><div><dt class="text-[10px] font-bold uppercase text-slate-400">Próximo control</dt><dd class="mt-2 text-sm text-slate-700">${record.nextControl ? formatDate(record.nextControl) : "Por programar"}</dd></div>${record.notes ? `<div class="md:col-span-2"><dt class="text-[10px] font-bold uppercase text-slate-400">Observaciones</dt><dd class="mt-2 text-sm text-slate-700">${escapeHtml(record.notes)}</dd></div>` : ""}</dl></article>`;
  }).join("");
}

function renderBilling(appointments) {
  const completed = appointments.filter((appointment) => appointment.status === "ATENDIDA");
  const container = document.querySelector("#billing-list");
  document.querySelector("#billing-count").textContent = `${completed.length} ${completed.length === 1 ? "comprobante" : "comprobantes"}`;
  if (!completed.length) {
    container.innerHTML = '<div class="rounded-lg border border-dashed border-slate-300 p-8 text-center"><span class="material-symbols-outlined text-4xl text-slate-300">receipt_long</span><p class="mt-2 text-sm font-semibold text-navy">No tienes comprobantes disponibles</p><p class="mt-2 text-xs text-slate-500">Aparecerán después de completar una atención.</p></div>';
    return;
  }
  container.innerHTML = `<div class="overflow-x-auto"><table class="w-full min-w-[620px] text-left text-xs"><thead class="border-b border-slate-200 text-[9px] uppercase tracking-wider text-slate-400"><tr><th class="px-3 py-3">Comprobante</th><th class="px-3 py-3">Fecha</th><th class="px-3 py-3">Servicio</th><th class="px-3 py-3">Importe</th><th class="px-3 py-3 text-right">Descargar</th></tr></thead><tbody class="divide-y divide-slate-100">${completed.map((item) => `<tr><td class="px-3 py-4 font-bold text-navy">BOL-${escapeHtml(item.id)}</td><td class="px-3 py-4">${formatDate(item.date)}</td><td class="px-3 py-4">${escapeHtml(item.service)}</td><td class="px-3 py-4">S/ ${appointmentPrice(item).toFixed(2)}</td><td class="px-3 py-4 text-right"><button class="receipt-button font-bold text-gold hover:underline" data-id="${escapeHtml(item.id)}" type="button">Descargar</button></td></tr>`).join("")}</tbody></table></div>`;
  container.querySelectorAll(".receipt-button").forEach((button) => button.addEventListener("click", () => downloadReceipt(completed.find((item) => item.id === button.dataset.id))));
}

function setupPatientSettings(appointments, savedSettings) {
  const form = document.querySelector("#patient-settings-form");
  const phone = document.querySelector("#settings-phone");
  const emailReminders = document.querySelector("#settings-email-reminders");
  const phoneReminders = document.querySelector("#settings-phone-reminders");
  const message = document.querySelector("#settings-message");
  phone.value = savedSettings?.phone || appointments.find((item) => item.phone)?.phone || "";
  emailReminders.checked = savedSettings?.emailReminders ?? true;
  phoneReminders.checked = savedSettings?.phoneReminders ?? false;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const digits = phone.value.replace(/\D/g, "");
    if (phone.value && (digits.length < 9 || digits.length > 15)) {
      message.textContent = "Ingresa un teléfono válido de 9 a 15 dígitos.";
      message.className = "mb-3 rounded-lg bg-red-50 p-3 text-xs text-red-700";
      phone.focus();
      return;
    }
    const submit = form.querySelector("button[type='submit']");
    submit.disabled = true;
    try {
      await SmartDentPatientSettings.update({ phone: phone.value.trim(), emailReminders: emailReminders.checked, phoneReminders: phoneReminders.checked });
      message.textContent = "Configuración guardada correctamente en tu cuenta.";
      message.className = "mb-3 rounded-lg bg-green-50 p-3 text-xs text-green-700";
    } catch (error) {
      message.textContent = Object.values(error.fields || {}).join(" ") || error.message;
      message.className = "mb-3 rounded-lg bg-red-50 p-3 text-xs text-red-700";
      if (error.status === 401) window.location.replace("login.html");
    } finally {
      submit.disabled = false;
    }
  });
}

function downloadReceipt(appointment) {
  if (!appointment) return;
  const content = `SMARTDENT - COMPROBANTE DE ATENCIÓN\n\nCódigo: BOL-${appointment.id}\nPaciente: ${patientSession.name}\nServicio: ${appointment.service}\nOdontólogo: ${appointment.dentist}\nFecha: ${formatDate(appointment.date)}\nImporte: S/ ${appointmentPrice(appointment).toFixed(2)}\n`;
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `comprobante-${appointment.id}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function appointmentPrice(appointment) {
  return Number(appointment.price ?? window.SmartDentCatalog?.price(appointment.service) ?? 0);
}

function treatmentSessionLabel(appointment) {
  const total = Number(appointment.totalSessions || 1);
  if (total <= 1) return "Atención individual";
  const remaining = Math.max(0, Number(appointment.remainingSessions ?? total - appointment.sessionNumber));
  return `Sesión ${appointment.sessionNumber} de ${total} · ${remaining} ${remaining === 1 ? "sesión restante" : "sesiones restantes"}`;
}

function renderNextAppointment(appointment) {
  const container = document.querySelector("#next-appointment");
  if (!appointment) {
    container.innerHTML = '<div class="rounded-lg border border-dashed border-slate-300 p-8 text-center"><span class="material-symbols-outlined text-4xl text-slate-300">event_busy</span><p class="mt-2 text-sm font-semibold text-navy">No tienes citas próximas</p><a class="mt-4 inline-flex text-xs font-bold text-gold" href="reservar.html">Agendar una cita →</a></div>';
    return;
  }
  container.innerHTML = `<div class="flex flex-col gap-5 rounded-lg border border-slate-200 p-5 sm:flex-row sm:items-center">
    <div class="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-slate-100 text-center"><span class="block text-[9px] font-bold uppercase text-slate-400">${monthShort(appointment.date)}</span><strong class="block text-xl text-navy">${dayNumber(appointment.date)}</strong></div>
    <div class="flex-1"><h3 class="font-bold text-navy">${escapeHtml(appointment.service)}</h3><p class="mt-1 text-[10px] font-bold text-gold">${treatmentSessionLabel(appointment)}</p><p class="mt-2 text-xs text-slate-500">${formatDate(appointment.date)} · ${formatTime(appointment.time)}</p><p class="mt-1 text-xs text-slate-500">${escapeHtml(appointment.dentist)}</p></div>
    <span class="self-start rounded-full px-3 py-1 text-[9px] font-bold ${statusClass(appointment.status)}">${escapeHtml(appointment.status)}</span>
  </div>`;
}

function renderAppointmentTable(appointments) {
  const tbody = document.querySelector("#appointments-table");
  const empty = document.querySelector("#appointments-empty");
  if (!appointments.length) { tbody.innerHTML = ""; empty.classList.remove("hidden"); empty.querySelector("h3").textContent = "No hay citas en esta vista"; empty.querySelector("p").textContent = "Prueba con otro filtro o agenda una nueva consulta."; return; }
  empty.classList.add("hidden");
  tbody.innerHTML = appointments.map((appointment) => `<tr>
    <td class="px-3 py-4 font-medium text-navy">${formatDate(appointment.date)}</td><td class="px-3 py-4">${escapeHtml(appointment.service)}</td><td class="px-3 py-4 text-slate-600">${escapeHtml(appointment.dentist)}</td><td class="px-3 py-4">${formatTime(appointment.time)}</td><td class="px-3 py-4"><span class="rounded-full px-3 py-1 text-[9px] font-bold ${statusClass(appointment.status)}">${escapeHtml(appointment.status)}</span></td>
    <td class="px-3 py-4 text-right"><button class="detail-button mr-3 font-semibold text-gold hover:underline" data-id="${escapeHtml(appointment.id)}" type="button">Detalle</button>${appointment.status === "PENDIENTE" || appointment.status === "CONFIRMADA" ? `<button class="rebook-button mr-3 font-semibold text-navy hover:text-gold" data-id="${escapeHtml(appointment.id)}" type="button">Reprogramar</button><button class="cancel-button font-semibold text-red-600" data-id="${escapeHtml(appointment.id)}" type="button">Cancelar</button>` : ""}</td></tr>`).join("");
  document.querySelectorAll(".detail-button").forEach((button) => button.addEventListener("click", () => openAppointmentModal(appointments.find((item) => item.id === button.dataset.id))));
  document.querySelectorAll(".cancel-button").forEach((button) => button.addEventListener("click", () => cancelAppointment(button.dataset.id)));
  document.querySelectorAll(".rebook-button").forEach((button) => button.addEventListener("click", () => { sessionStorage.setItem("smartdent_rebook_id", button.dataset.id); window.location.href = "reservar.html"; }));
}

function openAppointmentModal(appointment) {
  if (!appointment) return;
  document.querySelector("#patient-appointment-detail").innerHTML = `<div class="grid gap-4 rounded-xl bg-slate-50 p-5 sm:grid-cols-2"><div><span class="text-[10px] uppercase text-slate-400">Servicio</span><strong class="mt-1 block text-sm text-navy">${escapeHtml(appointment.service)}</strong><small class="mt-1 block font-bold text-gold">${treatmentSessionLabel(appointment)}</small></div><div><span class="text-[10px] uppercase text-slate-400">Especialista</span><strong class="mt-1 block text-sm text-navy">${escapeHtml(appointment.dentist)}</strong></div><div><span class="text-[10px] uppercase text-slate-400">Fecha y hora</span><strong class="mt-1 block text-sm text-navy">${formatDate(appointment.date)} · ${formatTime(appointment.time)}</strong></div><div><span class="text-[10px] uppercase text-slate-400">Importe de esta cita</span><strong class="mt-1 block text-sm text-navy">S/ ${appointmentPrice(appointment).toFixed(2)}</strong></div><div class="sm:col-span-2"><span class="text-[10px] uppercase text-slate-400">Código de reserva</span><strong class="mt-1 block text-xs text-navy">${escapeHtml(appointment.id)}</strong></div><div class="sm:col-span-2"><span class="text-[10px] uppercase text-slate-400">Notas</span><p class="mt-1 text-xs text-slate-600">${escapeHtml(appointment.notes || "Sin notas adicionales")}</p></div></div>`;
  const active = ["PENDIENTE", "CONFIRMADA"].includes(appointment.status);
  document.querySelector("#patient-appointment-actions").innerHTML = `<button class="rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-bold text-navy" data-close-patient-appointment type="button">Cerrar</button>${active ? `<button class="rounded-lg bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700" data-cancel-appointment="${escapeHtml(appointment.id)}" type="button">Cancelar</button><button class="rounded-lg bg-navy px-4 py-2.5 text-xs font-bold text-white" data-rebook-appointment="${escapeHtml(appointment.id)}" type="button">Reprogramar</button>` : ""}`;
  const modal = document.querySelector("#patient-appointment-modal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.classList.add("overflow-hidden");
}

function closeAppointmentModal() {
  const modal = document.querySelector("#patient-appointment-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.classList.remove("overflow-hidden");
}

async function cancelAppointment(id) {
  const target = SmartDentAppointments.current().find((appointment) => appointment.id === id && appointment.patientEmail === patientSession.email);
  if (!target || !window.confirm("¿Deseas cancelar esta cita?")) return;
  try {
    await SmartDentAppointments.cancelPatient(id);
    window.location.reload();
  } catch (error) {
    window.alert(error.message);
    if (error.status === 401) window.location.replace("login.html");
  }
}

function showSuccessModal(appointments) {
  const params = new URLSearchParams(window.location.search);
  if (params.get("reserva") !== "exitosa") return;
  const latest = appointments.find((item) => item.id === sessionStorage.getItem("smartdent_booking_id")) || appointments[0];
  const result = sessionStorage.getItem("smartdent_booking_result");
  if (result === "reprogramada") {
    document.querySelector("#success-title").textContent = "¡Cita reprogramada!";
    document.querySelector("#success-title").nextElementSibling.textContent = "Actualizamos la fecha y hora de tu cita. La reserva volvió al estado pendiente para su confirmación.";
  }
  if (latest) document.querySelector("#success-summary").innerHTML = `<p><strong>Servicio:</strong> ${escapeHtml(latest.service)}</p><p class="mt-2"><strong>Fecha:</strong> ${formatDate(latest.date)} a las ${formatTime(latest.time)}</p><p class="mt-2"><strong>Código:</strong> ${escapeHtml(latest.id)}</p>`;
  const modal = document.querySelector("#success-modal");
  modal.classList.remove("hidden"); modal.classList.add("flex"); document.body.classList.add("overflow-hidden");
  document.querySelector("#close-success").addEventListener("click", () => { modal.classList.add("hidden"); modal.classList.remove("flex"); document.body.classList.remove("overflow-hidden"); sessionStorage.removeItem("smartdent_booking_result"); sessionStorage.removeItem("smartdent_booking_id"); history.replaceState({}, "", "paciente.html#appointments"); document.querySelector('aside nav a[href="#appointments"]')?.click(); });
}

function setupLogout() {
  document.addEventListener("click", (event) => {
    const logoutButton = event.target.closest("#sidebar-logout, #mobile-logout");
    if (!logoutButton) return;
    event.preventDefault();
    SmartDentApi.clearSession();
    sessionStorage.removeItem("smartdent_rebook_id");
    sessionStorage.removeItem("smartdent_booking_id");
    sessionStorage.removeItem("smartdent_booking_result");
    window.location.replace("index.html");
  });
}
function formatRecordDate(value) { if (!value) return "Sin fecha"; return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
function formatActivityDate(value) { if (!value) return "Sin fecha"; return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)); }
function daysUntil(value) { const today = new Date(); today.setHours(0, 0, 0, 0); const target = new Date(`${value}T00:00:00`); return Math.max(0, Math.ceil((target - today) / 86400000)); }
function initials(name) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function formatDate(value) { return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)); }
function monthShort(value) { return new Intl.DateTimeFormat("es-PE", { month: "short" }).format(new Date(`${value}T12:00:00`)).replace(".", ""); }
function dayNumber(value) { return new Date(`${value}T12:00:00`).getDate(); }
function formatTime(value) { const [hour, minute] = value.split(":").map(Number); return new Intl.DateTimeFormat("es-PE", { hour: "numeric", minute: "2-digit" }).format(new Date(2026, 0, 1, hour, minute)); }
function statusClass(status) { return status === "CONFIRMADA" ? "bg-green-50 text-green-700" : status === "ATENDIDA" ? "bg-blue-50 text-blue-700" : status === "CANCELADA" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"; }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]); }
