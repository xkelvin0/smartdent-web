import { Routes } from '@angular/router';

export const PACIENTE_ROUTES: Routes = [
  {
    path: '',
    title: 'SmartDent — Panel del Paciente',
    loadComponent: () =>
      import('./paciente-dashboard.component').then((m) => m.PacienteDashboardComponent),
  },
  {
    path: 'reservar',
    title: 'SmartDent — Reservar Cita Odontológica',
    loadComponent: () =>
      import('./reservar-cita.component').then((m) => m.ReservarCitaComponent),
  },
  {
    path: 'configuracion',
    title: 'SmartDent — Preferencias del Paciente',
    loadComponent: () =>
      import('./paciente-configuracion.component').then(
        (m) => m.PacienteConfiguracionComponent
      ),
  },
];
