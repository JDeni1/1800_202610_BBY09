console.log("login.js LOADED");

import { auth } from "./firebaseConfig.js";
import { signInWithEmailAndPassword } from "firebase/auth";
import { createUserWithEmailAndPassword } from "firebase/auth";

const form = document.getElementById("loginForm");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

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

// SIGN UP
document.getElementById("signupBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  msg.textContent = "Creating account...";

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    msg.textContent = "✅ User created! You can now log in.";
  } catch (error) {
    msg.textContent = `❌ ${error.message}`;
  }
});
