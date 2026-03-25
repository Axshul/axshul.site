(function () {
  'use strict';

  // ── Helpers ──────────────────────────────────────────────────────────────

  function getReaderBody() {
    return document.querySelector('.reader-body');
  }

  function isInsideReaderBody(node) {
    var body = getReaderBody();
    if (!body || !node) return false;
    var current = node;
    while (current) {
      if (current === body) return true;
      current = current.parentNode;
    }
    return false;
  }

  function buildHighlightUrl(text) {
    var encoded = encodeURIComponent(text.trim());
    var url = new URL(window.location.href);
    url.searchParams.delete('highlight');
    url.hash = '';
    url.searchParams.set('highlight', text.trim());
    // Also append native Text Fragment for Chromium
    return url.toString() + '#:~:text=' + encoded;
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for older browsers / non-HTTPS
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  // ── Tooltip ───────────────────────────────────────────────────────────────

  var tooltip = null;

  function createTooltip() {
    tooltip = document.createElement('div');
    tooltip.id = 'ths-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.setAttribute('aria-label', 'Copy highlight link');
    tooltip.innerHTML = '<span class="ths-label">Share ↗</span>';
    document.body.appendChild(tooltip);
  }

  function showTooltip(rect) {
    if (!tooltip) return;
    var TOOLTIP_H = 36;
    var TOOLTIP_W = 90;
    var GAP = 8;

    // rect coords are viewport-relative; tooltip is position:fixed so no scrollY offset needed
    var top  = rect.top - TOOLTIP_H - GAP;
    var left = rect.left + (rect.width / 2) - (TOOLTIP_W / 2);

    // Clamp to viewport
    left = Math.max(8, Math.min(left, window.innerWidth  - TOOLTIP_W - 8));
    top  = Math.max(8, Math.min(top,  window.innerHeight - TOOLTIP_H - 8));

    tooltip.style.top  = top + 'px';
    tooltip.style.left = left + 'px';
    tooltip.classList.add('ths-visible');
  }

  function hideTooltip() {
    if (tooltip) tooltip.classList.remove('ths-visible');
  }

  // ── Selection detection ───────────────────────────────────────────────────

  function handleMouseUp() {
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) { hideTooltip(); return; }

    var text = sel.toString().trim();
    if (!text) { hideTooltip(); return; }

    if (!isInsideReaderBody(sel.anchorNode) || !isInsideReaderBody(sel.focusNode)) {
      hideTooltip();
      return;
    }

    var range = sel.getRangeAt(0);
    var rect  = range.getBoundingClientRect();
    showTooltip(rect);
  }

  // ── Tooltip click → copy URL ──────────────────────────────────────────────

  function handleTooltipClick() {
    var sel = window.getSelection();
    if (!sel) return;
    var text = sel.toString().trim();
    if (!text) return;

    var url = buildHighlightUrl(text);
    var label = tooltip.querySelector('.ths-label');

    copyToClipboard(url).then(function () {
      if (label) label.textContent = 'Copied!';
      setTimeout(function () {
        if (label) label.textContent = 'Share ↗';
      }, 2000);
    }).catch(function () {
      if (label) label.textContent = 'Failed';
      setTimeout(function () {
        if (label) label.textContent = 'Share ↗';
      }, 2000);
    });
  }

  // ── Sidebar share button override ─────────────────────────────────────────

  function overrideSidebarShare() {
    var btn = document.getElementById('share-btn');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var sel = window.getSelection();
      var text = sel ? sel.toString().trim() : '';
      var url;

      if (text && isInsideReaderBody(sel.anchorNode)) {
        url = buildHighlightUrl(text);
      } else {
        url = window.location.href;
      }

      var label = btn.querySelector('.bt');
      copyToClipboard(url).then(function () {
        if (label) label.textContent = 'Copied!';
        setTimeout(function () {
          if (label) label.textContent = 'Share Article';
        }, 2000);
      });
    });
  }

  // ── Restore highlight from URL ────────────────────────────────────────────

  function findAndHighlight(searchText) {
    var body = getReaderBody();
    if (!body || !searchText) return;

    var lower = searchText.toLowerCase();

    try {
      var walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null, false);
      var node;

      while ((node = walker.nextNode())) {
        var idx = node.nodeValue.toLowerCase().indexOf(lower);
        if (idx === -1) continue;

        var range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + searchText.length);

        var mark = document.createElement('mark');
        mark.className = 'ths-mark';
        range.surroundContents(mark);

        mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return; // only first match
      }
    } catch (e) {
      console.warn('[text-highlight-share] Could not restore highlight:', e);
    }
  }

  function restoreHighlight() {
    var params = new URLSearchParams(window.location.search);
    var raw = params.get('highlight');
    if (!raw) return;
    try {
      var text = decodeURIComponent(raw);
      if (text.trim()) findAndHighlight(text.trim());
    } catch (e) {
      console.warn('[text-highlight-share] Bad highlight param:', e);
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    createTooltip();
    tooltip.addEventListener('click', handleTooltipClick);

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('scroll', hideTooltip, { passive: true });

    // Hide tooltip when clicking outside the reader body
    document.addEventListener('mousedown', function (e) {
      if (tooltip && !tooltip.contains(e.target)) {
        hideTooltip();
      }
    });

    overrideSidebarShare();
    restoreHighlight();
  });

})();
