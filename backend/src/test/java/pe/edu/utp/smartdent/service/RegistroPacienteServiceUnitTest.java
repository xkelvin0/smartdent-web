package pe.edu.utp.smartdent.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import pe.edu.utp.smartdent.dto.auth.RegistroPacienteRequest;
import pe.edu.utp.smartdent.entity.Rol;
import pe.edu.utp.smartdent.entity.RolNombre;
import pe.edu.utp.smartdent.entity.Usuario;
import pe.edu.utp.smartdent.exception.RecursoDuplicadoException;
import pe.edu.utp.smartdent.repository.RolRepository;
import pe.edu.utp.smartdent.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class RegistroPacienteServiceUnitTest {

    @Mock UsuarioRepository usuarioRepository;
    @Mock RolRepository rolRepository;
    @Mock PasswordEncoder passwordEncoder;
    @InjectMocks RegistroPacienteService service;

    @Test
    void registraPacienteNormalizandoDatosYCifrandoLaContrasena() {
        var rol = new Rol(RolNombre.PACIENTE, "Paciente");
        when(rolRepository.findByNombre(RolNombre.PACIENTE)).thenReturn(Optional.of(rol));
        when(passwordEncoder.encode("Clave1234")).thenReturn("hash-seguro");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.registrar(new RegistroPacienteRequest(
                "  Ana Torres  ", " 76543210 ", " ANA@CORREO.COM ", "Clave1234", " 987654321 "));

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        Usuario guardado = captor.getValue();
        assertThat(response.email()).isEqualTo("ana@correo.com");
        assertThat(guardado.getNombreCompleto()).isEqualTo("Ana Torres");
        assertThat(guardado.getPasswordHash()).isEqualTo("hash-seguro");
        assertThat(guardado.getTelefono()).isEqualTo("987654321");
        assertThat(guardado.isActivo()).isTrue();
    }

    @Test
    void rechazaCorreoDuplicado() {
        when(usuarioRepository.existsByEmailIgnoreCase("ana@correo.com")).thenReturn(true);

        assertThatThrownBy(() -> service.registrar(request("ana@correo.com", "76543210")))
                .isInstanceOf(RecursoDuplicadoException.class)
                .hasMessageContaining("correo");
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void rechazaDniDuplicado() {
        when(usuarioRepository.existsByDni("76543210")).thenReturn(true);

        assertThatThrownBy(() -> service.registrar(request("ana@correo.com", "76543210")))
                .isInstanceOf(RecursoDuplicadoException.class)
                .hasMessageContaining("DNI");
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void informaCuandoNoExisteElRolPaciente() {
        when(rolRepository.findByNombre(RolNombre.PACIENTE)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.registrar(request("ana@correo.com", "76543210")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("PACIENTE");
    }

    private RegistroPacienteRequest request(String email, String dni) {
        return new RegistroPacienteRequest("Ana Torres", dni, email, "Clave1234", "987654321");
    }
}
