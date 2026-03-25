# Implementation Plan: text-highlight-share

## Overview

Implement the text-highlight-share feature incrementally: first create the test article, then build the JS module function-by-function (URL helpers → selection detection → tooltip → restore on load → sidebar integration), and finally wire everything together with CSS additions.

## Tasks

- [x] 1. Create the test article at `n8n/guide/test/index.html`
  - Copy the HTML structure from `n8n/guide/how-to-setup-n8n/index.html` as the template
  - Replace title, meta description, tags, heading, and body content with new placeholder prose (at least 4 paragraphs covering a different topic)
  - Keep all structural elements: `.reader-layout`, `.reader-main`, `.reader-body`, `.reader-sidebar`, Sidebar_Share_Button, reading-progress bar, footer
  - Keep the same asset references: `assets/css/n8n.css`, `assets/js/3d-anim.js`, Three.js CDN script
  - Add a `<script src="../../../assets/js/text-highlight-share.js" defer></script>` tag at the bottom of `<body>` (the module doesn't exist yet — this is just the reference)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Add CSS styles for the highlight marker and tooltip to `assets/css/n8n.css`
  - Append a `mark.ths-mark` rule with `background: #ffe066`, `color: inherit`, `border-radius: 2px`, `padding: 0 1px`, and a `ths-pulse` keyframe animation (from `#ffb300` to `#ffe066` over 1.2s)
  - Append an `#ths-tooltip` rule using `position: fixed`, `display: none`, design tokens (`--text`, `--font-sans`, `--r`), `box-shadow`, `z-index: 9999`, `user-select: none`
  - Append an `#ths-tooltip.ths-visible` rule that sets `display: flex`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 3. Create `assets/js/text-highlight-share.js` with URL utility functions
  - Scaffold the file as an IIFE: `(function() { ... })();`
  - Implement `buildHighlightUrl(text)`: strips any existing `?highlight=` param from `window.location.href`, then appends `?highlight=encodeURIComponent(text.trim())`; also appends `#:~:text=encodeURIComponent(text.trim())` as the hash
  - Implement `copyToClipboard(text)`: tries `navigator.clipboard.writeText(text)`, falls back to creating a temporary `<textarea>`, selecting its content, calling `document.execCommand('copy')`, and removing the element; returns a Promise in both paths
  - _Requirements: 4.1, 4.2, 4.3, 4.5, 7.2_

  - [ ]* 3.1 Write property test for URL round-trip (Property 1)
    - **Property 1: Highlight URL round-trip**
    - For any non-empty string, `decodeURIComponent` of the `?highlight=` param extracted from `buildHighlightUrl(text)` should equal `text.trim()`
    - Use fast-check `fc.string({ minLength: 1 })` generator; run 100+ iterations
    - **Validates: Requirements 4.1, 4.2, 5.1**
    - `// Feature: text-highlight-share, Property 1: Highlight URL round-trip`

  - [ ]* 3.2 Write property test for clipboard fallback (Property 7)
    - **Property 7: Clipboard fallback is always attempted**
    - Delete `navigator.clipboard` from the test environment; call `copyToClipboard` with any string; assert it resolves without throwing and `execCommand` was called
    - Use fast-check `fc.string()` generator; run 100+ iterations
    - **Validates: Requirements 4.5, 7.2**
    - `// Feature: text-highlight-share, Property 7: Clipboard fallback is always attempted`

- [ ] 4. Implement selection detection and tooltip logic in `text-highlight-share.js`
  - Implement `getReaderBody()`: returns `document.querySelector('.reader-body')` or null
  - Implement `isInsideReaderBody(node)`: walks `node.parentNode` chain to check if `.reader-body` is an ancestor
  - On `DOMContentLoaded`, create the `#ths-tooltip` div (with `.ths-label` span and `.ths-icon` span) and append it to `document.body`
  - Implement `showTooltip(rect)`: sets `#ths-tooltip` `top`/`left` using `rect` coordinates, clamped to viewport bounds (`Math.min`/`Math.max` against `window.innerWidth`/`window.innerHeight`); adds class `ths-visible`
  - Implement `hideTooltip()`: removes class `ths-visible`
  - Implement `handleMouseUp()`: calls `window.getSelection()`, checks `toString().trim()` is non-empty, checks `anchorNode` is inside Reader_Body via `isInsideReaderBody`, then calls `showTooltip` with `selection.getRangeAt(0).getBoundingClientRect()`; otherwise calls `hideTooltip`
  - Attach `handleMouseUp` to `document` `mouseup` event
  - Attach `hideTooltip` to `document` `scroll` event (hides on scroll to avoid stale positioning)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 4.1 Write property test for whitespace suppression (Property 2)
    - **Property 2: Whitespace selections are suppressed**
    - For any string matching `/^\s+$/`, simulate a selection with that text; assert `hideTooltip` is called and tooltip has no `ths-visible` class
    - Use fast-check `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` generator; run 100+ iterations
    - **Validates: Requirements 2.2**
    - `// Feature: text-highlight-share, Property 2: Whitespace selections are suppressed`

  - [ ]* 4.2 Write property test for out-of-body suppression (Property 3)
    - **Property 3: Out-of-body selections are ignored**
    - For any selection whose anchor node is outside `.reader-body`, assert tooltip stays hidden
    - Use fast-check to generate random DOM node references outside the reader body; run 100+ iterations
    - **Validates: Requirements 2.3**
    - `// Feature: text-highlight-share, Property 3: Out-of-body selections are ignored`

  - [ ]* 4.3 Write property test for tooltip viewport bounds (Property 6)
    - **Property 6: Tooltip stays within viewport**
    - For any DOMRect with arbitrary coordinates, after calling `showTooltip(rect)`, assert the tooltip's computed `top`/`left` keep it fully within `window.innerWidth` × `window.innerHeight`
    - Use fast-check `fc.record({ top: fc.integer(), left: fc.integer(), width: fc.nat(), height: fc.nat() })` generator; run 100+ iterations
    - **Validates: Requirements 3.4**
    - `// Feature: text-highlight-share, Property 6: Tooltip stays within viewport`

- [ ] 5. Implement tooltip click handler and sidebar share override
  - Add a `click` event listener on `#ths-tooltip`: reads `window.getSelection().toString().trim()`, calls `buildHighlightUrl`, calls `copyToClipboard`, then sets `.ths-label` text to `"Copied!"` and reverts after 2000ms via `setTimeout`
  - Implement `overrideSidebarShare()`: finds the Sidebar_Share_Button (`.ib-btn` containing `.bt` with text "Share Article"), replaces its `onclick` with a new handler that checks if a valid selection exists in Reader_Body — if yes, uses `buildHighlightUrl(selection)`, otherwise falls back to plain `window.location.href`; copies to clipboard and shows "Copied!" feedback on the button's `.bt` span
  - Call `overrideSidebarShare()` inside `DOMContentLoaded`
  - _Requirements: 4.3, 4.4, 4.6_

- [ ] 6. Checkpoint — Ensure selection, tooltip, and URL generation work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement highlight restoration on page load
  - Implement `findAndHighlight(searchText)`:
    - Create a `TreeWalker` on `getReaderBody()` with `NodeFilter.SHOW_TEXT`
    - Walk text nodes, accumulate their content, find the first case-insensitive match using `toLowerCase().indexOf()`
    - When a match is found, create a `Range`, call `range.setStart` / `range.setEnd` on the matching text node with the correct offsets, call `range.surroundContents(mark)` where `mark` is a `<mark class="ths-mark">` element
    - Call `mark.scrollIntoView({ behavior: 'smooth', block: 'center' })`
    - Wrap the entire function body in try/catch; on error, log a warning and return without modifying the DOM
  - Implement `restoreHighlight()`: reads `new URLSearchParams(window.location.search).get('highlight')`, decodes it, calls `findAndHighlight` if non-empty
  - Call `restoreHighlight()` inside `DOMContentLoaded`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1_

  - [ ]* 7.1 Write property test for TreeWalker finds first match (Property 4)
    - **Property 4: TreeWalker finds first match**
    - For any Reader_Body DOM containing at least one text node with the search string, `findAndHighlight` should insert exactly one `<mark class="ths-mark">` wrapping the first occurrence
    - Use fast-check to generate random paragraph content with the search string injected at a random position; run 100+ iterations
    - **Validates: Requirements 5.2, 5.3**
    - `// Feature: text-highlight-share, Property 4: TreeWalker finds first match`

  - [ ]* 7.2 Write property test for no match leaves DOM unchanged (Property 5)
    - **Property 5: No match leaves DOM unchanged**
    - For any Reader_Body DOM that does not contain the search string, `findAndHighlight` should leave the DOM with zero `<mark>` elements
    - Use fast-check to generate random body content and search strings guaranteed not to appear in the content; run 100+ iterations
    - **Validates: Requirements 5.5**
    - `// Feature: text-highlight-share, Property 5: No match leaves DOM unchanged`

- [ ] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests require fast-check (`npm install --save-dev fast-check`) and a jsdom-compatible test runner (Jest or Vitest)
- Each property test comment tag format: `// Feature: text-highlight-share, Property N: <property text>`
- The module is an IIFE — no module bundler needed; it works as a plain `<script>` tag
- The Sidebar_Share_Button override (task 5) must be robust to the button not being present on the page
