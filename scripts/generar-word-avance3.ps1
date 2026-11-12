param(
    [string]$Origen = (Join-Path $PSScriptRoot "..\SmartDent_Avance_2.docx"),
    [string]$Destino = (Join-Path $PSScriptRoot "..\SmartDent_Avance_3.docx")
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$origenPath = (Resolve-Path -LiteralPath $Origen).Path
$destinoPath = [IO.Path]::GetFullPath($Destino)
$wNs = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

# Copiar de forma segura aunque SmartDent_Avance_2.docx este abierto en Microsoft Word
$inStream = [IO.File]::Open($origenPath, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::ReadWrite)
$outStream = [IO.File]::Open($destinoPath, [IO.FileMode]::Create, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
try {
    $inStream.CopyTo($outStream)
} finally {
    $inStream.Dispose()
    $outStream.Dispose()
}

function Read-ZipXml {
    param([IO.Compression.ZipArchive]$Zip, [string]$EntryName)
    $entry = $Zip.GetEntry($EntryName)
    if (-not $entry) { throw "No existe $EntryName" }
    $reader = [IO.StreamReader]::new($entry.Open(), [Text.Encoding]::UTF8)
    try {
        $xml = [xml]::new()
        $xml.PreserveWhitespace = $true
        $xml.LoadXml($reader.ReadToEnd())
        return $xml
    } finally {
        $reader.Dispose()
    }
}

function Write-ZipXml {
    param([IO.Compression.ZipArchive]$Zip, [string]$EntryName, [xml]$Xml)
    $old = $Zip.GetEntry($EntryName)
    if ($old) { $old.Delete() }
    $entry = $Zip.CreateEntry($EntryName, [IO.Compression.CompressionLevel]::Optimal)
    $writer = [IO.StreamWriter]::new($entry.Open(), [Text.UTF8Encoding]::new($false))
    try {
        $Xml.Save($writer)
    } finally {
        $writer.Dispose()
    }
}

function New-Heading {
    param([xml]$Xml, [string]$Text, [string]$StyleId)
    $p = $Xml.CreateElement("w", "p", $wNs)
    $pPr = $Xml.CreateElement("w", "pPr", $wNs)
    $pStyle = $Xml.CreateElement("w", "pStyle", $wNs)
    [void]$pStyle.SetAttribute("val", $wNs, $StyleId)
    [void]$pPr.AppendChild($pStyle)
    [void]$p.AppendChild($pPr)

    $r = $Xml.CreateElement("w", "r", $wNs)
    $rPr = $Xml.CreateElement("w", "rPr", $wNs)
    $lang = $Xml.CreateElement("w", "lang", $wNs)
    [void]$lang.SetAttribute("val", $wNs, "es-ES")
    [void]$rPr.AppendChild($lang)
    [void]$r.AppendChild($rPr)
    $t = $Xml.CreateElement("w", "t", $wNs)
    $t.InnerText = $Text
    [void]$r.AppendChild($t)
    [void]$p.AppendChild($r)
    return ,$p
}

function New-BodyParagraph {
    param([xml]$Xml, [string]$Text)
    $p = $Xml.CreateElement("w", "p", $wNs)
    $pPr = $Xml.CreateElement("w", "pPr", $wNs)
    $jc = $Xml.CreateElement("w", "jc", $wNs)
    [void]$jc.SetAttribute("val", $wNs, "both")
    [void]$pPr.AppendChild($jc)
    [void]$p.AppendChild($pPr)

    $r = $Xml.CreateElement("w", "r", $wNs)
    $rPr = $Xml.CreateElement("w", "rPr", $wNs)
    $lang = $Xml.CreateElement("w", "lang", $wNs)
    [void]$lang.SetAttribute("val", $wNs, "es-ES")
    [void]$rPr.AppendChild($lang)
    [void]$r.AppendChild($rPr)
    $t = $Xml.CreateElement("w", "t", $wNs)
    $t.InnerText = $Text
    [void]$r.AppendChild($t)
    [void]$p.AppendChild($r)
    return ,$p
}

function New-BulletItem {
    param([xml]$Xml, [string]$LeadBold, [string]$BodyText)
    $p = $Xml.CreateElement("w", "p", $wNs)
    $pPr = $Xml.CreateElement("w", "pPr", $wNs)
    $numPr = $Xml.CreateElement("w", "numPr", $wNs)
    $ilvl = $Xml.CreateElement("w", "ilvl", $wNs)
    [void]$ilvl.SetAttribute("val", $wNs, "0")
    $numId = $Xml.CreateElement("w", "numId", $wNs)
    [void]$numId.SetAttribute("val", $wNs, "20")
    [void]$numPr.AppendChild($ilvl)
    [void]$numPr.AppendChild($numId)
    $jc = $Xml.CreateElement("w", "jc", $wNs)
    [void]$jc.SetAttribute("val", $wNs, "both")
    [void]$pPr.AppendChild($numPr)
    [void]$pPr.AppendChild($jc)
    [void]$p.AppendChild($pPr)

    $rBold = $Xml.CreateElement("w", "r", $wNs)
    $rPrBold = $Xml.CreateElement("w", "rPr", $wNs)
    $b = $Xml.CreateElement("w", "b", $wNs)
    $bCs = $Xml.CreateElement("w", "bCs", $wNs)
    [void]$rPrBold.AppendChild($b)
    [void]$rPrBold.AppendChild($bCs)
    [void]$rBold.AppendChild($rPrBold)
    $tBold = $Xml.CreateElement("w", "t", $wNs)
    $spaceAttrBold = $Xml.CreateAttribute("xml", "space", "http://www.w3.org/XML/1998/namespace")
    $spaceAttrBold.Value = "preserve"
    [void]$tBold.Attributes.SetNamedItem($spaceAttrBold)
    $tBold.InnerText = "$LeadBold "
    [void]$rBold.AppendChild($tBold)
    [void]$p.AppendChild($rBold)

    $rText = $Xml.CreateElement("w", "r", $wNs)
    $tText = $Xml.CreateElement("w", "t", $wNs)
    $tText.InnerText = $BodyText
    [void]$rText.AppendChild($tText)
    [void]$p.AppendChild($rText)
    return ,$p
}

function New-CodeBlock {
    param([xml]$Xml, [string[]]$Lines)
    $p = $Xml.CreateElement("w", "p", $wNs)
    $pPr = $Xml.CreateElement("w", "pPr", $wNs)
    $shd = $Xml.CreateElement("w", "shd", $wNs)
    [void]$shd.SetAttribute("val", $wNs, "clear")
    [void]$shd.SetAttribute("color", $wNs, "auto")
    [void]$shd.SetAttribute("fill", $wNs, "F1F5F9")
    $ind = $Xml.CreateElement("w", "ind", $wNs)
    [void]$ind.SetAttribute("left", $wNs, "240")
    [void]$ind.SetAttribute("right", $wNs, "240")
    $spacing = $Xml.CreateElement("w", "spacing", $wNs)
    [void]$spacing.SetAttribute("before", $wNs, "120")
    [void]$spacing.SetAttribute("after", $wNs, "160")
    [void]$pPr.AppendChild($shd)
    [void]$pPr.AppendChild($ind)
    [void]$pPr.AppendChild($spacing)
    [void]$p.AppendChild($pPr)

    for ($i = 0; $i -lt $Lines.Count; $i++) {
        $r = $Xml.CreateElement("w", "r", $wNs)
        $rPr = $Xml.CreateElement("w", "rPr", $wNs)
        $rFonts = $Xml.CreateElement("w", "rFonts", $wNs)
        [void]$rFonts.SetAttribute("ascii", $wNs, "Consolas")
        [void]$rFonts.SetAttribute("hAnsi", $wNs, "Consolas")
        $sz = $Xml.CreateElement("w", "sz", $wNs)
        [void]$sz.SetAttribute("val", $wNs, "18")
        $color = $Xml.CreateElement("w", "color", $wNs)
        [void]$color.SetAttribute("val", $wNs, "0F172A")
        [void]$rPr.AppendChild($rFonts)
        [void]$rPr.AppendChild($sz)
        [void]$rPr.AppendChild($color)
        [void]$r.AppendChild($rPr)

        $t = $Xml.CreateElement("w", "t", $wNs)
        $spaceAttr = $Xml.CreateAttribute("xml", "space", "http://www.w3.org/XML/1998/namespace")
        $spaceAttr.Value = "preserve"
        [void]$t.Attributes.SetNamedItem($spaceAttr)
        $t.InnerText = $Lines[$i]
        [void]$r.AppendChild($t)

        if ($i -lt ($Lines.Count - 1)) {
            $br = $Xml.CreateElement("w", "br", $wNs)
            [void]$r.AppendChild($br)
        }
        [void]$p.AppendChild($r)
    }
    return ,$p
}

function New-StyledTable {
    param([xml]$Xml, [string[]]$Headers, [object[]]$Rows)
    $tbl = $Xml.CreateElement("w", "tbl", $wNs)
    $tblPr = $Xml.CreateElement("w", "tblPr", $wNs)
    $tblStyle = $Xml.CreateElement("w", "tblStyle", $wNs)
    [void]$tblStyle.SetAttribute("val", $wNs, "Tablaconcuadrcula4-nfasis4")
    $tblW = $Xml.CreateElement("w", "tblW", $wNs)
    [void]$tblW.SetAttribute("w", $wNs, "5000")
    [void]$tblW.SetAttribute("type", $wNs, "pct")
    $tblLook = $Xml.CreateElement("w", "tblLook", $wNs)
    [void]$tblLook.SetAttribute("val", $wNs, "04A0")
    [void]$tblLook.SetAttribute("firstRow", $wNs, "1")
    [void]$tblLook.SetAttribute("lastRow", $wNs, "0")
    [void]$tblLook.SetAttribute("firstColumn", $wNs, "1")
    [void]$tblLook.SetAttribute("lastColumn", $wNs, "0")
    [void]$tblLook.SetAttribute("noHBand", $wNs, "0")
    [void]$tblLook.SetAttribute("noVBand", $wNs, "1")
    [void]$tblPr.AppendChild($tblStyle)
    [void]$tblPr.AppendChild($tblW)
    [void]$tblPr.AppendChild($tblLook)
    [void]$tbl.AppendChild($tblPr)

    $trHead = $Xml.CreateElement("w", "tr", $wNs)
    foreach ($h in $Headers) {
        $tc = $Xml.CreateElement("w", "tc", $wNs)
        $p = $Xml.CreateElement("w", "p", $wNs)
        $r = $Xml.CreateElement("w", "r", $wNs)
        $rPr = $Xml.CreateElement("w", "rPr", $wNs)
        [void]$rPr.AppendChild($Xml.CreateElement("w", "b", $wNs))
        [void]$r.AppendChild($rPr)
        $t = $Xml.CreateElement("w", "t", $wNs)
        $t.InnerText = $h
        [void]$r.AppendChild($t)
        [void]$p.AppendChild($r)
        [void]$tc.AppendChild($p)
        [void]$trHead.AppendChild($tc)
    }
    [void]$tbl.AppendChild($trHead)

    foreach ($row in $Rows) {
        $tr = $Xml.CreateElement("w", "tr", $wNs)
        foreach ($cellVal in $row) {
            $tc = $Xml.CreateElement("w", "tc", $wNs)
            $p = $Xml.CreateElement("w", "p", $wNs)
            $r = $Xml.CreateElement("w", "r", $wNs)
            $t = $Xml.CreateElement("w", "t", $wNs)
            $t.InnerText = [string]$cellVal
            [void]$r.AppendChild($t)
            [void]$p.AppendChild($r)
            [void]$tc.AppendChild($p)
            [void]$tr.AppendChild($tc)
        }
        [void]$tbl.AppendChild($tr)
    }
    return ,$tbl
}

$zipStream = [IO.File]::Open($destinoPath, [IO.FileMode]::Open, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
$zip = [IO.Compression.ZipArchive]::new($zipStream, [IO.Compression.ZipArchiveMode]::Update)

try {
    $docXml = Read-ZipXml $zip "word/document.xml"
    $nsm = [Xml.XmlNamespaceManager]::new($docXml.NameTable)
    $nsm.AddNamespace("w", $wNs)

    # 1. Actualizar portada y referencias de avance / consistencia tecnica
    foreach ($tNode in $docXml.SelectNodes("//w:t", $nsm)) {
        if ($tNode.InnerText -match "Avance 2") {
            $tNode.InnerText = $tNode.InnerText -replace "Avance 2", "Avance 3"
        }
        if ($tNode.InnerText -match "Octubre,\s*2026") {
            $tNode.InnerText = $tNode.InnerText -replace "Octubre,\s*2026", "Noviembre, 2026"
        }
        if ($tNode.InnerText -match "/api/odontologos/citas`$") {
            $tNode.InnerText = $tNode.InnerText -replace "/api/odontologos/citas", "/api/odontologos/mi-agenda"
        }
    }

    foreach ($pNode in $docXml.SelectNodes("//w:body/w:p", $nsm)) {
        $joined = ($pNode.SelectNodes(".//w:t", $nsm) | ForEach-Object { $_.InnerText }) -join ""
        if ($joined -like "*Angular se incorporará posteriormente*") {
            $firstT = $pNode.SelectNodes(".//w:t", $nsm) | Select-Object -First 1
            $otherTs = $pNode.SelectNodes(".//w:t", $nsm) | Select-Object -Skip 1
            foreach ($ot in $otherTs) { $ot.InnerText = "" }
            $firstT.InnerText = "La arquitectura separa la interfaz de usuario, la lógica de negocio y la persistencia. En este tercer avance se incorpora una Single Page Application (SPA) en Angular 19 con componentes Standalone, Signals y Tailwind CSS integrada con la API REST de Spring Boot, JPA/Hibernate sobre MariaDB y Spring Security con JWT."
        }
        elseif ($joined -like "*Angular se mantiene para un avance posterior*") {
            $firstT = $pNode.SelectNodes(".//w:t", $nsm) | Select-Object -First 1
            $otherTs = $pNode.SelectNodes(".//w:t", $nsm) | Select-Object -Skip 1
            foreach ($ot in $otherTs) { $ot.InnerText = "" }
            $firstT.InnerText = "Al cierre de este tercer avance se cuenta con la SPA en Angular compilada en modo estricto e integrada con la API REST en Spring Boot y MariaDB bajo autenticación JWT para los tres roles (PACIENTE, ODONTOLOGO y ADMIN). Se implementaron componentes Standalone con OnPush, enrutamiento perezoso protegido por guards funcionales, formularios reactivos tipados y validaciones cliente-servidor respaldadas por 19 pruebas unitarias en backend y 7 pruebas automatizadas con Vitest en frontend."
        }
        elseif ($joined -like "*Para la siguiente etapa del curso se proyecta su migración a Angular*") {
            $firstT = $pNode.SelectNodes(".//w:t", $nsm) | Select-Object -First 1
            $otherTs = $pNode.SelectNodes(".//w:t", $nsm) | Select-Object -Skip 1
            foreach ($ot in $otherTs) { $ot.InnerText = "" }
            $firstT.InnerText = "FRONTEND: Implementado como una Single Page Application (SPA) en Angular 19 con TypeScript estricto, Tailwind CSS, Signals y HttpClient con interceptores JWT, manteniendo compatibilidad con el prototipo inicial."
        }
    }

    # 2. Limpiar parrafos en blanco finales despues de 4.3
    $body = $docXml.SelectSingleNode("//w:body", $nsm)
    $sectPr = $body.SelectSingleNode("w:sectPr", $nsm)
    $allBodyP = $body.SelectNodes("w:p", $nsm)
    for ($idx = $allBodyP.Count - 1; $idx -ge 0; $idx--) {
        $txt = (($allBodyP[$idx].SelectNodes(".//w:t", $nsm) | ForEach-Object { $_.InnerText }) -join "").Trim()
        if ($txt.Length -eq 0) {
            [void]$body.RemoveChild($allBodyP[$idx])
        } else {
            break
        }
    }

    # Helper para insertar antes de sectPr
    $appendNode = {
        param($node)
        if ($sectPr) { [void]$body.InsertBefore($node, $sectPr) }
        else { [void]$body.AppendChild($node) }
    }

    # ==================== 4.4 DESARROLLO DEL FRONTEND ANGULAR ====================
    & $appendNode (New-Heading $docXml "4.4 Desarrollo del Frontend Angular" "Ttulo2")
    & $appendNode (New-BodyParagraph $docXml "En el tercer avance se construyó la aplicación cliente en el directorio frontend utilizando Angular 19.2, TypeScript 5.7 en modo estricto (strict: true y strictTemplates: true) y Tailwind CSS 3.4 configurado con la identidad visual corporativa de SmartDent. La SPA consume de forma asíncrona los endpoints REST de Spring Boot mediante HttpClient con API Fetch e inyecta automáticamente el token Bearer a través de un interceptor funcional (jwtInterceptor).")
    & $appendNode (New-BodyParagraph $docXml "Para el entorno local de desarrollo se configuró proxy.conf.json redirigiendo el prefijo /api hacia http://localhost:8080, evitando fricciones CORS y manteniendo un único contrato de servicios en SmartDentApiService. La compilación de producción (ng build --configuration production) genera un paquete inicial optimizado de 91.24 kB transferidos y 27 fragmentos de carga diferida (lazy chunks).")

    # ==================== 4.4.1 COMPONENTES ====================
    & $appendNode (New-Heading $docXml "4.4.1 Componentes" "Ttulo3")
    & $appendNode (New-BodyParagraph $docXml "La interfaz se diseñó aplicando el estándar moderno de Angular Standalone Components sin NgModules tradicionales. Todos los componentes operan bajo la estrategia ChangeDetectionStrategy.OnPush combinada con Angular Signals (signal, computed, input) y el flujo de control nativo (@if, @for con expresión track obligatoria), acotando la verificación de cambios únicamente a los subárboles cuyo estado reactivo muta y eliminando vulnerabilidades XSS derivadas de innerHTML.")
    & $appendNode (New-BulletItem $docXml "Layouts estructurales (shared/layouts):" "PublicShellComponent renderiza la cabecera pública responsiva y el pie institucional; DashboardShellComponent adapta dinámicamente la barra lateral según el rol autenticado (PACIENTE, ODONTOLOGO o ADMIN).")
    & $appendNode (New-BulletItem $docXml "Componentes transversales de UI (shared/ui):" "ToastHostComponent gestiona notificaciones flotantes reactivas; StatusBadgeComponent estandariza las etiquetas visuales de estados clínicos; FieldErrorComponent proyecta mensajes de validación accesibles.")
    & $appendNode (New-BulletItem $docXml "Componentes de dominio (features/):" "Organizados en cinco dominios desacoplados (public, auth, paciente, odontologo y admin) que encapsulan el ciclo de vida de cada caso de uso del sistema.")
    & $appendNode (New-BulletItem $docXml "Flujo clínico multisesión y expediente jerárquico:" "OdontologoAgendaComponent gestiona atenciones multisesión (Sesión X de Y), alertas de próximo control y alta médica definitiva (COMPLETADO). En paralelo, PacienteDashboardComponent agrupa el Historial Clínico jerárquicamente por Servicio Dental contratado mediante un acordeón interactivo con filtros de estado y buscador en tiempo real.")

    $compHeaders = @("Dominio", "Componente Angular", "Selector", "Responsabilidad Funcional")
    $compRows = @(
        @("Shared Layout", "PublicShellComponent", "sd-public-shell", "Navegación pública, estado de sesión y cierre seguro."),
        @("Shared Layout", "DashboardShellComponent", "sd-dashboard-shell", "Menú lateral reactivo por rol (computed) y contenedor privado."),
        @("Shared UI", "ToastHostComponent / FieldErrorComponent", "sd-toast-host / sd-field-error", "Alertas globales libres de XSS y errores por control."),
        @("Público", "HomePage / ServiciosPage / NosotrosPage / ContactoPage", "sd-home-page / sd-servicios-page", "Landing, catálogo filtrable por especialidad, staff y contacto."),
        @("Autenticación", "LoginPage / RegistroPage / RecuperarPage", "sd-login-page / sd-registro-page", "Acceso JWT, alta con medidor de fortaleza, activación y reset."),
        @("Paciente", "PacienteDashboard / ReservarCita / PacienteConfiguracion", "sd-paciente-dashboard / sd-reservar-cita", "Historial, reprogramación, reserva en vivo y preferencias."),
        @("Odontólogo", "OdontologoAgenda / OdontologoBloqueos", "sd-odontologo-agenda / sd-odontologo-bloqueos", "Confirmación de citas, ficha de historia clínica y bloqueos."),
        @("Administrador", "AdminAgenda / AdminServicios / AdminOdontologos / AdminFinanzas / AdminMensajes", "sd-admin-agenda / sd-admin-servicios", "KPIs, exportación CSV, CRUD de tarifas y médicos, finanzas y bandeja.")
    )
    & $appendNode (New-StyledTable $docXml $compHeaders $compRows)

    & $appendNode (New-BodyParagraph $docXml "Fragmento representativo de filtrado reactivo con Signals y control de flujo nativo en ServiciosPageComponent:")
    & $appendNode (New-CodeBlock $docXml @(
        "protected readonly servicios = signal<readonly ServicioResponse[]>([]);",
        "protected readonly especialidadActiva = signal<string>('TODAS');",
        "protected readonly terminoBusqueda = signal<string>('');",
        "",
        "protected readonly serviciosFiltrados = computed<readonly ServicioResponse[]>(() => {",
        "  const esp = this.especialidadActiva();",
        "  const query = this.terminoBusqueda().trim().toLowerCase();",
        "  return this.servicios().filter((item) =>",
        "    (esp === 'TODAS' || item.especialidad === esp) &&",
        "    (!query || item.nombre.toLowerCase().includes(query))",
        "  );",
        "});"
    ))

    # ==================== 4.4.2 ROUTING ====================
    & $appendNode (New-Heading $docXml "4.4.2 Routing" "Ttulo3")
    & $appendNode (New-BodyParagraph $docXml "El módulo de navegación se definió en app.routes.ts habilitando withComponentInputBinding() para inyectar parámetros de consulta directamente como entradas Signal (por ejemplo, ?verificar=, ?token= y ?servicioId=) y withInMemoryScrolling() para restaurar la posición superior en cada transición. Todos los paneles privados emplean carga diferida mediante loadComponent y loadChildren, evitando descargar el código administrativo en la sesión de un paciente.")
    & $appendNode (New-BodyParagraph $docXml "El control de acceso en cliente se refuerza con tres guards funcionales (CanMatchFn y CanActivateFn) sincronizados con AuthStore: authGuard exige un JWT vigente no expirado; guestGuard redirige usuarios ya autenticados hacia su panel respectivo; y roleGuard restringe cada árbol de rutas al rol autorizado, manteniendo correspondencia exacta con SecurityConfig en Spring Boot. Adicionalmente, se incluyeron rutas de redirección (/login.html y /recuperar.html) para preservar compatibilidad con los enlaces enviados por correo electrónico.")

    $routeHeaders = @("Ruta SPA", "Carga", "Guards Aplicados", "Vista / Módulo Destino")
    $routeRows = @(
        @("/, /servicios, /nosotros, /contacto", "Lazy Component", "Público", "Portal informativo y catálogo odontológico"),
        @("/login, /registro", "Lazy Component", "guestGuard", "Autenticación JWT, verificación de cuenta y alta"),
        @("/recuperar", "Lazy Component", "Público", "Solicitud de enlace y cambio de contraseña con token"),
        @("/paciente, /paciente/reservar, /paciente/configuracion", "Lazy Children", "authGuard + roleGuard(['PACIENTE'])", "Panel del paciente, agendamiento y recordatorios"),
        @("/odontologo, /odontologo/bloqueos", "Lazy Children", "authGuard + roleGuard(['ODONTOLOGO'])", "Agenda clínica del especialista y bloqueos horarios"),
        @("/admin, /admin/{servicios,odontologos,finanzas,mensajes}", "Lazy Children", "authGuard + roleGuard(['ADMIN'])", "Supervisión global, catálogos, reportes y mensajes")
    )
    & $appendNode (New-StyledTable $docXml $routeHeaders $routeRows)

    & $appendNode (New-CodeBlock $docXml @(
        "export const roleGuard = (allowedRoles: readonly RolNombre[]): CanMatchFn => {",
        "  return (): boolean | UrlTree => {",
        "    const authStore = inject(AuthStore);",
        "    const router = inject(Router);",
        "    const role = authStore.role();",
        "    if (!role) return router.createUrlTree(['/login']);",
        "    return allowedRoles.includes(role)",
        "      ? true",
        "      : router.parseUrl(authStore.dashboardPath());",
        "  };",
        "};"
    ))

    # ==================== 4.4.3 FORMULARIOS ====================
    & $appendNode (New-Heading $docXml "4.4.3 Formularios" "Ttulo3")
    & $appendNode (New-BodyParagraph $docXml "Para garantizar trazabilidad, inmutabilidad de estado y tipado estricto en tiempo de compilación, todos los formularios del sistema se implementaron con ReactiveFormsModule e inyección de NonNullableFormBuilder. Esta decisión evita controles anulables accidentales, elimina el uso del tipo any y permite que form.getRawValue() produzca estructuras idénticas a los Records DTO esperados por los controladores de Spring Boot.")

    $formHeaders = @("Formulario Reactivo", "Componente", "DTO Backend Vinculado", "Endpoint REST")
    $formRows = @(
        @("LoginForm", "LoginPageComponent", "LoginRequest", "POST /api/auth/login"),
        @("RegistroPacienteForm", "RegistroPageComponent", "RegistroPacienteRequest", "POST /api/auth/registro"),
        @("Recuperar / ResetForm", "RecuperarPageComponent", "RecuperarPasswordRequest / ResetPasswordRequest", "POST /api/auth/recuperar-password | /reset-password"),
        @("ContactoForm", "ContactoPageComponent", "CrearMensajeContactoRequest", "POST /api/contacto/mensajes"),
        @("ReservaCitaForm", "ReservarCitaComponent", "CrearCitaRequest", "POST /api/pacientes/citas"),
        @("ReprogramarCitaForm", "PacienteDashboardComponent", "ReprogramarCitaRequest", "PUT /api/pacientes/citas/{id}/reprogramar"),
        @("ConfiguracionForm", "PacienteConfiguracionComponent", "ConfiguracionPacienteRequest", "PUT /api/pacientes/configuracion"),
        @("HistoriaClinicaForm", "OdontologoAgendaComponent", "GuardarHistoriaClinicaRequest", "PUT /api/odontologos/historias-clinicas"),
        @("BloqueoHorarioForm", "OdontologoBloqueosComponent", "BloqueoHorarioRequest", "POST /api/odontologos/bloqueos"),
        @("Servicio / Odontologo / CostoFijo", "Admin*Component", "ServicioRequest / CrearOdontologoRequest / CostoFijoRequest", "POST y PUT /api/admin/{servicios,odontologos,reportes/costos-fijos}")
    )
    & $appendNode (New-StyledTable $docXml $formHeaders $formRows)

    # ==================== 4.4.4 VALIDACIONES ====================
    & $appendNode (New-Heading $docXml "4.4.4 Validaciones" "Ttulo3")
    & $appendNode (New-BodyParagraph $docXml "El aseguramiento de calidad de los datos de entrada opera en doble capa (cliente y servidor) mediante la biblioteca propia SmartDentValidators (shared/validators/smartdent.validators.ts) en conjunto con el manejador global GlobalExceptionHandler de Spring Boot:")
    & $appendNode (New-BulletItem $docXml "Validadores síncronos de dominio:" "dniPeru() exige exactamente 8 dígitos numéricos; passwordCompleja() verifica longitud de 8 a 72 caracteres con presencia obligatoria de letras y números; telefono() unifica el patrón de 9 a 20 caracteres válidos en todos los módulos; y fechaLaborable() bloquea fechas pasadas y domingos antes de consultar disponibilidad.")
    & $appendNode (New-BulletItem $docXml "Validadores cruzados (Cross-Field FormGroup):" "confirmarPassword() comprueba coincidencia exacta de contraseñas en registro y recuperación; rangoHorario() impide registrar bloqueos donde la hora final sea menor o igual a la inicial; y margenPositivo() alerta cuando el precio de un servicio es inferior a su costo operativo.")
    & $appendNode (New-BulletItem $docXml "Hidratación reactiva de errores del servidor:" "La función applyServerValidationErrors() intercepta respuestas HTTP 400 (MethodArgumentNotValidException), 409 (RecursoDuplicadoException) y 422 (ReglaNegocioException), asociando cada clave del mapa fields directamente al FormControl involucrado mediante setErrors({ server: message }).")
    & $appendNode (New-BulletItem $docXml "Validaciones clínicas preventivas y anti-duplicidad:" "En tratamientos multisesión se alerta al odontólogo si omite la fecha de próximo control en sesiones intermedias, mientras que en la sesión final pasa a opcional (alta médica). En el panel del paciente, la guarda puedeAgendarSiguienteSesion(cita) bloquea reservas consecutivas si ya existe una cita futura activa para el mismo tratamiento.")
    & $appendNode (New-BulletItem $docXml "Verificación automatizada con Vitest:" "Se implementaron 7 pruebas unitarias en frontend/src/app/smartdent.spec.ts ejecutadas con pnpm --dir frontend test, validando DNI, contraseñas, teléfonos, bloqueo de domingos, reglas cross-field, prioridad de errores del servidor y ciclo de sesión en AuthStore.")

    & $appendNode (New-CodeBlock $docXml @(
        "export function applyServerValidationErrors(form: FormGroup, err: unknown): string {",
        "  if (err instanceof HttpErrorResponse && isApiErrorPayload(err.error) && err.error.fields) {",
        "    for (const [field, message] of Object.entries(err.error.fields)) {",
        "      const control = form.get(field);",
        "      if (control) {",
        "        control.setErrors({ ...(control.errors ?? {}), server: message });",
        "        control.markAsTouched();",
        "      }",
        "    }",
        "  }",
        "  return extractApiErrorMessage(err);",
        "}"
    ))

    Write-ZipXml $zip "word/document.xml" $docXml

    # 3. Activar actualizacion automatica de campos/INDICE al abrir en Word
    $settingsXml = Read-ZipXml $zip "word/settings.xml"
    $nsmSet = [Xml.XmlNamespaceManager]::new($settingsXml.NameTable)
    $nsmSet.AddNamespace("w", $wNs)
    if (-not $settingsXml.SelectSingleNode("//w:settings/w:updateFields", $nsmSet)) {
        $upd = $settingsXml.CreateElement("w", "updateFields", $wNs)
        [void]$upd.SetAttribute("val", $wNs, "true")
        [void]$settingsXml.DocumentElement.AppendChild($upd)
        Write-ZipXml $zip "word/settings.xml" $settingsXml
    }
} finally {
    $zip.Dispose()
    $zipStream.Dispose()
}

Write-Output "Generado correctamente: $destinoPath"
