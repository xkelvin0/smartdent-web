(function () {
  "use strict";

  const STORAGE_KEYS = {
    patient: "pacienteActual",
    appointments: "smartdentAppointments",
    flash: "smartdentFlashMessage"
  };

  const DEFAULT_PATIENT = {
    id: "alex-mercer",
    nombre: "Alex Mercer",
    tipo: "Paciente Premium",
    ultimaVisita: "15 Oct 2023",
    odontologo: "Dra. Elena Silva",
    estadoCuenta: "Al dia"
  };

  const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

  const TREATMENTS = {
    ortodoncia: {
      label: "Ortodoncia",
      values: [20, 45, 60, 0, 0],
      total: 60
    },
    limpieza: {
      label: "Limpieza",
      values: [35, 70, 100, 0, 0],
      total: 100
    },
    implantes: {
      label: "Implantes",
      values: [10, 25, 40, 0, 0],
      total: 40
    }
  };

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

  function readJSON(key, fallback) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (error) {
      console.warn("No se pudo leer localStorage:", key, error);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function getCurrentPatient() {
    const existingPatient = readJSON(STORAGE_KEYS.patient, null);
    if (existingPatient && existingPatient.nombre) {
      return {
        ...DEFAULT_PATIENT,
        ...existingPatient,
        id: existingPatient.id || slugify(existingPatient.nombre)
      };
    }

    const authKeys = ["usuarioActual", "usuarioLogueado", "currentUser", "smartdentUser"];
    for (const key of authKeys) {
      const user = readJSON(key, null);
      const name = user && (user.nombre || user.name || user.fullName);
      if (name) {
        const patient = {
          ...DEFAULT_PATIENT,
          id: user.id || slugify(name),
          nombre: name,
          tipo: user.tipo || user.rol || DEFAULT_PATIENT.tipo
        };
        writeJSON(STORAGE_KEYS.patient, patient);
        return patient;
      }
    }

    writeJSON(STORAGE_KEYS.patient, DEFAULT_PATIENT);
    return DEFAULT_PATIENT;
  }

  function defaultAppointments(patientId) {
    return [
      {
        id: "default-upcoming-001",
        patientId,
        fecha: "2026-11-12",
        hora: "10:00 AM - 11:00 AM",
        doctor: "Dra. Elena Silva",
        tratamiento: "Limpieza Profunda y Revision",
        motivo: "Control preventivo",
        estado: "Programada",
        createdAt: "2026-08-29T10:00:00.000Z"
      },
      {
        id: "default-history-001",
        patientId,
        fecha: "2023-10-15",
        hora: "09:00 AM",
        doctor: "Dr. Carlos Mendoza",
        tratamiento: "Blanqueamiento Dental",
        motivo: "Tratamiento estetico",
        estado: "Completado",
        createdAt: "2023-10-15T09:00:00.000Z"
      },
      {
        id: "default-history-002",
        patientId,
        fecha: "2023-08-02",
        hora: "11:00 AM",
        doctor: "Dra. Elena Silva",
        tratamiento: "Radiografia Panoramica",
        motivo: "Revision diagnostica",
        estado: "Completado",
        createdAt: "2023-08-02T11:00:00.000Z"
      },
      {
        id: "default-history-003",
        patientId,
        fecha: "2023-05-10",
        hora: "10:00 AM",
        doctor: "Dra. Elena Silva",
        tratamiento: "Consulta General",
        motivo: "Consulta general",
        estado: "Completado",
        createdAt: "2023-05-10T10:00:00.000Z"
      }
    ];
  }

  function getAppointments(patientId) {
    const storedAppointments = readJSON(STORAGE_KEYS.appointments, null);
    if (Array.isArray(storedAppointments)) {
      return storedAppointments;
    }

    const seeded = defaultAppointments(patientId);
    writeJSON(STORAGE_KEYS.appointments, seeded);
    return seeded;
  }

  function saveAppointments(appointments) {
    writeJSON(STORAGE_KEYS.appointments, appointments);
  }

  function toDate(dateValue) {
    return new Date(`${dateValue}T00:00:00`);
  }

  function todayISO() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDate(dateValue) {
    const date = toDate(dateValue);
    if (Number.isNaN(date.getTime())) {
      return dateValue || "";
    }
    return `${String(date.getDate()).padStart(2, "0")} ${MONTHS[date.getMonth()].slice(0, 1)}${MONTHS[date.getMonth()].slice(1).toLowerCase()} ${date.getFullYear()}`;
  }

  function getFirstName(fullName) {
    return String(fullName || "").trim().split(/\s+/)[0] || "Paciente";
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function statusClass(status) {
    const normalized = String(status || "").toLowerCase();
    if (normalized.includes("cancel")) {
      return "status-badge status-badge--cancelled";
    }
    if (normalized.includes("program")) {
      return "status-badge status-badge--scheduled";
    }
    return "status-badge";
  }

  function showToast(message) {
    const toast = $("#patientToast");
    if (!toast || !message) {
      return;
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 3200);
  }

  function consumeFlashMessage() {
    const message = sessionStorage.getItem(STORAGE_KEYS.flash);
    if (message) {
      sessionStorage.removeItem(STORAGE_KEYS.flash);
      showToast(message);
    }
  }

  function renderPatient(patient) {
    const welcomeName = $("#patientWelcomeName");
    const profileName = $("#patientProfileName");
    const profileType = $("#patientProfileType");
    const lastVisitDate = $("#lastVisitDate");
    const mainDentist = $("#mainDentist");
    const accountStatus = $("#accountStatus");
    const bookingPatientName = $("#bookingPatientName");

    if (welcomeName) welcomeName.textContent = getFirstName(patient.nombre);
    if (profileName) profileName.textContent = patient.nombre;
    if (profileType) profileType.textContent = patient.tipo;
    if (lastVisitDate) lastVisitDate.textContent = patient.ultimaVisita;
    if (mainDentist) mainDentist.textContent = patient.odontologo;
    if (accountStatus) accountStatus.textContent = patient.estadoCuenta;
    if (bookingPatientName) bookingPatientName.textContent = patient.nombre;
  }

  function isUpcoming(appointment) {
    return appointment.estado === "Programada" && appointment.fecha >= todayISO();
  }

  function renderUpcomingAppointments(patientId) {
    const container = $("#upcomingAppointments");
    if (!container) {
      return;
    }

    const appointments = getAppointments(patientId)
      .filter((appointment) => appointment.patientId === patientId && isUpcoming(appointment))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    if (appointments.length === 0) {
      container.innerHTML = '<div class="empty-state">No tienes citas proximas registradas.</div>';
      return;
    }

    container.innerHTML = appointments.map((appointment) => {
      const date = toDate(appointment.fecha);
      const month = Number.isNaN(date.getTime()) ? "" : MONTHS[date.getMonth()];
      const day = Number.isNaN(date.getTime()) ? "" : String(date.getDate()).padStart(2, "0");

      return `
        <article class="appointment-card">
          <div class="appointment-date" aria-label="${escapeHTML(formatDate(appointment.fecha))}">
            <span class="appointment-date__month">${escapeHTML(month)}</span>
            <span class="appointment-date__day">${escapeHTML(day)}</span>
          </div>
          <div>
            <h3 class="appointment-card__title">${escapeHTML(appointment.tratamiento)}</h3>
            <div class="appointment-card__meta">
              <span>
                <svg class="meta-icon"><use href="#icon-clock"></use></svg>
                ${escapeHTML(appointment.hora)}
              </span>
              <span>
                <svg class="meta-icon"><use href="#icon-user"></use></svg>
                ${escapeHTML(appointment.doctor)}
              </span>
            </div>
          </div>
          <div class="appointment-card__actions">
            <a class="patient-button patient-button--small" href="reservar.html?reprogramar=${encodeURIComponent(appointment.id)}">Reprogramar</a>
            <button class="patient-button patient-button--small patient-button--danger" type="button" data-cancel-appointment="${escapeHTML(appointment.id)}">Cancelar</button>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderHistory(patientId) {
    const tableBody = $("#historyTableBody");
    if (!tableBody) {
      return;
    }

    const rows = getAppointments(patientId)
      .filter((appointment) => appointment.patientId === patientId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));

    tableBody.innerHTML = rows.map((appointment) => `
      <tr>
        <td data-label="Fecha">${escapeHTML(formatDate(appointment.fecha))}</td>
        <td data-label="Hora">${escapeHTML(appointment.hora)}</td>
        <td data-label="Tratamiento">${escapeHTML(appointment.tratamiento)}</td>
        <td data-label="Especialista">${escapeHTML(appointment.doctor)}</td>
        <td data-label="Estado"><span class="${statusClass(appointment.estado)}">${escapeHTML(appointment.estado)}</span></td>
      </tr>
    `).join("");
  }

  function renderTreatmentChart(treatmentKey) {
    const treatment = TREATMENTS[treatmentKey] || TREATMENTS.ortodoncia;
    const chart = $("#treatmentChart");
    const summary = $("#treatmentSummary");

    if (chart) {
      chart.innerHTML = treatment.values.map((value, index) => `
        <div class="chart-bar" aria-label="Mes ${index + 1}: ${value}%">
          <div class="chart-bar__fill" style="height: ${Math.max(value, 2)}%"></div>
        </div>
      `).join("");
    }

    if (summary) {
      summary.innerHTML = `
        <svg class="meta-icon"><use href="#icon-info"></use></svg>
        Tratamiento actual: <strong>${escapeHTML(treatment.label)}</strong>. Progreso total: <strong>${treatment.total}%</strong>.
      `;
    }
  }

  function setupTreatmentTabs() {
    const tabs = $$("[data-treatment-tab]");
    if (!tabs.length) {
      return;
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((item) => {
          item.classList.remove("is-active");
          item.setAttribute("aria-selected", "false");
        });
        tab.classList.add("is-active");
        tab.setAttribute("aria-selected", "true");
        renderTreatmentChart(tab.dataset.treatmentTab);
      });
    });

    renderTreatmentChart("ortodoncia");
  }

  function setupPatientPanels() {
    const menuItems = $$('[data-panel-target]');
    const panels = $$('.patient-panel');

    if (!menuItems.length || !panels.length) {
      return;
    }

    const activatePanel = (targetId) => {
      panels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.id === targetId);
      });

      menuItems.forEach((item) => {
        const isActive = item.dataset.panelTarget === targetId;
        item.classList.toggle("is-active", isActive);
        if (isActive) {
          item.setAttribute("aria-current", "page");
        } else {
          item.removeAttribute("aria-current");
        }
      });
    };

    menuItems.forEach((item) => {
      item.addEventListener("click", (event) => {
        event.preventDefault();
        const targetId = item.dataset.panelTarget;
        if (!targetId) {
          return;
        }
        activatePanel(targetId);
      });
    });

    if (!location.hash) {
      activatePanel("panel-home");
    }
  }

  function cancelAppointment(appointmentId, patientId) {
    const appointments = getAppointments(patientId).map((appointment) => {
      if (appointment.id === appointmentId && appointment.patientId === patientId) {
        return { ...appointment, estado: "Cancelada" };
      }
      return appointment;
    });
    saveAppointments(appointments);
    renderUpcomingAppointments(patientId);
    renderHistory(patientId);
    showToast("Cita cancelada correctamente");
  }

  function setupAppointmentActions(patientId) {
    const list = $("#upcomingAppointments");
    if (!list) {
      return;
    }

    list.addEventListener("click", (event) => {
      const cancelButton = event.target.closest("[data-cancel-appointment]");
      if (!cancelButton) {
        return;
      }
      cancelAppointment(cancelButton.dataset.cancelAppointment, patientId);
    });
  }

  function setError(fieldId, message) {
    const field = $(`#${fieldId}`);
    const error = $(`#${fieldId}Error`);
    if (field) {
      field.setAttribute("aria-invalid", message ? "true" : "false");
    }
    if (error) {
      error.textContent = message || "";
    }
  }

  function showFormMessage(message, type = "success") {
    const formMessage = $("#formMessage");
    if (!formMessage) {
      return;
    }

    formMessage.textContent = message;
    formMessage.classList.toggle("form-alert--error", type === "error");
    formMessage.classList.add("is-visible");
  }

  function clearFormErrors() {
    ["treatment", "doctor", "appointmentDate", "appointmentTime", "reason"].forEach((fieldId) => {
      setError(fieldId, "");
    });
  }

  function validateAppointmentForm(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const errors = {};
    const minDate = todayISO();

    if (!data.tratamiento) {
      errors.treatment = "Selecciona un tratamiento.";
    }
    if (!data.doctor) {
      errors.doctor = "Selecciona un odontologo.";
    }
    if (!data.fecha) {
      errors.appointmentDate = "Selecciona una fecha.";
    } else if (data.fecha < minDate) {
      errors.appointmentDate = "La fecha no puede ser anterior a hoy.";
    }
    if (!data.hora) {
      errors.appointmentTime = "Selecciona una hora.";
    }

    clearFormErrors();
    Object.entries(errors).forEach(([fieldId, message]) => setError(fieldId, message));

    return {
      isValid: Object.keys(errors).length === 0,
      data
    };
  }

  function findAppointment(patientId, appointmentId) {
    return getAppointments(patientId).find((appointment) => appointment.patientId === patientId && appointment.id === appointmentId);
  }

  function setupRescheduleForm(patientId) {
    const params = new URLSearchParams(window.location.search);
    const appointmentId = params.get("reprogramar");
    if (!appointmentId) {
      return null;
    }

    const appointment = findAppointment(patientId, appointmentId);
    if (!appointment) {
      return null;
    }

    const treatment = $("#treatment");
    const doctor = $("#doctor");
    const date = $("#appointmentDate");
    const time = $("#appointmentTime");
    const reason = $("#reason");

    if (treatment) treatment.value = appointment.tratamiento.replace(" y Revision", "");
    if (doctor) doctor.value = appointment.doctor;
    if (date) date.value = appointment.fecha;
    if (time) time.value = appointment.hora.replace(" - 11:00 AM", "");
    if (reason) reason.value = appointment.motivo || "";

    return appointment.id;
  }

  function setupAppointmentForm(patientId) {
    const form = $("#appointmentForm");
    const dateInput = $("#appointmentDate");
    if (!form) {
      return;
    }

    if (dateInput) {
      dateInput.min = todayISO();
    }

    const rescheduleId = setupRescheduleForm(patientId);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const validation = validateAppointmentForm(form);
      if (!validation.isValid) {
        showFormMessage("Revisa los campos marcados antes de guardar la cita.", "error");
        return;
      }

      const appointments = getAppointments(patientId);
      const now = new Date().toISOString();

      if (rescheduleId) {
        const updated = appointments.map((appointment) => {
          if (appointment.id !== rescheduleId || appointment.patientId !== patientId) {
            return appointment;
          }
          return {
            ...appointment,
            fecha: validation.data.fecha,
            hora: validation.data.hora,
            doctor: validation.data.doctor,
            tratamiento: validation.data.tratamiento,
            motivo: validation.data.motivo || "",
            estado: "Programada",
            updatedAt: now
          };
        });
        saveAppointments(updated);
      } else {
        appointments.push({
          id: `appt-${Date.now()}`,
          patientId,
          fecha: validation.data.fecha,
          hora: validation.data.hora,
          doctor: validation.data.doctor,
          tratamiento: validation.data.tratamiento,
          motivo: validation.data.motivo || "",
          estado: "Programada",
          createdAt: now
        });
        saveAppointments(appointments);
      }

      showFormMessage("Cita registrada correctamente");
      sessionStorage.setItem(STORAGE_KEYS.flash, "Cita registrada correctamente");
      window.setTimeout(() => {
        window.location.href = "paciente.html";
      }, 900);
    });
  }

  function init() {
    const patient = getCurrentPatient();
    renderPatient(patient);

    if (document.body.dataset.page === "paciente") {
      renderUpcomingAppointments(patient.id);
      renderHistory(patient.id);
      setupTreatmentTabs();
      setupPatientPanels();
      setupAppointmentActions(patient.id);
      consumeFlashMessage();
    }

    if (document.body.dataset.page === "reservar") {
      setupAppointmentForm(patient.id);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
