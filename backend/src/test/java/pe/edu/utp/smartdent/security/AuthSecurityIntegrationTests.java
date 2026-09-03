package pe.edu.utp.smartdent.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.utp.smartdent.dto.auth.LoginRequest;
import pe.edu.utp.smartdent.dto.auth.LoginResponse;
import pe.edu.utp.smartdent.dto.auth.RegistroPacienteRequest;
import pe.edu.utp.smartdent.service.LoginService;
import pe.edu.utp.smartdent.service.RegistroPacienteService;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthSecurityIntegrationTests {

    @Autowired
    private RegistroPacienteService registroPacienteService;

    @Autowired
    private LoginService loginService;

    @Autowired
    private JwtDecoder jwtDecoder;

    @Autowired
    private MockMvc mockMvc;

    @Test
    void debeIniciarSesionYGenerarUnJwtValido() {
        Credenciales credenciales = registrarPaciente();

        LoginResponse response = loginService.iniciarSesion(
                new LoginRequest(credenciales.email(), credenciales.password()));
        Jwt jwt = jwtDecoder.decode(response.token());

        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.expiresIn()).isPositive();
        assertThat(jwt.getSubject()).isEqualTo(credenciales.email());
        assertThat(jwt.getClaimAsStringList("rol")).containsExactly("PACIENTE");
    }

    @Test
    void debePermitirConsultarElPerfilConToken() throws Exception {
        Credenciales credenciales = registrarPaciente();
        LoginResponse login = loginService.iniciarSesion(
                new LoginRequest(credenciales.email(), credenciales.password()));

        mockMvc.perform(get("/api/auth/perfil")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + login.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(credenciales.email()))
                .andExpect(jsonPath("$.rol").value("PACIENTE"));
    }

    @Test
    void debeRechazarElPerfilSinToken() throws Exception {
        mockMvc.perform(get("/api/auth/perfil"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Debes iniciar sesión con un token válido"));
    }

    @Test
    void debeRechazarUnaPasswordIncorrecta() throws Exception {
        Credenciales credenciales = registrarPaciente();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "PasswordIncorrecta9"
                                }
                                """.formatted(credenciales.email())))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("El correo o la contraseña son incorrectos"));
    }

    @Test
    void debePermitirPeticionesDesdeLiveServer() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                        .header(HttpHeaders.ORIGIN, "http://127.0.0.1:5500")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isOk())
                .andExpect(result -> assertThat(
                        result.getResponse().getHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN))
                        .isEqualTo("http://127.0.0.1:5500"));
    }

    private Credenciales registrarPaciente() {
        String identificador = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        String email = "jwt." + identificador + "@smartdent.test";
        String password = "ClaveJwt123";
        int numeroDni = Math.abs(UUID.randomUUID().hashCode() % 90_000_000) + 10_000_000;

        registroPacienteService.registrar(new RegistroPacienteRequest(
                "Paciente JWT",
                Integer.toString(numeroDni),
                email,
                password,
                "987654321"));

        return new Credenciales(email, password);
    }

    private record Credenciales(String email, String password) {
    }
}
