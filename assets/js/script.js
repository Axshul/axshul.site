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

    // Contact Form Handler
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = contactForm.querySelector('#name').value.trim();
            const email = contactForm.querySelector('#email').value.trim();
            const message = contactForm.querySelector('#message').value.trim();

            if (name && email && message) {
                const btn = contactForm.querySelector('.btn-submit');
                const originalText = btn.innerHTML;

                // Loading State
                btn.innerHTML = '<span class="btn-text">Sending...</span>';
                btn.disabled = true;

                const webhookUrl = 'https://71245c5b4176.ngrok-free.app/webhook/Portfolio-Agent';
                const finalUrl = `${webhookUrl}?Name=${encodeURIComponent(name)}&Email=${encodeURIComponent(email)}&Message=${encodeURIComponent(message)}`;

                try {
                    // Using no-cors mode as it's a simple webhook trigger
                    await fetch(finalUrl, {
                        method: 'GET',
                        mode: 'no-cors'
                    });

                    // Success State
                    btn.innerHTML = '<span class="btn-text">Message Sent</span><span class="btn-icon">✓</span>';
                    btn.style.background = '#000'; // Black for success
                    contactForm.reset();

                    // Reset after delay
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                        btn.style.background = '';
                    }, 5000);

                } catch (error) {
                    console.error('Error:', error);
                    btn.innerHTML = '<span class="btn-text">Error. Try Again.</span>';
                    btn.style.background = 'red';

                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                        btn.style.background = '';
                    }, 3000);
                }
            }
        });
    }

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
