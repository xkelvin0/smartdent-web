package pe.edu.utp.smartdent.dto.servicio;

import java.math.BigDecimal;

import pe.edu.utp.smartdent.entity.Servicio;

public record ServicioResponse(
        Long id,
        String codigo,
        String nombre,
        String especialidad,
        String descripcion,
        BigDecimal precio,
        Integer duracionMinutos,
        Integer sesionesIncluidas,
        String imagenUrl) {

    public static ServicioResponse desde(Servicio servicio) {
        return new ServicioResponse(
                servicio.getId(),
                servicio.getCodigo(),
                servicio.getNombre(),
                servicio.getEspecialidad(),
                servicio.getDescripcion(),
                servicio.getPrecio(),
                servicio.getDuracionMinutos(),
                servicio.getSesionesIncluidas(),
                servicio.getImagenUrl());
    }
}
