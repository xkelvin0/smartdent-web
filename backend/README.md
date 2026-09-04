# Backend de SmartDent

API REST construida con Spring Boot, Java 21, Spring Web MVC, JPA, Validation y MariaDB.

## Requisitos

- Java 21.
- MariaDB/MySQL de XAMPP ejecutándose en el puerto `3306`.
- Base de datos `smartdent_db` creada.

## Ejecutar

Desde la carpeta `backend`:

```powershell
.\mvnw.cmd spring-boot:run
```

Después, abre:

```text
http://localhost:8080/api/health
```

La documentación interactiva está disponible en:

```text
http://localhost:8080/swagger-ui.html
```

Desde Swagger puedes ejecutar las rutas públicas directamente. Para probar rutas protegidas, inicia sesión con `POST /api/auth/login`, copia el valor de `token`, pulsa **Authorize** y pega únicamente el token, sin escribir `Bearer`.

La respuesta esperada es:

```json
{
  "status": "UP",
  "application": "smartdent-backend",
  "database": "smartdent_db"
}
```

Al iniciar por primera vez, JPA crea las tablas base:

- `roles`: permisos disponibles en el sistema.
- `usuarios`: información común de pacientes, odontólogos y administradores.
- `odontologos`: información profesional vinculada a un usuario.
- `servicios`: catálogo, duración, sesiones incluidas, precio y costo de cada tratamiento.
- `odontologo_servicios`: servicios que puede realizar cada profesional.
- `citas`: reservas persistentes con paciente, odontólogo, servicio, horario, precio, estado y sesión del tratamiento.
- `historias_clinicas`: diagnóstico, tratamiento, indicaciones y seguimiento por paciente y odontólogo.
- `bloqueos_horario`: períodos no disponibles definidos por cada odontólogo.
- `costos_fijos_config`: gastos mensuales utilizados en los reportes administrativos.
- `mensajes_contacto`: consultas enviadas desde la página pública de contacto.

También se registran automáticamente los roles `PACIENTE`, `ODONTOLOGO` y `ADMIN`.

## Registrar un paciente

```http
POST /api/auth/registro
Content-Type: application/json
```

Ejemplo desde PowerShell:

```powershell
$body = @{
    nombreCompleto = "Juan Pérez"
    dni = "12345678"
    email = "juan@correo.com"
    password = "Clave1234"
    telefono = "987654321"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://localhost:8080/api/auth/registro" `
    -Method Post `
    -ContentType "application/json; charset=utf-8" `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
```

El servidor responde con estado `201 Created`. La contraseña se almacena cifrada con BCrypt y nunca se incluye en la respuesta.

## Iniciar sesión y usar el JWT

Con el backend reiniciado, crea el cuerpo del login con una cuenta registrada:

```powershell
$loginBody = @{
    email = "maria.prueba@correo.com"
    password = "Clave1234"
} | ConvertTo-Json

$login = Invoke-RestMethod `
    -Uri "http://localhost:8080/api/auth/login" `
    -Method Post `
    -ContentType "application/json; charset=utf-8" `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($loginBody))

$login
```

La respuesta contiene un token firmado con vigencia de 8 horas. Para consultar el perfil protegido:

```powershell
Invoke-RestMethod `
    -Uri "http://localhost:8080/api/auth/perfil" `
    -Headers @{ Authorization = "Bearer $($login.token)" }
```

Las rutas públicas son `/api/health`, `/api/auth/registro` y `/api/auth/login`. Las demás requieren `Authorization: Bearer <token>` y se validan según el rol.

Durante el desarrollo, CORS admite los servidores locales de `localhost` y `127.0.0.1` en cualquier puerto, incluyendo Live Server (`5500`) y Angular (`4200`). Esta configuración debe limitarse a los dominios reales antes del despliegue.

## Catálogo y odontólogos

Rutas públicas:

```http
GET /api/servicios
GET /api/servicios/{id}
GET /api/odontologos
GET /api/odontologos?servicioId={id}
```

Las respuestas públicas muestran precios y datos profesionales, pero no exponen costos internos, correos ni credenciales.

Rutas exclusivas del administrador:

```http
GET   /api/admin/servicios
POST  /api/admin/servicios
PUT   /api/admin/servicios/{id}
PATCH /api/admin/servicios/{id}/estado?activo=false

GET  /api/admin/odontologos
POST /api/admin/odontologos
PUT  /api/admin/odontologos/{id}
```

Al iniciar por primera vez se cargan los 16 servicios de la maqueta, los cuatro odontólogos y la cuenta administrativa documentada en `doc/CREDENCIALES_PRUEBA.md`.

Para consultar el catálogo desde el navegador:

```text
http://localhost:8080/api/servicios
http://localhost:8080/api/odontologos
```

## Gestión de citas

Los servicios de varias sesiones se cobran una sola vez al abrir el tratamiento. Las reservas siguientes del mismo tratamiento se registran a costo cero e indican el número de sesión y las sesiones restantes. Al completar todas las sesiones, una nueva reserva inicia un nuevo tratamiento y aplica nuevamente el precio configurado.

El paciente se obtiene del JWT; el frontend no puede reservar una cita a nombre de otro usuario. La clínica atiende de lunes a sábado, de `09:00` a `18:00`, en intervalos de 30 minutos. El backend calcula la hora final usando la duración del servicio y evita cruces tanto del odontólogo como del paciente.

Rutas del paciente:

```http
POST  /api/pacientes/citas
GET   /api/pacientes/citas
GET   /api/pacientes/citas/disponibilidad?odontologoId={id}&servicioId={id}&fecha=2026-09-10
PUT   /api/pacientes/citas/{id}/reprogramar
PATCH /api/pacientes/citas/{id}/cancelar
```

Ejemplo de reserva:

```json
{
  "odontologoId": 1,
  "servicioId": 1,
  "fecha": "2026-09-10",
  "horaInicio": "10:30",
  "motivo": "Evaluación preventiva",
  "telefono": "987654321"
}
```

Rutas del odontólogo y del administrador:

```http
GET   /api/odontologos/mi-agenda
PATCH /api/odontologos/citas/{id}/estado
GET   /api/admin/citas
PATCH /api/admin/citas/{id}/estado
```

Los estados siguen el flujo `PENDIENTE → CONFIRMADA → ATENDIDA`. Una cita pendiente o confirmada también puede pasar a `CANCELADA`. El precio queda copiado en `precio_pactado`, por lo que una modificación futura del catálogo no altera una reserva anterior.

## Historias clínicas

El paciente solo puede consultar sus propios registros. El odontólogo puede consultar o actualizar la historia de pacientes que hayan formado parte de su agenda. Cuando se guarda una atención vinculada a una cita confirmada, la cita pasa a `ATENDIDA` en la misma transacción.

```http
GET /api/pacientes/historias-clinicas

GET /api/odontologos/historias-clinicas?pacienteEmail={correo}
PUT /api/odontologos/historias-clinicas?pacienteEmail={correo}
```

Ejemplo para guardar una atención:

```json
{
  "citaId": 1,
  "etapaTratamiento": "TRATAMIENTO",
  "alergias": "Ninguna",
  "diagnostico": "Pulpitis irreversible",
  "tratamiento": "Endodoncia iniciada",
  "indicaciones": "Seguir la receta indicada",
  "proximoControl": "2026-09-20",
  "observaciones": "Evolución favorable"
}
```

El próximo control queda registrado como seguimiento clínico; no crea automáticamente otra cita ni reserva un horario.

## Configuración opcional

La configuración local usa `root` sin contraseña como valor predeterminado. Si tu servidor usa otras credenciales, define las variables antes de ejecutar:

```powershell
$env:DB_URL = "jdbc:mariadb://localhost:3306/smartdent_db"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "tu_contraseña"
.\mvnw.cmd spring-boot:run
```

Las contraseñas reales no deben guardarse en el repositorio.

El proyecto utiliza `MariaDBLegacyDialect` porque la distribución actual de XAMPP incluye MariaDB 10.4. En un despliegue posterior se recomienda actualizar MariaDB a una versión soportada y retirar el dialecto heredado.

## Docker y despliegue con Aiven

El backend admite dos configuraciones sin cambiar los endpoints:

- Local: MariaDB de XAMPP mediante los valores predeterminados.
- Nube: MySQL de Aiven mediante variables de entorno.

Para comprobar la imagen localmente desde esta carpeta:

```powershell
docker build -t smartdent-backend .
docker run --rm -p 8080:8080 --env-file .env smartdent-backend
```

Antes de usar el segundo comando, copia `.env.example` como `.env` y completa sus valores únicamente en tu computadora. `.env` está excluido de Git.

En Render se debe seleccionar `backend` como directorio raíz y `Dockerfile` como entorno de ejecución. Las variables necesarias son:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
DB_DRIVER=com.mysql.cj.jdbc.Driver
DB_DIALECT=org.hibernate.dialect.MySQLDialect
DB_DDL_AUTO=update
JWT_SECRET
CORS_ALLOWED_ORIGINS
```

La URL JDBC de Aiven utiliza este formato:

```text
jdbc:mysql://HOST:PUERTO/defaultdb?sslMode=REQUIRED&serverTimezone=America/Lima
```

Render proporciona `PORT` automáticamente. El estado del servicio puede comprobarse en `GET /api/health`. Las contraseñas y la URI completa de Aiven nunca deben guardarse en GitHub.
