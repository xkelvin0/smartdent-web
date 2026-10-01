package pe.edu.utp.smartdent.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
@Entity
@Table(name = "verification_token")
public class VerificationToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String token;
    @OneToOne(targetEntity = Usuario.class, fetch = FetchType.EAGER)
    @JoinColumn(nullable = false, name = "usuario_id")
    private Usuario usuario;
    @Column(nullable = false)
    private LocalDateTime expiracion;
    public VerificationToken() {}
    public VerificationToken(Usuario usuario) {
        this.usuario = usuario;
        this.token = UUID.randomUUID().toString();
        this.expiracion = LocalDateTime.now().plusHours(24);
    }
    public boolean isExpirado() { return LocalDateTime.now().isAfter(this.expiracion); }
    public String getToken() { return token; }
    public Usuario getUsuario() { return usuario; }
}
