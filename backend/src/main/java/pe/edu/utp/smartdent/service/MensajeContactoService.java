package pe.edu.utp.smartdent.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.utp.smartdent.dto.contacto.CrearMensajeContactoRequest;
import pe.edu.utp.smartdent.dto.contacto.MensajeContactoResponse;
import pe.edu.utp.smartdent.entity.MensajeContacto;
import pe.edu.utp.smartdent.entity.MensajeContactoEstado;
import pe.edu.utp.smartdent.repository.MensajeContactoRepository;

@Service
public class MensajeContactoService {

    private final MensajeContactoRepository repository;

    public MensajeContactoService(MensajeContactoRepository repository) { this.repository = repository; }

    @Transactional
    public MensajeContactoResponse crear(CrearMensajeContactoRequest request) {
        MensajeContacto item = new MensajeContacto();
        item.setNombre(request.nombre().trim());
        item.setEmail(request.email());
        item.setTelefono(normalizarOpcional(request.telefono()));
        item.setAsunto(request.asunto().trim());
        item.setMensaje(request.mensaje().trim());
        return MensajeContactoResponse.desde(repository.save(item));
    }

    @Transactional(readOnly = true)
    public List<MensajeContactoResponse> listar() {
        return repository.findAllByOrderByCreadoEnDesc().stream().map(MensajeContactoResponse::desde).toList();
    }

    @Transactional
    public MensajeContactoResponse cambiarEstado(Long id, MensajeContactoEstado estado) {
        MensajeContacto item = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("El mensaje indicado no existe"));
        item.setEstado(estado);
        return MensajeContactoResponse.desde(repository.save(item));
    }

    private String normalizarOpcional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
