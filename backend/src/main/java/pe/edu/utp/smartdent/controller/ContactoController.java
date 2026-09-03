package pe.edu.utp.smartdent.controller;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import pe.edu.utp.smartdent.dto.contacto.CrearMensajeContactoRequest;
import pe.edu.utp.smartdent.dto.contacto.MensajeContactoResponse;
import pe.edu.utp.smartdent.service.MensajeContactoService;

@RestController
@RequestMapping("/api/contacto/mensajes")
public class ContactoController {
    private final MensajeContactoService service;
    public ContactoController(MensajeContactoService service) { this.service = service; }

    @PostMapping
    public ResponseEntity<MensajeContactoResponse> crear(@Valid @RequestBody CrearMensajeContactoRequest request) {
        MensajeContactoResponse response = service.crear(request);
        return ResponseEntity.created(URI.create("/api/admin/mensajes/" + response.id())).body(response);
    }
}
