param(
    [string]$Documento = (Join-Path $PSScriptRoot "..\doc\SmartDent_Avance_1.docx")
)

$ErrorActionPreference = "Stop"
$documentPath = (Resolve-Path -LiteralPath $Documento).Path
$wordNamespace = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

function Read-ZipXml {
    param([IO.Compression.ZipArchive]$Zip, [string]$EntryName)
    $entry = $Zip.GetEntry($EntryName)
    if (-not $entry) { throw "No se encontró $EntryName en el documento." }
    $reader = [IO.StreamReader]::new($entry.Open())
    try { return [xml]$reader.ReadToEnd() } finally { $reader.Dispose() }
}

function Write-ZipXml {
    param([IO.Compression.ZipArchive]$Zip, [string]$EntryName, [xml]$Xml)
    $oldEntry = $Zip.GetEntry($EntryName)
    if ($oldEntry) { $oldEntry.Delete() }
    $entry = $Zip.CreateEntry($EntryName, [IO.Compression.CompressionLevel]::Optimal)
    $writer = [IO.StreamWriter]::new($entry.Open(), [Text.UTF8Encoding]::new($false))
    try { $Xml.Save($writer) } finally { $writer.Dispose() }
}

function New-WordParagraph {
    param([xml]$Xml, [string]$Text, [string]$Style)
    $paragraph = $Xml.CreateElement("w", "p", $wordNamespace)
    if ($Style) {
        $properties = $Xml.CreateElement("w", "pPr", $wordNamespace)
        $paragraphStyle = $Xml.CreateElement("w", "pStyle", $wordNamespace)
        [void]$paragraphStyle.SetAttribute("val", $wordNamespace, $Style)
        [void]$properties.AppendChild($paragraphStyle)
        [void]$paragraph.AppendChild($properties)
    }
    $run = $Xml.CreateElement("w", "r", $wordNamespace)
    $textNode = $Xml.CreateElement("w", "t", $wordNamespace)
    $textNode.InnerText = $Text
    [void]$run.AppendChild($textNode)
    [void]$paragraph.AppendChild($run)
    return ,$paragraph
}

function Set-WordParagraphText {
    param([xml]$Xml, [Xml.XmlElement]$Paragraph, [string]$Text)
    @($Paragraph.ChildNodes | Where-Object { $_.LocalName -ne "pPr" }) | ForEach-Object {
        [void]$Paragraph.RemoveChild($_)
    }
    $run = $Xml.CreateElement("w", "r", $wordNamespace)
    $textNode = $Xml.CreateElement("w", "t", $wordNamespace)
    $textNode.InnerText = $Text
    [void]$run.AppendChild($textNode)
    [void]$Paragraph.AppendChild($run)
}

$fileStream = [IO.File]::Open($documentPath, [IO.FileMode]::Open, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
$zip = [IO.Compression.ZipArchive]::new($fileStream, [IO.Compression.ZipArchiveMode]::Update)
try {
    $documentXml = Read-ZipXml $zip "word/document.xml"
    $namespaceManager = [Xml.XmlNamespaceManager]::new($documentXml.NameTable)
    $namespaceManager.AddNamespace("w", $wordNamespace)
    $allText = ($documentXml.SelectNodes("//w:body/w:p//w:t", $namespaceManager) | ForEach-Object { $_.InnerText }) -join " "
    $documentChanged = $false

    if ($allText -notmatch "2\.4 Test Driven Development") {
        $sections = @(
            @{ Text = "2.4 Test Driven Development"; Style = "Ttulo2" },
            @{ Text = "Test Driven Development (TDD), o desarrollo guiado por pruebas, es una práctica de ingeniería de software en la que las pruebas se escriben antes del código funcional. Su propósito es convertir los requisitos en comportamientos verificables y proporcionar retroalimentación continua durante el desarrollo."; Style = $null },
            @{ Text = "2.4.1 Fundamentos TDD"; Style = "Ttulo3" },
            @{ Text = "TDD se desarrolla mediante un ciclo breve conocido como rojo, verde y refactorización. En la fase roja se escribe una prueba que representa el comportamiento esperado y se comprueba que falle. En la fase verde se implementa el código mínimo necesario para superar la prueba. Finalmente, durante la refactorización se mejora la estructura interna del código sin modificar el comportamiento comprobado."; Style = $null },
            @{ Text = "Este enfoque favorece la claridad de los requisitos, la detección temprana de errores, el diseño modular y la prevención de regresiones. En SmartDent puede aplicarse a reglas como impedir cruces de horarios, restringir las operaciones según el rol, validar el registro de pacientes y controlar las transiciones de estado de una cita. TDD no elimina la necesidad de pruebas de integración o validaciones manuales, sino que las complementa."; Style = $null },
            @{ Text = "2.4.2 Pruebas Unitarias con JUnit"; Style = "Ttulo3" },
            @{ Text = "JUnit es un framework del ecosistema Java que permite definir y ejecutar pruebas automatizadas. JUnit 5 utiliza anotaciones como @Test para identificar casos de prueba y métodos de aserción para comparar el resultado obtenido con el esperado. Una prueba unitaria debe evaluar una unidad pequeña de código de manera aislada, ser repetible y producir resultados independientes del orden de ejecución."; Style = $null },
            @{ Text = "Cuando una clase depende de repositorios u otros servicios, Mockito puede crear objetos simulados para aislar su comportamiento. Para comprobar la interacción conjunta de controladores, seguridad, servicios y persistencia, Spring Boot proporciona @SpringBootTest y MockMvc. Estas últimas corresponden a pruebas de integración, por lo que deben distinguirse de las pruebas unitarias aunque ambas se ejecuten mediante JUnit."; Style = $null },
            @{ Text = "El backend de SmartDent cuenta actualmente con 34 pruebas automatizadas. Estas verifican autenticación JWT, permisos por rol, catálogo, usuarios, citas, disponibilidad, historias clínicas, bloqueos de agenda, configuración del paciente, costos, reportes, mensajes de contacto y documentación OpenAPI. Maven permite ejecutar el conjunto completo con el comando .\mvnw.cmd test y genera un resultado reproducible para la evidencia del proyecto."; Style = $null }
        )
        $body = $documentXml.SelectSingleNode("//w:body", $namespaceManager)
        $sectionProperties = $body.SelectSingleNode("w:sectPr", $namespaceManager)
        foreach ($section in $sections) {
            $paragraph = New-WordParagraph $documentXml $section.Text $section.Style
            if ($sectionProperties) { [void]$body.InsertBefore($paragraph, $sectionProperties) }
            else { [void]$body.AppendChild($paragraph) }
        }
        $documentChanged = $true
    }

    $testSummaryParagraph = $documentXml.SelectNodes("//w:body/w:p", $namespaceManager) | Where-Object {
        (($_.SelectNodes(".//w:t", $namespaceManager) | ForEach-Object { $_.InnerText }) -join "") -like "El backend de SmartDent cuenta actualmente con 34 pruebas automatizadas.*"
    } | Select-Object -First 1

    $updatedText = ($documentXml.SelectNodes("//w:body/w:p//w:t", $namespaceManager) | ForEach-Object { $_.InnerText }) -join " "
    if ($testSummaryParagraph -and $updatedText -notmatch "Autenticación y seguridad: registro") {
        Set-WordParagraphText $documentXml $testSummaryParagraph "En SmartDent se implementaron 34 pruebas automatizadas. La mayoría son pruebas de integración ejecutadas con JUnit, Spring Boot y MockMvc; se organizaron en los siguientes grupos:"

        $testBullets = @(
            "• Autenticación y seguridad: registro, inicio de sesión, emisión y validación de JWT, credenciales incorrectas, acceso sin token, CORS y permisos por rol.",
            "• Registro de pacientes: creación válida, cifrado de contraseñas con BCrypt y rechazo de correos o documentos duplicados.",
            "• Catálogo odontológico: consulta pública de servicios y profesionales, y administración de precios, costos, duración y disponibilidad.",
            "• Usuarios y odontólogos: listado administrativo, creación y actualización de profesionales con servicios asignados.",
            "• Gestión de citas: reserva, disponibilidad, prevención de cruces, reprogramación, cancelación y cambios de estado.",
            "• Historias clínicas: consulta por paciente, acceso restringido al odontólogo asignado y registro de diagnósticos, tratamientos e indicaciones.",
            "• Bloqueos de agenda: creación y eliminación de horarios no disponibles, además de su aplicación al cálculo de disponibilidad.",
            "• Configuración del paciente: persistencia del teléfono y de las preferencias de recordatorios.",
            "• Reportes administrativos: resumen operativo, ingresos, costos variables, costos fijos, utilidad, margen y demanda de servicios.",
            "• Mensajes de contacto: envío público, consulta administrativa y actualización del estado del mensaje.",
            "• Documentación OpenAPI: publicación de /v3/api-docs, esquema de seguridad JWT y disponibilidad de los endpoints en Swagger."
        )

        $referenceParagraph = $testSummaryParagraph
        foreach ($bullet in $testBullets) {
            $bulletParagraph = New-WordParagraph $documentXml $bullet $null
            [void]$referenceParagraph.ParentNode.InsertAfter($bulletParagraph, $referenceParagraph)
            $referenceParagraph = $bulletParagraph
        }

        $finalParagraph = New-WordParagraph $documentXml "El conjunto completo se ejecuta con .\mvnw.cmd test y actualmente finaliza con 34 pruebas aprobadas, 0 fallos y 0 errores." $null
        [void]$referenceParagraph.ParentNode.InsertAfter($finalParagraph, $referenceParagraph)
        $documentChanged = $true
    }

    if ($documentChanged) {
        Write-ZipXml $zip "word/document.xml" $documentXml
    }

    $settingsXml = Read-ZipXml $zip "word/settings.xml"
    $settingsNamespaces = [Xml.XmlNamespaceManager]::new($settingsXml.NameTable)
    $settingsNamespaces.AddNamespace("w", $wordNamespace)
    if (-not $settingsXml.SelectSingleNode("//w:updateFields", $settingsNamespaces)) {
        $updateFields = $settingsXml.CreateElement("w", "updateFields", $wordNamespace)
        [void]$updateFields.SetAttribute("val", $wordNamespace, "true")
        [void]$settingsXml.DocumentElement.AppendChild($updateFields)
        Write-ZipXml $zip "word/settings.xml" $settingsXml
    }
}
finally {
    $zip.Dispose()
    $fileStream.Dispose()
}

Write-Host "Sección 2.4 y detalle de pruebas actualizados: $documentPath"
