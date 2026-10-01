package pe.edu.utp.smartdent.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.utp.smartdent.dto.usuario.UsuarioAdminResponse;
import pe.edu.utp.smartdent.repository.UsuarioRepository;

@Service
public class UsuarioAdminService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioAdminService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<UsuarioAdminResponse> listar() {
        return usuarioRepository.findAllByOrderByNombreCompletoAsc().stream()
                .map(UsuarioAdminResponse::desde)
                .toList();
    }
}
