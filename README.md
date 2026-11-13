# Cartagena Libre

Juego 3D de mundo abierto ambientado en Cartagena, hecho con three.js. Funciona directo en el navegador, sin instalar nada.

**Jugar:** https://alejodv2904.github.io/welcome-to-cartagena/

Controles: WASD para moverse; el mouse mueve la cámara (clic en el juego para capturarlo); F para entrar o salir de vehículos y locales, aceptar encargos y subir al Transcaribe en sus estaciones; T para pedir taxi, mototaxi o buseta; M para el mapa de Cartagena; ESC para el menú (guardar y cargar partida).

Al subirte a un taxi, mototaxi o buseta puedes ir a cualquier barrio de la ciudad, a los sitios y centros comerciales o a tu casa: escribe el nombre en el buscador del menú y presiona Enter (o el número del destino).

Truco: escribe **DINERO** con el teclado (sin estar escribiendo en un buscador) y te suman $ 1.000.000; cada vez que lo vuelvas a escribir te suman otro millón.

En las tiendas: acércate a un producto (neveras, mostrador, estantes) y presiona F para echarlo a la canasta; paga con F en la caja. Lo que compras de comer o tomar queda en la mochila: presiona B para tomártelo. X devuelve la canasta. Si sales sin pagar, es robo y te busca la policía.

## La ciudad completa

- **Toda Cartagena:** además del Centro, Getsemaní, Manga, Bocagrande y La Popa (con datos reales de OpenStreetMap), se puede recorrer el resto de la ciudad: Crespo y el aeropuerto, La Boquilla, la Ciénaga de la Virgen, Olaya Herrera, El Pozón, Las Gaviotas, Los Ejecutivos, Ternera, Blas de Lezo, Nelson Mandela, hasta Mamonal. Esos barrios se generan a partir de la geografía aproximada de la ciudad (`ciudad.js`): costa, ciénaga, avenidas principales y barrios con su población. Las casas, locales y postes se construyen por bloques cerca del jugador.
- **1.500.000 habitantes** repartidos por barrio: el recuadro de zona muestra los habitantes del barrio donde estás y el mapa grande los muestra todos. La cantidad de gente en la calle depende del tipo de barrio.
- **Transcaribe** por toda la Avenida Pedro de Heredia hasta el Portal, con 17 estaciones.
- **Mapa (M)** de toda la ciudad con símbolos: tiendas y locales, centros comerciales, paraderos de bus, estaciones de Transcaribe, CAI de la Policía, hospitales y centros de salud, gasolineras, aeropuerto y terminal, iglesias, parques, playas y encargos. Toca un símbolo de la leyenda para mostrarlo u ocultarlo.
- **Policía en moto:** las patrullas son motos verdes con dos policías.
- **Trancones:** los carros ya no se quedan trabados en los cruces; si se arma un trancón cerca, llega un agente de tránsito en su moto y da paso a los carros hasta despejarlo.
- **Noche iluminada:** ventanas encendidas, postes de luz en todas las calles y el resplandor de la ciudad.
- **Más encargos** por toda la ciudad: domicilios, carreras en taxi y en mototaxi, trasteos (en camión o camioneta) y piques (pasar por varios puntos de la ciudad contra el tiempo).
- **Tu casa** entre Los Caracoles y El Carmelo (casa amarilla con el letrero "Mi casa", con su símbolo en el mapa): entra con F; en la cama puedes dormir hasta el otro día, echar una siesta o guardar la partida, y en la nevera hay comida y bebida gratis.
- **Vehículos en la loma:** carros, motos y buses se inclinan con la subida de La Popa y las calles del cerro siguen la pendiente, así que ya no se meten dentro de la vía. Conductor y pasajeros van sentados dentro de la cabina.
- **Rutas más cortas:** los taxis, mototaxis y busetas eligen el andén del destino al que llegan más rápido, y Crespo tiene su vía directa al aeropuerto (Calle 70), así que de la India Catalina al aeropuerto ya no dan la vuelta por La Popa y La María.
