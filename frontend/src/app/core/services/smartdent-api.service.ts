import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ActualizarOdontologoRequest,
  AdminFinanzasResponse,
  AdminResumenResponse,
  BloqueoHorarioRequest,
  BloqueoHorarioResponse,
  CitaEstado,
  CitaResponse,
  ConfiguracionPacienteRequest,
  ConfiguracionPacienteResponse,
  CostoFijoRequest,
  CostoFijoResponse,
  CrearCitaRequest,
  CrearMensajeContactoRequest,
  CrearOdontologoRequest,
  DisponibilidadResponse,
  GuardarHistoriaClinicaRequest,
  HistoriaClinicaResponse,
  LoginRequest,
  LoginResponse,
  MensajeContactoEstado,
  MensajeContactoResponse,
  NotificacionResponse,
  OdontologoAdminResponse,
  OdontologoResponse,
  PerfilResponse,
  RecuperarPasswordRequest,
  RegistroPacienteRequest,
  RegistroPacienteResponse,
  ReprogramarCitaRequest,
  ResetPasswordRequest,
  ServicioAdminResponse,
  ServicioRequest,
  ServicioResponse,
  UsuarioAdminResponse,
  VerificarCuentaRequest,
} from '../models/smartdent.models';

@Injectable({ providedIn: 'root' })
export class SmartDentApiService {
  private readonly http = inject(HttpClient);

  // ==================== AUTH ====================
  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', payload);
  }

  registrarPaciente(payload: RegistroPacienteRequest): Observable<RegistroPacienteResponse> {
    return this.http.post<RegistroPacienteResponse>('/api/auth/registro', payload);
  }

  obtenerPerfil(): Observable<PerfilResponse> {
    return this.http.get<PerfilResponse>('/api/auth/perfil');
  }

  solicitarRecuperacion(payload: RecuperarPasswordRequest): Observable<void> {
    return this.http.post<void>('/api/auth/recuperar-password', payload);
  }

  resetearPassword(payload: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>('/api/auth/reset-password', payload);
  }

  verificarCuenta(payload: VerificarCuentaRequest): Observable<void> {
    return this.http.post<void>('/api/auth/verificar-cuenta', payload);
  }

  // ==================== CATÁLOGO PÚBLICO ====================
  listarServiciosPublicos(): Observable<readonly ServicioResponse[]> {
    return this.http.get<readonly ServicioResponse[]>('/api/servicios');
  }

  obtenerServicioPublico(id: number): Observable<ServicioResponse> {
    return this.http.get<ServicioResponse>(`/api/servicios/${id}`);
  }

  listarOdontologosPublicos(servicioId?: number): Observable<readonly OdontologoResponse[]> {
    let params = new HttpParams();
    if (servicioId !== undefined) {
      params = params.set('servicioId', servicioId);
    }
    return this.http.get<readonly OdontologoResponse[]>('/api/odontologos', { params });
  }

  enviarMensajeContacto(payload: CrearMensajeContactoRequest): Observable<MensajeContactoResponse> {
    return this.http.post<MensajeContactoResponse>('/api/contacto/mensajes', payload);
  }

  // ==================== PACIENTE ====================
  listarMisCitas(): Observable<readonly CitaResponse[]> {
    return this.http.get<readonly CitaResponse[]>('/api/pacientes/citas');
  }

  consultarDisponibilidad(
    odontologoId: number,
    servicioId: number,
    fecha: string
  ): Observable<DisponibilidadResponse> {
    const params = new HttpParams()
      .set('odontologoId', odontologoId)
      .set('servicioId', servicioId)
      .set('fecha', fecha);
    return this.http.get<DisponibilidadResponse>('/api/pacientes/citas/disponibilidad', {
      params,
    });
  }

  reservarCita(payload: CrearCitaRequest): Observable<CitaResponse> {
    return this.http.post<CitaResponse>('/api/pacientes/citas', payload);
  }

  reprogramarCita(id: number, payload: ReprogramarCitaRequest): Observable<CitaResponse> {
    return this.http.put<CitaResponse>(`/api/pacientes/citas/${id}/reprogramar`, payload);
  }

  cancelarCitaPaciente(id: number): Observable<CitaResponse> {
    return this.http.patch<CitaResponse>(`/api/pacientes/citas/${id}/cancelar`, {});
  }

  listarMisHistoriasClinicas(): Observable<readonly HistoriaClinicaResponse[]> {
    return this.http.get<readonly HistoriaClinicaResponse[]>('/api/pacientes/historias-clinicas');
  }

  obtenerConfiguracionPaciente(): Observable<ConfiguracionPacienteResponse> {
    return this.http.get<ConfiguracionPacienteResponse>('/api/pacientes/configuracion');
  }

  actualizarConfiguracionPaciente(
    payload: ConfiguracionPacienteRequest
  ): Observable<ConfiguracionPacienteResponse> {
    return this.http.put<ConfiguracionPacienteResponse>('/api/pacientes/configuracion', payload);
  }

  // ==================== ODONTÓLOGO ====================
  listarMiAgendaOdontologo(): Observable<readonly CitaResponse[]> {
    return this.http.get<readonly CitaResponse[]>('/api/odontologos/mi-agenda');
  }

  cambiarEstadoCitaOdontologo(id: number, estado: CitaEstado): Observable<CitaResponse> {
    return this.http.patch<CitaResponse>(`/api/odontologos/citas/${id}/estado`, { estado });
  }

  listarMisBloqueos(): Observable<readonly BloqueoHorarioResponse[]> {
    return this.http.get<readonly BloqueoHorarioResponse[]>('/api/odontologos/bloqueos');
  }

  crearBloqueo(payload: BloqueoHorarioRequest): Observable<BloqueoHorarioResponse> {
    return this.http.post<BloqueoHorarioResponse>('/api/odontologos/bloqueos', payload);
  }

  eliminarBloqueo(id: number): Observable<void> {
    return this.http.delete<void>(`/api/odontologos/bloqueos/${id}`);
  }

  consultarHistoriaPaciente(pacienteEmail: string): Observable<HistoriaClinicaResponse> {
    const params = new HttpParams().set('pacienteEmail', pacienteEmail);
    return this.http.get<HistoriaClinicaResponse>('/api/odontologos/historias-clinicas', {
      params,
    });
  }

  guardarHistoriaPaciente(
    pacienteEmail: string,
    payload: GuardarHistoriaClinicaRequest
  ): Observable<HistoriaClinicaResponse> {
    const params = new HttpParams().set('pacienteEmail', pacienteEmail);
    return this.http.put<HistoriaClinicaResponse>(
      '/api/odontologos/historias-clinicas',
      payload,
      { params }
    );
  }

  // ==================== ADMINISTRADOR ====================
  listarTodasLasCitas(): Observable<readonly CitaResponse[]> {
    return this.http.get<readonly CitaResponse[]>('/api/admin/citas');
  }

  obtenerResumenAdmin(): Observable<AdminResumenResponse> {
    return this.http.get<AdminResumenResponse>('/api/admin/citas/resumen');
  }

  cambiarEstadoCitaAdmin(id: number, estado: CitaEstado): Observable<CitaResponse> {
    return this.http.patch<CitaResponse>(`/api/admin/citas/${id}/estado`, { estado });
  }

  listarServiciosAdmin(): Observable<readonly ServicioAdminResponse[]> {
    return this.http.get<readonly ServicioAdminResponse[]>('/api/admin/servicios');
  }

  crearServicioAdmin(payload: ServicioRequest): Observable<ServicioAdminResponse> {
    return this.http.post<ServicioAdminResponse>('/api/admin/servicios', payload);
  }

  actualizarServicioAdmin(
    id: number,
    payload: ServicioRequest
  ): Observable<ServicioAdminResponse> {
    return this.http.put<ServicioAdminResponse>(`/api/admin/servicios/${id}`, payload);
  }

  cambiarEstadoServicioAdmin(
    id: number,
    activo: boolean
  ): Observable<ServicioAdminResponse> {
    const params = new HttpParams().set('activo', activo);
    return this.http.patch<ServicioAdminResponse>(
      `/api/admin/servicios/${id}/estado`,
      {},
      { params }
    );
  }

  listarOdontologosAdmin(): Observable<readonly OdontologoAdminResponse[]> {
    return this.http.get<readonly OdontologoAdminResponse[]>('/api/admin/odontologos');
  }

  crearOdontologoAdmin(payload: CrearOdontologoRequest): Observable<OdontologoAdminResponse> {
    return this.http.post<OdontologoAdminResponse>('/api/admin/odontologos', payload);
  }

  actualizarOdontologoAdmin(
    id: number,
    payload: ActualizarOdontologoRequest
  ): Observable<OdontologoAdminResponse> {
    return this.http.put<OdontologoAdminResponse>(`/api/admin/odontologos/${id}`, payload);
  }

  listarUsuariosAdmin(): Observable<readonly UsuarioAdminResponse[]> {
    return this.http.get<readonly UsuarioAdminResponse[]>('/api/admin/usuarios');
  }

  obtenerFinanzasAdmin(): Observable<AdminFinanzasResponse> {
    return this.http.get<AdminFinanzasResponse>('/api/admin/reportes/finanzas');
  }

  obtenerCostosFijos(): Observable<CostoFijoResponse> {
    return this.http.get<CostoFijoResponse>('/api/admin/reportes/costos-fijos');
  }

  actualizarCostosFijos(payload: CostoFijoRequest): Observable<CostoFijoResponse> {
    return this.http.put<CostoFijoResponse>('/api/admin/reportes/costos-fijos', payload);
  }

  listarMensajesContactoAdmin(): Observable<readonly MensajeContactoResponse[]> {
    return this.http.get<readonly MensajeContactoResponse[]>('/api/admin/mensajes');
  }

  cambiarEstadoMensajeAdmin(
    id: number,
    estado: MensajeContactoEstado
  ): Observable<MensajeContactoResponse> {
    return this.http.patch<MensajeContactoResponse>(`/api/admin/mensajes/${id}/estado`, {
      estado,
    });
  }

  // ==================== NOTIFICACIONES ====================
  listarMisNotificaciones(): Observable<readonly NotificacionResponse[]> {
    return this.http.get<readonly NotificacionResponse[]>('/api/notificaciones');
  }

  marcarNotificacionLeida(id: number): Observable<NotificacionResponse> {
    return this.http.patch<NotificacionResponse>(`/api/notificaciones/${id}/leer`, {});
  }

  marcarTodasNotificacionesLeidas(): Observable<void> {
    return this.http.patch<void>('/api/notificaciones/leer-todas', {});
  }
}
