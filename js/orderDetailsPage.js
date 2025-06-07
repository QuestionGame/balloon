// /js/orderDetailsPage.js
import { fetchData } from './api.js';
import { auth } from './firebaseClient.js'; // Якщо потрібна перевірка, чи користувач має право бачити це замовлення

export async function initializeOrderDetailsPage() {
    const orderDetailsContent = document.getElementById('order-details-content');
    const orderDetailsTitle = document.getElementById('order-details-title');
    const breadcrumbsOl = document.querySelector('#order-details-breadcrumbs ol');


    if (!orderDetailsContent) {
        // console.log("Not on order details page or #order-details-content not found.");
        return; // Якщо не сторінка деталей замовлення
    }
    console.log("orderDetailsPage.js: Ініціалізація сторінки деталей замовлення...");

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (!orderId) {
        orderDetailsContent.innerHTML = '<p style="color:red; text-align:center;">Помилка: ID замовлення не вказано в URL.</p>';
        if (orderDetailsTitle) orderDetailsTitle.textContent = "Помилка завантаження";
        return;
    }

    // Перевірка, чи користувач авторизований (базова)
    // В ідеалі, сервер має перевіряти, чи поточний користувач має право бачити це замовлення
    // const currentUser = auth.currentUser;
    // if (!currentUser) {
    //      orderDetailsContent.innerHTML = '<p style="color:orange; text-align:center;">Будь ласка, увійдіть, щоб переглянути деталі замовлення.</p>';
    //      setTimeout(() => {
    //         window.location.href = `/login.html?redirectUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    //     }, 2500);
    //     return;
    // }

    orderDetailsContent.innerHTML = '<p class="loading-indicator">Завантаження деталей замовлення...</p>';
    
    // Припускаємо, що серверний ендпоінт /api/orders/:orderId очікує GET запит
    // і перевіряє, чи залогінений користувач (через токен) має доступ до цього orderId
    const response = await fetchData(`/api/orders/${orderId}`);
    console.log("orderDetailsPage.js: Відповідь від API для замовлення:", response);

    if (response && response.success && response.data) {
        const order = response.data;

        if (orderDetailsTitle) orderDetailsTitle.textContent = `Деталі замовлення №${order.orderNumber || order.id}`;
        document.title = `Замовлення №${order.orderNumber || order.id} - HappyKulka`;

        // Оновлення хлібних крихт
        if (breadcrumbsOl) {
            // Видаляємо 'Деталі замовлення' якщо воно там вже є (про всяк випадок)
            if (breadcrumbsOl.children.length > 2 && breadcrumbsOl.lastChild.textContent.includes('Деталі замовлення')) {
                breadcrumbsOl.removeChild(breadcrumbsOl.lastChild);
            }
            const orderLi = document.createElement('li');
            orderLi.setAttribute('aria-current', 'page');
            orderLi.textContent = `Замовлення №${order.orderNumber || order.id}`;
            breadcrumbsOl.appendChild(orderLi);
        }

        const orderDate = order.date ? (order.date.seconds ? new Date(order.date.seconds * 1000) : new Date(order.date)) : new Date();
        const formattedDate = order.date ? orderDate.toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Не вказано';
        const statusClass = (order.status || 'pending').toLowerCase();
        const statusText = order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'В обробці';


        orderDetailsContent.innerHTML = `
            <div class="order-summary-header">
                <h2>Замовлення №${order.orderNumber || order.id}</h2>
                <p><strong>Дата створення:</strong> ${formattedDate}</p>
                <p><strong>Статус:</strong> <span class="order-status-detail order-status-${statusClass}">${statusText}</span></p>
                <p><strong>Спосіб оплати:</strong> ${order.paymentMethod === 'cash_on_delivery' ? 'Оплата при отриманні' : (order.paymentMethod === 'card_online' ? 'Карткою онлайн' : order.paymentMethod || 'Не вказано')}</p>
            </div>

            <div class="order-customer-info">
                <h3>Інформація про покупця</h3>
                <p><strong>Ім'я:</strong> ${order.customerDetails?.name || 'Не вказано'}</p>
                <p><strong>Телефон:</strong> ${order.customerDetails?.phone || 'Не вказано'}</p>
                <p><strong>Email:</strong> ${order.customerDetails?.email || 'Не вказано'}</p>
            </div>

            <div class="order-shipping-info">
                <h3>Інформація про доставку</h3>
                <p><strong>Місто:</strong> ${order.shippingDetails?.city || 'Не вказано'}</p>
                <p><strong>Адреса:</strong> ${order.shippingDetails?.addressLine1 || 'Не вказано'}</p>
                <p><strong>Відділення/Інструкції:</strong> ${order.shippingDetails?.warehouse || 'Не вказано'}</p>
                ${order.orderComment ? `<p><strong>Коментар:</strong> ${order.orderComment}</p>` : ''}
            </div>

            <div class="order-items-section">
                <h3>Товари в замовленні</h3>
                <table class="order-items-table">
                    <thead>
                        <tr>
                            <th colspan="2">Товар</th>
                            <th>Кількість</th>
                            <th>Ціна за од.</th>
                            <th>Сума</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items && Array.isArray(order.items) ? order.items.map(item => `
                            <tr>
                                <td><img src="${item.image || '/images/placeholder.jpg'}" alt="${item.name}" class="product-image-tiny"></td>
                                <td class="item-name">${item.name || 'Назва невідома'}</td>
                                <td class="item-quantity">${item.quantity || 1}</td>
                                <td class="item-price">${parseFloat(item.price || 0).toFixed(2)} грн</td>
                                <td class="item-subtotal">${(parseFloat(item.price || 0) * (item.quantity || 1)).toFixed(2)} грн</td>
                            </tr>
                        `).join('') : '<tr><td colspan="5">Інформація про товари відсутня.</td></tr>'}
                    </tbody>
                </table>
            </div>

            <div class="order-total-summary">
                <p>Загальна сума замовлення: <strong>${parseFloat(order.totalAmount || 0).toFixed(2)} грн</strong></p>
            </div>
        `;

    } else {
        orderDetailsContent.innerHTML = `<p style="color:red; text-align:center;">Не вдалося завантажити деталі замовлення. ${response?.message || 'Перевірте ID замовлення або спробуйте пізніше.'}</p>`;
        if (orderDetailsTitle) orderDetailsTitle.textContent = "Помилка завантаження";
        console.error("Помилка отримання деталей замовлення:", response);
    }
}