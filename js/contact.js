// Contact form with FormSubmit.co email service
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            // Create FormData object
            const formData = new FormData(contactForm);
            
            // Add hidden fields for FormSubmit
            formData.append('_subject', 'New contact form submission from Desert Store');
            formData.append('_captcha', 'false');

            // Send to FormSubmit
            fetch('https://formsubmit.co/cacciapagliadaniele8@gmail.com', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                formStatus.className = 'form-status success';
                formStatus.textContent = 'Thank you! Your message has been sent successfully.';
                contactForm.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                
                setTimeout(() => {
                    formStatus.style.display = 'none';
                }, 5000);
            })
            .catch(error => {
                console.error('Error:', error);
                formStatus.className = 'form-status error';
                formStatus.textContent = 'Sorry, there was an error. Please email us directly at cacciapagliadaniele8@gmail.com';
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                
                setTimeout(() => {
                    formStatus.style.display = 'none';
                }, 7000);
            });
        });
    }
});