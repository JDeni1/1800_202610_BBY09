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

  msg.innerHTML = `<div class="alert alert-info">Logging in...</div>`;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    msg.innerHTML = `<div class="alert alert-success">
    Logged in as ${userCredential.user.email}
    </div>`;

    window.location.href = "/index.html";
  } catch (err) {
    msg.innerHTML = `<div class="alert alert-danger">
    ${err.code}
    </div>`;
  }
});

// SIGN UP
document.getElementById("signupBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  msg.innerHTML = `<div class="alert alert-info">Creating account...</div>`;

  try {
    await createUserWithEmailAndPassword(auth, email, password);

    msg.innerHTML = `<div class="alert alert-success">
    Account created! You can now log in.
    </div>`;
  } catch (error) {
    msg.innerHTML = `<div class="alert alert-danger">
    ${error.message}
    </div>`;
  }
});
