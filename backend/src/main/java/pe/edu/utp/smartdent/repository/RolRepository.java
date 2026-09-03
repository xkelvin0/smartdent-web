package pe.edu.utp.smartdent.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import pe.edu.utp.smartdent.entity.Rol;
import pe.edu.utp.smartdent.entity.RolNombre;

public interface RolRepository extends JpaRepository<Rol, Long> {

    Optional<Rol> findByNombre(RolNombre nombre);

    boolean existsByNombre(RolNombre nombre);
}
