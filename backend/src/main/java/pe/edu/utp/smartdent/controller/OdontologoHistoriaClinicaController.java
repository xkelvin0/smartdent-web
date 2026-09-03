package pe.edu.utp.smartdent.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import pe.edu.utp.smartdent.dto.historia.GuardarHistoriaClinicaRequest;
import pe.edu.utp.smartdent.dto.historia.HistoriaClinicaResponse;
import pe.edu.utp.smartdent.service.HistoriaClinicaService;

@RestController
@RequestMapping("/api/odontologos/historias-clinicas")
public class OdontologoHistoriaClinicaController {

    private final HistoriaClinicaService historiaClinicaService;

    public OdontologoHistoriaClinicaController(HistoriaClinicaService historiaClinicaService) {
        this.historiaClinicaService = historiaClinicaService;
    }

    @GetMapping
    public HistoriaClinicaResponse consultar(
            Authentication authentication,
            @RequestParam String pacienteEmail) {
        return historiaClinicaService.consultarPorOdontologo(authentication.getName(), pacienteEmail);
    }

    @PutMapping
    public HistoriaClinicaResponse guardar(
            Authentication authentication,
            @RequestParam String pacienteEmail,
            @Valid @RequestBody GuardarHistoriaClinicaRequest request) {
        return historiaClinicaService.guardar(authentication.getName(), pacienteEmail, request);
    }
}
