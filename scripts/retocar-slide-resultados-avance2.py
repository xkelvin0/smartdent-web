from pptx import Presentation
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
from pptx.dml.color import RGBColor
from pptx.util import Inches, Pt
from pathlib import Path

ppt = Path('SmartDent_Presentacion_Avance_2_Disenada.pptx')
prs = Presentation(str(ppt))
slide = prs.slides[-1]

for shape in list(slide.shapes):
    sp = shape._element
    sp.getparent().remove(sp)

NAVY = RGBColor(2, 15, 34)
NAVY2 = RGBColor(0, 9, 25)
GOLD = RGBColor(226, 183, 24)
CYAN = RGBColor(19, 214, 224)
WHITE = RGBColor(255, 255, 255)
MUTED_LIGHT = RGBColor(207, 218, 232)
TEXT = RGBColor(3, 18, 40)
MUTED_DARK = RGBColor(86, 105, 132)

slide.background.fill.solid()
slide.background.fill.fore_color.rgb = NAVY
bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.08))
bar.fill.solid(); bar.fill.fore_color.rgb = CYAN; bar.line.fill.background()


def add_text(x, y, w, h, text, size=18, bold=False, color=WHITE, align=PP_ALIGN.LEFT):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.01)
    tf.margin_right = Inches(0.01)
    tf.margin_top = Inches(0.01)
    tf.margin_bottom = Inches(0.01)
    tf.clear()
    p = tf.paragraphs[0]
    p.text = text
    p.alignment = align
    run = p.runs[0] if p.runs else p.add_run()
    run.font.name = 'Aptos'
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    return box

logo_tooth = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.72), Inches(0.43), Inches(0.48), Inches(0.55))
logo_tooth.fill.solid(); logo_tooth.fill.fore_color.rgb = WHITE; logo_tooth.line.fill.background()
add_text(1.28, 0.52, 1.7, 0.28, 'Smart', 21, True, CYAN)
add_text(2.10, 0.52, 1.3, 0.28, 'Dent', 21, True, RGBColor(9, 31, 69))

add_text(0.78, 1.45, 5.7, 0.48, 'Resultados del Avance 2', 30, True, WHITE)
add_text(0.8, 2.1, 6.0, 0.35, 'Persistencia, seguridad y diseño implementados en el backend.', 15, False, MUTED_LIGHT)

left_items = [
    'Modelo de datos conceptual, lógico y físico documentado.',
    'Persistencia real con JPA/Hibernate y base relacional.',
    'CRUD funcional para servicios, citas, usuarios y roles.',
    'JPQL y transacciones aplicadas a reglas de negocio.',
    'Spring Security + JWT con permisos por rol.',
    '19 pruebas unitarias aprobadas con JUnit y Mockito.'
]
y = 2.95
for item in left_items:
    dot = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(0.86), Inches(y + 0.06), Inches(0.12), Inches(0.12))
    dot.fill.solid(); dot.fill.fore_color.rgb = GOLD; dot.line.fill.background()
    add_text(1.14, y, 5.4, 0.28, item, 12.2, False, WHITE)
    y += 0.46

card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.05), Inches(1.08), Inches(5.55), Inches(5.05))
card.fill.solid(); card.fill.fore_color.rgb = WHITE; card.line.fill.background()
add_text(7.55, 1.68, 2.6, 0.3, 'PRÓXIMOS PASOS', 12, True, GOLD)
steps = [
    'Migrar progresivamente el frontend a Angular.',
    'Ampliar pruebas de endpoints con Postman.',
    'Mejorar reportes administrativos y gráficos.',
    'Preparar el despliegue final del sistema.'
]
y = 2.24
for step in steps:
    dot = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(7.54), Inches(y + 0.04), Inches(0.13), Inches(0.13))
    dot.fill.solid(); dot.fill.fore_color.rgb = CYAN; dot.line.fill.background()
    add_text(7.84, y - 0.02, 4.15, 0.42, step, 12.0, False, TEXT)
    y += 0.62

line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(7.55), Inches(4.92), Inches(3.85), Inches(0.06))
line.fill.solid(); line.fill.fore_color.rgb = GOLD; line.line.fill.background()
add_text(7.55, 5.28, 2.2, 0.35, 'Gracias', 21, True, TEXT)
add_text(7.56, 5.72, 1.6, 0.25, '¿Preguntas?', 11.5, False, MUTED_DARK)

ribbon = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.78), Inches(6.32), Inches(6.1), Inches(0.54))
ribbon.fill.solid(); ribbon.fill.fore_color.rgb = NAVY2; ribbon.line.fill.background()
add_text(1.0, 6.48, 5.7, 0.22, 'SmartDent queda listo para continuar hacia una aplicación web integrada y escalable.', 11.2, True, WHITE, PP_ALIGN.CENTER)

add_text(12.65, 6.9, 0.35, 0.2, '23', 8.5, False, MUTED_LIGHT, PP_ALIGN.RIGHT)

prs.save(str(ppt))
print(ppt)
