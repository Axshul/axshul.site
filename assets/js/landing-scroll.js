/* Native-scroll choreography. Frames are requested only when the page changes. */
(() => {
  'use strict';

  const root = document.documentElement;
  let dispose = null;

  const clamp = value => Math.min(1, Math.max(0, value));
  const precision = value => String(Math.round(value * 1000) / 1000);

  function enhance() {
    const hero = document.querySelector('.hero-stage');
    const header = document.querySelector('.masthead');
    const sections = Array.from(document.querySelectorAll('[data-scroll-section]'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const compact = window.matchMedia('(max-width: 700px)');
    const removers = [];
    const previous = new WeakMap();
    let frame = 0;
    let closed = false;

    function listen(target, event, handler, options) {
      target.addEventListener(event, handler, options);
      removers.push(() => target.removeEventListener(event, handler, options));
    }

    function watch(query, handler) {
      if (typeof query.addEventListener === 'function') listen(query, 'change', handler);
      else if (typeof query.addListener === 'function') {
        query.addListener(handler);
        removers.push(() => query.removeListener(handler));
      }
    }

    function write(target, name, value) {
      if (!target) return;
      let values = previous.get(target);
      if (!values) {
        values = new Map();
        previous.set(target, values);
      }
      if (values.get(name) === value) return;
      values.set(name, value);
      target.style.setProperty(name, value);
    }

    function reset() {
      root.classList.remove('scroll-choreography');
      write(root, '--reading-progress', '0');
      write(hero, '--hero-scroll', '0');
      sections.forEach(section => {
        write(section, '--section-progress', '0');
        write(section, '--heading-shift', '0px');
      });
    }

    function render() {
      frame = 0;
      if (closed || document.hidden || reduced.matches) return;

      // Read the complete geometry before writing styles. Five sections are
      // inexpensive enough to avoid an observer or an offscreen animation loop.
      const viewportHeight = window.innerHeight;
      const scrollTop = window.scrollY || window.pageYOffset || 0;
      const documentHeight = Math.max(root.scrollHeight, document.body ? document.body.scrollHeight : 0);
      const headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
      const heroBounds = hero ? hero.getBoundingClientRect() : null;
      const focused = document.activeElement;
      const maxShift = compact.matches ? 6 : 18;
      const sectionValues = sections.map(section => {
        const bounds = section.getBoundingClientRect();
        const distance = Math.max(1, Math.min(bounds.height, viewportHeight) * .85);
        const progress = clamp((viewportHeight * .78 - bounds.top) / distance);
        const shift = section.contains(focused) ? 0 : (1 - progress) * maxShift;
        return { section, progress: precision(progress), shift: `${precision(shift)}px` };
      });
      const reading = precision(clamp(scrollTop / Math.max(1, documentHeight - viewportHeight)));
      const heroProgress = heroBounds && !hero.contains(focused)
        ? precision(clamp((headerBottom - heroBounds.top) / Math.max(1, heroBounds.height)))
        : '0';

      root.classList.add('scroll-choreography');
      write(root, '--reading-progress', reading);
      write(hero, '--hero-scroll', heroProgress);
      sectionValues.forEach(({ section, progress, shift }) => {
        write(section, '--section-progress', progress);
        write(section, '--heading-shift', shift);
      });
    }

    function schedule() {
      if (!closed && !frame && !document.hidden && !reduced.matches) {
        frame = window.requestAnimationFrame(render);
      }
    }

    function cancelFrame() {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
    }

    function onPreference() {
      cancelFrame();
      if (reduced.matches) reset();
      else schedule();
    }

    function onVisibility() {
      if (document.hidden) cancelFrame();
      else schedule();
    }

    function onFocus(event) {
      if (hero && hero.contains(event.target)) write(hero, '--hero-scroll', '0');
      schedule();
    }

    listen(window, 'scroll', schedule, { passive: true });
    listen(window, 'resize', schedule, { passive: true });
    listen(window, 'hashchange', schedule);
    listen(document, 'visibilitychange', onVisibility);
    listen(document, 'focusin', onFocus);
    listen(document, 'focusout', schedule);
    watch(reduced, onPreference);
    watch(compact, schedule);

    // Initial layout may settle again once the local display font finishes.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule).catch(() => {});
    if (reduced.matches) reset();
    else render();

    return () => {
      closed = true;
      cancelFrame();
      removers.forEach(remove => remove());
      reset();
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
