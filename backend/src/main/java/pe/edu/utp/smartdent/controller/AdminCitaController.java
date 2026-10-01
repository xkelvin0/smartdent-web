package pe.edu.utp.smartdent.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import pe.edu.utp.smartdent.dto.admin.AdminResumenResponse;
import pe.edu.utp.smartdent.dto.cita.CitaResponse;
import pe.edu.utp.smartdent.dto.cita.CambiarEstadoCitaRequest;
import pe.edu.utp.smartdent.service.AdminReporteService;
import pe.edu.utp.smartdent.service.CitaService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/citas")
public class AdminCitaController {

    private final CitaService citaService;
    private final AdminReporteService adminReporteService;

    public AdminCitaController(CitaService citaService, AdminReporteService adminReporteService) {
        this.citaService = citaService;
        this.adminReporteService = adminReporteService;
    }

    @GetMapping
    public List<CitaResponse> listar() {
        return citaService.listarTodas();
    }

    @GetMapping("/resumen")
    public AdminResumenResponse resumen() {
        return adminReporteService.obtenerResumen();
    }

    @PatchMapping("/{id}/estado")
    public CitaResponse cambiarEstado(
            @PathVariable Long id,
            @Valid @RequestBody CambiarEstadoCitaRequest request) {
        return citaService.cambiarEstadoPorAdmin(id, request.estado());
    }
}
