package pe.edu.utp.smartdent.dto.odontologo;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ActualizarOdontologoRequest(
        @NotBlank(message = "El nombre completo es obligatorio")
        @Size(min = 3, max = 120, message = "El nombre debe tener entre 3 y 120 caracteres")
        String nombreCompleto,

        @Pattern(regexp = "^$|^[0-9+() -]{7,20}$", message = "Ingresa un teléfono válido")
        String telefono,

        @NotBlank(message = "La especialidad es obligatoria")
        @Size(max = 100, message = "La especialidad no puede superar 100 caracteres")
        String especialidad,

        @NotBlank(message = "La colegiatura es obligatoria")
        @Size(max = 30, message = "La colegiatura no puede superar 30 caracteres")
        String colegiatura,

        @Size(max = 500, message = "La ruta de foto no puede superar 500 caracteres")
        String fotoUrl,

        boolean activo,

        @NotEmpty(message = "Selecciona al menos un servicio")
        List<Long> servicioIds) {
}
