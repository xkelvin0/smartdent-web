package pe.edu.utp.smartdent.dto.admin;

import java.math.BigDecimal;

public record AdminResumenResponse(
        long totalCitas,
        long citasPendientes,
        long citasAtendidas,
        long citasCanceladas,
        long pacientesRegistrados,
        long odontologosActivos,
        long serviciosActivos,
        long citasActivas,
        long citasHoy,
        BigDecimal ingresoEstimado) {
}
