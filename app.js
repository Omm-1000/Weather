/* ============================================
   SKYPULSE — APP.JS
   Dashboard: current weather, forecast, chart,
              AQI, UV index, unit toggle, geolocation
   ============================================ */

const API_KEY = "c3073ddfdc8c3988b1d465a221a16dd4";

// Auto-search if redirected from history page or previous session
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("unitToggle").textContent =
    currentUnit === "metric" ? "°C" : "°F";

  const pending = localStorage.getItem("sp_pendingCity");
  if (pending) {
    localStorage.removeItem("sp_pendingCity");
    document.getElementById("city").value = pending;
    getWeather(pending);
  } else {
    const last = localStorage.getItem("sp_lastCity");
    if (last) {
      document.getElementById("city").value = last;
      getWeather(last);
    }
  }
});
let currentUnit = localStorage.getItem("sp_unit") || "metric";
let tempChart = null;

// ─── UNIT TOGGLE ─────────────────────────────
function toggleUnit() {
  currentUnit = currentUnit === "metric" ? "imperial" : "metric";
  localStorage.setItem("sp_unit", currentUnit);
  document.getElementById("unitToggle").textContent =
    currentUnit === "metric" ? "°C" : "°F";
  const lastCity = localStorage.getItem("sp_lastCity");
  if (lastCity) getWeather(lastCity);
}

// ─── QUICK SEARCH ────────────────────────────
function quickSearch(city) {
  document.getElementById("city").value = city;
  getWeather();
}

// ─── GEOLOCATION ─────────────────────────────
function getLocationWeather() {
  if (!navigator.geolocation) {
    showToast("Geolocation not supported.", "error");
    return;
  }
  showLoading(true);
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`;
      const data = await safeFetch(url);
      if (!data) return;
      renderAll(data, lat, lon);
      storeHistory(data.city.name);
      localStorage.setItem("sp_lastCity", data.city.name);
    },
    () => {
      showLoading(false);
      showToast("Location access denied.", "error");
    }
  );
}

// ─── MAIN WEATHER FETCH ──────────────────────
async function getWeather(cityOverride) {
  const city = cityOverride || document.getElementById("city").value.trim();
  if (!city) { showToast("Please enter a city name.", "info"); return; }

  showLoading(true);
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${currentUnit}`;
  const data = await safeFetch(url);
  if (!data) return;

  // Fetch current weather for extra fields (AQI etc.)
  const curUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${currentUnit}`;
  const curData = await safeFetch(curUrl);

  const { lat, lon } = data.city.coord;
  await renderAll(data, lat, lon, curData);
  storeHistory(city);
  localStorage.setItem("sp_lastCity", city);
}

// ─── RENDER ALL ──────────────────────────────
async function renderAll(data, lat, lon, curData) {
  showLoading(false);
  showResults(true);

  renderHero(data, curData);
  renderForecast(data);
  renderHourlyChart(data);
  renderDetails(data, curData);
  renderSun(data);
  await renderAQI(lat, lon);
  renderUV(curData);
}

// ─── HERO CARD ───────────────────────────────
function renderHero(data, curData) {
  const now     = data.list[0];
  const city    = data.city;
  const unit    = currentUnit === "metric" ? "°C" : "°F";
  const speedU  = currentUnit === "metric" ? "m/s" : "mph";

  document.getElementById("heroLocation").innerHTML =
    `<i class="fa-solid fa-location-dot"></i> ${city.name}, ${city.country}`;

  document.getElementById("heroTemp").textContent =
    `${Math.round(now.main.temp)}${unit}`;

  document.getElementById("heroDesc").textContent =
    now.weather[0].description;

  const date = new Date();
  document.getElementById("heroMeta").innerHTML = `
    <span><i class="fa-regular fa-calendar"></i>
      ${date.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
    </span>
    <span><i class="fa-regular fa-clock"></i>
      ${date.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}
    </span>`;

  document.getElementById("heroIcon").src =
    `https://openweathermap.org/img/wn/${now.weather[0].icon}@2x.png`;

  document.getElementById("heroStats").innerHTML = `
    <div class="stat-item"><strong>${Math.round(now.main.feels_like)}${unit}</strong><span>Feels Like</span></div>
    <div class="stat-item"><strong>${now.main.humidity}%</strong><span>Humidity</span></div>
    <div class="stat-item"><strong>${now.wind.speed} ${speedU}</strong><span>Wind</span></div>
    <div class="stat-item"><strong>${now.main.pressure} hPa</strong><span>Pressure</span></div>`;
}

// ─── FORECAST ────────────────────────────────
function renderForecast(data) {
  const daily = {};
  data.list.forEach(item => {
    const d = new Date(item.dt_txt);
    const key = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    if (!daily[key]) daily[key] = { items: [], day: d.toLocaleDateString("en-US", { weekday: "short" }) };
    daily[key].items.push(item);
  });

  const unit = currentUnit === "metric" ? "°C" : "°F";
  let html = "";
  Object.entries(daily).slice(0, 5).forEach(([label, obj]) => {
    const temps = obj.items.map(i => i.main.temp);
    const high  = Math.round(Math.max(...temps));
    const low   = Math.round(Math.min(...temps));
    const icon  = obj.items[Math.floor(obj.items.length / 2)].weather[0].icon;
    const desc  = obj.items[Math.floor(obj.items.length / 2)].weather[0].description;
    html += `
      <div class="day-card">
        <div class="day-name">${obj.day}</div>
        <div class="day-icon"><img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}"/></div>
        <div class="day-temp-high">${high}${unit}</div>
        <div class="day-temp-low">${low}${unit}</div>
        <div class="day-desc">${desc}</div>
      </div>`;
  });
  document.getElementById("weeklyForecast").innerHTML = html;
}

// ─── HOURLY CHART ────────────────────────────
function renderHourlyChart(data) {
  const hours  = data.list.slice(0, 8);
  const labels = hours.map(h => {
    const d = new Date(h.dt_txt);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  });
  const temps  = hours.map(h => Math.round(h.main.temp));
  const unit   = currentUnit === "metric" ? "°C" : "°F";

  const ctx = document.getElementById("tempChart").getContext("2d");
  if (tempChart) tempChart.destroy();

  tempChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: `Temperature (${unit})`,
        data: temps,
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56,189,248,0.08)",
        borderWidth: 2.5,
        pointBackgroundColor: "#38bdf8",
        pointRadius: 4,
        tension: 0.4,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1e2637",
          borderColor: "#38bdf8",
          borderWidth: 1,
          titleColor: "#8892a4",
          bodyColor: "#e8eaf0",
          padding: 10,
        }
      },
      scales: {
        x: {
          ticks: { color: "#8892a4", font: { size: 11 } },
          grid:  { color: "rgba(255,255,255,0.04)" }
        },
        y: {
          ticks: {
            color: "#8892a4",
            font: { size: 11 },
            callback: v => `${v}${unit}`
          },
          grid: { color: "rgba(255,255,255,0.04)" }
        }
      }
    }
  });
}

// ─── DETAIL GRID ─────────────────────────────
function renderDetails(data, curData) {
  const now     = data.list[0];
  const unit    = currentUnit === "metric" ? "°C" : "°F";
  const speedU  = currentUnit === "metric" ? "m/s" : "mph";
  const vis     = curData ? (curData.visibility / 1000).toFixed(1) + " km" : "N/A";
  const cloud   = now.clouds?.all ?? "N/A";

  document.getElementById("detailGrid").innerHTML = `
    <div class="detail-item"><i class="fa-solid fa-droplet"></i><strong>${now.main.humidity}%</strong><span>Humidity</span></div>
    <div class="detail-item"><i class="fa-solid fa-wind"></i><strong>${now.wind.speed} ${speedU}</strong><span>Wind Speed</span></div>
    <div class="detail-item"><i class="fa-solid fa-gauge"></i><strong>${now.main.pressure} hPa</strong><span>Pressure</span></div>
    <div class="detail-item"><i class="fa-solid fa-eye"></i><strong>${vis}</strong><span>Visibility</span></div>
    <div class="detail-item"><i class="fa-solid fa-cloud"></i><strong>${cloud}%</strong><span>Cloud Cover</span></div>
    <div class="detail-item"><i class="fa-solid fa-temperature-half"></i><strong>${Math.round(now.main.feels_like)}${unit}</strong><span>Feels Like</span></div>`;
}

// ─── SUNRISE / SUNSET ────────────────────────
function renderSun(data) {
  const { sunrise, sunset } = data.city;
  const fmt = ts => new Date(ts * 1000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  document.getElementById("sunDisplay").innerHTML = `
    <div class="sun-item">
      <div class="sun-icon">🌅</div>
      <div class="sun-time">${fmt(sunrise)}</div>
      <div class="sun-sub">Sunrise</div>
    </div>
    <div class="sun-divider"></div>
    <div class="sun-item">
      <div class="sun-icon">🌇</div>
      <div class="sun-time">${fmt(sunset)}</div>
      <div class="sun-sub">Sunset</div>
    </div>`;
}

// ─── AQI ─────────────────────────────────────
async function renderAQI(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
  const data = await safeFetch(url);
  if (!data) return;

  const aqi = data.list[0].main.aqi;
  const labels   = ["", "Good",     "Fair",    "Moderate", "Poor",    "Very Poor"];
  const colors   = ["", "#34d399",  "#a3e635", "#fbbf24",  "#f97316", "#f87171"];
  const descs    = ["",
    "Air quality is satisfactory — great day to be outside!",
    "Acceptable air quality with minor concerns for sensitive groups.",
    "Sensitive individuals may experience health effects.",
    "Everyone may start to experience health effects.",
    "Health warnings — everyone should limit outdoor exposure."
  ];

  const pct = ((aqi - 1) / 4) * 100;
  document.getElementById("aqiDisplay").innerHTML = `
    <div class="aqi-number" style="color:${colors[aqi]}">${aqi}</div>
    <span class="aqi-label" style="background:${colors[aqi]}20;color:${colors[aqi]}">${labels[aqi]}</span>
    <div class="aqi-bar">
      <div class="aqi-cursor" style="left:${pct}%"></div>
    </div>
    <p class="aqi-desc">${descs[aqi]}</p>`;
}

// ─── UV INDEX ────────────────────────────────
function renderUV(curData) {
  // OWM free tier doesn't expose UV directly in /weather,
  // so we derive a rough estimate from cloud cover + season
  const uv = curData
    ? estimateUV(curData.clouds.all, new Date().getMonth())
    : 0;

  const colors  = ["#34d399","#a3e635","#fbbf24","#f97316","#f87171"];
  const levels  = ["Low","Moderate","High","Very High","Extreme"];
  const band    = uv <= 2 ? 0 : uv <= 5 ? 1 : uv <= 7 ? 2 : uv <= 10 ? 3 : 4;
  const scaleHtml = colors.map(c => `<div style="background:${c}"></div>`).join("");

  document.getElementById("uvDisplay").innerHTML = `
    <div class="uv-number" style="color:${colors[band]}">${uv}</div>
    <div class="uv-scale">${scaleHtml}</div>
    <p class="uv-label" style="color:${colors[band]}">${levels[band]}</p>`;
}

function estimateUV(cloudPct, month) {
  const seasonal = [2,2,4,5,7,10,11,10,7,5,3,2];
  const base     = seasonal[month] ?? 5;
  return Math.max(1, Math.round(base * (1 - cloudPct / 100)));
}

// ─── HISTORY ─────────────────────────────────
function storeHistory(city) {
  let hist = JSON.parse(localStorage.getItem("sp_history")) || [];
  hist.push({ city, time: new Date().toISOString() });
  // Keep last 50 entries
  if (hist.length > 50) hist = hist.slice(-50);
  localStorage.setItem("sp_history", JSON.stringify(hist));
}

// ─── UTILS ───────────────────────────────────
function showLoading(on) {
  document.getElementById("loadingOverlay")?.classList.toggle("hidden", !on);
}
function showResults(on) {
  document.getElementById("welcomeState")?.classList.toggle("hidden", on);
  document.getElementById("resultsGrid")?.classList.toggle("hidden", !on);
}

async function safeFetch(url) {
  try {
    const res  = await fetch(url);
    const data = await res.json();
    if (!res.ok || (data.cod && data.cod !== 200 && data.cod !== "200")) {
      showLoading(false);
      showToast("City not found. Try another search.", "error");
      return null;
    }
    return data;
  } catch {
    showLoading(false);
    showToast("Network error. Please try again.", "error");
    return null;
  }
}