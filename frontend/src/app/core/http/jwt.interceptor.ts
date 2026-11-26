import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../auth/auth.store';
import { API_BASE_URL } from '../config/api.config';

const PUBLIC_AUTH_ENDPOINTS: readonly string[] = [
  '/auth/login',
  '/auth/registro',
  '/auth/recuperar-password',
  '/auth/reset-password',
  '/auth/verificar-cuenta',
];

/**
 * [EXPLICACIÓN SUSTENTACIÓN - INTERCEPTOR FUNCIONAL HTTP CON INYECCIÓN DE JWT]:
 * 1. Implementa HttpInterceptorFn (interceptor funcional moderno de Angular, sin clases ni factories legadas).
 * 2. Transparencia de capa de red: Inyecta automáticamente 'Authorization: Bearer <token>' a todas las peticiones salientes hacia endpoints privados.
 * 3. Detección de endpoints públicos: Excluye login, registro y recuperación para evitar envío innecesario de cabeceras.
 * 4. Normalización dinámica de URLs: Permite alternar sin cambios de código entre proxy local (/api) y backend remoto en Render Cloud.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const apiBaseUrl = inject(API_BASE_URL);

  const normalizedUrl = req.url.startsWith('/api')
    ? `${apiBaseUrl}${req.url.slice(4)}`
    : req.url;

  const isPublicAuth = PUBLIC_AUTH_ENDPOINTS.some((suffix) =>
    normalizedUrl.endsWith(suffix)
  );
  const token = authStore.bearerToken();
  const frontendOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200';

  const headers: Record<string, string> = {
    'X-Frontend-Url': frontendOrigin,
  };

  if (token && !isPublicAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cloned = req.clone({
    url: normalizedUrl,
    setHeaders: headers,
  });

  return next(cloned).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !isPublicAuth) {
        authStore.clear();
        void router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
