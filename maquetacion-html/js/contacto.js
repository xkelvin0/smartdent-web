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
  const session = SmartDentApi.getSession();
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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const isValid = Object.keys(fields).map(validateField).every(Boolean);
    if (!isValid) {
      showResult("Revisa los campos señalados antes de enviar el mensaje.", false);
      form.querySelector("[aria-invalid='true']")?.focus();
      return;
    }

    const submit = form.querySelector("button[type='submit']");
    submit.disabled = true;
    submit.classList.add("opacity-60");
    try {
      await SmartDentContact.send({
        nombre: fields.name.value.trim(),
        email: fields.email.value.trim().toLowerCase(),
        telefono: fields.phone.value.trim(),
        asunto: fields.subject.value,
        mensaje: fields.message.value.trim()
      });
      form.reset();
      if (session?.name) fields.name.value = session.name;
      if (session?.email) fields.email.value = session.email;
      showResult("Tu mensaje fue enviado correctamente. Nos comunicaremos contigo pronto.", true);
    } catch (error) {
      showResult(Object.values(error.fields || {}).join(" ") || error.message, false);
    } finally {
      submit.disabled = false;
      submit.classList.remove("opacity-60");
    }
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
