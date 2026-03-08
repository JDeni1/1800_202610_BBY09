import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import { db } from "./firebaseConfig.js";
import { doc, onSnapshot } from "firebase/firestore";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthReady } from "./authentication.js";
import "/styles/style.css";

function sayHello() {
  // TODO: implement your logic here
}
document.addEventListener("DOMContentLoaded", sayHello);
//--------------------------------------------------------------
// Custom global JS code (shared with all pages)can go here.
//--------------------------------------------------------------
function showName() {
  const nameElement = document.getElementById("name-goes-here");

  onAuthReady((user) => {
    if (!user) {
      if (window.location.pathname.endsWith("main.html")) {
        location.href = "index.html";
      }
      return;
    }

    const name = user.displayName || user.email;
    if (nameElement) nameElement.textContent = `${name}!`;
  });
}
