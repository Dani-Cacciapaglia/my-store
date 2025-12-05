// Sample product data
const products = [
    {
        id: 1,
        name: "Product 1",
        price: 49.99,
        description: "High quality product description",
        image: "images/products/product1.jpg"
    },
    {
        id: 2,
        name: "Product 2",
        price: 59.99,
        description: "Another great product",
        image: "images/products/product2.jpg"
    },
    // Add more products...
];

// Load products into grid
function loadProducts() {
    const productGrid = document.getElementById('product-grid');
    
    if (!productGrid) return;
    
    productGrid.innerHTML = products.map(product => `
        <div class="product-card" onclick="viewProduct(${product.id})">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">$${product.price}</p>
                <p class="product-description">${product.description}</p>
            </div>
        </div>
    `).join('');
}

// View individual product
function viewProduct(id) {
    // Could navigate to product page or open modal
    window.location.href = `product.html?id=${id}`;
}

// Load products when page loads
document.addEventListener('DOMContentLoaded', loadProducts);