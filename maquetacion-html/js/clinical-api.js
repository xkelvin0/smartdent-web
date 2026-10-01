(() => {
  let currentItems = [];

  function toLegacy(historia) {
    return {
      id: String(historia.id),
      code: historia.codigo,
      patientId: historia.pacienteId,
      patientName: historia.pacienteNombre,
      patientEmail: historia.pacienteEmail,
      dentistId: String(historia.odontologoId),
      dentistName: historia.odontologoNombre,
      dentistEmail: historia.odontologoEmail,
      appointmentId: historia.ultimaCitaId == null ? null : String(historia.ultimaCitaId),
      treatmentStage: historia.etapaTratamiento,
      allergies: historia.alergias || "",
      diagnosis: historia.diagnostico || "",
      treatment: historia.tratamiento || "",
      instructions: historia.indicaciones || "",
      nextControl: historia.proximoControl || "",
      notes: historia.observaciones || "",
      updatedAt: historia.actualizadoEn
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
    return saveCache((await SmartDentApi.request("/pacientes/historias-clinicas")).map(toLegacy));
  }

  async function getForDentist(patientEmail) {
    const response = await SmartDentApi.request(
      `/odontologos/historias-clinicas?pacienteEmail=${encodeURIComponent(patientEmail)}`
    );
    return response ? toLegacy(response) : null;
  }

  async function saveForDentist(patientEmail, record) {
    return toLegacy(await SmartDentApi.request(
      `/odontologos/historias-clinicas?pacienteEmail=${encodeURIComponent(patientEmail)}`,
      { method: "PUT", body: JSON.stringify(record) }
    ));
  }

  window.SmartDentClinical = { toLegacy, saveCache, current, listPatient, getForDentist, saveForDentist };
})();
