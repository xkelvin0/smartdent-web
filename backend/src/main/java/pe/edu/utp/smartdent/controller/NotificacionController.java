package pe.edu.utp.smartdent.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import pe.edu.utp.smartdent.dto.notificacion.NotificacionResponse;
import pe.edu.utp.smartdent.service.NotificacionService;

@RestController
@RequestMapping("/api/notificaciones")
public class NotificacionController {

    private final NotificacionService notificacionService;

    public NotificacionController(NotificacionService notificacionService) {
        this.notificacionService = notificacionService;
    }

    @GetMapping
    public List<NotificacionResponse> listarMisNotificaciones(Authentication authentication) {
        return notificacionService.listarPorDestinatario(authentication.getName());
    }

    @PatchMapping("/{id}/leer")
    public NotificacionResponse marcarLeida(
            Authentication authentication,
            @PathVariable Long id) {
        return notificacionService.marcarLeida(authentication.getName(), id);
    }

    @PatchMapping("/leer-todas")
    public ResponseEntity<Void> marcarTodasLeidas(Authentication authentication) {
        notificacionService.marcarTodasLeidas(authentication.getName());
        return ResponseEntity.noContent().build();
    }
}

