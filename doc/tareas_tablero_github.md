# Tareas del Tablero de GitHub - SmartDent (Avance 1) 📋

Este documento contiene los títulos y las descripciones en formato Markdown listos para ser copiados y pegados en el tablero de **GitHub Projects** del equipo.

---

## Tarea 1: Maquetar index.html (Landing Page)
**Responsable:** Añorga Pinedo Paolo Alexander  
**Módulo:** Integrante 1 (Interfaz Principal)

### Título
`Maquetar index.html (Landing Page)`

### Descripción a copiar:
```markdown
**Descripción:**
Maquetar la página principal (Landing Page) para la clínica odontológica "SmartDent" utilizando HTML5 estructurado. El diseño debe ser limpio, moderno y responsivo.

**Tareas específicas:**
- Crear el archivo `maquetacion-html/index.html`.
- Enlazar el archivo CSS global (`estilos.css`) para mantener el diseño unificado.
- Diseñar la barra de navegación (Header) con logo, enlaces (Inicio, Servicios, Staff, Contacto) y botón de "Agendar Cita" (este botón debe redirigir a `login.html`).
- Crear la sección principal (Hero) con una imagen de fondo profesional y un título de bienvenida.
- Crear la sección de "Nuestros Servicios" (tarjetas para Limpieza, Ortodoncia, etc.).
- Crear la sección "Staff Médico" (tarjetas con fotos y nombres de los doctores).
- Crear el pie de página (Footer) con horarios de atención, dirección y redes sociales.

**Responsable:** Añorga Pinedo Paolo Alexander
```

---

## Tarea 2: Diseñar estilos.css (Estilos globales)
**Responsable:** Acevedo Huarachi Kelvin Jesus  
**Módulo:** Integrante 4 (Administración y Estilos Globales)

### Título
`Diseñar estilos.css (Estilos globales)`

### Descripción a copiar:
```markdown
**Descripción:**
Crear la hoja de estilos general (`estilos.css`) que definirá la identidad visual de SmartDent. Este archivo será compartido y enlazado por todos los integrantes en sus respectivos HTML.

**Tareas específicas:**
- Crear el archivo `maquetacion-html/css/estilos.css`.
- Definir la paleta de colores corporativos usando variables de CSS (Primary: Celeste #0ea5e9, Secondary: Gris #64748b, Background: #f0f9ff, Text: #0f172a).
- Configurar la tipografía global (ej: importar fuentes de Google Fonts como Inter o Roboto).
- Estructurar clases utilitarias para botones (estilo, hover, activo), tarjetas (cards con sombras suaves y bordes redondeados) y formularios.
- Asegurar que el diseño base sea responsivo.

**Responsable:** Acevedo Huarachi Kelvin Jesus
```

---

## Tarea 3: Maquetar login.html y registro.html + validaciones JS
**Responsable:** Salinas Perez Joseph Sebastian  
**Módulo:** Integrante 2 (Módulo de Acceso - Login y Registro)

### Título
`Maquetar login.html y registro.html + validaciones JS`

### Descripción a copiar:
```markdown
**Descripción:**
Desarrollar el flujo de acceso al sistema (Login y Registro) de manera estática y validar los datos ingresados por el usuario.

**Tareas específicas:**
- Crear los archivos `login.html` y `registro.html`.
- Crear el script `maquetacion-html/js/auth.js`.
- Diseñar formularios utilizando las clases CSS globales (inputs limpios, tarjetas modernas).
- Escribir validaciones en JS (correo válido `@`, contraseña mínimo de 6 caracteres, contraseñas coincidentes al registrarse).
- Simular redirección: al ingresar con una cuenta de paciente previamente registrada, redirigir a `paciente.html`; al ingresar como administrador, redirigir a `admin.html`.

**Responsable:** Salinas Perez Joseph Sebastian
```

---

## Tarea 4: Maquetar paciente.html y reservar.html + simulación de citas JS
**Responsable:** Calle Paredes Maykol Adan  
**Módulo:** Integrante 3 (Módulo del Paciente - Agendar Cita)

### Título
`Maquetar paciente.html y reservar.html + simulación de citas JS`

### Descripción a copiar:
```markdown
**Descripción:**
Desarrollar el panel de cara al cliente (Paciente) que le permita ver su historial de citas y agendar un nuevo turno de forma interactiva.

**Tareas específicas:**
- Crear los archivos `paciente.html` y `reservar.html`.
- Crear el script `maquetacion-html/js/paciente.js` (o citas.js).
- Mostrar una tabla/lista con citas simuladas del paciente (Fecha, hora, doctor, tratamiento, estado).
- Crear el formulario de reserva en `reservar.html` (selectores de tratamiento, dentista, calendario de fecha y hora).
- Escribir JS para que al "Confirmar Reserva", la nueva cita se agregue de forma simulada a la tabla del paciente y lo redirija a `paciente.html`.

**Responsable:** Calle Paredes Maykol Adan
```

---

## Tarea 5: Maquetar admin.html (Dashboard administrador) + filtros JS
**Responsable:** Acevedo Huarachi Kelvin Jesus  
**Módulo:** Integrante 4 (Administración y Estilos Globales)

### Título
`Maquetar admin.html (Dashboard administrador) + filtros JS`

### Descripción a copiar:
```markdown
**Descripción:**
Desarrollar el panel de gestión para el personal de la clínica. Debe mostrar estadísticas básicas y permitir la administración de la agenda global.

**Tareas específicas:**
- Crear el archivo `admin.html`.
- Crear el script `maquetacion-html/js/admin.js`.
- Diseñar tarjetas de métricas en la parte superior (Total citas de hoy, pendientes, confirmadas y total pacientes).
- Mostrar una tabla general con todas las citas de la clínica.
- Agregar buscador en JS para filtrar las citas de la tabla por nombre del paciente.
- Implementar botones de acción en la tabla ("Confirmar" y "Cancelar") que cambien de forma dinámica el estado visual de la cita y actualicen las tarjetas de métricas superiores.

**Responsable:** Acevedo Huarachi Kelvin Jesus
```
