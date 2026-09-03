package pe.edu.utp.smartdent.historia;

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
import pe.edu.utp.smartdent.dto.cita.CrearCitaRequest;
import pe.edu.utp.smartdent.dto.historia.GuardarHistoriaClinicaRequest;
import pe.edu.utp.smartdent.entity.CitaEstado;
import pe.edu.utp.smartdent.entity.EtapaTratamiento;
import pe.edu.utp.smartdent.exception.RecursoNoEncontradoException;
import pe.edu.utp.smartdent.exception.ReglaNegocioException;
import pe.edu.utp.smartdent.repository.OdontologoRepository;
import pe.edu.utp.smartdent.repository.ServicioRepository;
import pe.edu.utp.smartdent.service.CitaService;
import pe.edu.utp.smartdent.service.HistoriaClinicaService;
import pe.edu.utp.smartdent.service.RegistroPacienteService;

@SpringBootTest
@Transactional
class HistoriaClinicaIntegrationTests {

    @Autowired private HistoriaClinicaService historiaClinicaService;
    @Autowired private CitaService citaService;
    @Autowired private RegistroPacienteService registroPacienteService;
    @Autowired private OdontologoRepository odontologoRepository;
    @Autowired private ServicioRepository servicioRepository;

    @Test
    void debeGuardarLaHistoriaMarcarLaCitaAtendidaYMostrarlaAlPaciente() {
        String paciente = registrarPaciente();
        var odontologo = odontologoRepository.findByCodigoIgnoreCase("DOC-MIGUEL-SILVA").orElseThrow();
        var servicio = servicioRepository.findByCodigoIgnoreCase("SRV-ENDODONCIA").orElseThrow();
        LocalDate fecha = siguienteDiaHabil();
        var cita = citaService.reservar(paciente, new CrearCitaRequest(
                odontologo.getId(), servicio.getId(), fecha, LocalTime.of(9, 0),
                "Dolor intenso", "987654321"));
        citaService.cambiarEstadoPorOdontologo(
                "miguel.silva@smartdent.com", cita.id(), CitaEstado.CONFIRMADA);

        var historia = historiaClinicaService.guardar(
                "miguel.silva@smartdent.com", paciente,
                new GuardarHistoriaClinicaRequest(
                        cita.id(), EtapaTratamiento.TRATAMIENTO, "Ninguna",
                        "Pulpitis irreversible", "Endodoncia iniciada",
                        "Tomar el medicamento indicado", fecha.plusDays(7), "Evolución favorable"));

        assertThat(historia.ultimaCitaId()).isEqualTo(cita.id());
        assertThat(historiaClinicaService.listarDelPaciente(paciente))
                .extracting("id").containsExactly(historia.id());
        assertThat(citaService.listarDelPaciente(paciente).getFirst().estado())
                .isEqualTo(CitaEstado.ATENDIDA);

        var actualizada = historiaClinicaService.guardar(
                "miguel.silva@smartdent.com", paciente,
                new GuardarHistoriaClinicaRequest(
                        null, EtapaTratamiento.COMPLETADO, "Ninguna",
                        "Pieza restaurada", "Tratamiento completado",
                        "Control preventivo", fecha.plusDays(30), null));
        assertThat(actualizada.id()).isEqualTo(historia.id());
        assertThat(actualizada.etapaTratamiento()).isEqualTo(EtapaTratamiento.COMPLETADO);

        assertThatThrownBy(() -> historiaClinicaService.consultarPorOdontologo(
                "elena.ruiz@smartdent.com", paciente))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    void debeExigirQueLaCitaEsteConfirmadaAntesDeAtenderla() {
        String paciente = registrarPaciente();
        var odontologo = odontologoRepository.findByCodigoIgnoreCase("DOC-CARLOS-MENDOZA").orElseThrow();
        var servicio = servicioRepository.findByCodigoIgnoreCase("SRV-CONSULTA").orElseThrow();
        var cita = citaService.reservar(paciente, new CrearCitaRequest(
                odontologo.getId(), servicio.getId(), siguienteDiaHabil(), LocalTime.of(14, 0),
                null, "987654321"));

        assertThatThrownBy(() -> historiaClinicaService.guardar(
                "carlos.mendoza@smartdent.com", paciente,
                new GuardarHistoriaClinicaRequest(
                        cita.id(), EtapaTratamiento.CONSULTA, null,
                        "Evaluación general", "Examen clínico", null, null, null)))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("Confirma");
    }

    private String registrarPaciente() {
        String random = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        String email = "historia." + random + "@smartdent.test";
        String dni = String.format("%08d", Math.floorMod(UUID.randomUUID().hashCode(), 100_000_000));
        registroPacienteService.registrar(new RegistroPacienteRequest(
                "Paciente Historia", dni, email, "Clave1234", "987654321"));
        return email;
    }

    private LocalDate siguienteDiaHabil() {
        LocalDate fecha = LocalDate.now().plusDays(5);
        while (fecha.getDayOfWeek() == DayOfWeek.SUNDAY) fecha = fecha.plusDays(1);
        return fecha;
    }
}
