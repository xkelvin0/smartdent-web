package pe.edu.utp.smartdent.service;

import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.utp.smartdent.dto.auth.RegistroPacienteRequest;
import pe.edu.utp.smartdent.dto.auth.RegistroPacienteResponse;
import pe.edu.utp.smartdent.entity.Rol;
import pe.edu.utp.smartdent.entity.RolNombre;
import pe.edu.utp.smartdent.entity.Usuario;
import pe.edu.utp.smartdent.exception.RecursoDuplicadoException;
import pe.edu.utp.smartdent.repository.RolRepository;
import pe.edu.utp.smartdent.repository.UsuarioRepository;

@Service
public class RegistroPacienteService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    public RegistroPacienteService(
            UsuarioRepository usuarioRepository,
            RolRepository rolRepository,
            PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public RegistroPacienteResponse registrar(RegistroPacienteRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String dni = request.dni().trim();

        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new RecursoDuplicadoException("Ya existe una cuenta con ese correo electrónico");
        }

        if (usuarioRepository.existsByDni(dni)) {
            throw new RecursoDuplicadoException("Ya existe una cuenta con ese DNI");
        }

        Rol rolPaciente = rolRepository.findByNombre(RolNombre.PACIENTE)
                .orElseThrow(() -> new IllegalStateException("El rol PACIENTE no está configurado"));

        Usuario usuario = new Usuario();
        usuario.setNombreCompleto(request.nombreCompleto().trim());
        usuario.setDni(dni);
        usuario.setEmail(email);
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        usuario.setTelefono(normalizarTelefono(request.telefono()));
        usuario.setRol(rolPaciente);
        usuario.setActivo(true);

        return RegistroPacienteResponse.desde(usuarioRepository.save(usuario));
    }

    private String normalizarTelefono(String telefono) {
        if (telefono == null || telefono.isBlank()) {
            return null;
        }
        return telefono.trim();
    }
}
