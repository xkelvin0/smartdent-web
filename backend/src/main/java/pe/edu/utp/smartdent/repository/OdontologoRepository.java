package pe.edu.utp.smartdent.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import pe.edu.utp.smartdent.entity.Odontologo;

public interface OdontologoRepository extends JpaRepository<Odontologo, Long> {

    List<Odontologo> findByUsuario_ActivoTrueOrderByUsuario_NombreCompletoAsc();

    List<Odontologo> findAllByOrderByUsuario_NombreCompletoAsc();

    Optional<Odontologo> findByUsuarioEmailIgnoreCase(String email);

    Optional<Odontologo> findByCodigoIgnoreCase(String codigo);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Odontologo o where o.id = :id")
    Optional<Odontologo> buscarPorIdParaReserva(@Param("id") Long id);

    Optional<Odontologo> findByColegiaturaIgnoreCase(String colegiatura);

    boolean existsByColegiatura(String colegiatura);

    boolean existsByCodigoIgnoreCase(String codigo);
}
