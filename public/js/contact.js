document.addEventListener("DOMContentLoaded", () => {
    
    const form = document.getElementById("contact-form");
    const status = document.getElementById("form-status");

    if (!form || !status) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        status.textContent = "Sending message...";
        status.className = "form-status";

        const formData = new FormData(form);

        try {
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData,
                headers: {
                    "Accept": "application/json"
                }
            });

            let result;
            const contentType = response.headers.get("content-type");

            if (contentType && contentType.includes("application/json")) {
                result = await response.json();
            } else {
                throw new Error("Invalid response format");
            }

            if (response.ok && result.success) {
                status.textContent = "Message sent successfully ✓";
                status.classList.add("success");
                form.reset();
            } else {
                status.textContent =
                    result.message || "Failed to send message.";
                status.classList.add("error");
            }

        } catch (error) {
            console.error("Contact form error:", error);
            status.textContent =
                "Network or server error. Please try again later.";
            status.classList.add("error");
        }
    });
  const bookingData = JSON.parse(sessionStorage.getItem('bookingData'));

  if (bookingData) {
    document.getElementById('arrival').value = bookingData.checkin || '';
    document.getElementById('departure').value = bookingData.checkout || '';
    document.getElementById('apartment').value = bookingData.apartment || '';
    document.getElementById('adults').value = bookingData.adults || 1;
    document.getElementById('children').value = bookingData.children || 0;
    document.getElementById('quotation').value = bookingData.quotation || '';

    const messageField = document.getElementById('message');
    if (messageField) {
      messageField.value = `Buongiorno, vorrei richiedere disponibilità per ${bookingData.apartment} dal ${bookingData.checkin} al ${bookingData.checkout} per ${bookingData.adults} adulti e ${bookingData.children} bambini. Prezzo stimato ${bookingData.quotation}`;
    }
  }
});
