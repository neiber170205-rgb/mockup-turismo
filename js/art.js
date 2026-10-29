/* Ruta Toche · ilustraciones (SVG en línea, sin dependencias).
   Son ilustraciones de referencia: si existe img/<id>-hoy.jpg o img/<id>-antes.jpg,
   la app las muestra encima automáticamente. */
window.RT_ART = (function () {
  'use strict';

  var CAT_ICON = { historia: 'landmark', cultural: 'palette', gastronomia: 'utensils', religioso: 'church', naturaleza: 'tree', servicios: 'help' };

  function use(icon, size) {
    return '<use href="#i-' + icon + '" width="' + (size || 24) + '" height="' + (size || 24) + '"/>';
  }

  /* ---------- Miniaturas 72 × 72 ---------- */
  var T = {};
  T.parque = '<rect width="72" height="72" fill="#CDEBF8"/><circle cx="57" cy="15" r="8" fill="#FFD166"/><rect y="50" width="72" height="22" fill="#8CC26F"/><path d="M28 72 L38 52 H60 L70 72Z" fill="#E9DCC0"/><path d="M18 72 C 19 58, 16 48, 22 38" stroke="#7A5233" stroke-width="3" fill="none" stroke-linecap="round"/><g stroke="#2F6B2C" stroke-width="3" stroke-linecap="round" fill="none"><path d="M22 38 C 14 32, 8 33, 4 38"/><path d="M22 38 C 17 29, 11 27, 7 28"/><path d="M22 38 C 26 30, 32 28, 38 30"/><path d="M22 38 C 29 34, 35 36, 38 41"/></g><rect x="44" y="40" width="14" height="12" rx="1.5" fill="#E7E1D5"/><rect x="42" y="50" width="18" height="4" rx="1" fill="#D6CFC1"/><path d="M51 40 V31 M47.5 34.5 H54.5" stroke="#57534E" stroke-width="2.6" stroke-linecap="round"/><circle cx="51" cy="28" r="2.6" fill="#57534E"/>';
  T.catedral = '<rect width="72" height="72" fill="#CDEBF8"/><rect y="58" width="72" height="14" fill="#E9DCC0"/><path d="M14 34 L36 24 L58 34Z" fill="#E3D6C1"/><rect x="16" y="33" width="40" height="25" fill="#F2E9DA"/><rect x="29" y="12" width="14" height="24" fill="#F2E9DA"/><path d="M27 13 L36 4 L45 13Z" fill="#C4704A"/><path d="M36 0 V5 M34 2 H38" stroke="#57534E" stroke-width="1.6"/><circle cx="36" cy="21" r="3.4" fill="#FFFFFF" stroke="#B0A48F" stroke-width="1.2"/><path d="M31 58 V48 A5 5 0 0 1 41 48 V58Z" fill="#7A5233"/><path d="M20 50 V44 A3 3 0 0 1 26 44 V50Z M46 50 V44 A3 3 0 0 1 52 44 V50Z" fill="#7A5233"/>';
  T.torre = '<rect width="72" height="72" fill="#CDEBF8"/><rect y="58" width="72" height="14" fill="#8CC26F"/><rect x="12" y="44" width="48" height="16" fill="#E9DFCF"/><rect x="27" y="14" width="18" height="32" fill="#EFE6D6"/><path d="M25 15 L36 4 L47 15Z" fill="#C8102E"/><circle cx="36" cy="26" r="6.5" fill="#FFFFFF" stroke="#8B7D66" stroke-width="1.4"/><path d="M36 26 V22 M36 26 L39 27.5" stroke="#1C1917" stroke-width="1.4" stroke-linecap="round"/><path d="M16 52 h6 M26 52 h6 M40 52 h6 M50 52 h6" stroke="#B9A98F" stroke-width="4"/>';
  T.quinta = '<rect width="72" height="72" fill="#CDEBF8"/><rect y="54" width="72" height="18" fill="#8CC26F"/><rect x="10" y="34" width="52" height="22" fill="#F6E7C8"/><path d="M5 36 L36 21 L67 36Z" fill="#C4704A"/><path d="M16 56 V45 A4 4 0 0 1 24 45 V56Z M32 56 V45 A4 4 0 0 1 40 45 V56Z M48 56 V45 A4 4 0 0 1 56 45 V56Z" fill="#8B5E3C"/><circle cx="6" cy="58" r="6" fill="#5E9E4A"/><circle cx="67" cy="57" r="7" fill="#5E9E4A"/>';
  T.pastel = '<rect width="72" height="72" fill="#FFF4DB"/><circle cx="36" cy="38" r="25" fill="#FFFFFF" stroke="#EDE5D6" stroke-width="3"/><path d="M16 44 A14 14 0 0 1 44 44 Z" fill="#E8A33D"/><path d="M17 44 H43" stroke="#C9831F" stroke-width="2.5" stroke-dasharray="2.5 2.5"/><path d="M30 33 A12 12 0 0 1 54 33 Z" fill="#EDB04F" transform="rotate(20 42 33)"/><circle cx="47" cy="50" r="6" fill="#C8102E"/><circle cx="47" cy="50" r="3.5" fill="#E2453F"/>';
  T.mute = '<rect width="72" height="72" fill="#FFF4DB"/><path d="M27 24 q-3 -5 0 -10 M36 22 q-3 -5 0 -10 M45 24 q-3 -5 0 -10" stroke="#D6CFC1" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M52 31 L64 17" stroke="#B0A48F" stroke-width="3" stroke-linecap="round"/><path d="M12 36 A24 22 0 0 0 60 36 Z" fill="#FFFFFF" stroke="#EDE5D6" stroke-width="2.5"/><ellipse cx="36" cy="36" rx="24" ry="6" fill="#D98E2B"/><circle cx="28" cy="35" r="2.6" fill="#F5C842"/><circle cx="40" cy="37" r="2.4" fill="#F5C842"/><circle cx="46" cy="34.5" r="2" fill="#5E9E4A"/><circle cx="33" cy="38" r="1.8" fill="#5E9E4A"/>';
  T.malecon = '<rect width="72" height="72" fill="#CDEBF8"/><rect y="40" width="72" height="12" fill="#E9DCC0"/><path d="M0 52 C 20 46, 50 58, 72 50 V72 H0Z" fill="#7FC3EC"/><path d="M8 60 q6 -3 12 0 M40 63 q6 -3 12 0" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M16 42 V30" stroke="#7A5233" stroke-width="3"/><circle cx="16" cy="25" r="9" fill="#5E9E4A"/><path d="M52 42 V28" stroke="#7A5233" stroke-width="3"/><circle cx="52" cy="23" r="10" fill="#4E8C3D"/><path d="M34 42 V22" stroke="#57534E" stroke-width="2"/><circle cx="34" cy="20" r="3" fill="#FFD166"/>';
  T.templo = '<rect width="72" height="72" fill="#CDEBF8"/><circle cx="58" cy="14" r="7" fill="#FFD166"/><rect y="54" width="72" height="18" fill="#8CC26F"/><path d="M14 56 V36 L20 33 L24 36 L30 32 V28 H42 V32 L48 36 L52 33 L58 36 V56Z" fill="#C4704A"/><path d="M33 56 V46 A3 3 0 0 1 39 46 V56Z" fill="#6A2F1C"/><path d="M20 56 V48 A2.5 2.5 0 0 1 25 48 V56Z M47 56 V48 A2.5 2.5 0 0 1 52 48 V56Z" fill="#7E3B24"/><rect x="30" y="22" width="12" height="7" fill="#EFE7DA"/><path d="M28 23 A8 8 0 0 1 44 23Z" fill="#F7F2EA"/><path d="M36 11 V15 M34 13 H38" stroke="#57534E" stroke-width="1.5"/>';
  T.casa = '<rect width="72" height="72" fill="#CDEBF8"/><circle cx="14" cy="14" r="7" fill="#FFD166"/><rect y="56" width="72" height="16" fill="#8CC26F"/><rect x="10" y="33" width="52" height="25" fill="#F7F2EA"/><path d="M5 35 L36 20 L67 35Z" fill="#C4704A"/><path d="M5 35 H67" stroke="#A9573A" stroke-width="2"/><rect x="31" y="42" width="10" height="16" rx="1" fill="#7A5233"/><rect x="15" y="40" width="9" height="10" rx="1" fill="#8B5E3C"/><rect x="48" y="40" width="9" height="10" rx="1" fill="#8B5E3C"/><path d="M14 50 H25 M47 50 H58" stroke="#57534E" stroke-width="1.8"/><path d="M19.5 40 V50 M52.5 40 V50" stroke="#F7F2EA" stroke-width="1.2"/><circle cx="66" cy="55" r="6" fill="#5E9E4A"/>';
  T.puente = '<rect width="72" height="72" fill="#CDEBF8"/><circle cx="60" cy="12" r="6" fill="#FFD166"/><path d="M0 46 H72 V72 H0Z" fill="#8CC26F"/><path d="M0 52 C 20 48, 50 56, 72 50 V72 H0Z" fill="#7FC3EC"/><path d="M8 63 q6 -3 12 0 M42 65 q6 -3 12 0" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M16 44 h4 v14 h-4z M34 44 h4 v14 h-4z M52 44 h4 v14 h-4z" fill="#A89878"/><rect y="30" width="72" height="7" fill="#D6CFC1"/><path d="M0 37 H72 V46 Q63 34 54 46 Q45 34 36 46 Q27 34 18 46 Q9 34 0 46 Z" fill="#B9A98F"/><path d="M0 24 H72" stroke="#8B7D66" stroke-width="1.8"/><path d="M6 24 V30 M18 24 V30 M30 24 V30 M42 24 V30 M54 24 V30 M66 24 V30" stroke="#8B7D66" stroke-width="1.6"/>';
  T.cristo = '<rect width="72" height="72" fill="#CDEBF8"/><circle cx="58" cy="14" r="7" fill="#FFD166"/><path d="M0 72 V54 Q 18 38 36 38 Q 54 38 72 54 V72Z" fill="#8CC26F"/><path d="M0 72 V62 Q 20 54 36 56 Q 56 54 72 62 V72Z" fill="#6FAE58"/><rect x="31" y="32" width="10" height="7" rx="1" fill="#D6CFC1"/><g fill="#F2E9DA" stroke="#B0A48F" stroke-width=".8"><circle cx="36" cy="12" r="2.6"/><path d="M33.2 15.5 H38.8 L38.2 32 H33.8Z"/><path d="M25 16.5 H47 V19 H25Z"/></g>';
  T.biblioteca = '<rect width="72" height="72" fill="#CDEBF8"/><rect y="58" width="72" height="14" fill="#E9DCC0"/><path d="M10 28 L36 15 L62 28Z" fill="#E3D6C1"/><rect x="11" y="28" width="50" height="4" fill="#D6CFC1"/><g fill="#F2E9DA"><rect x="15" y="32" width="5" height="24"/><rect x="24" y="32" width="5" height="24"/><rect x="43" y="32" width="5" height="24"/><rect x="52" y="32" width="5" height="24"/></g><rect x="31" y="40" width="10" height="16" rx="1" fill="#7A5233"/><rect x="9" y="56" width="54" height="3" fill="#B0A48F"/><path d="M29 22 Q 32.5 20 36 22 Q 39.5 20 43 22 V27 Q 39.5 25 36 27 Q 32.5 25 29 27 Z" fill="#6D28D9"/>';
  T.comida = T.pastel;

  function thumb(id, size) {
    var s = size || 72;
    if (!T[id]) return '';
    return '<svg viewBox="0 0 72 72" width="' + s + '" height="' + s + '" aria-hidden="true" focusable="false">' + T[id] + '</svg>';
  }

  /* ---------- Escenas grandes del punto turístico ---------- */
  var TEMPLO_HOY = '<rect width="390" height="380" fill="#CDEBF8"/><circle cx="322" cy="104" r="30" fill="#FFD166"/><g fill="#FFFFFF"><rect x="34" y="104" width="96" height="22" rx="11"/><rect x="62" y="90" width="52" height="24" rx="12"/><rect x="226" y="148" width="72" height="18" rx="9"/></g><path d="M0 262 Q 100 222 196 250 T 390 238 V380 H0 Z" fill="#A9D18E"/><rect y="300" width="390" height="80" fill="#8CC26F"/><path d="M160 380 L182 304 H208 L230 380 Z" fill="#E9DCC0"/><path d="M58 304 V262" stroke="#7A5233" stroke-width="7"/><circle cx="58" cy="250" r="30" fill="#5E9E4A"/><path d="M336 304 V258" stroke="#7A5233" stroke-width="7"/><circle cx="336" cy="244" r="34" fill="#4E8C3D"/><path d="M100 306 V214 L116 206 L128 214 L144 203 L154 209 V194 H236 V209 L246 203 L262 214 L274 206 L290 214 V306 Z" fill="#C4704A"/><path d="M195 194 H236 V209 L246 203 L262 214 L274 206 L290 214 V306 H195 Z" fill="#B4633F"/><path d="M104 250 H150 M240 250 H286 M104 282 H118 M272 282 H286 M160 228 H230" stroke="#A9573A" stroke-width="2"/><path d="M122 306 V262 A14 14 0 0 1 150 262 V306 Z M240 306 V262 A14 14 0 0 1 268 262 V306 Z" fill="#7E3B24"/><path d="M178 306 V252 A17 17 0 0 1 212 252 V306 Z" fill="#6A2F1C"/><path d="M128 236 V228 A6 6 0 0 1 140 228 V236 Z M250 236 V228 A6 6 0 0 1 262 228 V236 Z" fill="#7E3B24"/><rect x="165" y="166" width="60" height="30" fill="#EFE7DA"/><path d="M174 174 h6 v14 h-6z M192 174 h6 v14 h-6z M210 174 h6 v14 h-6z" fill="#CDBFA8"/><path d="M157 168 A38 38 0 0 1 233 168 Z" fill="#F7F2EA"/><path d="M195 130 A38 38 0 0 1 233 168 H195 Z" fill="#E7DECF"/><rect x="188" y="114" width="14" height="18" fill="#EFE7DA"/><path d="M195 94 V114 M189 100 H201" stroke="#57534E" stroke-width="3"/>';
  var TEMPLO_ANTES = '<rect width="390" height="380" fill="#E6D7B8"/><path d="M0 262 Q 100 226 196 252 T 390 240 V380 H0 Z" fill="#D2BF99"/><rect y="300" width="390" height="80" fill="#C2AC85"/><path d="M58 304 V266" stroke="#7D6A50" stroke-width="6"/><circle cx="58" cy="256" r="24" fill="#9C8A6B"/><path d="M100 306 V232 L114 220 L124 236 L138 214 L150 228 L160 206 L176 224 L190 200 L204 222 L218 204 L232 226 L246 212 L258 232 L272 218 L290 236 V306 Z" fill="#A88A66"/><path d="M122 306 V262 A14 14 0 0 1 150 262 V306 Z M240 306 V262 A14 14 0 0 1 268 262 V306 Z" fill="#5E4A36"/><path d="M178 306 V252 A17 17 0 0 1 212 252 V306 Z" fill="#4E3D2C"/><path d="M150 248 L158 262 L152 278 M234 246 L226 262 L234 276 M196 214 L190 232" stroke="#6E5A44" stroke-width="2" fill="none"/><path d="M80 306 L96 288 L114 306 Z M268 306 L290 284 L308 306 Z M198 306 L212 294 L224 306 Z" fill="#8C7355"/><rect x="8" y="8" width="374" height="364" fill="none" stroke="#8C7355" stroke-width="16" opacity="0.25"/>';

  // era: 'hoy' | 'antes'. Devuelve { svg, sepia } — sepia=true cuando "antes" es la misma ilustración en tono antiguo.
  function scene(id, era) {
    if (id === 'templo') {
      return { svg: '<svg viewBox="0 0 390 380" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' + (era === 'antes' ? TEMPLO_ANTES : TEMPLO_HOY) + '</svg>', sepia: false };
    }
    var inner = T[id] || T.parque;
    return { svg: '<svg viewBox="0 0 72 72" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' + inner + '</svg>', sepia: era === 'antes' };
  }

  /* Tarjeta destacada: Ruta de la Independencia (358 × 168) */
  var FEATURED = '<svg viewBox="0 0 358 168" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><rect width="358" height="168" fill="#CDEBF8"/><circle cx="300" cy="40" r="22" fill="#FFD166"/><g fill="#FFFFFF"><rect x="40" y="34" width="64" height="16" rx="8"/><rect x="62" y="24" width="34" height="18" rx="9"/></g><path d="M0 118 Q 90 96 180 112 T 358 104 V168 H0 Z" fill="#A9D18E"/><rect y="136" width="358" height="32" fill="#8CC26F"/><path d="M150 168 L168 140 H190 L208 168 Z" fill="#E9DCC0"/><path d="M60 140 V112" stroke="#7A5233" stroke-width="5"/><circle cx="60" cy="104" r="20" fill="#5E9E4A"/><path d="M300 140 V110" stroke="#7A5233" stroke-width="5"/><circle cx="300" cy="100" r="23" fill="#4E8C3D"/><path d="M104 140 V80 L116 74 L126 80 L138 72 L146 76 V64 H212 V76 L220 72 L232 80 L242 74 L254 80 V140 Z" fill="#C4704A"/><path d="M122 140 V112 A10 10 0 0 1 142 112 V140 Z M216 140 V112 A10 10 0 0 1 236 112 V140 Z" fill="#7E3B24"/><path d="M167 140 V106 A12 12 0 0 1 191 106 V140 Z" fill="#6A2F1C"/><path d="M126 96 V90 A4 4 0 0 1 134 90 V96 Z M224 96 V90 A4 4 0 0 1 232 90 V96 Z" fill="#7E3B24"/><rect x="157" y="52" width="44" height="14" fill="#EFE7DA"/><path d="M151 54 A28 28 0 0 1 207 54 Z" fill="#F7F2EA"/><path d="M179 26 A28 28 0 0 1 207 54 H179 Z" fill="#E7DECF"/><rect x="174" y="16" width="10" height="12" fill="#EFE7DA"/><path d="M179 4 V16 M175 8 H183" stroke="#57534E" stroke-width="2"/></svg>';

  /* ---------- Estampas ---------- */
  function stampSmall(cat) {
    return '<svg viewBox="0 0 88 88" aria-hidden="true" focusable="false"><circle cx="44" cy="44" r="40" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-dasharray="1.5 6" stroke-linecap="round"/>' +
      '<circle cx="44" cy="44" r="32" fill="none" stroke="#FFFFFF" stroke-width="1.6" opacity=".85"/>' +
      '<g transform="translate(29 29) scale(1.25)" fill="none" stroke="#FFFFFF" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" color="#FFFFFF">' + use(CAT_ICON[cat] || 'star') + '</g></svg>';
  }
  function splitName(name) {
    var up = name.toUpperCase();
    if (up.length <= 17) return [up];
    var words = up.split(' '), best = [up], bestDiff = 1e9;
    for (var i = 1; i < words.length; i++) {
      var a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
      var d = Math.abs(a.length - b.length);
      if (d < bestDiff) { bestDiff = d; best = [a, b]; }
    }
    return best;
  }
  function stampBig(cat, name, year) {
    var lines = splitName(name);
    var txt = lines.length === 1
      ? '<text x="110" y="148" text-anchor="middle" font-size="12.5" font-weight="800" letter-spacing="1" fill="#FFFFFF">' + escXML(lines[0]) + '</text>'
      : '<text x="110" y="141" text-anchor="middle" font-size="11.5" font-weight="800" letter-spacing=".6" fill="#FFFFFF">' + escXML(lines[0]) + '</text>' +
        '<text x="110" y="156" text-anchor="middle" font-size="11.5" font-weight="800" letter-spacing=".6" fill="#FFFFFF">' + escXML(lines[1]) + '</text>';
    return '<circle cx="110" cy="110" r="104" style="fill:var(--c-' + cat + ')"/>' +
      '<circle cx="110" cy="110" r="100" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-dasharray="2.5 9" stroke-linecap="round"/>' +
      '<circle cx="110" cy="110" r="86" fill="none" stroke="#FFFFFF" stroke-width="2.5"/>' +
      '<circle cx="110" cy="110" r="64" fill="none" stroke="#FFFFFF" stroke-opacity=".6" stroke-width="2" stroke-dasharray="5 5"/>' +
      '<text x="110" y="52" text-anchor="middle" font-size="13" font-weight="800" letter-spacing="2" fill="#FFFFFF">RUTA TOCHE</text>' +
      '<g transform="translate(86 74) scale(2)" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" color="#FFFFFF">' + use(CAT_ICON[cat] || 'star') + '</g>' +
      txt +
      '<text x="110" y="' + (lines.length === 1 ? 172 : 177) + '" text-anchor="middle" font-size="11" font-weight="700" letter-spacing="2" fill="#FFFFFF" fill-opacity=".8">CÚCUTA · ' + year + '</text>';
  }
  function escXML(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- Pines del mapa ---------- */
  function pin(cat) {
    return '<svg viewBox="0 0 40 52" aria-hidden="true" focusable="false"><path d="M20 50 C 15 42, 3 33, 3 20 A17 17 0 0 1 37 20 C 37 33, 25 42, 20 50 Z" style="fill:var(--c-' + cat + ')" stroke="#FFFFFF" stroke-width="3"/>' +
      '<g transform="translate(10 10) scale(0.8333)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" color="#FFFFFF">' + use(CAT_ICON[cat] || 'pin') + '</g></svg>';
  }
  function pinService(kind) {
    var hosp = kind === 'hospital';
    return '<svg viewBox="0 0 40 52" aria-hidden="true" focusable="false"><rect x="3" y="11" width="34" height="34" rx="10" fill="' + (hosp ? '#FFFFFF' : '#1C1917') + '" stroke="' + (hosp ? '#C8102E' : '#FFFFFF') + '" stroke-width="' + (hosp ? 2.5 : 3) + '"/>' +
      '<g transform="translate(10 18) scale(0.8333)" fill="none" stroke="' + (hosp ? '#C8102E' : '#FFFFFF') + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' +
      (hosp ? '<path d="M12 5v14M5 12h14" stroke-width="3.4"/>' : '<path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z"/>') + '</g></svg>';
  }
  function pinSearch() {
    return '<svg viewBox="0 0 40 52" aria-hidden="true" focusable="false"><path d="M20 50 C 15 42, 3 33, 3 20 A17 17 0 0 1 37 20 C 37 33, 25 42, 20 50 Z" fill="#0369A1" stroke="#FFFFFF" stroke-width="3"/><circle cx="20" cy="20" r="6" fill="#FFFFFF"/></svg>';
  }

  /* Mapa decorativo del botón "Explorar mapa" ya está en el HTML. */

  return {
    CAT_ICON: CAT_ICON, use: use, thumb: thumb, has: function (id) { return !!T[id]; },
    scene: scene, FEATURED: FEATURED, stampSmall: stampSmall, stampBig: stampBig,
    pin: pin, pinService: pinService, pinSearch: pinSearch
  };
})();
