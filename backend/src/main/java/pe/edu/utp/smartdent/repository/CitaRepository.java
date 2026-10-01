package pe.edu.utp.smartdent.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import pe.edu.utp.smartdent.entity.Cita;
import pe.edu.utp.smartdent.entity.CitaEstado;

public interface CitaRepository extends JpaRepository<Cita, Long> {

    List<Cita> findByPaciente_EmailIgnoreCaseOrderByFechaDescHoraInicioDesc(String email);

    List<Cita> findByOdontologo_Usuario_EmailIgnoreCaseOrderByFechaAscHoraInicioAsc(String email);

    List<Cita> findAllByOrderByFechaDescHoraInicioDesc();

    List<Cita> findByPaciente_IdAndServicio_IdOrderByCreadoEnDesc(Long pacienteId, Long servicioId);

    Optional<Cita> findByIdAndPaciente_EmailIgnoreCase(Long id, String email);

    Optional<Cita> findByIdAndOdontologo_Usuario_EmailIgnoreCase(Long id, String email);

    boolean existsByPaciente_EmailIgnoreCaseAndOdontologo_Usuario_EmailIgnoreCase(
            String emailPaciente, String emailOdontologo);

    @Query("""
            select (count(c) > 0) from Cita c
            where c.odontologo.id = :odontologoId
              and c.fecha = :fecha
              and c.estado in :estados
              and c.horaInicio < :horaFin
              and c.horaFin > :horaInicio
            """)
    boolean existeCruceOdontologo(
            @Param("odontologoId") Long odontologoId,
            @Param("fecha") LocalDate fecha,
            @Param("horaInicio") LocalTime horaInicio,
            @Param("horaFin") LocalTime horaFin,
            @Param("estados") Collection<CitaEstado> estados);

    @Query("""
            select (count(c) > 0) from Cita c
            where c.odontologo.id = :odontologoId
              and c.fecha = :fecha
              and c.estado in :estados
              and c.id <> :excluirId
              and c.horaInicio < :horaFin
              and c.horaFin > :horaInicio
            """)
    boolean existeCruceOdontologoExcluyendo(
            @Param("odontologoId") Long odontologoId,
            @Param("fecha") LocalDate fecha,
            @Param("horaInicio") LocalTime horaInicio,
            @Param("horaFin") LocalTime horaFin,
            @Param("estados") Collection<CitaEstado> estados,
            @Param("excluirId") Long excluirId);

    @Query("""
            select (count(c) > 0) from Cita c
            where lower(c.paciente.email) = lower(:email)
              and c.fecha = :fecha
              and c.estado in :estados
              and c.horaInicio < :horaFin
              and c.horaFin > :horaInicio
            """)
    boolean existeCrucePaciente(
            @Param("email") String email,
            @Param("fecha") LocalDate fecha,
            @Param("horaInicio") LocalTime horaInicio,
            @Param("horaFin") LocalTime horaFin,
            @Param("estados") Collection<CitaEstado> estados);

    @Query("""
            select (count(c) > 0) from Cita c
            where lower(c.paciente.email) = lower(:email)
              and c.fecha = :fecha
              and c.estado in :estados
              and c.id <> :excluirId
              and c.horaInicio < :horaFin
              and c.horaFin > :horaInicio
            """)
    boolean existeCrucePacienteExcluyendo(
            @Param("email") String email,
            @Param("fecha") LocalDate fecha,
            @Param("horaInicio") LocalTime horaInicio,
            @Param("horaFin") LocalTime horaFin,
            @Param("estados") Collection<CitaEstado> estados,
            @Param("excluirId") Long excluirId);
}
