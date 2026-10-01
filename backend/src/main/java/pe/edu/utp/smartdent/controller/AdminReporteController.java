package pe.edu.utp.smartdent.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import pe.edu.utp.smartdent.dto.admin.AdminFinanzasResponse;
import pe.edu.utp.smartdent.dto.admin.CostoFijoRequest;
import pe.edu.utp.smartdent.dto.admin.CostoFijoResponse;
import pe.edu.utp.smartdent.service.AdminReporteService;
import pe.edu.utp.smartdent.service.CostoFijoService;

@RestController
@RequestMapping("/api/admin/reportes")
public class AdminReporteController {

    private final CostoFijoService costoFijoService;
    private final AdminReporteService adminReporteService;

    public AdminReporteController(
            CostoFijoService costoFijoService,
            AdminReporteService adminReporteService) {
        this.costoFijoService = costoFijoService;
        this.adminReporteService = adminReporteService;
    }

    @GetMapping("/finanzas")
    public AdminFinanzasResponse obtenerFinanzas() {
        return adminReporteService.obtenerFinanzas();
    }

    @GetMapping("/costos-fijos")
    public CostoFijoResponse obtenerCostosFijos() {
        return costoFijoService.obtener();
    }

    @PutMapping("/costos-fijos")
    public CostoFijoResponse actualizarCostosFijos(@Valid @RequestBody CostoFijoRequest request) {
        return costoFijoService.actualizar(request);
    }
}
