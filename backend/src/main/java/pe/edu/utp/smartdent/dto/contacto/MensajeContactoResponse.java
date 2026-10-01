package pe.edu.utp.smartdent.dto.contacto;

import java.time.LocalDateTime;

import pe.edu.utp.smartdent.entity.MensajeContacto;

public record MensajeContactoResponse(
        Long id, String nombre, String email, String telefono, String asunto,
        String mensaje, String estado, LocalDateTime creadoEn, LocalDateTime actualizadoEn) {

    public static MensajeContactoResponse desde(MensajeContacto item) {
        return new MensajeContactoResponse(item.getId(), item.getNombre(), item.getEmail(), item.getTelefono(),
                item.getAsunto(), item.getMensaje(), item.getEstado().name(), item.getCreadoEn(), item.getActualizadoEn());
    }
}
