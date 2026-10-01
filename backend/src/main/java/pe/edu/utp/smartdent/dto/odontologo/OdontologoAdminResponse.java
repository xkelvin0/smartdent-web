package pe.edu.utp.smartdent.dto.odontologo;

import java.util.List;

import pe.edu.utp.smartdent.entity.Odontologo;

public record OdontologoAdminResponse(
        Long id,
        String codigo,
        String nombreCompleto,
        String dni,
        String email,
        String telefono,
        String especialidad,
        String colegiatura,
        String fotoUrl,
        boolean activo,
        List<Long> servicioIds) {

    public static OdontologoAdminResponse desde(Odontologo odontologo) {
        return new OdontologoAdminResponse(
                odontologo.getId(),
                odontologo.getCodigo(),
                odontologo.getUsuario().getNombreCompleto(),
                odontologo.getUsuario().getDni(),
                odontologo.getUsuario().getEmail(),
                odontologo.getUsuario().getTelefono(),
                odontologo.getEspecialidad(),
                odontologo.getColegiatura(),
                odontologo.getFotoUrl(),
                odontologo.getUsuario().isActivo(),
                odontologo.getServicios().stream().map(servicio -> servicio.getId()).sorted().toList());
    }
}
