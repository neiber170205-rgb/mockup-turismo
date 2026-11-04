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

## Lugares y contenido

Los 10 sitios del avance de investigación «Patrimonio histórico y cultural de San José de Cúcuta» (27 de octubre de 2026), en `js/data.js`:

- Teatro Zulima, Parque Santander, Catedral de San José, Palacio de la Gobernación (Cúpula Chata), Casa Torre del Reloj, Parque La Victoria (Parque Colón), Biblioteca Julio Pérez Ferrero, Quinta Teresa, Monumento a Cristo Rey y Columna de Bolívar.
- Cada lugar trae su línea de tiempo, declaratoria, fuentes (`refs`) y los datos «por verificar» del documento.
- Ruta patrimonial del centro: 9 paradas, unos 2,8 km a pie.
- Coordenadas: OpenStreetMap; Catedral, Torre y Biblioteca verificadas. La Columna de Bolívar es aproximada.

## Fotos

- En `img/` con el nombre `<id>-hoy.jpg` y `<id>-antes.jpg`. Si falta una, se ve la ilustración.
- Solo fotos de uso libre del anexo del avance. Las de Cucutanuestra.com, ARFOS y Flickr necesitan permiso.
- Faltan: Teatro Zulima, y fotos antiguas libres de Gobernación, Torre del Reloj, Parque Colón, Quinta Teresa y Cristo Rey.

| Foto | Autor | Año | Licencia |
|---|---|---|---|
| Catedral de San José, fachada | EEIM | 2021 | CC BY-SA 4.0 (Wikimedia Commons) |
| Iglesia de San José antes del terremoto | Autor desconocido | 1874 | Dominio público (Wikimedia Commons) |
| Parque Santander de Cúcuta | Ruben Valero | 2014 | CC BY-SA 3.0 (Wikimedia Commons) |
| Estatua de Santander en el Parque Central | Autor desconocido | 1893 | Dominio público (Wikimedia Commons) |
| Biblioteca Pública Julio Pérez Ferrero | Ruben Valero | 2014 | CC BY-SA 3.0 (Wikimedia Commons) |
| Hospital San Juan de Dios de Cúcuta | Autor desconocido | c. 1910 | Dominio público (Wikimedia Commons) |
| Centro Cultural Quinta Teresa | EEIM | 2017 | CC BY-SA 4.0 (Wikimedia Commons) |
| Palacio de Gobierno «Cúpula Chata», vista aérea | Losmanesdeldrone | 2020 | CC BY-SA 4.0 (Wikimedia Commons) |
| Torre del Reloj de Cúcuta | EEIM | 2018 | CC BY-SA 4.0 (Wikimedia Commons) |
| Parque La Victoria (Parque Colón) | EEIM | 2021 | CC BY-SA 4.0 (Wikimedia Commons) |
| Monumento a Cristo Rey, vista frontal | Ruben Valero | 2014 | CC BY-SA 3.0 (Wikimedia Commons) |
| Obelisco de la Loma de Bolívar | EEIM | 2016 | CC BY-SA 4.0 (Wikimedia Commons) |
| Monumento a la Batalla de Cúcuta | Autor desconocido | c. 1910 | Dominio público (Wikimedia Commons) |

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

- Logos de las entidades de emergencia: solo con permiso de cada una (hay espacios marcados `LOGO`).
- Permisos para las fotos con derechos reservados.
- Resolver los datos «por verificar» con fuentes primarias.
- Validar el prototipo con habitantes y visitantes (objetivo 2 del anteproyecto).
- Fase 2: taxis y rutas de bus.
