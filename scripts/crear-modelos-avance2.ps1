Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$outDir = Join-Path $root "doc\modelos-avance2"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function New-Canvas($path, $title, $subtitle) {
    $bmp = New-Object System.Drawing.Bitmap 1800, 1400
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::FromArgb(247, 250, 252))

    $fontTitle = New-Object System.Drawing.Font "Segoe UI", 34, ([System.Drawing.FontStyle]::Bold)
    $fontSubtitle = New-Object System.Drawing.Font "Segoe UI", 17, ([System.Drawing.FontStyle]::Regular)
    $dark = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(2, 17, 37))
    $muted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(82, 102, 132))
    $accent = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(0, 188, 212))

    $g.FillRectangle($accent, 0, 0, 1800, 12)
    $g.DrawString($title, $fontTitle, $dark, 80, 55)
    $g.DrawString($subtitle, $fontSubtitle, $muted, 83, 112)

    return @{ Bitmap = $bmp; Graphics = $g; Path = $path }
}

function Draw-Box($g, $x, $y, $w, $h, $title, $lines, $fill, $border) {
    $rect = New-Object System.Drawing.Rectangle $x, $y, $w, $h
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $radius = 22
    $path.AddArc($x, $y, $radius, $radius, 180, 90)
    $path.AddArc($x + $w - $radius, $y, $radius, $radius, 270, 90)
    $path.AddArc($x + $w - $radius, $y + $h - $radius, $radius, $radius, 0, 90)
    $path.AddArc($x, $y + $h - $radius, $radius, $radius, 90, 90)
    $path.CloseFigure()

    $brush = New-Object System.Drawing.SolidBrush $fill
    $pen = New-Object System.Drawing.Pen $border, 3
    $g.FillPath($brush, $path)
    $g.DrawPath($pen, $path)

    $fontTitle = New-Object System.Drawing.Font "Segoe UI", 18, ([System.Drawing.FontStyle]::Bold)
    $fontText = New-Object System.Drawing.Font "Segoe UI", 13, ([System.Drawing.FontStyle]::Regular)
    $dark = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(2, 17, 37))
    $muted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(70, 88, 115))

    $g.DrawString($title, $fontTitle, $dark, $x + 22, $y + 18)
    $lineY = $y + 58
    foreach ($line in $lines) {
        $g.DrawString($line, $fontText, $muted, $x + 24, $lineY)
        $lineY += 26
    }
}

function Draw-Line($g, $x1, $y1, $x2, $y2, $label) {
    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(156, 163, 175)), 3
    $pen.CustomEndCap = New-Object System.Drawing.Drawing2D.AdjustableArrowCap 6, 6
    $g.DrawLine($pen, $x1, $y1, $x2, $y2)
    if ($label) {
        $font = New-Object System.Drawing.Font "Segoe UI", 12, ([System.Drawing.FontStyle]::Bold)
        $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(151, 110, 0))
        $g.DrawString($label, $font, $brush, (($x1 + $x2) / 2) - 55, (($y1 + $y2) / 2) - 25)
    }
}

function Save-Canvas($canvas) {
    $canvas.Graphics.Dispose()
    $canvas.Bitmap.Save($canvas.Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $canvas.Bitmap.Dispose()
}

$blue = [System.Drawing.Color]::FromArgb(235, 248, 255)
$gold = [System.Drawing.Color]::FromArgb(255, 248, 219)
$green = [System.Drawing.Color]::FromArgb(235, 255, 244)
$rose = [System.Drawing.Color]::FromArgb(255, 241, 242)
$borderBlue = [System.Drawing.Color]::FromArgb(0, 188, 212)
$borderGold = [System.Drawing.Color]::FromArgb(166, 124, 0)
$borderGreen = [System.Drawing.Color]::FromArgb(22, 163, 74)
$borderRose = [System.Drawing.Color]::FromArgb(225, 29, 72)

# Modelo conceptual
$canvas = New-Canvas (Join-Path $outDir "01-modelo-conceptual-smartdent.png") "Modelo Conceptual - SmartDent" "Entidades principales y relaciones del sistema odontologico"
$g = $canvas.Graphics
Draw-Box $g 90 210 420 145 "Usuario" @("Persona registrada en el sistema", "Tiene credenciales y un rol") $blue $borderBlue
Draw-Box $g 690 210 360 145 "Rol" @("Administrador", "Odontologo", "Paciente") $gold $borderGold
Draw-Box $g 1260 210 420 145 "Servicio" @("Tratamiento ofrecido", "Precio, duracion y sesiones") $gold $borderGold
Draw-Box $g 90 465 420 155 "Paciente" @("Reserva citas", "Consulta historial", "Actualiza sus datos") $green $borderGreen
Draw-Box $g 690 465 420 155 "Odontologo" @("Atiende pacientes", "Registra historias clinicas", "Bloquea horarios") $green $borderGreen
Draw-Box $g 1260 465 420 155 "Administrador" @("Gestiona usuarios", "Gestiona servicios", "Revisa reportes") $blue $borderBlue
Draw-Box $g 90 735 420 160 "Cita" @("Reserva con fecha y hora", "Une paciente, odontologo y servicio", "Tiene estado de atencion") $rose $borderRose
Draw-Box $g 690 735 420 160 "Historia clinica" @("Diagnostico", "Tratamiento realizado", "Indicaciones y control") $rose $borderRose
Draw-Box $g 1260 735 420 160 "Bloqueo horario" @("Rango no disponible", "Evita reservas duplicadas") $blue $borderBlue
Draw-Box $g 90 980 1590 120 "Relaciones conceptuales" @("Usuario tiene un rol. Paciente reserva citas. Odontologo atiende citas. Cita corresponde a un servicio.", "Odontologo registra historia clinica y puede bloquear horarios. Administrador gestiona catalogos y reportes.") $gold $borderGold
Draw-Line $g 510 282 690 282 "tiene"
Draw-Line $g 300 355 300 465 "puede ser"
Draw-Line $g 870 355 870 465 "puede ser"
Draw-Line $g 1050 282 1260 282 "consulta"
Draw-Line $g 300 620 300 735 "reserva"
Draw-Line $g 870 620 870 735 "registra"
Draw-Line $g 1080 545 1260 810 "bloquea"
Save-Canvas $canvas

# Modelo logico
$canvas = New-Canvas (Join-Path $outDir "02-modelo-logico-smartdent.png") "Modelo Logico - SmartDent" "Tablas, claves primarias, claves foraneas y cardinalidades"
$g = $canvas.Graphics
Draw-Box $g 70 185 360 175 "ROLES" @("PK id_rol", "nombre") $gold $borderGold
Draw-Box $g 505 185 410 210 "USUARIOS" @("PK id_usuario", "FK id_rol", "nombre_completo", "dni", "email", "password_hash") $blue $borderBlue
Draw-Box $g 990 185 410 210 "ODONTOLOGOS" @("PK id_odontologo", "FK id_usuario", "codigo", "colegiatura", "especialidad") $green $borderGreen
Draw-Box $g 70 470 410 215 "SERVICIOS" @("PK id_servicio", "codigo", "nombre", "especialidad", "precio", "duracion") $gold $borderGold
Draw-Box $g 555 470 470 255 "CITAS" @("PK id_cita", "FK id_paciente", "FK id_odontologo", "FK id_servicio", "fecha", "hora_inicio", "estado") $rose $borderRose
Draw-Box $g 1100 470 470 255 "HISTORIAS_CLINICAS" @("PK id_historia", "FK id_paciente", "FK id_odontologo", "FK id_cita", "diagnostico", "tratamiento") $blue $borderBlue
Draw-Box $g 70 795 470 190 "BLOQUEOS_HORARIO" @("PK id_bloqueo", "FK id_odontologo", "fecha", "hora_inicio", "hora_fin") $green $borderGreen
Draw-Box $g 615 795 470 190 "ODONTOLOGOS_SERVICIOS" @("PK/FK id_odontologo", "PK/FK id_servicio", "Resuelve relacion N:M") $gold $borderGold
Draw-Box $g 1160 795 470 225 "MENSAJES_CONTACTO" @("PK id_mensaje", "nombre", "email", "asunto", "mensaje", "estado") $rose $borderRose
Draw-Box $g 70 1090 1560 125 "Cardinalidades principales" @("ROLES 1:N USUARIOS | USUARIOS 1:1 ODONTOLOGOS | PACIENTES 1:N CITAS | ODONTOLOGOS 1:N CITAS", "SERVICIOS 1:N CITAS | CITAS 1:1 HISTORIAS_CLINICAS | ODONTOLOGOS N:M SERVICIOS | ODONTOLOGOS 1:N BLOQUEOS") $blue $borderBlue
Save-Canvas $canvas

# Modelo fisico
$canvas = New-Canvas (Join-Path $outDir "03-modelo-fisico-smartdent.png") "Modelo Fisico - SmartDent" "Implementacion en MySQL/MariaDB con tipos de datos y restricciones"
$g = $canvas.Graphics
Draw-Box $g 65 175 525 300 "usuarios" @("id BIGINT PK AUTO_INCREMENT", "nombre_completo VARCHAR(120) NOT NULL", "dni VARCHAR(15) UNIQUE NOT NULL", "email VARCHAR(150) UNIQUE NOT NULL", "password_hash VARCHAR(100) NOT NULL", "rol_id BIGINT FK NOT NULL", "activo BOOLEAN DEFAULT TRUE") $blue $borderBlue
Draw-Box $g 635 175 525 270 "servicios" @("id BIGINT PK AUTO_INCREMENT", "codigo VARCHAR(40) UNIQUE NOT NULL", "nombre VARCHAR(120) NOT NULL", "precio DECIMAL(10,2) NOT NULL", "costo DECIMAL(10,2) NOT NULL", "duracion_minutos INT NOT NULL", "sesiones_incluidas INT") $gold $borderGold
Draw-Box $g 1205 175 525 270 "odontologos" @("id BIGINT PK AUTO_INCREMENT", "usuario_id BIGINT FK UNIQUE", "codigo VARCHAR(40) UNIQUE", "colegiatura VARCHAR(40) UNIQUE", "especialidad VARCHAR(100)", "foto_url VARCHAR(500)") $green $borderGreen
Draw-Box $g 65 535 560 330 "citas" @("id BIGINT PK AUTO_INCREMENT", "codigo VARCHAR(50) UNIQUE NOT NULL", "paciente_id BIGINT FK NOT NULL", "odontologo_id BIGINT FK NOT NULL", "servicio_id BIGINT FK NOT NULL", "fecha DATE NOT NULL", "hora_inicio TIME NOT NULL", "estado VARCHAR(20) NOT NULL", "precio_pactado DECIMAL(10,2)") $rose $borderRose
Draw-Box $g 680 535 540 300 "historias_clinicas" @("id BIGINT PK AUTO_INCREMENT", "paciente_id BIGINT FK NOT NULL", "odontologo_id BIGINT FK", "cita_id BIGINT FK", "diagnostico VARCHAR(2500) NOT NULL", "tratamiento VARCHAR(2500) NOT NULL", "proximo_control DATE") $blue $borderBlue
Draw-Box $g 1275 535 455 255 "bloqueos_horario" @("id BIGINT PK AUTO_INCREMENT", "odontologo_id BIGINT FK", "fecha DATE NOT NULL", "hora_inicio TIME NOT NULL", "hora_fin TIME NOT NULL", "motivo VARCHAR(300)") $green $borderGreen
Draw-Box $g 65 930 795 230 "Restricciones fisicas" @("PRIMARY KEY para identificadores", "FOREIGN KEY para integridad referencial", "UNIQUE para DNI, email, codigo y colegiatura", "NOT NULL para campos obligatorios", "AUTO_INCREMENT en claves principales") $gold $borderGold
Draw-Box $g 935 930 795 230 "Relaciones fisicas relevantes" @("usuarios.rol_id -> roles.id", "odontologos.usuario_id -> usuarios.id", "citas.paciente_id -> usuarios.id", "citas.odontologo_id -> odontologos.id", "citas.servicio_id -> servicios.id") $blue $borderBlue
Save-Canvas $canvas

Write-Host "Imagenes creadas en $outDir"
