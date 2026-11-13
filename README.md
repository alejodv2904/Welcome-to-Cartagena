# Cartagena Libre

Juego 3D de mundo abierto ambientado en Cartagena, hecho con three.js. Funciona directo en el navegador, sin instalar nada.

**Jugar:** https://alejodv2904.github.io/welcome-to-cartagena/

Controles: WASD para moverse; P para el celular; el mouse mueve la cámara (clic en el juego para capturarlo); F para entrar o salir de vehículos y locales, aceptar encargos y subir al Transcaribe en sus estaciones; T para pedir taxi, mototaxi o buseta; M para el mapa de Cartagena; ESC para el menú (guardar y cargar partida).

En las tiendas: acércate a un producto (neveras, mostrador, estantes) y presiona F para echarlo a la canasta; paga con F en la caja. Lo que compras de comer o tomar queda en la mochila: presiona B para tomártelo. X devuelve la canasta. Si sales sin pagar, es robo y te busca la policía.

## La ciudad real

- **Barrios:** la zona que ves arriba a la izquierda sale de los límites reales de los barrios (OpenStreetMap).
- **Lugares reales:** bancos, cajeros, bares, discotecas, restaurantes, cafés, farmacias, supermercados, hoteles, universidades, talleres, clínicas, gimnasios y centros comerciales aparecen con su nombre y en su ubicación real. Se puede entrar a todos.
- **Horarios:** el día dura 24 minutos (cada segundo es un minuto del juego). Los bancos abren de 8:00 a.m. a 4:00 p.m., las discotecas de 9:00 p.m. a 4:00 a.m. (con cover), los bares desde las 4:00 p.m., y así.
- **Bancos:** con el asesor abres tu cuenta de ahorros (incluye tarjeta débito), pides préstamos o sacas un certificado; en la caja consignas y retiras. Si te arresta la policía, solo pierdes parte del efectivo, no lo que tienes en el banco.
- **Cajeros (F):** retira con tu tarjeta (cuota de $ 7.300 en cajeros de otro banco), deposita en los de tu banco, y en los cajeros Bancolombia saca o mete plata de Nequi.
- **Celular (P):** Nequi, la app de tu banco, Uber, DiDi, Lugares (los lugares reales más cercanos por categoría, con GPS), Mapa y Teléfono. Si no te alcanza el efectivo, en las tiendas se paga con Nequi o con la tarjeta.
- **Uber y DiDi:** eliges el destino, ves la tarifa fija, escoges cómo pagar (efectivo, Nequi o tarjeta) y un carro particular viene por ti.
- **Otros:** en el hotel duermes hasta las 7:00 a.m.; en la universidad te matriculas y, después de 8 clases, te gradúas (los encargos te pagan 25% más); en el gimnasio subes el aguante; en la discoteca bailas en la pista (F); llega manejando a la puerta de un taller y presiona F para reparar el vehículo.
- **Gente:** cada persona se viste distinto: hinchas con la camiseta de la Selección (algunos con la bandera), camisas de flores, rayas, cuadros, camuflado, bermudas, ropa deportiva, gafas de sol, cadenas, gorras al revés, mayores con guayabera o vestido de flores, y niños por las calles y jugando en las plazas. El protagonista va de buzo negro de manga larga, pantalón negro holgado, tenis grises, gorra rosada, barba y bolso terciado.
- **Perros y gatos:** perros criollos repartidos por la ciudad que deambulan, se echan y mueven la cola (ninguno te sigue); gatos que se sientan en los andenes y salen corriendo si te acercas.
- **Mapa ampliado (M):** todos los lugares aparecen con su icono; la lista de la derecha muestra u oculta cada tipo, y al hacer clic en un lugar queda marcado en el GPS. En las tiendas de ropa venden la camiseta de la Selección, camisas de flores, bermudas, chanclas y gafas.
- **Truco de la plata:** escribe `LUKAS` mientras juegas, o marca `75282` (P-L-A-T-A) en el Teléfono del celular. Suma $ 1.000.000 contando de a pesos.

Para actualizar los barrios y lugares desde OpenStreetMap: `node herramientas/lugares-osm.js` (regenera `lugares.js`). Datos © colaboradores de OpenStreetMap, licencia ODbL. Nequi, Uber, DiDi y los bancos son marcas de sus dueños.
