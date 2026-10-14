(() => {
  'use strict';

  const root = document.documentElement;
  const revealed = new WeakSet();
  let dispose = null;

  if (window.location.hash) root.classList.add('skip-entrance');

  function hashTarget(hash) {
    if (!hash || hash === '#') return null;
    try {
      return document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch {
      return null;
    }
  }

  function enhance() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(min-width: 701px) and (hover: hover) and (pointer: fine)');
    const hero = document.querySelector('.hero-stage');
    const header = document.querySelector('.masthead');
    const navigation = Array.from(document.querySelectorAll('.primary-nav a[href^="#"]'));
    const sections = Array.from(document.querySelectorAll('main > section[id]'));
    const targets = Array.from(document.querySelectorAll('[data-reveal]'));
    const pending = new Set();
    const removers = [];
    let revealObserver = null;
    let heroObserver = null;
    let navigationFrame = 0;
    let depthFrame = 0;
    let pointer = null;
    let heroVisible = false;
    let motionActive = false;
    let closed = false;
    let previousDepth = '';

    function listen(target, event, handler, options) {
      target.addEventListener(event, handler, options);
      removers.push(() => target.removeEventListener(event, handler, options));
    }

    function watchPreference(query, handler) {
      if (typeof query.addEventListener === 'function') {
        listen(query, 'change', handler);
      } else {
        query.addListener(handler);
        removers.push(() => query.removeListener(handler));
      }
    }

    function show(target, immediate = false) {
      target.classList.remove('reveal-pending');
      if (immediate) {
        target.classList.remove('reveal');
        target.style.removeProperty('--reveal-delay');
      }
      revealed.add(target);
      pending.delete(target);
      if (revealObserver) revealObserver.unobserve(target);
    }

    function showRelated(target, descendants = false) {
      if (!target) return;
      targets.forEach(item => {
        if (item === target || item.contains(target) || (descendants && target.contains(item))) {
          show(item, true);
        }
      });
    }

    function showHash(hash) {
      root.classList.add('skip-entrance');
      const target = hashTarget(hash);
      const disclosure = target && target.closest('details');
      if (disclosure) disclosure.open = true;
      showRelated(target, true);
    }

    function prepareReveals() {
      if (reduced.matches || typeof window.IntersectionObserver !== 'function') return;

      try {
        revealObserver = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) show(entry.target);
          });
        }, { threshold: 0.01, rootMargin: '0px 0px -36px 0px' });
      } catch {
        return;
      }

      const viewportHeight = window.innerHeight;
      targets.forEach(target => {
        if (revealed.has(target)) return;
        if (target.getBoundingClientRect().top < viewportHeight) {
          show(target, true);
          return;
        }

        const requestedDelay = Number(target.dataset.revealDelay);
        const delay = Number.isFinite(requestedDelay) ? Math.min(160, Math.max(0, requestedDelay)) : 0;
        target.style.setProperty('--reveal-delay', `${delay}ms`);
        target.classList.add('reveal', 'reveal-pending');
        pending.add(target);
        revealObserver.observe(target);
      });
    }

    function writeDepth(x = 0, y = 0, rx = 0, ry = 0) {
      if (!hero) return;
      const values = [x, y, rx, ry].map(value => Math.round(value * 100) / 100);
      const signature = values.join(',');
      if (signature === previousDepth) return;
      previousDepth = signature;
      hero.style.setProperty('--depth-x', `${values[0]}px`);
      hero.style.setProperty('--depth-y', `${values[1]}px`);
      hero.style.setProperty('--depth-rx', `${values[2]}deg`);
      hero.style.setProperty('--depth-ry', `${values[3]}deg`);
    }

    function resetDepth() {
      pointer = null;
      if (depthFrame) window.cancelAnimationFrame(depthFrame);
      depthFrame = 0;
      writeDepth();
    }

    function isHeroVisible() {
      if (!hero) return false;
      const bounds = hero.getBoundingClientRect();
      return bounds.height > 0 && bounds.width > 0 && bounds.bottom > 0 && bounds.top < window.innerHeight;
    }

    function updateMotion() {
      motionActive = Boolean(hero && heroVisible && finePointer.matches && !reduced.matches && !document.hidden);
      if (hero) hero.classList.toggle('motion-active', motionActive);
      if (!motionActive) resetDepth();
    }

    function renderDepth() {
      depthFrame = 0;
      if (closed || !pointer || !motionActive || hero.contains(document.activeElement)) {
        resetDepth();
        return;
      }

      const bounds = hero.getBoundingClientRect();
      if (!bounds.width || !bounds.height) {
        resetDepth();
        return;
      }
      const x = Math.min(1, Math.max(-1, ((pointer.x - bounds.left) / bounds.width) * 2 - 1));
      const y = Math.min(1, Math.max(-1, ((pointer.y - bounds.top) / bounds.height) * 2 - 1));
      writeDepth(x * 4, y * 4, -y * 3, x * 3);
    }

    function onPointerMove(event) {
      if (!motionActive || event.pointerType === 'touch' || hero.contains(document.activeElement)) return;
      pointer = { x: event.clientX, y: event.clientY };
      if (!depthFrame) depthFrame = window.requestAnimationFrame(renderDepth);
    }

    function updateNavigation() {
      navigationFrame = 0;
      if (closed || document.hidden) return;
      const headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
      const scrollPadding = parseFloat(window.getComputedStyle(root).scrollPaddingTop) || 0;
      let current = null;
      sections.forEach(section => {
        const scrollMargin = parseFloat(window.getComputedStyle(section).scrollMarginTop) || 0;
        // Match native anchor placement, including fractional pixel rounding.
        const threshold = Math.max(headerBottom, scrollPadding) + scrollMargin + 2;
        if (section.getBoundingClientRect().top <= threshold) current = section;
      });

      navigation.forEach(link => {
        if (current && hashTarget(link.hash) === current) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });

      // Fast scrolls may pass an entire target between observer samples.
      pending.forEach(target => {
        if (target.getBoundingClientRect().bottom <= 0) show(target);
      });

      if (!heroObserver) {
        heroVisible = isHeroVisible();
        updateMotion();
      }
    }

    function scheduleNavigation() {
      if (!closed && !document.hidden && !navigationFrame) {
        navigationFrame = window.requestAnimationFrame(updateNavigation);
      }
    }

    function onResize() {
      resetDepth();
      scheduleNavigation();
    }

    function onVisibilityChange() {
      if (document.hidden && navigationFrame) {
        window.cancelAnimationFrame(navigationFrame);
        navigationFrame = 0;
      }
      heroVisible = isHeroVisible();
      updateMotion();
      if (!document.hidden) scheduleNavigation();
    }

    function onMotionPreference() {
      if (reduced.matches) {
        targets.forEach(target => show(target, true));
        if (revealObserver) revealObserver.disconnect();
      }
      updateMotion();
    }

    function onHashClick(event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const element = event.target instanceof Element ? event.target : event.target && event.target.parentElement;
      const link = element ? element.closest('a[href]') : null;
      if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;

      let destination;
      try {
        destination = new URL(link.href, window.location.href);
      } catch {
        return;
      }
      if (destination.origin !== window.location.origin || destination.pathname !== window.location.pathname || destination.search !== window.location.search || !destination.hash) return;
      showHash(destination.hash);
      scheduleNavigation();
    }

    prepareReveals();
    if (window.location.hash) showHash(window.location.hash);
    showRelated(document.activeElement);

    if (hero && typeof window.IntersectionObserver === 'function') {
      try {
        heroObserver = new IntersectionObserver(entries => {
          heroVisible = entries[0].isIntersecting && entries[0].intersectionRatio > 0;
          updateMotion();
        }, { threshold: 0 });
        heroObserver.observe(hero);
      } catch {
        heroObserver = null;
      }
    }

    heroVisible = isHeroVisible();
    updateMotion();
    updateNavigation();

    listen(window, 'scroll', scheduleNavigation, { passive: true });
    listen(window, 'resize', onResize, { passive: true });
    listen(window, 'hashchange', () => {
      showHash(window.location.hash);
      scheduleNavigation();
    });
    listen(document, 'click', onHashClick);
    listen(document, 'focusin', event => showRelated(event.target));
    listen(document, 'visibilitychange', onVisibilityChange);
    watchPreference(reduced, onMotionPreference);
    watchPreference(finePointer, updateMotion);
    if (hero) {
      listen(hero, 'pointermove', onPointerMove, { passive: true });
      listen(hero, 'pointerleave', resetDepth, { passive: true });
      listen(hero, 'focusin', resetDepth);
      listen(hero, 'focusout', resetDepth);
    }

    return () => {
      closed = true;
      if (navigationFrame) window.cancelAnimationFrame(navigationFrame);
      navigationFrame = 0;
      resetDepth();
      if (hero) hero.classList.remove('motion-active');
      if (revealObserver) revealObserver.disconnect();
      if (heroObserver) heroObserver.disconnect();
      targets.forEach(target => show(target, true));
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
