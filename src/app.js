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
        location.href = "login.html";
      }
      return;
    }

    const name = user.displayName || user.email;
    if (nameElement) nameElement.textContent = `${name}!`;
  });
}

// ---------------------------SOCIAL FEED ------------------------------------

async function displayCardsDynamically() {
  // 1. Reference the container and the template
  let cardTemplate = document.getElementById("postCardTemplate");
  let cardContainer = document.getElementById("allPosts-goes-here");

  // 2. Reference the Firestore collection
  const postsCollectionRef = collection(db, "posts");

  try {
    // 3. Fetch all documents from "posts"
    const querySnapshot = await getDocs(postsCollectionRef);

    querySnapshot.forEach((doc) => {
      const post = doc.data(); // This gets the fields: description, location

      // 4. Clone the template content
      let newcard = cardTemplate.content.cloneNode(true);

      // 5. Populate the text (recognizing "discription" and "Caption"
      newcard.querySelector(".card-title").textContent =
        post.caption || "New Post";
      newcard.querySelector(".card-text").textContent =
        post.description || "No description provided.";

      // 6. Handle the Location (Lat/Lng)
      if (post.location) {
        const lat = post.location.lat.toFixed(2);
        const lng = post.location.lng.toFixed(2);
        newcard.querySelector(".card-location").textContent = `${lat}, ${lng}`;
      }

      // 7. Handle the Image
      // If post.image is empty in Firestore, use a placeholder
      const imgPath =
        post.image && post.image !== ""
          ? post.image
          : "./images/default_post.jpg";
      newcard.querySelector(".card-image").src = imgPath;

      // 8. Set the link to the individual post page using the Doc ID
      newcard.querySelector(".read-more").href =
        `socialfeed.html?docID=${doc.id}`;

      // 9. Append the finished card to the container
      cardContainer.appendChild(newcard);
    });
  } catch (error) {
    console.error("Error loading social feed: ", error);
  }
}

displayCardsDynamically();
