// INTRO — shortened cinematic splash (under 1.5s), runs while preloading
document.addEventListener('DOMContentLoaded', () => {
  const intro = document.getElementById('intro');
  const skipIntro = document.getElementById('skipIntro');
  const html = document.documentElement;
  const nav = document.getElementById('siteNav');
  const main = document.getElementById('main');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!intro) {
    html.classList.remove('is-locked');
    window.dispatchEvent(new CustomEvent('intro:done'));
    return;
  }

  let done = false;

  function setChromeInert(on) {
    [nav, main].forEach((el) => {
      if (!el) return;
      if (on) el.setAttribute('inert', '');
      else el.removeAttribute('inert');
    });
  }

  setChromeInert(true);

  function hideIntro() {
    if (done) return;
    done = true;
    intro.classList.add('is-hidden');
    html.classList.remove('is-locked');
    setChromeInert(false);
    window.dispatchEvent(new CustomEvent('intro:done'));
    if (typeof ScrollTrigger !== 'undefined') {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }
    setTimeout(() => {
      intro.style.display = 'none';
    }, reduce ? 0 : 500);
  }

  if (skipIntro) skipIntro.addEventListener('click', hideIntro);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !done) hideIntro();
  });

  const deepLink = location.hash && location.hash !== '#' && location.hash !== '#hero';
  if (reduce || deepLink) {
    hideIntro();
    return;
  }

  // Under 1.5s total duration guarantee
  const hold = 900;
  const assets = (window.TAB5 && window.TAB5.ready) ? window.TAB5.ready : Promise.resolve();
  const timer = new Promise((resolve) => setTimeout(resolve, hold));

  Promise.race([
    Promise.all([timer, assets]),
    new Promise((resolve) => setTimeout(resolve, 1400)) // hard cutoff at 1.4s
  ]).then(hideIntro);
});
