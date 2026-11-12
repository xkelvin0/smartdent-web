import { ChangeDetectionStrategy, Component, DoCheck, input, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { resolveControlError } from '../validators/smartdent.validators';

@Component({
  selector: 'sd-field-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (errorMessage(); as msg) {
      <p role="alert" class="mt-1.5 flex items-center gap-1 text-xs font-medium text-error">
        <span class="material-symbols-outlined text-sm">error</span>
        <span>{{ msg }}</span>
      </p>
    }
  `,
})
export class FieldErrorComponent implements DoCheck {
  readonly control = input.required<AbstractControl | null>();
  protected readonly errorMessage = signal<string | null>(null);

  ngDoCheck(): void {
    this.errorMessage.set(resolveControlError(this.control()));
  }
}
