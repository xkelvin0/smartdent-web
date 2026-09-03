(() => {
  let currentItems = [];

  function normalizeTime(value) {
    return String(value || "").slice(0, 5);
  }

  function toLegacy(cita) {
    return {
      id: String(cita.id),
      code: cita.codigo,
      patientId: cita.pacienteId,
      patientEmail: cita.pacienteEmail,
      patientName: cita.pacienteNombre,
      serviceId: cita.servicioId,
      service: cita.servicioNombre,
      dentistId: String(cita.odontologoId),
      dentist: cita.odontologoNombre,
      date: cita.fecha,
      time: normalizeTime(cita.horaInicio),
      endTime: normalizeTime(cita.horaFin),
      phone: cita.telefonoContacto,
      notes: cita.motivo || "",
      status: cita.estado,
      price: Number(cita.precioPactado),
      createdAt: cita.creadoEn
    };
  }

  function saveCache(items) {
    currentItems = Array.isArray(items) ? items : [];
    return currentItems;
  }

  function current() {
    return [...currentItems];
  }

  async function listPatient() {
    return saveCache((await SmartDentApi.request("/pacientes/citas")).map(toLegacy));
  }

  async function listDentist() {
    return saveCache((await SmartDentApi.request("/odontologos/mi-agenda")).map(toLegacy));
  }

  async function listAdmin() {
    return saveCache((await SmartDentApi.request("/admin/citas")).map(toLegacy));
  }

  async function cancelPatient(id) {
    return toLegacy(await SmartDentApi.request(`/pacientes/citas/${id}/cancelar`, { method: "PATCH" }));
  }

  async function updateDentistStatus(id, estado) {
    return toLegacy(await SmartDentApi.request(`/odontologos/citas/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado })
    }));
  }

  async function updateAdminStatus(id, estado) {
    return toLegacy(await SmartDentApi.request(`/admin/citas/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado })
    }));
  }

  window.SmartDentAppointments = {
    toLegacy,
    saveCache,
    current,
    listPatient,
    listDentist,
    listAdmin,
    cancelPatient,
    updateDentistStatus,
    updateAdminStatus
  };
})();
