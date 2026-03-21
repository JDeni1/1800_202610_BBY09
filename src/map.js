//maplibre-gl rest here:
import maplibregl from "maplibre-gl";
// Database initialize here:
import { db } from "./firebaseConfig.js";
// Functions needed to read from database:
import { collection, getDocs, addDoc, setDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";

// ------------------------------------------------------------
// This function takes the heatmap data and adds green pins to the map.
// It also stores the heatmap data in a global variable for later use (e.g., zooming).
// ------------------------------------------------------------
async function showHeat(map) {
    let snapshot = [];
    try {
        snapshot = await getHeat();
    } catch (err) {
        console.error("Firestore fetch failed:", err);
    }

    snapshot.forEach(item => {
        appState.heat.push(item);

        // Colour based on latest_status (1=green, 5=red, null=grey)
        const statusColours = {
            1: "#00c853",  // green - not busy
            2: "#aeea00",  // yellow-green
            3: "#ffd600",  // yellow
            4: "#ff6d00",  // orange
            5: "#d50000",  // red - very busy
        };
        const colour = item.latest_status ? statusColours[item.latest_status] : "#9e9e9e";

        //this will make an element:
        const el = document.createElement("div");
        el.style.width = "20px";
        el.style.height = "20px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = colour;
        el.style.border = "2px solid white";
        el.style.opacity = "0.85";

        new maplibregl.Marker({ element: el })
            .setLngLat([item.location.lng, item.location.lat])
            .setPopup(
                new maplibregl.Popup({ offset: 25 }) //this will make a popup to show the status of the heatmap.
                    .setHTML(`
                        <h3>${item.caption}</h3>
                        <p>${item.description}</p>
                        <p><strong>Status:</strong> ${item.latest_status ?? "No reports yet"} / 5</p>
                    `)
            )
            .addTo(map);
    });
}

// ------------------------------------------------------------
// This function fetches heatmap data (converted to JSON)
// from Firestore and adds green pins to the map.
// It assumes each heatmap document has "lat" and "lng" fields.
// ------------------------------------------------------------
async function getHeat() {
    const snapshot = await getDocs(collection(db, "posts"));
    return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}

// ------------------------------------------------------------
// Global variable to store user location, heat data - good practice
// ------------------------------------------------------------
const appState = {
  heat: [],
  userLngLat: null
};

// ------------------------------------------------------------
// This top level function initializes the MapLibre map, adds controls
// It waits for the map to load before trying to add sources/layers.
// ------------------------------------------------------------
function showMap() {
    // Initialize MapLibre
    // Centered at BCIT
    const map = new maplibregl.Map({
        container: "map",
        style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
        center: [-123.00163752324765, 49.25324576104826],
        zoom: 10
    });

    // Add controls (zoom, rotation, etc.) shown in top-right corner of map
    addControls(map);

    // Once the map loads, we can add the user location and hike markers, etc. 
    // We wait for the "load" event to ensure the map is fully initialized before we try to add sources/layers.
    map.once("load", async () => {
        // Choose either the built-in geolocate control or the manual pin method
        // addGeolocationControl(map);
        await addUserPin(map);
        await showHeat(map);
        //await seedPosts();  // Seed the database with initial posts (for testing/demo purposes, uncomment if needed)
	      console.log("map loaded, placed user pin!");
    });

    function addControls(map) {
        // Zoom and rotation
        map.addControl(new maplibregl.NavigationControl(), "top-right");
    }
}

showMap();

function addGeolocationControl(map) {
  const geolocate = new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true
  });
  map.addControl(geolocate, "top-right");

  // Optional: trigger a locate once the control is added
  geolocate.on("trackuserlocationstart", () => {
    // You can react to tracking start here if needed
  });
}

// ------------------------------------------------------------
// This function manually gets the user's geolocation and adds a custom pin to the map.
// It also adds a click event to show a popup with "You are here".
// -------------------------------------------------------------
async function addUserPin(map) {
    if (!("geolocation" in navigator)) {
        console.warn("Geolocation is not available in this browser");
        return;
    }

    // Use the safe geolocation function that returns a Promise
    navigator.geolocation.getCurrentPosition(
        pos => {
            // Store user location in global variable for later use (e.g., zooming to all points)
            appState.userLngLat = [pos.coords.longitude, pos.coords.latitude];

            // Add a GeoJSON source
            map.addSource("userLngLat", {
                type: "geojson",
                data: {
                    type: "FeatureCollection",
                    features: [
                        {
                            type: "Feature",
                            geometry: { type: "Point", coordinates: appState.userLngLat },
                            properties: { description: "Your location" }
                        }
                    ]
                }
            });

            // Add a simple circle layer
            map.addLayer({
                id: "userLngLat",
                type: "circle",
                source: "userLngLat",
                paint: {
                    "circle-color": "#1E90FF",
                    "circle-radius": 6,
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#ffffff"
                }
            });

            // Optional: add a tooltip on hover or click
            map.on("click", "userLngLat", e => {
                const [lng, lat] = e.features[0].geometry.coordinates;
                new maplibregl.Popup().setLngLat([lng, lat]).setHTML("You are here").addTo(map);
            });
        },
        err => {
            console.error("Geolocation error", err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

async function seedPosts() {
    const posts = [
        {
            caption: "BC Place",
            description: "Stadium where the FIFA events will be held in 2026.",
            location: { lat: 49.2766605, lng: -123.1113065 }
        },
        {
            caption: "Commericial-Broadway Skytrain Station",
            description: "The busiest SkyTrain Station in Vancouver.",
            location: { lat: 49.2625, lng: -123.0689 }
        },
        {
            caption: "PNE",
            description: "Pacific National Exhibition grounds, with event space.",
            location: { lat: 49.2837654, lng: -123.0394027 }
        },
        {
            caption: "Stadium-Chinatown Skytrain Station",
            description: "The main hub that leads to BC Place.",
            location: { lat: 49.27962, lng: -123.1123564 }
        },
        {
            caption: "Renfrew Skytrain Station",
            description: "Transit Connection to the PNE.",
            location: { lat: 49.2589135, lng: -123.0479603 }
        }
    ];

    for (const post of posts) {
        // Use setDoc + a named ID so you never get duplicates
        await setDoc(doc(db, "posts", post.caption), {
            ...post,
            latest_status: null,   // no reports yet
            last_updated: serverTimestamp()
        });
        console.log("Seeded:", post.caption);
    }
    console.log("Done seeding!");
}