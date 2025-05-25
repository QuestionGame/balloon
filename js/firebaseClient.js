// /js/firebaseClient.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"; 



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
let auth; // <-- ДОДАНО
// let firestoreDB_Client;

try {
    firebaseAppClient = initializeApp(firebaseConfig);
    analytics = getAnalytics(firebaseAppClient);
    auth = getAuth(firebaseAppClient); // <-- ДОДАНО: Ініціалізація Auth
    // firestoreDB_Client = getFirestore(firebaseAppClient);
    console.log("Firebase Client SDK ініціалізовано успішно (App, Analytics, Auth).");
} catch (e) {
    console.error("Помилка ініціалізації Firebase Client SDK:", e);
    alert("Помилка конфігурації сервісів. Будь ласка, перевірте консоль для деталей.");
}

export { firebaseAppClient, analytics, auth }; // <-- ДОДАНО 'auth' до експорту
// export { firestoreDB_Client };