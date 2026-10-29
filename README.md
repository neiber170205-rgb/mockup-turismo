# Ruta Toche · Turismo en Cúcuta

Prototipo funcional (fase 1) de la app de turismo de Cúcuta, con Toche como guía.

- Un solo archivo: `index.html`. Sin instalar nada ni compilar.
- En el celular se ve a pantalla completa; en el computador, dentro de un marco de teléfono.

## Cómo verlo

- Abre `index.html` en el navegador (doble clic).
- O publícalo con GitHub Pages: *Settings → Pages → Branch: main*.
- La cámara y la ubicación solo funcionan con `https` (GitHub Pages sirve).

## Qué incluye

- Bienvenida: elegir modo visual, alto contraste o guía por voz.
- Inicio con menú de 4 botones grandes.
- Mapa tipo Waze: filtros, buscador, comandos de voz, ruta animada y navegación simulada.
- Rutas por tipo de turismo con progreso.
- Punto turístico: comparador antes/hoy, historia narrada y foto para ganar la estampa.
- Cámara real (o simulada si no hay permiso) y animación de recompensa.
- Álbum de estampas (se guarda en el navegador).
- Emergencias: 123, hospital, CAI, números útiles y compartir ubicación.
- Accesibilidad: voz de Toche, alto contraste, tamaño de letra, ajuste para daltonismo.
- Respeta la zona de la cámara/notch con `env(safe-area-inset-*)`.
- Respeta "reducir movimiento" del sistema.

## Agregar fotos reales

Pon las fotos en la carpeta `img/` con estos nombres y aparecen solas:

| Archivo | Dónde se ve |
|---|---|
| `img/templo-antes.jpg`, `img/templo-hoy.jpg` | Templo Histórico |
| `img/parque-antes.jpg`, `img/parque-hoy.jpg` | Parque Santander |
| `img/catedral-hoy.jpg`, `img/torre-hoy.jpg`, … | Cada punto (`<id>-antes.jpg` / `<id>-hoy.jpg`) |
| `img/ruta-historica.jpg`, `img/ruta-sabores.jpg`, … | Portada de cada ruta |

- IDs de puntos: `templo`, `parque`, `catedral`, `torre`, `quinta`, `comida`, `malecon`.
- IDs de rutas: `historica`, `independencia`, `sabores`, `cultura`, `fe`, `verde`.
- Si usas fotos de Wikimedia Commons, da crédito al autor según la licencia.

## Pendiente

- Validar textos de historia con fuentes oficiales (Torre del Reloj y Quinta Teresa están vacíos a propósito).
- Logos oficiales de las entidades de emergencia: solo con permiso de cada una (hay espacios marcados `LOGO`).
- Las posiciones del mapa son ilustrativas; en desarrollo se cambia por un mapa real.
- Fase 2: taxis y rutas de bus.
