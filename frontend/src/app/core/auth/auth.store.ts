import { Injectable, computed, signal } from '@angular/core';
import {
  AuthSession,
  LoginResponse,
  RolNombre,
  isAuthSession,
} from '../models/smartdent.models';

const SESSION_KEY = 'smartdent_session';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _session = signal<AuthSession | null>(this.hydrateFromStorage());

  readonly session = this._session.asReadonly();

  readonly isAuthenticated = computed<boolean>(() => {
    const current = this._session();
    return current !== null && current.expiresAt > Date.now();
  });

  readonly role = computed<RolNombre | null>(() =>
    this.isAuthenticated() ? (this._session()?.rol ?? null) : null
  );

  readonly bearerToken = computed<string | null>(() =>
    this.isAuthenticated() ? (this._session()?.token ?? null) : null
  );

  readonly userName = computed<string>(() => this._session()?.nombreCompleto ?? '');

  readonly dashboardPath = computed<string>(() => {
    const currentRole = this.role();
    switch (currentRole) {
      case 'ADMIN':
        return '/admin';
      case 'ODONTOLOGO':
        return '/odontologo';
      case 'PACIENTE':
        return '/paciente';
      default:
        return '/login';
    }
  });

  setSession(response: LoginResponse): AuthSession {
    const next: AuthSession = {
      id: response.usuario.id,
      nombreCompleto: response.usuario.nombreCompleto,
      dni: response.usuario.dni,
      email: response.usuario.email,
      telefono: response.usuario.telefono,
      rol: response.usuario.rol,
      token: response.token,
      tokenType: response.tokenType || 'Bearer',
      expiresAt: Date.now() + response.expiresIn * 1000,
    };
    this.persistToStorage(next);
    this._session.set(next);
    return next;
  }

  updatePhone(telefono: string | null): void {
    const current = this._session();
    if (!current) return;
    const updated: AuthSession = { ...current, telefono };
    this.persistToStorage(updated);
    this._session.set(updated);
  }

  clear(): void {
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(SESSION_KEY);
        window.localStorage.removeItem(SESSION_KEY);
      } catch {
        // Ignorar bloqueo de Web Storage en modo privado estricto
      }
    }
    this._session.set(null);
  }

  private persistToStorage(session: AuthSession): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // Fallback silencioso en memoria (Signal activa)
    }
  }

  private hydrateFromStorage(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw =
        window.localStorage.getItem(SESSION_KEY) ??
        window.sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!isAuthSession(parsed) || parsed.expiresAt <= Date.now()) {
        window.localStorage.removeItem(SESSION_KEY);
        window.sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
}
