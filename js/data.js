/* Ruta Toche · datos de la app (fase 1)
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
      id: 'parque', name: 'Parque Santander', cat: 'historia', thumb: 'parque',
      coords: [7.88654, -72.50442], precision: 'aproximada',
      fuente: 'Calculada desde los límites del parque (Av. 5 y 6, Calles 10 y 11) y la Catedral.',
      address: 'Entre Av. 5 y 6, Calles 10 y 11, Centro', area: 'Centro de Cúcuta',
      timeline: [
        { year: '1890', text: 'Se inauguró la estatua en bronce de Francisco de Paula Santander.' },
        { year: 'Hoy', text: 'Es la plaza principal del centro, entre las avenidas 5 y 6.' }
      ],
      facts: ['Está entre las avenidas 5 y 6 y las calles 10 y 11.', 'En el centro hay una estatua en bronce de Santander, de 1890.', 'A su lado están la Catedral de San José y la Alcaldía.'],
      next: 'catedral'
    },
    {
      id: 'catedral', name: 'Catedral de San José', cat: 'religioso', thumb: 'catedral',
      coords: [7.88631, -72.50369], precision: 'verificada',
      fuente: 'Código Plus 67V9VFPW+GG (GCatholic). Dirección: Av. 5 #10-73.',
      address: 'Av. 5 #10-73, frente al Parque Santander', area: 'Centro de Cúcuta',
      timeline: [
        { year: 'Hoy', text: 'Es la catedral de la Diócesis de Cúcuta, frente al Parque Santander.' }
      ],
      facts: ['Está en la Avenida 5, frente al Parque Santander.', 'Es la catedral de la Diócesis de Cúcuta.'],
      next: 'torre'
    },
    {
      id: 'torre', name: 'Torre del Reloj', cat: 'cultural', thumb: 'torre',
      coords: [7.88405, -72.50174], precision: 'verificada',
      fuente: 'OpenStreetMap (vía Mapcarta). Calle 13 entre Av. 3 y 4.',
      address: 'Calle 13 entre Av. 3 y 4', area: 'Centro de Cúcuta',
      timeline: [
        { year: '1930', text: 'Se encargó la torre del reloj, tras un viaje a Europa.' },
        { year: 'Hoy', text: 'Es centro cultural y sede de la Secretaría de Cultura del departamento.' }
      ],
      facts: ['Está en la Calle 13, entre las avenidas 3 y 4.', 'Hoy es centro cultural, con galería y sala de conferencias.'],
      next: 'quinta'
    },
    {
      id: 'quinta', name: 'Quinta Teresa', cat: 'cultural', thumb: 'quinta',
      coords: [7.88178, -72.50218], precision: 'aproximada',
      fuente: 'Calculada desde su dirección (esquina de Av. 4 con Calle 15).',
      address: 'Av. 3 y 4 con Calles 15 y 16', area: 'Centro de Cúcuta',
      timeline: [
        { year: '1893', text: 'El banquero Cristian Andresen la construyó y le puso el nombre de su esposa, Teresa.' },
        { year: '1926', text: 'Pasó al departamento y fue colegio hasta 2006.' },
        { year: '2015', text: 'Reabrió restaurada como espacio para las artes y la cultura.' }
      ],
      facts: ['Se construyó en 1893 y lleva el nombre de Teresa Briceño.', 'Fue colegio hasta 2006.', 'Reabrió en 2015 como espacio cultural.'],
      next: 'biblioteca'
    },
    {
      id: 'biblioteca', name: 'Biblioteca Julio Pérez Ferrero', cat: 'cultural', thumb: 'biblioteca',
      coords: [7.88507, -72.49981], precision: 'verificada',
      fuente: 'AroundUs (coordenadas publicadas). Cerca del Parque Colón.',
      address: 'Cerca del Parque Colón', area: 'Centro de Cúcuta',
      timeline: [
        { year: 'Hoy', text: 'Biblioteca pública del centro de Cúcuta, cerca del Parque Colón.' }
      ],
      facts: ['Es la biblioteca pública del centro, cerca del Parque Colón.'],
      next: null
    },
    {
      id: 'malecon', name: 'Malecón', cat: 'naturaleza', thumb: 'malecon',
      coords: null, precision: 'osm',
      fuente: 'Se ubica con OpenStreetMap (Avenida Los Libertadores).',
      address: 'Av. Los Libertadores, junto al río Pamplonita', area: 'Cúcuta',
      timeline: [
        { year: 'Hoy', text: 'Paseo de unos 4 km junto al río Pamplonita.' },
        { year: 'Domingos', text: 'Hay ciclovía en el carril junto al paseo.' }
      ],
      facts: ['Paseo de unos 4 km por la Avenida Los Libertadores.', 'Los domingos hay ciclovía.', 'En diciembre se llena de luces navideñas.'],
      next: null
    },
    {
      id: 'templo', name: 'Templo Histórico', cat: 'historia', thumb: 'templo', ruins: true,
      coords: [7.82889, -72.46278], precision: 'verificada',
      fuente: 'Wikipedia: Historic church of Cúcuta (7°49′44″N 72°27′46″O).',
      address: 'Parque Gran Colombiano', area: 'Villa del Rosario',
      timeline: [
        { year: '1821', text: 'Aquí se reunió el Congreso de Cúcuta.' },
        { year: '1821', text: 'Aquí se redactó y firmó la Constitución de 1821.' },
        { year: '1875', text: 'El terremoto lo destruyó casi por completo; luego se reconstruyó en parte.' },
        { year: '1935', text: 'Fue declarado Monumento Nacional.' }
      ],
      facts: ['En 1821 aquí se reunió el Congreso de Cúcuta.', 'Aquí se firmó la Constitución de 1821.', 'El terremoto de 1875 lo destruyó casi por completo.', 'Es Monumento Nacional desde 1935.'],
      next: 'casa'
    },
    {
      id: 'casa', name: 'Casa Natal de Santander', cat: 'historia', thumb: 'casa',
      coords: [7.8285, -72.4622], precision: 'aproximada',
      fuente: 'En el Parque Gran Colombiano, junto al Templo Histórico (posición aproximada).',
      address: 'Parque Gran Colombiano, junto al Templo Histórico', area: 'Villa del Rosario',
      timeline: [
        { year: '1792', text: 'Aquí nació Francisco de Paula Santander y vivió hasta los 13 años.' },
        { year: 'Hoy', text: 'Es museo, con su uniforme, espadas y otros objetos.' }
      ],
      facts: ['Aquí nació Francisco de Paula Santander.', 'Hoy es museo con su uniforme y sus espadas.'],
      next: 'puente'
    },
    {
      id: 'puente', name: 'Puente Simón Bolívar', cat: 'historia', thumb: 'puente',
      coords: [7.8179, -72.4508], precision: 'verificada',
      fuente: 'Wikipedia: Simón Bolívar International Bridge (7°49′04″N 72°27′03″O).',
      address: 'La Parada, Villa del Rosario', area: 'Frontera con Venezuela',
      timeline: [
        { year: 'Hoy', text: 'Cruza el río Táchira y une La Parada con San Antonio del Táchira.' }
      ],
      facts: ['Cruza el río Táchira en la frontera con Venezuela.', 'Une La Parada con San Antonio del Táchira.'],
      next: null
    },
    {
      id: 'cristo', name: 'Monumento a Cristo Rey', cat: 'religioso', thumb: 'cristo',
      coords: null, precision: 'osm',
      fuente: 'Se ubica con OpenStreetMap (barrio La Cabrera).',
      address: 'Av. 4, La Cabrera', area: 'Cúcuta',
      timeline: [
        { year: 'Hoy', text: 'Estatua en lo alto de La Cabrera, con vista a toda la ciudad.' }
      ],
      facts: ['Está en lo alto del barrio La Cabrera.', 'Tiene vista panorámica de la ciudad.'],
      next: null
    }
  ];

  // Platos: se ganan con una foto del plato (no tienen punto fijo en el mapa).
  var DISHES = [
    { id: 'pastel', name: 'Pastel de garbanzo', text: 'Pastel frito relleno, típico del desayuno cucuteño.' },
    { id: 'mute', name: 'Mute cucuteño', text: 'Sopa tradicional y espesa de la región.' }
  ];

  var STAMPS = [
    { id: 'templo', name: 'Templo Histórico', cat: 'historia' },
    { id: 'parque', name: 'Parque Santander', cat: 'historia' },
    { id: 'torre', name: 'Torre del Reloj', cat: 'cultural' },
    { id: 'pastel', name: 'Pastel de garbanzo', cat: 'gastronomia' },
    { id: 'malecon', name: 'Malecón', cat: 'naturaleza' },
    { id: 'casa', name: 'Casa Natal de Santander', cat: 'historia' },
    { id: 'catedral', name: 'Catedral de San José', cat: 'religioso' },
    { id: 'quinta', name: 'Quinta Teresa', cat: 'cultural' },
    { id: 'cristo', name: 'Monumento a Cristo Rey', cat: 'religioso' },
    { id: 'mute', name: 'Mute cucuteño', cat: 'gastronomia' },
    { id: 'puente', name: 'Puente Simón Bolívar', cat: 'historia' },
    { id: 'biblioteca', name: 'Biblioteca Julio Pérez Ferrero', cat: 'cultural' }
  ];

  var ROUTES = [
    { id: 'historica', name: 'Ruta Histórica del Centro', cat: 'historia', mode: 'a pie', stops: ['parque', 'catedral', 'torre', 'quinta', 'biblioteca'], badge: 'Explorador del Centro' },
    { id: 'independencia', name: 'Ruta de la Independencia', cat: 'historia', mode: 'en carro', stops: ['templo', 'casa', 'puente'], featured: true, area: 'Villa del Rosario' },
    { id: 'sabores', name: 'Sabores cucuteños', cat: 'gastronomia', mode: 'a pie', stops: ['pastel', 'mute'], dishes: true },
    { id: 'cultura', name: 'Arte y cultura', cat: 'cultural', mode: 'a pie', stops: ['torre', 'quinta', 'biblioteca'] },
    { id: 'fe', name: 'Templos y fe', cat: 'religioso', mode: 'a pie', stops: ['catedral', 'cristo'] },
    { id: 'verde', name: 'Cúcuta verde', cat: 'naturaleza', mode: 'a pie o en bici', stops: ['malecon', 'parque'] }
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
    demo: [7.88370, -72.50300],          // Punto de partida de demostración (centro)
    bbox: [7.78, -72.58, 7.98, -72.42],  // sur, oeste, norte, este (área metropolitana)
    radiusKm: 30
  };

  return { CATEGORIES: CATEGORIES, PLACES: PLACES, DISHES: DISHES, STAMPS: STAMPS, ROUTES: ROUTES, LINES: LINES, FALLBACK_SERVICES: FALLBACK_SERVICES, CITY: CITY };
})();
