(() => {
  async function summary() {
    return SmartDentApi.request("/admin/citas/resumen");
  }

  async function fixedCosts() {
    return SmartDentApi.request("/admin/reportes/costos-fijos");
  }

  async function finance() {
    return SmartDentApi.request("/admin/reportes/finanzas");
  }

  async function updateFixedCosts(payload) {
    return SmartDentApi.request("/admin/reportes/costos-fijos", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  }

  window.SmartDentAdminReport = { summary, finance, fixedCosts, updateFixedCosts };
})();
