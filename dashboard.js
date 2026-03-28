/* ============================================
   SKYPULSE — DASHBOARD.JS
   ============================================ */

const API_KEY = "c3073ddfdc8c3988b1d465a221a16dd4";

document.addEventListener("DOMContentLoaded", () => {
  setupAvatar();

  // City selected from map or history
  const pendingCity = localStorage.getItem("sp_pendingCity");

  if (pendingCity) {
    searchWeather(pendingCity);
    localStorage.removeItem("sp_pendingCity");
  }
});

/* ---------- USER AVATAR ---------- */
function setupAvatar() {
  const user = localStorage.getItem("sp_user") || "User";
  const initials = user.slice(0, 2).toUpperCase();

  const av = document.getElementById("topbarAvatar");
  if (av) av.textContent = initials;

  const badge = document.getElementById("sidebarUser");
  if (badge)
    badge.innerHTML = `<span style="flex:1;font-size:0.82rem;">${user}</span>`;
}

/* ---------- SEARCH WEATHER ---------- */
async function searchWeather(city) {

  if (!city) return;

  try {

    const url =
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      alert("City not found");
      return;
    }

    updateUI(data);
    saveHistory(data.name);

  } catch (err) {
    console.error(err);
  }
}

/* ---------- UPDATE DASHBOARD UI ---------- */
function updateUI(data) {

  document.getElementById("cityName").textContent =
    `${data.name}, ${data.sys.country}`;

  document.getElementById("temp").textContent =
    `${Math.round(data.main.temp)}°C`;

  document.getElementById("desc").textContent =
    data.weather[0].description;

  document.getElementById("humidity").textContent =
    data.main.humidity + "%";

  document.getElementById("wind").textContent =
    data.wind.speed + " m/s";

  document.getElementById("feels").textContent =
    Math.round(data.main.feels_like) + "°C";

  document.getElementById("weatherIcon").src =
    `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
}

/* ---------- SAVE HISTORY ---------- */
function saveHistory(city) {

  let history =
    JSON.parse(localStorage.getItem("sp_history")) || [];

  history.unshift({
    city: city,
    time: new Date().toISOString()
  });

  // keep last 20 searches
  history = history.slice(0, 20);

  localStorage.setItem("sp_history", JSON.stringify(history));
}

/* ---------- SEARCH BUTTON ---------- */
function searchCity() {
  const city = document.getElementById("searchInput").value.trim();
  searchWeather(city);
}