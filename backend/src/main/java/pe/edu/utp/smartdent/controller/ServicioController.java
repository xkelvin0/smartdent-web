package pe.edu.utp.smartdent.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import pe.edu.utp.smartdent.dto.servicio.ServicioResponse;
import pe.edu.utp.smartdent.service.ServicioService;

@RestController
@RequestMapping("/api/servicios")
public class ServicioController {

    private final ServicioService servicioService;

    public ServicioController(ServicioService servicioService) {
        this.servicioService = servicioService;
    }

    @GetMapping
    public List<ServicioResponse> listar() {
        return servicioService.listarPublicos();
    }

    @GetMapping("/{id}")
    public ServicioResponse obtener(@PathVariable Long id) {
        return servicioService.obtenerPublico(id);
    }
}
