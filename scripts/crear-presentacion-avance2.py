from pptx import Presentation
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
from pptx.dml.color import RGBColor
from pptx.util import Inches, Pt


BASE = "SmartDent_Presentacion_Avance_1.pptx"
OUT = "SmartDent_Presentacion_Avance_2_Disenada.pptx"

NAVY = RGBColor(2, 15, 34)
GOLD = RGBColor(165, 125, 0)
CYAN = RGBColor(19, 214, 224)
BG = RGBColor(246, 248, 252)
TEXT = RGBColor(3, 18, 40)
MUTED = RGBColor(88, 109, 137)
WHITE = RGBColor(255, 255, 255)
BORDER = RGBColor(218, 226, 238)


def add_textbox(slide, x, y, w, h, text, size=22, bold=False, color=TEXT, align=PP_ALIGN.LEFT):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.02)
    tf.margin_right = Inches(0.02)
    tf.margin_top = Inches(0.02)
    tf.margin_bottom = Inches(0.02)
    tf.clear()
    p = tf.paragraphs[0]
    p.text = text
    p.alignment = align
    run = p.runs[0] if p.runs else p.add_run()
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = "Aptos"
    return box


def paragraph_box(slide, x, y, w, h, paragraphs, size=11, color=MUTED, bullet=False):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.clear()
    for i, text in enumerate(paragraphs):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = text
        p.font.size = Pt(size)
        p.font.name = "Aptos"
        p.font.color.rgb = color
        p.space_after = Pt(6)
        if bullet:
            p.level = 0
    return box


def add_title(slide, title, subtitle, n):
    add_textbox(slide, 0.72, 0.35, 7.8, 0.55, title, 30, True, NAVY)
    add_textbox(slide, 0.74, 0.95, 8.2, 0.35, subtitle, 13, False, MUTED)
    add_textbox(slide, 12.35, 0.35, 0.45, 0.3, f"{n:02}", 10, True, GOLD, PP_ALIGN.RIGHT)
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.74), Inches(1.34), Inches(11.8), Inches(0.025))
    line.fill.solid()
    line.fill.fore_color.rgb = BORDER
    line.line.fill.background()


def card(slide, x, y, w, h, title, body="", accent=GOLD):
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    shp.fill.solid()
    shp.fill.fore_color.rgb = WHITE
    shp.line.color.rgb = BORDER
    shp.line.width = Pt(1)
    top = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(0.05))
    top.fill.solid()
    top.fill.fore_color.rgb = accent
    top.line.fill.background()
    add_textbox(slide, x + 0.22, y + 0.2, w - 0.44, 0.35, title, 15, True, NAVY)
    if body:
        paragraph_box(slide, x + 0.22, y + 0.65, w - 0.44, h - 0.85, [body], 10.5, MUTED)
    return shp


def feature_card(slide, x, y, w, h, number, title, items, accent=CYAN):
    card(slide, x, y, w, h, "", "", accent)
    badge = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x + 0.22), Inches(y + 0.23), Inches(0.48), Inches(0.48))
    badge.fill.solid()
    badge.fill.fore_color.rgb = accent
    badge.line.fill.background()
    add_textbox(slide, x + 0.22, y + 0.32, 0.48, 0.18, str(number), 11, True, WHITE, PP_ALIGN.CENTER)
    add_textbox(slide, x + 0.82, y + 0.25, w - 1.0, 0.35, title, 14, True, NAVY)
    paragraph_box(slide, x + 0.34, y + 0.88, w - 0.55, h - 1.05, [f"• {item}" for item in items], 10.2, TEXT)


def process_step(slide, x, y, w, label, detail, accent=GOLD):
    circle = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x), Inches(y), Inches(0.5), Inches(0.5))
    circle.fill.solid()
    circle.fill.fore_color.rgb = accent
    circle.line.fill.background()
    add_textbox(slide, x + 0.02, y + 0.13, 0.46, 0.2, label, 9, True, WHITE, PP_ALIGN.CENTER)
    add_textbox(slide, x + 0.65, y - 0.02, w - 0.65, 0.25, detail[0], 11, True, NAVY)
    add_textbox(slide, x + 0.65, y + 0.26, w - 0.65, 0.32, detail[1], 9, False, MUTED)


def bullets(slide, x, y, w, h, items, size=13):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.clear()
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = item
        p.level = 0
        p.font.size = Pt(size)
        p.font.name = "Aptos"
        p.font.color.rgb = TEXT
        p.space_after = Pt(7)
    return box


def placeholder(slide, x, y, w, h, label):
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    shp.fill.solid()
    shp.fill.fore_color.rgb = RGBColor(251, 252, 255)
    shp.line.color.rgb = RGBColor(185, 198, 219)
    shp.line.dash_style = 2
    add_textbox(slide, x + 0.4, y + h / 2 - 0.45, w - 0.8, 0.35, label, 18, True, MUTED, PP_ALIGN.CENTER)
    add_textbox(slide, x + 0.4, y + h / 2, w - 0.8, 0.35, "Pegar aquí la imagen elaborada en el Word", 12, False, MUTED, PP_ALIGN.CENTER)


def code_card(slide, x, y, w, h, title, code):
    card(slide, x, y, w, h, title, "", CYAN)
    box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x + 0.22), Inches(y + 0.65), Inches(w - 0.44), Inches(h - 0.88))
    box.fill.solid()
    box.fill.fore_color.rgb = NAVY
    box.line.fill.background()
    tx = slide.shapes.add_textbox(Inches(x + 0.38), Inches(y + 0.8), Inches(w - 0.76), Inches(h - 1.05))
    tf = tx.text_frame
    tf.word_wrap = True
    tf.clear()
    p = tf.paragraphs[0]
    p.text = code
    p.font.size = Pt(8.2)
    p.font.name = "Consolas"
    p.font.color.rgb = WHITE


def blank_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = BG
    return slide


def update_cover(slide):
    for shape in slide.shapes:
        if hasattr(shape, "text") and "AVANCE 1" in shape.text:
            shape.text = shape.text.replace("AVANCE 1", "AVANCE 2")


prs = Presentation(BASE)
update_cover(prs.slides[0])
start = len(prs.slides) + 1

slide = blank_slide(prs)
hero = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.62), Inches(0.45), Inches(12.05), Inches(2.15))
hero.fill.solid()
hero.fill.fore_color.rgb = WHITE
hero.line.color.rgb = BORDER
bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.62), Inches(0.45), Inches(0.09), Inches(2.15))
bar.fill.solid()
bar.fill.fore_color.rgb = GOLD
bar.line.fill.background()
add_textbox(slide, 0.95, 0.72, 7.6, 0.35, "AVANCE 2", 15, True, GOLD)
add_textbox(slide, 0.95, 1.1, 8.8, 0.48, "Persistencia, seguridad y diseño del sistema", 29, True, NAVY)
add_textbox(slide, 0.98, 1.74, 10.7, 0.42, "Modelo de datos, JPA/Hibernate, CRUD, JPQL, transacciones, Spring Security, roles, JWT y evidencias de prueba.", 13.5, False, MUTED)
feature_card(slide, 0.85, 3.05, 3.55, 2.15, "01", "Modelo de datos", ["Conceptual, lógico y físico", "Relaciones del dominio odontológico", "Base para persistencia real"], CYAN)
feature_card(slide, 4.85, 3.05, 3.55, 2.15, "02", "Backend persistente", ["Entidades JPA y repositorios", "CRUD de servicios y citas", "Reglas de negocio transaccionales"], GOLD)
feature_card(slide, 8.85, 3.05, 3.55, 2.15, "03", "Seguridad web", ["JWT para autenticación", "Permisos por rol", "Rutas protegidas por contexto"], NAVY)
process_step(slide, 1.0, 5.9, 3.2, "A", ("Diseño", "Casos de uso y modelo relacional"), CYAN)
process_step(slide, 4.7, 5.9, 3.2, "B", ("Construcción", "API REST con Spring Boot"), GOLD)
process_step(slide, 8.4, 5.9, 3.2, "C", ("Validación", "Pruebas unitarias y Postman"), NAVY)
add_textbox(slide, 11.95, 6.85, 0.55, 0.25, f"{start:02}", 10, True, GOLD, PP_ALIGN.RIGHT)

for idx, name in enumerate(["Modelo conceptual", "Modelo lógico", "Modelo físico"], start=start + 1):
    slide = blank_slide(prs)
    add_title(slide, name, "Representación del diseño de datos de SmartDent", idx)
    placeholder(slide, 1.0, 1.75, 11.2, 4.7, f"Espacio para {name.lower()}")
    add_textbox(slide, 1.0, 6.55, 11.2, 0.35, "Nota: esta diapositiva queda lista para insertar la imagen final del diagrama.", 11, False, MUTED, PP_ALIGN.CENTER)

slide = blank_slide(prs)
add_title(slide, "Persistencia con JPA/Hibernate y CRUD", "El backend separa entidades, repositorios, servicios y controladores", start + 4)
feature_card(slide, 0.85, 1.65, 3.45, 2.05, "01", "JPA", ["Mapea clases Java a tablas", "Define relaciones entre entidades", "Evita trabajar SQL manual repetitivo"], CYAN)
feature_card(slide, 0.85, 4.0, 3.45, 2.05, "02", "Hibernate", ["Implementa JPA en ejecución", "Genera SQL según entidades", "Sincroniza cambios con la BD"], GOLD)
feature_card(slide, 4.6, 1.65, 2.95, 4.4, "03", "CRUD", ["Crear servicios y usuarios", "Consultar citas e historias", "Actualizar estados y costos", "Desactivar registros sin borrar"], NAVY)
code_card(slide, 7.85, 1.65, 4.45, 4.4, "Código clave", "@Entity\n@Table(name = \"servicios\")\nclass Servicio {\n  @Id @GeneratedValue\n  Long id;\n\n  @Column(unique = true)\n  String codigo;\n  String nombre;\n  BigDecimal precio;\n}\n\ninterface ServicioRepository\n  extends JpaRepository<Servicio, Long> {\n  Optional<Servicio> findByCodigo(String codigo);\n}")

slide = blank_slide(prs)
add_title(slide, "JPQL y transacciones", "Consultas orientadas a entidades y operaciones seguras de negocio", start + 5)
card(slide, 0.8, 1.55, 3.15, 4.45, "¿Para qué sirve JPQL?", "", CYAN)
paragraph_box(slide, 1.05, 2.1, 2.65, 3.35, [
    "• Consulta entidades Java, no tablas directamente.",
    "• Mantiene el código alineado al modelo de dominio.",
    "• Se usa para agenda, filtros por estado y reportes."
], 11.5, TEXT)
code_card(slide, 4.25, 1.55, 3.95, 4.45, "Consulta JPQL", "@Query(\"\"\"\n select c from Cita c\n where c.odontologo.id = :id\n and c.estado <> 'CANCELADA'\n order by c.fechaHora asc\n\"\"\")\nList<Cita> buscarAgenda(Long id);")
code_card(slide, 8.5, 1.55, 3.8, 4.45, "Transacción", "@Transactional\npublic Cita registrarCita(SolicitudCita dto) {\n  validarDisponibilidad(dto);\n  aplicarReglaDePago(dto);\n  return citaRepository.save(cita);\n}")
add_textbox(slide, 1.0, 6.25, 10.9, 0.42, "Si ocurre un error durante una reserva o atención clínica, la transacción evita guardar datos incompletos.", 13.2, True, NAVY, PP_ALIGN.CENTER)

slide = blank_slide(prs)
add_title(slide, "Seguridad web: Spring Security y JWT", "Acceso protegido según el rol del usuario autenticado", start + 6)
feature_card(slide, 0.65, 1.6, 3.75, 3.35, "01", "PACIENTE", ["Crear cuenta e iniciar sesión", "Reservar, cancelar y reprogramar citas", "Consultar historial clínico propio"], CYAN)
feature_card(slide, 4.75, 1.6, 3.75, 3.35, "02", "ODONTÓLOGO", ["Ver agenda asignada", "Gestionar pacientes atendidos", "Registrar diagnóstico e indicaciones"], GOLD)
feature_card(slide, 8.85, 1.6, 3.75, 3.35, "03", "ADMIN", ["Administrar usuarios y servicios", "Ver agenda global y reportes", "Controlar costos y estado de citas"], NAVY)
flow = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(5.35), Inches(11.1), Inches(0.78))
flow.fill.solid()
flow.fill.fore_color.rgb = WHITE
flow.line.color.rgb = BORDER
add_textbox(slide, 1.25, 5.52, 2.0, 0.25, "Login", 12, True, NAVY, PP_ALIGN.CENTER)
add_textbox(slide, 3.65, 5.52, 2.0, 0.25, "JWT", 12, True, GOLD, PP_ALIGN.CENTER)
add_textbox(slide, 6.05, 5.52, 2.0, 0.25, "Filtro Security", 12, True, NAVY, PP_ALIGN.CENTER)
add_textbox(slide, 8.65, 5.52, 2.7, 0.25, "Endpoint protegido", 12, True, CYAN, PP_ALIGN.CENTER)
add_textbox(slide, 1.05, 6.35, 11.0, 0.34, "El token viaja en Authorization: Bearer <token> y Spring Security valida rol y permisos antes de ejecutar la API.", 11.8, False, MUTED, PP_ALIGN.CENTER)

slide = blank_slide(prs)
add_title(slide, "Pruebas y evidencias", "Validación del backend y comprobación de endpoints REST", start + 7)
feature_card(slide, 0.8, 1.6, 3.45, 2.15, "01", "JUnit + Mockito", ["Servicios probados de forma aislada", "Sin levantar todo Spring", "Sin depender de MySQL"], CYAN)
feature_card(slide, 0.8, 4.05, 3.45, 2.15, "02", "Postman", ["Login y registro", "Servicios y reservas", "Rutas protegidas por rol"], GOLD)
feature_card(slide, 4.55, 1.6, 3.0, 4.6, "03", "Casos clave", ["Registro de pacientes", "Autenticación JWT", "CRUD de servicios", "Citas sin doble cobro", "Cruce de horarios"], NAVY)
code_card(slide, 7.9, 1.6, 4.35, 4.6, "Resultado de pruebas", "cd backend\nmvn test\n\nTests run: 19\nFailures: 0\nErrors: 0\nSkipped: 0\n\nEstado: APROBADO")

slide = blank_slide(prs)
add_title(slide, "Resultados del Avance 2", "Lo logrado frente a lo planificado", start + 8)
feature_card(slide, 0.8, 1.55, 3.6, 3.45, "✓", "Logrado", ["Persistencia real con JPA/Hibernate", "CRUD y reglas de negocio implementadas", "JWT, roles y endpoints protegidos", "Pruebas unitarias aprobadas"], CYAN)
feature_card(slide, 4.85, 1.55, 3.6, 3.45, "!", "Dificultades", ["Sincronizar frontend con API real", "Evitar doble cobro por sesiones", "Ordenar permisos por rol", "Documentar evidencias técnicas"], GOLD)
feature_card(slide, 8.9, 1.55, 3.6, 3.45, "→", "Próximos pasos", ["Migración gradual a Angular", "Mejorar reportes administrativos", "Ampliar pruebas de endpoints", "Preparar despliegue final"], NAVY)
banner = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(5.75), Inches(11.1), Inches(0.75))
banner.fill.solid()
banner.fill.fore_color.rgb = NAVY
banner.line.fill.background()
add_textbox(slide, 1.25, 5.98, 10.6, 0.28, "SmartDent queda con una base backend sólida para continuar hacia una aplicación web integrada y desacoplada.", 13.5, True, WHITE, PP_ALIGN.CENTER)

prs.save(OUT)
print(OUT)
