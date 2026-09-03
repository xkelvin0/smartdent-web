package pe.edu.utp.smartdent.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class OpenApiConfig {

    public static final String JWT_SCHEME = "bearerAuth";

    @Bean
    OpenAPI smartDentOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("SmartDent API REST")
                        .version("1.0.0")
                        .description("API para autenticación, citas, historias clínicas y administración de SmartDent.")
                        .contact(new Contact().name("Equipo SmartDent").email("contacto@smartdent.pe"))
                        .license(new License().name("Proyecto académico UTP")))
                .components(new Components().addSecuritySchemes(JWT_SCHEME,
                        new SecurityScheme()
                                .name(JWT_SCHEME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Pega únicamente el token obtenido en POST /api/auth/login.")))
                .addSecurityItem(new SecurityRequirement().addList(JWT_SCHEME));
    }
}
