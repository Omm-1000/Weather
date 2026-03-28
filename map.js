/* ============================================
   SKYPULSE — MAP.JS
   Live weather map via Leaflet + OWM tile layers
   ============================================ */

const API_KEY = "c3073ddfdc8c3988b1d465a221a16dd4";
let map, weatherLayer;

document.addEventListener("DOMContentLoaded", () => {
  setupAvatar();
  initMap();
});

function setupAvatar() {
  const user = localStorage.getItem("sp_user") || "User";
  const initials = user.slice(0, 2).toUpperCase();
  const av = document.getElementById("topbarAvatar");
  if (av) av.textContent = initials;
  const badge = document.getElementById("sidebarUser");
  if (badge) badge.innerHTML = `<span style="flex:1;font-size:0.82rem;">${user}</span>`;
}

function initMap() {
  map = L.map("mapContainer", {
    center: [20, 0],
    zoom: 2,
    zoomControl: true,
  });

  // Dark base tile layer
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19
  }).addTo(map);

  // Default weather overlay
  addWeatherLayer("temp_new");

  // Click to get city weather popup
  map.on("click", async (e) => {

  const { lat, lng } = e.latlng;

  try {

    /* ---------- 1. GET CITY NAME (Reverse Geocode) ---------- */
    const geoURL =
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lng}&limit=1&appid=${API_KEY}`;

    const geoRes = await fetch(geoURL);
    const geoData = await geoRes.json();

    const cityName =
      geoData[0]?.name ||
      `${lat.toFixed(2)}, ${lng.toFixed(2)}`;

    const country = geoData[0]?.country || "";

    /* ---------- 2. GET WEATHER ---------- */
    const weatherURL =
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`;

    const res = await fetch(weatherURL);
    const data = await res.json();

    if (!res.ok) return;

    /* ---------- 3. SHOW POPUP ---------- */
    L.popup({
      className: "weather-popup",
      maxWidth: 240
    })
      .setLatLng(e.latlng)
      .setContent(`
        <div style="font-family:DM Sans;color:#e8eaf0;">

          <strong style="font-size:1rem;font-family:Syne;">
            ${cityName}${country ? ", " + country : ""}
          </strong>

          <div style="margin:8px 0;display:flex;align-items:center;gap:8px;">
            <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}.png" width="40"/>
            <span style="font-size:1.4rem;font-weight:700;">
              ${Math.round(data.main.temp)}°C
            </span>
          </div>

          <div style="font-size:0.85rem;text-transform:capitalize;">
            ${data.weather[0].description}
          </div>

          <button
            style="margin-top:10px;width:100%;background:#38bdf8;color:#0f172a;border:none;border-radius:6px;padding:7px;cursor:pointer;font-weight:600;"
            onclick="selectCityFromMap('${cityName}')"
          >
            Select This City
          </button>

        </div>
      `)
      .openOn(map);

  } catch (err) {
    console.error(err);
  }
});
}

function addWeatherLayer(layer) {
  if (weatherLayer) map.removeLayer(weatherLayer);
  weatherLayer = L.tileLayer(
    `https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${API_KEY}`,
    { opacity: 0.7, maxZoom: 19 }
  ).addTo(map);
}

function changeMapLayer() {
  const layer = document.getElementById("mapLayer").value;
  addWeatherLayer(layer);
}

function selectCityFromMap(city) {
  if (!city) return;

  localStorage.setItem("sp_pendingCity", city);

  window.location.href = "dashboard.html";
}