import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthStore } from '../auth/auth.store';
import { NotificacionResponse } from '../models/smartdent.models';
import { SmartDentApiService } from '../services/smartdent-api.service';
import { ToastStore } from './toast.store';

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly api = inject(SmartDentApiService);
  private readonly authStore = inject(AuthStore);
  private readonly toastStore = inject(ToastStore);

  private readonly _items = signal<readonly NotificacionResponse[]>([]);
  private readonly _drawerOpen = signal<boolean>(false);
  private readonly _incomingEvent = signal<NotificacionResponse | null>(null);
  private readonly _seenIds = new Set<number>();
  private initializedForEmail: string | null = null;
  private pollIntervalId: number | null = null;

  readonly items = this._items.asReadonly();
  readonly drawerOpen = this._drawerOpen.asReadonly();
  readonly incomingEvent = this._incomingEvent.asReadonly();
  readonly unreadCount = computed<number>(
    () => this._items().filter((item) => !item.leida).length
  );

  startPolling(): void {
    this.refresh(false);
    if (typeof window === 'undefined' || this.pollIntervalId !== null) {
      return;
    }
    this.pollIntervalId = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      this.refresh(true);
    }, 8000);
  }

  stopPolling(): void {
    if (typeof window !== 'undefined' && this.pollIntervalId !== null) {
      window.clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
    this._items.set([]);
    this._drawerOpen.set(false);
    this._incomingEvent.set(null);
    this._seenIds.clear();
    this.initializedForEmail = null;
  }

  toggleDrawer(): void {
    const next = !this._drawerOpen();
    this._drawerOpen.set(next);
    if (next) {
      this.refresh(false);
    }
  }

  closeDrawer(): void {
    this._drawerOpen.set(false);
  }

  refresh(emitLiveToast = false): void {
    const session = this.authStore.session();
    if (!session || !this.authStore.isAuthenticated()) {
      return;
    }
    const email = session.email.toLowerCase();
    const isFirstLoad = this.initializedForEmail !== email;

    this.api.listarMisNotificaciones().subscribe({
      next: (list) => {
        if (isFirstLoad) {
          this._seenIds.clear();
          list.forEach((n) => this._seenIds.add(n.id));
          this.initializedForEmail = email;
        } else if (emitLiveToast) {
          const newUnread = list.filter((n) => !n.leida && !this._seenIds.has(n.id));
          newUnread.slice(0, 2).forEach((n) => {
            const kind =
              n.tipo === 'CITA_CANCELADA'
                ? 'error'
                : n.tipo === 'CITA_CONFIRMADA' || n.tipo === 'CITA_ATENDIDA'
                  ? 'success'
                  : 'info';
            this.toastStore.show(`${n.titulo}: ${n.mensaje}`, kind, 5500);
            this._incomingEvent.set(n);
          });
          list.forEach((n) => this._seenIds.add(n.id));
        } else {
          list.forEach((n) => this._seenIds.add(n.id));
        }
        this._items.set(list);
      },
      error: () => {
        // Silencioso en polling para no interrumpir la sesión
      },
    });
  }

  markAsRead(id: number): void {
    const target = this._items().find((item) => item.id === id);
    if (!target || target.leida) {
      return;
    }
    this._items.update((list) =>
      list.map((item) => (item.id === id ? { ...item, leida: true } : item))
    );
    this.api.marcarNotificacionLeida(id).subscribe({
      error: () => this.refresh(false),
    });
  }

  markAllAsRead(): void {
    if (this.unreadCount() === 0) {
      return;
    }
    this._items.update((list) => list.map((item) => ({ ...item, leida: true })));
    this.api.marcarTodasNotificacionesLeidas().subscribe({
      error: () => this.refresh(false),
    });
  }
}

