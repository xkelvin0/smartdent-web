package pe.edu.utp.smartdent.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import pe.edu.utp.smartdent.dto.historia.HistoriaClinicaResponse;
import pe.edu.utp.smartdent.service.HistoriaClinicaService;

@RestController
@RequestMapping("/api/pacientes/historias-clinicas")
public class PacienteHistoriaClinicaController {

    private final HistoriaClinicaService historiaClinicaService;

    public PacienteHistoriaClinicaController(HistoriaClinicaService historiaClinicaService) {
        this.historiaClinicaService = historiaClinicaService;
    }

    @GetMapping
    public List<HistoriaClinicaResponse> listar(Authentication authentication) {
        return historiaClinicaService.listarDelPaciente(authentication.getName());
    }
}
