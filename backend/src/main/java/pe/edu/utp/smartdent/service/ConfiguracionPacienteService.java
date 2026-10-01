package pe.edu.utp.smartdent.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.utp.smartdent.dto.paciente.ConfiguracionPacienteRequest;
import pe.edu.utp.smartdent.dto.paciente.ConfiguracionPacienteResponse;
import pe.edu.utp.smartdent.entity.Usuario;
import pe.edu.utp.smartdent.repository.UsuarioRepository;

@Service
public class ConfiguracionPacienteService {

    private final UsuarioRepository usuarioRepository;

    public ConfiguracionPacienteService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public ConfiguracionPacienteResponse obtener(String email) {
        return ConfiguracionPacienteResponse.desde(buscarPaciente(email));
    }

    @Transactional
    public ConfiguracionPacienteResponse actualizar(String email, ConfiguracionPacienteRequest request) {
        Usuario usuario = buscarPaciente(email);
        usuario.setTelefono(normalizarTelefono(request.telefono()));
        usuario.setRecordatoriosEmail(request.recordatoriosEmail());
        usuario.setRecordatoriosTelefono(request.recordatoriosTelefono());
        return ConfiguracionPacienteResponse.desde(usuarioRepository.save(usuario));
    }

    private Usuario buscarPaciente(String email) {
        return usuarioRepository.findByEmailIgnoreCase(email)
                .filter(Usuario::isActivo)
                .filter(usuario -> "PACIENTE".equals(usuario.getRol().getNombre().name()))
                .orElseThrow(() -> new IllegalStateException("El paciente autenticado no está disponible"));
    }

    private String normalizarTelefono(String telefono) {
        return telefono == null || telefono.isBlank() ? null : telefono.trim();
    }
}
