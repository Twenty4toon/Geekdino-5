// HERO — Split-text reveal, magnetic CTA buttons, mouse-parallax & spotlight
document.addEventListener('DOMContentLoaded', () => {
  const tabletMaster = document.getElementById('tabletMaster');
  const tabletScene = document.getElementById('tabletScene');
  const tabletFloat = document.getElementById('tabletFloat');
  const heroSection = document.getElementById('hero');
  const heroSpot = document.querySelector('.hero-spot');
  const heroTitle = document.querySelector('.hero-title');
  const heroKicker = document.querySelector('.hero-kicker');
  const heroSub = document.querySelector('.hero-subtitle');
  const heroDesc = document.querySelector('.hero-desc');
  const heroBadges = document.querySelector('.hero-badges');
  const ctaButtons = document.querySelectorAll('.hero-cta .btn');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Split-text line/word mask helper
  function splitTextIntoMasks(element) {
    if (!element) return [];
    var words = element.innerText.trim().split(/\s+/);
    element.innerHTML = words.map(function (w) {
      return '<span class="split-word-mask" style="display:inline-block;overflow:hidden;vertical-align:bottom;"><span class="split-word" style="display:inline-block;">' + w + '&nbsp;</span></span>';
    }).join('');
    return element.querySelectorAll('.split-word');
  }

  var titleWords = reduce ? [] : splitTextIntoMasks(heroTitle);

  function enter() {
    if (!tabletMaster) return;
    tabletMaster.style.opacity = '1';
    tabletMaster.style.visibility = 'visible';

    if (reduce || typeof gsap === 'undefined') {
      if (heroTitle) heroTitle.style.opacity = '1';
      return;
    }

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // 1. Kicker fade & slide
    if (heroKicker) {
      tl.fromTo(heroKicker, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.8 }, 0);
    }

    // 2. Split headline reveal from line masks
    if (titleWords.length > 0) {
      tl.fromTo(titleWords,
        { yPercent: 110, rotate: 3, opacity: 0 },
        { yPercent: 0, rotate: 0, opacity: 1, duration: 1.0, stagger: 0.04, ease: 'power4.out' },
        0.15
      );
    } else if (heroTitle) {
      tl.fromTo(heroTitle, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9 }, 0.15);
    }

    // 3. Subtitle & Description
    if (heroSub) {
      tl.fromTo(heroSub, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, 0.45);
    }
    if (heroDesc) {
      tl.fromTo(heroDesc, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, 0.55);
    }
    if (heroBadges) {
      tl.fromTo(heroBadges, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, 0.65);
    }

    // 4. CTA buttons stagger
    if (ctaButtons.length > 0) {
      tl.fromTo(ctaButtons,
        { opacity: 0, y: 24, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.1, ease: 'back.out(1.8)' },
        0.7
      );
    }

    // 5. Tablet cube entry
    if (tabletTilt) {
      const getHeroOffset = () => window.innerWidth >= 992 ? Math.min(320, window.innerWidth * 0.22) : 0;
      gsap.set(tabletTilt, { x: getHeroOffset });
      window.addEventListener('resize', () => {
        gsap.set(tabletTilt, { x: getHeroOffset });
      }, { passive: true });
    }
    if (tabletScene) {
      gsap.fromTo(tabletScene,
        { rotationY: -58, rotationX: 16 },
        { rotationY: -28, rotationX: -12, duration: 1.6, ease: 'power3.out' }
      );
    }
    if (tabletFloat) {
      gsap.fromTo(tabletFloat,
        { y: 40 },
        {
          y: 0,
          duration: 1.6,
          ease: 'power3.out',
          onComplete: () => {
            gsap.to(tabletFloat, {
              y: 8,
              duration: 3.2,
              yoyo: true,
              repeat: -1,
              ease: 'sine.inOut'
            });
          }
        }
      );
    }
  }

  // Interactive mouse spotlight tracking
  if (heroSection && heroSpot && !reduce) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      heroSpot.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(60, 245, 160, 0.14) 0%, rgba(60, 245, 160, 0.02) 45%, transparent 70%)`;
    });
  }

  // Magnetic CTA buttons
  if (!reduce && window.innerWidth >= 1024) {
    ctaButtons.forEach((btn) => {
      btn.addEventListener('mousemove', function (e) {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.28}px, ${y * 0.28}px) scale(1.04)`;
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  if (document.documentElement.classList.contains('is-locked')) {
    window.addEventListener('intro:done', enter, { once: true });
  } else {
    enter();
  }
});
