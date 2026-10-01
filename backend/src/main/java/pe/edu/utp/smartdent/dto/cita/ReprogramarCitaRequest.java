package pe.edu.utp.smartdent.dto.cita;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

public record ReprogramarCitaRequest(
        @NotNull(message = "Selecciona una fecha")
        @Future(message = "La fecha debe ser posterior a hoy")
        LocalDate fecha,

        @NotNull(message = "Selecciona una hora")
        LocalTime horaInicio) {
}
