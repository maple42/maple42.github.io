(() => {
  const header = document.querySelector('[data-header]');
  const nav = document.querySelector('[data-nav]');
  const toggle = document.querySelector('[data-nav-toggle]');
  const toggleLabel = toggle?.querySelector('.sr-only');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileNav = window.matchMedia('(max-width: 720px)');

  const setNavState = (open, restoreFocus = false) => {
    toggle?.setAttribute('aria-expanded', String(open));
    nav?.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open && mobileNav.matches);
    if (toggleLabel) toggleLabel.textContent = open ? '关闭导航' : '打开导航';
    if (restoreFocus) toggle?.focus();
  };

  toggle?.addEventListener('click', () => {
    setNavState(toggle.getAttribute('aria-expanded') !== 'true');
  });

  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setNavState(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
      setNavState(false, true);
    }
  });

  document.addEventListener('pointerdown', (event) => {
    if (toggle?.getAttribute('aria-expanded') === 'true' && !header?.contains(event.target)) {
      setNavState(false);
    }
  });

  mobileNav.addEventListener('change', ({ matches }) => {
    if (!matches) setNavState(false);
  });

  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);

  const backToTop = document.createElement('button');
  backToTop.className = 'back-to-top';
  backToTop.type = 'button';
  backToTop.setAttribute('aria-label', '返回页面顶部');
  backToTop.innerHTML = '<span aria-hidden="true">↑</span>';
  document.body.append(backToTop);
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  let scrollTicking = false;
  const updatePageUi = () => {
    const scrollTop = window.scrollY;
    const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    header?.classList.toggle('scrolled', scrollTop > 24);
    backToTop.classList.toggle('visible', scrollTop > 640);
    progress.style.transform = `scaleX(${scrollRange > 0 ? scrollTop / scrollRange : 0})`;
    scrollTicking = false;
  };
  const requestPageUiUpdate = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updatePageUi);
  };
  updatePageUi();
  window.addEventListener('scroll', requestPageUiUpdate, { passive: true });
  window.addEventListener('resize', requestPageUiUpdate, { passive: true });

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
  if ('IntersectionObserver' in window && sections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!current) return;
      navLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${current.target.id}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else if (link.getAttribute('aria-current') === 'location') link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-25% 0px -60% 0px', threshold: [0.1, 0.35] });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  const previewLinks = [...document.querySelectorAll('.snapshot-image-link, .architecture-board > a')];
  if (previewLinks.length && 'HTMLDialogElement' in window) {
    const dialog = document.createElement('dialog');
    dialog.className = 'image-lightbox';
    dialog.setAttribute('aria-label', '图片预览');
    dialog.innerHTML = `
      <div class="lightbox-panel">
        <button class="lightbox-close" type="button" aria-label="关闭图片预览">×</button>
        <img alt="">
        <p></p>
      </div>`;
    document.body.append(dialog);

    const dialogImage = dialog.querySelector('img');
    const dialogCaption = dialog.querySelector('p');
    const closeButton = dialog.querySelector('.lightbox-close');
    let previewTrigger = null;

    const closePreview = () => dialog.close();
    closeButton.addEventListener('click', closePreview);
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closePreview();
    });
    dialog.addEventListener('close', () => {
      dialogImage.removeAttribute('src');
      previewTrigger?.focus();
    });

    previewLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        previewTrigger = link;
        const sourceImage = link.querySelector('img');
        dialogImage.src = link.href;
        dialogImage.alt = sourceImage?.alt || '大图预览';
        dialogCaption.textContent = link.closest('figure')?.querySelector('h3, figcaption p')?.textContent || '';
        dialog.showModal();
        closeButton.focus();
      });
    });
  }
})();
