// /js/catalogPage.js
import { fetchData } from './api.js';
import { renderProductCard } from './renderers.js';
// import { showToast } from './uiElements.js'; // Розкоментуйте, якщо showToast тут явно потрібен

export async function initializeCatalogPage() {
    const productGrid = document.getElementById('catalog-product-grid');
    const categoryFilterList = document.getElementById('category-filter-list');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const sortBySelect = document.getElementById('sort-by');
    const priceFromInput = document.getElementById('price-from');
    const priceToInput = document.getElementById('price-to');
    const filterNewCheckbox = document.getElementById('filter-new');
    const catalogTitleElement = document.querySelector('.catalog-header h1');

    const loadingIndicator = document.createElement('p');
    loadingIndicator.textContent = 'Завантаження товарів...';
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.style.textAlign = 'center';
    loadingIndicator.style.padding = '20px';
    loadingIndicator.style.display = 'none';

    if (!productGrid) {
        return; 
    }
    console.log("catalogPage.js: Початок ініціалізації сторінки каталогу.");

    let currentSearchTerm = new URLSearchParams(window.location.search).get('search') || '';
    
    function updateUrlWithFilters() {
        const params = new URLSearchParams();
        if (currentSearchTerm) params.append('search', currentSearchTerm);

        if (categoryFilterList) {
            Array.from(categoryFilterList.querySelectorAll('input[name="category"]:checked'))
                 .forEach(cb => {
                     if (cb.value && typeof cb.value === 'string' && cb.value.trim() !== '' && cb.value.trim().toLowerCase() !== 'undefined') {
                         params.append('category', cb.value);
                     }
                 });
        }
        if (priceFromInput && priceFromInput.value.trim() !== '') {
            const minPrice = parseFloat(priceFromInput.value);
            if (!isNaN(minPrice)) params.append('minPrice', minPrice.toString());
        }
        if (priceToInput && priceToInput.value.trim() !== '') {
            const maxPrice = parseFloat(priceToInput.value);
            if (!isNaN(maxPrice)) params.append('maxPrice', maxPrice.toString());
        }
        if (filterNewCheckbox && filterNewCheckbox.checked) params.append('new', 'true');
        if (sortBySelect && sortBySelect.value && sortBySelect.value !== 'default') {
            const [field, order] = sortBySelect.value.split('-');
            params.append('sortBy', field);
            params.append('order', order);
        }
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        history.pushState({path: newUrl}, '', newUrl);
    }
    
    function updateCatalogTitle() {
        if (catalogTitleElement) {
            if (currentSearchTerm) {
                catalogTitleElement.textContent = `Результати пошуку: "${currentSearchTerm}"`;
            } else {
                const checkedCategories = categoryFilterList ? Array.from(categoryFilterList.querySelectorAll('input[name="category"]:checked')) : [];
                if (checkedCategories.length > 0) {
                    catalogTitleElement.textContent = 'Відфільтровані товари';
                } else {
                    catalogTitleElement.textContent = 'Всі товари';
                }
            }
        }
    }

    async function loadAndDisplayProducts() {
        if (!productGrid) return; // Додаткова перевірка
        productGrid.innerHTML = ''; 
        productGrid.appendChild(loadingIndicator);
        loadingIndicator.style.display = 'block';

        updateCatalogTitle(); 
        
        let queryParams = new URLSearchParams();
        if (currentSearchTerm) queryParams.append('search', currentSearchTerm);

        if (categoryFilterList) {
            Array.from(categoryFilterList.querySelectorAll('input[name="category"]:checked'))
                 .forEach(cb => {
                     if (cb.value && typeof cb.value === 'string' && cb.value.trim() !== '' && cb.value.trim().toLowerCase() !== 'undefined') {
                         queryParams.append('category', cb.value);
                     }
                 });
        }
        if (priceFromInput && priceFromInput.value.trim() !== '') {
            const minPriceVal = parseFloat(priceFromInput.value);
            if (!isNaN(minPriceVal)) queryParams.append('minPrice', minPriceVal.toString());
        }
        if (priceToInput && priceToInput.value.trim() !== '') {
            const maxPriceVal = parseFloat(priceToInput.value);
            if (!isNaN(maxPriceVal)) queryParams.append('maxPrice', maxPriceVal.toString());
        }
        if (filterNewCheckbox && filterNewCheckbox.checked) queryParams.append('new', 'true');
        if (sortBySelect && sortBySelect.value && sortBySelect.value !== 'default') {
            const [field, order] = sortBySelect.value.split('-');
            queryParams.append('sortBy', field);
            queryParams.append('order', order);
        }
        
        const apiUrl = `/api/products?${queryParams.toString()}`;
        console.log("catalogPage.js: Запит до API для товарів:", apiUrl);
        
        const apiResponse = await fetchData(apiUrl);
        loadingIndicator.style.display = 'none';

        if (apiResponse && apiResponse.success && Array.isArray(apiResponse.data)) {
            if (apiResponse.data.length === 0) {
                productGrid.innerHTML = '<p class="no-products-message">За вашим запитом товарів не знайдено.</p>';
            } else {
                apiResponse.data.forEach(product => productGrid.appendChild(renderProductCard(product)));
            }
        } else {
            productGrid.innerHTML = `<p class="no-products-message">Не вдалося завантажити товари. ${apiResponse?.message || 'Перевірте консоль.'}</p>`;
        }
        updateUrlWithFilters();
    }

    if (categoryFilterList) {
        const catApiResponse = await fetchData('/api/categories');
        if (catApiResponse && catApiResponse.success && Array.isArray(catApiResponse.data)) {
            categoryFilterList.innerHTML = '';
            if (catApiResponse.data.length === 0) {
                categoryFilterList.innerHTML = '<li><p>Категорії не знайдено.</p></li>';
            } else {
                catApiResponse.data.forEach((cat) => {
                    if (cat.slug && typeof cat.slug === 'string' && cat.slug.trim() !== '') { 
                        const li = document.createElement('li');
                        li.innerHTML = `<label><input type="checkbox" name="category" value="${cat.slug}"> ${cat.name}</label>`;
                        categoryFilterList.appendChild(li);
                    } else {
                        console.warn(`catalogPage.js: Категорія ("${cat.name || 'Без імені'}") без валідного slug.`);
                    }
                });
            }
        } else {
             console.warn("catalogPage.js: Не вдалося завантажити фільтри категорій.");
             if (categoryFilterList) categoryFilterList.innerHTML = '<li><p>Помилка завантаження категорій.</p></li>';
        }
    } else {
        console.warn("catalogPage.js: Елемент #category-filter-list не знайдено.");
    }
    
    const initialUrlParams = new URLSearchParams(window.location.search);
    currentSearchTerm = initialUrlParams.get('search') || '';
    const initialCategoriesFromUrl = initialUrlParams.getAll('category').filter(slug => slug && slug.trim() !== '' && slug.trim().toLowerCase() !== 'undefined');
    
    if (currentSearchTerm) {
        const headerSearchBar = document.querySelector('header .search-bar');
        if (headerSearchBar) headerSearchBar.value = currentSearchTerm;
    }
    
    if (initialCategoriesFromUrl.length > 0 && categoryFilterList) {
        await new Promise(resolve => setTimeout(resolve, 0)); 
        initialCategoriesFromUrl.forEach(catSlug => {
            const checkbox = categoryFilterList.querySelector(`input[value="${catSlug}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
    // Встановлюємо значення фільтрів ціни з URL, якщо вони є
    if (priceFromInput && initialUrlParams.has('minPrice')) {
        priceFromInput.value = initialUrlParams.get('minPrice');
    }
    if (priceToInput && initialUrlParams.has('maxPrice')) {
        priceToInput.value = initialUrlParams.get('maxPrice');
    }
    if (filterNewCheckbox && initialUrlParams.get('new') === 'true') {
        filterNewCheckbox.checked = true;
    }
    if (sortBySelect && initialUrlParams.has('sortBy')) {
        const sortByParam = initialUrlParams.get('sortBy');
        const orderParam = initialUrlParams.get('order') || 'asc';
        sortBySelect.value = `${sortByParam}-${orderParam}`;
    }


    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            const headerSearchBar = document.querySelector('header .search-bar');
            if (headerSearchBar) currentSearchTerm = headerSearchBar.value.trim();
            loadAndDisplayProducts();
        });
    }
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            if (categoryFilterList) categoryFilterList.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            if (priceFromInput) priceFromInput.value = '';
            if (priceToInput) priceToInput.value = '';
            if (filterNewCheckbox) filterNewCheckbox.checked = false;
            if (sortBySelect) sortBySelect.value = 'default';
            currentSearchTerm = '';
            const headerSearchBar = document.querySelector('header .search-bar');
            if (headerSearchBar) headerSearchBar.value = '';
            history.pushState(null, '', window.location.pathname); 
            loadAndDisplayProducts();
        });
    }
    if (sortBySelect) {
        sortBySelect.addEventListener('change', () => {
            const headerSearchBar = document.querySelector('header .search-bar');
            if (headerSearchBar) currentSearchTerm = headerSearchBar.value.trim();
            loadAndDisplayProducts();
        });
    }
    
    await loadAndDisplayProducts(); 
    console.log("catalogPage.js: Ініціалізація сторінки каталогу завершена.");
}