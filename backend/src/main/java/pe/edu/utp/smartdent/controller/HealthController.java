package pe.edu.utp.smartdent.controller;

import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public Map<String, String> health() {
        String database = jdbcTemplate.queryForObject("SELECT DATABASE()", String.class);

        return Map.of(
                "status", "UP",
                "application", "smartdent-backend",
                "database", database == null ? "sin seleccionar" : database);
    }
}
