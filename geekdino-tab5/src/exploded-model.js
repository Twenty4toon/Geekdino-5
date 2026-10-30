/**
 * WorkTab3D — CSS 3D exploded tablet model
 * Ported from "WorkTab V – 360° exploded view" and exposed as a
 * scroll-drivable module for the GEEKDINO TAB 5 cinematic site.
 *
 * API: window.WorkTab3D
 */
(function () {
  'use strict';

  var W = 326, H = 500, D = 30;
  var FACE_BASE = 'assets/tablet-3d/';
  var FACE_KEYS = ['front', 'back', 'right', 'left', 'top', 'bottom'];

  var PARTS = [
    { id: 'cpu', n: 'Processor', s: 'Octa-core: 2× Cortex A76 2.2 GHz + 6× Cortex A55 2.0 GHz', c: '#ff8a4c' },
    { id: 'ram', n: 'RAM', s: '8 GB', c: '#ef476f' },
    { id: 'sto', n: 'Storage', s: '128 GB, plus T-Flash card up to 512 GB', c: '#e8b923' },
    { id: 'lte', n: '4G LTE', s: '4G LTE, Wi-Fi, Bluetooth 5.2, Nano SIM slot', c: '#b25cf0' },
    { id: 'bat', n: 'Battery', s: '7100 mAh polymer battery', c: '#3fb36b' },
    { id: 'cam', n: 'Camera', s: '13 MP autofocus rear, 5 MP fixed-focus front', c: '#1fb5d8' },
    { id: 'dsp', n: 'Display', s: '8.4 in IPS, 1200 × 1920, 350 cd/m²', c: '#5b8def' },
    { id: 'os', n: 'Operating system', s: 'Android 17', c: '#7cc43a' }
  ];

  var VIEWS = {
    Front: [0, 0], Back: [0, 180], Left: [0, 90], Right: [0, -90],
    Top: [-90, 0], Bottom: [90, 0], Angled: [-16, -38]
  };

  var IMG = {};
  FACE_KEYS.forEach(function (k) { IMG[k] = FACE_BASE + k + '.webp'; });

  var by = {};
  PARTS.forEach(function (p) { p.els = []; by[p.id] = p; });

  /* ---------- state ---------- */
  var e = 0, eT = 0;              // explode current / target (0..1)
  var rx = -16, ry = -38;         // rotation current
  var trx = rx, tyy = ry;         // rotation target
  var zoom = 1, tz = 1;
  var auto = false, drag = false;
  var lx = 0, ly = 0;
  var sel = null;
  var labelsOn = 0, labelsOnT = 0; // label visibility 0..1
  var running = false;
  var rafId = 0;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- dom ---------- */
  var stage, scene, svg, lab, rootEl;
  var L = [];                      // layout entries {e,z0,z1,flip}
  var sides = [];
  var dspMain = null;
  var lastW = 0;
  var ns = 'http://www.w3.org/2000/svg';

  function face(g, o, w, h, t, css, html, vis) {
    var el = document.createElement('div');
    el.className = 'f p' + (vis ? ' dbl' : '');
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.style.left = (-w / 2) + 'px';
    el.style.top = (-h / 2) + 'px';
    el.style.transform = t;
    if (css) el.style.cssText += css;
    if (html) el.innerHTML = html;
    if (o.part) {
      el.style.setProperty('--c', by[o.part].c);
      by[o.part].els.push(el);
    }
    g.appendChild(el);
    return el;
  }

  function sideFace(id, w, h, t) {
    var el = document.createElement('div');
    el.className = 'f side';
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.style.left = -w / 2 + 'px';
    el.style.top = -h / 2 + 'px';
    el.style.backgroundImage = 'url(' + IMG[id] + ')';
    el.style.transform = t;
    scene.appendChild(el);
    sides.push(el);
    return el;
  }

  function mk(o) {
    var g = document.createElement('div');
    g.className = 'g';
    g.style.left = o.x + 'px';
    g.style.top = o.y + 'px';
    var d = o.d || 4, w = o.w, h = o.h, sc_ = o.sc || '#1a2236', r = o.r || 0;
    g.main = face(g, o, w, h, 'translateZ(' + d / 2 + 'px)', o.css, o.html);
    face(g, o, w, h, 'rotateY(180deg) translateZ(' + d / 2 + 'px)', 'background:' + (o.bk || sc_) + ';border-radius:' + r + 'px');
    var sd = 'background:' + sc_;
    face(g, o, w, d, 'rotateX(90deg) translateZ(' + h / 2 + 'px)', sd);
    face(g, o, w, d, 'rotateX(-90deg) translateZ(' + h / 2 + 'px)', sd);
    face(g, o, d, h, 'rotateY(90deg) translateZ(' + w / 2 + 'px)', sd);
    face(g, o, d, h, 'rotateY(-90deg) translateZ(' + w / 2 + 'px)', sd);
    scene.appendChild(g);
    L.push({ e: g, z0: o.z0, z1: o.z1, flip: o.flip });
    anc(o);
    return g;
  }

  function cyl(o) {
    var g = document.createElement('div');
    g.className = 'g';
    g.style.left = o.x + 'px';
    g.style.top = o.y + 'px';
    var n = Math.max(2, Math.round(o.d / 2));
    for (var i = 0; i < n; i++) {
      var top = i === n - 1, rr = o.r;
      var css = 'border-radius:50%;background:' + (top ? o.top : o.body) + ';' + (top ? 'border:2px solid var(--c)' : '');
      face(g, o, rr * 2, rr * 2, 'translateZ(' + (-i * o.d / n) + 'px)', css, '', 1);
    }
    scene.appendChild(g);
    L.push({ e: g, z0: o.z0, z1: o.z1 });
    anc(o);
    return g;
  }

  function anc(o) {
    var p = o.part && by[o.part];
    if (p && !p.a) {
      p.a = { x: o.ax !== undefined ? o.ax : o.x, y: o.ay !== undefined ? o.ay : o.y, L: L[L.length - 1] };
    }
  }

  function chip(part, w, h, x, y, z1, txt, d) {
    mk({
      part: part, w: w, h: h, x: x, y: y, d: d, r: 3, z0: -1, z1: z1,
      sc: '#2a3350',
      css: 'border-radius:3px;border:2px solid var(--c);background:linear-gradient(#141c30,#0b1220)',
      html: '<div class="t" style="width:100%;height:100%">' + txt + '</div>'
    });
  }

  function build() {
    // outer side walls of the closed shell
    sideFace('right', D, H, 'rotateY(90deg) translateZ(' + W / 2 + 'px)');
    sideFace('left', D, H, 'rotateY(-90deg) translateZ(' + W / 2 + 'px)');
    sideFace('top', W, D, 'rotateX(90deg) translateZ(' + H / 2 + 'px) scaleX(-1)');
    sideFace('bottom', W, D, 'rotateX(-90deg) translateZ(' + H / 2 + 'px)');

    // back cover (faces back) + display (faces front)
    mk({ w: W, h: H, x: 0, y: 0, d: 3, z0: -D / 2 + 1.5, z1: -225, flip: 1, sc: '#1c2a4d', bk: '#101828', css: 'background-image:url(' + IMG.back + ')' });
    dspMain = mk({ part: 'dsp', ax: W / 2 - 4, ay: 130, w: W, h: H, x: 0, y: 0, d: 8, z0: D / 2 - 4, z1: 95, sc: '#171a22', bk: '#0d0f14', css: 'background-image:url(' + IMG.front + ')' });

    // camera
    var lens = 'radial-gradient(circle,#0b1a2e 0 28%,#1fb5d8 30% 36%,#10213a 38% 62%,#2a3b5a 64% 100%)';
    cyl({ part: 'cam', r: 28, d: 14, x: 98, y: -205, z0: -8, z1: -170, body: '#1a2742', top: lens });
    cyl({ part: 'cam', r: 6, d: 5, x: 0, y: -237, z0: 8, z1: 40, body: '#1a2742', top: lens });

    // battery
    mk({
      part: 'bat', w: 272, h: 235, x: 0, y: 108, d: 14, r: 6, z0: -7, z1: -125,
      sc: '#1f4a33', bk: '#12261c',
      css: 'border-radius:6px;border:2px solid var(--c);background:linear-gradient(90deg,transparent calc(50% - 1px),rgba(63,179,107,.5) 0 calc(50% + 1px),transparent 0),linear-gradient(#1b3a2a,#12261c)',
      html: '<div class="t" style="width:100%;height:100%;font-size:18px">7100 mAh<br>polymer battery</div>'
    });

    // mainboard
    mk({
      w: 288, h: 140, x: 0, y: -170, d: 4, r: 6, z0: -4, z1: -75,
      sc: '#2f6b5e', bk: '#0c2622',
      css: 'border-radius:6px;border:2px solid #2f6b5e;background:repeating-linear-gradient(0deg,transparent 0 9px,rgba(120,220,190,.12) 9px 10px),linear-gradient(#10352f,#0c2622)'
    });

    // chips
    chip('cpu', 58, 58, -78, -175, -30, 'CPU<br>8-core', 12);
    chip('ram', 46, 34, -5, -205, -44, 'RAM<br>8GB', 8);
    chip('sto', 46, 34, 60, -180, -52, 'ROM<br>128GB', 7);
    chip('lte', 50, 30, -5, -140, -36, '4G LTE', 6);

    // OS glass slab
    var dots = '';
    for (var i = 0; i < 12; i++) {
      dots += '<span style="width:30px;height:30px;border-radius:9px;background:var(--c);opacity:.55"></span>';
    }
    mk({
      part: 'os', ax: 150, ay: 190, w: 300, h: 462, x: 0, y: 0, d: 3, r: 16, z0: D / 2 - 5, z1: 185,
      sc: '#4d7a28', bk: 'rgba(124,196,58,.16)',
      css: 'border-radius:16px;border:2px solid var(--c);background:rgba(124,196,58,.16)',
      html: '<div style="display:grid;grid-template-columns:repeat(4,30px);gap:20px 22px;justify-content:center;padding-top:44px">' + dots + '</div>' +
        '<div class="t" style="position:absolute;left:0;right:0;bottom:46px;font-size:22px;letter-spacing:.5px">Android 17</div>'
    });

    // labels + connector lines
    PARTS.forEach(function (p) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'w3d-lab';
      d.style.setProperty('--c', p.c);
      d.innerHTML = '<b>' + p.n + '</b><small>' + p.s + '</small>';
      d.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); });
      d.addEventListener('click', function (ev) {
        ev.stopPropagation();
        api.selectPart(sel === p.id ? null : p.id);
        if (sel && eT < 0.5) { api.setExplode(1); }
      });
      lab.appendChild(d);
      p.lb = d;

      p.ln = document.createElementNS(ns, 'line');
      p.ln.setAttribute('stroke', p.c);
      p.ln.setAttribute('stroke-width', '1.5');
      p.ln.setAttribute('stroke-linecap', 'round');
      svg.appendChild(p.ln);

      p.dt = document.createElementNS(ns, 'circle');
      p.dt.setAttribute('r', '4');
      p.dt.setAttribute('fill', p.c);
      svg.appendChild(p.dt);
    });
  }

  /* ---------- label placement (two-column, collision-avoided) ---------- */
  function place(k) {
    var cw = stage.clientWidth, ch = stage.clientHeight, cx = cw / 2, cy = ch / 2;
    var P = 1800, R = Math.PI / 180;
    var cr = Math.cos(ry * R), sr = Math.sin(ry * R);
    var cX = Math.cos(rx * R), sX = Math.sin(rx * R);
    var lw = cw < 700 ? 118 : 210;
    var vis = labelsOn * Math.min(1, e * 4);
    if (cw !== lastW) {
      lastW = cw;
      PARTS.forEach(function (p) { p.lb.style.width = lw + 'px'; p.h = p.lb.offsetHeight; });
    }
    var cols = [[], []];
    PARTS.forEach(function (p) {
      if (!p.a) return;
      var a = p.a, z = a.L.z0 + (a.L.z1 - a.L.z0) * e;
      var x1 = a.x * cr + z * sr, z1 = -a.x * sr + z * cr;
      var y2 = a.y * cX - z1 * sX, z2 = a.y * sX + z1 * cX;
      var f = P / (P - z2 * k);
      p.sx = cx + x1 * k * f;
      p.sy = cy + y2 * k * f;
      cols[p.sx < cx ? 0 : 1].push(p);
    });
    cols.forEach(function (c, i) {
      c.sort(function (a, b) { return a.sy - b.sy; });
      var prev = -1e9;
      c.forEach(function (p) {
        p.ly = Math.max(8, p.sy - p.h / 2, prev + 6);
        prev = p.ly + p.h;
      });
      var lim = ch - 8;
      for (var j = c.length - 1; j >= 0; j--) {
        var p = c[j];
        if (p.ly + p.h > lim) p.ly = lim - p.h;
        lim = p.ly - 6;
      }
      c.forEach(function (p) {
        var lxx = i ? cw - lw - 10 : 10;
        var ex_ = i ? lxx : lxx + lw;
        p.lb.style.transform = 'translate(' + lxx + 'px,' + p.ly + 'px)';
        p.lb.style.opacity = vis;
        p.lb.style.pointerEvents = vis > 0.5 ? 'auto' : 'none';
        p.ln.setAttribute('x1', p.sx);
        p.ln.setAttribute('y1', p.sy);
        p.ln.setAttribute('x2', ex_);
        p.ln.setAttribute('y2', p.ly + p.h / 2);
        p.ln.style.opacity = vis * 0.8;
        p.dt.setAttribute('cx', p.sx);
        p.dt.setAttribute('cy', p.sy);
        p.dt.style.opacity = vis;
      });
    });
  }

  /* ---------- render loop ---------- */
  function fit() {
    var lw = stage.clientWidth < 700 ? 118 : 210;
    return Math.max(0.22, Math.min(stage.clientHeight * 0.7 / H, (stage.clientWidth - 2 * lw - 30) / W));
  }

  function frame() {
    if (!running) return;
    if (auto && !drag) { tyy += 0.35; ry = tyy; }
    else if (!drag) { ry += (tyy - ry) * 0.12; rx += (trx - rx) * 0.12; }
    e += (eT - e) * 0.12;
    if (Math.abs(eT - e) < 0.002) e = eT;
    labelsOn += (labelsOnT - labelsOn) * 0.12;
    zoom += (tz - zoom) * 0.15;

    for (var i = 0; i < L.length; i++) {
      var o = L[i], z = o.z0 + (o.z1 - o.z0) * e;
      o.e.style.transform = o.flip ? 'rotateY(180deg) translateZ(' + (-z) + 'px)' : 'translateZ(' + z + 'px)';
    }
    if (dspMain) dspMain.main.style.setProperty('--o', 1 - 0.12 * e);
    var so = Math.max(0, 1 - e * 10);
    for (var j = 0; j < sides.length; j++) sides[j].style.opacity = so;

    var kk = fit() * zoom;
    scene.style.transform = 'scale(' + kk + ') rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
    place(kk);
    rafId = requestAnimationFrame(frame);
  }

  /* ---------- interaction ---------- */
  function bindPointer() {
    stage.addEventListener('pointerdown', function (ev) {
      if (!stage.classList.contains('is-interactive')) return;
      drag = true; auto = false; api.syncSpin && api.syncSpin();
      lx = ev.clientX; ly = ev.clientY;
      stage.classList.add('drag');
      try { stage.setPointerCapture(ev.pointerId); } catch (err) {}
    });
    stage.addEventListener('pointermove', function (ev) {
      if (!drag) return;
      var dx = ev.clientX - lx, dy = ev.clientY - ly;
      lx = ev.clientX; ly = ev.clientY;
      ry += dx * 0.5;
      rx = Math.max(-90, Math.min(90, rx - dy * 0.5));
      tyy = ry; trx = rx;
    });
    function up() { drag = false; stage.classList.remove('drag'); }
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);
    stage.addEventListener('wheel', function (ev) {
      if (!stage.classList.contains('is-interactive')) return;
      ev.preventDefault();
      tz = Math.max(0.4, Math.min(2, tz * (ev.deltaY < 0 ? 1.08 : 0.92)));
    }, { passive: false });
  }

  /* ---------- public api ---------- */
  var api = {
    PARTS: PARTS,
    VIEWS: VIEWS,

    init: function (opts) {
      opts = opts || {};
      stage = document.getElementById(opts.stageId || 'modelStage');
      scene = document.getElementById(opts.sceneId || 'scene3d');
      svg = document.getElementById(opts.svgId || 'ln3d');
      lab = document.getElementById(opts.labelsId || 'labels3d');
      if (!stage || !scene || !svg || !lab) return false;
      rootEl = scene.parentNode;
      build();
      bindPointer();
      running = true;
      frame();
      return true;
    },

    setExplode: function (v, instant) {
      eT = Math.max(0, Math.min(1, v));
      if (instant) e = eT;
    },
    getExplode: function () { return eT; },

    setRotation: function (x, y, instant) {
      if (x !== undefined && x !== null) trx = x;
      if (y !== undefined && y !== null) {
        tyy = Math.round((tyy - y) / 360) * 360 + y;
      }
      if (instant) { rx = trx; ry = tyy; }
    },
    nudgeRotation: function (dx, dy) {
      if (dx) { tyy += dx; ry = tyy; }
      if (dy) { trx = Math.max(-90, Math.min(90, trx + dy)); rx = trx; }
    },
    getRotation: function () { return { rx: rx, ry: ry }; },

    setZoom: function (z, instant) {
      tz = Math.max(0.4, Math.min(2, z));
      if (instant) zoom = tz;
    },

    setAutoRotate: function (on) {
      auto = !!on && !reduceMotion;
      if (auto) trx = rx;
    },
    toggleAutoRotate: function () { api.setAutoRotate(!auto); return auto; },
    isAuto: function () { return auto; },

    selectPart: function (id) {
      sel = id || null;
      scene.parentNode.classList.toggle('has-sel', !!sel);
      PARTS.forEach(function (p) {
        var on = p.id === sel;
        p.els.forEach(function (el) { el.classList.toggle('sel', on); });
        p.lb.classList.toggle('on', on);
      });
    },
    getSelected: function () { return sel; },

    setLabelsVisible: function (on) { labelsOnT = on ? 1 : 0; if (!on) labelsOn = 0; },

    setInteractive: function (on) {
      stage.classList.toggle('is-interactive', !!on);
    },

    setOpacity: function (o) { stage.style.opacity = o; },

    setShift: function (px) {
      rootEl.style.transform = 'translateX(' + px + 'px)';
    },

    setView: function (name) {
      var v = VIEWS[name];
      if (!v) return;
      api.setAutoRotate(false);
      trx = v[0];
      tyy = Math.round((tyy - v[1]) / 360) * 360 + v[1];
    },

    destroy: function () {
      running = false;
      cancelAnimationFrame(rafId);
    },

    reduceMotion: reduceMotion
  };

  window.WorkTab3D = api;
})();
