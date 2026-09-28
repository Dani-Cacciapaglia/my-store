document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

const header = document.querySelector('.header-transparent');
if (header) {
    window.addEventListener('scroll', () => {
        header.style.boxShadow = window.pageYOffset > 100
            ? '0 2px 20px rgba(0, 0, 0, 0.1)'
            : '0 2px 10px rgba(0, 0, 0, 0.1)';
    }, { passive: true });
}

const menuToggle = document.getElementById('menu-toggle');
const mainNav = document.getElementById('main-nav');
if (menuToggle && mainNav) {
    const setMenuOpen = (open) => {
        menuToggle.classList.toggle('active', open);
        mainNav.classList.toggle('active', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
    };

    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Apri menu');
    menuToggle.setAttribute('aria-controls', mainNav.id);
    menuToggle.addEventListener('click', () => setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true'));
    mainNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenuOpen(false)));
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.header-content')) setMenuOpen(false);
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
            setMenuOpen(false);
            menuToggle.focus();
        }
    });
}

document.querySelectorAll('a[href="#"][target="_blank"]').forEach((link) => {
    link.closest('.social-links, .social-links-vertical')?.remove();
});
document.querySelectorAll('.contact-info-card').forEach((card) => {
    const heading = card.querySelector('h3');
    if (heading?.textContent.trim() === 'Follow Us') card.remove();
});
document.querySelectorAll('.footer-section').forEach((section) => {
    if (!section.textContent.trim() && !section.querySelector('img')) section.remove();
});

document.querySelectorAll('.site-footer .footer-content').forEach((footer) => {
    if (footer.querySelector('.legal-footer-links')) return;
    const links = document.createElement('nav');
    links.className = 'legal-footer-links';
    links.setAttribute('aria-label', 'Informazioni legali e privacy');
    links.innerHTML = '<a href="legal.html#privacy">Privacy</a><a href="legal.html#terms">Condizioni d’uso</a><a href="legal.html#cookies">Cookie</a><button type="button" class="cookie-preferences-link">Preferenze cookie</button>';
    footer.append(links);
});

const consentKey = 'lapapessa-cookie-choice';
let consentChoice = null;
try {
    consentChoice = localStorage.getItem(consentKey);
} catch (error) {
    consentChoice = null;
}

const cookieBanner = document.createElement('aside');
cookieBanner.className = 'cookie-banner';
cookieBanner.setAttribute('aria-label', 'Preferenze cookie');
cookieBanner.setAttribute('aria-live', 'polite');
cookieBanner.hidden = Boolean(consentChoice);
cookieBanner.innerHTML = '<div><strong>La tua privacy conta</strong><p>Al momento non usiamo cookie di analisi o pubblicitari. Puoi scegliere se consentire eventuali strumenti non necessari; rifiutare non limita il sito. <a href="legal.html#cookies">Dettagli</a></p></div><div class="cookie-banner-actions"><button type="button" data-cookie-choice="necessary">Rifiuta non necessari</button><button type="button" data-cookie-choice="all">Accetta non necessari</button></div>';
document.body.append(cookieBanner);

const closeCookieBanner = (choice) => {
    try {
        localStorage.setItem(consentKey, choice);
    } catch (error) {
        // The choice remains usable for this page view if storage is unavailable.
    }
    cookieBanner.hidden = true;
};

cookieBanner.querySelectorAll('[data-cookie-choice]').forEach((button) => {
    button.addEventListener('click', () => closeCookieBanner(button.dataset.cookieChoice));
});

const openCookieBanner = () => {
    cookieBanner.hidden = false;
    cookieBanner.querySelector('[data-cookie-choice="necessary"]').focus();
};
document.querySelectorAll('.cookie-preferences-link, #open-cookie-settings').forEach((button) => {
    button.addEventListener('click', openCookieBanner);
});