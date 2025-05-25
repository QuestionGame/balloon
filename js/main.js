// /js/main.js

// Ініціалізація Firebase (виконається одразу при завантаженні цього модуля, оскільки firebaseClient.js імпортується)
import './firebaseClient.js'; // Переконайтеся, що шлях правильний

// Імпорт утиліт для UI
import { loadHTMLComponent, initializeScrollToTop } from './uiElements.js';

// Імпорт функцій для кошика
import { updateGlobalCartCount } from './cart.js';

// Імпорт ініціалізаторів для різних частин сайту/сторінок
import { initializeHeaderScripts } from './header.js';
import { initializeIndexPageContent } from './indexPage.js';
import { initializeCartPage } from './cartPage.js';
import { initializeCatalogPage } from './catalogPage.js';
import { initializeProductDetailsPage } from './productDetailsPage.js'; // Припускаємо, файл створено
import { initializeAuthForms } // Не експортуємо handleLogout тут, він викликається всередині auth.js
from './auth.js'; 
import { initializeProfilePage } from './profilePage.js'; // Імпорт для сторінки профілю

// --- DOMContentLoaded ---
// Головна точка входу для ініціалізації скриптів після завантаження DOM
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM повністю завантажений. Початок ініціалізації скриптів...");

    try {
        // Завантажуємо хедер. initializeHeaderScripts викликається як колбек ПІСЛЯ завантаження HTML,
        // оскільки він може взаємодіяти з DOM-елементами хедера.
        await loadHTMLComponent('header.html', 'header-placeholder', initializeHeaderScripts);
        console.log("Хедер завантажено та його скрипти ініціалізовано (або процес запущено).");

        await loadHTMLComponent('footer.html', 'footer-placeholder');
        console.log("Футер завантажено.");

    } catch (error) {
        console.error("Критична помилка під час завантаження базових компонентів (хедер/футер):", error);
    }
    
    // Ініціалізація форм входу/реєстрації (спрацює, якщо ми на login.html або register.html)
    initializeAuthForms(); 
    
    // Ініціалізація контенту/логіки залежно від поточної сторінки
    if (document.getElementById('promo-product-grid')) { // Головна сторінка
        console.log("Ініціалізація головної сторінки...");
        await initializeIndexPageContent();
    }
    
    if (document.getElementById('cart-table-body')) { // Сторінка кошика
        console.log("Ініціалізація сторінки кошика...");
        initializeCartPage();
    }
    
    if (document.getElementById('catalog-product-grid')) { // Сторінка каталогу
        console.log("Ініціалізація сторінки каталогу...");
        await initializeCatalogPage();
    }

    if (document.getElementById('product-details-content')) { // Сторінка деталей товару
        console.log("Ініціалізація сторінки деталей товару...");
        await initializeProductDetailsPage();
    }

    if (document.getElementById('user-profile-content')) { // Сторінка профілю користувача
        console.log("Ініціалізація сторінки профілю...");
        initializeProfilePage(); // Ця функція не асинхронна в поточній реалізації
    }
    
    initializeScrollToTop(); // Ініціалізація кнопки "Наверх"
    updateGlobalCartCount(); // Початкове оновлення лічильника кошика
    
    console.log("Загальна ініціалізація скриптів на сторінці завершена.");
});