/* ============================================
   SKYPULSE — AUTH.JS
   Handles: signup, login, logout, session,
            tab switching, password strength
   ============================================ */

// --- SESSION GUARD ---
(function () {
  const protectedPages = ["dashboard.html", "history.html", "compare.html", "map.html"];
  const currentPage = window.location.pathname.split("/").pop();
  if (protectedPages.includes(currentPage)) {
    if (localStorage.getItem("sp_loggedIn") !== "true") {
      window.location.href = "index.html";
    }
  }
  // Set user avatars & badges
  document.addEventListener("DOMContentLoaded", () => {
    const user = localStorage.getItem("sp_user") || "User";
    const initials = user.slice(0, 2).toUpperCase();

    const avatar = document.getElementById("topbarAvatar");
    if (avatar) avatar.textContent = initials;

    const badge = document.getElementById("sidebarUser");
    if (badge) {
      badge.innerHTML = `<span style="flex:1;font-size:0.82rem;">${user}</span>`;
    }

    setGreeting();
  });
})();

// --- GREETING ---
function setGreeting() {
  const el = document.getElementById("timeGreeting");
  if (!el) return;
  const h = new Date().getHours();
  el.textContent = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
}

// --- TAB SWITCHER ---
function showTab(tab) {
  const loginTab  = document.getElementById("loginTab");
  const signupTab = document.getElementById("signupTab");
  const indicator = document.querySelector(".tab-indicator");
  const btns       = document.querySelectorAll(".tab-btn");

  btns.forEach(b => b.classList.remove("active"));

  if (tab === "login") {
    loginTab.classList.add("active");
    signupTab.classList.remove("active");
    btns[0].classList.add("active");
    if (indicator) indicator.style.transform = "translateX(0)";
  } else {
    signupTab.classList.add("active");
    loginTab.classList.remove("active");
    btns[1].classList.add("active");
    if (indicator) indicator.style.transform = "translateX(100%)";
  }
}

// --- PASSWORD VISIBILITY ---
function togglePass(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon  = btn.querySelector("i");
  if (input.type === "password") {
    input.type = "text";
    icon.className = "fa-regular fa-eye-slash";
  } else {
    input.type = "password";
    icon.className = "fa-regular fa-eye";
  }
}

// --- PASSWORD STRENGTH ---
const signupPass = document.getElementById("signupPass");
if (signupPass) {
  signupPass.addEventListener("input", function () {
    const val = this.value;
    const fill  = document.getElementById("strengthFill");
    const label = document.getElementById("strengthLabel");
    if (!fill) return;

    let score = 0;
    if (val.length >= 8)            score++;
    if (/[A-Z]/.test(val))          score++;
    if (/[0-9]/.test(val))          score++;
    if (/[^A-Za-z0-9]/.test(val))   score++;

    const levels = [
      { w: "0%",   c: "transparent", t: "" },
      { w: "25%",  c: "#f87171",     t: "Weak" },
      { w: "50%",  c: "#fbbf24",     t: "Fair" },
      { w: "75%",  c: "#38bdf8",     t: "Good" },
      { w: "100%", c: "#34d399",     t: "Strong" },
    ];
    const lvl = levels[score] || levels[0];
    fill.style.width      = lvl.w;
    fill.style.background = lvl.c;
    label.textContent     = lvl.t;
    label.style.color     = lvl.c;
  });
}

// --- SIGNUP ---
function signup(e) {
  if (e) e.preventDefault();
  const user  = document.getElementById("signupUser").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const pass  = document.getElementById("signupPass").value;
  const errEl = document.getElementById("signupError");

  if (!user || !email || !pass) {
    showFormError(errEl, "Please fill in all fields.");
    return;
  }
  if (pass.length < 6) {
    showFormError(errEl, "Password must be at least 6 characters.");
    return;
  }

  localStorage.setItem("sp_user",  user);
  localStorage.setItem("sp_email", email);
  localStorage.setItem("sp_pass",  pass);

  showToast("Account created! Please sign in.", "success");
  setTimeout(() => showTab("login"), 800);
}

// --- LOGIN ---
function login(e) {
  if (e) e.preventDefault();
  const user   = document.getElementById("loginUser").value.trim();
  const pass   = document.getElementById("loginPass").value;
  const errEl  = document.getElementById("loginError");
  const remember = document.getElementById("rememberMe")?.checked;

  if (!user || !pass) {
    showFormError(errEl, "Please enter both username and password.");
    return;
  }
  if (
    user === localStorage.getItem("sp_user") &&
    pass === localStorage.getItem("sp_pass")
  ) {
    localStorage.setItem("sp_loggedIn", "true");
    if (remember) localStorage.setItem("sp_remember", "true");
    showToast("Welcome back, " + user + "! 🎉", "success");
    setTimeout(() => (window.location.href = "dashboard.html"), 500);
  } else {
    showFormError(errEl, "Invalid username or password.");
    const card = document.querySelector(".auth-card");
    card.style.animation = "none";
    card.offsetHeight;
    card.style.animation = "shake 0.4s ease";
  }
}

// Add shake keyframes dynamically
const shakeStyle = document.createElement("style");
shakeStyle.textContent = `
  @keyframes shake {
    0%,100%{ transform:translateX(0); }
    25%{ transform:translateX(-8px); }
    75%{ transform:translateX(8px); }
  }
`;
document.head.appendChild(shakeStyle);

// --- LOGOUT ---
function logout() {
  localStorage.removeItem("sp_loggedIn");
  showToast("Logged out. See you soon!", "info");
  setTimeout(() => (window.location.href = "index.html"), 500);
}

// --- HELPERS ---
function showFormError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 4000);
}

function showToast(msg, type = "info") {
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type] || "ℹ️"}</span><span>${msg}</span>`;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity 0.4s"; }, 2800);
  setTimeout(() => t.remove(), 3200);
}

// --- SIDEBAR TOGGLE ---
function toggleSidebar() {
  document.getElementById("sidebar")?.classList.toggle("open");
}