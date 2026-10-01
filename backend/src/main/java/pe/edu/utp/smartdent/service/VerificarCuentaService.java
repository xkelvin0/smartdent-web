package pe.edu.utp.smartdent.service;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utp.smartdent.entity.VerificationToken;
import pe.edu.utp.smartdent.entity.Usuario;
import pe.edu.utp.smartdent.repository.VerificationTokenRepository;
import pe.edu.utp.smartdent.repository.UsuarioRepository;
import pe.edu.utp.smartdent.dto.auth.VerificarCuentaRequest;
@Service
public class VerificarCuentaService {
    private final VerificationTokenRepository tokenRepository;
    private final UsuarioRepository usuarioRepository;
    public VerificarCuentaService(VerificationTokenRepository tokenRepository, UsuarioRepository usuarioRepository) {
        this.tokenRepository = tokenRepository;
        this.usuarioRepository = usuarioRepository;
    }
    @Transactional
    public void verificarCuenta(VerificarCuentaRequest request) {
        VerificationToken token = tokenRepository.findByToken(request.token())
            .orElseThrow(() -> new RuntimeException("El enlace no es válido o no existe."));
        if (token.isExpirado()) {
            tokenRepository.delete(token);
            throw new RuntimeException("El enlace ha expirado. Por favor contacta a soporte para un nuevo enlace.");
        }
        Usuario usuario = token.getUsuario();
        usuario.setActivo(true);
        usuarioRepository.save(usuario);
        tokenRepository.delete(token);
    }
}
