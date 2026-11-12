package pe.edu.utp.smartdent.dto.notificacion;

import java.time.LocalDateTime;

import pe.edu.utp.smartdent.entity.Notificacion;
import pe.edu.utp.smartdent.entity.NotificacionTipo;

public record NotificacionResponse(
        Long id,
        NotificacionTipo tipo,
        String titulo,
        String mensaje,
        String vistaDestino,
        String referenciaCodigo,
        boolean leida,
        LocalDateTime creadoEn
) {
    public static NotificacionResponse desde(Notificacion item) {
        return new NotificacionResponse(
                item.getId(),
                item.getTipo(),
                item.getTitulo(),
                item.getMensaje(),
                item.getVistaDestino(),
                item.getReferenciaCodigo(),
                item.isLeida(),
                item.getCreadoEn()
        );
    }
}

