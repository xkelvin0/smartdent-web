package pe.edu.utp.smartdent.dto.usuario;

import java.time.LocalDateTime;

import pe.edu.utp.smartdent.entity.Usuario;

public record UsuarioAdminResponse(
        Long id,
        String nombreCompleto,
        String dni,
        String email,
        String telefono,
        String rol,
        boolean activo,
        LocalDateTime creadoEn) {

    public static UsuarioAdminResponse desde(Usuario usuario) {
        return new UsuarioAdminResponse(
                usuario.getId(),
                usuario.getNombreCompleto(),
                usuario.getDni(),
                usuario.getEmail(),
                usuario.getTelefono(),
                usuario.getRol().getNombre().name(),
                usuario.isActivo(),
                usuario.getCreadoEn());
    }
}
