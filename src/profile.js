// import "bootstrap/dist/css/bootstrap.min.css";
// import "bootstrap";
// import { db } from "./firebaseConfig.js";
// import { doc, onSnapshot } from "firebase/firestore";
// import {
//   collection,
//   getDocs,
//   addDoc,
//   serverTimestamp,
// } from "firebase/firestore";
// import { onAuthReady } from "./authentication.js";
// import "/styles/style.css";

// //------------------------------------------------------------
// // This function is an Event Listener for the file (image) picker
// // When an image is chosen, it will then save that image into the
// // user's document in Firestore
// //-------------------------------------------------------------

// function uploadImage() {
//   // Attach event listener to the file input
//   // Function to handle file selection and Base64 encoding
//   document
//     .getElementById("inputImage")
//     .addEventListener("change", handleFileSelect);
//   function handleFileSelect(event) {
//     var file = event.target.files[0]; // Get the selected file

//     if (file) {
//       var reader = new FileReader(); // Create a FileReader to read the file

//       // When file reading is complete
//       reader.onload = function (e) {
//         var base64String = e.target.result.split(",")[1]; // Extract Base64 data

//         // Save the Base64 string to Firestore under the user's profile
//         saveProfileImage(base64String);
//       };

//       // Read the file as a Data URL (Base64 encoding)
//       reader.readAsDataURL(file);
//     }
//   }
// }
// uploadImage();

// //---------------------------------------------------
// // Function to save the Base64 image to Firestore
// // as a key value pair in the user's document.
// // This function is triggered when a image is selected.
// //---------------------------------------------------
// async function saveProfileImage(base64String) {
//   // Wait for the currently signed-in user
//   onAuthStateChanged(auth, async (user) => {
//     if (user) {
//       const userId = user.uid;
//       const userDocRef = doc(db, "users", userId);

//       try {
//         // Use setDoc with merge:true to avoid overwriting other fields
//         await setDoc(
//           userDocRef,
//           { profileImage: base64String },
//           { merge: true },
//         );

//         console.log("✅ Profile image saved successfully!");
//         displayProfileImage(base64String); // Show the image in the UI
//       } catch (error) {
//         console.error("❌ Error saving profile image:", error);
//       }
//     } else {
//       console.error("⚠️ No user is signed in.");
//     }
//   });
// }

// //----------------------------------------------------------------
// // Function to display the stored Base64 image on the profile page.
// // This is called when the user picks an image using the file chooser.
// // so that the user can see what picture they picked!
// // Before the image can be displayed, prepend meta data info back.
// //----------------------------------------------------------------
// function displayProfileImage(base64String) {
//   const imgElement = document.getElementById("profileImage"); // Assuming there's an <img> element with this ID
//   if (imgElement) {
//     imgElement.src = `data:image/png;base64,${base64String}`; // Set the image source to the Base64 string
//   } else {
//     console.error("⚠️ No image element found to display the profile image.");
//   }
// }

// //-----------------------------------------------------------
// // This is a default function that runs onload to popoulate
// // the profile page form with whatever data exists for that user
// // including the image that was previously chosen.
// //-----------------------------------------------------------
// function populateUserInfo() {
//   onAuthStateChanged(auth, async (user) => {
//     if (user) {
//       try {
//         // reference to the user document
//         const userRef = doc(db, "users", user.uid);
//         const userSnap = await getDoc(userRef);

//         if (userSnap.exists()) {
//           // Extract user info fields from document data
//           // and provide default empty strings if fields are missing
//           // Assumes knowledge of property names in the user document
//           const userData = userSnap.data();
//           const {
//             name = "",
//             school = "",
//             city = "",
//             profileImage = "",
//           } = userData;

//           // Populate form fields with user data
//           document.getElementById("nameInput").value = name;
//           document.getElementById("schoolInput").value = school;
//           document.getElementById("cityInput").value = city;
//           //---------------------------------------------
//           //Add metadata back, and assign to image source
//           //---------------------------------------------
//           //var userImage = userDoc.data().profileImage;
//           document.getElementById("profileImage").src =
//             "data:image/png;base64," + profileImage;
//         } else {
//           console.log("No such document!");
//         }
//       } catch (error) {
//         console.error("Error getting user document:", error);
//       }
//     } else {
//       console.log("No user is signed in");
//     }
//   });
// }

// populateUserInfo();

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
