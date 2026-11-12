(() => {
  const configuredBaseUrl = window.SMARTDENT_API_BASE_URL
    || document.querySelector('meta[name="smartdent-api-base"]')?.content;
  const defaultBaseUrl = window.location.hostname.endsWith("github.io")
    ? "https://smartdent-web.onrender.com/api"
    : `http://${window.location.hostname}:8080/api`;
  const API_BASE_URL = (configuredBaseUrl || defaultBaseUrl).replace(/\/$/, "");
  const SESSION_KEY = "smartdent_session";

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  }

  function saveSession(loginResponse) {
    const user = loginResponse.usuario;
    const session = {
      id: user.id,
      name: user.nombreCompleto,
      dni: user.dni,
      email: user.email,
      phone: user.telefono,
      role: user.rol,
      token: loginResponse.token,
      tokenType: loginResponse.tokenType,
      expiresAt: Date.now() + loginResponse.expiresIn * 1000
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  async function request(path, options = {}) {
    const session = getSession();
    const headers = new Headers(options.headers || {});
    headers.set('X-Frontend-Url', window.location.href);
    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (options.auth !== false && session?.token) {
      headers.set("Authorization", `${session.tokenType || "Bearer"} ${session.token}`);
    }

    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    } catch {
      const error = new Error("No se pudo conectar con SmartDent. Verifica que el backend esté encendido.");
      error.status = 0;
      throw error;
    }

    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      if (response.status === 401 && options.auth !== false) clearSession();
      const error = new Error(body?.message || "No se pudo completar la solicitud.");
      error.status = response.status;
      error.fields = body?.fields || {};
      throw error;
    }
    return body;
  }

  window.SmartDentApi = {
    baseUrl: API_BASE_URL,
    request,
    getSession,
    saveSession,
    clearSession
  };
})();

window.showToast = function(message, type = 'success') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const isError = type === 'error';
  const icon = isError ? 'error' : 'check_circle';
  const bg = isError ? 'bg-red-50 text-red-800 border-red-200' : 'bg-[#071426] text-white border-[#071426]';
  const iconColor = isError ? 'text-red-500' : 'text-[#8a6d00]';

  toast.className = `flex items-center gap-3 px-5 py-4 rounded-xl border shadow-xl transform transition-all duration-300 translate-y-10 opacity-0 ${bg}`;
  toast.innerHTML = `
    <span class="material-symbols-outlined ${iconColor}">${icon}</span>
    <span class="text-sm font-medium">${message}</span>
  `;
  
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-10', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-10', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};
