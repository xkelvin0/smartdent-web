package pe.edu.utp.smartdent.service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.utp.smartdent.dto.notificacion.NotificacionResponse;
import pe.edu.utp.smartdent.entity.Cita;
import pe.edu.utp.smartdent.entity.MensajeContacto;
import pe.edu.utp.smartdent.entity.Notificacion;
import pe.edu.utp.smartdent.entity.NotificacionTipo;
import pe.edu.utp.smartdent.entity.RolNombre;
import pe.edu.utp.smartdent.entity.Usuario;
import pe.edu.utp.smartdent.exception.RecursoNoEncontradoException;
import pe.edu.utp.smartdent.repository.NotificacionRepository;
import pe.edu.utp.smartdent.repository.UsuarioRepository;

@Service
public class NotificacionService {

    private static final DateTimeFormatter FECHA_FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.forLanguageTag("es-PE"));
    private static final DateTimeFormatter HORA_FMT =
            DateTimeFormatter.ofPattern("HH:mm");

    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;

    public NotificacionService(
            NotificacionRepository notificacionRepository,
            UsuarioRepository usuarioRepository) {
        this.notificacionRepository = notificacionRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<NotificacionResponse> listarPorDestinatario(String email) {
        return notificacionRepository
                .findTop30ByDestinatarioEmailIgnoreCaseOrderByCreadoEnDesc(email)
                .stream()
                .map(NotificacionResponse::desde)
                .toList();
    }

    @Transactional
    public NotificacionResponse marcarLeida(String email, Long id) {
        Notificacion notif = notificacionRepository
                .findByIdAndDestinatarioEmailIgnoreCase(id, email)
                .orElseThrow(() -> new RecursoNoEncontradoException("Notificación no encontrada"));
        notif.setLeida(true);
        return NotificacionResponse.desde(notificacionRepository.save(notif));
    }

    @Transactional
    public void marcarTodasLeidas(String email) {
        List<Notificacion> pendientes = notificacionRepository
                .findByDestinatarioEmailIgnoreCaseAndLeidaFalse(email);
        if (pendientes.isEmpty()) {
            return;
        }
        pendientes.forEach(item -> item.setLeida(true));
        notificacionRepository.saveAll(pendientes);
    }

    @Transactional
    public void notificarCitaReservada(Cita cita) {
        String fechaHora = formatearFechaHora(cita);
        String pacNombre = cita.getPaciente().getNombreCompleto();
        String docNombre = cita.getOdontologo().getUsuario().getNombreCompleto();
        String srvNombre = cita.getServicio().getNombre();

        crear(
                cita.getPaciente().getEmail(),
                NotificacionTipo.CITA_CREADA,
                "Reserva registrada",
                "Tu cita de " + srvNombre + " con " + docNombre + " para el " + fechaHora + " está pendiente de confirmación.",
                "appointments",
                cita.getCodigo());

        crear(
                cita.getOdontologo().getUsuario().getEmail(),
                NotificacionTipo.CITA_CREADA,
                "Nueva cita asignada",
                pacNombre + " reservó " + srvNombre + " para el " + fechaHora + " (pendiente de confirmar).",
                "agenda",
                cita.getCodigo());

        notificarAdministradores(
                NotificacionTipo.CITA_CREADA,
                "Nueva reserva en agenda",
                pacNombre + " agendó " + srvNombre + " con " + docNombre + " (" + fechaHora + ").",
                "appointments",
                cita.getCodigo());
    }

    @Transactional
    public void notificarCitaReprogramada(Cita cita) {
        String fechaHora = formatearFechaHora(cita);
        String pacNombre = cita.getPaciente().getNombreCompleto();
        String docNombre = cita.getOdontologo().getUsuario().getNombreCompleto();
        String srvNombre = cita.getServicio().getNombre();

        crear(
                cita.getPaciente().getEmail(),
                NotificacionTipo.CITA_REPROGRAMADA,
                "Cita reprogramada",
                "Reprogramaste tu cita de " + srvNombre + " para el " + fechaHora + ". Pendiente de confirmación.",
                "appointments",
                cita.getCodigo());

        crear(
                cita.getOdontologo().getUsuario().getEmail(),
                NotificacionTipo.CITA_REPROGRAMADA,
                "Cita reprogramada por paciente",
                pacNombre + " reprogramó " + srvNombre + " para el " + fechaHora + " (requiere confirmación).",
                "agenda",
                cita.getCodigo());

        notificarAdministradores(
                NotificacionTipo.CITA_REPROGRAMADA,
                "Reprogramación de cita",
                pacNombre + " reprogramó su cita con " + docNombre + " al " + fechaHora + ".",
                "appointments",
                cita.getCodigo());
    }

    @Transactional
    public void notificarCitaConfirmada(Cita cita, String actorLabel) {
        String fechaHora = formatearFechaHora(cita);
        String pacNombre = cita.getPaciente().getNombreCompleto();
        String docNombre = cita.getOdontologo().getUsuario().getNombreCompleto();
        String srvNombre = cita.getServicio().getNombre();

        crear(
                cita.getPaciente().getEmail(),
                NotificacionTipo.CITA_CONFIRMADA,
                "¡Cita confirmada!",
                "Tu cita de " + srvNombre + " con " + docNombre + " (" + fechaHora + ") ha sido CONFIRMADA.",
                "appointments",
                cita.getCodigo());

        crear(
                cita.getOdontologo().getUsuario().getEmail(),
                NotificacionTipo.CITA_CONFIRMADA,
                "Cita confirmada en tu agenda",
                "La cita de " + pacNombre + " (" + srvNombre + " · " + fechaHora + ") fue confirmada por " + actorLabel + ".",
                "agenda",
                cita.getCodigo());

        notificarAdministradores(
                NotificacionTipo.CITA_CONFIRMADA,
                "Cita confirmada",
                "Cita de " + pacNombre + " con " + docNombre + " (" + fechaHora + ") confirmada por " + actorLabel + ".",
                "appointments",
                cita.getCodigo());
    }

    @Transactional
    public void notificarCitaCancelada(Cita cita, String actorLabel) {
        String fechaHora = formatearFechaHora(cita);
        String pacNombre = cita.getPaciente().getNombreCompleto();
        String docNombre = cita.getOdontologo().getUsuario().getNombreCompleto();
        String srvNombre = cita.getServicio().getNombre();

        crear(
                cita.getPaciente().getEmail(),
                NotificacionTipo.CITA_CANCELADA,
                "Cita cancelada",
                "Tu cita de " + srvNombre + " del " + fechaHora + " fue cancelada por " + actorLabel + ".",
                "appointments",
                cita.getCodigo());

        crear(
                cita.getOdontologo().getUsuario().getEmail(),
                NotificacionTipo.CITA_CANCELADA,
                "Cita cancelada en agenda",
                "La cita de " + pacNombre + " (" + srvNombre + " · " + fechaHora + ") fue cancelada por " + actorLabel + ".",
                "agenda",
                cita.getCodigo());

        notificarAdministradores(
                NotificacionTipo.CITA_CANCELADA,
                "Cita cancelada",
                "Cita de " + pacNombre + " con " + docNombre + " (" + fechaHora + ") cancelada por " + actorLabel + ".",
                "appointments",
                cita.getCodigo());
    }

    @Transactional
    public void notificarCitaAtendida(Cita cita) {
        String fechaHora = formatearFechaHora(cita);
        String pacNombre = cita.getPaciente().getNombreCompleto();
        String docNombre = cita.getOdontologo().getUsuario().getNombreCompleto();
        String srvNombre = cita.getServicio().getNombre();

        crear(
                cita.getPaciente().getEmail(),
                NotificacionTipo.CITA_ATENDIDA,
                "Atención clínica completada",
                docNombre + " registró tu atención de " + srvNombre + ". Revisa tu historial clínico y comprobante.",
                "history",
                cita.getCodigo());

        crear(
                cita.getOdontologo().getUsuario().getEmail(),
                NotificacionTipo.CITA_ATENDIDA,
                "Atención registrada exitosamente",
                "Completaste la atención e historia clínica de " + pacNombre + " (" + srvNombre + ").",
                "patients",
                cita.getCodigo());

        notificarAdministradores(
                NotificacionTipo.CITA_ATENDIDA,
                "Atención completada e ingreso registrado",
                docNombre + " atendió a " + pacNombre + " (" + srvNombre + " · S/ " + cita.getPrecioPactado() + ").",
                "finance",
                cita.getCodigo());
    }

    @Transactional
    public void notificarNuevoMensajeContacto(MensajeContacto msg) {
        notificarAdministradores(
                NotificacionTipo.CONTACTO_NUEVO,
                "Nuevo mensaje de contacto",
                msg.getNombre() + " envió una consulta: \"" + msg.getAsunto() + "\".",
                "messages",
                "MSG-" + msg.getId());
    }

    private void notificarAdministradores(
            NotificacionTipo tipo,
            String titulo,
            String mensaje,
            String vistaDestino,
            String referenciaCodigo) {
        List<Usuario> admins = usuarioRepository.findByRol_NombreAndActivoTrue(RolNombre.ADMIN);
        for (Usuario admin : admins) {
            crear(admin.getEmail(), tipo, titulo, mensaje, vistaDestino, referenciaCodigo);
        }
    }

    private void crear(
            String destinatarioEmail,
            NotificacionTipo tipo,
            String titulo,
            String mensaje,
            String vistaDestino,
            String referenciaCodigo) {
        if (destinatarioEmail == null || destinatarioEmail.isBlank()) {
            return;
        }
        Notificacion item = new Notificacion();
        item.setDestinatarioEmail(destinatarioEmail);
        item.setTipo(tipo);
        item.setTitulo(titulo);
        item.setMensaje(mensaje.length() > 345 ? mensaje.substring(0, 345) + "..." : mensaje);
        item.setVistaDestino(vistaDestino);
        item.setReferenciaCodigo(referenciaCodigo);
        item.setLeida(false);
        notificacionRepository.save(item);
    }

    private String formatearFechaHora(Cita cita) {
        return cita.getFecha().format(FECHA_FMT) + " a las " + cita.getHoraInicio().format(HORA_FMT);
    }
}

