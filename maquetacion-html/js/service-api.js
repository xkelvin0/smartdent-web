(() => {
  function toLegacy(servicio) {
    return {
      id: servicio.codigo,
      backendId: Number(servicio.id),
      code: servicio.codigo,
      name: servicio.nombre,
      specialty: servicio.especialidad,
      description: servicio.descripcion,
      price: Number(servicio.precio),
      cost: Number(servicio.costo || 0),
      duration: Number(servicio.duracionMinutos),
      sessions: Number(servicio.sesionesIncluidas || 1),
      image: servicio.imagenUrl || "",
      active: servicio.activo !== false
    };
  }

  function toRequest(service) {
    return {
      codigo: service.code || service.id,
      nombre: service.name,
      especialidad: service.specialty,
      descripcion: service.description,
      precio: Number(service.price),
      costo: Number(service.cost),
      duracionMinutos: Number(service.duration),
      imagenUrl: service.image || null,
      activo: Boolean(service.active)
    };
  }

  function saveCache(items) {
    SmartDentCatalog.save(items);
    return items;
  }

  async function listAdmin() {
    const services = await SmartDentApi.request("/admin/servicios");
    return saveCache(services.map(toLegacy));
  }

  async function update(service) {
    if (!service?.backendId) {
      throw new Error("No se encontró el identificador del servicio en el backend.");
    }
    const updated = await SmartDentApi.request(`/admin/servicios/${service.backendId}`, {
      method: "PUT",
      body: JSON.stringify(toRequest(service))
    });
    const mapped = toLegacy(updated);
    const services = SmartDentCatalog.get();
    const index = services.findIndex((item) => item.id === mapped.id);
    if (index >= 0) services[index] = mapped;
    else services.push(mapped);
    saveCache(services);
    return mapped;
  }

  window.SmartDentServices = { toLegacy, listAdmin, update };
})();
