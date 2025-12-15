// Contact form handling with email functionality
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

            // Send email using FormSubmit.co
            submitForm(formData);
        });
    }

    function submitForm(data) {
        // Show loading state
        const submitBtn = contactForm.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        // Prepare FormData for FormSubmit
        const formSubmitData = new FormData();
        formSubmitData.append('name', data.name);
        formSubmitData.append('email', data.email);
        formSubmitData.append('subject', data.subject || 'Contact Form Submission');
        formSubmitData.append('message', data.message);

        // Send to FormSubmit.co (sends email to your address)
        fetch('https://formsubmit.co/cacciapagliadaniele0@gmail.com', {
            method: 'POST',
            body: formSubmitData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Network response was not ok');
        })
        .then(result => {
            // Success
            formStatus.className = 'form-status success';
            formStatus.textContent = 'Thank you for your message! We\'ll get back to you soon.';
            contactForm.reset();
            
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            // Hide success message after 5 seconds
            setTimeout(() => {
                formStatus.style.display = 'none';
            }, 5000);
        })
        .catch(error => {
            // Error
            console.error('Error:', error);
            formStatus.className = 'form-status error';
            formStatus.textContent = 'Oops! Something went wrong. Please try again or email us directly at contact@desertstore.com';
            
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            // Hide error message after 7 seconds
            setTimeout(() => {
                formStatus.style.display = 'none';
            }, 7000);
        });
    }
});