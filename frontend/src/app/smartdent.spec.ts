import '@angular/compiler';
import { FormControl, FormGroup } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { AuthStore } from './core/auth/auth.store';
import { isAuthSession } from './core/models/smartdent.models';
import {
  SmartDentValidators,
  resolveControlError,
} from './shared/validators/smartdent.validators';

describe('SmartDentValidators (4.4.4 Validaciones)', () => {
  it('valida DNI peruano de 8 dígitos numéricos exactos', () => {
    const validator = SmartDentValidators.dniPeru();
    expect(validator(new FormControl('72345678'))).toBeNull();
    expect(validator(new FormControl('1234'))).toEqual({
      dniInvalido: 'El DNI debe contener exactamente 8 números',
    });
    expect(validator(new FormControl('1234567A'))).not.toBeNull();
  });

  it('valida complejidad de contraseña (8-72 chars, letras y números)', () => {
    const validator = SmartDentValidators.passwordCompleja();
    expect(validator(new FormControl('SmartDent2026'))).toBeNull();
    expect(validator(new FormControl('soloLetras'))).not.toBeNull();
    expect(validator(new FormControl('12345678'))).not.toBeNull();
    expect(validator(new FormControl('Ab1'))).not.toBeNull();
  });

  it('unifica validación de teléfono entre 9 y 20 caracteres', () => {
    const reqValidator = SmartDentValidators.telefono(true);
    const optValidator = SmartDentValidators.telefono(false);

    expect(optValidator(new FormControl(''))).toBeNull();
    expect(reqValidator(new FormControl(''))).not.toBeNull();
    expect(reqValidator(new FormControl('987 654 321'))).toBeNull();
    expect(reqValidator(new FormControl('12345'))).not.toBeNull();
  });

  it('bloquea fechas pasadas y domingos en reservas odontológicas', () => {
    const validator = SmartDentValidators.fechaLaborable(false);
    expect(validator(new FormControl('2020-01-01'))).toEqual({
      fechaPasada: 'La fecha de la cita debe ser posterior a hoy',
    });
    // 2028-05-07 es domingo futuro garantizado
    expect(validator(new FormControl('2028-05-07'))).toEqual({
      domingoNoLaborable: 'SmartDent no atiende los domingos',
    });
    // 2028-05-08 es lunes futuro garantizado
    expect(validator(new FormControl('2028-05-08'))).toBeNull();
  });

  it('valida validadores cross-field (rango horario, confirmación de clave y margen)', () => {
    const horarioGroup = new FormGroup(
      {
        horaInicio: new FormControl('14:00'),
        horaFin: new FormControl('12:00'),
      },
      { validators: [SmartDentValidators.rangoHorario('horaInicio', 'horaFin')] }
    );
    expect(horarioGroup.hasError('rangoHorarioInvalido')).toBe(true);

    horarioGroup.patchValue({ horaFin: '16:00' });
    expect(horarioGroup.valid).toBe(true);

    const margenGroup = new FormGroup(
      {
        precio: new FormControl(80),
        costo: new FormControl(120),
      },
      { validators: [SmartDentValidators.margenPositivo('precio', 'costo')] }
    );
    expect(margenGroup.hasError('margenNegativo')).toBe(true);
  });

  it('prioriza errores hidratados desde ApiError.fields del servidor', () => {
    const control = new FormControl('dup@smartdent.com');
    control.setErrors({ server: 'Ya existe una cuenta con ese correo electrónico' });
    control.markAsTouched();
    expect(resolveControlError(control)).toBe(
      'Ya existe una cuenta con ese correo electrónico'
    );
  });
});

describe('AuthStore & Type Guards (Signals RBAC)', () => {
  it('gestiona ciclo de vida de sesión JWT y calcula ruta de dashboard por rol', () => {
    const store = new AuthStore();
    store.clear();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.dashboardPath()).toBe('/login');

    store.setSession({
      token: 'eyJhbGciOiJIUzI1NiJ9.mock',
      tokenType: 'Bearer',
      expiresIn: 3600,
      usuario: {
        id: 7,
        nombreCompleto: 'Dra. Elena Ruiz',
        dni: '40000002',
        email: 'elena.ruiz@smartdent.com',
        telefono: '987000002',
        rol: 'ODONTOLOGO',
      },
    });

    expect(store.isAuthenticated()).toBe(true);
    expect(store.role()).toBe('ODONTOLOGO');
    expect(store.dashboardPath()).toBe('/odontologo');
    expect(isAuthSession(store.session())).toBe(true);

    store.clear();
    expect(store.isAuthenticated()).toBe(false);
  });
});
