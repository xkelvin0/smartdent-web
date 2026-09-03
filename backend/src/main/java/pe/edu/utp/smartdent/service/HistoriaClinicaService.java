package pe.edu.utp.smartdent.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.utp.smartdent.dto.historia.GuardarHistoriaClinicaRequest;
import pe.edu.utp.smartdent.dto.historia.HistoriaClinicaResponse;
import pe.edu.utp.smartdent.entity.Cita;
import pe.edu.utp.smartdent.entity.CitaEstado;
import pe.edu.utp.smartdent.entity.HistoriaClinica;
import pe.edu.utp.smartdent.entity.Odontologo;
import pe.edu.utp.smartdent.entity.Usuario;
import pe.edu.utp.smartdent.exception.RecursoNoEncontradoException;
import pe.edu.utp.smartdent.exception.ReglaNegocioException;
import pe.edu.utp.smartdent.repository.CitaRepository;
import pe.edu.utp.smartdent.repository.HistoriaClinicaRepository;
import pe.edu.utp.smartdent.repository.OdontologoRepository;
import pe.edu.utp.smartdent.repository.UsuarioRepository;

@Service
public class HistoriaClinicaService {

    private final HistoriaClinicaRepository historiaRepository;
    private final CitaRepository citaRepository;
    private final UsuarioRepository usuarioRepository;
    private final OdontologoRepository odontologoRepository;

    public HistoriaClinicaService(
            HistoriaClinicaRepository historiaRepository,
            CitaRepository citaRepository,
            UsuarioRepository usuarioRepository,
            OdontologoRepository odontologoRepository) {
        this.historiaRepository = historiaRepository;
        this.citaRepository = citaRepository;
        this.usuarioRepository = usuarioRepository;
        this.odontologoRepository = odontologoRepository;
    }

    @Transactional(readOnly = true)
    public List<HistoriaClinicaResponse> listarDelPaciente(String emailPaciente) {
        return historiaRepository.findByPaciente_EmailIgnoreCaseOrderByActualizadoEnDesc(emailPaciente)
                .stream().map(HistoriaClinicaResponse::desde).toList();
    }

    @Transactional(readOnly = true)
    public HistoriaClinicaResponse consultarPorOdontologo(String emailOdontologo, String emailPaciente) {
        validarRelacionClinica(emailOdontologo, emailPaciente);
        return historiaRepository
                .findByPaciente_EmailIgnoreCaseAndOdontologo_Usuario_EmailIgnoreCase(
                        emailPaciente, emailOdontologo)
                .map(HistoriaClinicaResponse::desde)
                .orElse(null);
    }

    @Transactional
    public HistoriaClinicaResponse guardar(
            String emailOdontologo,
            String emailPaciente,
            GuardarHistoriaClinicaRequest request) {
        Odontologo odontologo = odontologoRepository.findByUsuarioEmailIgnoreCase(emailOdontologo)
                .orElseThrow(() -> new RecursoNoEncontradoException("Odontólogo no encontrado"));
        Usuario paciente = usuarioRepository.findByEmailIgnoreCase(emailPaciente)
                .orElseThrow(() -> new RecursoNoEncontradoException("Paciente no encontrado"));
        validarRelacionClinica(emailOdontologo, emailPaciente);

        Cita cita = null;
        if (request.citaId() != null) {
            cita = citaRepository.findByIdAndOdontologo_Usuario_EmailIgnoreCase(
                            request.citaId(), emailOdontologo)
                    .filter(encontrada -> encontrada.getPaciente().getEmail().equalsIgnoreCase(emailPaciente))
                    .orElseThrow(() -> new RecursoNoEncontradoException("La cita no pertenece a este paciente"));
            if (cita.getEstado() != CitaEstado.CONFIRMADA && cita.getEstado() != CitaEstado.ATENDIDA) {
                throw new ReglaNegocioException("Confirma la cita antes de registrar la atención clínica");
            }
            cita.setEstado(CitaEstado.ATENDIDA);
        }

        HistoriaClinica historia = historiaRepository
                .findByPaciente_EmailIgnoreCaseAndOdontologo_Usuario_EmailIgnoreCase(
                        emailPaciente, emailOdontologo)
                .orElseGet(() -> nuevaHistoria(paciente, odontologo));
        historia.setUltimaCita(cita != null ? cita : historia.getUltimaCita());
        historia.setEtapaTratamiento(request.etapaTratamiento());
        historia.setAlergias(normalizarOpcional(request.alergias()));
        historia.setDiagnostico(request.diagnostico().trim());
        historia.setTratamiento(request.tratamiento().trim());
        historia.setIndicaciones(normalizarOpcional(request.indicaciones()));
        historia.setProximoControl(request.proximoControl());
        historia.setObservaciones(normalizarOpcional(request.observaciones()));
        return HistoriaClinicaResponse.desde(historiaRepository.save(historia));
    }

    private void validarRelacionClinica(String emailOdontologo, String emailPaciente) {
        if (!citaRepository.existsByPaciente_EmailIgnoreCaseAndOdontologo_Usuario_EmailIgnoreCase(
                emailPaciente, emailOdontologo)) {
            throw new RecursoNoEncontradoException("El paciente no pertenece a tu agenda clínica");
        }
    }

    private HistoriaClinica nuevaHistoria(Usuario paciente, Odontologo odontologo) {
        HistoriaClinica historia = new HistoriaClinica();
        historia.setCodigo("HC-" + UUID.randomUUID().toString().toUpperCase());
        historia.setPaciente(paciente);
        historia.setOdontologo(odontologo);
        return historia;
    }

    private String normalizarOpcional(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
