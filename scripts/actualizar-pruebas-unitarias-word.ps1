param(
    [string]$Documento = (Join-Path $PSScriptRoot "..\doc\SmartDent_Avance_1.docx")
)

$ErrorActionPreference = "Stop"
$documentPath = (Resolve-Path -LiteralPath $Documento).Path
$wordNamespace = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
Add-Type -AssemblyName System.IO.Compression

function Read-ZipXml {
    param([IO.Compression.ZipArchive]$Zip, [string]$EntryName)
    $entry = $Zip.GetEntry($EntryName)
    if (-not $entry) { throw "No se encontró $EntryName." }
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

function Get-ParagraphText {
    param([Xml.XmlElement]$Paragraph, [Xml.XmlNamespaceManager]$Namespaces)
    return (($Paragraph.SelectNodes(".//w:t", $Namespaces) | ForEach-Object { $_.InnerText }) -join "")
}

function Set-ParagraphText {
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

function New-Paragraph {
    param([xml]$Xml, [string]$Text)
    $paragraph = $Xml.CreateElement("w", "p", $wordNamespace)
    $run = $Xml.CreateElement("w", "r", $wordNamespace)
    $textNode = $Xml.CreateElement("w", "t", $wordNamespace)
    $textNode.InnerText = $Text
    [void]$run.AppendChild($textNode)
    [void]$paragraph.AppendChild($run)
    return ,$paragraph
}

function Set-ParagraphStartingWith {
    param([xml]$Xml, [Xml.XmlNamespaceManager]$Namespaces, [string]$Prefix, [string]$Text)
    $paragraph = $Xml.SelectNodes("//w:body/w:p", $Namespaces) | Where-Object {
        (Get-ParagraphText $_ $Namespaces).StartsWith($Prefix, [StringComparison]::Ordinal)
    } | Select-Object -First 1
    if ($paragraph) { Set-ParagraphText $Xml $paragraph $Text }
}

$stream = [IO.File]::Open($documentPath, [IO.FileMode]::Open, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
$zip = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Update)
try {
    $xml = Read-ZipXml $zip "word/document.xml"
    $ns = [Xml.XmlNamespaceManager]::new($xml.NameTable)
    $ns.AddNamespace("w", $wordNamespace)

    Set-ParagraphStartingWith $xml $ns "Maven, Git, GitHub, JUnit" "Maven, Git, GitHub, JUnit 5, Mockito y Swagger UI como herramientas de desarrollo, pruebas unitarias y documentación."
    Set-ParagraphStartingWith $xml $ns "Al cierre de esta actualización" "Al cierre de esta actualización se encuentran definidos el problema, los objetivos, el alcance y la arquitectura tecnológica. Además, existe una maquetación funcional y una API REST integrada con MariaDB, autenticación JWT y tres roles. Se implementaron la reserva y disponibilidad de citas, agendas por rol, historias clínicas, bloqueos, tarifas, reportes, configuración del paciente, mensajes de contacto y documentación Swagger. El backend cuenta con 19 pruebas unitarias satisfactorias. Angular se mantiene para un avance posterior."
    Set-ParagraphStartingWith $xml $ns "Las APIs se prueban manualmente" "Las APIs se comprueban manualmente desde Swagger UI. Las reglas de negocio se validan automáticamente mediante pruebas unitarias con JUnit 5 y Mockito, sin levantar Spring ni conectarse a MySQL."
    Set-ParagraphStartingWith $xml $ns "Cuando una clase depende de repositorios" "Cuando una clase depende de repositorios u otros componentes, Mockito permite reemplazarlos por objetos simulados. SmartDent utiliza @Mock, @InjectMocks y MockitoExtension para probar cada servicio de manera aislada, sin iniciar el contexto de Spring ni acceder a una base de datos."

    $paragraphs = @($xml.SelectNodes("//w:body/w:p", $ns))
    $summary = $paragraphs | Where-Object {
        (Get-ParagraphText $_ $ns).StartsWith("En SmartDent se implementaron", [StringComparison]::Ordinal)
    } | Select-Object -First 1
    if (-not $summary) { throw "No se encontró el resumen de pruebas del documento." }

    Set-ParagraphText $xml $summary "En SmartDent se implementaron 19 pruebas unitarias con JUnit 5 y Mockito. Todas se ejecutan de forma aislada y se organizan en los siguientes grupos:"
    $sectionParagraphs = @($xml.SelectNodes("//w:body/w:p", $ns))
    $summaryIndex = [Array]::IndexOf($sectionParagraphs, $summary)
    $final = $sectionParagraphs | Where-Object {
        (Get-ParagraphText $_ $ns).StartsWith("El conjunto completo se ejecuta", [StringComparison]::Ordinal)
    } | Select-Object -First 1
    $finalIndex = [Array]::IndexOf($sectionParagraphs, $final)
    if ($finalIndex -gt $summaryIndex) {
        for ($index = $finalIndex - 1; $index -gt $summaryIndex; $index--) {
            $paragraph = $sectionParagraphs[$index]
            if ((Get-ParagraphText $paragraph $ns).StartsWith("• ", [StringComparison]::Ordinal)) {
                [void]$paragraph.ParentNode.RemoveChild($paragraph)
            }
        }
    }

    $reference = $summary
    foreach ($bullet in @(
        "• Registro de pacientes: creación válida, normalización de datos, cifrado de contraseña y rechazo de correo o DNI duplicado.",
        "• Autenticación: generación del JWT, consulta del perfil y rechazo de usuarios inactivos o inexistentes.",
        "• CRUD de servicios: listado, creación, actualización, cambio de estado y validación de códigos duplicados o registros inexistentes.",
        "• Gestión de citas: cobro de la primera sesión, sesiones incluidas sin recobro y rechazo de domingos o cruces de horario."
    )) {
        $newParagraph = New-Paragraph $xml $bullet
        [void]$reference.ParentNode.InsertAfter($newParagraph, $reference)
        $reference = $newParagraph
    }

    if ($final) {
        Set-ParagraphText $xml $final "El conjunto completo se ejecuta con .\mvnw.cmd test y finaliza con 19 pruebas unitarias aprobadas, 0 fallos y 0 errores."
    }
    Write-ZipXml $zip "word/document.xml" $xml
}
finally {
    $zip.Dispose()
    $stream.Dispose()
}

Write-Host "Pruebas unitarias actualizadas en: $documentPath"
