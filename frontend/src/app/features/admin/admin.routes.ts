import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    title: 'SmartDent — Administración y Agenda Global',
    loadComponent: () =>
      import('./admin-agenda.component').then((m) => m.AdminAgendaComponent),
  },
  {
    path: 'servicios',
    title: 'SmartDent — Gestión de Servicios y Tarifas',
    loadComponent: () =>
      import('./admin-servicios.component').then((m) => m.AdminServiciosComponent),
  },
  {
    path: 'odontologos',
    title: 'SmartDent — Gestión de Odontólogos',
    loadComponent: () =>
      import('./admin-odontologos.component').then((m) => m.AdminOdontologosComponent),
  },
  {
    path: 'finanzas',
    title: 'SmartDent — Reportes Financieros y Costos Fijos',
    loadComponent: () =>
      import('./admin-finanzas.component').then((m) => m.AdminFinanzasComponent),
  },
  {
    path: 'mensajes',
    title: 'SmartDent — Bandeja de Contacto',
    loadComponent: () =>
      import('./admin-mensajes.component').then((m) => m.AdminMensajesComponent),
  },
];
