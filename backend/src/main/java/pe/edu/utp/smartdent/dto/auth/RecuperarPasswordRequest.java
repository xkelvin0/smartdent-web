package pe.edu.utp.smartdent.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RecuperarPasswordRequest(
        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El formato del correo es inválido")
        String email
) {}
