package pe.edu.utp.smartdent.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.utp.smartdent.entity.PasswordResetToken;
import pe.edu.utp.smartdent.entity.Usuario;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
    Optional<PasswordResetToken> findByUsuario(Usuario usuario);
    void deleteByUsuario(Usuario usuario);
}
