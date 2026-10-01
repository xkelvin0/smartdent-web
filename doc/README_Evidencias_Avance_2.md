# Evidencias recomendadas para el Avance 2

Este archivo sirve como checklist rapido para preparar capturas y anexos.

## Capturas de base de datos

- Diagrama entidad-relacion o vista de tablas desde MySQL Workbench.
- Tabla `usuarios` mostrando administrador, odontologos y paciente de prueba.
- Tabla `servicios` mostrando tratamientos, precios, costos y sesiones incluidas.
- Tabla `citas` mostrando una reserva registrada.
- Tabla `historias_clinicas` mostrando una atencion guardada.

## Capturas de codigo

- Entidad `Usuario`.
- Entidad `Cita`.
- Repositorio `CitaRepository` con consultas JPQL.
- Servicio `CitaService` con `@Transactional`.
- Configuracion `SecurityConfig` con reglas de acceso por rol.
- Prueba unitaria de `CitaServiceUnitTest`.

## Capturas de Postman

- `POST /api/auth/registro`.
- `POST /api/auth/login`.
- `GET /api/auth/perfil` con Bearer Token.
- `GET /api/servicios`.
- `POST /api/pacientes/citas`.
- `GET /api/pacientes/citas`.
- `GET /api/odontologos/citas`.
- `PUT /api/odontologos/historias-clinicas`.
- Prueba de ruta protegida sin token: debe responder 401.
- Prueba de rol incorrecto: debe responder 403.

## Captura de pruebas unitarias

Ejecutar:

```powershell
cd backend
.\mvnw.cmd test
```

Capturar el resultado final con 19 pruebas aprobadas.

## Archivos creados para sustento

- `doc/Avance_2_SmartDent.md`
- `doc/postman/SmartDent_Avance_2.postman_collection.json`
- `doc/sql/smartdent_modelo_datos.sql`
