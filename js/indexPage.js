// /js/indexPage.js
import { fetchData } from './api.js';
import { renderProductCard, renderCategoryCard } from './renderers.js';

async function renderSection(gridId, apiUrl, renderer, sectionName) {
    const grid = document.getElementById(gridId);
    if (!grid) {
        console.warn(`Елемент для секції "${sectionName}" з ID "${gridId}" не знайдено.`);
        return;
    }
    const apiResponse = await fetchData(apiUrl);
    if (apiResponse && apiResponse.success && Array.isArray(apiResponse.data)) {
        if (apiResponse.data.length > 0) {
            grid.innerHTML = '';
            apiResponse.data.forEach(item => grid.appendChild(renderer(item)));
        } else {
            grid.innerHTML = `<p>Наразі немає ${sectionName} для відображення.</p>`;
        }
    } else {
        grid.innerHTML = `<p>Не вдалося завантажити ${sectionName}. ${apiResponse?.message || ''}</p>`;
        console.warn(`Не вдалося завантажити ${sectionName}:`, apiResponse?.message);
    }
};

export async function initializeIndexPageContent() {
    // Використовуємо параметр limit, якщо ваш сервер його підтримує
    await renderSection('promo-product-grid', '/api/products?hit=true&limit=3', renderProductCard, 'хіти продажів');
    await renderSection('new-arrivals-product-grid', '/api/products?new=true&limit=3', renderProductCard, 'новинки');
    await renderSection('category-grid-index', '/api/categories?limit=4', renderCategoryCard, 'популярні категорії');
}