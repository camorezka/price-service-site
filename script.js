const API_URL = "https://price-service-51a3.onrender.com";

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const user        = tg.initDataUnsafe?.user || {};
const TG_ID       = user.id        || 0;
const TG_USERNAME = user.username   || "user";

let selectedCategory = null;
let currentChart     = null;

// =====================
// Screen Manager
// =====================
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => {
    if (s.id === id) {
      s.classList.add("active");
      s.style.display = "flex";
      requestAnimationFrame(() => { s.style.opacity = "1"; s.style.pointerEvents = "all"; });
    } else {
      s.style.opacity = "0";
      s.style.pointerEvents = "none";
      setTimeout(() => { if (s.id !== id) { s.classList.remove("active"); s.style.display = "none"; } }, 350);
    }
  });
}

// =====================
// Toast
// =====================
function toast(msg, type = "") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 400); }, 3000);
}

// =====================
// Init
// =====================
window.addEventListener("load", async () => {
  setTimeout(async () => { await authUser(); }, 2200);
});

async function authUser() {
  try {
    const res = await fetch(`${API_URL}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: TG_ID, username: TG_USERNAME })
    });
    const data = await res.json();
    if (data.already_registered) {
      showCategoriesScreen();
    } else {
      showScreen("screen-tutorial");
    }
  } catch (e) {
    const seen = localStorage.getItem("pm_tutorial_seen");
    if (seen) showCategoriesScreen(); else showScreen("screen-tutorial");
  }
}

// =====================
// Tutorial
// =====================
let currentSlide = 0;
const TOTAL_SLIDES = 4;

function goToSlide(n) {
  document.querySelectorAll(".t-slide").forEach((s, i) => {
    s.classList.remove("active", "exit");
    if (i === n) s.classList.add("active");
    else if (i < n) s.classList.add("exit");
  });
  document.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("active", i === n));
  currentSlide = n;
}

document.getElementById("tutorial-next").addEventListener("click", () => {
  if (currentSlide < TOTAL_SLIDES - 1) {
    goToSlide(currentSlide + 1);
    if (currentSlide === TOTAL_SLIDES - 1) document.getElementById("tutorial-next").textContent = "Начать →";
  } else {
    finishTutorial();
  }
});
document.getElementById("tutorial-skip").addEventListener("click", finishTutorial);

function finishTutorial() {
  localStorage.setItem("pm_tutorial_seen", "1");
  showCategoriesScreen();
}

// =====================
// Categories
// =====================
function showCategoriesScreen() {
  document.getElementById("top-username").textContent = "@" + TG_USERNAME;
  showScreen("screen-categories");
}

document.querySelectorAll(".cat-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".cat-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    selectedCategory = card.dataset.cat;
    const input = document.getElementById("url-input");
    if (!input.value) input.placeholder = `Вставьте ссылку на ${selectedCategory}...`;
  });
});

document.getElementById("paste-btn").addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    document.getElementById("url-input").value = text;
    toast("Ссылка вставлена");
  } catch { toast("Разрешите доступ к буферу обмена"); }
});

document.getElementById("analyze-btn").addEventListener("click", analyzeProduct);
document.getElementById("url-input").addEventListener("keydown", e => { if (e.key === "Enter") analyzeProduct(); });

// =====================
// Analyzing
// =====================
const STEPS = [
  "Определяем платформу...",
  "Собираем данные о товаре...",
  "Анализируем историю цен...",
  "Считаем влияние курса $...",
  "Формируем рекомендации...",
  "Почти готово..."
];

function startAnalyzingAnimation() {
  const stepEl = document.getElementById("analyzing-step");
  const fillEl = document.getElementById("ap-fill");
  let i = 0;
  stepEl.textContent = STEPS[0];
  fillEl.style.width = "0%";
  const id = setInterval(() => {
    i++;
    if (i >= STEPS.length) { clearInterval(id); return; }
    stepEl.textContent = STEPS[i];
    fillEl.style.width = `${Math.round((i / STEPS.length) * 90)}%`;
  }, 900);
  return { stop: () => { clearInterval(id); fillEl.style.width = "100%"; } };
}

async function analyzeProduct() {
  const url = document.getElementById("url-input").value.trim();
  if (!url) { toast("Вставьте ссылку на товар", "error"); return; }
  if (!url.startsWith("http")) { toast("Ссылка должна начинаться с https://", "error"); return; }

  showScreen("screen-analyzing");
  const anim = startAnalyzingAnimation();

  try {
    const res = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, id: TG_ID })
    });
    if (!res.ok) throw new Error("Server error " + res.status);
    const json = await res.json();
    anim.stop();
    if (json.status !== "ok") { toast(json.message || "Ошибка анализа", "error"); showCategoriesScreen(); return; }
    renderResult(json.data);
    showScreen("screen-result");
  } catch (e) {
    anim.stop();
    toast("Не удалось получить данные. Попробуйте снова.", "error");
    showCategoriesScreen();
  }
}

// =====================
// Result
// =====================
function renderResult(d) {
  document.getElementById("result-platform-badge").textContent = (d.platform || "WEB").toUpperCase();
  document.getElementById("result-name").textContent = d.name || "Товар";
  document.getElementById("result-cat").textContent  = d.category || "товары";

  const price = d.current_price || 0;
  const priceUsd = d.price_usd || Math.round(price / 92);
  document.getElementById("price-value").textContent = formatPrice(price, d.currency || "RUB");
  document.getElementById("price-usd").textContent   = `≈ $${priceUsd.toLocaleString()}`;

  const rec   = (d.analytics?.recommendation || "подождать").toLowerCase();
  const recEl = document.getElementById("price-rec");
  recEl.className = "price-rec";
  const recTxt = document.getElementById("rec-text");
  if (rec.includes("купить") || rec.includes("отлич")) { recEl.classList.add("rec-buy");  recTxt.textContent = "Отличная цена!"; }
  else if (rec.includes("завышен") || rec.includes("высок")) { recEl.classList.add("rec-high"); recTxt.textContent = "Цена завышена"; }
  else { recEl.classList.add("rec-wait"); recTxt.textContent = "Подождать"; }

  renderChart(d.price_history || []);

  const fc = d.forecast || {};
  document.getElementById("fc-30").textContent     = fc.predicted_price_30d ? formatPrice(fc.predicted_price_30d, d.currency || "RUB") : "—";
  document.getElementById("fc-90").textContent     = fc.predicted_price_90d ? formatPrice(fc.predicted_price_90d, d.currency || "RUB") : "—";
  document.getElementById("best-time").textContent = fc.best_time_to_buy || "Нет данных";
  const dropPct = fc.drop_probability || 0;
  document.getElementById("drop-pct").textContent = `${dropPct}%`;
  document.getElementById("drop-fill").style.width = `${dropPct}%`;

  const an = d.analytics || {};
  document.getElementById("analytics-summary").textContent = an.summary    || "";
  document.getElementById("usd-impact-text").textContent   = an.usd_impact || "";

  const altsBlock = document.getElementById("alts-block");
  const altsList  = document.getElementById("alts-list");
  const alts      = d.alternatives || [];
  if (d.is_clothing_or_shoes && alts.length > 0) {
    altsBlock.style.display = "block";
    altsList.innerHTML = "";
    alts.forEach(alt => {
      const card = document.createElement("div");
      card.className = "alt-card";
      const q = encodeURIComponent(alt.image_query || alt.name);
      card.innerHTML = `
        <img class="alt-img" src="https://source.unsplash.com/80x80/?${q}" alt="${escHtml(alt.name)}" onerror="this.style.display='none'">
        <div class="alt-info">
          <div class="alt-name">${escHtml(alt.name)}</div>
          <div class="alt-store">${escHtml(alt.store || "")}</div>
          <div class="alt-price">${formatPrice(alt.price || 0, "RUB")}</div>
        </div>`;
      altsList.appendChild(card);
    });
  } else {
    altsBlock.style.display = "none";
  }
}

function formatPrice(val, currency = "RUB") {
  if (currency === "RUB") return val.toLocaleString("ru-RU") + " ₽";
  if (currency === "USD") return "$" + val.toLocaleString("en-US");
  return val.toLocaleString() + " " + currency;
}
function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// =====================
// Chart
// =====================
function renderChart(history) {
  const canvas = document.getElementById("price-chart");
  if (currentChart) { currentChart.destroy(); currentChart = null; }
  if (!history || history.length === 0) { canvas.style.display = "none"; return; }
  canvas.style.display = "block";

  const ctx      = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 140);
  gradient.addColorStop(0, "rgba(245,197,24,0.3)");
  gradient.addColorStop(1, "rgba(245,197,24,0)");

  currentChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: history.map(h => h.month),
      datasets: [{
        data: history.map(h => h.price),
        borderColor: "#F5C518",
        borderWidth: 2,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#F5C518",
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1C1C1F",
          borderColor: "rgba(245,197,24,0.3)",
          borderWidth: 1,
          titleColor: "#8A8780",
          bodyColor: "#F5C518",
          bodyFont: { family: "Syne", weight: "700", size: 15 },
          callbacks: { label: ctx => " " + formatPrice(ctx.raw) }
        }
      },
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#8A8780", font: { size: 11 } } },
        y: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#8A8780", font: { size: 11 }, callback: v => formatPrice(v) } }
      }
    }
  });
}

// =====================
// Navigation
// =====================
document.getElementById("back-btn").addEventListener("click", () => showCategoriesScreen());
document.getElementById("new-search-btn").addEventListener("click", () => {
  document.getElementById("url-input").value = "";
  document.querySelectorAll(".cat-card").forEach(c => c.classList.remove("selected"));
  selectedCategory = null;
  showCategoriesScreen();
});
