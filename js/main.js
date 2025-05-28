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
import { initializeProductDetailsPage } from './productDetailsPage.js';
import { initializeAuthForms, authReady } from './auth.js'; // Імпортуємо authReady
import { initializeProfilePage } from './profilePage.js'; 
import { initializeCheckoutPage } from './checkoutPage.js';
import { initializeOrderDetailsPage } from './orderDetailsPage.js';

// --- DOMContentLoaded ---
// Головна точка входу для ініціалізації скриптів після завантаження DOM
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM повністю завантажений. Початок ініціалізації скриптів...");

    try {
        // Спочатку завантажуємо хедер/футер, оскільки вони можуть містити елементи,
        // які оновлюються initializeHeaderScripts (наприклад, лічильник кошика, меню).
        // initializeHeaderScripts сам по собі не залежить від стану користувача для першого завантаження DOM.
        await loadHTMLComponent('header.html', 'header-placeholder', initializeHeaderScripts);
        console.log("Хедер завантажено та його скрипти ініціалізовано.");

        await loadHTMLComponent('footer.html', 'footer-placeholder');
        console.log("Футер завантажено.");

    } catch (error) {
        console.error("Критична помилка під час завантаження базових компонентів (хедер/футер):", error);
    }
    
    // Ініціалізація форм входу/реєстрації (вони самі по собі не вимагають знання поточного користувача для ініціалізації форми)
    initializeAuthForms(); 
    
    console.log("main.js: Очікування на готовність Firebase Auth (authReady)...");
    // Чекаємо, поки Firebase визначить початковий стан автентифікації
    // `authReady` поверне об'єкт user або null
    await authReady; 
    // Після цього моменту auth.currentUser в інших модулях (наприклад, profilePage) вже має бути встановлений
    // Firebase SDK під капотом оновить auth.currentUser, і onAuthStateChanged (динамічний) в auth.js також спрацює.
    console.log("main.js: Firebase Auth готовий (authReady виконано). Стан користувача має бути визначено.");


    // Ініціалізація контенту/логіки залежно від поточної сторінки
    // Ці функції тепер можуть безпечно використовувати auth.currentUser, оскільки ми дочекалися authReady
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
        // Якщо initializeCatalogPage залежить від стану користувача (наприклад, для обраних товарів),
        // то auth.currentUser тепер буде актуальним.
        await initializeCatalogPage();
    }

    if (document.getElementById('product-details-content')) { // Сторінка деталей товару
        console.log("Ініціалізація сторінки деталей товару...");
        await initializeProductDetailsPage();
    }

    if (document.getElementById('user-profile-content')) { // Сторінка профілю користувача
        console.log("Ініціалізація сторінки профілю...");
        initializeProfilePage(); 
    }

    if (document.getElementById('checkout-form')) { // Сторінка оформлення замовлення
        console.log("Ініціалізація сторінки оформлення замовлення...");
        initializeCheckoutPage();
    }
    
    initializeScrollToTop(); 
    updateGlobalCartCount(); // Оновлюємо лічильник кошика (може бути викликано і в updateAuthUI)
    
    console.log("Загальна ініціалізація скриптів на сторінці завершена.");
       if (document.getElementById('checkout-form')) { 
        console.log("Ініціалізація сторінки оформлення замовлення...");
        initializeCheckoutPage();
    }

    if (document.getElementById('order-details-content')) { // <-- НОВИЙ БЛОК
        console.log("Ініціалізація сторінки деталей замовлення...");
        initializeOrderDetailsPage();
    }
});