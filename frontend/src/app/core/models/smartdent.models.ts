export type RolNombre = 'PACIENTE' | 'ODONTOLOGO' | 'ADMIN';
export type CitaEstado = 'PENDIENTE' | 'CONFIRMADA' | 'ATENDIDA' | 'CANCELADA';
export type EtapaTratamiento = 'CONSULTA' | 'DIAGNOSTICO' | 'TRATAMIENTO' | 'COMPLETADO';
export type MensajeContactoEstado = 'NUEVO' | 'LEIDO' | 'RESPONDIDO';
export type NotificacionTipo =
  | 'CITA_CREADA'
  | 'CITA_REPROGRAMADA'
  | 'CITA_CONFIRMADA'
  | 'CITA_CANCELADA'
  | 'CITA_ATENDIDA'
  | 'CONTACTO_NUEVO';

export interface NotificacionResponse {
  readonly id: number;
  readonly tipo: NotificacionTipo;
  readonly titulo: string;
  readonly mensaje: string;
  readonly vistaDestino: string;
  readonly referenciaCodigo: string | null;
  readonly leida: boolean;
  readonly creadoEn: string;
}

export interface PerfilResponse {
  readonly id: number;
  readonly nombreCompleto: string;
  readonly dni: string;
  readonly email: string;
  readonly telefono: string | null;
  readonly rol: RolNombre;
}

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface LoginResponse {
  readonly token: string;
  readonly tokenType: string;
  readonly expiresIn: number;
  readonly usuario: PerfilResponse;
}

export interface RegistroPacienteRequest {
  readonly nombreCompleto: string;
  readonly dni: string;
  readonly email: string;
  readonly password: string;
  readonly telefono?: string;
}

export interface RegistroPacienteResponse {
  readonly id: number;
  readonly nombreCompleto: string;
  readonly dni: string;
  readonly email: string;
  readonly telefono: string | null;
  readonly rol: RolNombre;
}

export interface RecuperarPasswordRequest {
  readonly email: string;
}

export interface ResetPasswordRequest {
  readonly token: string;
  readonly nuevaPassword: string;
}

export interface VerificarCuentaRequest {
  readonly token: string;
}

export interface AuthSession {
  readonly id: number;
  readonly nombreCompleto: string;
  readonly dni: string;
  readonly email: string;
  readonly telefono: string | null;
  readonly rol: RolNombre;
  readonly token: string;
  readonly tokenType: string;
  readonly expiresAt: number;
}

export function isRolNombre(value: unknown): value is RolNombre {
  return value === 'PACIENTE' || value === 'ODONTOLOGO' || value === 'ADMIN';
}

export function isAuthSession(value: unknown): value is AuthSession {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['id'] === 'number' &&
    typeof candidate['nombreCompleto'] === 'string' &&
    typeof candidate['dni'] === 'string' &&
    typeof candidate['email'] === 'string' &&
    isRolNombre(candidate['rol']) &&
    typeof candidate['token'] === 'string' &&
    typeof candidate['expiresAt'] === 'number'
  );
}

export interface ServicioResponse {
  readonly id: number;
  readonly codigo: string;
  readonly nombre: string;
  readonly especialidad: string;
  readonly descripcion: string;
  readonly precio: number;
  readonly duracionMinutos: number;
  readonly sesionesIncluidas: number;
  readonly imagenUrl: string | null;
}

export interface ServicioAdminResponse {
  readonly id: number;
  readonly codigo: string;
  readonly nombre: string;
  readonly especialidad: string;
  readonly descripcion: string;
  readonly precio: number;
  readonly costo: number;
  readonly duracionMinutos: number;
  readonly imagenUrl: string | null;
  readonly activo: boolean;
  readonly actualizadoEn: string;
}

export interface ServicioRequest {
  readonly codigo: string;
  readonly nombre: string;
  readonly especialidad: string;
  readonly descripcion: string;
  readonly precio: number;
  readonly costo: number;
  readonly duracionMinutos: number;
  readonly imagenUrl: string;
  readonly activo: boolean;
}

export interface OdontologoResponse {
  readonly id: number;
  readonly codigo: string;
  readonly nombreCompleto: string;
  readonly especialidad: string;
  readonly fotoUrl: string | null;
  readonly servicios: readonly string[];
}

export interface OdontologoAdminResponse {
  readonly id: number;
  readonly codigo: string;
  readonly nombreCompleto: string;
  readonly dni: string;
  readonly email: string;
  readonly telefono: string | null;
  readonly especialidad: string;
  readonly colegiatura: string;
  readonly fotoUrl: string | null;
  readonly activo: boolean;
  readonly servicioIds: readonly number[];
}

export interface CrearOdontologoRequest {
  readonly codigo: string;
  readonly nombreCompleto: string;
  readonly dni: string;
  readonly email: string;
  readonly password: string;
  readonly telefono: string;
  readonly especialidad: string;
  readonly colegiatura: string;
  readonly fotoUrl: string;
  readonly servicioIds: readonly number[];
}

export interface ActualizarOdontologoRequest {
  readonly nombreCompleto: string;
  readonly telefono: string;
  readonly especialidad: string;
  readonly colegiatura: string;
  readonly fotoUrl: string;
  readonly activo: boolean;
  readonly servicioIds: readonly number[];
}

export interface CitaResponse {
  readonly id: number;
  readonly codigo: string;
  readonly pacienteId: number;
  readonly pacienteNombre: string;
  readonly pacienteEmail: string;
  readonly odontologoId: number;
  readonly odontologoNombre: string;
  readonly servicioId: number;
  readonly servicioNombre: string;
  readonly fecha: string;
  readonly horaInicio: string;
  readonly horaFin: string;
  readonly estado: CitaEstado;
  readonly motivo: string | null;
  readonly telefonoContacto: string;
  readonly precioPactado: number;
  readonly tratamientoCodigo: string | null;
  readonly numeroSesion: number;
  readonly totalSesiones: number;
  readonly sesionesRestantes: number;
  readonly creadoEn: string;
}

export interface CrearCitaRequest {
  readonly odontologoId: number;
  readonly servicioId: number;
  readonly fecha: string;
  readonly horaInicio: string;
  readonly motivo: string;
  readonly telefono: string;
}

export interface ReprogramarCitaRequest {
  readonly fecha: string;
  readonly horaInicio: string;
}

export interface DisponibilidadResponse {
  readonly odontologoId: number;
  readonly odontologoNombre: string;
  readonly servicioId: number;
  readonly servicioNombre: string;
  readonly fecha: string;
  readonly horariosDisponibles: readonly string[];
}

export interface HistoriaClinicaResponse {
  readonly id: number | null;
  readonly codigo: string | null;
  readonly pacienteId: number;
  readonly pacienteNombre: string;
  readonly pacienteEmail: string;
  readonly odontologoId: number;
  readonly odontologoNombre: string;
  readonly odontologoEmail: string;
  readonly ultimaCitaId: number | null;
  readonly servicioNombre: string | null;
  readonly numeroSesion: number | null;
  readonly totalSesiones: number | null;
  readonly etapaTratamiento: EtapaTratamiento;
  readonly alergias: string | null;
  readonly diagnostico: string | null;
  readonly tratamiento: string | null;
  readonly indicaciones: string | null;
  readonly proximoControl: string | null;
  readonly observaciones: string | null;
  readonly actualizadoEn: string | null;
}

export interface GuardarHistoriaClinicaRequest {
  readonly citaId: number | null;
  readonly etapaTratamiento: EtapaTratamiento;
  readonly alergias: string;
  readonly diagnostico: string;
  readonly tratamiento: string;
  readonly indicaciones: string;
  readonly proximoControl: string | null;
  readonly observaciones: string;
}

export interface BloqueoHorarioResponse {
  readonly id: number;
  readonly fecha: string;
  readonly horaInicio: string;
  readonly horaFin: string;
  readonly motivo: string;
  readonly creadoEn: string;
}

export interface BloqueoHorarioRequest {
  readonly fecha: string;
  readonly horaInicio: string;
  readonly horaFin: string;
  readonly motivo: string;
}

export interface ConfiguracionPacienteResponse {
  readonly telefono: string | null;
  readonly recordatoriosEmail: boolean;
  readonly recordatoriosTelefono: boolean;
}

export interface ConfiguracionPacienteRequest {
  readonly telefono: string;
  readonly recordatoriosEmail: boolean;
  readonly recordatoriosTelefono: boolean;
}

export interface CrearMensajeContactoRequest {
  readonly nombre: string;
  readonly email: string;
  readonly telefono: string;
  readonly asunto: string;
  readonly mensaje: string;
}

export interface MensajeContactoResponse {
  readonly id: number;
  readonly nombre: string;
  readonly email: string;
  readonly telefono: string | null;
  readonly asunto: string;
  readonly mensaje: string;
  readonly estado: MensajeContactoEstado;
  readonly creadoEn: string;
  readonly actualizadoEn: string;
}

export interface UsuarioAdminResponse {
  readonly id: number;
  readonly nombreCompleto: string;
  readonly dni: string;
  readonly email: string;
  readonly telefono: string | null;
  readonly rol: RolNombre;
  readonly activo: boolean;
  readonly creadoEn: string;
}

export interface AdminResumenResponse {
  readonly totalCitas: number;
  readonly citasPendientes: number;
  readonly citasAtendidas: number;
  readonly citasCanceladas: number;
  readonly pacientesRegistrados: number;
  readonly odontologosActivos: number;
  readonly serviciosActivos: number;
  readonly citasActivas: number;
  readonly citasHoy: number;
  readonly ingresoEstimado: number;
}

export interface FinanzaMensualItem {
  readonly periodo: string;
  readonly etiqueta: string;
  readonly ingresos: number;
  readonly costos: number;
}

export interface DemandaServicioItem {
  readonly servicio: string;
  readonly reservas: number;
}

export interface AdminFinanzasResponse {
  readonly ingresosMesActual: number;
  readonly costosVariablesMesActual: number;
  readonly gastosFijosMensuales: number;
  readonly utilidadMesActual: number;
  readonly margenMesActual: number;
  readonly mensual: readonly FinanzaMensualItem[];
  readonly demandaServicios: readonly DemandaServicioItem[];
}

export interface CostoFijoResponse {
  readonly alquiler: number;
  readonly planilla: number;
  readonly servicios: number;
  readonly marketing: number;
  readonly otros: number;
  readonly actualizadoEn: string | null;
}

export interface CostoFijoRequest {
  readonly alquiler: number;
  readonly planilla: number;
  readonly servicios: number;
  readonly marketing: number;
  readonly otros: number;
}

export interface ApiErrorPayload {
  readonly timestamp?: string;
  readonly status: number;
  readonly error: string;
  readonly message: string;
  readonly fields?: Readonly<Record<string, string>>;
}

export function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate['status'] === 'number' && typeof candidate['message'] === 'string';
}
