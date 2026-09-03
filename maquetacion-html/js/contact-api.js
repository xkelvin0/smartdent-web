(() => {
  async function send(data) {
    return SmartDentApi.request("/contacto/mensajes", { method: "POST", body: JSON.stringify(data), auth: false });
  }

  async function listAdmin() {
    return SmartDentApi.request("/admin/mensajes");
  }

  async function updateStatus(id, estado) {
    return SmartDentApi.request(`/admin/mensajes/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado })
    });
  }

  window.SmartDentContact = { send, listAdmin, updateStatus };
})();
