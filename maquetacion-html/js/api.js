(() => {
  const API_BASE_URL = "http://localhost:8080/api";
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
