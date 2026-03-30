import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import "/styles/style.css";

import { db, auth } from "./firebaseConfig.js";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function displayProfileImage(imageDataUrl) {
  const imgElement = document.getElementById("profileImage");
  if (!imgElement || !imageDataUrl) return;
  imgElement.src = imageDataUrl;
}

async function saveProfileImage(userId, imageDataUrl) {
  try {
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, { profileImage: imageDataUrl }, { merge: true });
    displayProfileImage(imageDataUrl);
  } catch (error) {
    console.error("Error saving profile image:", error);
  }
}

function uploadImage(userId) {
  const inputImage = document.getElementById("inputImage");
  if (!inputImage) return;

  inputImage.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
      const imageDataUrl = e.target.result;
      await saveProfileImage(userId, imageDataUrl);
    };

    reader.readAsDataURL(file);
  });
}

async function populateUserInfo(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const profileImage = userData.profileImage || "";

    if (profileImage) {
      displayProfileImage(profileImage);
    }
  } catch (error) {
    console.error("Error loading user profile:", error);
  }
}

function initProfilePage() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    await populateUserInfo(user.uid);
    uploadImage(user.uid);
  });
}

initProfilePage();