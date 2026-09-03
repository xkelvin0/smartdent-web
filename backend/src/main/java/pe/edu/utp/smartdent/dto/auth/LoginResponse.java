package pe.edu.utp.smartdent.dto.auth;

public record LoginResponse(
        String token,
        String tokenType,
        long expiresIn,
        PerfilResponse usuario) {
}
