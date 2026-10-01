package pe.edu.utp.smartdent.dto.admin;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record CostoFijoRequest(
        @NotNull(message = "El alquiler es obligatorio")
        @DecimalMin(value = "0.00", message = "El alquiler no puede ser negativo")
        BigDecimal alquiler,

        @NotNull(message = "La planilla es obligatoria")
        @DecimalMin(value = "0.00", message = "La planilla no puede ser negativa")
        BigDecimal planilla,

        @NotNull(message = "El costo de servicios es obligatorio")
        @DecimalMin(value = "0.00", message = "El costo de servicios no puede ser negativo")
        BigDecimal servicios,

        @NotNull(message = "El marketing es obligatorio")
        @DecimalMin(value = "0.00", message = "El marketing no puede ser negativo")
        BigDecimal marketing,

        @NotNull(message = "Otros costos son obligatorios")
        @DecimalMin(value = "0.00", message = "Otros costos no pueden ser negativos")
        BigDecimal otros) {
}
