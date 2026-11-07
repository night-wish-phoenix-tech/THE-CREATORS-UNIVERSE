import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const link = document.getElementById("auth-link");
if (link) {
  onAuthStateChanged(auth, user => {
    link.textContent = user ? "👤 My Passport" : "Sign in";
    link.href = user ? "passport.html" : "login.html";
  });
}
