from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from pygments import highlight
from pygments.formatters import ImageFormatter
from pygments.lexers import JavaLexer


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "doc" / "capturas-codigo"
FONT = r"C:\Windows\Fonts\consola.ttf"
FONT_BOLD = r"C:\Windows\Fonts\consolab.ttf"

SNIPPETS = [
    (
        "01-prueba-unitaria-login.png",
        "Prueba unitaria: inicio de sesión",
        "LoginServiceUnitTest.java · JUnit 5 + Mockito",
        '''@Test
void iniciaSesionYDevuelveTokenJwt() {
    Usuario usuario = usuarioActivo("paciente@correo.com");
    when(usuarioRepository.findByEmailIgnoreCase("paciente@correo.com"))
            .thenReturn(Optional.of(usuario));
    when(jwtService.generarToken(usuario)).thenReturn("jwt-prueba");
    when(jwtService.getExpirationSeconds()).thenReturn(3600L);

    var response = service.iniciarSesion(
            new LoginRequest(" PACIENTE@CORREO.COM ", "Clave1234"));

    verify(authenticationManager).authenticate(
            any(UsernamePasswordAuthenticationToken.class));
    assertThat(response.token()).isEqualTo("jwt-prueba");
    assertThat(response.tokenType()).isEqualTo("Bearer");
    assertThat(response.usuario().email()).isEqualTo("paciente@correo.com");
}''',
    ),
    (
        "02-prueba-unitaria-cita.png",
        "Prueba unitaria: sesión sin doble cobro",
        "CitaServiceUnitTest.java · JUnit 5 + Mockito",
        '''@Test
void segundaSesionDelMismoTratamientoNoVuelveACobrar() {
    Cita anterior = new Cita();
    anterior.setEstado(CitaEstado.ATENDIDA);
    anterior.setTratamientoCodigo("TRA-PRUEBA");
    anterior.setNumeroSesion(1);
    anterior.setTotalSesiones(4);
    when(citaRepository
            .findByPaciente_IdAndServicio_IdOrderByCreadoEnDesc(1L, 3L))
            .thenReturn(List.of(anterior));

    var cita = service.reservar("paciente@correo.com",
            request(fechaHabil(3), LocalTime.of(9, 0)));

    assertThat(cita.numeroSesion()).isEqualTo(2);
    assertThat(cita.sesionesRestantes()).isEqualTo(2);
    assertThat(cita.precioPactado()).isZero();
    assertThat(cita.tratamientoCodigo()).isEqualTo("TRA-PRUEBA");
}''',
    ),
    (
        "03-prueba-unitaria-servicio.png",
        "Prueba unitaria: creación de servicio",
        "ServicioServiceUnitTest.java · JUnit 5 + Mockito",
        '''@Test
void creaServicioNormalizandoElCodigo() {
    when(repository.save(any(Servicio.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

    var creado = service.crear(request(" srv-nuevo ", true));

    assertThat(creado.codigo()).isEqualTo("SRV-NUEVO");
    assertThat(creado.precio()).isEqualByComparingTo("120.00");
    verify(repository).save(any(Servicio.class));
}''',
    ),
]


def create_capture(filename: str, title: str, subtitle: str, code: str) -> None:
    formatter = ImageFormatter(
        font_name=FONT,
        font_size=26,
        style="github-dark",
        line_numbers=True,
        line_number_bg="#0b1220",
        line_number_fg="#64748b",
        line_number_pad=18,
        image_pad=28,
        line_pad=7,
        background_color="#0b1220",
    )
    code_image = Image.open(BytesIO(highlight(code, JavaLexer(), formatter))).convert("RGB")

    header_height = 126
    canvas = Image.new("RGB", (code_image.width, code_image.height + header_height), "#081426")
    canvas.paste(code_image, (0, header_height))
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, canvas.width, header_height), fill="#081426")
    draw.rectangle((0, header_height - 5, canvas.width, header_height), fill="#13d5df")

    for x, color in ((30, "#ff5f57"), (64, "#febc2e"), (98, "#28c840")):
        draw.ellipse((x, 25, x + 18, 43), fill=color)

    title_font = ImageFont.truetype(FONT_BOLD, 30)
    subtitle_font = ImageFont.truetype(FONT, 19)
    draw.text((30, 56), title, font=title_font, fill="#ffffff")
    draw.text((canvas.width - 30, 30), subtitle, font=subtitle_font,
              fill="#9fb4cc", anchor="ra")

    canvas.save(OUTPUT / filename, "PNG", optimize=True)


OUTPUT.mkdir(parents=True, exist_ok=True)
for item in SNIPPETS:
    create_capture(*item)

print(f"Capturas creadas en: {OUTPUT}")
for path in sorted(OUTPUT.glob("*.png")):
    print(f"- {path.name}: {path.stat().st_size} bytes")
