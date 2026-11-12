import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { isApiErrorPayload } from '../../core/models/smartdent.models';

export const SmartDentValidators = {
  dniPeru(): ValidatorFn {
    const regex = /^\d{8}$/;
    return (control: AbstractControl): ValidationErrors | null => {
      const value = String(control.value ?? '').trim();
      if (!value) return null;
      return regex.test(value)
        ? null
        : { dniInvalido: 'El DNI debe contener exactamente 8 números' };
    };
  },

  passwordCompleja(): ValidatorFn {
    const regex = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
    return (control: AbstractControl): ValidationErrors | null => {
      const value = String(control.value ?? '');
      if (!value) return null;
      return regex.test(value)
        ? null
        : {
            passwordDebil:
              'La contraseña debe tener entre 8 y 72 caracteres, al menos una letra y un número',
          };
    };
  },

  telefono(requerido: boolean): ValidatorFn {
    const regex = /^[0-9+() -]{9,20}$/;
    return (control: AbstractControl): ValidationErrors | null => {
      const value = String(control.value ?? '').trim();
      if (!value) {
        return requerido ? { required: 'Ingresa un teléfono de contacto' } : null;
      }
      return regex.test(value)
        ? null
        : { telefonoInvalido: 'Ingresa un teléfono válido de 9 a 20 caracteres' };
    };
  },

  fechaLaborable(permitirHoy: boolean): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const raw = String(control.value ?? '').trim();
      if (!raw) return null;
      const parts = raw.split('-').map(Number);
      if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
        return { fechaInvalida: 'Formato de fecha inválido' };
      }
      const [year, month, day] = parts;
      const selected = new Date(year, month - 1, day);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (permitirHoy ? selected < today : selected <= today) {
        return {
          fechaPasada: permitirHoy
            ? 'La fecha no puede estar en el pasado'
            : 'La fecha de la cita debe ser posterior a hoy',
        };
      }
      if (selected.getDay() === 0) {
        return { domingoNoLaborable: 'SmartDent no atiende los domingos' };
      }
      return null;
    };
  },

  rangoHorario(inicioField: string, finField: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const inicio = String(group.get(inicioField)?.value ?? '');
      const fin = String(group.get(finField)?.value ?? '');
      if (!inicio || !fin) return null;
      return fin > inicio
        ? null
        : { rangoHorarioInvalido: 'La hora de fin debe ser posterior a la hora de inicio' };
    };
  },

  confirmarPassword(passwordField: string, confirmField: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const pass = String(group.get(passwordField)?.value ?? '');
      const confirm = String(group.get(confirmField)?.value ?? '');
      if (!confirm) return null;
      return pass === confirm
        ? null
        : { passwordMismatch: 'Las contraseñas ingresadas no coinciden' };
    };
  },

  margenPositivo(precioField: string, costoField: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const precio = Number(group.get(precioField)?.value ?? 0);
      const costo = Number(group.get(costoField)?.value ?? 0);
      if (Number.isNaN(precio) || Number.isNaN(costo)) return null;
      return precio >= costo
        ? null
        : { margenNegativo: 'El precio al público no debe ser menor al costo operativo' };
    };
  },
} as const;

export function resolveControlError(control: AbstractControl | null): string | null {
  if (!control || !control.errors || !(control.touched || control.dirty)) {
    return null;
  }
  const errors = control.errors;
  if (typeof errors['server'] === 'string') return errors['server'];
  if (errors['required']) {
    return typeof errors['required'] === 'string'
      ? errors['required']
      : 'Este campo es obligatorio';
  }
  if (errors['email']) return 'Ingresa un correo electrónico válido';
  if (errors['minlength']) {
    const req = (errors['minlength'] as { requiredLength: number }).requiredLength;
    return `Debe contener al menos ${req} caracteres`;
  }
  if (errors['maxlength']) {
    const req = (errors['maxlength'] as { requiredLength: number }).requiredLength;
    return `No puede superar los ${req} caracteres`;
  }
  if (errors['min']) {
    const min = (errors['min'] as { min: number }).min;
    return `El valor mínimo permitido es ${min}`;
  }
  if (errors['max']) {
    const max = (errors['max'] as { max: number }).max;
    return `El valor máximo permitido es ${max}`;
  }

  for (const val of Object.values(errors)) {
    if (typeof val === 'string') return val;
  }
  return 'Revisa el valor ingresado';
}

export function extractApiErrorMessage(
  err: unknown,
  fallback = 'No se pudo completar la operación. Verifica la conexión con el servidor.'
): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'No se pudo conectar con SmartDent API (http://localhost:8080). Verifica que el backend esté activo.';
    }
    if (isApiErrorPayload(err.error)) {
      return err.error.message;
    }
    if (typeof err.error === 'string' && err.error.trim().length > 0) {
      return err.error;
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export function applyServerValidationErrors(form: FormGroup, err: unknown): string {
  if (err instanceof HttpErrorResponse && isApiErrorPayload(err.error) && err.error.fields) {
    for (const [field, message] of Object.entries(err.error.fields)) {
      const control = form.get(field);
      if (control) {
        control.setErrors({ ...(control.errors ?? {}), server: message });
        control.markAsTouched();
      }
    }
  }
  return extractApiErrorMessage(err);
}
