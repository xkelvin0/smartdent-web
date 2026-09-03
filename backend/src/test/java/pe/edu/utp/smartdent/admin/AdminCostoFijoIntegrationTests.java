package pe.edu.utp.smartdent.admin;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import pe.edu.utp.smartdent.service.LoginService;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminCostoFijoIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private LoginService loginService;

    @Test
    void adminDebeLeerYActualizarCostosFijos() throws Exception {
        LoginResponse admin = loginService.iniciarSesion(new LoginRequest("admin@smartdent.com", "Admin123"));

        mockMvc.perform(get("/api/admin/reportes/costos-fijos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + admin.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alquiler").exists())
                .andExpect(jsonPath("$.planilla").exists());

        mockMvc.perform(put("/api/admin/reportes/costos-fijos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + admin.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "alquiler": 3000,
                                  "planilla": 9000,
                                  "servicios": 750,
                                  "marketing": 450,
                                  "otros": 500
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alquiler").value(3000))
                .andExpect(jsonPath("$.planilla").value(9000))
                .andExpect(jsonPath("$.servicios").value(750))
                .andExpect(jsonPath("$.marketing").value(450))
                .andExpect(jsonPath("$.otros").value(500));
    }

    @Test
    void odontologoNoDebeActualizarCostosFijos() throws Exception {
        LoginResponse odontologo = loginService.iniciarSesion(new LoginRequest("carlos.mendoza@smartdent.com", "Carlos123"));

        mockMvc.perform(put("/api/admin/reportes/costos-fijos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + odontologo.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "alquiler": 3000,
                                  "planilla": 9000,
                                  "servicios": 750,
                                  "marketing": 450,
                                  "otros": 500
                                }
                                """))
                .andExpect(status().isForbidden());
    }
}
