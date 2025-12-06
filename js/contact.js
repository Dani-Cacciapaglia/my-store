// Contact form handling
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Get form data
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };

            // Simulate form submission
            // In production, you would send this to a backend or service like FormSpree
            submitForm(formData);
        });
    }

    function submitForm(data) {
        // Show loading state
        const submitBtn = contactForm.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        // Simulate API call with setTimeout
        setTimeout(() => {
            // Success simulation
            formStatus.className = 'form-status success';
            formStatus.textContent = 'Thank you for your message! We\'ll get back to you soon.';
            
            // Reset form
            contactForm.reset();
            
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            // Hide success message after 5 seconds
            setTimeout(() => {
                formStatus.style.display = 'none';
            }, 5000);

            // Log form data (for development)
            console.log('Form submitted:', data);

        }, 1500);

        /* 
        PRODUCTION VERSION - Uncomment and configure when ready to use FormSpree:
        
        fetch('https://formspree.io/f/YOUR_FORM_ID', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            formStatus.className = 'form-status success';
            formStatus.textContent = 'Thank you! We\'ll get back to you soon.';
            contactForm.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        })
        .catch(error => {
            formStatus.className = 'form-status error';
            formStatus.textContent = 'Oops! Something went wrong. Please try again.';
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
        */
    }
});