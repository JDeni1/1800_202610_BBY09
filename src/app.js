import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import "./styles/style.css";
import { db } from "./firebaseConfig.js";
import { collection, getDocs } from "firebase/firestore";
import { onAuthReady } from "./authentication.js";

function showName() {
  const nameElement = document.getElementById("name-goes-here");

  // Call back function to check if firebase has a user and return null if not logged on.
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

/* Function that fetches post from firestore database and builds HTML cards based on the data. */
async function displayCardsDynamically() {
  // Grabs the template and container ID to fill.
  const cardTemplate = document.getElementById("postCardTemplate");
  const cardContainer = document.getElementById("allPosts-goes-here");

  if (!cardTemplate || !cardContainer) return;

  try {
    // Points to the location (collection of data.)
    const querySnapshot = await getDocs(collection(db, "posts"));

    querySnapshot.forEach((doc) => {
      const post = doc.data();
      //clones each card with the document data
      const newCard = cardTemplate.content.cloneNode(true);

      newCard.querySelector(".card-title").textContent =
        post.caption || "New Post";
      newCard.querySelector(".card-text").textContent =
        post.description || "No description provided.";

      // Only run if posts has an actual location.
      if (post.location) {
        const lat = post.location.lat.toFixed(2);
        const lng = post.location.lng.toFixed(2);
        newCard.querySelector(".card-location").textContent = `${lat}, ${lng}`;
      }

      // Uses the image if the image exists as a string.
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

/* Gets the CSV data through data seeding.  */
async function getCSVdata() {
  const response = await fetch("./monitor_points.csv");
  const text = await response.text();

  const rows = text.split("\n").slice(1);

  for (const row of rows) {
    if (!row.trim()) continue;

    const columns = row.split(",");
    const id = columns[0];
    const name = columns[1];
    const category = columns[2];
    const lat = parseFloat(columns[3]);
    const lng = parseFloat(columns[4]);

    console.log("Imported:", name);
  }
  console.log("Seeding complete");
}

/* Can be typed in the control to get the CSV data. */
window.getCSVdata = getCSVdata;
