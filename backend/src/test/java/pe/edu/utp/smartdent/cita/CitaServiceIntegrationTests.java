package pe.edu.utp.smartdent.cita;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.utp.smartdent.dto.auth.RegistroPacienteRequest;
import pe.edu.utp.smartdent.dto.bloqueo.BloqueoHorarioRequest;
import pe.edu.utp.smartdent.dto.cita.CrearCitaRequest;
import pe.edu.utp.smartdent.dto.cita.ReprogramarCitaRequest;
import pe.edu.utp.smartdent.entity.CitaEstado;
import pe.edu.utp.smartdent.exception.RecursoDuplicadoException;
import pe.edu.utp.smartdent.exception.ReglaNegocioException;
import pe.edu.utp.smartdent.repository.OdontologoRepository;
import pe.edu.utp.smartdent.repository.ServicioRepository;
import pe.edu.utp.smartdent.service.BloqueoHorarioService;
import pe.edu.utp.smartdent.service.CitaService;
import pe.edu.utp.smartdent.service.RegistroPacienteService;

@SpringBootTest
@Transactional
class CitaServiceIntegrationTests {

    @Autowired
    private CitaService citaService;

    @Autowired
    private RegistroPacienteService registroPacienteService;

    @Autowired
    private OdontologoRepository odontologoRepository;

    @Autowired
    private ServicioRepository servicioRepository;

    @Autowired
    private BloqueoHorarioService bloqueoHorarioService;

    @Test
    void debeReservarYMostrarLaCitaEnLosTresPaneles() {
        String paciente = registrarPaciente("Paciente Uno");
        String segundoPaciente = registrarPaciente("Paciente Dos");
        var odontologo = odontologoRepository.findByCodigoIgnoreCase("DOC-CARLOS-MENDOZA").orElseThrow();
        var servicio = servicioRepository.findByCodigoIgnoreCase("SRV-CONSULTA").orElseThrow();
        LocalDate fecha = siguienteDiaHabil(2);

        var cita = citaService.reservar(paciente, new CrearCitaRequest(
                odontologo.getId(), servicio.getId(), fecha, LocalTime.of(10, 0),
                "Evaluación preventiva", "987654321"));

        assertThat(cita.estado()).isEqualTo(CitaEstado.PENDIENTE);
        assertThat(cita.precioPactado()).isEqualByComparingTo(servicio.getPrecio());
        assertThat(citaService.listarDelPaciente(paciente)).extracting("id").contains(cita.id());
        assertThat(citaService.listarDelOdontologo("carlos.mendoza@smartdent.com"))
                .extracting("id").contains(cita.id());
        assertThat(citaService.listarDelOdontologo("elena.ruiz@smartdent.com"))
                .extracting("id").doesNotContain(cita.id());
        assertThat(citaService.listarTodas()).extracting("id").contains(cita.id());

        assertThatThrownBy(() -> citaService.reservar(segundoPaciente, new CrearCitaRequest(
                odontologo.getId(), servicio.getId(), fecha, LocalTime.of(10, 0),
                null, "999888777")))
                .isInstanceOf(RecursoDuplicadoException.class)
                .hasMessageContaining("odontólogo");
    }

    @Test
    void debeActualizarDisponibilidadReprogramarYCancelar() {
        String paciente = registrarPaciente("Paciente Agenda");
        var odontologo = odontologoRepository.findByCodigoIgnoreCase("DOC-CARLOS-MENDOZA").orElseThrow();
        var servicio = servicioRepository.findByCodigoIgnoreCase("SRV-CONSULTA").orElseThrow();
        LocalDate fecha = siguienteDiaHabil(3);

        var cita = citaService.reservar(paciente, new CrearCitaRequest(
                odontologo.getId(), servicio.getId(), fecha, LocalTime.of(11, 0),
                null, "987654321"));
        assertThat(citaService.consultarDisponibilidad(odontologo.getId(), servicio.getId(), fecha)
                .horariosDisponibles()).doesNotContain(LocalTime.of(11, 0));

        var reprogramada = citaService.reprogramar(paciente, cita.id(),
                new ReprogramarCitaRequest(fecha, LocalTime.of(12, 30)));
        assertThat(reprogramada.horaInicio()).isEqualTo(LocalTime.of(12, 30));
        assertThat(citaService.consultarDisponibilidad(odontologo.getId(), servicio.getId(), fecha)
                .horariosDisponibles()).contains(LocalTime.of(11, 0)).doesNotContain(LocalTime.of(12, 30));

        var cancelada = citaService.cancelarPorPaciente(paciente, cita.id());
        assertThat(cancelada.estado()).isEqualTo(CitaEstado.CANCELADA);
        assertThat(citaService.consultarDisponibilidad(odontologo.getId(), servicio.getId(), fecha)
                .horariosDisponibles()).contains(LocalTime.of(12, 30));
    }

    @Test
    void odontologoDebeRespetarElFlujoDeEstados() {
        String paciente = registrarPaciente("Paciente Estado");
        var odontologo = odontologoRepository.findByCodigoIgnoreCase("DOC-MIGUEL-SILVA").orElseThrow();
        var servicio = servicioRepository.findByCodigoIgnoreCase("SRV-ENDODONCIA").orElseThrow();
        LocalDate fecha = siguienteDiaHabil(4);
        var cita = citaService.reservar(paciente, new CrearCitaRequest(
                odontologo.getId(), servicio.getId(), fecha, LocalTime.of(9, 0),
                "Dolor dental", "987654321"));

        var confirmada = citaService.cambiarEstadoPorOdontologo(
                "miguel.silva@smartdent.com", cita.id(), CitaEstado.CONFIRMADA);
        var atendida = citaService.cambiarEstadoPorOdontologo(
                "miguel.silva@smartdent.com", cita.id(), CitaEstado.ATENDIDA);

        assertThat(confirmada.estado()).isEqualTo(CitaEstado.CONFIRMADA);
        assertThat(atendida.estado()).isEqualTo(CitaEstado.ATENDIDA);
        assertThatThrownBy(() -> citaService.cancelarPorPaciente(paciente, cita.id()))
                .isInstanceOf(ReglaNegocioException.class);
    }

    @Test
    void debeQuitarHorariosBloqueadosDeLaDisponibilidadYEvitarReservas() {
        String paciente = registrarPaciente("Paciente Bloqueado");
        var odontologo = odontologoRepository.findByCodigoIgnoreCase("DOC-CARLOS-MENDOZA").orElseThrow();
        var servicio = servicioRepository.findByCodigoIgnoreCase("SRV-CONSULTA").orElseThrow();
        LocalDate fecha = siguienteDiaHabil(5);

        bloqueoHorarioService.crear("carlos.mendoza@smartdent.com", new BloqueoHorarioRequest(
                fecha, LocalTime.of(10, 0), LocalTime.of(11, 0), "Capacitación interna"));

        assertThat(citaService.consultarDisponibilidad(odontologo.getId(), servicio.getId(), fecha)
                .horariosDisponibles())
                .doesNotContain(LocalTime.of(10, 0), LocalTime.of(10, 30))
                .contains(LocalTime.of(11, 0));

        assertThatThrownBy(() -> citaService.reservar(paciente, new CrearCitaRequest(
                odontologo.getId(), servicio.getId(), fecha, LocalTime.of(10, 0),
                "Intento en bloque", "987654321")))
                .isInstanceOf(RecursoDuplicadoException.class)
                .hasMessageContaining("no está disponible");
    }

    @Test
    void debeCobrarUnaSolaVezYControlarLasSesionesDelTratamiento() {
        String paciente = registrarPaciente("Paciente Implantología");
        var odontologo = odontologoRepository.findByCodigoIgnoreCase("DOC-CARLOS-MENDOZA").orElseThrow();
        var servicio = servicioRepository.findByCodigoIgnoreCase("SRV-IMPLANTE").orElseThrow();

        var primera = reservarSesion(paciente, odontologo.getId(), servicio.getId(), 10);
        var segunda = reservarSesion(paciente, odontologo.getId(), servicio.getId(), 11);
        var tercera = reservarSesion(paciente, odontologo.getId(), servicio.getId(), 12);
        var cuarta = reservarSesion(paciente, odontologo.getId(), servicio.getId(), 13);
        var nuevoTratamiento = reservarSesion(paciente, odontologo.getId(), servicio.getId(), 14);

        assertThat(primera.precioPactado()).isEqualByComparingTo("900.00");
        assertThat(primera.numeroSesion()).isEqualTo(1);
        assertThat(primera.sesionesRestantes()).isEqualTo(3);
        assertThat(segunda.precioPactado()).isZero();
        assertThat(tercera.precioPactado()).isZero();
        assertThat(cuarta.precioPactado()).isZero();
        assertThat(cuarta.numeroSesion()).isEqualTo(4);
        assertThat(cuarta.sesionesRestantes()).isZero();
        assertThat(nuevoTratamiento.precioPactado()).isEqualByComparingTo("900.00");
        assertThat(nuevoTratamiento.numeroSesion()).isEqualTo(1);
        assertThat(nuevoTratamiento.tratamientoCodigo()).isNotEqualTo(primera.tratamientoCodigo());
    }

    private pe.edu.utp.smartdent.dto.cita.CitaResponse reservarSesion(
            String paciente, Long odontologoId, Long servicioId, int dias) {
        return citaService.reservar(paciente, new CrearCitaRequest(
                odontologoId, servicioId, siguienteDiaHabil(dias), LocalTime.of(9, 0),
                "Sesión del tratamiento", "987654321"));
    }

    private String registrarPaciente(String nombre) {
        String aleatorio = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        String email = "cita." + aleatorio + "@smartdent.test";
        String dni = String.format("%08d", Math.floorMod(UUID.randomUUID().hashCode(), 100_000_000));
        registroPacienteService.registrar(new RegistroPacienteRequest(
                nombre, dni, email, "Clave1234", "987654321"));
        return email;
    }

    private LocalDate siguienteDiaHabil(int dias) {
        LocalDate fecha = LocalDate.now().plusDays(dias);
        while (fecha.getDayOfWeek() == DayOfWeek.SUNDAY) {
            fecha = fecha.plusDays(1);
        }
        return fecha;
    }
}
