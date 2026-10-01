package pe.edu.utp.smartdent.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import pe.edu.utp.smartdent.dto.auth.LoginRequest;
import pe.edu.utp.smartdent.entity.Rol;
import pe.edu.utp.smartdent.entity.RolNombre;
import pe.edu.utp.smartdent.entity.Usuario;
import pe.edu.utp.smartdent.repository.UsuarioRepository;
import pe.edu.utp.smartdent.security.JwtService;

@ExtendWith(MockitoExtension.class)
class LoginServiceUnitTest {

    @Mock AuthenticationManager authenticationManager;
    @Mock UsuarioRepository usuarioRepository;
    @Mock JwtService jwtService;
    @InjectMocks LoginService service;

    @Test
    void iniciaSesionYDevuelveTokenJwt() {
        Usuario usuario = usuarioActivo("paciente@correo.com");
        when(usuarioRepository.findByEmailIgnoreCase("paciente@correo.com")).thenReturn(Optional.of(usuario));
        when(jwtService.generarToken(usuario)).thenReturn("jwt-prueba");
        when(jwtService.getExpirationSeconds()).thenReturn(3600L);

        var response = service.iniciarSesion(new LoginRequest(" PACIENTE@CORREO.COM ", "Clave1234"));

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        assertThat(response.token()).isEqualTo("jwt-prueba");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.usuario().email()).isEqualTo("paciente@correo.com");
    }

    @Test
    void rechazaUsuarioInactivoAunqueLasCredencialesSeanValidas() {
        Usuario usuario = usuarioActivo("paciente@correo.com");
        usuario.setActivo(false);
        when(usuarioRepository.findByEmailIgnoreCase("paciente@correo.com")).thenReturn(Optional.of(usuario));

        assertThatThrownBy(() -> service.iniciarSesion(
                new LoginRequest("paciente@correo.com", "Clave1234")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("no está disponible");
    }

    @Test
    void obtienePerfilDelUsuarioActivo() {
        Usuario usuario = usuarioActivo("paciente@correo.com");
        when(usuarioRepository.findByEmailIgnoreCase("paciente@correo.com")).thenReturn(Optional.of(usuario));

        var perfil = service.obtenerPerfil("paciente@correo.com");

        assertThat(perfil.nombreCompleto()).isEqualTo("Paciente Prueba");
        assertThat(perfil.rol()).isEqualTo("PACIENTE");
    }

    @Test
    void rechazaPerfilInexistente() {
        when(usuarioRepository.findByEmailIgnoreCase("nadie@correo.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.obtenerPerfil("nadie@correo.com"))
                .isInstanceOf(IllegalStateException.class);
    }

    private Usuario usuarioActivo(String email) {
        Usuario usuario = new Usuario();
        usuario.setNombreCompleto("Paciente Prueba");
        usuario.setDni("76543210");
        usuario.setEmail(email);
        usuario.setTelefono("987654321");
        usuario.setRol(new Rol(RolNombre.PACIENTE, "Paciente"));
        usuario.setActivo(true);
        return usuario;
    }
}
