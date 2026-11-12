import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { RolNombre } from '../models/smartdent.models';

export const authGuard: CanMatchFn = (): boolean | UrlTree => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  return authStore.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = (route): boolean | UrlTree => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const hasVerifyToken = Boolean(route.queryParamMap.get('verificar'));
  if (hasVerifyToken) {
    return true;
  }
  return authStore.isAuthenticated()
    ? router.parseUrl(authStore.dashboardPath())
    : true;
};

export const roleGuard = (allowedRoles: readonly RolNombre[]): CanMatchFn => {
  return (): boolean | UrlTree => {
    const authStore = inject(AuthStore);
    const router = inject(Router);
    const role = authStore.role();
    if (!role) {
      return router.createUrlTree(['/login']);
    }
    return allowedRoles.includes(role)
      ? true
      : router.parseUrl(authStore.dashboardPath());
  };
};
