// ===============================
// MAP INITIALIZATION
// ===============================
const map = L.map("map").setView([49.2827, -123.1207], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

// ===============================
// SEARCH BOX (GEOCODER)
// ===============================
const geocoder = L.Control.geocoder({
  defaultMarkGeocode: false
}).addTo(map);

// ===============================
// INTERACTIVE ROUTING
// ===============================
let routingControl = null;
let selectedPoints = [];

// When user selects a search result
geocoder.on("markgeocode", function (e) {
  const latlng = e.geocode.center;
  selectedPoints.push(latlng);

  // If two points selected → calculate route
  if (selectedPoints.length === 2) {
    if (routingControl) map.removeControl(routingControl);

    routingControl = L.Routing.control({
      waypoints: selectedPoints,
      routeWhileDragging: true,
      showAlternatives: false
    }).addTo(map);

    selectedPoints = []; // reset for next route
  }
});

// ===============================
// OPTIONAL: Allow map clicks as well
// ===============================
map.on("click", function (e) {
  selectedPoints.push(e.latlng);

  if (selectedPoints.length === 2) {
    if (routingControl) map.removeControl(routingControl);

    routingControl = L.Routing.control({
      waypoints: selectedPoints,
      routeWhileDragging: true,
      showAlternatives: true
    }).addTo(map);

    selectedPoints = [];
  }
});

fetch("/data/yourShapes.geojson")
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: { color: "blue", weight: 3 }
    }).addTo(map);
  });

