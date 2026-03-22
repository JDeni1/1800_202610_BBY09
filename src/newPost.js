import { db } from "./firebaseConfig.js";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

const auth = getAuth();
const storage = getStorage();
let selectedRating = 0;
let closestSpotId = null;

// On DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  await populateSpotDropdown();
  setupRatingListener();

  const submitBtn = document.getElementById("submitBtn");
  if (!submitBtn) {
    console.error(
      "submitBtn not found — check newPost.html has id='submitBtn'",
    );
    return;
  }
  submitBtn.addEventListener("click", handleSubmit);
});

// Populate the spot dropdown from Firestore.
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

  // Pre-select closest spot using geolocation
  if ("geolocation" in navigator) {
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
      (err) => console.warn("Geolocation unavailable for pre-selection:", err),
    );
  }
}

// ------------------------------------------------------------
// Euclidean distance — good enough for nearby Vancouver spots
// ------------------------------------------------------------
function getDistance(lat1, lng1, lat2, lng2) {
  return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
}

//Radio buttons
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

//Images
async function uploadImage(file, spotId) {
  const storageRef = ref(
    storage,
    `updates/${spotId}/${Date.now()}_${file.name}`,
  );
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

async function handleSubmit() {
  hideFeedback();

  const spotId = document.getElementById("spotSelect").value;
  const caption = document.getElementById("post-title").value.trim();
  const details = document.getElementById("detailsInput").value.trim();
  const imageFile = document.getElementById("imageInput").files[0];
  const user = auth.currentUser;

  // Validation
  if (!spotId) {
    showError("Please select a location.");
    return;
  }
  if (selectedRating === 0) {
    showError("Please select a crowd status (1–5).");
    return;
  }
  if (!user) {
    showError("You must be logged in to submit a report.");
    return;
  }

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting…";

  try {
    // Upload image if provided
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile, spotId);
    }

    // Write new update to subcollection
    await addDoc(collection(db, "eventspots", spotId, "updates"), {
      caption: caption,
      details: details || "",
      status: selectedRating,
      image_url: imageUrl,
      timestamp: serverTimestamp(),
      owner: user.uid,
    });

    // 3Update latest_status on the parent eventspot
    await updateDoc(doc(db, "eventspots", spotId), {
      latest_status: selectedRating,
      last_updated: serverTimestamp(),
    });

    showSuccess("Report submitted! Thanks for helping the community.");
    resetForm();
  } catch (err) {
    console.error("Submit failed:", err);
    showError("Something went wrong. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Report";
  }
}

// Reset form after successful submit
function resetForm() {
  document.getElementById("spotSelect").value = closestSpotId ?? "";
  document.getElementById("detailsInput").value = "";
  document.getElementById("imageInput").value = "";
  document.querySelectorAll('input[name="crowdStatus"]').forEach((r) => {
    r.checked = false;
  });
  document.querySelectorAll(".rating-label").forEach((l) => {
    l.classList.remove("active");
  });
  selectedRating = 0;
}

// ------------------------------------------------------------
// Feedback helpers
// ------------------------------------------------------------
function showError(msg) {
  const el = document.getElementById("formFeedback");
  el.className = "alert alert-danger mt-3";
  el.textContent = msg;
  el.style.display = "block";
}

function showSuccess(msg) {
  const el = document.getElementById("formFeedback");
  el.className = "alert alert-success mt-3";
  el.textContent = msg;
  el.style.display = "block";
}

function hideFeedback() {
  const el = document.getElementById("formFeedback");
  el.style.display = "none";
}
