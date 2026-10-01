# Scripts SQL de Borrado (SmartDent)

Aquí tienes los scripts exactos para borrar registros de la base de datos, ya sea de forma definitiva (física) o cambiando su estado a "cancelado" (lógica).

## 1. Borrar una Cita

### Opción A: Borrado Lógico (Recomendado)
No borra el registro de la base de datos, sino que cambia su estado a `CANCELADA`. Es lo mejor para mantener un registro de que el paciente canceló.
```sql
UPDATE citas 
SET estado = 'CANCELADA' 
WHERE id = [ID_DE_LA_CITA];
```

### Opción B: Borrado Físico (Definitivo)
Elimina la cita por completo de la base de datos. ¡Cuidado! Esta acción no se puede deshacer.
```sql
DELETE FROM citas 
WHERE id = [ID_DE_LA_CITA];
```
*(Nota: Si quieres borrar TODAS las citas de un paciente en específico, puedes usar: `DELETE FROM citas WHERE paciente_id = [ID_DEL_PACIENTE];`)*

---

## 2. Borrar un Historial Médico (Historia Clínica)

Borrar un historial médico es delicado porque suele tener documentos o tratamientos asociados.

### Opción A: Borrado Físico (Definitivo)
Elimina el historial clínico de un paciente específico.
```sql
DELETE FROM historias_clinicas 
WHERE id = [ID_DEL_HISTORIAL];
```



---

## 3. Vaciar TODOS los datos (Formatear tablas)

Si lo que quieres es **borrar absolutamente todos los registros** de citas y de historiales médicos (por ejemplo, para limpiar la base de datos antes de presentarla), usa estos comandos. 

Al desactivar la revisión de llaves foráneas evitas errores, y el comando `TRUNCATE` resetea también los IDs para que vuelvan a empezar desde 1.

```sql
SET FOREIGN_KEY_CHECKS = 0;

-- Borrar todas las citas
TRUNCATE TABLE citas;

-- Borrar todos los historiales
TRUNCATE TABLE historias_clinicas;

SET FOREIGN_KEY_CHECKS = 1;
```
