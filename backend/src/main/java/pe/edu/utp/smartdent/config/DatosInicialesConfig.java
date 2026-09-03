package pe.edu.utp.smartdent.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import pe.edu.utp.smartdent.service.DatosInicialesService;

@Configuration
public class DatosInicialesConfig {

    @Bean
    ApplicationRunner inicializarDatos(DatosInicialesService datosInicialesService) {
        return args -> datosInicialesService.inicializar();
    }
}
