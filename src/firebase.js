import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
export const auth = getAuth(app);

// 아이디를 이메일 형식으로 변환 (Firebase Auth는 이메일 기반이라 내부적으로만 사용)
export const idToEmail = (userId) => `${userId}@buildup-board.local`;
