import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastStore } from '../../core/notifications/toast.store';

@Component({
  selector: 'sd-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      aria-live="polite"
      class="pointer-events-none fixed bottom-5 right-5 z-[9999] flex max-w-sm flex-col gap-2.5"
    >
      @for (toast of toastStore.items(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3.5 shadow-xl transition"
          [class]="
            toast.kind === 'error'
              ? 'border-red-200 bg-red-50 text-red-900'
              : toast.kind === 'info'
                ? 'border-blue-200 bg-blue-50 text-blue-900'
                : 'border-navy bg-navy text-white'
          "
        >
          <span
            class="material-symbols-outlined text-xl"
            [class]="
              toast.kind === 'error'
                ? 'text-red-600'
                : toast.kind === 'info'
                  ? 'text-blue-600'
                  : 'text-gold-soft'
            "
          >
            {{ toast.kind === 'error' ? 'error' : toast.kind === 'info' ? 'info' : 'check_circle' }}
          </span>
          <p class="flex-1 text-sm font-medium leading-snug">{{ toast.message }}</p>
          <button
            type="button"
            (click)="toastStore.dismiss(toast.id)"
            class="rounded p-0.5 opacity-70 transition hover:opacity-100"
            aria-label="Cerrar notificación"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastHostComponent {
  protected readonly toastStore = inject(ToastStore);
}
