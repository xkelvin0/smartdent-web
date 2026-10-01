package pe.edu.utp.smartdent.dto.servicio;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ServicioRequest(
        @NotBlank(message = "El código es obligatorio")
        @Size(max = 40, message = "El código no puede superar 40 caracteres")
        String codigo,

        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 120, message = "El nombre no puede superar 120 caracteres")
        String nombre,

        @NotBlank(message = "La especialidad es obligatoria")
        @Size(max = 100, message = "La especialidad no puede superar 100 caracteres")
        String especialidad,

        @NotBlank(message = "La descripción es obligatoria")
        @Size(max = 600, message = "La descripción no puede superar 600 caracteres")
        String descripcion,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.00", message = "El precio no puede ser negativo")
        BigDecimal precio,

        @NotNull(message = "El costo es obligatorio")
        @DecimalMin(value = "0.00", message = "El costo no puede ser negativo")
        BigDecimal costo,

        @NotNull(message = "La duración es obligatoria")
        @Min(value = 15, message = "La duración mínima es de 15 minutos")
        @Max(value = 480, message = "La duración máxima es de 480 minutos")
        Integer duracionMinutos,

        @Size(max = 500, message = "La ruta de imagen no puede superar 500 caracteres")
        String imagenUrl,

        boolean activo) {
}
