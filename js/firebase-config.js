import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCxjWqPGnEnpySzBp1hqScGLttOMB6zVww",
  authDomain: "the-creator-s-universe.firebaseapp.com",
  projectId: "the-creator-s-universe",
  storageBucket: "the-creator-s-universe.firebasestorage.app",
  messagingSenderId: "181197336251",
  appId: "1:181197336251:web:61a5cc640853e7390d839e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
