package pe.edu.utp.smartdent.dto.contacto;

import jakarta.validation.constraints.NotNull;
import pe.edu.utp.smartdent.entity.MensajeContactoEstado;

public record CambiarEstadoMensajeRequest(@NotNull(message = "El estado es obligatorio") MensajeContactoEstado estado) {
}
