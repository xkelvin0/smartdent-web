# Propuestas de Proyecto Final: Desarrollo Web Integrado

Equipo, aquí les presento 3 opciones viables, atractivas y profesionales para desarrollar durante el ciclo. Todas cumplen exactamente con las rúbricas del curso (Uso de Spring Boot, Base de Datos, Seguridad JWT y Frontend en Angular) y están pensadas para completarse sin problemas en 16 semanas.

---

## Opción 1: Sistema de Gestión de Citas Odontológicas (SmartDent) 🦷
*Mi recomendación principal por el equilibrio entre facilidad y profesionalismo.*

**¿De qué trata?**
Una plataforma web donde los pacientes pueden registrarse, ver los tratamientos disponibles (ortodoncia, limpieza, etc.) y separar una cita según los horarios libres del doctor. El administrador (recepcionista/doctor) puede ver la agenda del día y aprobar, rechazar o reprogramar citas.

**Módulos Principales:**
1. **Módulo de Usuarios y Seguridad:** Registro de pacientes y login (Roles: `ADMIN` y `PACIENTE`).
2. **Módulo de Servicios/Tratamientos:** Catálogo de tratamientos que ofrece la clínica con sus precios.
3. **Módulo de Citas:** Calendario o lista interactiva para que el paciente escoja fecha y hora. Panel de administración para ver la agenda.

**¿Por qué elegir esta opción?**
La base de datos es muy fácil de diseñar (Paciente, Cita, Servicio) y nos ahorraremos dolores de cabeza. Además, visualmente en Angular, integrar un calendario queda sumamente profesional para la presentación final.

---

## Opción 2: Sistema de Reservas y Pedidos para Restaurante (GourmetApp) 🍔

**¿De qué trata?**
Una plataforma para un restaurante moderno. Los clientes pueden ver el menú digital, hacer un pedido para recoger en local (o delivery), o reservar una mesa para un día específico. 

**Módulos Principales:**
1. **Módulo de Menú:** Gestión de platos, categorías (Bebidas, Platos de fondo) y precios (CRUD administrable).
2. **Módulo de Pedidos:** El cliente arma su pedido y lo envía. El administrador tiene una pantalla de "Cocina" para ir cambiando el estado (Recibido -> Preparando -> Listo).
3. **Módulo de Reservas:** Los clientes pueden separar una mesa especificando la cantidad de personas y la fecha.

**¿Por qué elegir esta opción?**
Es un proyecto muy dinámico y visualmente atractivo. En el frontend de Angular se puede jugar mucho con las imágenes de los platos. El flujo de cambiar los estados del pedido ("En preparación", "Listo") demostrará que dominamos la lógica de negocio en Spring Boot.

---

## Opción 3: Sistema de Gestión de Préstamos de Biblioteca (BiblioTech) 📚

**¿De qué trata?**
Una plataforma moderna para una biblioteca universitaria o municipal. Los estudiantes pueden buscar libros disponibles en el catálogo y solicitar un préstamo. El bibliotecario administra las entregas y devoluciones.

**Módulos Principales:**
1. **Módulo de Catálogo de Libros:** CRUD completo de libros (Título, Autor, Categoría, Cantidad disponible).
2. **Módulo de Usuarios:** Registro de estudiantes y bibliotecarios con distintos permisos.
3. **Módulo de Préstamos:** Registro de la fecha en que se presta el libro y la fecha límite de devolución. 
4. **Módulo de Penalizaciones (Opcional):** Si se devuelve tarde, el sistema calcula automáticamente una multa simbólica.

**¿Por qué elegir esta opción?**
Es un clásico que a los profesores les gusta mucho evaluar porque obliga a manejar el "inventario". Si alguien pide un libro, la cantidad disponible en la base de datos debe bajar. Es perfecto para demostrar que sabemos manejar "Transacciones" en bases de datos (un tema clave que veremos en la Semana 7).
