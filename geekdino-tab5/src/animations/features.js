// FEATURES & SPECS — Bento Grid Staggered Reveal + 3D Model Part Sync
document.addEventListener('DOMContentLoaded', () => {
  const stage = document.getElementById('modelStage');
  const model = window.WorkTab3D;
  const featuresSection = document.querySelector('.features');
  const cards = gsap.utils.toArray('.feature-card');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || !featuresSection || cards.length === 0) return;
  gsap.registerPlugin(ScrollTrigger);

  if (!reduce) {
    cards.forEach((card) => {
      gsap.fromTo(card,
        { opacity: 0, y: 36, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 88%',
            toggleActions: 'play none none none'
          }
        }
      );

      // Interactive hover sync with 3D exploded model subsystem
      card.addEventListener('mouseenter', () => {
        const partId = card.dataset.part;
        if (partId && model && stage && stage.classList.contains('is-visible')) {
          model.selectPart(partId);
        }
      });
    });
  }
});
