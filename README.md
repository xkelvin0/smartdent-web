# SmartDent — Sistema Web Integrado de Gestión Odontológica

Plataforma web Full-Stack para la gestión integral de pacientes, catálogo de servicios odontológicos, agenda de profesionales, citas sin cruces de horarios, historias clínicas multisesión y administración financiera. Proyecto del curso **Desarrollo Web Integrado** (Universidad Tecnológica del Perú · 2026).

## Enlaces en Producción (Nube)

- **Aplicación Web Frontend (GitHub Pages):** https://xkelvin0.github.io/smartdent-web/
- **API REST Backend Health (Render Cloud):** https://smartdent-web.onrender.com/api/health
- **Documentación Interactiva Swagger UI:** https://smartdent-web.onrender.com/swagger-ui.html

---

## Guía Paso a Paso para Ejecutar el Proyecto en Tu Computadora (Equipo)

Sigue estos pasos en orden para levantar el proyecto completo en tu máquina local (**Windows**, **macOS** o **Linux**).

### 1. Requisitos Previos (Instalar antes de empezar)

Verifica que tengas instaladas las siguientes herramientas:

| Herramienta | Versión Mínima | Comando de Verificación | Descarga / Notas |
| :--- | :--- | :--- | :--- |
| **Git** | Cualquier reciente | `git --version` | https://git-scm.com/downloads |
| **Java JDK** | **JDK 21** (Obligatorio) | `java -version` | Eclipse Temurin 21 (Adoptium) |
| **Node.js** | **v20 LTS** o superior | `node -v` | https://nodejs.org/ |
| **pnpm** *(opcional)* | v9 o v10 | `pnpm -v` | Si no lo tienes: `npm install -g pnpm` (o puedes usar `npm`) |
| **XAMPP (MariaDB/MySQL)** | MariaDB 10.4+ / MySQL 8+ | Puerto `3306` activo | https://www.apachefriends.org/ |

> **Importante sobre Java:** Si `java -version` muestra una versión menor a la 21 (por ejemplo Java 8, 11 o 17), instala **JDK 21** y asegúrate de que la variable de entorno `JAVA_HOME` apunte a JDK 21 antes de ejecutar el backend.

---

### 2. Clonar el Repositorio

Abre una terminal (PowerShell, CMD o Git Bash) y ejecuta:

```bash
git clone https://github.com/xkelvin0/smartdent-web.git
cd smartdent-web
```

---

### 3. Iniciar la Base de Datos (XAMPP / MariaDB)

1. Abre **XAMPP Control Panel**.
2. Haz clic en **Start** en el módulo **MySQL** (debe quedar en verde corriendo en el puerto `3306`).
3. **No necesitas crear la base de datos ni las tablas manualmente:**
   - El backend usa `jdbc:mariadb://localhost:3306/smartdent_db?createDatabaseIfNotExist=true` y `spring.jpa.hibernate.ddl-auto=update`.
   - Al arrancar Spring Boot por primera vez, creará automáticamente la base de datos `smartdent_db`, todas las tablas y cargará los datos iniciales (`DatosInicialesService`): los 3 roles, 16 servicios odontológicos, 1 administrador y 4 odontólogos.

#### ¿Tu MySQL/MariaDB tiene contraseña o usa otro puerto?

Por defecto conecta con usuario `root` y contraseña vacía (`""`) en el puerto `3306`. Si en tu computadora configuraste contraseña en MySQL, **no edites `application.properties`**; en su lugar crea el archivo ignorado por Git `backend/src/main/resources/application-local.properties` con tus datos locales:

```properties
spring.datasource.url=jdbc:mariadb://localhost:3306/smartdent_db?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=TU_CONTRASEÑA_AQUI
```

*(Opcional)* Si deseas probar el envío real de correos para recuperación de contraseña, agrega también en ese mismo archivo `application-local.properties`:

```properties
spring.mail.username=tu_correo@gmail.com
spring.mail.password=tu_app_password_de_gmail
```

---

### 4. Levantar el Backend (Spring Boot)

Abre una terminal en la carpeta raíz `smartdent-web` y ejecuta:

**En Windows (PowerShell o CMD):**
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

**En macOS / Linux / Git Bash:**
```bash
cd backend
./mvnw spring-boot:run
```

> La primera ejecución descargará las dependencias de Maven (puede tardar 1-2 minutos dependiendo del internet).

**¿Cómo verificar que el backend levantó correctamente?**
Cuando veas en la consola el mensaje `Started SmartdentBackendApplication`, abre en tu navegador:
- Health Check: http://localhost:8080/api/health
- Documentación Swagger UI: http://localhost:8080/swagger-ui.html

**Deja esta terminal abierta** mientras uses la aplicación.

---

### 5. Instalar Dependencias y Levantar el Frontend (Angular 19)

Abre una **segunda terminal** en la carpeta raíz `smartdent-web` (sin cerrar la del backend) y ejecuta:

**Opción A — Usando `pnpm` (recomendado):**
```bash
cd frontend
pnpm install
pnpm start
```

**Opción B — Usando `npm` (si no tienes `pnpm`):**
```bash
cd frontend
npm install
npm start
```

**¿Cómo verificar que el frontend levantó correctamente?**
Cuando la terminal muestre `Local: http://localhost:4200/`, abre en tu navegador:

```text
http://localhost:4200
```

> El servidor de Angular redirige automáticamente todas las peticiones `/api/...` hacia `http://127.0.0.1:8080` mediante `frontend/proxy.conf.json`, por lo que **no tendrás errores de CORS en local**.

---

### 6. Credenciales Precargadas para Probar el Sistema

Al iniciar el backend, `DatosInicialesService` crea automáticamente estas cuentas de prueba:

| Rol | Correo Electrónico | Contraseña | Acceso |
| :--- | :--- | :--- | :--- |
| **Administrador** | `kelvinace29@gmail.com` | `Admin123` | Agenda global, usuarios, odontólogos, servicios, reportes y mensajes |
| **Odontólogo 1** | `carlos.mendoza@smartdent.com` | `Carlos123` | Implantología y Cirugía Oral (`COP-10001`) |
| **Odontólogo 2** | `elena.ruiz@smartdent.com` | `Elena123` | Estética y Ortodoncia (`COP-10002`) |
| **Odontólogo 3** | `miguel.silva@smartdent.com` | `Miguel123` | Endodoncia Microscópica (`COP-10003`) |
| **Odontólogo 4** | `lucia.torres@smartdent.com` | `Lucia123` | Periodoncia y Odontopediatría (`COP-10004`) |
| **Paciente** | *(Regístrate en `/registro`)* | *(Tu contraseña)* | Entra a http://localhost:4200/registro y crea tu propia cuenta |

---

### 7. Ejecutar Pruebas Automatizadas y Compilación

**Pruebas Unitarias Backend (JUnit 5 + Mockito — 19 pruebas):**
```powershell
cd backend
.\mvnw.cmd test
```

**Pruebas Unitarias, Typecheck y Build Frontend (Vitest + Angular CLI):**
```powershell
cd frontend
pnpm test
pnpm run typecheck
pnpm run build
```
*(Si usas `npm`, reemplaza `pnpm` por `npm run` en `test`, `typecheck` y `build`).*

---

### 8. Solución de Problemas Comunes (Troubleshooting)

1. **`Communications link failure` o `Connection refused` al iniciar el backend:**
   - **Causa:** MySQL en XAMPP está apagado o bloqueado.
   - **Solución:** Abre XAMPP Control Panel y presiona **Start** en **MySQL** (puerto `3306`).
2. **`UnsupportedClassVersionError` o error de compilación Maven:**
   - **Causa:** Tienes una versión de Java inferior a JDK 21.
   - **Solución:** Ejecuta `java -version`. Si no dice `21`, instala JDK 21 y actualiza `JAVA_HOME` y el `PATH`.
3. **`Web server failed to start. Port 8080 was already in use`:**
   - **Causa:** Ya tienes otra instancia del backend abierta.
   - **Solución:** Cierra la otra terminal o ejecuta `taskkill /F /IM java.exe` (solo si no tienes otros procesos Java críticos) y vuelve a correr `.\mvnw.cmd spring-boot:run`.
4. **`pnpm: command not found`:**
   - **Solución:** Ejecuta `npm install -g pnpm` o usa directamente `npm install` y `npm start` dentro de `frontend/`.
5. **El frontend abre en `:4200` pero al hacer login dice error de conexión:**
   - **Causa:** El backend (`:8080`) no está corriendo o aún está terminando de iniciar.
   - **Solución:** Verifica que http://localhost:8080/api/health responda `UP`. No abras archivos HTML directamente con `file://`.

---

## Arquitectura y Tecnologías

- **Frontend (`frontend/`):** Angular 19.2 (Standalone Components, `OnPush`, Signals, Reactive Forms, Functional Router Guards, `HttpClient` + `withFetch()`, `jwtInterceptor`), TypeScript 5.7 (`strict: true`), Tailwind CSS 3.4 y Vitest 3.
- **Backend (`backend/`):** Java 21, Spring Boot 4.1.1, Spring Data JPA / Hibernate, Spring Security 6 + JWT (HMAC-SHA256) + BCrypt, Springdoc OpenAPI / Swagger UI, JUnit 5 + Mockito y Docker Multi-Stage.
- **Base de Datos:** MariaDB (local) / TiDB Cloud MySQL (producción).
- **Respaldo Local (Windows):** Scripts `RESPALDAR_BD.cmd`, `INSTALAR_RESPALDO_AUTOMATICO.cmd` y `CERRAR_SMARTDENT.cmd` en la raíz del repositorio para respaldar `smartdent_db`.

## Estructura del Repositorio

```text
smartdent-web/
├── backend/                       # API REST con Spring Boot, JPA/Hibernate, Security + JWT y Dockerfile
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/
│       ├── main/java/pe/edu/utp/smartdent/
│       │   ├── config/            # Seguridad, CORS, OpenAPI y carga inicial (DatosInicialesService)
│       │   ├── controller/        # Controladores REST por rol (public, paciente, odontologo, admin)
│       │   ├── dto/               # Records DTO tipados de petición y respuesta
│       │   ├── entity/            # Entidades JPA y enums del dominio odontológico
│       │   ├── exception/         # GlobalExceptionHandler y excepciones de negocio
│       │   ├── repository/        # Repositorios Spring Data JPA y consultas JPQL
│       │   ├── security/          # JwtService y filtro stateless
│       │   └── service/           # Lógica transaccional ACID y reglas clínicas
│       └── test/                  # 19 pruebas unitarias con JUnit 5 y Mockito
├── frontend/                      # SPA Angular 19 (Standalone + Signals + Tailwind CSS)
│   ├── proxy.conf.json            # Proxy /api -> http://127.0.0.1:8080
│   ├── tailwind.config.js         # Tokens visuales institucionales SmartDent
│   └── src/app/
│       ├── core/                  # AuthStore, ToastStore, NotificationStore, jwtInterceptor, guards y API service
│       ├── shared/                # Layouts (PublicShell, DashboardShell), componentes UI y SmartDentValidators
│       └── features/              # Dominios: public, auth, paciente, odontologo y admin
├── maquetacion-html/              # Maquetación HTML/CSS/JS inicial conservada como referencia
├── scripts/                       # Utilidades de respaldo local de MariaDB
├── RESPALDAR_BD.cmd               # Respaldo manual de smartdent_db en Windows
├── CERRAR_SMARTDENT.cmd           # Respaldo y cierre seguro de MariaDB
├── INSTALAR_RESPALDO_AUTOMATICO.cmd
├── .gitignore
└── README.md
```
