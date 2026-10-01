package pe.edu.utp.smartdent.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import pe.edu.utp.smartdent.dto.cita.CrearCitaRequest;
import pe.edu.utp.smartdent.entity.Cita;
import pe.edu.utp.smartdent.entity.CitaEstado;
import pe.edu.utp.smartdent.entity.Odontologo;
import pe.edu.utp.smartdent.entity.Servicio;
import pe.edu.utp.smartdent.entity.Usuario;
import pe.edu.utp.smartdent.exception.RecursoDuplicadoException;
import pe.edu.utp.smartdent.exception.ReglaNegocioException;
import pe.edu.utp.smartdent.repository.BloqueoHorarioRepository;
import pe.edu.utp.smartdent.repository.CitaRepository;
import pe.edu.utp.smartdent.repository.OdontologoRepository;
import pe.edu.utp.smartdent.repository.ServicioRepository;
import pe.edu.utp.smartdent.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CitaServiceUnitTest {

    @Mock CitaRepository citaRepository;
    @Mock UsuarioRepository usuarioRepository;
    @Mock OdontologoRepository odontologoRepository;
    @Mock ServicioRepository servicioRepository;
    @Mock BloqueoHorarioRepository bloqueoHorarioRepository;
    @InjectMocks CitaService service;

    private Usuario paciente;
    private Odontologo odontologo;
    private Servicio implante;

    @BeforeEach
    void configurarDatos() {
        paciente = org.mockito.Mockito.mock(Usuario.class);
        odontologo = org.mockito.Mockito.mock(Odontologo.class);
        implante = org.mockito.Mockito.mock(Servicio.class);
        Usuario usuarioOdontologo = org.mockito.Mockito.mock(Usuario.class);

        when(paciente.getId()).thenReturn(1L);
        when(paciente.getEmail()).thenReturn("paciente@correo.com");
        when(paciente.getNombreCompleto()).thenReturn("Paciente Prueba");
        when(paciente.isActivo()).thenReturn(true);
        when(odontologo.getId()).thenReturn(2L);
        when(odontologo.getUsuario()).thenReturn(usuarioOdontologo);
        when(usuarioOdontologo.isActivo()).thenReturn(true);
        when(usuarioOdontologo.getNombreCompleto()).thenReturn("Dr. Carlos Mendoza");
        when(implante.getId()).thenReturn(3L);
        when(implante.getNombre()).thenReturn("Implantología Avanzada");
        when(implante.getPrecio()).thenReturn(new BigDecimal("900.00"));
        when(implante.getDuracionMinutos()).thenReturn(120);
        when(implante.getSesionesIncluidas()).thenReturn(4);
        when(implante.isActivo()).thenReturn(true);
        when(odontologo.getServicios()).thenReturn(Set.of(implante));
        when(usuarioRepository.findByEmailIgnoreCase("paciente@correo.com")).thenReturn(Optional.of(paciente));
        when(odontologoRepository.buscarPorIdParaReserva(2L)).thenReturn(Optional.of(odontologo));
        when(servicioRepository.findById(3L)).thenReturn(Optional.of(implante));
        when(citaRepository.findByPaciente_IdAndServicio_IdOrderByCreadoEnDesc(1L, 3L)).thenReturn(List.of());
        when(citaRepository.saveAndFlush(any(Cita.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void primeraSesionCobraElTratamientoCompleto() {
        var cita = service.reservar("paciente@correo.com", request(fechaHabil(2), LocalTime.of(9, 0)));

        assertThat(cita.numeroSesion()).isEqualTo(1);
        assertThat(cita.totalSesiones()).isEqualTo(4);
        assertThat(cita.sesionesRestantes()).isEqualTo(3);
        assertThat(cita.precioPactado()).isEqualByComparingTo("900.00");
    }

    @Test
    void segundaSesionDelMismoTratamientoNoVuelveACobrar() {
        Cita anterior = new Cita();
        anterior.setEstado(CitaEstado.ATENDIDA);
        anterior.setTratamientoCodigo("TRA-PRUEBA");
        anterior.setNumeroSesion(1);
        anterior.setTotalSesiones(4);
        when(citaRepository.findByPaciente_IdAndServicio_IdOrderByCreadoEnDesc(1L, 3L))
                .thenReturn(List.of(anterior));

        var cita = service.reservar("paciente@correo.com", request(fechaHabil(3), LocalTime.of(9, 0)));

        assertThat(cita.numeroSesion()).isEqualTo(2);
        assertThat(cita.sesionesRestantes()).isEqualTo(2);
        assertThat(cita.precioPactado()).isZero();
        assertThat(cita.tratamientoCodigo()).isEqualTo("TRA-PRUEBA");
    }

    @Test
    void rechazaUnaReservaEnDomingo() {
        LocalDate domingo = LocalDate.now().plusDays(1);
        while (domingo.getDayOfWeek() != DayOfWeek.SUNDAY) domingo = domingo.plusDays(1);

        LocalDate fecha = domingo;
        assertThatThrownBy(() -> service.reservar(
                "paciente@correo.com", request(fecha, LocalTime.of(9, 0))))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("domingos");
    }

    @Test
    void rechazaCruceDeHorarioDelOdontologo() {
        when(citaRepository.existeCruceOdontologo(
                eq(2L), any(LocalDate.class), eq(LocalTime.of(9, 0)),
                eq(LocalTime.of(11, 0)), anyCollection())).thenReturn(true);

        assertThatThrownBy(() -> service.reservar(
                "paciente@correo.com", request(fechaHabil(4), LocalTime.of(9, 0))))
                .isInstanceOf(RecursoDuplicadoException.class)
                .hasMessageContaining("odontólogo");
    }

    @Test
    void rechazaCruceDeHorarioDelPaciente() {
        when(citaRepository.existeCrucePaciente(
                anyString(), any(LocalDate.class), eq(LocalTime.of(9, 0)),
                eq(LocalTime.of(11, 0)), anyCollection())).thenReturn(true);

        assertThatThrownBy(() -> service.reservar(
                "paciente@correo.com", request(fechaHabil(5), LocalTime.of(9, 0))))
                .isInstanceOf(RecursoDuplicadoException.class)
                .hasMessageContaining("otra cita");
    }

    private CrearCitaRequest request(LocalDate fecha, LocalTime hora) {
        return new CrearCitaRequest(2L, 3L, fecha, hora, "Tratamiento", "987654321");
    }

    private LocalDate fechaHabil(int dias) {
        LocalDate fecha = LocalDate.now().plusDays(dias);
        while (fecha.getDayOfWeek() == DayOfWeek.SUNDAY) fecha = fecha.plusDays(1);
        return fecha;
    }
}
