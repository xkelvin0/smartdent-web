package pe.edu.utp.smartdent.cita;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.jayway.jsonpath.JsonPath;

import pe.edu.utp.smartdent.dto.auth.LoginRequest;
import pe.edu.utp.smartdent.dto.auth.RegistroPacienteRequest;
import pe.edu.utp.smartdent.repository.OdontologoRepository;
import pe.edu.utp.smartdent.repository.ServicioRepository;
import pe.edu.utp.smartdent.service.LoginService;
import pe.edu.utp.smartdent.service.RegistroPacienteService;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CitaApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private LoginService loginService;

    @Autowired
    private RegistroPacienteService registroPacienteService;

    @Autowired
    private OdontologoRepository odontologoRepository;

    @Autowired
    private ServicioRepository servicioRepository;

    @Test
    void flujoRestDebeGuardarYPublicarLaCitaSegunElRol() throws Exception {
        String identificador = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        String email = "api.cita." + identificador + "@smartdent.test";
        String dni = String.format("%08d", Math.floorMod(UUID.randomUUID().hashCode(), 100_000_000));
        registroPacienteService.registrar(new RegistroPacienteRequest(
                "Paciente API", dni, email, "Clave1234", "987654321"));
        String tokenPaciente = loginService.iniciarSesion(new LoginRequest(email, "Clave1234")).token();
        String tokenOdontologo = loginService.iniciarSesion(
                new LoginRequest("carlos.mendoza@smartdent.com", "Carlos123")).token();
        String tokenAdmin = loginService.iniciarSesion(
                new LoginRequest("admin@smartdent.com", "Admin123")).token();
        var odontologo = odontologoRepository.findByCodigoIgnoreCase("DOC-CARLOS-MENDOZA").orElseThrow();
        var servicio = servicioRepository.findByCodigoIgnoreCase("SRV-CONSULTA").orElseThrow();
        LocalDate fecha = LocalDate.now().plusDays(8);
        while (fecha.getDayOfWeek() == DayOfWeek.SUNDAY) {
            fecha = fecha.plusDays(1);
        }

        String reservaJson = mockMvc.perform(post("/api/pacientes/citas")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenPaciente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "odontologoId": %d,
                                  "servicioId": %d,
                                  "fecha": "%s",
                                  "horaInicio": "15:00",
                                  "motivo": "Control preventivo",
                                  "telefono": "987654321"
                                }
                                """.formatted(odontologo.getId(), servicio.getId(), fecha)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.pacienteEmail").value(email))
                .andExpect(jsonPath("$.estado").value("PENDIENTE"))
                .andReturn().getResponse().getContentAsString();
        Number citaId = JsonPath.read(reservaJson, "$.id");

        mockMvc.perform(get("/api/odontologos/mi-agenda")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOdontologo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.pacienteEmail == '%s')]".formatted(email)).exists());

        mockMvc.perform(get("/api/admin/citas")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.pacienteEmail == '%s')]".formatted(email)).exists());

        mockMvc.perform(patch("/api/admin/citas/{id}/estado", citaId.longValue())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"CONFIRMADA\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("CONFIRMADA"));

        mockMvc.perform(get("/api/admin/citas")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenPaciente))
                .andExpect(status().isForbidden());
    }
}
