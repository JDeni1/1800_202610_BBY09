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

function getSpotNameFromPath(path) {
  const parts = path.split("/");
  if (parts.length >= 2) {
    return parts[1];
  }
  return "Event Spot";
}

function formatSpotName(spotName) {
  return spotName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function createPostCard(post, docId, spotName) {
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
  locationElement.textContent = formatSpotName(spotName);
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

    snapshot.forEach((postDoc) => {
      const postData = postDoc.data();

      if (isUsersPost(postData, user)) {
        const spotName = getSpotNameFromPath(postDoc.ref.path);
        const card = createPostCard(postData, postDoc.id, spotName);
        postsContainer.appendChild(card);
        hasPosts = true;
        postCount++;
      }
    });

    if (emptyPostsMessage) {
      if (hasPosts) {
        emptyPostsMessage.style.display = "none";
      } else {
        emptyPostsMessage.textContent = "No posts yet.";
        emptyPostsMessage.style.display = "block";
      }
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

function initProfilePage() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "/login.html";
      return;
    }

    displayProfileName(user);
    await populateUserInfo(user.uid);
    uploadImage(user.uid);
    await loadUserPosts(user);
  });
}

initProfilePage();