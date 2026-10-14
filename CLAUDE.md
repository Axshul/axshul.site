# CLAUDE.md - axshul.site

## Project Overview

Personal portfolio and content hub for Anshul Namdev (axshul.site). A static, multi-page website with no build system or framework: pure HTML, CSS and vanilla JavaScript. Hosted through AquaHost (LiteSpeed, 148.113.8.71) at `https://axshul.site`. The GitHub repo is the source of truth only: it has **no GitHub Pages deployment**, so a push never changes the live site. The user handles AquaHost deployment. Push validated source to GitHub and provide a release archive with its commit and manifest; do not deploy hosting unless separately requested.

**Repository:** `https://github.com/Axshul/axshul.site.git`

## Hard rules

- Make all changes directly on `main`. Do not create feature branches for this repository.
- Preserve existing public page URLs, canonicals, article anchors and published media URLs. The homepage must retain `#hero`, `#community` and `#journey` compatibility targets.
- **No em-dashes anywhere** on the site (HTML, JS, JSON, XML). Use a comma, a colon, or " - ". En-dashes for ranges are fine.
- Brand colours stay: black / white, red `#D72638`. The approved site uses ink `#111210` and off-white `#FAFBF8` across every public route. Red is a rare signal, never a fill for whole sections.
- Every public page uses the same white capsule header with real page links: `About /about/ · Work /work/ · Journey /experience/ · n8n /n8n/ · Guides /n8n/guide/ · Blog /blog/`, plus one "Let's talk" CTA to `/contact/`. The homepage header must open those pages rather than substitute section fragments. Keep the wordmark and native links usable without JavaScript.
- The native Pages directory uses `details`/`summary` and 17 links: Home, the six primary pages, Thoughts, Photos (`/#moments`), Galaxy, Nexus, Notes, Seek, Terminal, Privacy, Cookies and Terms. Contact remains the header CTA. Articles are reached through Guides or Thoughts. Escape returns focus to the Pages summary; outside clicks and focus leaving the directory close it without trapping focus. The longest matching route wins the active primary marker, so guide articles mark Guides without also marking n8n.
- Exclude development prototypes, source photos, saved community snapshots and private files from releases. Retain previously published asset URLs even when the current layout no longer references those files.
- Legal pages (`/privacy/`, `/cookies/`, `/terms/`) must stay truthful: any new form, storage, embed, analytics or third-party request has to be added to them and the date bumped before it ships. Every page links to all three, including the footer row on portfolio pages, `footer-links` on guide/thoughts pages, and the legal rail below tool workspaces.

## Architecture

### Stack
- **HTML5**, one `index.html` per route directory
- **CSS3**: `landing.css` supplies the local fonts and homepage base; `landing-motion.css`, `landing-gallery.css`, and `landing-scroll.css` add homepage effects. `site.css` supplies the shared header, page directory, white base components and inner reveals. `pages-white.css` provides dedicated portfolio, hub, blog, legal and 404 layouts. `reader-white.css` provides dedicated guide/thought archives and article layouts over their existing structural CSS. Tools load `apps-white.css` for the white shell and `tools-white.css` for their distinct workspaces.
- **Vanilla JS**: `assets/js/landing.js` + `landing-gallery.js` + `landing-scroll.js` handle homepage reveals, scroll choreography and the photo viewer. `assets/js/site.js` handles shared page navigation, the Pages directory, inner reveals and the contact form. `text-highlight-share.js` and page scripts retain article search, reading progress and sharing. Legacy `hive.js` and decorative `3d-anim.js` are no longer loaded by public pages.
- **Fonts:** homepage Barlow Condensed, Space Grotesk and IBM Plex Mono are local Latin WOFF2 files in `assets/fonts/landing/`, with SIL OFL licenses. All default page and tool fonts are self-hosted. Notes requests Google Fonts only for explicitly selected optional fonts.
- **External deps:** Three.js for Galaxy's functional canvas, Fabric.js and other tool libraries, and Hacker News API for the blog. Decorative Three.js was removed from articles. The homepage loads no third-party assets.

### No build step
Serve the folder over HTTP with a static server (`python3 -m http.server`). Page and asset URLs are root relative, so opening production HTML through `file://` is not a supported preview. No `package.json`.

## Directory Structure

```
axshul.site/
├── index.html               # Approved white portfolio landing page
├── about/ work/ experience/ contact/ blog/   # Portfolio pages with shared white theme, edit HTML directly
├── thoughts/                # Dedicated reading-room archive and opinion articles
├── n8n/
│   ├── index.html           # Automations hub
│   └── guide/               # Guide index + one directory per article
├── Galaxy/ Nexus/ Notes/ Seek/ Terminal/     # Side projects
├── community-1|2|3/         # Saved n8n community page snapshots (POC, not linked, not in sitemap)
├── assets/
│   ├── css/                 # Homepage, shared site, pages-white, reader-white and tools-white styles
│   ├── js/                  # Homepage effects, site.js, article utilities and retained legacy files
│   ├── fonts/landing/       # Self-hosted site fonts + OFL licenses
│   ├── img/  anshul-namdev.jpg (OG image), n8n-community.png
│   │   └── event/  n8n Builders Challenge photos (HCMC, 19 Sep 2026), <slug>-lg.jpg 1600px + <slug>-sm.jpg 800px, EXIF stripped
│   └── favicon/
├── MyMTWphoto.jpeg          # Hero portrait (local; the old Cloudinary copy was deleted)
├── _uploads/                # git-ignored: absolute-URL blog copy for blog.axshul.site
├── privacy/ cookies/ terms/  # Legal pages with shared white theme
├── 404.html                 # Branded not-found page (absolute URLs, noindex), wired via .htaccess ErrorDocument
├── .htaccess                # 404 mapping, hides source-only files, image caching
├── scripts/                 # Local static navigation, route, metadata and syntax checks
├── robots.txt, sitemap.xml, LICENSE
```

## Homepage (`assets/css/landing.css`, `landing-motion.css`, `assets/js/landing.js`)

White rounded hero stage, oversized two-line name, real event photo and folded hexagonal leaderboard seal. Homepage sections: About (community evidence in native details), From the room (7 selected event photos), Selected work, n8n guides and mail contact. Do not add Nexus or Neural Notes to homepage material. Keep content in HTML and the full name readable at every breakpoint.

CSS provides a brief entrance, layered hex geometry and wire draw. Scroll choreography progressively fills the outlined surname, moves the two name rows in opposite directions, and traces section transitions. A slim reading line follows page progress. JS adds one-time reveals only to below-fold content and bounded pointer depth on desktop. The header uses actual page navigation; hero buttons and local section links can still navigate within the homepage. Ambient motion pauses offscreen and while the document is hidden. Reduced-motion preferences skip motion; focused content and hash targets reveal immediately. No loader, scroll hijacking, cursor replacement, storage or API calls.

The curated photo sheet uses one portrait anchor, sticky copy, paper-frame entrances and bounded opposing card drift on desktop, then a normal responsive grid on phones. Seven selected event photos are actual lazy-loaded `img` elements with responsive small/large exports and accurate scene descriptions. Each links to its larger original. A native dialog adds keyboard navigation, Escape/close and focus return, with native links as the no-JS fallback. The hero photo opens its matching gallery frame. Person/ProfilePage/image metadata and the homepage image sitemap use those existing stable URLs. Do not turn event props into claims that Anshul won an award or held an ambassador role.

Focus reveals only the card containing the focused element. Hash navigation can reveal the target's descendants. Initial focus is often `BODY`, which must not clear every pending photo entrance.

## Dedicated page systems

Portfolio, hub, blog, legal and 404 pages use `body.site-inner.dedicated-page` with `pages-white.css` loaded after `landing.css`, `landing-motion.css` and `site.css`. Each page has its own cover, local navigation and content composition. The old black HIVE CSS, loader, cursor and honeycomb canvas are retired from public pages. Some structural class names remain, but their current design comes from the white styles.

Guide and Thoughts archives use `body.reader-white-archive`; article pages use `body.site-article.reader-white-page`. `reader-white.css` loads last over the existing `n8n.css` or inline structural styles. Keep every article's text, anchors, tables, FAQ controls, metadata, search and reading utilities intact when editing its layout.

Tools use `body.site-app` and their `app-*` class. `apps-white.css` defines the shared shell, while `tools-white.css` defines distinct paper workspaces. Header height is 86px on desktop and 116px at widths up to 700px, consistently subtracted from app workspace sizing. Preserve saved Notes preferences and notes, Galaxy's adapter/IndexedDB thoughts, Nexus object data and URL state, Seek's optional audio and image controls, and Terminal's commands. Functional canvases can retain their own rendering and coordinates.

The shared logo drawing, site-name entrance, hover turn and navbar feedback are finite CSS effects. Header and Pages controls have at least 44px target height; primary links also have 44px minimum width. Shared scroll work is event driven. Content is visible without JavaScript, reduced motion removes transitions, and focused or fragment-targeted content is revealed immediately.

## Key Patterns

### Contact form
`#contactForm` on `/contact/` sends Name / Email / Message as GET params to the n8n webhook `https://n8n.srv1419396.hstgr.cloud/webhook/website-form-sendAmessage` with `mode: 'no-cors'`. Handled once in `site.js`, with truthful request feedback because the opaque response cannot verify delivery. Invalid or blank input sends nothing; pending requests disable duplicate submissions; a failed request preserves the draft. The homepage uses a `mailto:` link and has no form. Validation uses stubbed requests, never a real submission.

### SEO
Every page: canonical, Open Graph, Twitter card, JSON-LD (Person / BreadcrumbList / Article as relevant), the shared favicon set, author "Anshul Namdev". `sitemap.xml` lists every real page with image extensions; `robots.txt` allows everything.

## Content

- **n8n hub** (`/n8n/`): external certificate-verification link, ecosystem links, workflow showcase and a three-photo event strip.
- **n8n guide** (`/n8n/guide/`): searchable reading-room archive, with one directory per article. Articles retain their structural styles and `text-highlight-share.js`, with `reader-white.css` providing the current layout. Keep model lists current; only list models that are live on each provider.
- **Thoughts** (`/thoughts/`): a dedicated archive and opinion pieces in the reading-room design.
- **Blog**: `/blog/` page plus external `https://blog.axshul.site`. The subdomain is a separate host with its own copy of the page and none of the repo assets, whose document root is this repo's `blog/` folder, so `/blog/index.html` uses absolute `https://axshul.site/...` URLs for every asset and link (it is served from two hosts).

## Social Links
- GitHub `https://github.com/axshul`
- LinkedIn `https://www.linkedin.com/in/anshul-namdev-b149b5329/`
- Twitter/X `https://twitter.com/Anshul_Namdev0`
- n8n Community `https://community.n8n.io/u/Anshul_Namdev`
- Email `sales@axshul.site`
- Joint venture `https://qixazow.com`

## Photos

Source photos live in `drive-download-*/` at the repo root (git-ignored, never deploy). Exports go to `assets/img/event/` via PIL: `ImageOps.exif_transpose`, thumbnail to 1600 / 800 px long edge, JPEG q80 / q78 progressive, no EXIF. Photo components: `.ph` (framed photo + `.ph-cap` caption; aspect classes `.ph-wide .ph-tall .ph-band .ph-sq .ph-54`), `.hx` inside `.hxg` (honeycomb photo cluster), `.strip-photos`. Tune the crop per image with an inline `object-position`. Anshul is the person in the black n8n T-shirt with glasses (not the striped polo); `hcmc-mic` and `hcmc-screen-seat` are pre-cropped around him.

## Development Notes

- Preview: `python3 -m http.server 8890` from the repo root (the desktop app's launch config serves the same folder on 8888).
- Release: package every public route, its dependencies and previously published compatibility assets. Record the exact source commit and checksums alongside the archive. Existing ignored `_uploads/` archives and deletion lists can be stale; do not use them without checking their source revision. Do not delete published URLs during a redesign.
- Work on `main` only. Preserve pending changes, route paths, article fragment IDs, original media URLs and app state. Do not create a feature branch or rename published routes during a redesign.
- When adding a portfolio page: copy the current header/footer, load `landing.css`, `landing-motion.css`, `site.css`, then `pages-white.css`, and defer `site.js`. Give the page a real content composition, add metadata and its route to `sitemap.xml`, and make it reachable through native HTML links. Tools also use `apps-white.css` and `tools-white.css`, retaining their functional JavaScript.
- When adding a guide article: create `/n8n/guide/<slug>/index.html`, load `reader-white.css` last, and add a native link in the guide index plus the URL in `sitemap.xml`.
- Commit style: short imperative subject (e.g. `Fix hero image CDN 404`, `+ Article + sitemap updated`).

## Validation and release

Run `python3 scripts/check-site.py` for public routes, local references, metadata, legal links and JavaScript syntax. It also requires six actual page URLs in every primary header, the Contact CTA, the native 17-link Pages directory, and HTML-link reachability from home for every public page except 404. This prevents a one-page header from silently replacing the separate pages. See `scripts/README.md` for the report and command options.

Browser validation covers all 30 public HTML documents at desktop and phone widths, navigation and Pages keyboard behavior, guide search, article anchors, the photo viewer, Notes save/reload, Galaxy save/reload, Nexus drawing/properties and Terminal commands. Contact checks use stubs and never send a real message. Community snapshots and source photos are development records and are not included in the release. Keep source changes on `main`. A GitHub push is source publication, not a live hosting deployment.
