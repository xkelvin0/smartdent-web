(() => {
  let currentItems = [];

  function toLegacy(item) {
    return {
      id: String(item.id),
      date: item.fecha,
      time: String(item.horaInicio || "").slice(0, 5),
      endTime: String(item.horaFin || "").slice(0, 5),
      reason: item.motivo,
      createdAt: item.creadoEn
    };
  }

  function saveCache(items) {
    currentItems = Array.isArray(items) ? items : [];
    return currentItems;
  }

  function current() {
    return [...currentItems];
  }

  async function list() {
    return saveCache((await SmartDentApi.request("/odontologos/bloqueos")).map(toLegacy));
  }

  async function create(payload) {
    const created = toLegacy(await SmartDentApi.request("/odontologos/bloqueos", {
      method: "POST",
      body: JSON.stringify(payload)
    }));
    await list();
    return created;
  }

  async function remove(id) {
    await SmartDentApi.request(`/odontologos/bloqueos/${id}`, { method: "DELETE" });
    return list();
  }

  window.SmartDentSchedule = { list, create, remove, saveCache, current };
})();
