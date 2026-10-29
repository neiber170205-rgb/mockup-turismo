/* Ruta Toche · Toche animado (SVG + resortes, sin librerías).
   Es el mismo Toche del demo "Toche vivo": basado en el toche real (Icterus chrysater).
   - Cabeza, cuello y cuerpo son una sola silueta: el cuello se dobla sin uniones.
   - Resortes para la inercia y el rebote; aleteo visto de lado; vuelo con pausas de alas cerradas.
   Uso:
     var t = RT_TOCHE.mount(elemento, { view: 'bust' | 'full' | 'scene', facing: 1 | -1 });
     t.chirp(1200); t.celebrate(); t.flyIn({ from: 1, bounds: elemento, then: fn }); t.reset();
     RT_TOCHE.setSpeaking(true|false); RT_TOCHE.setListening(true|false); RT_TOCHE.mountAll(raiz);
   'scene' dibuja dentro de un <g> de otra ilustración SVG (sin fondo propio). */
window.RT_TOCHE = (function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduced() { return !!(mq && mq.matches); }

  /* ---------- Matrices 2D y resortes ---------- */
  function mul(m, n) { return [m[0]*n[0]+m[2]*n[1], m[1]*n[0]+m[3]*n[1], m[0]*n[2]+m[2]*n[3], m[1]*n[2]+m[3]*n[3], m[0]*n[4]+m[2]*n[5]+m[4], m[1]*n[4]+m[3]*n[5]+m[5]]; }
  function T(x, y) { return [1, 0, 0, 1, x, y]; }
  function Sc(sx, sy, px, py) { return mul(mul(T(px, py), [sx, 0, 0, sy, 0, 0]), T(-px, -py)); }
  function R(deg, px, py) { var r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return mul(mul(T(px, py), [c, s, -s, c, 0, 0]), T(-px, -py)); }
  function ap(m, p) { return [m[0]*p[0]+m[2]*p[1]+m[4], m[1]*p[0]+m[3]*p[1]+m[5]]; }
  function str(m) { return 'matrix(' + m.map(function (v) { return Math.round(v * 10000) / 10000; }).join(' ') + ')'; }
  function spring(x, k, z) { return { x: x, v: 0, t: x, k: k, c: 2 * Math.sqrt(k) * z }; }
  function stepS(s, dt) { var a = s.k * (s.t - s.x) - s.c * s.v; s.v += a * dt; s.x += s.v * dt; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- Esqueleto (unidades del dibujo 240 × 200) ---------- */
  var HIP = [128, 134], NECK = [178, 101], SHOULDER = [151.2, 93], TAILB = [88.8, 81.2], JAW = [200.79, 94.79], LID = [192.45, 90.2], FX = 131;
  var HIPS = [[122.5, 137.4], [130.5, 138.4]], FEET = [[126.5, 153], [138.5, 153.2]], MOUTH = [221.53, 99.58];
  var C = [131, 112], ALPHA = -137.5, TAILANG = 218.5;
  var VIEWS = { full: [30, 34, 204, 130], bust: [148, 62, 84, 84] };

  /* Silueta y antifaz: cada punto es x, y, peso de la cabeza (0 = cuerpo, 1 = cabeza). */
  var SIL = ['M', 207.47, 90.83, 1, 'C', 207.47, 90.83, 1, 206.99, 87.36, 1, 206, 85.77, 1, 'C', 205.01, 84.18, 1, 203.39, 82.41, 1, 201.52, 81.29, 1, 'C', 199.65, 80.17, 1, 197.23, 79.37, 1, 194.8, 79.05, 1, 'C', 192.37, 78.73, 1, 189.46, 78.81, 1, 186.96, 79.38, 1, 'C', 184.46, 79.96, 0.98, 181.75, 81.35, 0.97, 179.78, 82.51, 0.95, 'C', 177.81, 83.66, 0.9, 176.9, 85.47, 0.85, 175.15, 86.31, 0.8, 'C', 173.4, 87.16, 0.72, 171.22, 87.46, 0.63, 169.26, 87.57, 0.55, 'C', 167.3, 87.68, 0.45, 165.48, 87.23, 0.35, 163.37, 86.99, 0.25, 'C', 161.26, 86.75, 0.19, 158.86, 86.44, 0.14, 156.6, 86.14, 0.08, 'C', 154.33, 85.83, 0.05, 153.27, 85.46, 0.03, 149.8, 85.16, 0, 'C', 146.33, 84.86, 0, 140.93, 84.46, 0, 135.8, 84.32, 0, 'C', 130.67, 84.18, 0, 124.6, 84.41, 0, 119, 84.32, 0, 'C', 113.4, 84.23, 0, 106.77, 83.95, 0, 102.2, 83.76, 0, 'C', 97.63, 83.57, 0, 94.08, 82.73, 0, 91.56, 83.2, 0, 'C', 89.04, 83.67, 0, 88.2, 84.93, 0, 87.08, 86.56, 0, 'C', 85.96, 88.19, 0, 85.17, 90.71, 0, 84.84, 93, 0, 'C', 84.51, 95.29, 0, 84.65, 97.76, 0, 85.12, 100.28, 0, 'C', 85.59, 102.8, 0, 86.38, 105.37, 0, 87.64, 108.12, 0, 'C', 88.9, 110.87, 0, 90.81, 114.09, 0, 92.68, 116.8, 0, 'C', 94.55, 119.51, 0, 96.69, 121.89, 0, 98.84, 124.36, 0, 'C', 100.99, 126.83, 0, 103.37, 129.59, 0, 105.56, 131.64, 0, 'C', 107.75, 133.69, 0, 109.67, 135.33, 0, 112, 136.68, 0, 'C', 114.33, 138.03, 0, 117.09, 139.11, 0, 119.56, 139.76, 0, 'C', 122.03, 140.41, 0, 124.37, 140.88, 0, 126.84, 140.6, 0, 'C', 129.31, 140.32, 0, 131.6, 138.73, 0, 134.4, 138.08, 0, 'C', 137.2, 137.43, 0, 139.29, 136.86, 0, 143.64, 136.68, 0, 'C', 147.99, 136.5, 0, 156.01, 137.31, 0, 160.5, 137, 0, 'C', 164.99, 136.69, 0.01, 167.58, 135.77, 0.02, 170.6, 134.8, 0.03, 'C', 173.62, 133.83, 0.05, 176.1, 132.57, 0.08, 178.6, 131.2, 0.1, 'C', 181.1, 129.83, 0.14, 183.47, 128.27, 0.18, 185.6, 126.6, 0.22, 'C', 187.73, 124.93, 0.27, 189.67, 123.07, 0.33, 191.4, 121.2, 0.38, 'C', 193.13, 119.33, 0.45, 194.63, 117.37, 0.51, 196, 115.4, 0.58, 'C', 197.37, 113.43, 0.65, 198.6, 111.37, 0.71, 199.6, 109.4, 0.78, 'C', 200.6, 107.43, 0.83, 201.4, 105.44, 0.88, 202, 103.6, 0.93, 'C', 202.6, 101.76, 0.95, 203.17, 98.38, 0.98, 203.17, 98.38, 1, 'C', 203.17, 98.38, 1, 208.46, 95.87, 1, 209.17, 94.61, 1, 'C', 209.89, 93.35, 1, 207.47, 90.83, 1, 207.47, 90.83, 1, 'Z'];
  var MASK = ['M', 212.72, 87.11, 1, 'C', 212.72, 87.11, 1, 206.3, 87.73, 1, 203.76, 87.78, 1, 'C', 201.22, 87.84, 1, 199.37, 87.37, 1, 197.49, 87.45, 1, 'C', 195.6, 87.52, 1, 194.09, 87.73, 1, 192.45, 88.23, 1, 'C', 190.81, 88.74, 1, 188.77, 89.46, 1, 187.63, 90.47, 1, 'C', 186.49, 91.48, 1, 186.12, 92.94, 1, 185.62, 94.28, 1, 'C', 185.11, 95.62, 1, 185.17, 97.19, 1, 184.61, 98.54, 1, 'C', 184.04, 99.88, 0.98, 183.17, 101.12, 0.97, 182.23, 102.34, 0.95, 'C', 181.3, 103.56, 0.92, 180, 104.48, 0.88, 178.99, 105.85, 0.85, 'C', 177.98, 107.22, 0.8, 176.92, 109.01, 0.75, 176.16, 110.54, 0.7, 'C', 175.39, 112.06, 0.65, 174.96, 113.42, 0.6, 174.4, 115, 0.55, 'C', 173.84, 116.58, 0.5, 173.1, 118.37, 0.45, 172.8, 120, 0.4, 'C', 172.5, 121.63, 0.37, 172.3, 123.43, 0.33, 172.6, 124.8, 0.3, 'C', 172.9, 126.17, 0.27, 173.53, 127.37, 0.25, 174.6, 128.2, 0.22, 'C', 175.67, 129.03, 0.21, 177.33, 129.63, 0.21, 179, 129.8, 0.2, 'C', 180.67, 129.97, 0.21, 181.43, 129.83, 0.21, 184.6, 129.2, 0.22, 'C', 187.77, 128.57, 0.31, 198, 126, 0.41, 198, 126, 0.5, 'C', 198, 126, 0.67, 217, 108, 0.83, 217, 108, 1, 'C', 217, 108, 1, 217, 87, 1, 217, 87, 1, 'C', 217, 87, 1, 212.72, 87.11, 1, 212.72, 87.11, 1, 'Z'];
  function skin(def, MB, MH) {
    var out = '', i = 0, n = def.length;
    while (i < n) {
      var tok = def[i++];
      if (typeof tok === 'string') { out += tok; continue; }
      var x = tok, y = def[i++], w = def[i++];
      var b = ap(MB, [x, y]), h = ap(MH, [x, y]);
      out += (b[0] + (h[0] - b[0]) * w).toFixed(2) + ' ' + (b[1] + (h[1] - b[1]) * w).toFixed(2) + ' ';
    }
    return out;
  }

  /* ---------- Dibujo ---------- */
  var P = {
    openwing: 'M153.4 95.2 C152 86.4 148.6 77.6 142.4 70.6 C133.6 61 119.6 53 102.5 48.5 Q97.29 51.13 103.09 51.75 Q98.5 54.75 103.98 55.16 Q99.99 58.42 105.14 58.7 Q101.9 62.46 106.84 62.95 Q104.26 66.83 108.9 67.25 Q107.16 71.49 111.69 72.17 Q110.66 76.37 114.93 77 Q114.58 81.07 118.61 81.66 Q118.76 85.62 122.71 86.04 Q123.36 89.84 127.22 90.06 Q128.37 93.63 132.12 93.64 Q133.76 96.89 137.4 96.67 Q141.05 100.01 146 100 C148 101.2 151.6 99.4 153.4 95.2 Z',
    owlines: 'M147 92 C141 82 128 69 110 56 M142.6 96.4 C134 86.6 121 75.6 106 64 M137 99 C129 92 119 84 108 76',
    wing: 'M154.56 97.76 C154.47 95.8 154.19 94.63 153.16 93 C152.13 91.37 150.83 89.27 148.4 87.96 C145.97 86.65 143.03 85.86 138.6 85.16 C134.17 84.46 127.4 84.09 121.8 83.76 C116.2 83.43 110.04 83.53 105 83.2 C99.96 82.87 95.29 82.36 91.56 81.8 C87.83 81.24 84.65 80.07 82.6 79.84 C80.55 79.61 79.24 80.4 79.24 80.4 C79.24 80.4 80.45 82.22 82.04 83.48 C83.63 84.74 85.87 86.09 88.76 87.96 C91.65 89.83 95.76 92.25 99.4 94.68 C103.04 97.11 106.87 100.19 110.6 102.52 C114.33 104.85 118.07 106.86 121.8 108.68 C125.53 110.5 130.11 112.37 133 113.44 C135.89 114.51 137.2 115.21 139.16 115.12 C141.12 115.03 142.89 113.77 144.76 112.88 C146.63 111.99 148.87 111.15 150.36 109.8 C151.85 108.45 153.02 106.77 153.72 104.76 C154.42 102.75 154.65 99.72 154.56 97.76 Z',
    winglines: 'M131.6 84.6 C128.6 94.4 130.4 104.8 135.6 112.6 M124.6 87.4 C113 89.6 100.6 87.2 87.6 82.6 M127.2 95.6 C115 98 101.6 93 88.6 85 M129.6 104 C117.6 105 104 98.4 91.6 89',
    flank: 'M150.6 109.6 L146.6 111.6 Q143.45 110.84 140.28 111.47 Q137.09 109.65 133.46 110.19 Q129.02 107.82 124.02 107.16 Q120.8 104.28 116.49 103.97 Q112.66 100.94 107.93 99.69 Q105.2 96.65 101.19 95.87 Q99.02 93.56 96 92.6 C92 96 94 108 104 118 C116 124 140 122 152 116 Z',
    scap: 'M137 84.9 C141 85.2 150 85.8 158 86.6 L162.5 96 L158.5 106.6 L153.6 106.4 Q149.4 106.8 150.6 102.8 Q146.8 102.6 147.6 99 Q142.8 98.2 144.4 94.4 Q140.4 93.4 141.6 90.2 Q137.6 89.4 138.4 86.6 Z',
    lower: 'M200.79 94.79 C209.57 96.59 217.42 98.46 222.28 99.55 C217.89 100.41 209.86 99.82 202.97 98.28 C202.03 97.38 201.17 96.14 200.79 94.79 Z',
    upper: 'M205.69 90.52 C212.39 93.33 218.48 96.86 222.91 99.55 C217.33 98.84 209.49 96.97 200.79 94.79 C201.76 92.6 203.79 90.77 205.69 90.52 Z',
    culmen: 'M208.29 92.21 C212.28 93.82 216.2 95.76 219.66 97.71',
    fOut: 'M0 -3.8 C13 -4.2 30 -4.3 45 -3.9 C49.4 -3.5 51.6 -1.8 51.6 0 C51.6 1.8 49.4 3.5 45 3.9 C30 4.3 13 4.2 0 3.8 Z',
    fIn: 'M0 -3.9 C14 -4.3 33 -4.4 50 -4 C54.4 -3.6 56.8 -1.8 56.8 0 C56.8 1.8 54.4 3.6 50 4 C33 4.4 14 4.3 0 3.9 Z',
    fMid: 'M0 -4 C15 -4.4 38 -4.6 55 -4.1 C60 -3.7 62.6 -1.9 62.6 0 C62.6 1.9 60 3.7 55 4.1 C38 4.6 15 4.4 0 4 Z'
  };
  function markup(p) {
    var u = function (id) { return 'url(#' + p + id + ')'; };
    var leg = 'fill="none" stroke="#5E6A7A" stroke-linecap="round" stroke-linejoin="round"';
    return '<defs>' +
      '<linearGradient id="' + p + 'b" gradientUnits="userSpaceOnUse" x1="0" y1="80" x2="0" y2="141"><stop offset="0" stop-color="#EEA400"/><stop offset=".34" stop-color="#F6B30D"/><stop offset=".68" stop-color="#F5B412"/><stop offset="1" stop-color="#D38C00"/></linearGradient>' +
      '<linearGradient id="' + p + 'u" gradientUnits="userSpaceOnUse" x1="201" y1="0" x2="223" y2="0"><stop offset="0" stop-color="#16130F"/><stop offset=".38" stop-color="#2A3038"/><stop offset="1" stop-color="#17191D"/></linearGradient>' +
      '<linearGradient id="' + p + 'j" gradientUnits="userSpaceOnUse" x1="200.5" y1="0" x2="222.5" y2="0"><stop offset="0" stop-color="#909EB1"/><stop offset=".45" stop-color="#7A889B"/><stop offset=".62" stop-color="#2E333A"/><stop offset="1" stop-color="#1A1C20"/></linearGradient>' +
      '<radialGradient id="' + p + 'g"><stop offset="0" stop-color="#FFD859" stop-opacity=".62"/><stop offset="1" stop-color="#FFD859" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + p + 's"><stop offset="0" stop-color="#B47200" stop-opacity=".34"/><stop offset="1" stop-color="#B47200" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="' + p + 'c"><path data-r="clip"/></clipPath>' +
      '</defs>' +
      '<g data-r="back">' +
        '<g data-r="farwing" visibility="hidden"><path fill="#0B0908" d="' + P.openwing + '"/></g>' +
        '<g data-r="tail">' +
          '<g data-r="f1"><path fill="#141110" d="' + P.fOut + '"/></g><g data-r="f5"><path fill="#141110" d="' + P.fOut + '"/></g>' +
          '<g data-r="f2"><path fill="#17140F" d="' + P.fIn + '"/></g><g data-r="f4"><path fill="#17140F" d="' + P.fIn + '"/></g>' +
          '<g data-r="f3"><path fill="#1B1814" d="' + P.fMid + '"/><path d="M6 0 L60 0" stroke="#2C2724" stroke-width=".6" fill="none" opacity=".6"/><path d="M10 -2.9 C26 -3.4 42 -3.4 56 -2.9" stroke="#34343D" stroke-width=".9" fill="none" opacity=".7"/></g>' +
        '</g>' +
      '</g>' +
      '<g data-r="front">' +
        '<path data-r="leg1" ' + leg + ' stroke-width="3"/><path data-r="leg2" ' + leg + ' stroke-width="3"/>' +
        '<path data-r="toes1" ' + leg + ' stroke-width="1.9"/><path data-r="toes2" ' + leg + ' stroke-width="1.9"/>' +
        '<path data-r="sil" fill="' + u('b') + '"/>' +
        '<g clip-path="' + u('c') + '">' +
          '<g data-r="bodyfx"><ellipse cx="99" cy="110" rx="10" ry="14" fill="' + u('g') + '" opacity=".7"/><ellipse cx="174" cy="134" rx="12" ry="6" fill="' + u('s') + '" opacity=".6"/></g>' +
          '<path data-r="mask" fill="#14110E"/>' +
          '<g data-r="headfx"><ellipse cx="188.5" cy="84.6" rx="9" ry="3.4" fill="' + u('g') + '" transform="rotate(-4 188.5 84.6)"/></g>' +
        '</g>' +
        '<g data-r="wing"><path fill="#15120F" d="' + P.wing + '"/><path fill="none" stroke="#2D2926" stroke-width=".8" stroke-linecap="round" d="' + P.winglines + '"/><path fill="none" stroke="#3B3B45" stroke-width="1.6" stroke-linecap="round" opacity=".5" d="M147 87.6 C130 84.8 110 84.2 92 82.8"/></g>' +
        '<g data-r="flank"><path fill="' + u('b') + '" d="' + P.flank + '"/></g>' +
        '<g data-r="scap"><path fill="' + u('b') + '" d="' + P.scap + '"/></g>' +
        '<g data-r="openwing" visibility="hidden"><path fill="#15120F" d="' + P.openwing + '"/><path fill="none" stroke="#2D2926" stroke-width=".8" stroke-linecap="round" d="' + P.owlines + '"/></g>' +
        '<g data-r="head">' +
          '<path data-r="mouth" fill="#3A1317"/>' +
          '<g data-r="jaw"><path fill="' + u('j') + '" d="' + P.lower + '"/></g>' +
          '<path fill="' + u('u') + '" d="' + P.upper + '"/>' +
          '<path fill="none" stroke="#4A5361" stroke-width=".7" stroke-linecap="round" opacity=".8" d="' + P.culmen + '"/>' +
          '<circle cx="192.45" cy="93.6" r="3.15" fill="#30251D"/><circle cx="192.45" cy="93.6" r="2.4" fill="#0A0706"/>' +
          '<circle cx="193.5" cy="92.5" r=".95" fill="#FFFFFF"/><circle cx="191.5" cy="94.7" r=".4" fill="#FFFFFF" opacity=".5"/>' +
          '<ellipse data-r="lid" cx="192.45" cy="93.6" rx="3.4" ry="3.4" fill="#221D1A"/>' +
          '<g data-r="waves" visibility="hidden" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"><path d="M214 74 Q220 70.5 226 74"/><path d="M210.5 68 Q220 62.5 229.5 68"/></g>' +
        '</g>' +
      '</g>';
  }

  /* ---------- Alas abiertas: aleteo visto de lado ----------
     Bajada con el ala extendida (da el empuje); subida con el ala un poco plegada. */
  var FREQ = { celebrate: 7, power: 7.5, cruise: 6, brake: 9 };
  function wingPose(ph, mode) {
    var lo = mode === 'brake' ? -.25 : (mode === 'celebrate' ? -.65 : -1);
    var c = Math.cos(ph * 2 * Math.PI), g = (c < 0 ? -1 : 1) * (.3 + .7 * Math.pow(Math.abs(c), .8));
    var ey = (1 + lo) / 2 + (1 - lo) / 2 * g;
    var up = ph >= .5, w = Math.sin((up ? ph - .5 : ph) * 2 * Math.PI);
    return { ey: ey, sx: up ? 1 - .3 * w : 1, sw: (up ? -5 : 7) * w + 12 * (1 + ey) / 2 - 16 * (1 - ey) / 2 + (mode === 'brake' ? 10 : 0) };
  }
  function wingMatrix(Bm, ph, mode, off) {
    var p = wingPose(ph, mode), S = SHOULDER;
    var axis = mul(mul(R(ALPHA, 0, 0), [p.sx, 0, 0, 1, 0, 0]), R(-ALPHA, 0, 0));
    var m = mul(T(S[0], S[1]), mul(R(p.sw, 0, 0), mul([1, 0, 0, p.ey, 0, 0], mul(axis, T(-S[0], -S[1])))));
    return mul(off ? mul(Bm, T(off[0], off[1])) : Bm, m);
  }

  /* ---------- Trayectorias de vuelo ---------- */
  function buildPath(pts) {
    var out = [], L = [0];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (var k = 0; k < 40; k++) {
        var t = k / 40, t2 = t * t, t3 = t2 * t, q = [];
        for (var c = 0; c < 2; c++) q.push(.5 * (2 * p1[c] + (p2[c] - p0[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * t3));
        out.push(q);
      }
    }
    out.push(pts[pts.length - 1].slice());
    for (var j = 1; j < out.length; j++) L.push(L[j - 1] + Math.hypot(out[j][0] - out[j - 1][0], out[j][1] - out[j - 1][1]));
    return { p: out, L: L, total: L[L.length - 1] };
  }
  function pathAt(path, d) {
    var L = path.L, lo = 0, hi = L.length - 1;
    if (d <= 0) return path.p[0].slice();
    if (d >= path.total) return path.p[hi].slice();
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (L[mid] < d) lo = mid; else hi = mid; }
    var u = (d - L[lo]) / ((L[hi] - L[lo]) || 1);
    return [path.p[lo][0] + (path.p[hi][0] - path.p[lo][0]) * u, path.p[lo][1] + (path.p[hi][1] - path.p[lo][1]) * u];
  }
  function ease(u, a, b) {
    u = clamp(u, 0, 1);
    var v = 1 / (1 - a / 2 - b / 2);
    if (u < a) return v * u * u / (2 * a);
    if (u < 1 - b) return v * (a / 2 + (u - a));
    var w = 1 - u; return 1 - v * w * w / (2 * b);
  }

  /* ---------- Instancia ---------- */
  var list = [], uid = 0, speaking = false, listening = false;
  function Toche(host, o) {
    o = o || {};
    this.o = o; this.view = o.view || 'bust';
    var p = 'tch' + (++uid) + '-', box;
    if (host instanceof SVGElement) { box = host; this.svg = host.ownerSVGElement || host; }
    else {
      var svg = document.createElementNS(NS, 'svg'), vb = VIEWS[this.view] || VIEWS.full;
      svg.setAttribute('viewBox', vb.join(' '));
      svg.setAttribute('class', 'toche-live toche-' + this.view);
      svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
      svg.style.overflow = 'visible';
      host.innerHTML = ''; host.appendChild(svg); box = svg; this.svg = svg;
    }
    var tmp = document.createElementNS(NS, 'g'); tmp.innerHTML = markup(p);
    while (tmp.firstChild) box.appendChild(tmp.firstChild);
    this.host = box; this.r = {};
    var self = this;
    Array.prototype.forEach.call(box.querySelectorAll('[data-r]'), function (n) { self.r[n.getAttribute('data-r')] = n; });
    var f = o.facing === -1 ? -1 : 1;
    this.sp = {
      head: spring(0, 520, .5), headY: spring(0, 420, .6), lean: spring(0, 30, .9),
      down: spring(0, 260, .42), tail: spring(0, 110, .3), spread: spring(0, 160, .55), wing: spring(0, 300, .5),
      jaw: spring(0, 900, .6), facing: spring(f, 380, .9), fluff: spring(0, 200, .5),
      pitch: spring(0, 70, .8), tuck: spring(0, 60, .8), bob: spring(0, 45, .6), sleek: spring(0, 60, .9), reach: spring(0, 90, .8)
    };
    this.st = { t: rnd(0, 3), hopY: 0, hop: null, wingOpen: false, wingMode: null, wingStop: false, glide: 0, cycles: 0, flap: 0, lid: 0, blink: null, chirpUntil: 0 };
    this.next = { blink: rnd(.8, 2.4), sacc: rnd(.3, 1.2), flick: rnd(2, 5), shrug: rnd(4, 9), lean: rnd(1, 3), syl: 0, probe: rnd(6, 12) };
    this.air = { x: 0, y: 0, s: 1 }; this.fl = null; this.timers = [];
    this.visible = true; this.lastVis = -1e9; this.red = reduced();
    this.render();
    list.push(this); start();
  }
  var TP = Toche.prototype;
  TP.later = function (fn, ms) { var self = this, h = setTimeout(function () { var i = self.timers.indexOf(h); if (i >= 0) self.timers.splice(i, 1); fn(); }, ms); this.timers.push(h); return h; };
  TP.clearTimers = function () { this.timers.forEach(clearTimeout); this.timers = []; };
  TP.checkVis = function () {
    var el = this.svg;
    if (!el.isConnected) return false;
    var r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.right < 0 || r.top > window.innerHeight || r.left > window.innerWidth) return false;
    var cs = window.getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  TP.isTalking = function () { return (speaking && this.o.talks !== false) || this.st.t < this.st.chirpUntil; };

  /* Comportamiento en reposo: parpadeo, cabeza a saltos, sondeo con el pico, cola, plumas. */
  TP.idle = function () {
    var t = this.st.t, sp = this.sp, n = this.next, bust = this.view === 'bust', busy = !!this.fl || this.st.hop;
    if (t > n.blink) { this.blink(); if (Math.random() < .18) { var self = this; this.later(function () { self.blink(); }, 260); } n.blink = t + rnd(2.2, 5.5); }
    var talking = this.isTalking();
    if (talking && t > n.syl) { sp.jaw.t = Math.random() < .28 ? 0 : rnd(8, 19); sp.headY.t = rnd(-1.2, 1.2); n.syl = t + rnd(.06, .12); }
    if (!talking) { sp.jaw.t = 0; if (!busy) sp.headY.t = 0; }
    if (this.red || busy) return;
    if (listening) { if (t > n.sacc) { sp.head.t = -13 + rnd(-3, 3); n.sacc = t + rnd(.9, 1.8); } return; }
    if (t > n.sacc) {
      var r = Math.random(), base = talking ? -5 : 0;
      sp.head.t = base + (bust ? rnd(-8, 6) : (r < .1 ? rnd(-20, -14) : (r < .2 && !talking ? rnd(12, 18) : rnd(-9, 7))));
      n.sacc = t + (talking ? rnd(.25, .6) : rnd(.6, 2.2));
    }
    if (bust) return;
    if (!talking && t > n.probe) { this.probe(); n.probe = t + rnd(10, 18); n.sacc = t + 1.4; }
    if (t > n.flick) { sp.tail.v -= rnd(220, 380); sp.spread.v += rnd(60, 120); n.flick = t + rnd(2.5, 6); }
    if (t > n.shrug) { sp.wing.v += rnd(80, 140); sp.fluff.v += 1.6; n.shrug = t + rnd(5, 10); }
    if (t > n.lean) { sp.lean.t = rnd(-4, 3); n.lean = t + rnd(3, 7); }
  };
  TP.blink = function () { this.st.blink = { t0: this.st.t, d: .16 }; };
  TP.probe = function () {
    var sp = this.sp, self = this;
    sp.lean.t = 7; sp.head.t = 22;
    this.later(function () { if (!self.fl) sp.head.t = 9; }, 170);
    this.later(function () { if (!self.fl) sp.head.t = 25; }, 330);
    this.later(function () { if (!self.fl) { sp.head.t = 0; sp.lean.t = 0; } }, 560);
  };
  TP.hop = function (height, dur, onLand) {
    this.st.hop = { h: height, d: dur, t0: this.st.t, onLand: onLand };
    this.sp.down.t = 0; this.sp.tail.v += 260; this.sp.spread.v += 80;
  };
  TP.startFlap = function (mode) { var st = this.st; st.wingMode = mode; st.wingStop = false; st.glide = 0; if (!st.wingOpen) { st.wingOpen = true; st.flap = Math.floor(st.flap) + .74; } };
  TP.stopFlap = function () { var st = this.st; if (st.wingOpen) st.wingStop = true; else { st.wingMode = null; st.glide = 0; } };

  /* Acciones */
  TP.chirp = function (ms) { this.st.chirpUntil = Math.max(this.st.chirpUntil, this.st.t + (ms || 1200) / 1000); };
  TP.celebrate = function (done) {
    var sp = this.sp, self = this;
    if (this.fl) return;
    this.chirp(900);
    if (this.red) { if (done) this.later(done, 400); return; }
    if (this.view === 'bust') { this.hop(5, .3, function () { self.hop(3, .24, done); }); return; }
    sp.down.t = 5; sp.head.t = -10;
    this.later(function () {
      self.startFlap('celebrate'); sp.spread.t = 10;
      self.hop(26, .44, function () {
        sp.down.t = 0;
        self.later(function () {
          self.hop(12, .3, function () {
            self.stopFlap(); sp.spread.t = 0; sp.head.t = 4;
            self.later(function () { sp.fluff.v += 2.2; sp.wing.v += 160; sp.head.t = 0; if (done) done(); }, 260);
          });
        }, 130);
      });
    }, 130);
  };
  /* Volar hasta la percha desde fuera de la zona visible. from: 1 = entra por la derecha, -1 = por la izquierda. */
  TP.localBox = function (boundsEl) {
    var m = this.host.getScreenCTM && this.host.getScreenCTM();
    if (!m) return null;
    var inv = m.inverse(), r = boundsEl ? boundsEl.getBoundingClientRect() : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
    var a = ap([inv.a, inv.b, inv.c, inv.d, inv.e, inv.f], [r.left, r.top]), b = ap([inv.a, inv.b, inv.c, inv.d, inv.e, inv.f], [r.right, r.bottom]);
    return { x0: Math.min(a[0], b[0]), x1: Math.max(a[0], b[0]), y0: Math.min(a[1], b[1]), y1: Math.max(a[1], b[1]) };
  };
  TP.flyIn = function (o) {
    o = o || {};
    var side = o.from === -1 ? -1 : 1, sp = this.sp;
    this.reset();
    if (this.red) { if (o.then) o.then(); return; }
    var b = this.localBox(o.bounds) || { x0: -150, x1: 390, y0: -150, y1: 350 }, cx = C[0], cy = C[1];
    var sx = (side > 0 ? b.x1 + 80 : b.x0 - 80) - cx, sy = Math.max(b.y0 + 12, cy - 150) - cy;
    var path = buildPath([[sx, sy], [sx * .45, Math.min(-46, sy * .5)], [58 * side, 6], [22 * side, 9], [0, 0]]);
    this.fl = { t: 0, t0: 0, path: path, T: clamp(path.total / 120, 1.4, 2.6), mode: '', then: o.then, px: sx, py: sy, kind: 'in' };
    this.air.x = sx; this.air.y = sy; this.air.s = .72;
    sp.facing.t = sp.facing.x = -side;
    this.startFlap('cruise'); this.st.flap = .1;
    sp.tuck.t = sp.tuck.x = 1; sp.sleek.t = sp.sleek.x = 1; sp.reach.t = sp.reach.x = 2.4; sp.tail.t = sp.tail.x = -22; sp.head.t = -6;
  };
  TP.flyStep = function (dt) {
    var f = this.fl, sp = this.sp, air = this.air;
    f.t += dt;
    var u = (f.t - f.t0) / f.T, e = ease(u, .06, .3), p = pathAt(f.path, e * f.path.total);
    var vx = (p[0] - f.px) / Math.max(dt, .001), vy = (p[1] - f.py) / Math.max(dt, .001);
    f.px = p[0]; f.py = p[1];
    air.x = p[0]; air.y = p[1] + sp.bob.x;
    air.s = 1 - .28 * Math.pow(1 - e, 1.4);
    if (vx > 18) sp.facing.t = 1; else if (vx < -18) sp.facing.t = -1;
    if (u < .72) sp.pitch.t = clamp(Math.atan2(vy, Math.abs(vx) + 30) * 57.3 * .55, -22, 16);
    else if (f.mode !== 'land') { f.mode = 'land'; this.startFlap('brake'); sp.tuck.t = -1; sp.spread.t = 10; sp.tail.t = -4; sp.pitch.t = -24; sp.head.t = -10; sp.sleek.t = .3; sp.reach.t = .8; }
    if (u >= 1) this.touchDown();
  };
  TP.touchDown = function () {
    var sp = this.sp, then = this.fl.then, self = this;
    this.fl = null; this.air.x = 0; this.air.y = 0; this.air.s = 1;
    this.stopFlap(); sp.bob.t = 0; sp.tuck.t = 0; sp.pitch.t = 0; sp.sleek.t = 0; sp.reach.t = 0; sp.down.v += 110;
    sp.tail.t = 0; sp.tail.v -= 300; sp.spread.t = 0; sp.fluff.v += 1.6; sp.head.t = 4;
    this.later(function () { sp.wing.v += 160; sp.head.t = 0; }, 280);
    if (then) this.later(then, 420);
  };
  /* Volver al reposo de inmediato (por ejemplo, si se cierra la pantalla en pleno vuelo). */
  TP.reset = function () {
    var sp = this.sp;
    this.clearTimers(); this.fl = null; this.st.hop = null; this.st.hopY = 0;
    this.st.wingOpen = false; this.st.wingMode = null; this.st.wingStop = false; this.st.glide = 0;
    this.air.x = 0; this.air.y = 0; this.air.s = 1;
    ['head', 'headY', 'lean', 'down', 'tail', 'spread', 'wing', 'jaw', 'fluff', 'pitch', 'tuck', 'bob', 'sleek', 'reach'].forEach(function (k) { sp[k].x = sp[k].t = 0; sp[k].v = 0; });
    sp.facing.x = sp.facing.t = this.o.facing === -1 ? -1 : 1; sp.facing.v = 0;
    this.render();
  };
  TP.destroy = function () {
    this.clearTimers();
    var i = list.indexOf(this); if (i >= 0) list.splice(i, 1);
    if (this.svg !== this.host) { if (this.svg.parentNode) this.svg.parentNode.removeChild(this.svg); }
    else while (this.host.firstChild) this.host.removeChild(this.host.firstChild);
  };

  /* Un cuadro de animación */
  TP.update = function (dt) {
    var st = this.st, sp = this.sp;
    st.t += dt; this.red = reduced();
    this.idle();
    if (st.blink) { var u = (st.t - st.blink.t0) / st.blink.d; if (u >= 1) { st.lid = 0; st.blink = null; } else st.lid = Math.sin(Math.PI * u); }
    if (st.hop) {
      var hp = st.hop, k = (st.t - hp.t0) / hp.d;
      if (k >= 1) { st.hopY = 0; st.hop = null; sp.down.v += 90; sp.tail.v -= 360; sp.fluff.v += 1.2; if (hp.onLand) hp.onLand(); }
      else st.hopY = -hp.h * 4 * k * (1 - k);
    }
    if (st.wingOpen) {
      var prev = st.flap % 1;
      st.flap += dt * (FREQ[st.wingMode] || 7);
      var ph = st.flap % 1;
      if (st.wingStop && ph > .66 && ph < .86) { st.wingOpen = false; st.wingStop = false; st.wingMode = null; }
      else if (st.wingMode === 'cruise' && prev < .75 && ph >= .75 && ++st.cycles >= 3 + (st.t * 7 % 2 | 0)) { st.cycles = 0; st.wingOpen = false; st.glide = rnd(.18, .28); }
    } else if (st.glide > 0) {
      st.glide -= dt;
      if (st.glide <= 0) { st.glide = 0; if (st.wingMode) { st.wingOpen = true; st.flap = Math.floor(st.flap) + .75; } }
    }
    sp.bob.t = this.fl && this.fl.mode !== 'land' ? (st.glide > 0 ? 4 : -1.6) : 0;
    if (this.fl) this.flyStep(dt);
    for (var key in sp) stepS(sp[key], dt);
    this.render();
  };
  TP.render = function () {
    var sp = this.sp, st = this.st, air = this.air, r = this.r;
    var breath = this.red ? 0 : Math.sin(st.t * Math.PI * 2 * .42), fl = sp.fluff.x;
    var root = mul(mul(mul(T(air.x, air.y + st.hopY), Sc(air.s, air.s, C[0], C[1])), Sc(sp.facing.x, 1, FX, 0)), R(sp.pitch.x, C[0], C[1]));
    var B0 = mul(mul(T(0, sp.down.x), R(sp.lean.x, HIP[0], HIP[1])), Sc(1 + .010 * breath + fl * .03, 1 + .018 * breath + fl * .035, HIP[0], HIP[1]));
    var sl = sp.sleek.x, B = mul(B0, Sc(1 + .05 * sl, 1 - .12 * sl, C[0], C[1]));
    var TL = mul(B, R(sp.tail.x, TAILB[0], TAILB[1]));
    var H = mul(B0, mul(T(sp.reach.x, sp.headY.x + 2.6 * sl), R(sp.head.x, NECK[0], NECK[1])));
    var W = mul(B, R(sp.wing.x, SHOULDER[0], SHOULDER[1]));
    var OW = wingMatrix(B, st.flap % 1, st.wingMode, null), FW = wingMatrix(B, (st.flap + .03) % 1, st.wingMode, [4, -2.5]);
    var rs = str(root), bs = str(B), hs = str(H);
    r.back.setAttribute('transform', rs); r.front.setAttribute('transform', rs);
    r.tail.setAttribute('transform', str(TL));
    var spr = 1 + Math.max(-1, sp.spread.x);
    for (var q = 0; q < 5; q++) r['f' + (q + 1)].setAttribute('transform', 'translate(' + TAILB[0] + ' ' + TAILB[1] + ') rotate(' + (TAILANG + (q / 2 - 1) * spr).toFixed(2) + ')');
    var sil = skin(SIL, B, H);
    r.sil.setAttribute('d', sil); r.clip.setAttribute('d', sil);
    r.mask.setAttribute('d', skin(MASK, B, H));
    r.bodyfx.setAttribute('transform', bs); r.scap.setAttribute('transform', bs); r.flank.setAttribute('transform', bs);
    r.headfx.setAttribute('transform', hs); r.head.setAttribute('transform', hs);
    var ja = Math.max(0, sp.jaw.x);
    r.jaw.setAttribute('transform', 'rotate(' + ja.toFixed(2) + ' ' + JAW[0] + ' ' + JAW[1] + ')');
    if (ja > .4) {
      var mo = ap(R(ja + 1.5, JAW[0], JAW[1]), MOUTH);
      r.mouth.setAttribute('d', 'M' + JAW[0] + ' ' + JAW[1] + ' L' + MOUTH[0] + ' ' + MOUTH[1] + ' L' + mo[0].toFixed(2) + ' ' + mo[1].toFixed(2) + ' Z');
    } else r.mouth.setAttribute('d', '');
    r.lid.setAttribute('transform', str(Sc(1, Math.max(0, st.lid), LID[0], LID[1])));
    r.wing.setAttribute('transform', str(W));
    r.openwing.setAttribute('transform', str(OW)); r.farwing.setAttribute('transform', str(FW));
    r.wing.setAttribute('visibility', st.wingOpen ? 'hidden' : 'visible');
    r.openwing.setAttribute('visibility', st.wingOpen ? 'visible' : 'hidden');
    r.farwing.setAttribute('visibility', st.wingOpen ? 'visible' : 'hidden');
    r.waves.setAttribute('visibility', listening && !this.fl && this.view !== 'bust' ? 'visible' : 'hidden');
    var tk = sp.tuck.x, ts = 1 - .55 * clamp(tk, 0, 1);
    for (var i = 0; i < 2; i++) {
      var h = ap(B, HIPS[i]), f0 = FEET[i], f;
      if (tk >= 0) { var ft = ap(B, [HIPS[i][0] - 4.5, HIPS[i][1] + 3.5]), a1 = Math.min(1, tk); f = [f0[0] + (ft[0] - f0[0]) * a1, f0[1] + (ft[1] - f0[1]) * a1]; }
      else { var fe = ap(B, [HIPS[i][0] + 7, HIPS[i][1] + 13]), a2 = Math.min(1, -tk); f = [f0[0] + (fe[0] - f0[0]) * a2, f0[1] + (fe[1] - f0[1]) * a2]; }
      var bend = 2.5 + Math.max(0, sp.down.x) * .6;
      var cx = (h[0] + f[0]) / 2 - bend * .6 * ts, cy = (h[1] + f[1]) / 2;
      var F = f[0].toFixed(2) + ' ' + f[1].toFixed(2);
      var o = function (dx, dy) { return (f[0] + dx * ts).toFixed(2) + ' ' + (f[1] + dy * ts).toFixed(2); };
      r['leg' + (i + 1)].setAttribute('d', 'M' + h[0].toFixed(1) + ' ' + h[1].toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + F);
      r['toes' + (i + 1)].setAttribute('d', 'M' + F + ' C' + o(3, -1.2) + ' ' + o(6.5, -.4) + ' ' + o(8, 2.6) + ' M' + F + ' C' + o(2.5, .8) + ' ' + o(4.5, 2.6) + ' ' + o(5, 5) + ' M' + F + ' C' + o(-3, -.6) + ' ' + o(-6, 1) + ' ' + o(-6.5, 4));
    }
  };

  /* ---------- Bucle compartido: solo se animan los Toches que se ven ---------- */
  var running = false, last = 0;
  function start() { if (!running) { running = true; last = 0; requestAnimationFrame(loop); } }
  function loop(now) {
    if (!list.length) { running = false; return; }
    var dt = last ? Math.min(1 / 30, (now - last) / 1000) : 1 / 60; last = now;
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      if (now - t.lastVis > 300) { t.visible = t.checkVis(); t.lastVis = now; }
      if (t.visible || t.fl) t.update(dt);
    }
    requestAnimationFrame(loop);
  }

  /* ---------- API ---------- */
  function mount(host, o) {
    if (!host) return null;
    if (host.__toche) host.__toche.destroy();
    var t = new Toche(host, o);
    host.__toche = t;
    return t;
  }
  function mountAll(root) {
    var out = [];
    Array.prototype.forEach.call((root || document).querySelectorAll('[data-toche]'), function (el) {
      if (el.__toche) { out.push(el.__toche); return; }
      out.push(mount(el, { view: el.getAttribute('data-toche') || 'bust', facing: el.getAttribute('data-facing') === '-1' ? -1 : 1 }));
    });
    return out;
  }
  return {
    mount: mount, mountAll: mountAll,
    setSpeaking: function (on) { speaking = !!on; },
    setListening: function (on) { listening = !!on; },
    all: function () { return list.slice(); }
  };
})();
