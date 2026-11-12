package pe.edu.utp.smartdent.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import pe.edu.utp.smartdent.entity.Notificacion;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    List<Notificacion> findTop30ByDestinatarioEmailIgnoreCaseOrderByCreadoEnDesc(String destinatarioEmail);

    List<Notificacion> findByDestinatarioEmailIgnoreCaseAndLeidaFalse(String destinatarioEmail);

    Optional<Notificacion> findByIdAndDestinatarioEmailIgnoreCase(Long id, String destinatarioEmail);
}

