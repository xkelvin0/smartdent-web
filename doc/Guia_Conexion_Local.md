# Guía para Exposición en Grupo (Conexión Local)

Esta guía te salvará la vida si necesitas que tus compañeros se conecten a tu servidor local de SmartDent desde sus propias laptops o celulares el día de la presentación.

## Escenario: Exposición en la Universidad (Sin Internet o con Red Bloqueada)

Dado que las redes de las universidades suelen bloquear la conexión entre computadoras, la solución infalible es crear tu propia red Wi-Fi desde tu laptop.

### Paso 1: Crear la red (El anfitrión)
1. En tu laptop (la que tiene XAMPP y el código), entra a Configuración de Windows > **Zona con cobertura inalámbrica móvil** (Mobile Hotspot).
2. Actívalo. (Ponle un nombre fácil, ej. `SmartDent-Local` y una contraseña).
3. Pide a tus compañeros que se conecten a ese Wi-Fi desde sus laptops o celulares.

### Paso 2: Averiguar tu IP
1. En tu laptop, abre la consola (busca `cmd` en el menú inicio).
2. Escribe el comando `ipconfig` y presiona Enter.
3. Busca el adaptador que corresponda a tu Zona Inalámbrica (suele decir *Conexión de área local* y su IP casi siempre es `192.168.137.1`).
4. Anota esa dirección IPv4.

### Paso 3: Levantar el servidor
1. Asegúrate de tener **XAMPP abierto** (Apache y MySQL en Start).
2. Abre la terminal en la carpeta `backend` y corre el Spring Boot: `mvn spring-boot:run`
3. Abre tu VS Code en la carpeta `maquetacion-html`, haz clic derecho en `index.html` y dale a **Open con Live Server**. (El Live Server suele abrir en el puerto `5500`).

### Paso 4: ¡Que entren todos!
Diles a tus compañeros que abran Google Chrome en sus máquinas y escriban tu IP seguida del puerto del Live Server.
* **Link definitivo (Usando tu Punto Wi-Fi):** `http://192.168.137.1:5500`
  *(Por defecto, cuando compartes internet desde Windows, la laptop siempre se pone la IP 192.168.137.1. Si por alguna razón extraña no les carga, corres el comando `ipconfig` en la terminal y buscas la que diga "Conexión de área local" para confirmar la IP).*

---
### ¿Qué pasa si quiero trabajar yo solo en mi cuarto (Modo Tradicional)?
**¡Todo va a funcionar perfectamente!**
Las modificaciones que hicimos en tu código son "inteligentes". 
* Si tú abres tu Live Server de la manera normal (`http://127.0.0.1:5500` o `localhost:5500`), el JavaScript se dará cuenta y conectará con tu backend en `localhost:8080` como siempre lo ha hecho. 
* Tu código original no se rompió, solo se le **añadió** el superpoder de detectar también redes Wi-Fi (cualquier IP `192.168.x.x`).
