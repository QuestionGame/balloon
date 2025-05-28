// /server/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const cors = require('cors');
const morgan = require('morgan'); // Змінено: підключаємо сам пакет

try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  console.log("Firebase Admin SDK ініціалізовано успішно.");
} catch (error) {
  console.error("ПОМИЛКА: Не вдалося завантажити serviceAccountKey.json або ініціалізувати Firebase Admin SDK.", error);
  console.error("Переконайтеся, що файл serviceAccountKey.json існує в папці 'server' і є дійсним.");
  process.exit(1);
}
const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware (Проміжне ПЗ) ---
app.use(cors()); // Дозволяє крос-доменні запити (наприклад, з localhost:xxxx на localhost:3000)
app.use(morgan('dev')); // Логування HTTP-запитів в консоль у форматі 'dev' (короткий, для розробки)
app.use(express.json()); // Парсер для тіла запитів у форматі JSON (для POST, PUT запитів)
app.use(express.urlencoded({ extended: true })); // Парсер для тіла запитів у форматі x-www-form-urlencoded

// Визначення кореневої папки проєкту
const projectRoot = path.join(__dirname, '../'); 
// Обслуговування статичних файлів (CSS, JS клієнта, зображення) з кореневої папки
app.use(express.static(projectRoot)); 
console.log(`Статичні файли обслуговуються з: ${projectRoot}`);

// --- Допоміжні функції для відповідей ---
const sendSuccess = (res, data, message = "Успіх") => {
  res.status(200).json({ success: true, message, data });
};

const sendError = (res, statusCode, message, errorDetails = null, reqForLog = null) => {
  const logMessageParts = [];
  if (reqForLog) {
    logMessageParts.push(`[${reqForLog.method} ${reqForLog.originalUrl}]`);
  }
  logMessageParts.push(`API Помилка [${statusCode}]: ${message}`);
  const fullLogMessage = logMessageParts.join(' ');
  console.error(fullLogMessage, errorDetails instanceof Error ? errorDetails.stack : errorDetails || '');
  res.status(statusCode).json({
    success: false,
    message,
    error: errorDetails instanceof Error ? errorDetails.message : (typeof errorDetails === 'string' ? errorDetails : 'Невідома помилка')
  });
};

// --- API Маршрути ---

// GET /api/categories - Отримати список категорій
app.get('/api/categories', async (req, res) => {
  try {
    let query = db.collection('categories').orderBy('name');
    const limit = parseInt(req.query.limit);
    if (!isNaN(limit) && limit > 0) {
      query = query.limit(limit);
    }
    const categoriesSnapshot = await query.get();
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id, // ID документа в Firestore
      ...doc.data(), // Всі інші поля з документа
      slug: doc.id // Використовуємо ID документа як slug для простоти
    }));
    sendSuccess(res, categories, "Категорії успішно отримано");
  } catch (error) {
    sendError(res, 500, "Не вдалося отримати категорії", error, req);
  }
});

// GET /api/products - Отримати список товарів (з фільтрацією та сортуванням)
app.get('/api/products', async (req, res) => {
  try {
    let query = db.collection('products');
    const { category, new: isNew, hit: isHit, sortBy = 'name', order = 'asc', minPrice, maxPrice, limit: queryLimit, search } = req.query;
    let searchApplied = false;

    if (search && typeof search === 'string' && search.trim() !== '') {
        const searchTokens = search.trim().toLowerCase().split(/\s+/).filter(token => token.length > 0).slice(0, 10);
        if (searchTokens.length > 0) {
            query = query.where('nameTokens', 'array-contains-any', searchTokens);
            searchApplied = true;
        }
    }

    if (category) {
      let categorySlugs = [];
      if (Array.isArray(category)) {
        categorySlugs = category.filter(slug => slug && typeof slug === 'string' && slug.trim() !== '' && slug.trim().toLowerCase() !== 'undefined');
      } else if (typeof category === 'string') {
        categorySlugs = category.split(',').map(slug => slug.trim()).filter(slug => slug && slug !== '' && slug.toLowerCase() !== 'undefined');
      }
      if (categorySlugs.length > 0) {
        if (searchApplied) {
            console.warn("Firestore не може ефективно поєднувати 'array-contains-any' з 'in'. Фільтрація за категоріями може бути неточною при пошуку.");
        } else if (categorySlugs.length <= 10) {
             query = query.where('categorySlug', 'in', categorySlugs);
        } else {
           query = query.where('categorySlug', 'in', categorySlugs.slice(0,10));
        }
      }
    }

    if (isNew === 'true') query = query.where('new', '==', true);
    if (isHit === 'true') query = query.where('hit', '==', true);

    if (!searchApplied) {
        const minPriceNum = parseFloat(minPrice);
        const maxPriceNum = parseFloat(maxPrice);
        if (!isNaN(minPriceNum)) query = query.where('price', '>=', minPriceNum);
        if (!isNaN(maxPriceNum)) query = query.where('price', '<=', maxPriceNum);
    } else if (minPrice || maxPrice) {
        console.warn("Фільтрація за ціною не застосовується разом з текстовим пошуком.");
    }

    if (sortBy === 'price' && !searchApplied) {
        query = query.orderBy('price', order === 'desc' ? 'desc' : 'asc');
    } else {
        query = query.orderBy('name', order === 'desc' ? 'desc' : 'asc');
    }

    const limit = parseInt(queryLimit);
    if (!isNaN(limit) && limit > 0) query = query.limit(limit);

    const productsSnapshot = await query.get();
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    sendSuccess(res, products, "Товари успішно отримано");
  } catch (error) {
    sendError(res, error.code === 9 || error.code === 5 ? 400 : 500, "Не вдалося отримати товари", error, req);
  }
});

// GET /api/products/:productId - Отримати деталі одного товару
app.get('/api/products/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!productId || typeof productId !== 'string' || productId.trim() === '') {
        return sendError(res, 400, "ID товару не вказано або не є валідним", null, req);
    }
    const productDoc = await db.collection('products').doc(productId).get();
    if (!productDoc.exists) {
      return sendError(res, 404, "Товар не знайдено", null, req);
    }
    sendSuccess(res, { id: productDoc.id, ...productDoc.data() }, "Товар успішно отримано");
  } catch (error) {
    sendError(res, 500, `Не вдалося отримати товар ${req.params.productId}`, error, req);
  }
});

// GET /api/orders - Отримати історію замовлень користувача
app.get('/api/orders', async (req, res) => {
    try {
        const userId = req.query.userId; // УВАГА: Для продакшену userId має бути отриманий та верифікований з токена автентифікації Firebase
        if (!userId) {
            return sendError(res, 401, "Користувача не автентифіковано або ID не надано.");
        }
        // Тут має бути перевірка, чи запитувач має право бачити ці замовлення (userId з токена == userId з запиту)
        const ordersSnapshot = await db.collection('orders')
                                       .where('userId', '==', userId)
                                       .orderBy('date', 'desc')
                                       .get();
        if (ordersSnapshot.empty) {
            return sendSuccess(res, [], "Історія замовлень порожня.");
        }
        const orders = ordersSnapshot.docs.map(doc => {
            const data = doc.data();
            if (data.date && typeof data.date.toDate === 'function') {
                data.date = data.date.toDate(); // Конвертація Firebase Timestamp в JS Date
            }
            return { id: doc.id, ...data };
        });
        sendSuccess(res, orders, "Історія замовлень успішно отримана.");
    } catch (error) {
        sendError(res, 500, "Не вдалося отримати історію замовлень", error, req);
    }
});

// POST /api/orders - Створити нове замовлення
app.post('/api/orders', async (req, res) => {
    try {
        const orderData = req.body;
        if (!orderData || typeof orderData !== 'object') {
            return sendError(res, 400, "Некоректні дані замовлення.");
        }
        const { customerDetails, shippingDetails, items, totalAmount, paymentMethod, userId } = orderData;

        if (!customerDetails || !customerDetails.name || !customerDetails.phone || !customerDetails.email ||
            !shippingDetails || !shippingDetails.city || !shippingDetails.addressLine1 ||
            !Array.isArray(items) || items.length === 0 ||
            typeof totalAmount !== 'number' || totalAmount <= 0 ||
            !paymentMethod) {
            return sendError(res, 400, "Відсутні обов'язкові поля в даних замовлення.");
        }

        const generatedOrderNumber = `HPK-${Date.now().toString().slice(-7)}-${String(Math.floor(1000 + Math.random() * 9000)).padStart(4, '0')}`;

        const newOrderData = {
            orderNumber: generatedOrderNumber, customerDetails, shippingDetails, items,
            paymentMethod, orderComment: orderData.orderComment || '',
            status: 'pending', date: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (userId) newOrderData.userId = userId;

        let serverCalculatedTotal = 0;
        const productPromises = items.map(item => db.collection('products').doc(item.id).get());
        const productDocs = await Promise.all(productPromises);

        for (let i = 0; i < productDocs.length; i++) {
            const productDoc = productDocs[i];
            if (!productDoc.exists) return sendError(res, 400, `Товар з ID ${items[i].id} не знайдено.`);
            const productData = productDoc.data();
            if (parseFloat(productData.price) !== parseFloat(items[i].price)) {
                console.warn(`Невідповідність ціни для товару ${items[i].id}. Клієнт: ${items[i].price}, Сервер: ${productData.price}.`);
            }
            serverCalculatedTotal += parseFloat(productData.price) * parseInt(items[i].quantity);
        }
        if (Math.abs(serverCalculatedTotal - totalAmount) > 0.01) {
            console.warn(`Невідповідність загальної суми. Клієнт: ${totalAmount}, Сервер: ${serverCalculatedTotal.toFixed(2)}.`);
        }
        newOrderData.totalAmount = parseFloat(serverCalculatedTotal.toFixed(2));

        await db.collection('orders').doc(generatedOrderNumber).set(newOrderData);
        sendSuccess(res, { id: generatedOrderNumber, orderNumber: newOrderData.orderNumber, totalAmount: newOrderData.totalAmount }, "Замовлення успішно створено.");
    } catch (error) {
        sendError(res, 500, "Не вдалося створити замовлення", error, req);
    }
});

// GET /api/orders/:orderId - Отримати деталі одного замовлення
app.get('/api/orders/:orderId', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        // ВАЖЛИВО: Тут має бути перевірка автентифікації та авторизації (чи має користувач право бачити це замовлення)
        // const idToken = req.headers.authorization?.split('Bearer ')[1];
        // if (!idToken) return sendError(res, 401, "Необхідна автентифікація.");
        // const decodedToken = await admin.auth().verifyIdToken(idToken);
        // const currentUserId = decodedToken.uid;

        if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
            return sendError(res, 400, "ID замовлення не вказано або не є валідним.", null, req);
        }
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            return sendError(res, 404, "Замовлення не знайдено.", null, req);
        }
        const orderData = orderDoc.data();
        // if (orderData.userId !== currentUserId /* && !userIsAdmin(currentUserId) */) { // Перевірка прав доступу
        //     return sendError(res, 403, "Доступ до цього замовлення заборонено.");
        // }
        if (orderData.date && typeof orderData.date.toDate === 'function') {
            orderData.date = orderData.date.toDate();
        }
        sendSuccess(res, { id: orderDoc.id, ...orderData }, "Деталі замовлення успішно отримано");
    } catch (error) {
        sendError(res, error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error' ? 401 : 500, `Не вдалося отримати деталі замовлення ${req.params.orderId}`, error, req);
    }
});


// --- Обслуговування HTML сторінок ---
app.get('/', (req, res) => res.sendFile(path.join(projectRoot, 'index.html')));
app.get('/cart.html', (req, res) => res.sendFile(path.join(projectRoot, 'cart.html')));
app.get('/catalog.html', (req, res) => res.sendFile(path.join(projectRoot, 'catalog.html')));
app.get('/product-details.html', (req, res) => res.sendFile(path.join(projectRoot, 'product-details.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(projectRoot, 'login.html')));
app.get('/register.html', (req, res) => res.sendFile(path.join(projectRoot, 'register.html')));
app.get('/profile.html', (req, res) => res.sendFile(path.join(projectRoot, 'profile.html')));
app.get('/checkout.html', (req, res) => res.sendFile(path.join(projectRoot, 'checkout.html')));
app.get('/order-details.html', (req, res) => res.sendFile(path.join(projectRoot, 'order-details.html')));


// --- Обробка помилок ---
// Обробка неіснуючих API маршрутів
app.use(/^\/api\/.*/,(req, res) => {
    sendError(res, 404, "Запитаний API ресурс не знайдено.", null, req);
});

// Обробка 404 для HTML сторінок
app.use((req, res, next) => {
  if (req.accepts('html')) {
    const _404_filePath = path.join(projectRoot, '404.html');
    if (require('fs').existsSync(_404_filePath)) {
        return res.status(404).sendFile(_404_filePath);
    } else {
        return res.status(404).send('<h1>404 - Сторінку не знайдено</h1><p>Файл 404.html також не знайдено на сервері.</p>');
    }
  }
  next();
});

// Глобальний обробник помилок сервера
app.use((err, req, res, next) => {
  console.error("Непередбачена помилка сервера:", err.stack || err);
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = err.status || (err.code === 9 || err.code === 5 ? 400 : 500);

  let clientErrorMessage = 'На сервері сталася внутрішня помилка. Будь ласка, спробуйте пізніше.';
  if (!isProduction) {
    clientErrorMessage = err.message || 'Невідома серверна помилка';
  } else if (statusCode === 400 && err.message && (err.message.includes("requires an index") || err.message.includes("The query requires an index"))) {
    clientErrorMessage = "Помилка запиту до бази даних. Будь ласка, повідомте адміністратора.";
    console.error("Firestore Index Required: Please check server logs for a link to create the missing index.");
  }

  res.status(statusCode).json({
      success: false, message: "Помилка сервера", error: clientErrorMessage,
      details: !isProduction && err.stack ? err.stack.split('\n') : undefined
  });
});

// --- Запуск сервера ---
app.listen(PORT, () => {
  console.log(`Сервер успішно запущено на http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log('Режим розробки. Використовуйте `npm run dev` для автоматичного перезапуску з nodemon.');
  }
});