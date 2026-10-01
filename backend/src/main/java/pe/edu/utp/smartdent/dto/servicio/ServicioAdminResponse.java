package pe.edu.utp.smartdent.dto.servicio;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import pe.edu.utp.smartdent.entity.Servicio;

public record ServicioAdminResponse(
        Long id,
        String codigo,
        String nombre,
        String especialidad,
        String descripcion,
        BigDecimal precio,
        BigDecimal costo,
        Integer duracionMinutos,
        String imagenUrl,
        boolean activo,
        LocalDateTime actualizadoEn) {

    public static ServicioAdminResponse desde(Servicio servicio) {
        return new ServicioAdminResponse(
                servicio.getId(),
                servicio.getCodigo(),
                servicio.getNombre(),
                servicio.getEspecialidad(),
                servicio.getDescripcion(),
                servicio.getPrecio(),
                servicio.getCosto(),
                servicio.getDuracionMinutos(),
                servicio.getImagenUrl(),
                servicio.isActivo(),
                servicio.getActualizadoEn());
    }
}
