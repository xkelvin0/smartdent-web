import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guards';

export const APP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shared/layouts/public-shell.component').then((m) => m.PublicShellComponent),
    children: [
      {
        path: '',
        title: 'SmartDent - Excelencia Clínica a través de la Sofisticación',
        loadComponent: () =>
          import('./features/public/home-page.component').then((m) => m.HomePageComponent),
      },
      {
        path: 'servicios',
        title: 'Servicios odontológicos | SmartDent',
        loadComponent: () =>
          import('./features/public/servicios-page.component').then(
            (m) => m.ServiciosPageComponent
          ),
      },
      {
        path: 'nosotros',
        title: 'Nosotros | SmartDent',
        loadComponent: () =>
          import('./features/public/nosotros-page.component').then(
            (m) => m.NosotrosPageComponent
          ),
      },
      {
        path: 'contacto',
        title: 'Contacto | SmartDent',
        loadComponent: () =>
          import('./features/public/contacto-page.component').then(
            (m) => m.ContactoPageComponent
          ),
      },
      {
        path: 'reservar',
        title: 'Programar consulta | SmartDent',
        canActivate: [authGuard, roleGuard(['PACIENTE'])],
        loadComponent: () =>
          import('./features/paciente/reservar-cita.component').then(
            (m) => m.ReservarCitaComponent
          ),
      },
      {
        path: 'paciente/reservar',
        title: 'Programar consulta | SmartDent',
        canActivate: [authGuard, roleGuard(['PACIENTE'])],
        loadComponent: () =>
          import('./features/paciente/reservar-cita.component').then(
            (m) => m.ReservarCitaComponent
          ),
      },
    ],
  },
  {
    path: 'login',
    title: 'Iniciar sesión | SmartDent',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'registro',
    title: 'Crear cuenta | SmartDent',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/registro-page.component').then((m) => m.RegistroPageComponent),
  },
  {
    path: 'recuperar',
    title: 'Recuperar Contraseña | SmartDent',
    loadComponent: () =>
      import('./features/auth/recuperar-page.component').then((m) => m.RecuperarPageComponent),
  },
  {
    path: 'paciente',
    canMatch: [authGuard, roleGuard(['PACIENTE'])],
    loadComponent: () =>
      import('./shared/layouts/dashboard-shell.component').then(
        (m) => m.DashboardShellComponent
      ),
    loadChildren: () =>
      import('./features/paciente/paciente.routes').then((m) => m.PACIENTE_ROUTES),
  },
  {
    path: 'odontologo',
    canMatch: [authGuard, roleGuard(['ODONTOLOGO'])],
    loadComponent: () =>
      import('./shared/layouts/dashboard-shell.component').then(
        (m) => m.DashboardShellComponent
      ),
    loadChildren: () =>
      import('./features/odontologo/odontologo.routes').then((m) => m.ODONTOLOGO_ROUTES),
  },
  {
    path: 'admin',
    canMatch: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./shared/layouts/dashboard-shell.component').then(
        (m) => m.DashboardShellComponent
      ),
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  { path: 'index.html', redirectTo: '', pathMatch: 'full' },
  { path: 'servicios.html', redirectTo: 'servicios', pathMatch: 'full' },
  { path: 'nosotros.html', redirectTo: 'nosotros', pathMatch: 'full' },
  { path: 'contacto.html', redirectTo: 'contacto', pathMatch: 'full' },
  { path: 'login.html', redirectTo: 'login', pathMatch: 'full' },
  { path: 'registro.html', redirectTo: 'registro', pathMatch: 'full' },
  { path: 'recuperar.html', redirectTo: 'recuperar', pathMatch: 'full' },
  { path: 'reservar.html', redirectTo: 'reservar', pathMatch: 'full' },
  { path: 'paciente.html', redirectTo: 'paciente', pathMatch: 'full' },
  { path: 'odontologo.html', redirectTo: 'odontologo', pathMatch: 'full' },
  { path: 'admin.html', redirectTo: 'admin', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
