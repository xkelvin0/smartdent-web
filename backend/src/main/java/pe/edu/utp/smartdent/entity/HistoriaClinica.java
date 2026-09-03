package pe.edu.utp.smartdent.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "historias_clinicas",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_historia_paciente_odontologo",
                columnNames = {"paciente_id", "odontologo_id"}))
public class HistoriaClinica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String codigo;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "paciente_id", nullable = false)
    private Usuario paciente;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "odontologo_id", nullable = false)
    private Odontologo odontologo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ultima_cita_id")
    private Cita ultimaCita;

    @Enumerated(EnumType.STRING)
    @Column(name = "etapa_tratamiento", nullable = false, length = 20)
    private EtapaTratamiento etapaTratamiento;

    @Column(length = 1500)
    private String alergias;

    @Column(nullable = false, length = 2500)
    private String diagnostico;

    @Column(nullable = false, length = 2500)
    private String tratamiento;

    @Column(length = 2500)
    private String indicaciones;

    @Column(name = "proximo_control")
    private LocalDate proximoControl;

    @Column(length = 1500)
    private String observaciones;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn;

    @PrePersist
    void prepararCreacion() {
        LocalDateTime ahora = LocalDateTime.now();
        creadoEn = ahora;
        actualizadoEn = ahora;
    }

    @PreUpdate
    void prepararActualizacion() { actualizadoEn = LocalDateTime.now(); }

    public Long getId() { return id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public Usuario getPaciente() { return paciente; }
    public void setPaciente(Usuario paciente) { this.paciente = paciente; }
    public Odontologo getOdontologo() { return odontologo; }
    public void setOdontologo(Odontologo odontologo) { this.odontologo = odontologo; }
    public Cita getUltimaCita() { return ultimaCita; }
    public void setUltimaCita(Cita ultimaCita) { this.ultimaCita = ultimaCita; }
    public EtapaTratamiento getEtapaTratamiento() { return etapaTratamiento; }
    public void setEtapaTratamiento(EtapaTratamiento etapaTratamiento) { this.etapaTratamiento = etapaTratamiento; }
    public String getAlergias() { return alergias; }
    public void setAlergias(String alergias) { this.alergias = alergias; }
    public String getDiagnostico() { return diagnostico; }
    public void setDiagnostico(String diagnostico) { this.diagnostico = diagnostico; }
    public String getTratamiento() { return tratamiento; }
    public void setTratamiento(String tratamiento) { this.tratamiento = tratamiento; }
    public String getIndicaciones() { return indicaciones; }
    public void setIndicaciones(String indicaciones) { this.indicaciones = indicaciones; }
    public LocalDate getProximoControl() { return proximoControl; }
    public void setProximoControl(LocalDate proximoControl) { this.proximoControl = proximoControl; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
    public LocalDateTime getActualizadoEn() { return actualizadoEn; }
}
