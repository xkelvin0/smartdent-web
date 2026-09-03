package pe.edu.utp.smartdent.dto.paciente;

import jakarta.validation.constraints.Pattern;

public record ConfiguracionPacienteRequest(
        @Pattern(regexp = "^$|^[0-9+() -]{9,20}$", message = "Ingresa un teléfono válido de 9 a 20 caracteres")
        String telefono,
        boolean recordatoriosEmail,
        boolean recordatoriosTelefono) {
}
