package pe.edu.utp.smartdent.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import pe.edu.utp.smartdent.dto.paciente.ConfiguracionPacienteRequest;
import pe.edu.utp.smartdent.dto.paciente.ConfiguracionPacienteResponse;
import pe.edu.utp.smartdent.service.ConfiguracionPacienteService;

@RestController
@RequestMapping("/api/pacientes/configuracion")
public class PacienteConfiguracionController {

    private final ConfiguracionPacienteService configuracionPacienteService;

    public PacienteConfiguracionController(ConfiguracionPacienteService configuracionPacienteService) {
        this.configuracionPacienteService = configuracionPacienteService;
    }

    @GetMapping
    public ConfiguracionPacienteResponse obtener(Authentication authentication) {
        return configuracionPacienteService.obtener(authentication.getName());
    }

    @PutMapping
    public ConfiguracionPacienteResponse actualizar(
            Authentication authentication,
            @Valid @RequestBody ConfiguracionPacienteRequest request) {
        return configuracionPacienteService.actualizar(authentication.getName(), request);
    }
}
