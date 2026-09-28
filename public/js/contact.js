document.addEventListener("DOMContentLoaded", () => {
    
    const form = document.getElementById("contact-form");
    const status = document.getElementById("form-status");
    const privacyAcknowledgment = document.getElementById("privacy-acknowledgment");

    if (!form || !status || !privacyAcknowledgment) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!privacyAcknowledgment.checked) {
            status.textContent = "Leggi e conferma l'informativa privacy prima di inviare.";
            status.className = "form-status error";
            privacyAcknowledgment.focus();
            return;
        }

        status.textContent = "Invio in corso...";
        status.className = "form-status";

        const formData = new FormData(form);
        for (const [fieldName, value] of Array.from(formData.entries())) {
            if (typeof value === "string" && !value.trim()) {
                formData.delete(fieldName);
            }
        }

        try {
            const apiUrl = typeof CALENDAR_CONFIG !== "undefined" ? CALENDAR_CONFIG.API_URL : window.location.origin;
            const response = await fetch(`${apiUrl}/api/contact`, {
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
                status.textContent = "Richiesta inviata. Grazie per averci contattato: ti risponderemo all'indirizzo email indicato, di norma entro 24 ore.";
                status.classList.add("success");
                form.reset();
            } else if (response.status === 503) {
                status.innerHTML = 'Invio dal sito temporaneamente non configurato. Puoi scriverci direttamente a <a href="mailto:papessavacanze@gmail.com">papessavacanze@gmail.com</a>.';
                status.classList.add("error");
            } else {
                status.textContent =
                    result.error || "Invio non riuscito. Riprova.";
                status.classList.add("error");
            }

        } catch (error) {
            console.error("Contact form error:", error);
            status.textContent =
                "Errore di rete o del servizio. Riprova piu tardi.";
            status.classList.add("error");
        }
    });
    try {
        const storedBookingData = sessionStorage.getItem('bookingData');
        if (storedBookingData) {
            const bookingData = JSON.parse(storedBookingData);
            document.getElementById('arrival').value = bookingData.checkin || '';
            document.getElementById('departure').value = bookingData.checkout || '';
            document.getElementById('apartment').value = bookingData.apartment || '';
            document.getElementById('adults').value = bookingData.adults || 1;
            document.getElementById('children').value = bookingData.children || 0;
        }
    } catch (error) {
        console.warn('Could not restore the temporary booking selection.');
    } finally {
        try {
            sessionStorage.removeItem('bookingData');
        } catch (error) {
            // Storage may be disabled by the browser.
        }
    }
});
