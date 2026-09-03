package pe.edu.utp.smartdent.controller;

import java.net.URI;

import jakarta.validation.Valid;

import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import pe.edu.utp.smartdent.dto.auth.LoginRequest;
import pe.edu.utp.smartdent.dto.auth.LoginResponse;
import pe.edu.utp.smartdent.dto.auth.PerfilResponse;
import pe.edu.utp.smartdent.dto.auth.RegistroPacienteRequest;
import pe.edu.utp.smartdent.dto.auth.RegistroPacienteResponse;
import pe.edu.utp.smartdent.service.LoginService;
import pe.edu.utp.smartdent.service.RegistroPacienteService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final RegistroPacienteService registroPacienteService;
    private final LoginService loginService;

    public AuthController(RegistroPacienteService registroPacienteService, LoginService loginService) {
        this.registroPacienteService = registroPacienteService;
        this.loginService = loginService;
    }

    @PostMapping("/registro")
    public ResponseEntity<RegistroPacienteResponse> registrarPaciente(
            @Valid @RequestBody RegistroPacienteRequest request) {
        RegistroPacienteResponse response = registroPacienteService.registrar(request);
        return ResponseEntity.created(URI.create("/api/usuarios/" + response.id())).body(response);
    }

    @PostMapping("/login")
    public LoginResponse iniciarSesion(@Valid @RequestBody LoginRequest request) {
        return loginService.iniciarSesion(request);
    }

    @GetMapping("/perfil")
    public PerfilResponse obtenerPerfil(Authentication authentication) {
        return loginService.obtenerPerfil(authentication.getName());
    }
}
