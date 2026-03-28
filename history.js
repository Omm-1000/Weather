/* ============================================
   SKYPULSE — HISTORY-PAGE.JS
   ============================================ */

let allHistory = [];

document.addEventListener("DOMContentLoaded", () => {
  loadHistory();
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

function loadHistory() {
  allHistory = JSON.parse(localStorage.getItem("sp_history")) || [];
  renderStats();
  renderHistory(allHistory);
}

function renderStats() {
  const total   = allHistory.length;
  const unique  = [...new Set(allHistory.map(h => h.city.toLowerCase()))].length;
  const today   = allHistory.filter(h => {
    const d = new Date(h.time);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  document.getElementById("historyStats").innerHTML = `
    <div class="stat-box">
      <div class="stat-box-icon" style="background:rgba(56,189,248,0.12);color:#38bdf8">
        <i class="fa-solid fa-magnifying-glass"></i>
      </div>
      <div class="stat-box-info">
        <strong>${total}</strong>
        <span>Total Searches</span>
      </div>
    </div>
    <div class="stat-box">
      <div class="stat-box-icon" style="background:rgba(129,140,248,0.12);color:#818cf8">
        <i class="fa-solid fa-city"></i>
      </div>
      <div class="stat-box-info">
        <strong>${unique}</strong>
        <span>Unique Cities</span>
      </div>
    </div>
    <div class="stat-box">
      <div class="stat-box-icon" style="background:rgba(52,211,153,0.12);color:#34d399">
        <i class="fa-regular fa-calendar"></i>
      </div>
      <div class="stat-box-info">
        <strong>${today}</strong>
        <span>Today's Searches</span>
      </div>
    </div>`;
}

function renderHistory(list) {

  const grid = document.getElementById("historyGrid");
  const empty = document.getElementById("historyEmpty");

  if (!grid || !empty) return;

  if (!list.length) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  grid.innerHTML = list.map(item => `
    <div class="history-card">

      <div>
        <div class="city-name">${item.city}</div>
        <div class="search-time">${formatTime(item.time)}</div>
      </div>

      <div>
        <button class="mini-btn"
          onclick="searchAgain('${item.city}')">
          🔎 Search
        </button>

        <button class="mini-btn danger"
          onclick="deleteItem('${item.city}','${item.time}')">
          🗑 Delete
        </button>
      </div>

    </div>
  `).join("");
}

function filterHistory() {
  const q    = document.getElementById("historySearch").value.toLowerCase();
  const sort = document.getElementById("historySort").value;

  let filtered = [...allHistory].filter(h => h.city.toLowerCase().includes(q));

  if (sort === "oldest") {
    filtered.sort((a, b) => new Date(a.time) - new Date(b.time));
  } else if (sort === "az") {
    filtered.sort((a, b) => a.city.localeCompare(b.city));
  } else {
    filtered.sort((a, b) => new Date(b.time) - new Date(a.time));
  }

  renderHistory(filtered);
}

function deleteItem(city, time) {

  allHistory = allHistory.filter(
    h => !(h.city === city && h.time === time)
  );

  localStorage.setItem(
    "sp_history",
    JSON.stringify(allHistory)
  );

  renderStats();
  filterHistory();

  showToast("Entry removed");
}

function clearHistory() {
  if (!confirm("Clear all search history?")) return;
  localStorage.removeItem("sp_history");
  allHistory = [];
  renderStats();
  renderHistory([]);
  showToast("History cleared.", "info");
}

function searchAgain(city) {
  localStorage.setItem("sp_pendingCity", city);
  window.location.href = "dashboard.html";
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
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