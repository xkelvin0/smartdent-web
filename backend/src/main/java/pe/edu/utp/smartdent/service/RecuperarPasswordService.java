package pe.edu.utp.smartdent.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utp.smartdent.entity.PasswordResetToken;
import pe.edu.utp.smartdent.entity.Usuario;
import pe.edu.utp.smartdent.repository.PasswordResetTokenRepository;
import pe.edu.utp.smartdent.repository.UsuarioRepository;
import pe.edu.utp.smartdent.dto.auth.RecuperarPasswordRequest;
import pe.edu.utp.smartdent.dto.auth.ResetPasswordRequest;

import java.util.Optional;

@Service
public class RecuperarPasswordService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public RecuperarPasswordService(UsuarioRepository usuarioRepository,
                                    PasswordResetTokenRepository tokenRepository,
                                    EmailService emailService,
                                    PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void solicitarRecuperacion(RecuperarPasswordRequest request, String appBaseUrl) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmailIgnoreCase(request.email());
        if (usuarioOpt.isEmpty()) {
            return; // Retornamos para no revelar si el correo existe o no a un posible atacante
        }
        Usuario usuario = usuarioOpt.get();

        // Borrar token anterior si existe
        tokenRepository.deleteByUsuario(usuario);

        // Crear nuevo token
        PasswordResetToken resetToken = new PasswordResetToken(usuario);
        tokenRepository.save(resetToken);

        // Enviar correo (Se usa el origen real desde donde el usuario hizo la petición, así funciona en red local)
        String resetUrl = appBaseUrl + "/recuperar.html?token=" + resetToken.getToken();
        String asunto = "Recupera tu contraseña de SmartDent";
        String cuerpo = "<div style=\"font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px;\">" +
                "<h2 style=\"color: #071426; text-align: center;\">SmartDent - Recuperación de Contraseña</h2>" +
                "<p style=\"color: #334155; font-size: 16px;\">Hola <strong>" + usuario.getNombreCompleto() + "</strong>,</p>" +
                "<p style=\"color: #334155; font-size: 16px;\">Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva (este enlace es seguro y expirará en 15 minutos):</p>" +
                "<div style=\"text-align: center; margin: 30px 0;\">" +
                "<a href=\"" + resetUrl + "\" style=\"display: inline-block; padding: 12px 24px; color: white; background-color: #8a6d00; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;\">Restablecer Contraseña</a>" +
                "</div>" +
                "<p style=\"color: #64748b; font-size: 14px;\">Si no fuiste tú quien solicitó esto, ignora este mensaje. Tu cuenta sigue estando segura.</p>" +
                "</div>";

        emailService.enviarCorreo(usuario.getEmail(), asunto, cuerpo);
    }

    @Transactional
    public void resetearPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = tokenRepository.findByToken(request.token())
                .orElseThrow(() -> new RuntimeException("El token es inválido o no existe."));

        if (resetToken.isExpirado()) {
            tokenRepository.delete(resetToken);
            throw new RuntimeException("El token ha expirado. Solicita uno nuevo.");
        }

        Usuario usuario = resetToken.getUsuario();
        usuario.setPasswordHash(passwordEncoder.encode(request.nuevaPassword()));
        usuarioRepository.save(usuario);

        // Eliminar token ya usado por seguridad
        tokenRepository.delete(resetToken);
    }
}
