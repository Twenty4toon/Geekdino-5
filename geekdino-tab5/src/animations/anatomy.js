// ANATOMY — scroll-driven 3D explode story
document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  const model = window.WorkTab3D;
  if (!model || !model.init({ stageId: 'modelStage' })) return;

  const stage = document.getElementById('modelStage');
  const tabletMaster = document.getElementById('tabletMaster');
  const legend = document.getElementById('anatomyLegend');
  const legendBtns = Array.from(document.querySelectorAll('.legend-part'));
  const tour = document.getElementById('anatomyTour');
  const tourNum = document.getElementById('tourNum');
  const tourTitle = document.getElementById('tourTitle');
  const tourDesc = document.getElementById('tourDesc');
  const barWrap = document.getElementById('anatomyProgress');
  const barFill = document.getElementById('anatomyBar');
  const intro = document.getElementById('anatomyIntro');
  const barCtl = document.getElementById('anatomyBarCtl');
  const hint = document.getElementById('anatomyHint');
  const btnExplode = document.getElementById('btnExplode');
  const btnSpin = document.getElementById('btnSpin');
  const btnRotLeft = document.getElementById('btnRotLeft');
  const btnRotRight = document.getElementById('btnRotRight');
  const slider = document.getElementById('spreadSlider');
  const viewChips = Array.from(document.querySelectorAll('.anatomy-bar [data-view]'));

  const PARTS = model.PARTS;
  const NUM = n => String(n + 1).padStart(2, '0');

  // story phases (fractions of .anatomy scroll)
  const PH = {
    fadeIn: [0.0, 0.06],
    // trigger starts at "top bottom" → p=0.143 when section top hits viewport top,
    // so the header (centered in first 100vh of section) is only on screen for
    // p≈0.07–0.21; fade must match that window or it never appears
    introOut: [0.15, 0.21],
    explode: [0.1, 0.36],
    tour: [0.36, 0.82],
    reassemble: [0.82, 0.93],
    outro: [0.93, 1.0]
  };

  let scrollExplode = 0;
  let manualExplode = null;      // user override explode target
  let manualUntil = 0;           // scrollY until which override sticks
  let currentTour = -1;
  let lastScrollY = window.scrollY;

  const seg = (p, a, b) => Math.max(0, Math.min(1, (p - a) / (b - a)));
  const easeInOut = t => t * t * (3 - 2 * t);

  /* ---------- controls ---------- */
  function syncExplodeUI(v) {
    if (slider) slider.value = Math.round(v * 100);
    if (btnExplode) {
      const on = v > 0.5;
      btnExplode.classList.toggle('on', on);
      btnExplode.textContent = on ? 'ASSEMBLE' : 'EXPLODE';
      btnExplode.setAttribute('aria-pressed', on);
    }
  }

  function applyExplode(v, instant) {
    scrollExplode = v;
    if (manualExplode === null || window.scrollY >= manualUntil) {
      manualExplode = null;
      model.setExplode(v, instant);
      syncExplodeUI(v);
    }
  }

  if (btnExplode) {
    btnExplode.addEventListener('click', () => {
      const cur = model.getExplode();
      manualExplode = cur > 0.5 ? 0 : 1;
      manualUntil = window.scrollY + window.innerHeight * 1.5;
      model.setExplode(manualExplode);
      syncExplodeUI(manualExplode);
    });
  }

  if (slider) {
    slider.addEventListener('input', () => {
      manualExplode = slider.value / 100;
      manualUntil = window.scrollY + window.innerHeight * 1.5;
      model.setExplode(manualExplode);
    });
  }

  if (btnSpin) {
    btnSpin.addEventListener('click', () => {
      const on = model.toggleAutoRotate();
      btnSpin.classList.toggle('on', on);
      btnSpin.setAttribute('aria-pressed', on);
    });
  }

  viewChips.forEach(chip => {
    chip.addEventListener('click', () => {
      model.setView(chip.dataset.view);
      viewChips.forEach(c => {
        const on = c === chip;
        c.classList.toggle('on', on);
        c.setAttribute('aria-pressed', on);
      });
    });
  });

  if (btnRotLeft) btnRotLeft.addEventListener('click', () => model.nudgeRotation(-22, 0));
  if (btnRotRight) btnRotRight.addEventListener('click', () => model.nudgeRotation(22, 0));

  document.addEventListener('keydown', (e) => {
    if (!stage || !stage.classList.contains('is-interactive')) return;
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); model.nudgeRotation(-18, 0); }
    if (e.key === 'ArrowRight') { e.preventDefault(); model.nudgeRotation(18, 0); }
    if (e.key === 'ArrowUp') { e.preventDefault(); model.nudgeRotation(0, -12); }
    if (e.key === 'ArrowDown') { e.preventDefault(); model.nudgeRotation(0, 12); }
    if (e.key === 'Escape') selectPart(null);
  });

  function selectPart(id, fromLegend) {
    model.selectPart(id);
    legendBtns.forEach(b => {
      const on = b.dataset.part === id;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
    });
    if (id && fromLegend && model.getExplode() < 0.5) {
      manualExplode = 1;
      manualUntil = window.scrollY + window.innerHeight * 1.5;
      model.setExplode(1);
      syncExplodeUI(1);
    }
  }

  legendBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.part;
      selectPart(model.getSelected() === id ? null : id, true);
    });
  });

  /* ---------- tour caption ---------- */
  function showTour(i) {
    if (i === currentTour) return;
    currentTour = i;
    if (i < 0 || i >= PARTS.length) {
      tour.classList.remove('is-visible');
      selectPart(null);
      return;
    }
    const p = PARTS[i];
    tourNum.textContent = `PART ${NUM(i)} / ${NUM(PARTS.length - 1)}`;
    tourTitle.textContent = p.n.toUpperCase();
    tourDesc.textContent = p.s;
    tour.style.setProperty('--c', p.c);
    tour.classList.add('is-visible');
    selectPart(p.id);
  }

  /* ---------- main scrub ---------- */
  ScrollTrigger.create({
    trigger: '.anatomy',
    start: 'top bottom',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const p = self.progress;

      // progress rail
      if (barFill) barFill.style.height = (seg(p, 0.08, 0.95) * 100) + '%';

      // intro copy fades out
      if (intro) {
        const o = 1 - seg(p, PH.introOut[0], PH.introOut[1]);
        intro.style.opacity = o;
        intro.style.visibility = o <= 0.01 ? 'hidden' : 'visible';
      }

      // explode phase
      const ex = easeInOut(seg(p, PH.explode[0], PH.explode[1]));
      const re = easeInOut(seg(p, PH.reassemble[0], PH.reassemble[1]));
      applyExplode(Math.max(0, ex - re));

      // camera drift before tour
      if (p < PH.tour[0]) {
        const t = seg(p, PH.explode[0], PH.tour[0]);
        model.setRotation(-16 + t * 6, -38 + t * 30);
      }

      // part tour
      if (p >= PH.tour[0] && p < PH.tour[1]) {
        const t = seg(p, PH.tour[0], PH.tour[1]);
        const idx = Math.min(PARTS.length - 1, Math.floor(t * PARTS.length));
        showTour(idx);
      } else if (p >= PH.reassemble[0]) {
        showTour(-1);
      }

      // chrome visibility
      const chromeOn = p > PH.explode[0] - 0.02 && p < PH.outro[1];
      legend.classList.toggle('is-visible', p > 0.12 && p < 0.96);
      barCtl.classList.toggle('is-visible', p > 0.12 && p < 0.96);
      if (hint) hint.classList.toggle('is-visible', p > 0.14 && p < 0.94);
      barWrap.classList.toggle('is-visible', chromeOn);
      stage.classList.toggle('is-visible', p > PH.fadeIn[0] + 0.01);

      // interactivity during anatomy body (not while scrolling intro)
      const interact = p > PH.explode[0] && p < 0.98;
      model.setInteractive(interact);
      // legend + tour caption are the UI; hide the floating 3D labels so the
      // exploded model stays readable
      model.setLabelsVisible(false);

      // handoff: hide flat tablet
      if (tabletMaster) {
        const fade = 1 - seg(p, 0.0, 0.05);
        tabletMaster.style.opacity = fade;
        tabletMaster.style.visibility = fade <= 0.01 ? 'hidden' : 'visible';
      }

      // resume scroll-driven explode after big manual scroll
      if (manualExplode !== null && Math.abs(window.scrollY - lastScrollY) > 4) {
        if (window.scrollY >= manualUntil) manualExplode = null;
      }
      lastScrollY = window.scrollY;
    },
    onLeaveBack: () => {
      // scrolled back above anatomy — restore flat tablet, hide model
      stage.classList.remove('is-visible');
      model.setInteractive(false);
      model.setLabelsVisible(false);
      model.selectPart(null);
      model.setExplode(0, true);
      manualExplode = null;
      currentTour = -1;
      tour.classList.remove('is-visible');
      if (tabletMaster) {
        tabletMaster.style.opacity = '';
        tabletMaster.style.visibility = '';
      }
    },
    onLeave: () => {
      // entering features — model stays, becomes non-interactive
      model.setInteractive(false);
      model.setLabelsVisible(false);
      model.setExplode(0, true);
      syncExplodeUI(0);
      manualExplode = null;
      currentTour = -1;
      tour.classList.remove('is-visible');
      legend.classList.remove('is-visible');
      barCtl.classList.remove('is-visible');
      if (hint) hint.classList.remove('is-visible');
      barWrap.classList.remove('is-visible');
    },
    onEnterBack: () => {
      stage.classList.add('is-visible');
    }
  });
});
