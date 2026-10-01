package pe.edu.utp.smartdent.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import pe.edu.utp.smartdent.entity.HistoriaClinica;

public interface HistoriaClinicaRepository extends JpaRepository<HistoriaClinica, Long> {

    List<HistoriaClinica> findByPaciente_EmailIgnoreCaseOrderByActualizadoEnDesc(String emailPaciente);

    Optional<HistoriaClinica> findByPaciente_EmailIgnoreCaseAndOdontologo_Usuario_EmailIgnoreCase(
            String emailPaciente, String emailOdontologo);
}
