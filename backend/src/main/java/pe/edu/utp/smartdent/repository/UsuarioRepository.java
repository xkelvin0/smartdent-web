package pe.edu.utp.smartdent.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import pe.edu.utp.smartdent.entity.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    List<Usuario> findAllByOrderByNombreCompletoAsc();

    Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByDni(String dni);
}
