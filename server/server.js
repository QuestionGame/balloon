// /server/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const cors = require('cors');
const morgan = require('morgan');

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

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const projectRoot = path.join(__dirname, '../');
app.use(express.static(projectRoot));
console.log(`Статичні файли обслуговуються з: ${projectRoot}`);

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

app.get('/api/categories', async (req, res) => {
  try {
    let query = db.collection('categories').orderBy('name');
    const limit = parseInt(req.query.limit);
    if (!isNaN(limit) && limit > 0) {
      query = query.limit(limit);
    }
    const categoriesSnapshot = await query.get();
    const categories = categoriesSnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id,
        name: data.name,
        image: data.image,
        slug: doc.id // Використовуємо ID документа як slug
      };
    });
    sendSuccess(res, categories, "Категорії успішно отримано");
  } catch (error) {
    sendError(res, 500, "Не вдалося отримати категорії", error, req);
  }
});

app.get('/api/products', async (req, res) => {
  try {
    let query = db.collection('products');
    const { 
        category, 
        new: isNew, 
        hit: isHit, 
        sortBy = 'name', 
        order = 'asc', 
        minPrice, 
        maxPrice, 
        limit: queryLimit,
        search 
    } = req.query;

    let priceFilterApplied = false;
    let searchApplied = false;

    // ПОШУК за nameTokens
    if (search && typeof search === 'string' && search.trim() !== '') {
        const searchTokens = search.trim().toLowerCase().split(/\s+/).filter(token => token.length > 0).slice(0, 10);
        if (searchTokens.length > 0) {
            query = query.where('nameTokens', 'array-contains-any', searchTokens);
            searchApplied = true;
        }
    }

    // Фільтрація за категоріями
    if (category) {
      let categorySlugs = [];
      if (Array.isArray(category)) {
        categorySlugs = category.filter(slug => slug && typeof slug === 'string' && slug.trim() !== '' && slug.trim().toLowerCase() !== 'undefined');
      } else if (typeof category === 'string') {
        categorySlugs = category.split(',')
                                .map(slug => slug.trim())
                                .filter(slug => slug && slug !== '' && slug.toLowerCase() !== 'undefined');
      }
      if (categorySlugs.length > 0) {
        if (searchApplied && categorySlugs.length > 0) {
            console.warn("Firestore не може поєднувати 'array-contains-any' (для пошуку) з 'in' (для категорій) в одному простому запиті без спеціальних рішень. Фільтрація за категоріями може бути неточною або викликати помилку індексу.");
            // Розгляньте можливість застосувати фільтр категорій на клієнті, якщо пошук активний, або використовувати складніші запити/декілька запитів.
            // Для простоти, якщо є пошук, ми можемо не застосовувати фільтр категорій до запиту Firestore, щоб уникнути помилок індексів.
            // Або, якщо дуже потрібно, можна спробувати, але бути готовим до помилок індексів:
            // query = query.where('categorySlug', 'in', categorySlugs.slice(0, Math.min(categorySlugs.length, 10)));
        } else if (categorySlugs.length <= 10) {
             query = query.where('categorySlug', 'in', categorySlugs);
        } else {
           console.warn("Запит містить більше 10 категорій. Фільтруються перші 10.");
           query = query.where('categorySlug', 'in', categorySlugs.slice(0,10));
        }
      }
    }

    if (isNew === 'true') query = query.where('new', '==', true);
    if (isHit === 'true') query = query.where('hit', '==', true);

    // Фільтрація за ціною - НЕ застосовуємо, якщо активний пошук, щоб уникнути складних проблем з індексами Firestore
    if (!searchApplied) {
        const minPriceNum = parseFloat(minPrice);
        const maxPriceNum = parseFloat(maxPrice);

        if (!isNaN(minPriceNum)) {
            query = query.where('price', '>=', minPriceNum);
            priceFilterApplied = true;
        }
        if (!isNaN(maxPriceNum)) {
            query = query.where('price', '<=', maxPriceNum);
            priceFilterApplied = true;
        }
    } else if (minPrice || maxPrice) {
        console.warn("Фільтрація за ціною не застосовується разом з текстовим пошуком через обмеження запитів Firestore.");
    }
    
    // Сортування
    if (sortBy === 'price' && !searchApplied) { // Сортування за ціною тільки якщо немає пошуку (і є фільтр ціни або просто сортування за ціною)
        query = query.orderBy('price', order === 'desc' ? 'desc' : 'asc');
    } else {
        // Якщо є пошук, Firestore може сортувати тільки за тим же полем, що використовується в array-contains-any,
        // або вимагатиме дуже специфічних індексів для сортування за іншим полем.
        // Для nameTokens пошуку, сортування за 'name' є природним.
        query = query.orderBy('name', order === 'desc' ? 'desc' : 'asc');
    }
    // ВАЖЛИВО: Створення композитних індексів у Firestore є ОБОВ'ЯЗКОВИМ.
    // Слідкуйте за консоллю сервера на повідомлення від Firebase з посиланнями для створення індексів.
    // Приклади необхідних індексів:
    // (nameTokens ARRAY, name ASC/DESC) - для пошуку та сортування за назвою
    // (categorySlug IN, name ASC/DESC) - для фільтра за категорією та сортування за назвою
    // (hit == true, name ASC/DESC) - для фільтра хітів та сортування за назвою
    // (price >= X, name ASC/DESC) - для фільтра ціни та сортування за назвою (і аналогічно для <=)
    // (price >= X, price ASC/DESC) - для фільтра ціни та сортування за ціною

    const limit = parseInt(queryLimit);
    if (!isNaN(limit) && limit > 0) query = query.limit(limit);

    const productsSnapshot = await query.get();
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    sendSuccess(res, products, "Товари успішно отримано");
  } catch (error) {
    sendError(res, error.code === 9 ? 400 : 500, "Не вдалося отримати товари", error, req);
  }
});

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

app.get('/', (req, res) => res.sendFile(path.join(projectRoot, 'index.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(projectRoot, 'cart.html')));
app.get('/catalog', (req, res) => res.sendFile(path.join(projectRoot, 'catalog.html')));
app.get('/product-details.html', (req, res) => res.sendFile(path.join(projectRoot, 'product-details.html'))); // Явний маршрут для сторінки товару

app.use(/^\/api\/.*/,(req, res) => {
    sendError(res, 404, "Запитаний API ресурс не знайдено.", null, req);
});

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

app.use((err, req, res, next) => {
  console.error("Непередбачена помилка сервера:", err.stack || err);
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = err.status || (err.code === 9 ? 400 : 500); 
  
  let clientErrorMessage = 'На сервері сталася внутрішня помилка. Будь ласка, спробуйте пізніше.';
  if (!isProduction) {
    clientErrorMessage = err.message || 'Невідома серверна помилка';
  } else if (statusCode === 400 && err.message && err.message.includes("requires an index")) {
    clientErrorMessage = "Помилка запиту до бази даних. Будь ласка, повідомте адміністратора, якщо проблема повторюється.";
  }

  res.status(statusCode).json({
      success: false,
      message: "Помилка сервера",
      error: clientErrorMessage,
      details: !isProduction && err.stack ? err.stack.split('\n') : undefined 
  });
});

app.listen(PORT, () => {
  console.log(`Сервер успішно запущено на http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log('Режим розробки. Використовуйте `npm run dev` для автоматичного перезапуску з nodemon.');
  }
});