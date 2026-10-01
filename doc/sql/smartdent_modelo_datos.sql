-- Modelo referencial de SmartDent para el Avance 2.
-- El backend genera/actualiza las tablas mediante JPA/Hibernate.
-- Este script sirve como anexo documental para explicar el modelo de datos.

CREATE DATABASE IF NOT EXISTS smartdent_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smartdent_db;

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS usuarios (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nombre_completo VARCHAR(120) NOT NULL,
  dni VARCHAR(15) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  recordatorios_email BOOLEAN NOT NULL DEFAULT TRUE,
  recordatorios_telefono BOOLEAN NOT NULL DEFAULT FALSE,
  rol_id BIGINT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME NOT NULL,
  actualizado_en DATETIME NOT NULL,
  CONSTRAINT fk_usuarios_roles FOREIGN KEY (rol_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS servicios (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  codigo VARCHAR(40) NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  especialidad VARCHAR(100) NOT NULL,
  descripcion VARCHAR(600) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  costo DECIMAL(10,2) NOT NULL,
  duracion_minutos INT NOT NULL,
  sesiones_incluidas INT DEFAULT 1,
  imagen_url VARCHAR(500),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME NOT NULL,
  actualizado_en DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS odontologos (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  codigo VARCHAR(40) NOT NULL UNIQUE,
  usuario_id BIGINT NOT NULL UNIQUE,
  colegiatura VARCHAR(40) NOT NULL UNIQUE,
  especialidad VARCHAR(100) NOT NULL,
  descripcion VARCHAR(600),
  foto_url VARCHAR(500),
  creado_en DATETIME NOT NULL,
  actualizado_en DATETIME NOT NULL,
  CONSTRAINT fk_odontologos_usuarios FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS odontologos_servicios (
  odontologo_id BIGINT NOT NULL,
  servicio_id BIGINT NOT NULL,
  PRIMARY KEY (odontologo_id, servicio_id),
  CONSTRAINT fk_os_odontologos FOREIGN KEY (odontologo_id) REFERENCES odontologos(id),
  CONSTRAINT fk_os_servicios FOREIGN KEY (servicio_id) REFERENCES servicios(id)
);

CREATE TABLE IF NOT EXISTS citas (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  paciente_id BIGINT NOT NULL,
  odontologo_id BIGINT NOT NULL,
  servicio_id BIGINT NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  estado VARCHAR(20) NOT NULL,
  motivo VARCHAR(600),
  telefono_contacto VARCHAR(20) NOT NULL,
  precio_pactado DECIMAL(10,2) NOT NULL,
  tratamiento_codigo VARCHAR(50),
  numero_sesion INT,
  total_sesiones INT,
  creado_en DATETIME NOT NULL,
  actualizado_en DATETIME NOT NULL,
  CONSTRAINT fk_citas_pacientes FOREIGN KEY (paciente_id) REFERENCES usuarios(id),
  CONSTRAINT fk_citas_odontologos FOREIGN KEY (odontologo_id) REFERENCES odontologos(id),
  CONSTRAINT fk_citas_servicios FOREIGN KEY (servicio_id) REFERENCES servicios(id)
);

CREATE TABLE IF NOT EXISTS historias_clinicas (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  paciente_id BIGINT NOT NULL,
  odontologo_id BIGINT,
  cita_id BIGINT,
  etapa_tratamiento VARCHAR(40) NOT NULL,
  alergias VARCHAR(1500),
  diagnostico VARCHAR(2500) NOT NULL,
  tratamiento VARCHAR(2500) NOT NULL,
  indicaciones VARCHAR(2500),
  proximo_control DATE,
  observaciones VARCHAR(1500),
  creado_en DATETIME NOT NULL,
  actualizado_en DATETIME NOT NULL,
  CONSTRAINT fk_hc_pacientes FOREIGN KEY (paciente_id) REFERENCES usuarios(id),
  CONSTRAINT fk_hc_odontologos FOREIGN KEY (odontologo_id) REFERENCES odontologos(id),
  CONSTRAINT fk_hc_citas FOREIGN KEY (cita_id) REFERENCES citas(id)
);

CREATE TABLE IF NOT EXISTS bloqueos_horario (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  odontologo_id BIGINT NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  motivo VARCHAR(300),
  creado_en DATETIME NOT NULL,
  CONSTRAINT fk_bloqueos_odontologos FOREIGN KEY (odontologo_id) REFERENCES odontologos(id)
);

CREATE TABLE IF NOT EXISTS mensajes_contacto (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL,
  telefono VARCHAR(20),
  asunto VARCHAR(150) NOT NULL,
  mensaje VARCHAR(1200) NOT NULL,
  estado VARCHAR(30) NOT NULL,
  creado_en DATETIME NOT NULL,
  actualizado_en DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS costos_fijos_config (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  actualizado_en DATETIME NOT NULL
);
