import maplibregl from "maplibre-gl";
import { db } from "./firebaseConfig.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { initSearchBar } from "./searchbar.js";

const DEFAULT_CENTER = [-123.0965, 49.2827];
const GEOLOCATION_TIMEOUT_MS = 3000;
const STATUS_COLOURS = {
  1: "#00c853",
  2: "#aeea00",
  3: "#ffd600",
  4: "#ff6d00",
  5: "#d50000",
};

let map;
const markerMap = {};

// ------------------------------------------------------------
// Security: sanitize strings before injecting into HTML
// ------------------------------------------------------------
function sanitize(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// ------------------------------------------------------------
// Map initialization
// ------------------------------------------------------------
document.getElementById("map-loading").style.display = "block";

function initMap(center) {
  map = new maplibregl.Map({
    container: "map",
    style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
    center,
    zoom: 13,
  });
//This is where the zoom in/out buttons are on the map.
  map.addControl(new maplibregl.NavigationControl(), "top-right");
  map.addControl(
    new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
      showUserLocation: true,
    }),
    "top-right",
  );

  map.once("load", async () => {
    await showEventSpots();
    await refreshAllMarkerColours();
    listenToEventSpots();
    initSearchBar(map);
    pulseRecentUpdates();
    renderLegend();
    document.getElementById("map-loading").style.display = "none";
  });
}

function startMap() {
  if (!("geolocation" in navigator)) {
    return initMap(DEFAULT_CENTER);
  }

  const fallback = setTimeout(
    () => initMap(DEFAULT_CENTER),
    GEOLOCATION_TIMEOUT_MS,
  );

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      clearTimeout(fallback);
      initMap([coords.longitude, coords.latitude]);
    },
    () => {
      clearTimeout(fallback);
      initMap(DEFAULT_CENTER);
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
  );
}

startMap();

// ------------------------------------------------------------
// Firestore helpers
// ------------------------------------------------------------
async function getEventSpots() {
  const snapshot = await getDocs(collection(db, "eventspots"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

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
// Popup HTML builder
// ------------------------------------------------------------
function buildPopupHTML(spot, latest) {
  const base = `<h3>${sanitize(spot.name)}</h3><p>${sanitize(spot.description)}</p>`;

  if (!latest) {
    return base + `<p>No posts yet.</p>`;
  }

  const imageHTML = latest.image
    ? `<img src="${sanitize(latest.image)}" style="width:100%;border-radius:6px;margin-top:6px;">`
    : "";

  const time = latest.timestamp?.toDate().toLocaleString() ?? "";

  return (
    base +
    `<p><strong>Status:</strong> ${sanitize(String(latest.status))} / 5</p>
    <p><strong>${sanitize(latest.caption)}</strong></p>
     <p>${sanitize(latest.details)}</p>
     <p><em>${sanitize(time)}</em></p>
     ${imageHTML}`
  );
}

// ------------------------------------------------------------
// Marker helper
// ------------------------------------------------------------
function createMarkerElement(colour) {
  const el = document.createElement("div");
  Object.assign(el.style, {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    backgroundColor: colour,
    border: "2px solid white",
    opacity: "0.85",
    cursor: "pointer",
  });
  return el;
}

// ------------------------------------------------------------
// Render event spots
// ------------------------------------------------------------
async function showEventSpots() {
  let spots;
  try {
    spots = await getEventSpots();
  } catch (err) {
    console.error("Firestore fetch failed:", err);
    return;
  }

  spots.forEach(async (spot) => {
    // Always fetch the true latest update
    const latest = await getLatestUpdate(spot.id);

    const colour = latest ? STATUS_COLOURS[latest.status] : "#9e9e9e";

    const el = createMarkerElement(colour);

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([spot.location.lng, spot.location.lat])
      .addTo(map);

    markerMap[spot.id] = marker;

    el.addEventListener("click", async () => {
      const latestUpdate = await getLatestUpdate(spot.id);
      new maplibregl.Popup({ offset: 25 })
        .setLngLat([spot.location.lng, spot.location.lat])
        .setHTML(buildPopupHTML(spot, latestUpdate))
        .addTo(map);
    });
  });
}

// ------------------------------------------------------------
// Live Firestore listener
// ------------------------------------------------------------
function listenToEventSpots() {
  onSnapshot(collection(db, "eventspots"), (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type !== "modified") return;

      const spot = { id: change.doc.id, ...change.doc.data() };
      const marker = markerMap[spot.id];
      if (!marker) return;

      const colour = STATUS_COLOURS[spot.latest_status] ?? "#9e9e9e";
      marker.getElement().style.backgroundColor = colour;
      pulseMarker(spot.id, spot.latest_status);
    });
  });
}

// ------------------------------------------------------------
// Busyness legend
// ------------------------------------------------------------
function renderLegend() {
  document.getElementById("map-legend")?.remove();

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
}

// ------------------------------------------------------------
// Pulse animation on marker update
// ------------------------------------------------------------
function pulseMarker(spotId, status) {
  const marker = markerMap[spotId];
  if (!marker) return;

  const { lng, lat } = marker.getLngLat();
  const sourceId = `pulse-${spotId}`;
  const layerId = `pulse-layer-${spotId}`;
  const colour = STATUS_COLOURS[status] ?? "#9e9e9e";

  const geojson = {
    type: "Feature",
    geometry: { type: "Point", coordinates: [lng, lat] },
  };

  const existingSource = map.getSource(sourceId);
  if (existingSource) {
    existingSource.setData(geojson);
  } else {
    map.addSource(sourceId, { type: "geojson", data: geojson });
  }

  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: "circle",
      source: sourceId,
      paint: {
        "circle-radius": 0,
        "circle-color": colour,
        "circle-opacity": 0.5,
        "circle-blur": 0.6,
      },
    });
  }

  let radius = 0;
  let opacity = 0.5;

  function animate() {
    radius += 0.25; // slower expansion
    opacity -= 0.5 / 180; // fade over ~3 seconds

    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, "circle-radius", radius);
      map.setPaintProperty(layerId, "circle-opacity", Math.max(opacity, 0));
    }

    if (radius < 80) {
      // bigger ring, longer duration
      requestAnimationFrame(animate);
    } else {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    }
  }

  requestAnimationFrame(animate);
}

//This will make the heat bubbles visible when you return to the heatmap:
async function pulseRecentUpdates() {
  const snapshot = await getDocs(collection(db, "eventspots"));
  const now = Date.now();

  snapshot.forEach((doc) => {
    const data = doc.data();
    const updated = data.last_updated?.toMillis?.();

    if (!updated) return;

    // Only pulse if the update happened AFTER your last visit
    if (updated > lastVisit) {
      pulseMarker(doc.id, data.latest_status);
    }
  });

  // Update lastVisit AFTER checking
  lastVisit = now;
}

async function refreshAllMarkerColours() {
  const snapshot = await getDocs(collection(db, "eventspots"));

  snapshot.forEach((doc) => {
    const data = doc.data();
    const marker = markerMap[doc.id];
    if (!marker) return;

    const colour = data.latest_status
      ? STATUS_COLOURS[data.latest_status]
      : "#9e9e9e";

    marker.getElement().style.backgroundColor = colour;
  });
}
