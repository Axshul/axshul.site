document.addEventListener('DOMContentLoaded', () => {
    const originalGraphic = document.querySelector('.tech-graphic');
    const heroVisual = document.querySelector('.hero-visual');
    if (!originalGraphic || !heroVisual) return;

    originalGraphic.style.opacity = '0';

    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-blue').trim() || '#0044FF';

    // --- WRAPPER & GROUP ---
    const wrapper = document.createElement('div');
    wrapper.classList.add('graphic-3d-wrapper');

    const sphereGroup = document.createElement('div');
    sphereGroup.style.width = '400px';
    sphereGroup.style.height = '400px';
    sphereGroup.style.position = 'relative';
    sphereGroup.style.transformStyle = 'preserve-3d';
    sphereGroup.style.display = 'flex';
    sphereGroup.style.alignItems = 'center';
    sphereGroup.style.justifyContent = 'center';

    wrapper.appendChild(sphereGroup);

    // --- DETECT SHAPE ---
    const shape = document.body.getAttribute('data-graphic-shape');
    const isSquare = shape === 'square';
    const isTriangle = shape === 'triangle';
    const isRectangle = shape === 'rectangle';

    const borderRadius = (isSquare || isTriangle || isRectangle) ? '0%' : '50%';
    const clipPath = isTriangle ? 'polygon(50% 10%, 10% 90%, 90% 90%)' : 'none';

    // --- HELPERS ---
    const createRing = (size, border, brightness = 1, glow = false) => {
        const ring = document.createElement('div');
        ring.style.position = 'absolute';
        ring.style.width = `${size}px`;
        ring.style.height = `${size}px`;
        ring.style.borderRadius = borderRadius;
        ring.style.clipPath = clipPath;
        ring.style.border = `${border}px solid ${accentColor}`;
        ring.style.opacity = brightness;
        ring.style.transformStyle = 'preserve-3d';
        ring.style.boxSizing = 'border-box';
        if (glow) ring.style.boxShadow = `0 0 15px ${accentColor}40`;
        return ring;
    };

    // --- ELEMENTS ---
    const ring1 = createRing(240, 1, 1, true); // Equator
    const ring2 = createRing(230, 1, 0.8); // Meridian
    const ring3 = createRing(220, 1, 0.8); // Cross

    // Inner Lines
    const crossLines = document.createElement('div');
    crossLines.style.position = 'absolute';
    crossLines.style.width = '240px';
    crossLines.style.height = '240px';
    crossLines.style.transformStyle = 'preserve-3d';


    if (isTriangle) {
        crossLines.innerHTML = `
            <svg viewBox="0 0 240 240" style="width:100%; height:100%; overflow:visible;">
                <!-- Outer triangle -->
                <path d="M120,30 L30,190 L210,190 Z" stroke="${accentColor}" stroke-width="1" fill="none" opacity="0.7" />
                <!-- Middle triangle -->
                <path d="M120,60 L50,175 L190,175 Z" stroke="${accentColor}" stroke-width="0.8" fill="none" opacity="0.5" />
                <!-- Inner triangle -->
                <path d="M120,90 L70,160 L170,160 Z" stroke="${accentColor}" stroke-width="0.6" fill="none" opacity="0.4" />
                <!-- Center lines -->
                <path d="M120,30 L120,190" stroke="${accentColor}" stroke-width="0.5" opacity="0.3" />
                <path d="M30,190 L210,190" stroke="${accentColor}" stroke-width="0.5" opacity="0.3" />
            </svg>
        `;
    } else if (isRectangle) {
        crossLines.innerHTML = `
            <svg viewBox="0 0 240 240" style="width:100%; height:100%; overflow:visible;">
                <!-- Outer rectangle -->
                <rect x="40" y="60" width="160" height="120" stroke="${accentColor}" stroke-width="1" fill="none" opacity="0.7" />
                <!-- Middle rectangle -->
                <rect x="60" y="75" width="120" height="90" stroke="${accentColor}" stroke-width="0.8" fill="none" opacity="0.5" />
                <!-- Inner rectangle -->
                <rect x="80" y="90" width="80" height="60" stroke="${accentColor}" stroke-width="0.6" fill="none" opacity="0.4" />
                <!-- Center lines -->
                <path d="M120,60 L120,180" stroke="${accentColor}" stroke-width="0.5" opacity="0.3" />
                <path d="M40,120 L200,120" stroke="${accentColor}" stroke-width="0.5" opacity="0.3" />
            </svg>
        `;
    } else if (isSquare) {
        crossLines.innerHTML = `
            <svg viewBox="0 0 240 240" style="width:100%; height:100%; overflow:visible;">
                <path d="M120,0 L120,240" stroke="${accentColor}" stroke-width="0.5" opacity="0.6" />
                <path d="M0,120 L240,120" stroke="${accentColor}" stroke-width="0.5" opacity="0.6" />
                <rect x="80" y="80" width="80" height="80" stroke="${accentColor}" stroke-width="0.5" fill="none" opacity="0.4" />
            </svg>
        `;
    } else {
        crossLines.innerHTML = `
            <svg viewBox="0 0 240 240" style="width:100%; height:100%; overflow:visible;">
                <path d="M120,0 L120,240" stroke="${accentColor}" stroke-width="0.5" opacity="0.6" />
                <path d="M0,120 L240,120" stroke="${accentColor}" stroke-width="0.5" opacity="0.6" />
                <circle cx="120" cy="120" r="40" stroke="${accentColor}" stroke-width="0.5" fill="none" opacity="0.4" />
            </svg>
        `;
    }
    sphereGroup.appendChild(crossLines);
    sphereGroup.appendChild(ring1);
    sphereGroup.appendChild(ring2);
    sphereGroup.appendChild(ring3);

    // --- LAYOUT ---
    let isDesktop = false;
    const updateLayout = () => {
        isDesktop = window.matchMedia('(min-width: 769px)').matches;
        if (isDesktop) {
            if (wrapper.parentElement !== document.body) document.body.appendChild(wrapper);
            wrapper.style.position = 'fixed';
            wrapper.style.top = '0';
            wrapper.style.height = '100vh';
            wrapper.style.zIndex = '-1';

            const rect = heroVisual.getBoundingClientRect();
            wrapper.style.left = `${rect.left}px`;
            wrapper.style.width = `${rect.width}px`;
        } else {
            if (wrapper.parentElement !== heroVisual) heroVisual.appendChild(wrapper);
            wrapper.style.position = 'absolute';
            wrapper.style.top = '0';
            wrapper.style.left = '0';
            wrapper.style.width = '100%';
            wrapper.style.height = '100%';
            wrapper.style.zIndex = '1';
            sphereGroup.style.transform = ''; // Reset transform on mobile switch
        }
    };
    updateLayout();
    window.addEventListener('resize', updateLayout);

    // --- ANIMATION ---
    let baseSpin = 20;
    let spinAngle = 0;
    let currentScroll = 0;
    let lastScroll = 0;

    const loop = () => {
        requestAnimationFrame(loop);

        const scrollY = window.scrollY;
        const scrollVelocity = Math.abs(scrollY - lastScroll);
        lastScroll = scrollY;
        currentScroll += (scrollY - currentScroll) * 0.1;

        // Desktop: full motion, Mobile: softer motion
        const motionFactor = isDesktop ? 1 : 0.35;

        // 1. DYNAMIC SPEED
        if (baseSpin > 0.3) baseSpin *= 0.96;
        const totalVelocity = (baseSpin + (scrollVelocity * 0.5)) * motionFactor;
        spinAngle += totalVelocity;

        // 2. DYNAMIC SIZE
        const progress = Math.min(Math.max(currentScroll / 800, 0), 1);
        const scaleBase = isDesktop ? 1 : 0.9;
        const scale = scaleBase + (progress * (isDesktop ? 0.4 : 0.2));
        const unfold = progress * (isDesktop ? 90 : 45);

        // 3. POSITIONAL MOVEMENT
        const driftX = Math.sin(currentScroll * 0.003) * (isDesktop ? 100 : 35);
        const driftY = Math.cos(currentScroll * 0.004) * (isDesktop ? 50 : 20);

        // APPLY
        sphereGroup.style.transform = `
            translate3d(${driftX}px, ${driftY}px, 0)
            scale(${scale}) 
            rotateZ(${spinAngle}deg) 
            rotateX(${currentScroll * 0.05 * motionFactor}deg) 
            rotateY(${currentScroll * 0.05 * motionFactor}deg)
        `;

        ring2.style.transform = `rotateX(${unfold}deg)`;
        ring3.style.transform = `rotateY(${unfold}deg)`;
        crossLines.style.transform = `rotateZ(${-spinAngle * 0.5 * motionFactor}deg)`;
    };
    loop();
});
