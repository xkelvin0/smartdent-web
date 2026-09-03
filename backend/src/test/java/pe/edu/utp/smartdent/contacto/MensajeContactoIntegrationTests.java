package pe.edu.utp.smartdent.contacto;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
import pe.edu.utp.smartdent.dto.contacto.CrearMensajeContactoRequest;
import pe.edu.utp.smartdent.dto.contacto.MensajeContactoResponse;
import pe.edu.utp.smartdent.service.LoginService;
import pe.edu.utp.smartdent.service.MensajeContactoService;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class MensajeContactoIntegrationTests {

    @Autowired MockMvc mockMvc;
    @Autowired LoginService loginService;
    @Autowired MensajeContactoService mensajeContactoService;

    @Test
    void visitanteDebePoderEnviarUnMensajeSinIniciarSesion() throws Exception {
        mockMvc.perform(post("/api/contacto/mensajes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nombre":"Ana Torres","email":"ana@correo.com","telefono":"987654321",
                                 "asunto":"Consulta sobre una cita","mensaje":"Deseo conocer los horarios disponibles."}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("NUEVO"));
    }

    @Test
    void adminDebeListarYActualizarElEstadoDelMensaje() throws Exception {
        MensajeContactoResponse mensaje = mensajeContactoService.crear(new CrearMensajeContactoRequest(
                "Luis Pérez", "luis@correo.com", "", "Facturación", "Necesito consultar mi comprobante."));
        String token = loginService.iniciarSesion(new LoginRequest("admin@smartdent.com", "Admin123")).token();

        mockMvc.perform(get("/api/admin/mensajes").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(mensaje.id()));

        mockMvc.perform(patch("/api/admin/mensajes/{id}/estado", mensaje.id())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"RESPONDIDO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("RESPONDIDO"));
    }
}
