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

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}

// On DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  await populateSpotDropdown();
  setupRatingListener();

  document.getElementById("inputImage").addEventListener("change", (event) => {
    const file = event.target.files[0];
    document.getElementById("mypic-goes-here").src = file
      ? URL.createObjectURL(file)
      : "";
  });

  const submitBtn = document.getElementById("submitBtn");
  if (!submitBtn) {
    console.error("submitBtn not found — check newPost.html");
    return;
  }
  submitBtn.addEventListener("click", handleSubmit);
});

// Populate dropdown
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

function getDistance(lat1, lng1, lat2, lng2) {
  return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
}

// Rating
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

async function handleSubmit() {
  hideFeedback();

  const spotId = document.getElementById("spotSelect").value;
  const caption = document.getElementById("post-title").value.trim();
  const details = document.getElementById("detailsInput").value.trim();
  const imageFile = document.getElementById("inputImage").files[0];
  const user = auth.currentUser;

  let imageBase64 = "";

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
      imageBase64 = await toBase64(imageFile); // full data URI: "data:image/png;base64,..."
    }

    await addDoc(collection(db, "eventspots", spotId, "updates"), {
      caption: caption,
      details: details || "",
      status: selectedRating,
      image: imageBase64, // stored as full data URI, used directly in src=""
      timestamp: serverTimestamp(),
      owner: user.uid,
    });

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

// Reset form
function resetForm() {
  document.getElementById("spotSelect").value = closestSpotId ?? "";
  document.getElementById("detailsInput").value = "";
  document.getElementById("inputImage").value = "";
  document.getElementById("mypic-goes-here").src = "";

  document.querySelectorAll('input[name="crowdStatus"]').forEach((r) => {
    r.checked = false;
  });

  document.querySelectorAll(".rating-label").forEach((l) => {
    l.classList.remove("active");
  });

  selectedRating = 0;
}

// ── Feedback helpers (were missing — caused "hideFeedback is not defined" error) ──
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
