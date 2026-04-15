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
});
