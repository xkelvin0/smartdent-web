package pe.edu.utp.smartdent.catalogo;

import static org.hamcrest.Matchers.hasSize;
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
import pe.edu.utp.smartdent.dto.auth.LoginResponse;
import pe.edu.utp.smartdent.dto.auth.RegistroPacienteRequest;
import pe.edu.utp.smartdent.service.LoginService;
import pe.edu.utp.smartdent.service.RegistroPacienteService;
import pe.edu.utp.smartdent.entity.Servicio;
import pe.edu.utp.smartdent.repository.ServicioRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CatalogoApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private LoginService loginService;

    @Autowired
    private RegistroPacienteService registroPacienteService;

    @Autowired
    private ServicioRepository servicioRepository;

    @Test
    void debePublicarLosDieciseisServiciosSinExponerCostos() throws Exception {
        mockMvc.perform(get("/api/servicios"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(16)))
                .andExpect(jsonPath("$[0].precio").exists())
                .andExpect(jsonPath("$[0].costo").doesNotExist());
    }

    @Test
    void debePublicarLosCuatroOdontologosSinExponerSusCredenciales() throws Exception {
        mockMvc.perform(get("/api/odontologos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[0].especialidad").exists())
                .andExpect(jsonPath("$[0].email").doesNotExist());
    }

    @Test
    void debePermitirAlAdminConsultarCostos() throws Exception {
        LoginResponse login = loginService.iniciarSesion(
                new LoginRequest("admin@smartdent.com", "Admin123"));

        mockMvc.perform(get("/api/admin/servicios")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + login.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(16)))
                .andExpect(jsonPath("$[0].costo").exists());
    }

    @Test
    void debeImpedirQueUnPacienteEntreAlCatalogoAdministrativo() throws Exception {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        String email = "catalogo." + suffix + "@smartdent.test";
        int dni = Math.abs(UUID.randomUUID().hashCode() % 90_000_000) + 10_000_000;
        registroPacienteService.registrar(new RegistroPacienteRequest(
                "Paciente Catálogo",
                Integer.toString(dni),
                email,
                "Clave1234",
                null));
        LoginResponse login = loginService.iniciarSesion(new LoginRequest(email, "Clave1234"));

        mockMvc.perform(get("/api/admin/servicios")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + login.token()))
                .andExpect(status().isForbidden());
    }

    @Test
    void debePermitirAlAdminActualizarUnaTarifaYPublicarlaSinElCosto() throws Exception {
        LoginResponse login = loginService.iniciarSesion(
                new LoginRequest("admin@smartdent.com", "Admin123"));
        Servicio servicio = servicioRepository.findByCodigoIgnoreCase("SRV-CONSULTA").orElseThrow();
        String body = """
                {
                  "codigo": "SRV-CONSULTA",
                  "nombre": "Consulta y Diagnóstico",
                  "especialidad": "Prevención",
                  "descripcion": "Evaluación integral de la salud bucal.",
                  "precio": 95.00,
                  "costo": 20.00,
                  "duracionMinutos": 35,
                  "imagenUrl": null,
                  "activo": true
                }
                """;

        mockMvc.perform(put("/api/admin/servicios/{id}", servicio.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + login.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.precio").value(95.00))
                .andExpect(jsonPath("$.costo").value(20.00))
                .andExpect(jsonPath("$.duracionMinutos").value(35));

        mockMvc.perform(get("/api/servicios/{id}", servicio.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.precio").value(95.00))
                .andExpect(jsonPath("$.costo").doesNotExist());
    }
}
