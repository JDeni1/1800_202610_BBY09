var map = L.map("map").setView([49.2827, -123.1207], 13);

// Base layer
var osmLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

// Markers
var bcPlace = L.marker([49.276759, -123.112106]).bindPopup(
  "<b>BC Place Stadium</b>",
);
var pneAmphitheatre = L.marker([49.2828, -123.0366]).bindPopup(
  "<b>PNE Amphitheatre (Fan Festival)</b>",
);

// Heatmap
var crowdData = [
  [49.2828, -123.0366, 1.0],
  [49.283, -123.037, 0.7],
  [49.2825, -123.036, 0.8],
  [49.2767, -123.1121, 0.9],
];

var heatLayer = L.heatLayer(crowdData, { radius: 25, blur: 15 });

// Layer control setup
var baseMaps = { OpenStreetMap: osmLayer };
var overlayMaps = {
  "BC Place": bcPlace,
  "PNE Fan Festival": pneAmphitheatre,
  "Crowd Density": heatLayer,
};

bcPlace.addTo(map);
pneAmphitheatre.addTo(map);
heatLayer.addTo(map);

// -----------------------------
// LOAD ALL ROUTES FROM bus.routes.GEOJSON
// -----------------------------

fetch("/data/bus_routes.geojson")
  .then((response) => response.json())
  .then((geojson) => {
    geojson.features.forEach((feature) => {
      const props = feature.properties || {};

      // Build a clean route name
      const shortName = props.route_short_name || props.route_id || "Unknown";
      const longName = props.route_long_name || "";
      const routeName = longName
        ? `${shortName} — ${longName}`
        : `Route ${shortName}`;

      // Create a Leaflet layer for this route
      const routeLayer = L.geoJSON(feature, {
        style: {
          color: "#d81b60",
          weight: 4,
        },
      });

      // Add to overlay maps
      overlayMaps[routeName] = routeLayer;
    });

    // Rebuild the layer control
    L.control.layers(baseMaps, overlayMaps).addTo(map);
  })
  .catch((err) => console.error("Error loading routes:", err));
