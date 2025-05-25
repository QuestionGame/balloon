// /server/seed-firebase.js
const admin = require('firebase-admin');

try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  console.log("Firebase Admin SDK ініціалізовано для заповнення.");
} catch (error) {
  console.error("ПОМИЛКА: Не вдалося ініціалізувати Firebase Admin SDK для заповнення.", error);
  process.exit(1);
}

const db = admin.firestore();

const categoriesToSeed = [
    { name: "Глітер", slug: "glitter", image: "/images/categories/cat_glitter.png" },
    { name: "Засоби для обробки кульок", slug: "balloons-treatment", image: "/images/categories/cat_treatment.png" },
    { name: "Компресори та насоси", slug: "compressors-pumps", image: "/images/categories/cat_pumps.png" },
    { name: "Конфеті", slug: "confetti", image: "/images/categories/cat_confetti.png" },
    { name: "Коробки-сюрпризи для кульок", slug: "surprise-boxes", image: "/images/categories/cat_surprisebox.png" },
    { name: "Наклейки для куль", slug: "balloon-stickers", image: "/images/categories/cat_stickers.png" },
    { name: "Палички та насадки", slug: "sticks-nozzles", image: "/images/categories/cat_sticks.png" },
    { name: "Світлодіоди для кульок", slug: "leds-balloons", image: "/images/categories/cat_leds.png" },
    { name: "Арки з кульок", slug: "balloon-arches", image: "/images/categories/cat_arches.png" },
    { name: "Латексні кульки", slug: "latex-balloons", image: "/images/categories/cat_latex.png" },
    { name: "Латексні кульки з малюнком", slug: "latex-balloons-printed", image: "/images/categories/cat_latex_printed.png" },
    { name: "Набори повітряних куль", slug: "balloon-sets", image: "/images/categories/cat_sets.png" },
    { name: "Фольговані букви", slug: "foil-letters", image: "/images/categories/cat_letters.png" },
    { name: "Фольговані кульки (різні)", slug: "foil-balloons-various", image: "/images/categories/cat_foil_various.png" },
    { name: "Фольговані цифри", slug: "foil-numbers", image: "/images/categories/cat_numbers.png" }
];

// Функція для створення токенів з назви
function generateNameTokens(name) {
    if (!name || typeof name !== 'string') return [];
    return name.toLowerCase().split(/\s+/).filter(token => token.length > 0); // Розділяємо за пробілами, в нижній регістр
}

const productsToSeed = [
    { name: "Золотий глітер для кульок (50г)", price: 75, image: "/images/products/prod_glitter_gold.png", categorySlug: "glitter", new: true, hit: false },
    { name: "Срібний глітер-пил (30г)", price: 60, image: "/images/products/prod_glitter_silver.png", categorySlug: "glitter", new: false, hit: true },
    { name: "Hi-Float засіб для обробки (250мл)", price: 350, image: "/images/products/prod_hifloat.png", categorySlug: "balloons-treatment", new: false, hit: true },
    { name: "Електричний насос для кульок", price: 700, image: "/images/products/prod_electric_pump.png", categorySlug: "compressors-pumps", new: true, hit: false },
    { name: "Конфеті 'Золоті зірочки' (50г)", price: 90, image: "/images/products/prod_confetti_stars.png", categorySlug: "confetti", new: false, hit: false },
    { name: "Велика коробка-сюрприз (біла)", price: 450, image: "/images/products/prod_surprise_box_large.png", categorySlug: "surprise-boxes", new: true, hit: true },
    { name: "Набір наклейок 'З Днем Народження'", price: 120, image: "/images/products/prod_stickers_hb.png", categorySlug: "balloon-stickers", new: false, hit: false },
    { name: "Латексні кульки 'Пастель Асорті' (50 шт)", price: 280, image: "/images/products/prod_latex_pastel_assorti.png", categorySlug: "latex-balloons", new: true, hit: true },
    { name: "Латексні кульки з малюнком 'Сердечка' (10 шт)", price: 150, image: "/images/products/prod_latex_hearts.png", categorySlug: "latex-balloons-printed", new: false, hit: false },
    { name: "Набір повітряних кульок 'Космос'", price: 550, image: "/images/products/prod_set_space.png", categorySlug: "balloon-sets", new: true, hit: false },
    { name: "Фольгована буква 'A' золото (40см)", price: 80, image: "/images/products/prod_foil_letter_a.png", categorySlug: "foil-letters", new: false, hit: false },
    { name: "Фольгована цифра '5' срібло (100см)", price: 180, image: "/images/products/prod_foil_number_5.png", categorySlug: "foil-numbers", new: true, hit: true },
    { name: "Світлодіодна стрічка для кульок (1м)", price: 95, image: "/images/products/prod_led_strip.png", categorySlug: "leds-balloons", new: false, hit: false },
    { name: "Набір для арки з кульок 'Веселка'", price: 650, image: "/images/products/prod_arch_kit_rainbow.png", categorySlug: "balloon-arches", new: true, hit: false }
].map((product, index) => ({
    id: `prod_${Date.now()}_${index}`, // Унікальний ID
    ...product,
    nameTokens: generateNameTokens(product.name) // Додаємо токени
}));


async function seedDatabase() {
  console.log('Початок заповнення бази даних...');
  const batch = db.batch(); // Використовуємо batch для ефективності

  // Заповнення категорій
  console.log('Заповнення категорій...');
  categoriesToSeed.forEach(category => {
    const { slug, ...categoryData } = category;
    const categoryRef = db.collection('categories').doc(slug); // Використовуємо slug як ID документа
    batch.set(categoryRef, categoryData);
  });
  
  // Заповнення товарів
  console.log('Заповнення товарів...');
  productsToSeed.forEach(product => {
    const { id, ...productData } = product; // Використовуємо згенерований id
    const productRef = db.collection('products').doc(id);
    batch.set(productRef, productData);
  });

  await batch.commit(); // Відправляємо всі операції одним пакетом
  console.log(`${categoriesToSeed.length} категорій та ${productsToSeed.length} товарів успішно занесено/оновлено.`);
  console.log('Заповнення бази даних завершено!');
}

seedDatabase().catch(error => {
  console.error('Сталася помилка під час заповнення бази даних:', error);
});