package pe.edu.utp.smartdent.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(
        name = "notificaciones",
        indexes = {
                @Index(name = "idx_notificaciones_destinatario_fecha", columnList = "destinatario_email, creado_en")
        })
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "destinatario_email", nullable = false, length = 150)
    private String destinatarioEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificacionTipo tipo;

    @Column(nullable = false, length = 120)
    private String titulo;

    @Column(nullable = false, length = 350)
    private String mensaje;

    @Column(name = "vista_destino", nullable = false, length = 40)
    private String vistaDestino;

    @Column(name = "referencia_codigo", length = 60)
    private String referenciaCodigo;

    @Column(nullable = false)
    private boolean leida = false;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    public Notificacion() {
    }

    @PrePersist
    void prepararCreacion() {
        creadoEn = LocalDateTime.now();
        destinatarioEmail = destinatarioEmail.trim().toLowerCase();
    }

    public Long getId() {
        return id;
    }

    public String getDestinatarioEmail() {
        return destinatarioEmail;
    }

    public void setDestinatarioEmail(String destinatarioEmail) {
        this.destinatarioEmail = destinatarioEmail;
    }

    public NotificacionTipo getTipo() {
        return tipo;
    }

    public void setTipo(NotificacionTipo tipo) {
        this.tipo = tipo;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    public String getVistaDestino() {
        return vistaDestino;
    }

    public void setVistaDestino(String vistaDestino) {
        this.vistaDestino = vistaDestino;
    }

    public String getReferenciaCodigo() {
        return referenciaCodigo;
    }

    public void setReferenciaCodigo(String referenciaCodigo) {
        this.referenciaCodigo = referenciaCodigo;
    }

    public boolean isLeida() {
        return leida;
    }

    public void setLeida(boolean leida) {
        this.leida = leida;
    }

    public LocalDateTime getCreadoEn() {
        return creadoEn;
    }
}

