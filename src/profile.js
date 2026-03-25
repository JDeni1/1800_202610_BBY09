import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import "/styles/style.css";

import { db } from "./firebaseConfig.js";
import { auth } from "./firebaseConfig.js";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// uploadImage()
// Listens for file input changes and triggers Base64 encoding
function uploadImage() {
  const inputImage = document.getElementById("inputImage");
  if (!inputImage) return;

  inputImage.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const base64String = e.target.result.split(",")[1];
      saveProfileImage(base64String);
    };

    reader.readAsDataURL(file);
  });
}

// saveProfileImage(base64String)
async function saveProfileImage(base64String) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.error("No user is signed in.");
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { profileImage: base64String }, { merge: true });
      console.log("Profile image saved successfully!");
      displayProfileImage(base64String);
    } catch (error) {
      console.error("Error saving profile image:", error);
    }
  });
}

// displayProfileImage(base64String)
function displayProfileImage(base64String) {
  const imgElement = document.getElementById("profileImage");
  if (!imgElement) {
    console.error("No image element found.");
    return;
  }
  imgElement.src = `data:image/png;base64,${base64String}`;
}

// populateUserInfo()
function populateUserInfo() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.log("No user is signed in.");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.log("No user document found.");
        return;
      }

      const {
        name = "",
        school = "",
        city = "",
        profileImage = "",
      } = userSnap.data();

      document.getElementById("nameInput").value = name;
      document.getElementById("schoolInput").value = school;
      document.getElementById("cityInput").value = city;
      document.getElementById("profileImage").src =
        `data:image/png;base64,${profileImage}`;
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  });
}

uploadImage();
populateUserInfo();
