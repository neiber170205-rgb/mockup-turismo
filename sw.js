/* Ruta Toche · funciona sin internet (RNF-03).
   App, fichas y fotos: se guardan al instalar. Teselas del mapa: solo las que ya viste (sin descarga masiva). */
var V = 'rt-v2.4';
var SHELL = ['./', 'index.html', 'css/app.css?v=2.4', 'js/data.js?v=2.4', 'js/art.js?v=2.4', 'js/toche.js?v=2.4', 'js/app.js?v=2.4',
  'vendor/leaflet/leaflet.css', 'vendor/leaflet/leaflet.js',
  'img/parque-hoy.jpg', 'img/parque-antes.jpg', 'img/catedral-hoy.jpg', 'img/catedral-antes.jpg', 'img/biblioteca-hoy.jpg', 'img/biblioteca-antes.jpg',
  'img/columna-hoy.jpg', 'img/columna-antes.jpg', 'img/quinta-hoy.jpg', 'img/gobernacion-hoy.jpg', 'img/torre-hoy.jpg', 'img/victoria-hoy.jpg', 'img/cristo-hoy.jpg'];
var TILES = 'rt-tiles', MAX_TILES = 400;
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V && k !== TILES; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
function trim(c) { c.keys().then(function (ks) { if (ks.length > MAX_TILES) ks.slice(0, ks.length - MAX_TILES).forEach(function (k) { c.delete(k); }); }); }
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.hostname === 'tile.openstreetmap.org') {
    e.respondWith(caches.open(TILES).then(function (c) {
      return c.match(e.request).then(function (hit) {
        var net = fetch(e.request).then(function (r) { if (r.ok) { c.put(e.request, r.clone()); trim(c); } return r; }).catch(function () { return hit; });
        return hit || net;
      });
    }));
    return;
  }
  if (u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(function (r) {
    if (r.ok) { var cp = r.clone(); caches.open(V).then(function (c) { c.put(e.request, cp); }); }
    return r;
  }).catch(function () { return caches.match(e.request, { ignoreSearch: false }).then(function (m) { return m || caches.match('index.html'); }); }));
});
