(() => {
  function normalize(item) {
    return {
      phone: item.telefono || "",
      emailReminders: Boolean(item.recordatoriosEmail),
      phoneReminders: Boolean(item.recordatoriosTelefono)
    };
  }

  async function get() {
    return normalize(await SmartDentApi.request("/pacientes/configuracion"));
  }

  async function update(settings) {
    return normalize(await SmartDentApi.request("/pacientes/configuracion", {
      method: "PUT",
      body: JSON.stringify({
        telefono: settings.phone,
        recordatoriosEmail: settings.emailReminders,
        recordatoriosTelefono: settings.phoneReminders
      })
    }));
  }

  window.SmartDentPatientSettings = { get, update };
})();
