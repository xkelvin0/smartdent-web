package pe.edu.utp.smartdent.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import pe.edu.utp.smartdent.dto.contacto.CambiarEstadoMensajeRequest;
import pe.edu.utp.smartdent.dto.contacto.MensajeContactoResponse;
import pe.edu.utp.smartdent.service.MensajeContactoService;

@RestController
@RequestMapping("/api/admin/mensajes")
public class AdminMensajeContactoController {
    private final MensajeContactoService service;
    public AdminMensajeContactoController(MensajeContactoService service) { this.service = service; }

    @GetMapping
    public List<MensajeContactoResponse> listar() { return service.listar(); }

    @PatchMapping("/{id}/estado")
    public MensajeContactoResponse cambiarEstado(@PathVariable Long id, @Valid @RequestBody CambiarEstadoMensajeRequest request) {
        return service.cambiarEstado(id, request.estado());
    }
}
