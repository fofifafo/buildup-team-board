import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCYS8Pzo2krWf9E7n9ueRUxPSbxL3YgnDU",
  authDomain: "meta-g-star.firebaseapp.com",
  projectId: "meta-g-star",
  storageBucket: "meta-g-star.firebasestorage.app",
  messagingSenderId: "679289781039",
  appId: "1:679289781039:web:6d99ef2746863defb0ffda",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);