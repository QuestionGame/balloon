// server/add-product-descriptions.js
const admin = require('firebase-admin');

try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  console.log("Firebase Admin SDK ініціалізовано для оновлення описів.");
} catch (error) {
  console.error("ПОМИЛКА: Не вдалося ініціалізувати Firebase Admin SDK.", error);
  process.exit(1);
}

const db = admin.firestore();

function generateDetailedDescription(productName, categoryName) {
    let nameLower = productName.toLowerCase();
    let catLower = categoryName ? categoryName.toLowerCase() : "";

    let intro = `Представляємо вам "${productName}" – незамінний атрибут для будь-якого свята! `;
    let categorySpecific = "";
    let usage = "Цей товар допоможе створити яскраву та веселу атмосферу, подарує радість та незабутні моменти вам та вашим гостям. ";
    let quality = "Виготовлений з якісних матеріалів, він безпечний у використанні та має привабливий дизайн. ";
    let callToAction = `Замовляйте "${productName}" вже сьогодні та зробіть ваше свято по-справжньому особливим!`;

    // Специфікація на основі категорії
    if (catLower.includes("глітер")) {
        categorySpecific = `Цей блискучий глітер ідеально підходить для декорування кульок, подарунків або створення святкових композицій. Додайте сяйва вашим ідеям! `;
        usage = ""; // Перевизначаємо, бо вже описано
    } else if (catLower.includes("засоби для обробки кульок")) {
        categorySpecific = `Спеціальний засіб "${productName}" призначений для продовження часу польоту латексних кульок, наповнених гелієм. З ним ваші кульки будуть радувати вас довше! `;
    } else if (catLower.includes("компресори та насоси")) {
        categorySpecific = `"${productName}" – це надійний помічник для швидкого та легкого надування повітряних кульок. Економте свій час та сили! `;
    } else if (catLower.includes("конфеті")) {
        categorySpecific = `Яскраве конфеті "${productName}" додасть святкового настрою та веселощів. Ідеально для створення ефекту "вау" на днях народження, весіллях та інших урочистостях. `;
    } else if (catLower.includes("коробки-сюрпризи")) {
        categorySpecific = `Велика та стильна коробка-сюрприз "${productName}" стане чудовим способом подарувати повітряні кульки або інший подарунок, створюючи інтригу та захват. `;
    } else if (catLower.includes("накле")) { // наклейки
        categorySpecific = `Декоративні наклейки "${productName}" дозволять персоналізувати ваші повітряні кульки, додати написи або тематичні зображення. `;
    } else if (catLower.includes("палички") || catLower.includes("насадки")) {
        categorySpecific = `"${productName}" – це зручні аксесуари для кріплення та демонстрації повітряних кульок, що не наповнені гелієм. `;
    } else if (catLower.includes("світлодіоди")) {
        categorySpecific = `Додайте магії вашим кулькам за допомогою світлодіодів "${productName}"! Вони створять чарівне світіння та зроблять вечірнє свято незабутнім. `;
    } else if (catLower.includes("арки з кульок") || nameLower.includes("арка з кульок")) {
        categorySpecific = `Набір для створення арки з кульок "${productName}" дозволить вам легко та швидко створити вражаючу фотозону або декорацію для будь-якого свята. Включає все необхідне для збірки. `;
        usage = "";
    } else if (catLower.includes("латексні кульки")) {
        categorySpecific = `Високоякісні латексні кульки "${productName}". Насичені кольори та міцний матеріал забезпечать тривалий політ та яскравий вигляд. `;
    } else if (catLower.includes("набори повітряних куль")) {
        categorySpecific = `Тематичний набір повітряних куль "${productName}" – це готове рішення для оформлення вашого свята. Включає різноманітні кульки, що ідеально поєднуються між собою. `;
    } else if (catLower.includes("фольговані букви")) {
        categorySpecific = `Складіть будь-яке ім'я або напис за допомогою фольгованих букв "${productName}". Чудово підходять для днів народжень, ювілеїв та фотосесій. `;
    } else if (catLower.includes("фольговані цифри")) {
        categorySpecific = `Фольгована цифра "${productName}" стане яскравим акцентом на святкуванні дня народження або річниці. Великий розмір та блискучий дизайн привернуть увагу. `;
    } else if (catLower.includes("фольговані") && (catLower.includes("різні") || catLower.includes("малюнком") || catLower.includes("фігури"))) {
        categorySpecific = `Оригінальна фольгована кулька "${productName}" у вигляді фігури або з яскравим малюнком стане чудовим доповненням до святкового декору або подарунком. `;
    }

    // Специфікація на основі назви товару (доповнює або уточнює)
    if (nameLower.includes("серце")) {
        usage += `Особливо романтично виглядає на День Святого Валентина або весілля. `;
    } else if (nameLower.includes("зірочки") || nameLower.includes("зірка")) {
        usage += `Додасть космічного шарму або відчуття свята. `;
    } else if (nameLower.includes("золото") || nameLower.includes("золотий")) {
        quality += `Елегантний золотий колір додасть розкоші вашому святу. `;
    } else if (nameLower.includes("срібло") || nameLower.includes("срібний")) {
        quality += `Стильний срібний відтінок пасуватиме до будь-якої кольорової гами. `;
    } else if (nameLower.includes("пастель")) {
        quality += `Ніжні пастельні відтінки створять легку та витончену атмосферу. `;
    } else if (nameLower.includes("асорті")) {
        quality += `Різноманіття кольорів в одному наборі дозволить створити унікальні композиції. `;
    }

    return `${intro}${categorySpecific}${usage}${quality}${callToAction}`.replace(/\s+/g, ' ').trim();
}


async function addDescriptionsToProducts() {
  console.log('Початок додавання/оновлення детальних описів до товарів...');
  const productsRef = db.collection('products');
  const categoriesRef = db.collection('categories');
  let updatedCount = 0;
  let skippedCount = 0; // Лічильник товарів, які вже мають опис

  try {
    const categoriesSnapshot = await categoriesRef.get();
    const categoriesMap = new Map();
    categoriesSnapshot.forEach(doc => {
      const categoryData = doc.data();
      const slug = categoryData.slug || doc.id;
      if (slug && categoryData.name) {
        categoriesMap.set(slug, categoryData.name);
      }
    });
    console.log(`Завантажено ${categoriesMap.size} категорій для мапінгу.`);

    const productsSnapshot = await productsRef.get();
    if (productsSnapshot.empty) {
      console.log('Не знайдено товарів для оновлення.');
      return;
    }

    const batch = db.batch();
    let operationsInBatch = 0;

    for (const doc of productsSnapshot.docs) {
      const productData = doc.data();
      const productId = doc.id;

      // Перевіряємо, чи поле description вже існує і не порожнє
      if (productData.description && typeof productData.description === 'string' && productData.description.trim() !== '') {
        // Якщо ви хочете ПЕРЕЗАПИСУВАТИ існуючі описи, закоментуйте цей блок if
        // console.log(`Товар "${productData.name}" (ID: ${productId}) вже має опис. Пропускаємо.`);
        // skippedCount++;
        // continue; // Перейти до наступного товару, якщо не перезаписуємо
      }

      const categoryName = productData.categorySlug ? categoriesMap.get(productData.categorySlug) || '' : '';
      const detailedDescription = generateDetailedDescription(productData.name, categoryName);
      
      batch.update(productsRef.doc(productId), { description: detailedDescription });
      console.log(`Для товару "${productData.name}" (ID: ${productId}) буде оновлено/додано опис.`);
      updatedCount++;
      operationsInBatch++;

      // Firestore batch має ліміт у 500 операцій
      if (operationsInBatch >= 490) { 
        await batch.commit();
        console.log(`Застосовано пакет з ${operationsInBatch} оновлень.`);
        batch = db.batch(); // Створюємо новий batch
        operationsInBatch = 0;
      }
    }

    // Застосовуємо залишок операцій, якщо вони є
    if (operationsInBatch > 0) {
      await batch.commit();
      console.log(`Застосовано фінальний пакет з ${operationsInBatch} оновлень.`);
    }

    if (updatedCount > 0) {
      console.log(`Оновлено/додано описів для ${updatedCount} товарів.`);
    } else if (skippedCount === productsSnapshot.size) {
        console.log('Всі товари вже мали опис. Жодних оновлень не зроблено.');
    } else {
      console.log('Не було товарів, які потребують оновлення опису (або всі були пропущені).');
    }
    if (skippedCount > 0) {
        console.log(`Пропущено (не перезаписано) ${skippedCount} товарів, які вже мали опис.`);
    }

  } catch (error) {
    console.error('Сталася помилка під час оновлення описів товарів:', error);
  }
  console.log('Процес оновлення/додавання описів завершено.');
}

addDescriptionsToProducts();