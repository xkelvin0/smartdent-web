package pe.edu.utp.smartdent.dto.historia;

import java.time.LocalDate;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import pe.edu.utp.smartdent.entity.EtapaTratamiento;

public record GuardarHistoriaClinicaRequest(
        Long citaId,

        @NotNull(message = "Selecciona la etapa del tratamiento")
        EtapaTratamiento etapaTratamiento,

        @Size(max = 1500, message = "Los antecedentes no pueden superar 1500 caracteres")
        String alergias,

        @NotBlank(message = "Ingresa el diagnóstico")
        @Size(max = 2500, message = "El diagnóstico no puede superar 2500 caracteres")
        String diagnostico,

        @NotBlank(message = "Ingresa el tratamiento realizado")
        @Size(max = 2500, message = "El tratamiento no puede superar 2500 caracteres")
        String tratamiento,

        @Size(max = 2500, message = "Las indicaciones no pueden superar 2500 caracteres")
        String indicaciones,

        @FutureOrPresent(message = "El próximo control no puede estar en el pasado")
        LocalDate proximoControl,

        @Size(max = 1500, message = "Las observaciones no pueden superar 1500 caracteres")
        String observaciones) {
}
