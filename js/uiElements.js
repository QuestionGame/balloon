// /js/uiElements.js

export async function loadHTMLComponent(url, placeholderId, callback) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP помилка! статус: ${response.status} для ${url}`);
        const text = await response.text();
        const placeholder = document.getElementById(placeholderId);
        if (placeholder) {
            placeholder.innerHTML = text;
            if (callback && typeof callback === 'function') callback();
        } else {
            console.warn(`Плейсхолдер з ID '${placeholderId}' не знайдено.`);
        }
    } catch (error) {
        console.error(`Помилка завантаження HTML компонента ${url}:`, error);
        const placeholder = document.getElementById(placeholderId);
        if (placeholder) placeholder.innerHTML = `<p style="color:red; text-align:center;">Помилка завантаження ${url}.</p>`;
    }
}

export function showToast(message, duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.error("Toast container #toast-container не знайдено! Неможливо показати сповіщення.");
        return;
    }
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, duration);
}

export function initializeScrollToTop() {
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (!scrollToTopBtn) return;

    window.addEventListener('scroll', () => {
        scrollToTopBtn.style.display = (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) ? "block" : "none";
    });
    scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}