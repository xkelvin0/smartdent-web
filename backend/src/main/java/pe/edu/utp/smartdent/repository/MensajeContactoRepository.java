package pe.edu.utp.smartdent.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import pe.edu.utp.smartdent.entity.MensajeContacto;

public interface MensajeContactoRepository extends JpaRepository<MensajeContacto, Long> {
    List<MensajeContacto> findAllByOrderByCreadoEnDesc();
}
