package pe.edu.utp.smartdent.service;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.utp.smartdent.dto.odontologo.ActualizarOdontologoRequest;
import pe.edu.utp.smartdent.dto.odontologo.CrearOdontologoRequest;
import pe.edu.utp.smartdent.dto.odontologo.OdontologoAdminResponse;
import pe.edu.utp.smartdent.dto.odontologo.OdontologoResponse;
import pe.edu.utp.smartdent.entity.Odontologo;
import pe.edu.utp.smartdent.entity.Rol;
import pe.edu.utp.smartdent.entity.RolNombre;
import pe.edu.utp.smartdent.entity.Usuario;
import pe.edu.utp.smartdent.exception.RecursoDuplicadoException;
import pe.edu.utp.smartdent.exception.RecursoNoEncontradoException;
import pe.edu.utp.smartdent.repository.OdontologoRepository;
import pe.edu.utp.smartdent.repository.RolRepository;
import pe.edu.utp.smartdent.repository.ServicioRepository;
import pe.edu.utp.smartdent.repository.UsuarioRepository;

@Service
public class OdontologoService {

    private final OdontologoRepository odontologoRepository;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final ServicioRepository servicioRepository;
    private final PasswordEncoder passwordEncoder;

    public OdontologoService(
            OdontologoRepository odontologoRepository,
            UsuarioRepository usuarioRepository,
            RolRepository rolRepository,
            ServicioRepository servicioRepository,
            PasswordEncoder passwordEncoder) {
        this.odontologoRepository = odontologoRepository;
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.servicioRepository = servicioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<OdontologoResponse> listarPublicos(Long servicioId) {
        return odontologoRepository.findByUsuario_ActivoTrueOrderByUsuario_NombreCompletoAsc().stream()
                .filter(odontologo -> servicioId == null || odontologo.getServicios().stream()
                        .anyMatch(servicio -> servicio.getId().equals(servicioId)))
                .map(OdontologoResponse::desde)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OdontologoAdminResponse> listarParaAdmin() {
        return odontologoRepository.findAllByOrderByUsuario_NombreCompletoAsc().stream()
                .map(OdontologoAdminResponse::desde)
                .toList();
    }

    @Transactional
    public OdontologoAdminResponse crear(CrearOdontologoRequest request) {
        String codigo = request.codigo().trim().toUpperCase(Locale.ROOT);
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String dni = request.dni().trim();
        String colegiatura = request.colegiatura().trim().toUpperCase(Locale.ROOT);
        validarDatosUnicos(codigo, email, dni, colegiatura);

        Rol rol = rolRepository.findByNombre(RolNombre.ODONTOLOGO)
                .orElseThrow(() -> new IllegalStateException("El rol ODONTOLOGO no está configurado"));

        Usuario usuario = new Usuario();
        usuario.setNombreCompleto(request.nombreCompleto().trim());
        usuario.setDni(dni);
        usuario.setEmail(email);
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        usuario.setTelefono(normalizarOpcional(request.telefono()));
        usuario.setRol(rol);
        usuario.setActivo(true);
        usuarioRepository.save(usuario);

        Odontologo odontologo = new Odontologo();
        odontologo.setCodigo(codigo);
        odontologo.setUsuario(usuario);
        odontologo.setEspecialidad(request.especialidad().trim());
        odontologo.setColegiatura(colegiatura);
        odontologo.setFotoUrl(normalizarOpcional(request.fotoUrl()));
        odontologo.setServicios(resolverServicios(request.servicioIds()));
        return OdontologoAdminResponse.desde(odontologoRepository.save(odontologo));
    }

    @Transactional
    public OdontologoAdminResponse actualizar(Long id, ActualizarOdontologoRequest request) {
        Odontologo odontologo = buscar(id);
        String colegiatura = request.colegiatura().trim().toUpperCase(Locale.ROOT);
        odontologoRepository.findByColegiaturaIgnoreCase(colegiatura)
                .filter(encontrado -> !encontrado.getId().equals(id))
                .ifPresent(encontrado -> {
                    throw new RecursoDuplicadoException("Ya existe un odontólogo con esa colegiatura");
                });

        Usuario usuario = odontologo.getUsuario();
        usuario.setNombreCompleto(request.nombreCompleto().trim());
        usuario.setTelefono(normalizarOpcional(request.telefono()));
        usuario.setActivo(request.activo());
        odontologo.setEspecialidad(request.especialidad().trim());
        odontologo.setColegiatura(colegiatura);
        odontologo.setFotoUrl(normalizarOpcional(request.fotoUrl()));
        odontologo.setServicios(resolverServicios(request.servicioIds()));
        return OdontologoAdminResponse.desde(odontologo);
    }

    private Odontologo buscar(Long id) {
        return odontologoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Odontólogo no encontrado"));
    }

    private void validarDatosUnicos(String codigo, String email, String dni, String colegiatura) {
        if (odontologoRepository.existsByCodigoIgnoreCase(codigo)) {
            throw new RecursoDuplicadoException("Ya existe un odontólogo con ese código");
        }
        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new RecursoDuplicadoException("Ya existe una cuenta con ese correo electrónico");
        }
        if (usuarioRepository.existsByDni(dni)) {
            throw new RecursoDuplicadoException("Ya existe una cuenta con ese DNI");
        }
        if (odontologoRepository.existsByColegiatura(colegiatura)) {
            throw new RecursoDuplicadoException("Ya existe un odontólogo con esa colegiatura");
        }
    }

    private String normalizarOpcional(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }

    private Set<pe.edu.utp.smartdent.entity.Servicio> resolverServicios(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Set.of();
        }
        Set<Long> idsUnicos = Set.copyOf(ids);
        Set<pe.edu.utp.smartdent.entity.Servicio> servicios = servicioRepository.findAllById(idsUnicos).stream()
                .collect(Collectors.toSet());
        if (servicios.size() != idsUnicos.size()) {
            throw new RecursoNoEncontradoException("Uno o más servicios seleccionados no existen");
        }
        return servicios;
    }
}
