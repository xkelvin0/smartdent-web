param(
    [string]$Origen = (Join-Path $PSScriptRoot "..\SmartDent_Presentacion_Avance_2.pptx"),
    [string]$Destino = (Join-Path $PSScriptRoot "..\SmartDent_Presentacion_Avance_3.pptx")
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$origenPath = (Resolve-Path -LiteralPath $Origen).Path
$destinoPath = [IO.Path]::GetFullPath($Destino)

# Copiar de forma segura
$inStream = [IO.File]::Open($origenPath, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::ReadWrite)
$outStream = [IO.File]::Open($destinoPath, [IO.FileMode]::Create, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
try {
    $inStream.CopyTo($outStream)
} finally {
    $inStream.Dispose()
    $outStream.Dispose()
}

function Read-ZipText {
    param([IO.Compression.ZipArchive]$Zip, [string]$EntryName)
    $entry = $Zip.GetEntry($EntryName)
    if (-not $entry) { throw "No existe $EntryName" }
    $reader = [IO.StreamReader]::new($entry.Open(), [Text.Encoding]::UTF8)
    try { return $reader.ReadToEnd() }
    finally { $reader.Dispose() }
}

function Write-ZipText {
    param([IO.Compression.ZipArchive]$Zip, [string]$EntryName, [string]$Content)
    $old = $Zip.GetEntry($EntryName)
    if ($old) { $old.Delete() }
    $entry = $Zip.CreateEntry($EntryName, [IO.Compression.CompressionLevel]::Optimal)
    $writer = [IO.StreamWriter]::new($entry.Open(), [Text.UTF8Encoding]::new($false))
    try { $writer.Write($Content) }
    finally { $writer.Dispose() }
}

function Replace-SlideTexts {
    param([string]$XmlText, [hashtable]$Map)
    foreach ($key in $Map.Keys) {
        $escapedKey = [Security.SecurityElement]::Escape($key)
        $escapedVal = [Security.SecurityElement]::Escape($Map[$key])
        $XmlText = $XmlText.Replace(">$escapedKey<", ">$escapedVal<")
        $XmlText = $XmlText.Replace(">$key<", ">$escapedVal<")
    }
    return $XmlText
}

$zipStream = [IO.File]::Open($destinoPath, [IO.FileMode]::Open, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
$zip = [IO.Compression.ZipArchive]::new($zipStream, [IO.Compression.ZipArchiveMode]::Update, $true)
try {
    # 1. Actualizar Portada (slide1.xml)
    $s1 = Read-ZipText $zip "ppt/slides/slide1.xml"
    $s1 = $s1.Replace("Avance 1 · Desarrollo Web Integrado", "Avance 3 · Desarrollo Web Integrado")
    $s1 = $s1.Replace("Avance 2 · Desarrollo Web Integrado", "Avance 3 · Desarrollo Web Integrado")
    Write-ZipText $zip "ppt/slides/slide1.xml" $s1

    # 2. Actualizar Stack Tecnologico (slide2.xml)
    $s2 = Read-ZipText $zip "ppt/slides/slide2.xml"
    $s2 = $s2.Replace(">HTML5<", ">Angular 19<")
    $s2 = $s2.Replace(">Estructura web<", ">SPA Standalone<")
    $s2 = $s2.Replace(">JavaScript<", ">TypeScript 5.7<")
    $s2 = $s2.Replace(">Interacción y API<", ">Signals y Tipado<")
    Write-ZipText $zip "ppt/slides/slide2.xml" $s2

    # 3. Actualizar Arquitectura (slide5.xml)
    $s5 = Read-ZipText $zip "ppt/slides/slide5.xml"
    $s5 = $s5.Replace("HTML · Tailwind CSS · JavaScript", "Angular 19 · Signals · Tailwind CSS")
    Write-ZipText $zip "ppt/slides/slide5.xml" $s5

    # Plantillas base de tu propio PPTX (clonacion exacta de estilo, fuentes Aptos, colores Navy/Cyan/Gold)
    $tplSection = Read-ZipText $zip "ppt/slides/slide9.xml"
    $tplCode    = Read-ZipText $zip "ppt/slides/slide13.xml"
    $tplCards   = Read-ZipText $zip "ppt/slides/slide15.xml"
    $tplTests   = Read-ZipText $zip "ppt/slides/slide16.xml"
    $tplFinal   = Read-ZipText $zip "ppt/slides/slide17.xml"

    $relTpl     = Read-ZipText $zip "ppt/slides/_rels/slide13.xml.rels"

    # ==================== SLIDE 17: AVANCE 3 RESUMEN & COMPONENTES ====================
    $new17 = Replace-SlideTexts $tplSection @{
        "AVANCE 2" = "AVANCE 3"
        "Persistencia, seguridad y diseño del sistema" = "Desarrollo del Frontend Angular 19"
        "Modelo de datos, JPA/Hibernate, CRUD, JPQL, transacciones, Spring Security, roles, JWT y evidencias de prueba." = "Arquitectura SPA con Standalone Components, Signals, Routing con Guards funcionales, Reactive Forms y Validaciones."
        "Modelo de datos" = "4.4.1 Componentes"
        "• Conceptual, lógico y físico" = "• Standalone + OnPush"
        "• Relaciones del dominio odontológico" = "• Reactividad con Signals"
        "• Base para persistencia real" = "• Control nativo @if / @for"
        "Backend persistente" = "4.4.2 Routing"
        "• Entidades JPA y repositorios" = "• Carga diferida (Lazy Loading)"
        "• CRUD de servicios y citas" = "• authGuard, guestGuard, roleGuard"
        "• Reglas de negocio transaccionales" = "• Sincronía con Spring Security"
        "Seguridad web" = "4.4.3 / 4.4.4 Forms"
        "• JWT para autenticación" = "• NonNullableFormBuilder"
        "• Permisos por rol" = "• SmartDentValidators (DNI/Tel)"
        "• Rutas protegidas por contexto" = "• 7 tests aprobados en Vitest"
        "Diseño" = "Componentes"
        "Casos de uso y modelo relacional" = "5 dominios y layouts reactivos"
        "Construcción" = "Enrutamiento"
        "API REST con Spring Boot" = "27 lazy chunks y guards JWT"
        "Validación" = "Calidad"
        "Pruebas unitarias y Postman" = "Doble capa cliente-servidor"
        "15" = "17"
    }
    Write-ZipText $zip "ppt/slides/slide17.xml" $new17

    # ==================== SLIDE 18: 4.4.1 COMPONENTES & SIGNALS ====================
    $new18 = Replace-SlideTexts $tplCode @{
        "Persistencia con JPA/Hibernate y CRUD" = "4.4.1 Componentes Standalone y Signals"
        "El backend separa entidades, repositorios, servicios y controladores" = "Interfaz modular con detección OnPush, flujo @if/@for y estado reactivo"
        "19" = "18"
        "JPA" = "Standalone"
        "• Mapea clases Java a tablas" = "• Sin NgModules heredados"
        "• Define relaciones entre entidades" = "• OnPush en toda la aplicación"
        "• Evita trabajar SQL manual repetitivo" = "• Cero uso de innerHTML (Anti-XSS)"
        "Hibernate" = "Signals"
        "• Implementa JPA en ejecución" = "• signal(), computed(), input()"
        "• Genera SQL según entidades" = "• AuthStore y ToastStore reactivos"
        "• Sincroniza cambios con la BD" = "• Actualización quirúrgica del DOM"
        "CRUD" = "Módulos Clave"
        "• Crear servicios y usuarios" = "• PublicShell y DashboardShell"
        "• Consultar citas e historias" = "• Historial clínico en acordeón"
        "• Actualizar estados y costos" = "• Flujo multisesión (Sesión X de Y)"
        "• Desactivar registros sin borrar" = "• 5 dominios desacoplados"
    }
    # Reemplazar el bloque de codigo en slide 18
    $new18 = [regex]::Replace($new18, '(?s)@Entity.*?\ interface ServicioRepository.*?\}', "readonly servicios = signal<ServicioResponse[]>([]);\nreadonly especialidad = signal<string>('TODAS');\nreadonly busqueda = signal<string>('');\n\nreadonly filtrados = computed(() => {\n  const esp = this.especialidad();\n  const q = this.busqueda().trim().toLowerCase();\n  return this.servicios().filter(s =>\n    (esp === 'TODAS' || s.especialidad === esp) &&\n    (!q || s.nombre.toLowerCase().includes(q))\n  );\n});")
    Write-ZipText $zip "ppt/slides/slide18.xml" $new18
    Write-ZipText $zip "ppt/slides/_rels/slide18.xml.rels" $relTpl

    # ==================== SLIDE 19: 4.4.2 ROUTING Y GUARDS ====================
    $new19 = Replace-SlideTexts $tplCards @{
        "Seguridad web: Spring Security y JWT" = "4.4.2 Routing, Lazy Loading y Guards"
        "Acceso protegido según el rol del usuario autenticado" = "Árboles de navegación con carga diferida y control de acceso en cliente"
        "21" = "19"
        "PACIENTE" = "authGuard"
        "• Crear cuenta e iniciar sesión" = "• Exige sesión activa en AuthStore"
        "• Reservar, cancelar y reprogramar citas" = "• Verifica expiración del JWT"
        "• Consultar historial clínico propio" = "• Redirige a /login si caduca"
        "ODONTÓLOGO" = "guestGuard"
        "• Ver agenda asignada" = "• Protege /login y /registro"
        "• Gestionar pacientes atendidos" = "• Detecta sesión ya iniciada"
        "• Registrar diagnóstico e indicaciones" = "• Redirige al panel de su rol"
        "ADMIN" = "roleGuard"
        "• Administrar usuarios y servicios" = "• Restringe por PACIENTE/ODONTOLOGO/ADMIN"
        "• Ver agenda global y reportes" = "• Espejo exacto de SecurityConfig"
        "• Controlar costos y estado de citas" = "• Lazy Children (27 chunks)"
        "Login" = "URL Route"
        "JWT" = "authGuard"
        "Filtro Security" = "roleGuard"
        "Endpoint protegido" = "Lazy Component"
        "El token viaja en Authorization: Bearer &lt;token&gt; y Spring Security valida rol y permisos antes de ejecutar la API." = "withComponentInputBinding() inyecta parámetros URL (?token=, ?servicioId=) directamente como inputs Signal."
    }
    Write-ZipText $zip "ppt/slides/slide19.xml" $new19
    Write-ZipText $zip "ppt/slides/_rels/slide19.xml.rels" $relTpl

    # ==================== SLIDE 20: 4.4.3 FORMULARIOS Y 4.4.4 VALIDACIONES ====================
    $new20 = Replace-SlideTexts $tplTests @{
        "Pruebas y evidencias" = "4.4.3 Formularios y 4.4.4 Validaciones"
        "Validación del backend y comprobación de endpoints REST" = "NonNullableFormBuilder, validadores de dominio y pruebas con Vitest"
        "22" = "20"
        "JUnit + Mockito" = "Reactive Forms"
        "• Servicios probados de forma aislada" = "• NonNullableFormBuilder estricto"
        "• Sin levantar todo Spring" = "• Cero uso del tipo any"
        "• Sin depender de MySQL" = "• Mapeo 1:1 con Records DTO Java"
        "Postman" = "Validaciones"
        "• Login y registro" = "• dniPeru (8 dígitos) y telefono"
        "• Servicios y reservas" = "• fechaLaborable (sin domingos)"
        "• Rutas protegidas por rol" = "• Control multisesión y anti-duplicidad"
        "Casos clave" = "Calidad Doble Capa"
        "• Registro de pacientes" = "• <sd-field-error> accesible"
        "• Autenticación JWT" = "• Hidratación HTTP 400 / 409 / 422"
        "• CRUD de servicios" = "• Validadores cross-field"
        "• Citas sin doble cobro" = "• Guarda de sesión consecutiva"
        "• Cruce de horarios" = "• 7 tests unitarios en Vitest"
        "Resultado de pruebas" = "Pruebas Frontend + Backend"
        "cd backend" = "pnpm --dir frontend test"
        "mvn test" = "Vitest: 7 passed (7)"
        "Tests run: 19" = "Backend JUnit: 19 passed (19)"
    }
    Write-ZipText $zip "ppt/slides/slide20.xml" $new20
    Write-ZipText $zip "ppt/slides/_rels/slide20.xml.rels" $relTpl

    # ==================== SLIDE 21: CONCLUSIONES FINALES (AVANCES 1, 2 Y 3) ====================
    $new21 = Replace-SlideTexts $tplFinal @{
        "Resultados del Avance 2" = "Conclusiones Generales (Avances 1, 2 y 3)"
        "Persistencia, seguridad y diseño implementados en el backend." = "Evolución integral del sistema odontológico SmartDent en las tres entregas."
        "Modelo de datos conceptual, lógico y físico documentado." = "Avance 1: Análisis de requerimientos, arquitectura en capas y prototipo inicial."
        "Persistencia real con JPA/Hibernate y base relacional." = "Avance 2: API REST en Spring Boot, persistencia JPA/Hibernate en MariaDB."
        "CRUD funcional para servicios, citas, usuarios y roles." = "Avance 2: Seguridad stateless con Spring Security, BCrypt, roles y JWT."
        "JPQL y transacciones aplicadas a reglas de negocio." = "Avance 3: SPA en Angular 19 con Standalone Components, Signals y OnPush."
        "Spring Security + JWT con permisos por rol." = "Avance 3: Enrutamiento Lazy Loading, Guards por rol y formularios tipados."
        "19 pruebas unitarias aprobadas con JUnit y Mockito." = "Avance 3: Flujo multisesión, expediente por tratamiento y 26 tests totales."
        "PRÓXIMOS PASOS" = "LOGROS CONSOLIDADOS"
        "Migrar progresivamente el frontend a Angular." = "Integración full-stack reactiva Angular 19 + Spring Boot + MariaDB."
        "Ampliar pruebas de endpoints con Postman." = "Validación en doble capa (SmartDentValidators + GlobalExceptionHandler)."
        "Mejorar reportes administrativos y gráficos." = "Trazabilidad clínica multisesión sin doble cobro ni cruces de horario."
        "Preparar el despliegue final del sistema." = "Calidad verificada con 19 pruebas en JUnit/Mockito y 7 en Vitest."
        "23" = "21"
    }
    Write-ZipText $zip "ppt/slides/slide21.xml" $new21
    Write-ZipText $zip "ppt/slides/_rels/slide21.xml.rels" $relTpl

    # ==================== ACTUALIZAR [Content_Types].xml ====================
    $ct = Read-ZipText $zip "[Content_Types].xml"
    for ($i = 18; $i -le 21; $i++) {
        $partName = "/ppt/slides/slide$i.xml"
        if ($ct -notmatch [regex]::Escape($partName)) {
            $override = "<Override PartName=`"$partName`" ContentType=`"application/vnd.openxmlformats-officedocument.presentationml.slide+xml`"/>"
            $ct = $ct.Replace("</Types>", "$override</Types>")
        }
    }
    Write-ZipText $zip "[Content_Types].xml" $ct

    # ==================== ACTUALIZAR ppt/_rels/presentation.xml.rels ====================
    $presRelsXml = [xml](Read-ZipText $zip "ppt/_rels/presentation.xml.rels")
    $maxRid = 0
    foreach ($rel in $presRelsXml.Relationships.Relationship) {
        if ($rel.Id -match "^rId(\d+)$") {
            $n = [int]$Matches[1]
            if ($n -gt $maxRid) { $maxRid = $n }
        }
    }

    $newRids = @{}
    for ($i = 18; $i -le 21; $i++) {
        $maxRid++
        $rid = "rId$maxRid"
        $newRids[$i] = $rid
        $relElem = $presRelsXml.CreateElement("Relationship", $presRelsXml.DocumentElement.NamespaceURI)
        [void]$relElem.SetAttribute("Id", $rid)
        [void]$relElem.SetAttribute("Type", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide")
        [void]$relElem.SetAttribute("Target", "slides/slide$i.xml")
        [void]$presRelsXml.DocumentElement.AppendChild($relElem)
    }

    $sw = [IO.StringWriter]::new()
    $presRelsXml.Save($sw)
    Write-ZipText $zip "ppt/_rels/presentation.xml.rels" $sw.ToString()

    # ==================== ACTUALIZAR ppt/presentation.xml ====================
    $presXml = [xml](Read-ZipText $zip "ppt/presentation.xml")
    $nsm = [Xml.XmlNamespaceManager]::new($presXml.NameTable)
    $nsm.AddNamespace("p", "http://schemas.openxmlformats.org/presentationml/2006/main")
    $nsm.AddNamespace("r", "http://schemas.openxmlformats.org/officeDocument/2006/relationships")

    $sldIdLst = $presXml.SelectSingleNode("//p:sldIdLst", $nsm)
    $maxSldId = 256
    foreach ($sld in $sldIdLst.SelectNodes("p:sldId", $nsm)) {
        $idVal = [int]$sld.GetAttribute("id")
        if ($idVal -gt $maxSldId) { $maxSldId = $idVal }
    }

    for ($i = 18; $i -le 21; $i++) {
        $maxSldId++
        $sldElem = $presXml.CreateElement("p", "sldId", "http://schemas.openxmlformats.org/presentationml/2006/main")
        [void]$sldElem.SetAttribute("id", "$maxSldId")
        [void]$sldElem.SetAttribute("id", "http://schemas.openxmlformats.org/officeDocument/2006/relationships", $newRids[$i])
        [void]$sldIdLst.AppendChild($sldElem)
    }

    $swPres = [IO.StringWriter]::new()
    $presXml.Save($swPres)
    Write-ZipText $zip "ppt/presentation.xml" $swPres.ToString()

} finally {
    $zip.Dispose()
    $zipStream.Dispose()
}

Write-Output "Presentacion generada exitosamente: $destinoPath"

