package pe.edu.utp.smartdent.usuario;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import pe.edu.utp.smartdent.entity.Servicio;
import pe.edu.utp.smartdent.repository.ServicioRepository;
import pe.edu.utp.smartdent.service.LoginService;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminUsuarioIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private LoginService loginService;

    @Autowired
    private ServicioRepository servicioRepository;

    @Test
    void debeListarUsuariosRealesSinExponerContrasenas() throws Exception {
        LoginResponse admin = loginService.iniciarSesion(new LoginRequest("admin@smartdent.com", "Admin123"));

        mockMvc.perform(get("/api/admin/usuarios")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + admin.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").exists())
                .andExpect(jsonPath("$[0].rol").exists())
                .andExpect(jsonPath("$[0].passwordHash").doesNotExist());
    }

    @Test
    void debeCrearOdontologoConServiciosYPermitirSuInicioDeSesion() throws Exception {
        LoginResponse admin = loginService.iniciarSesion(new LoginRequest("admin@smartdent.com", "Admin123"));
        Servicio consulta = servicioRepository.findByCodigoIgnoreCase("SRV-CONSULTA").orElseThrow();
        String body = """
                {
                  "codigo": "DOC-PRUEBA-INTEGRACION",
                  "nombreCompleto": "Dra. Prueba Integración",
                  "dni": "49999991",
                  "email": "prueba.integracion@smartdent.test",
                  "password": "Prueba123",
                  "telefono": "987654399",
                  "especialidad": "Odontología General",
                  "colegiatura": "COP-99991",
                  "fotoUrl": "profesional-prueba.webp",
                  "servicioIds": [%d]
                }
                """.formatted(consulta.getId());

        mockMvc.perform(post("/api/admin/odontologos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + admin.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombreCompleto").value("Dra. Prueba Integración"))
                .andExpect(jsonPath("$.servicioIds", hasSize(1)))
                .andExpect(jsonPath("$.servicioIds[0]").value(consulta.getId()));

        LoginResponse profesional = loginService.iniciarSesion(
                new LoginRequest("prueba.integracion@smartdent.test", "Prueba123"));
        org.junit.jupiter.api.Assertions.assertEquals("ODONTOLOGO", profesional.usuario().rol());

        mockMvc.perform(get("/api/odontologos").param("servicioId", consulta.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.nombreCompleto == 'Dra. Prueba Integración')]", hasSize(1)));
    }
}
