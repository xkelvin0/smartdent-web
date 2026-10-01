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
import pe.edu.utp.smartdent.service.RecuperarPasswordService;
import pe.edu.utp.smartdent.dto.auth.RecuperarPasswordRequest;
import pe.edu.utp.smartdent.dto.auth.ResetPasswordRequest;
import pe.edu.utp.smartdent.service.VerificarCuentaService;
import pe.edu.utp.smartdent.dto.auth.VerificarCuentaRequest;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final RegistroPacienteService registroPacienteService;
    private final LoginService loginService;
    private final RecuperarPasswordService recuperarPasswordService;
    private final VerificarCuentaService verificarCuentaService;

    public AuthController(RegistroPacienteService registroPacienteService, LoginService loginService, RecuperarPasswordService recuperarPasswordService, VerificarCuentaService verificarCuentaService) {
        this.registroPacienteService = registroPacienteService;
        this.loginService = loginService;
        this.recuperarPasswordService = recuperarPasswordService;
        this.verificarCuentaService = verificarCuentaService;
    }

    @PostMapping("/registro")
    public ResponseEntity<RegistroPacienteResponse> registrarPaciente(
            @Valid @RequestBody RegistroPacienteRequest request, HttpServletRequest httpRequest) {
        
        String origin = httpRequest.getHeader("Origin");
        if (origin == null) {
            origin = httpRequest.getHeader("Referer");
            if (origin != null && origin.endsWith("/")) origin = origin.substring(0, origin.length() - 1);
        }
        if (origin == null) origin = "http://localhost:5500";
        
        RegistroPacienteResponse response = registroPacienteService.registrar(request, origin);
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

    @PostMapping("/recuperar-password")
    public ResponseEntity<?> solicitarRecuperacion(@Valid @RequestBody RecuperarPasswordRequest request, HttpServletRequest httpRequest) {
        String origin = httpRequest.getHeader("Origin");
        if (origin == null) {
            origin = httpRequest.getHeader("Referer");
            if (origin != null && origin.endsWith("/")) origin = origin.substring(0, origin.length() - 1);
        }
        if (origin == null) origin = "http://localhost:5500";
        
        recuperarPasswordService.solicitarRecuperacion(request, origin);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetearPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            recuperarPasswordService.resetearPassword(request);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/verificar-cuenta")
    public ResponseEntity<?> verificarCuenta(@Valid @RequestBody VerificarCuentaRequest request) {
        try {
            verificarCuentaService.verificarCuenta(request);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
