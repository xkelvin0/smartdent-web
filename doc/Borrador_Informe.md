# Borrador de Informe - SmartDent (Avance 1)

**Nota para el estudiante:** *Copia y pega este contenido en tu documento Word. Donde veas "[Insertar imagen...]", deberás colocar el diagrama correspondiente.*

---

### 2.5 Persistencia de Datos

#### 2.5.1 JPA
El proyecto utiliza Java Persistence API (JPA) como estándar para el mapeo objeto-relacional (ORM). Esto permite gestionar los datos de la clínica odontológica manejando entidades Java en lugar de escribir sentencias SQL manuales.

**Código representativo (Mapeo de entidad):**
```java
@Entity
@Table(name = "servicios")
public class Servicio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;
    
    // Getters y setters omitidos...
}
```

#### 2.5.2 Hibernate
Hibernate es la implementación (proveedor) de JPA elegida para SmartDent. Se encarga de traducir de manera transparente las operaciones de las entidades a comandos SQL nativos para la base de datos MariaDB, gestionando además el estado de los objetos en memoria.

#### 2.5.3 CRUD
Se implementaron interfaces que heredan de `JpaRepository` de Spring Data. Esto provee automáticamente operaciones CRUD listas para usar (guardar, buscar, eliminar) sin necesidad de escribir la lógica.

**Código representativo (Repositorio):**
```java
public interface CitaRepository extends JpaRepository<Cita, Long> {
    // Hereda los métodos save(), findById(), delete(), etc.
    List<Cita> findByPaciente_EmailIgnoreCaseOrderByFechaDescHoraInicioDesc(String email);
}
```

#### 2.5.4 JPQL
Para consultas complejas, se implementó Java Persistence Query Language (JPQL). Mediante la anotación `@Query` se crearon consultas personalizadas, como la verificación de cruce de horarios para evitar citas duplicadas.

**Código representativo (JPQL):**
```java
@Query("""
        select (count(c) > 0) from Cita c
        where c.odontologo.id = :odontologoId
          and c.fecha = :fecha
          and c.estado in :estados
          and c.horaInicio < :horaFin
          and c.horaFin > :horaInicio
        """)
boolean existeCruceOdontologo(
        @Param("odontologoId") Long odontologoId,
        @Param("fecha") LocalDate fecha,
        @Param("horaInicio") LocalTime horaInicio,
        @Param("horaFin") LocalTime horaFin,
        @Param("estados") Collection<CitaEstado> estados);
```

#### 2.5.5 Transacciones
Se aplicó la anotación `@Transactional` en la capa de servicios. Esto asegura el principio ACID en la base de datos. Por ejemplo, al registrar una historia clínica y cambiar el estado de una cita a "Atendida", ambas acciones se ejecutan en un solo bloque. Si ocurre algún error en el proceso, se realiza un rollback (deshacer), garantizando que no se guarden datos incompletos.

**Código representativo (Transacción en Historia Clínica):**
```java
@Service
public class HistoriaClinicaService {

    @Transactional
    public HistoriaClinicaResponse guardar(
            String emailOdontologo,
            String emailPaciente,
            GuardarHistoriaClinicaRequest request) {
            
        // ... validaciones omitidas ...

        // 1. Se busca la cita y se cambia su estado
        if (request.citaId() != null) {
            Cita cita = citaRepository.findByIdAndOdontologo_Usuario_EmailIgnoreCase(request.citaId(), emailOdontologo)...
            cita.setEstado(CitaEstado.ATENDIDA);
        }

        // 2. Se actualiza y guarda la historia clínica
        HistoriaClinica historia = historiaRepository.findByPaciente_EmailIgnoreCase...
        historia.setDiagnostico(request.diagnostico().trim());
        
        return HistoriaClinicaResponse.desde(historiaRepository.save(historia));
    }
}
```

---

### 2.6 Seguridad Web

#### 2.6.1 Spring Security
Se configuró Spring Security para proteger el acceso a la plataforma. Filtra las peticiones entrantes y exige autenticación para rutas protegidas.

#### 2.6.2 Roles y Permisos
El sistema cuenta con control de acceso basado en roles (RBAC). Las rutas están protegidas asegurando que un rol no pueda consumir servicios de otro.

**Código representativo (Roles definidos en el sistema):**
```java
package pe.edu.utp.smartdent.entity;

public enum RolNombre {
    PACIENTE,
    ODONTOLOGO,
    ADMIN
}
```

#### 2.6.3 JWT
La gestión de sesiones se realiza mediante JSON Web Tokens (JWT). Tras un inicio de sesión exitoso, el servidor genera un token firmado.

**Código representativo (Generación del token en LoginService):**
```java
Usuario usuario = buscarUsuarioActivo(email);
return new LoginResponse(
        jwtService.generarToken(usuario),
        "Bearer",
        jwtService.getExpirationSeconds(),
        PerfilResponse.desde(usuario)
);
```

---

### CAPÍTULO III: ANÁLISIS Y DISEÑO DEL SISTEMA

#### 3.1 Requerimientos

##### 3.1.1 Requerimientos funcionales
*   **RF01** Gestionar usuarios (registro y autenticación de pacientes, odontólogos y administradores).
*   **RF02** Gestionar catálogo de servicios (CRUD de servicios, precios y duración por parte del administrador).
*   **RF03** Gestionar agenda y disponibilidad (bloqueos de horario por parte del odontólogo).
*   **RF04** Gestionar citas odontológicas (reserva, reprogramación y cancelación validando cruces de horario).
*   **RF05** Gestionar historias clínicas (registro de atenciones, diagnósticos y tratamientos vinculados a una cita).

##### 3.1.2 Requerimientos no funcionales
*   **Seguridad:** Las contraseñas deben cifrarse con BCrypt y las sesiones gestionarse con tokens JWT.
*   **Escalabilidad:** El backend debe estar diseñado en un modelo sin estado (API REST) para facilitar su despliegue en contenedores.
*   **Rendimiento:** El tiempo de respuesta de las consultas de disponibilidad de citas no debe exceder los 2 segundos.
*   **Disponibilidad:** El sistema web debe estar accesible 24/7 con soporte para uso desde múltiples navegadores estándar.

#### 3.2 Casos de Uso
*(Descripción General)*
*   **Registrar Usuario:** Un nuevo paciente ingresa sus datos para crear una cuenta.
*   **Iniciar Sesión:** El sistema valida credenciales y devuelve un token JWT.
*   **Gestionar Servicios:** El administrador agrega o modifica los tratamientos.
*   **Reservar Cita:** El paciente selecciona un tratamiento y horario disponible.
*   **Registrar Atención Médica:** El odontólogo completa el registro médico del paciente.

*[Insertar imagen del Diagrama General de Casos de Uso aquí]*

#### 3.3 Modelo de Negocio
*[Insertar imagen del diagrama de procesos de negocio (BPMN) aquí]*

#### 3.4 Diagrama de Clases
*[Insertar imagen del Diagrama de Clases de las entidades principales aquí]*

#### 3.5 Modelo Relacional
*[Insertar imagen del Modelo Entidad-Relación (MER) de la base de datos MariaDB aquí]*

#### 3.6 Arquitectura del Sistema
El sistema se construyó bajo una arquitectura desacoplada:
*   **FRONTEND:** Desarrollado con HTML5, JavaScript y Tailwind CSS (futura migración a Angular).
*   **REST API:** Capa de comunicación HTTP en formato JSON.
*   **SPRING BOOT:** Capa lógica del backend en Java.
*   **JPA/HIBERNATE:** Capa de persistencia.
*   **MARIADB:** Motor de base de datos relacional.

---

### CAPÍTULO IV: DESARROLLO DEL SISTEMA

#### 4.1 Configuración del Entorno
*   **Java (JDK 21):** Lenguaje base para el backend.
*   **Spring Boot:** Framework principal.
*   **Frontend Web (HTML/JS/Tailwind CSS):** Interfaz actual.
*   **MariaDB / MySQL:** Servidor de base de datos.
*   **Postman / Swagger:** Herramientas de prueba de API.

#### 4.2 Desarrollo del Backend
El backend se estructuró en capas lógicas:
*   **Entidades:** Clases (`@Entity`).
*   **Repositorios:** Interfaces (`JpaRepository`).
*   **Servicios:** Lógica de negocio (`@Service`).
*   **Controladores:** Endpoints web (`@RestController`).

#### 4.3 Implementación de Seguridad
*   **Spring Security:** Filtro interceptor para toda petición entrante.
*   **JWT:** Validación de identidad por cada solicitud mediante cabecera Bearer.
*   **Roles:** Autorización estricta por tipo de usuario (`ADMIN`, `ODONTOLOGO`, `PACIENTE`).
