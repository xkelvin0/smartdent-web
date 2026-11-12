import { Routes } from '@angular/router';

export const ODONTOLOGO_ROUTES: Routes = [
  {
    path: '',
    title: 'SmartDent — Agenda del Odontólogo',
    loadComponent: () =>
      import('./odontologo-agenda.component').then((m) => m.OdontologoAgendaComponent),
  },
  {
    path: 'bloqueos',
    title: 'SmartDent — Bloqueos de Horario',
    loadComponent: () =>
      import('./odontologo-bloqueos.component').then((m) => m.OdontologoBloqueosComponent),
  },
];
