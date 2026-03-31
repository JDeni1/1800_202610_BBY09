// ------------------------------------------------------------
// searchBar.js
// ------------------------------------------------------------
import maplibregl from "maplibre-gl";

let searchPin = null;

export function initSearchBar(map) {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  const suggestionBox = document.createElement("ul");
  suggestionBox.id = "search-suggestions";
  document.getElementById("search-bar").appendChild(suggestionBox);

  // Geocoding fetch on input
  searchInput.addEventListener("input", async () => {
    const query = searchInput.value.trim();
    suggestionBox.innerHTML = "";

    if (query.length < 3) {
      suggestionBox.classList.remove("visible");
      return;
    }

    const res = await fetch(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${import.meta.env.VITE_MAPTILER_KEY}`
    );
    const data = await res.json();

    data.features.forEach((feature) => {
      const li = document.createElement("li");
      li.textContent = feature.place_name;
      li.addEventListener("click", () => {
        map.flyTo({ center: feature.center, zoom: 14 });
        searchInput.value = feature.place_name;
        suggestionBox.innerHTML = "";
        suggestionBox.classList.remove("visible");

        if (searchPin) searchPin.remove();

        searchPin = new maplibregl.Marker({ color: "#1E90FF" })
          .setLngLat(feature.center)
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(
              `<strong>${feature.place_name}</strong>`
            )
          )
          .addTo(map);
      });
      suggestionBox.appendChild(li);
    });

    suggestionBox.classList.add("visible");
  });

  // Hide on blur
  searchInput.addEventListener("blur", () => {
    setTimeout(() => suggestionBox.classList.remove("visible"), 150);
  });

  // Hide on outside click
  document.addEventListener("click", (e) => {
    if (!document.getElementById("search-bar").contains(e.target)) {
      suggestionBox.innerHTML = "";
      suggestionBox.classList.remove("visible");
    }
  });
}