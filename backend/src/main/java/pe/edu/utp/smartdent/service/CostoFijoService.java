package pe.edu.utp.smartdent.service;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.utp.smartdent.dto.admin.CostoFijoRequest;
import pe.edu.utp.smartdent.dto.admin.CostoFijoResponse;
import pe.edu.utp.smartdent.entity.CostoFijoConfig;
import pe.edu.utp.smartdent.repository.CostoFijoConfigRepository;

@Service
public class CostoFijoService {

    private static final long CONFIG_ID = 1L;

    private final CostoFijoConfigRepository repository;

    public CostoFijoService(CostoFijoConfigRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public CostoFijoResponse obtener() {
        return CostoFijoResponse.desde(obtenerEntidad());
    }

    @Transactional
    public CostoFijoResponse actualizar(CostoFijoRequest request) {
        CostoFijoConfig config = obtenerEntidad();
        config.setAlquiler(request.alquiler());
        config.setPlanilla(request.planilla());
        config.setServicios(request.servicios());
        config.setMarketing(request.marketing());
        config.setOtros(request.otros());
        return CostoFijoResponse.desde(repository.save(config));
    }

    private CostoFijoConfig obtenerEntidad() {
        return repository.findById(CONFIG_ID).orElseGet(this::crearPorDefecto);
    }

    private CostoFijoConfig crearPorDefecto() {
        CostoFijoConfig config = new CostoFijoConfig();
        config.setId(CONFIG_ID);
        config.setAlquiler(BigDecimal.valueOf(2500));
        config.setPlanilla(BigDecimal.valueOf(8000));
        config.setServicios(BigDecimal.valueOf(600));
        config.setMarketing(BigDecimal.valueOf(300));
        config.setOtros(BigDecimal.valueOf(400));
        return repository.save(config);
    }
}
