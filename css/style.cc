/* Reset */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Navigation */
.navbar {
    background: #fff;
    padding: 1rem 0;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    position: sticky;
    top: 0;
    z-index: 100;
}

.navbar .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo {
    font-size: 1.5rem;
    font-weight: bold;
    text-decoration: none;
    color: #333;
}

.nav-links {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-links a {
    text-decoration: none;
    color: #333;
    transition: color 0.3s;
}

.nav-links a:hover {
    color: #666;
}

/* Hero Section */
.hero {
    background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)),
                url('../images/hero.jpg') center/cover;
    height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    text-align: center;
}

.hero-content h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.btn {
    display: inline-block;
    padding: 12px 30px;
    background: #333;
    color: white;
    text-decoration: none;
    border-radius: 5px;
    margin-top: 1rem;
    transition: background 0.3s;
}

.btn:hover {
    background: #555;
}

/* Product Grid */
.featured-products {
    padding: 4rem 0;
}

.featured-products h2 {
    text-align: center;
    margin-bottom: 3rem;
    font-size: 2rem;
}

.product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
}

.product-card {
    border: 1px solid #eee;
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.3s, box-shadow 0.3s;
    cursor: pointer;
}

.product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.product-image {
    width: 100%;
    height: 300px;
    object-fit: cover;
}

.product-info {
    padding: 1rem;
}

.product-name {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
}

.product-price {
    font-size: 1.2rem;
    font-weight: bold;
    color: #333;
}

.product-description {
    color: #666;
    margin-top: 0.5rem;
    font-size: 0.9rem;
}