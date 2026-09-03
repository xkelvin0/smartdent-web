package pe.edu.utp.smartdent.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import pe.edu.utp.smartdent.dto.cita.CambiarEstadoCitaRequest;
import pe.edu.utp.smartdent.dto.cita.CitaResponse;
import pe.edu.utp.smartdent.service.CitaService;

@RestController
@RequestMapping("/api/odontologos")
public class OdontologoCitaController {

    private final CitaService citaService;

    public OdontologoCitaController(CitaService citaService) {
        this.citaService = citaService;
    }

    @GetMapping("/mi-agenda")
    public List<CitaResponse> miAgenda(Authentication authentication) {
        return citaService.listarDelOdontologo(authentication.getName());
    }

    @PatchMapping("/citas/{id}/estado")
    public CitaResponse cambiarEstado(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody CambiarEstadoCitaRequest request) {
        return citaService.cambiarEstadoPorOdontologo(authentication.getName(), id, request.estado());
    }
}
