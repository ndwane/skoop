import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc, getDoc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import {
  initializeAuth,
  getReactNativePersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyA_2RRqUVAQmBuXZzLw-yZXkJJk29Z6p0w",
  authDomain: "skoop-c0bc3.firebaseapp.com",
  projectId: "skoop-c0bc3",
  storageBucket: "skoop-c0bc3.firebasestorage.app",
  messagingSenderId: "672721547327",
  appId: "1:672721547327:web:592cd903ce61b28fa1888a"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);

export {
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
};
