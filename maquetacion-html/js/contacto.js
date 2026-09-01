(() => {
  const form = document.querySelector("#contact-form");
  if (!form) return;

  const fields = {
    name: document.querySelector("#contact-name"),
    email: document.querySelector("#contact-email"),
    phone: document.querySelector("#contact-phone"),
    subject: document.querySelector("#contact-subject"),
    message: document.querySelector("#contact-message")
  };
  const session = readContactStorage("smartdent_session", null);
  const result = document.querySelector("#contact-result");

  if (session?.name) fields.name.value = session.name;
  if (session?.email) fields.email.value = session.email;

  Object.entries(fields).forEach(([name, field]) => {
    field.addEventListener("blur", () => validateField(name));
    field.addEventListener("input", () => {
      clearResult();
      if (document.querySelector(`#contact-${name}-error`).textContent) validateField(name);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const isValid = Object.keys(fields).map(validateField).every(Boolean);
    if (!isValid) {
      showResult("Revisa los campos señalados antes de enviar el mensaje.", false);
      form.querySelector("[aria-invalid='true']")?.focus();
      return;
    }

    const messages = readContactStorage("smartdent_contact_messages", []);
    messages.push({
      id: `MSG-${Date.now()}`,
      name: fields.name.value.trim(),
      email: fields.email.value.trim().toLowerCase(),
      phone: fields.phone.value.trim(),
      subject: fields.subject.value,
      message: fields.message.value.trim(),
      status: "NUEVO",
      createdAt: new Date().toISOString()
    });
    localStorage.setItem("smartdent_contact_messages", JSON.stringify(messages));
    form.reset();
    if (session?.name) fields.name.value = session.name;
    if (session?.email) fields.email.value = session.email;
    showResult("Tu mensaje fue enviado correctamente. Nos comunicaremos contigo pronto.", true);
  });

  function validateField(name) {
    const field = fields[name];
    const value = field.value.trim();
    let message = "";
    if (name === "name" && value.length < 3) message = "Ingresa tu nombre completo.";
    if (name === "email" && (!value || !field.validity.valid)) message = "Ingresa un correo electrónico válido.";
    if (name === "phone" && value) {
      const digits = value.replace(/\D/g, "");
      if (digits.length < 9 || digits.length > 15) message = "Ingresa un teléfono válido.";
    }
    if (name === "subject" && !value) message = "Selecciona el motivo de tu consulta.";
    if (name === "message" && value.length < 10) message = "Escribe un mensaje de al menos 10 caracteres.";
    const error = document.querySelector(`#contact-${name}-error`);
    error.textContent = message;
    field.setAttribute("aria-invalid", String(Boolean(message)));
    field.classList.toggle("border-red-500", Boolean(message));
    return !message;
  }

  function showResult(message, success) {
    result.textContent = message;
    result.className = `mb-4 rounded-lg p-4 text-sm ${success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`;
  }
  function clearResult() { result.classList.add("hidden"); result.textContent = ""; }
})();

function readContactStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
