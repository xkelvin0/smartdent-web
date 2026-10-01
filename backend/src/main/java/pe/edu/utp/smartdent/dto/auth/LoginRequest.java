package pe.edu.utp.smartdent.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "El correo electrónico es obligatorio")
        @Email(message = "Ingresa un correo electrónico válido")
        String email,

        @NotBlank(message = "La contraseña es obligatoria")
        String password) {
}
