(() => {
  const defaults = [
    { id: "SRV-CONSULTA", name: "Consulta y Diagnóstico", specialty: "Prevención", price: 80, cost: 15, duration: 30, active: true },
    { id: "SRV-CONTROL", name: "Control y Seguimiento", specialty: "Prevención", price: 0, cost: 0, duration: 30, active: true },
    { id: "SRV-LIMPIEZA", name: "Limpieza y Profilaxis", specialty: "Prevención", price: 120, cost: 35, duration: 45, active: true },
    { id: "SRV-URGENCIA", name: "Urgencias Dentales", specialty: "Urgencias", price: 150, cost: 50, duration: 40, active: true },
    { id: "SRV-DISENO", name: "Diseño de Sonrisa", specialty: "Estética", price: 180, cost: 55, duration: 60, active: true },
    { id: "SRV-RESINA", name: "Restauraciones con Resina", specialty: "Estética", price: 180, cost: 60, duration: 60, active: true },
    { id: "SRV-BLANQUEAMIENTO", name: "Blanqueamiento Dental", specialty: "Estética", price: 350, cost: 110, duration: 75, active: true },
    { id: "SRV-CARILLAS", name: "Carillas Dentales", specialty: "Estética", price: 700, cost: 260, duration: 90, active: true },
    { id: "SRV-ORTODONCIA", name: "Ortodoncia Convencional", specialty: "Ortodoncia", price: 450, cost: 160, duration: 60, active: true },
    { id: "SRV-ORTODONCIA-INVISIBLE", name: "Ortodoncia Invisible", specialty: "Ortodoncia", price: 900, cost: 350, duration: 60, active: true },
    { id: "SRV-IMPLANTE", name: "Implantología Avanzada", specialty: "Rehabilitación", price: 900, cost: 420, duration: 120, active: true },
    { id: "SRV-PROTESIS", name: "Prótesis Dentales", specialty: "Rehabilitación", price: 650, cost: 280, duration: 90, active: true },
    { id: "SRV-ENDODONCIA", name: "Endodoncia Microscópica", specialty: "Endodoncia", price: 650, cost: 180, duration: 90, active: true },
    { id: "SRV-EXTRACCION", name: "Extracciones Dentales", specialty: "Cirugía", price: 200, cost: 65, duration: 45, active: true },
    { id: "SRV-TERCEROS-MOLARES", name: "Cirugía de Terceros Molares", specialty: "Cirugía", price: 450, cost: 170, duration: 90, active: true },
    { id: "SRV-PERIODONCIA", name: "Periodoncia y Encías", specialty: "Periodoncia", price: 300, cost: 90, duration: 60, active: true },
    { id: "SRV-ODONTOPEDIATRIA", name: "Odontopediatría", specialty: "Odontopediatría", price: 120, cost: 35, duration: 45, active: true }
  ];

  let currentItems = defaults.map((item) => ({ ...item }));

  function get() { return currentItems; }
  function save(items) { currentItems = Array.isArray(items) ? items : []; return currentItems; }
  function find(name) { return get().find((item) => item.name === name); }
  function price(name) { return Number(find(name)?.price || 0); }
  function cost(name) { return Number(find(name)?.cost || 0); }

  window.SmartDentCatalog = { get, save, find, price, cost };
})();
