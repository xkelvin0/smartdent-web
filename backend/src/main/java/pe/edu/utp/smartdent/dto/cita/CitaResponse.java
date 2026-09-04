package pe.edu.utp.smartdent.dto.cita;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import pe.edu.utp.smartdent.entity.Cita;
import pe.edu.utp.smartdent.entity.CitaEstado;

public record CitaResponse(
        Long id,
        String codigo,
        Long pacienteId,
        String pacienteNombre,
        String pacienteEmail,
        Long odontologoId,
        String odontologoNombre,
        Long servicioId,
        String servicioNombre,
        LocalDate fecha,
        LocalTime horaInicio,
        LocalTime horaFin,
        CitaEstado estado,
        String motivo,
        String telefonoContacto,
        BigDecimal precioPactado,
        String tratamientoCodigo,
        Integer numeroSesion,
        Integer totalSesiones,
        Integer sesionesRestantes,
        LocalDateTime creadoEn) {

    public static CitaResponse desde(Cita cita) {
        return new CitaResponse(
                cita.getId(), cita.getCodigo(),
                cita.getPaciente().getId(), cita.getPaciente().getNombreCompleto(),
                cita.getPaciente().getEmail(), cita.getOdontologo().getId(),
                cita.getOdontologo().getUsuario().getNombreCompleto(),
                cita.getServicio().getId(), cita.getServicio().getNombre(),
                cita.getFecha(), cita.getHoraInicio(), cita.getHoraFin(), cita.getEstado(),
                cita.getMotivo(), cita.getTelefonoContacto(), cita.getPrecioPactado(),
                cita.getTratamientoCodigo(), cita.getNumeroSesion(), cita.getTotalSesiones(),
                Math.max(0, cita.getTotalSesiones() - cita.getNumeroSesion()), cita.getCreadoEn());
    }
}
