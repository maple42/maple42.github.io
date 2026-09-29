(() => {
  const header = document.querySelector('[data-header]');
  const nav = document.querySelector('[data-nav]');
  const toggle = document.querySelector('[data-nav-toggle]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 24);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    nav?.classList.toggle('open', open);
  });

  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      toggle?.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
    });
  });

  const revealItems = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const navLinks = [...document.querySelectorAll('.primary-nav a[href^="#"]')];
  const sections = navLinks
    .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!current) return;
      navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current.target.id}`);
      });
    }, { rootMargin: '-25% 0px -60% 0px', threshold: [0.1, 0.35] });
    sections.forEach((section) => sectionObserver.observe(section));
  }
})();
