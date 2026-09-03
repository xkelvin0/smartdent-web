package pe.edu.utp.smartdent.paciente;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.utp.smartdent.dto.auth.LoginRequest;
import pe.edu.utp.smartdent.dto.auth.RegistroPacienteRequest;
import pe.edu.utp.smartdent.service.LoginService;
import pe.edu.utp.smartdent.service.RegistroPacienteService;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ConfiguracionPacienteIntegrationTests {

    @Autowired MockMvc mockMvc;
    @Autowired RegistroPacienteService registroPacienteService;
    @Autowired LoginService loginService;

    @Test
    void debeGuardarYRecuperarLaConfiguracionDelPaciente() throws Exception {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        String email = "config." + suffix + "@smartdent.test";
        String password = "ClaveConfig123";
        String dni = String.valueOf(Math.abs(UUID.randomUUID().hashCode() % 90_000_000) + 10_000_000);
        registroPacienteService.registrar(new RegistroPacienteRequest(
                "Paciente Configuración", dni, email, password, "987654321"));
        String token = loginService.iniciarSesion(new LoginRequest(email, password)).token();

        mockMvc.perform(put("/api/pacientes/configuracion")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "telefono": "999888777",
                                  "recordatoriosEmail": false,
                                  "recordatoriosTelefono": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.telefono").value("999888777"))
                .andExpect(jsonPath("$.recordatoriosTelefono").value(true));

        mockMvc.perform(get("/api/pacientes/configuracion")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recordatoriosEmail").value(false))
                .andExpect(jsonPath("$.recordatoriosTelefono").value(true));
    }
}
