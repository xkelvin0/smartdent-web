package pe.edu.utp.smartdent.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "costos_fijos_config")
public class CostoFijoConfig {

    @Id
    private Long id;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal alquiler;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal planilla;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal servicios;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal marketing;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal otros;

    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn;

    @PrePersist
    @PreUpdate
    void prepararGuardado() {
        actualizadoEn = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public BigDecimal getAlquiler() { return alquiler; }
    public void setAlquiler(BigDecimal alquiler) { this.alquiler = alquiler; }
    public BigDecimal getPlanilla() { return planilla; }
    public void setPlanilla(BigDecimal planilla) { this.planilla = planilla; }
    public BigDecimal getServicios() { return servicios; }
    public void setServicios(BigDecimal servicios) { this.servicios = servicios; }
    public BigDecimal getMarketing() { return marketing; }
    public void setMarketing(BigDecimal marketing) { this.marketing = marketing; }
    public BigDecimal getOtros() { return otros; }
    public void setOtros(BigDecimal otros) { this.otros = otros; }
    public LocalDateTime getActualizadoEn() { return actualizadoEn; }
}
