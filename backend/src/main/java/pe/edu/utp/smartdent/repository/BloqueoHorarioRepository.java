package pe.edu.utp.smartdent.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import pe.edu.utp.smartdent.entity.BloqueoHorario;

public interface BloqueoHorarioRepository extends JpaRepository<BloqueoHorario, Long> {

    List<BloqueoHorario> findByOdontologo_Usuario_EmailIgnoreCaseAndFechaGreaterThanEqualOrderByFechaAscHoraInicioAsc(
            String email, LocalDate fecha);

    Optional<BloqueoHorario> findByIdAndOdontologo_Usuario_EmailIgnoreCase(Long id, String email);

    @Query("""
            select (count(b) > 0) from BloqueoHorario b
            where b.odontologo.id = :odontologoId
              and b.fecha = :fecha
              and b.horaInicio < :horaFin
              and b.horaFin > :horaInicio
            """)
    boolean existeCruce(
            @Param("odontologoId") Long odontologoId,
            @Param("fecha") LocalDate fecha,
            @Param("horaInicio") LocalTime horaInicio,
            @Param("horaFin") LocalTime horaFin);
}
