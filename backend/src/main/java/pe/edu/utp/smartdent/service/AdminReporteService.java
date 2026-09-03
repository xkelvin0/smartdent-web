package pe.edu.utp.smartdent.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.utp.smartdent.dto.admin.AdminFinanzasResponse;
import pe.edu.utp.smartdent.dto.admin.AdminResumenResponse;
import pe.edu.utp.smartdent.dto.admin.CostoFijoResponse;
import pe.edu.utp.smartdent.entity.Cita;
import pe.edu.utp.smartdent.entity.CitaEstado;
import pe.edu.utp.smartdent.entity.RolNombre;
import pe.edu.utp.smartdent.entity.Servicio;
import pe.edu.utp.smartdent.repository.CitaRepository;
import pe.edu.utp.smartdent.repository.ServicioRepository;
import pe.edu.utp.smartdent.repository.UsuarioRepository;

@Service
public class AdminReporteService {

    private final CitaRepository citaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ServicioRepository servicioRepository;
    private final CostoFijoService costoFijoService;

    public AdminReporteService(
            CitaRepository citaRepository,
            UsuarioRepository usuarioRepository,
            ServicioRepository servicioRepository,
            CostoFijoService costoFijoService) {
        this.citaRepository = citaRepository;
        this.usuarioRepository = usuarioRepository;
        this.servicioRepository = servicioRepository;
        this.costoFijoService = costoFijoService;
    }

    @Transactional(readOnly = true)
    public AdminResumenResponse obtenerResumen() {
        var citas = citaRepository.findAllByOrderByFechaDescHoraInicioDesc();
        var usuarios = usuarioRepository.findAllByOrderByNombreCompletoAsc();
        var servicios = servicioRepository.findAllByOrderByNombreAsc();
        LocalDate hoy = LocalDate.now();

        long pendientes = citas.stream().filter(cita -> cita.getEstado() == CitaEstado.PENDIENTE).count();
        long atendidas = citas.stream().filter(cita -> cita.getEstado() == CitaEstado.ATENDIDA).count();
        long canceladas = citas.stream().filter(cita -> cita.getEstado() == CitaEstado.CANCELADA).count();
        long activas = citas.stream()
                .filter(cita -> cita.getEstado() == CitaEstado.PENDIENTE || cita.getEstado() == CitaEstado.CONFIRMADA)
                .count();
        long hoyCount = citas.stream()
                .filter(cita -> hoy.equals(cita.getFecha()) && cita.getEstado() != CitaEstado.CANCELADA)
                .count();
        long pacientes = usuarios.stream()
                .filter(usuario -> usuario.getRol().getNombre() == RolNombre.PACIENTE)
                .count();
        long odontologosActivos = usuarios.stream()
                .filter(usuario -> usuario.getRol().getNombre() == RolNombre.ODONTOLOGO && usuario.isActivo())
                .count();
        long serviciosActivos = servicios.stream().filter(servicio -> servicio.isActivo()).count();
        BigDecimal ingresoEstimado = citas.stream()
                .filter(cita -> cita.getEstado() == CitaEstado.ATENDIDA)
                .map(cita -> cita.getPrecioPactado() == null ? BigDecimal.ZERO : cita.getPrecioPactado())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new AdminResumenResponse(
                citas.size(),
                pendientes,
                atendidas,
                canceladas,
                pacientes,
                odontologosActivos,
                serviciosActivos,
                activas,
                hoyCount,
                ingresoEstimado);
    }

    @Transactional(readOnly = true)
    public AdminFinanzasResponse obtenerFinanzas() {
        List<Cita> citas = citaRepository.findAllByOrderByFechaDescHoraInicioDesc();
        List<Servicio> servicios = servicioRepository.findAllByOrderByNombreAsc();
        Map<Long, Servicio> serviciosPorId = servicios.stream()
                .collect(Collectors.toMap(Servicio::getId, Function.identity()));
        CostoFijoResponse costosFijos = costoFijoService.obtener();
        BigDecimal fijoMensual = sumarCostosFijos(costosFijos);
        YearMonth actual = YearMonth.now();

        List<Cita> atendidasMesActual = citas.stream()
                .filter(cita -> cita.getEstado() == CitaEstado.ATENDIDA)
                .filter(cita -> YearMonth.from(cita.getFecha()).equals(actual))
                .toList();

        BigDecimal ingresosMesActual = atendidasMesActual.stream()
                .map(cita -> valorSeguro(cita.getPrecioPactado()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal costosVariablesMesActual = atendidasMesActual.stream()
                .map(cita -> costoServicio(cita, serviciosPorId))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal utilidadMesActual = ingresosMesActual.subtract(costosVariablesMesActual).subtract(fijoMensual);
        int margenMesActual = ingresosMesActual.signum() > 0
                ? utilidadMesActual.multiply(BigDecimal.valueOf(100)).divide(ingresosMesActual, 0, java.math.RoundingMode.HALF_UP).intValue()
                : 0;

        List<AdminFinanzasResponse.FinanzaMensualItem> mensual = java.util.stream.IntStream.rangeClosed(0, 5)
                .mapToObj(offset -> actual.minusMonths(5L - offset))
                .map(periodo -> construirMes(periodo, citas, serviciosPorId, fijoMensual))
                .toList();

        List<AdminFinanzasResponse.DemandaServicioItem> demanda = citas.stream()
                .filter(cita -> cita.getEstado() != CitaEstado.CANCELADA)
                .collect(Collectors.groupingBy(cita -> cita.getServicio().getNombre(), Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(6)
                .map(entry -> new AdminFinanzasResponse.DemandaServicioItem(entry.getKey(), entry.getValue()))
                .toList();

        return new AdminFinanzasResponse(
                ingresosMesActual,
                costosVariablesMesActual,
                fijoMensual,
                utilidadMesActual,
                margenMesActual,
                mensual,
                demanda);
    }

    private AdminFinanzasResponse.FinanzaMensualItem construirMes(
            YearMonth periodo,
            List<Cita> citas,
            Map<Long, Servicio> serviciosPorId,
            BigDecimal fijoMensual) {
        List<Cita> atendidas = citas.stream()
                .filter(cita -> cita.getEstado() == CitaEstado.ATENDIDA)
                .filter(cita -> YearMonth.from(cita.getFecha()).equals(periodo))
                .toList();
        BigDecimal ingresos = atendidas.stream()
                .map(cita -> valorSeguro(cita.getPrecioPactado()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal costosVariables = atendidas.stream()
                .map(cita -> costoServicio(cita, serviciosPorId))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        String etiqueta = periodo.getMonth().getDisplayName(TextStyle.SHORT, new Locale("es", "PE"))
                .replace(".", "");
        return new AdminFinanzasResponse.FinanzaMensualItem(
                periodo.toString(),
                etiqueta,
                ingresos,
                fijoMensual.add(costosVariables));
    }

    private BigDecimal sumarCostosFijos(CostoFijoResponse costos) {
        return valorSeguro(costos.alquiler())
                .add(valorSeguro(costos.planilla()))
                .add(valorSeguro(costos.servicios()))
                .add(valorSeguro(costos.marketing()))
                .add(valorSeguro(costos.otros()));
    }

    private BigDecimal costoServicio(Cita cita, Map<Long, Servicio> serviciosPorId) {
        Servicio servicio = serviciosPorId.get(cita.getServicio().getId());
        return servicio == null ? BigDecimal.ZERO : valorSeguro(servicio.getCosto());
    }

    private BigDecimal valorSeguro(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }
}
