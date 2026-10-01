package pe.edu.utp.smartdent.dto.admin;

import java.math.BigDecimal;
import java.util.List;

public record AdminFinanzasResponse(
        BigDecimal ingresosMesActual,
        BigDecimal costosVariablesMesActual,
        BigDecimal gastosFijosMensuales,
        BigDecimal utilidadMesActual,
        int margenMesActual,
        List<FinanzaMensualItem> mensual,
        List<DemandaServicioItem> demandaServicios) {

    public record FinanzaMensualItem(
            String periodo,
            String etiqueta,
            BigDecimal ingresos,
            BigDecimal costos) {
    }

    public record DemandaServicioItem(
            String servicio,
            long reservas) {
    }
}
