/* ============================================
   SKYPULSE — COMPARE.JS
   ============================================ */

const API_KEY = "c3073ddfdc8c3988b1d465a221a16dd4";
let currentUnit = localStorage.getItem("sp_unit") || "metric";

document.addEventListener("DOMContentLoaded", () => {
  setupAvatar();
});

function setupAvatar() {
  const user = localStorage.getItem("sp_user") || "User";
  const initials = user.slice(0, 2).toUpperCase();
  const av = document.getElementById("topbarAvatar");
  if (av) av.textContent = initials;
  const badge = document.getElementById("sidebarUser");
  if (badge) badge.innerHTML = `<span style="flex:1;font-size:0.82rem;">${user}</span>`;
}

async function compareCities() {
  const c1 = document.getElementById("compareCity1").value.trim();
  const c2 = document.getElementById("compareCity2").value.trim();

  if (!c1 || !c2) {
    showToast("Please enter both cities.", "error");
    return;
  }

  document.getElementById("compareEmpty").classList.add("hidden");
  document.getElementById("compareResults").classList.add("hidden");
  document.getElementById("compareLoading").classList.remove("hidden");

  const [d1, d2] = await Promise.all([fetchWeather(c1), fetchWeather(c2)]);

  document.getElementById("compareLoading").classList.add("hidden");

  if (!d1 || !d2) return;

  document.getElementById("compareResults").classList.remove("hidden");
  renderCompareCards(d1, d2);
  renderCompareTable(d1, d2);
}

async function fetchWeather(city) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${currentUnit}`;
    const res  = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      showToast(`"${city}" not found.`, "error");
      return null;
    }
    return data;
  } catch {
    showToast("Network error.", "error");
    return null;
  }
}

function renderCompareCards(d1, d2) {
  const unit = currentUnit === "metric" ? "°C" : "°F";
  const card = (d) => `
    <div class="compare-city-card card">
      <h2><i class="fa-solid fa-location-dot" style="color:var(--accent)"></i> ${d.name}, ${d.sys.country}</h2>
      <img src="https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png" alt="${d.weather[0].description}"/>
      <div class="big-temp">${Math.round(d.main.temp)}${unit}</div>
      <p style="color:var(--text-muted);text-transform:capitalize;margin-top:8px;">${d.weather[0].description}</p>
    </div>`;
  document.getElementById("compareCards").innerHTML = card(d1) + card(d2);
}

function renderCompareTable(d1, d2) {
  const unit   = currentUnit === "metric" ? "°C" : "°F";
  const speedU = currentUnit === "metric" ? "m/s" : "mph";

  const rows = [
    {
      label:  "Temperature",
      v1:     `${Math.round(d1.main.temp)}${unit}`,
      v2:     `${Math.round(d2.main.temp)}${unit}`,
      raw1:   d1.main.temp,
      raw2:   d2.main.temp,
      winner: "higher"
    },
    {
      label:  "Feels Like",
      v1:     `${Math.round(d1.main.feels_like)}${unit}`,
      v2:     `${Math.round(d2.main.feels_like)}${unit}`,
      raw1:   d1.main.feels_like,
      raw2:   d2.main.feels_like,
      winner: "higher"
    },
    {
      label:  "Humidity",
      v1:     `${d1.main.humidity}%`,
      v2:     `${d2.main.humidity}%`,
      raw1:   d1.main.humidity,
      raw2:   d2.main.humidity,
      winner: "lower"
    },
    {
      label:  "Wind Speed",
      v1:     `${d1.wind.speed} ${speedU}`,
      v2:     `${d2.wind.speed} ${speedU}`,
      raw1:   d1.wind.speed,
      raw2:   d2.wind.speed,
      winner: "lower"
    },
    {
      label:  "Pressure",
      v1:     `${d1.main.pressure} hPa`,
      v2:     `${d2.main.pressure} hPa`,
      raw1:   d1.main.pressure,
      raw2:   d2.main.pressure,
      winner: "higher"
    },
    {
      label:  "Cloud Cover",
      v1:     `${d1.clouds.all}%`,
      v2:     `${d2.clouds.all}%`,
      raw1:   d1.clouds.all,
      raw2:   d2.clouds.all,
      winner: "lower"
    },
    {
      label:  "Visibility",
      v1:     `${(d1.visibility / 1000).toFixed(1)} km`,
      v2:     `${(d2.visibility / 1000).toFixed(1)} km`,
      raw1:   d1.visibility,
      raw2:   d2.visibility,
      winner: "higher"
    },
  ];

  const rowsHtml = rows.map(r => {
    const c1wins = r.winner === "higher" ? r.raw1 >= r.raw2 : r.raw1 <= r.raw2;
    const c2wins = r.winner === "higher" ? r.raw2 >= r.raw1 : r.raw2 <= r.raw1;
    const tied   = r.raw1 === r.raw2;
    return `
      <tr>
        <td>${r.label}</td>
        <td class="${!tied && c1wins ? 'winner' : ''}">${r.v1} ${!tied && c1wins ? "✓" : ""}</td>
        <td class="${!tied && c2wins ? 'winner' : ''}">${r.v2} ${!tied && c2wins ? "✓" : ""}</td>
      </tr>`;
  }).join("");

  document.getElementById("compareTable").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>${d1.name}</th>
          <th>${d2.name}</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>`;
}

function showToast(msg, type = "info") {
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity 0.4s"; }, 2800);
  setTimeout(() => t.remove(), 3200);
}