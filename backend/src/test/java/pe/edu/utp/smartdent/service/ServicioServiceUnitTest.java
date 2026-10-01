package pe.edu.utp.smartdent.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pe.edu.utp.smartdent.dto.servicio.ServicioRequest;
import pe.edu.utp.smartdent.entity.Servicio;
import pe.edu.utp.smartdent.exception.RecursoDuplicadoException;
import pe.edu.utp.smartdent.exception.RecursoNoEncontradoException;
import pe.edu.utp.smartdent.repository.ServicioRepository;

@ExtendWith(MockitoExtension.class)
class ServicioServiceUnitTest {

    @Mock ServicioRepository repository;
    @InjectMocks ServicioService service;

    @Test
    void listaSoloServiciosPublicosActivos() {
        when(repository.findByActivoTrueOrderByNombreAsc()).thenReturn(List.of(servicio("SRV-LIMPIEZA", true)));

        var resultado = service.listarPublicos();

        assertThat(resultado).hasSize(1);
        assertThat(resultado.getFirst().codigo()).isEqualTo("SRV-LIMPIEZA");
    }

    @Test
    void creaServicioNormalizandoElCodigo() {
        when(repository.save(any(Servicio.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var creado = service.crear(request(" srv-nuevo ", true));

        assertThat(creado.codigo()).isEqualTo("SRV-NUEVO");
        assertThat(creado.precio()).isEqualByComparingTo("120.00");
        verify(repository).save(any(Servicio.class));
    }

    @Test
    void rechazaCrearUnCodigoDuplicado() {
        when(repository.existsByCodigoIgnoreCase("SRV-NUEVO")).thenReturn(true);

        assertThatThrownBy(() -> service.crear(request("SRV-NUEVO", true)))
                .isInstanceOf(RecursoDuplicadoException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void actualizaLosDatosDeUnServicioExistente() {
        Servicio existente = servicio("SRV-ANTERIOR", true);
        when(repository.findById(7L)).thenReturn(Optional.of(existente));

        var actualizado = service.actualizar(7L, request("SRV-ACTUALIZADO", true));

        assertThat(actualizado.codigo()).isEqualTo("SRV-ACTUALIZADO");
        assertThat(actualizado.nombre()).isEqualTo("Limpieza dental");
    }

    @Test
    void cambiaElEstadoDelServicio() {
        Servicio existente = servicio("SRV-LIMPIEZA", true);
        when(repository.findById(7L)).thenReturn(Optional.of(existente));

        var actualizado = service.cambiarEstado(7L, false);

        assertThat(actualizado.activo()).isFalse();
    }

    @Test
    void informaCuandoElServicioNoExiste() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.cambiarEstado(99L, false))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    private ServicioRequest request(String codigo, boolean activo) {
        return new ServicioRequest(codigo, "Limpieza dental", "Prevención", "Profilaxis completa",
                new BigDecimal("120.00"), new BigDecimal("35.00"), 45, null, activo);
    }

    private Servicio servicio(String codigo, boolean activo) {
        Servicio servicio = new Servicio();
        servicio.setCodigo(codigo);
        servicio.setNombre("Limpieza dental");
        servicio.setEspecialidad("Prevención");
        servicio.setDescripcion("Profilaxis completa");
        servicio.setPrecio(new BigDecimal("120.00"));
        servicio.setCosto(new BigDecimal("35.00"));
        servicio.setDuracionMinutos(45);
        servicio.setActivo(activo);
        return servicio;
    }
}
