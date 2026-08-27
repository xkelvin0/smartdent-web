(function () {
  "use strict";

  var USERS_KEY = "smartdent_users";
  var demoUsers = [
    {
      fullName: "Paciente Demo",
      documentNumber: "12345678",
      email: "paciente@smartdent.pe",
      password: "Smart123",
      role: "paciente"
    },
    {
      fullName: "Administrador Demo",
      documentNumber: "87654321",
      email: "admin@smartdent.pe",
      password: "Admin123",
      role: "admin"
    }
  ];

  var validators = {
    email: function (value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    },
    dni: function (value) {
      return /^\d{8}$/.test(value);
    },
    password: function (value) {
      return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(value);
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    bindPasswordButtons();

    var loginForm = document.getElementById("loginForm");
    var registerForm = document.getElementById("registerForm");

    if (loginForm) {
      loginForm.addEventListener("submit", handleLogin);
      showRegisteredMessage();
    }

    if (registerForm) {
      registerForm.addEventListener("submit", handleRegister);
      bindNumericOnly("documentNumber");
    }
  });

  function bindPasswordButtons() {
    var buttons = document.querySelectorAll("[data-toggle-password]");

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var input = document.getElementById(button.dataset.togglePassword);
        var isPassword = input.type === "password";

        input.type = isPassword ? "text" : "password";
        button.setAttribute("aria-label", isPassword ? "Ocultar contrasena" : "Mostrar contrasena");
      });
    });
  }

  function bindNumericOnly(id) {
    var input = document.getElementById(id);

    if (!input) {
      return;
    }

    input.addEventListener("input", function () {
      input.value = input.value.replace(/\D/g, "");
    });
  }

  function handleLogin(event) {
    event.preventDefault();

    var form = event.currentTarget;
    var email = normalizeEmail(form.email.value);
    var password = form.password.value.trim();
    var isValid = true;

    clearFormErrors(form);

    if (!validators.email(email)) {
      setError("loginEmail", "Ingresa un correo valido.");
      isValid = false;
    }

    if (!password) {
      setError("loginPassword", "Ingresa tu contrasena.");
      isValid = false;
    }

    if (!isValid) {
      setFeedback("loginFeedback", "Revisa los campos marcados.", "error");
      return;
    }

    var user = getAllUsers().find(function (currentUser) {
      return normalizeEmail(currentUser.email) === email && currentUser.password === password;
    });

    if (!user) {
      setFeedback("loginFeedback", "Correo o contrasena incorrectos.", "error");
      return;
    }

    window.localStorage.setItem("smartdent_session", JSON.stringify({
      email: user.email,
      fullName: user.fullName,
      role: user.role || "paciente",
      loggedAt: new Date().toISOString()
    }));

    var destination = user.role === "admin" ? "admin.html" : "paciente.html";
    setFeedback("loginFeedback", "Acceso validado. Redirigiendo a " + destination + "...", "success");
    redirectTo(destination);
  }

  function handleRegister(event) {
    event.preventDefault();

    var form = event.currentTarget;
    var user = {
      fullName: form.fullName.value.trim(),
      documentNumber: form.documentNumber.value.trim(),
      email: normalizeEmail(form.email.value),
      password: form.password.value.trim(),
      role: "paciente"
    };
    var confirmPassword = form.confirmPassword.value.trim();
    var storedUsers = getStoredUsers();
    var isValid = true;

    clearFormErrors(form);

    if (user.fullName.length < 5) {
      setError("fullName", "Escribe nombres y apellidos completos.");
      isValid = false;
    }

    if (!validators.dni(user.documentNumber)) {
      setError("documentNumber", "El DNI debe tener 8 digitos.");
      isValid = false;
    }

    if (!validators.email(user.email)) {
      setError("registerEmail", "Ingresa un correo valido.");
      isValid = false;
    }

    if (!validators.password(user.password)) {
      setError("registerPassword", "Usa minimo 8 caracteres, al menos una letra y un numero.");
      isValid = false;
    }

    if (user.password !== confirmPassword) {
      setError("confirmPassword", "Las contrasenas no coinciden.");
      isValid = false;
    }

    if (getAllUsers().some(function (currentUser) {
      return normalizeEmail(currentUser.email) === user.email;
    })) {
      setError("registerEmail", "Este correo ya esta registrado.");
      isValid = false;
    }

    if (!isValid) {
      setFeedback("registerFeedback", "Revisa los campos marcados.", "error");
      return;
    }

    storedUsers.push(user);
    window.localStorage.setItem(USERS_KEY, JSON.stringify(storedUsers));

    setFeedback("registerFeedback", "Registro completado. Redirigiendo al inicio de sesion...", "success");

    window.setTimeout(function () {
      window.location.href = "login.html?registered=1";
    }, 900);
  }

  function getStoredUsers() {
    try {
      var parsedUsers = JSON.parse(window.localStorage.getItem(USERS_KEY));
      return Array.isArray(parsedUsers) ? parsedUsers : [];
    } catch (error) {
      return [];
    }
  }

  function getAllUsers() {
    return demoUsers.concat(getStoredUsers());
  }

  function normalizeEmail(value) {
    return (value || "").trim().toLowerCase();
  }

  function setError(inputId, message) {
    var input = document.getElementById(inputId);
    var inputWrap = input ? input.closest(".input-wrap") : null;
    var error = document.querySelector("[data-error-for='" + inputId + "']");

    if (input) {
      input.setAttribute("aria-invalid", "true");
    }

    if (inputWrap) {
      inputWrap.classList.add("is-invalid");
    }

    if (error) {
      error.textContent = message;
    }
  }

  function clearFormErrors(form) {
    form.querySelectorAll("[aria-invalid='true']").forEach(function (input) {
      input.removeAttribute("aria-invalid");
    });

    form.querySelectorAll(".input-wrap.is-invalid").forEach(function (inputWrap) {
      inputWrap.classList.remove("is-invalid");
    });

    form.querySelectorAll(".field-error").forEach(function (error) {
      error.textContent = "";
    });
  }

  function setFeedback(id, message, type) {
    var element = document.getElementById(id);

    if (!element) {
      return;
    }

    element.textContent = message;
    element.className = "form-feedback " + type;
  }

  function redirectTo(destination) {
    window.setTimeout(function () {
      window.location.href = destination;
    }, 900);
  }

  function showRegisteredMessage() {
    var params = new URLSearchParams(window.location.search);

    if (params.get("registered") === "1") {
      setFeedback("loginFeedback", "Cuenta creada correctamente. Ya puedes iniciar sesion.", "success");
    }
  }
}());
