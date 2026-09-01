# Requerimientos Funcionales - SmartDent 🦷

Este documento detalla los requerimientos funcionales del sistema web **SmartDent** agrupados por cada una de las páginas que componen el prototipo estático del Avance 1.

---

## 📄 1. index.html (Página de Inicio)
*   **RF-01:** El sistema debe mostrar la información general de la clínica, incluyendo la ubicación, horarios de atención y datos de contacto en el pie de página (footer).
*   **RF-02:** El sistema debe listar los servicios/tratamientos dentales disponibles con su respectivo título y descripción breve.
*   **RF-03:** El sistema debe mostrar el catálogo de odontólogos activos (staff médico).
*   **RF-04:** El sistema debe redirigir al usuario a la pantalla de inicio de sesión (`login.html`) al presionar el botón de acción principal ("Agendar Cita").

---

## 📄 2. login.html (Inicio de Sesión)
*   **RF-05:** El sistema debe permitir al usuario ingresar su correo electrónico y contraseña.
*   **RF-06:** El sistema debe validar que los campos de texto no se encuentren vacíos antes de procesar el acceso.
*   **RF-07:** El sistema debe redirigir al usuario al panel de pacientes (`paciente.html`) si las credenciales corresponden a un cliente, o al panel de administración (`admin.html`) si corresponden a un administrador.
*   **RF-08:** El sistema debe permitir la navegación a la pantalla de registro (`registro.html`) mediante un enlace directo.

---

## 📄 3. registro.html (Registro de Pacientes)
*   **RF-09:** El sistema debe permitir al usuario ingresar sus datos personales (Nombre Completo, DNI, Correo Electrónico y Contraseña).
*   **RF-10:** El sistema debe validar que el correo electrónico ingresado contenga un formato válido (`@`).
*   **RF-11:** El sistema debe validar que la contraseña y la confirmación de la contraseña coincidan exactamente antes de completar el registro.

---

## 📄 4. paciente.html (Panel del Paciente)
*   **RF-12:** El sistema debe mostrar un saludo de bienvenida personalizado que incluya el nombre del paciente logueado.
*   **RF-13:** El sistema debe mostrar una tabla histórica con el listado de las citas programadas exclusivamente por el paciente autenticado (mostrando fecha, hora, doctor, tratamiento y estado).
*   **RF-14:** El sistema debe permitir al paciente navegar hacia el formulario de reserva (`reservar.html`) mediante un botón de acción.

---

## 📄 5. reservar.html (Formulario de Reserva)
*   **RF-15:** El sistema debe permitir al paciente seleccionar el tratamiento que desea reservar mediante una lista desplegable.
*   **RF-16:** El sistema debe permitir al paciente seleccionar el odontólogo que desea que lo atienda.
*   **RF-17:** El sistema debe permitir seleccionar la fecha de la cita mediante un selector de calendario.
*   **RF-18:** El sistema debe permitir seleccionar una hora específica disponible para la cita.
*   **RF-19:** El sistema debe simular el registro de la cita al hacer clic en "Confirmar Reserva" y actualizar la lista en `paciente.html`.

---

## 📄 6. admin.html (Panel del Administrador)
*   **RF-20:** El sistema debe listar todas las citas programadas de todos los pacientes en una tabla centralizada.
*   **RF-21:** El sistema debe permitir al administrador buscar/filtrar citas ingresando el nombre del paciente en un campo de búsqueda.
*   **RF-22:** El sistema debe permitir al administrador cambiar el estado de cualquier cita a "Confirmado" o "Cancelado" mediante botones de acción interactivos en la tabla.
*   **RF-23:** El sistema debe mostrar tarjetas de métricas en la parte superior del panel (Ej: Citas del día, Citas Pendientes, Citas Confirmadas y Total de Pacientes).
