package pe.edu.utp.smartdent.dto.cita;

import jakarta.validation.constraints.NotNull;
import pe.edu.utp.smartdent.entity.CitaEstado;

public record CambiarEstadoCitaRequest(
        @NotNull(message = "Selecciona un estado")
        CitaEstado estado) {
}
