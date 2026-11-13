# Cartagena Libre

Juego 3D de mundo abierto ambientado en Cartagena, hecho con three.js. Funciona directo en el navegador, sin instalar nada.

**Jugar:** https://alejodv2904.github.io/welcome-to-cartagena/

Controles: WASD para moverse; P para el celular; el mouse mueve la cámara (clic en el juego para capturarlo); F para entrar o salir de vehículos y locales, aceptar encargos y subir al Transcaribe en sus estaciones; T para pedir taxi, mototaxi o buseta; M para el mapa de Cartagena; ESC para el menú (guardar y cargar partida).

Al subirte a un taxi, mototaxi o buseta puedes ir a cualquier barrio de la ciudad, a los sitios y centros comerciales o a tu casa: escribe el nombre en el buscador del menú y presiona Enter (o el número del destino).

Truco: escribe **DINERO** con el teclado (sin estar escribiendo en un buscador) y el dinero va subiendo hasta sumar $ 1.000.000; cada vez que lo vuelvas a escribir te suman otro millón.

En las tiendas: acércate a un producto (neveras, mostrador, estantes) y presiona F para echarlo a la canasta; paga con F en la caja. Lo que compras de comer o tomar queda en la mochila: presiona B para tomártelo. X devuelve la canasta. Si sales sin pagar, es robo y te busca la policía.

## La ciudad completa

- **Toda Cartagena:** además del Centro, Getsemaní, Manga, Bocagrande y La Popa (con datos reales de OpenStreetMap), se puede recorrer el resto de la ciudad: Crespo y el aeropuerto, La Boquilla, la Ciénaga de la Virgen, Olaya Herrera, El Pozón, Las Gaviotas, Los Ejecutivos, Ternera, Blas de Lezo, Nelson Mandela, hasta Mamonal. Esos barrios se generan a partir de la geografía aproximada de la ciudad (`ciudad.js`): costa, ciénaga, avenidas principales y barrios con su población. Las casas, locales y postes se construyen por bloques cerca del jugador.
- **1.500.000 habitantes** repartidos por barrio: el recuadro de zona muestra los habitantes del barrio donde estás y el mapa grande los muestra todos. La cantidad de gente en la calle depende del tipo de barrio.
- **Transcaribe** por toda la Avenida Pedro de Heredia hasta el Portal, con 17 estaciones.
- **Mapa (M)** de toda la ciudad con símbolos: tiendas y locales, centros comerciales, paraderos de bus, estaciones de Transcaribe, CAI de la Policía, hospitales y centros de salud, gasolineras, aeropuerto y terminal, iglesias, parques, playas y encargos. Toca un símbolo de la leyenda para mostrarlo u ocultarlo.
- **Policía en moto:** las patrullas son motos verdes con dos policías, y hay muchas: andan por los alrededores y pasan a cada rato.
- **Mototaxis por todas partes:** más o menos uno de cada cuatro vehículos de la calle es un mototaxi, y la mayoría lleva un pasajero atrás. En las carreras en moto, tu pasajero también va sentado atrás.
- **Todos los vehículos llevan conductor:** de cerca se ven las personas sentadas; de lejos, las motos y bicicletas muestran a su conductor (y al de atrás).
- **Semáforos y cebras:** los cruces de avenidas y vías principales tienen semáforo y paso de cebra en cada esquina. Los carros paran antes de la cebra y los peatones solo cruzan por ella cuando el semáforo se lo permite (ya no se atraviesan a mitad de cuadra). En cada semáforo cercano hay un agente de tránsito de pie dirigiendo.
- **Cruces sin semáforo:** los carros pasan una calle a la vez, así no se atraviesan unos con otros, y giran en curva por la esquina.
- **Choques:** los vehículos chocan con su forma real y quedan abollados donde se golpearon (se rompen las luces si el golpe es fuerte). Si chocas un carro, llega un agente de tránsito, escucha a los dos conductores y la multa ($ 600.000) es para el vehículo que golpeó por detrás; si te golpearon a ti, el otro te paga los daños. Si te vas antes, te busca la policía.
- **Trancones:** los carros ya no se quedan trabados en los cruces; si se arma un trancón cerca, llega un agente de tránsito en su moto y da paso a los carros hasta despejarlo.
- **Noche iluminada:** ventanas encendidas, postes de luz en todas las calles y el resplandor de la ciudad.
- **Más encargos** por toda la ciudad: domicilios, carreras en taxi y en mototaxi, trasteos (en camión o camioneta) y piques (pasar por varios puntos de la ciudad contra el tiempo).
- **Tu casa** entre Los Caracoles y El Carmelo (casa amarilla con el letrero "Mi casa", con su símbolo en el mapa): entra con F; en la cama puedes dormir hasta el otro día, echar una siesta o guardar la partida, y en la nevera hay comida y bebida gratis.
- **Vehículos en la loma:** carros, motos y buses se inclinan con la subida de La Popa y las calles del cerro siguen la pendiente, así que ya no se meten dentro de la vía. Conductor y pasajeros van sentados dentro de la cabina.
- **Rutas más cortas:** los taxis, mototaxis y busetas eligen el andén del destino al que llegan más rápido, y Crespo tiene su vía directa al aeropuerto (Calle 70), así que de la India Catalina al aeropuerto ya no dan la vuelta por La Popa y La María.

## La ciudad real

- **Barrios:** la zona que ves arriba a la izquierda sale de los límites reales de los barrios (OpenStreetMap).
- **Lugares reales:** bancos, cajeros, bares, discotecas, restaurantes, cafés, farmacias, supermercados, hoteles, universidades, talleres, clínicas, gimnasios y centros comerciales aparecen con su nombre y en su ubicación real. Se puede entrar a todos.
- **Horarios:** el día dura 48 minutos (cada minuto del juego son 2 segundos). Los bancos abren de 8:00 a.m. a 4:00 p.m., las discotecas de 9:00 p.m. a 4:00 a.m. (con cover), los bares desde las 4:00 p.m., y así.
- **Bancos:** con el asesor abres tu cuenta de ahorros (incluye tarjeta débito), pides préstamos o sacas un certificado; en la caja consignas y retiras. Si te arresta la policía, solo pierdes parte del efectivo, no lo que tienes en el banco.
- **Cajeros (F):** retira con tu tarjeta (cuota de $ 7.300 en cajeros de otro banco), deposita en los de tu banco, y en los cajeros Bancolombia saca o mete plata de Nequi.
- **Celular (P):** Nequi, la app de tu banco, Uber, DiDi, Lugares (los lugares reales más cercanos por categoría, con GPS), Mapa y Teléfono. Si no te alcanza el efectivo, en las tiendas se paga con Nequi o con la tarjeta.
- **Uber y DiDi:** eliges el destino, ves la tarifa fija, escoges cómo pagar (efectivo, Nequi o tarjeta) y un carro particular viene por ti.
- **Otros:** en el hotel duermes hasta las 7:00 a.m.; en la universidad te matriculas y, después de 8 clases, te gradúas (los encargos te pagan 25% más); en el gimnasio subes el aguante; en la discoteca bailas en la pista (F); llega manejando a la puerta de un taller y presiona F para reparar el vehículo.
- **Gente:** cada persona se viste distinto: hinchas con la camiseta de la Selección (algunos con la bandera), camisas de flores, rayas, cuadros, camuflado, bermudas, ropa deportiva, gafas de sol, cadenas, gorras al revés, mayores con guayabera o vestido de flores, y niños por las calles y jugando en las plazas. El protagonista va de buzo negro de manga larga, pantalón negro holgado, tenis grises, barba, pelo corto y bolso terciado.
- **Personajes más realistas:** los hombres sin sombrero tienen pelo (rapado, corto o afro) en vez de verse calvos, los jeans tienen textura de tela de jean y toda la ropa lleva un tejido fino para que no se vea plana.
- **Perros y gatos:** perros criollos repartidos por la ciudad que deambulan, se echan y mueven la cola (ninguno te sigue); gatos que se sientan en los andenes y salen corriendo si te acercas.
- **Mapa ampliado (M):** además de los símbolos de la ciudad, todos los lugares reales aparecen con su icono; la lista de la derecha muestra u oculta cada tipo, y al hacer clic en un lugar queda marcado en el GPS. En las tiendas de ropa venden la camiseta de la Selección, camisas de flores, bermudas, chanclas y gafas.
- **Truco de la plata:** escribe `DINERO` mientras juegas, o marca `75282` (P-L-A-T-A) en el Teléfono del celular. Suma $ 1.000.000 contando de a pesos.

Para actualizar los barrios y lugares desde OpenStreetMap: `node herramientas/lugares-osm.js` (regenera `lugares.js`). Datos © colaboradores de OpenStreetMap, licencia ODbL. Nequi, Uber, DiDi y los bancos son marcas de sus dueños.
