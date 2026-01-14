document.addEventListener('DOMContentLoaded', () => {
    const graphic = document.querySelector('.tech-graphic');
    const heroVisual = document.querySelector('.hero-visual');

    if (!graphic || !heroVisual) return;

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.classList.add('graphic-3d-wrapper');

    // Create Rotator for 3D spin
    const rotator = document.createElement('div');
    rotator.style.width = '100%';
    rotator.style.height = '100%';
    rotator.style.display = 'flex';
    rotator.style.alignItems = 'center';
    rotator.style.justifyContent = 'center';
    rotator.style.transformStyle = 'preserve-3d';

    wrapper.appendChild(rotator);
    rotator.appendChild(graphic);

    // Initial styles for graphic to fit inside rotator
    graphic.style.position = 'relative';
    graphic.style.top = 'auto';
    graphic.style.left = 'auto';
    graphic.style.transform = 'none'; // reset centered translate
    graphic.style.width = '300px';
    graphic.style.height = '300px';

    // State
    let isDesktop = window.matchMedia('(min-width: 769px)').matches;

    const updateLayout = () => {
        isDesktop = window.matchMedia('(min-width: 769px)').matches;

        if (isDesktop) {
            // DESKTOP: Fixed Position (Follows User)
            document.body.appendChild(wrapper);
            wrapper.style.position = 'fixed';
            wrapper.style.top = '0';
            wrapper.style.height = '100vh';
            wrapper.style.zIndex = '-1';

            // Sync horizontal position with placeholder
            const rect = heroVisual.getBoundingClientRect();
            wrapper.style.left = `${rect.left}px`;
            wrapper.style.width = `${rect.width}px`;
        } else {
            // MOBILE: Absolute Position (Scrolls away)
            heroVisual.appendChild(wrapper);
            wrapper.style.position = 'absolute';
            wrapper.style.top = '0';
            wrapper.style.left = '0';
            wrapper.style.width = '100%';
            wrapper.style.height = '100%';
            wrapper.style.zIndex = '1'; // Inside hero container
        }
    };

    // Initial and Resize
    updateLayout();
    window.addEventListener('resize', updateLayout);
    window.addEventListener('scroll', () => {
        if (isDesktop) {
            // In Fixed mode, we need to constantly update 'left' if the window resizes horizontally 
            // but actually we only need to update it on resize. 
            // However, some browsers might shift layout on scroll (mobile bars), so safe to update?
            // No, strictly resize is enough for 'left'.
        }
    });

    // Animation Loop
    let currentScroll = 0;
    const loop = () => {
        requestAnimationFrame(loop);

        const scrollY = window.scrollY;
        // Lerp
        currentScroll += (scrollY - currentScroll) * 0.1;

        const rotX = currentScroll * 0.1;
        const rotY = currentScroll * 0.05;

        rotator.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    };
    loop();
});
