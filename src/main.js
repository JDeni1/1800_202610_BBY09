import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import "/styles/style.css";

import { auth } from "./firebaseConfig.js";
import { onAuthStateChanged, signOut } from "firebase/auth";

/* Bootstrap form validation */
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

/* Displays the logged-in user's name, or "Guest" if not signed in */

function showNameOnHome() {
  const nameElement = document.getElementById("name-goes-here");
  if (!nameElement) return;

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      nameElement.textContent = "Guest!";
      return;
    }
    const name = user.displayName || user.email;
    nameElement.textContent = `${name}!`;
  });
}

/*Log out button */
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    await signOut(auth);
    window.location.replace("index.html");
  });
}

showNameOnHome();
