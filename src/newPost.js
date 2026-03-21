import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import "/styles/style.css";

import { db, auth } from "./firebaseConfig.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

/*Uploads images - though only stores within local storage */
function uploadImage() {
  const inputImage = document.getElementById("inputImage");
  if (!inputImage) return;

  inputImage.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const base64String = e.target.result.split(",")[1];
      document.getElementById("mypic-goes-here").src = e.target.result;
      localStorage.setItem("inputImage", base64String);
      console.log("Image saved to localStorage as Base64 string.");
    };

    reader.readAsDataURL(file);
  });
}

/*Saves posts in fire store */
async function savePost() {
  alert("SAVE POST is triggered");

  const user = auth.currentUser;
  if (!user) {
    console.log("Error, no user signed in");
    return;
  }

  const desc = document.getElementById("description").value;
  const title = document.getElementById("post-title").value;
  const inputImage = localStorage.getItem("inputImage") || "";

  const position = await getCurrentPositionSafe();
  const latitude = position?.coords?.latitude || null;
  const longitude = position?.coords?.longitude || null;

  try {
    const docRef = await addDoc(collection(db, "posts"), {
      owner: user.uid,
      caption: title,
      description: desc,
      image: inputImage,
      last_updated: serverTimestamp(),
      location: { lat: latitude, lng: longitude },
    });

    console.log("Post document added:", docRef.id);
    savePostIDforUser(docRef.id);
  } catch (error) {
    console.error("Error adding post:", error);
  }
}

/* Returns a Promise resolving to geolocation position or null */
function getCurrentPositionSafe() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { enableHighAccuracy: true },
    );
  });
}

/* Adds new post ID within Firebase */
async function savePostIDforUser(postDocID) {
  const user = auth.currentUser;
  if (!user) {
    console.error("No user signed in.");
    return;
  }

  try {
    await updateDoc(doc(db, "users", user.uid), {
      myposts: arrayUnion(postDocID),
    });

    console.log("Saved to user's document!");
    alert("Post is complete!");
  } catch (error) {
    console.error("Error writing document:", error);
  }
}

// Add event listener to stars after DOM content is loaded
// Add event listener to submit button after DOM content is loaded (It’s like the browser’s built-in bell that rings automatically.)
document.addEventListener("DOMContentLoaded", () => {
  manageRating();

  // 👇👇👇 Add these two lines
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.addEventListener("click", writeReview);
});

let Rating = 0;
function manageRating() {
  // ⭐ Make star icons clickable and calculate rating
  const stars = document.querySelectorAll(".star");

  // Step 1️⃣ – Add click behavior for each star
  stars.forEach((Rating, index) => {
    star.addEventListener("click", () => {
      // Fill all stars up to the one clicked
      stars.forEach((r, i) => {
        r.textContent = i <= index ? "star" : "star_outline";
      });
      // Save rating value
      Rating = index + 1;
      console.log("Current rating:", Rating);
    });
  });
}

/*Uploads content */
uploadImage();

document.addEventListener("DOMContentLoaded", () => {
  const postButton = document.getElementById("postButton");
  if (postButton) postButton.addEventListener("click", savePost);
});

async function submitReport(spotId, status, imageUrl, userId, details) {
  // 1. Add to the subcollection
  await addDoc(collection(db, "eventspots", spotId, "updates"), {
    details: details,
    status: status, // 1-5
    image_url: imageUrl, // upload image to Storage first, store URL here
    timestamp: serverTimestamp(),
    owner: userId,
  });

  // 2. Update the parent eventspot's latest_status
  await updateDoc(doc(db, "eventspots", spotId), {
    latest_status: status,
    last_updated: serverTimestamp(),
  });
}
