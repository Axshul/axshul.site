(() => {
  'use strict';

  const entered = new WeakSet();
  let dispose = null;

  function enhance() {
    const section = document.querySelector('.field-notes');
    if (!section) return () => {};

    const root = document.documentElement;
    const cards = Array.from(section.querySelectorAll('[data-photo-card]'));
    const photos = Array.from(section.querySelectorAll('a[data-photo-open]'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
    const visible = new Set();
    const pending = new Set();
    const removers = [];
    const records = new Map(cards.map((card, index) => {
      const requested = Number(card.dataset.photoSpeed);
      return [card, {
        shift: 0,
        turn: 0,
        speed: Math.min(1.25, Math.max(-1.25, Number.isFinite(requested) ? requested : .8)),
        direction: index % 2 === 0 ? 1 : -1
      }];
    }));
    const dialog = document.getElementById('photo-viewer');
    const viewerImage = dialog && dialog.querySelector('.photo-viewer-image');
    const viewerCaption = dialog && dialog.querySelector('#photo-viewer-caption');
    const viewerCount = dialog && dialog.querySelector('[data-photo-count]');
    const original = dialog && dialog.querySelector('[data-photo-original]');
    const closeButton = dialog && dialog.querySelector('[data-photo-close]');
    const previousButton = dialog && dialog.querySelector('[data-photo-prev]');
    const nextButton = dialog && dialog.querySelector('[data-photo-next]');
    const canView = Boolean(dialog && typeof dialog.showModal === 'function' && viewerImage && viewerCaption && viewerCount && original && closeButton && previousButton && nextButton && photos.length);
    let cardObserver = null;
    let sectionObserver = null;
    let frame = 0;
    let closed = false;
    let sectionVisible = true;
    let photoIndex = 0;
    let opener = null;

    function listen(target, event, callback, options) {
      target.addEventListener(event, callback, options);
      removers.push(() => target.removeEventListener(event, callback, options));
    }

    function watch(query, callback) {
      if (typeof query.addEventListener === 'function') listen(query, 'change', callback);
      else {
        query.addListener(callback);
        removers.push(() => query.removeListener(callback));
      }
    }

    function show(card, immediate = false) {
      const wasPending = pending.has(card);
      card.classList.remove('photo-pending');
      if (immediate) card.classList.remove('photo-entered');
      else if (wasPending && !reduced.matches) card.classList.add('photo-entered');
      pending.delete(card);
      entered.add(card);
    }

    function revealRelated(target, descendants = false) {
      if (!target) return;
      cards.forEach(card => {
        if (target === card || card.contains(target) || (descendants && target.contains(card))) show(card, true);
      });
    }

    function revealHash(hash) {
      if (!hash || hash === '#') return;
      try {
        revealRelated(document.getElementById(decodeURIComponent(hash.slice(1))), true);
      } catch {
        // Malformed external hashes do not affect the visible gallery.
      }
    }

    function writeOffset(card, shift = 0, turn = 0) {
      const record = records.get(card);
      const roundedShift = Math.round(shift * 100) / 100;
      const roundedTurn = Math.round(turn * 100) / 100;
      if (record.shift === roundedShift && record.turn === roundedTurn) return;
      record.shift = roundedShift;
      record.turn = roundedTurn;
      card.style.setProperty('--photo-shift', `${roundedShift}px`);
      card.style.setProperty('--photo-turn', `${roundedTurn}deg`);
    }

    function resetOffsets() {
      cards.forEach(card => writeOffset(card));
    }

    function render() {
      frame = 0;
      if (closed || document.hidden || !sectionVisible) return;
      const height = window.innerHeight;
      const sectionBounds = section.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (height * .7 - sectionBounds.top) / (sectionBounds.height + height * .4)));
      section.style.setProperty('--field-progress', String(reduced.matches ? 1 : Math.round(progress * 1000) / 1000));

      pending.forEach(card => {
        if (card.getBoundingClientRect().bottom <= 0) show(card, true);
      });

      if (!desktop.matches || reduced.matches || (canView && dialog.open)) {
        resetOffsets();
        return;
      }

      // Read all bounds before writing transforms. Remove our last displacement
      // from each center so the next frame does not feed back on itself.
      const positions = [];
      visible.forEach(card => {
        const bounds = card.getBoundingClientRect();
        const record = records.get(card);
        const center = bounds.top + bounds.height / 2 - record.shift;
        const distance = Math.min(1, Math.max(-1, (height / 2 - center) / (height / 2 + bounds.height / 2)));
        positions.push({ card, shift: distance * 26 * record.speed / 1.25, turn: distance * 2.4 * record.direction });
      });
      positions.forEach(position => writeOffset(position.card, position.shift, position.turn));
    }

    function schedule() {
      if (!closed && !document.hidden && sectionVisible && !frame) frame = window.requestAnimationFrame(render);
    }

    function onMotionChange() {
      if (reduced.matches) cards.forEach(card => show(card, true));
      resetOffsets();
      schedule();
    }

    function onVisibility() {
      if (document.hidden && frame) window.cancelAnimationFrame(frame);
      if (document.hidden) frame = 0;
      else schedule();
    }

    function setPhoto(index) {
      photoIndex = (index + photos.length) % photos.length;
      const link = photos[photoIndex];
      const image = link.querySelector('img');
      viewerImage.alt = image ? image.alt : link.dataset.photoCaption || '';
      viewerImage.src = link.href;
      viewerCaption.textContent = link.dataset.photoCaption || (image ? image.alt : 'Event photo');
      viewerCount.textContent = `${String(photoIndex + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
      original.href = link.href;
    }

    function onViewerClose() {
      root.classList.remove('photo-viewer-open');
      viewerImage.removeAttribute('src');
      if (opener && opener.isConnected && (document.activeElement === document.body || dialog.contains(document.activeElement))) {
        opener.focus({ preventScroll: true });
      }
      opener = null;
      schedule();
    }

    function onClick(event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const element = event.target instanceof Element ? event.target : event.target && event.target.parentElement;
      const link = element && element.closest('a[href]');
      if (!link) return;

      if (link.hash) {
        try {
          const destination = new URL(link.href, window.location.href);
          if (destination.origin === window.location.origin && destination.pathname === window.location.pathname && destination.search === window.location.search) revealHash(destination.hash);
        } catch {
          // Native link navigation remains available.
        }
      }

      if (!canView || !link.matches('[data-photo-open]') || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
      const index = photos.findIndex(photo => photo.href === link.href);
      if (index < 0) return;
      try {
        setPhoto(index);
        if (!dialog.open) dialog.showModal();
      } catch {
        viewerImage.removeAttribute('src');
        return;
      }
      opener = link;
      root.classList.add('photo-viewer-open');
      resetOffsets();
      event.preventDefault();
    }

    if (typeof window.IntersectionObserver === 'function') {
      try {
        cardObserver = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              visible.add(entry.target);
              show(entry.target);
            } else visible.delete(entry.target);
          });
          schedule();
        }, { threshold: 0, rootMargin: '100px 0px 100px 0px' });
        sectionObserver = new IntersectionObserver(entries => {
          sectionVisible = entries[0].isIntersecting;
          if (!sectionVisible && frame) {
            window.cancelAnimationFrame(frame);
            frame = 0;
          }
          if (sectionVisible) schedule();
        }, { threshold: 0, rootMargin: '120px 0px 120px 0px' });
      } catch {
        if (cardObserver) cardObserver.disconnect();
        cardObserver = null;
        sectionObserver = null;
      }
    }

    cards.forEach((card, index) => {
      if (cardObserver && !reduced.matches && !entered.has(card) && card.getBoundingClientRect().top >= window.innerHeight) {
        card.style.setProperty('--photo-delay', `${(index % 3) * 55}ms`);
        card.classList.add('photo-pending');
        pending.add(card);
      } else show(card, true);
      if (cardObserver) cardObserver.observe(card);
      else visible.add(card);
    });
    if (sectionObserver) sectionObserver.observe(section);
    revealHash(window.location.hash);
    revealRelated(document.activeElement);

    listen(window, 'scroll', schedule, { passive: true });
    listen(window, 'resize', () => { resetOffsets(); schedule(); }, { passive: true });
    listen(window, 'hashchange', () => revealHash(window.location.hash));
    listen(document, 'click', onClick);
    listen(document, 'focusin', event => revealRelated(event.target));
    listen(document, 'visibilitychange', onVisibility);
    watch(reduced, onMotionChange);
    watch(desktop, onMotionChange);

    if (canView) {
      listen(closeButton, 'click', () => dialog.close());
      listen(previousButton, 'click', () => setPhoto(photoIndex - 1));
      listen(nextButton, 'click', () => setPhoto(photoIndex + 1));
      listen(dialog, 'close', onViewerClose);
      listen(dialog, 'keydown', event => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          setPhoto(photoIndex + (event.key === 'ArrowRight' ? 1 : -1));
        }
      });
      listen(dialog, 'click', event => {
        if (event.target !== dialog) return;
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
      });
    }

    schedule();
    return () => {
      closed = true;
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      if (cardObserver) cardObserver.disconnect();
      if (sectionObserver) sectionObserver.disconnect();
      cards.forEach(card => show(card, true));
      resetOffsets();
      if (canView && dialog.open) dialog.close();
      root.classList.remove('photo-viewer-open');
      if (viewerImage) viewerImage.removeAttribute('src');
      opener = null;
      removers.forEach(remove => remove());
    };
  }

  function start() {
    if (dispose) dispose();
    dispose = enhance();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  window.addEventListener('pagehide', () => {
    if (dispose) dispose();
    dispose = null;
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) start();
  });
})();
