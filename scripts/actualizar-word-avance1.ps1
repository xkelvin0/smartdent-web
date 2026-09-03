param(
    [string]$Documento = (Join-Path $PSScriptRoot "..\doc\SmartDent_Avance_1.docx"),
    [switch]$SoloTdd
)

$ErrorActionPreference = "Stop"
$documentPath = (Resolve-Path -LiteralPath $Documento).Path
$documentName = [System.IO.Path]::GetFileName($documentPath)
$lockName = ([string][char]126 + [string][char]36) + $documentName.Substring(2)
$lockPath = Join-Path ([System.IO.Path]::GetDirectoryName($documentPath)) $lockName
if ((Test-Path -LiteralPath $lockPath) -and -not (Get-Process WINWORD -ErrorAction SilentlyContinue)) {
    [System.IO.File]::Delete($lockPath)
}
$word = $null
$doc = $null

function Set-ParagraphStartingWith {
    param([object]$Document, [string]$Prefix, [string]$NewText)
    for ($index = 1; $index -le $Document.Paragraphs.Count; $index++) {
        $paragraph = $Document.Paragraphs.Item($index)
        $text = $paragraph.Range.Text.Trim()
        $newPrefix = $NewText.Substring(0, [Math]::Min(60, $NewText.Length))
        $matchesText = $text.StartsWith($Prefix, [System.StringComparison]::Ordinal) -or
            $text.StartsWith($newPrefix, [System.StringComparison]::Ordinal)
        if ($matchesText) {
            $styleName = [string]$paragraph.Range.Style.NameLocal
            $isTableOfContents = $styleName -match "^(TOC|TDC)|tabla de contenido"
            if ($isTableOfContents) { continue }
            $contentRange = $paragraph.Range.Duplicate
            $contentRange.End = $contentRange.End - 1
            $contentRange.Text = $NewText
            $paragraph.Range.Style = -1
            $paragraph.OutlineLevel = 10
            return
        }
    }
    Write-Warning "No se encontró el párrafo que comienza con: $Prefix"
    return
}

function Replace-AllText {
    param([object]$Document, [string]$OldText, [string]$NewText)
    $range = $Document.Content
    $find = $range.Find
    $find.ClearFormatting()
    $find.Replacement.ClearFormatting()
    [void]$find.Execute($OldText, $false, $false, $false, $false, $false, $true, 1, $false, $NewText, 2)
}

function Find-ParagraphExact {
    param([object]$Document, [string]$Text)
    for ($index = 1; $index -le $Document.Paragraphs.Count; $index++) {
        $paragraph = $Document.Paragraphs.Item($index)
        if ($paragraph.Range.Text.Trim() -eq $Text) { return $paragraph }
    }
    return $null
}

function Add-TddSection {
    param([object]$Document)
    Write-Host "Comprobando sección TDD..."
    if ($Document.Content.Text.Contains("2.4 Test Driven Development")) { return }

    $heading = "2.4 Test Driven Development"
    $intro = "Test Driven Development (TDD), o desarrollo guiado por pruebas, es una práctica de ingeniería de software en la que las pruebas se escriben antes del código funcional. Su propósito es convertir los requisitos en comportamientos verificables y proporcionar retroalimentación continua durante el desarrollo."
    $fundamentalsHeading = "2.4.1 Fundamentos TDD"
    $fundamentalsOne = "TDD se desarrolla mediante un ciclo breve conocido como rojo, verde y refactorización. En la fase roja se escribe una prueba que representa el comportamiento esperado y se comprueba que falle. En la fase verde se implementa el código mínimo necesario para superar la prueba. Finalmente, durante la refactorización se mejora la estructura interna del código sin modificar el comportamiento comprobado."
    $fundamentalsTwo = "Este enfoque favorece la claridad de los requisitos, la detección temprana de errores, el diseño modular y la prevención de regresiones. En SmartDent puede aplicarse a reglas como impedir cruces de horarios, restringir las operaciones según el rol, validar el registro de pacientes y controlar las transiciones de estado de una cita. TDD no elimina la necesidad de pruebas de integración o validaciones manuales, sino que las complementa."
    $junitHeading = "2.4.2 Pruebas Unitarias con JUnit"
    $junitOne = "JUnit es un framework del ecosistema Java que permite definir y ejecutar pruebas automatizadas. JUnit 5 utiliza anotaciones como @Test para identificar casos de prueba y métodos de aserción para comparar el resultado obtenido con el esperado. Una prueba unitaria debe evaluar una unidad pequeña de código de manera aislada, ser repetible y producir resultados independientes del orden de ejecución."
    $junitTwo = "Cuando una clase depende de repositorios u otros servicios, Mockito puede crear objetos simulados para aislar su comportamiento. Para comprobar la interacción conjunta de controladores, seguridad, servicios y persistencia, Spring Boot proporciona @SpringBootTest y MockMvc. Estas últimas corresponden a pruebas de integración, por lo que deben distinguirse de las pruebas unitarias aunque ambas se ejecuten mediante JUnit."
    $junitThree = "El backend de SmartDent cuenta actualmente con 34 pruebas automatizadas. Estas verifican autenticación JWT, permisos por rol, catálogo, usuarios, citas, disponibilidad, historias clínicas, bloqueos de agenda, configuración del paciente, costos, reportes, mensajes de contacto y documentación OpenAPI. Maven permite ejecutar el conjunto completo con el comando .\mvnw.cmd test y genera un resultado reproducible para la evidencia del proyecto."

    $Document.Content.InsertAfter("`r$heading`r$intro`r$fundamentalsHeading`r$fundamentalsOne`r$fundamentalsTwo`r$junitHeading`r$junitOne`r$junitTwo`r$junitThree`r")
    Write-Host "Contenido TDD insertado."

    foreach ($headingDefinition in @(
        @{ Text = $heading; Style = -3 },
        @{ Text = $fundamentalsHeading; Style = -4 },
        @{ Text = $junitHeading; Style = -4 }
    )) {
        $range = $Document.Content
        if ($range.Find.Execute($headingDefinition.Text)) {
            $range.Style = $headingDefinition.Style
        }
    }
    Write-Host "Estilos TDD aplicados."
}

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $doc = $word.Documents.Open($documentPath)

    if ($SoloTdd) {
        Add-TddSection $doc
        Write-Host "Guardando contenido..."
        $doc.Save()
        Write-Host "Actualizando índice..."
        foreach ($tableOfContents in $doc.TablesOfContents) { $tableOfContents.Update() }
        Write-Host "Guardando índice..."
        $doc.Save()
        Write-Host "Sección TDD e índice actualizados: $documentPath"
        return
    }

    Set-ParagraphStartingWith $doc "SmartDent es una propuesta" "SmartDent es un sistema web integrado orientado a digitalizar el registro de pacientes, el catálogo de servicios, la gestión de profesionales, las citas y el seguimiento clínico de una clínica odontológica. El proyecto responde a las dificultades ocasionadas por llamadas, mensajes de WhatsApp y registros manuales, que pueden provocar cruces de horarios, pérdida de información y demoras en la atención."
    Set-ParagraphStartingWith $doc "La solución plantea una aplicación web con dos perfiles" "La solución incorpora tres perfiles: paciente, odontólogo y administrador. El paciente puede registrarse, autenticarse, consultar servicios y profesionales, reservar y gestionar citas. El odontólogo administra su propia agenda y registra la atención clínica. El administrador supervisa la agenda global, usuarios, servicios, costos, reportes y mensajes de contacto."
    Set-ParagraphStartingWith $doc "La arquitectura proyectada separa" "La arquitectura separa la interfaz de usuario, la lógica de negocio y la persistencia. El avance utiliza HTML5, Tailwind CSS y JavaScript modular en el frontend; Spring Boot para la API REST; JPA/Hibernate y MariaDB para los datos; y Spring Security con JWT para autenticación y autorización. Angular se incorporará posteriormente según la planificación del curso."
    Set-ParagraphStartingWith $doc "SmartDent centralizará" "SmartDent centraliza la información relacionada con usuarios, servicios odontológicos, profesionales, citas, historias clínicas y operación administrativa. Su finalidad es ofrecer una reserva sencilla al paciente, una agenda individual al odontólogo y una vista general al administrador."
    Set-ParagraphStartingWith $doc "Desarrollar una plataforma web que automatice" "Se desarrolló una plataforma web que automatiza el registro de pacientes y el agendamiento de citas. Incluye catálogo de tratamientos y odontólogos, paneles separados para paciente, odontólogo y administrador, control de disponibilidad, historias clínicas, reportes y mensajes de contacto."
    Replace-AllText $doc "MySQL o PostgreSQL como sistema gestor de base de datos relacional." "MariaDB de XAMPP como sistema gestor de base de datos relacional."
    Replace-AllText $doc "Angular y TypeScript para desarrollar la aplicación cliente de tipo SPA." "Angular y TypeScript previstos para la migración posterior del cliente a una SPA."
    Replace-AllText $doc "Maven, Git, GitHub y herramientas de prueba de APIs como apoyo al desarrollo." "Maven, Git, GitHub, JUnit, MockMvc y Swagger UI como herramientas de desarrollo, prueba y documentación."
    Set-ParagraphStartingWith $doc "Al cierre del Avance 1 se ha definido" "Al cierre de esta actualización se encuentran definidos el problema, los objetivos, el alcance y la arquitectura tecnológica. Además, existe una maquetación funcional y una API REST integrada con MariaDB, autenticación JWT y tres roles. Se implementaron la reserva y disponibilidad de citas, agendas por rol, historias clínicas, bloqueos, tarifas, reportes, configuración del paciente, mensajes de contacto y documentación Swagger. El backend cuenta con 34 pruebas automatizadas satisfactorias. Angular y el despliegue se mantienen para avances posteriores."
    Replace-AllText $doc "roles PACIENTE y ADMIN" "roles PACIENTE, ODONTOLOGO y ADMIN"
    Replace-AllText $doc "los roles PACIENTE y ADMIN." "los roles PACIENTE, ODONTOLOGO y ADMIN."
    Set-ParagraphStartingWith $doc "Persistencia en una base de datos relacional e integración entre Angular" "Persistencia en MariaDB e integración actual entre el frontend HTML/JavaScript y Spring Boot; la migración a Angular queda planificada para un avance posterior."
    Set-ParagraphStartingWith $doc "Pruebas básicas de la API y despliegue académico" "Pruebas automatizadas y documentación interactiva de la API; el despliegue académico se realizará en una etapa posterior."
    Set-ParagraphStartingWith $doc "No forman parte del alcance inicial" "No forman parte del alcance actual la facturación electrónica oficial, los pagos en línea, el envío real de correos, WhatsApp o SMS ni la integración con sistemas externos de salud."
    Set-ParagraphStartingWith $doc "La primera entrega se concentra" "El frontend del primer avance se mantiene en HTML5, CSS y JavaScript; Angular se incorporará cuando lo solicite la planificación docente."
    Set-ParagraphStartingWith $doc "La solución inicial manejará solamente" "La solución maneja tres roles: PACIENTE, ODONTOLOGO y ADMIN. No se incluye todavía un rol independiente de recepcionista."
    Set-ParagraphStartingWith $doc "En SmartDent, Angular actuará" "En el avance actual, HTML y JavaScript actúan como cliente y Spring Boot funciona como servidor. La comunicación utiliza JSON. Angular reemplazará progresivamente al cliente actual en una etapa posterior sin modificar el contrato principal de la API."
    Set-ParagraphStartingWith $doc "Para el proyecto se proponen rutas como" "El proyecto implementa rutas como GET /api/servicios, GET /api/odontologos, POST /api/pacientes/citas, GET /api/odontologos/mi-agenda y GET /api/admin/citas. Los controladores reciben parámetros, cuerpos JSON y credenciales JWT, y devuelven códigos HTTP y representaciones JSON."
    Set-ParagraphStartingWith $doc "POST envía información para crear" "POST envía información para crear un recurso o iniciar un proceso. Se utiliza para registrar pacientes, autenticar usuarios, crear citas, registrar odontólogos y recibir mensajes de contacto."
    Set-ParagraphStartingWith $doc "PUT actualiza un recurso existente" "PUT actualiza una representación existente, por ejemplo al reprogramar una cita o editar un servicio. SmartDent emplea PATCH para cambios parciales, como confirmar, cancelar o marcar una atención."
    Set-ParagraphStartingWith $doc "Durante el desarrollo de SmartDent se podrán" "Las APIs se prueban manualmente desde Swagger UI y automáticamente con JUnit y MockMvc. Las pruebas cubren controladores, seguridad JWT, persistencia, validaciones y reglas de negocio. La ejecución completa actual contiene 34 pruebas satisfactorias."
    Set-ParagraphStartingWith $doc "Los resultados de las pruebas deberán" "Los resultados se conservan como evidencia técnica mediante los reportes de Maven. Swagger UI está disponible en http://localhost:8080/swagger-ui.html cuando el backend se encuentra en ejecución."
    Replace-AllText $doc "POST /api/citas" "POST /api/pacientes/citas"

    Add-TddSection $doc

    foreach ($tableOfContents in $doc.TablesOfContents) { $tableOfContents.Update() }
    $doc.Save()
}
finally {
    if ($doc) { $doc.Close($false) }
    if ($word) { $word.Quit() }
    if ($doc) { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc) }
    if ($word) { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

Write-Host "Documento actualizado: $documentPath"
