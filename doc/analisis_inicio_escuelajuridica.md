# Reporte de Análisis de Diseño: Página de Inicio Principal (Escuela Jurídica)

He realizado la evaluación de diseño de la **página de inicio principal** ([https://escuelajuridica.edu.pe/](https://escuelajuridica.edu.pe/)) a partir de las capturas capturadas para escritorio y móvil.

---

## 📸 Capturas de Pantalla (Página de Inicio)

````carousel
![Inicio Desktop - Cabecera](C:/Users/kelvi/.gemini/antigravity-ide/brain/bf90c3ef-4815-42c4-a70a-e06e4f9bb9dc/main_landing_desktop_1787846420299.png)
<!-- slide -->
![Inicio Desktop - Cursos y Grilla](C:/Users/kelvi/.gemini/antigravity-ide/brain/bf90c3ef-4815-42c4-a70a-e06e4f9bb9dc/landing_middle_desktop_1787846446474.png)
<!-- slide -->
![Inicio Desktop - Programas Zoom](C:/Users/kelvi/.gemini/antigravity-ide/brain/bf90c3ef-4815-42c4-a70a-e06e4f9bb9dc/landing_zoom_courses_desktop_1787846509031.png)
<!-- slide -->
![Inicio Desktop - Testimoniales y Footer](C:/Users/kelvi/.gemini/antigravity-ide/brain/bf90c3ef-4815-42c4-a70a-e06e4f9bb9dc/landing_testimonials_desktop_1787846540896.png)
<!-- slide -->
![Inicio Móvil - Vista Inicial](C:/Users/kelvi/.gemini/antigravity-ide/brain/bf90c3ef-4815-42c4-a70a-e06e4f9bb9dc/main_landing_mobile_1787846695726.png)
<!-- slide -->
![Inicio Móvil - Menú Hamburguesa Abierto](C:/Users/kelvi/.gemini/antigravity-ide/brain/bf90c3ef-4815-42c4-a70a-e06e4f9bb9dc/mobile_menu_open_1787846811801.png)
````

---

## 🔍 Puntos Débiles de Diseño y Usabilidad Identificados

### 1. Sobrecarga de Información y Ruido Visual
* **Falta de espaciado blanco (Negative Space):** Las secciones y tarjetas de cursos están extremadamente juntas, lo que satura la vista y dificulta distinguir dónde termina una sección y dónde empieza otra.
* **Múltiples Banners y Carruceles:** En la cabecera e inicio, el uso de banners con textos muy largos y fuentes condensadas compite por la atención del usuario sin un claro **Call to Action (CTA)** primario.

### 2. Jerarquía y Consistencia Tipográfica
* **Estilos tipográficos discordantes:** Se mezclan fuentes con diferentes pesos y serifas en un espacio reducido. Además, se abusa del texto en mayúsculas en bloques largos, lo cual ralentiza la lectura y resulta agresivo visualmente.
* **Contraste de texto sobre imágenes:** En los banners del slider principal, hay texto blanco sobre fondos de imágenes con zonas claras, lo que hace que partes del texto sean ilegibles.

### 3. Usabilidad en Dispositivos Móviles (Responsive)
> [!IMPORTANT]
> **Menú hamburguesa problemático:**
> En la versión móvil, al abrir el menú hamburguesa, la lista de enlaces cubre una gran parte de la pantalla con una tipografía muy pequeña y poco espacio táctil (touch target) entre elementos, lo que propicia clics accidentales.
* **Tarjetas no adaptadas óptimamente:** Las grillas de cursos se apilan de forma infinita hacia abajo en móvil, haciendo que el usuario tenga que realizar scroll vertical excesivo (más de 10 pantallas) para llegar al pie de página.

### 4. Coherencia en Paleta de Colores
* Al igual que en el Aula Virtual, conviven demasiados colores primarios e independientes (ginda, azul, verde de WhatsApp, naranja de badges) sin una guía de estilo unificada. Esto reduce la percepción de seriedad y profesionalismo del sitio.

---

## 💡 Recomendaciones de Rediseño Rápido

1. **Aumentar el Padding/Margen:** Añadir al menos `80px` de espacio vertical entre secciones principales para dejar "respirar" el diseño.
2. **Botón Único de Acción (Hero CTA):** Definir un único botón principal en el primer banner (por ejemplo, "Ver Programas Activos") con un color de alto contraste (como el dorado de la marca).
3. **Optimizar Móvil:** Implementar un carrusel horizontal (swipe) para las tarjetas de cursos en dispositivos móviles en lugar de apilarlas todas verticalmente.
