package pe.edu.utp.smartdent.dto.paciente;

import pe.edu.utp.smartdent.entity.Usuario;

public record ConfiguracionPacienteResponse(
        String telefono,
        boolean recordatoriosEmail,
        boolean recordatoriosTelefono) {

    public static ConfiguracionPacienteResponse desde(Usuario usuario) {
        return new ConfiguracionPacienteResponse(
                usuario.getTelefono(),
                usuario.isRecordatoriosEmail(),
                usuario.isRecordatoriosTelefono());
    }
}
