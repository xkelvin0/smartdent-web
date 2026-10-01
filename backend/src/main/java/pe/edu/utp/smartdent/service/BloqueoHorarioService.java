package pe.edu.utp.smartdent.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.utp.smartdent.dto.bloqueo.BloqueoHorarioRequest;
import pe.edu.utp.smartdent.dto.bloqueo.BloqueoHorarioResponse;
import pe.edu.utp.smartdent.entity.BloqueoHorario;
import pe.edu.utp.smartdent.entity.CitaEstado;
import pe.edu.utp.smartdent.entity.Odontologo;
import pe.edu.utp.smartdent.exception.RecursoDuplicadoException;
import pe.edu.utp.smartdent.exception.RecursoNoEncontradoException;
import pe.edu.utp.smartdent.exception.ReglaNegocioException;
import pe.edu.utp.smartdent.repository.BloqueoHorarioRepository;
import pe.edu.utp.smartdent.repository.CitaRepository;
import pe.edu.utp.smartdent.repository.OdontologoRepository;

@Service
public class BloqueoHorarioService {

    private static final LocalTime APERTURA = LocalTime.of(9, 0);
    private static final LocalTime CIERRE = LocalTime.of(18, 0);
    private static final Set<CitaEstado> ESTADOS_ACTIVOS =
            EnumSet.of(CitaEstado.PENDIENTE, CitaEstado.CONFIRMADA);

    private final BloqueoHorarioRepository bloqueoRepository;
    private final OdontologoRepository odontologoRepository;
    private final CitaRepository citaRepository;

    public BloqueoHorarioService(
            BloqueoHorarioRepository bloqueoRepository,
            OdontologoRepository odontologoRepository,
            CitaRepository citaRepository) {
        this.bloqueoRepository = bloqueoRepository;
        this.odontologoRepository = odontologoRepository;
        this.citaRepository = citaRepository;
    }

    @Transactional(readOnly = true)
    public List<BloqueoHorarioResponse> listar(String email) {
        buscarOdontologo(email);
        return bloqueoRepository
                .findByOdontologo_Usuario_EmailIgnoreCaseAndFechaGreaterThanEqualOrderByFechaAscHoraInicioAsc(
                        email, LocalDate.now())
                .stream().map(BloqueoHorarioResponse::desde).toList();
    }

    @Transactional
    public BloqueoHorarioResponse crear(String email, BloqueoHorarioRequest request) {
        Odontologo odontologo = buscarOdontologo(email);
        validarRango(request);
        if (citaRepository.existeCruceOdontologo(
                odontologo.getId(), request.fecha(), request.horaInicio(), request.horaFin(), ESTADOS_ACTIVOS)) {
            throw new ReglaNegocioException("Ya existe una cita durante ese periodo");
        }
        if (bloqueoRepository.existeCruce(
                odontologo.getId(), request.fecha(), request.horaInicio(), request.horaFin())) {
            throw new RecursoDuplicadoException("Ese periodo ya está bloqueado total o parcialmente");
        }

        BloqueoHorario bloqueo = new BloqueoHorario();
        bloqueo.setOdontologo(odontologo);
        bloqueo.setFecha(request.fecha());
        bloqueo.setHoraInicio(request.horaInicio());
        bloqueo.setHoraFin(request.horaFin());
        bloqueo.setMotivo(request.motivo().trim());
        try {
            return BloqueoHorarioResponse.desde(bloqueoRepository.saveAndFlush(bloqueo));
        } catch (DataIntegrityViolationException exception) {
            throw new RecursoDuplicadoException("Ese horario ya fue bloqueado");
        }
    }

    @Transactional
    public void eliminar(String email, Long id) {
        BloqueoHorario bloqueo = bloqueoRepository
                .findByIdAndOdontologo_Usuario_EmailIgnoreCase(id, email)
                .orElseThrow(() -> new RecursoNoEncontradoException("Bloqueo de horario no encontrado"));
        bloqueoRepository.delete(bloqueo);
    }

    private Odontologo buscarOdontologo(String email) {
        return odontologoRepository.findByUsuarioEmailIgnoreCase(email)
                .orElseThrow(() -> new RecursoNoEncontradoException("Perfil de odontólogo no encontrado"));
    }

    private void validarRango(BloqueoHorarioRequest request) {
        if (request.fecha().isBefore(LocalDate.now())) {
            throw new ReglaNegocioException("La fecha no puede estar en el pasado");
        }
        if (request.fecha().getDayOfWeek() == DayOfWeek.SUNDAY) {
            throw new ReglaNegocioException("La clínica no atiende los domingos");
        }
        if (!request.horaFin().isAfter(request.horaInicio())) {
            throw new ReglaNegocioException("La hora final debe ser posterior a la hora inicial");
        }
        if (!esIntervaloValido(request.horaInicio()) || !esIntervaloValido(request.horaFin())) {
            throw new ReglaNegocioException("Utiliza horarios en intervalos de 30 minutos");
        }
        if (request.horaInicio().isBefore(APERTURA) || request.horaFin().isAfter(CIERRE)) {
            throw new ReglaNegocioException("El bloqueo debe estar entre las 09:00 y las 18:00");
        }
    }

    private boolean esIntervaloValido(LocalTime hora) {
        return hora.getSecond() == 0 && hora.getNano() == 0
                && (hora.getMinute() == 0 || hora.getMinute() == 30);
    }
}
