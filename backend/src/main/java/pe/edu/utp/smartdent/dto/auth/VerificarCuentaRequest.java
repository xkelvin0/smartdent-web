package pe.edu.utp.smartdent.dto.auth;
import jakarta.validation.constraints.NotBlank;
public record VerificarCuentaRequest(
    @NotBlank(message = "El token es obligatorio")
    String token
) {}
