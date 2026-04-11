/**-------------
 * Searchbar.js
 * -------------
 * Searchbar with autocomplete using maptiler geocoding api
 * Behaves similar to google maps: debounced input, POI-first
 * sorting, clickable suggestions and map fly-to behaviour.
 */

import maplibregl from "maplibre-gl";

let searchPin = null;

/**---------------------------
 * Debounce helper
 * ---------------------------
 * Prevents firing the API on every keystroke, Instead,
 * waits until the userstops typing for X ms (Google maps does this.)
 */

function debounce(fn, delay = 250) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

/**---------------------
 * initSearchBar(map)
 * ---------------------
 * Sets up the search bar, autocomplete dropdown, and click
 * behaviour for selecting a location.
 */
export function initSearchBar(map) {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  /**---------------------
   * const suggestionBox
   * ---------------------
   * Create the suggestion dropdown <ul> dynamically.
   */
  const suggestionBox = document.createElement("ul");
  suggestionBox.id = "search-suggestions";
  document.getElementById("search-bar").appendChild(suggestionBox);

/**--------------------------
 * Input listener (debounced)
 * --------------------------
 * Runs the geocoding request only after the user pauses typing.
 */

  searchInput.addEventListener(
    "input",
    debounce(async () => {
      const query = searchInput.value.trim();
      suggestionBox.innerHTML = ""; //Clear old suggestions

      //require a minimum of two characters while searching
      if (query.length < 2) {
        suggestionBox.classList.remove("visible");
        return;
      }

      /**------------------------------
       * maptiler geocoding API request
       * ------------------------------
       * 1. autocomplete=true gives google maps style suggestions
       * 2. types=poi, address ensures landmarks + addresses
       */
      const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(
        query
      )}.json?key=${import.meta.env.VITE_MAPTILER_KEY}&limit=8&autocomplete=true&types=poi,address`;

      const res = await fetch(url);
      const data = await res.json();

      //if no results then hide the dropdown
      if (!data.features || data.features.length === 0) {
        suggestionBox.classList.remove("visible");
        return;
      }
/**
 * Sort results so that POIS(BC Place, Science World)
 * appear above exact street addresses.
 */
      const sorted = data.features.sort((a, b) => {
        const aIsPOI = a.place_type.includes("poi");
        const bIsPOI = b.place_type.includes("poi");
        return aIsPOI === bIsPOI ? 0 : aIsPOI ? -1 : 1;
      });
/**
 * build each suggestion, <li>
 */
      sorted.forEach((feature) => {
        const li = document.createElement("li");
// display title + subtitle (google maps style)
        li.innerHTML = `
          <strong>${feature.text}</strong><br>
          <small>${feature.place_name}</small>
        `;

        li.addEventListener("click", () => {
          map.flyTo({ center: feature.center, zoom: 15 });
          searchInput.value = feature.place_name;
          suggestionBox.innerHTML = "";
          suggestionBox.classList.remove("visible");

          if (searchPin) searchPin.remove();
/**
 * When a suggestion is clicked:
 * 1. fly to the location
 * 2. drop a marker
 * 3. fill the input with the full place name
 * 4. hide the dropdown.
 */
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
    }, 250)
  );

  searchInput.addEventListener("blur", () => {
    setTimeout(() => suggestionBox.classList.remove("visible"), 150);
  });

  document.addEventListener("click", (e) => {
    if (!document.getElementById("search-bar").contains(e.target)) {
      suggestionBox.innerHTML = "";
      suggestionBox.classList.remove("visible");
    }
  });
}
