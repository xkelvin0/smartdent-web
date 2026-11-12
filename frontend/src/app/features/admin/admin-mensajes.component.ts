import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import {
  MensajeContactoEstado,
  MensajeContactoResponse,
} from '../../core/models/smartdent.models';
import { ToastStore } from '../../core/notifications/toast.store';
import { SmartDentApiService } from '../../core/services/smartdent-api.service';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { extractApiErrorMessage } from '../../shared/validators/smartdent.validators';

@Component({
  selector: 'sd-admin-mensajes',
  imports: [StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h1 class="text-2xl font-extrabold text-navy">Bandeja de Mensajes de Contacto</h1>
      <p class="text-sm text-slate-500">
        Gestiona consultas enviadas desde el portal público y actualiza su estado de seguimiento.
      </p>
    </div>

    <div class="mt-6 space-y-3">
      @for (msg of mensajes(); track msg.id) {
        <article class="sd-card flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div class="space-y-1.5">
            <div class="flex flex-wrap items-center gap-2.5">
              <sd-status-badge [status]="msg.estado" />
              <h2 class="text-base font-bold text-navy">{{ msg.asunto }}</h2>
            </div>
            <p class="text-xs font-semibold text-gold">
              {{ msg.nombre }} · {{ msg.email }}
              @if (msg.telefono) {
                · Tel: {{ msg.telefono }}
              }
            </p>
            <p class="text-sm text-slate-700">{{ msg.mensaje }}</p>
          </div>

          <div class="flex shrink-0 gap-2">
            @if (msg.estado === 'NUEVO') {
              <button
                type="button"
                (click)="cambiarEstado(msg.id, 'LEIDO')"
                class="sd-btn-outline py-1.5 text-xs"
              >
                Marcar Leído
              </button>
            }
            @if (msg.estado !== 'RESPONDIDO') {
              <button
                type="button"
                (click)="cambiarEstado(msg.id, 'RESPONDIDO')"
                class="sd-btn-gold py-1.5 text-xs"
              >
                Marcar Respondido
              </button>
            }
          </div>
        </article>
      } @empty {
        <div class="sd-card py-10 text-center text-sm text-slate-500">
          La bandeja de mensajes de contacto está vacía.
        </div>
      }
    </div>
  `,
})
export class AdminMensajesComponent implements OnInit {
  private readonly api = inject(SmartDentApiService);
  private readonly toastStore = inject(ToastStore);

  protected readonly mensajes = signal<readonly MensajeContactoResponse[]>([]);

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.api.listarMensajesContactoAdmin().subscribe({
      next: (list) => this.mensajes.set(list),
    });
  }

  protected cambiarEstado(id: number, estado: MensajeContactoEstado): void {
    this.api.cambiarEstadoMensajeAdmin(id, estado).subscribe({
      next: () => {
        this.toastStore.success(`Mensaje marcado como ${estado}.`);
        this.cargar();
      },
      error: (err: unknown) => this.toastStore.error(extractApiErrorMessage(err)),
    });
  }
}
