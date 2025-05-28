// server/seedDatabase.js
const admin = require('firebase-admin');

// --- КОНФІГУРАЦІЯ ---
try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK ініціалізовано для заповнення БД.");
} catch (error) {
    console.error("ПОМИЛКА: Не вдалося завантажити serviceAccountKey.json або ініціалізувати Firebase Admin SDK.", error);
    process.exit(1);
}

const db = admin.firestore();

// --- ДОПОМІЖНА ФУНКЦІЯ ДЛЯ ГЕНЕРАЦІЇ nameTokens ---
function generateNameTokens(name) {
    if (!name || typeof name !== 'string') return [];
    return name.toLowerCase().split(/\s+/).filter(token => token.length > 0).slice(0, 10);
}

// --- ДАНІ ДЛЯ КАТЕГОРІЙ ---
const categoriesData = [
    { id: 'povitryani-kulky', name: 'Повітряні кульки', image: '/images/categories/balloons.jpg' },
    { id: 'dekor-dlya-svyata', name: 'Декор для свята', image: '/images/categories/party_decor.jpg' },
    { id: 'serviruvannya-stolu', name: 'Сервірування столу', image: '/images/categories/tableware.jpg' },
    { id: 'svichky-ta-toppery', name: 'Свічки та Топери', image: '/images/categories/candles_toppers.jpg' },
    { id: 'girlyandy-led', name: 'Гірлянди LED', image: '/images/categories/led_garlands.jpg' }
];

// --- ДАНІ ДЛЯ ТОВАРІВ ---
const productsSeedData = [
    {
        name: 'Світлодіодна стрічка для кульок (1м)',
        description: 'Чудова світлодіодна стрічка довжиною 1 метр, яка ідеально підходить для декорування повітряних кульок, створення святкової атмосфери. Легко кріпиться та має яскраве світіння.',
        price: 95,
        image: '/images/products/prod_led_strip.jpg',
        categorySlug: 'girlyandy-led', hit: false, new: true, inStock: true, sku: 'LEDSTR001'
    },
    {
        name: 'Набір кульок "День Народження" золото',
        description: 'Елегантний набір золотих повітряних кульок для святкування дня народження. Включає літери та декоративні елементи.',
        price: 250,
        image: '/images/products/balloons_hb_gold.jpg',
        categorySlug: 'povitryani-kulky', hit: true, new: false, inStock: true, sku: 'BLNSET001'
    },
    {
        name: 'Паперові стаканчики "Веселка" (10 шт)',
        description: 'Яскраві паперові стаканчики з дизайном веселки, ідеально для дитячого свята. В упаковці 10 штук.',
        price: 70,
        image: '/images/products/paper_cups_rainbow.jpg',
        categorySlug: 'serviruvannya-stolu', hit: false, new: true, inStock: true, sku: 'PCUP005'
    },
    {
        name: 'Топер для торта "Happy Birthday" дерев\'яний',
        description: 'Стильний дерев\'яний топер для торта з написом "Happy Birthday". Додасть шарму вашому святковому торту.',
        price: 120,
        image: '/images/products/topper_hb_wood.jpg',
        categorySlug: 'svichky-ta-toppery',
        hit: true,
        new: true,
        inStock: false,
        sku: 'TOPHBW01'
    },
    {
        name: 'Гірлянда "Зірочки" тепле світло (5м)',
        description: 'Декоративна гірлянда з маленькими зірочками, що світяться теплим білим світлом. Довжина 5 метрів.',
        price: 180,
        image: '/images/products/garland_stars_warm.jpg',
        categorySlug: 'dekor-dlya-svyata',
        hit: false,
        new: false,
        inStock: true,
        sku: 'GARST002'
    }
];
let createdProductIds = []; // Сюди збережемо ID створених товарів

// --- ДАНІ ДЛЯ ЗАМОВЛЕНЬ ---
function getOrdersData(productIds) {
    if (productIds.length < 2) { // Потрібно щонайменше 2 різних товари для першого замовлення
        console.warn("Недостатньо створених товарів для формування тестових замовлень (потрібно щонайменше 2).");
        return [];
    }
     if (productIds.length < 3 && productsSeedData.length >=3 ) { // Потрібно 3 товари для другого замовлення
        console.warn("Недостатньо створених товарів для другого тестового замовлення (потрібно щонайменше 3).");
    }

    // Генерація унікальних суфіксів для orderNumber
    // Використовуємо лічильник, щоб забезпечити унікальність в межах одного запуску
    let orderCounter = 0;
    const generateUniqueOrderNumber = () => {
        orderCounter++;
        const timestampPart = Date.now().toString().slice(-5); // Коротший timestamp
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        return `HPK-SEED-${timestampPart}-${String(orderCounter).padStart(2, '0')}-${randomPart}`;
    };
    
    const orders = [];

    // Перше замовлення
    if (productIds[0] && productIds[1] && productsSeedData[0] && productsSeedData[1]) {
        orders.push({
            orderNumber: generateUniqueOrderNumber(),
            status: 'completed',
            items: [
                { productId: productIds[0], name: productsSeedData[0].name, quantity: 2, price: productsSeedData[0].price, image: productsSeedData[0].image },
                { productId: productIds[1], name: productsSeedData[1].name, quantity: 1, price: productsSeedData[1].price, image: productsSeedData[1].image }
            ],
            totalAmount: (productsSeedData[0].price * 2) + productsSeedData[1].price,
            customerDetails: { name: 'Іван Петренко', phone: '+380501234567', email: 'ivan@example.com' },
            shippingDetails: { city: 'Київ', addressLine1: 'вул. Хрещатик, 1, кв. 5', warehouse: 'Відділення Нової Пошти №10' },
            paymentMethod: 'card_online',
            orderComment: 'Доставити після 18:00'
            // userId: 'someTestUserId1', // Якщо потрібно для тестування
        });
    }

    // Друге замовлення
    if (productIds[2] && productsSeedData[2]) {
        orders.push({
            userId: 'anotherTestUser789', // Для іншого залогіненого користувача
            orderNumber: generateUniqueOrderNumber(),
            status: 'pending',
            items: [
                { productId: productIds[2], name: productsSeedData[2].name, quantity: 5, price: productsSeedData[2].price, image: productsSeedData[2].image }
            ],
            totalAmount: productsSeedData[2].price * 5,
            customerDetails: { name: 'Олена Іваненко', phone: '+380979876543', email: 'olena@example.com' },
            shippingDetails: { city: 'Львів', addressLine1: 'просп. Свободи, 20', warehouse: 'Поштомат №305' },
            paymentMethod: 'cash_on_delivery',
            orderComment: ''
        });
    }
    return orders;
}


// --- ФУНКЦІЯ ДОДАВАННЯ КАТЕГОРІЙ ---
async function seedCategories() {
    console.log('Початок заповнення категорій...');
    const categoriesCollection = db.collection('categories');
    let count = 0;
    for (const category of categoriesData) {
        try {
            await categoriesCollection.doc(category.id).set({ name: category.name, image: category.image });
            console.log(`Категорію "${category.name}" (ID: ${category.id}) успішно додано.`);
            count++;
        } catch (error) { console.error(`Помилка додавання категорії "${category.name}":`, error); }
    }
    console.log(`Завершено заповнення категорій. Додано: ${count} з ${categoriesData.length}.`);
}

// --- ФУНКЦІЯ ДОДАВАННЯ ТОВАРІВ ---
async function seedProducts() {
    console.log('Початок заповнення товарів...');
    const productsCollection = db.collection('products');
    let count = 0;
    createdProductIds = []; 

    for (const product of productsSeedData) {
        try {
            const productDoc = {
                name: product.name, description: product.description, price: product.price,
                image: product.image, categorySlug: product.categorySlug, hit: product.hit || false,
                new: product.new || false, inStock: product.inStock !== undefined ? product.inStock : true,
                sku: product.sku || '', nameTokens: generateNameTokens(product.name),
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };
            const docRef = await productsCollection.add(productDoc);
            console.log(`Товар "${product.name}" успішно додано з ID: ${docRef.id}.`);
            createdProductIds.push(docRef.id); 
            count++;
        } catch (error) { console.error(`Помилка додавання товару "${product.name}":`, error); }
    }
    console.log(`Завершено заповнення товарів. Додано: ${count} з ${productsSeedData.length}.`);
}

// --- ФУНКЦІЯ ДОДАВАННЯ ЗАМОВЛЕНЬ ---
async function seedOrders() {
    console.log('Початок заповнення замовлень...');
    if (createdProductIds.length === 0) {
        console.warn("Немає створених товарів, замовлення не будуть додані. Запустіть спочатку seedProducts.");
        return;
    }

    const ordersCollection = db.collection('orders');
    const ordersDataToSeed = getOrdersData(createdProductIds);
    if (ordersDataToSeed.length === 0) {
        console.log("Немає даних для заповнення замовлень.");
        return;
    }
    let count = 0;

    for (const order of ordersDataToSeed) {
        try {
            const orderDoc = {
                ...order,
                date: admin.firestore.FieldValue.serverTimestamp()
            };
            if (!order.orderNumber || typeof order.orderNumber !== 'string' || order.orderNumber.trim() === '') {
                console.error('Помилка: orderNumber відсутній або некоректний для замовлення:', order);
                continue;
            }
            await ordersCollection.doc(order.orderNumber).set(orderDoc);
            console.log(`Замовлення з ID (orderNumber) "${order.orderNumber}" успішно додано.`);
            count++;
        } catch (error) {
            console.error(`Помилка додавання замовлення з ID (orderNumber) "${order.orderNumber}":`, error);
        }
    }
    console.log(`Завершено заповнення замовлень. Додано: ${count} з ${ordersDataToSeed.length}.`);
}

// --- ГОЛОВНА ФУНКЦІЯ ДЛЯ ЗАПУСКУ ЗАПОВНЕННЯ ---
async function main() {
    console.log('--- Початок процесу заповнення бази даних ---');
    await seedCategories();
    await seedProducts(); 
    await seedOrders();   
    console.log('--- Процес заповнення бази даних завершено ---');
}

main().catch(error => {
    console.error("Критична помилка під час виконання скрипта заповнення:", error);
});