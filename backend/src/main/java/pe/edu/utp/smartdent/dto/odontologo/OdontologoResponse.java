package pe.edu.utp.smartdent.dto.odontologo;

import java.util.List;

import pe.edu.utp.smartdent.entity.Odontologo;

public record OdontologoResponse(
        Long id,
        String codigo,
        String nombreCompleto,
        String especialidad,
        String fotoUrl,
        List<String> servicios) {

    public static OdontologoResponse desde(Odontologo odontologo) {
        return new OdontologoResponse(
                odontologo.getId(),
                odontologo.getCodigo(),
                odontologo.getUsuario().getNombreCompleto(),
                odontologo.getEspecialidad(),
                odontologo.getFotoUrl(),
                odontologo.getServicios().stream()
                        .map(servicio -> servicio.getCodigo())
                        .sorted()
                        .toList());
    }
}
