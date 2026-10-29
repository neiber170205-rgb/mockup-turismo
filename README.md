# Ruta Toche · Turismo en Cúcuta

Prototipo funcional (fase 1, diseño v2) de la app de turismo de Cúcuta, con Toche como guía.

**Ver en línea:** https://neiber170205-rgb.github.io/mockup-turismo/

- En el celular se ve a pantalla completa. En el computador aparece dentro de un marco de teléfono, con un panel para saltar entre pantallas y simular la ubicación.
- No hay que instalar ni compilar nada: es HTML, CSS y JavaScript.

## Qué funciona

- **Mapa real** de OpenStreetMap con tu ubicación por GPS, filtros por tipo de turismo y buscador.
- **Cómo llegar**: rutas reales a pie (o en carro si el lugar está lejos), con indicaciones en español, voz de Toche, recálculo si te sales de la ruta y aviso al llegar.
- **Simular recorrido**: Toche camina la ruta por ti, para probar la llegada desde cualquier lugar.
- **Llegada a un punto turístico**: cuando estás a pocos metros, vibra, Toche lo anuncia y se abre su historia con el comparador antes/hoy.
- **Estampas**: en el punto (o con un plato típico) te tomas una foto y ganas la estampa. Se guardan en el navegador.
- **Rutas** por tipo de turismo, con paradas numeradas en el mapa y progreso.
- **Comida**: restaurantes cercanos tomados de OpenStreetMap.
- **Ayuda**: botón para llamar al 123, hospital y CAI más cercanos (OpenStreetMap), líneas oficiales y compartir ubicación.
- **Accesibilidad**: guía por voz, alto contraste, tres tamaños de letra, paleta para daltonismo con nombres siempre visibles, velocidad de voz, vibración, compatible con lectores de pantalla y teclado. Respeta "reducir movimiento" y la zona de la cámara del celular.
- **Hablar con Toche** (botón central): comandos de voz como "llévame al Templo Histórico", "¿dónde estoy?" o "ayuda". Si el navegador no entiende voz, muestra un menú.
- **Toche animado**: el toche real (*Icterus chrysater*), hecho solo con código. Respira, parpadea, mueve la cabeza a saltos, busca con el pico, sacude la cola y mueve el pico cuando la app habla.
  - Bienvenida: llega volando y se posa en la rama.
  - Inicio, navegación y menú de voz: su cabeza en la insignia, que habla con cada sugerencia.
  - Nueva estampa: vuela hasta la estampa, se posa en el borde y celebra.
  - Con "reducir movimiento" no vuela: se queda posado.

## Ubicación

- La app pide permiso de ubicación al tocar **Empezar**.
- Si no das permiso, si el GPS falla o si estás lejos de Cúcuta, usa una **ubicación de demostración** en el centro (aparece la etiqueta *Demo*). Se cambia tocando el nombre del lugar arriba en Inicio.
- El GPS solo funciona con `https` (GitHub Pages) o en `localhost`.

## Datos y servicios abiertos

| Uso | Servicio |
|---|---|
| Mapa | Teselas de [CARTO](https://carto.com/attributions) con datos de [OpenStreetMap](https://www.openstreetmap.org/copyright). Si fallan, usa las de OpenStreetMap. |
| Rutas | OSRM en los servidores de [FOSSGIS](https://routing.openstreetmap.de/) (perfiles a pie y en carro). |
| Hospitales, CAI, restaurantes y lugares sin coordenadas | [Overpass API](https://overpass-api.de/) |
| Buscador y nombre del barrio | [Nominatim](https://nominatim.org/) |
| Librería de mapa | [Leaflet 1.9.4](https://leafletjs.com/) (incluida en `vendor/`, licencia BSD-2) |

Son servicios gratuitos con límites de uso, buenos para un prototipo. Para producción conviene un proveedor con contrato o servidores propios. Las respuestas se guardan un tiempo en el navegador para no repetir consultas.

## Coordenadas de los puntos

Están en `js/data.js`, cada una con su fuente:

- **Verificadas**: Catedral de San José, Torre del Reloj, Biblioteca Julio Pérez Ferrero, Templo Histórico, Puente Simón Bolívar.
- **Aproximadas** (se corrigen solas si OpenStreetMap tiene el lugar): Parque Santander, Quinta Teresa, Casa Natal de Santander.
- **Se buscan en OpenStreetMap al abrir la app**: Malecón y Monumento a Cristo Rey. Si no se encuentran, no aparecen en el mapa.

## Agregar fotos reales

Pon las fotos en `img/` con estos nombres y reemplazan solas a la ilustración:

- `img/<id>-hoy.jpg` y `img/<id>-antes.jpg`
- IDs: `templo`, `parque`, `catedral`, `torre`, `quinta`, `biblioteca`, `malecon`, `casa`, `puente`, `cristo`.
- Si usas fotos de Wikimedia Commons, da crédito al autor según la licencia.

## Archivos

```
index.html        Pantallas y botones
css/app.css       Diseño v2 (colores de Cúcuta, alto contraste, animaciones)
js/data.js        Lugares, rutas, estampas y líneas de emergencia
js/art.js         Ilustraciones, estampas y pines del mapa (SVG)
js/toche.js       Toche animado: silueta con cuello que se dobla, resortes, aleteo y vuelo
js/app.js         Lógica: navegación, mapa, GPS, rutas, voz, cámara, estampas
vendor/leaflet/   Librería del mapa
img/              Fotos reales opcionales
```

Para probarlo en tu computador: `python3 -m http.server` dentro de la carpeta y abre `http://localhost:8000`.

## Pendiente

- Validar los textos de historia con fuentes oficiales.
- Logos de las entidades de emergencia: solo con permiso de cada una (hay espacios marcados `LOGO`).
- Fotos reales de antes y hoy.
- Fase 2: taxis y rutas de bus.
