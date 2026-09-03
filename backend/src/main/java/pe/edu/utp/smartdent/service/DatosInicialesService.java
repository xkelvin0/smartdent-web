package pe.edu.utp.smartdent.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.utp.smartdent.dto.odontologo.CrearOdontologoRequest;
import pe.edu.utp.smartdent.entity.Rol;
import pe.edu.utp.smartdent.entity.RolNombre;
import pe.edu.utp.smartdent.entity.Servicio;
import pe.edu.utp.smartdent.entity.Usuario;
import pe.edu.utp.smartdent.repository.OdontologoRepository;
import pe.edu.utp.smartdent.repository.RolRepository;
import pe.edu.utp.smartdent.repository.ServicioRepository;
import pe.edu.utp.smartdent.repository.UsuarioRepository;

@Service
public class DatosInicialesService {

    private static final Map<RolNombre, String> ROLES = Map.of(
            RolNombre.PACIENTE, "Paciente de la clínica odontológica",
            RolNombre.ODONTOLOGO, "Profesional encargado de las atenciones clínicas",
            RolNombre.ADMIN, "Administrador general de SmartDent");

    private static final List<ServicioInicial> SERVICIOS = List.of(
            new ServicioInicial("SRV-CONSULTA", "Consulta y Diagnóstico", "Prevención", "Evaluación clínica integral y plan de tratamiento personalizado.", 80, 15, 30, "consulta-diagnostico.png"),
            new ServicioInicial("SRV-LIMPIEZA", "Limpieza y Profilaxis", "Prevención", "Eliminación de placa y sarro para prevenir caries y enfermedades de las encías.", 120, 35, 45, "limpieza-profilaxis.png"),
            new ServicioInicial("SRV-URGENCIA", "Urgencias Dentales", "Urgencias", "Atención prioritaria para dolor, fracturas, traumatismos e infecciones.", 150, 50, 40, "urgencias-dentales.png"),
            new ServicioInicial("SRV-DISENO", "Diseño de Sonrisa", "Estética", "Planificación digital para conseguir una sonrisa armónica y natural.", 180, 55, 60, "diseno-sonrisa.webp"),
            new ServicioInicial("SRV-RESINA", "Restauraciones con Resina", "Estética", "Reconstrucción estética para recuperar forma y función dental.", 180, 60, 60, "restauraciones-resina.png"),
            new ServicioInicial("SRV-BLANQUEAMIENTO", "Blanqueamiento Dental", "Estética", "Aclaramiento dental profesional con control de sensibilidad.", 350, 110, 75, "blanqueamiento-dental.png"),
            new ServicioInicial("SRV-CARILLAS", "Carillas Dentales", "Estética", "Láminas estéticas personalizadas para mejorar dientes anteriores.", 700, 260, 90, "carillas-dentales.png"),
            new ServicioInicial("SRV-ORTODONCIA", "Ortodoncia Convencional", "Ortodoncia", "Corrección de la posición dental mediante brackets y controles periódicos.", 450, 160, 60, "ortodoncia-convencional.png"),
            new ServicioInicial("SRV-ORTODONCIA-INVISIBLE", "Ortodoncia Invisible", "Ortodoncia", "Alineadores transparentes removibles diseñados digitalmente.", 900, 350, 60, "ortodoncia-invisible.png"),
            new ServicioInicial("SRV-IMPLANTE", "Implantología Avanzada", "Rehabilitación", "Implantes planificados digitalmente para recuperar dientes ausentes.", 900, 420, 120, "implantologia-avanzada.webp"),
            new ServicioInicial("SRV-PROTESIS", "Prótesis Dentales", "Rehabilitación", "Coronas, puentes y prótesis para recuperar comodidad y función.", 650, 280, 90, "protesis-dentales.png"),
            new ServicioInicial("SRV-ENDODONCIA", "Endodoncia Microscópica", "Endodoncia", "Tratamiento de conductos con magnificación y alta precisión.", 650, 180, 90, "endodoncia-microscopica.webp"),
            new ServicioInicial("SRV-EXTRACCION", "Extracciones Dentales", "Cirugía", "Extracción segura con evaluación y cuidados posteriores.", 200, 65, 45, "extracciones-dentales.png"),
            new ServicioInicial("SRV-TERCEROS-MOLARES", "Cirugía de Terceros Molares", "Cirugía", "Evaluación y extracción quirúrgica de muelas del juicio.", 450, 170, 90, "cirugia-terceros-molares.png"),
            new ServicioInicial("SRV-PERIODONCIA", "Periodoncia y Encías", "Periodoncia", "Prevención y tratamiento de enfermedades periodontales.", 300, 90, 60, "periodoncia-laser.webp"),
            new ServicioInicial("SRV-ODONTOPEDIATRIA", "Odontopediatría", "Odontopediatría", "Atención preventiva y tratamientos adaptados a niños y adolescentes.", 120, 35, 45, "odontopediatria.png"));

    private final RolRepository rolRepository;
    private final ServicioRepository servicioRepository;
    private final UsuarioRepository usuarioRepository;
    private final OdontologoRepository odontologoRepository;
    private final OdontologoService odontologoService;
    private final PasswordEncoder passwordEncoder;

    public DatosInicialesService(
            RolRepository rolRepository,
            ServicioRepository servicioRepository,
            UsuarioRepository usuarioRepository,
            OdontologoRepository odontologoRepository,
            OdontologoService odontologoService,
            PasswordEncoder passwordEncoder) {
        this.rolRepository = rolRepository;
        this.servicioRepository = servicioRepository;
        this.usuarioRepository = usuarioRepository;
        this.odontologoRepository = odontologoRepository;
        this.odontologoService = odontologoService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void inicializar() {
        inicializarRoles();
        inicializarServicios();
        inicializarAdministrador();
        inicializarOdontologos();
        inicializarServiciosDeOdontologos();
    }

    private void inicializarRoles() {
        ROLES.forEach((nombre, descripcion) -> {
            if (!rolRepository.existsByNombre(nombre)) {
                rolRepository.save(new Rol(nombre, descripcion));
            }
        });
        rolRepository.flush();
    }

    private void inicializarServicios() {
        SERVICIOS.forEach(inicial -> {
            if (servicioRepository.existsByCodigoIgnoreCase(inicial.codigo())) {
                return;
            }
            Servicio servicio = new Servicio();
            servicio.setCodigo(inicial.codigo());
            servicio.setNombre(inicial.nombre());
            servicio.setEspecialidad(inicial.especialidad());
            servicio.setDescripcion(inicial.descripcion());
            servicio.setPrecio(BigDecimal.valueOf(inicial.precio()));
            servicio.setCosto(BigDecimal.valueOf(inicial.costo()));
            servicio.setDuracionMinutos(inicial.duracion());
            servicio.setImagenUrl(inicial.imagen());
            servicio.setActivo(true);
            servicioRepository.save(servicio);
        });
    }

    private void inicializarAdministrador() {
        if (usuarioRepository.existsByEmailIgnoreCase("admin@smartdent.com")) {
            return;
        }
        Rol rolAdmin = rolRepository.findByNombre(RolNombre.ADMIN).orElseThrow();
        Usuario admin = new Usuario();
        admin.setNombreCompleto("Administrador SmartDent");
        admin.setDni("00000001");
        admin.setEmail("admin@smartdent.com");
        admin.setPasswordHash(passwordEncoder.encode("Admin123"));
        admin.setTelefono("987000001");
        admin.setRol(rolAdmin);
        admin.setActivo(true);
        usuarioRepository.save(admin);
    }

    private void inicializarOdontologos() {
        crearOdontologo("DOC-CARLOS-MENDOZA", "Dr. Carlos Mendoza", "40000001", "carlos.mendoza@smartdent.com", "Carlos123", "Implantología y Cirugía Oral", "COP-10001", "carlos-mendoza.webp");
        crearOdontologo("DOC-ELENA-RUIZ", "Dra. Elena Ruiz", "40000002", "elena.ruiz@smartdent.com", "Elena123", "Estética y Ortodoncia", "COP-10002", "elena-ruiz.webp");
        crearOdontologo("DOC-MIGUEL-SILVA", "Dr. Miguel Silva", "40000003", "miguel.silva@smartdent.com", "Miguel123", "Endodoncia Microscópica", "COP-10003", "miguel-silva.webp");
        crearOdontologo("DOC-LUCIA-TORRES", "Dra. Lucía Torres", "40000004", "lucia.torres@smartdent.com", "Lucia123", "Periodoncia y Odontopediatría", "COP-10004", "lucia-torres.webp");
    }

    private void crearOdontologo(
            String codigo,
            String nombre,
            String dni,
            String email,
            String password,
            String especialidad,
            String colegiatura,
            String foto) {
        if (odontologoRepository.existsByCodigoIgnoreCase(codigo)) {
            return;
        }
        odontologoService.crear(new CrearOdontologoRequest(
                codigo, nombre, dni, email, password, "987000002",
                especialidad, colegiatura, foto, java.util.List.of()));
    }

    private void inicializarServiciosDeOdontologos() {
        asignarServicios("DOC-CARLOS-MENDOZA",
                "SRV-IMPLANTE", "SRV-CONSULTA", "SRV-URGENCIA", "SRV-PROTESIS",
                "SRV-EXTRACCION", "SRV-TERCEROS-MOLARES");
        asignarServicios("DOC-ELENA-RUIZ",
                "SRV-DISENO", "SRV-CONSULTA", "SRV-LIMPIEZA", "SRV-RESINA",
                "SRV-BLANQUEAMIENTO", "SRV-CARILLAS", "SRV-ORTODONCIA",
                "SRV-ORTODONCIA-INVISIBLE");
        asignarServicios("DOC-MIGUEL-SILVA",
                "SRV-ENDODONCIA", "SRV-CONSULTA", "SRV-URGENCIA", "SRV-EXTRACCION");
        asignarServicios("DOC-LUCIA-TORRES",
                "SRV-PERIODONCIA", "SRV-LIMPIEZA", "SRV-RESINA", "SRV-ODONTOPEDIATRIA");
    }

    private void asignarServicios(String codigoOdontologo, String... codigosServicio) {
        var odontologo = odontologoRepository.findByCodigoIgnoreCase(codigoOdontologo).orElseThrow();
        if (!odontologo.getServicios().isEmpty()) {
            return;
        }
        Set<Servicio> servicios = java.util.Arrays.stream(codigosServicio)
                .map(codigo -> servicioRepository.findByCodigoIgnoreCase(codigo).orElseThrow())
                .collect(Collectors.toSet());
        odontologo.setServicios(servicios);
    }

    private record ServicioInicial(
            String codigo,
            String nombre,
            String especialidad,
            String descripcion,
            long precio,
            long costo,
            int duracion,
            String imagen) {
    }
}
