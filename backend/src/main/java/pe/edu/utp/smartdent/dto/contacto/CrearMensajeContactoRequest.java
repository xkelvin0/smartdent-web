package pe.edu.utp.smartdent.dto.contacto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CrearMensajeContactoRequest(
        @NotBlank(message = "El nombre es obligatorio") @Size(min = 3, max = 120) String nombre,
        @NotBlank(message = "El correo es obligatorio") @Email(message = "Ingresa un correo válido") @Size(max = 150) String email,
        @Pattern(regexp = "^$|^[0-9+() -]{9,20}$", message = "Ingresa un teléfono válido") String telefono,
        @NotBlank(message = "El asunto es obligatorio") @Size(max = 80) String asunto,
        @NotBlank(message = "El mensaje es obligatorio") @Size(min = 10, max = 600) String mensaje) {
}
