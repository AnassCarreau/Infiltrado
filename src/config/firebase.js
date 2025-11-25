import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBO7e2pt49FpB455TL21L1Ii0atq2ncVj0",
  authDomain: "elinfiltrado-9e786.firebaseapp.com",
  projectId: "elinfiltrado-9e786",
  storageBucket: "elinfiltrado-9e786.firebasestorage.app",
  messagingSenderId: "892938536894",
  appId: "1:892938536894:web:5df35d6155622288e55bef",
  measurementId: "G-9804PQRD1N"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const APP_ID = 'default-app-id'; // O tu ID dinámico si lo usas