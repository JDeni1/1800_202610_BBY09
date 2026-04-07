import { db } from "./firebaseConfig.js";
import { getAuth } from "firebase/auth";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

const auth = getAuth();

let selectedRating = 0;
let closestSpotId = null;

/* Turns images into base64 String Files */
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}

/* Initializes the input from the New Post Form */
document.addEventListener("DOMContentLoaded", async () => {
  await populateSpotDropdown();
  setupRatingListener();

  // Image prievew of user file.
  document.getElementById("inputImage").addEventListener("change", (event) => {
    const file = event.target.files[0];
    document.getElementById("picture").src = file
      ? URL.createObjectURL(file)
      : "";
  });

  // Find the submit button.
  const submitBtn = document.getElementById("submitBtn");
  if (!submitBtn) {
    console.error("submitBtn not found — check newPost.html");
    return;
  }
  submitBtn.addEventListener("click", handleSubmit);
});

/* Populates the events spots based on the Firestore database. */
async function populateSpotDropdown() {
  let snapshot;
  try {
    snapshot = await getDocs(collection(db, "eventspots"));
  } catch (err) {
    console.error("Could not load event spots:", err);
    return;
  }

  const select = document.getElementById("spotSelect");
  snapshot.docs.forEach((d) => {
    const option = document.createElement("option");
    option.value = d.id;
    option.textContent = d.data().name;
    select.appendChild(option);
  });

  if ("geolocation" in navigator) {
    /* Calculates the nearest event spot based on user position.   */
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: userLat, longitude: userLng } = pos.coords;
        let closestId = null;
        let minDist = Infinity;

        snapshot.docs.forEach((d) => {
          const { location } = d.data();
          const dist = getDistance(
            userLat,
            userLng,
            location.lat,
            location.lng,
          );
          if (dist < minDist) {
            minDist = dist;
            closestId = d.id;
          }
        });

        if (closestId) {
          closestSpotId = closestId;
          select.value = closestId;
        }
      },
      (err) => console.warn("Geolocation unavailable:", err),
    );
  }
}

/* Euclidean Distance to help calculate the nearest distance near the user. */
function getDistance(lat1, lng1, lat2, lng2) {
  return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
}

/* Sets up the rating function for each button and updates the UI accordingly. */
function setupRatingListener() {
  document.querySelectorAll('input[name="crowdStatus"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      selectedRating = parseInt(radio.value);
      updateRatingUI(selectedRating);
    });
  });
}

function updateRatingUI(rating) {
  document.querySelectorAll(".rating-label").forEach((label, i) => {
    label.classList.toggle("active", i + 1 === rating);
  });
}

/* A Guard Function for all the potential bugs and errors a user may face when filling the form. */
async function handleSubmit() {
  hideFeedback();

  const spotId = document.getElementById("spotSelect").value;
  const caption = document.getElementById("post-title").value.trim();
  const details = document.getElementById("detailsInput").value.trim();
  const imageFile = document.getElementById("inputImage").files[0];
  const user = auth.currentUser;

  let imageBase64 = "";

  // Early returns if the requirements are not met.
  if (!spotId) {
    showError("Please select a location.");
    return;
  }
  if (selectedRating === 0) {
    showError("Please select a crowd status (1–5).");
    return;
  }
  if (!user) {
    showError("You must be logged in.");
    return;
  }

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting…";

  try {
    if (imageFile) {
      imageBase64 = await toBase64(imageFile);
    }

    /* Creates the update Sub-collection to store all post information. */
    await addDoc(collection(db, "eventspots", spotId, "updates"), {
      caption: caption,
      details: details || "",
      status: selectedRating,
      image: imageBase64,
      timestamp: serverTimestamp(),
      owner: user.uid,
    });

    /* Creates the eventspots collection to store all relevent locations. */
    await updateDoc(doc(db, "eventspots", spotId), {
      latest_status: selectedRating,
      last_updated: serverTimestamp(),
    });

    showSuccess("Report submitted!");
    resetForm();
    window.location.href = "socialfeed.html";
  } catch (err) {
    console.error("Submit failed:", err);
    showError("Something went wrong.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Post Now";
  }
}

/* After each submission, the form is reset. */
function resetForm() {
  //Re-evaluate nearest location.
  document.getElementById("spotSelect").value = closestSpotId ?? "";

  document.getElementById("detailsInput").value = "";
  document.getElementById("inputImage").value = "";
  document.getElementById("picture").src = "";

  document.querySelectorAll('input[name="crowdStatus"]').forEach((r) => {
    r.checked = false;
  });

  document.querySelectorAll(".rating-label").forEach((l) => {
    l.classList.remove("active");
  });

  selectedRating = 0;
}
document.getElementById("inputImage").addEventListener("change", function (e) {
  const file = e.target.files[0];
  const img = document.getElementById("picture");
  if (file) {
    img.src = URL.createObjectURL(file);
    img.style.display = "block";
  } else {
    img.src = "";
    img.style.display = "none";
  }
});

// Helper functions.
function showError(msg) {
  const el = document.getElementById("form-feedback");
  if (!el) return;
  el.style.color = "#d50000";
  el.textContent = msg;
}

function showSuccess(msg) {
  const el = document.getElementById("form-feedback");
  if (!el) return;
  el.style.color = "#00c853";
  el.textContent = msg;
}

function hideFeedback() {
  const el = document.getElementById("form-feedback");
  if (el) el.textContent = "";
}
