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
import { initSearchBar } from "./searchbar.js";

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
let map;

function showMap() {
  map = new maplibregl.Map({
    container: "map",
    style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
    center: [-123.0965, 49.2827],
    zoom: 13,
  });

  map.addControl(new maplibregl.NavigationControl(), "top-right");

  map.once("load", async () => {
    await addUserPin(map);
    await showEventSpots(map);
    listenToEventSpots(map);
    initSearchBar(map);
    console.log("Map loaded!");
  });
}

showMap();

//This adds a button to center the map at my current location.
map.addControl(
  new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: false, // you can turn this on if you want live tracking
    showUserLocation: true
  }),
  "top-right"
);
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
// Render event spot markers on the map
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
      : "#9e9e9e";

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

    el.addEventListener("click", async () => {
      const latest = await getLatestUpdate(spot.id);

      const popupHTML = latest
        ? `<h3>${spot.name}</h3>
           <p>${spot.description}</p>
           <p><strong>Status:</strong> ${latest.status} / 5</p>
           <p>${latest.details}</p>
           <p><em>${latest.timestamp?.toDate().toLocaleString() ?? ""}</em></p>
           ${latest.image ? `<img src="${latest.image}" style="width:100%;border-radius:6px;margin-top:6px;">` : ""}`
        : `<h3>${spot.name}</h3>
           <p>${spot.description}</p>
           <p>No reports yet.</p>`;

      const reportForm = ``;

      const popup = new maplibregl.Popup({ offset: 25 })
        .setLngLat([spot.location.lng, spot.location.lat])
        .setHTML(popupHTML + reportForm)
        .addTo(map);

      setTimeout(() => {
        const btn = document.getElementById("report-submit");
        btn?.addEventListener("click", async () => {
          const status = parseInt(
            document.getElementById("report-status").value,
          );
          const details = document.getElementById("report-details").value;

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

// ------------------------------------------------------------
// Submit a crowd report for a spot
// ------------------------------------------------------------
async function submitReport(spotId, status, details) {
  console.log("submitReport called", spotId, status, details);
  await addDoc(collection(db, "eventspots", spotId, "updates"), {
    status,
    details,
    timestamp: serverTimestamp(),
  });

  await updateDoc(doc(db, "eventspots", spotId), {
    latest_status: status,
    last_updated: serverTimestamp(),
  });
}

// ------------------------------------------------------------
// Live listener — updates marker colours in real time
// ------------------------------------------------------------
function listenToEventSpots(map) {
  onSnapshot(collection(db, "eventspots"), (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const spot = { id: change.doc.id, ...change.doc.data() };
      if (change.type === "modified") {
        const marker = markerMap[spot.id];
        if (!marker) return;
        marker.getElement().style.backgroundColor = spot.latest_status
          ? statusColours[spot.latest_status]
          : "#9e9e9e";
        //called pulsemarker from below:
        pulseMarker(spot.id, spot.latest_status);
      }
    });
  });
}

// ------------------------------------------------------------
// Busyness legend
// ------------------------------------------------------------
const existingLegend = document.getElementById("map-legend");
if (existingLegend) existingLegend.remove();

const legend = document.createElement("div");
legend.id = "map-legend";
legend.style.cssText = `
  position: absolute;
  bottom: 40px;
  right: 10px;
  background: white;
  padding: 10px 14px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.35);
  font-family: sans-serif;
  font-size: 12px;
  z-index: 9999;
`;

legend.innerHTML = `
  <div style="font-weight:bold;margin-bottom:6px;">Busyness</div>
  <div style="
    width: 150px; height: 16px;
    border-radius: 4px;
    background: linear-gradient(to right, #00c853, #aeea00, #ffd600, #ff6d00, #d50000);
  "></div>
  <div style="display:flex;justify-content:space-between;margin-top:4px;">
    <span>Not busy</span>
    <span>Very busy</span>
  </div>
`;

document.getElementById("map").appendChild(legend);

// ------------------------------------------------------------
// Pulse animation on marker update
// ------------------------------------------------------------
function pulseMarker(spotId, status) {
  const marker = markerMap[spotId];
  if (!marker) return;

  const lngLat = marker.getLngLat();
  const sourceId = `pulse-${spotId}`;
  const layerId = `pulse-layer-${spotId}`;

  map.addSource(sourceId, {
    type: "geojson",
    data: {
      type: "Feature",
      geometry: { type: "Point", coordinates: [lngLat.lng, lngLat.lat] },
    },
  });

  map.addLayer({
    id: layerId,
    type: "circle",
    source: sourceId,
    paint: {
      "circle-radius": 0,
      "circle-color": statusColours[status] ?? "#9e9e9e",
      "circle-opacity": 0.4,
      "circle-blur": 0.5,
    },
  });

  let radius = 0;
  let opacity = 0.4;

  function animate() {
    radius += 0.8;
    opacity -= 0.4 / 50;
    map.setPaintProperty(layerId, "circle-radius", radius);
    map.setPaintProperty(layerId, "circle-opacity", Math.max(opacity, 0));

    if (radius < 40) {
      requestAnimationFrame(animate);
    } else {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    }
  }

  requestAnimationFrame(animate);
}
