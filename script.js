/**
 * axshul.site v7
 * Full-page geometric grid + cursor, parallax, scroll effects
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ── CUSTOM CURSOR ── */
    const cursor = document.getElementById('cursor');
    const cursorRing = document.getElementById('cursorRing');
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    if (cursor && cursorRing && window.innerWidth > 768) {
        document.addEventListener('mousemove', e => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursor.style.left = mouseX + 'px';
            cursor.style.top = mouseY + 'px';
        });

        function animateRing() {
            ringX += (mouseX - ringX) * 0.12;
            ringY += (mouseY - ringY) * 0.12;
            cursorRing.style.left = ringX + 'px';
            cursorRing.style.top = ringY + 'px';
            requestAnimationFrame(animateRing);
        }
        animateRing();

        document.querySelectorAll('a, button, .pixel-btn, .social-icon, .pill, .skill-card').forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('hover');
                cursorRing.classList.add('hover');
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('hover');
                cursorRing.classList.remove('hover');
            });
        });
    }

    /* ── LOADER ── */
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
            setTimeout(initHero, 300);
        }, 900);
    }

    /* ── HERO: STAGGERED REVEAL ── */
    function initHero() {
        const els = document.querySelectorAll('[data-hero]');
        els.forEach((el, i) => {
            setTimeout(() => el.classList.add('revealed'), i * 180);
        });
        setTimeout(startRoleCycle, 1200);
    }

    /* ── ROLE CYCLE ── */
    function startRoleCycle() {
        const el = document.getElementById('heroRole');
        if (!el) return;

        const roles = [
            'Technical Architect',
            'AI Engineer',
            'N8N Community Moderator',
            'Co-founder @ Qixazow',
            'Full Stack Developer'
        ];

        let idx = 0;
        el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

        setInterval(() => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(8px)';

            setTimeout(() => {
                idx = (idx + 1) % roles.length;
                el.textContent = roles[idx];
                el.style.transform = 'translateY(-8px)';
                requestAnimationFrame(() => {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                });
            }, 300);
        }, 3000);
    }

    /* ── FULL-PAGE GEOMETRIC GRID ── */
    const geoGrid = document.getElementById('geoGrid');
    const geoLines = document.getElementById('geoLines');
    const geoNodes = document.getElementById('geoNodes');

    if (geoGrid && geoLines && geoNodes && window.innerWidth > 768) {
        const W = window.innerWidth;
        const H = document.documentElement.scrollHeight;
        const svg = geoGrid.querySelector('svg');
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        svg.style.width = W + 'px';
        svg.style.height = H + 'px';
        geoGrid.style.position = 'absolute';
        geoGrid.style.height = H + 'px';

        const COLS = 8;
        const ROWS = Math.ceil(H / (W / COLS));
        const cellW = W / COLS;
        const cellH = cellW;
        const nodes = [];

        for (let r = 0; r <= ROWS; r++) {
            for (let c = 0; c <= COLS; c++) {
                const jitterX = (Math.random() - 0.5) * cellW * 0.6;
                const jitterY = (Math.random() - 0.5) * cellH * 0.6;
                const x = c * cellW + jitterX;
                const y = r * cellH + jitterY;
                const isAccent = Math.random() < 0.15;
                const size = isAccent ? 3 : 1.5;
                nodes.push({ x, y, r: r, c: c, isAccent, size });
            }
        }

        const connections = [];
        const nodeMap = {};
        nodes.forEach((n, i) => {
            const key = `${n.r}_${n.c}`;
            nodeMap[key] = i;
        });

        nodes.forEach((n, i) => {
            const neighbors = [
                `${n.r}_${n.c + 1}`,
                `${n.r + 1}_${n.c}`,
                `${n.r + 1}_${n.c + 1}`,
                `${n.r + 1}_${n.c - 1}`
            ];
            neighbors.forEach(key => {
                if (nodeMap[key] !== undefined && Math.random() < 0.35) {
                    connections.push([i, nodeMap[key]]);
                }
            });
        });

        connections.forEach(([a, b]) => {
            const na = nodes[a], nb = nodes[b];
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', na.x);
            line.setAttribute('y1', na.y);
            line.setAttribute('x2', nb.x);
            line.setAttribute('y2', nb.y);
            const avgY = (na.y + nb.y) / 2;
            line.dataset.y = avgY;
            line.style.opacity = '0';
            const op = na.isAccent || nb.isAccent ? 0.12 : 0.06;
            line.dataset.baseOp = op;
            geoLines.appendChild(line);
        });

        nodes.forEach(n => {
            if (n.isAccent) {
                const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                glow.setAttribute('cx', n.x);
                glow.setAttribute('cy', n.y);
                glow.setAttribute('r', 12);
                glow.classList.add('node-glow');
                glow.dataset.y = n.y;
                geoNodes.appendChild(glow);

                const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const s = 6;
                diamond.setAttribute('points', `${n.x},${n.y - s} ${n.x + s},${n.y} ${n.x},${n.y + s} ${n.x - s},${n.y}`);
                diamond.classList.add('diamond-marker');
                diamond.dataset.y = n.y;
                geoNodes.appendChild(diamond);
            }

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', n.x);
            circle.setAttribute('cy', n.y);
            circle.setAttribute('r', n.size);
            circle.classList.add('node');
            circle.dataset.y = n.y;
            const op = n.isAccent ? 0.5 : 0.15;
            circle.dataset.baseOp = op;
            geoNodes.appendChild(circle);
        });

        const allElements = geoGrid.querySelectorAll('[data-y]');
        let ticking = false;

        function updateGeoGrid() {
            const scrollY = window.scrollY;
            const viewTop = scrollY - 200;
            const viewBottom = scrollY + window.innerHeight + 200;

            allElements.forEach(el => {
                const y = parseFloat(el.dataset.y);
                if (y >= viewTop && y <= viewBottom) {
                    if (!el.classList.contains('visible')) {
                        el.classList.add('visible');
                    }
                    const baseOp = parseFloat(el.dataset.baseOp) || 0.1;
                    const distFromCenter = Math.abs(y - (scrollY + window.innerHeight / 2));
                    const maxDist = window.innerHeight / 2 + 200;
                    const fade = 1 - Math.min(distFromCenter / maxDist, 1);
                    el.style.opacity = (baseOp * fade * 1.5).toFixed(3);
                } else {
                    if (el.classList.contains('visible')) {
                        el.classList.remove('visible');
                        el.style.opacity = '0';
                    }
                }
            });
            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateGeoGrid);
                ticking = true;
            }
        }, { passive: true });

        updateGeoGrid();
    }

    /* ── HERO SCROLL PARALLAX + FADE ── */
    const heroSection = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    const heroRight = document.querySelector('.hero-right');

    if (heroSection && window.innerWidth > 768) {
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            const heroH = heroSection.offsetHeight;
            const progress = Math.min(scrollY / heroH, 1);

            heroSection.style.opacity = 1 - progress * 1.2;

            if (heroContent) {
                heroContent.style.transform = `translateY(${scrollY * 0.15}px)`;
            }
            if (heroRight) {
                heroRight.style.transform = `translateY(${scrollY * 0.08}px) scale(${1 - progress * 0.05})`;
            }
        }, { passive: true });
    }

    /* ── SCROLL REVEAL ── */
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('[data-reveal]').forEach(el => {
        if (!el.closest('.hero')) {
            observer.observe(el);
        }
    });

    /* ── NAVBAR ── */
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    if (nav) {
        window.addEventListener('scroll', () => {
            nav.classList.toggle('scrolled', window.scrollY > 20);
        }, { passive: true });
    }

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });

        navLinks.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    /* ── SMOOTH SCROLL ── */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                window.scrollTo({
                    top: target.getBoundingClientRect().top + window.scrollY - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    /* ── ACTIVE NAV ── */
    const sections = document.querySelectorAll('.section[id], .hero[id]');
    const navAs = document.querySelectorAll('.nav-link');
    if (sections.length && navAs.length) {
        const sectionObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    navAs.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
                }
            });
        }, { rootMargin: '-30% 0px -30% 0px' });
        sections.forEach(s => sectionObs.observe(s));
    }

    /* ── CONTACT FORM ── */
    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = form.querySelector('[name="Name"]').value.trim();
            const email = form.querySelector('[name="Email"]').value.trim();
            const message = form.querySelector('[name="Message"]').value.trim();
            if (!name || !email || !message) return;

            const btnText = submitBtn.querySelector('.pixel-btn-text');
            const original = btnText.textContent;
            btnText.textContent = 'SENDING...';
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.6';

            const baseUrl = 'https://n8n.srv1419396.hstgr.cloud/webhook/website-form-sendAmessage';
            const params = new URLSearchParams({ Name: name, Email: email, Message: message });

            try {
                await fetch(`${baseUrl}?${params}`, { method: 'GET', mode: 'no-cors' });
                btnText.textContent = 'SENT! CHECK INBOX';
                submitBtn.querySelector('.pixel-btn-inner').style.background = '#22c55e';
            } catch {
                btnText.textContent = 'ERROR. TRY AGAIN';
                submitBtn.querySelector('.pixel-btn-inner').style.background = '#ef4444';
            }

            setTimeout(() => {
                btnText.textContent = original;
                submitBtn.disabled = false;
                submitBtn.style.opacity = '';
                submitBtn.querySelector('.pixel-btn-inner').style.background = '';
            }, 4000);
        });
    }

});
