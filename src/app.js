import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import "/styles/style.css";

import { db } from "./firebaseConfig.js";
import { collection, getDocs } from "firebase/firestore";
import { onAuthReady } from "./authentication.js";

/* Displays the logged-in user's name, or "Guest" if not signed in */
function showName() {
  const nameElement = document.getElementById("name-goes-here");

  onAuthReady((user) => {
    if (!nameElement) return;

    if (!user) {
      nameElement.textContent = "Guest";
      return;
    }

    const name = user.displayName || user.email;
    nameElement.textContent = `${name}!`;
  });
}

/* Fetches posts from Firestore and renders them into the social feed */
async function displayCardsDynamically() {
  const cardTemplate = document.getElementById("postCardTemplate");
  const cardContainer = document.getElementById("allPosts-goes-here");

  if (!cardTemplate || !cardContainer) return;

  try {
    const querySnapshot = await getDocs(collection(db, "posts"));

    querySnapshot.forEach((doc) => {
      const post = doc.data();
      const newCard = cardTemplate.content.cloneNode(true);

      // Title and description
      newCard.querySelector(".card-title").textContent =
        post.caption || "New Post";
      newCard.querySelector(".card-text").textContent =
        post.description || "No description provided.";

      // Location
      if (post.location) {
        const lat = post.location.lat.toFixed(2);
        const lng = post.location.lng.toFixed(2);
        newCard.querySelector(".card-location").textContent = `${lat}, ${lng}`;
      }

      // Image
      const imgPath =
        post.image && post.image !== ""
          ? post.image
          : "./images/default_post.jpg";
      newCard.querySelector(".card-image").src = imgPath;

      // Link to individual post page
      newCard.querySelector(".read-more").href =
        `socialfeed.html?docID=${doc.id}`;

      cardContainer.appendChild(newCard);
    });
  } catch (error) {
    console.error("Error loading social feed:", error);
  }
}

showName();
displayCardsDynamically();
