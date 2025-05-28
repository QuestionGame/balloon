// /js/profilePage.js
import { auth } from './firebaseClient.js';
import { 
    updateProfile, 
    sendEmailVerification, 
    reauthenticateWithCredential,
    EmailAuthProvider,
    updatePassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { handleLogout } from './auth.js';
import { showToast } from './uiElements.js';
import { fetchData } from './api.js';

// --- Елементи DOM (оголошуємо тут, щоб були доступні в усьому модулі) ---
let userProfileContent, personalInfoSection, securitySection, orderHistorySection, profileActions;
let editProfileBtn, editProfileForm, profileDisplayNameInput, cancelEditProfileBtn, editProfileError;
let changePasswordForm, currentPasswordInput, newPasswordInput, confirmNewPasswordInput, changePasswordError;
let orderHistoryList;
let logoutButtonProfile;

// --- Функції для відображення/приховування помилок форм ---
function displayProfileFormError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    } else {
        console.warn(`displayProfileFormError: Елемент з ID '${elementId}' не знайдено.`);
    }
}
function clearProfileFormError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    } else {
        console.warn(`clearProfileFormError: Елемент з ID '${elementId}' не знайдено.`);
    }
}
// У файлі /js/profilePage.js

function displayUserProfile(user) {
    console.log("[displayUserProfile] START. User object:", user ? { uid: user.uid, displayName: user.displayName, email: user.email, emailVerified: user.emailVerified } : null);

    if (!userProfileContent) {
        console.error("[displayUserProfile] CRITICAL: Елемент #user-profile-content НЕ ЗНАЙДЕНО! Неможливо відобразити профіль.");
        return;
    }
    console.log("[displayUserProfile] Елемент #user-profile-content знайдено.");

    let htmlToInsert = "";
    try {
        const displayName = user.displayName || 'Не вказано';
        const userEmail = user.email || 'Email не знайдено';
        const userUID = user.uid || 'UID не знайдено';
        const emailVerifiedStatus = user.emailVerified 
            ? '<p class="profile-meta success-text"><i class="fas fa-check-circle"></i> Email підтверджено</p>' 
            : `<p class="profile-meta warning-text"><i class="fas fa-exclamation-triangle"></i> Email не підтверджено. 
               <a href="#" id="resend-verification-email-link">Надіслати лист повторно</a></p>`;

        console.log("[displayUserProfile] Дані для HTML: displayName=", displayName, "userEmail=", userEmail, "userUID=", userUID);

        htmlToInsert = `
            <p><strong>Ім'я:</strong> <span id="profile-current-name">${displayName}</span></p>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>ID користувача:</strong> ${userUID}</p>
            ${emailVerifiedStatus}
        `;
        console.log("[displayUserProfile] Сформовано HTML (перші 100 символів):", htmlToInsert.substring(0, 100) + "...");
        
        userProfileContent.innerHTML = htmlToInsert;
        console.log("[displayUserProfile] HTML успішно вставлено в #user-profile-content.");

    } catch (error) {
        console.error("[displayUserProfile] ПОМИЛКА під час генерації або вставки HTML:", error);
        userProfileContent.innerHTML = "<p style='color:red;'>Помилка відображення даних профілю. Дивіться консоль.</p>";
        return; // Важливо вийти, якщо сталася помилка тут
    }

    // Налаштування поля вводу для редагування імені
    if (profileDisplayNameInput) {
        profileDisplayNameInput.value = user.displayName || '';
        console.log("[displayUserProfile] Встановлено значення для profileDisplayNameInput:", profileDisplayNameInput.value);
    } else {
        console.warn("[displayUserProfile] Елемент profileDisplayNameInput (для редагування імені) не знайдено.");
    }

    // Обробник для посилання "Надіслати лист повторно"
    const resendLink = document.getElementById('resend-verification-email-link');
    if (resendLink) {
        console.log("[displayUserProfile] Знайдено посилання resend-verification-email-link. Додаємо обробник.");
        resendLink.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log("[displayUserProfile] Клік на resend-verification-email-link.");
            if (auth.currentUser && !auth.currentUser.emailVerified) {
                try {
                    await sendEmailVerification(auth.currentUser);
                    showToast('Лист для підтвердження email надіслано! Перевірте вашу поштову скриньку.', 5000);
                } catch (error) {
                    console.error("[displayUserProfile] Помилка надсилання листа для підтвердження email:", error);
                    showToast(`Помилка: ${error.message}`, 4000);
                }
            } else {
                 showToast('Ваш email вже підтверджено або ви не увійшли.', 3000);
            }
        });
    } else {
        console.log("[displayUserProfile] Посилання resend-verification-email-link не знайдено (це нормально, якщо email верифіковано).");
    }

    // Показ кнопки "Редагувати ім'я"
    if (editProfileBtn) {
        editProfileBtn.style.display = 'inline-block';
        console.log("[displayUserProfile] Кнопку editProfileBtn показано.");
    } else {
        console.warn("[displayUserProfile] Кнопка editProfileBtn не знайдена!");
    }
    console.log("[displayUserProfile] END.");
}

async function handleUpdateProfile(event) {
    event.preventDefault();
    console.log("handleUpdateProfile: Початок.");
    clearProfileFormError('edit-profile-error');
    if (!profileDisplayNameInput) {
        console.error("handleUpdateProfile: Поле profileDisplayNameInput не знайдено.");
        return;
    }
    const newName = profileDisplayNameInput.value.trim();
    if (!newName) {
        displayProfileFormError('edit-profile-error', "Ім'я не може бути порожнім.");
        return;
    }
    if (!auth.currentUser) {
        showToast("Помилка: користувач не авторизований.", 4000);
        return;
    }
    try {
        await updateProfile(auth.currentUser, { displayName: newName });
        showToast("Ім'я успішно оновлено!", 3000);
        const currentNameEl = document.getElementById('profile-current-name');
        if (currentNameEl) currentNameEl.textContent = newName;
        
        if(editProfileForm) editProfileForm.style.display = 'none';
        if(editProfileBtn) editProfileBtn.style.display = 'inline-block';
        console.log("handleUpdateProfile: Ім'я оновлено.");
    } catch (error) {
        console.error("Помилка оновлення профілю:", error);
        displayProfileFormError('edit-profile-error', `Помилка: ${error.message}`);
        showToast(`Помилка оновлення імені: ${error.message}`, 4000);
    }
}

// --- Зміна пароля ---
async function handleChangePassword(event) {
    event.preventDefault();
    console.log("handleChangePassword: Початок.");
    clearProfileFormError('change-password-error');
    if (!currentPasswordInput || !newPasswordInput || !confirmNewPasswordInput) {
        console.error("handleChangePassword: Одне або декілька полів для зміни пароля не знайдено.");
        return;
    }

    const currentPassword = currentPasswordInput.value;
    const newPass = newPasswordInput.value;
    const confirmNewPass = confirmNewPasswordInput.value;

    if (newPass !== confirmNewPass) {
        displayProfileFormError('change-password-error', "Нові паролі не співпадають.");
        return;
    }
    if (newPass.length < 6) {
        displayProfileFormError('change-password-error', "Новий пароль має містити щонайменше 6 символів.");
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        showToast("Користувача не знайдено. Спробуйте увійти знову.", 4000);
        return;
    }
    
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    try {
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPass);
        showToast("Пароль успішно змінено!", 3000);
        if(changePasswordForm) changePasswordForm.reset();
        console.log("handleChangePassword: Пароль змінено.");
    } catch (error) {
        // ... (обробка помилок залишається як є) ...
    }
}
// --- Історія замовлень ---
async function loadOrderHistory(userId) {
    console.log("loadOrderHistory: Початок. UserId:", userId);
    if (!orderHistoryList) {
        console.warn("loadOrderHistory: Елемент #order-history-list не знайдено!");
        return;
    }
    orderHistoryList.innerHTML = '<p class="loading-indicator">Завантаження історії замовлень...</p>';
    
    const response = await fetchData(`/api/orders?userId=${userId}`);
    console.log("loadOrderHistory: Відповідь від API:", response);

    if (response && response.success && Array.isArray(response.data)) {
        if (response.data.length === 0) {
            orderHistoryList.innerHTML = '<p>У вас ще немає замовлень.</p>';
        } else {
            // ОСЬ ЦЕЙ ВАЖЛИВИЙ БЛОК МАЄ БУТИ ЗАПОВНЕНИЙ
            const tableHTML = ` 
                <table class="order-history-table">
                    <thead>
                        <tr>
                            <th>Номер</th>
                            <th>Дата</th>
                            <th>Статус</th>
                            <th>Сума</th>
                            <th>Деталі</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${response.data.map(order => {
                            console.log("[loadOrderHistory] Обробка замовлення:", order);
                            try {
                                const orderDate = order.date ? (order.date.seconds ? new Date(order.date.seconds * 1000) : new Date(order.date)) : new Date();
                                const formattedDate = order.date ? orderDate.toLocaleDateString() : 'Дата не вказана';
                                const statusClass = (order.status || 'pending').toLowerCase();
                                const statusText = order.status || 'Обробляється';
                                const totalAmountText = parseFloat(order.totalAmount || 0).toFixed(2);
                                const orderIdLink = order.id || (order.orderNumber || 'N/A');

                                return `
                                    <tr>
                                        <td data-label="Номер:">${order.orderNumber || orderIdLink}</td>
                                        <td data-label="Дата:">${formattedDate}</td>
                                        <td data-label="Статус:"><span class="order-status order-status-${statusClass}">${statusText}</span></td>
                                        <td data-label="Сума:">${totalAmountText} грн</td>
                                        <td data-label="Деталі:"><a href="/order-details.html?id=${orderIdLink}" class="btn btn-sm btn-outline-secondary">Переглянути</a></td>
                                    </tr>`;
                            } catch (e) {
                                console.error("[loadOrderHistory] Помилка при обробці одного замовлення:", order, e);
                                return '<tr><td colspan="5" style="color:red;">Помилка відображення цього замовлення</td></tr>';
                            }
                        }).join('')}
                    </tbody>
                </table>`;
            console.log("[loadOrderHistory] Сформовано HTML для таблиці (перші 200 символів):", tableHTML.substring(0, 200) + "...");
            orderHistoryList.innerHTML = tableHTML; // ВСТАВЛЯЄМО HTML ТАБЛИЦІ
            console.log("[loadOrderHistory] Таблицю історії замовлень згенеровано та вставлено.");
        }
    } else {
        orderHistoryList.innerHTML = `<p>Не вдалося завантажити історію замовлень. ${response?.message || 'Відповідь від сервера некоректна.'}</p>`;
        console.error("Помилка завантаження історії замовлень або некоректна відповідь:", response);
    }
    console.log("loadOrderHistory: Завершено.");
}


export function initializeProfilePage() {
    console.log("profilePage.js: Спроба ініціалізації...");
    userProfileContent = document.getElementById('user-profile-content');
    personalInfoSection = document.getElementById('personal-info-section');
    securitySection = document.getElementById('security-section');
    orderHistorySection = document.getElementById('order-history-section');
    profileActions = document.getElementById('profile-actions');
    
    editProfileBtn = document.getElementById('edit-profile-btn');
    editProfileForm = document.getElementById('edit-profile-form');
    profileDisplayNameInput = document.getElementById('profile-display-name');
    cancelEditProfileBtn = document.getElementById('cancel-edit-profile-btn');
    editProfileError = document.getElementById('edit-profile-error');

    changePasswordForm = document.getElementById('change-password-form');
    currentPasswordInput = document.getElementById('current-password');
    newPasswordInput = document.getElementById('new-password');
    confirmNewPasswordInput = document.getElementById('confirm-new-password');
    changePasswordError = document.getElementById('change-password-error');

    orderHistoryList = document.getElementById('order-history-list');
    logoutButtonProfile = document.getElementById('logout-button-profile');
    
    // Логування стану знаходження кожного елемента
    console.log(`Element #user-profile-content: ${userProfileContent ? 'Знайдено' : 'НЕ ЗНАЙДЕНО'}`);
    console.log(`Element #personal-info-section: ${personalInfoSection ? 'Знайдено' : 'НЕ ЗНАЙДЕНО'}`);
    console.log(`Element #security-section: ${securitySection ? 'Знайдено' : 'НЕ ЗНАЙДЕНО'}`);
    console.log(`Element #order-history-section: ${orderHistorySection ? 'Знайдено' : 'НЕ ЗНАЙДЕНО'}`);
    console.log(`Element #profile-actions: ${profileActions ? 'Знайдено' : 'НЕ ЗНАЙДЕНО'}`);
    console.log(`Element #edit-profile-btn: ${editProfileBtn ? 'Знайдено' : 'НЕ ЗНАЙДЕНО'}`);
    // ... і так далі для всіх важливих елементів


    if (!userProfileContent) {
        console.error("profilePage.js: КРИТИЧНО - Елемент #user-profile-content не знайдено. Ініціалізацію скасовано.");
        return; 
    }
    console.log("profilePage.js: Головний контейнер #user-profile-content знайдено.");

    const user = auth.currentUser;
    console.log('profilePage.js: auth.currentUser:', user ? { uid: user.uid, displayName: user.displayName, email: user.email, emailVerified: user.emailVerified } : 'null (користувач не визначений)');

    if (user) {
        console.log("profilePage.js: Користувач авторизований. UID:", user.uid);
        
        // Показ секцій
        if (personalInfoSection) { console.log("profilePage.js: Показуємо personalInfoSection"); personalInfoSection.style.display = 'block'; } 
        else { console.warn("profilePage.js: personalInfoSection не знайдено!"); }
        
        if (securitySection) { console.log("profilePage.js: Показуємо securitySection"); securitySection.style.display = 'block'; }
        else { console.warn("profilePage.js: securitySection не знайдено!"); }

        if (orderHistorySection) { console.log("profilePage.js: Показуємо orderHistorySection"); orderHistorySection.style.display = 'block'; }
        else { console.warn("profilePage.js: orderHistorySection не знайдено!"); }

        if (profileActions) { console.log("profilePage.js: Показуємо profileActions"); profileActions.style.display = 'block'; }
        else { console.warn("profilePage.js: profileActions не знайдено!"); }

        displayUserProfile(user); 
        loadOrderHistory(user.uid);

        // Додавання обробників подій з перевірками
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                if(editProfileForm) editProfileForm.style.display = 'block';
                if(editProfileBtn) editProfileBtn.style.display = 'none';
                if(profileDisplayNameInput && auth.currentUser) profileDisplayNameInput.value = auth.currentUser.displayName || '';
                clearProfileFormError('edit-profile-error');
            });
        } else { console.warn("profilePage.js: editProfileBtn не знайдено для обробника!");}
        
        if (cancelEditProfileBtn) {
            cancelEditProfileBtn.addEventListener('click', () => {
                if(editProfileForm) editProfileForm.style.display = 'none';
                if(editProfileBtn) editProfileBtn.style.display = 'inline-block';
            });
        } else { console.warn("profilePage.js: cancelEditProfileBtn не знайдено для обробника!");}
        
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', handleUpdateProfile);
        } else { console.warn("profilePage.js: editProfileForm не знайдено для обробника!");}
        
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', handleChangePassword);
        } else { console.warn("profilePage.js: changePasswordForm не знайдено для обробника!");}
        
        if (logoutButtonProfile) {
            logoutButtonProfile.addEventListener('click', (e) => {
                e.preventDefault();
                handleLogout();
            });
        } else { console.warn("profilePage.js: logoutButtonProfile не знайдено для обробника!");}

    } else {
       
  console.log("profilePage.js: Користувач не авторизований.");
        if (userProfileContent) userProfileContent.innerHTML = '<p>Будь ласка, увійдіть, щоб переглянути свій профіль.</p>';
        
        if (personalInfoSection) personalInfoSection.style.display = 'none';
        if (securitySection) securitySection.style.display = 'none';
        if (orderHistorySection) orderHistorySection.style.display = 'none';
        if (profileActions) profileActions.style.display = 'none';
        
        setTimeout(() => {
            if (!auth.currentUser) {
                 const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
                 window.location.href = `login.html?redirectUrl=${redirectUrl}`;
            }
        }, 2500); // Збільшено час для можливості побачити повідомлення
    }
    console.log("profilePage.js: Ініціалізація завершена.");
}

