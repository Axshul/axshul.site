/* Automations Page — Verifier + UI Logic */

document.addEventListener('DOMContentLoaded', () => {

    /* ── Mobile nav ── */
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
        navLinks.querySelectorAll('a').forEach(a =>
            a.addEventListener('click', () => navLinks.classList.remove('open'))
        );
    }

    /* ── Verifier ── */
    const verifyBtn = document.getElementById('verifyBtn');
    const idInput = document.getElementById('uniqueId');
    const levelSel = document.getElementById('courseLevel');
    const outPlaceholder = document.getElementById('outPlaceholder');
    const outLoader = document.getElementById('outLoader');
    const outLabel = document.getElementById('outLabel');
    const outEndpoint = document.getElementById('outEndpoint');
    const resultBox = document.getElementById('resultContainer');

    const ENDPOINTS = {
        level1: 'https://learn.app.n8n.cloud/webhook/course-level-1/verify',
        level2: 'https://learn.app.n8n.cloud/webhook/course-level-2/verify',
    };

    function refreshEndpoint() {
        const short = ENDPOINTS[levelSel.value].replace('https://learn.app.n8n.cloud', '');
        outEndpoint.textContent = short;
    }
    levelSel.addEventListener('change', refreshEndpoint);
    refreshEndpoint();

    async function verify() {
        const id = idInput.value.trim();
        const level = levelSel.value;

        if (!id) {
            idInput.style.borderColor = 'var(--red-soft)';
            idInput.style.boxShadow = '0 0 0 3px rgba(229,57,53,0.1)';
            idInput.focus();
            setTimeout(() => { idInput.style.borderColor = ''; idInput.style.boxShadow = ''; }, 1600);
            return;
        }

        const url = `${ENDPOINTS[level]}?id=${encodeURIComponent(id)}`;

        // Loading state
        outPlaceholder.style.display = 'none';
        resultBox.innerHTML = '';
        outLoader.classList.add('show');
        outLabel.textContent = 'fetching…';
        outLabel.style.color = '';
        outEndpoint.textContent = url.replace('https://learn.app.n8n.cloud', '');
        verifyBtn.disabled = true;
        verifyBtn.querySelector('.vb-text').textContent = 'Verifying…';

        try {
            const res = await fetch(url);
            const htmlText = await res.text();

            outLoader.classList.remove('show');
            resultBox.innerHTML = htmlText;
            outLabel.textContent = `${res.status} ${res.ok ? 'OK' : 'Error'}`;
            outLabel.style.color = res.ok ? 'var(--green-soft)' : 'var(--red-soft)';
            outLabel.style.fontWeight = '700';

        } catch (err) {
            outLoader.classList.remove('show');
            resultBox.innerHTML = `<span style="color:var(--red-soft)">
        ✕ Network error — check whether the webhook is online or CORS permits this origin.
      </span>`;
            outLabel.textContent = 'error';
            outLabel.style.color = 'var(--red-soft)';
            console.error('[Verifier]', err);
        }

        verifyBtn.disabled = false;
        verifyBtn.querySelector('.vb-text').textContent = 'Verify Certificate';
        refreshEndpoint();
    }

    verifyBtn.addEventListener('click', verify);
    idInput.addEventListener('keydown', e => { if (e.key === 'Enter') verify(); });

    /* ── Smooth scroll for # links ── */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        });
    });

    /* ── Fade-in on scroll ── */
    const fadeEls = document.querySelectorAll('.fade-in');
    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.06 });
    fadeEls.forEach(el => io.observe(el));

    /* ── Nav active state from scroll ── */
    const sections = ['verify', 'community', 'creations'];
    const navAs = document.querySelectorAll('.nav-links-list a[href^="#"]');

    const sio = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navAs.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
            }
        });
    }, { rootMargin: '-35% 0px -35% 0px' });

    sections.forEach(id => { const el = document.getElementById(id); if (el) sio.observe(el); });

});
