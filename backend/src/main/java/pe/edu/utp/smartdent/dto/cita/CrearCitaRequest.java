package pe.edu.utp.smartdent.dto.cita;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CrearCitaRequest(
        @NotNull(message = "Selecciona un odontólogo")
        Long odontologoId,

        @NotNull(message = "Selecciona un servicio")
        Long servicioId,

        @NotNull(message = "Selecciona una fecha")
        @Future(message = "La fecha debe ser posterior a hoy")
        LocalDate fecha,

        @NotNull(message = "Selecciona una hora")
        LocalTime horaInicio,

        @Size(max = 600, message = "El motivo no puede superar 600 caracteres")
        String motivo,

        @NotNull(message = "Ingresa un teléfono")
        @Pattern(regexp = "^[0-9+() -]{7,20}$", message = "Ingresa un teléfono válido")
        String telefono) {
}
