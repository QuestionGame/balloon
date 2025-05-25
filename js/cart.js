// /js/cart.js

export function updateGlobalCartCount() {
    const cartItemCount = getCurrentCartTotalItems();
    const headerCartCountEl = document.getElementById('cart-count-header');
    if (headerCartCountEl) headerCartCountEl.textContent = cartItemCount;
    
    const pageCartCountEl = document.getElementById('cart-count-page');
    if (pageCartCountEl) pageCartCountEl.textContent = cartItemCount;
    
    const loginPageCartCountEl = document.getElementById('cart-count-page-login');
    if (loginPageCartCountEl) loginPageCartCountEl.textContent = cartItemCount;
}

export function getCurrentCart() { 
    return JSON.parse(localStorage.getItem('cart')) || []; 
}

export function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateGlobalCartCount(); // Важливо оновлювати лічильник після кожного збереження
}

export function getCurrentCartTotalItems() { 
    return getCurrentCart().reduce((sum, item) => sum + item.quantity, 0); 
}