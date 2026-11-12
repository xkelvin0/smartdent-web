import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
  readonly id: number;
  readonly message: string;
  readonly kind: ToastKind;
}

@Injectable({ providedIn: 'root' })
export class ToastStore {
  private nextId = 1;
  private readonly _items = signal<readonly ToastItem[]>([]);

  readonly items = this._items.asReadonly();

  show(message: string, kind: ToastKind = 'success', durationMs = 4000): void {
    const id = this.nextId++;
    this._items.update((list) => [...list, { id, message, kind }]);
    if (durationMs > 0 && typeof window !== 'undefined') {
      window.setTimeout(() => this.dismiss(id), durationMs);
    }
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error', 5000);
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  dismiss(id: number): void {
    this._items.update((list) => list.filter((item) => item.id !== id));
  }
}
