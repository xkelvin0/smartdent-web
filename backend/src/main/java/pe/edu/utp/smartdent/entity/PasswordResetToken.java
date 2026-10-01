package pe.edu.utp.smartdent.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "password_reset_token")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @OneToOne(targetEntity = Usuario.class, fetch = FetchType.EAGER)
    @JoinColumn(nullable = false, name = "usuario_id")
    private Usuario usuario;

    @Column(nullable = false)
    private LocalDateTime expiracion;

    public PasswordResetToken() {}

    public PasswordResetToken(Usuario usuario) {
        this.usuario = usuario;
        this.token = UUID.randomUUID().toString();
        this.expiracion = LocalDateTime.now().plusMinutes(15);
    }

    public boolean isExpirado() {
        return LocalDateTime.now().isAfter(this.expiracion);
    }

    public Long getId() { return id; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public LocalDateTime getExpiracion() { return expiracion; }
    public void setExpiracion(LocalDateTime expiracion) { this.expiracion = expiracion; }
}
