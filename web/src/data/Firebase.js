// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAi2BaJLQnGByU6AVu-2EYKav5O25kThUg",
  authDomain: "health-monitoring-system-19b5d.firebaseapp.com",
  databaseURL: "https://health-monitoring-system-19b5d-default-rtdb.firebaseio.com",
  projectId: "health-monitoring-system-19b5d",
  storageBucket: "health-monitoring-system-19b5d.firebasestorage.app",
  messagingSenderId: "587151424156",
  appId: "1:587151424156:web:fd218774c51d843ca3cb59",
  measurementId: "G-BBVQ7SVEDM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app)

export { db };