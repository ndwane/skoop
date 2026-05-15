import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA_2RRqUVAQmBuXZzLw-yZXkJJk29Z6p0w",
  authDomain: "skoop-c0bc3.firebaseapp.com",
  projectId: "skoop-c0bc3",
  storageBucket: "skoop-c0bc3.firebasestorage.app",
  messagingSenderId: "672721547327",
  appId: "1:672721547327:web:592cd903ce61b28fa1888a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { collection, addDoc, getDocs, deleteDoc, doc };