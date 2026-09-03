package pe.edu.utp.smartdent.dto.bloqueo;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import pe.edu.utp.smartdent.entity.BloqueoHorario;

public record BloqueoHorarioResponse(
        Long id,
        LocalDate fecha,
        LocalTime horaInicio,
        LocalTime horaFin,
        String motivo,
        LocalDateTime creadoEn) {

    public static BloqueoHorarioResponse desde(BloqueoHorario bloqueo) {
        return new BloqueoHorarioResponse(
                bloqueo.getId(), bloqueo.getFecha(), bloqueo.getHoraInicio(),
                bloqueo.getHoraFin(), bloqueo.getMotivo(), bloqueo.getCreadoEn());
    }
}
