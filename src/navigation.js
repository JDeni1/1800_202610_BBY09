

const map = L.map('map').setView([49.276712, -123.112062], 13); // Vancouver

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    L.Routing.control({
      waypoints: [
        L.latLng(49.2827, -123.1207), // Start: Vancouver
        L.latLng(49.25, -123.1)       // End: Example point
      ],
      routeWhileDragging: true
    }).addTo(map);

