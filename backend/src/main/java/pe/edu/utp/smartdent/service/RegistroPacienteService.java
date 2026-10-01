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
    private final EmailService emailService;
    private final pe.edu.utp.smartdent.repository.VerificationTokenRepository verificationTokenRepository;

    public RegistroPacienteService(
            UsuarioRepository usuarioRepository,
            RolRepository rolRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            pe.edu.utp.smartdent.repository.VerificationTokenRepository verificationTokenRepository) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.verificationTokenRepository = verificationTokenRepository;
    }

    @Transactional
    public RegistroPacienteResponse registrar(RegistroPacienteRequest request, String appBaseUrl) {
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
        usuario.setActivo(false); // Inactivo hasta verificar

        Usuario usuarioGuardado = usuarioRepository.save(usuario);

        // Crear token de verificación
        pe.edu.utp.smartdent.entity.VerificationToken token = new pe.edu.utp.smartdent.entity.VerificationToken(usuarioGuardado);
        verificationTokenRepository.save(token);

        // Enviar correo
        String verifyUrl = appBaseUrl + "/login.html?verificar=" + token.getToken();
        String asunto = "Activa tu cuenta de SmartDent";
        String cuerpo = "<div style=\"font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px;\">" +
                "<h2 style=\"color: #071426; text-align: center;\">¡Bienvenido a SmartDent!</h2>" +
                "<p style=\"color: #334155; font-size: 16px;\">Hola <strong>" + usuarioGuardado.getNombreCompleto() + "</strong>,</p>" +
                "<p style=\"color: #334155; font-size: 16px;\">Gracias por registrarte. Para poder iniciar sesión y agendar citas, necesitamos verificar tu correo haciendo clic en el siguiente botón:</p>" +
                "<div style=\"text-align: center; margin: 30px 0;\">" +
                "<a href=\"" + verifyUrl + "\" style=\"display: inline-block; padding: 12px 24px; color: white; background-color: #8a6d00; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;\">Verificar mi cuenta</a>" +
                "</div>" +
                "<p style=\"color: #64748b; font-size: 14px;\">Este enlace expirará en 24 horas.</p>" +
                "</div>";

        emailService.enviarCorreo(usuarioGuardado.getEmail(), asunto, cuerpo);

        return RegistroPacienteResponse.desde(usuarioGuardado);
    }

    private String normalizarTelefono(String telefono) {
        if (telefono == null || telefono.isBlank()) {
            return null;
        }
        return telefono.trim();
    }
}
