/* blog.js — Blog page logic: renders personal posts & fetches Hacker News */

/* ════════════════════════════════════════
   PERSONAL WRITINGS
════════════════════════════════════════ */

function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function buildWritingCard(post, index) {
    const card = document.createElement('a');
    card.className = 'writing-card';
    card.href = post.url || '#';
    if (post.url && post.url !== '#') card.target = '_blank';
    card.dataset.category = post.category.toLowerCase().replace(/\s/g, '-');
    card.style.animationDelay = `${index * 0.07}s`;

    card.innerHTML = `
    <div class="wc-top">
      <span class="wc-cat">${post.category}</span>
      <span class="wc-read">${post.readTime} min read</span>
    </div>
    <div class="wc-title">${post.title}</div>
    <div class="wc-excerpt">${post.excerpt}</div>
    <div class="wc-footer">
      <span class="wc-date">${formatDate(post.date)}</span>
      <div class="wc-tags">
        ${post.tags.slice(0, 3).map(t => `<span class="wc-tag">${t}</span>`).join('')}
      </div>
    </div>
  `;
    return card;
}

function renderWritings(filter = 'all') {
    const grid = document.getElementById('writingsGrid');
    if (!grid) return;

    const filtered = filter === 'all'
        ? BLOG_POSTS
        : BLOG_POSTS.filter(p => p.category.toLowerCase().replace(/\s/g, '-') === filter);

    grid.innerHTML = '';

    if (!filtered.length) {
        grid.innerHTML = `<div style="grid-column:1/-1;padding:3rem 0;text-align:center;color:#bbb;font-weight:700;text-transform:uppercase;letter-spacing:.1em;font-size:.8rem;">No posts in this category yet</div>`;
        return;
    }

    filtered.forEach((post, i) => {
        const card = buildWritingCard(post, i);
        grid.appendChild(card);
        // Trigger scroll observer
        setTimeout(() => card.classList.add('visible'), 50 + i * 70);
    });
}

// Filter tabs
document.addEventListener('DOMContentLoaded', () => {
    renderWritings();

    const tabs = document.querySelectorAll('.bft-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderWritings(tab.dataset.filter);
        });
    });
});

/* ════════════════════════════════════════
   HACKER NEWS CORE
════════════════════════════════════════ */

const HN_BASE = 'https://hacker-news.firebaseio.com/v0';

async function hnItem(id) {
    const r = await fetch(`${HN_BASE}/item/${id}.json`);
    return r.json();
}

async function hnIds(endpoint) {
    const r = await fetch(`${HN_BASE}/${endpoint}.json`);
    return r.json();
}

function hnDomain(url) {
    if (!url) return 'news.ycombinator.com';
    try {
        const h = new URL(url).hostname;
        return h.replace(/^www\./, '');
    } catch { return ''; }
}

function hnTimeAgo(unix) {
    const d = Math.floor((Date.now() / 1000 - unix) / 3600);
    if (d < 1) return `${Math.floor((Date.now() / 1000 - unix) / 60)}m ago`;
    if (d < 24) return `${d}h ago`;
    return `${Math.floor(d / 24)}d ago`;
}

/* ── Hacker News State ── */
let _hnState = {
    best: { ids: [], cursor: 0, loading: false },
    ask: { ids: [], cursor: 0, loading: false },
    jobs: { ids: [], cursor: 0, loading: false }
};

const BATCH_SIZE = 8;

/* ── Generic Batch Fetcher ── */
async function fetchHNBatch(category) {
    const state = _hnState[category];
    if (state.loading || state.cursor >= state.ids.length) return;

    state.loading = true;
    const grid = category === 'jobs'
        ? document.getElementById('hn-jobs-list')
        : document.getElementById(category === 'best' ? 'hn-best-grid' : 'hn-ask-grid');

    const nextBatch = state.ids.slice(state.cursor, state.cursor + BATCH_SIZE);

    try {
        const items = await Promise.all(nextBatch.map(hnItem));

        // Remove skeleton if it's the first load
        if (state.cursor === 0) grid.innerHTML = '';

        items.forEach((item, i) => {
            if (!item || item.dead || item.deleted) return;
            const card = category === 'best'
                ? buildBestCard(item, state.cursor + i)
                : category === 'ask'
                    ? buildAskCard(item, state.cursor + i)
                    : buildJobCard(item, state.cursor + i);

            grid.appendChild(card);
            setTimeout(() => card.classList.add('visible'), 50 + i * 50);
        });

        state.cursor += BATCH_SIZE;
        updateLiveCount(state.cursor, category);

    } catch (e) {
        console.error(`[HN ${category}]`, e);
    } finally {
        state.loading = false;
    }
}

/* ── Card Builders ── */
function buildBestCard(item, index) {
    const url = item.url || `https://news.ycombinator.com/item?id=${item.id}`;
    const dom = hnDomain(item.url);
    const card = document.createElement('a');
    card.className = 'hn-card';
    card.href = url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.innerHTML = `
        <div class="hn-card-domain">${dom}</div>
        <div class="hn-card-title">${item.title}</div>
        <div class="hn-card-meta">
          <span class="hn-score">${item.score || 0}</span>
          <a class="hn-comments" href="https://news.ycombinator.com/item?id=${item.id}" target="_blank" rel="noopener">
            ${item.descendants || 0} comments
          </a>
        </div>
    `;
    return card;
}

function buildAskCard(item, index) {
    const type = item.title.toLowerCase().startsWith('ask hn') ? 'Ask HN' : 'Show HN';
    const link = document.createElement('a');
    link.className = 'hn-ask-card';
    link.href = `https://news.ycombinator.com/item?id=${item.id}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.innerHTML = `
        <div class="hn-ask-num">${String(index + 1).padStart(2, '0')}</div>
        <div class="hn-ask-body">
          <div class="hn-ask-type">${type}</div>
          <div class="hn-ask-title">${item.title}</div>
          <div class="hn-ask-meta">
            <span>${item.score || 0} pts</span>
            <span>${item.descendants || 0} comments</span>
            <span>${hnTimeAgo(item.time)}</span>
          </div>
        </div>
    `;
    return link;
}

function buildJobCard(item, index) {
    const url = item.url || `https://news.ycombinator.com/item?id=${item.id}`;
    const row = document.createElement('a');
    row.className = 'hn-job-row';
    row.href = url;
    row.target = '_blank';
    row.rel = 'noopener noreferrer';
    const dom = hnDomain(item.url);
    row.innerHTML = `
        <div>
          <div class="hn-job-title">${item.title}</div>
          <div class="hn-job-sub">
            <span>${dom || 'ycombinator.com'}</span>
            <span>${hnTimeAgo(item.time)}</span>
          </div>
        </div>
        <div class="hn-job-arrow">→</div>
    `;
    return row;
}

/* ── Bootstrapping ── */
async function loadHN() {
    try {
        const [best, ask, show, jobs] = await Promise.all([
            hnIds('beststories'),
            hnIds('askstories'),
            hnIds('showstories'),
            hnIds('jobstories')
        ]);

        _hnState.best.ids = best;
        _hnState.jobs.ids = jobs;

        // Merge Ask & Show
        const merged = [];
        const max = Math.max(ask.length, show.length);
        for (let i = 0; i < max; i++) {
            if (ask[i]) merged.push(ask[i]);
            if (show[i]) merged.push(show[i]);
        }
        _hnState.ask.ids = merged;

        // Initial fetch
        fetchHNBatch('best');
        fetchHNBatch('ask');
        fetchHNBatch('jobs');

        setupInfiniteScroll();
    } catch (e) {
        console.error('[HN Load]', e);
    }
}

function setupInfiniteScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const cat = entry.target.dataset.category;
                fetchHNBatch(cat);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px 200px 0px' });

    document.querySelectorAll('.hn-sentinel').forEach(s => observer.observe(s));
}

/* ── Live count badge ── */
let _liveCounts = { best: 0, ask: 0, jobs: 0 };
function updateLiveCount(n, key) {
    if (key) _liveCounts[key] = n;
    const total = Object.values(_liveCounts).reduce((a, b) => a + b, 0);
    const badge = document.getElementById('hn-live-badge');
    if (badge) badge.textContent = total;

    const meta = document.getElementById('hn-live-meta');
    const cnt = document.getElementById('hn-live-count');
    if (meta && cnt) {
        meta.style.display = 'flex';
        cnt.textContent = total;
    }
}

/* ── Scroll fade-in ── */
const bFadeObserver = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); bFadeObserver.unobserve(e.target); } });
}, { threshold: 0.05 });

document.querySelectorAll('.b-fade').forEach(el => bFadeObserver.observe(el));

/* ── Refresh Logic ── */
async function refreshHN() {
    const btn = document.getElementById('hnRefreshBtn');
    if (!btn || btn.classList.contains('refreshing')) return;

    btn.classList.add('refreshing');
    btn.querySelector('span').textContent = 'Refreshing…';

    _hnState = {
        best: { ids: [], cursor: 0, loading: false },
        ask: { ids: [], cursor: 0, loading: false },
        jobs: { ids: [], cursor: 0, loading: false }
    };
    _liveCounts = { best: 0, ask: 0, jobs: 0 };
    updateLiveCount(0);

    injectSkeletons();
    await loadHN();

    btn.classList.remove('refreshing');
    btn.querySelector('span').textContent = 'Refresher';
}

function injectSkeletons() {
    const bestGrid = document.getElementById('hn-best-grid');
    const askGrid = document.getElementById('hn-ask-grid');
    const jobsList = document.getElementById('hn-jobs-list');

    if (bestGrid) {
        bestGrid.innerHTML = `
      <div class="hn-skel-card">
        <div class="hn-skel-line w-3 hn-skeleton"></div>
        <div class="hn-skel-line w-10 hn-skeleton"></div>
        <div class="hn-skel-line w-8 hn-skeleton"></div>
        <div class="hn-skel-line w-7 hn-skeleton" style="margin-top:auto;"></div>
      </div>
    `;
    }

    if (askGrid) {
        askGrid.innerHTML = `
      <div class="hn-skel-card">
        <div class="hn-skel-line w-3 hn-skeleton"></div>
        <div class="hn-skel-line w-10 hn-skeleton"></div>
        <div class="hn-skel-line w-8 hn-skeleton"></div>
      </div>
    `;
    }

    if (jobsList) {
        jobsList.innerHTML = `
      <div class="hn-skel-card" style="height:70px;border:none;border-bottom:1px solid #e0e0e0;border-radius:0;flex-direction:row;gap:1rem;align-items:center;">
          <div style="flex:1;display:flex;flex-direction:column;gap:.5rem;">
              <div class="hn-skel-line w-7 hn-skeleton"></div>
              <div class="hn-skel-line w-3 hn-skeleton"></div>
          </div>
      </div>
    `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('hnRefreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', refreshHN);
    loadHN();
});

/* ── Navbar scroll handle ── */
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.navbar');
    if (nav) {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }
});
