// /js/main.js

// Ініціалізація Firebase (виконається одразу при завантаженні цього модуля, оскільки firebaseClient.js імпортується)
// Переконайтеся, що цей файл існує і шляхи в ньому до CDN Firebase SDK правильні.
import './firebaseClient.js';

// Імпорт утиліт для UI
import { loadHTMLComponent, initializeScrollToTop } from './uiElements.js';

// Імпорт функцій для кошика
import { updateGlobalCartCount } from './cart.js';

// Імпорт ініціалізаторів для різних частин сайту/сторінок
import { initializeHeaderScripts } from './header.js';
import { initializeIndexPageContent } from './indexPage.js';
import { initializeCartPage } from './cartPage.js';
import { initializeCatalogPage } from './catalogPage.js';
// Додаємо імпорт для нової сторінки деталей товару
import { initializeProductDetailsPage } from './productDetailsPage.js';


// --- DOMContentLoaded ---
// Головна точка входу для ініціалізації скриптів після завантаження DOM
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM повністю завантажений та розпарсений. Початок ініціалізації скриптів...");

    try {
        // Завантажуємо хедер, ПІСЛЯ ЦЬОГО викликаємо initializeHeaderScripts,
        // оскільки initializeHeaderScripts може взаємодіяти з елементами хедера.
        await loadHTMLComponent('header.html', 'header-placeholder', initializeHeaderScripts);
        console.log("Хедер завантажено та ініціалізовано.");

        // Футер можна завантажувати, не чекаючи на інші скрипти, якщо він не має залежностей
        await loadHTMLComponent('footer.html', 'footer-placeholder');
        console.log("Футер завантажено.");

    } catch (error) {
        console.error("Критична помилка під час завантаження базових компонентів (хедер/футер):", error);
        // Тут можна показати повідомлення користувачу про неможливість завантажити сайт
    }
    
    // Ініціалізація контенту залежно від поточної сторінки
    // Використовуємо перевірку наявності унікальних елементів для кожної сторінки
    
    // Для головної сторінки (index.html)
    if (document.getElementById('promo-product-grid') && document.getElementById('new-arrivals-product-grid')) {
        console.log("Ініціалізація головної сторінки...");
        await initializeIndexPageContent();
    }
    
    // Для сторінки кошика (cart.html)
    if (document.getElementById('cart-table-body')) {
        console.log("Ініціалізація сторінки кошика...");
        initializeCartPage(); // Ця функція не асинхронна в поточній реалізації
    }
    
    // Для сторінки каталогу (catalog.html)
    if (document.getElementById('catalog-product-grid') && document.getElementById('category-filter-list')) {
        console.log("Ініціалізація сторінки каталогу...");
        await initializeCatalogPage();
    }

    // Для сторінки деталей товару (product-details.html)
    if (document.getElementById('product-details-content')) {
        console.log("Ініціалізація сторінки деталей товару...");
        await initializeProductDetailsPage();
    }
    
    initializeScrollToTop(); // Ініціалізація кнопки "Наверх"
    updateGlobalCartCount(); // Початкове оновлення лічильника кошика на всіх сторінках
    
    console.log("Загальна ініціалізація скриптів завершена.");
});