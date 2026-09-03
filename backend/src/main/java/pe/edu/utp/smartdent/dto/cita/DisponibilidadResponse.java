package pe.edu.utp.smartdent.dto.cita;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record DisponibilidadResponse(
        Long odontologoId,
        String odontologoNombre,
        Long servicioId,
        String servicioNombre,
        LocalDate fecha,
        List<LocalTime> horariosDisponibles) {
}
