/**
 * Contact Form Logic
 * Handles submission to webhooks with no-cors mode
 */

document.addEventListener('DOMContentLoaded', function () {
    const forms = document.querySelectorAll('.integrated-contact-form');

    forms.forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const btn = this.querySelector('.btn-submit');
            const btnText = btn.querySelector('.btn-text');
            const btnIcon = btn.querySelector('.btn-icon');

            // Disable button
            btn.style.opacity = '0.7';
            btn.style.pointerEvents = 'none';
            btnText.innerText = 'Sending...';

            // Get form values
            const name = this.querySelector('[name="Name"]').value;
            const email = this.querySelector('[name="Email"]').value;
            const message = this.querySelector('[name="Message"]').value;

            // Construct URL
            const baseUrl = 'https://71245c5b4176.ngrok-free.app/webhook/Portfolio-Agent';
            const params = new URLSearchParams({
                Name: name,
                Email: email,
                Message: message
            });
            const fullUrl = `${baseUrl}?${params.toString()}`;

            console.log('Sending request to:', fullUrl);

            // Send request
            fetch(fullUrl, {
                method: 'GET',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            })
                .then(response => {
                    // Assume success in no-cors mode
                    console.log('Request dispatched');
                })
                .catch(error => {
                    console.error('Error:', error);
                })
                .finally(() => {
                    // Change button state
                    btn.classList.add('sent');
                    btnText.innerText = 'SENT!';
                    btn.style.background = '#00cc66'; // Green
                    btnIcon.innerText = '✓';

                    // Optional: Clear form
                    // form.reset();
                });
        });
    });
});
