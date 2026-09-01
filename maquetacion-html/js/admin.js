const adminSession = readAdminStorage("smartdent_session", null);

const ADMIN_DEMO_USERS = [
  { name: "Juan Pérez", email: "paciente@gmail.com", role: "PACIENTE" },
  { name: "Dr. Carlos Mendoza", email: "carlos.mendoza@smartdent.com", role: "ODONTOLOGO", professionalId: "DOC-CARLOS-MENDOZA" },
  { name: "Dra. Elena Ruiz", email: "elena.ruiz@smartdent.com", role: "ODONTOLOGO", professionalId: "DOC-ELENA-RUIZ" },
  { name: "Dr. Miguel Silva", email: "miguel.silva@smartdent.com", role: "ODONTOLOGO", professionalId: "DOC-MIGUEL-SILVA" },
  { name: "Dra. Lucía Torres", email: "lucia.torres@smartdent.com", role: "ODONTOLOGO", professionalId: "DOC-LUCIA-TORRES" },
  { name: "Administrador SmartDent", email: "admin@smartdent.com", role: "ADMIN" }
];

const DEFAULT_FIXED_COSTS = { rent: 2500, payroll: 8000, utilities: 600, marketing: 300, other: 400 };

if (!adminSession || adminSession.role !== "ADMIN") {
  window.location.replace("index.html");
} else {
  initializeAdminPanel();
}

function initializeAdminPanel() {
  const table = document.querySelector("#admin-appointments");
  const empty = document.querySelector("#admin-empty");
  const statusFilter = document.querySelector("#status-filter");
  const dentistFilter = document.querySelector("#admin-dentist-filter");
  const dateFilter = document.querySelector("#admin-date-filter");
  const search = document.querySelector("#admin-search");
  let visibleAppointments = [];
  document.querySelector("#sidebar-user").textContent = adminSession.name;
  setupAdminLogout();

  ADMIN_DEMO_USERS.filter((user) => user.role === "ODONTOLOGO").forEach((doctor) => {
    dentistFilter.insertAdjacentHTML("beforeend", `<option value="${escapeAdminHtml(doctor.email)}">${escapeAdminHtml(doctor.name)}</option>`);
  });

  function render() {
    const appointments = getAdminAppointments();
    const users = getAdminUsers(appointments);
    renderAdminOverview(appointments, users);
    renderAdminCharts(appointments);
    renderFinance(appointments);
    renderAdminUsers(users, appointments);
    renderAdminServices();

    const term = search.value.trim().toLowerCase();
    visibleAppointments = appointments.filter((item) => {
      const matchesStatus = statusFilter.value === "ALL" || item.status === statusFilter.value;
      const matchesDoctor = dentistFilter.value === "ALL" || item.dentistEmail === dentistFilter.value;
      const matchesDate = !dateFilter.value || item.date === dateFilter.value;
      const matchesTerm = [item.patientName, item.patientEmail, item.service, item.dentist, item.id].some((value) => String(value || "").toLowerCase().includes(term));
      return matchesStatus && matchesDoctor && matchesDate && matchesTerm;
    });
    document.querySelector("#admin-agenda-count").textContent = `Mostrando ${visibleAppointments.length} de ${appointments.length} ${appointments.length === 1 ? "cita" : "citas"}`;
    table.innerHTML = visibleAppointments.map((item) => `<tr><td class="px-3 py-4"><strong class="block text-navy">${formatAdminDate(item.date)}</strong><span class="text-[10px] text-slate-500">${formatAdminTime(item.time)}</span></td><td class="px-3 py-4"><strong>${escapeAdminHtml(item.patientName)}</strong><span class="mt-1 block text-[10px] text-slate-500">${escapeAdminHtml(item.patientEmail)}</span></td><td class="px-3 py-4">${escapeAdminHtml(item.service)}</td><td class="px-3 py-4">${escapeAdminHtml(item.dentist)}</td><td class="px-3 py-4"><span class="rounded-full px-2.5 py-1 text-[9px] font-bold ${adminStatusClass(item.status)}">${escapeAdminHtml(item.status)}</span></td><td class="px-3 py-4 text-right">${adminAppointmentActions(item)}</td></tr>`).join("");
    empty.classList.toggle("hidden", visibleAppointments.length > 0);
  }

  [statusFilter, dentistFilter, dateFilter].forEach((field) => field.addEventListener("change", render));
  search.addEventListener("input", render);
  document.querySelector("#admin-user-search").addEventListener("input", render);
  document.querySelector("#admin-role-filter").addEventListener("change", render);
  document.querySelector("#admin-service-search").addEventListener("input", renderAdminServices);
  document.querySelector("#export-appointments").addEventListener("click", () => exportAppointmentsCsv(visibleAppointments));
  table.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const item = getAdminAppointments().find((appointment) => appointment.id === (button.dataset.adminDetails || button.dataset.id));
    if (button.dataset.adminDetails) openAdminAppointment(item);
    if (button.dataset.adminStatus && item) {
      updateAdminAppointment(item.id, button.dataset.adminStatus);
      render();
    }
  });
  document.querySelector("#admin-appointment-actions").addEventListener("click", (event) => {
    const button = event.target.closest("[data-admin-modal-status]");
    if (!button) return;
    updateAdminAppointment(button.dataset.id, button.dataset.adminModalStatus);
    closeAdminModal("#admin-appointment-modal");
    render();
  });
  bindAdminModal("#admin-appointment-modal", "[data-close-admin-appointment]");
  setupServiceActions(render);
  setupFixedCosts(render);
  document.querySelectorAll("[data-admin-view]").forEach((button) => button.addEventListener("click", () => document.querySelector(`aside nav a[href="#${button.dataset.adminView}"]`)?.click()));
  window.addEventListener("storage", (event) => { if (["smartdent_appointments", "smartdent_users", "smartdent_fixed_costs", "smartdent_service_catalog"].includes(event.key)) render(); });
  render();
}

function renderAdminServices() {
  const services = window.SmartDentCatalog.get();
  const term = document.querySelector("#admin-service-search").value.trim().toLowerCase();
  const visible = services.filter((item) => [item.name, item.specialty].some((value) => String(value || "").toLowerCase().includes(term)));
  const active = services.filter((item) => item.active);
  const averagePrice = active.length ? active.reduce((sum, item) => sum + Number(item.price), 0) / active.length : 0;
  const averageMargin = active.length ? active.reduce((sum, item) => sum + serviceMarginPercent(item), 0) / active.length : 0;
  document.querySelector("#active-service-count").textContent = active.length;
  document.querySelector("#average-service-price").textContent = adminCurrency(averagePrice);
  document.querySelector("#average-service-margin").textContent = `${Math.round(averageMargin)}%`;
  document.querySelector("#admin-services-table").innerHTML = visible.map((item) => {
    const margin = Number(item.price) - Number(item.cost);
    const percent = serviceMarginPercent(item);
    return `<tr><td class="px-3 py-4 font-bold text-navy">${escapeAdminHtml(item.name)}</td><td class="px-3 py-4">${escapeAdminHtml(item.specialty)}</td><td class="px-3 py-4 font-semibold">${adminCurrency(item.price)}</td><td class="px-3 py-4">${adminCurrency(item.cost)}</td><td class="px-3 py-4"><strong class="${margin >= 0 ? "text-green-700" : "text-red-600"}">${adminCurrency(margin)}</strong><span class="ml-1 text-[9px] text-slate-400">(${Math.round(percent)}%)</span></td><td class="px-3 py-4">${Number(item.duration)} min</td><td class="px-3 py-4"><span class="rounded-full px-3 py-1 text-[9px] font-bold ${item.active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}">${item.active ? "ACTIVO" : "INACTIVO"}</span></td><td class="px-3 py-4 text-right"><button class="rounded-lg border border-slate-300 px-3 py-2 text-[10px] font-bold text-navy" data-edit-service="${item.id}" type="button">Editar</button></td></tr>`;
  }).join("");
}

function setupServiceActions(render) {
  const table = document.querySelector("#admin-services-table");
  const price = document.querySelector("#service-price");
  const cost = document.querySelector("#service-cost");
  const updatePreview = () => {
    const margin = Number(price.value || 0) - Number(cost.value || 0);
    const percent = Number(price.value) ? (margin / Number(price.value)) * 100 : 0;
    document.querySelector("#service-margin-preview").textContent = `${adminCurrency(margin)} (${Math.round(percent)}%)`;
  };
  table.addEventListener("click", (event) => {
    const button = event.target.closest("[data-edit-service]");
    if (!button) return;
    const item = window.SmartDentCatalog.get().find((service) => service.id === button.dataset.editService);
    if (!item) return;
    document.querySelector("#service-id").value = item.id;
    document.querySelector("#service-edit-name").textContent = item.name;
    document.querySelector("#service-edit-specialty").textContent = item.specialty;
    price.value = item.price;
    cost.value = item.cost;
    document.querySelector("#service-duration").value = item.duration;
    document.querySelector("#service-active").checked = item.active;
    updatePreview();
    openAdminModal("#service-modal");
  });
  [price, cost].forEach((input) => input.addEventListener("input", updatePreview));
  bindAdminModal("#service-modal", "[data-close-service-modal]");
  document.querySelector("#service-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const services = window.SmartDentCatalog.get();
    const item = services.find((service) => service.id === document.querySelector("#service-id").value);
    if (!item) return;
    item.price = Math.max(0, Number(price.value));
    item.cost = Math.max(0, Number(cost.value));
    item.duration = Math.max(15, Number(document.querySelector("#service-duration").value));
    item.active = document.querySelector("#service-active").checked;
    window.SmartDentCatalog.save(services);
    closeAdminModal("#service-modal");
    render();
  });
}

function renderAdminCharts(appointments) {
  const statuses = [
    { key: "PENDIENTE", label: "Pendientes", color: "#d97706" },
    { key: "CONFIRMADA", label: "Confirmadas", color: "#2563eb" },
    { key: "ATENDIDA", label: "Atendidas", color: "#15803d" },
    { key: "CANCELADA", label: "Canceladas", color: "#dc2626" }
  ].map((item) => ({ ...item, count: appointments.filter((appointment) => appointment.status === item.key).length }));
  const total = statuses.reduce((sum, item) => sum + item.count, 0);
  let cursor = 0;
  const segments = statuses.map((item) => {
    const start = cursor;
    cursor += total ? (item.count / total) * 100 : 0;
    return `${item.color} ${start}% ${cursor}%`;
  });
  document.querySelector("#status-donut").style.background = total ? `conic-gradient(${segments.join(",")})` : "#e2e8f0";
  document.querySelector("#status-donut-total").textContent = total;
  document.querySelector("#status-chart-legend").innerHTML = statuses.map((item) => `<div class="rounded-lg bg-slate-50 p-3"><span class="flex items-center gap-2 text-[10px] text-slate-500"><i class="h-2.5 w-2.5 rounded-full" style="background:${item.color}"></i>${item.label}</span><strong class="mt-1 block text-lg text-navy">${item.count}</strong></div>`).join("");

  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    const value = adminLocalDate(date);
    days.push({ date: value, label: new Intl.DateTimeFormat("es-PE", { weekday: "short" }).format(date).replace(".", ""), count: appointments.filter((item) => item.date === value && item.status !== "CANCELADA").length });
  }
  const maximum = Math.max(1, ...days.map((item) => item.count));
  document.querySelector("#weekly-appointments-chart").innerHTML = days.map((item) => `<div class="flex h-full flex-1 flex-col items-center justify-end gap-2"><span class="text-[9px] font-bold text-navy">${item.count}</span><div class="w-full max-w-12 rounded-t bg-navy transition-all" style="height:${item.count ? Math.max(12, Math.round((item.count / maximum) * 145)) : 4}px"></div><span class="text-[9px] capitalize text-slate-400">${item.label}</span></div>`).join("");
}

function renderFinance(appointments) {
  const costs = getFixedCosts();
  const fixedTotal = Object.values(costs).reduce((sum, value) => sum + Number(value || 0), 0);
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const completedThisMonth = appointments.filter((item) => item.status === "ATENDIDA" && item.date.startsWith(currentMonth));
  const revenue = completedThisMonth.reduce((sum, item) => sum + adminServicePrice(item.service), 0);
  const variableCost = completedThisMonth.reduce((sum, item) => sum + adminServiceCost(item.service), 0);
  const profit = revenue - variableCost - fixedTotal;
  const margin = revenue ? Math.round((profit / revenue) * 100) : 0;
  document.querySelector("#finance-revenue").textContent = adminCurrency(revenue);
  document.querySelector("#finance-variable-cost").textContent = adminCurrency(variableCost);
  document.querySelector("#finance-fixed-cost").textContent = adminCurrency(fixedTotal);
  const profitNode = document.querySelector("#finance-profit");
  profitNode.textContent = adminCurrency(profit);
  profitNode.className = `mt-2 block text-2xl ${profit >= 0 ? "text-green-700" : "text-red-600"}`;
  document.querySelector("#finance-margin").textContent = `Margen: ${margin}% · mes actual`;

  const months = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const completed = appointments.filter((item) => item.status === "ATENDIDA" && item.date.startsWith(key));
    months.push({ label: new Intl.DateTimeFormat("es-PE", { month: "short" }).format(date).replace(".", ""), revenue: completed.reduce((sum, item) => sum + adminServicePrice(item.service), 0), costs: fixedTotal + completed.reduce((sum, item) => sum + adminServiceCost(item.service), 0) });
  }
  const chartMaximum = Math.max(1, ...months.flatMap((item) => [item.revenue, item.costs]));
  document.querySelector("#monthly-finance-chart").innerHTML = months.map((item) => `<div class="flex h-full flex-1 flex-col items-center justify-end gap-2"><div class="flex h-[190px] items-end gap-1"><div class="w-4 rounded-t bg-navy" title="Ingresos: ${adminCurrency(item.revenue)}" style="height:${Math.max(3, Math.round((item.revenue / chartMaximum) * 185))}px"></div><div class="w-4 rounded-t bg-gold" title="Costos: ${adminCurrency(item.costs)}" style="height:${Math.max(3, Math.round((item.costs / chartMaximum) * 185))}px"></div></div><span class="text-[9px] capitalize text-slate-400">${item.label}</span></div>`).join("");

  const activeAppointments = appointments.filter((item) => item.status !== "CANCELADA");
  const serviceCounts = Object.entries(activeAppointments.reduce((result, item) => { result[item.service] = (result[item.service] || 0) + 1; return result; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const serviceMaximum = Math.max(1, ...serviceCounts.map(([, count]) => count));
  document.querySelector("#services-demand-chart").innerHTML = serviceCounts.length
    ? serviceCounts.map(([service, count]) => `<div><div class="flex justify-between gap-4 text-xs"><span class="truncate text-slate-600">${escapeAdminHtml(service)}</span><strong class="text-navy">${count}</strong></div><div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full bg-gold" style="width:${Math.round((count / serviceMaximum) * 100)}%"></div></div></div>`).join("")
    : '<div class="rounded-lg border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">No hay reservas suficientes para generar este gráfico.</div>';
}

function setupFixedCosts(render) {
  const costs = getFixedCosts();
  Object.entries(costs).forEach(([key, value]) => { document.querySelector(`#cost-${key}`).value = value; });
  document.querySelector("#fixed-cost-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const updated = {};
    ["rent", "payroll", "utilities", "marketing", "other"].forEach((key) => { updated[key] = Math.max(0, Number(document.querySelector(`#cost-${key}`).value) || 0); });
    localStorage.setItem("smartdent_fixed_costs", JSON.stringify(updated));
    const message = document.querySelector("#fixed-cost-message");
    message.classList.remove("hidden");
    window.setTimeout(() => message.classList.add("hidden"), 2500);
    render();
  });
}

function renderAdminOverview(appointments, users) {
  const patients = users.filter((user) => user.role === "PACIENTE");
  const attended = appointments.filter((item) => item.status === "ATENDIDA");
  const active = appointments.filter((item) => !["CANCELADA", "ATENDIDA"].includes(item.status));
  const occupancy = Math.min(100, Math.round((active.length / 40) * 100));
  document.querySelector("#appointment-count").textContent = appointments.length;
  document.querySelector("#pending-count").textContent = appointments.filter((item) => item.status === "PENDIENTE").length;
  document.querySelector("#attended-count").textContent = attended.length;
  document.querySelector("#patient-count").textContent = patients.length;
  document.querySelector("#users-patient-count").textContent = patients.length;
  document.querySelector("#overview-occupancy").textContent = `${occupancy}%`;
  document.querySelector("#overview-occupancy-bar").style.width = `${occupancy}%`;
  document.querySelector("#estimated-revenue").textContent = `S/ ${attended.reduce((total, item) => total + adminServicePrice(item.service), 0).toFixed(2)}`;
  const activeServices = window.SmartDentCatalog.get().filter((item) => item.active).length;
  document.querySelector("#overview-active-services").textContent = activeServices;

  const today = adminLocalDate(new Date());
  const todayAppointments = appointments.filter((item) => item.date === today && item.status !== "CANCELADA");
  document.querySelector("#admin-today-label").textContent = new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  document.querySelector("#admin-today-count").textContent = `${todayAppointments.length} ${todayAppointments.length === 1 ? "cita" : "citas"}`;
  document.querySelector("#admin-today-list").innerHTML = todayAppointments.length
    ? todayAppointments.slice(0, 5).map((item) => `<div class="flex items-center gap-3 rounded-lg bg-slate-50 p-4"><strong class="w-16 text-xs text-navy">${formatAdminTime(item.time)}</strong><div class="min-w-0 flex-1"><p class="truncate text-xs font-bold text-navy">${escapeAdminHtml(item.patientName)}</p><p class="mt-1 truncate text-[10px] text-slate-500">${escapeAdminHtml(item.service)} · ${escapeAdminHtml(item.dentist)}</p></div><span class="rounded-full px-2 py-1 text-[9px] font-bold ${adminStatusClass(item.status)}">${escapeAdminHtml(item.status)}</span></div>`).join("")
    : '<div class="rounded-lg border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">No hay citas programadas para hoy.</div>';
  const alerts = [
    { icon: "pending_actions", text: `${appointments.filter((item) => item.status === "PENDIENTE").length} citas pendientes de confirmación`, tone: "bg-amber-50 text-amber-700" },
    { icon: "dentistry", text: `${activeServices} servicios disponibles para reservar`, tone: "bg-green-50 text-green-700" },
    { icon: "event_busy", text: `${appointments.filter((item) => item.status === "CANCELADA").length} citas canceladas`, tone: "bg-slate-50 text-slate-600" }
  ];
  document.querySelector("#admin-alerts").innerHTML = alerts.map((item) => `<div class="flex items-center gap-3 rounded-lg p-4 ${item.tone}"><span class="material-symbols-outlined text-lg">${item.icon}</span><span class="text-xs font-semibold">${item.text}</span></div>`).join("");
}

function renderAdminUsers(users, appointments) {
  const term = document.querySelector("#admin-user-search").value.trim().toLowerCase();
  const role = document.querySelector("#admin-role-filter").value;
  const visible = users.filter((user) => (role === "ALL" || user.role === role) && [user.name, user.email].some((value) => String(value || "").toLowerCase().includes(term)));
  const table = document.querySelector("#admin-users-table");
  table.innerHTML = visible.map((user) => {
    const activity = user.role === "PACIENTE"
      ? `${appointments.filter((item) => item.patientEmail === user.email).length} citas`
      : user.role === "ODONTOLOGO"
        ? `${appointments.filter((item) => item.dentistEmail === user.email).length} citas asignadas`
        : "Gestión general";
    return `<tr><td class="px-3 py-4"><strong class="text-navy">${escapeAdminHtml(user.name)}</strong><span class="mt-1 block text-[10px] text-slate-500">${escapeAdminHtml(user.email)}</span></td><td class="px-3 py-4"><span class="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-bold text-slate-600">${adminRoleLabel(user.role)}</span></td><td class="px-3 py-4">${escapeAdminHtml(activity)}</td><td class="px-3 py-4"><span class="rounded-full bg-green-50 px-3 py-1 text-[9px] font-bold text-green-700">ACTIVO</span></td></tr>`;
  }).join("");
  document.querySelector("#admin-users-empty").classList.toggle("hidden", visible.length > 0);
}

function openAdminAppointment(item) {
  if (!item) return;
  document.querySelector("#admin-appointment-detail").innerHTML = `<div class="grid gap-4 rounded-xl bg-slate-50 p-5 sm:grid-cols-2"><div><span class="text-[10px] uppercase text-slate-400">Paciente</span><strong class="mt-1 block text-sm text-navy">${escapeAdminHtml(item.patientName)}</strong><span class="text-xs text-slate-500">${escapeAdminHtml(item.patientEmail)}</span></div><div><span class="text-[10px] uppercase text-slate-400">Odontólogo</span><strong class="mt-1 block text-sm text-navy">${escapeAdminHtml(item.dentist)}</strong></div><div><span class="text-[10px] uppercase text-slate-400">Fecha y hora</span><strong class="mt-1 block text-sm text-navy">${formatAdminDate(item.date)} · ${formatAdminTime(item.time)}</strong></div><div><span class="text-[10px] uppercase text-slate-400">Servicio</span><strong class="mt-1 block text-sm text-navy">${escapeAdminHtml(item.service)}</strong></div><div class="sm:col-span-2"><span class="text-[10px] uppercase text-slate-400">Contacto y notas</span><p class="mt-1 text-xs text-slate-600">${escapeAdminHtml(item.phone || "Sin teléfono")} · ${escapeAdminHtml(item.notes || "Sin notas")}</p></div></div>`;
  const active = ["PENDIENTE", "CONFIRMADA"].includes(item.status);
  document.querySelector("#admin-appointment-actions").innerHTML = `<button class="rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-bold text-navy" data-close-admin-appointment type="button">Cerrar</button>${active ? `<button class="rounded-lg bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700" data-id="${item.id}" data-admin-modal-status="CANCELADA" type="button">Cancelar cita</button>` : ""}${item.status === "PENDIENTE" ? `<button class="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white" data-id="${item.id}" data-admin-modal-status="CONFIRMADA" type="button">Confirmar cita</button>` : ""}`;
  openAdminModal("#admin-appointment-modal");
}

function adminAppointmentActions(item) {
  const detail = `<button class="rounded-md border border-slate-300 px-3 py-2 text-[10px] font-bold text-navy" data-admin-details="${item.id}" type="button">Detalle</button>`;
  if (item.status === "PENDIENTE") return `${detail}<button class="ml-2 rounded-md bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700" data-id="${item.id}" data-admin-status="CONFIRMADA" type="button">Confirmar</button>`;
  return detail;
}

function updateAdminAppointment(id, status) { const items = getAdminAppointments(); const item = items.find((entry) => entry.id === id); if (item) { item.status = status; localStorage.setItem("smartdent_appointments", JSON.stringify(items)); } }
function getAdminAppointments() { return readAdminStorage("smartdent_appointments", []).sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)); }
function getAdminUsers(appointments) { const registered = readAdminStorage("smartdent_users", []).map(({ password, ...user }) => user); const appointmentPatients = appointments.map((item) => ({ name: item.patientName, email: item.patientEmail, role: "PACIENTE" })); return [...new Map([...ADMIN_DEMO_USERS, ...registered, ...appointmentPatients].map((user) => [user.email, user])).values()]; }
function getFixedCosts() { return { ...DEFAULT_FIXED_COSTS, ...readAdminStorage("smartdent_fixed_costs", {}) }; }
function openAdminModal(selector) { const modal = document.querySelector(selector); modal.classList.remove("hidden"); modal.classList.add("flex"); document.body.classList.add("overflow-hidden"); }
function closeAdminModal(selector) { const modal = document.querySelector(selector); modal.classList.add("hidden"); modal.classList.remove("flex"); document.body.classList.remove("overflow-hidden"); }
function bindAdminModal(selector, closeSelector) { const modal = document.querySelector(selector); modal.addEventListener("click", (event) => { if (event.target === modal || event.target.closest(closeSelector)) closeAdminModal(selector); }); }
function exportAppointmentsCsv(items) { if (!items.length) return; const rows = [["Código", "Fecha", "Hora", "Paciente", "Correo", "Servicio", "Odontólogo", "Estado"], ...items.map((item) => [item.id, item.date, item.time, item.patientName, item.patientEmail, item.service, item.dentist, item.status])]; const csv = rows.map((row) => row.map((value) => `"${String(value || "").replace(/"/g, '""')}"`).join(",")).join("\n"); const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `agenda-smartdent-${adminLocalDate(new Date())}.csv`; link.click(); URL.revokeObjectURL(url); }
function setupAdminLogout() { document.addEventListener("click", (event) => { if (!event.target.closest("#logout, #mobile-logout")) return; localStorage.removeItem("smartdent_session"); window.location.replace("index.html"); }); }
function readAdminStorage(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
function formatAdminDate(value) { return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)); }
function formatAdminTime(value) { return new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit" }).format(new Date(`2026-01-01T${value}:00`)); }
function adminLocalDate(value) { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`; }
function adminStatusClass(status) { return { PENDIENTE: "bg-amber-50 text-amber-700", CONFIRMADA: "bg-blue-50 text-blue-700", ATENDIDA: "bg-green-50 text-green-700", CANCELADA: "bg-red-50 text-red-700" }[status] || "bg-slate-100 text-slate-600"; }
function adminRoleLabel(role) { return { PACIENTE: "PACIENTE", ODONTOLOGO: "ODONTÓLOGO", ADMIN: "ADMINISTRADOR" }[role] || role; }
function adminServicePrice(service) { return window.SmartDentCatalog.price(service); }
function adminServiceCost(service) { return window.SmartDentCatalog.cost(service); }
function serviceMarginPercent(item) { return Number(item.price) ? ((Number(item.price) - Number(item.cost)) / Number(item.price)) * 100 : 0; }
function adminCurrency(value) { return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 2 }).format(value); }
function escapeAdminHtml(value) { const node = document.createElement("div"); node.textContent = String(value || ""); return node.innerHTML; }
