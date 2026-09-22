/**
 * axshul.site · hive.js
 * Honeycomb canvas, cursor, nav, scroll effects, reveals, contact form.
 * Vanilla, no dependencies. Safe to include on every page: each block
 * only runs when its markup exists.
 */
(function () {
    'use strict';

    var $ = function (s, c) { return (c || document).querySelector(s); };
    var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
    var raf = window.requestAnimationFrame;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var body = document.body;
    body.classList.add('js');

    /* ═══════════════════════════════════════════
       HONEYCOMB CANVAS
       A pointy-top hex lattice in "world" space that parallaxes with
       scroll. Cells brighten near the pointer, a horizontal wave passes
       through the lattice while scrolling, and a handful of red signal
       cells breathe in and out.
       ═══════════════════════════════════════════ */
    var hive = $('#hive');
    if (hive) {
        var cv = hive.querySelector('canvas');
        var ctx = cv.getContext('2d');
        var S3 = Math.sqrt(3) / 2;
        var P = 0.18;                                   // scroll parallax factor
        var W, H, R, HW, VS, cols, rows;
        var mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
        var lastY = window.scrollY, energy = 0;
        var signals = [];
        var running = !document.hidden;

        function hexPath(x, y, r) {
            ctx.moveTo(x, y - r);
            ctx.lineTo(x + S3 * r, y - r / 2);
            ctx.lineTo(x + S3 * r, y + r / 2);
            ctx.lineTo(x, y + r);
            ctx.lineTo(x - S3 * r, y + r / 2);
            ctx.lineTo(x - S3 * r, y - r / 2);
            ctx.closePath();
        }
        function cellX(c, r) { return c * HW + ((r & 1) ? HW / 2 : 0); }
        function cellY(r) { return r * VS; }

        function spawn(s, now, stagger) {
            var baseRow = Math.floor(window.scrollY * P / VS);
            s.c = Math.floor(Math.random() * (cols - 1));
            s.r = baseRow + Math.floor(Math.random() * (rows - 3));
            s.dur = 3800 + Math.random() * 4200;
            s.t0 = now - (stagger ? Math.random() * s.dur : 0);
            return s;
        }

        function resize() {
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            W = window.innerWidth; H = window.innerHeight;
            cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
            cv.style.width = W + 'px'; cv.style.height = H + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            R = W < 700 ? 24 : 34;
            HW = Math.sqrt(3) * R; VS = 1.5 * R;
            cols = Math.ceil(W / HW) + 2;
            rows = Math.ceil(H / VS) + 3;
            var n = W < 700 ? 4 : 7, now = performance.now();
            signals.length = 0;
            for (var i = 0; i < n; i++) signals.push(spawn({}, now, true));
            if (reduce) draw(now, true);
        }

        function roam(now) {
            mouse.tx = W / 2 + Math.sin(now * 0.00021) * W * 0.36;
            mouse.ty = H * 0.45 + Math.cos(now * 0.00016) * H * 0.3;
        }

        function draw(now, still) {
            var sy = window.scrollY;
            if (still) { energy = 0; } else {
                energy = Math.min(1, energy * 0.9 + Math.abs(sy - lastY) * 0.005);
            }
            lastY = sy;
            if (!fine && !still) roam(now);
            mouse.x += (mouse.tx - mouse.x) * 0.1;
            mouse.y += (mouse.ty - mouse.y) * 0.1;

            var offY = sy * P;
            var r0 = Math.floor(offY / VS) - 1, r1 = r0 + rows + 1;
            var cy = H / 2;
            var baseA = 0.05 + energy * 0.05;
            var rad = 230 + energy * 150;
            var r, c, x, y;

            ctx.clearRect(0, 0, W, H);

            /* base lattice, one path */
            ctx.beginPath();
            for (r = r0; r <= r1; r++) {
                y = cellY(r) - offY;
                for (c = -1; c <= cols; c++) hexPath(cellX(c, r), y, R);
            }
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(255,255,255,' + baseA.toFixed(3) + ')';
            ctx.stroke();

            /* lit cells: pointer proximity + scroll wave */
            var nearX = 0, nearY = 0, nearD = 1e9;
            for (r = r0; r <= r1; r++) {
                y = cellY(r) - offY;
                var band = 0;
                if (energy > 0.02) { var bd = Math.abs(y - cy); if (bd < 170) band = energy * 0.11 * (1 - bd / 170); }
                for (c = -1; c <= cols; c++) {
                    x = cellX(c, r);
                    var dx = x - mouse.x, dy = y - mouse.y;
                    var d = Math.sqrt(dx * dx + dy * dy);
                    var a = band;
                    if (d < rad) {
                        var k = 1 - d / rad;
                        a += k * k * 0.24;
                        if (d < nearD) { nearD = d; nearX = x; nearY = y; }
                    }
                    if (a > 0.004) {
                        ctx.beginPath(); hexPath(x, y, R * 0.86);
                        ctx.fillStyle = 'rgba(255,255,255,' + (a * 0.3).toFixed(3) + ')'; ctx.fill();
                        ctx.strokeStyle = 'rgba(255,255,255,' + Math.min(a, 0.5).toFixed(3) + ')'; ctx.stroke();
                    }
                }
            }
            /* the cell under the pointer gets a red edge */
            if (fine && nearD < R) {
                ctx.beginPath(); hexPath(nearX, nearY, R * 0.86);
                ctx.strokeStyle = 'rgba(215,38,56,.55)'; ctx.stroke();
            }

            /* red signal cells */
            for (var i = 0; i < signals.length; i++) {
                var s = signals[i];
                var p = still ? 0.5 : (now - s.t0) / s.dur;
                var syy = cellY(s.r) - offY;
                if (p >= 1 || syy < -R || syy > H + R) { spawn(s, now, false); continue; }
                var env = Math.sin(Math.PI * p);
                var sx = cellX(s.c, s.r);
                ctx.beginPath(); hexPath(sx, syy, R * 0.86);
                ctx.fillStyle = 'rgba(215,38,56,' + (0.12 * env).toFixed(3) + ')'; ctx.fill();
                ctx.strokeStyle = 'rgba(215,38,56,' + (0.6 * env).toFixed(3) + ')'; ctx.stroke();
                ctx.beginPath(); hexPath(sx, syy, R * 1.9);
                ctx.strokeStyle = 'rgba(215,38,56,' + (0.07 * env).toFixed(3) + ')'; ctx.stroke();
            }
        }

        function frame(now) {
            if (!running) return;
            draw(now, false);
            raf(frame);
        }

        window.addEventListener('resize', resize);
        resize();
        if (!reduce) {
            window.addEventListener('pointermove', function (e) {
                if (e.pointerType === 'mouse') { mouse.tx = e.clientX; mouse.ty = e.clientY; }
            }, { passive: true });
            document.documentElement.addEventListener('mouseleave', function () { mouse.tx = -9999; mouse.ty = -9999; });
            document.addEventListener('visibilitychange', function () {
                var was = running;
                running = !document.hidden;
                if (running && !was) raf(frame);
            });
            raf(frame);
        }
    }

    /* ═══════════════════════════════════════════
       CURSOR (fine pointers only)
       ═══════════════════════════════════════════ */
    var cur = $('.cur'), ring = $('.cur-ring');
    if (cur && ring && fine && !reduce) {
        body.classList.add('has-cursor');
        var mx = -100, my = -100, rx = -100, ry = -100;
        var HOVER = 'a, button, .cell, input, textarea, label';
        window.addEventListener('pointermove', function (e) {
            mx = e.clientX; my = e.clientY;
            cur.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
        }, { passive: true });
        (function loop() {
            rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
            ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)';
            raf(loop);
        })();
        document.addEventListener('pointerover', function (e) {
            if (e.target.closest && e.target.closest(HOVER)) body.classList.add('cur-hover');
        });
        document.addEventListener('pointerout', function (e) {
            if (e.target.closest && e.target.closest(HOVER)) body.classList.remove('cur-hover');
        });
    }

    /* ═══════════════════════════════════════════
       NAV + MOBILE MENU
       ═══════════════════════════════════════════ */
    var nav = $('#nav'), toggle = $('#navToggle'), menu = $('#menu');
    if (toggle && menu) {
        var setMenu = function (open) {
            menu.classList.toggle('open', open);
            toggle.classList.toggle('open', open);
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            body.style.overflow = open ? 'hidden' : '';
        };
        toggle.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
        $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    }

    /* ═══════════════════════════════════════════
       SCROLL EFFECTS
       progress bar · nav state · hero wordmark drift + brighten ·
       portrait parallax · footer wordmark · timeline fill
       ═══════════════════════════════════════════ */
    var pending = $$('.rv');
    var prog = $('.prog'), hero = $('.hero'), heroWord = $('.hero-word');
    var heroVis = $('.hero-visual'), footWord = $('.foot-word'), pWord = $('.phero-word');
    var tl = $('.tl'), tlFill = $('.tl-fill'), tlItems = $$('.tl-item');
    var ticking = false;

    function onScroll() {
        ticking = false;
        var y = window.scrollY, vh = window.innerHeight;
        var max = document.documentElement.scrollHeight - vh;
        if (prog) prog.style.transform = 'scaleX(' + (max > 0 ? y / max : 0).toFixed(4) + ')';
        if (nav) nav.classList.toggle('scrolled', y > 24);
        if (heroWord && hero) {
            var p = Math.min(y / Math.max(hero.offsetHeight, 1), 1);
            heroWord.style.transform = 'translateX(' + (-y * 0.22).toFixed(1) + 'px)';
            heroWord.style.webkitTextStrokeColor = 'rgba(255,255,255,' + (0.07 + p * 0.2).toFixed(3) + ')';
        }
        if (heroVis && !reduce) heroVis.style.setProperty('--py', (y * 0.07).toFixed(1) + 'px');
        if (pWord) {
            var pp = Math.min(y / 700, 1);
            pWord.style.transform = 'translateX(' + (-y * 0.18).toFixed(1) + 'px)';
            pWord.style.webkitTextStrokeColor = 'rgba(255,255,255,' + (0.06 + pp * 0.16).toFixed(3) + ')';
        }
        if (footWord) {
            var fr = footWord.getBoundingClientRect();
            var t = Math.max(0, Math.min(1, (vh - fr.top) / (vh + fr.height)));
            footWord.style.transform = 'translateX(' + ((0.5 - t) * 140).toFixed(1) + 'px)';
        }
        reveal();
        if (tl && tlFill) {
            var tr = tl.getBoundingClientRect();
            var h = Math.max(0, Math.min(vh * 0.72 - tr.top, tr.height));
            tlFill.style.height = h.toFixed(0) + 'px';
            for (var i = 0; i < tlItems.length; i++) tlItems[i].classList.toggle('lit', tlItems[i].offsetTop + 10 <= h);
        }
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; raf(onScroll); } }, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('load', onScroll);
    onScroll();
    setTimeout(onScroll, 120);

    /* portrait tilt */
    if (heroVis && fine && !reduce) {
        heroVis.addEventListener('pointermove', function (e) {
            var r = heroVis.getBoundingClientRect();
            var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
            heroVis.style.setProperty('--ry', (x * 3).toFixed(2) + 'deg');
            heroVis.style.setProperty('--rx', (-y * 3).toFixed(2) + 'deg');
        });
        heroVis.addEventListener('pointerleave', function () {
            heroVis.style.setProperty('--ry', '0deg');
            heroVis.style.setProperty('--rx', '0deg');
        });
    }

    /* ═══════════════════════════════════════════
       REVEALS (scroll-driven, no IntersectionObserver dependency)
       ═══════════════════════════════════════════ */
    function reveal() {
        if (!pending.length) return;
        var line = window.innerHeight * 0.92, keep = [];
        for (var i = 0; i < pending.length; i++) {
            var el = pending[i];
            if (reduce || el.getBoundingClientRect().top < line) el.classList.add('in');
            else keep.push(el);
        }
        pending = keep;
    }
    reveal();

    /* magnetic buttons */
    if (fine && !reduce) {
        $$('.btn').forEach(function (el) {
            el.addEventListener('pointermove', function (e) {
                var r = el.getBoundingClientRect();
                var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
                el.style.transform = 'translate(' + (x * 0.18).toFixed(1) + 'px,' + (y * 0.18).toFixed(1) + 'px)';
            });
            el.addEventListener('pointerleave', function () { el.style.transform = ''; });
        });
    }

    /* ═══════════════════════════════════════════
       ROTATING ROLE (letter roll)
       ═══════════════════════════════════════════ */
    var role = $('#role');
    if (role) {
        var roles = (role.getAttribute('data-roles') || '').split('|').filter(Boolean);
        var roleIdx = 0, bullet = $('.hero-eyebrow svg');
        var buildLine = function (text, cls) {
            var line = document.createElement('span');
            line.className = 'role-line' + (cls ? ' ' + cls : '');
            for (var i = 0; i < text.length; i++) {
                var ch = document.createElement('i');
                ch.textContent = text[i] === ' ' ? '\u00A0' : text[i];
                ch.style.setProperty('--i', i);
                line.appendChild(ch);
            }
            return line;
        };
        if (roles.length) { role.textContent = ''; role.appendChild(buildLine(roles[0])); }
        if (roles.length > 1 && !reduce) {
            setInterval(function () {
                if (document.hidden) return;
                $$('.role-line.out', role).forEach(function (l) { l.parentNode.removeChild(l); });
                var old = role.querySelector('.role-line');
                roleIdx = (roleIdx + 1) % roles.length;
                var next = buildLine(roles[roleIdx], 'pre');
                role.appendChild(next);
                if (old) old.classList.add('out');
                void next.offsetWidth;
                setTimeout(function () { next.classList.remove('pre'); }, 40);
                if (bullet) { bullet.classList.remove('tick'); void bullet.offsetWidth; bullet.classList.add('tick'); }
                setTimeout(function () { if (old && old.parentNode) old.parentNode.removeChild(old); }, 1300);
            }, 3400);
        }
    }

    /* ═══════════════════════════════════════════
       CONTACT FORM → n8n webhook
       ═══════════════════════════════════════════ */
    var form = $('#contactForm'), submitBtn = $('#submitBtn');
    if (form && submitBtn) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var f = form.elements;
            var name = f.Name.value.trim(), email = f.Email.value.trim(), message = f.Message.value.trim();
            if (!name || !email || !message) return;
            var label = submitBtn.querySelector('.btn-text');
            var original = label.textContent;
            label.textContent = 'Sending...';
            submitBtn.disabled = true;
            var url = 'https://n8n.srv1419396.hstgr.cloud/webhook/website-form-sendAmessage?' +
                new URLSearchParams({ Name: name, Email: email, Message: message }).toString();
            fetch(url, { method: 'GET', mode: 'no-cors' })
                .then(function () { label.textContent = 'Sent. Check your inbox'; form.reset(); })
                .catch(function () { label.textContent = 'Error. Try again'; })
                .then(function () {
                    setTimeout(function () { label.textContent = original; submitBtn.disabled = false; }, 4000);
                });
        });
    }
})();
