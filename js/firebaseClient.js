// /js/firebaseClient.js

// ЗАМІНІТЬ X.Y.Z на актуальну версію Firebase SDK.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBrT3MIF1FcNjAF1WGZFCVyrb5DFrhDkg8",
  authDomain: "coop-baloon.firebaseapp.com",
  projectId: "coop-baloon",
  storageBucket: "coop-baloon.firebasestorage.app",
  messagingSenderId: "915021824541",
  appId: "1:915021824541:web:acbda93363183191cf7cf4",
  measurementId: "G-P09GTWNYNE"
};


let firebaseAppClient;
let analytics;

try {
    firebaseAppClient = initializeApp(firebaseConfig);
    analytics = getAnalytics(firebaseAppClient);
    console.log("Firebase Client SDK ініціалізовано успішно.");
} catch (e) {
    console.error("ПОМИЛКА ініціалізації Firebase Client SDK:", e);
    // Якщо у вас визначена функція showToast глобально або імпортована сюди, можна її викликати
    // import { showToast } from './uiElements.js'; // Потрібно було б, якби showToast використовувалася тут
    // showToast("Помилка конфігурації сервісів. Деякі функції можуть бути недоступні.", 10000);
    alert("Помилка конфігурації сервісів. Будь ласка, перевірте консоль для деталей.");
}

// Експортуємо, якщо ці екземпляри потрібні в інших частинах програми
export { firebaseAppClient, analytics };