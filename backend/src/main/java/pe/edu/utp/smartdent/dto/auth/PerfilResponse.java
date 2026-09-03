package pe.edu.utp.smartdent.dto.auth;

import pe.edu.utp.smartdent.entity.Usuario;

public record PerfilResponse(
        Long id,
        String nombreCompleto,
        String dni,
        String email,
        String telefono,
        String rol) {

    public static PerfilResponse desde(Usuario usuario) {
        return new PerfilResponse(
                usuario.getId(),
                usuario.getNombreCompleto(),
                usuario.getDni(),
                usuario.getEmail(),
                usuario.getTelefono(),
                usuario.getRol().getNombre().name());
    }
}
