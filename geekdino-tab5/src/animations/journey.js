// JOURNEY — pinned tablet rotation, per-panel text reveals, progress line & chapter background shifts
document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  const section = document.querySelector('.journey');
  const stickyStage = document.querySelector('.journey-sticky');
  const panels = Array.from(document.querySelectorAll('.journey-panel'));
  const dots = Array.from(document.querySelectorAll('.journey-dot'));
  const progressLine = document.getElementById('journeyProgressLine');
  const scene = document.getElementById('tabletScene');
  const tilt = document.getElementById('tabletTilt');
  const stage = document.getElementById('modelStage');
  const master = document.getElementById('tabletMaster');
  const n = panels.length;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!section || n === 0) return;

  const chapterThemes = [
    { bg: '#050607', glow: 'rgba(60, 245, 160, 0.05)' },
    { bg: '#060d14', glow: 'rgba(31, 181, 216, 0.08)' },
    { bg: '#0c0714', glow: 'rgba(178, 92, 240, 0.08)' },
    { bg: '#05120e', glow: 'rgba(60, 245, 160, 0.10)' }
  ];

  let currentPanel = -1;

  function setActive(i) {
    if (i === currentPanel) return;
    currentPanel = i;

    panels.forEach((p, k) => {
      const active = k === i;
      p.classList.toggle('is-active', active);
      if (active && !reduce) {
        // Staggered text reveal inside the newly active panel
        const title = p.querySelector('.journey-title');
        const desc = p.querySelector('.journey-desc');
        const specs = p.querySelectorAll('.journey-specs li');
        if (title) gsap.fromTo(title, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
        if (desc) gsap.fromTo(desc, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.1 });
        if (specs && specs.length) {
          gsap.fromTo(specs, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out', delay: 0.2 });
        }
      }
    });

    dots.forEach((d, k) => {
      d.classList.toggle('is-active', k === i);
      d.setAttribute('aria-pressed', k === i ? 'true' : 'false');
    });

    // Background color shifts per chapter
    if (stickyStage && chapterThemes[i]) {
      gsap.to(stickyStage, {
        backgroundColor: chapterThemes[i].bg,
        duration: 0.8,
        ease: 'power1.out'
      });
    }
  }

  function panelAt(p) {
    if (p < 0.28) return 0;
    if (p < 0.58) return 1;
    if (p < 0.82) return 2;
    return 3;
  }

  function xShift() {
    return window.innerWidth >= 992 ? Math.min(320, window.innerWidth * 0.22) : (window.innerWidth > 768 ? 160 : 0);
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: reduce ? 0 : 1.1,
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        const p = self.progress;
        setActive(panelAt(p));
        if (progressLine) {
          progressLine.style.height = `${p * 100}%`;
        }
      }
    }
  });

  if (scene && tilt) {
    tl.to(scene, { rotationY: -18, rotationX: -8, ease: 'none', duration: 0.7 }, 0)
      .to(tilt, { x: xShift, ease: 'none', duration: 0.7 }, 0)

      .to(scene, { rotationY: 172, rotationX: 4, ease: 'none', duration: 0.85 }, 0.7)
      .to(tilt, { x: () => xShift() * 1.08, ease: 'none', duration: 0.85 }, 0.7)
      .to(scene, { rotationY: 172, rotationX: 4, ease: 'none', duration: 0.45 }, 1.55)

      .to(scene, { rotationY: 262, rotationX: 8, ease: 'none', duration: 0.75 }, 2.0)
      .to(tilt, { x: () => xShift() * 0.92, ease: 'none', duration: 0.75 }, 2.0)
      .to(scene, { rotationY: 262, rotationX: 8, ease: 'none', duration: 0.4 }, 2.75)

      .to(scene, { rotationY: 360, rotationX: -6, ease: 'none', duration: 0.85 }, 3.15)
      .to(tilt, { x: () => xShift() * 0.7, ease: 'none', duration: 0.85 }, 3.15);
  }

  ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    endTrigger: '.journey',
    end: 'bottom bottom',
    onToggle: (self) => {
      if (!self.isActive) return;
      if (stage) {
        stage.classList.remove('is-visible', 'features-mode', 'final-mode');
        stage.style.opacity = '';
      }
      if (master) {
        master.style.opacity = '1';
        master.style.visibility = 'visible';
      }
      if (window.TabletThree) window.TabletThree.show();
    }
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      const top = section.offsetTop;
      const dist = Math.max(1, section.offsetHeight - window.innerHeight);
      window.scrollTo({ top: top + dist * ((i + 0.45) / n), behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  setActive(0);
});
