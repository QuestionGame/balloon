// /js/header.js
import { fetchData } from './api.js'; // Переконайтеся, що шлях до api.js правильний
import { updateGlobalCartCount } from './cart.js'; // Переконайтеся, що шлях до cart.js правильний

// Функція для обмеження частоти виконання (debounce)
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

export async function initializeHeaderScripts() {
    // --- БУРГЕР-МЕНЮ ---
    const burgerMenu = document.querySelector('.burger-menu');
    const nav = document.querySelector('header nav');
    if (burgerMenu && nav) {
        burgerMenu.addEventListener('click', () => {
            nav.classList.toggle('active');
            // Можна додати логіку для закриття випадаючих списків, якщо меню закривається
            if (!nav.classList.contains('active')) {
                document.querySelectorAll('header nav ul li.dropdown.open').forEach(d => d.classList.remove('open'));
                const searchResultsDropdown = document.getElementById('search-results-dropdown');
                if (searchResultsDropdown) searchResultsDropdown.classList.remove('active');
            }
        });
    }
    // --- КІНЕЦЬ БУРГЕР-МЕНЮ ---

    // --- ВИПАДАЮЧЕ МЕНЮ КАТЕГОРІЙ ---
    const dropdownToggles = document.querySelectorAll('header nav ul li.dropdown > a');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(event) {
            const isMobileView = window.innerWidth <= 992;
            // У мобільному режимі (коли активне бургер-меню) клік на батьківський пункт відкриває/закриває підменю
            if (isMobileView && nav && nav.classList.contains('active')) {
                const parentDropdown = this.parentElement;
                if (parentDropdown.classList.contains('dropdown')) {
                    // Якщо це посилання-заглушка (#), запобігаємо переходу
                    if (this.getAttribute('href') === '#') { 
                        event.preventDefault();
                    }
                    parentDropdown.classList.toggle('open'); // Перемикаємо клас .open для li.dropdown
                }
            }
            // Для десктопної версії :hover в CSS вже обробляє показ/приховування,
            // але якщо ви хочете логіку кліку і для десктопа, її потрібно додати сюди.
        });
    });
    
    const catalogDropdownMenu = document.getElementById('catalog-dropdown-menu');
    if (catalogDropdownMenu) {
        console.log("header.js: Завантаження категорій для випадаючого меню...");
        const apiResponse = await fetchData('/api/categories'); // Завантажуємо всі категорії
        console.log("header.js: Відповідь від /api/categories для меню:", JSON.stringify(apiResponse, null, 2));
        if (apiResponse && apiResponse.success && Array.isArray(apiResponse.data)) {
            catalogDropdownMenu.innerHTML = ''; 
            if (apiResponse.data.length > 0) {
                apiResponse.data.forEach(cat => {
                    // Перевіряємо, чи є slug, і чи він є валідним рядком
                    if (cat.slug && typeof cat.slug === 'string' && cat.slug.trim() !== '') {
                        const li = document.createElement('li');
                        li.innerHTML = `<a href="catalog.html?category=${cat.slug}">${cat.name}</a>`;
                        catalogDropdownMenu.appendChild(li);
                    } else {
                        console.warn(`header.js: Категорія "${cat.name || 'Без імені'}" без валідного slug для меню. Slug:`, cat.slug);
                    }
                });
            } else {
                catalogDropdownMenu.innerHTML = '<li><a href="catalog.html">Всі товари</a></li>'; // Fallback, якщо категорій немає
            }
        } else {
            catalogDropdownMenu.innerHTML = '<li><a href="catalog.html">Всі товари</a></li>'; // Fallback при помилці
            console.warn("header.js: Не вдалося завантажити категорії для меню хедера:", apiResponse?.message);
        }
    }
    // --- КІНЕЦЬ ВИПАДАЮЧОГО МЕНЮ КАТЕГОРІЙ ---

    // --- ПОШУКОВИЙ РЯДОК З "ЖИВИМ" ПОШУКОМ ---
    const searchBar = document.getElementById('header-search-bar');
    const searchResultsDropdown = document.getElementById('search-results-dropdown');

    if (searchBar && searchResultsDropdown) {
        const handleLiveSearch = async () => {
            const searchTerm = searchBar.value.trim();

            if (searchTerm.length < 2) { // Починаємо пошук після введення щонайменше 2 символів
                searchResultsDropdown.innerHTML = '';
                searchResultsDropdown.classList.remove('active');
                return;
            }

            console.log(`header.js: "Живий" пошук для: "${searchTerm}"`);
            const apiUrl = `/api/products?search=${encodeURIComponent(searchTerm)}&limit=5`; // Обмежимо 5 результатами
            const response = await fetchData(apiUrl);

            searchResultsDropdown.innerHTML = ''; // Очистити попередні результати
            if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
                response.data.forEach(product => {
                    const itemLink = document.createElement('a');
                    itemLink.href = `product-details.html?id=${product.id}`;
                    itemLink.className = 'search-result-item';
                    
                    // Додамо зображення та назву
                    const img = document.createElement('img');
                    const imageUrl = product.image && product.image.startsWith('/') ? product.image : `/images/products/${product.image || 'placeholder.png'}`;
                    img.src = imageUrl;
                    img.alt = product.name.substring(0, 30); // Обрізаємо alt для короткості
                    img.style.width = '40px'; 
                    img.style.height = '40px';
                    img.style.objectFit = 'cover';
                    img.style.marginRight = '10px';
                    img.style.borderRadius = '4px';
                    img.onerror = function() { this.src = '/images/placeholder.jpg'; };


                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = product.name;

                    itemLink.appendChild(img);
                    itemLink.appendChild(nameSpan);
                    
                    searchResultsDropdown.appendChild(itemLink);
                });
                searchResultsDropdown.classList.add('active');
            } else {
                searchResultsDropdown.innerHTML = '<div class="search-result-item" style="text-align:center; color:#777;">Нічого не знайдено</div>';
                searchResultsDropdown.classList.add('active'); // Показуємо повідомлення "Нічого не знайдено"
                // Якщо не хочете показувати "Нічого не знайдено", закоментуйте 2 рядки вище і розкоментуйте наступний:
                // searchResultsDropdown.classList.remove('active');
            }
        };

        searchBar.addEventListener('input', debounce(handleLiveSearch, 350)); // Debounce для зменшення кількості запитів

        searchBar.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                const searchTerm = this.value.trim();
                searchResultsDropdown.classList.remove('active');
                searchResultsDropdown.innerHTML = ''; // Очистити список після Enter
                if (searchTerm) {
                    window.location.href = `catalog.html?search=${encodeURIComponent(searchTerm)}`;
                } else {
                    window.location.href = 'catalog.html'; // Якщо порожньо, просто до каталогу
                }
            }
        });

        // Сховати випадаючий список, якщо клікнули поза ним або полем пошуку
        document.addEventListener('click', function(event) {
            if (searchBar && searchResultsDropdown) { // Перевірка, чи елементи існують
                if (!searchBar.contains(event.target) && !searchResultsDropdown.contains(event.target)) {
                    searchResultsDropdown.classList.remove('active');
                }
            }
        });
        
        // Показати список, якщо поле у фокусі і є текст (і результати)
        searchBar.addEventListener('focus', () => {
            if (searchBar.value.trim().length >= 2 && searchResultsDropdown.children.length > 0) {
                 // Перевіряємо, чи є реальні результати, а не просто "Нічого не знайдено"
                 const firstChild = searchResultsDropdown.firstChild;
                 if (firstChild && firstChild.href) { // Якщо перший елемент - посилання (тобто, товар)
                    searchResultsDropdown.classList.add('active');
                 }
            }
        });
         // Сховати при втраті фокусу, якщо не клікнули на елемент списку
        searchBar.addEventListener('blur', () => {
            // Невеликий таймаут, щоб дати можливість спрацювати кліку на елементі списку
            setTimeout(() => {
                if (!searchResultsDropdown.contains(document.activeElement)) {
                    searchResultsDropdown.classList.remove('active');
                }
            }, 100);
        });

    }
    // --- КІНЕЦЬ ПОШУКОВОГО РЯДКА ---

    updateGlobalCartCount(); // Початкове оновлення лічильника кошика
}