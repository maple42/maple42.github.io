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
      dialogImage.src = link.href;
      dialogImage.alt = sourceImage?.alt || '大图预览';
      dialogCaption.textContent = link.closest('figure')?.querySelector('h3, figcaption p')?.textContent || '';
      dialog.showModal();
      closeButton.focus();
    });
  });
})();
