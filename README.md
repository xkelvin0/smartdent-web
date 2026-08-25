# SmartDent - Sistema de Gestión de Citas y Pacientes 🦷

Este es el repositorio oficial del proyecto final del curso **Desarrollo Web Integrado**. 
El proyecto está estructurado de manera modular para facilitar el trabajo del equipo y la revisión por entregas.

---

## 📂 Estructura del Repositorio

Para evitar desorden y conflictos al combinar el backend, el frontend y la maquetación inicial, utilizaremos la siguiente estructura de carpetas:

```text
smartdent-web/
│
├── maquetacion-html/        # 💻 Avance 1: Prototipo estático (HTML, CSS y JS)
│   ├── css/                 # Hojas de estilo unificadas
│   ├── js/                  # Validaciones y simulaciones interactivas
│   ├── index.html           # Landing Page principal
│   ├── login.html           # Pantalla de acceso
│   ├── registro.html        # Pantalla de registro de pacientes
│   ├── paciente.html        # Panel del paciente
│   └── admin.html           # Panel de administración/doctores
│
├── backend-springboot/      # ⚙️ Avance 2: API REST en Java (Spring Boot)
│   ├── src/                 # Código fuente (Controllers, Services, Repositories)
│   └── pom.xml              # Dependencias de Maven
│
├── frontend-angular/        # 🅰️ Avance 3: Aplicación SPA (Angular)
│   ├── src/                 # Componentes y servicios de Angular
│   └── package.json         # Dependencias de Node
│
├── .gitignore               # Archivo para excluir archivos innecesarios de Git
└── README.md                # Presentación e instrucciones del repositorio (este archivo)
```

---

## 👥 Integrantes del Equipo
* **Acevedo Huarachi Kelvin Jesus** - U23309803
* **Añorga Pinedo Paolo Alexander** - U23305864
* **Calle Paredes Maykol Adan** - U23242558
* **Salinas Perez Joseph Sebastian** - u23325202

---

## 📋 Organización del Avance 1 (Maquetación)

Para este primer avance, nos hemos dividido el desarrollo del prototipo HTML/CSS/JS de la siguiente manera:

1. **Integrante 1: Diseñador UI/UX y Estilos Globales** 🎨
   * **Misión:** Garantizar un diseño uniforme y profesional para todo el sitio.
   * **Tareas:**
     * Crear la Landing Page principal (`index.html`).
     * Diseñar el archivo de estilos global (`estilos.css`) con los colores, fuentes y botones unificados para todo el equipo.

2. **Integrante 2: Módulo de Acceso (Login y Registro)** 🔑
   * **Misión:** Desarrollar las pantallas de inicio de sesión y registro de pacientes.
   * **Tareas:**
     * Crear `login.html` y `registro.html`.
     * Escribir el script de validación `auth.js` (validación de contraseñas, correos y simulación de redirección).

3. **Integrante 3: Módulo del Paciente (Agendar Cita)** 📅
   * **Misión:** Crear la zona de cliente donde el paciente gestiona sus citas.
   * **Tareas:**
     * Crear `paciente.html` (historial de citas) y `reservar.html` (formulario para agendar citas).
     * Crear el script en JS para simular la agregación de citas en pantalla.

4. **Integrante 4: Módulo de Administración (Gestión Clínica)** 💼
   * **Misión:** Desarrollar la vista del personal de la clínica.
   * **Tareas:**
     * Crear `admin.html` (tabla interactiva con las citas programadas).
     * Escribir JS para simular la confirmación/cancelación de citas en tiempo real.

---

## 🚀 Instrucciones de Trabajo en Git

Para evitar problemas al subir cambios, sigan estas reglas básicas:
1. **Nunca trabajen directo en `main`:** Cada integrante debe crear su propia rama para trabajar (ejemplo: `git checkout -b feature-login`).
2. **Hagan `git pull origin main` siempre:** Antes de empezar a programar en el día, actualicen su código local con lo que sus compañeros hayan subido.
3. **Suban cambios limpios:** Asegúrense de no modificar carpetas de otros integrantes sin avisar.
