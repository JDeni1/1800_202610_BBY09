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

//--------------------------------------------------------------
// Example function to read a CSV file and import data into Firestore.
// This is just a demonstration of how you might seed your Firestore database
// with data from a CSV file. You can adapt this to your specific needs.
//
// It uses fetch() to read the CSV file from the public directory
// run with live-server or similar setup that can serve files from the public folder.
// This function is called ONLY one time from the browser console to seed the database,
// then you can comment it out or remove it.
//--------------------------------------------------------------
async function getCSVdata() {
  // Fetch the CSV file from the public directory
  const response = await fetch("./monitor_points.csv");
  // Read the response as text
  const text = await response.text();

  // Split the CSV text into rows and skip the header row
  const rows = text.split("\n").slice(1);

  for (const row of rows) {
    //skip empty rows
    if (!row.trim()) continue;

    //split the row into columns (assuming comma-separated values)
    const columns = row.split(",");

    // Extract the relevant data from the columns (adjust indices as needed)
    const id = columns[0];
    const name = columns[1];
    const category = columns[2];
    const lat = parseFloat(columns[3]);
    const lng = parseFloat(columns[4]);

    // Create a Firestore document for each monitor point using the extracted data
    await setDoc(doc(db, "monitor_points", id), {
      name,
      category,
      location: new GeoPoint(lat, lng), //convert to GeoPoint for geospatial queries
      lat,
      lng,
    });
    console.log("Imported:", name);
  }
  console.log("Seeding complete");
}

// Expose the function to the global scope so it can be called from the browser console
window.getCSVdata = getCSVdata;
