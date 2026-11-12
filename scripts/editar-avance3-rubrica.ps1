$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root = Split-Path $PSScriptRoot
$source = Join-Path $root 'SmartDent_Presentacion_Avance_2.pptx'
$dest = Join-Path $root 'SmartDent_Presentacion_Avance_3.pptx'
$z = [IO.Compression.ZipFile]::OpenRead($source)
$parts = @{}
foreach($e in $z.Entries) { $m=[IO.MemoryStream]::new(); $s=$e.Open(); $s.CopyTo($m); $s.Dispose(); $parts[$e.FullName]=$m.ToArray(); $m.Dispose() }
$z.Dispose()
function ReadPart($name) { [Text.Encoding]::UTF8.GetString($parts[$name]) }
function PutPart($name,$value) { $parts[$name]=[Text.Encoding]::UTF8.GetBytes($value) }
function XmlText($xml) { $xml.OuterXml -replace '^<\?xml[^>]*\?>','' }
function ReplaceTexts($xml,$map) {
    foreach($t in $xml.GetElementsByTagName('a:t')) { if($map.ContainsKey($t.InnerText)) { $t.InnerText=$map[$t.InnerText] } }
}
$original=@{}; $rels=@{}
foreach($i in 1..17) { $original[$i]=ReadPart "ppt/slides/slide$i.xml"; $rels[$i]=ReadPart "ppt/slides/_rels/slide$i.xml.rels" }
$slides=[Collections.Generic.List[object]]::new()
function Existing($i,$map=@{}) {
    [xml]$x=$original[$i]; ReplaceTexts $x $map
    $slides.Add(@{Xml=$x; Rels=$rels[$i]; Original=$i})
}
function Cards($title,$subtitle,$headings,$bodies,$flow,$caption) {
    [xml]$x=$original[15]
    $texts=@($x.GetElementsByTagName('a:t'))
    $values=@($title,$subtitle,'00','01',$headings[0],$bodies[0][0],$bodies[0][1],$bodies[0][2],'02',$headings[1],$bodies[1][0],$bodies[1][1],$bodies[1][2],'03',$headings[2],$bodies[2][0],$bodies[2][1],$bodies[2][2],$flow[0],$flow[1],$flow[2],$flow[3],$caption)
    if($texts.Count -ne $values.Count) {throw 'Plantilla inesperada'}
    for($j=0;$j -lt $texts.Count;$j++) {$texts[$j].InnerText=[string]$values[$j]}
    foreach($sp in $x.GetElementsByTagName('p:sp')) {
        $ts=@($sp.GetElementsByTagName('a:t'))
        if($ts.Count -and $ts[0].InnerText -eq $title) {foreach($r in $sp.GetElementsByTagName('a:rPr')) {$r.SetAttribute('sz','2200')}}
    }
    $slides.Add(@{Xml=$x;Rels=$rels[15]})
}
Existing 1 @{'Avance 1 · Desarrollo Web Integrado'='Avance 3 · Desarrollo Web Integrado'}
Existing 2 @{'Stack utilizado en el prototipo funcional'='Stack implementado en la aplicación integrada';'HTML5'='Angular 19';'Estructura web'='SPA Standalone';'CSS3'='CSS de componentes';'Estilos globales'='Estilos encapsulados';'JavaScript'='TypeScript 5.7';'Interacción y API'='Signals y HTTP'}
Existing 3
Existing 4
Existing 5 @{'HTML · Tailwind CSS · JavaScript'='Angular 19 · TypeScript · Tailwind CSS'}
Existing 6
Existing 7
Existing 8
Existing 9 @{'AVANCE 2'='BACKEND';'• Conceptual, lógico y físico'='• Modelo físico y diccionario';'Modelo de datos, JPA/Hibernate, CRUD, JPQL, transacciones, Spring Security, roles, JWT y evidencias de prueba.'='Modelo físico, diccionario de datos, JPA/Hibernate, CRUD, JPQL, transacciones y seguridad con Spring Security y JWT.'}
Existing 12
# El modelo físico conserva todos sus elementos y su relación con la imagen original.
[xml]$dict=$original[7]
$dt=@($dict.GetElementsByTagName('a:t'))
$dv=@('Base de datos: Diccionario de Datos','Rubro 2 · Campos clave según las entidades JPA · Tipos de MariaDB','11','usuarios',"id BIGINT PK; rol_id BIGINT FK → roles`nnombre_completo VARCHAR(120)`ndni VARCHAR(15) UQ; email VARCHAR(150) UQ`npassword_hash VARCHAR(100)",'odontologos',"id BIGINT PK; usuario_id BIGINT FK → usuarios`ncodigo VARCHAR(40) UQ`nespecialidad VARCHAR(100)`ncolegiatura VARCHAR(30) UQ",'citas',"id BIGINT PK; paciente_id BIGINT FK → usuarios`nodontologo_id BIGINT FK; servicio_id BIGINT FK`nfecha DATE; hora_inicio / hora_fin TIME`nprecio_pactado DECIMAL(10,2)",'historias_clinicas',"id BIGINT PK; paciente_id BIGINT FK → usuarios`nodontologo_id BIGINT FK → odontologos`nultima_cita_id BIGINT FK → citas`ndiagnostico / tratamiento VARCHAR(2500)",'servicios',"id BIGINT PK; codigo VARCHAR(40) UQ`nnombre VARCHAR(120); duracion_minutos INT`nprecio / costo DECIMAL(10,2)`nsesiones_incluidas INT",'CLAVES Y RELACIONES',"PK: identificador; FK: referencia; UQ: único`ncitas.odontologo_id → odontologos.id`ncitas.servicio_id → servicios.id`nhistorias_clinicas.odontologo_id → odontologos.id",'Alcance: ','resumen de las cinco tablas principales.    ','Auditoría: ','creado_en / actualizado_en: DATETIME, según entidad.','DESARROLLO WEB INTEGRADO · SMARTDENT','11')
if($dt.Count -ne $dv.Count) {throw "Diccionario: $($dt.Count) vs $($dv.Count)"}
for($j=0;$j -lt $dt.Count;$j++) {$dt[$j].InnerText=$dv[$j]}
foreach($sp in $dict.GetElementsByTagName('p:sp')) {
    $ts=@($sp.GetElementsByTagName('a:t'))
    if($ts.Count -and $ts[0].InnerText.Contains('BIGINT') -or ($ts.Count -and $ts[0].InnerText.StartsWith('PK:'))) {
        foreach($r in $sp.GetElementsByTagName('a:rPr')) {$r.SetAttribute('sz','1050')}
        foreach($ex in $sp.GetElementsByTagName('a:ext')) {if([long]$ex.GetAttribute('cy') -lt 1000000) {$ex.SetAttribute('cy','1050000')}}
    }
}
$slides.Add(@{Xml=$dict;Rels=$rels[7]})
Existing 13
Existing 14
Existing 15
Cards 'Angular: componentes y conexión con la API' 'Rubro 3 · Angular 19 Standalone y comunicación frontend–backend' @('COMPONENTES','SERVICIO WEB','HTTP Y SEGURIDAD') @(@('• ng generate component nombre','• Standalone: imports por componente','• Organización: core, shared, features'),@('• SmartDentApiService centraliza la API','• HttpClient con DTO tipados','• Observable: petición y respuesta JSON'),@('• provideHttpClient(withFetch())','• jwtInterceptor agrega Bearer JWT','• Proxy /api → Spring Boot :8080')) @('Componente','ApiService','HTTP / JSON','Spring Boot') 'Configuración real: withInterceptors([jwtInterceptor]); proxy hacia http://127.0.0.1:8080/api.'
Cards 'Aplicación de estilos en Angular' 'Rubro 4 · Identidad visual corporativa y diseño responsivo' @('TAILWIND CSS 3.4','TOKENS Y TIPOGRAFÍA','COMPONENTES') @(@('• Clases de layout, espaciado y color','• Breakpoints para móvil y escritorio','• Referencia visual: 375–1440 px'),@('• navy: #071426; gold: #8a6d00','• gold-soft: #f4d77d','• Escala de títulos, cuerpo y etiquetas'),@('• Estilos locales encapsulados','• sd-status-badge: color según estado','• UI compartida para los tres roles')) @('Tokens','Utilidades','Componente','Vista adaptable') 'tailwind.config.js define la paleta y la escala tipográfica; los componentes reutilizan la misma identidad.'
Cards 'Sistema de rutas de Angular' 'Rubro 5 · app.routes.ts, carga diferida y control de navegación' @('RUTAS Y CARGA','GUARDS','PARÁMETROS') @(@('• app.routes.ts define el árbol de rutas','• loadComponent: página bajo demanda','• loadChildren: rutas por cada rol'),@('• authGuard: sesión válida','• guestGuard: acceso de visitantes','• roleGuard: permiso según rol'),@('• withComponentInputBinding()','• Parámetros de URL como inputs','• Panel de paciente, odontólogo y admin')) @('URL','authGuard','roleGuard','Página lazy') 'Los guards controlan la navegación; Spring Security también verifica la autorización en cada endpoint.'
Cards 'Comunicación entre componentes' 'Rubro 6 · Datos, eventos y estado compartido mediante Signals' @('PADRE → HIJO','HIJO → PADRE','ESTADO COMPARTIDO') @(@('• Signal input() para recibir datos','• sd-field-error: [control]="campo"','• sd-status-badge: [status]="estado"'),@('• Eventos enlazados con (evento)','• El padre ejecuta la acción asociada','• Patrón: output() y .emit(valor)'),@('• AuthStore: sesión y usuario','• NotificationStore: lista y contador','• ToastStore: avisos compartidos')) @('Datos ↓','Componente','Eventos ↑','Stores') 'Ejemplos reales: inputs y stores. Patrón output(): referencia de diseño; notificaciones mediante polling cada 8 s.'
Cards 'Procesamiento de formularios' 'Rubro 7 · Formularios reactivos tipados y flujo clínico multisesión' @('CONSTRUCCIÓN','ENLACE Y ENVÍO','FLUJO CLÍNICO') @(@('• ReactiveFormsModule','• NonNullableFormBuilder','• Controles y validadores tipados'),@('• [formGroup] conecta el formulario','• formControlName enlaza cada campo','• getRawValue() construye el DTO'),@('• Diagnóstico, tratamiento e indicaciones','• Registro por sesión del tratamiento','• Historial y seguimiento del paciente')) @('Formulario','Validar','DTO tipado','API / historial') 'Flujo: completar → validar → enviar con SmartDentApiService → actualizar el expediente y mostrar confirmación.'
Cards 'Manejo de errores y validación de datos' 'Rubro 8 · Validación en cliente, errores HTTP y respuesta del servidor' @('SMARTDENTVALIDATORS','ERRORES HTTP','SERVIDOR Y PRUEBAS') @(@('• dniPeru y telefono','• fechaLaborable y rangoHorario','• confirmarPassword entre controles'),@('• 400: datos de entrada inválidos','• 409: duplicidad o conflicto','• 422: regla de negocio incumplida'),@('• applyServerValidationErrors()','• GlobalExceptionHandler en backend','• Suites disponibles: Vitest y JUnit')) @('Validar','Enviar','Capturar error','Mostrar mensaje') 'Los errores del servidor se asocian al formulario; sd-field-error presenta mensajes al usuario junto al campo.'
Existing 17 @{'Resultados del Avance 2'='Conclusiones de los Avances 1, 2 y 3';'Persistencia, seguridad y diseño implementados en el backend.'='Del análisis inicial a la integración de la plataforma odontológica.';'Modelo de datos conceptual, lógico y físico documentado.'='Avance 1: problema, objetivos, roles y arquitectura definidos.';'Persistencia real con JPA/Hibernate y base relacional.'='Avance 2: persistencia JPA/Hibernate sobre MariaDB.';'CRUD funcional para servicios, citas, usuarios y roles.'='Avance 2: API REST, CRUD y seguridad JWT por rol.';'JPQL y transacciones aplicadas a reglas de negocio.'='Avance 3: Angular 19 Standalone y servicios HTTP tipados.';'Spring Security + JWT con permisos por rol.'='Avance 3: rutas protegidas, Signals y estilos responsivos.';'19 pruebas unitarias aprobadas con JUnit y Mockito.'='Avance 3: formularios reactivos y validación en dos capas.';'PRÓXIMOS PASOS'='LOGROS CONSOLIDADOS';'Migrar progresivamente el frontend a Angular.'='Frontend Angular integrado con Spring Boot.';'Ampliar pruebas de endpoints con Postman.'='Modelo físico y diccionario de datos documentados.';'Mejorar reportes administrativos y gráficos.'='Expediente clínico y seguimiento multisesión.';'Preparar el despliegue final del sistema.'='Pruebas automatizadas disponibles en frontend y backend.';'SmartDent queda listo para continuar hacia una aplicación web integrada y escalable.'='SmartDent integra citas, atención clínica y administración en una plataforma con acceso por rol.'}
if($slides.Count -ne 21) {throw 'Cantidad incorrecta'}
[xml]$pres=ReadPart 'ppt/presentation.xml'
$list=$pres.GetElementsByTagName('p:sldIdLst')[0]; $list.RemoveAll()
[xml]$pr=ReadPart 'ppt/_rels/presentation.xml.rels'
foreach($r in @($pr.DocumentElement.ChildNodes)) {if($r.Type -like '*/slide') {[void]$pr.DocumentElement.RemoveChild($r)}}
[xml]$ct=ReadPart '[Content_Types].xml'
for($j=0;$j -lt $slides.Count;$j++) {
    $n=$j+1; $item=$slides[$j]; $x=$item.Xml
    if($true) {
        foreach($sp in $x.GetElementsByTagName('p:sp')) {
            $ts=@($sp.GetElementsByTagName('a:t'))
            if($ts.Count -eq 1 -and $ts[0].InnerText -match '^\d{1,2}$') {
                $off=$sp.GetElementsByTagName('a:off')[0]
                if($off -and ([long]$off.GetAttribute('x') -gt 10000000 -or [long]$off.GetAttribute('y') -gt 6000000)) {$ts[0].InnerText=('{0:00}' -f $n)}
            }
        }
    }
    PutPart "ppt/slides/slide$n.xml" (XmlText $x)
    [xml]$sr=$item.Rels
    foreach($r in @($sr.DocumentElement.ChildNodes)) {if($r.Type -like '*/notesSlide') {[void]$sr.DocumentElement.RemoveChild($r)}}
    PutPart "ppt/slides/_rels/slide$n.xml.rels" (XmlText $sr)
    $rid="rIdRubrica$n"
    $r=$pr.CreateElement('Relationship',$pr.DocumentElement.NamespaceURI); $r.SetAttribute('Id',$rid); $r.SetAttribute('Type','http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide'); $r.SetAttribute('Target',"slides/slide$n.xml"); [void]$pr.DocumentElement.AppendChild($r)
    $s=$pres.CreateElement('p','sldId',$list.NamespaceURI); $s.SetAttribute('id',[string](256+$n)); $s.SetAttribute('id','http://schemas.openxmlformats.org/officeDocument/2006/relationships',$rid); [void]$list.AppendChild($s)
    if(-not @($ct.DocumentElement.ChildNodes | Where-Object {$_.PartName -eq "/ppt/slides/slide$n.xml"}).Count) {$o=$ct.CreateElement('Override',$ct.DocumentElement.NamespaceURI);$o.SetAttribute('PartName',"/ppt/slides/slide$n.xml");$o.SetAttribute('ContentType','application/vnd.openxmlformats-officedocument.presentationml.slide+xml');[void]$ct.DocumentElement.AppendChild($o)}
}
PutPart 'ppt/presentation.xml' (XmlText $pres)
PutPart 'ppt/_rels/presentation.xml.rels' (XmlText $pr)
PutPart '[Content_Types].xml' (XmlText $ct)
if(Test-Path -LiteralPath $dest) {Copy-Item -LiteralPath $dest -Destination ($dest -replace '\.pptx$',('_respaldo_'+(Get-Date -Format 'yyyyMMdd_HHmmss')+'.pptx'))}
$temp=Join-Path $root 'SmartDent_Avance3_revision.tmp'
$fs=[IO.File]::Open($temp,[IO.FileMode]::Create)
$out=[IO.Compression.ZipArchive]::new($fs,[IO.Compression.ZipArchiveMode]::Create)
foreach($name in $parts.Keys) {$entry=$out.CreateEntry($name);$s=$entry.Open();$s.Write($parts[$name],0,$parts[$name].Length);$s.Dispose()}
$out.Dispose();$fs.Dispose()
Move-Item -LiteralPath $temp -Destination $dest -Force
Write-Output "Generado: $dest (21 diapositivas)"
