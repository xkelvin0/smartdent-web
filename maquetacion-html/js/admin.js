const adminSession = SmartDentApi.getSession();

const DEFAULT_FIXED_COSTS = { rent: 2500, payroll: 8000, utilities: 600, marketing: 300, other: 400 };

if (!adminSession || adminSession.role !== "ADMIN" || !adminSession.token) {
  window.location.replace("login.html");
} else {
  initializeAdminPanel();
}

async function initializeAdminPanel() {
  const table = document.querySelector("#admin-appointments");
  const empty = document.querySelector("#admin-empty");
  const statusFilter = document.querySelector("#status-filter");
  const dentistFilter = document.querySelector("#admin-dentist-filter");
  const dateFilter = document.querySelector("#admin-date-filter");
  const search = document.querySelector("#admin-search");
  let visibleAppointments = [];
  let adminSummary = null;
  let adminFinance = null;
  let adminFixedCosts = { ...DEFAULT_FIXED_COSTS };
  let contactMessages = [];
  document.querySelector("#sidebar-user").textContent = adminSession.name;
  setupAdminLogout();
  try {
    await Promise.all([
      SmartDentAppointments.listAdmin(),
      SmartDentServices.listAdmin(),
      SmartDentAdminUsers.list(),
      loadAdminSummary(),
      loadFinance(),
      loadFixedCosts(),
      loadMessages()
    ]);
  } catch (error) {
    if (error.status === 401) {
      window.location.replace("login.html");
      return;
    }
    window.alert(error.message);
  }

  const refreshDentistFilter = () => {
    const selected = dentistFilter.value;
    dentistFilter.innerHTML = '<option value="ALL">Todos los odontólogos</option>' + SmartDentAdminUsers.getDentists()
      .filter((doctor) => doctor.active)
      .map((doctor) => `<option value="${escapeAdminHtml(doctor.name)}">${escapeAdminHtml(doctor.name)}</option>`)
      .join("");
    dentistFilter.value = [...dentistFilter.options].some((option) => option.value === selected) ? selected : "ALL";
  };
  refreshDentistFilter();

  function render() {
    const appointments = getAdminAppointments();
    const users = getAdminUsers(appointments);
    renderAdminOverview(appointments, users, adminSummary);
    renderAdminCharts(appointments);
    renderFinance(appointments, adminFinance);
    renderAdminUsers(users, appointments);
    renderAdminServices();
    renderContactMessages(contactMessages);

    const term = search.value.trim().toLowerCase();
    visibleAppointments = appointments.filter((item) => {
      const matchesStatus = statusFilter.value === "ALL" || item.status === statusFilter.value;
      const matchesDoctor = dentistFilter.value === "ALL" || item.dentist === dentistFilter.value;
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
  document.querySelector("#message-search").addEventListener("input", () => renderContactMessages(contactMessages));
  document.querySelector("#message-status-filter").addEventListener("change", () => renderContactMessages(contactMessages));
  document.querySelector("#admin-message-list").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-message-status]");
    if (!button) return;
    button.disabled = true;
    try {
      const updated = await SmartDentContact.updateStatus(button.dataset.messageId, button.dataset.messageStatus);
      contactMessages = contactMessages.map((item) => item.id === updated.id ? updated : item);
      render();
    } catch (error) {
      window.alert(error.message);
      if (error.status === 401) window.location.replace("login.html");
    }
  });
  document.querySelector("#export-appointments").addEventListener("click", () => exportAppointmentsCsv(visibleAppointments));
  table.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const item = getAdminAppointments().find((appointment) => appointment.id === (button.dataset.adminDetails || button.dataset.id));
    if (button.dataset.adminDetails) openAdminAppointment(item);
    if (button.dataset.adminStatus && item) {
      await updateAdminAppointment(item.id, button.dataset.adminStatus);
      render();
    }
  });
  document.querySelector("#admin-appointment-actions").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-admin-modal-status]");
    if (!button) return;
    await updateAdminAppointment(button.dataset.id, button.dataset.adminModalStatus);
    closeAdminModal("#admin-appointment-modal");
    render();
  });
  bindAdminModal("#admin-appointment-modal", "[data-close-admin-appointment]");
  setupDentistActions(render, refreshDentistFilter);
  setupServiceActions(render);
  setupFixedCosts(render, () => adminFixedCosts, (value) => { adminFixedCosts = value; });
  document.querySelectorAll("[data-admin-view]").forEach((button) => button.addEventListener("click", () => document.querySelector(`aside nav a[href="#${button.dataset.adminView}"]`)?.click()));
  document.addEventListener("smartdent:admin-finance-updated", (event) => {
    adminFinance = event.detail;
    render();
  });
  render();

  async function loadAdminSummary() {
    adminSummary = await SmartDentAdminReport.summary();
    return adminSummary;
  }

  async function loadFixedCosts() {
    const response = await SmartDentAdminReport.fixedCosts();
    adminFixedCosts = normalizeFixedCostsResponse(response);
    hydrateFixedCostForm(adminFixedCosts);
    return adminFixedCosts;
  }

  async function loadFinance() {
    adminFinance = await SmartDentAdminReport.finance();
    return adminFinance;
  }

  async function loadMessages() {
    contactMessages = await SmartDentContact.listAdmin();
    return contactMessages;
  }
}

function renderContactMessages(messages) {
  const searchNode = document.querySelector("#message-search");
  const filterNode = document.querySelector("#message-status-filter");
  if (!searchNode || !filterNode) return;
  const term = searchNode.value.trim().toLowerCase();
  const visible = messages.filter((item) => {
    const matchesStatus = filterNode.value === "ALL" || item.estado === filterNode.value;
    const matchesTerm = [item.nombre, item.email, item.asunto, item.mensaje]
      .some((value) => String(value || "").toLowerCase().includes(term));
    return matchesStatus && matchesTerm;
  });
  document.querySelector("#messages-new-count").textContent = messages.filter((item) => item.estado === "NUEVO").length;
  document.querySelector("#messages-total-count").textContent = messages.length;
  document.querySelector("#messages-replied-count").textContent = messages.filter((item) => item.estado === "RESPONDIDO").length;
  const container = document.querySelector("#admin-message-list");
  const empty = document.querySelector("#admin-messages-empty");
  container.innerHTML = visible.map((item) => {
    const tone = item.estado === "NUEVO" ? "bg-amber-50 text-amber-700" : item.estado === "RESPONDIDO" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700";
    const actions = item.estado === "NUEVO"
      ? `<button class="rounded-lg border border-slate-300 px-3 py-2 text-[10px] font-bold text-navy" data-message-id="${item.id}" data-message-status="LEIDO" type="button">Marcar leído</button>`
      : "";
    const replyAction = item.estado !== "RESPONDIDO"
      ? `<button class="rounded-lg bg-navy px-3 py-2 text-[10px] font-bold text-white" data-message-id="${item.id}" data-message-status="RESPONDIDO" type="button">Marcar respondido</button>`
      : "";
    return `<article class="rounded-xl border border-slate-200 p-5"><div class="flex flex-col justify-between gap-3 sm:flex-row"><div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><strong class="text-sm text-navy">${escapeAdminHtml(item.nombre)}</strong><span class="rounded-full px-2.5 py-1 text-[9px] font-bold ${tone}">${escapeAdminHtml(item.estado)}</span></div><a class="mt-1 block text-xs text-blue-700 hover:underline" href="mailto:${escapeAdminHtml(item.email)}">${escapeAdminHtml(item.email)}</a><p class="mt-1 text-[10px] text-slate-400">${formatAdminMessageDate(item.creadoEn)}${item.telefono ? ` · ${escapeAdminHtml(item.telefono)}` : ""}</p></div><div class="flex shrink-0 flex-wrap gap-2">${actions}${replyAction}</div></div><div class="mt-4 rounded-lg bg-slate-50 p-4"><strong class="text-xs text-navy">${escapeAdminHtml(item.asunto)}</strong><p class="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">${escapeAdminHtml(item.mensaje)}</p></div></article>`;
  }).join("");
  empty.classList.toggle("hidden", visible.length > 0);
}

function formatAdminMessageDate(value) {
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
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
  document.querySelector("#service-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const services = window.SmartDentCatalog.get();
    const item = services.find((service) => service.id === document.querySelector("#service-id").value);
    if (!item) return;
    item.price = Math.max(0, Number(price.value));
    item.cost = Math.max(0, Number(cost.value));
    item.duration = Math.max(15, Number(document.querySelector("#service-duration").value));
    item.active = document.querySelector("#service-active").checked;
    const submit = event.currentTarget.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = "Guardando...";
    try {
      await SmartDentServices.update(item);
      closeAdminModal("#service-modal");
      render();
    } catch (error) {
      window.alert(error.message);
    } finally {
      submit.disabled = false;
      submit.textContent = "Guardar cambios";
    }
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

function renderFinance(appointments, finance) {
  if (finance) {
    document.querySelector("#finance-revenue").textContent = adminCurrency(finance.ingresosMesActual);
    document.querySelector("#finance-variable-cost").textContent = adminCurrency(finance.costosVariablesMesActual);
    document.querySelector("#finance-fixed-cost").textContent = adminCurrency(finance.gastosFijosMensuales);
    const profitNode = document.querySelector("#finance-profit");
    profitNode.textContent = adminCurrency(finance.utilidadMesActual);
    profitNode.className = `mt-2 block text-2xl ${Number(finance.utilidadMesActual) >= 0 ? "text-green-700" : "text-red-600"}`;
    document.querySelector("#finance-margin").textContent = `Margen: ${finance.margenMesActual}% · mes actual`;

    const monthly = Array.isArray(finance.mensual) ? finance.mensual : [];
    const chartMaximum = Math.max(1, ...monthly.flatMap((item) => [Number(item.ingresos || 0), Number(item.costos || 0)]));
    document.querySelector("#monthly-finance-chart").innerHTML = monthly.map((item) => `<div class="flex h-full flex-1 flex-col items-center justify-end gap-2"><div class="flex h-[190px] items-end gap-1"><div class="w-4 rounded-t bg-navy" title="Ingresos: ${adminCurrency(item.ingresos)}" style="height:${Math.max(3, Math.round((Number(item.ingresos || 0) / chartMaximum) * 185))}px"></div><div class="w-4 rounded-t bg-gold" title="Costos: ${adminCurrency(item.costos)}" style="height:${Math.max(3, Math.round((Number(item.costos || 0) / chartMaximum) * 185))}px"></div></div><span class="text-[9px] capitalize text-slate-400">${escapeAdminHtml(item.etiqueta)}</span></div>`).join("");

    const demand = Array.isArray(finance.demandaServicios) ? finance.demandaServicios : [];
    const serviceMaximum = Math.max(1, ...demand.map((item) => Number(item.reservas || 0)));
    document.querySelector("#services-demand-chart").innerHTML = demand.length
      ? demand.map((item) => `<div><div class="flex justify-between gap-4 text-xs"><span class="truncate text-slate-600">${escapeAdminHtml(item.servicio)}</span><strong class="text-navy">${item.reservas}</strong></div><div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full bg-gold" style="width:${Math.round((Number(item.reservas || 0) / serviceMaximum) * 100)}%"></div></div></div>`).join("")
      : '<div class="rounded-lg border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">No hay reservas suficientes para generar este gráfico.</div>';
    return;
  }

  const costs = getFixedCosts();
  const fixedTotal = Object.values(costs).reduce((sum, value) => sum + Number(value || 0), 0);
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const completedThisMonth = appointments.filter((item) => item.status === "ATENDIDA" && item.date.startsWith(currentMonth));
  const revenue = completedThisMonth.reduce((sum, item) => sum + adminAppointmentPrice(item), 0);
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
    months.push({ label: new Intl.DateTimeFormat("es-PE", { month: "short" }).format(date).replace(".", ""), revenue: completed.reduce((sum, item) => sum + adminAppointmentPrice(item), 0), costs: fixedTotal + completed.reduce((sum, item) => sum + adminServiceCost(item.service), 0) });
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

function setupFixedCosts(render, getCurrentCosts, setCurrentCosts) {
  hydrateFixedCostForm(getCurrentCosts());
  document.querySelector("#fixed-cost-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const updated = {};
    ["rent", "payroll", "utilities", "marketing", "other"].forEach((key) => { updated[key] = Math.max(0, Number(document.querySelector(`#cost-${key}`).value) || 0); });
    const submit = event.currentTarget.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = "Guardando...";
    try {
      const saved = await SmartDentAdminReport.updateFixedCosts({
        alquiler: updated.rent,
        planilla: updated.payroll,
        servicios: updated.utilities,
        marketing: updated.marketing,
        otros: updated.other
      });
      setCurrentCosts(normalizeFixedCostsResponse(saved));
      hydrateFixedCostForm(getCurrentCosts());
      window.SmartDentAdminReport.finance().then((response) => {
        const eventRefresh = new CustomEvent("smartdent:admin-finance-updated", { detail: response });
        document.dispatchEvent(eventRefresh);
      }).catch(() => {});
    } catch (error) {
      window.alert(error.message);
      if (error.status === 401) window.location.replace("login.html");
      return;
    } finally {
      submit.disabled = false;
      submit.textContent = "Guardar costos";
    }
    const message = document.querySelector("#fixed-cost-message");
    message.classList.remove("hidden");
    window.setTimeout(() => message.classList.add("hidden"), 2500);
    render();
  });
}

function renderAdminOverview(appointments, users, summary) {
  const patients = users.filter((user) => user.role === "PACIENTE");
  const attended = appointments.filter((item) => item.status === "ATENDIDA");
  const active = appointments.filter((item) => !["CANCELADA", "ATENDIDA"].includes(item.status));
  const occupancyBase = Number(summary?.citasActivas ?? active.length);
  const occupancy = Math.min(100, Math.round((occupancyBase / 40) * 100));
  document.querySelector("#appointment-count").textContent = summary?.totalCitas ?? appointments.length;
  document.querySelector("#pending-count").textContent = summary?.citasPendientes ?? appointments.filter((item) => item.status === "PENDIENTE").length;
  document.querySelector("#attended-count").textContent = summary?.citasAtendidas ?? attended.length;
  document.querySelector("#patient-count").textContent = summary?.pacientesRegistrados ?? patients.length;
  document.querySelector("#users-patient-count").textContent = patients.length;
  document.querySelector("#overview-occupancy").textContent = `${occupancy}%`;
  document.querySelector("#overview-occupancy-bar").style.width = `${occupancy}%`;
  const revenue = summary?.ingresoEstimado ?? attended.reduce((total, item) => total + adminAppointmentPrice(item), 0);
  document.querySelector("#estimated-revenue").textContent = adminCurrency(revenue);
  const activeServices = summary?.serviciosActivos ?? window.SmartDentCatalog.get().filter((item) => item.active).length;
  document.querySelector("#overview-active-services").textContent = activeServices;

  const today = adminLocalDate(new Date());
  const todayAppointments = appointments.filter((item) => item.date === today && item.status !== "CANCELADA");
  document.querySelector("#admin-today-label").textContent = new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const todayCount = Number(summary?.citasHoy ?? todayAppointments.length);
  document.querySelector("#admin-today-count").textContent = `${todayCount} ${todayCount === 1 ? "cita" : "citas"}`;
  document.querySelector("#admin-today-list").innerHTML = todayAppointments.length
    ? todayAppointments.slice(0, 5).map((item) => `<div class="flex items-center gap-3 rounded-lg bg-slate-50 p-4"><strong class="w-16 text-xs text-navy">${formatAdminTime(item.time)}</strong><div class="min-w-0 flex-1"><p class="truncate text-xs font-bold text-navy">${escapeAdminHtml(item.patientName)}</p><p class="mt-1 truncate text-[10px] text-slate-500">${escapeAdminHtml(item.service)} · ${escapeAdminHtml(item.dentist)}</p></div><span class="rounded-full px-2 py-1 text-[9px] font-bold ${adminStatusClass(item.status)}">${escapeAdminHtml(item.status)}</span></div>`).join("")
    : '<div class="rounded-lg border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">No hay citas programadas para hoy.</div>';
  const alerts = [
    { icon: "pending_actions", text: `${summary?.citasPendientes ?? appointments.filter((item) => item.status === "PENDIENTE").length} citas pendientes de confirmación`, tone: "bg-amber-50 text-amber-700" },
    { icon: "dentistry", text: `${activeServices} servicios disponibles para reservar`, tone: "bg-green-50 text-green-700" },
    { icon: "event_busy", text: `${summary?.citasCanceladas ?? appointments.filter((item) => item.status === "CANCELADA").length} citas canceladas`, tone: "bg-slate-50 text-slate-600" }
  ];
  document.querySelector("#admin-alerts").innerHTML = alerts.map((item) => `<div class="flex items-center gap-3 rounded-lg p-4 ${item.tone}"><span class="material-symbols-outlined text-lg">${item.icon}</span><span class="text-xs font-semibold">${item.text}</span></div>`).join("");
}

function renderAdminUsers(users, appointments) {
  const term = document.querySelector("#admin-user-search").value.trim().toLowerCase();
  const role = document.querySelector("#admin-role-filter").value;
  const visible = users.filter((user) => (role === "ALL" || user.role === role) && [user.name, user.email, user.dni, user.specialty, user.license].some((value) => String(value || "").toLowerCase().includes(term)));
  document.querySelector("#users-admin-count").textContent = users.filter((user) => user.role === "ADMIN").length;
  document.querySelector("#users-dentist-count").textContent = users.filter((user) => user.role === "ODONTOLOGO" && user.active).length;
  document.querySelector("#users-patient-count").textContent = users.filter((user) => user.role === "PACIENTE").length;
  const table = document.querySelector("#admin-users-table");
  table.innerHTML = visible.map((user) => {
    const activity = user.role === "PACIENTE"
      ? `${appointments.filter((item) => item.patientEmail === user.email).length} citas`
      : user.role === "ODONTOLOGO"
        ? `${appointments.filter((item) => String(item.dentistId) === String(user.dentistId)).length} citas asignadas`
        : "Gestión general";
    const detail = user.role === "ODONTOLOGO" ? `<span class="mt-1 block text-[10px] text-slate-500">${escapeAdminHtml(user.specialty)} · ${escapeAdminHtml(user.license)}</span>` : "";
    const action = user.role === "ODONTOLOGO" ? `<button class="rounded-lg border border-slate-300 px-3 py-2 text-[10px] font-bold text-navy" data-edit-dentist="${user.dentistId}" type="button">Editar</button>` : '<span class="text-[10px] text-slate-400">Solo consulta</span>';
    return `<tr><td class="px-3 py-4"><strong class="text-navy">${escapeAdminHtml(user.name)}</strong><span class="mt-1 block text-[10px] text-slate-500">${escapeAdminHtml(user.email)} · DNI ${escapeAdminHtml(user.dni)}</span></td><td class="px-3 py-4"><span class="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-bold text-slate-600">${adminRoleLabel(user.role)}</span>${detail}</td><td class="px-3 py-4">${escapeAdminHtml(activity)}</td><td class="px-3 py-4"><span class="rounded-full px-3 py-1 text-[9px] font-bold ${user.active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}">${user.active ? "ACTIVO" : "INACTIVO"}</span></td><td class="px-3 py-4 text-right">${action}</td></tr>`;
  }).join("");
  document.querySelector("#admin-users-empty").classList.toggle("hidden", visible.length > 0);
}

function setupDentistActions(render, refreshDentistFilter) {
  const modal = document.querySelector("#dentist-modal");
  const form = document.querySelector("#dentist-form");
  const fields = {
    id: document.querySelector("#dentist-id"),
    code: document.querySelector("#dentist-code"),
    name: document.querySelector("#dentist-name"),
    dni: document.querySelector("#dentist-dni"),
    email: document.querySelector("#dentist-email"),
    password: document.querySelector("#dentist-password"),
    phone: document.querySelector("#dentist-phone"),
    specialty: document.querySelector("#dentist-specialty"),
    license: document.querySelector("#dentist-license"),
    photo: document.querySelector("#dentist-photo"),
    active: document.querySelector("#dentist-active")
  };
  const errorNode = document.querySelector("#dentist-form-error");

  function showForm(dentist = null) {
    const editing = Boolean(dentist);
    form.reset();
    errorNode.classList.add("hidden");
    fields.id.value = dentist?.dentistId || "";
    fields.code.value = dentist?.professionalId || "";
    fields.name.value = dentist?.name || "";
    fields.dni.value = dentist?.dni || "";
    fields.email.value = dentist?.email || "";
    fields.phone.value = dentist?.phone || "";
    fields.specialty.value = dentist?.specialty || "";
    fields.license.value = dentist?.license || "";
    fields.photo.value = dentist?.photo || "";
    fields.active.checked = dentist?.active !== false;
    [fields.code, fields.dni, fields.email].forEach((field) => { field.disabled = editing; });
    fields.password.required = !editing;
    document.querySelector("#dentist-password-field").classList.toggle("hidden", editing);
    document.querySelector("#dentist-active-field").classList.toggle("hidden", !editing);
    document.querySelector("#dentist-active-field").classList.toggle("flex", editing);
    document.querySelector("#dentist-modal-title").textContent = editing ? "Editar odontólogo" : "Nuevo odontólogo";
    document.querySelector("#dentist-submit").textContent = editing ? "Guardar cambios" : "Crear cuenta de odontólogo";
    const selected = new Set((dentist?.serviceIds || []).map(Number));
    document.querySelector("#dentist-service-options").innerHTML = SmartDentCatalog.get().filter((service) => service.active || selected.has(service.backendId)).map((service) => `<label class="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-[10px]"><input class="mt-0.5 h-4 w-4 rounded border-slate-300 text-gold" name="dentist-services" type="checkbox" value="${service.backendId}" ${selected.has(service.backendId) ? "checked" : ""}><span><strong class="block text-navy">${escapeAdminHtml(service.name)}</strong><small class="text-slate-400">${escapeAdminHtml(service.specialty)}</small></span></label>`).join("");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
  }

  document.querySelector("#new-dentist").addEventListener("click", () => showForm());
  document.querySelector("#admin-users-table").addEventListener("click", (event) => {
    const button = event.target.closest("[data-edit-dentist]");
    if (!button) return;
    const dentist = SmartDentAdminUsers.getDentists().find((item) => String(item.dentistId) === button.dataset.editDentist);
    if (dentist) showForm(dentist);
  });
  bindAdminModal("#dentist-modal", "[data-close-dentist-modal]");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorNode.classList.add("hidden");
    const serviceIds = [...form.querySelectorAll('[name="dentist-services"]:checked')].map((input) => Number(input.value));
    if (!serviceIds.length) {
      errorNode.textContent = "Selecciona al menos un servicio que atenderá el odontólogo.";
      errorNode.classList.remove("hidden");
      return;
    }
    const editing = Boolean(fields.id.value);
    const payload = editing
      ? { nombreCompleto: fields.name.value, telefono: fields.phone.value, especialidad: fields.specialty.value, colegiatura: fields.license.value, fotoUrl: fields.photo.value || null, activo: fields.active.checked, servicioIds: serviceIds }
      : { codigo: fields.code.value, nombreCompleto: fields.name.value, dni: fields.dni.value, email: fields.email.value, password: fields.password.value, telefono: fields.phone.value, especialidad: fields.specialty.value, colegiatura: fields.license.value, fotoUrl: fields.photo.value || null, servicioIds: serviceIds };
    const submit = document.querySelector("#dentist-submit");
    submit.disabled = true;
    submit.textContent = editing ? "Guardando..." : "Creando cuenta...";
    try {
      if (editing) await SmartDentAdminUsers.updateDentist(fields.id.value, payload);
      else await SmartDentAdminUsers.createDentist(payload);
      closeAdminModal("#dentist-modal");
      refreshDentistFilter();
      render();
    } catch (error) {
      errorNode.textContent = Object.values(error.fields || {}).join(" ") || error.message;
      errorNode.classList.remove("hidden");
    } finally {
      submit.disabled = false;
      submit.textContent = editing ? "Guardar cambios" : "Crear cuenta de odontólogo";
    }
  });
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

async function updateAdminAppointment(id, status) {
  try {
    await SmartDentAppointments.updateAdminStatus(id, status);
    await SmartDentAppointments.listAdmin();
  } catch (error) {
    window.alert(error.message);
    if (error.status === 401) window.location.replace("login.html");
  }
}
function getAdminAppointments() { return SmartDentAppointments.current().sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)); }
function getAdminUsers() { return SmartDentAdminUsers.getUsers(); }
function getFixedCosts() {
  return {
    ...DEFAULT_FIXED_COSTS,
    ...normalizeFixedCostInputs({
      rent: Number(document.querySelector("#cost-rent")?.value || DEFAULT_FIXED_COSTS.rent),
      payroll: Number(document.querySelector("#cost-payroll")?.value || DEFAULT_FIXED_COSTS.payroll),
      utilities: Number(document.querySelector("#cost-utilities")?.value || DEFAULT_FIXED_COSTS.utilities),
      marketing: Number(document.querySelector("#cost-marketing")?.value || DEFAULT_FIXED_COSTS.marketing),
      other: Number(document.querySelector("#cost-other")?.value || DEFAULT_FIXED_COSTS.other)
    })
  };
}
function openAdminModal(selector) { const modal = document.querySelector(selector); modal.classList.remove("hidden"); modal.classList.add("flex"); document.body.classList.add("overflow-hidden"); }
function closeAdminModal(selector) { const modal = document.querySelector(selector); modal.classList.add("hidden"); modal.classList.remove("flex"); document.body.classList.remove("overflow-hidden"); }
function bindAdminModal(selector, closeSelector) { const modal = document.querySelector(selector); modal.addEventListener("click", (event) => { if (event.target === modal || event.target.closest(closeSelector)) closeAdminModal(selector); }); }
function exportAppointmentsCsv(items) { if (!items.length) return; const rows = [["Código", "Fecha", "Hora", "Paciente", "Correo", "Servicio", "Odontólogo", "Estado"], ...items.map((item) => [item.id, item.date, item.time, item.patientName, item.patientEmail, item.service, item.dentist, item.status])]; const csv = rows.map((row) => row.map((value) => `"${String(value || "").replace(/"/g, '""')}"`).join(",")).join("\n"); const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `agenda-smartdent-${adminLocalDate(new Date())}.csv`; link.click(); URL.revokeObjectURL(url); }
function setupAdminLogout() { document.addEventListener("click", (event) => { if (!event.target.closest("#logout, #mobile-logout")) return; SmartDentApi.clearSession(); window.location.replace("index.html"); }); }
function formatAdminDate(value) { return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)); }
function formatAdminTime(value) { return new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit" }).format(new Date(`2026-01-01T${value}:00`)); }
function adminLocalDate(value) { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`; }
function adminStatusClass(status) { return { PENDIENTE: "bg-amber-50 text-amber-700", CONFIRMADA: "bg-blue-50 text-blue-700", ATENDIDA: "bg-green-50 text-green-700", CANCELADA: "bg-red-50 text-red-700" }[status] || "bg-slate-100 text-slate-600"; }
function adminRoleLabel(role) { return { PACIENTE: "PACIENTE", ODONTOLOGO: "ODONTÓLOGO", ADMIN: "ADMINISTRADOR" }[role] || role; }
function adminAppointmentPrice(appointment) { return Number(appointment.price ?? window.SmartDentCatalog.price(appointment.service)); }
function adminServiceCost(service) { return window.SmartDentCatalog.cost(service); }
function serviceMarginPercent(item) { return Number(item.price) ? ((Number(item.price) - Number(item.cost)) / Number(item.price)) * 100 : 0; }
function adminCurrency(value) { return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 2 }).format(value); }
function escapeAdminHtml(value) { const node = document.createElement("div"); node.textContent = String(value || ""); return node.innerHTML; }
function hydrateFixedCostForm(costs) { Object.entries(costs).forEach(([key, value]) => { document.querySelector(`#cost-${key}`).value = value; }); }
function normalizeFixedCostsResponse(response) { return normalizeFixedCostInputs({ rent: response.alquiler, payroll: response.planilla, utilities: response.servicios, marketing: response.marketing, other: response.otros }); }
function normalizeFixedCostInputs(costs) { return { rent: Number(costs.rent || 0), payroll: Number(costs.payroll || 0), utilities: Number(costs.utilities || 0), marketing: Number(costs.marketing || 0), other: Number(costs.other || 0) }; }
