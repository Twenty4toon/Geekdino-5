/**
 * WorkTabCube — CSS 3D tablet from "WorkTab V – 360° view (updated).html"
 * Six photographed faces, sized and placed as a closed box.
 * GSAP / ScrollTrigger tween #tabletScene (rotationX / rotationY).
 */
(function () {
  'use strict';

  var W = 326;
  var H = 500;
  var D = 30;
  var BASE = 'assets/tablet-3d/';

  var FACES = {
    front:  { w: W, h: H, t: 'translateZ(' + (D / 2) + 'px)' },
    back:   { w: W, h: H, t: 'rotateY(180deg) translateZ(' + (D / 2) + 'px)' },
    right:  { w: D, h: H, t: 'rotateY(90deg) translateZ(' + (W / 2) + 'px)' },
    left:   { w: D, h: H, t: 'rotateY(-90deg) translateZ(' + (W / 2) + 'px)' },
    top:    { w: W, h: D, t: 'rotateX(90deg) translateZ(' + (H / 2) + 'px) scaleX(-1)' },
    bottom: { w: W, h: D, t: 'rotateX(-90deg) translateZ(' + (H / 2) + 'px)' }
  };

  var scene = null;
  var master = null;

  function placeFaces(root) {
    Object.keys(FACES).forEach(function (id) {
      var spec = FACES[id];
      var el = root.querySelector('[data-face="' + id + '"]');
      if (!el) return;
      el.style.width = spec.w + 'px';
      el.style.height = spec.h + 'px';
      el.style.left = (-spec.w / 2) + 'px';
      el.style.top = (-spec.h / 2) + 'px';
      el.style.backgroundImage = 'url("' + BASE + id + '.webp")';
      el.style.transform = spec.t;
    });
  }

  function fit() {
    var vh = window.innerHeight || 800;
    var vw = window.innerWidth || 1200;
    var cap = vw < 700 ? 0.9 : 1.02;
    return Math.min(vh * 0.4 / H, vw * (vw < 700 ? 0.5 : 0.3) / W, cap);
  }

  function applyFit() {
    if (!master) return;
    master.style.setProperty('--cube-scale', String(fit()));
  }

  var api = {
    W: W,
    H: H,
    D: D,
    fit: fit,
    init: function (opts) {
      opts = opts || {};
      scene = document.getElementById(opts.sceneId || 'tabletScene');
      master = document.getElementById(opts.masterId || 'tabletMaster');
      if (!scene) return null;
      placeFaces(scene);
      applyFit();
      window.addEventListener('resize', applyFit, { passive: true });
      return scene;
    }
  };

  window.WorkTabCube = api;

  function boot() { api.init(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
