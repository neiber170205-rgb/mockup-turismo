/* Ruta Toche · datos de la app (fase 1)
 * Lugares: los 10 sitios del avance de investigación del 27 de octubre de 2026
 * («Patrimonio histórico y cultural de San José de Cúcuta»). refs = fuentes de la ficha.
 * Coordenadas: [latitud, longitud].
 * precision: 'verificada'  -> tomada de una fuente con coordenadas (ver "fuente").
 *            'aproximada'  -> calculada desde la dirección; la app intenta afinarla con OpenStreetMap.
 *            null coords   -> se ubica solo si OpenStreetMap la encuentra (consulta en vivo).
 */
window.RT_DATA = (function () {
  'use strict';

  var CATEGORIES = {
    historia:   { label: 'Historia',    color: '#C8102E', tint: '#FCEBEE', icon: 'landmark' },
    cultural:   { label: 'Cultural',    color: '#6D28D9', tint: '#F1EBFD', icon: 'palette' },
    gastronomia:{ label: 'Gastronomía', color: '#B45309', tint: '#FEF3E2', icon: 'utensils' },
    religioso:  { label: 'Religioso',   color: '#86198F', tint: '#FAE8FB', icon: 'church' },
    naturaleza: { label: 'Naturaleza',  color: '#166534', tint: '#E8F5EC', icon: 'tree' },
    servicios:  { label: 'Servicio de ayuda', color: '#1C1917', tint: '#F1EEE9', icon: 'help' }
  };

  var PLACES = [
    {
      id: "zulima", name: "Teatro Zulima", cat: "cultural", thumb: "zulima",
      coords: [7.8876, -72.50378], precision: "osm",
      fuente: "OpenStreetMap: Teatro Zulima.",
      address: "Avenida 5.ª entre calles 9 y 10", area: "Centro de Cúcuta",
      tipo: "Cultural", decl: "BIC departamental (2005)",
      timeline: [
        { year: "1954", text: "Abrió como sala de cine el 17 de septiembre." },
        { year: "2005", text: "La Fundación Cerámica Italia lo recibe en comodato. Ese año se declara bien de interés cultural departamental." },
        { year: "2009", text: "Renovado por el arquitecto Arturo Cogollo, reabre el 14 de abril con 704 sillas." }
      ],
      facts: ["Abrió como cine en 1954.", "Se renovó y reabrió en 2009, con 704 sillas."],
      refs: "El Tiempo (2010); Figueroa (2022). Solo hay fuentes de prensa.",
      verificar: "Su única foto histórica (años 50) tiene derechos reservados: falta el permiso de Cucutanuestra.com.",
      photo: { hoy: false, antes: false, antesYear: null, hoyCred: null, antesCred: null },
      next: "parque"
    },
    {
      id: "parque", name: "Parque Santander", cat: "historia", thumb: "parque",
      coords: [7.8863, -72.50428], precision: "osm",
      fuente: "OpenStreetMap: Parque Santander.",
      address: "Entre calles 10 y 11 y avenidas 5.ª y 6.ª", area: "Centro de Cúcuta",
      tipo: "Espacio público", decl: "No figura como BIC nacional",
      timeline: [
        { year: "1875", text: "El plan de reconstrucción tras el terremoto ya incluía el parque." },
        { year: "1893", text: "El 7 de agosto se inauguró la estatua de Santander, fundida en Hamburgo y pagada por suscripción popular." },
        { year: "1956", text: "Aquí se recibió al primer obispo de Cúcuta." }
      ],
      facts: ["Está entre las calles 10 y 11 y las avenidas 5.ª y 6.ª.", "La estatua de Santander se fundió en Hamburgo y se pagó entre los ciudadanos."],
      refs: "La Opinión (2021); Díaz Umaña et al. (2021).",
      verificar: "Medina fecha la estatua en 1892: hay un año de diferencia por resolver.",
      photo: { hoy: true, antes: true, antesYear: "1893", hoyCred: "Ruben Valero, 2014 · CC BY-SA 3.0", antesCred: "Estatua de Santander (1893) · dominio público" },
      next: "catedral"
    },
    {
      id: "catedral", name: "Catedral de San José", cat: "religioso", thumb: "catedral",
      coords: [7.88631, -72.50369], precision: "verificada",
      fuente: "Código Plus 67V9VFPW+GG (GCatholic).",
      address: "Frente al Parque Santander", area: "Centro de Cúcuta",
      tipo: "Religioso y arquitectónico", decl: "No figura como BIC nacional",
      timeline: [
        { year: "1734", text: "Se creó la parroquia de San José." },
        { year: "1875", text: "El terremoto del 18 de mayo destruyó el templo. Solo quedaron el reloj, parado a las 11:15 a. m., y la estatua de San José." },
        { year: "1889", text: "El 12 de mayo se puso la primera piedra del nuevo templo." },
        { year: "1956", text: "Se convirtió en catedral al crearse la Diócesis de Cúcuta." }
      ],
      facts: ["El terremoto de 1875 destruyó el primer templo.", "Su reloj quedó detenido a las 11:15 de la mañana."],
      refs: "Díaz Umaña et al. (2021).",
      verificar: null,
      photo: { hoy: true, antes: true, antesYear: "1874", hoyCred: "EEIM, 2021 · CC BY-SA 4.0", antesCred: "Iglesia de San José (1874) · dominio público" },
      next: "gobernacion"
    },
    {
      id: "gobernacion", name: "Palacio de la Gobernación", cat: "historia", thumb: "gobernacion",
      coords: [7.88328, -72.50284], precision: "osm",
      fuente: "OpenStreetMap: Gobernación de Norte de Santander.",
      address: "Avenida 5 con calle 14", area: "Centro de Cúcuta",
      tipo: "Arquitectónico e institucional", decl: "BIC nacional · Resolución 13 de 2005",
      timeline: [
        { year: "1914", text: "Empieza la obra, con proyecto del ingeniero Marco A. Gómez." },
        { year: "1915", text: "La cúpula achatada que le da el nombre sale de Nueva York el 9 de junio." },
        { year: "1989", text: "Un incendio destruye las estructuras de madera el 2 de octubre." },
        { year: "1993", text: "Restaurado, se entrega a la comunidad el 19 de noviembre." }
      ],
      facts: ["La llaman Cúpula Chata por su cúpula achatada, traída de Nueva York.", "Un incendio la dañó en 1989 y se restauró en 1993."],
      refs: "Gobernación de Norte de Santander (s. f.); Ministerio de Cultura (2024).",
      verificar: "La fecha de inauguración varía entre fuentes (1918, 1919 o 1940).",
      photo: { hoy: true, antes: false, antesYear: null, hoyCred: "Losmanesdeldrone, 2020 · CC BY-SA 4.0", antesCred: null },
      next: "torre"
    },
    {
      id: "torre", name: "Casa Torre del Reloj", cat: "cultural", thumb: "torre",
      coords: [7.88405, -72.50174], precision: "verificada",
      fuente: "OpenStreetMap. Calle 13 entre Av. 3 y 4.",
      address: "Calle 13 n.º 3-67", area: "Centro de Cúcuta",
      tipo: "Arquitectónico y cultural", decl: "BIC nacional · Resolución 1260 de 2003",
      timeline: [
        { year: "1910", text: "Se construye la casa. Fue vivienda hasta 1917." },
        { year: "1923", text: "La compra la Compañía Eléctrica del Norte para su sede." },
        { year: "1930", text: "Se agrega la torre de 27 m. El reloj, hecho en Turín, tocaba el himno nacional." },
        { year: "1960", text: "Pasa a ser casa de la cultura." }
      ],
      facts: ["La torre mide unos 27 metros.", "El reloj se hizo en Turín y tocaba el himno nacional."],
      refs: "Coronel-Ruiz et al. (2022).",
      verificar: "Las fotos antiguas (1900–1930) tienen derechos reservados.",
      photo: { hoy: true, antes: false, antesYear: null, hoyCred: "EEIM, 2018 · CC BY-SA 4.0", antesCred: null },
      next: "victoria"
    },
    {
      id: "victoria", name: "Parque La Victoria (Parque Colón)", cat: "historia", thumb: "victoria",
      coords: [7.88485, -72.50082], precision: "osm",
      fuente: "OpenStreetMap: Parque Colón.",
      address: "Calle 13, centro", area: "Centro de Cúcuta",
      tipo: "Espacio público y conmemorativo", decl: "No figura como BIC nacional",
      timeline: [
        { year: "1882", text: "El Acuerdo 12 le da el nombre de Cristóbal Colón." },
        { year: "1910", text: "Se inaugura oficialmente." },
        { year: "1919", text: "Pasa a llamarse Parque de la Victoria. El 7 de agosto se inaugura la estatua de Olinto Marcucci sobre una columna de 13 m." }
      ],
      facts: ["El Parque Colón y el Parque La Victoria son el mismo lugar.", "La estatua de la Victoria está sobre una columna de 13 metros."],
      refs: "La Opinión (2025, 2021).",
      verificar: null,
      photo: { hoy: true, antes: false, antesYear: null, hoyCred: "EEIM, 2021 · CC BY-SA 4.0", antesCred: null },
      next: "biblioteca"
    },
    {
      id: "biblioteca", name: "Biblioteca Julio Pérez Ferrero", cat: "cultural", thumb: "biblioteca",
      coords: [7.88507, -72.49981], precision: "verificada",
      fuente: "OpenStreetMap: Biblioteca Pública Julio Pérez Ferrero.",
      address: "Avenida 2.ª entre calles 12 y 13", area: "Centro de Cúcuta",
      tipo: "Cultural y arquitectónico", decl: "BIC nacional · Resolución 0500 de 2003",
      timeline: [
        { year: "1803", text: "Una Real Cédula ordena fundar el Hospital San Juan de Dios." },
        { year: "1875", text: "El terremoto lo destruye y mueren los 32 enfermos internados. Se reconstruye en 1877." },
        { year: "2000", text: "Restaurado, abre como biblioteca pública el 21 de diciembre." }
      ],
      facts: ["El edificio fue el Hospital San Juan de Dios.", "Abrió como biblioteca en el año 2000."],
      refs: "Medina (s. f.); Pastrana Arango (2000); Maldonado Pérez (2019).",
      verificar: null,
      photo: { hoy: true, antes: true, antesYear: "1910", hoyCred: "Ruben Valero, 2014 · CC BY-SA 3.0", antesCred: "Hospital San Juan de Dios (c. 1910) · dominio público" },
      next: "quinta"
    },
    {
      id: "quinta", name: "Quinta Teresa", cat: "cultural", thumb: "quinta",
      coords: [7.88179, -72.50139], precision: "osm",
      fuente: "OpenStreetMap: Quinta Teresa.",
      address: "Calle 16 n.º 3-60", area: "Centro de Cúcuta",
      tipo: "Arquitectura civil y cultural", decl: "BIC nacional · Decreto 2007 de 1996",
      timeline: [
        { year: "1893", text: "La construye Domingo Díaz para Cristian Andresen y Teresa Briceño, de quien toma el nombre." },
        { year: "1926", text: "Teresa Briceño la vende al departamento, que instala un colegio." },
        { year: "2015", text: "Restaurada, se entrega el 6 de febrero. Hoy es centro cultural." }
      ],
      facts: ["Lleva el nombre de Teresa Briceño.", "Hoy es centro cultural."],
      refs: "Radio Nacional de Colombia (2015); La Opinión (2023).",
      verificar: "Medina fecha la venta en 1914: falta verificarlo en la escritura.",
      photo: { hoy: true, antes: false, antesYear: null, hoyCred: "EEIM, 2017 · CC BY-SA 4.0", antesCred: null },
      next: "cristo"
    },
    {
      id: "cristo", name: "Monumento a Cristo Rey", cat: "religioso", thumb: "cristo",
      coords: [7.87705, -72.50092], precision: "osm",
      fuente: "OpenStreetMap: Monumento a Cristo Rey.",
      address: "Cerro de la Santa Cruz, La Cabrera", area: "La Cabrera",
      tipo: "Religioso y paisajístico", decl: "No figura como BIC nacional",
      timeline: [
        { year: "1908", text: "Los vecinos del barrio El Caimán ponen una cruz de madera en el cerro." },
        { year: "1942", text: "Ocho mujeres forman la junta pro-monumento." },
        { year: "1947", text: "Empieza la obra, dirigida por el escultor Marco León Mariño." }
      ],
      facts: ["Está en lo alto del Cerro de la Santa Cruz, en La Cabrera.", "Lo hizo el escultor Marco León Mariño."],
      refs: "Avendaño (s. f., citado en Vílchez, 2019).",
      verificar: "No hay estudios académicos: la información viene de prensa.",
      photo: { hoy: true, antes: false, antesYear: null, hoyCred: "Ruben Valero, 2014 · CC BY-SA 3.0", antesCred: null },
      next: null
    },
    {
      id: "columna", name: "Columna de Bolívar", cat: "historia", thumb: "columna",
      coords: [7.89107, -72.51744], precision: "aproximada",
      fuente: "Monumento sin nombre en OpenStreetMap junto a la Loma de Bolívar.",
      address: "Loma de Bolívar", area: "Loma de Bolívar",
      tipo: "Histórico y conmemorativo", decl: "No figura como BIC nacional",
      timeline: [
        { year: "1813", text: "Según la tradición, aquí se libró la Batalla de Cúcuta el 28 de febrero." },
        { year: "1883", text: "Se levanta la columna por el centenario del nacimiento de Bolívar." },
        { year: "1921", text: "Desde ese año, el desfile del 28 de febrero termina en el monumento." }
      ],
      facts: ["Recuerda la Batalla de Cúcuta del 28 de febrero de 1813.", "Se levantó en 1883."],
      refs: "La Opinión (2019); Oliveros (2020).",
      verificar: null,
      photo: { hoy: true, antes: true, antesYear: "1910", hoyCred: "EEIM, 2016 · CC BY-SA 4.0", antesCred: "Monumento a la Batalla de Cúcuta (c. 1910) · dominio público" },
      next: null
    },
    {
      id: "patios", name: "Corredor de Los Patios", cat: "gastronomia", thumb: "patios",
      coords: [7.8333, -72.5167], precision: "aproximada",
      fuente: "Centro de Los Patios (Wikipedia: 7°50′N 72°31′O). Es una zona, no un punto.",
      address: "Municipio de Los Patios", area: "Los Patios",
      tipo: "Zona gastronómica", decl: "Zona, no es un bien patrimonial",
      timeline: [
        { year: "Hoy", text: "Corredor vial metropolitano con oferta gastronómica local." }
      ],
      facts: ["Une a Cúcuta con el sur del área metropolitana.", "Buen lugar para probar comida típica."],
      refs: "Guía de rutas y seguridad (nov 2026).",
      verificar: "Falta definir qué tramo del corredor se recomienda.",
      photo: { hoy: false, antes: false, antesYear: null, hoyCred: null, antesCred: null },
      next: null
    },
    {
      id: "bagatela", name: "La Bagatela", cat: "historia", thumb: "bagatela",
      coords: [7.8293, -72.463], precision: "aproximada",
      fuente: "En el Parque Gran Colombiano, cerca del Templo Histórico (posición aproximada).",
      address: "Parque Gran Colombiano", area: "Villa del Rosario",
      tipo: "Histórico", decl: "Por verificar",
      timeline: [
        { year: "1821", text: "Casona colonial que sirvió de sede del gobierno durante el Congreso de Cúcuta." },
        { year: "1971", text: "La reconstruyó el Ministerio de Obras Públicas." }
      ],
      facts: ["Fue sede del gobierno durante el Congreso de 1821.", "Hace parte del complejo histórico del Parque Gran Colombiano."],
      refs: "Guía de rutas y seguridad (nov 2026); Wikipedia: House of the Bagatela.",
      verificar: "Confirmar con una fuente académica: no está en el avance del 27 de octubre.",
      photo: { hoy: false, antes: false, antesYear: null, hoyCred: null, antesCred: null },
      next: null
    },
    {
      id: "casa", name: "Casa Natal de Santander", cat: "historia", thumb: "casa",
      coords: [7.8285, -72.4622], precision: "aproximada",
      fuente: "En el Parque Gran Colombiano, junto al Templo Histórico (posición aproximada).",
      address: "Parque Gran Colombiano", area: "Villa del Rosario",
      tipo: "Histórico", decl: "Por verificar",
      timeline: [
        { year: "1792", text: "Aquí nació Francisco de Paula Santander." },
        { year: "Hoy", text: "Casa museo dentro del parque histórico." }
      ],
      facts: ["Santander es conocido como el Hombre de las Leyes.", "La guía la llama Casa del Altillo."],
      refs: "Guía de rutas y seguridad (nov 2026).",
      verificar: "No está en el avance del 27 de octubre: falta la ficha de investigación.",
      photo: { hoy: false, antes: false, antesYear: null, hoyCred: null, antesCred: null },
      next: null
    },
    {
      id: "templo", name: "Templo Histórico y Parque Gran Colombiano", cat: "historia", thumb: "templo",
      coords: [7.82889, -72.46278], precision: "verificada",
      fuente: "Wikipedia: Historic church of Cúcuta (7°49′44″N 72°27′46″O).",
      address: "Parque Gran Colombiano, autopista internacional", area: "Villa del Rosario",
      tipo: "Histórico", decl: "Por verificar",
      timeline: [
        { year: "1821", text: "Aquí sesionó el Congreso de Cúcuta y se aprobó la Constitución de la Gran Colombia." },
        { year: "1875", text: "El terremoto lo dejó en ruinas; se conservan sus restos." }
      ],
      facts: ["Es el punto final de la ruta larga.", "Quédate dentro del parque y en las vías principales."],
      refs: "Guía de rutas y seguridad (nov 2026).",
      verificar: "No está en el avance del 27 de octubre: falta la ficha de investigación.",
      photo: { hoy: false, antes: false, antesYear: null, hoyCred: null, antesCred: null },
      next: null
    }
  ];

  // Platos: se ganan con una foto del plato (no tienen punto fijo en el mapa).
  var DISHES = [
    { id: 'pastel', name: 'Pastel de garbanzo', text: 'Pastel frito relleno, típico del desayuno cucuteño.' },
    { id: 'mute', name: 'Mute cucuteño', text: 'Sopa tradicional y espesa de la región.' }
  ];

  var STAMPS = [
    { id: 'parque', name: 'Parque Santander', cat: 'historia' },
    { id: 'catedral', name: 'Catedral de San José', cat: 'religioso' },
    { id: 'torre', name: 'Casa Torre del Reloj', cat: 'cultural' },
    { id: 'gobernacion', name: 'Palacio de la Gobernación', cat: 'historia' },
    { id: 'pastel', name: 'Pastel de garbanzo', cat: 'gastronomia' },
    { id: 'zulima', name: 'Teatro Zulima', cat: 'cultural' },
    { id: 'victoria', name: 'Parque La Victoria', cat: 'historia' },
    { id: 'biblioteca', name: 'Biblioteca Julio Pérez Ferrero', cat: 'cultural' },
    { id: 'quinta', name: 'Quinta Teresa', cat: 'cultural' },
    { id: 'cristo', name: 'Monumento a Cristo Rey', cat: 'religioso' },
    { id: 'columna', name: 'Columna de Bolívar', cat: 'historia' },
    { id: 'bagatela', name: 'La Bagatela', cat: 'historia' },
    { id: 'casa', name: 'Casa Natal de Santander', cat: 'historia' },
    { id: 'templo', name: 'Templo Histórico', cat: 'historia' },
    { id: 'mute', name: 'Mute cucuteño', cat: 'gastronomia' }
  ];

  var ROUTES = [
    { id: 'corta', name: 'Centro histórico', dur: 'corta', durLabel: '½ día', cat: 'historia', mode: 'a pie', stops: ['gobernacion', 'torre', 'catedral', 'parque'], hotels: ['casablanca', 'sterling'] },
    { id: 'mediana', name: 'Patrimonio y miradores', dur: 'mediana', durLabel: '1 día', cat: 'historia', mode: 'carro y a pie', stops: ['columna', 'cristo', 'quinta', 'biblioteca', 'victoria', 'zulima'], hotels: ['inka', 'casablanca'] },
    { id: 'larga', name: 'Inmersión metropolitana', dur: 'larga', durLabel: '2 días', cat: 'historia', mode: 'carro y a pie', stops: ['columna', 'cristo', 'quinta', 'gobernacion', 'torre', 'victoria', 'biblioteca', 'catedral', 'parque', 'zulima', 'patios', 'bagatela', 'casa', 'templo'], days: [10, 4], hotels: ['casablanca', 'villaantigua', 'granester', 'posadaabuelo'] },
    { id: 'historica', name: 'Ruta patrimonial del centro', cat: 'historia', mode: 'a pie', stops: ['zulima',  'parque',  'catedral',  'gobernacion',  'torre',  'victoria',  'biblioteca',  'quinta',  'cristo'], featured: true, badge: 'Explorador del Patrimonio' },
    { id: 'terremoto', name: 'El terremoto de 1875', cat: 'historia', mode: 'a pie', stops: ['catedral', 'biblioteca', 'parque'] },
    { id: 'cultura', name: 'Arte y cultura', cat: 'cultural', mode: 'a pie', stops: ['torre', 'quinta', 'zulima', 'biblioteca'] },
    { id: 'monumentos', name: 'Parques y monumentos', cat: 'historia', mode: 'a pie', stops: ['parque', 'victoria', 'columna'] },
    { id: 'fe', name: 'Templos y fe', cat: 'religioso', mode: 'a pie', stops: ['catedral', 'cristo'] },
    { id: 'sabores', name: 'Sabores cucuteños', cat: 'gastronomia', mode: 'a pie', stops: ['pastel', 'mute'], dishes: true }
  ];

  var LINES = [
    { name: 'Policía Nacional', num: '112' },
    { name: 'Bomberos', num: '119' },
    { name: 'Cruz Roja', num: '132' },
    { name: 'Defensa Civil', num: '144' },
    { name: 'Gaula · secuestro y extorsión', num: '165' }
  ];

  // Respaldo si no hay conexión con OpenStreetMap.
  var FALLBACK_SERVICES = [
    { id: 'osm-huem', name: 'Hospital Universitario Erasmo Meoz', kind: 'hospital', coords: [7.90386, -72.490633], phone: null, note: 'Av. 11E #5AN-71, Guaimaral' }
  ];

  var CITY = {
    center: [7.88654, -72.50442],        // Parque Santander
    demo: [7.88500, -72.50600],          // Punto de partida de demostración (centro, a 2 cuadras del Parque Santander)
    bbox: [7.78, -72.58, 7.98, -72.42],  // sur, oeste, norte, este (área metropolitana)
    radiusKm: 30
  };

  /* Seguridad (SRS v1): zona por lugar y reglas. Colores del SRS solo como relleno del mapa;
     para texto se usan tonos con contraste suficiente y siempre ícono + palabra. */
  var SAFETY = {
    zones: {
      verde: { label: 'Zona verde', word: 'Segura', fill: '#1E8449', ink: '#FFFFFF', map: '#2ECC71', icon: 'shield' },
      amarilla: { label: 'Zona amarilla', word: 'Precaución', fill: '#F1C40F', ink: '#1C1917', map: '#F1C40F', icon: 'alert' },
      roja: { label: 'Zona roja', word: 'Restringida', fill: '#C0392B', ink: '#FFFFFF', map: '#E74C3C', icon: 'ban' }
    },
    // [zona, noche, consejo]. noche: 'si' (día y noche), 'dia' (de día), 'no' (solo de día: alerta de noche), 'eventos'
    places: {
      gobernacion: ['verde', 'si'], torre: ['verde', 'si'], catedral: ['verde', 'si'], parque: ['verde', 'si'],
      columna: ['amarilla', 'no', 'Solo de día, en grupo o en carro.'], cristo: ['amarilla', 'no', 'Solo de día y en carro.'],
      biblioteca: ['verde', 'dia'], quinta: ['verde', 'dia'], zulima: ['verde', 'eventos'], victoria: ['verde', 'dia'],
      patios: ['verde', 'dia'], bagatela: ['verde', 'dia'], casa: ['verde', 'dia'], templo: ['verde', 'dia', 'Quédate dentro del parque y en las vías principales.']
    },
    nightFrom: 18, nightTo: 5,
    nightAlternatives: ['zulima', 'patios'],
    // Corredor seguro del Parque Gran Colombiano: esquema aproximado, por validar con la Alcaldía de Villa del Rosario.
    corridor: { name: 'Parque Gran Colombiano', center: [7.8288, -72.4627], watchRadius: 2500,
      polygon: [[7.8318, -72.4668], [7.8322, -72.4600], [7.8262, -72.4588], [7.8252, -72.4652]] }
  };

  /* Hoteles base: se sugieren por cercanía al punto de partida de la ruta. Sin calificaciones fijas. */
  var HOTELS = [
    { id: 'casablanca', name: 'Hotel Casa Blanca', area: 'Cúcuta centro', address: 'Av. 6 # 14-55, La Playa' },
    { id: 'sterling', name: 'Hotel Sterling', area: 'Cúcuta centro', address: null },
    { id: 'lequint', name: 'Hotel Le Quint', area: 'Cúcuta centro', address: null },
    { id: 'inka', name: 'Hotel INKA', area: 'Cúcuta', address: null },
    { id: 'granester', name: 'Hotel Gran Ester', area: 'Los Patios', address: null },
    { id: 'villaantigua', name: 'Hotel Villa Antigua', area: 'Villa del Rosario', address: null },
    { id: 'posadaabuelo', name: 'Posada El Abuelo', area: 'Villa del Rosario', address: null }
  ];

  /* Transporte seguro, fase 1: solo orienta. Pedir el carro dentro de la app es fase 2. */
  var TRANSPORT = [
    { id: 'hotel', name: 'Pídelo en tu hotel', text: 'La recepción llama un taxi formal.' },
    { id: 'lineas', name: 'Líneas de taxi formales', text: 'Números por confirmar con la Alcaldía.' },
    { id: 'apps', name: 'Apps de transporte', text: 'Abre la app que uses en tu celular (DiDi, InDrive, Uber).' }
  ];

  return { CATEGORIES: CATEGORIES, PLACES: PLACES, DISHES: DISHES, STAMPS: STAMPS, ROUTES: ROUTES, LINES: LINES, FALLBACK_SERVICES: FALLBACK_SERVICES, CITY: CITY, SAFETY: SAFETY, HOTELS: HOTELS, TRANSPORT: TRANSPORT };
})();
