package pe.edu.utp.smartdent.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.utp.smartdent.entity.VerificationToken;
import pe.edu.utp.smartdent.entity.Usuario;
import java.util.Optional;
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    Optional<VerificationToken> findByToken(String token);
    void deleteByUsuario(Usuario usuario);
}
