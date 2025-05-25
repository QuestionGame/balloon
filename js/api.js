// /js/api.js
import { showToast } from './uiElements.js'; // Імпортуємо showToast

export async function fetchData(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText, error: 'Не вдалося розпарсити тіло помилки' }));
            console.error(`HTTP помилка! Статус: ${response.status} для ${url}`, errorData);
            throw new Error(`Помилка ${response.status}: ${errorData.message || errorData.error || 'Не вдалося завантажити дані'}`);
        }
        const jsonData = await response.json();
        if (jsonData.success === false && jsonData.message) {
            console.warn(`API для ${url} повернуло неуспіх:`, jsonData.message, jsonData.error);
        }
        return jsonData;
    } catch (error) {
        console.error(`Помилка при запиті до ${url}:`, error);
        // Переконуємося, що showToast визначена перед викликом
        if (typeof showToast === 'function') {
            showToast(`Помилка завантаження: ${error.message}`, 5000);
        }
        return { success: false, message: error.message, data: null };
    }
}