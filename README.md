# SmartDent — Gestión de citas odontológicas

SmartDent es un prototipo web para gestionar citas, pacientes y atenciones de una clínica odontológica. El proyecto corresponde al curso **Desarrollo Web Integrado** de la Universidad Tecnológica del Perú.

## Estado del proyecto

El repositorio contiene el **Avance 1**, desarrollado con HTML, CSS y JavaScript. En esta etapa no existe un backend ni una base de datos: la autenticación, las citas y los registros clínicos se simulan mediante `localStorage`.

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
- Gestión de servicios, precios, costos y disponibilidad.
- Configuración de gastos fijos mensuales.
- Cálculo estimado de ingresos, costos, utilidad y margen.
- Gráficos de estados, actividad, demanda e ingresos frente a costos.

## Tecnologías

- HTML5.
- CSS3 y Tailwind CSS mediante CDN.
- JavaScript vanilla.
- Google Fonts y Material Symbols.
- `localStorage` y `sessionStorage` para la simulación de datos.

## Ejecución local

No es necesario instalar dependencias.

1. Clona el repositorio:

   ```bash
   git clone https://github.com/xkelvin0/smartdent-web.git
   ```

2. Ingresa al proyecto:

   ```bash
   cd smartdent-web
   ```

3. Abre `maquetacion-html/index.html` mediante un servidor local. Se recomienda la extensión **Live Server** de Visual Studio Code.

4. Navega a la dirección mostrada por Live Server, por ejemplo:

   ```text
   http://127.0.0.1:5500/maquetacion-html/index.html
   ```

> No se recomienda abrir los archivos únicamente con `file://`, ya que algunas funciones del navegador pueden comportarse de forma diferente.

## Credenciales de prueba

Las cuentas de paciente, odontólogos y administrador están documentadas en [`doc/CREDENCIALES_PRUEBA.md`](doc/CREDENCIALES_PRUEBA.md).

Estas credenciales son exclusivamente para la demostración del Avance 1. No deben utilizarse como modelo de seguridad para una aplicación real.

## Estructura del repositorio

```text
smartdent-web/
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

## Persistencia del prototipo

Los principales datos se almacenan en el navegador:

| Clave | Contenido |
|---|---|
| `smartdent_users` | Pacientes registrados |
| `smartdent_session` | Sesión activa |
| `smartdent_appointments` | Citas creadas |
| `smartdent_clinical_records` | Registros clínicos |
| `smartdent_doctor_blocks` | Horarios bloqueados |
| `smartdent_service_catalog` | Servicios, precios y costos |
| `smartdent_fixed_costs` | Gastos fijos administrativos |

Los datos de distintos perfiles deben probarse en el mismo navegador y contexto. Una ventana de incógnito utiliza un almacenamiento independiente.

## Próximos avances

- API REST con Spring Boot.
- Persistencia mediante JPA/Hibernate y una base de datos relacional.
- Autenticación y autorización con Spring Security y JWT.
- Migración del frontend a Angular.
- Validación de disponibilidad desde el servidor.
- Despliegue de frontend, backend y base de datos.

## Integrantes

- Acevedo Huarachi Kelvin Jesus — U23309803.
- Añorga Pinedo Paolo Alexander — U23305864.
- Calle Paredes Maykol Adan — U23242558.
- Salinas Perez Joseph Sebastian — U23325202.

## Nota de seguridad

Este avance es una maqueta académica. Las contraseñas y datos almacenados en el navegador no son seguros para producción. La versión final deberá cifrar las contraseñas, validar los permisos en el backend y proteger la información clínica.
