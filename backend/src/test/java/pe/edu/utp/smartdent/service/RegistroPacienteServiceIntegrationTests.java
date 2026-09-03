package pe.edu.utp.smartdent.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.utp.smartdent.dto.auth.RegistroPacienteRequest;
import pe.edu.utp.smartdent.dto.auth.RegistroPacienteResponse;
import pe.edu.utp.smartdent.entity.RolNombre;
import pe.edu.utp.smartdent.entity.Usuario;
import pe.edu.utp.smartdent.exception.RecursoDuplicadoException;
import pe.edu.utp.smartdent.repository.UsuarioRepository;

@SpringBootTest
@Transactional
class RegistroPacienteServiceIntegrationTests {

    @Autowired
    private RegistroPacienteService registroPacienteService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void debeRegistrarUnPacienteConPasswordCifrado() {
        String identificador = UUID.randomUUID().toString().substring(0, 8);
        String email = "paciente." + identificador + "@smartdent.test";
        String password = "Clave1234";
        RegistroPacienteRequest request = new RegistroPacienteRequest(
                "Paciente de Prueba",
                generarDni(),
                email,
                password,
                "987654321");

        RegistroPacienteResponse response = registroPacienteService.registrar(request);
        Usuario guardado = usuarioRepository.findByEmailIgnoreCase(email).orElseThrow();

        assertThat(response.id()).isNotNull();
        assertThat(response.rol()).isEqualTo(RolNombre.PACIENTE.name());
        assertThat(guardado.getPasswordHash()).isNotEqualTo(password);
        assertThat(passwordEncoder.matches(password, guardado.getPasswordHash())).isTrue();
    }

    @Test
    void debeRechazarUnCorreoDuplicado() {
        String identificador = UUID.randomUUID().toString().substring(0, 8);
        String email = "duplicado." + identificador + "@smartdent.test";
        registroPacienteService.registrar(new RegistroPacienteRequest(
                "Primer Paciente",
                generarDni(),
                email,
                "Clave1234",
                null));

        RegistroPacienteRequest duplicado = new RegistroPacienteRequest(
                "Segundo Paciente",
                generarDni(),
                email.toUpperCase(),
                "OtraClave9",
                null);

        assertThatThrownBy(() -> registroPacienteService.registrar(duplicado))
                .isInstanceOf(RecursoDuplicadoException.class)
                .hasMessage("Ya existe una cuenta con ese correo electrónico");
    }

    private String generarDni() {
        int numero = Math.abs(UUID.randomUUID().hashCode() % 90_000_000) + 10_000_000;
        return Integer.toString(numero);
    }
}
