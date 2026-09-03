package pe.edu.utp.smartdent.controller;

import java.net.URI;
import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import pe.edu.utp.smartdent.dto.odontologo.ActualizarOdontologoRequest;
import pe.edu.utp.smartdent.dto.odontologo.CrearOdontologoRequest;
import pe.edu.utp.smartdent.dto.odontologo.OdontologoAdminResponse;
import pe.edu.utp.smartdent.service.OdontologoService;

@RestController
@RequestMapping("/api/admin/odontologos")
public class AdminOdontologoController {

    private final OdontologoService odontologoService;

    public AdminOdontologoController(OdontologoService odontologoService) {
        this.odontologoService = odontologoService;
    }

    @GetMapping
    public List<OdontologoAdminResponse> listar() {
        return odontologoService.listarParaAdmin();
    }

    @PostMapping
    public ResponseEntity<OdontologoAdminResponse> crear(
            @Valid @RequestBody CrearOdontologoRequest request) {
        OdontologoAdminResponse response = odontologoService.crear(request);
        return ResponseEntity.created(URI.create("/api/odontologos/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public OdontologoAdminResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarOdontologoRequest request) {
        return odontologoService.actualizar(id, request);
    }
}
