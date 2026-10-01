package pe.edu.utp.smartdent.service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.utp.smartdent.dto.cita.CitaResponse;
import pe.edu.utp.smartdent.dto.cita.CrearCitaRequest;
import pe.edu.utp.smartdent.dto.cita.DisponibilidadResponse;
import pe.edu.utp.smartdent.dto.cita.ReprogramarCitaRequest;
import pe.edu.utp.smartdent.entity.Cita;
import pe.edu.utp.smartdent.entity.CitaEstado;
import pe.edu.utp.smartdent.entity.Odontologo;
import pe.edu.utp.smartdent.entity.Servicio;
import pe.edu.utp.smartdent.entity.Usuario;
import pe.edu.utp.smartdent.exception.RecursoDuplicadoException;
import pe.edu.utp.smartdent.exception.RecursoNoEncontradoException;
import pe.edu.utp.smartdent.exception.ReglaNegocioException;
import pe.edu.utp.smartdent.repository.CitaRepository;
import pe.edu.utp.smartdent.repository.BloqueoHorarioRepository;
import pe.edu.utp.smartdent.repository.OdontologoRepository;
import pe.edu.utp.smartdent.repository.ServicioRepository;
import pe.edu.utp.smartdent.repository.UsuarioRepository;

@Service
public class CitaService {

    private static final LocalTime APERTURA = LocalTime.of(9, 0);
    private static final LocalTime CIERRE = LocalTime.of(18, 0);
    private static final int INTERVALO_MINUTOS = 30;
    private static final Set<CitaEstado> ESTADOS_ACTIVOS =
            EnumSet.of(CitaEstado.PENDIENTE, CitaEstado.CONFIRMADA);

    private final CitaRepository citaRepository;
    private final UsuarioRepository usuarioRepository;
    private final OdontologoRepository odontologoRepository;
    private final ServicioRepository servicioRepository;
    private final BloqueoHorarioRepository bloqueoHorarioRepository;

    public CitaService(
            CitaRepository citaRepository,
            UsuarioRepository usuarioRepository,
            OdontologoRepository odontologoRepository,
            ServicioRepository servicioRepository,
            BloqueoHorarioRepository bloqueoHorarioRepository) {
        this.citaRepository = citaRepository;
        this.usuarioRepository = usuarioRepository;
        this.odontologoRepository = odontologoRepository;
        this.servicioRepository = servicioRepository;
        this.bloqueoHorarioRepository = bloqueoHorarioRepository;
    }

    @Transactional
    public CitaResponse reservar(String emailPaciente, CrearCitaRequest request) {
        Usuario paciente = buscarPaciente(emailPaciente);
        Odontologo odontologo = buscarOdontologoActivoParaReserva(request.odontologoId());
        Servicio servicio = buscarServicioActivo(request.servicioId());
        validarOdontologoServicio(odontologo, servicio);

        LocalTime horaFin = validarHorario(request.fecha(), request.horaInicio(), servicio);
        validarCruces(paciente.getEmail(), odontologo.getId(), request.fecha(), request.horaInicio(), horaFin, null);

        Cita cita = new Cita();
        cita.setCodigo("CIT-" + UUID.randomUUID().toString().toUpperCase());
        cita.setPaciente(paciente);
        cita.setOdontologo(odontologo);
        cita.setServicio(servicio);
        cita.setFecha(request.fecha());
        cita.setHoraInicio(request.horaInicio());
        cita.setHoraFin(horaFin);
        cita.setEstado(CitaEstado.PENDIENTE);
        cita.setMotivo(normalizarOpcional(request.motivo()));
        cita.setTelefonoContacto(request.telefono().trim());
        asignarTratamientoYPrecio(cita, paciente, servicio);

        try {
            return CitaResponse.desde(citaRepository.saveAndFlush(cita));
        } catch (DataIntegrityViolationException exception) {
            throw new RecursoDuplicadoException("Ese horario acaba de ser reservado. Elige otro horario");
        }
    }

    @Transactional(readOnly = true)
    public List<CitaResponse> listarDelPaciente(String emailPaciente) {
        return citaRepository.findByPaciente_EmailIgnoreCaseOrderByFechaDescHoraInicioDesc(emailPaciente).stream()
                .map(CitaResponse::desde)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CitaResponse> listarDelOdontologo(String emailOdontologo) {
        buscarOdontologoPorEmail(emailOdontologo);
        return citaRepository.findByOdontologo_Usuario_EmailIgnoreCaseOrderByFechaAscHoraInicioAsc(emailOdontologo)
                .stream().map(CitaResponse::desde).toList();
    }

    @Transactional(readOnly = true)
    public List<CitaResponse> listarTodas() {
        return citaRepository.findAllByOrderByFechaDescHoraInicioDesc().stream()
                .map(CitaResponse::desde)
                .toList();
    }

    @Transactional(readOnly = true)
    public DisponibilidadResponse consultarDisponibilidad(Long odontologoId, Long servicioId, LocalDate fecha) {
        Odontologo odontologo = buscarOdontologoActivo(odontologoId);
        Servicio servicio = buscarServicioActivo(servicioId);
        validarOdontologoServicio(odontologo, servicio);
        validarFecha(fecha);

        List<LocalTime> horarios;
        if (fecha.getDayOfWeek() == DayOfWeek.SUNDAY) {
            horarios = List.of();
        } else {
            horarios = java.util.stream.Stream.iterate(
                            APERTURA,
                            hora -> !hora.plusMinutes(servicio.getDuracionMinutos()).isAfter(CIERRE),
                            hora -> hora.plusMinutes(INTERVALO_MINUTOS))
                    .filter(hora -> !citaRepository.existeCruceOdontologo(
                            odontologoId, fecha, hora,
                            hora.plusMinutes(servicio.getDuracionMinutos()), ESTADOS_ACTIVOS))
                    .filter(hora -> !bloqueoHorarioRepository.existeCruce(
                            odontologoId, fecha, hora,
                            hora.plusMinutes(servicio.getDuracionMinutos())))
                    .toList();
        }

        return new DisponibilidadResponse(
                odontologo.getId(), odontologo.getUsuario().getNombreCompleto(),
                servicio.getId(), servicio.getNombre(), fecha, horarios);
    }

    @Transactional
    public CitaResponse reprogramar(String emailPaciente, Long citaId, ReprogramarCitaRequest request) {
        Cita cita = citaRepository.findByIdAndPaciente_EmailIgnoreCase(citaId, emailPaciente)
                .orElseThrow(() -> new RecursoNoEncontradoException("Cita no encontrada"));
        validarCitaModificable(cita);
        buscarOdontologoActivoParaReserva(cita.getOdontologo().getId());
        LocalTime horaFin = validarHorario(request.fecha(), request.horaInicio(), cita.getServicio());
        validarCruces(emailPaciente, cita.getOdontologo().getId(), request.fecha(), request.horaInicio(), horaFin, citaId);

        cita.setFecha(request.fecha());
        cita.setHoraInicio(request.horaInicio());
        cita.setHoraFin(horaFin);
        cita.setEstado(CitaEstado.PENDIENTE);
        try {
            return CitaResponse.desde(citaRepository.saveAndFlush(cita));
        } catch (DataIntegrityViolationException exception) {
            throw new RecursoDuplicadoException("Ese horario acaba de ser reservado. Elige otro horario");
        }
    }

    @Transactional
    public CitaResponse cancelarPorPaciente(String emailPaciente, Long citaId) {
        Cita cita = citaRepository.findByIdAndPaciente_EmailIgnoreCase(citaId, emailPaciente)
                .orElseThrow(() -> new RecursoNoEncontradoException("Cita no encontrada"));
        validarCitaModificable(cita);
        cita.setEstado(CitaEstado.CANCELADA);
        return CitaResponse.desde(cita);
    }

    @Transactional
    public CitaResponse cambiarEstadoPorOdontologo(String emailOdontologo, Long citaId, CitaEstado nuevoEstado) {
        Cita cita = citaRepository.findByIdAndOdontologo_Usuario_EmailIgnoreCase(citaId, emailOdontologo)
                .orElseThrow(() -> new RecursoNoEncontradoException("Cita no encontrada en tu agenda"));
        return cambiarEstado(cita, nuevoEstado);
    }

    @Transactional
    public CitaResponse cambiarEstadoPorAdmin(Long citaId, CitaEstado nuevoEstado) {
        Cita cita = citaRepository.findById(citaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Cita no encontrada"));
        return cambiarEstado(cita, nuevoEstado);
    }

    private CitaResponse cambiarEstado(Cita cita, CitaEstado nuevoEstado) {
        if (cita.getEstado() == nuevoEstado) {
            return CitaResponse.desde(cita);
        }
        boolean transicionValida = switch (cita.getEstado()) {
            case PENDIENTE -> nuevoEstado == CitaEstado.CONFIRMADA || nuevoEstado == CitaEstado.CANCELADA;
            case CONFIRMADA -> nuevoEstado == CitaEstado.ATENDIDA || nuevoEstado == CitaEstado.CANCELADA;
            case ATENDIDA, CANCELADA -> false;
        };
        if (!transicionValida) {
            throw new ReglaNegocioException(
                    "No se puede cambiar una cita " + cita.getEstado() + " a " + nuevoEstado);
        }
        cita.setEstado(nuevoEstado);
        return CitaResponse.desde(cita);
    }

    private Usuario buscarPaciente(String email) {
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RecursoNoEncontradoException("Paciente no encontrado"));
        if (!usuario.isActivo()) {
            throw new ReglaNegocioException("La cuenta del paciente está inactiva");
        }
        return usuario;
    }

    private Odontologo buscarOdontologoActivo(Long id) {
        Odontologo odontologo = odontologoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Odontólogo no encontrado"));
        if (!odontologo.getUsuario().isActivo()) {
            throw new ReglaNegocioException("El odontólogo no está disponible");
        }
        return odontologo;
    }

    private Odontologo buscarOdontologoActivoParaReserva(Long id) {
        Odontologo odontologo = odontologoRepository.buscarPorIdParaReserva(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Odontólogo no encontrado"));
        if (!odontologo.getUsuario().isActivo()) {
            throw new ReglaNegocioException("El odontólogo no está disponible");
        }
        return odontologo;
    }

    private Odontologo buscarOdontologoPorEmail(String email) {
        return odontologoRepository.findByUsuarioEmailIgnoreCase(email)
                .orElseThrow(() -> new RecursoNoEncontradoException("Odontólogo no encontrado"));
    }

    private Servicio buscarServicioActivo(Long id) {
        Servicio servicio = servicioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Servicio no encontrado"));
        if (!servicio.isActivo()) {
            throw new ReglaNegocioException("El servicio no está disponible");
        }
        return servicio;
    }

    private void validarOdontologoServicio(Odontologo odontologo, Servicio servicio) {
        boolean compatible = odontologo.getServicios().stream()
                .anyMatch(asignado -> asignado.getId().equals(servicio.getId()));
        if (!compatible) {
            throw new ReglaNegocioException("El odontólogo seleccionado no ofrece ese servicio");
        }
    }

    private LocalTime validarHorario(LocalDate fecha, LocalTime horaInicio, Servicio servicio) {
        validarFecha(fecha);
        if (fecha.getDayOfWeek() == DayOfWeek.SUNDAY) {
            throw new ReglaNegocioException("La clínica no atiende los domingos");
        }
        if (horaInicio.getSecond() != 0 || horaInicio.getNano() != 0
                || (horaInicio.getMinute() != 0 && horaInicio.getMinute() != 30)) {
            throw new ReglaNegocioException("Selecciona un horario en intervalos de 30 minutos");
        }
        LocalTime horaFin = horaInicio.plusMinutes(servicio.getDuracionMinutos());
        if (horaInicio.isBefore(APERTURA) || horaFin.isAfter(CIERRE)) {
            throw new ReglaNegocioException("El horario de atención es de 09:00 a 18:00");
        }
        return horaFin;
    }

    private void validarFecha(LocalDate fecha) {
        if (fecha == null || !fecha.isAfter(LocalDate.now())) {
            throw new ReglaNegocioException("La fecha debe ser posterior a hoy");
        }
    }

    private void validarCruces(
            String emailPaciente, Long odontologoId, LocalDate fecha,
            LocalTime horaInicio, LocalTime horaFin, Long excluirId) {
        boolean cruceOdontologo = excluirId == null
                ? citaRepository.existeCruceOdontologo(odontologoId, fecha, horaInicio, horaFin, ESTADOS_ACTIVOS)
                : citaRepository.existeCruceOdontologoExcluyendo(
                        odontologoId, fecha, horaInicio, horaFin, ESTADOS_ACTIVOS, excluirId);
        if (cruceOdontologo) {
            throw new RecursoDuplicadoException("El odontólogo ya tiene una cita en ese horario");
        }
        if (bloqueoHorarioRepository.existeCruce(odontologoId, fecha, horaInicio, horaFin)) {
            throw new RecursoDuplicadoException("El odontólogo no está disponible en ese horario");
        }
        boolean crucePaciente = excluirId == null
                ? citaRepository.existeCrucePaciente(emailPaciente, fecha, horaInicio, horaFin, ESTADOS_ACTIVOS)
                : citaRepository.existeCrucePacienteExcluyendo(
                        emailPaciente, fecha, horaInicio, horaFin, ESTADOS_ACTIVOS, excluirId);
        if (crucePaciente) {
            throw new RecursoDuplicadoException("Ya tienes otra cita en ese horario");
        }
    }

    private void validarCitaModificable(Cita cita) {
        if (!ESTADOS_ACTIVOS.contains(cita.getEstado())) {
            throw new ReglaNegocioException("La cita ya no se puede modificar");
        }
    }

    private void asignarTratamientoYPrecio(Cita cita, Usuario paciente, Servicio servicio) {
        int totalSesiones = Math.max(1, servicio.getSesionesIncluidas());
        var ultimaVigente = citaRepository
                .findByPaciente_IdAndServicio_IdOrderByCreadoEnDesc(paciente.getId(), servicio.getId())
                .stream()
                .filter(anterior -> anterior.getEstado() != CitaEstado.CANCELADA)
                .findFirst();

        if (totalSesiones > 1 && ultimaVigente.isPresent()) {
            Cita anterior = ultimaVigente.get();
            if (anterior.getTratamientoCodigo() == null) {
                anterior.setTratamientoCodigo("TRA-" + UUID.randomUUID().toString().toUpperCase());
                anterior.setNumeroSesion(1);
                anterior.setTotalSesiones(totalSesiones);
            }
            if (anterior.getNumeroSesion() < anterior.getTotalSesiones()) {
                cita.setTratamientoCodigo(anterior.getTratamientoCodigo());
                cita.setNumeroSesion(anterior.getNumeroSesion() + 1);
                cita.setTotalSesiones(anterior.getTotalSesiones());
                cita.setPrecioPactado(BigDecimal.ZERO);
                return;
            }
        }

        cita.setTratamientoCodigo("TRA-" + UUID.randomUUID().toString().toUpperCase());
        cita.setNumeroSesion(1);
        cita.setTotalSesiones(totalSesiones);
        cita.setPrecioPactado(servicio.getPrecio());
    }

    private String normalizarOpcional(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
