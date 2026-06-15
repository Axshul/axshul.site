# CLAUDE.md — axshul.site

## Project Overview

Personal portfolio and content hub for Anshul Namdev (axshul.site). A static, multi-page website with no build system or framework — pure HTML, CSS, and vanilla JavaScript. Hosted on GitHub Pages at `https://axshul.site`.

**Repository:** `https://github.com/Axshul/axshul.site.git`

## Architecture

### Stack
- **HTML5** — static pages, one `index.html` per route directory
- **CSS3** — three stylesheets: `style.css` (main), `n8n.css` (automations hub), `blog.css` (blog)
- **Vanilla JS** — no frameworks, no bundler, no npm
- **External deps:** Google Fonts (Playfair Display, Roboto Condensed), Three.js (CDN, n8n page 3D canvas), n8n demo web component (CDN), Calendly widget (contact page)

### No build step
Open any HTML file directly or serve with any static server. There is no `package.json`, no compilation, no transpilation.

## Directory Structure

```
axshul.site/
├── index.html              # Homepage — hero, about, work, experience, contact sections
├── about/index.html         # Detailed bio page (data-graphic-shape="square")
├── work/index.html          # Projects showcase (data-graphic-shape="triangle")
├── experience/index.html    # Timeline career journey (data-graphic-shape="semicircle")
├── contact/index.html       # Calendly + contact form (data-graphic-shape="rectangle")
├── blog/index.html          # Blog with Hacker News feed integration
├── n8n/                     # Automations hub
│   ├── index.html           # n8n landing — verifier, ecosystem bento, workflow showcase
│   └── workflows.json       # Workflow data for n8n demo components
├── Galaxy/index.html        # Experimental side project
├── Nexus/index.html         # Infinite canvas tool for AI engineers
├── Notes/index.html         # AI note-taking app
├── Seek/index.html          # Minimalist art gallery (2019)
├── Terminal/index.html      # H4CK3R terminal interactive game
├── assets/
│   ├── css/
│   │   ├── style.css        # Main design system (~1584 lines)
│   │   ├── n8n.css          # Automations hub styles (~3764 lines)
│   │   └── blog.css         # Blog page styles (~1140 lines)
│   ├── js/
│   │   ├── script.js         # Core: loader, scroll observer, navbar, mobile menu, parallax
│   │   ├── scroll-3d.js      # 3D rotating geometric graphic (shape varies per page via data-graphic-shape)
│   │   ├── contact-form.js   # Contact form submission to n8n webhook
│   │   ├── n8n.js            # Automations page: certificate verifier, scroll fade, nav state
│   │   ├── 3d-anim.js        # Three.js 3D canvas animation (n8n page hero)
│   │   ├── blog.js           # Blog page logic
│   │   ├── blog-data.js      # Blog post data
│   │   ├── blog-fetcher.js   # HN/external content fetcher
│   │   ├── n8n-article.js    # Article reader logic
│   │   ├── n8n-guide.js      # Guide listing logic
│   │   └── text-highlight-share.js # Text selection sharing
│   ├── img/                  # Project thumbnails, profile photo
│   └── favicon_io/           # Favicon set + webmanifest
├── robots.txt               # Allow all
├── sitemap.xml              # Comprehensive XML sitemap with image extensions
└── LICENSE                  # GPL-3.0
```

## Design System

### Theme: "Interludio High-Fidelity"
- **Background:** `#ffffff` with subtle radial vignette
- **Text primary:** `#050505` (deep black)
- **Text secondary:** `#666`
- **Accent:** `#0044FF` (Electric Blue) — used universally for CTAs, links, borders, highlights
- **Border:** `#e0e0e0`

### Typography
- **Serif (headings):** Playfair Display — weights 400/500/600, italic used for emphasis
- **Sans-serif (body):** Roboto Condensed — weights 300/400/700
- **Monospace (n8n page):** JetBrains Mono (loaded only on /n8n/)

### CSS Variables (defined in `:root` of `style.css`)
```css
--bg-color: #ffffff;
--text-primary: #050505;
--text-secondary: #666;
--accent-blue: #0044FF;
--border-light: #e0e0e0;
--font-serif: 'Playfair Display', serif;
--font-sans: 'Roboto Condensed', sans-serif;
--container-width: 1400px;
--spacing-xl: 10rem;
```

### Layout Conventions
- Max container width: 1400px, 4rem horizontal padding
- Section padding: `var(--spacing-xl)` (10rem) top/bottom
- Grid-based layouts throughout (CSS Grid, not flexbox-first)
- Responsive breakpoints: 1024px, 768px, 480px
- Mobile-first responsive adjustments via `@media (max-width: ...)`

## Key Patterns

### Page Loading
Every page has a `.loader` overlay that animates a line to 100% width, then fades out after 800ms. Body starts with class `loading`, gets `loaded` after loader completes.

### Scroll Animations
Elements with `[data-scroll]` attribute get `.is-visible` class when scrolled into view (1.15 viewport offset). The scroll handler is debounced via `requestAnimationFrame`.

### 3D Hero Graphic (`scroll-3d.js`)
Each subpage sets `data-graphic-shape` on `<body>` to render a different geometric shape:
- Default (homepage): circle
- `square`: about page
- `triangle`: work page
- `rectangle`: contact page
- `semicircle`: experience page
- `diamond`: available but unused

The graphic responds to scroll position with drift, scale, spin, and 3D rotation.

### Navigation
- Logo: "AN." links to root
- Subpages use relative paths (`../`, `./`) for navigation
- Mobile hamburger menu: `.mobile-toggle` toggles `.nav-links.active`
- Navbar gets `.scrolled` class when `scrollY > 50` (except subpages which start scrolled)

### Contact Form
The `.integrated-contact-form` sends form data as GET query params to an n8n webhook at `https://n8n.srv1419396.hstgr.cloud/webhook/website-form-sendAmessage`. Uses `mode: 'no-cors'` — success is assumed on response. Both homepage and /contact/ page share this form handled by `contact-form.js`.

### SEO
- Every page has canonical URLs, Open Graph, Twitter Card meta tags
- JSON-LD structured data: Person, WebSite (with SearchAction), BreadcrumbList, ContactPage, ProfilePage
- Comprehensive `sitemap.xml` with image extensions
- `robots.txt`: fully permissive

## Content Sections

### n8n Hub (`/n8n/`)
A dedicated automation portal with:
- **Certificate Verifier** — validates n8n course completion certificates via n8n Learn webhooks (Level 1 & 2)
- **Ecosystem bento grid** — links to n8n docs, courses, community
- **Workflow Showcase** — renders n8n workflows using `<n8n-demo>` web component with data from `workflows.json`
- **Nexus** — link to the infinite canvas tool
- **Three.js** hero animation via `3d-anim.js`
- Has its own CSS (`n8n.css`) and JS (`n8n.js`) separate from main site

### Blog (`/blog/`)
- Blog listing page with Hacker News integration
- Uses `blog.css`, `blog.js`, `blog-data.js`, `blog-fetcher.js`
- Articles are in the n8n guide section (not traditional blog posts)

### n8n Guide Articles
Extensive article library at `/n8n/guide/` covering:
- Getting started (what is n8n, first workflow, setup)
- Hosting (cloud vs self-hosted, VPS, cloud plans)
- Editions (community edition, licensing)
- AI (choosing models, inference providers, agent node, vector stores, RAG, Claude integration)
- Community help resources
- Opinion pieces (e.g., "Is n8n Dead?")

## External Integrations
- **n8n webhook** (Hostinger VPS): contact form submissions
- **Calendly**: meeting scheduling embed on /contact/
- **LinkedIn embed**: post iframe on homepage and work page
- **CodeProb**: iframe profile embed on work page
- **n8n Learn webhooks**: certificate verification on /n8n/

## Social Links
- GitHub: `https://github.com/axshul`
- LinkedIn: `https://www.linkedin.com/in/anshul-namdev-b149b5329/`
- Twitter/X: `https://twitter.com/Anshul_Namdev0` (`@Anshul_Namdev0`)
- n8n Community: `https://community.n8n.io/u/Anshul_Namdev`
- Email: `sales@axshul.site`
- Joint venture: `https://qixazow.com`

## Development Notes

### Working with this codebase
- No dev server needed — open HTML files directly or use any static server (`python -m http.server`, Live Server extension, etc.)
- CSS is hand-written, not generated — edit the source CSS files directly
- All JS is vanilla — no transpilation, modules, or imports (everything is script-tag loaded)
- Inline `<style>` blocks in HTML pages contain page-specific overrides (especially Qixazow card styles, which are duplicated in both `index.html` and `work/index.html`)

### When adding a new page
1. Create a `pagename/index.html` directory structure
2. Include the standard head boilerplate (meta, OG, Twitter, favicon, fonts, style.css)
3. Add JSON-LD structured data (at minimum BreadcrumbList)
4. Include `script.js` and `scroll-3d.js` at bottom
5. Set `data-graphic-shape` on `<body>` if a unique hero graphic is wanted
6. Add nav with relative paths and proper `.active` class
7. Add entry to `sitemap.xml`

### When adding an n8n guide article
1. Article content lives under `/n8n/guide/article-slug/`
2. Add the article URL to `sitemap.xml` under the n8n Guide Articles section
3. Update the guide listing (rendered by `n8n-guide.js`)

### Commit message style
Short imperative descriptions, often prefixed with `+` for additions. Examples from history:
- `+ Article + sitemap updated`
- `FIXED COMMUNITY EDITION ARTICLE`
- `TWEAKED UI, FIXED ALL UI ELEMENT ERR`
- `Added SEO Targeted Tags + Updated SiteMap`
