package pe.edu.utp.smartdent.admin;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.utp.smartdent.dto.auth.LoginRequest;
import pe.edu.utp.smartdent.dto.auth.LoginResponse;
import pe.edu.utp.smartdent.service.LoginService;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminResumenIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private LoginService loginService;

    @Test
    void adminDebePoderConsultarResumenOperativo() throws Exception {
        LoginResponse admin = loginService.iniciarSesion(new LoginRequest("admin@smartdent.com", "Admin123"));

        mockMvc.perform(get("/api/admin/citas/resumen")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + admin.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCitas").exists())
                .andExpect(jsonPath("$.citasPendientes").exists())
                .andExpect(jsonPath("$.pacientesRegistrados").exists())
                .andExpect(jsonPath("$.serviciosActivos").exists())
                .andExpect(jsonPath("$.ingresoEstimado").exists());
    }

    @Test
    void odontologoNoDebeAccederAlResumenAdmin() throws Exception {
        LoginResponse odontologo = loginService.iniciarSesion(new LoginRequest("carlos.mendoza@smartdent.com", "Carlos123"));

        mockMvc.perform(get("/api/admin/citas/resumen")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + odontologo.token()))
                .andExpect(status().isForbidden());
    }
}
