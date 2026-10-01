(() => {
  const header = document.querySelector("#site-header");
  if (!header) return;

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const session = (() => {
    try {
      return JSON.parse(localStorage.getItem("smartdent_session") || "null");
    } catch {
      return null;
    }
  })();
  const activeClass = "border-b-2 border-[#8a6d00] pb-1 font-bold text-[#071426]";
  const linkClass = "text-slate-600 transition hover:text-[#8a6d00]";
  const navClass = (page) => currentPage === page ? activeClass : linkClass;

  header.className = "sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur";
  header.innerHTML = `
    <div class="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 lg:px-8">
      <a class="flex shrink-0 items-center" href="index.html" aria-label="SmartDent - Inicio">
        <img class="h-10 w-auto" src="img/branding/logo-smartdent.png" alt="SmartDent">
      </a>
      <nav class="hidden items-center gap-7 text-sm font-medium lg:flex" aria-label="Navegación principal">
        <a class="${navClass("index.html")}" href="index.html">Inicio</a>
        <a class="${navClass("servicios.html")}" href="servicios.html">Servicios</a>
        <a class="${navClass("nosotros.html")}" href="nosotros.html">Nosotros</a>
        <a class="${navClass("contacto.html")}" href="contacto.html">Contacto</a>
      </nav>
      <div id="guest-navigation" class="flex shrink-0 items-center gap-3">
        <a class="hidden rounded-lg border border-[#071426] px-4 py-2.5 text-xs font-semibold text-[#071426] transition hover:bg-slate-100 sm:inline-flex" href="login.html">Iniciar Sesión</a>
        <button class="booking-button global-booking-button rounded-lg bg-[#8a6d00] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#735c00] hover:shadow-md" data-booking-link type="button">Agendar Cita</button>
      </div>
      <div id="user-navigation" class="hidden shrink-0 items-center gap-3">
        <div class="hidden text-right xl:block">
          <p id="welcome-message" class="m-0 text-xs font-semibold leading-tight text-[#071426]"></p>
          <p id="user-role" class="m-0 text-[10px] leading-tight text-slate-500"></p>
        </div>
        <button id="secondary-role-action" class="hidden rounded-lg border border-[#071426] px-4 py-2.5 text-xs font-semibold text-[#071426] transition hover:bg-slate-100" type="button"></button>
        <button id="primary-role-action" class="rounded-lg bg-[#8a6d00] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#735c00] hover:shadow-md" type="button"></button>
        <button id="logout-button" class="rounded-lg border border-[#071426] px-4 py-2.5 text-xs font-semibold text-[#071426] transition hover:bg-slate-100" type="button">Cerrar Sesión</button>
      </div>
    </div>`;

  function handleBooking(event) {
    event?.preventDefault();
    event?.stopImmediatePropagation();

    if (session?.role === "PACIENTE") {
      window.location.href = "reservar.html";
      return;
    }
    if (session?.role === "ODONTOLOGO") {
      window.location.href = "odontologo.html";
      return;
    }
    if (session?.role === "ADMIN") {
      window.location.href = "admin.html";
      return;
    }

    const scrollPosition = window.scrollY;
    const availableModal = document.querySelector("#auth-required-modal, #auth-modal, #shared-auth-modal") || createSharedAuthModal();
    availableModal.dataset.returnScroll = String(scrollPosition);
    availableModal.classList.remove("hidden");
    availableModal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
    const firstAction = availableModal.querySelector("#modal-login-button, #modal-login, [data-shared-login]");
    window.requestAnimationFrame(() => {
      firstAction?.focus({ preventScroll: true });
      window.scrollTo(0, scrollPosition);
    });
  }

  function createSharedAuthModal() {
    const modal = document.createElement("div");
    modal.id = "shared-auth-modal";
    modal.className = "fixed inset-0 z-[100] hidden items-center justify-center bg-[#071426]/75 p-4 backdrop-blur-sm";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "shared-auth-title");
    modal.innerHTML = `
      <button class="absolute inset-0 cursor-default" type="button" data-shared-close aria-label="Cerrar ventana"></button>
      <div class="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <button class="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#071426]" type="button" data-shared-close aria-label="Cerrar">
          <span class="material-symbols-outlined">close</span>
        </button>
        <span class="material-symbols-outlined mb-5 rounded-lg bg-yellow-50 p-3 text-3xl text-[#8a6d00]">calendar_month</span>
        <h2 id="shared-auth-title" class="text-2xl font-bold text-[#071426]">Inicia sesión para reservar</h2>
        <p class="mt-3 leading-6 text-slate-600">Necesitas una cuenta de paciente para guardar y gestionar tus citas.</p>
        <div class="mt-7 grid gap-3 sm:grid-cols-2">
          <button class="rounded-lg bg-[#071426] px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800" type="button" data-shared-login>Iniciar Sesión</button>
          <button class="rounded-lg border border-[#071426] px-5 py-3 text-sm font-bold text-[#071426] transition hover:bg-slate-50" type="button" data-shared-register>Crear una cuenta</button>
        </div>
        <button class="mt-5 w-full text-xs font-semibold text-slate-500 hover:text-[#071426]" type="button" data-shared-close>Ahora no</button>
      </div>`;
    document.body.appendChild(modal);

    const closeModal = () => {
      const returnScroll = Number(modal.dataset.returnScroll || window.scrollY);
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      document.body.classList.remove("overflow-hidden");
      window.requestAnimationFrame(() => window.scrollTo(0, returnScroll));
    };
    modal.querySelectorAll("[data-shared-close]").forEach((button) => button.addEventListener("click", closeModal));
    modal.querySelector("[data-shared-login]").addEventListener("click", () => {
      sessionStorage.setItem("smartdent_redirect", "reservar.html");
      window.location.href = "login.html";
    });
    modal.querySelector("[data-shared-register]").addEventListener("click", () => {
      sessionStorage.setItem("smartdent_redirect", "reservar.html");
      window.location.href = "registro.html";
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
    });
    return modal;
  }

  header.querySelector("[data-booking-link]")?.addEventListener("click", handleBooking);
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-shared-booking]")) handleBooking(event);
  });

  if (!session?.name || !session?.role) return;

  const actionsByRole = {
    PACIENTE: {
      label: "Paciente",
      primary: ["Agendar Cita", "reservar.html"],
      secondary: ["Mi Panel", "paciente.html"]
    },
    ODONTOLOGO: {
      label: "Odontólogo",
      primary: ["Mi Agenda", "odontologo.html"]
    },
    ADMIN: {
      label: "Administrador",
      primary: ["Panel Administrativo", "admin.html"]
    }
  };
  const actions = actionsByRole[session.role] || actionsByRole.PACIENTE;
  const guestNavigation = header.querySelector("#guest-navigation");
  const userNavigation = header.querySelector("#user-navigation");
  const primaryAction = header.querySelector("#primary-role-action");
  const secondaryAction = header.querySelector("#secondary-role-action");

  guestNavigation.classList.add("hidden");
  userNavigation.classList.remove("hidden");
  userNavigation.classList.add("flex");
  header.querySelector("#welcome-message").textContent = `Bienvenido, ${session.name}`;
  header.querySelector("#user-role").textContent = actions.label;
  primaryAction.textContent = actions.primary[0];
  primaryAction.addEventListener("click", () => { window.location.href = actions.primary[1]; });

  if (actions.secondary) {
    secondaryAction.textContent = actions.secondary[0];
    secondaryAction.classList.remove("hidden");
    secondaryAction.addEventListener("click", () => { window.location.href = actions.secondary[1]; });
  }

  header.querySelector("#logout-button").addEventListener("click", () => {
    localStorage.removeItem("smartdent_session");
    window.location.href = "index.html";
  });
})();
