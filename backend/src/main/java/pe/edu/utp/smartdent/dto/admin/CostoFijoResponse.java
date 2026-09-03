package pe.edu.utp.smartdent.dto.admin;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import pe.edu.utp.smartdent.entity.CostoFijoConfig;

public record CostoFijoResponse(
        BigDecimal alquiler,
        BigDecimal planilla,
        BigDecimal servicios,
        BigDecimal marketing,
        BigDecimal otros,
        LocalDateTime actualizadoEn) {

    public static CostoFijoResponse desde(CostoFijoConfig config) {
        return new CostoFijoResponse(
                config.getAlquiler(),
                config.getPlanilla(),
                config.getServicios(),
                config.getMarketing(),
                config.getOtros(),
                config.getActualizadoEn());
    }
}
