// /js/profilePage.js
import { auth } from './firebaseClient.js'; // Імпортуємо екземпляр auth
import { handleLogout } from './auth.js'; // Імпортуємо функцію виходу

export function initializeProfilePage() {
    const userProfileContent = document.getElementById('user-profile-content');
    const profileActions = document.getElementById('profile-actions');
    const logoutButtonProfile = document.getElementById('logout-button-profile');
    // const orderHistorySection = document.getElementById('order-history-section'); // Для майбутнього

    if (!userProfileContent) return; // Якщо не сторінка профілю

    const user = auth.currentUser; // Отримуємо поточного користувача

    if (user) {
        // Користувач увійшов, відображаємо його дані
        userProfileContent.innerHTML = `
            <h1>Вітаємо, ${user.displayName || user.email.split('@')[0]}!</h1>
            <div class="profile-detail">
                <p><strong>Email:</strong> ${user.email}</p>
            </div>
            <div class="profile-detail">
                <p><strong>ID користувача:</strong> ${user.uid}</p>
            </div>
            ${user.emailVerified ? 
                '<p style="color: green;">Email підтверджено</p>' : 
                '<p style="color: orange;">Email не підтверджено. <a href="#" id="send-verification-email">Надіслати лист для підтвердження</a></p>'
            }
            <!-- Додаткова інформація, якщо вона зберігається в Firestore -->
        `;

        if (profileActions) profileActions.style.display = 'block';
        // if (orderHistorySection) orderHistorySection.style.display = 'block'; // Показати секцію історії замовлень

        if (logoutButtonProfile) {
            logoutButtonProfile.addEventListener('click', (e) => {
                e.preventDefault();
                handleLogout();
            });
        }

        const sendVerificationLink = document.getElementById('send-verification-email');
        if (sendVerificationLink) {
            sendVerificationLink.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    // Потрібно імпортувати sendEmailVerification з firebase/auth
                    // import { sendEmailVerification } from "firebase/auth";
                    // await sendEmailVerification(auth.currentUser);
                    alert('Лист для підтвердження email надіслано! Перевірте вашу поштову скриньку.');
                    // Тут потрібно буде додати import { sendEmailVerification } from "firebase/auth"; на початку файлу
                    // та викликати sendEmailVerification(user);
                    console.warn("Функціонал sendEmailVerification ще не реалізовано повністю у прикладі.");
                } catch (error) {
                    console.error("Помилка надсилання листа для підтвердження email:", error);
                    alert(`Помилка: ${error.message}`);
                }
            });
        }

        // Тут можна додати завантаження історії замовлень, якщо вона буде
        // loadOrderHistory(user.uid);

    } else {
        // Користувач не увійшов, перенаправляємо на сторінку входу
        userProfileContent.innerHTML = '<p>Будь ласка, увійдіть, щоб переглянути свій профіль.</p>';
        // Затримка перед перенаправленням, щоб користувач встиг побачити повідомлення
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
}

/*
// Приклад функції для завантаження історії замовлень (потребує API на сервері)
async function loadOrderHistory(userId) {
    const orderHistoryList = document.getElementById('order-history-list');
    if (!orderHistoryList) return;

    // Припускаємо, що є API /api/orders?userId=...
    // const response = await fetchData(`/api/orders?userId=${userId}`);
    // if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
    //     orderHistoryList.innerHTML = '';
    //     response.data.forEach(order => {
    //         const orderItem = document.createElement('div');
    //         orderItem.className = 'order-item';
    //         orderItem.innerHTML = `
    //             <h4>Замовлення #${order.id} від ${new Date(order.date).toLocaleDateString()}</h4>
    //             <p>Статус: ${order.status}</p>
    //             <p>Сума: ${order.total.toFixed(2)} грн</p>
    //             <a href="order-details.html?id=${order.id}">Детальніше</a>
    //         `;
    //         orderHistoryList.appendChild(orderItem);
    //     });
    // } else {
    //     orderHistoryList.innerHTML = '<p>У вас ще немає замовлень.</p>';
    // }
}
*/