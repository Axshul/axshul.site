# Requirements Document

## Introduction

The text-highlight-share feature allows readers of articles in the `/n8n/guide/` section to select any passage of text, share a URL that encodes that selection, and have recipients land on the page with the referenced text automatically highlighted and scrolled into view. A test article at `n8n/guide/test/index.html` will serve as the implementation target, following the same structural template as existing articles.

## Glossary

- **Article_Page**: A standalone `index.html` file inside `n8n/guide/*/` that renders article content inside a `.reader-body` div.
- **Test_Article**: The new article created at `n8n/guide/test/index.html` used as the implementation target.
- **Reader_Body**: The `.reader-body` div element that contains the readable article content.
- **Selection**: A non-empty range of text chosen by the user via mouse drag or keyboard within the Reader_Body.
- **Share_Tooltip**: A small floating UI element that appears near an active Selection and contains a share action.
- **Highlight_Fragment**: The URL component (query parameter `?highlight=`) that encodes the selected text for sharing.
- **Highlight_Marker**: A `<mark>` element wrapping matched text in the Reader_Body to provide visual emphasis on page load.
- **Highlight_JS**: The new JavaScript module at `assets/js/text-highlight-share.js` that implements the feature.
- **Sidebar_Share_Button**: The existing `<button>` in the article sidebar that copies `window.location.href` to the clipboard.
- **Text_Fragments_API**: The browser-native `#:~:text=` URL mechanism supported in Chromium-based browsers.

---

## Requirements

### Requirement 1: Test Article Creation

**User Story:** As a developer, I want a test article at `n8n/guide/test/index.html`, so that I have a consistent, controlled page on which to develop and verify the highlight-share feature.

#### Acceptance Criteria

1. THE Test_Article SHALL exist at the path `n8n/guide/test/index.html`.
2. THE Test_Article SHALL follow the same HTML structure as existing Article_Pages, including the `<nav>`, `.reader-layout`, `.reader-main`, `.reader-body`, `.reader-sidebar`, and footer elements.
3. THE Test_Article SHALL include at least four paragraphs of varied prose content inside the Reader_Body to provide sufficient text for selection testing.
4. THE Test_Article SHALL include the same CSS and JS asset references (`assets/css/n8n.css`, `assets/js/3d-anim.js`) as existing Article_Pages.
5. THE Test_Article SHALL include the Sidebar_Share_Button with the same markup pattern as existing Article_Pages.

---

### Requirement 2: Selection Detection

**User Story:** As a reader, I want the site to detect when I highlight text in an article, so that a sharing option can be offered to me.

#### Acceptance Criteria

1. WHEN a user completes a text selection within the Reader_Body, THE Highlight_JS SHALL detect the Selection via the `mouseup` event.
2. WHEN the Selection is empty or contains only whitespace, THE Highlight_JS SHALL suppress any share UI and take no further action.
3. WHEN the Selection extends outside the Reader_Body, THE Highlight_JS SHALL ignore it and take no further action.
4. WHEN the user clears a Selection by clicking elsewhere, THE Highlight_JS SHALL hide the Share_Tooltip.

---

### Requirement 3: Share Tooltip Display

**User Story:** As a reader, I want a small share button to appear near my text selection, so that I can easily copy a highlight link without leaving the reading flow.

#### Acceptance Criteria

1. WHEN a valid Selection exists within the Reader_Body, THE Highlight_JS SHALL display the Share_Tooltip positioned near the end of the Selection.
2. THE Share_Tooltip SHALL be positioned so that it does not obscure the selected text.
3. THE Share_Tooltip SHALL contain a visible label (e.g. "Share") and a copy icon or arrow glyph.
4. WHILE the Share_Tooltip is visible, THE Share_Tooltip SHALL remain within the visible viewport and not overflow the page edges.
5. WHEN the page is scrolled while a Selection is active, THE Highlight_JS SHALL reposition or hide the Share_Tooltip to remain consistent with the Selection position.

---

### Requirement 4: Highlight URL Generation

**User Story:** As a reader, I want clicking the share button to copy a URL that encodes my selected text, so that I can send a link that points directly to that passage.

#### Acceptance Criteria

1. WHEN a user clicks the Share_Tooltip, THE Highlight_JS SHALL construct a URL using the current `window.location.href` base with the selected text appended as `?highlight=<percent-encoded-text>`.
2. THE Highlight_JS SHALL percent-encode the selected text using `encodeURIComponent` before appending it to the URL.
3. WHEN a user clicks the Share_Tooltip, THE Highlight_JS SHALL write the constructed URL to the clipboard using `navigator.clipboard.writeText`.
4. WHEN the clipboard write succeeds, THE Share_Tooltip label SHALL change to a confirmation message (e.g. "Copied!") for 2 seconds before reverting.
5. IF the clipboard API is unavailable, THEN THE Highlight_JS SHALL fall back to `document.execCommand('copy')` on a temporary input element.
6. WHEN the Sidebar_Share_Button is clicked and a valid Selection exists within the Reader_Body, THE Highlight_JS SHALL override the default share URL with the highlight URL (including `?highlight=` parameter) instead of the plain `window.location.href`.

---

### Requirement 5: Highlight Restoration on Page Load

**User Story:** As a recipient of a highlight link, I want the referenced text to be highlighted and scrolled into view when I open the URL, so that I can immediately see the passage the sender intended.

#### Acceptance Criteria

1. WHEN the page loads and the URL contains a `?highlight=` parameter, THE Highlight_JS SHALL decode the parameter value using `decodeURIComponent`.
2. WHEN a decoded highlight value is present, THE Highlight_JS SHALL search the Reader_Body text nodes for the first occurrence of that string using a case-insensitive match.
3. WHEN a match is found, THE Highlight_JS SHALL wrap the matched text range in a `<mark>` element to create a Highlight_Marker.
4. WHEN a Highlight_Marker is created, THE Highlight_JS SHALL scroll the Highlight_Marker into view smoothly.
5. IF no match is found for the decoded highlight value, THEN THE Highlight_JS SHALL take no action and leave the page in its default state.
6. WHERE the browser supports the Text_Fragments_API (`#:~:text=`), THE Highlight_JS SHALL also append the native fragment to the URL so that Chromium browsers apply their native highlight in addition to the custom one.

---

### Requirement 6: Highlight Visual Style

**User Story:** As a recipient of a highlight link, I want the highlighted text to be visually distinct, so that I can immediately identify the referenced passage.

#### Acceptance Criteria

1. THE Highlight_Marker SHALL have a yellow background color that contrasts clearly against the article's white background (`--bg: #ffffff`).
2. THE Highlight_Marker SHALL preserve the original text color and font properties of the surrounding content.
3. THE Share_Tooltip SHALL use the site's existing design tokens (`--blue`, `--font-sans`, `--bg-off`, `--border`) to remain visually consistent with the article page.
4. THE Share_Tooltip SHALL have a visible drop shadow or border to distinguish it from the article content beneath it.
5. WHEN the Highlight_Marker is scrolled into view, THE Highlight_JS SHALL apply a brief CSS transition or animation to draw the reader's attention to the highlighted passage.

---

### Requirement 7: Cross-Browser Compatibility and Graceful Degradation

**User Story:** As a reader using any modern browser, I want the feature to work reliably, so that I am not blocked by browser-specific limitations.

#### Acceptance Criteria

1. THE Highlight_JS SHALL implement highlight restoration using a `TreeWalker`-based text node search as the primary mechanism, independent of the Text_Fragments_API.
2. IF the `navigator.clipboard` API is unavailable, THEN THE Highlight_JS SHALL use the `document.execCommand('copy')` fallback without throwing an unhandled error.
3. THE Highlight_JS SHALL function correctly in the latest versions of Chrome, Firefox, and Safari.
4. IF JavaScript is disabled, THEN THE Article_Page SHALL remain fully readable with no broken UI elements visible.
