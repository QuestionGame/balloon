// /js/checkoutPage.js
import { getCurrentCart, saveCart } from './cart.js';
import { fetchData } from './api.js';
import { showToast } from './uiElements.js';
import { auth } from './firebaseClient.js'; // Для отримання даних залогіненого користувача

function displayCheckoutError(message) {
    const errorElement = document.getElementById('checkout-error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function clearCheckoutError() {
    const errorElement = document.getElementById('checkout-error-message');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

function renderCheckoutSummary() {
    const cart = getCurrentCart();
    const summaryContainer = document.getElementById('checkout-items-summary');
    const grandTotalElement = document.getElementById('checkout-grand-total');

    if (!summaryContainer || !grandTotalElement) {
        console.error("Елементи для зведення замовлення не знайдено!");
        return;
    }

    summaryContainer.innerHTML = '<p class="loading-indicator">Завантаження кошика...</p>'; // Початкове повідомлення

    if (cart.length === 0) {
        summaryContainer.innerHTML = '<p>Ваш кошик порожній. Неможливо оформити замовлення.</p>';
        grandTotalElement.textContent = '0.00 грн';
        const confirmBtn = document.getElementById('confirm-order-btn');
        if (confirmBtn) confirmBtn.disabled = true;
        return;
    }
    
    const confirmBtn = document.getElementById('confirm-order-btn');
    if (confirmBtn) confirmBtn.disabled = false;


    summaryContainer.innerHTML = ''; // Очистити перед заповненням
    let currentTotal = 0;

    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'checkout-item';
        const itemSubtotal = item.price * item.quantity;
        currentTotal += itemSubtotal;

        const imageUrl = (item.image && item.image.startsWith('/')) 
                         ? item.image 
                         : `/images/products/${item.image || 'placeholder.png'}`;

        itemElement.innerHTML = `
            <img src="${imageUrl}" alt="${item.name}" onerror="this.onerror=null;this.src='/images/placeholder.jpg';">
            <div class="checkout-item-info">
                <p class="checkout-item-name">${item.name}</p>
                <p class="checkout-item-details">${item.quantity} x ${item.price.toFixed(2)} грн</p>
            </div>
            <div class="checkout-item-subtotal">
                <strong>${itemSubtotal.toFixed(2)} грн</strong>
            </div>
        `;
        summaryContainer.appendChild(itemElement);
    });

    grandTotalElement.textContent = `${currentTotal.toFixed(2)} грн`;
}

function prefillUserData() {
    const user = auth.currentUser;
    if (user) {
        const nameInput = document.getElementById('checkout-name');
        const emailInput = document.getElementById('checkout-email');
        // Телефон зазвичай не зберігається в Firebase Auth, тому його користувач має ввести
        // const phoneInput = document.getElementById('checkout-phone');

        if (nameInput && user.displayName) nameInput.value = user.displayName;
        if (emailInput && user.email) emailInput.value = user.email;
        
        // Тут можна додати логіку для завантаження збережених адрес доставки з Firestore,
        // якщо ви реалізуєте такий функціонал у профілі користувача.
    }
}

async function handleConfirmOrder(event) {
    event.preventDefault();
    clearCheckoutError();
    const form = event.target; // Використовуємо event.target для отримання форми
    const confirmButton = document.getElementById('confirm-order-btn');
    confirmButton.disabled = true;
    confirmButton.textContent = 'Обробка...';

    const cart = getCurrentCart();
    if (cart.length === 0) {
        displayCheckoutError('Ваш кошик порожній.');
        confirmButton.disabled = false;
        confirmButton.textContent = 'Підтвердити замовлення';
        return;
    }

    const formData = new FormData(form);
    const orderData = {
        customerDetails: {
            name: formData.get('customerName').trim(),
            phone: formData.get('customerPhone').trim(),
            email: formData.get('customerEmail').trim(),
        },
        shippingDetails: {
            city: formData.get('shippingCity').trim(),
            addressLine1: formData.get('shippingAddressLine1').trim(),
            warehouse: formData.get('shippingWarehouse').trim(),
        },
        orderComment: formData.get('orderComment').trim(),
        paymentMethod: formData.get('paymentMethod'),
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image
        })),
        totalAmount: parseFloat(document.getElementById('checkout-grand-total').textContent),
    };

    if (!orderData.customerDetails.name || !orderData.customerDetails.phone || !orderData.customerDetails.email ||
        !orderData.shippingDetails.city || !orderData.shippingDetails.addressLine1) {
        displayCheckoutError("Будь ласка, заповніть усі обов'язкові поля (ПІБ, телефон, email, місто, адреса).");
        confirmButton.disabled = false;
        confirmButton.textContent = 'Підтвердити замовлення';
        return;
    }
    if (orderData.customerDetails.phone.length < 10) {
        displayCheckoutError("Некоректний формат номера телефону.");
        confirmButton.disabled = false;
        confirmButton.textContent = 'Підтвердити замовлення';
        return;
    }

    const user = auth.currentUser;
    if (user) {
        orderData.userId = user.uid;
    }

    try {
        const response = await fetchData('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
        });

        if (response.success) {
            // --- Зміни тут ---
            const orderIdToShow = response.data.orderNumber || response.data.id;
            const successMessage = `Дякуємо! Ваше замовлення №${orderIdToShow} успішно оформлено. Ми скоро зв'яжемося з вами.`;
            
            showToast(successMessage, 7000); // Показуємо toast на 7 секунд

            saveCart([]); // Очистити кошик
            form.reset(); // Очистити форму
            renderCheckoutSummary(); // Оновити зведення (має показати порожній кошик)
            
            // Затримка перед перенаправленням, щоб користувач встиг прочитати toast
            setTimeout(() => {
                // Можна перенаправити на спеціальну сторінку подяки або на головну
                // window.location.href = `thank-you.html?orderId=${orderIdToShow}`; 
                window.location.href = 'index.html'; 
            }, 7000); // Затримка відповідає тривалості показу toast

            // Не блокуємо кнопку відразу, щоб користувач не подумав, що щось зависло
            // confirmButton.disabled = true; // Кнопка вже заблокована
            // confirmButton.textContent = 'Замовлення оформлено';
            // Замість цього, можна просто залишити її заблокованою до перенаправлення
            // Або після setTimeout зробити її знову активною, якщо не перенаправляти
            // Але оскільки є перенаправлення, це не так важливо.

        } else {
            displayCheckoutError(response.message || 'Не вдалося оформити замовлення. Будь ласка, спробуйте ще раз.');
            console.error("Помилка оформлення замовлення від сервера:", response);
            confirmButton.disabled = false; // Розблокувати кнопку у разі помилки
            confirmButton.textContent = 'Підтвердити замовлення';
        }
    } catch (error) {
        displayCheckoutError('Сталася помилка мережі або сервера під час оформлення замовлення. Будь ласка, спробуйте пізніше.');
        console.error('Критична помилка JavaScript при оформленні замовлення:', error);
        confirmButton.disabled = false; // Розблокувати кнопку у разі помилки
        confirmButton.textContent = 'Підтвердити замовлення';
    }
    // finally блок тут не потрібен, оскільки логіка кнопки вже обробляється вище
}



export function initializeCheckoutPage() {
    const checkoutForm = document.getElementById('checkout-form');
    
    if (!checkoutForm) return; // Якщо це не сторінка оформлення, нічого не робимо

    console.log("Ініціалізація сторінки оформлення замовлення...");
    renderCheckoutSummary(); // Відобразити товари з кошика
    prefillUserData();     // Заповнити дані, якщо користувач залогінений

    checkoutForm.addEventListener('submit', handleConfirmOrder);
}