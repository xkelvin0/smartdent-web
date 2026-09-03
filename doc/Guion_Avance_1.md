# Guion de exposición — Avance 1 de SmartDent

**Duración total:** 8 minutos  
**Integrantes:** 4 personas  
**Tiempo aproximado por integrante:** 2 minutos

La exposición debe centrarse en explicar las ideas principales. No es necesario leer todo el contenido de las diapositivas.

## Integrante 1 — Kelvin Acevedo

**Diapositivas 1 a 3 · 0:00–1:50**

### Diapositiva 1 — Presentación

> Buenos días, profesor y compañeros. Somos el equipo encargado de desarrollar SmartDent, un sistema web integrado para gestionar citas y atenciones de una clínica odontológica.
>
> El proyecto fue desarrollado para el curso de Desarrollo Web Integrado y busca digitalizar procesos que normalmente se realizan mediante llamadas, mensajes o registros manuales.

### Diapositiva 2 — Tecnologías

> Para construir el sistema utilizamos HTML5, CSS3 y Tailwind CSS en la interfaz, junto con JavaScript para conectar las páginas con el backend.
>
> En el servidor usamos Java 21 y Spring Boot. La persistencia se implementó con JPA, Hibernate y MariaDB.
>
> También usamos Spring Security, JWT y BCrypt para la autenticación, JUnit para las pruebas y Swagger para documentar la API.
>
> Angular todavía no se ha implementado porque corresponde a un avance posterior.

### Diapositiva 3 — Problemática

> El problema identificado es que una clínica puede gestionar sus citas mediante llamadas, WhatsApp o cuadernos.
>
> Esto puede producir cruces de horarios, información duplicada y poca trazabilidad de las atenciones.
>
> Además, el administrador no puede supervisar fácilmente las agendas, los servicios o los resultados económicos.

**Transición:**

> A continuación, mi compañero Paolo explicará la solución propuesta y cómo está organizado el sistema.

---

## Integrante 2 — Paolo Añorga

**Diapositivas 4 a 7 · 1:50–4:00**

### Diapositiva 4 — Solución y objetivo

> Como solución desarrollamos una plataforma centralizada para pacientes, odontólogos y administradores.
>
> Nuestro objetivo general es gestionar los procesos odontológicos de manera eficiente y segura.
>
> Para conseguirlo implementamos una API REST, persistencia en una base de datos, autenticación por roles e integración entre el frontend y el backend.

### Diapositiva 5 — Arquitectura

> El sistema utiliza una arquitectura por capas.
>
> El frontend envía solicitudes HTTP en formato JSON. Los controladores reciben las peticiones, los servicios aplican las reglas del negocio y los repositorios se comunican con MariaDB mediante JPA e Hibernate.
>
> Esta separación hace que el código sea más organizado, mantenible y fácil de probar.

### Diapositiva 6 — Roles

> SmartDent tiene tres roles.
>
> El paciente puede reservar citas, consultar su historial y configurar recordatorios.
>
> El odontólogo administra su propia agenda, atiende a sus pacientes y registra diagnósticos y tratamientos.
>
> El administrador supervisa la agenda global, administra odontólogos, servicios, precios y reportes.
>
> Cada rol solamente puede acceder a las funciones que le corresponden.

### Diapositiva 7 — Flujo de reserva

> Para reservar, el paciente selecciona un servicio, un profesional, una fecha y una hora.
>
> Antes de guardar la cita, el backend verifica que el horario se encuentre disponible y que no esté bloqueado.
>
> Después de confirmarse la atención, el odontólogo puede registrar la historia clínica.
>
> Una regla importante es que un horario ocupado desaparece de la disponibilidad para evitar reservas duplicadas.

**Transición:**

> Ahora Maykol explicará cómo se guardan los datos, cómo funciona la seguridad y qué estrategia de pruebas aplicamos.

---

## Integrante 3 — Maykol Calle

**Diapositivas 8 a 11 · 4:00–6:05**

### Diapositiva 8 — Persistencia

> Los datos de negocio se guardan en MariaDB.
>
> Entre las principales tablas tenemos usuarios, roles, odontólogos, servicios, citas, historias clínicas y costos.
>
> El navegador solamente conserva el token de la sesión y algunos estados temporales de navegación.
>
> Esto permite que una cita creada por el paciente también aparezca en los paneles del odontólogo y del administrador.

### Diapositiva 9 — API y seguridad

> La API está organizada en endpoints públicos y endpoints protegidos para cada rol.
>
> Cuando el usuario inicia sesión, Spring Security verifica la contraseña cifrada con BCrypt y genera un token JWT.
>
> Este token contiene la identidad y el rol del usuario. Luego se envía en cada solicitud protegida.
>
> También usamos Swagger para consultar y probar los endpoints desde el navegador.

### Diapositiva 10 — TDD y pruebas

> Para controlar la calidad utilizamos conceptos de desarrollo guiado por pruebas.
>
> El ciclo comienza escribiendo una prueba que falla, luego se implementa lo necesario para aprobarla y finalmente se mejora el código sin alterar su comportamiento.
>
> Actualmente el backend cuenta con 34 pruebas automatizadas aprobadas, sin fallos ni errores.
>
> Estas pruebas cubren autenticación, permisos, citas, disponibilidad, historias clínicas, reportes y documentación de la API.

### Diapositiva 11 — Prueba JWT

> Esta prueba comprueba que el inicio de sesión genere correctamente un token JWT.
>
> Primero se registra un paciente, después se inicia sesión y finalmente se decodifica el token.
>
> Las aserciones verifican que el tipo sea Bearer, que tenga una duración válida, que pertenezca al correo correcto y que contenga el rol de paciente.
>
> De esta manera comprobamos que la autenticación funciona antes de utilizarla en los paneles.

**Transición:**

> Finalmente, Joseph mostrará las pruebas del proceso principal y los resultados obtenidos.

---

## Integrante 4 — Joseph Salinas

**Diapositivas 12 a 14 · 6:05–8:00**

### Diapositiva 12 — Prueba de reserva

> Esta es una de las pruebas más importantes porque verifica el flujo central del proyecto.
>
> La prueba crea una cita y comprueba que su estado inicial sea pendiente.
>
> También verifica que aparezca en el panel del paciente, en la agenda del odontólogo asignado y en la agenda global del administrador.
>
> Adicionalmente, el conjunto de pruebas comprueba que dos pacientes no puedan reservar al mismo odontólogo en el mismo horario.

### Diapositiva 13 — Historia clínica

> Esta prueba verifica la atención clínica.
>
> Primero se confirma la cita y luego el odontólogo registra el diagnóstico, el tratamiento y las indicaciones.
>
> El sistema comprueba que la historia quede asociada a la cita y que esta cambie automáticamente al estado atendida.
>
> También se restringe el expediente para que solamente pueda acceder el odontólogo relacionado con el paciente.

### Diapositiva 14 — Resultados y cierre

> Como resultado obtuvimos un frontend conectado a una API real, persistencia en MariaDB, tres paneles diferenciados y seguridad mediante JWT y BCrypt.
>
> Además, contamos con 34 pruebas automatizadas aprobadas y documentación interactiva con Swagger.
>
> Como siguientes pasos migraremos el frontend a Angular, reforzaremos la seguridad para producción y desplegaremos la solución en la nube.
>
> En conclusión, SmartDent proporciona una base funcional y escalable para digitalizar la gestión de una clínica odontológica.
>
> Muchas gracias. Estamos atentos a sus preguntas.

## Recomendaciones para los 8 minutos

- No leer las rutas completas de los endpoints.
- En las diapositivas de código explicar solamente la preparación, la acción y el resultado.
- Cada integrante debe durar entre 1 minuto con 50 segundos y 2 minutos con 5 segundos.
- Practicar por lo menos una vez utilizando un cronómetro.
- Si falta tiempo, reducir la explicación de las tecnologías.
- Si sobra tiempo, mostrar brevemente Swagger o el flujo real de reserva.
