// /js/auth.js
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile,
    sendEmailVerification // <-- Додано для підтвердження email
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"; // Перевірте версію SDK
import { auth } from './firebaseClient.js'; // Імпортуємо екземпляр auth
import { showToast } from './uiElements.js';
import { updateGlobalCartCount } from './cart.js'; // Для оновлення UI хедера

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
        
        // Надсилання листа для підтвердження email
        await sendEmailVerification(user);
        showToast("Реєстрація успішна! Лист для підтвердження надіслано на ваш email.", 5000);
        
        // TODO: Тут можна додати створення запису в Firestore для цього користувача, якщо потрібно
        // наприклад, db.collection('users').doc(user.uid).set({ email: user.email, displayName: name, createdAt: new Date(), roles: ['customer'] });

        // Затримка перед перенаправленням, щоб користувач встиг прочитати toast
        setTimeout(() => {
            window.location.href = 'index.html'; // Або на сторінку профілю, або куди потрібно
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
        
        // Перевіряємо, чи є параметр 'redirectUrl' в URL (для повернення після входу)
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
export async function handleLogout() { // Експортуємо, щоб можна було викликати з profilePage.js
    try {
        await signOut(auth);
        console.log("Користувач вийшов.");
        showToast("Ви успішно вийшли з системи.", 3000);
        // Після виходу, завжди перенаправляємо на головну
        window.location.href = 'index.html'; 
    } catch (error) {
        console.error("Помилка виходу:", error);
        showToast("Помилка виходу. Спробуйте ще раз.", 4000);
    }
}

// Оновлення UI залежно від стану автентифікації
function updateAuthUI(user) {
    const loginLinkAnchor = document.querySelector('header .header-actions a[href="login.html"]');
    const headerActionsContainer = loginLinkAnchor ? loginLinkAnchor.parentElement : null;

    if (!headerActionsContainer) {
        // console.warn("Контейнер .header-actions не знайдено для оновлення UI автентифікації.");
        return;
    }
    
    const existingProfileLink = headerActionsContainer.querySelector('.profile-link-header'); // Шукаємо за класом
    const existingLogoutButton = headerActionsContainer.querySelector('.logout-btn');
    if (existingProfileLink) existingProfileLink.remove();
    if (existingLogoutButton) existingLogoutButton.remove();

    const cartLinkAnchor = headerActionsContainer.querySelector('a[href="cart.html"]');

    if (user) {
        if (loginLinkAnchor) loginLinkAnchor.style.display = 'none';

        const profileLink = document.createElement('a');
        profileLink.href = 'profile.html';
        profileLink.className = 'icon-link profile-link-header';
        profileLink.setAttribute('aria-label', 'Мій профіль');
        profileLink.innerHTML = `👤 <span class="username-display">${user.displayName || user.email.split('@')[0]}</span>`;
        
        const logoutButton = document.createElement('a');
        logoutButton.href = "#"; 
        logoutButton.className = 'icon-link logout-btn'; 
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
        } else { // Якщо посилання на кошик немає, додаємо в кінець .header-actions
            headerActionsContainer.appendChild(profileLink);
            headerActionsContainer.appendChild(logoutButton);
        }

    } else {
        if (loginLinkAnchor) loginLinkAnchor.style.display = 'inline-block';
    }
    updateGlobalCartCount(); // Оновлюємо лічильник кошика при зміні стану автентифікації
}


// Відстеження змін стану автентифікації
// Цей обробник викликається при завантаженні сторінки та при кожній зміні стану входу/виходу
onAuthStateChanged(auth, (user) => {
    console.log("Стан автентифікації Firebase змінено, користувач:", user ? user.uid : 'немає');
    updateAuthUI(user); 
    
    // Якщо ми на сторінці, яка вимагає автентифікації, а користувач не увійшов,
    // перенаправляємо на сторінку входу.
    // Це базова перевірка, для більш складних сценаріїв потрібні роутери або більш детальна логіка.
    const protectedPages = ['profile.html']; // Додайте сюди інші сторінки, що потребують входу
    const currentPage = window.location.pathname.split('/').pop();

    if (!user && protectedPages.includes(currentPage)) {
        console.log(`Користувач не авторизований для доступу до ${currentPage}. Перенаправлення на вхід.`);
        // Зберігаємо поточну сторінку для перенаправлення назад після входу
        window.location.href = `login.html?redirectUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
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