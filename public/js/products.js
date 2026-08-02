// Product data
const products = [
    {
        id: 1,
        name: "Weekend di relax",
        price: 80,
        priceLabel: "80 € a persona",
        description: "Soggiorno di 2 giorni e 1 notte ideale per una fuga tranquilla con colazione, giardino e privacy.",
        includes: ["Colazione locale inclusa", "Wi-Fi gratuito", "Parcheggio privato"],
        limits: ["Perfetto per 2 persone", "Silenzio obbligatorio dopo le 23:00"],
        bookingUrl: "https://www.booking.com/hotel/it/la-papessa-savio.it.html"
    },
    {
        id: 2,
        name: "Soggiorno esteso",
        price: 120,
        priceLabel: "120 € a persona",
        description: "Tariffa pensata per 3 giorni e 2 notti, con maggiore libertà per esplorare il territorio e rilassarsi.",
        includes: ["Colazione inclusa", "Ingresso indipendente", "Zona tranquilla"],
        limits: ["Disponibilità da confermare in base alla stagione", "Ospiti extra non ammessi senza prenotazione"],
        bookingUrl: "https://www.booking.com/hotel/it/la-papessa-savio.it.html"
    },
    {
        id: 3,
        name: "Notte aggiuntiva",
        price: 60,
        priceLabel: "60 € a persona / notte",
        description: "Per soggiorni più lunghi, ogni notte aggiuntiva è prevista con la stessa cura e gli stessi servizi base.",
        includes: ["Stesso comfort del soggiorno base", "Uso del giardino e delle aree comuni", "Assistenza per esigenze semplici"],
        limits: ["Valida dal terzo giorno in poi", "Richiede conferma preventiva per eventuali ospiti aggiuntivi"],
        bookingUrl: "https://www.booking.com/hotel/it/la-papessa-savio.it.html"
    },
    {
        id: 4,
        name: "Animali e famiglie",
        price: 15,
        priceLabel: "15 € ad animale / notte",
        description: "Informazioni utili per chi viaggia con animali o con bambini, con regole chiare per un soggiorno sereno.",
        includes: ["Accoglienza per animali piccoli", "Spazi esterni e giardino", "Disponibilità per esigenze familiari"],
        limits: ["Animali di taglia grande non ammessi", "Bambini sotto i 12 anni devono essere dichiarati in prenotazione"],
        bookingUrl: "https://www.booking.com/hotel/it/la-papessa-savio.it.html"
    }
];

// Load products into the grid
function loadProducts() {
    const productGrid = document.getElementById('products-grid');

    if (!productGrid) return;

    productGrid.innerHTML = products.map(product => `
        <article class="feature-card">
            <div class="card-image">
                <img src="${product.image || `images/products/product${product.id}.jpg`}" alt="${product.name}" class="product-image">
            </div>
            <div class="card-content">
                <h3>${product.name}</h3>
                <p class="card-price">${product.priceLabel}</p>
                <p class="card-summary">${product.description}</p>
                <div class="card-section">
                    <h4>Incluso</h4>
                    <ul class="card-list">
                        ${product.includes.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                <div class="card-section">
                    <h4>Limiti e condizioni</h4>
                    <ul class="card-list">
                        ${product.limits.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                <a class="card-link" href="${product.bookingUrl}" target="_blank" rel="noopener noreferrer">
                    Vedi disponibilità su Booking.com
                </a>
            </div>
        </article>
    `).join('');
}

// Load products when page loads
document.addEventListener('DOMContentLoaded', loadProducts);