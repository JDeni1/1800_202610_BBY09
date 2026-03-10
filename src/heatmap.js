//Center the map upon launch:
var map = L.map("map").setView([49.2827, -123.1207], 13);

//instantiate the 
var osmLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

var bcPlace = L.marker([49.276759, -123.112106]).bindPopup("<b>BC Place Stadium</b>");
var pneAmphitheatre = L.marker([49.2828, -123.0366]).bindPopup("<b>PNE Amphitheatre (Fan Festival)</b>");

//insert crowddata here:
var crowdData = [ 
  [49.2828, -123.0366, 50.0], //latitude, longitude, intensity.
  [49.283, -123.037, 0.7], 
  [49.2825, -123.036, 0.8],
  [49.2767, -123.1121, 0.9],
];

var heatLayer = L.heatLayer(crowdData, { radius: 25, blur: 15 });

var baseMaps = { OpenStreetMap: osmLayer };
var overlayMaps = {
  "BC Place": bcPlace,
  "PNE Fan Festival": pneAmphitheatre,
  "Crowd Density": heatLayer,
};

bcPlace.addTo(map);
pneAmphitheatre.addTo(map);
heatLayer.addTo(map);

// Add layer control WITHOUT bus routes
L.control.layers(baseMaps, overlayMaps).addTo(map);

