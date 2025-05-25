// /js/productDetailsPage.js
import { fetchData } from './api.js';
import { renderProductCard } from './renderers.js'; // Для схожих товарів
import { getCurrentCart, saveCart, updateGlobalCartCount } from './cart.js';
import { showToast } from './uiElements.js';

export async function initializeProductDetailsPage() {
    const productDetailsContent = document.getElementById('product-details-content');
    const relatedProductsGrid = document.getElementById('related-products-grid');
    const productBreadcrumbs = document.getElementById('product-breadcrumbs');

    if (!productDetailsContent) return; // Якщо не сторінка деталей товару

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        productDetailsContent.innerHTML = '<p>Помилка: ID товару не вказано.</p>';
        return;
    }

    productDetailsContent.innerHTML = '<p class="loading-indicator">Завантаження деталей товару...</p>';
    const productResponse = await fetchData(`/api/products/${productId}`);

    if (productResponse && productResponse.success && productResponse.data) {
        const product = productResponse.data;
        document.title = `${product.name} - HappyKulka`; // Оновлюємо заголовок сторінки

        // Оновлення хлібних крихт
        if (productBreadcrumbs) {
            const breadcrumbOl = productBreadcrumbs.querySelector('ol');
            // Видаляємо попередні елементи після "Каталог"
            while (breadcrumbOl.children.length > 2) {
                breadcrumbOl.removeChild(breadcrumbOl.lastChild);
            }
            // Додаємо категорію, якщо є
            if (product.categorySlug) { // Припускаємо, що сервер повертає categorySlug
                // Потрібно отримати назву категорії за slug'ом (або передавати її з товаром)
                // Для простоти, поки що просто посилання на каталог з фільтром
                const categoryLi = document.createElement('li');
                // Потрібно знайти назву категорії. Якщо вона є в об'єкті product, використовуємо її.
                // Або робимо ще один запит /api/categories
                // const categoryName = product.categoryName || product.categorySlug; // Приклад
                categoryLi.innerHTML = `<a href="catalog.html?category=${product.categorySlug}">${product.categoryName || 'Категорія'}</a>`;
                breadcrumbOl.appendChild(categoryLi);
            }
            const productLi = document.createElement('li');
            productLi.setAttribute('aria-current', 'page');
            productLi.textContent = product.name;
            breadcrumbOl.appendChild(productLi);
        }

        const imageUrl = product.image && product.image.startsWith('/') ? product.image : `/images/products/${product.image || 'placeholder.png'}`;
        productDetailsContent.innerHTML = `
            <div class="product-image-gallery">
                <img src="${imageUrl}" alt="${product.name}" class="main-product-image" onerror="this.onerror=null;this.src='/images/placeholder.jpg';">
                <!-- Тут можна додати мініатюри, якщо є кілька зображень -->
            </div>
            <div class="product-info-main">
                <h1 class="product-title">${product.name}</h1>
                <div class="product-meta">
                    <span>Артикул: ${product.sku || product.id}</span> 
                    <span class="availability-status ${product.inStock !== false ? 'in-stock' : 'out-of-stock'}">
                        ${product.inStock !== false ? 'Є в наявності' : 'Немає в наявності'}
                    </span>
                    <!-- <span>Категорія: <a href="catalog.html?category=${product.categorySlug}">${product.categoryName || product.categorySlug}</a></span> -->
                </div>
                <div class="product-price-details">
                    ${parseFloat(product.price).toFixed(2)} грн
                </div>
                <div class="product-quantity-selector">
                    <label for="quantity-${product.id}">Кількість:</label>
                    <button class="quantity-btn" data-action="decrease" data-target="quantity-${product.id}">-</button>
                    <input type="number" id="quantity-${product.id}" value="1" min="1">
                    <button class="quantity-btn" data-action="increase" data-target="quantity-${product.id}">+</button>
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary add-to-cart-details-btn" 
                            data-product-id="${product.id}"
                            data-product-name="${product.name}"
                            data-product-price="${product.price}"
                            data-product-image="${imageUrl}">
                        В кошик
                    </button>
                    <!-- <button class="btn btn-outline-secondary btn-buy-one-click">Купити в 1 клік</button> -->
                </div>
                <div class="product-description-section">
                    <h3>Опис товару</h3>
                    <p>${product.description || 'Опис товару відсутній.'}</p>
                    <!-- Тут можуть бути характеристики, якщо вони є в product.data -->
                </div>
            </div>
        `;

        // Обробники для кнопок +/- кількості
        productDetailsContent.querySelectorAll('.quantity-btn').forEach(button => {
            button.addEventListener('click', function() {
                const action = this.dataset.action;
                const targetInputId = this.dataset.target;
                const inputElement = document.getElementById(targetInputId);
                if (inputElement) {
                    let currentValue = parseInt(inputElement.value);
                    if (action === 'increase') {
                        inputElement.value = currentValue + 1;
                    } else if (action === 'decrease' && currentValue > 1) {
                        inputElement.value = currentValue - 1;
                    }
                }
            });
        });

        // Обробник для кнопки "В кошик"
        productDetailsContent.querySelector('.add-to-cart-details-btn').addEventListener('click', function() {
            const quantityInput = document.getElementById(`quantity-${product.id}`);
            const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

            const cartProduct = {
                id: this.dataset.productId, name: this.dataset.productName,
                price: parseFloat(this.dataset.productPrice), image: this.dataset.productImage,
                quantity: quantity
            };
            let cart = getCurrentCart();
            const existingItemIndex = cart.findIndex(item => item.id === cartProduct.id);
            if (existingItemIndex > -1) {
                cart[existingItemIndex].quantity += quantity; // Додаємо обрану кількість
            } else {
                cart.push(cartProduct);
            }
            saveCart(cart);
            showToast(`${cartProduct.name} (x${quantity}) додано до кошика!`);
        });


        // Завантаження схожих товарів (приклад: товари з тієї ж категорії, крім поточного)
        if (relatedProductsGrid && product.categorySlug) {
            const relatedApiUrl = `/api/products?category=${product.categorySlug}&limit=5`; // Ліміт 5 схожих
            const relatedResponse = await fetchData(relatedApiUrl);
            if (relatedResponse && relatedResponse.success && Array.isArray(relatedResponse.data)) {
                relatedProductsGrid.innerHTML = '';
                relatedResponse.data
                    .filter(p => p.id !== product.id) // Виключаємо поточний товар
                    .slice(0, 4) // Беремо перші 4
                    .forEach(relatedProduct => {
                        relatedProductsGrid.appendChild(renderProductCard(relatedProduct));
                    });
            }
        }

    } else {
        productDetailsContent.innerHTML = `<p>Не вдалося завантажити інформацію про товар. ${productResponse?.message || ''}</p>`;
        document.title = "Товар не знайдено - HappyKulka";
    }
}