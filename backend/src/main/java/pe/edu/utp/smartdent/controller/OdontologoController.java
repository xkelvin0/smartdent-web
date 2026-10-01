package pe.edu.utp.smartdent.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import pe.edu.utp.smartdent.dto.odontologo.OdontologoResponse;
import pe.edu.utp.smartdent.service.OdontologoService;

@RestController
@RequestMapping("/api/odontologos")
public class OdontologoController {

    private final OdontologoService odontologoService;

    public OdontologoController(OdontologoService odontologoService) {
        this.odontologoService = odontologoService;
    }

    @GetMapping
    public List<OdontologoResponse> listar(
            @RequestParam(required = false) Long servicioId) {
        return odontologoService.listarPublicos(servicioId);
    }
}
