// /js/cartPage.js
import { getCurrentCart, saveCart, updateGlobalCartCount } from './cart.js';

function renderCartPageItems() {
    const cart = getCurrentCart();
    const cartTableBody = document.getElementById('cart-table-body');
    const cartTotalPriceEl = document.getElementById('cart-total-price');
    const cartContent = document.getElementById('cart-content'); 
    if (!cartTableBody || !cartTotalPriceEl || !cartContent) return;

    const cartItemsContainer = cartContent.querySelector('.cart-items');
    const cartSummaryContainer = cartContent.querySelector('.cart-summary');
    const cartActionsContainer = cartContent.querySelector('.cart-actions');
    let emptyCartMsgEl = cartContent.querySelector('.empty-cart-message');

    if (cart.length === 0) {
        if(cartItemsContainer) cartItemsContainer.style.display = 'none';
        if(cartSummaryContainer) cartSummaryContainer.style.display = 'none';
        if(cartActionsContainer) cartActionsContainer.style.display = 'none';
        if (!emptyCartMsgEl) {
            emptyCartMsgEl = document.createElement('div');
            emptyCartMsgEl.className = 'empty-cart-message';
            cartContent.insertBefore(emptyCartMsgEl, cartContent.firstChild); 
        }
        emptyCartMsgEl.innerHTML = `<p>Ваш кошик порожній.</p><a href="catalog.html" class="btn btn-primary">До каталогу</a>`;
        emptyCartMsgEl.style.display = 'block';
        cartTotalPriceEl.textContent = '0.00 грн';
    } else {
        if(cartItemsContainer) cartItemsContainer.style.display = 'table'; 
        if(cartSummaryContainer) cartSummaryContainer.style.display = 'block';
        if(cartActionsContainer) cartActionsContainer.style.display = 'flex';
        if(emptyCartMsgEl) emptyCartMsgEl.style.display = 'none';

        cartTableBody.innerHTML = ''; 
        let overallTotalPrice = 0;
        cart.forEach(item => {
            const itemSubtotal = item.price * item.quantity;
            overallTotalPrice += itemSubtotal;
            const row = document.createElement('tr');
            row.dataset.productId = item.id;
            const imageUrl = (item.image && item.image.startsWith('/')) ? item.image : `/images/products/${item.image || 'placeholder.png'}`;
            row.innerHTML = `
                <td class="product-info" data-label="Товар:">
                    <img src="${imageUrl}" alt="${item.name}" class="product-image-small" onerror="this.onerror=null;this.src='/images/placeholder.jpg';">
                    ${item.name}
                </td>
                <td class="product-price-cell" data-label="Ціна:">${item.price.toFixed(2)} грн</td>
                <td data-label="Кількість:"><input type="number" value="${item.quantity}" min="1" class="quantity-input" data-product-id="${item.id}"></td>
                <td class="product-subtotal-cell" data-label="Сума:">${itemSubtotal.toFixed(2)} грн</td>
                <td data-label="Дія:"><button class="remove-item-btn btn btn-outline-secondary btn-small" data-product-id="${item.id}">Видалити</button></td>`;
            cartTableBody.appendChild(row);
        });
        cartTotalPriceEl.textContent = `${overallTotalPrice.toFixed(2)} грн`;
    }
    updateGlobalCartCount();
}

function handleCartQuantityChange(event) {
    const productId = event.target.dataset.productId;
    const newQuantity = parseInt(event.target.value);
    let cart = getCurrentCart();
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        cart[itemIndex].quantity = newQuantity > 0 ? newQuantity : 1;
        if (newQuantity <= 0) event.target.value = 1;
        saveCart(cart);
        renderCartPageItems(); 
    }
}

function handleRemoveCartItem(event) {
    const productId = event.target.dataset.productId;
    saveCart(getCurrentCart().filter(item => item.id !== productId));
    renderCartPageItems(); 
}

function addCartPageEventListeners() {
    const cartTableBody = document.getElementById('cart-table-body');
    if (cartTableBody) { 
        cartTableBody.addEventListener('change', e => {
            if (e.target.classList.contains('quantity-input')) handleCartQuantityChange(e);
        });
        cartTableBody.addEventListener('click', e => {
            if (e.target.classList.contains('remove-item-btn')) handleRemoveCartItem(e);
        });
    }
}

export function initializeCartPage() {
    const cartTableBody = document.getElementById('cart-table-body');
    if (!cartTableBody) return; 
    renderCartPageItems();
    addCartPageEventListeners();
}