package pe.edu.utp.smartdent.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import pe.edu.utp.smartdent.dto.bloqueo.BloqueoHorarioRequest;
import pe.edu.utp.smartdent.dto.bloqueo.BloqueoHorarioResponse;
import pe.edu.utp.smartdent.service.BloqueoHorarioService;

@RestController
@RequestMapping("/api/odontologos/bloqueos")
public class OdontologoBloqueoController {

    private final BloqueoHorarioService bloqueoService;

    public OdontologoBloqueoController(BloqueoHorarioService bloqueoService) {
        this.bloqueoService = bloqueoService;
    }

    @GetMapping
    public List<BloqueoHorarioResponse> listar(Authentication authentication) {
        return bloqueoService.listar(authentication.getName());
    }

    @PostMapping
    public ResponseEntity<BloqueoHorarioResponse> crear(
            Authentication authentication,
            @Valid @RequestBody BloqueoHorarioRequest request) {
        return ResponseEntity.status(201).body(bloqueoService.crear(authentication.getName(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(Authentication authentication, @PathVariable Long id) {
        bloqueoService.eliminar(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
