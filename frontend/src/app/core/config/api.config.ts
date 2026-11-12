import { InjectionToken } from '@angular/core';

export function resolveApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:8080/api';
  }
  const host = window.location.hostname;
  if (host.endsWith('github.io')) {
    return 'https://smartdent-web.onrender.com/api';
  }
  if (window.location.port === '4200') {
    return '/api';
  }
  return `http://${host}:8080/api`;
}

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: resolveApiBaseUrl,
});
