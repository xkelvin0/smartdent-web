# SmartDent — Gestión de citas odontológicas

SmartDent es un prototipo web para gestionar citas, pacientes y atenciones de una clínica odontológica. El proyecto corresponde al curso **Desarrollo Web Integrado** de la Universidad Tecnológica del Perú.

## Estado del proyecto

El repositorio conserva el frontend del **Avance 1** desarrollado con HTML, CSS y JavaScript, e incorpora un backend funcional con Spring Boot y MariaDB. La API REST gestiona usuarios, autenticación JWT, servicios, odontólogos, citas, historias clínicas, bloqueos de agenda, configuración del paciente, reportes y mensajes de contacto en `smartdent_db`. El navegador conserva únicamente la sesión JWT; los datos de negocio se consultan desde la API.

## Funcionalidades

### Sitio público

- Página principal con servicios odontológicos.
- Catálogo completo de servicios.
- Páginas de Nosotros y Contacto.
- Mapa de ubicación de la clínica.
- Navegación y pie de página compartidos.
- Reserva protegida mediante inicio de sesión.

### Autenticación

- Registro de pacientes con validaciones.
- Inicio de sesión por correo y contraseña.
- Identificación de roles: paciente, odontólogo y administrador.
- Redirección al panel correspondiente.

### Panel del paciente

- Resumen de citas y recordatorios.
- Reserva, consulta, cancelación y reprogramación de citas.
- Historial clínico e indicaciones del odontólogo.
- Progreso del tratamiento por etapas.
- Comprobantes de atenciones completadas.
- Preferencias de contacto y recordatorios.

### Panel del odontólogo

- Agenda personal filtrada por día, semana, mes y estado.
- Confirmación y cancelación de citas.
- Bloqueo de horarios no disponibles.
- Consulta de pacientes asignados.
- Registro de diagnóstico, tratamiento, indicaciones y próximo control.
- Actualización de la etapa del tratamiento.
- Indicadores, alertas y actividad reciente.

### Panel del administrador

- Agenda global con filtros y exportación CSV.
- Consulta de pacientes, odontólogos y administradores.
- Creación y edición de cuentas de odontólogos con asignación de servicios.
- Gestión de servicios, precios, costos y disponibilidad.
- Configuración de gastos fijos mensuales.
- Cálculo estimado de ingresos, costos, utilidad y margen.
- Gráficos de estados, actividad, demanda e ingresos frente a costos.
- Bandeja de mensajes de contacto con estados nuevo, leído y respondido.

## Tecnologías

- HTML5.
- CSS3 y Tailwind CSS mediante CDN.
- JavaScript vanilla.
- Google Fonts y Material Symbols.
- Java 21 y Spring Boot para la API REST.
- Spring Data JPA y MariaDB para persistencia.
- Spring Security y JWT para autenticación y autorización.
- Springdoc OpenAPI y Swagger UI para documentación interactiva.
- JUnit y MockMvc para pruebas automatizadas.

## Ejecución local

1. Clona el repositorio:

   ```bash
   git clone https://github.com/xkelvin0/smartdent-web.git
   ```

2. Ingresa al proyecto:

   ```bash
   cd smartdent-web
   ```

3. Enciende MySQL desde XAMPP y verifica que exista la base de datos `smartdent_db`.

4. Inicia el backend desde `backend`:

   ```powershell
   .\mvnw.cmd spring-boot:run
   ```

5. Abre `maquetacion-html/index.html` mediante un servidor local. Se recomienda la extensión **Live Server** de Visual Studio Code.

6. Navega a la dirección mostrada por Live Server, por ejemplo:

   ```text
   http://127.0.0.1:5500/maquetacion-html/index.html
   ```

> No se recomienda abrir los archivos únicamente con `file://`, ya que algunas funciones del navegador pueden comportarse de forma diferente.

La documentación interactiva de la API se encuentra en `http://localhost:8080/swagger-ui.html`.

En GitHub Pages, el cliente HTTP selecciona automáticamente el backend compartido desplegado en `https://smartdent-web.onrender.com`. En `localhost` continúa utilizando `http://localhost:8080`, por lo que ambos entornos pueden usarse sin editar el código. El archivo `index.html` de la raíz redirige automáticamente a la página principal del frontend.

## Respaldo y apagado seguro

El proyecto incluye automatizaciones para proteger `smartdent_db`:

- `RESPALDAR_BD.cmd`: genera inmediatamente una copia SQL.
- `INSTALAR_RESPALDO_AUTOMATICO.cmd`: programa una copia diaria a las 8:00 p. m.
- `CERRAR_SMARTDENT.cmd`: comprueba que Spring Boot esté detenido, crea un respaldo y apaga MariaDB de manera segura.

Los respaldos se conservan fuera de la carpeta de datos de MariaDB, en `%LOCALAPPDATA%\SmartDent\backups`. Se guardan las 14 copias más recientes. Al finalizar una jornada, primero se debe detener Spring Boot con `Ctrl+C` y después ejecutar `CERRAR_SMARTDENT.cmd`; finalmente se puede cerrar XAMPP.

## Credenciales de prueba

Las cuentas precargadas de odontólogos y administrador están documentadas en [`doc/CREDENCIALES_PRUEBA.md`](doc/CREDENCIALES_PRUEBA.md). Los pacientes crean su propia cuenta desde la página de registro.

Estas credenciales son exclusivamente para la demostración del Avance 1. No deben utilizarse como modelo de seguridad para una aplicación real.

## Estructura del repositorio

```text
smartdent-web/
├── scripts/                       # Respaldo y apagado seguro de MariaDB
├── RESPALDAR_BD.cmd               # Respaldo manual con doble clic
├── CERRAR_SMARTDENT.cmd           # Respaldo y cierre seguro
├── INSTALAR_RESPALDO_AUTOMATICO.cmd
├── backend/                       # API REST con Spring Boot
├── doc/
│   ├── canvas/                    # Evidencias y tablero del proyecto
│   ├── CREDENCIALES_PRUEBA.md
│   ├── SmartDent_Avance_1.docx
│   └── requerimientos_funcionales.md
├── maquetacion-html/
│   ├── css/
│   │   ├── estilos.css            # Estilos globales actuales
│   │   └── styles.css             # Estilos conservados del módulo de acceso
│   ├── img/
│   │   ├── branding/              # Logos de SmartDent y UTP
│   │   ├── odontologos/           # Fotografías de profesionales
│   │   └── servicios/             # Imágenes de tratamientos
│   ├── js/
│   │   ├── api.js                 # Cliente HTTP compartido y sesión JWT
│   │   ├── appointment-api.js     # Integración REST y adaptación visual de citas
│   │   ├── clinical-api.js        # Integración REST de historias clínicas
│   │   ├── service-api.js         # Integración REST del catálogo administrativo
│   │   ├── admin-user-api.js      # Integración REST de usuarios y odontólogos
│   │   ├── admin-report-api.js    # Integración REST de indicadores y finanzas
│   │   ├── schedule-api.js        # Integración REST de bloqueos de agenda
│   │   ├── patient-settings-api.js # Configuración persistente del paciente
│   │   ├── contact-api.js         # Envío y administración de mensajes
│   │   ├── auth.js                # Registro, login y validaciones
│   │   ├── navbar.js              # Navegación pública compartida
│   │   ├── footer.js              # Pie de página compartido
│   │   ├── dashboard-nav.js       # Navegación de los paneles
│   │   ├── reservar.js            # Reserva y reprogramación de citas
│   │   ├── paciente.js            # Funciones del panel del paciente
│   │   ├── odontologo.js          # Agenda y expedientes clínicos
│   │   ├── admin.js               # Administración y reportes
│   │   ├── service-catalog.js     # Catálogo central de tarifas y costos
│   │   ├── servicios.js           # Interacción del catálogo público
│   │   ├── contacto.js            # Validaciones de contacto
│   │   └── tailwind-config.js     # Colores y configuración visual
│   ├── index.html                 # Página principal pública
│   ├── login.html                 # Inicio de sesión por roles
│   ├── registro.html              # Creación de cuentas de pacientes
│   ├── reservar.html              # Selección de servicio, doctor, fecha y hora
│   ├── paciente.html              # Citas, historial, facturación y configuración
│   ├── odontologo.html            # Agenda, pacientes y expedientes clínicos
│   ├── admin.html                 # Agenda global, usuarios, tarifas y finanzas
│   ├── servicios.html             # Catálogo de tratamientos odontológicos
│   ├── nosotros.html              # Información de SmartDent y del proyecto
│   └── contacto.html              # Formulario, datos y mapa de ubicación
├── .gitignore
└── README.md
```

### Páginas HTML

| Archivo | Acceso | Propósito |
|---|---|---|
| `index.html` | Público | Landing page y presentación de SmartDent |
| `servicios.html` | Público | Catálogo de servicios odontológicos |
| `nosotros.html` | Público | Información de la clínica y del equipo |
| `contacto.html` | Público | Contacto, ubicación y formulario de mensajes |
| `login.html` | Público | Autenticación de pacientes, odontólogos y administrador |
| `registro.html` | Público | Registro de nuevas cuentas de pacientes |
| `reservar.html` | Paciente | Creación y reprogramación de citas |
| `paciente.html` | Paciente | Panel personal, historial y comprobantes |
| `odontologo.html` | Odontólogo | Agenda profesional y gestión clínica |
| `admin.html` | Administrador | Gestión general, tarifas, costos y reportes |

## Persistencia

Los datos de negocio se almacenan en MariaDB mediante JPA/Hibernate. Esto incluye usuarios, odontólogos, servicios, citas, historias clínicas, bloqueos de agenda, costos fijos, preferencias del paciente y mensajes de contacto. `localStorage` conserva solamente el perfil de la sesión activa y su JWT; `sessionStorage` se utiliza para estados temporales de navegación, como el resultado de una reserva.

## Estado de integración

- API REST de usuarios, roles, servicios, odontólogos y citas implementada.
- Persistencia mediante JPA/Hibernate y MariaDB implementada.
- Registro, login y autorización JWT implementados.
- Formularios HTML de registro e inicio de sesión conectados al backend.
- Disponibilidad, reserva, reprogramación, cancelación y agendas por rol implementadas en el backend.
- Reserva HTML y paneles de paciente, odontólogo y administrador conectados a la API de citas.
- Historias clínicas persistentes conectadas a los paneles de paciente y odontólogo.
- Catálogo administrativo de precios, costos, duración y disponibilidad conectado a la API.
- Listado real de usuarios y gestión de odontólogos conectados al backend.
- Configuraciones personales, gastos fijos y mensajes de contacto persistentes.
- Bloqueos de agenda persistentes conectados al panel del odontólogo y a la disponibilidad pública.
- Documentación OpenAPI disponible mediante Swagger UI.
- 34 pruebas automatizadas del backend superadas.
- Pendiente para avances posteriores: migración del frontend a Angular y despliegue en la nube.

## Integrantes

- Acevedo Huarachi Kelvin Jesus — U23309803.
- Añorga Pinedo Paolo Alexander — U23305864.
- Calle Paredes Maykol Adan — U23242558.
- Salinas Perez Joseph Sebastian — U23325202.

## Nota de seguridad

Este avance es una maqueta académica. Las contraseñas ya se cifran con BCrypt y no se guardan en el navegador. Para producción todavía se deberá reforzar el almacenamiento del token, usar HTTPS y proteger adecuadamente la información clínica.
