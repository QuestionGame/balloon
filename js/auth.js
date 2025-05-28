// /js/auth.js
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth } from './firebaseClient.js'; 
import { showToast } from './uiElements.js';
import { updateGlobalCartCount } from './cart.js';

// --- ПРОМІС для визначення початкового стану автентифікації ---
export const authReady = new Promise(resolve => {
    // Цей слухач спрацює один раз при завантаженні, щоб визначити початковий стан
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log("auth.js: Початковий onAuthStateChanged (для authReady) спрацював. Користувач:", user ? user.uid : null);
        resolve(user); // Вирішуємо проміс з об'єктом користувача (або null)
        unsubscribe(); // Важливо: відписуємося, щоб він не спрацьовував на подальші зміни стану
    });
});
// --- КІНЕЦЬ ПРОМІСУ ---


// Функція для відображення помилок у формі
function displayFormError(formId, message) {
    const errorElement = document.getElementById(`${formId}-error-message`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Функція для очищення помилок форми
function clearFormError(formId) {
    const errorElement = document.getElementById(`${formId}-error-message`);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

// Реєстрація нового користувача
async function handleRegister(event) {
    event.preventDefault();
    clearFormError('register');
    const form = event.target;
    const name = form.name.value.trim();
    const email = form.email.value;
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (password !== confirmPassword) {
        displayFormError('register', "Паролі не співпадають.");
        return;
    }
    if (password.length < 6) {
        displayFormError('register', "Пароль має містити щонайменше 6 символів.");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Користувач зареєстрований:", user.uid);
        
        if (name) {
            await updateProfile(user, { displayName: name });
            console.log("Ім'я користувача оновлено:", name);
        }
        
        await sendEmailVerification(user);
        showToast("Реєстрація успішна! Лист для підтвердження надіслано на ваш email.", 5000);
        
        setTimeout(() => {
            window.location.href = 'index.html'; 
        }, 3000);

    } catch (error) {
        console.error("Помилка реєстрації:", error);
        let message = "Помилка реєстрації. Спробуйте ще раз.";
        if (error.code === 'auth/email-already-in-use') {
            message = "Цей email вже використовується.";
        } else if (error.code === 'auth/weak-password') {
            message = "Пароль занадто слабкий.";
        } else if (error.code === 'auth/invalid-email') {
            message = "Некоректний формат email.";
        }
        displayFormError('register', message);
        showToast(message, 4000);
    }
}

// Вхід існуючого користувача
async function handleLogin(event) {
    event.preventDefault();
    clearFormError('login');
    const form = event.target;
    const email = form.email.value;
    const password = form.password.value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Користувач увійшов:", user.uid);
        showToast(`Вітаємо з поверненням, ${user.displayName || user.email.split('@')[0]}!`, 3000);
        
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirectUrl') || 'index.html';
        
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1500);

    } catch (error) {
        console.error("Помилка входу:", error);
        let message = "Неправильний email або пароль.";
        if (error.code === 'auth/user-not-found' || 
            error.code === 'auth/wrong-password' || 
            error.code === 'auth/invalid-credential' ||
            error.code === 'auth/invalid-email') {
            message = "Неправильний email або пароль.";
        }
        displayFormError('login', message);
        showToast(message, 4000);
    }
}

// Вихід користувача
export async function handleLogout() {
    try {
        await signOut(auth);
        console.log("Користувач вийшов.");
        showToast("Ви успішно вийшли з системи.", 3000);
        window.location.href = 'index.html'; 
    } catch (error) {
        console.error("Помилка виходу:", error);
        showToast("Помилка виходу. Спробуйте ще раз.", 4000);
    }
}

// Оновлення UI залежно від стану автентифікації
function updateAuthUI(user) {
    console.log("updateAuthUI викликано. Користувач:", user ? user.uid : null); // Додано лог
    const loginLinkAnchor = document.querySelector('header .header-actions a[href="login.html"]');
    const headerActionsContainer = loginLinkAnchor ? loginLinkAnchor.parentElement : null;

    if (!headerActionsContainer) {
        console.warn("Контейнер .header-actions не знайдено для оновлення UI автентифікації.");
        return;
    }
    
    // Видаляємо попередні елементи профілю та виходу, якщо вони є
    const existingProfileLink = headerActionsContainer.querySelector('.profile-link-header');
    const existingLogoutButton = headerActionsContainer.querySelector('.logout-btn'); // Раніше був logout-icon-link
    const existingUsernameDisplay = headerActionsContainer.querySelector('.username-display');


    if (existingProfileLink) existingProfileLink.remove();
    if (existingLogoutButton) existingLogoutButton.remove();
    // if (existingUsernameDisplay) existingUsernameDisplay.remove(); // Це частина profileLink, видалиться разом з ним

    const cartLinkAnchor = headerActionsContainer.querySelector('a[href="cart.html"]');

    if (user) {
        console.log("updateAuthUI: Користувач є. Оновлюємо UI для залогіненого стану."); // Додано лог
        if (loginLinkAnchor) loginLinkAnchor.style.display = 'none';

        const profileLink = document.createElement('a');
        profileLink.href = 'profile.html';
        profileLink.className = 'icon-link profile-link-header'; // Додаємо клас для легшого пошуку
        profileLink.setAttribute('aria-label', 'Мій профіль');
        // Встановлюємо innerHTML, який містить іконку та span для імені
        profileLink.innerHTML = `👤 <span class="username-display">${user.displayName || user.email.split('@')[0]}</span>`;
        
        const logoutButton = document.createElement('a');
        logoutButton.href = "#"; 
        logoutButton.className = 'icon-link logout-btn'; // Змінено клас для відповідності пошуку
        logoutButton.setAttribute('aria-label', 'Вихід');
        logoutButton.innerHTML = '🚪'; 
        logoutButton.style.marginLeft = '10px';
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });

        if (cartLinkAnchor) {
            headerActionsContainer.insertBefore(profileLink, cartLinkAnchor);
            headerActionsContainer.insertBefore(logoutButton, cartLinkAnchor);
        } else { 
            headerActionsContainer.appendChild(profileLink);
            headerActionsContainer.appendChild(logoutButton);
        }

    } else {
        console.log("updateAuthUI: Користувача немає. Оновлюємо UI для незалогіненого стану."); // Додано лог
        if (loginLinkAnchor) loginLinkAnchor.style.display = 'inline-block';
        // Елементи профілю та виходу вже видалені вище
    }
    updateGlobalCartCount(); 
}


// Відстеження ЗМІН стану автентифікації (цей слухач реагує на вхід/вихід ПІСЛЯ початкового завантаження)
onAuthStateChanged(auth, (user) => {
    console.log("auth.js: Динамічний onAuthStateChanged спрацював. Користувач:", user ? user.uid : 'немає');
    updateAuthUI(user); 
    
    const protectedPages = ['profile.html', 'checkout.html'];
    const currentPage = window.location.pathname.split('/').pop();

    // Якщо користувач НЕ залогінений (user is null) І він на захищеній сторінці
    if (!user && protectedPages.includes(currentPage)) {
        console.log(`auth.js (динамічний): Користувач не авторизований для ${currentPage}. Перенаправлення на вхід.`);
        const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
        // Переконуємося, що ми не на login.html, щоб уникнути циклу
        if (currentPage !== 'login.html' && currentPage !== 'register.html') {
            window.location.href = `login.html?redirectUrl=${redirectUrl}`;
        }
    }
});

// Функція ініціалізації для сторінок входу та реєстрації
export function initializeAuthForms() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}