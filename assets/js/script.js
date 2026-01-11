document.addEventListener('DOMContentLoaded', () => {
    // Loader
    const loader = document.querySelector('.loader');
    const loaderLine = document.querySelector('.loader-line');

    // Simulate loading
    setTimeout(() => {
        if (loaderLine) loaderLine.style.width = '100%';
    }, 100);

    setTimeout(() => {
        if (loader) loader.classList.add('hidden');
        document.body.classList.add('loaded');
    }, 800);

    // Scroll Observer
    const scrollElements = document.querySelectorAll('[data-scroll]');

    const elementInView = (el, dividend = 1) => {
        const elementTop = el.getBoundingClientRect().top;
        return (elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend);
    };

    const displayScrollElement = (element) => {
        element.classList.add('is-visible');
    };

    const handleScrollAnimation = () => {
        scrollElements.forEach((el) => {
            if (elementInView(el, 1.15)) { // 1.15 offset for better triggering
                displayScrollElement(el);
            }
        })
    }

    // Debounce scroll event
    let isScrolling = false;
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                handleScrollAnimation();
                handleNavbar();
                isScrolling = false;
            });
            isScrolling = true;
        }
    });

    // Trigger once on load
    handleScrollAnimation();

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    const handleNavbar = () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    // Mobile Menu
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links a');

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileToggle.classList.toggle('active');
            document.body.classList.toggle('no-scroll'); // Prevent body scroll when menu open
        });

        // Close menu when link is clicked
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileToggle.classList.remove('active');
                document.body.classList.remove('no-scroll');
            });
        });
    }

    // Parallax Effect for Hero Image (Subtle)
    const heroImg = document.querySelector('.hero-visual');
    if (heroImg) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            const rate = 0.1;
            heroImg.style.transform = `translateY(${scrolled * rate}px)`;
        });
    }
});
