package pe.edu.utp.smartdent.dto.auth;

import java.time.LocalDateTime;

import pe.edu.utp.smartdent.entity.Usuario;

public record RegistroPacienteResponse(
        Long id,
        String nombreCompleto,
        String dni,
        String email,
        String telefono,
        String rol,
        LocalDateTime creadoEn) {

    public static RegistroPacienteResponse desde(Usuario usuario) {
        return new RegistroPacienteResponse(
                usuario.getId(),
                usuario.getNombreCompleto(),
                usuario.getDni(),
                usuario.getEmail(),
                usuario.getTelefono(),
                usuario.getRol().getNombre().name(),
                usuario.getCreadoEn());
    }
}
