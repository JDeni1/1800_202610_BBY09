console.log("login.js LOADED");

import { auth } from "./firebaseConfig.js";
import { signInWithEmailAndPassword } from "firebase/auth";

const form = document.getElementById("loginForm");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault(); // ✅ sayfanın refresh olmasını engeller

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  msg.textContent = "Logging in...";

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    msg.textContent = `✅ Logged in as: ${userCredential.user.email}`;
    window.location.href = "/index.html";
  } catch (err) {
    msg.textContent = `❌ ${err.code}`;
  }
});
