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
            @{ Text = "Este enfoque favorece la claridad de los requisitos, la detección temprana de errores, el diseño modular y la prevención de regresiones. En SmartDent se aplica a reglas como impedir cruces de horarios, validar el registro de pacientes y controlar las sesiones de un tratamiento."; Style = $null },
            @{ Text = "2.4.2 Pruebas Unitarias con JUnit"; Style = "Ttulo3" },
            @{ Text = "JUnit es un framework del ecosistema Java que permite definir y ejecutar pruebas automatizadas. JUnit 5 utiliza anotaciones como @Test para identificar casos de prueba y métodos de aserción para comparar el resultado obtenido con el esperado. Una prueba unitaria debe evaluar una unidad pequeña de código de manera aislada, ser repetible y producir resultados independientes del orden de ejecución."; Style = $null },
            @{ Text = "Cuando una clase depende de repositorios u otros componentes, Mockito permite reemplazarlos por objetos simulados. SmartDent utiliza @Mock, @InjectMocks y MockitoExtension para probar cada servicio sin iniciar Spring ni acceder a una base de datos."; Style = $null },
            @{ Text = "El backend de SmartDent cuenta con 19 pruebas unitarias que verifican registro, autenticación, CRUD de servicios y reglas de citas. Maven permite ejecutarlas con el comando .\mvnw.cmd test."; Style = $null }
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
        (($_.SelectNodes(".//w:t", $namespaceManager) | ForEach-Object { $_.InnerText }) -join "") -like "El backend de SmartDent cuenta con 19 pruebas unitarias.*"
    } | Select-Object -First 1

    $updatedText = ($documentXml.SelectNodes("//w:body/w:p//w:t", $namespaceManager) | ForEach-Object { $_.InnerText }) -join " "
    if ($testSummaryParagraph -and $updatedText -notmatch "Autenticación y seguridad: registro") {
        Set-WordParagraphText $documentXml $testSummaryParagraph "En SmartDent se implementaron 19 pruebas unitarias con JUnit 5 y Mockito, sin iniciar Spring ni conectarse a una base de datos; se organizaron en los siguientes grupos:"

        $testBullets = @(
            "• Registro de pacientes: creación válida, normalización, cifrado y rechazo de duplicados.",
            "• Autenticación: generación del JWT, consulta de perfil y rechazo de usuarios no disponibles.",
            "• CRUD de servicios: listado, creación, actualización, estado y validaciones.",
            "• Gestión de citas: cobro por sesiones y rechazo de fechas u horarios inválidos."
        )

        $referenceParagraph = $testSummaryParagraph
        foreach ($bullet in $testBullets) {
            $bulletParagraph = New-WordParagraph $documentXml $bullet $null
            [void]$referenceParagraph.ParentNode.InsertAfter($bulletParagraph, $referenceParagraph)
            $referenceParagraph = $bulletParagraph
        }

        $finalParagraph = New-WordParagraph $documentXml "El conjunto completo se ejecuta con .\mvnw.cmd test y finaliza con 19 pruebas unitarias aprobadas, 0 fallos y 0 errores." $null
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
