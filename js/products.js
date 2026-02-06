// Product data
const products = [
    {
        id: 1,
        name: "Design moderno",
        price: 80.00,
        description: "Arredamento ispirato al mare e organizzato in modo funzionale ",
        image: "images/products/product1.jpg"
    },
    {
        id: 2,
        name: "Dolce risveglio",
        price: 15.00,
        description: "Colazioni preparate dal nostro chef giornalmente con prodotti stagionali",
        image: "images/products/product2.jpg"
    },
    {
        id: 3,
        name: "Notti magiche",
        price: 0.00,
        description: "Materassi di alta qualità e biancheria in cotone per un sonno rigenerante",
        image: "images/products/product3.jpg"
    },
    {
        id: 4,
        name: "Una notte due persone",
        price: 80.00,
        description: "Prezzo a persona con colazione inclusa",
        image: "images/products/product1.jpg"
    },
    {
        id: 5,
        name: "Due notti due persone",
        price: 120.00,
        description: "Prezzo a persona con colazione inclusa",
        image: "images/products/product2.jpg"
    },
    {
        id: 6,
        name: "Oltre due notti due persone",
        price: 60.00,
        description: "Prezzo a persona per ogni notte successiva alla seconda, con colazione inclusa",
        image: "images/products/product3.jpg"
    }
];

// Load products into the grid (updated for smaller cards)
function loadProducts() {
    const productGrid = document.getElementById('products-grid');
    
    if (!productGrid) return;
    
    productGrid.innerHTML = products.map(product => `
        <div class="feature-card" onclick="viewProduct(${product.id})">
            <div class="card-image">
                <img src="${product.image}" alt="${product.name}" class="product-image">
            </div>
            <div class="card-content">
                <h3>${product.name}</h3>
                <p class="card-price">€${product.price.toFixed(2)}</p>
                <p>${product.description}</p>
            </div>
        </div>
    `).join('');
}

// View individual product
function viewProduct(id) {
    window.location.href = `product.html?id=${id}`;
}

// Load products when page loads
document.addEventListener('DOMContentLoaded', loadProducts);