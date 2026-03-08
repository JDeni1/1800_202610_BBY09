//import functions as needed
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebaseConfig.js";

function uploadImage() {
  document
    .getElementById("inputImage")
    .addEventListener("change", handleFileSelect);
  function handleFileSelect(event) {
    var file = event.target.files[0];

    if (file) {
      var reader = new FileReader();

      // When file reading is complete
      reader.onload = function (e) {
        var base64String = e.target.result.split(",")[1]; // Extract Base64 data

        ///display the image for user to preview
        document.getElementById("mypic-goes-here").src = e.target.result;

        // Save to localStorage for now until Post is submitted
        localStorage.setItem("inputmage", base64String);
        console.log("Image saved to localStorage as Base64 string.");
      };

      // Read the file as a Data URL (Base64 encoding)
      reader.readAsDataURL(file);
    }
  }
}
uploadImage();

//------------------------------------------------------------
// Add event listener to the "Save Post" button
//-------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const postButton = document.getElementById("postButton");
  postButton.addEventListener("click", savePost);
});

//------------------------------------------------------------
// This function saves the post data (description and image) to Firestore
// when the "Save Post" button is clicked.
//-------------------------------------------------------------
async function savePost() {
  alert("SAVE POST is triggered");

  const user = auth.currentUser;
  if (!user) {
    console.log("Error, no user signed in");
    return;
  }

  const desc = document.getElementById("description").value;

  // 1️⃣ Get Base64 image from Local Storage
  const inputImage = localStorage.getItem("inputImage") || "";

  // 2️⃣ Get the user's geolocation (wrapped in a Promise)
  const position = await getCurrentPositionSafe();

  const latitude = position?.coords?.latitude || null;
  const longitude = position?.coords?.longitude || null;

  try {
    // 3️⃣ Save post to Firestore with geolocation
    const docRef = await addDoc(collection(db, "posts"), {
      owner: user.uid,
      description: desc,
      image: inputImage,
      last_updated: serverTimestamp(),
      location: {
        lat: latitude,
        lng: longitude,
      },
    });

    console.log("1. Post document added!");
    console.log(docRef.id);

    // Optional: savePostIDforUser(docRef.id);
    // Do you want to keep track if what posts the user has done?
  } catch (error) {
    console.error("Error adding post:", error);
  }
}

//------------------------------------------------------------
// This function gets the current geolocation position safely.
// It returns a Promise that resolves to the position or null if
// geolocation is not available or permission is denied.
//-------------------------------------------------------------
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
//------------------------------------------------------------
// This function saves the post document ID to the user's document
// in Firestore under the "myposts" array field.
// This function is called after a post is successfully created.
//-------------------------------------------------------------
async function savePostIDforUser(postDocID) {
  const user = auth.currentUser;

  if (!user) {
    console.error("No user signed in.");
    return;
  }

  console.log("user id is: " + user.uid);
  console.log("postdoc id is: " + postDocID);

  try {
    await updateDoc(doc(db, "users", user.uid), {
      myposts: arrayUnion(postDocID),
    });

    console.log("Saved to user's document!");
    alert("Post is complete!");
  } catch (error) {
    console.error("Error writing document: ", error);
  }
}
