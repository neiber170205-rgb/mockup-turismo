/* Ruta Toche · lógica de la app (sin dependencias salvo Leaflet).
   Mapa: OpenStreetMap con teselas de CARTO. Rutas: OSRM (servidores FOSSGIS).
   Lugares cercanos: Overpass API. Búsqueda: Nominatim. */
(function () {
  'use strict';

  var D = window.RT_DATA, ART = window.RT_ART;
  var CAT = D.CATEGORIES, PLACES = D.PLACES, DISHES = D.DISHES, STAMPS = D.STAMPS, ROUTES = D.ROUTES, LINES = D.LINES, CITY = D.CITY;
  var app = document.getElementById('app');

  /* =========================================================
     Utilidades
     ========================================================= */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function place(id) { return byId(PLACES, id); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ic(name, cls) { return '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>'; }
  function debounce(fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; }
  function ll(p) { return [p.lat, p.lng]; }
  function hav(a, b) {
    var R = 6371000, r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
  }
  function bearing(a, b) {
    var r = Math.PI / 180, y = Math.sin((b[1] - a[1]) * r) * Math.cos(b[0] * r);
    var x = Math.cos(a[0] * r) * Math.sin(b[0] * r) - Math.sin(a[0] * r) * Math.cos(b[0] * r) * Math.cos((b[1] - a[1]) * r);
    return (Math.atan2(y, x) / r + 360) % 360;
  }
  var CARD = ['el norte', 'el noreste', 'el este', 'el sureste', 'el sur', 'el suroeste', 'el oeste', 'el noroeste'];
  function cardinal(deg) { return CARD[Math.round(((deg || 0) % 360) / 45) % 8]; }
  function fmtDist(m) {
    if (m < 1000) return (m < 100 ? Math.max(5, Math.round(m / 5) * 5) : Math.round(m / 10) * 10) + ' m';
    return (m / 1000).toFixed(m < 10000 ? 1 : 0).replace('.', ',') + ' km';
  }
  function sayDist(m) {
    if (m < 1000) return (m < 100 ? Math.max(5, Math.round(m / 5) * 5) : Math.round(m / 10) * 10) + ' metros';
    return (m / 1000).toFixed(1).replace('.', ',').replace(',0', '') + ' kilómetros';
  }
  function fmtMin(sec) {
    var m = Math.max(1, Math.round(sec / 60));
    if (m < 60) return m + ' min';
    var h = Math.floor(m / 60), r = m % 60;
    return h + ' h' + (r ? ' ' + r + ' min' : '');
  }
  function walkSec(m) { return m / 1.25; }
  function lcFirst(s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
  function getJSON(url, opts) {
    opts = opts || {};
    var ctl = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, opts.timeout || 12000);
    return fetch(url, { method: opts.body ? 'POST' : 'GET', body: opts.body, headers: opts.headers, signal: ctl ? ctl.signal : undefined })
      .then(function (r) { clearTimeout(t); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); },
        function (e) { clearTimeout(t); throw e; });
  }
  function cacheGet(k, maxAge) {
    try { var o = JSON.parse(localStorage.getItem('rt-c:' + k)); if (o && Date.now() - o.t < maxAge) return o.d; } catch (e) {}
    return null;
  }
  function cacheSet(k, d) { try { localStorage.setItem('rt-c:' + k, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {} }
  function copyText(text, msg) {
    var done = function () { toast(msg || 'Copiado'); };
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, function () { fallback(); }); return; }
    fallback();
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('No pudimos copiar el texto'); }
      document.body.removeChild(ta);
    }
  }
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Textos propios de la app sobre cada lugar */
  var ART_ES = { parque: 'el', catedral: 'la', torre: 'la', quinta: 'la', biblioteca: 'la', malecon: 'el', templo: 'el', casa: 'la', puente: 'el', cristo: 'el' };
  function delName(p) { return (ART_ES[p.id] === 'la' ? 'de la ' : 'del ') + p.name; }
  function alName(p) { return (ART_ES[p.id] === 'la' ? 'a la ' : 'al ') + p.name; }
  var PHOTO_DESC = {
    parque: 'El parque, con palmeras y la estatua de Santander en el centro.',
    catedral: 'La fachada clara de la catedral, con su torre central y su reloj.',
    torre: 'La torre con su reloj blanco y el techo rojo en punta.',
    quinta: 'Una casona de un piso con arcos y techo de teja.',
    biblioteca: 'Un edificio con columnas al frente y una puerta de madera.',
    malecon: 'Un paseo con árboles y faroles junto al río.',
    templo: 'Antes: las ruinas del templo después del terremoto de 1875. Hoy: el templo reconstruido en parte, con su cúpula blanca.',
    casa: 'Una casa colonial blanca con techo de teja y ventanas de madera.',
    puente: 'Un puente de arcos sobre el río.',
    cristo: 'La estatua de Cristo con los brazos abiertos en lo alto de una colina.'
  };
  var ANTES_TAG = { templo: 'Antes · 1875' };
  var KEYWORDS = {
    parque: ['parque santander', 'parque'], catedral: ['catedral', 'san jose'], torre: ['torre del reloj', 'torre', 'reloj'],
    quinta: ['quinta teresa', 'quinta'], biblioteca: ['biblioteca', 'julio perez'], malecon: ['malecon'], templo: ['templo historico', 'templo'],
    casa: ['casa natal', 'casa de santander'], puente: ['puente', 'simon bolivar'], cristo: ['cristo rey', 'cristo']
  };
  var ROUTE_TIME = { historica: '2 h', independencia: 'Medio día', cultura: '1 h 30', fe: '1 h' };
  var ROUTE_THUMB = { historica: 'torre', independencia: 'templo', sabores: 'pastel', cultura: 'quinta', fe: 'catedral', verde: 'malecon' };
  var ROUTE_META = { sabores: 'Pastel de garbanzo, mute y más', verde: 'Malecón y parques · a pie o en bici' };

  /* =========================================================
     Estado y almacenamiento
     ========================================================= */
  var KEY = 'ruta-toche-v2', PKEY = 'ruta-toche-v2-fotos';
  var DEFAULTS = { onboarded: false, mode: 'visual', contraste: false, voz: false, fotos: true, vibrar: true, tam: 'normal', dal: 'ninguno', vel: 'normal',
    stamps: {}, lastNew: null, badge: false, locMode: 'auto' };
  function load() {
    var s = {};
    try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
    var o = {};
    Object.keys(DEFAULTS).forEach(function (k) { o[k] = s[k] != null ? s[k] : JSON.parse(JSON.stringify(DEFAULTS[k])); });
    return o;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var S = load();
  var PHOTOS = {};
  try { PHOTOS = JSON.parse(localStorage.getItem(PKEY)) || {}; } catch (e) {}
  function savePhoto(id, url) { PHOTOS[id] = url; try { localStorage.setItem(PKEY, JSON.stringify(PHOTOS)); } catch (e) {} }
  function hasStamp(id) { return !!(S.stamps && S.stamps[id]); }
  function stampCount() { return STAMPS.filter(function (s) { return hasStamp(s.id); }).length; }
  function routeDone(r) { return r.stops.filter(hasStamp).length; }

  /* =========================================================
     Avisos, vibración, Toche
     ========================================================= */
  var toastT;
  function toast(msg, ms) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, ms || 2800);
  }
  function vibrate(p) { if (S.vibrar && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} } }
  /* Toche animado (js/toche.js): insignias, bienvenida y recompensa */
  var TOCHE = window.RT_TOCHE || null;
  if (TOCHE) TOCHE.mountAll(document);
  var welcomeToche = TOCHE ? TOCHE.mount($('#welcome-toche'), { view: 'scene' }) : null, welcomeFlown = false;
  function tocheOf(sel) { var el = typeof sel === 'string' ? $(sel) : sel; return el && el.__toche ? el.__toche : null; }
  function tocheChirp(sel, ms) { var t = tocheOf(sel); if (t && !app.classList.contains('speaking')) t.chirp(ms || 1200); }

  /* =========================================================
     Voz: lectura (síntesis) y comandos (reconocimiento)
     ========================================================= */
  var synth = window.speechSynthesis || null, voiceEs = null, speakToken = 0, speakOpts = null;
  var RATE = { lenta: 0.82, normal: 1, rapida: 1.22 };
  function pickVoice() {
    if (!synth) return;
    var vs = synth.getVoices() || [];
    voiceEs = vs.filter(function (v) { return /^es[-_]CO/i.test(v.lang); })[0] ||
      vs.filter(function (v) { return /^es[-_](419|MX|US|AR|CL|PE)/i.test(v.lang); })[0] ||
      vs.filter(function (v) { return /^es/i.test(v.lang); })[0] || null;
  }
  if (synth) { pickVoice(); try { synth.addEventListener('voiceschanged', pickVoice); } catch (e) { synth.onvoiceschanged = pickVoice; } }
  function splitSentences(text) {
    var raw = String(text).match(/[^.!?]+[.!?]*/g) || [text], out = [], buf = '';
    raw.forEach(function (s) {
      s = s.trim(); if (!s) return;
      if ((buf + ' ' + s).length > 170 && buf) { out.push(buf); buf = s; } else buf = buf ? buf + ' ' + s : s;
    });
    if (buf) out.push(buf);
    return out;
  }
  function speak(text, opts) {
    opts = opts || {};
    if (!text) return false;
    if (!S.voz && !opts.force) return false;
    if (!synth || !window.SpeechSynthesisUtterance) { if (opts.force && !opts.quiet) toast('Tu navegador no puede leer en voz alta'); return false; }
    var prev = speakOpts; speakOpts = opts;
    var my = ++speakToken;
    try { synth.cancel(); } catch (e) {}
    if (prev && prev.onstop) prev.onstop();
    var parts = opts.parts || splitSentences(text), i = 0;
    if (opts.banner !== false) { $('#voice-text').textContent = text.length > 96 ? text.slice(0, 94) + '…' : text; app.classList.add('banner'); }
    app.classList.add('speaking'); if (TOCHE) TOCHE.setSpeaking(true);
    function finish() {
      if (my !== speakToken) return;
      speakOpts = null;
      app.classList.remove('speaking', 'banner'); if (TOCHE) TOCHE.setSpeaking(false);
      if (opts.onend) opts.onend();
    }
    function next() {
      if (my !== speakToken) return;
      if (i >= parts.length) { finish(); return; }
      var u = new SpeechSynthesisUtterance(parts[i]);
      u.lang = voiceEs ? voiceEs.lang : 'es-CO';
      if (voiceEs) u.voice = voiceEs;
      u.rate = RATE[S.vel] || 1;
      u.onend = function () { if (my !== speakToken) return; i++; if (opts.onprogress) opts.onprogress(i, parts.length); next(); };
      u.onerror = function () { if (my !== speakToken) return; i++; next(); };
      try { synth.speak(u); } catch (e) { finish(); }
    }
    setTimeout(next, 30);
    return true;
  }
  function stopSpeak() {
    speakToken++;
    try { if (synth) synth.cancel(); } catch (e) {}
    var prev = speakOpts; speakOpts = null;
    if (prev && prev.onstop) prev.onstop();
    app.classList.remove('speaking', 'banner'); if (TOCHE) TOCHE.setSpeaking(false);
  }
  app.addEventListener('focusin', function (e) {
    if (!S.voz) return;
    var el = e.target;
    try { if (!el.matches(':focus-visible')) return; } catch (x) { return; }
    var t = el.getAttribute('aria-label') || el.textContent;
    t = (t || '').replace(/\s+/g, ' ').trim();
    if (t && t.length < 180) speak(t);
  });

  var Rec = window.SpeechRecognition || window.webkitSpeechRecognition || null, rec = null;
  function listen(btn, cb) {
    if (!Rec) return false;
    stopListen(); stopSpeak();
    try {
      rec = new Rec(); rec.lang = 'es-CO'; rec.interimResults = false; rec.maxAlternatives = 1;
      btn.classList.add('listening');
      toast('Te escucho…');
      rec.onresult = function (e) { var t = e.results && e.results[0] && e.results[0][0] ? e.results[0][0].transcript : ''; if (t) cb(t); };
      rec.onerror = function (e) {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast('Permite el micrófono para hablar con Toche');
        else if (e.error !== 'aborted') toast('No te escuché bien. Intenta de nuevo.');
      };
      rec.onend = function () { btn.classList.remove('listening'); rec = null; if (TOCHE) TOCHE.setListening(false); };
      rec.start(); if (TOCHE) TOCHE.setListening(true);
      return true;
    } catch (e) { btn.classList.remove('listening'); rec = null; return false; }
  }
  function stopListen() { if (rec) { try { rec.abort(); } catch (e) {} } rec = null; $$('.listening').forEach(function (b) { b.classList.remove('listening'); }); if (TOCHE) TOCHE.setListening(false); }

  /* =========================================================
     Pantallas e historial
     ========================================================= */
  var current = null, stack = [], pushed = 0;
  var NO_TABS = { bienvenida: 1, punto: 1, accesibilidad: 1 };
  var onEnter = {}, onLeave = {};
  function curId() { return current ? current.id.slice(2) : null; }
  function go(id, opts) {
    opts = opts || {};
    var to = document.getElementById('s-' + id);
    if (!to) return;
    var from = current;
    if (from === to) { updateChrome(id); if (onEnter[id]) onEnter[id](opts); return; }
    stopListen();
    if (!opts.keepVoice) stopSpeak();
    var fromId = curId();
    if (fromId && onLeave[fromId]) onLeave[fromId]();
    if (opts.tab) stack = [];
    else if (!opts.back && from) {
      stack.push(fromId);
      try { history.pushState({ rt: id }, ''); pushed++; } catch (e) {}
    }
    var back = !!opts.back;
    to.classList.remove('active', 'out-left', 'out-right', 'play');
    to.classList.add(back ? 'from-left' : 'from-right');
    void to.offsetWidth;
    to.classList.remove('from-left', 'from-right');
    to.classList.add('active', 'play');
    to.setAttribute('aria-hidden', 'false'); to.inert = false;
    if (!opts.keepScroll) to.scrollTop = 0;
    if (from) {
      from.classList.remove('active');
      from.classList.add(back ? 'out-right' : 'out-left');
      from.setAttribute('aria-hidden', 'true'); from.inert = true;
      (function (f) { setTimeout(function () { if (!f.classList.contains('active')) f.classList.remove('out-left', 'out-right', 'play'); }, 460); })(from);
    }
    current = to;
    updateChrome(id);
    if (onEnter[id]) onEnter[id](opts);
    var say = to.getAttribute('data-say');
    if (say && !opts.silent) setTimeout(function () { if (current === to && !(speakOpts && opts.keepVoice)) speak(say); }, 400);
    var h = to.querySelector('h1');
    if (h) { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (e) {} }
  }
  function updateChrome(id) {
    app.classList.toggle('no-tabs', !!NO_TABS[id] || (id === 'mapa' && !!nav));
    $$('.tab').forEach(function (t) {
      if (t.getAttribute('data-tab') === id) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    });
  }
  function back() { if (pushed > 0) { history.back(); return; } doBack(); }
  function doBack() { go(stack.pop() || 'inicio', { back: true }); }
  window.addEventListener('popstate', function () {
    pushed = Math.max(0, pushed - 1);
    if (closeTopOverlay()) return;
    if (curId() === 'mapa' && nav) { endNav(); return; }
    doBack();
  });

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-go],[data-back],[data-tab],[data-jump]');
    if (!t) return;
    if (t.hasAttribute('data-back')) { back(); return; }
    if (t.hasAttribute('data-tab')) { go(t.getAttribute('data-tab'), { tab: true }); return; }
    if (t.hasAttribute('data-jump')) { jump(t.getAttribute('data-jump')); return; }
    go(t.getAttribute('data-go'));
  });

  /* =========================================================
     Capas: cámara, recompensa, hoja modal
     ========================================================= */
  var overlays = [], focusBefore = [];
  function openOverlay(el) {
    if (overlays.indexOf(el) < 0) { overlays.push(el); focusBefore.push(document.activeElement); }
    el.hidden = false;
    setTimeout(function () {
      var f = el.querySelector('[data-autofocus]') || el.querySelector('h2[tabindex="-1"]') || el.querySelector('button, [href], input');
      if (f) try { f.focus({ preventScroll: true }); } catch (e) {}
    }, 60);
  }
  function closeOverlay(el) {
    var i = overlays.indexOf(el);
    el.hidden = true;
    if (i < 0) return;
    overlays.splice(i, 1);
    var f = focusBefore.splice(i, 1)[0];
    if (f && document.contains(f) && !f.closest('[inert]')) { try { f.focus({ preventScroll: true }); } catch (e) {} }
  }
  function closeTopOverlay() {
    var el = overlays[overlays.length - 1];
    if (!el) return false;
    if (el.id === 'camera') { stopCam(); closeOverlay(el); return true; }
    if (el.id === 'reward') { closeReward(); return true; }
    closeOverlay(el); return true;
  }
  function openModal(html) { $('#modal-body').innerHTML = html; if (TOCHE) TOCHE.mountAll($('#modal-body')); openOverlay($('#modal')); }
  function closeModal() { closeOverlay($('#modal')); }
  $('#modal').addEventListener('click', function (e) { if (e.target.closest('[data-close-modal]')) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (closeTopOverlay()) return;
      if (!$('#suggestions').hidden) { hideSug(); return; }
      if (curId() === 'mapa' && !nav) { if (routeView) closeRouteOverview(); else if (selId) deselect(); }
      return;
    }
    if (e.key === 'Tab' && overlays.length) {
      var box = overlays[overlays.length - 1];
      var f = $$('button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])', box).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!box.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  });

  /* =========================================================
     Ajustes
     ========================================================= */
  function applySettings() {
    app.setAttribute('data-contrast', S.contraste ? 'on' : 'off');
    var k = S.tam === 'muy' ? 1.3 : (S.tam === 'grande' ? 1.15 : 1);
    document.documentElement.style.fontSize = (16 * k) + 'px';
    app.classList.toggle('cvd', S.dal !== 'ninguno');
    app.classList.toggle('labels', S.dal !== 'ninguno');
    var meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.setAttribute('content', S.contraste ? '#000000' : '#C8102E');
    if (map) { setTiles(); if (nav && nav.route) drawRoute(nav.route.coords, 'nav'); }
    syncSettingsUI();
  }

  /* =========================================================
     Ubicación
     ========================================================= */
  var pos = null, demoAt = CITY.demo.slice();
  var gps = { id: null, state: 'idle', last: null, timer: null };
  var arrivedAt = {}, fenceShown = {};
  var geoName = null, geoAt = null, geoT = 0;
  function inCity(c) { return hav(c, CITY.center) <= CITY.radiusKm * 1000; }
  function bootLocation() {
    if (S.locMode === 'demo') { useDemo('forced'); return; }
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(function (r) {
        if (r.state === 'denied') { gps.state = 'denied'; useDemo('denied'); } else startGPS();
      }, function () { startGPS(); });
    } else startGPS();
  }
  function startGPS(fromUser) {
    if (!navigator.geolocation || !window.isSecureContext) { gps.state = 'unavailable'; if (!pos) useDemo('unavailable'); if (fromUser) toast('Este navegador no permite usar el GPS'); return; }
    S.locMode = 'auto'; save();
    if (gps.id != null) {
      if (gps.last && inCity(ll(gps.last))) setPos(gps.last);
      else if (fromUser && gps.state === 'far') toast('Estás lejos de Cúcuta: seguimos con la ubicación de demostración');
      return;
    }
    gps.state = 'asking'; renderLocChip();
    try {
      gps.id = navigator.geolocation.watchPosition(onGPS, onGPSError, { enableHighAccuracy: true, maximumAge: 5000, timeout: 25000 });
    } catch (e) { gps.state = 'unavailable'; if (!pos) useDemo('unavailable'); return; }
    clearTimeout(gps.timer);
    gps.timer = setTimeout(function () { if (!pos) { if (gps.state === 'asking') gps.state = 'timeout'; useDemo(); } }, 9000);
  }
  function onGPS(p) {
    var c = [p.coords.latitude, p.coords.longitude];
    gps.last = { lat: c[0], lng: c[1], acc: p.coords.accuracy, heading: (p.coords.heading != null && !isNaN(p.coords.heading) && p.coords.speed > 0.5) ? p.coords.heading : null, src: 'gps' };
    clearTimeout(gps.timer);
    if (!inCity(c)) {
      var was = gps.state; gps.state = 'far';
      if (!pos || pos.src !== 'demo') useDemo('far');
      if (was !== 'far') toast('Estás lejos de Cúcuta: usamos una ubicación de demostración en el centro', 4200);
      renderLocChip();
      return;
    }
    gps.state = 'on';
    if (S.locMode === 'demo') return;
    if (nav && nav.sim) return;
    setPos(gps.last);
  }
  function onGPSError(e) {
    if (e && e.code === 1) {
      gps.state = 'denied';
      if (gps.id != null) { try { navigator.geolocation.clearWatch(gps.id); } catch (x) {} gps.id = null; }
    } else if (gps.state !== 'on') gps.state = 'unavailable';
    if (!pos) useDemo(gps.state);
    renderLocChip();
  }
  function useDemo() {
    setPos({ lat: demoAt[0], lng: demoAt[1], acc: 15, heading: null, src: 'demo' });
  }
  function setPos(p) {
    var prev = pos;
    pos = { lat: p.lat, lng: p.lng, acc: p.acc, heading: p.heading, src: p.src, t: Date.now() };
    updateMe();
    renderLocChip();
    updateDemoChip();
    if (pos.src === 'gps') reverseGeo();
    if (curId() === 'inicio') renderSuggestion();
    if (nav) navOnPos();
    else checkFence();
    if (!prev || hav(ll(prev), ll(pos)) > 600) {
      if (curId() === 'ayuda') renderNear();
      if (map && !nav && !selId && !routeView && curId() === 'mapa' && (!prev || prev.src !== pos.src)) map.setView(ll(pos), Math.max(map.getZoom(), 15));
    }
  }
  function locStatus() {
    if (!pos) return gps.state === 'asking' ? 'Buscando tu ubicación…' : 'Aún no tenemos tu ubicación.';
    if (pos.src === 'gps') return 'Estás usando tu GPS' + (pos.acc ? ', con una precisión de ' + Math.round(pos.acc) + ' m' : '') + '.';
    if (pos.src === 'sim') return 'Toche está simulando el recorrido.';
    if (gps.state === 'far') return 'Estás lejos de Cúcuta, así que usamos una ubicación de demostración en la ciudad.';
    if (gps.state === 'denied') return 'No diste permiso para usar tu ubicación. Usamos una ubicación de demostración. Para usar tu GPS, permite la ubicación en los ajustes del navegador.';
    if (gps.state === 'unavailable' || gps.state === 'timeout') return 'No pudimos leer tu GPS. Mientras tanto usamos una ubicación de demostración.';
    return 'Estás usando una ubicación de demostración en Cúcuta.';
  }
  function demoLabel() {
    if (hav(demoAt, CITY.demo) < 50) return 'Centro, Cúcuta';
    var n = nearestPlace(demoAt);
    return n && n.d < 1500 ? n.p.area.replace('Centro de Cúcuta', 'Centro, Cúcuta') : 'Cúcuta';
  }
  function renderLocChip() {
    var t = $('#loc-text'), chip = $('#loc-chip');
    var label = !pos ? (gps.state === 'asking' ? 'Buscando tu ubicación…' : 'Activar ubicación')
      : (pos.src === 'gps' ? (geoName || 'Cerca de ti') : demoLabel());
    t.textContent = label;
    var tag = chip.querySelector('.demo-tag'), demo = pos && pos.src !== 'gps';
    if (demo && !tag) t.insertAdjacentHTML('afterend', '<span class="demo-tag" aria-hidden="true">Demo</span>');
    if (!demo && tag) tag.remove();
    chip.setAttribute('aria-label', 'Tu ubicación: ' + label + (demo ? ', de demostración' : '') + '. Toca para cambiarla.');
  }
  function reverseGeo() {
    if (!pos || pos.src !== 'gps') return;
    var c = ll(pos);
    if (geoAt && hav(geoAt, c) < 300) return;
    if (geoAt && Date.now() - geoT < 60000) return;
    geoT = Date.now(); geoAt = c;
    getJSON('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&accept-language=es&lat=' + c[0].toFixed(5) + '&lon=' + c[1].toFixed(5), { timeout: 10000 })
      .then(function (j) {
        var a = (j && j.address) || {};
        var parts = [a.neighbourhood || a.suburb || a.quarter || a.city_district || a.road, a.city || a.town || a.village || a.municipality].filter(Boolean);
        if (parts.length) { geoName = parts.slice(0, 2).join(', '); renderLocChip(); }
      }).catch(function () {});
  }
  function nearestPlace(c, list) {
    var best = null;
    (list || PLACES).forEach(function (p) { if (!p.coords) return; var d = hav(c, p.coords); if (!best || d < best.d) best = { p: p, d: d }; });
    return best;
  }
  function fenceR(p) { return p.precision === 'verificada' ? 45 : 75; }
  function isArrived(id) {
    var p = place(id);
    if (arrivedAt[id] && Date.now() - arrivedAt[id] < 30 * 60000) return true;
    return !!(p && p.coords && pos && hav(ll(pos), p.coords) <= fenceR(p));
  }
  function checkFence() {
    if (!pos) return;
    var n = nearestPlace(ll(pos));
    if (!n || n.d > fenceR(n.p)) return;
    var id = n.p.id;
    arrivedAt[id] = Date.now();
    if (fenceShown[id] && Date.now() - fenceShown[id] < 30 * 60000) return;
    fenceShown[id] = Date.now();
    vibrate([120, 80, 120]);
    var cur = curId();
    if ((cur === 'inicio' || cur === 'mapa') && !overlays.length) {
      speak('¡Llegaste ' + alName(n.p) + '! Esta es su historia.', { force: S.voz });
      openPunto(id, { arrived: true, keepVoice: true });
    } else toast('Estás en ' + n.p.name + '. Abre el mapa para ver su historia.', 4000);
  }
  function openLocSheet() {
    openModal('<div class="m-head"><span class="m-ic" style="--t:#E6F6FD;--c:#0369A1">' + ic('pin') + '</span><h2 class="t-h2" id="modal-title" tabindex="-1">Tu ubicación</h2></div>' +
      '<p class="m-text">' + esc(locStatus()) + '</p>' +
      '<div class="m-actions"><button type="button" class="btn btn-primary btn-block" data-m="gps">' + ic('nav') + 'Usar mi GPS</button>' +
      '<button type="button" class="btn btn-ghost btn-block" data-m="demo">' + ic('pin') + 'Usar ubicación de demostración</button></div>' +
      '<p class="t-note left">La ubicación de demostración te pone en el centro de Cúcuta para probar la app desde cualquier lugar.</p>');
  }
  $('#loc-chip').addEventListener('click', openLocSheet);
  $('#demo-chip').addEventListener('click', openLocSheet);
  function updateDemoChip() {
    var c = $('#demo-chip');
    c.hidden = !(pos && pos.src === 'demo') || !!nav;
  }

  /* =========================================================
     Datos abiertos: Overpass (OSM), OSRM, Nominatim
     ========================================================= */
  var OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
  function overpass(q) {
    var body = 'data=' + encodeURIComponent(q), i = 0;
    function attempt() {
      return getJSON(OVERPASS[i], { body: body, headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, timeout: 25000 })
        .catch(function (e) { if (++i < OVERPASS.length) return attempt(); throw e; });
    }
    return attempt();
  }
  function centerOf(e) { return e.center ? [e.center.lat, e.center.lon] : (e.lat != null ? [e.lat, e.lon] : null); }
  function phoneOf(t) {
    var p = t.phone || t['contact:phone'] || t['contact:mobile'];
    if (!p) return null;
    p = String(p).split(/[;,/]/)[0].replace(/[^\d+]/g, '');
    return p.length >= 3 ? p : null;
  }

  function resolvePlaces() {
    var cached = cacheGet('places-v2', 7 * 864e5);
    if (cached) { applyResolved(cached); return; }
    var bb = '(7.78,-72.58,7.98,-72.42)';
    var q = '[out:json][timeout:25];(' +
      'nwr["name"~"Malec[oó]n",i]' + bb + ';' +
      'nwr["name"~"Cristo Rey",i]' + bb + ';' +
      'nwr["leisure"="park"]["name"~"Santander",i](around:700,7.88654,-72.50442);' +
      'nwr["name"~"Quinta Teresa",i](around:1200,7.88178,-72.50218);' +
      'nwr["name"~"Casa Natal",i](around:2500,7.8285,-72.4622);' +
      'way["highway"]["name"~"Libertadores",i](7.85,-72.53,7.95,-72.47);' +
      ');out center tags;';
    overpass(q).then(function (j) {
      var els = (j && j.elements) || [];
      function pick(test, near, maxD) {
        var best = null, bd = Infinity;
        els.forEach(function (e) {
          var t = e.tags || {}, c = centerOf(e);
          if (!c || !test(t)) return;
          var d = near ? hav(c, near) : 0;
          if (maxD && d > maxD) return;
          if (d < bd) { bd = d; best = c; }
        });
        return best;
      }
      function notBusiness(t) { return !t.shop && !t.office && !t.craft && !(t.amenity && t.amenity !== 'fountain'); }
      var res = {};
      var m = pick(function (t) { return /malec[oó]n/i.test(t.name || '') && notBusiness(t); }, CITY.center, 9000);
      if (m) res.malecon = { c: m, src: 'OpenStreetMap' };
      else {
        var av = pick(function (t) { return t.highway && /libertadores/i.test(t.name || ''); }, CITY.center, 9000);
        if (av) res.malecon = { c: av, src: 'Avenida Los Libertadores en OpenStreetMap' };
      }
      var cr = pick(function (t) { return /cristo rey/i.test(t.name || '') && (t.historic || t.tourism || t.man_made || t.memorial) && t.amenity !== 'place_of_worship' && !/church|cathedral|chapel/.test(t.building || ''); }, CITY.center, 12000);
      if (cr) res.cristo = { c: cr, src: 'OpenStreetMap' };
      var pq = pick(function (t) { return t.leisure === 'park' && /santander/i.test(t.name || ''); }, [7.88654, -72.50442], 700);
      if (pq) res.parque = { c: pq, src: 'OpenStreetMap' };
      var qt = pick(function (t) { return /quinta teresa/i.test(t.name || ''); }, [7.88178, -72.50218], 1200);
      if (qt) res.quinta = { c: qt, src: 'OpenStreetMap' };
      var cs = pick(function (t) { return /casa natal/i.test(t.name || ''); }, [7.8285, -72.4622], 2500);
      if (cs) res.casa = { c: cs, src: 'OpenStreetMap' };
      cacheSet('places-v2', res);
      applyResolved(res);
    }).catch(function () {});
  }
  function applyResolved(res) {
    var changed = false;
    Object.keys(res || {}).forEach(function (id) {
      var r = res[id], p = place(id);
      if (!r || !p || p.precision === 'verificada') return;
      p.coords = r.c; p.precision = 'osm'; p.fuente = 'Ubicada con datos de ' + r.src + '.';
      changed = true;
    });
    if (!changed) return;
    if (map && !nav) { if (routeView) showRouteOverview(routeView.id, true); else renderMarkers(); }
    if (curId() === 'inicio') renderSuggestion();
  }

  var svc = { list: null, at: null, loading: null, failed: false };
  function loadServices() {
    var c = pos ? ll(pos) : CITY.center;
    if (svc.loading) return svc.loading;
    if (svc.list && svc.at && hav(svc.at, c) < 1500 && !(svc.failed && Date.now() - svc.failedAt > 60000)) return Promise.resolve(svc.list);
    var key = 'svc:' + c[0].toFixed(2) + ',' + c[1].toFixed(2);
    var cached = cacheGet(key, 864e5);
    if (cached && cached.length) { svc.list = cached; svc.at = c; svc.failed = false; return Promise.resolve(cached); }
    var a = '(around:9000,' + c[0].toFixed(5) + ',' + c[1].toFixed(5) + ')';
    var q = '[out:json][timeout:25];(nwr["amenity"="hospital"]' + a + ';nwr["amenity"="clinic"]["emergency"="yes"]' + a + ';nwr["amenity"="police"]' + a + ';);out center tags;';
    svc.loading = overpass(q).then(function (j) {
      var list = [], seen = {};
      ((j && j.elements) || []).forEach(function (e) {
        var t = e.tags || {}, cc = centerOf(e);
        if (!cc) return;
        var kind = t.amenity === 'police' ? 'cai' : 'hospital';
        var name = t.name || (kind === 'cai' ? 'Estación de Policía' : 'Hospital');
        var k = kind + norm(name);
        if (seen[k] && hav(seen[k], cc) < 300) return;
        seen[k] = cc;
        list.push({ id: 'osm-' + e.type.charAt(0) + e.id, type: 'svc', kind: kind, name: name, coords: cc, phone: phoneOf(t),
          er: t.emergency === 'yes' || /24\/7/.test(t.opening_hours || ''), cat: 'servicios' });
      });
      if (!list.length) throw new Error('vacío');
      svc.list = list; svc.at = c; svc.failed = false;
      cacheSet(key, list);
      return list;
    }).catch(function () {
      svc.failed = true; svc.failedAt = Date.now(); svc.at = c;
      svc.list = D.FALLBACK_SERVICES.map(function (s) { return { id: s.id, type: 'svc', kind: s.kind, name: s.name, coords: s.coords, phone: s.phone, er: false, cat: 'servicios', sub: s.note }; });
      return svc.list;
    }).then(function (l) { svc.loading = null; return l; });
    return svc.loading;
  }

  var food = { list: null, at: null, loading: null };
  function loadFood() {
    var c = pos ? ll(pos) : CITY.center;
    if (food.loading) return food.loading;
    if (food.list && food.at && hav(food.at, c) < 700) return Promise.resolve(food.list);
    var key = 'food:' + c[0].toFixed(3) + ',' + c[1].toFixed(3);
    var cached = cacheGet(key, 864e5);
    if (cached) { food.list = cached; food.at = c; return Promise.resolve(cached); }
    var q = '[out:json][timeout:25];nwr["amenity"~"^(restaurant|fast_food|cafe)$"]["name"](around:1600,' + c[0].toFixed(5) + ',' + c[1].toFixed(5) + ');out center tags;';
    food.loading = overpass(q).then(function (j) {
      var list = [];
      ((j && j.elements) || []).forEach(function (e) {
        var t = e.tags || {}, cc = centerOf(e);
        if (!cc || !t.name) return;
        var typical = /regional|colombian|local|traditional|arepa/i.test(t.cuisine || '');
        list.push({ id: 'food-' + e.type.charAt(0) + e.id, type: 'food', name: t.name, coords: cc, cat: 'gastronomia', phone: phoneOf(t),
          sub: typical ? 'Comida típica' : (t.amenity === 'cafe' ? 'Café' : (t.amenity === 'fast_food' ? 'Comida rápida' : 'Restaurante')), typical: typical });
      });
      food.list = list; food.at = c; cacheSet(key, list);
      return list;
    }).then(function (l) { food.loading = null; return l; }, function (e) { food.loading = null; throw e; });
    return food.loading;
  }

  var routeMemo = {};
  function getRoute(points, profile) {
    var key = profile + ':' + points.map(function (p) { return p[0].toFixed(4) + ',' + p[1].toFixed(4); }).join(';');
    var m = routeMemo[key];
    if (m && Date.now() - m.t < 10 * 60000) return Promise.resolve(m.r);
    var url = 'https://routing.openstreetmap.de/routed-' + (profile === 'car' ? 'car' : 'foot') + '/route/v1/driving/' +
      points.map(function (p) { return p[1].toFixed(6) + ',' + p[0].toFixed(6); }).join(';') +
      '?overview=full&geometries=geojson&steps=true&alternatives=false';
    return getJSON(url, { timeout: 15000 }).then(function (j) {
      if (!j || j.code !== 'Ok' || !j.routes || !j.routes.length) throw new Error('sin ruta');
      var r = j.routes[0], steps = [];
      r.legs.forEach(function (leg, li) {
        leg.steps.forEach(function (s) {
          steps.push({ type: s.maneuver.type, mod: s.maneuver.modifier, exit: s.maneuver.exit, loc: [s.maneuver.location[1], s.maneuver.location[0]],
            name: s.name, ref: s.ref, dist: s.distance, dur: s.duration, bAfter: s.maneuver.bearing_after, leg: li });
        });
      });
      var out = { coords: ((r.geometry && r.geometry.coordinates) || []).map(function (c) { return [c[1], c[0]]; }), steps: steps, dist: r.distance, dur: r.duration, profile: profile, approx: false };
      if (out.coords.length < 2 || steps.length < 2 || !(out.dist > 0)) throw new Error('ruta vacía');
      routeMemo[key] = { t: Date.now(), r: out };
      return out;
    });
  }
  function straightRoute(from, to, profile) {
    var d = hav(from, to), b = bearing(from, to);
    return { coords: [from, to], dist: d, dur: profile === 'car' ? d / 8 : walkSec(d * 1.3), profile: profile, approx: true,
      steps: [{ type: 'depart', bAfter: b, dist: d, loc: from, name: '', leg: 0 }, { type: 'arrive', dist: 0, loc: to, name: '', leg: 0 }] };
  }

  /* Indicaciones en español a partir de los pasos de OSRM */
  var MOD = { left: 'a la izquierda', right: 'a la derecha', 'slight left': 'un poco a la izquierda', 'slight right': 'un poco a la derecha',
    'sharp left': 'bien a la izquierda', 'sharp right': 'bien a la derecha', straight: 'derecho', uturn: 'en U' };
  var ORD = ['primera', 'segunda', 'tercera', 'cuarta', 'quinta', 'sexta', 'séptima'];
  function stepText(s, destName) {
    var n = s.name || s.ref || '', por = n ? ' por ' + n : '';
    var m = s.mod || '';
    switch (s.type) {
      case 'depart': return 'Sal hacia ' + cardinal(s.bAfter) + por;
      case 'arrive': return 'Llegas ' + (destName ? 'a ' + destName : 'a tu destino') + (/left/.test(m) ? ', a tu izquierda' : (/right/.test(m) ? ', a tu derecha' : ''));
      case 'roundabout': case 'rotary': case 'roundabout turn':
        return 'En la glorieta, toma la ' + (ORD[(s.exit || 1) - 1] || s.exit + 'ª') + ' salida' + (n ? ' hacia ' + n : '');
      case 'exit roundabout': case 'exit rotary': return 'Sal de la glorieta' + por;
      case 'fork': return 'Mantente ' + (/left/.test(m) ? 'a la izquierda' : 'a la derecha') + por;
      default:
        if (!m || m === 'straight') return 'Sigue derecho' + por;
        if (m === 'uturn') return 'Da la vuelta en U' + por;
        return 'Gira ' + (MOD[m] || m) + (n ? ' en ' + n : '');
    }
  }
  function stepIcon(s) {
    if (s.type === 'arrive') return 'pin';
    if (/roundabout|rotary/.test(s.type)) return 'turn-right';
    var m = s.mod || '';
    if (/uturn/.test(m)) return 'uturn';
    if (/left/.test(m)) return 'turn-left';
    if (/right/.test(m)) return 'turn-right';
    return 'straight';
  }

  /* =========================================================
     Mapa (Leaflet)
     ========================================================= */
  var TILES = {
    light: { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', opt: { subdomains: 'abcd', maxZoom: 20, maxNativeZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>' } },
    dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', opt: { subdomains: 'abcd', maxZoom: 20, maxNativeZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>' } },
    osm: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', opt: { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' } }
  };
  var map = null, tiles = null, tileMode = null, tileErr = 0, tileOk = 0, osmFallback = false, mapCentered = false;
  var L_places, L_extra, L_route, L_stops, meMk = null, accCircle = null;
  var items = {}, markers = {}, filter = 'todo', selId = null, following = false, routeView = null, previewToken = 0;

  function initMap() {
    if (map) return true;
    if (!window.L) return false;
    map = L.map('map', { zoomControl: false, attributionControl: true, center: CITY.center, zoom: 15, minZoom: 10, maxZoom: 19, zoomSnap: 0.5, wheelPxPerZoomLevel: 90, tapTolerance: 20 });
    map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
    setTiles();
    L_route = L.layerGroup().addTo(map);
    L_places = L.layerGroup().addTo(map);
    L_extra = L.layerGroup().addTo(map);
    L_stops = L.layerGroup().addTo(map);
    map.on('click', function (e) {
      var t = e.originalEvent && e.originalEvent.target;
      if (t && t.closest && t.closest('.leaflet-marker-icon')) return;
      hideSug();
      if (!routeView && selId && !nav) deselect();
    });
    map.on('dragstart', function () { setFollowing(false); });
    if (pos) { map.setView(ll(pos), 15.5); mapCentered = true; }
    updateMe();
    renderMarkers();
    return true;
  }
  function setTiles() {
    if (!map) return;
    var mode = osmFallback ? 'osm' : (S.contraste ? 'dark' : 'light');
    if (tiles && tileMode === mode) return;
    if (tiles) map.removeLayer(tiles);
    var T = TILES[mode];
    tiles = L.tileLayer(T.url, T.opt); tileMode = mode; tileErr = 0; tileOk = 0;
    tiles.on('tileerror', function () {
      tileErr++;
      if (!tileOk && tileErr >= 6 && !osmFallback) { osmFallback = true; $('#map').classList.add('osm-tiles'); setTiles(); }
      else if (!tileOk && tileErr >= 10) showMapMsg('No pudimos cargar el mapa. Revisa tu conexión a internet.');
    });
    tiles.on('tileload', function () { if (!tileOk) hideMapMsg(); tileOk++; });
    tiles.addTo(map);
  }
  function showMapMsg(text) {
    var m = $('#map-msg');
    if (!m) { m = document.createElement('div'); m.id = 'map-msg'; m.className = 'map-msg'; m.setAttribute('role', 'status'); $('#s-mapa').insertBefore(m, $('#s-mapa .explore-ui')); }
    m.innerHTML = '<span>' + esc(text) + '</span><button type="button" class="btn btn-primary btn-sm" id="map-retry">Reintentar</button>';
    m.hidden = false;
    $('#map-retry').onclick = function () { hideMapMsg(); if (tiles) { tileErr = 0; tiles.redraw(); } };
  }
  function hideMapMsg() { var m = $('#map-msg'); if (m) m.hidden = true; }

  function itemFromPlace(p) { return { id: p.id, type: 'place', name: p.name, coords: p.coords, cat: p.cat, thumb: p.thumb, place: p }; }
  function catOf(it) { return CAT[it.cat] || CAT.servicios; }
  function itemLabel(it) {
    if (it.type === 'svc') return it.kind === 'hospital' ? 'Hospital' : 'Policía';
    if (it.type === 'food') return it.sub || 'Gastronomía';
    if (it.type === 'search') return 'Lugar';
    return catOf(it).label;
  }
  function itemIcon(it) {
    if (it.type === 'svc') return it.kind === 'hospital' ? 'cross' : 'shield';
    if (it.type === 'search') return 'pin';
    return ART.CAT_ICON[it.cat] || 'pin';
  }
  function sortByDist(list, c) {
    c = c || (pos ? ll(pos) : CITY.center);
    return list.slice().sort(function (a, b) { return hav(c, a.coords) - hav(c, b.coords); });
  }

  function addMarker(it, layer, k) {
    items[it.id] = it;
    var cls = 'rt-pin drop', html;
    if (it.type === 'svc') { html = ART.pinService(it.kind); cls += ' svc'; }
    else if (it.type === 'search') { html = ART.pinSearch(); cls += ' search'; }
    else { html = ART.pin(it.cat); cls += it.type === 'place' ? ' place' : ' food'; }
    if (it.id === selId) cls += ' is-sel';
    var icon = L.divIcon({ className: cls, html: '<div class="pin" style="--d:' + ((k || 0) * 45) + 'ms">' + html + '</div><span class="pin-label">' + esc(it.name) + '</span>', iconSize: [40, 52], iconAnchor: [20, 50] });
    var m = L.marker(it.coords, { icon: icon, keyboard: true, riseOnHover: true, zIndexOffset: it.id === selId ? 1000 : (it.type === 'place' ? 200 : 0) });
    m.on('click', function () { select(it.id); });
    m.addTo(layer);
    var el = m.getElement();
    if (el) { el.setAttribute('role', 'button'); el.setAttribute('aria-label', it.name + ', ' + itemLabel(it)); }
    markers[it.id] = m;
    return m;
  }
  function renderMarkers() {
    if (!map) return;
    L_places.clearLayers(); L_extra.clearLayers(); markers = {};
    if (routeView) return;
    var f = filter, k = 0;
    if (f !== 'servicios') PLACES.forEach(function (p) {
      if (!p.coords || (f !== 'todo' && f !== p.cat)) return;
      addMarker(itemFromPlace(p), L_places, k++);
    });
    Object.keys(items).forEach(function (id) { if (items[id].type === 'search' && items[id].kept) addMarker(items[id], L_extra, k++); });
    if (f === 'gastronomia') {
      chipBusy('gastronomia', true);
      loadFood().then(function (list) {
        chipBusy('gastronomia', false);
        if (filter !== f || routeView) return;
        var l = sortByDist(list).sort(function (a, b) { return (b.typical ? 1 : 0) - (a.typical ? 1 : 0); }).slice(0, 30);
        l.forEach(function (it, i) { addMarker(it, L_extra, i); });
        if (!list.length) toast('No encontramos restaurantes cerca en OpenStreetMap');
        if (selId && !markers[selId]) deselect();
      }, function () { chipBusy('gastronomia', false); toast('No pudimos cargar los restaurantes. Revisa tu conexión.'); });
    }
    if (f === 'todo' || f === 'servicios') {
      if (f === 'servicios') chipBusy('servicios', true);
      loadServices().then(function (list) {
        chipBusy('servicios', false);
        if (filter !== f || routeView) return;
        var l = sortByDist(list);
        if (f === 'todo') {
          var h = l.filter(function (s) { return s.kind === 'hospital'; }).slice(0, 2), c = l.filter(function (s) { return s.kind === 'cai'; }).slice(0, 2);
          l = h.concat(c);
        } else l = l.slice(0, 40);
        l.forEach(function (it, i) { addMarker(it, L_extra, i); });
        if (selId && items[selId] && items[selId].type === 'svc' && !markers[selId]) addMarker(items[selId], L_extra, 0);
      });
    }
    if (selId && !markers[selId] && !(items[selId] && /svc|food/.test(items[selId].type))) deselect();
  }
  function chipBusy(f, on) {
    var b = $('#map-chips [data-f="' + f + '"]');
    if (!b) return;
    var s = b.querySelector('.spin-dot');
    if (on && !s) b.insertAdjacentHTML('beforeend', '<span class="spin-dot" aria-hidden="true"></span>');
    if (!on && s) s.remove();
    b.setAttribute('aria-busy', on ? 'true' : 'false');
  }
  var MAP_FILTERS = [['todo', 'Todo', 'grid', null], ['historia', 'Historia', 'landmark', 'historia'], ['cultural', 'Cultural', 'palette', 'cultural'],
    ['gastronomia', 'Gastronomía', 'utensils', 'gastronomia'], ['religioso', 'Religioso', 'church', 'religioso'], ['naturaleza', 'Naturaleza', 'tree', 'naturaleza'], ['servicios', 'Servicios', 'help', 'servicios']];
  function chipsHTML(list, active, attr) {
    return list.map(function (f) {
      return '<button type="button" class="chip" aria-pressed="' + (f[0] === active) + '" ' + attr + '="' + f[0] + '"><span class="chip-ic" style="--c:' + (f[3] ? 'var(--c-' + f[3] + ')' : 'var(--ink)') + '">' + ic(f[2]) + '</span>' + f[1] + '</button>';
    }).join('');
  }
  function setFilter(f, say) {
    filter = f;
    $$('#map-chips .chip').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-f') === f ? 'true' : 'false'); });
    if (routeView) closeRouteOverview(true);
    renderMarkers();
    if (say) { var x = byId(MAP_FILTERS.map(function (m) { return { id: m[0], l: m[1] }; }), f); speak('Mostrando ' + (x ? x.l : f)); }
  }
  $('#map-chips').innerHTML = chipsHTML(MAP_FILTERS, filter, 'data-f');
  $('#map-chips').addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (b) setFilter(b.getAttribute('data-f'), true); });

  function updateMe() {
    if (!map || !pos) return;
    var c = ll(pos);
    if (!meMk) {
      var html = '<div class="me"><span class="me-pulse"></span><span class="me-cone"></span><span class="me-dot"></span>' +
        '<span class="me-puck"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L19 20 L12 16 L5 20 Z" fill="#0EA5E9" stroke="#0369A1" stroke-width="1.5" stroke-linejoin="round"/></svg></span></div>';
      meMk = L.marker(c, { icon: L.divIcon({ className: 'rt-me', html: html, iconSize: [56, 56], iconAnchor: [28, 28] }), interactive: false, keyboard: false, zIndexOffset: 900 }).addTo(map);
    } else meMk.setLatLng(c);
    if (pos.src === 'gps' && pos.acc > 25 && !nav) {
      if (!accCircle) accCircle = L.circle(c, { radius: pos.acc, color: '#0EA5E9', weight: 1, opacity: .5, fillOpacity: .08, interactive: false }).addTo(map);
      else { accCircle.setLatLng(c); accCircle.setRadius(pos.acc); }
    } else if (accCircle) { map.removeLayer(accCircle); accCircle = null; }
    var el = meMk.getElement(), me = el && el.querySelector('.me');
    if (!me) return;
    me.classList.toggle('is-nav', !!nav);
    me.classList.toggle('is-demo', pos.src === 'demo');
    var hd = pos.heading;
    if ((hd == null || isNaN(hd)) && nav && nav.hd != null) hd = nav.hd;
    me.classList.toggle('has-heading', hd != null && !isNaN(hd));
    if (hd != null && !isNaN(hd)) me.style.setProperty('--hd', Math.round(hd) + 'deg');
    if (following) {
      if (nav) {
        var z = map.getZoom(), sz = map.getSize();
        map.panTo(map.unproject(map.project(c, z).subtract([0, sz.y * 0.17]), z), { animate: true, duration: 0.45 });
      } else map.panTo(c, { animate: true, duration: 0.6 });
    }
  }
  function setFollowing(on) { following = on; $('#locate').classList.toggle('following', on); }

  function showCard(sel) { $(sel).hidden = false; requestAnimationFrame(placeAttr); }
  function placeAttr() {
    if (!map) return;
    var el = null;
    if ($('#s-mapa').classList.contains('nav-on')) el = $('.nav-bottom');
    else if (!$('#place-card').hidden) el = $('#place-card');
    else if (!$('#route-card').hidden) el = $('#route-card');
    else el = $('.tabbar');
    var ar = app.getBoundingClientRect(), er = el.getBoundingClientRect(), k = (ar.height / app.offsetHeight) || 1;
    var b = (ar.bottom - er.top) / k + 6;
    $('#map').style.setProperty('--attr-b', Math.max(0, Math.round(b)) + 'px');
  }

  function distHTML(it, r) {
    if (!pos || !it.coords) return ic('pin') + 'Activa tu ubicación para ver la distancia';
    var d = r ? r.dist : hav(ll(pos), it.coords);
    var car = r ? r.profile === 'car' : d > 2500;
    var t = r ? r.dur : (car ? d / 8 : walkSec(d * 1.3));
    return ic(car ? 'car' : 'walk') + (car ? 'En carro · ' : '') + fmtMin(t) + ' · ' + fmtDist(d) + (r && r.approx ? ' aprox.' : '');
  }
  function renderPlaceCard(it) {
    var c = $('#place-card'), color = 'var(--c-' + (it.cat || 'servicios') + ')', tint = catOf(it).tint;
    if (it.type === 'search') { color = '#0369A1'; tint = '#E6F6FD'; }
    var thumb = it.type === 'place' ? ART.thumb(it.thumb, 76) : ic(itemIcon(it));
    var sec = '';
    if (it.type === 'place') sec = '<button type="button" class="btn btn-soft" data-act="listen" aria-pressed="false">' + ic('vol') + '<span>Escuchar</span></button>';
    else if (it.type === 'svc') sec = '<a class="btn btn-soft" href="tel:' + (it.phone || (it.kind === 'cai' ? '112' : '123')) + '">' + ic('phone') + 'Llamar' + (it.phone ? '' : ' ' + (it.kind === 'cai' ? '112' : '123')) + '</a>';
    else if (it.phone) sec = '<a class="btn btn-soft" href="tel:' + it.phone + '">' + ic('phone') + 'Llamar</a>';
    var info = '<span class="pc-thumb" style="--t:' + tint + ';--c:' + color + '">' + thumb + '</span>' +
      '<span class="pc-txt"><span class="cat-chip" style="--t:' + tint + ';--c:' + color + '">' + ic(itemIcon(it)) + esc(itemLabel(it)) + '</span>' +
      '<span class="pc-name">' + esc(it.name) + '</span>' +
      '<span class="pc-dist" id="pc-dist">' + distHTML(it) + '</span>' +
      (it.type === 'place' ? '<span class="pc-more">Ver historia' + ic('chev-r') + '</span>' : (it.sub ? '<span class="pc-dist">' + esc(it.sub) + '</span>' : '')) + '</span>';
    c.innerHTML = '<button type="button" class="card-x" data-act="close" aria-label="Cerrar">' + ic('x') + '</button>' +
      (it.type === 'place' ? '<button type="button" class="pc-info" data-act="open" aria-label="Ver la historia ' + esc(delName(it.place)) + '">' + info + '</button>' : '<div class="pc-info">' + info + '</div>') +
      '<div class="pc-actions"><button type="button" class="btn btn-primary grow" data-act="go">' + ic('nav') + 'Cómo llegar</button>' + sec + '</div>';
    c.setAttribute('data-id', it.id);
  }
  $('#place-card').addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var it = items[$('#place-card').getAttribute('data-id')]; if (!it) return;
    var a = b.getAttribute('data-act');
    if (a === 'close') deselect();
    else if (a === 'open') openPunto(it.id);
    else if (a === 'go') startNav(it);
    else if (a === 'listen') {
      if (b.getAttribute('aria-pressed') === 'true') { stopSpeak(); return; }
      var p = it.place, txt = p.name + '. ' + (p.facts || []).slice(0, 2).join(' ');
      var setUI = function (on) {
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.innerHTML = on ? '<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span><span>Pausar</span>' : ic('vol') + '<span>Escuchar</span>';
      };
      if (speak(txt, { force: true, banner: false, onend: function () { setUI(false); }, onstop: function () { setUI(false); } })) setUI(true);
    }
  });

  function select(id, opts) {
    opts = opts || {};
    if (!map) return;
    var it = items[id] || (place(id) && place(id).coords ? itemFromPlace(place(id)) : null);
    if (!it) { var p0 = place(id); if (p0 && !p0.coords) toast(p0.name + ': ubicación no disponible por ahora'); return; }
    if (routeView) closeRouteOverview();
    hideSug();
    if (it.type === 'search') it.kept = true;
    if (selId && markers[selId]) { var e0 = markers[selId].getElement(); if (e0) e0.classList.remove('is-sel'); markers[selId].setZIndexOffset(it.type === 'place' ? 200 : 0); }
    selId = id; items[id] = it;
    if (!markers[id]) addMarker(it, it.type === 'place' ? L_places : L_extra, 0);
    var el = markers[id].getElement(); if (el) el.classList.add('is-sel');
    markers[id].setZIndexOffset(1000);
    renderPlaceCard(it);
    $('#route-card').hidden = true;
    showCard('#place-card');
    L_route.clearLayers();
    frame(it);
    previewRoute(it);
    if (!opts.silent) speak(it.name + ', ' + itemLabel(it) + '. ' + ($('#pc-dist') ? $('#pc-dist').textContent : ''));
  }
  function deselect() {
    if (selId && markers[selId]) { var e0 = markers[selId].getElement(); if (e0) e0.classList.remove('is-sel'); markers[selId].setZIndexOffset(0); }
    selId = null; previewToken++;
    $('#place-card').hidden = true;
    if (!nav && !routeView && L_route) L_route.clearLayers();
    if (speakOpts && speakOpts.onstop) stopSpeak();
    requestAnimationFrame(placeAttr);
  }
  function framePad() {
    var card = !$('#place-card').hidden ? $('#place-card') : (!$('#route-card').hidden ? $('#route-card') : null);
    var bottom = card ? card.offsetHeight + 110 : 120;
    return { tl: [40, 200], br: [84, bottom] };
  }
  function frame(it) {
    var pad = framePad();
    if (pos && hav(ll(pos), it.coords) < 12000) {
      map.fitBounds(L.latLngBounds([ll(pos), it.coords]), { paddingTopLeft: pad.tl, paddingBottomRight: pad.br, maxZoom: 17, animate: true });
    } else {
      map.setView(it.coords, 16, { animate: true });
    }
    setFollowing(false);
  }
  function previewRoute(it) {
    if (!pos || !it.coords) return;
    var my = ++previewToken, from = ll(pos), d = hav(from, it.coords);
    var profile = d > 2500 ? 'car' : 'foot';
    getRoute([from, it.coords], profile).catch(function () { return straightRoute(from, it.coords, profile); }).then(function (r) {
      if (my !== previewToken || selId !== it.id || nav || routeView) return;
      drawRoute(r.coords, r.approx ? 'approx' : 'preview');
      var dl = $('#pc-dist'); if (dl) dl.innerHTML = distHTML(it, r);
    });
  }
  function drawRoute(coords, style) {
    if (!map) return;
    L_route.clearLayers();
    if (!coords || coords.length < 2) return;
    var hc = S.contraste, main = hc ? '#FFD60A' : '#C8102E', casing = hc ? '#000000' : '#FFFFFF';
    var o = { lineCap: 'round', lineJoin: 'round', interactive: false };
    function line(extra) { var x = {}; Object.keys(o).forEach(function (k) { x[k] = o[k]; }); Object.keys(extra).forEach(function (k) { x[k] = extra[k]; }); return L.polyline(coords, x).addTo(L_route); }
    if (style === 'nav') {
      line({ color: casing, weight: 13, opacity: 1 });
      line({ color: main, weight: 8, opacity: 1 });
      line({ color: hc ? '#000000' : '#FFFFFF', weight: 2.4, opacity: 0.9, dashArray: '3 13', className: 'rt-route-flow' });
    } else if (style === 'overview') {
      line({ color: casing, weight: 9, opacity: 0.95 });
      line({ color: main, weight: 5, opacity: 0.9 });
    } else {
      line({ color: casing, weight: 9, opacity: 0.95 });
      line({ color: main, weight: 5, opacity: 1, dashArray: style === 'approx' ? '2 12' : '0.1 10' });
    }
  }

  /* Búsqueda */
  var qEl = $('#q'), sugEl = $('#suggestions');
  function hideSug() { sugEl.hidden = true; sugEl.innerHTML = ''; }
  function placeMatches(text) {
    var n = norm(text);
    var withC = PLACES.slice();
    if (!n) return sortByDist(withC.filter(function (p) { return p.coords; })).slice(0, 5);
    var toks = n.split(' ');
    return withC.filter(function (p) {
      var hay = norm(p.name + ' ' + CAT[p.cat].label + ' ' + p.area + ' ' + (KEYWORDS[p.id] || []).join(' '));
      return toks.every(function (t) { return hay.indexOf(t) >= 0; });
    }).slice(0, 6);
  }
  function sugHTML(p) {
    var d = pos && p.coords ? ' · ' + fmtDist(hav(ll(pos), p.coords)) : (p.coords ? '' : ' · sin ubicación aún');
    return '<li><button type="button" class="sug" data-sug="' + p.id + '"><span class="sug-ic" style="--t:' + CAT[p.cat].tint + ';--c:var(--c-' + p.cat + ')">' + ic(ART.CAT_ICON[p.cat]) + '</span>' +
      '<span class="grow"><b>' + esc(p.name) + '</b><small>' + esc(CAT[p.cat].label + d) + '</small></span></button></li>';
  }
  function renderLocalSug() {
    var list = placeMatches(qEl.value);
    if (!list.length && !qEl.value.trim()) { hideSug(); return; }
    sugEl.innerHTML = list.map(sugHTML).join('') +
      (qEl.value.trim() ? '<li><button type="button" class="sug" data-search="1"><span class="sug-ic">' + ic('search') + '</span><span class="grow"><b>Buscar «' + esc(qEl.value.trim()) + '»</b><small>En OpenStreetMap</small></span></button></li>' : '');
    sugEl.hidden = false;
  }
  qEl.addEventListener('input', debounce(renderLocalSug, 120));
  qEl.addEventListener('focus', renderLocalSug);
  qEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); runSearch(qEl.value); }
    else if (e.key === 'ArrowDown') { var f = sugEl.querySelector('button'); if (f) { e.preventDefault(); f.focus(); } }
  });
  sugEl.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    var bs = $$('button', sugEl), i = bs.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    var j = i + (e.key === 'ArrowDown' ? 1 : -1);
    if (j < 0) qEl.focus(); else if (bs[j]) bs[j].focus();
  });
  sugEl.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-search')) { runSearch(qEl.value, true); return; }
    var id = b.getAttribute('data-sug');
    hideSug(); qEl.blur();
    if (id) select(id);
  });
  function runSearch(text, forceRemote) {
    var t = String(text || '').trim();
    if (!t) return;
    var local = forceRemote ? [] : placeMatches(t).filter(function (p) { return p.coords; });
    if (local.length) { hideSug(); qEl.blur(); select(local[0].id); return; }
    sugEl.innerHTML = '<li class="sug-note" role="status">Buscando «' + esc(t) + '»…</li>';
    sugEl.hidden = false;
    var url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=co&bounded=1&accept-language=es&viewbox=' +
      [CITY.bbox[1], CITY.bbox[2], CITY.bbox[3], CITY.bbox[0]].join(',') + '&q=' + encodeURIComponent(t);
    getJSON(url, { timeout: 12000 }).then(function (res) {
      if (!res || !res.length) { sugEl.innerHTML = '<li class="sug-note" role="status">No encontramos «' + esc(t) + '» en Cúcuta. Prueba con otro nombre.</li>'; return; }
      sugEl.innerHTML = res.map(function (r) {
        var parts = String(r.display_name || '').split(',');
        var it = { id: 'nm-' + r.osm_type + r.osm_id, type: 'search', name: r.name || parts[0], sub: parts.slice(1, 3).join(',').trim(), coords: [+r.lat, +r.lon], cat: 'servicios' };
        items[it.id] = it;
        return '<li><button type="button" class="sug" data-sug="' + it.id + '"><span class="sug-ic" style="--t:#E6F6FD;--c:#0369A1">' + ic('pin') + '</span><span class="grow"><b>' + esc(it.name) + '</b><small>' + esc(it.sub) + '</small></span></button></li>';
      }).join('') + '<li class="sug-note">Resultados de OpenStreetMap</li>';
      Object.keys(items).forEach(function (id) { if (items[id].type === 'search' && markers[id] && id !== selId) { L_extra.removeLayer(markers[id]); delete markers[id]; } });
    }).catch(function () { sugEl.innerHTML = '<li class="sug-note" role="status">No pudimos buscar ahora. Revisa tu conexión.</li>'; });
  }
  $('#btn-map-mic').addEventListener('click', function () {
    if (!listen(this, function (t) { qEl.value = t; runSearch(t); })) { qEl.focus(); toast('Escribe el lugar que buscas'); }
  });

  /* Controles del mapa */
  $('#zin').addEventListener('click', function () { if (map) map.zoomIn(); });
  $('#zout').addEventListener('click', function () { if (map) map.zoomOut(); });
  $('#locate').addEventListener('click', function () {
    if (!pos || (pos.src !== 'gps' && S.locMode !== 'demo' && gps.state !== 'far' && gps.state !== 'denied')) startGPS(true);
    if (!pos) { toast('Buscando tu ubicación…'); return; }
    if (map) { map.setView(ll(pos), Math.max(map.getZoom(), 16.5), { animate: true }); setFollowing(true); }
    if (pos.src === 'demo') toast(gps.state === 'denied' ? 'Sin permiso de GPS: estás en la ubicación de demostración' : 'Estás en la ubicación de demostración');
  });
  $('#btn-list').addEventListener('click', function () {
    var src = routeView ? byId(ROUTES, routeView.id).stops.map(place).filter(function (p) { return p && p.coords; }).map(itemFromPlace) : Object.keys(markers).map(function (id) { return items[id]; });
    var list = sortByDist(src.filter(function (x) { return x && x.coords; }));
    var c = pos ? ll(pos) : null;
    openModal('<div class="m-head"><h2 class="t-h2" id="modal-title" tabindex="-1">Lugares en el mapa</h2></div>' +
      (list.length ? '<div class="m-list">' + list.map(function (it) {
        var color = it.type === 'search' ? '#0369A1' : 'var(--c-' + it.cat + ')';
        return '<button type="button" class="m-item" data-m="sel" data-id="' + esc(it.id) + '"><span class="m-ic" style="--t:' + (it.type === 'search' ? '#E6F6FD' : catOf(it).tint) + ';--c:' + color + '">' + ic(itemIcon(it)) + '</span>' +
          '<span class="grow"><b>' + esc(it.name) + '</b><small>' + esc(itemLabel(it)) + (c ? ' · ' + fmtDist(hav(c, it.coords)) : '') + '</small></span>' + ic('chev-r', 'chev') + '</button>';
      }).join('') + '</div>' : '<p class="m-text">No hay lugares con este filtro.</p>'));
  });

  /* =========================================================
     Vista de una ruta en el mapa
     ========================================================= */
  function routeMeta(r, km) {
    if (ROUTE_META[r.id] && !km) return ROUTE_META[r.id];
    return r.stops.length + ' paradas · ' + (km ? km + ' · ' : (ROUTE_TIME[r.id] ? ROUTE_TIME[r.id] + ' · ' : '')) + r.mode;
  }
  function showRouteOverview(id, quiet) {
    var r = byId(ROUTES, id);
    if (!r || !map) return;
    if (r.dishes) { openDishes(); return; }
    if (selId) deselect();
    routeView = { id: id };
    renderMarkers();
    L_stops.clearLayers(); L_route.clearLayers();
    var stops = r.stops.map(place).filter(Boolean);
    stops.forEach(function (p, i) {
      if (!p.coords) return;
      var ok = hasStamp(p.id);
      var mk = L.marker(p.coords, { icon: L.divIcon({ className: 'rt-pin rt-stop', html: '<div class="stop-pin' + (ok ? ' ok' : '') + '" style="--c:var(--c-' + p.cat + ')">' + (ok ? '✓' : (i + 1)) + '</div>', iconSize: [34, 34], iconAnchor: [17, 17] }), keyboard: true, zIndexOffset: 500 });
      mk.on('click', function () { openPunto(p.id, { routeId: id }); });
      mk.addTo(L_stops);
      var el = mk.getElement(); if (el) { el.setAttribute('role', 'button'); el.setAttribute('aria-label', 'Parada ' + (i + 1) + ': ' + p.name + (ok ? ', estampa ganada' : '')); }
    });
    var done = routeDone(r), color = 'var(--c-' + r.cat + ')';
    var c = $('#route-card');
    c.innerHTML = '<button type="button" class="card-x" data-act="close" aria-label="Cerrar la ruta">' + ic('x') + '</button>' +
      '<div class="rc-head"><span class="over" style="--c:' + color + '">' + esc(CAT[r.cat].label) + '</span><b class="rc-name">' + esc(r.name) + '</b><span class="rc-meta" id="rc-meta">' + esc(routeMeta(r)) + '</span></div>' +
      '<div class="rc-prog"><span class="bar"><span style="width:' + Math.round(done / r.stops.length * 100) + '%"></span></span><span>' + done + ' de ' + r.stops.length + ' estampas</span></div>' +
      '<div class="rc-stops" role="list">' + stops.map(function (p, i) {
        var ok = hasStamp(p.id);
        return '<button type="button" role="listitem" class="stop-chip' + (ok ? ' ok' : '') + '" data-stop="' + p.id + '" style="--c:var(--c-' + p.cat + ')" aria-label="Parada ' + (i + 1) + ': ' + esc(p.name) + (ok ? ', estampa ganada' : '') + (p.coords ? '' : ', sin ubicación aún') + '"><span class="n">' + (ok ? ic('check') : (i + 1)) + '</span>' + esc(p.name) + '</button>';
      }).join('') + '</div>' +
      '<div class="pc-actions"><button type="button" class="btn btn-primary grow" data-act="start">' + ic('nav') + (done === r.stops.length ? 'Repetir la ruta' : (done ? 'Seguir la ruta' : 'Empezar ruta')) + '</button></div>';
    showCard('#route-card');
    $('#place-card').hidden = true;
    var pts = stops.filter(function (p) { return p.coords; }).map(function (p) { return p.coords; });
    if (pts.length) {
      setTimeout(function () {
        var pad = framePad();
        map.fitBounds(L.latLngBounds(pts), { paddingTopLeft: pad.tl, paddingBottomRight: pad.br, maxZoom: 16.5, animate: true });
      }, 60);
      setFollowing(false);
    }
    if (pts.length >= 2) {
      getRoute(pts, r.mode === 'en carro' ? 'car' : 'foot').then(function (res) {
        if (!routeView || routeView.id !== id) return;
        drawRoute(res.coords, 'overview');
        var m = $('#rc-meta'); if (m) m.textContent = routeMeta(r, fmtDist(res.dist));
      }, function () { if (routeView && routeView.id === id) drawRoute(pts, 'approx'); });
    }
    if (!quiet) speak(r.name + '. ' + routeMeta(r) + '. Llevas ' + done + ' de ' + r.stops.length + ' estampas.');
  }
  function closeRouteOverview(keepMarkers) {
    routeView = null;
    if (L_stops) L_stops.clearLayers();
    if (L_route && !nav) L_route.clearLayers();
    $('#route-card').hidden = true;
    if (!keepMarkers) renderMarkers();
    requestAnimationFrame(placeAttr);
  }
  $('#route-card').addEventListener('click', function (e) {
    var b = e.target.closest('[data-act],[data-stop]'); if (!b || !routeView) return;
    var r = byId(ROUTES, routeView.id);
    if (b.hasAttribute('data-stop')) { openPunto(b.getAttribute('data-stop'), { routeId: r.id }); return; }
    var a = b.getAttribute('data-act');
    if (a === 'close') closeRouteOverview();
    else if (a === 'start') {
      var next = r.stops.map(place).filter(function (p) { return p && p.coords && !hasStamp(p.id); })[0] || r.stops.map(place).filter(function (p) { return p && p.coords; })[0];
      if (!next) { toast('Las paradas de esta ruta aún no tienen ubicación'); return; }
      startNav(itemFromPlace(next), { routeId: r.id, profile: r.mode === 'en carro' ? 'car' : null });
    }
  });

  /* =========================================================
     Navegación paso a paso
     ========================================================= */
  var nav = null;
  function cumulative(coords) {
    var cum = [0];
    for (var i = 1; i < coords.length; i++) cum.push(cum[i - 1] + hav(coords[i - 1], coords[i]));
    return cum;
  }
  function project(p, coords, cum, from) {
    var kx = Math.cos(p[0] * Math.PI / 180) * 111320, ky = 110540;
    var best = { d: Infinity, s: 0, i: 0 };
    for (var i = Math.max(0, from || 0); i < coords.length - 1; i++) {
      var ax = (coords[i][1] - p[1]) * kx, ay = (coords[i][0] - p[0]) * ky;
      var bx = (coords[i + 1][1] - p[1]) * kx, by = (coords[i + 1][0] - p[0]) * ky;
      var dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
      var t = L2 ? clamp(-(ax * dx + ay * dy) / L2, 0, 1) : 0;
      var x = ax + t * dx, y = ay + t * dy, d = Math.sqrt(x * x + y * y);
      if (d < best.d) best = { d: d, s: cum[i] + t * (cum[i + 1] - cum[i]), i: i };
    }
    return best;
  }
  function pointAt(coords, cum, s) {
    var n = coords.length;
    if (s <= 0) return { p: coords[0], b: bearing(coords[0], coords[Math.min(1, n - 1)]) };
    for (var i = 0; i < n - 1; i++) {
      if (cum[i + 1] >= s) {
        var seg = cum[i + 1] - cum[i] || 1, t = (s - cum[i]) / seg;
        return { p: [coords[i][0] + (coords[i + 1][0] - coords[i][0]) * t, coords[i][1] + (coords[i + 1][1] - coords[i][1]) * t], b: bearing(coords[i], coords[i + 1]) };
      }
    }
    return { p: coords[n - 1], b: n > 1 ? bearing(coords[n - 2], coords[n - 1]) : 0 };
  }
  function startNav(it, opts) {
    opts = opts || {};
    if (typeof it === 'string') it = items[it] || (place(it) ? itemFromPlace(place(it)) : null);
    if (!it || !it.coords) { toast('Este lugar aún no tiene ubicación en el mapa'); return; }
    if (!pos) useDemo();
    if (!initMap()) { toast('No pudimos cargar el mapa'); return; }
    stopSpeak();
    if (routeView) closeRouteOverview(true);
    hideSug();
    var d = hav(ll(pos), it.coords);
    if (d < 25 && it.type === 'place') { openPunto(it.id, { arrived: true, routeId: opts.routeId }); return; }
    if (nav) stopSim();
    nav = { it: it, profile: opts.profile || (d > 2500 ? 'car' : 'foot'), routeId: opts.routeId || null, route: null, step: 1, said: {}, off: 0,
      lastReroute: 0, sim: null, cum: null, stepAt: null, lastIdx: 0, done: false, muted: false, hd: null, half: false, near: false };
    selId = it.id; items[it.id] = it;
    if (!markers[it.id]) addMarker(it, it.type === 'place' ? L_places : L_extra, 0);
    var el = markers[it.id].getElement(); if (el) el.classList.add('is-sel');
    $('#place-card').hidden = true; $('#route-card').hidden = true;
    if (curId() !== 'mapa') go('mapa', { silent: true });
    var s = $('#s-mapa');
    s.classList.add('nav-on');
    app.classList.add('nav-mode');
    $('.nav-ui').setAttribute('aria-hidden', 'false');
    $('.explore-ui').setAttribute('aria-hidden', 'true');
    updateChrome('mapa');
    updateDemoChip();
    $('#nav-mute').setAttribute('aria-pressed', 'true');
    $('#nav-mute').innerHTML = ic('vol');
    setNavTop('straight', '—', 'Calculando la ruta…', null);
    $('#nav-eta').textContent = '— min';
    $('#nav-sub').textContent = it.name;
    $('#nav-bar').style.width = '0';
    navSay('¡Vamos! Sigue la línea roja.');
    stopSim();
    setFollowing(true);
    map.setView(ll(pos), nav.profile === 'car' ? 16 : 17, { animate: true });
    measureNav();
    updateMe();
    fetchNavRoute(true);
  }
  function fetchNavRoute(first) {
    var n = nav; if (!n) return;
    var from = ll(pos), to = n.it.coords;
    getRoute([from, to], n.profile).catch(function () { return straightRoute(from, to, n.profile); }).then(function (r) {
      if (nav !== n) return;
      n.route = r; n.cum = cumulative(r.coords); n.lastIdx = 0; n.step = 1; n.said = {};
      n.stepAt = []; var acc = 0;
      r.steps.forEach(function (st, k) { n.stepAt[k] = acc; acc += st.dist || 0; });
      var scale = (n.cum[n.cum.length - 1] || 1) / (acc || 1);
      n.stepAt = n.stepAt.map(function (v) { return v * scale; });
      drawRoute(r.coords, 'nav');
      if (r.approx) toast('Sin conexión al servicio de rutas: te guiamos en línea recta', 4000);
      navOnPos(first);
      if (first) announceStart();
    });
  }
  function setNavTop(icon, dist, text, then) {
    $('#nav-turn').innerHTML = ic(icon);
    $('#nav-dist').textContent = dist;
    $('#nav-text').textContent = text;
    var th = $('#nav-then');
    if (then) { th.hidden = false; $('#nav-then-text').innerHTML = ic(then.icon) + ' ' + esc(then.text); }
    else th.hidden = true;
    measureNav();
  }
  function destName(n) { return n.it.type === 'place' ? n.it.place.name : n.it.name; }
  function navSay(text) { $('#nav-say').textContent = text; tocheChirp('.nav-bubble .toche-badge', 1400); }
  function speakNav(text) { if (!nav || nav.muted) return; speak(text, { force: true, banner: false }); }
  function announceStart() {
    var n = nav; if (!n || !n.route) return;
    var st = n.route.steps, a = st[0] ? stepText(st[0]) : '', b = st[1] && st[1].type !== 'arrive' ? stepText(st[1], destName(n)) : '';
    var dist = n.cum[n.cum.length - 1];
    speakNav('Vamos ' + (n.it.type === 'place' ? alName(n.it.place) : 'a ' + n.it.name) + '. Son ' + sayDist(dist) + (n.profile === 'car' ? ' en carro' : ' a pie') + '. ' + a + (b ? '. Luego, ' + lcFirst(b) : '') + '.');
  }
  function navOnPos(first) {
    var n = nav; if (!n || !n.route || n.done) return;
    var p = ll(pos), r = n.route;
    var pr = project(p, r.coords, n.cum, n.lastIdx > 3 ? n.lastIdx - 3 : 0);
    n.lastIdx = pr.i;
    var total = n.cum[n.cum.length - 1] || r.dist || 1, along = pr.s, remain = Math.max(0, total - along);
    var toDest = hav(p, n.it.coords);
    var arriveR = n.it.type === 'place' ? Math.max(25, fenceR(n.it.place) - 15) : 30;
    if (toDest <= arriveR || (remain < 12 && toDest < 60)) { arrive(); return; }
    if (!n.sim && !r.approx && pr.d > Math.max(35, (pos.acc || 0) * 1.2)) {
      n.off++;
      if (n.off >= 3 && Date.now() - n.lastReroute > 12000) {
        n.lastReroute = Date.now(); n.off = 0;
        setNavTop('nav', '…', 'Recalculando la ruta…', null);
        speakNav('Recalculando la ruta.');
        fetchNavRoute(false);
        return;
      }
    } else n.off = 0;
    var k = Math.max(1, n.step || 1);
    while (k < r.steps.length - 1 && n.stepAt[k] <= along + 8) k++;
    n.step = k;
    var st = r.steps[k] || r.steps[r.steps.length - 1];
    if (!st) return;
    var distTo = st.type === 'arrive' ? remain : Math.max(0, n.stepAt[k] - along);
    var nx = r.steps[k + 1];
    var then = nx && k + 1 < r.steps.length && st.type !== 'arrive' ? { icon: stepIcon(nx), text: stepText(nx, destName(n)) } : null;
    if (r.approx && st.type === 'arrive') {
      setNavTop('nav', fmtDist(remain), 'Camina hacia ' + cardinal(bearing(p, n.it.coords)) + ' · ' + destName(n), null);
    } else setNavTop(stepIcon(st), fmtDist(distTo), stepText(st, destName(n)), then);
    var leftSec = r.dur * remain / total;
    $('#nav-eta').textContent = fmtMin(leftSec);
    $('#nav-sub').textContent = fmtDist(remain) + (n.profile === 'car' ? ' en carro' : ' a pie') + ' · ' + destName(n);
    $('#nav-bar').style.width = Math.round(clamp(along / total, 0, 1) * 100) + '%';
    var seg = r.coords[Math.min(pr.i + 1, r.coords.length - 1)];
    n.hd = bearing(r.coords[pr.i], seg);
    updateMe();
    if (!first) {
      var key = 'k' + k;
      if (!n.said[key + 'f'] && distTo > 80 && st.type !== 'arrive') { n.said[key + 'f'] = 1; speakNav('En ' + sayDist(distTo) + ', ' + lcFirst(stepText(st, destName(n))) + '.'); }
      if (!n.said[key + 'n'] && distTo <= (n.profile === 'car' ? 70 : 30) && st.type !== 'arrive') { n.said[key + 'n'] = 1; n.said[key + 'f'] = 1; speakNav('Ahora, ' + lcFirst(stepText(st, destName(n))) + '.'); vibrate(60); }
    }
    if (!n.half && along / total > 0.5) { n.half = true; navSay('¡Vamos bien! Llegamos en ' + fmtMin(leftSec) + '.'); }
    if (!n.near && remain < 150) { n.near = true; navSay('¡Ya casi llegamos!'); }
  }
  function arrive() {
    var n = nav; if (!n || n.done) return;
    n.done = true;
    var it = n.it, wasSim = !!n.sim || (pos && pos.src === 'sim');
    stopSim();
    if (wasSim || (pos && pos.src === 'demo')) { demoAt = it.coords.slice(); if (pos) { pos.src = 'demo'; pos.lat = demoAt[0]; pos.lng = demoAt[1]; } }
    if (it.type === 'place') { arrivedAt[it.id] = Date.now(); fenceShown[it.id] = Date.now(); }
    vibrate([120, 80, 120]);
    var msg = '¡Llegaste ' + (it.type === 'place' ? alName(it.place) : 'a ' + it.name) + '!';
    var muted = n.muted;
    endNav(true);
    if (!muted) speak(msg, { force: true, banner: false });
    if (it.type === 'place') openPunto(it.id, { arrived: true, routeId: n.routeId, keepVoice: true });
    else { toast(msg); select(it.id, { silent: true }); }
  }
  function endNav(keepSel) {
    if (!nav) return;
    var it = nav.it;
    stopSim();
    nav = null;
    $('#s-mapa').classList.remove('nav-on');
    app.classList.remove('nav-mode');
    $('.nav-ui').setAttribute('aria-hidden', 'true');
    $('.explore-ui').setAttribute('aria-hidden', 'false');
    if (L_route) L_route.clearLayers();
    updateChrome(curId());
    updateMe();
    updateDemoChip();
    setFollowing(false);
    if (!keepSel && it) { selId = null; if (it.coords) select(it.id, { silent: true }); }
    else { selId = null; renderMarkers(); }
    requestAnimationFrame(placeAttr);
  }
  function toggleSim() {
    var n = nav;
    if (!n || !n.route) { toast('Espera a que la ruta esté lista'); return; }
    if (n.sim) { stopSim(); toast('Simulación detenida'); return; }
    var total = n.cum[n.cum.length - 1], speed = n.profile === 'car' ? 30 : 9;
    var s = project(ll(pos), n.route.coords, n.cum, 0).s;
    n.sim = setInterval(function () {
      if (nav !== n || n.done) { clearInterval(n.sim); return; }
      s = Math.min(total, s + speed * 0.5);
      var pt = pointAt(n.route.coords, n.cum, s);
      setPos({ lat: pt.p[0], lng: pt.p[1], acc: 5, heading: pt.b, src: 'sim' });
    }, 500);
    $('#nav-sim').innerHTML = ic('pause', 'ic-sm') + ' Detener simulación';
    toast('Simulación: Toche camina la ruta por ti');
  }
  function stopSim() {
    if (nav && nav.sim) { clearInterval(nav.sim); nav.sim = null; }
    $('#nav-sim').innerHTML = ic('walk', 'ic-sm') + ' Simular recorrido';
  }
  function measureNav() {
    var s = $('#s-mapa');
    s.style.setProperty('--navtop-h', $('.nav-top').offsetHeight + 'px');
    s.style.setProperty('--navbot-h', $('.nav-bottom').offsetHeight + 'px');
    requestAnimationFrame(placeAttr);
  }
  $('#nav-end').addEventListener('click', function () { stopSpeak(); endNav(); toast('Navegación finalizada'); });
  $('#nav-sim').addEventListener('click', toggleSim);
  $('#nav-mute').addEventListener('click', function () {
    if (!nav) return;
    nav.muted = !nav.muted;
    this.setAttribute('aria-pressed', nav.muted ? 'false' : 'true');
    this.innerHTML = ic(nav.muted ? 'mute' : 'vol');
    if (nav.muted) stopSpeak(); else speak('Voz de Toche activada', { force: true, banner: false });
  });

  /* =========================================================
     Bienvenida
     ========================================================= */
  function syncModeUI() { $$('.mode-opt').forEach(function (o) { o.setAttribute('aria-checked', o.getAttribute('data-mode') === S.mode ? 'true' : 'false'); }); }
  $$('.mode-opt').forEach(function (o) {
    o.addEventListener('click', function () {
      S.mode = o.getAttribute('data-mode');
      S.contraste = S.mode === 'contraste';
      S.voz = S.mode === 'voz';
      if (S.mode === 'contraste' && S.tam === 'normal') S.tam = 'grande';
      if (S.mode === 'visual') S.tam = 'normal';
      save(); applySettings(); syncModeUI();
      if (S.voz) speak('Guía por voz activada. Toca Empezar cuando quieras.');
    });
  });
  $('.mode-list').addEventListener('keydown', function (e) {
    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) < 0) return;
    var os = $$('.mode-opt'), i = os.indexOf(document.activeElement); if (i < 0) return;
    e.preventDefault();
    var j = (i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1) + os.length) % os.length;
    os[j].focus(); os[j].click();
  });
  $('#btn-start').addEventListener('click', function () {
    S.onboarded = true; save();
    go('inicio', { tab: true });
    bootLocation();
  });
  onEnter.bienvenida = function () {
    syncModeUI();
    if (welcomeToche && !welcomeFlown) { welcomeFlown = true; welcomeToche.flyIn({ from: -1, bounds: app }); }
  };

  /* =========================================================
     Inicio
     ========================================================= */
  function updateCounts() {
    var n = stampCount(), N = STAMPS.length;
    $('#home-ring').setAttribute('stroke-dasharray', (n / N * 138.2).toFixed(1) + ' 138.2');
    $('#home-ring').style.opacity = n ? '' : '0';
    $('#home-ring-text').textContent = n + '/' + N;
    $('#home-count').textContent = n + ' de ' + N + ' estampas';
  }
  var lastSuggest = '';
  function renderSuggestion() {
    renderSuggestionText();
    var txt = $('#suggest-text').textContent;
    if (txt !== lastSuggest) { lastSuggest = txt; tocheChirp('.toche-say .toche-badge', 1300); }
  }
  function renderSuggestionText() {
    var el = $('#suggest-text'), btn = $('#btn-take-me');
    if (!pos) {
      el.innerHTML = gps.state === 'asking' ? '<b>Buscando tu ubicación…</b> Un momento.' : '<b>Activa tu ubicación</b> y te muestro lo que hay cerca.';
      btn.innerHTML = 'Activar ' + ic('arrow-r', 'ic-sm'); btn.setAttribute('data-act', 'gps'); return;
    }
    var c = ll(pos);
    var cands = PLACES.filter(function (p) { return p.coords && !hasStamp(p.id); });
    if (!cands.length) cands = PLACES.filter(function (p) { return p.coords; });
    var n = nearestPlace(c, cands);
    if (!n) { el.innerHTML = '<b>¡Bienvenido a Cúcuta!</b> Explora el mapa.'; btn.setAttribute('data-act', 'map'); btn.innerHTML = 'Ver mapa ' + ic('arrow-r', 'ic-sm'); return; }
    var far = n.d > 2500;
    el.innerHTML = n.d <= fenceR(n.p) ? '<b>¡Estás en ' + esc(n.p.name) + '!</b> Mira su historia.'
      : (far ? '<b>' + esc(n.p.name) + ' está a ' + fmtDist(n.d) + '.</b> ¿Vamos en carro?' : '<b>Estás a ' + fmtDist(n.d) + ' ' + esc(delName(n.p)) + '.</b> ¿Vamos?');
    btn.setAttribute('data-act', n.d <= fenceR(n.p) ? 'open' : 'go');
    btn.setAttribute('data-id', n.p.id);
    btn.innerHTML = (n.d <= fenceR(n.p) ? 'Ver' : 'Llévame') + ' ' + ic('arrow-r', 'ic-sm');
  }
  $('#btn-take-me').addEventListener('click', function () {
    var a = this.getAttribute('data-act'), id = this.getAttribute('data-id');
    if (a === 'gps') { startGPS(true); renderSuggestion(); }
    else if (a === 'map') go('mapa', { tab: true });
    else if (a === 'open') openPunto(id, { arrived: true });
    else if (a === 'go') startNav(id);
  });
  onEnter.inicio = function () { updateCounts(); renderSuggestion(); renderLocChip(); };

  /* =========================================================
     Mapa: entrada a la pantalla
     ========================================================= */
  onEnter.mapa = function (opts) {
    opts = opts || {};
    if (!initMap()) { showMapMsg('No se pudo cargar el mapa. Revisa tu conexión.'); return; }
    setTimeout(function () { if (map) { map.invalidateSize(); placeAttr(); if (nav) measureNav(); } }, 460);
    if (opts.filter && opts.filter !== filter) setFilter(opts.filter);
    if (opts.route) showRouteOverview(opts.route);
    else if (opts.select) setTimeout(function () { select(opts.select); }, 80);
    else if (!mapCentered && pos && !nav) { map.setView(ll(pos), 15.5); mapCentered = true; }
    if (opts.search) { qEl.value = opts.search; runSearch(opts.search); }
    updateDemoChip();
  };
  onLeave.mapa = function () { hideSug(); };

  /* =========================================================
     Rutas
     ========================================================= */
  var rutaF = 'todas';
  var RUTA_FILTERS = [['todas', 'Todas', 'grid', null], ['historia', 'Historia', 'landmark', 'historia'], ['cultural', 'Cultural', 'palette', 'cultural'],
    ['gastronomia', 'Gastronomía', 'utensils', 'gastronomia'], ['religioso', 'Religioso', 'church', 'religioso'], ['naturaleza', 'Naturaleza', 'tree', 'naturaleza']];
  function renderRutas() {
    $('#route-chips').innerHTML = chipsHTML(RUTA_FILTERS, rutaF, 'data-rf');
    var showFeat = rutaF === 'todas' || rutaF === 'historia';
    var feat = byId(ROUTES, 'independencia');
    var list = ROUTES.filter(function (r) { return (rutaF === 'todas' || r.cat === rutaF) && !(showFeat && r.featured); });
    var html = '', i = 0;
    if (showFeat) {
      var fd = routeDone(feat);
      html += '<button type="button" class="route-feat card-lift rise" style="--i:' + (i++) + '" data-route="' + feat.id + '">' +
        '<span class="feat-art">' + ART.FEATURED + '<span class="feat-badge">' + ic('star') + 'Destacada</span></span>' +
        '<span class="feat-body"><span class="col"><span class="over" style="--c:var(--c-' + feat.cat + ')">' + CAT[feat.cat].label + '</span><b class="feat-name">' + esc(feat.name) + '</b></span>' +
        '<span class="meta-chips"><span class="mchip">' + ic('pin') + feat.stops.length + ' paradas</span><span class="mchip">' + ic('clock') + ROUTE_TIME[feat.id] + '</span><span class="mchip">' + ic('car') + 'En carro</span></span>' +
        '<span class="prog-row"><span class="bar"><span style="width:' + Math.round(fd / feat.stops.length * 100) + '%;background:var(--gold)"></span></span><span>' + fd + ' de ' + feat.stops.length + ' estampas</span></span></span></button>' +
        '<h2 class="list-title rise" style="--i:' + (i++) + '">Todas las rutas</h2>';
    }
    html += list.map(function (r) {
      var done = routeDone(r), all = done === r.stops.length;
      return '<button type="button" class="route-item card-lift rise" style="--i:' + (i++) + '" data-route="' + r.id + '">' +
        '<span class="ri-thumb">' + ART.thumb(ROUTE_THUMB[r.id], 76) + '</span>' +
        '<span class="ri-body"><span class="over" style="--c:var(--c-' + r.cat + ')">' + CAT[r.cat].label + '</span><b>' + esc(r.name) + '</b><span class="ri-meta">' + esc(routeMeta(r)) + '</span>' +
        '<span class="ri-prog' + (all ? ' done' : '') + '"><span class="bar"><span style="width:' + Math.round(done / r.stops.length * 100) + '%"></span></span>' +
        (all ? '<span class="ri-done">' + ic('check') + 'Completada</span>' : '<span class="ri-count">' + done + ' de ' + r.stops.length + '</span>') + '</span></span></button>';
    }).join('');
    $('#route-list').innerHTML = html;
  }
  $('#route-chips').addEventListener('click', function (e) {
    var b = e.target.closest('[data-rf]'); if (!b) return;
    rutaF = b.getAttribute('data-rf'); renderRutas();
    speak('Rutas: ' + b.textContent.trim());
  });
  $('#route-list').addEventListener('click', function (e) {
    var b = e.target.closest('[data-route]'); if (!b) return;
    openRoute(b.getAttribute('data-route'));
  });
  function openRoute(id) {
    var r = byId(ROUTES, id); if (!r) return;
    if (r.dishes) { openDishes(); return; }
    if (curId() === 'mapa') showRouteOverview(id); else go('mapa', { route: id });
  }
  onEnter.rutas = renderRutas;

  function openDishes() {
    openModal('<div class="m-head"><h2 class="t-h2" id="modal-title" tabindex="-1">Sabores cucuteños</h2></div>' +
      '<p class="m-text">Prueba estos platos típicos y tómate una foto con cada uno para ganar su estampa.</p>' +
      DISHES.map(function (d) {
        var ok = hasStamp(d.id);
        return '<div class="dish' + (ok ? ' ok' : '') + '"><span class="ri-thumb">' + ART.thumb(d.id, 64) + '</span><div class="grow"><b>' + esc(d.name) + '</b><small>' + esc(d.text) + '</small>' +
          '<button type="button" class="btn btn-primary btn-sm" data-m="dish" data-id="' + d.id + '">' + ic('camera') + (ok ? 'Tomar otra foto' : 'Tómate la foto') + '</button></div></div>';
      }).join('') +
      '<div class="m-actions"><button type="button" class="btn btn-ghost btn-block" data-m="food">' + ic('utensils') + 'Ver restaurantes cerca</button></div>' +
      '<p class="t-note left">Los restaurantes salen de OpenStreetMap.</p>');
  }

  /* =========================================================
     Punto turístico
     ========================================================= */
  var punto = { id: null, routeId: null, split: 50, playing: false, timer: null, t0: 0, est: 0 };
  var BAR_H = [8, 14, 20, 12, 18, 24, 16, 10, 22, 14, 8, 18, 24, 12, 16, 20, 10, 14, 22, 16, 8, 12, 18, 10];
  var photoOK = {};
  function openPunto(id, opts) {
    opts = opts || {}; opts.place = id;
    if (curId() === 'punto') { onEnter.punto(opts); return; }
    go('punto', opts);
  }
  function fillLayer(el, id, era) {
    var sc = ART.scene(id, era);
    el.innerHTML = sc.svg;
    el.classList.toggle('sepia', !!sc.sepia);
    var key = id + '-' + era;
    if (photoOK[key] === false) return;
    var img = new Image();
    img.alt = '';
    img.onload = function () { photoOK[key] = true; if (punto.id === id) { el.classList.remove('sepia'); el.appendChild(img); } };
    img.onerror = function () { photoOK[key] = false; };
    img.src = 'img/' + key + '.jpg';
  }
  function narration(p) {
    var out = [p.name + '.'];
    p.timeline.forEach(function (t) { out.push((/^\d/.test(t.year) ? 'En ' + t.year + ': ' : t.year + ': ') + t.text); });
    (p.facts || []).forEach(function (f) {
      var nf = norm(f), dup = p.timeline.some(function (t) { var nt = norm(t.text); return nt.indexOf(nf.slice(0, 26)) >= 0 || nf.indexOf(nt.slice(0, 26)) >= 0; });
      if (!dup) out.push(f);
    });
    if (S.fotos && PHOTO_DESC[p.id]) out.push('Sobre las imágenes: ' + PHOTO_DESC[p.id]);
    return out;
  }
  function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function nextStop(p) {
    if (punto.routeId) {
      var r = byId(ROUTES, punto.routeId);
      if (r) {
        var i = r.stops.indexOf(p.id);
        var rest = r.stops.slice(i + 1).map(place).filter(function (x) { return x && x.coords; });
        var nx = rest.filter(function (x) { return !hasStamp(x.id); })[0] || rest[0];
        if (nx) return nx;
        return null;
      }
    }
    return p.next ? place(p.next) : null;
  }
  function renderPunto() {
    var p = place(punto.id); if (!p) return;
    var color = 'var(--c-' + p.cat + ')';
    fillLayer($('#p-hoy'), p.id, 'hoy');
    fillLayer($('#p-antes'), p.id, 'antes');
    $('#p-tag-antes').textContent = ANTES_TAG[p.id] || 'Antes';
    $('#compare').setAttribute('aria-label', 'Comparación entre la imagen de antes y la de hoy ' + delName(p) + '. Ilustración de referencia.' + (S.fotos && PHOTO_DESC[p.id] ? ' ' + PHOTO_DESC[p.id] : ''));
    setSplit(50, false);
    var near = isArrived(p.id), got = hasStamp(p.id), d = (pos && p.coords) ? hav(ll(pos), p.coords) : null;
    var st = $('#p-status');
    st.className = 'chip-status' + (near ? ' arrived' : (got ? ' done' : ''));
    st.innerHTML = near ? ic('check') + '¡Llegaste!' : (got ? ic('check') + 'Estampa ganada' : (d != null ? ic('pin') + 'A ' + fmtDist(d) : ic(ART.CAT_ICON[p.cat]) + CAT[p.cat].label));
    var r = punto.routeId ? byId(ROUTES, punto.routeId) : null;
    $('#p-route').textContent = r ? r.name + ' · Parada ' + (r.stops.indexOf(p.id) + 1) + ' de ' + r.stops.length : CAT[p.cat].label + ' · ' + p.area;
    $('#p-name').textContent = p.name;
    $('#p-loc').textContent = p.address + (p.area && p.address.indexOf(p.area) < 0 && !/^(Centro|Cúcuta)/.test(p.area) ? ' · ' + p.area : '');
    $('#p-timeline').style.setProperty('--c', color);
    $('#p-timeline').innerHTML = p.timeline.map(function (t) {
      var now = !/^\d/.test(t.year) && /hoy/i.test(t.year);
      return '<li' + (now ? ' class="now"' : '') + '><span class="tl-dot" aria-hidden="true"></span><span class="tl-txt"><b>' + esc(t.year) + '</b><span>' + esc(t.text) + '</span></span></li>';
    }).join('');
    $('#p-precision').textContent = (p.precision === 'verificada' ? 'Ubicación verificada. ' : (p.precision === 'osm' ? 'Ubicación de OpenStreetMap. ' : (p.coords ? 'Ubicación aproximada. ' : 'Ubicación pendiente. '))) + (p.fuente || '');
    stopNarration();
    var words = narration(p).join(' ').split(/\s+/).length;
    punto.est = words / (2.5 * (RATE[S.vel] || 1));
    $('#p-time').textContent = mmss(punto.est);
    $('#p-bars').innerHTML = BAR_H.map(function (h, i) { return '<span style="height:' + h + 'px;animation-delay:' + ((i % 6) * 110) + 'ms"></span>'; }).join('');
    var cta = $('#p-cta');
    cta.disabled = false;
    cta.className = 'btn btn-primary grow';
    if (got && !near) { cta.setAttribute('data-act', 'album'); cta.innerHTML = ic('award') + 'Ver en mi pasaporte'; }
    else if (near) { cta.setAttribute('data-act', 'camera'); cta.innerHTML = ic('camera') + (got ? 'Tomar otra foto' : 'Tómate una foto y gana la estampa'); }
    else if (p.coords) {
      cta.setAttribute('data-act', 'go');
      var car = d != null && d > 2500;
      cta.innerHTML = ic('nav') + 'Cómo llegar' + (d != null ? ' · ' + (car ? 'en carro' : fmtMin(walkSec(d * 1.3))) : '');
    } else { cta.setAttribute('data-act', 'none'); cta.disabled = true; cta.innerHTML = 'Ubicación no disponible por ahora'; }
    var nx = nextStop(p), nb = $('#p-next');
    nb.hidden = !nx;
    if (nx) { nb.setAttribute('aria-label', 'Siguiente parada: ' + nx.name); nb.setAttribute('data-id', nx.id); }
    $('#s-punto').setAttribute('data-say', p.name + '. ' + (near ? '¡Llegaste! Tómate una foto para ganar la estampa.' : (got ? 'Ya tienes esta estampa.' : (d != null ? 'Está a ' + sayDist(d) + '.' : ''))) + ' Toca Escuchar la historia para oírla.');
  }
  onEnter.punto = function (opts) {
    opts = opts || {};
    var id = opts.place || punto.id || 'templo';
    if (!place(id)) return;
    if (opts.routeId !== undefined) punto.routeId = opts.routeId || null;
    else if (id !== punto.id) punto.routeId = null;
    punto.id = id;
    if (opts.arrived) { arrivedAt[id] = Date.now(); fenceShown[id] = Date.now(); }
    renderPunto();
    $('#punto-sheet').scrollTop = 0;
  };
  onLeave.punto = function () { stopNarration(); };

  var cmp = $('#compare'), dragging = false;
  function setSplit(v, anim) {
    v = clamp(v, 0, 100); punto.split = v;
    cmp.classList.toggle('anim', !!anim);
    cmp.style.setProperty('--split', v + '%');
    var mode = v >= 99 ? '100' : (v <= 1 ? '0' : '50');
    $$('#p-seg button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === mode ? 'true' : 'false'); });
  }
  function splitFromX(x) { var r = cmp.getBoundingClientRect(); setSplit((x - r.left) / (r.width || 1) * 100, false); }
  cmp.addEventListener('pointerdown', function (e) { dragging = true; try { cmp.setPointerCapture(e.pointerId); } catch (x) {} splitFromX(e.clientX); });
  cmp.addEventListener('pointermove', function (e) { if (dragging) splitFromX(e.clientX); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { cmp.addEventListener(ev, function () { dragging = false; }); });
  $('#p-seg').addEventListener('click', function (e) {
    var b = e.target.closest('[data-v]'); if (!b) return;
    setSplit(+b.getAttribute('data-v'), true);
    var p = place(punto.id), v = b.getAttribute('data-v');
    if (S.fotos && p) speak(v === '100' ? 'Imagen de antes.' + (p.id === 'templo' ? ' ' + PHOTO_DESC.templo.split('Hoy:')[0].replace('Antes: ', '') : '') : (v === '0' ? 'Imagen de hoy. ' + (PHOTO_DESC[p.id] || '').replace(/^Antes:.*Hoy: /, '') : 'Comparando antes y hoy.'));
  });
  function stopNarration() {
    if (punto.playing) stopSpeak();
    punto.playing = false; clearInterval(punto.timer);
    var a = $('#p-audio'); a.classList.remove('playing');
    $('#p-play').innerHTML = ic('play'); $('#p-play').setAttribute('aria-label', 'Escuchar la historia');
    $$('#p-bars span').forEach(function (s) { s.classList.remove('on'); });
    if (punto.est) $('#p-time').textContent = mmss(punto.est);
  }
  $('#p-play').addEventListener('click', function () {
    if (punto.playing) { stopNarration(); return; }
    var p = place(punto.id); if (!p) return;
    var parts = narration(p), bars = $$('#p-bars span');
    var ui = function (frac) { var on = Math.round(frac * bars.length); bars.forEach(function (s, i) { s.classList.toggle('on', i < on); }); };
    var ok = speak(parts.join(' '), { force: true, banner: false, parts: parts,
      onprogress: function (i, n) { ui(i / n); },
      onend: function () { punto.playing = false; ui(1); setTimeout(stopNarration, 600); },
      onstop: function () { punto.playing = false; clearInterval(punto.timer); $('#p-audio').classList.remove('playing'); $('#p-play').innerHTML = ic('play'); $('#p-play').setAttribute('aria-label', 'Escuchar la historia'); } });
    if (!ok) return;
    punto.playing = true; punto.t0 = Date.now();
    $('#p-audio').classList.add('playing');
    this.innerHTML = ic('pause'); this.setAttribute('aria-label', 'Pausar la historia');
    clearInterval(punto.timer);
    punto.timer = setInterval(function () {
      var el = (Date.now() - punto.t0) / 1000;
      $('#p-time').textContent = mmss(Math.min(el, punto.est)) + ' / ' + mmss(punto.est);
    }, 500);
  });
  $('#p-cta').addEventListener('click', function () {
    var a = this.getAttribute('data-act'), p = place(punto.id); if (!p) return;
    if (a === 'camera') openCamera({ id: p.id, name: p.name, thumb: p.id, label: p.name });
    else if (a === 'go') startNav(itemFromPlace(p), { routeId: punto.routeId });
    else if (a === 'album') go('album', { tab: true });
  });
  $('#p-next').addEventListener('click', function () {
    var id = this.getAttribute('data-id'), p = place(id); if (!p) return;
    startNav(itemFromPlace(p), { routeId: punto.routeId });
  });
  $('#p-share').addEventListener('click', function () {
    var p = place(punto.id); if (!p) return;
    var url = p.coords ? 'https://www.openstreetmap.org/?mlat=' + p.coords[0] + '&mlon=' + p.coords[1] + '#map=18/' + p.coords[0] + '/' + p.coords[1] : location.href;
    var text = p.name + ' (' + p.area + '): ' + p.facts[0];
    if (navigator.share) navigator.share({ title: p.name, text: text, url: url }).catch(function () {});
    else copyText(text + ' ' + url, 'Copiamos el lugar para que lo compartas');
  });

  /* =========================================================
     Cámara y estampas
     ========================================================= */
  var cam = { stream: null, target: null };
  function openCamera(target) {
    cam.target = target;
    stopNarration();
    var ov = $('#camera'), video = $('#cam-video'), sim = $('#cam-sim');
    sim.innerHTML = ART.scene(target.thumb, 'hoy').svg;
    sim.hidden = true; video.hidden = false;
    $('#cam-hint').textContent = 'Encuadra ' + target.label + ' y toma la foto';
    openOverlay(ov);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.isSecureContext) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
        .then(function (s) {
          if (ov.hidden) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
          cam.stream = s; video.srcObject = s;
          var pr = video.play(); if (pr && pr.catch) pr.catch(function () {});
        }).catch(simCam);
    } else simCam();
    speak('Cámara abierta. Encuadra ' + target.label + ' y toca el botón blanco para tomar la foto.');
  }
  function simCam() {
    $('#cam-video').hidden = true; $('#cam-sim').hidden = false;
    $('#cam-hint').textContent = 'No pudimos abrir la cámara: usaremos una imagen de ejemplo.';
  }
  function stopCam() {
    if (cam.stream) cam.stream.getTracks().forEach(function (t) { t.stop(); });
    cam.stream = null;
    try { $('#cam-video').srcObject = null; } catch (e) {}
  }
  function capture() {
    var v = $('#cam-video');
    if (!cam.stream || !v.videoWidth) return null;
    try {
      var s = Math.min(v.videoWidth, v.videoHeight), c = document.createElement('canvas');
      c.width = c.height = 360;
      c.getContext('2d').drawImage(v, (v.videoWidth - s) / 2, (v.videoHeight - s) / 2, s, s, 0, 0, 360, 360);
      return c.toDataURL('image/jpeg', 0.72);
    } catch (e) { return null; }
  }
  $('#cam-close').addEventListener('click', function () { stopCam(); closeOverlay($('#camera')); });
  $('#cam-shutter').addEventListener('click', function () {
    var f = $('#flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
    var photo = capture(), t = cam.target;
    vibrate(40);
    setTimeout(function () { stopCam(); closeOverlay($('#camera')); award(t.id, photo); }, 380);
  });

  var pendingBadge = false;
  function award(id, photo) {
    var st = byId(STAMPS, id); if (!st) return;
    var isNew = !hasStamp(id);
    S.stamps[id] = { t: Date.now() };
    if (isNew) S.lastNew = id;
    var hist = byId(ROUTES, 'historica');
    if (!S.badge && hist && routeDone(hist) === hist.stops.length) { S.badge = true; pendingBadge = true; }
    save();
    if (photo) savePhoto(id, photo);
    showReward(st, isNew);
    updateCounts();
  }
  function confetti() {
    if (reduceMotion) return;
    var box = $('#confetti'), cols = ['#C8102E', '#1C1917', '#FFFFFF', '#F5A300'], h = '';
    for (var i = 0; i < 30; i++) {
      var round = i % 2, size = round ? 8 : 10;
      h += '<span class="cf" style="left:' + (Math.random() * 96 + 2).toFixed(1) + '%;background:' + cols[i % 4] + ';width:' + size + 'px;height:' + (round ? 8 : 14) + 'px;border-radius:' + (round ? '50%' : '2px') +
        ';animation-duration:' + (2.6 + Math.random() * 2).toFixed(2) + 's;animation-delay:' + (Math.random() * 0.7).toFixed(2) + 's"></span>';
    }
    box.innerHTML = h;
    setTimeout(function () { box.innerHTML = ''; }, 5600);
  }
  function showReward(st, isNew) {
    $('#rw-title').textContent = isNew ? '¡Nueva estampa!' : '¡Foto guardada!';
    $('#rw-name').textContent = st.name;
    var svg = $('#rw-stamp');
    svg.innerHTML = ART.stampBig(st.cat, st.name, new Date().getFullYear());
    svg.setAttribute('aria-label', 'Estampa de ' + st.name);
    var n = stampCount(), N = STAMPS.length;
    $('#rw-count').textContent = n + ' de ' + N + ' estampas';
    $('#rw-bar').style.width = '0';
    var ov = $('#reward');
    ov.setAttribute('data-stamp', st.id);
    openOverlay(ov);
    var rt = tocheOf('.rw-toche');
    if (rt) rt.flyIn({ from: 1, bounds: ov, then: function () { rt.celebrate(); } });
    setTimeout(function () { $('#rw-bar').style.width = Math.round(n / N * 100) + '%'; }, 700);
    confetti();
    vibrate([80, 60, 80, 60, 160]);
    speak((isNew ? '¡Nueva estampa! ' : '¡Foto guardada! ') + st.name + '. Llevas ' + n + ' de ' + N + '.', { force: S.voz, banner: false });
  }
  function closeReward() {
    closeOverlay($('#reward'));
    var rt = tocheOf('.rw-toche'); if (rt) rt.reset();
    $('#confetti').innerHTML = '';
    if (curId() === 'punto') renderPunto();
    if (pendingBadge) { pendingBadge = false; setTimeout(function () { toast('¡Ganaste la insignia Explorador del Centro!', 4200); speak('¡Ganaste la insignia Explorador del Centro!'); }, 400); }
  }
  $('#rw-close').addEventListener('click', closeReward);
  $('#rw-album').addEventListener('click', function () { closeReward(); go('album', { tab: true }); });
  $('#rw-share').addEventListener('click', function () { shareStamp($('#reward').getAttribute('data-stamp')); });
  function dataURLtoFile(url, name) {
    var arr = url.split(','), bin = atob(arr[1]), u8 = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new File([u8], name, { type: 'image/jpeg' });
  }
  function shareStamp(id) {
    var st = byId(STAMPS, id); if (!st) return;
    var text = '¡Gané la estampa «' + st.name + '» en Ruta Toche, Cúcuta!';
    var photo = PHOTOS[id];
    try {
      if (photo && navigator.canShare) {
        var file = dataURLtoFile(photo, 'ruta-toche-' + id + '.jpg');
        if (navigator.canShare({ files: [file] })) { navigator.share({ files: [file], text: text }).catch(function () {}); return; }
      }
    } catch (e) {}
    if (navigator.share) { navigator.share({ title: 'Ruta Toche', text: text, url: location.href }).catch(function () {}); return; }
    copyText(text + ' ' + location.href, 'Copiamos el texto para que lo compartas');
  }

  /* =========================================================
     Pasaporte
     ========================================================= */
  var albumF = 'todas', ROT = [-6, 4, -3, 5, -5, 3, -4, 6, -2, 4, -6, 2];
  function renderAlbum() {
    var n = stampCount(), N = STAMPS.length;
    $('#album-ring').setAttribute('stroke-dasharray', (n / N * 188.5).toFixed(1) + ' 188.5');
    $('#album-ring').style.opacity = n ? '' : '0';
    $('#album-n').textContent = n;
    $('#album-ring-wrap').setAttribute('aria-label', n + ' de ' + N + ' estampas conseguidas');
    var segs = [['todas', 'Todas'], ['si', 'Tengo ' + n], ['no', 'Faltan ' + (N - n)]];
    $('#album-seg').innerHTML = segs.map(function (s) { return '<button type="button" data-af="' + s[0] + '" aria-pressed="' + (s[0] === albumF) + '">' + s[1] + '</button>'; }).join('');
    var list = STAMPS.map(function (s, i) { return { s: s, i: i }; }).filter(function (x) { var ok = hasStamp(x.s.id); return albumF === 'todas' || (albumF === 'si' ? ok : !ok); });
    $('#stamps').innerHTML = list.length ? list.map(function (x, k) {
      var s = x.s, ok = hasStamp(s.id), isNew = ok && S.lastNew === s.id;
      return '<li><button type="button" class="stamp' + (ok ? '' : ' locked') + '" style="--i:' + k + '" data-stamp="' + s.id + '" aria-label="' + (ok ? 'Estampa conseguida: ' + esc(s.name) + (isNew ? ', nueva' : '') : 'Por conseguir: ' + esc(s.name)) + '">' +
        '<span class="stamp-wrap">' + (ok ? '<span class="stamp-disc' + (isNew ? ' glow' : '') + '" style="--c:var(--c-' + s.cat + ');--r:' + ROT[x.i % ROT.length] + 'deg">' + ART.stampSmall(s.cat) + '</span>'
          : '<span class="stamp-lock">' + ic('lock') + '</span>') + (isNew ? '<span class="stamp-new" aria-hidden="true">Nueva</span>' : '') + '</span>' +
        '<span class="stamp-name" aria-hidden="true">' + esc(s.name) + '</span></button></li>';
    }).join('') : '<li style="grid-column:1/-1"><p class="m-text" style="text-align:center">' + (albumF === 'si' ? 'Aún no tienes estampas. ¡Visita un lugar y tómate una foto!' : '¡Tienes todas las estampas!') + '</p></li>';
    var hist = byId(ROUTES, 'historica'), hd = routeDone(hist), hall = hd === hist.stops.length;
    $('#badge-title').textContent = (hall ? 'Insignia ganada: ' : 'Insignia: ') + hist.badge;
    $('#badge-text').textContent = 'Ruta Histórica · ' + hd + ' de ' + hist.stops.length + ' paradas';
    $('#badge-bar').style.width = Math.round(hd / hist.stops.length * 100) + '%';
    $('#badge-card').classList.toggle('earned', hall);
  }
  $('#album-seg').addEventListener('click', function (e) { var b = e.target.closest('[data-af]'); if (!b) return; albumF = b.getAttribute('data-af'); renderAlbum(); });
  $('#badge-card').addEventListener('click', function (e) { e.stopPropagation(); go('mapa', { route: 'historica' }); });
  $('#stamps').addEventListener('click', function (e) {
    var b = e.target.closest('[data-stamp]'); if (!b) return;
    stampSheet(b.getAttribute('data-stamp'));
  });
  function stampSheet(id) {
    var st = byId(STAMPS, id); if (!st) return;
    var ok = hasStamp(id), p = place(id), dish = byId(DISHES, id), photo = PHOTOS[id];
    var head = '<div class="m-head"><span class="stamp-disc" style="--c:var(--c-' + st.cat + ');width:56px;height:56px;flex:none">' + ART.stampSmall(st.cat).replace('<svg ', '<svg width="56" height="56" ') + '</span>' +
      '<h2 class="t-h2" id="modal-title" tabindex="-1">' + esc(st.name) + '</h2></div>';
    var body, acts = '';
    if (ok) {
      var dt = new Date(S.stamps[id].t);
      body = '<p class="m-text">Ganada el ' + dt.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) + '.</p>' +
        (photo ? '<img class="m-photo" src="' + photo + '" alt="Tu foto en ' + esc(st.name) + '">' : '');
      if (p) acts += '<button type="button" class="btn btn-primary btn-block" data-m="punto" data-id="' + id + '">' + ic('landmark') + 'Ver la historia</button>';
      acts += '<button type="button" class="btn btn-ghost btn-block" data-m="share" data-id="' + id + '">' + ic('share') + 'Compartir</button>';
    } else if (dish) {
      body = '<p class="m-text">' + esc(dish.text) + ' Pide uno y tómate una foto con tu plato para ganar la estampa.</p>';
      acts = '<button type="button" class="btn btn-primary btn-block" data-m="dish" data-id="' + id + '">' + ic('camera') + 'Tómate la foto</button>' +
        '<button type="button" class="btn btn-ghost btn-block" data-m="food">' + ic('utensils') + 'Ver restaurantes cerca</button>';
    } else {
      body = '<p class="m-text">Visita ' + esc(p ? p.name : st.name) + ' y tómate una foto allí para ganar esta estampa.</p>';
      if (p && p.coords) acts += '<button type="button" class="btn btn-primary btn-block" data-m="nav" data-id="' + id + '">' + ic('nav') + 'Cómo llegar</button>';
      if (p) acts += '<button type="button" class="btn btn-ghost btn-block" data-m="punto" data-id="' + id + '">' + ic('landmark') + 'Ver la historia</button>';
    }
    openModal(head + body + '<div class="m-actions">' + acts + '</div>');
  }
  onEnter.album = renderAlbum;
  onLeave.album = function () { if (S.lastNew) { S.lastNew = null; save(); } };

  /* Acciones de la hoja modal */
  $('#modal-body').addEventListener('click', function (e) {
    var b = e.target.closest('[data-m]'); if (!b) return;
    var a = b.getAttribute('data-m'), id = b.getAttribute('data-id');
    if (a === 'gps') { closeModal(); S.locMode = 'auto'; save(); if (gps.state === 'denied') toast('Permite la ubicación en los ajustes del navegador'); startGPS(true); }
    else if (a === 'demo') { closeModal(); S.locMode = 'demo'; save(); demoAt = CITY.demo.slice(); useDemo(); toast('Usando la ubicación de demostración'); }
    else if (a === 'sel') { closeModal(); select(id); }
    else if (a === 'punto') { closeModal(); openPunto(id); }
    else if (a === 'nav') { closeModal(); startNav(id); }
    else if (a === 'share') shareStamp(id);
    else if (a === 'dish') { var d = byId(DISHES, id); closeModal(); openCamera({ id: id, name: d.name, thumb: id, label: 'tu ' + d.name.toLowerCase() }); }
    else if (a === 'food') { closeModal(); go('mapa', { tab: true, filter: 'gastronomia' }); }
    else if (a === 'cmd') { closeModal(); handleCommand(b.getAttribute('data-cmd')); }
  });

  /* =========================================================
     Ayuda y emergencias
     ========================================================= */
  function renderLines() {
    $('#lines').innerHTML = LINES.map(function (l) {
      return '<li><a class="line-card" href="tel:' + l.num + '" aria-label="Llamar a ' + esc(l.name) + ', ' + l.num.split('').join(' ') + '">' +
        '<span class="line-top"><span class="logo-ph" aria-hidden="true">LOGO</span><span class="line-num" aria-hidden="true">' + l.num + '</span></span>' +
        '<span class="line-name" aria-hidden="true">' + esc(l.name) + '</span></a></li>';
    }).join('') +
      '<li><button type="button" class="line-card share-loc" id="share-loc"><span class="share-ic" aria-hidden="true">' + ic('pin') + '</span><span class="line-name">Compartir mi ubicación</span></button></li>';
    $('#share-loc').addEventListener('click', shareLocation);
  }
  function nearCard(s, c) {
    items[s.id] = s;
    var d = hav(c, s.coords), walk = d < 2500;
    var tel = s.phone || (s.kind === 'cai' ? '112' : '123');
    return '<article class="near-card rise" style="--i:' + 0 + '"><div class="near-head"><span class="near-ic ' + (s.kind === 'hospital' ? 'hosp' : 'cai') + '" aria-hidden="true">' + ic(s.kind === 'hospital' ? 'cross' : 'shield') + '</span>' +
      '<div class="grow"><b>' + esc(s.name) + '</b><span class="near-chips"><span class="nchip">' + fmtDist(d) + (walk ? ' · ' + fmtMin(walkSec(d * 1.3)) : '') + '</span>' +
      (s.er ? '<span class="nchip ok">Urgencias 24 h</span>' : '') + (s.sub ? '<span class="nchip">' + esc(s.sub) + '</span>' : '') + '</span></div></div>' +
      '<div class="near-actions"><button type="button" class="btn btn-soft" data-near="' + esc(s.id) + '">' + ic('nav') + 'Cómo llegar</button>' +
      '<a class="btn ' + (s.kind === 'cai' ? 'btn-ink' : 'btn-primary') + '" href="tel:' + tel + '">' + ic('phone') + (s.phone ? 'Llamar' : 'Llamar ' + tel) + '</a></div></article>';
  }
  function renderNear() {
    var box = $('#near-list');
    if (!svc.list) box.innerHTML = '<div class="near-skel" aria-hidden="true"></div><div class="near-skel" aria-hidden="true"></div><span class="sr">Buscando servicios cerca de ti…</span>';
    loadServices().then(function (list) {
      var c = pos ? ll(pos) : CITY.center;
      var l = sortByDist(list, c);
      var h = l.filter(function (s) { return s.kind === 'hospital'; }), k = l.filter(function (s) { return s.kind === 'cai'; });
      var pick = [h[0], k[0], h[1]].filter(Boolean);
      box.innerHTML = pick.map(function (s) { return nearCard(s, c); }).join('') +
        (svc.failed ? '<p class="near-empty">No pudimos actualizar los servicios cercanos. Te mostramos el hospital principal de la ciudad. Para la policía, llama al 112.</p>' : '') +
        (!pos ? '<p class="near-empty">Activa tu ubicación para ordenar por cercanía.</p>' : '');
    });
  }
  $('#near-list').addEventListener('click', function (e) {
    var b = e.target.closest('[data-near]'); if (!b) return;
    var it = items[b.getAttribute('data-near')]; if (!it) return;
    startNav(it);
  });
  $('#help-map').addEventListener('click', function () { go('mapa', { filter: 'servicios' }); });
  function shareLocation() {
    if (!pos) { toast('Activa tu ubicación primero'); startGPS(true); return; }
    var la = pos.lat.toFixed(6), lo = pos.lng.toFixed(6);
    var url = 'https://www.openstreetmap.org/?mlat=' + la + '&mlon=' + lo + '#map=18/' + la + '/' + lo;
    var text = 'Estoy aquí' + (pos.src !== 'gps' ? ' (ubicación de demostración)' : '') + ': ' + url;
    if (navigator.share) navigator.share({ title: 'Mi ubicación', text: text }).catch(function () {});
    else copyText(text, 'Copiamos tu ubicación para que la pegues en un mensaje');
  }
  onEnter.ayuda = function () { renderNear(); };

  /* =========================================================
     Accesibilidad
     ========================================================= */
  var TAMS = [['normal', 'Normal', 18], ['grande', 'Grande', 22], ['muy', 'Muy grande', 26]];
  var DALS = [['ninguno', 'Ninguno', 'Colores normales'], ['protan', 'Protanopia', 'Rojo'], ['deutan', 'Deuteranopia', 'Verde'], ['tritan', 'Tritanopia', 'Azul']];
  var VELS = [['lenta', 'Lenta'], ['normal', 'Normal'], ['rapida', 'Rápida']];
  $('#seg-tam').innerHTML = TAMS.map(function (t) { return '<button type="button" data-tam="' + t[0] + '" aria-pressed="false"><span class="A" aria-hidden="true" style="font-size:' + t[2] + 'px">A</span><span>' + t[1] + '</span></button>'; }).join('');
  $('#radios-dal').innerHTML = DALS.map(function (d) { return '<button type="button" role="radio" aria-checked="false" data-dal="' + d[0] + '"><span class="rdot" aria-hidden="true"></span><span><b>' + d[1] + '</b><small>' + d[2] + '</small></span></button>'; }).join('');
  $('#seg-vel').innerHTML = VELS.map(function (v) { return '<button type="button" data-vel="' + v[0] + '" aria-pressed="false">' + v[1] + '</button>'; }).join('');
  function syncSettingsUI() {
    $$('[data-sw]').forEach(function (b) { b.setAttribute('aria-checked', S[b.getAttribute('data-sw')] ? 'true' : 'false'); });
    $$('[data-tam]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-tam') === S.tam ? 'true' : 'false'); });
    $$('[data-dal]').forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-dal') === S.dal ? 'true' : 'false'); b.tabIndex = b.getAttribute('data-dal') === S.dal ? 0 : -1; });
    $$('[data-vel]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-vel') === S.vel ? 'true' : 'false'); });
    var pv = $('#pv-card');
    pv.classList.toggle('hc', !!S.contraste);
    pv.classList.toggle('voz', !!S.voz);
    pv.classList.toggle('labels', S.dal !== 'ninguno');
  }
  $$('[data-sw]').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-sw');
      S[k] = !S[k];
      if (k === 'contraste' || k === 'voz') S.mode = S.contraste ? 'contraste' : (S.voz ? 'voz' : 'visual');
      save(); applySettings();
      var name = $('#lb-' + k).textContent;
      if (k === 'voz' && S.voz) speak('Guía por voz activada.');
      else if (k === 'vibrar' && S.vibrar) vibrate(80);
      else speak(name + (S[k] ? ' activado' : ' desactivado'));
    });
  });
  $('#seg-tam').addEventListener('click', function (e) { var b = e.target.closest('[data-tam]'); if (!b) return; S.tam = b.getAttribute('data-tam'); save(); applySettings(); speak('Letra ' + b.textContent.replace('A', '').trim()); });
  $('#radios-dal').addEventListener('click', function (e) { var b = e.target.closest('[data-dal]'); if (!b) return; S.dal = b.getAttribute('data-dal'); save(); applySettings(); speak('Ajuste ' + b.querySelector('b').textContent); });
  $('#radios-dal').addEventListener('keydown', function (e) {
    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) < 0) return;
    var bs = $$('[data-dal]'), i = bs.indexOf(document.activeElement); if (i < 0) return;
    e.preventDefault();
    var j = (i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1) + bs.length) % bs.length;
    bs[j].click(); bs[j].focus();
  });
  $('#seg-vel').addEventListener('click', function (e) { var b = e.target.closest('[data-vel]'); if (!b) return; S.vel = b.getAttribute('data-vel'); save(); syncSettingsUI(); speak('Así hablo a velocidad ' + b.textContent.toLowerCase() + '.', { force: true }); });
  $('#btn-test-voice').addEventListener('click', function () { speak('¡Hola! Soy Toche, tu guía en Cúcuta. Te acompaño en cada ruta.', { force: true }); });
  onEnter.accesibilidad = syncSettingsUI;

  /* =========================================================
     Hablar con Toche (botón central)
     ========================================================= */
  function matchPlace(t) {
    var best = null, bl = 0;
    PLACES.forEach(function (p) {
      (KEYWORDS[p.id] || []).forEach(function (k) { if (t.indexOf(k) >= 0 && k.length > bl) { bl = k.length; best = p; } });
    });
    return best;
  }
  function whereText() {
    if (!pos) return 'Aún no tengo tu ubicación.';
    var n = nearestPlace(ll(pos));
    var base = pos.src === 'gps' ? (geoName ? 'Estás en ' + geoName : 'Tengo tu ubicación por GPS') : 'Estás en la ubicación de demostración, ' + demoLabel();
    return base + (n ? '. El lugar turístico más cercano es ' + n.p.name + ', a ' + sayDist(n.d) + '.' : '.');
  }
  function handleCommand(raw) {
    var t = norm(raw);
    if (!t) return;
    var p = matchPlace(t);
    if (/(ayuda|emergencia|socorro|auxilio|\bsos\b|policia|hospital|ambulancia|\bcai\b)/.test(t)) { go('ayuda', { tab: true, silent: true }); speak('Aquí tienes ayuda. El botón rojo llama al uno dos tres.', { force: true }); return; }
    if (p && /(llevame|ir a|ir al|vamos|como llego|guiame|ruta a|navegar)/.test(t)) { startNav(p.id); return; }
    if (p) { go('mapa', { tab: true, select: p.id }); return; }
    if (/(donde estoy|mi ubicacion|ubicame)/.test(t)) { var w = whereText(); toast(w, 5000); speak(w, { force: true }); return; }
    if (/(cerca|cercano|mas cerca)/.test(t) && pos) { var n = nearestPlace(ll(pos), PLACES.filter(function (x) { return x.coords && !hasStamp(x.id); })); if (n) { startNav(n.p.id); return; } }
    if (/(comida|comer|restaurante|gastronom|almorzar|desayun)/.test(t)) { go('mapa', { tab: true, filter: 'gastronomia' }); return; }
    if (/(mapa|explorar)/.test(t)) { go('mapa', { tab: true }); return; }
    if (/ruta/.test(t)) { go('rutas', { tab: true }); return; }
    if (/(pasaporte|estampa|album|insignia)/.test(t)) { go('album', { tab: true }); return; }
    if (/(accesib|contraste|letra|voz)/.test(t)) { go('accesibilidad'); return; }
    if (/(inicio|principal|home)/.test(t)) { go('inicio', { tab: true }); return; }
    go('mapa', { tab: true, search: raw });
  }
  function openCommandSheet() {
    var cmds = [['mapa', 'Explorar el mapa', 'map'], ['llevame al lugar mas cercano', 'Llévame al lugar más cercano', 'nav'], ['rutas', 'Ver las rutas', 'flag'],
      ['pasaporte', 'Mi pasaporte', 'award'], ['donde estoy', '¿Dónde estoy?', 'pin'], ['ayuda', 'Ayuda y emergencias', 'help']];
    openModal('<div class="m-head"><span class="toche-badge gold" style="width:48px;height:48px;border-radius:24px" data-toche="bust"></span><h2 class="t-h2" id="modal-title" tabindex="-1">¿Qué quieres hacer?</h2></div>' +
      '<p class="m-text">Este navegador no entiende comandos de voz. Elige una opción:</p>' +
      '<div class="m-list">' + cmds.map(function (c) { return '<button type="button" class="m-item" data-m="cmd" data-cmd="' + c[0] + '"><span class="m-ic">' + ic(c[2]) + '</span><span class="grow"><b>' + c[1] + '</b></span>' + ic('chev-r', 'chev') + '</button>'; }).join('') + '</div>');
  }
  $('#tab-voice').addEventListener('click', function () {
    var btn = this;
    if (!listen(btn, function (t) { toast('«' + t + '»'); handleCommand(t); })) openCommandSheet();
  });

  /* =========================================================
     Panel de demostración (escritorio)
     ========================================================= */
  function jump(j) {
    if (j === 'navegacion') {
      go('mapa', { tab: true, silent: true });
      var it = (selId && items[selId]) || itemFromPlace(place('parque'));
      setTimeout(function () { startNav(it); }, 120);
      return;
    }
    if (j === 'punto') { openPunto(punto.id || 'templo'); return; }
    if (nav && j !== 'mapa') endNav(true);
    go(j, { tab: true });
  }
  $('#pn-gps').addEventListener('click', function () { S.locMode = 'auto'; save(); startGPS(true); });
  $('#pn-demo').addEventListener('click', function () { S.locMode = 'demo'; save(); demoAt = CITY.demo.slice(); useDemo(); toast('Ubicación de demostración: centro de Cúcuta'); });
  $('#pn-arrive').addEventListener('click', function () {
    var it = nav ? nav.it : (curId() === 'punto' && punto.id ? itemFromPlace(place(punto.id)) : (selId && items[selId]));
    if (!it) { var n = pos ? nearestPlace(ll(pos), PLACES.filter(function (p) { return p.coords && !hasStamp(p.id); })) : null; it = n ? itemFromPlace(n.p) : itemFromPlace(place('parque')); }
    if (!it || !it.coords) { toast('Ese lugar aún no tiene ubicación'); return; }
    S.locMode = 'demo'; save();
    demoAt = it.coords.slice();
    if (nav) { setPos({ lat: demoAt[0], lng: demoAt[1], acc: 5, heading: null, src: 'demo' }); return; }
    if (it.type === 'place') { arrivedAt[it.id] = Date.now(); fenceShown[it.id] = Date.now(); }
    setPos({ lat: demoAt[0], lng: demoAt[1], acc: 5, heading: null, src: 'demo' });
    if (it.type === 'place') { vibrate([120, 80, 120]); openPunto(it.id, { arrived: true }); }
    else toast('Llegaste a ' + it.name);
  });
  $('#pn-safe').addEventListener('click', function () {
    var on = !app.classList.contains('show-safe');
    app.classList.toggle('show-safe', on); this.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  $('#pn-reset').addEventListener('click', function () {
    try { localStorage.removeItem(KEY); localStorage.removeItem(PKEY); } catch (e) {}
    S = load(); PHOTOS = {}; arrivedAt = {}; fenceShown = {};
    if (nav) endNav(true);
    stopSpeak(); applySettings(); updateCounts();
    demoAt = CITY.demo.slice();
    go('bienvenida', { tab: true });
    toast('Demo reiniciada');
  });
  function fit() {
    var d = $('#device');
    if (window.innerWidth < 600) { d.style.removeProperty('--fit'); return; }
    var k = Math.min(1, (window.innerHeight - 40) / 868);
    d.style.setProperty('--fit', k.toFixed(3));
  }
  window.addEventListener('resize', debounce(function () { fit(); if (map) { map.invalidateSize(); placeAttr(); } if (nav) measureNav(); }, 120));
  fit();
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function () { if (nav) measureNav(); else placeAttr(); });
    [$('.nav-top'), $('.nav-bottom'), $('#place-card'), $('#route-card')].forEach(function (el) { if (el) ro.observe(el); });
  }
  window.addEventListener('online', function () { if (map && tiles) tiles.redraw(); });

  /* =========================================================
     Arranque
     ========================================================= */
  $$('.screen').forEach(function (s) {
    s.inert = true;
    $$('.rise', s).forEach(function (el, i) { el.style.setProperty('--i', i); });
  });
  $$('[data-thumb]').forEach(function (el) { el.innerHTML = ART.thumb(el.getAttribute('data-thumb'), 56); });
  renderLines();
  applySettings();
  updateCounts();
  renderLocChip();
  go(S.onboarded ? 'inicio' : 'bienvenida', { tab: true, silent: true });
  if (S.onboarded) bootLocation();
  resolvePlaces();
})();
