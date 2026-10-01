package pe.edu.utp.smartdent.controller;

import java.net.URI;
import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import pe.edu.utp.smartdent.dto.servicio.ServicioAdminResponse;
import pe.edu.utp.smartdent.dto.servicio.ServicioRequest;
import pe.edu.utp.smartdent.service.ServicioService;

@RestController
@RequestMapping("/api/admin/servicios")
public class AdminServicioController {

    private final ServicioService servicioService;

    public AdminServicioController(ServicioService servicioService) {
        this.servicioService = servicioService;
    }

    @GetMapping
    public List<ServicioAdminResponse> listar() {
        return servicioService.listarParaAdmin();
    }

    @PostMapping
    public ResponseEntity<ServicioAdminResponse> crear(@Valid @RequestBody ServicioRequest request) {
        ServicioAdminResponse response = servicioService.crear(request);
        return ResponseEntity.created(URI.create("/api/servicios/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public ServicioAdminResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ServicioRequest request) {
        return servicioService.actualizar(id, request);
    }

    @PatchMapping("/{id}/estado")
    public ServicioAdminResponse cambiarEstado(
            @PathVariable Long id,
            @RequestParam boolean activo) {
        return servicioService.cambiarEstado(id, activo);
    }
}
