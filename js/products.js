// Product data
const products = [
    {
        id: 1,
        name: "Desert Vase Collection",
        price: 89.99,
        description: "Handcrafted ceramic vases inspired by desert rock formations",
        image: "images/products/product1.jpg"
    },
    {
        id: 2,
        name: "Woven Wall Hanging",
        price: 129.99,
        description: "Natural fiber wall art with geometric desert patterns",
        image: "images/products/product2.jpg"
    },
    {
        id: 3,
        name: "Terracotta Plant Pots",
        price: 45.99,
        description: "Set of 3 handmade terracotta pots with drainage",
        image: "images/products/product3.jpg"
    },
    {
        id: 4,
        name: "Leather Journal",
        price: 65.00,
        description: "Hand-bound journal with desert-tanned leather cover",
        image: "images/products/product1.jpg"
    },
    {
        id: 5,
        name: "Macrame Plant Hanger",
        price: 38.50,
        description: "Boho-style plant hanger with wooden beads",
        image: "images/products/product2.jpg"
    },
    {
        id: 6,
        name: "Clay Incense Holder",
        price: 24.99,
        description: "Minimalist incense holder in natural clay",
        image: "images/products/product3.jpg"
    }
];

// Load products into the grid
function loadProducts() {
    const productGrid = document.getElementById('products-grid');
    
    if (!productGrid) return;
    
    productGrid.innerHTML = products.map(product => `
        <div class="product-card" onclick="viewProduct(${product.id})">
            <div class="product-image-wrapper">
                <div class="placeholder-image" style="height: 100%; margin: 0; border: none;">
                    <p>Product Image<br>${product.name}<br>350x350px</p>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <p class="product-description">${product.description}</p>
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