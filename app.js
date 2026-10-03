(() => {
  const header = document.querySelector('[data-header]');
  const nav = document.querySelector('[data-nav]');
  const toggle = document.querySelector('[data-nav-toggle]');
  const toggleLabel = toggle?.querySelector('.sr-only');
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

  document.querySelectorAll('[data-case-carousel]').forEach((carousel) => {
    const viewport = carousel.querySelector('[data-carousel-viewport]');
    const slides = [...carousel.querySelectorAll('[data-carousel-slide]')];
    const tabs = [...carousel.querySelectorAll('[data-carousel-tab]')];
    const previousButton = carousel.querySelector('[data-carousel-prev]');
    const nextButton = carousel.querySelector('[data-carousel-next]');
    const status = carousel.querySelector('[data-carousel-status]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!viewport || !slides.length) return;

    let activeIndex = 0;
    let scrollTimer;

    const syncCarousel = (nextIndex) => {
      activeIndex = Math.max(0, Math.min(slides.length - 1, nextIndex));

      tabs.forEach((tab, index) => {
        const active = index === activeIndex;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });

      slides.forEach((slide, index) => {
        const active = index === activeIndex;
        if (active) slide.removeAttribute('aria-hidden');
        else slide.setAttribute('aria-hidden', 'true');
        if ('inert' in slide) slide.inert = !active;
        slide.querySelectorAll('a, button').forEach((control) => {
          if (active) control.removeAttribute('tabindex');
          else control.tabIndex = -1;
        });
      });

      previousButton?.setAttribute('aria-disabled', String(activeIndex === 0));
      nextButton?.setAttribute('aria-disabled', String(activeIndex === slides.length - 1));
      const nextStatus = `${activeIndex + 1} / ${slides.length}`;
      if (status && status.textContent !== nextStatus) status.textContent = nextStatus;
    };

    const goToSlide = (nextIndex) => {
      const boundedIndex = Math.max(0, Math.min(slides.length - 1, nextIndex));
      syncCarousel(boundedIndex);
      viewport.scrollTo({
        left: slides[boundedIndex].offsetLeft,
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
      });
    };

    const nearestSlideIndex = () => slides.reduce((nearest, slide, index) => (
      Math.abs(slide.offsetLeft - viewport.scrollLeft)
        < Math.abs(slides[nearest].offsetLeft - viewport.scrollLeft)
        ? index
        : nearest
    ), 0);

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => goToSlide(index));
      tab.addEventListener('keydown', (event) => {
        let nextIndex = index;
        if (event.key === 'ArrowLeft') nextIndex = Math.max(0, index - 1);
        else if (event.key === 'ArrowRight') nextIndex = Math.min(tabs.length - 1, index + 1);
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = tabs.length - 1;
        else return;

        event.preventDefault();
        tabs[nextIndex].focus();
        goToSlide(nextIndex);
      });
    });

    previousButton?.addEventListener('click', () => {
      if (activeIndex > 0) goToSlide(activeIndex - 1);
    });
    nextButton?.addEventListener('click', () => {
      if (activeIndex < slides.length - 1) goToSlide(activeIndex + 1);
    });

    viewport.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      goToSlide(activeIndex + (event.key === 'ArrowRight' ? 1 : -1));
    });

    viewport.addEventListener('scroll', () => {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => syncCarousel(nearestSlideIndex()), 100);
    }, { passive: true });

    if ('ResizeObserver' in window) {
      new ResizeObserver(() => {
        viewport.scrollLeft = slides[activeIndex].offsetLeft;
      }).observe(viewport);
    }

    syncCarousel(0);
  });

  const activeNavLink = nav?.querySelector('a[aria-current="page"]');
  const nextNavLink = document.body.classList.contains('resume-home')
    ? nav?.querySelector('a[href]')
    : activeNavLink?.nextElementSibling;

  if (nextNavLink?.matches('a[href]')) {
    const scrollingElement = () => document.scrollingElement || document.documentElement;
    const isAtPageEnd = () => {
      const page = scrollingElement();
      return page.scrollHeight - page.scrollTop - page.clientHeight <= 4;
    };
    const navigationBlocked = () => (
      document.body.classList.contains('menu-open')
      || Boolean(document.querySelector('dialog[open]'))
    );

    let navigatingToNextPage = false;
    let wheelIntent = 0;
    let wheelIntentTimer;
    let touchStart = null;

    const resetWheelIntent = () => {
      wheelIntent = 0;
      window.clearTimeout(wheelIntentTimer);
    };

    const openNextPage = () => {
      if (navigatingToNextPage) return;
      navigatingToNextPage = true;
      window.location.assign(nextNavLink.href);
    };

    window.addEventListener('wheel', (event) => {
      const verticalDistance = Math.abs(event.deltaY);
      const horizontalDistance = Math.abs(event.deltaX);

      if (
        navigatingToNextPage
        || event.defaultPrevented
        || event.ctrlKey
        || navigationBlocked()
        || event.deltaY <= 0
        || verticalDistance <= horizontalDistance
        || !isAtPageEnd()
      ) {
        resetWheelIntent();
        return;
      }

      const deltaUnit = event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? window.innerHeight
          : 1;
      wheelIntent += event.deltaY * deltaUnit;
      window.clearTimeout(wheelIntentTimer);
      wheelIntentTimer = window.setTimeout(resetWheelIntent, 600);

      if (wheelIntent >= 160) openNextPage();
    }, { passive: true });

    window.addEventListener('scroll', () => {
      if (!isAtPageEnd()) resetWheelIntent();
    }, { passive: true });

    window.addEventListener('touchstart', (event) => {
      if (
        navigatingToNextPage
        || navigationBlocked()
        || event.touches.length !== 1
        || !isAtPageEnd()
      ) {
        touchStart = null;
        return;
      }

      const touch = event.touches[0];
      touchStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });

    window.addEventListener('touchend', (event) => {
      if (!touchStart || navigatingToNextPage || navigationBlocked()) {
        touchStart = null;
        return;
      }

      const touch = event.changedTouches[0];
      const horizontalDistance = Math.abs(touch.clientX - touchStart.x);
      const upwardDistance = touchStart.y - touch.clientY;
      touchStart = null;

      if (isAtPageEnd() && upwardDistance >= 64 && upwardDistance > horizontalDistance) {
        openNextPage();
      }
    }, { passive: true });

    window.addEventListener('touchcancel', () => {
      touchStart = null;
    }, { passive: true });
  }

  const previewLinks = [...document.querySelectorAll('.snapshot-image-link, .architecture-board > a')];
  if (!previewLinks.length || !('HTMLDialogElement' in window)) return;

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
      const figure = link.closest('figure');
      const caption = figure?.querySelector('figcaption');
      const captionParts = caption
        ? [...caption.children].map((node) => node.textContent.trim()).filter(Boolean)
        : [];
      dialogImage.src = link.href;
      dialogImage.alt = sourceImage?.alt || '大图预览';
      dialogCaption.textContent = figure?.querySelector('h3, figcaption p')?.textContent || captionParts.join(' · ');
      dialog.showModal();
      closeButton.focus();
    });
  });
})();
