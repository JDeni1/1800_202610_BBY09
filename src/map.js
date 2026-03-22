// ------------------------------------------------------------
// Imports
// ------------------------------------------------------------
import maplibregl from "maplibre-gl";
import { db } from "./firebaseConfig.js";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";

// ------------------------------------------------------------
// Global state
// ------------------------------------------------------------
const appState = {
  spots: [],
  userLngLat: null,
};

const markerMap = {};

const statusColours = {
  1: "#00c853", // green  - not busy
  2: "#aeea00", // yellow-green
  3: "#ffd600", // yellow
  4: "#ff6d00", // orange
  5: "#d50000", // red    - very busy
};

// ------------------------------------------------------------
// Map initialization
// ------------------------------------------------------------
function showMap() {
  const map = new maplibregl.Map({
    container: "map",
    style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
    center: [-123.0965, 49.2827], // centered on downtown Vancouver
    zoom: 13,
  });

  map.addControl(new maplibregl.NavigationControl(), "top-right");

  map.once("load", async () => {
    await addUserPin(map);
    await showEventSpots(map);
    //await seedEventSpots(); // Uncomment to seed Firestore (run once only)
    console.log("Map loaded!");
    listenToEventSpots(map);
  });
}

showMap();

// ------------------------------------------------------------
// User location pin
// ------------------------------------------------------------
async function addUserPin(map) {
  if (!("geolocation" in navigator)) {
    console.warn("Geolocation is not available in this browser");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      appState.userLngLat = [pos.coords.longitude, pos.coords.latitude];

      map.addSource("userLocation", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: appState.userLngLat },
              properties: { description: "Your location" },
            },
          ],
        },
      });

      map.addLayer({
        id: "userLocation",
        type: "circle",
        source: "userLocation",
        paint: {
          "circle-color": "#1E90FF",
          "circle-radius": 6,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.on("click", "userLocation", (e) => {
        const [lng, lat] = e.features[0].geometry.coordinates;
        new maplibregl.Popup()
          .setLngLat([lng, lat])
          .setHTML("You are here")
          .addTo(map);
      });
    },
    (err) => console.error("Geolocation error:", err),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  );
}

// ------------------------------------------------------------
// Fetch all event spots from Firestore
// ------------------------------------------------------------
async function getEventSpots() {
  const snapshot = await getDocs(collection(db, "eventspots"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ------------------------------------------------------------
// Fetch the most recent update for a given event spot
// ------------------------------------------------------------
async function getLatestUpdate(spotId) {
  const q = query(
    collection(db, "eventspots", spotId, "updates"),
    orderBy("timestamp", "desc"),
    limit(1),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs[0]?.data() ?? null;
}

// ------------------------------------------------------------
// Render event spot markers on the map.
// Colour is based on latest_status (1=green → 5=red, null=grey).
// Clicking a marker fetches and shows the most recent update.
// ------------------------------------------------------------
async function showEventSpots(map) {
  let spots = [];
  try {
    spots = await getEventSpots();
  } catch (err) {
    console.error("Firestore fetch failed:", err);
    return;
  }

  spots.forEach((spot) => {
    appState.spots.push(spot);

    const colour = spot.latest_status
      ? statusColours[spot.latest_status]
      : "#9e9e9e"; // grey = no reports yet

    const el = document.createElement("div");
    el.style.width = "20px";
    el.style.height = "20px";
    el.style.borderRadius = "50%";
    el.style.backgroundColor = colour;
    el.style.border = "2px solid white";
    el.style.opacity = "0.85";
    el.style.cursor = "pointer";

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([spot.location.lng, spot.location.lat])
      .addTo(map);

    markerMap[spot.id] = marker;

    // On click: fetch latest update and show in popup
    el.addEventListener("click", async () => {
      const latest = await getLatestUpdate(spot.id);

      const popupHTML = latest
        ? `<h3>${spot.name}</h3>
       <p>${spot.description}</p>
       <p><strong>Status:</strong> ${latest.status} / 5</p>
       <p>${latest.details}</p>
       <p><em>${latest.timestamp?.toDate().toLocaleString() ?? ""}</em></p>
       ${latest.image_url ? `<img src="${latest.image_url}" style="width:100%;border-radius:6px;margin-top:6px;">` : ""}`
        : `<h3>${spot.name}</h3>
       <p>${spot.description}</p>
       <p>No reports yet.</p>`;

      const reportForm = `
    <hr/>
    <h4>Submit a Report</h4>
    <label>Crowd Level (1-5):</label>
    <input id="report-status" type="number" min="1" max="5" style="width:100%;margin-bottom:6px;">
    <label>Details:</label>
    <textarea id="report-details" style="width:100%;margin-bottom:6px;"></textarea>
    <button id="report-submit" style="width:100%;padding:6px;cursor:pointer;">Submit</button>
  `;

      const popup = new maplibregl.Popup({ offset: 25 })
        .setLngLat([spot.location.lng, spot.location.lat])
        .setHTML(popupHTML + reportForm)
        .addTo(map);

      // Wire up the submit button after popup is in the DOM
      setTimeout(() => {
        const btn = document.getElementById("report-submit");
        //console.log("button found?", btn); //This will tell you if the button is found in console, you can remove it if its affecting you.
        btn?.addEventListener("click", async () => {
          //console.log("button clicked!"); //Ad nauseum, you can remove this too if it's affecting you.
          const status = parseInt(
            document.getElementById("report-status").value,
          );
          const details = document.getElementById("report-details").value; //this will tell you in the console that you updated the spot or "marker".

          if (!status || status < 1 || status > 5) {
            alert("Please enter a crowd level between 1 and 5.");
            return;
          }

          await submitReport(spot.id, status, details);
          popup.remove();
        });
      }, 100);
    });
  });
}
// Seed Firestore with initial event spots (run once only)
async function seedEventSpots() {
  const spots = [
    {
      id: "bc-place",
      name: "BC Place",
      description: "FIFA 2026 venue",
      location: { lat: 49.2766, lng: -123.1113 },
    },
    {
      id: "commercial-broadway",
      name: "Commercial-Broadway Station",
      description: "Busiest SkyTrain station",
      location: { lat: 49.2625, lng: -123.0689 },
    },
    {
      id: "pne",
      name: "PNE",
      description: "Pacific National Exhibition",
      location: { lat: 49.2837, lng: -123.0394 },
    },
    {
      id: "stadium-chinatown",
      name: "Stadium-Chinatown Station",
      description: "Main hub to BC Place",
      location: { lat: 49.2796, lng: -123.1123 },
    },
    {
      id: "renfrew",
      name: "Renfrew Skytrain Station",
      description: "Transit connection to PNE",
      location: { lat: 49.2589, lng: -123.0479 },
    },
  ];

  for (const spot of spots) {
    await setDoc(doc(db, "eventspots", spot.id), {
      name: spot.name,
      description: spot.description,
      location: spot.location,
      latest_status: null,
      last_updated: serverTimestamp(),
    });
    console.log("Seeded:", spot.name);
  }
  console.log("Done seeding!");
}

/**------------------------------------------------------------
 * This function will listen to the HTML popup above and will update 
 * the Firestore database with the new report and latest_status for the event spot.
 ----------------------------------------------------------------*/

async function submitReport(spotId, status, details) {
  console.log("submitReport called", spotId, status, details);
  await addDoc(collection(db, "eventspots", spotId, "updates"), {
    status: status,
    details: details,
    timestamp: serverTimestamp(),
  });

  await updateDoc(doc(db, "eventspots", spotId), {
    latest_status: status,
    last_updated: serverTimestamp(),
  });
}

//This function will listen to the event spots and update the eventspots category in firestore:
function listenToEventSpots(map) {
  onSnapshot(collection(db, "eventspots"), (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const spot = { id: change.doc.id, ...change.doc.data() };
      if (change.type === "modified") {
        const marker = markerMap[spot.id];
        if (!marker) return;
        marker.getElement().style.backgroundColor = //This will change the colour to match the
          spot.latest_status ? statusColours[spot.latest_status] : "#9e9e9e";
      }
    });
  });
}
