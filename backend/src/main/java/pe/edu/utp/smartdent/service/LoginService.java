package pe.edu.utp.smartdent.service;

import java.util.Locale;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.utp.smartdent.dto.auth.LoginRequest;
import pe.edu.utp.smartdent.dto.auth.LoginResponse;
import pe.edu.utp.smartdent.dto.auth.PerfilResponse;
import pe.edu.utp.smartdent.entity.Usuario;
import pe.edu.utp.smartdent.repository.UsuarioRepository;
import pe.edu.utp.smartdent.security.JwtService;

@Service
public class LoginService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;

    public LoginService(
            AuthenticationManager authenticationManager,
            UsuarioRepository usuarioRepository,
            JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public LoginResponse iniciarSesion(LoginRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(email, request.password()));

        Usuario usuario = buscarUsuarioActivo(email);
        return new LoginResponse(
                jwtService.generarToken(usuario),
                "Bearer",
                jwtService.getExpirationSeconds(),
                PerfilResponse.desde(usuario));
    }

    @Transactional(readOnly = true)
    public PerfilResponse obtenerPerfil(String email) {
        return PerfilResponse.desde(buscarUsuarioActivo(email));
    }

    private Usuario buscarUsuarioActivo(String email) {
        return usuarioRepository.findByEmailIgnoreCase(email)
                .filter(Usuario::isActivo)
                .orElseThrow(() -> new IllegalStateException("El usuario autenticado no está disponible"));
    }
}
