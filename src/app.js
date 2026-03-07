import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import { db } from "./firebaseConfig.js";
import { doc, onSnapshot } from "firebase/firestore";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthReady } from "./authentication.js";
import "/styles/style.css";

function sayHello() {
  // TODO: implement your logic here
}
document.addEventListener("DOMContentLoaded", sayHello);

//--------------------------------------------------------------
// If you have custom global styles, import them as well:
//--------------------------------------------------------------

//--------------------------------------------------------------
// Custom global JS code (shared with all pages)can go here.
//--------------------------------------------------------------
function showName() {
  const nameElement = document.getElementById("name-goes-here");

  onAuthReady((user) => {
    if (!user) {
      if (window.location.pathname.endsWith("main.html")) {
        location.href = "index.html";
      }
      return;
    }

    const name = user.displayName || user.email;
    if (nameElement) nameElement.textContent = `${name}!`;
  });
}
// Function to read the quote of the day from Firestore
function readQuote(day) {
  const quoteDocRef = doc(db, "quotes", day); // Get a reference to the document

  onSnapshot(
    quoteDocRef,
    (docSnap) => {
      // Listen for real-time updates
      if (docSnap.exists()) {
        //Document existence check
        document.getElementById("quote-goes-here").innerHTML =
          docSnap.data().quote;
      } else {
        console.log("No such document!");
      }
    },
    (error) => {
      //Listener/system error
      console.error("Error listening to document: ", error);
    },
  );
}
readQuote("tuesday");

showName();

// Helper function to add the sample hike documents.
function addHikeData() {
  const hikesRef = collection(db, "hikes");
  console.log("Adding sample hike data...");
  addDoc(hikesRef, {
    code: "BBY01",
    name: "Burnaby Lake Park Trail",
    city: "Burnaby",
    level: "easy",
    details: "A lovely place for a lunch walk.",
    length: 10,
    hike_time: 60,
    lat: 49.2467097082573,
    lng: -122.9187029619698,
    last_updated: serverTimestamp(),
  });
  addDoc(hikesRef, {
    code: "AM01",
    name: "Buntzen Lake Trail",
    city: "Anmore",
    level: "moderate",
    details: "Close to town, and relaxing.",
    length: 10.5,
    hike_time: 80,
    lat: 49.3399431028579,
    lng: -122.85908496766939,
    last_updated: serverTimestamp(),
  });
  addDoc(hikesRef, {
    code: "NV01",
    name: "Mount Seymour Trail",
    city: "North Vancouver",
    level: "hard",
    details: "Amazing ski slope views.",
    length: 8.2,
    hike_time: 120,
    lat: 49.38847101455571,
    lng: -122.94092543551031,
    last_updated: serverTimestamp(),
  });
}

// Seeds the "hikes" collection with initial data if it is empty
async function seedHikes() {
  // Get a reference to the "hikes" collection
  const hikesRef = collection(db, "hikes");

  // Retrieve all documents currently in the collection
  const querySnapshot = await getDocs(hikesRef);

  // If no documents exist, the collection is empty
  if (querySnapshot.empty) {
    console.log("Hikes collection is empty. Seeding data...");

    // Call function to insert default hike documents
    addHikeData();
  } else {
    // If documents already exist, do not reseed
    console.log("Hikes collection already contains data. Skipping seed.");
  }
}

// Call the seeding function wen the main.html page loads.
seedHikes();

async function displayCardsDynamically() {
  let cardTemplate = document.getElementById("hikeCardTemplate");
  const hikesCollectionRef = collection(db, "hikes");

  try {
    const querySnapshot = await getDocs(hikesCollectionRef);
    querySnapshot.forEach((doc) => {
      // Clone the template
      let newcard = cardTemplate.content.cloneNode(true);
      // Get hike data once
      const hike = doc.data();

      // Populate the card with hike data
      newcard.querySelector(".card-title").textContent = hike.name;
      newcard.querySelector(".card-text").textContent =
        hike.details || `Located in ${hike.city}.`;
      newcard.querySelector(".card-length").textContent = hike.length;

      //Addede this line
      newcard.querySelector(".card-image").src = `./images/${hike.code}.jpg`;
      newcard.querySelector(".read-more").href =
        `eachHike.html?docID=${doc.id}`;

      // Attach the new card to the container
      document.getElementById("hikes-go-here").appendChild(newcard);
    });
  } catch (error) {
    console.error("Error getting documents: ", error);
  }
}

// Call the function to display cards when the page loads
displayCardsDynamically();
