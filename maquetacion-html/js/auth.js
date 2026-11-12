function setError(input, message) {
  const error = document.querySelector(`#${input.id}-error`);
  input.classList.toggle("is-invalid", Boolean(message));
  input.setAttribute("aria-invalid", String(Boolean(message)));
  if (error) error.textContent = message;
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



  const registeredEmail = sessionStorage.getItem("smartdent_registered_email");
  if (registeredEmail) {
    email.value = registeredEmail;
    markField(email, "");
    if (window.showToast) {
      window.showToast("Revisa tu correo para verificar la cuenta antes de iniciar sesión.", "success");
    }
    const message = document.querySelector("#login-message");
    if (message) {
      message.textContent = "Cuenta creada. Revisa tu correo electrónico para verificarla antes de iniciar sesión.";
      message.classList.add("is-success");
    }
    sessionStorage.removeItem("smartdent_registered_email");
    password.focus();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearLoginMessage();
    email.value = email.value.trim().toLowerCase();
    const emailIsValid = validateEmail();
    const passwordIsValid = validatePassword();
    if (!emailIsValid || !passwordIsValid) {
      form.querySelector(".is-invalid")?.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Verificando...";
    let loginSuccessful = false;
    try {
      const response = await SmartDentApi.request("/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email: email.value, password: password.value })
      });
      const session = SmartDentApi.saveSession(response);
      loginSuccessful = true;
      if (window.showToast) window.showToast("Inicio de sesión correcto", "success");
      const pendingDestination = sessionStorage.getItem("smartdent_redirect");
      sessionStorage.removeItem("smartdent_redirect");
      const destinationsByRole = {
        PACIENTE: pendingDestination || "index.html",
        ODONTOLOGO: "odontologo.html",
        ADMIN: "admin.html"
      };
      window.location.href = destinationsByRole[session.role] || "index.html";
    } catch (error) {
      if (window.showToast) window.showToast(error.message, "error");
      message.textContent = error.message;
      message.classList.remove("is-success");
      if (error.status === 401) {
        password.value = "";
        password.classList.remove("is-valid");
        password.focus();
      }
    } finally {
      if (!loginSuccessful) {
        submitButton.disabled = false;
        submitButton.textContent = "Iniciar Sesión";
      }
    }
  });

  const params = new URLSearchParams(window.location.search);
  const verifyToken = params.get("verificar");
  if (verifyToken) {
    message.textContent = "Verificando tu cuenta, por favor espera...";
    message.classList.add("is-info");
    SmartDentApi.request("/auth/verificar-cuenta", {
      method: "POST",
      body: JSON.stringify({ token: verifyToken }),
      auth: false
    }).then(() => {
      message.textContent = "Cuenta verificada correctamente. Ya puedes iniciar sesión.";
      message.classList.remove("is-info");
      message.classList.add("is-success");
      if (window.showToast) window.showToast("Cuenta verificada correctamente", "success");
    }).catch(error => {
      message.textContent = error.message;
      message.classList.remove("is-info");
      message.classList.add("text-red-500");
      if (window.showToast) window.showToast(error.message, "error");
    }).finally(() => {
      window.history.replaceState({}, document.title, window.location.pathname);
    });
  }
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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    registerMessage.textContent = "";
    registerMessage.classList.remove("is-success");
    const isValid = Object.values(validators).map((validate) => validate()).every(Boolean);
    if (!isValid) {
      form.querySelector(".is-invalid")?.focus();
      return;
    }

    const registeredEmail = email.value.trim().toLowerCase();
    registerButton.disabled = true;
    registerButton.textContent = "Creando cuenta...";
    let registrationSuccessful = false;
    try {
      await SmartDentApi.request("/auth/registro", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          nombreCompleto: fullName.value.trim(),
          dni: dni.value.trim(),
          email: registeredEmail,
          password: password.value,
          telefono: null
        })
      });
      registrationSuccessful = true;
      sessionStorage.setItem("smartdent_registered_email", registeredEmail);
      if (window.showToast) {
        window.showToast("Cuenta creada. Te enviaremos un correo de confirmación.", "success");
      }
      registerMessage.textContent = "Cuenta creada. Revisa tu bandeja de entrada para activarla.";
      registerMessage.classList.add("is-success");
      registerButton.textContent = "Cuenta creada";
      form.reset();
      form.querySelectorAll("input").forEach((input) => {
        input.classList.remove("is-valid", "is-invalid");
        input.setAttribute("aria-invalid", "false");
      });
      form.querySelectorAll(".field-error").forEach((fieldError) => { fieldError.textContent = ""; });
      updatePasswordStrength();
      window.setTimeout(() => { window.location.href = "login.html"; }, 1800);
    } catch (error) {
      const fields = {
        nombreCompleto: fullName,
        dni,
        email,
        password
      };
      Object.entries(error.fields || {}).forEach(([field, fieldMessage]) => {
        if (fields[field]) setError(fields[field], fieldMessage);
      });
      if (window.showToast) window.showToast(error.message, "error");
      registerMessage.textContent = error.message;
      registerMessage.classList.add("is-danger");
      form.querySelector(".is-invalid")?.focus();
    } finally {
      if (!registrationSuccessful) {
        registerButton.disabled = false;
        registerButton.textContent = "Registrarse";
      }
    }
  });
}

setupPasswordToggles();
setupLoginForm();
setupRegisterForm();

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('verificar');
  if (token) {
    const msgBox = document.getElementById('login-message');
    msgBox.textContent = 'Verificando cuenta...';
    msgBox.className = 'form-message is-info';
    try {
      const res = await fetch(window.API_BASE_URL + '/auth/verificar-cuenta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      if (res.ok) {
        msgBox.textContent = '¡Cuenta verificada exitosamente! Ya puedes iniciar sesión.';
        msgBox.className = 'form-message is-success';
      } else {
        const err = await res.text();
        const finalErr = err || 'El enlace de verificación es inválido o expiró.';
        if (window.showToast) window.showToast(finalErr, "error");
        else {
          msgBox.textContent = finalErr;
          msgBox.className = 'form-message is-error';
        }
      }
    } catch (e) {
      if (window.showToast) window.showToast("Error al contactar al servidor.", "error");
      else {
        msgBox.textContent = 'Error al contactar al servidor.';
        msgBox.className = 'form-message is-error';
      }
    }
  }
});
