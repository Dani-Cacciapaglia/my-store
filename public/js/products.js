// Product data based on the current Booking.com listing
const products = [
    {
        id: 1,
        name: "Appartamento Saline",
        priceLabel: "A partire da 160€ per due notti.",
        summary: "Ideale per famiglie o gruppi che cercano spazio, privacy e autonomia.",
        meta: "Fino a 5 adulti · 2 camere · 2 bagni · 1 balcone",
        details: [
            "Capienza: fino a 5 adulti.",
            "Tipologia: 2 camere da letto con 1 letto matrimoniale large e 1 letto matrimoniale.",
            "Servizi: Frigorifero, Wi-Fi gratuito, parcheggio garantito e colazione inclusa.",
            "Tariffe: Per il prezzo esatto verificare nella pagina Disponibilità."
        ],
        rules: [
            "Check-in: dalle 18:00 alle 19:00.",
            "Check-out: dalle 08:00 alle 10:00.",
            "Silenzio: dalle 23:00 alle 09:00.",
            "Animali: non ammessi.",
            "Fumo: vietato all'interno.",
            "Nessuna età minima per il check-in."
        ],
        image: "images/products/product1.jpg",
    },
    {
        id: 2,
        name: "Appartamento Ulivo",
        priceLabel: "A partire da 120€ per due notti.",
        summary: "Perfetto per coppie o soggiorni medi, con soggiorno luminoso e balcone.",
        meta: "Fino a 4 adulti · 1 camera · balcone",
        details: [
            "Capienza: fino a 4 adulti.",
            "Tipologia: 1 camera da letto con 1 letto matrimoniale large e 1 divano letto.",
            "Servizi: bagno privato, balcone, Wi-Fi gratuito, parcheggio privato e colazione.",
            "Tariffe: Per il prezzo esatto verificare nella pagina Disponibilità."
        ],
        rules: [
            "Check-in: dalle 18:00 alle 19:00.",
            "Check-out: dalle 08:00 alle 10:00.",
            "Silenzio: dalle 23:00 alle 09:00.",
            "Animali: non ammessi.",
            "Fumo: vietato all'interno.",
            "Bambini di tutte le età sono benvenuti, ma i maggiori di 18 anni pagano come adulti."
        ],
        image: "images/products/product2.jpg",
    }
];

function loadProducts() {
    const productGrid = document.getElementById('products-grid');

    if (!productGrid) return;

    productGrid.innerHTML = products.map(product => `
        <article class="feature-card">
            <div class="card-image">
                <img src="${product.image}" alt="${product.name}" class="product-image">
            </div>
            <div class="card-content">
                <p class="card-eyebrow">${product.name}</p>
                <p class="card-price">${product.priceLabel}</p>
                <p class="card-summary">${product.summary}</p>
                <p class="card-meta">${product.meta}</p>
                <button class="card-link" type="button" data-product-id="${product.id}">
                    Scopri dettagli e tariffe
                </button>
            </div>
        </article>
    `).join('');

    productGrid.querySelectorAll('.card-link').forEach(button => {
        button.addEventListener('click', () => openProductDetail(Number(button.dataset.productId)));
    });
}

function openProductDetail(id) {
    const product = products.find(item => item.id === id);
    const detailPanel = document.getElementById('detail-panel');

    if (!product || !detailPanel) return;

    detailPanel.hidden = false;
    detailPanel.innerHTML = `
        <div class="detail-panel-content">
            <div class="detail-header">
                <div>
                    <p class="card-eyebrow">${product.name}</p>
                </div>
                <button class="detail-close" type="button" data-action="close">Chiudi</button>
            </div>
            <div class="detail-body">
                <div class="detail-section">
                    <h4>Tariffe</h4>
                    <ul class="detail-list">
                        <li>${product.details[3]}</li>
                    </ul>
                </div>
                <div class="detail-section">
                    <h4>Informazioni principali</h4>
                    <ul class="detail-list">
                        ${product.details.slice(0, 3).map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                <div class="detail-section">
                    <h4>Regole e condizioni</h4>
                    <ul class="detail-list">
                        ${product.rules.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `;

    detailPanel.querySelector('[data-action="close"]').addEventListener('click', () => {
        detailPanel.hidden = true;
        detailPanel.innerHTML = '';
    });

    detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Load products when page loads
document.addEventListener('DOMContentLoaded', loadProducts);