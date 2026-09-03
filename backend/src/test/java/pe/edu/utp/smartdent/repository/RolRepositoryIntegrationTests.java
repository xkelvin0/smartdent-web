package pe.edu.utp.smartdent.repository;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import pe.edu.utp.smartdent.entity.RolNombre;

@SpringBootTest
class RolRepositoryIntegrationTests {

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void debeInicializarLosTresRolesDelSistema() {
        assertThat(rolRepository.findByNombre(RolNombre.PACIENTE)).isPresent();
        assertThat(rolRepository.findByNombre(RolNombre.ODONTOLOGO)).isPresent();
        assertThat(rolRepository.findByNombre(RolNombre.ADMIN)).isPresent();
    }

    @Test
    void debeCrearLasTresTablasIniciales() {
        Integer cantidad = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = DATABASE()
                  AND table_name IN ('roles', 'usuarios', 'odontologos')
                """, Integer.class);

        assertThat(cantidad).isEqualTo(3);
    }
}
