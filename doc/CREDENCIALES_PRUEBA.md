# Credenciales de prueba de SmartDent

Estas cuentas permiten probar el inicio de sesión y la identificación de roles tanto en la maqueta como en el backend de Spring Boot. El backend las registra automáticamente en MariaDB con contraseñas cifradas mediante BCrypt.

## Odontólogos

Cada profesional cuenta con credenciales propias. Al iniciar sesión, su panel muestra únicamente las citas asignadas a su nombre.

### Dr. Carlos Mendoza

```text
Correo: carlos.mendoza@smartdent.com
Contraseña: Carlos123
Rol: ODONTOLOGO
```

### Dra. Elena Ruiz

```text
Correo: elena.ruiz@smartdent.com
Contraseña: Elena123
Rol: ODONTOLOGO
```

### Dr. Miguel Silva

```text
Correo: miguel.silva@smartdent.com
Contraseña: Miguel123
Rol: ODONTOLOGO
```

### Dra. Lucía Torres

```text
Correo: lucia.torres@smartdent.com
Contraseña: Lucia123
Rol: ODONTOLOGO
```

## Administrador

```text
Correo: admin@smartdent.com
Contraseña: Admin123
Rol: ADMIN
```

Al iniciar sesión, la página principal muestra el saludo **“Bienvenido, Administrador SmartDent”** y el rol **Administrador**.

## Consideraciones

- Los correos y las contraseñas deben escribirse exactamente como aparecen en este documento.
- Las contraseñas distinguen entre mayúsculas y minúsculas.
- No existe una cuenta de paciente precargada. Cada paciente debe crear su cuenta desde `registro.html` y luego iniciar sesión con sus propios datos.
- El navegador conserva en `localStorage` únicamente la sesión real y el token JWT emitido por la API.
- Estas credenciales se utilizan únicamente en el prototipo del Avance 1.
- En MariaDB las contraseñas se almacenan exclusivamente como hashes BCrypt.
