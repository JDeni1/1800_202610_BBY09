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
} from "firebase/firestore";

// ------------------------------------------------------------
// Global state
// ------------------------------------------------------------
const appState = {
  spots: [],
  userLngLat: null,
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
    await seedEventSpots(); // Uncomment to seed Firestore (run once only)
    console.log("Map loaded!");
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

  const statusColours = {
    1: "#00c853", // green  - not busy
    2: "#aeea00", // yellow-green
    3: "#ffd600", // yellow
    4: "#ff6d00", // orange
    5: "#d50000", // red    - very busy
  };

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

    const marker = new maplibregl.Marker({ element: el }).setLngLat([
      spot.location.lng,
      spot.location.lat,
    ]);

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

      new maplibregl.Popup({ offset: 25 })
        .setLngLat([spot.location.lng, spot.location.lat])
        .setHTML(popupHTML)
        .addTo(map);
    });

    marker.addTo(map);
  });
}

// ------------------------------------------------------------
// Seed Firestore with initial event spots (run once only)
// ------------------------------------------------------------
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
