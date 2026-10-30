/**
 * GEEKDINO TAB 5 — Main Production Application Script
 * Orchestrates Lenis smooth scroll, GSAP ScrollTrigger, Custom Cursor,
 * Dynamic Navigation, Specs Counters, Solutions Tabs, Quote Form, and Micro-interactions.
 */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------------------------------------------------------
     1. LENIS SMOOTH SCROLL + GSAP TICKER INTEGRATION
     -------------------------------------------------------------------------- */
  let lenis = null;
  if (!reduceMotion && typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.8
    });

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }
    window.tabLenis = lenis;
  } else if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* --------------------------------------------------------------------------
     2. SCROLL PROGRESS BAR & NAV GLASSMORPHISM
     -------------------------------------------------------------------------- */
  const progressBar = document.getElementById('progressBar');
  const siteNav = document.getElementById('siteNav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const sections = ['hero', 'journey', 'anatomy', 'features', 'solutions', 'compare', 'faq', 'quote']
    .map(id => document.getElementById(id))
    .filter(Boolean);
  const navAnchors = Array.from(document.querySelectorAll('.nav-links a'));

  function onScroll() {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    // Progress bar
    if (progressBar && maxScroll > 0) {
      const progress = Math.min(100, Math.max(0, (scrollY / maxScroll) * 100));
      progressBar.style.width = progress + '%';
    }

    // Nav glassmorphism
    if (siteNav) {
      if (scrollY > 40) siteNav.classList.add('is-scrolled');
      else siteNav.classList.remove('is-scrolled');
    }

    // Active nav link indicator
    const checkY = scrollY + window.innerHeight * 0.35;
    let current = sections[0];
    sections.forEach(s => {
      if (s.offsetTop <= checkY) current = s;
    });

    navAnchors.forEach(a => {
      const href = a.getAttribute('href');
      const isMatch = href === '#' + (current && current.id);
      if (isMatch) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    // Walking mascot easter egg
    const walkDino = document.getElementById('walkDino');
    if (walkDino && maxScroll > 0) {
      const p = scrollY / maxScroll;
      const maxX = window.innerWidth - 70;
      walkDino.style.transform = `translateX(${p * maxX}px) scaleX(${p > 0.01 ? 1 : 1})`;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --------------------------------------------------------------------------
     3. SMOOTH ANCHOR NAVIGATION & MOBILE MENU
     -------------------------------------------------------------------------- */
  function closeMobileMenu() {
    if (!siteNav || !navToggle) return;
    siteNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation menu');
  }

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = siteNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileMenu();
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();
      closeMobileMenu();

      if (lenis && !reduceMotion) {
        lenis.scrollTo(targetEl, { offset: -60, duration: 1.4 });
      } else {
        targetEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
  });

  /* --------------------------------------------------------------------------
     4. CUSTOM DESKTOP CURSOR
     -------------------------------------------------------------------------- */
  const cursorDot = document.getElementById('customCursor');
  const cursorFollower = document.getElementById('customCursorFollower');

  if (cursorDot && cursorFollower && !reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let followerX = mouseX, followerY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    }, { passive: true });

    function renderCursor() {
      followerX += (mouseX - followerX) * 0.18;
      followerY += (mouseY - followerY) * 0.18;
      cursorFollower.style.transform = `translate(${followerX}px, ${followerY}px) translate(-50%, -50%)`;
      requestAnimationFrame(renderCursor);
    }
    renderCursor();

    const interactives = document.querySelectorAll('a, button, input, select, textarea, .card, .chip, [role="button"]');
    interactives.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursorDot.classList.add('is-hover');
        cursorFollower.classList.add('is-hover');
      });
      el.addEventListener('mouseleave', () => {
        cursorDot.classList.remove('is-hover');
        cursorFollower.classList.remove('is-hover');
      });
    });
  }

  /* --------------------------------------------------------------------------
     5. SOLUTIONS & USE CASES TABS
     -------------------------------------------------------------------------- */
  const solButtons = Array.from(document.querySelectorAll('.sol-tab-btn'));
  const solPanels = Array.from(document.querySelectorAll('.solution-panel'));

  solButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      solButtons.forEach(b => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', String(on));
      });
      solPanels.forEach(p => {
        const on = p.dataset.panel === target;
        p.classList.toggle('is-active', on);
      });
    });
  });

  /* --------------------------------------------------------------------------
     6. ANIMATED NUMBER COUNTERS (SPECS & TRUST METRICS)
     -------------------------------------------------------------------------- */
  const counterElements = Array.from(document.querySelectorAll('[data-counter-to]'));

  function animateCounter(el) {
    if (el.dataset.animated) return;
    el.dataset.animated = 'true';

    const targetVal = parseFloat(el.dataset.counterTo);
    const suffix = el.dataset.counterSuffix || '';
    const decimals = parseInt(el.dataset.counterDecimals || '0', 10);
    const duration = 1600;
    const start = performance.now();

    function updateCounter(now) {
      const progress = Math.min(1, (now - start) / duration);
      // Ease out expo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = targetVal * ease;
      el.textContent = current.toFixed(decimals) + suffix;

      if (progress < 1) requestAnimationFrame(updateCounter);
      else el.textContent = targetVal.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(updateCounter);
  }

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    counterElements.forEach(el => counterObserver.observe(el));
  } else {
    counterElements.forEach(animateCounter);
  }

  /* --------------------------------------------------------------------------
     7. ENQUIRY & REQUEST A QUOTE FORM
     -------------------------------------------------------------------------- */
  const quoteForm = document.getElementById('quoteForm');
  const btnWhatsAppQuote = document.getElementById('btnWhatsAppQuote');
  const quoteSuccessModal = document.getElementById('quoteSuccess');
  const quantityInput = document.getElementById('quoteQuantity');
  const qtyPills = Array.from(document.querySelectorAll('.qty-pill'));

  qtyPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const qty = pill.dataset.qty;
      if (quantityInput) quantityInput.value = qty;
      qtyPills.forEach(p => p.classList.toggle('is-active', p === pill));
    });
  });

  function getQuoteFormData() {
    return {
      name: (document.getElementById('quoteName')?.value || '').trim(),
      email: (document.getElementById('quoteEmail')?.value || '').trim(),
      phone: (document.getElementById('quotePhone')?.value || '').trim(),
      org: (document.getElementById('quoteOrg')?.value || '').trim(),
      qty: (quantityInput?.value || '1').trim(),
      usecase: (document.getElementById('quoteUseCase')?.value || 'General').trim(),
      msg: (document.getElementById('quoteMsg')?.value || '').trim()
    };
  }

  // WhatsApp Quote Link Generator
  if (btnWhatsAppQuote) {
    btnWhatsAppQuote.addEventListener('click', (e) => {
      e.preventDefault();
      const d = getQuoteFormData();
      const text = `Hello Geek Dino Labs! I would like to request a quote for GEEKDINO TAB 5.\n\n` +
        `• Name: ${d.name || 'Inquirer'}\n` +
        `• Email: ${d.email || 'N/A'}\n` +
        `• Phone: ${d.phone || 'N/A'}\n` +
        `• Organisation/School: ${d.org || 'N/A'}\n` +
        `• Tablets Needed: ${d.qty}\n` +
        `• Primary Use Case: ${d.usecase}\n` +
        (d.msg ? `• Notes: ${d.msg}\n` : '') +
        `\nPlease provide availability, institutional pricing and dispatch turnaround. Thank you!`;

      const waUrl = `https://wa.me/918220001821?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    });
  }

  // Email / Standard Form Submit
  if (quoteForm) {
    quoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = getQuoteFormData();

      if (!d.name || !d.phone) {
        alert('Please fill in your Name and Phone number so our Coimbatore sales team can send your quote.');
        return;
      }

      // Show animated success confirmation
      quoteForm.style.display = 'none';
      if (quoteSuccessModal) {
        quoteSuccessModal.classList.add('is-active');
        const summary = document.getElementById('quoteSuccessSummary');
        if (summary) {
          summary.textContent = `Thank you, ${d.name}! Your enquiry for ${d.qty} GEEKDINO TAB 5 unit(s) for ${d.org || 'your team'} has been received. Our sales team will reach out via WhatsApp / phone (${d.phone}) within 2 business hours.`;
        }
      }
    });
  }

  /* --------------------------------------------------------------------------
     8. REFRESH SCROLLTRIGGER AFTER IMAGES LOAD
     -------------------------------------------------------------------------- */
  window.addEventListener('load', () => {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  });
});
