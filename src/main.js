import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import "../styles/style.css";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig.js";

/* For Profile Validation */
(() => {
  "use strict";

  const forms = document.querySelectorAll(".needs-validation");

  Array.from(forms).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add("was-validated");
      },
      false,
    );
  });
})();

function showNameOnHome() {
  const nameElement = document.getElementById("name-goes-here");
  if (!nameElement) return;

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    const name = user.displayName || user.email;
    nameElement.textContent = `${name}!`;
  });
}

showNameOnHome();

showNameOnHome();

import { signOut } from "firebase/auth";

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    await signOut(auth);
    window.location.replace("login.html");
  });
}