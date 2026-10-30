// FEATURES & SPECS — desktop horizontal track pinning + mobile stacked layout + 3D model part sync
document.addEventListener('DOMContentLoaded', () => {
  const stage = document.getElementById('modelStage');
  const model = window.WorkTab3D;
  const featuresSection = document.querySelector('.features');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || !featuresSection) return;
  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();

  // Desktop (>= 1024px): horizontal pinned spec track
  mm.add('(min-width: 1024px)', () => {
    const track = document.getElementById('featuresTrack');
    const cards = gsap.utils.toArray('.feature-card');
    if (!track || cards.length === 0 || reduce) return;

    // Pin section and scroll horizontally
    const totalScroll = track.scrollWidth - track.clientWidth;
    if (totalScroll > 50) {
      gsap.to(track, {
        x: () => -totalScroll,
        ease: 'none',
        scrollTrigger: {
          trigger: featuresSection,
          pin: true,
          scrub: 1.1,
          start: 'top top',
          end: () => `+=${totalScroll * 1.5}`,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (model && stage && stage.classList.contains('is-visible')) {
              const partIdx = Math.min(cards.length - 1, Math.floor(self.progress * cards.length));
              const partId = cards[partIdx]?.dataset.part;
              if (partId) model.selectPart(partId);
            }
          }
        }
      });
    }
  });

  // Mobile / Tablet (< 1024px): stacked cards with stagger animation
  mm.add('(max-width: 1023px)', () => {
    const cards = gsap.utils.toArray('.feature-card');
    if (cards.length === 0 || reduce) return;

    cards.forEach((card) => {
      gsap.from(card, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });
    });
  });
});
