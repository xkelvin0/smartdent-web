function setError(input, message) {
  const error = document.querySelector(`#${input.id}-error`);
  input.classList.toggle("is-invalid", Boolean(message));
  input.setAttribute("aria-invalid", String(Boolean(message)));
  if (error) error.textContent = message;
}

const DEMO_USERS = [
  {
    name: "Juan Pérez",
    email: "paciente@gmail.com",
    password: "Paciente123",
    role: "PACIENTE"
  },
  {
    name: "Dr. Carlos Mendoza",
    email: "carlos.mendoza@smartdent.com",
    password: "Carlos123",
    professionalId: "DOC-CARLOS-MENDOZA",
    role: "ODONTOLOGO"
  },
  {
    name: "Dra. Elena Ruiz",
    email: "elena.ruiz@smartdent.com",
    password: "Elena123",
    professionalId: "DOC-ELENA-RUIZ",
    role: "ODONTOLOGO"
  },
  {
    name: "Dr. Miguel Silva",
    email: "miguel.silva@smartdent.com",
    password: "Miguel123",
    professionalId: "DOC-MIGUEL-SILVA",
    role: "ODONTOLOGO"
  },
  {
    name: "Dra. Lucía Torres",
    email: "lucia.torres@smartdent.com",
    password: "Lucia123",
    professionalId: "DOC-LUCIA-TORRES",
    role: "ODONTOLOGO"
  },
  {
    name: "Administrador SmartDent",
    email: "admin@smartdent.com",
    password: "Admin123",
    role: "ADMIN"
  }
];

function getRegisteredUsers() {
  try {
    return JSON.parse(localStorage.getItem("smartdent_users") || "[]");
  } catch {
    return [];
  }
}

function saveSession(user) {
  const session = { name: user.name, email: user.email, role: user.role };
  if (user.professionalId) session.professionalId = user.professionalId;
  localStorage.setItem("smartdent_session", JSON.stringify(session));
}

function setupPasswordToggles() {
  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    const input = document.querySelector(`#${button.dataset.passwordToggle}`);
    if (!input) return;

    button.addEventListener("click", () => {
      const passwordIsVisible = input.type === "text";
      input.type = passwordIsVisible ? "password" : "text";
      button.setAttribute("aria-pressed", String(!passwordIsVisible));
      button.setAttribute(
        "aria-label",
        passwordIsVisible ? "Mostrar contraseña" : "Ocultar contraseña"
      );
    });
  });
}

function setupLoginForm() {
  const form = document.querySelector("#login-form");
  if (!form) return;

  const email = document.querySelector("#email");
  const password = document.querySelector("#password");
  const message = document.querySelector("#login-message");
  const submitButton = form.querySelector("button[type='submit']");
  const forgotPassword = document.querySelector("#forgot-password-link");

  function clearLoginMessage() {
    message.textContent = "";
    message.classList.remove("is-success", "is-info");
  }

  function markField(input, errorMessage) {
    setError(input, errorMessage);
    input.classList.toggle("is-valid", !errorMessage && Boolean(input.value));
  }

  function validateEmail() {
    const value = email.value.trim();
    const message = !value
      ? "Ingresa tu correo electrónico."
      : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
        ? "Usa un formato válido, por ejemplo: nombre@correo.com."
        : "";
    markField(email, message);
    return !message;
  }

  function validatePassword() {
    const message = !password.value
      ? "Ingresa tu contraseña."
      : password.value.length < 8
        ? "La contraseña debe tener al menos 8 caracteres."
        : "";
    markField(password, message);
    return !message;
  }

  email.addEventListener("input", () => {
    const normalized = email.value.replace(/\s/g, "");
    if (email.value !== normalized) email.value = normalized;
    clearLoginMessage();
    if (email.classList.contains("is-invalid")) validateEmail();
  });
  password.addEventListener("input", () => {
    clearLoginMessage();
    if (password.classList.contains("is-invalid")) validatePassword();
  });
  email.addEventListener("blur", () => {
    email.value = email.value.trim().toLowerCase();
    validateEmail();
  });
  password.addEventListener("blur", validatePassword);

  forgotPassword?.addEventListener("click", (event) => {
    event.preventDefault();
    clearLoginMessage();
    message.textContent = "Para recuperar tu acceso, comunícate con SmartDent desde la página de Contacto.";
    message.classList.add("is-info");
  });

  const registeredEmail = sessionStorage.getItem("smartdent_registered_email");
  if (registeredEmail) {
    email.value = registeredEmail;
    markField(email, "");
    message.textContent = "Cuenta creada correctamente. Ingresa tu contraseña para continuar.";
    message.classList.add("is-success");
    sessionStorage.removeItem("smartdent_registered_email");
    password.focus();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearLoginMessage();
    email.value = email.value.trim().toLowerCase();
    const emailIsValid = validateEmail();
    const passwordIsValid = validatePassword();
    if (!emailIsValid || !passwordIsValid) {
      form.querySelector(".is-invalid")?.focus();
      return;
    }

    const users = [...DEMO_USERS, ...getRegisteredUsers()];
    const user = users.find(
      (candidate) => candidate.email.toLowerCase() === email.value.trim().toLowerCase()
        && candidate.password === password.value
    );
    if (!user) {
      message.textContent = "El correo o la contraseña son incorrectos.";
      message.classList.remove("is-success");
      password.value = "";
      password.classList.remove("is-valid");
      password.focus();
      return;
    }

    saveSession(user);
    message.textContent = "Inicio de sesión correcto. Redirigiendo...";
    message.classList.add("is-success");
    submitButton.disabled = true;
    submitButton.textContent = "Ingresando...";
    const pendingDestination = sessionStorage.getItem("smartdent_redirect");
    sessionStorage.removeItem("smartdent_redirect");
    const destinationsByRole = {
      PACIENTE: pendingDestination || "index.html",
      ODONTOLOGO: "odontologo.html",
      ADMIN: "admin.html"
    };
    window.location.href = destinationsByRole[user.role] || "index.html";
  });
}

function setupRegisterForm() {
  const form = document.querySelector("#register-form");
  if (!form) return;

  const fullName = document.querySelector("#full-name");
  const dni = document.querySelector("#dni");
  const email = document.querySelector("#register-email");
  const password = document.querySelector("#register-password");
  const registerMessage = document.querySelector("#register-message");
  const registerButton = form.querySelector("button[type='submit']");
  const strengthBar = document.querySelector("#password-strength-bar");
  const strengthLabel = document.querySelector("#password-strength-label");
  const requirementItems = document.querySelectorAll("[data-requirement]");

  function passwordChecks() {
    const value = password.value;
    return {
      length: value.length >= 8,
      letter: /[A-Za-z]/.test(value),
      number: /\d/.test(value),
      symbol: /[^A-Za-z\d\s]/.test(value)
    };
  }

  function updatePasswordStrength() {
    const checks = passwordChecks();
    const score = Object.values(checks).filter(Boolean).length;
    const labels = ["Sin contraseña", "Débil", "Básica", "Buena", "Fuerte"];
    const label = password.value ? labels[score] : labels[0];
    strengthBar.dataset.score = String(password.value ? score : 0);
    strengthBar.setAttribute("aria-valuenow", String(password.value ? score : 0));
    strengthBar.setAttribute("aria-valuetext", label);
    strengthLabel.textContent = label;
    requirementItems.forEach((item) => {
      item.classList.toggle("is-complete", checks[item.dataset.requirement]);
    });
  }

  const validators = {
    fullName() {
      const value = fullName.value.trim();
      const message = value.length < 3 || !value.includes(" ")
        ? "Ingresa tu nombre y apellido."
        : "";
      setError(fullName, message);
      return !message;
    },
    dni() {
      const message = /^\d{8}$/.test(dni.value.trim())
        ? ""
        : "El DNI debe contener exactamente 8 números.";
      setError(dni, message);
      return !message;
    },
    email() {
      const value = email.value.trim();
      const message = !value
        ? "Ingresa tu correo electrónico."
        : !email.validity.valid
          ? "Ingresa un correo electrónico válido."
          : "";
      setError(email, message);
      return !message;
    },
    password() {
      const checks = passwordChecks();
      const missing = [];
      if (!checks.length) missing.push("8 caracteres");
      if (!checks.letter) missing.push("una letra");
      if (!checks.number) missing.push("un número");
      const message = missing.length ? `Falta: ${missing.join(", ")}.` : "";
      setError(password, message);
      return !message;
    }
  };

  fullName.addEventListener("blur", validators.fullName);
  dni.addEventListener("input", () => {
    dni.value = dni.value.replace(/\D/g, "").slice(0, 8);
  });
  dni.addEventListener("blur", validators.dni);
  email.addEventListener("blur", validators.email);
  password.addEventListener("input", () => {
    updatePasswordStrength();
    if (password.classList.contains("is-invalid")) validators.password();
  });
  password.addEventListener("blur", validators.password);
  updatePasswordStrength();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const isValid = Object.values(validators).map((validate) => validate()).every(Boolean);
    if (!isValid) return;

    const users = getRegisteredUsers();
    const emailAlreadyExists = [...DEMO_USERS, ...users].some(
      (user) => user.email.toLowerCase() === email.value.trim().toLowerCase()
    );
    if (emailAlreadyExists) {
      registerMessage.textContent = "Ya existe una cuenta registrada con este correo.";
      registerMessage.classList.remove("is-success");
      return;
    }

    const registeredEmail = email.value.trim().toLowerCase();
    users.push({
      name: fullName.value.trim(),
      dni: dni.value.trim(),
      email: registeredEmail,
      password: password.value,
      role: "PACIENTE"
    });
    localStorage.setItem("smartdent_users", JSON.stringify(users));
    sessionStorage.setItem("smartdent_registered_email", registeredEmail);
    registerMessage.textContent = "Cuenta creada correctamente. Te llevaremos al inicio de sesión...";
    registerMessage.classList.add("is-success");
    registerButton.disabled = true;
    registerButton.textContent = "Cuenta creada";
    form.reset();
    form.querySelectorAll("input").forEach((input) => {
      input.classList.remove("is-valid", "is-invalid");
      input.setAttribute("aria-invalid", "false");
    });
    form.querySelectorAll(".field-error").forEach((error) => { error.textContent = ""; });
    updatePasswordStrength();
    window.setTimeout(() => { window.location.href = "login.html"; }, 1800);
  });
}

setupPasswordToggles();
setupLoginForm();
setupRegisterForm();
