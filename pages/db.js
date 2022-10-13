import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.APIKEY,
    authDomain: "timer-21029.firebaseapp.com",
    projectId: "timer-21029",
    storageBucket: "timer-21029.appspot.com",
    messagingSenderId: "91143769559",
    appId: "1:91143769559:web:85789126e843b862ea8f92",
    measurementId: process.env.MID
};
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);