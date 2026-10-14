/** Shared masthead and inner-page motion. Native scrolling, no idle frame loop. */
(function () {
  'use strict';

  var body = document.body;
  var header = document.querySelector('.masthead.site-header');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var inner = body.matches('.site-inner, .site-article, .article-body');
  var frame = 0;
  var observer = null;
  var revealed = new WeakSet();
  var candidates = inner ? Array.prototype.slice.call(document.querySelectorAll(
    '.rv, .article-section, .article-row, .reader-header'
  )) : [];

  function updateHeader() {
    frame = 0;
    if (header) {
      header.classList.toggle('is-scrolled', window.scrollY > 32);
      if (inner) {
        var distance = document.documentElement.scrollHeight - window.innerHeight;
        var progress = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
        header.style.setProperty('--site-reading-progress', progress.toFixed(4));
      }
    }
  }

  function scheduleHeader() {
    if (!document.hidden && !frame) frame = window.requestAnimationFrame(updateHeader);
  }

  function show(el, instant) {
    el.classList.remove('site-reveal-pending');
    el.classList.toggle('site-reveal-entered', !instant && !motion.matches);
    revealed.add(el);
    if (observer) observer.unobserve(el);
  }

  function related(target, descendants) {
    if (!target) return;
    candidates.forEach(function (el) {
      if (el === target || el.contains(target) || (descendants && target.contains(el))) show(el, true);
    });
  }

  function revealHash() {
    if (!location.hash) return;
    try {
      var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      related(target, true);
    } catch (error) { /* An invalid fragment does not alter readable content. */ }
  }

  function prepareReveals() {
    if (observer) observer.disconnect();
    observer = null;
    if (motion.matches || typeof window.IntersectionObserver !== 'function') {
      candidates.forEach(function (el) { show(el, true); });
      return;
    }
    try {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) show(entry.target, false);
        });
      }, { rootMargin: '0px 0px -28px 0px', threshold: 0 });
    } catch (error) {
      candidates.forEach(function (el) { show(el, true); });
      return;
    }
    candidates.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (revealed.has(el) || rect.top < window.innerHeight || el.contains(document.activeElement)) {
        show(el, true);
      } else {
        el.classList.add('site-reveal-pending');
        observer.observe(el);
      }
    });
    revealHash();
  }

  function onFocus(event) { related(event.target, false); }
  function onVisibility() {
    if (document.hidden && frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    } else if (!document.hidden) scheduleHeader();
  }
  function onPageHide() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    if (observer) observer.disconnect();
  }
  function onPageShow(event) {
    if (event.persisted) prepareReveals();
    updateHeader();
  }

  // Navigation changes pages. The longest matching route wins, so a guide
  // article marks Guides without also marking its parent n8n hub.
  if (header) {
    var path = (location.hostname === 'blog.axshul.site' ? '/blog/' : location.pathname)
      .replace(/index\.html$/, '').replace(/\/$/, '') || '/';
    var pageLinks = Array.prototype.slice.call(header.querySelectorAll('.primary-nav a'));
    var currentLink = null;
    var currentLength = -1;
    pageLinks.forEach(function (link) {
      var destination = new URL(link.href, location.href);
      var route = destination.pathname.replace(/\/$/, '') || '/';
      if (!destination.hash && (path === route || (route !== '/' && path.indexOf(route + '/') === 0)) && route.length > currentLength) {
        currentLink = link;
        currentLength = route.length;
      }
    });
    pageLinks.forEach(function (link) {
      if (link === currentLink) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    var pages = header.querySelector('.site-pages');
    if (pages) {
      var summary = pages.querySelector('summary');
      pages.addEventListener('click', function (event) {
        if (event.target.closest('a[href]')) pages.open = false;
      });
      pages.addEventListener('focusout', function (event) {
        if (event.relatedTarget && !pages.contains(event.relatedTarget)) pages.open = false;
      });
      document.addEventListener('click', function (event) {
        if (pages.open && !pages.contains(event.target)) pages.open = false;
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && pages.open) {
          event.preventDefault();
          pages.open = false;
          summary.focus();
        }
      });
      window.addEventListener('pagehide', function () { pages.open = false; });
    }
  }

  window.addEventListener('scroll', scheduleHeader, { passive: true });
  window.addEventListener('resize', scheduleHeader, { passive: true });
  window.addEventListener('hashchange', revealHash);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);
  document.addEventListener('focusin', onFocus);
  document.addEventListener('visibilitychange', onVisibility);
  if (motion.addEventListener) motion.addEventListener('change', prepareReveals);
  else if (motion.addListener) motion.addListener(prepareReveals);
  updateHeader();
  prepareReveals();

  // Preserve the established webhook field names and endpoint. An opaque
  // no-cors response confirms no delivery status, so feedback makes no inbox
  // or receipt promise. Nothing is sent until the visitor submits the form.
  var form = document.getElementById('contactForm');
  var submit = document.getElementById('submitBtn');
  if (form && submit && !form.hasAttribute('data-site-handler')) {
    form.setAttribute('data-site-handler', '');
    var status = document.createElement('p');
    status.className = 'site-form-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    form.appendChild(status);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (submit.disabled || !form.reportValidity()) return;
      var name = form.elements.Name.value.trim();
      var email = form.elements.Email.value.trim();
      var message = form.elements.Message.value.trim();
      if (!name || !email || !message) return;
      var label = submit.querySelector('.btn-text');
      var original = label ? label.textContent : submit.textContent;
      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
      if (label) label.textContent = 'Sending...';
      status.textContent = '';
      var url = 'https://n8n.srv1419396.hstgr.cloud/webhook/website-form-sendAmessage?' +
        new URLSearchParams({ Name: name, Email: email, Message: message }).toString();
      fetch(url, { method: 'GET', mode: 'no-cors' }).then(function () {
        status.textContent = 'Message request sent. For delivery confirmation, email sales@axshul.site.';
        form.reset();
      }).catch(function () {
        status.textContent = 'Your request could not be sent. Try again or email sales@axshul.site.';
      }).then(function () {
        if (label) label.textContent = original;
        submit.disabled = false;
        submit.removeAttribute('aria-busy');
      });
    });
    // Enable submission only after the webhook handler is attached.
    // With no script, the HTML email fallback replaces the form.
    submit.disabled = false;
  }
})();
