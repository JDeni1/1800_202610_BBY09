import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import "./styles/style.css";

import { db, auth } from "./firebaseConfig.js";
import {
  doc,
  getDoc,
  setDoc,
  collectionGroup,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

/* ---------------- PROFILE DISPLAY ---------------- */

function displayProfileImage(imageDataUrl) {
  const imgElement = document.getElementById("profileImage");
  if (!imgElement || !imageDataUrl) return;
  imgElement.src = imageDataUrl;
}

function displayProfileName(user) {
  const profileName = document.getElementById("profileName");
  if (!profileName) return;
  profileName.textContent = user.displayName || user.email || "Welcome back";
}

function displayUserInfo(user, userData = {}) {
  const userInfoName = document.getElementById("userInfoName");
  const userInfoEmail = document.getElementById("userInfoEmail");

  const displayName = userData.name || user.displayName || "Not available";
  const email = user.email || userData.email || "Not available";

  if (userInfoName) userInfoName.textContent = displayName;
  if (userInfoEmail) userInfoEmail.textContent = email;
}

/* ---------------- EDIT PROFILE ---------------- */

function setupEditProfile(user, userData = {}) {
  const editProfileBtn = document.getElementById("editProfileBtn");
  if (!editProfileBtn) return;

  editProfileBtn.addEventListener("click", async () => {
    const currentName = userData.name || user.displayName || "";
    const newName = prompt("Enter your name:", currentName);
    if (newName === null) return;

    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        {
          name: newName.trim() || currentName || "Not available",
          email: user.email || "Not available",
        },
        { merge: true }
      );

      const updatedUserData = {
        ...userData,
        name: newName.trim() || currentName || "Not available",
        email: user.email || "Not available",
      };

      displayProfileName({
        displayName: updatedUserData.name,
        email: user.email,
      });
      displayUserInfo(user, updatedUserData);
    } catch (error) {
      console.error("Error updating profile info:", error);
    }
  });
}

/* ---------------- IMAGE ---------------- */

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

/* ---------------- USER INFO ---------------- */

async function populateUserInfo(user) {
  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    let userData = {};

    if (userSnap.exists()) {
      userData = userSnap.data();
      const profileImage = userData.profileImage || "";

      if (profileImage) {
        displayProfileImage(profileImage);
      }
    }

    displayUserInfo(user, userData);
    setupEditProfile(user, userData);
  } catch (error) {
    console.error("Error loading user profile:", error);
  }
}

/* ---------------- FIRESTORE LOCATION ---------------- */

async function getSpotNameFromFirestore(spotId) {
  try {
    const spotRef = doc(db, "eventspots", spotId);
    const spotSnap = await getDoc(spotRef);

    if (spotSnap.exists()) {
      return spotSnap.data().name;
    }
  } catch (e) {
    console.error("Error:", e);
  }

  return "Event Spot";
}

/* ---------------- HELPERS ---------------- */

function getSpotNameFromPath(path) {
  const parts = path.split("/");
  if (parts.length >= 2) {
    return parts[1];
  }
  return "event-spot";
}

/* Fallback location */
function getReadableLocation() {
  return "Event Spot";
}

/* ---------------- POSTS ---------------- */

async function createPostCard(post, docId, spotName) {
  const template = document.getElementById("postCardTemplate");
  const postCard = template.content.cloneNode(true);

  const imageElement = postCard.querySelector(".card-image");
  const titleElement = postCard.querySelector(".card-title");
  const textElement = postCard.querySelector(".card-text");
  const locationElement = postCard.querySelector(".card-location");
  const readMoreLink = postCard.querySelector(".read-more");

  imageElement.src = post.image || "/images/default-profile.png";
  titleElement.textContent = post.caption || "Untitled Post";
  textElement.textContent = post.details || "No details available.";

  const realLocation = await getSpotNameFromFirestore(spotName);
  locationElement.textContent = realLocation;

  readMoreLink.href = "#";

  return postCard;
}

function isUsersPost(post, user) {
  return post.owner === user.uid;
}

async function loadUserPosts(user) {
  const postsContainer = document.getElementById("postsContainer");
  const emptyPostsMessage = document.getElementById("emptyPostsMessage");

  if (!postsContainer) return;

  postsContainer.innerHTML = "";
  let hasPosts = false;
  let postCount = 0;

  try {
    const postsRef = collectionGroup(db, "updates");
    const snapshot = await getDocs(postsRef);

    for (const postDoc of snapshot.docs) {
      const postData = postDoc.data();

      if (isUsersPost(postData, user)) {
        const spotName = getSpotNameFromPath(postDoc.ref.path);
        const card = await createPostCard(postData, postDoc.id, spotName);

        postsContainer.appendChild(card);
        hasPosts = true;
        postCount++;
      }
    }

    if (emptyPostsMessage) {
      emptyPostsMessage.style.display = hasPosts ? "none" : "block";
      if (!hasPosts) emptyPostsMessage.textContent = "No posts yet.";
    }

    const profileSubtitle = document.getElementById("profileSubtitle");
    if (profileSubtitle) {
      profileSubtitle.textContent = `${postCount} post${postCount === 1 ? "" : "s"}`;
    }
  } catch (error) {
    console.error("Error loading user posts:", error);

    if (emptyPostsMessage) {
      emptyPostsMessage.textContent = "Could not load posts.";
      emptyPostsMessage.style.display = "block";
    }
  }
}

/* ---------------- INIT ---------------- */

function initProfilePage() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "/login.html";
      return;
    }

    displayProfileName(user);
    await populateUserInfo(user);
    uploadImage(user.uid);
    await loadUserPosts(user);
  });
}

initProfilePage();