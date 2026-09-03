# Contexto actualizado del proyecto SmartDent

SmartDent es un sistema web para centralizar la gestión de pacientes, servicios odontológicos, profesionales, citas y atenciones clínicas. El proyecto corresponde al curso Desarrollo Web Integrado de la Universidad Tecnológica del Perú.

## Problema y solución

La coordinación manual por llamadas, WhatsApp, hojas de cálculo o cuadernos puede producir cruces de horarios, información duplicada y poca trazabilidad. SmartDent permite que el paciente consulte servicios, cree una cuenta y reserve; que cada odontólogo gestione únicamente su agenda y expedientes; y que el administrador supervise la operación general.

## Arquitectura actual

- Frontend del avance: HTML5, Tailwind CSS y JavaScript modular, servido mediante Live Server.
- Backend: Java 21 y Spring Boot 4 con arquitectura Controller–Service–Repository.
- Persistencia: Spring Data JPA/Hibernate y MariaDB de XAMPP.
- Seguridad: Spring Security, contraseñas BCrypt y JWT sin estado.
- Documentación: OpenAPI 3 y Swagger UI.
- Pruebas: JUnit y MockMvc; 34 pruebas automatizadas superadas al 3 de septiembre de 2026.
- Angular: planificado para un avance posterior, según la indicación docente.

### Pruebas automatizadas realizadas

- Autenticación, JWT, CORS y permisos según el rol.
- Registro de pacientes y validación de datos duplicados.
- Catálogo de servicios, profesionales, precios y disponibilidad.
- Administración de usuarios y odontólogos.
- Reserva, reprogramación, cancelación y estados de las citas.
- Historias clínicas y restricciones de acceso del odontólogo.
- Bloqueos de agenda y cálculo de horarios disponibles.
- Configuración y preferencias del paciente.
- Costos, reportes financieros y resumen administrativo.
- Mensajes enviados desde la página de contacto.
- Generación de la documentación OpenAPI y Swagger.

Estas comprobaciones son principalmente pruebas de integración con Spring Boot y MockMvc, ejecutadas mediante JUnit. El conjunto completo finaliza con 34 pruebas aprobadas, 0 fallos y 0 errores.

## Roles

### Paciente

Puede registrarse, iniciar sesión, consultar disponibilidad, reservar, reprogramar y cancelar citas, revisar su historial clínico, descargar comprobantes simulados y guardar preferencias de contacto.

### Odontólogo

Dispone de una agenda propia, confirma o cancela citas, bloquea horarios, consulta pacientes asignados y registra diagnósticos, tratamientos, indicaciones y controles.

### Administrador

Consulta la agenda global, administra odontólogos y servicios, actualiza tarifas, visualiza indicadores y reportes financieros, configura costos fijos y atiende la bandeja de mensajes de contacto. No modifica directamente las notas clínicas.

## Datos persistentes

Las principales tablas son `roles`, `usuarios`, `odontologos`, `servicios`, `odontologo_servicios`, `citas`, `historias_clinicas`, `bloqueos_horario`, `costos_fijos_config` y `mensajes_contacto`. Los datos de negocio se guardan en `smartdent_db`; el navegador almacena únicamente la sesión JWT y estados temporales de navegación.

## API implementada

- Autenticación: `/api/auth/registro`, `/api/auth/login` y `/api/auth/perfil`.
- Catálogo público: `/api/servicios` y `/api/odontologos`.
- Paciente: `/api/pacientes/citas`, `/api/pacientes/historias-clinicas` y `/api/pacientes/configuracion`.
- Odontólogo: `/api/odontologos/mi-agenda`, `/api/odontologos/citas`, `/api/odontologos/historias-clinicas` y `/api/odontologos/bloqueos`.
- Administrador: `/api/admin/citas`, `/api/admin/usuarios`, `/api/admin/odontologos`, `/api/admin/servicios`, `/api/admin/reportes` y `/api/admin/mensajes`.
- Contacto público: `/api/contacto/mensajes`.

La documentación interactiva se abre en `http://localhost:8080/swagger-ui.html` con el backend en ejecución.

## Alcance del Avance 1

El documento académico llega hasta el Capítulo II, apartado 2.4.2, e incluye resumen, planteamiento del proyecto, marco teórico, fundamentos de TDD y pruebas con JUnit. La maquetación HTML forma parte del avance. Aunque el backend ya está funcional como progreso adicional, Angular y el despliegue permanecen pendientes para entregas posteriores.

## Integrantes

- Acevedo Huarachi Kelvin Jesus — U23309803.
- Añorga Pinedo Paolo Alexander — U23305864.
- Calle Paredes Maykol Adan — U23242558.
- Salinas Perez Joseph Sebastian — U23325202.
