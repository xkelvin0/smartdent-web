package pe.edu.utp.smartdent.dto.historia;

import java.time.LocalDate;
import java.time.LocalDateTime;

import pe.edu.utp.smartdent.entity.EtapaTratamiento;
import pe.edu.utp.smartdent.entity.HistoriaClinica;

public record HistoriaClinicaResponse(
        Long id,
        String codigo,
        Long pacienteId,
        String pacienteNombre,
        String pacienteEmail,
        Long odontologoId,
        String odontologoNombre,
        String odontologoEmail,
        Long ultimaCitaId,
        String servicioNombre,
        Integer numeroSesion,
        Integer totalSesiones,
        EtapaTratamiento etapaTratamiento,
        String alergias,
        String diagnostico,
        String tratamiento,
        String indicaciones,
        LocalDate proximoControl,
        String observaciones,
        LocalDateTime actualizadoEn) {

    public static HistoriaClinicaResponse desde(HistoriaClinica historia) {
        String servicioNombre = null;
        Integer numeroSesion = null;
        Integer totalSesiones = null;
        if (historia.getUltimaCita() != null) {
            if (historia.getUltimaCita().getServicio() != null) {
                servicioNombre = historia.getUltimaCita().getServicio().getNombre();
            }
            numeroSesion = historia.getUltimaCita().getNumeroSesion();
            totalSesiones = historia.getUltimaCita().getTotalSesiones();
        }

        return new HistoriaClinicaResponse(
                historia.getId(), historia.getCodigo(),
                historia.getPaciente().getId(), historia.getPaciente().getNombreCompleto(),
                historia.getPaciente().getEmail(), historia.getOdontologo().getId(),
                historia.getOdontologo().getUsuario().getNombreCompleto(),
                historia.getOdontologo().getUsuario().getEmail(),
                historia.getUltimaCita() == null ? null : historia.getUltimaCita().getId(),
                servicioNombre,
                numeroSesion,
                totalSesiones,
                historia.getEtapaTratamiento(), historia.getAlergias(), historia.getDiagnostico(),
                historia.getTratamiento(), historia.getIndicaciones(), historia.getProximoControl(),
                historia.getObservaciones(), historia.getActualizadoEn());
    }
}
