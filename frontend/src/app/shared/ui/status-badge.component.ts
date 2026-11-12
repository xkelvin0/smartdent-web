import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'sd-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      [class]="badgeClasses()"
    >
      <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
      {{ label() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();

  protected readonly label = computed<string>(() => {
    switch (this.status()) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'CONFIRMADA':
        return 'Confirmada';
      case 'ATENDIDA':
        return 'Atendida';
      case 'CANCELADA':
        return 'Cancelada';
      case 'NUEVO':
        return 'Nuevo';
      case 'LEIDO':
        return 'Leído';
      case 'RESPONDIDO':
        return 'Respondido';
      case 'CONSULTA':
        return 'Consulta';
      case 'DIAGNOSTICO':
        return 'Diagnóstico';
      case 'TRATAMIENTO':
        return 'En tratamiento';
      case 'COMPLETADO':
        return 'Completado';
      default:
        return this.status();
    }
  });

  protected readonly badgeClasses = computed<string>(() => {
    switch (this.status()) {
      case 'CONFIRMADA':
      case 'TRATAMIENTO':
      case 'LEIDO':
        return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20';
      case 'ATENDIDA':
      case 'COMPLETADO':
      case 'RESPONDIDO':
        return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20';
      case 'CANCELADA':
        return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20';
      case 'PENDIENTE':
      case 'NUEVO':
      case 'CONSULTA':
      case 'DIAGNOSTICO':
      default:
        return 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20';
    }
  });
}
