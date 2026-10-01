(() => {
  let currentUsers = [];
  let currentDentists = [];

  function mapDentist(item) {
    return {
      dentistId: Number(item.id),
      professionalId: item.codigo,
      name: item.nombreCompleto,
      dni: item.dni,
      email: item.email,
      phone: item.telefono || "",
      role: "ODONTOLOGO",
      specialty: item.especialidad,
      license: item.colegiatura,
      photo: item.fotoUrl || "",
      active: item.activo,
      serviceIds: (item.servicioIds || []).map(Number)
    };
  }

  async function list() {
    const [rawUsers, rawDentists] = await Promise.all([
      SmartDentApi.request("/admin/usuarios"),
      SmartDentApi.request("/admin/odontologos")
    ]);
    currentDentists = rawDentists.map(mapDentist);
    const dentistByEmail = new Map(currentDentists.map((item) => [item.email, item]));
    currentUsers = rawUsers.map((item) => ({
      id: Number(item.id),
      name: item.nombreCompleto,
      dni: item.dni,
      email: item.email,
      phone: item.telefono || "",
      role: item.rol,
      active: item.activo,
      createdAt: item.creadoEn,
      ...(dentistByEmail.get(item.email) || {})
    }));
    return [...currentUsers];
  }

  async function createDentist(payload) {
    await SmartDentApi.request("/admin/odontologos", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return list();
  }

  async function updateDentist(id, payload) {
    await SmartDentApi.request(`/admin/odontologos/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    return list();
  }

  window.SmartDentAdminUsers = {
    list,
    createDentist,
    updateDentist,
    getUsers: () => [...currentUsers],
    getDentists: () => [...currentDentists]
  };
})();
