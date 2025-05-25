// /js/renderers.js
import { getCurrentCart, saveCart } from './cart.js'; // Переконайтеся, що шлях правильний
import { showToast } from './uiElements.js'; // Переконайтеся, що шлях правильний

export function renderProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Визначаємо URL зображення, припускаючи, що product.image може бути повним шляхом або лише ім'ям файлу
    const imageUrl = (product.image && product.image.startsWith('/')) 
                     ? product.image 
                     : `/images/products/${product.image || 'placeholder.png'}`;
    
    // Обгортаємо зображення та назву в посилання на сторінку деталей товару
    // Посилання веде на product-details.html з ID товару як параметром
    card.innerHTML = `
        <a href="product-details.html?id=${product.id}" class="product-card-link">
            <img src="${imageUrl}" alt="${product.name}" onerror="this.onerror=null;this.src='/images/placeholder.jpg';">
        </a>
        <div class="card-content">
            <a href="product-details.html?id=${product.id}" class="product-card-link">
                <h3>${product.name}</h3>
            </a>
            <p class="product-price">${parseFloat(product.price).toFixed(2)} грн</p>
            <button class="btn btn-primary add-to-cart-btn" 
                    data-product-id="${product.id}" 
                    data-product-name="${product.name}" 
                    data-product-price="${product.price}"
                    data-product-image="${imageUrl}"> 
                Додати в кошик
            </button>
        </div>
    `;
    
    // Обробник для кнопки "Додати в кошик"
    const addToCartButton = card.querySelector('.add-to-cart-btn');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', (event) => {
            event.preventDefault(); // Запобігаємо переходу за посиланням, якщо кнопка всередині <a>
            event.stopPropagation(); // Зупиняємо спливання події, щоб не спрацював клік на product-card-link

            const btn = event.currentTarget; // Використовуємо currentTarget для гарантії, що це кнопка
            const cartProduct = {
                id: btn.dataset.productId,
                name: btn.dataset.productName,
                price: parseFloat(btn.dataset.productPrice),
                image: btn.dataset.productImage, // Зберігаємо повний шлях до зображення
                quantity: 1
            };
            
            let cart = getCurrentCart();
            const existingItemIndex = cart.findIndex(item => item.id === cartProduct.id);

            if (existingItemIndex > -1) {
                cart[existingItemIndex].quantity += 1;
            } else {
                cart.push(cartProduct);
            }
            saveCart(cart);
            showToast(`${cartProduct.name} додано до кошика!`);
        });
    }
    return card;
}

export function renderCategoryCard(category) {
    const card = document.createElement('div');
    card.className = 'category-card';
    
    const imageUrl = (category.image && category.image.startsWith('/')) 
                     ? category.image 
                     : `/images/categories/${category.image || 'placeholder.png'}`;
                     
    card.innerHTML = `
        <img src="${imageUrl}" alt="${category.name}" onerror="this.onerror=null;this.src='/images/placeholder.jpg';">
        <div class="card-content">
            <h3>${category.name}</h3>
            <a href="catalog.html?category=${category.slug}" class="btn btn-secondary">До каталогу</a>
        </div>
    `;
    return card;
}