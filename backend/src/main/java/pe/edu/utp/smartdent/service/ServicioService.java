package pe.edu.utp.smartdent.service;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.utp.smartdent.dto.servicio.ServicioAdminResponse;
import pe.edu.utp.smartdent.dto.servicio.ServicioRequest;
import pe.edu.utp.smartdent.dto.servicio.ServicioResponse;
import pe.edu.utp.smartdent.entity.Servicio;
import pe.edu.utp.smartdent.exception.RecursoDuplicadoException;
import pe.edu.utp.smartdent.exception.RecursoNoEncontradoException;
import pe.edu.utp.smartdent.repository.ServicioRepository;

@Service
public class ServicioService {

    private final ServicioRepository servicioRepository;

    public ServicioService(ServicioRepository servicioRepository) {
        this.servicioRepository = servicioRepository;
    }

    @Transactional(readOnly = true)
    public List<ServicioResponse> listarPublicos() {
        return servicioRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(ServicioResponse::desde)
                .toList();
    }

    @Transactional(readOnly = true)
    public ServicioResponse obtenerPublico(Long id) {
        Servicio servicio = buscar(id);
        if (!servicio.isActivo()) {
            throw new RecursoNoEncontradoException("El servicio solicitado no está disponible");
        }
        return ServicioResponse.desde(servicio);
    }

    @Transactional(readOnly = true)
    public List<ServicioAdminResponse> listarParaAdmin() {
        return servicioRepository.findAllByOrderByNombreAsc().stream()
                .map(ServicioAdminResponse::desde)
                .toList();
    }

    @Transactional
    public ServicioAdminResponse crear(ServicioRequest request) {
        String codigo = normalizarCodigo(request.codigo());
        if (servicioRepository.existsByCodigoIgnoreCase(codigo)) {
            throw new RecursoDuplicadoException("Ya existe un servicio con ese código");
        }

        Servicio servicio = new Servicio();
        aplicarDatos(servicio, request, codigo);
        return ServicioAdminResponse.desde(servicioRepository.save(servicio));
    }

    @Transactional
    public ServicioAdminResponse actualizar(Long id, ServicioRequest request) {
        Servicio servicio = buscar(id);
        String codigo = normalizarCodigo(request.codigo());
        boolean codigoPerteneceAOtro = !servicio.getCodigo().equalsIgnoreCase(codigo)
                && servicioRepository.existsByCodigoIgnoreCase(codigo);
        if (codigoPerteneceAOtro) {
            throw new RecursoDuplicadoException("Ya existe un servicio con ese código");
        }

        aplicarDatos(servicio, request, codigo);
        return ServicioAdminResponse.desde(servicio);
    }

    @Transactional
    public ServicioAdminResponse cambiarEstado(Long id, boolean activo) {
        Servicio servicio = buscar(id);
        servicio.setActivo(activo);
        return ServicioAdminResponse.desde(servicio);
    }

    private Servicio buscar(Long id) {
        return servicioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Servicio no encontrado"));
    }

    private void aplicarDatos(Servicio servicio, ServicioRequest request, String codigo) {
        servicio.setCodigo(codigo);
        servicio.setNombre(request.nombre().trim());
        servicio.setEspecialidad(request.especialidad().trim());
        servicio.setDescripcion(request.descripcion().trim());
        servicio.setPrecio(request.precio());
        servicio.setCosto(request.costo());
        servicio.setDuracionMinutos(request.duracionMinutos());
        servicio.setImagenUrl(normalizarOpcional(request.imagenUrl()));
        servicio.setActivo(request.activo());
    }

    private String normalizarCodigo(String codigo) {
        return codigo.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizarOpcional(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
