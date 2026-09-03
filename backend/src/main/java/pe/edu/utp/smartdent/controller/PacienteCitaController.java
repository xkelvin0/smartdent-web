package pe.edu.utp.smartdent.controller;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import pe.edu.utp.smartdent.dto.cita.CitaResponse;
import pe.edu.utp.smartdent.dto.cita.CrearCitaRequest;
import pe.edu.utp.smartdent.dto.cita.DisponibilidadResponse;
import pe.edu.utp.smartdent.dto.cita.ReprogramarCitaRequest;
import pe.edu.utp.smartdent.service.CitaService;

@RestController
@RequestMapping("/api/pacientes/citas")
public class PacienteCitaController {

    private final CitaService citaService;

    public PacienteCitaController(CitaService citaService) {
        this.citaService = citaService;
    }

    @PostMapping
    public ResponseEntity<CitaResponse> reservar(
            Authentication authentication,
            @Valid @RequestBody CrearCitaRequest request) {
        CitaResponse response = citaService.reservar(authentication.getName(), request);
        return ResponseEntity.created(URI.create("/api/pacientes/citas/" + response.id())).body(response);
    }

    @GetMapping
    public List<CitaResponse> listar(Authentication authentication) {
        return citaService.listarDelPaciente(authentication.getName());
    }

    @GetMapping("/disponibilidad")
    public DisponibilidadResponse disponibilidad(
            @RequestParam Long odontologoId,
            @RequestParam Long servicioId,
            @RequestParam LocalDate fecha) {
        return citaService.consultarDisponibilidad(odontologoId, servicioId, fecha);
    }

    @PutMapping("/{id}/reprogramar")
    public CitaResponse reprogramar(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody ReprogramarCitaRequest request) {
        return citaService.reprogramar(authentication.getName(), id, request);
    }

    @PatchMapping("/{id}/cancelar")
    public CitaResponse cancelar(Authentication authentication, @PathVariable Long id) {
        return citaService.cancelarPorPaciente(authentication.getName(), id);
    }
}
