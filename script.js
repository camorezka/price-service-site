"use strict";

// Константы API и глобальные переменные
var API_URL = "https://price-service-51a3.onrender.com";

var tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
if (tg) {
  tg.ready();
  tg.expand();
}

var tgUser = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) ? tg.initDataUnsafe.user : {};
var TG_ID = tgUser.id || 0;
var TG_NAME = tgUser.username || "user";
var TG_FIRST = tgUser.first_name || "";
var TG_LAST = tgUser.last_name || "";
var TG_LANG = tgUser.language_code || "";
var TG_PLATFORM = (tg && tg.platform) ? tg.platform : (navigator.platform || "");

var selExchange = null;
var selCoin = null;
var alertPct = 5;
var tutIdx = 0;
var activeChart = null;
var TUT_CNT = 4;
var anTimer = null;
var anIdx = 0;

var EXCHANGES = [
  { id: "binance", label: "Binance", icon: "🟡" },
  { id: "bybit", label: "Bybit", icon: "🔶" },
  { id: "okx", label: "OKX", icon: "⚫" },
  { id: "kucoin", label: "KuCoin", icon: "🟢" },
  { id: "coinbase", label: "Coinbase", icon: "🔵" },
  { id: "kraken", label: "Kraken", icon: "🟣" },
  { id: "htx", label: "HTX", icon: "🔷" },
  { id: "gate", label: "Gate.io", icon: "🔴" },
  { id: "mexc", label: "MEXC", icon: "🟤" }
];

var COINS = [
  { sym: "BTC", name: "Bitcoin", icon: "₿" },
  { sym: "ETH", name: "Ethereum", icon: "Ξ" },
  { sym: "BNB", name: "BNB", icon: "🔶" },
  { sym: "SOL", name: "Solana", icon: "◎" },
  { sym: "XRP", name: "XRP", icon: "✕" },
  { sym: "ADA", name: "Cardano", icon: "₳" },
  { sym: "DOGE", name: "Dogecoin", icon: "Ð" },
  { sym: "TON", name: "Toncoin", icon: "💎" },
  { sym: "AVAX", name: "Avalanche", icon: "🔺" },
  { sym: "DOT", name: "Polkadot", icon: "●" },
  { sym: "MATIC", name: "Polygon", icon: "⬡" },
  { sym: "LINK", name: "Chainlink", icon: "🔗" },
  { sym: "UNI", name: "Uniswap", icon: "🦄" },
  { sym: "LTC", name: "Litecoin", icon: "Ł" },
  { sym: "ATOM", name: "Cosmos", icon: "⚛" },
  { sym: "NEAR", name: "NEAR", icon: "Ⓝ" },
  { sym: "OP", name: "Optimism", icon: "🔴" },
  { sym: "ARB", name: "Arbitrum", icon: "🔵" },
  { sym: "APT", name: "Aptos", icon: "◈" },
  { sym: "SUI", name: "Sui", icon: "💧" },
  { sym: "PEPE", name: "Pepe", icon: "🐸" },
  { sym: "WIF", name: "dogwifhat", icon: "🐶" },
  { sym: "TRX", name: "TRON", icon: "◻" },
  { sym: "FLOKI", name: "Floki", icon: "🌊" }
];

var AN_STEPS = [
  "Подключаемся к бирже...",
  "Получаем актуальную цену...",
  "Анализируем рынок...",
  "Считаем прогноз ИИ...",
  "Готовим отчет..."
];

/* ── PIXEL CANVAS ── */
(function () {
  var cv = document.getElementById("pixel-canvas");
  if (!cv) return;
  var ctx = cv.getContext("2d");
  var S = 200;
  cv.width = cv.height = S;
  var G = 6,
      COLS = Math.floor(S / G);
  var YACC = "#F5C518";
  var DIM = ["#3A2E00", "#2A2200", "#1A1600"];
  var px = [];
  for (var r = 0; r < COLS; r++) {
    for (var c = 0; c < COLS; c++) {
      var d = Math.sqrt(Math.pow(c - COLS, 2) + Math.pow(r, 2));
      var prob = Math.max(0, 0.6 - d * 0.042);
      if (Math.random() < prob) {
        px.push({
          x: c * G,
          y: r * G,
          col: Math.random() < 0.18 ? YACC : DIM[Math.floor(Math.random() * DIM.length)],
          alpha: 0.08 + Math.random() * 0.55,
          spd: 0.002 + Math.random() * 0.005,
          phase: Math.random() * Math.PI * 2,
          sz: Math.random() < 0.1 ? G * 2 : G
        });
      }
    }
  }
  var t = 0;
  function draw() {
    ctx.clearRect(0, 0, S, S);
    t += 0.016;
    for (var i = 0; i < px.length; i++) {
      var p = px[i];
      ctx.globalAlpha = p.alpha * (0.5 + 0.5 * Math.sin(t * p.spd * 60 + p.phase));
      ctx.fillStyle = p.col;
      ctx.fillRect(p.x + 1, p.y + 1, p.sz - 2, p.sz - 2);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ── SCREEN MANAGER ── */
function showScreen(id) {
  var screens = document.querySelectorAll(".screen");
  for (var i = 0; i < screens.length; i++) {
    var s = screens[i];
    if (s.id === id) {
      s.style.display = "flex";
      s.classList.remove("out");
      (function (el) {
        requestAnimationFrame(function () {
          el.classList.add("active");
        });
      })(s);
    } else if (s.classList.contains("active")) {
      s.classList.add("out");
      s.classList.remove("active");
      (function (el) {
        setTimeout(function () {
          if (!el.classList.contains("active")) el.style.display = "none";
        }, 300);
      })(s);
    }
  }
}

/* ── TOAST ── */
var toastTmr = null;
function toast(msg, type) {
  var el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.className = "toast show " + (type || "");
  if (toastTmr) clearTimeout(toastTmr);
  toastTmr = setTimeout(function () {
    el.classList.remove("show");
  }, 3000);
}

/* ── setText helper ── */
function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ── INIT ── */
window.addEventListener("load", function () {
  buildChips();
  buildTutDots();
  var statEl = document.getElementById("load-status");
  var msgs = ["Подключение...", "Авторизация...", "Загрузка данных..."];
  for (var i = 0; i < msgs.length; i++) {
    (function (m, delay) {
      setTimeout(function () {
        if (statEl) statEl.textContent = m;
      }, delay);
    })(msgs[i], 300 + i * 650);
  }
  setTimeout(authUser, 2400);
});

function authUser() {
  fetch(API_URL + "/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: TG_ID,
      username: TG_NAME,
      first_name: TG_FIRST,
      last_name: TG_LAST,
      language: TG_LANG,
      platform: TG_PLATFORM
    })
  })
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      if (data.already_registered) {
        showExchange();
      } else {
        showScreen("screen-tutorial");
      }
    })
    .catch(function () {
      if (localStorage.getItem("cs_done")) {
        showExchange();
      } else {
        showScreen("screen-tutorial");
      }
    });
}

/* ── TUTORIAL ── */
function buildTutDots() {
  var wrap = document.getElementById("tut-dots");
  if (!wrap) return;
  wrap.innerHTML = "";
  for (var i = 0; i < TUT_CNT; i++) {
    var s = document.createElement("span");
    if (i === 0) s.classList.add("active");
    (function (idx) {
      s.addEventListener("click", function () {
        setTutSlide(idx);
      });
    })(i);
    wrap.appendChild(s);
  }
}
function setTutSlide(n) {
  var slides = document.querySelectorAll(".tut-slide");
  var dots = document.querySelectorAll("#tut-dots span");
  for (var i = 0; i < slides.length; i++) {
    slides[i].classList.remove("active", "prev");
    if (i === n) slides[i].classList.add("active");
    else if (i < n) slides[i].classList.add("prev");
  }
  for (var j = 0; j < dots.length; j++) dots[j].classList.toggle("active", j === n);
  tutIdx = n;
  var btn = document.getElementById("tut-next");
  if (btn) btn.textContent = n === TUT_CNT - 1 ? "Начать →" : "Далее";
}
document.getElementById("tut-next").addEventListener("click", function () {
  if (tutIdx < TUT_CNT - 1) {
    setTutSlide(tutIdx + 1);
  } else {
    finishTut();
  }
});
document.getElementById("tut-skip").addEventListener("click", function () {
  finishTut();
});
function finishTut() {
  localStorage.setItem("cs_done", "1");
  showExchange();
}

/* ── BUILD CHIPS ── */
function buildChips() {
  var ec = document.getElementById("exchange-chips");
  if (ec) {
    for (var i = 0; i < EXCHANGES.length; i++) {
      var e = EXCHANGES[i],
        el = document.createElement("div");
      el.className = "chip";
      el.dataset.id = e.id;
      el.innerHTML = '<span class="chip-icon">' + e.icon + "</span>" + e.label;
      (function (eid) {
        el.addEventListener("click", function () {
          selectExchange(eid);
        });
      })(e.id);
      ec.appendChild(el);
    }
  }
  var cc = document.getElementById("coin-chips");
  if (cc) {
    for (var j = 0; j < COINS.length; j++) {
      var co = COINS[j],
        cel = document.createElement("div");
      cel.className = "chip";
      cel.dataset.sym = co.sym;
      cel.innerHTML =
        '<span class="chip-icon">' + co.icon + "</span>" + co.sym + ' <span style="opacity:.45;font-size:11px">' + co.name + "</span>";
      (function (sym) {
        cel.addEventListener("click", function () {
          selectCoin(sym);
        });
      })(co.sym);
      cc.appendChild(cel);
    }
  }
}
function selectExchange(id) {
  selExchange = id;
  document.querySelectorAll("#exchange-chips .chip").forEach(function (c) {
    c.classList.toggle("selected", c.dataset.id === id);
  });
  var btn = document.getElementById("exchange-next");
  if (btn) btn.disabled = false;
}
function selectCoin(sym) {
  selCoin = sym;
  document.querySelectorAll("#coin-chips .chip").forEach(function (c) {
    c.classList.toggle("selected", c.dataset.sym === sym);
  });
  var btn = document.getElementById("coin-next");
  if (btn) btn.disabled = false;
  var coin = COINS.find(function (c) {
    return c.sym === sym;
  });
  var orb = document.getElementById("orb-core");
  if (orb) orb.textContent = coin ? coin.icon : sym[0];
}

/* ── SEARCH ── */
document
  .getElementById("exchange-search")
  .addEventListener("input", function () {
    var q = this.value.toLowerCase();
    document.querySelectorAll("#exchange-chips .chip").forEach(function (c) {
      c.classList.toggle("hidden", c.textContent.toLowerCase().indexOf(q) === -1);
    });
  });
document
  .getElementById("coin-search")
  .addEventListener("input", function () {
    var q = this.value.toLowerCase(),
      first = null;
    document.querySelectorAll("#coin-chips .chip").forEach(function (c) {
      var m = c.textContent.toLowerCase().indexOf(q) !== -1;
      c.classList.toggle("hidden", !m);
      if (m && !first) first = c;
    });
    if (q && first && !selCoin) first.click();
  });

/* ── NAV ── */
function showExchange() {
  showScreen("screen-exchange");
}
document
  .getElementById("exchange-next")
  .addEventListener("click", function () {
    if (selExchange) showScreen("screen-coin");
  });
document
  .getElementById("coin-back")
  .addEventListener("click", function () {
    showScreen("screen-exchange");
  });
document
  .getElementById("res-back")
  .addEventListener("click", function () {
    showScreen("screen-coin");
  });

/* ── ALERT PCT ── */
document
  .getElementById("pct-minus")
  .addEventListener("click", function () {
    if (alertPct > 1) {
      alertPct--;
      updatePct();
    }
  });
document
  .getElementById("pct-plus")
  .addEventListener("click", function () {
    if (alertPct < 50) {
      alertPct++;
      updatePct();
    }
  });
function updatePct() {
  setText("pct-val", alertPct);
}

/* ── ANALYZE ── */
document.getElementById("coin-next").addEventListener("click", doAnalyze);

function startAnimate() {
  var fill = document.getElementById("an-fill"),
    sub = document.getElementById("an-step");
  if (!fill || !sub) return;
  anIdx = 0;
  fill.style.width = "10%";
  sub.textContent = AN_STEPS[0];
  anTimer = setInterval(function () {
    anIdx++;
    if (anIdx < AN_STEPS.length) {
      sub.textContent = AN_STEPS[anIdx];
      fill.style.width = Math.min(88, Math.round((anIdx + 1) / AN_STEPS.length * 100)) + "%";
    }
    if (anIdx >= AN_STEPS.length) clearInterval(anTimer);
  }, 1000);
}
function stopAnimate() {
  clearInterval(anTimer);
  var fill = document.getElementById("an-fill");
  if (fill) fill.style.width = "100%";
}

function doAnalyze() {
  if (!selExchange || !selCoin) {
    toast("Выбери биржу и монету", "warn");
    return;
  }
  showScreen("screen-analyzing");
  startAnimate();

  fetch(API_URL + "/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      symbol: selCoin,
      exchange: selExchange,
      id: TG_ID,
      alert_pct: alertPct
    }),
  })
    .then(function (res) {
      return res.json();
    })
    .then(function (json) {
      stopAnimate();
      if (!json || json.status !== "ok" || !json.data) {
        showExchange();
        setTimeout(function () {
          toast(json && json.message ? json.message : "Ошибка анализа", "err");
        }, 350);
        return;
      }
      // Вызов функции рендера результата
      renderResult(json.data);
      showScreen("screen-result");
    })
    .catch(function () {
      stopAnimate();
      showExchange();
      setTimeout(function () {
        toast("Сервер не отвечает. Попробуйте позже.", "err");
      }, 350);
    });
}

/* ── FORMAT HELPERS ── */
function fmtUSD(v) {
  var n = Number(v) || 0;
  if (n >= 1000)
    return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 1)
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}
function fmtNum(v) {
  var n = Number(v) || 0;
  if (n >= 1000)
    return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 1)
    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}
function capitalize(s) {
  s = String(s || "");
  return s ? s[0].toUpperCase() + s.slice(1) : "";
}

/* ── РЕНДЕР РЕЗУЛЬТАТА ИИ ── */
function renderResult(d) {
  if (!d) return;

  // Обновление базовых данных
  var priceUsd = Number(d.current_price_usd) || 0;
  setText("res-sym-badge", d.symbol || selCoin || "");
  setText("res-exch-tag", (d.exchange || selExchange || "").toUpperCase());

  // Обновляем тренд
  var trendDot = document.getElementById("res-trend-dot");
  var trend = String((d.forecast && d.forecast.trend) || "").toLowerCase();
  if (trendDot) {
    trendDot.className = "res-trend-dot";
    if (trend.indexOf("bull") !== -1) {
      trendDot.classList.add("bull");
    } else if (trend.indexOf("bear") !== -1) {
      trendDot.classList.add("bear");
    } else {
      trendDot.classList.add("side");
    }
  }

  // Название и цена
  setText("ph-name", d.name || d.symbol || "");
  setText("ph-price", fmtUSD(priceUsd));

  // Изменения 24h и 7d
  var c24 = Number(d.change_24h) || 0;
  var c7 = Number(d.change_7d) || 0;
  var el24 = document.getElementById("chg-24");
  var el7 = document.getElementById("chg-7d");
  if (el24) {
    el24.textContent = "24h: " + (c24 >= 0 ? "+" : "") + c24.toFixed(2) + "%";
    el24.className = "chg-chip " + (c24 >= 0 ? "pos" : "neg");
  }
  if (el7) {
    el7.textContent = "7d: " + (c7 >= 0 ? "+" : "") + c7.toFixed(2) + "%";
    el7.className = "chg-chip " + (c7 >= 0 ? "pos" : "neg");
  }

  // Рекомендация и настроение
  var rec = String(d.ai_analysis?.recommendation || "держать").toLowerCase();
  var rb = document.getElementById("rec-badge");
  if (rb) {
    rb.textContent = capitalize(rec);
    rb.className = "rec-badge";
    if (rec.indexOf("купит") !== -1) {
      rb.classList.add("buy");
    } else if (rec.indexOf("накап") !== -1) {
      rb.classList.add("acc");
    } else if (rec.indexOf("продат") !== -1) {
      rb.classList.add("sell");
    }
  }
  setText("sentiment-tag", String(d.ai_analysis?.sentiment || "нейтральный"));

  // Цены в валютных метках
  setText("mc-uah", "₴" + fmtNum(d.price_uah || 0));
  setText("mc-eur", "€" + fmtNum(d.price_eur || 0));
  setText("mc-rub", "₽" + fmtNum(d.price_rub || 0));

  // График цены
  drawChart(d.price_history_7d || []);

  // Описание и метрики
  setText("coin-desc", String(d.description || ""));
  setText("met-vol", String(d.metrics?.volatility || "—"));
  setText("met-liq", String(d.metrics?.liquidity || "—"));
  setText("met-tech", d.metrics?.tech_score !== undefined ? d.metrics.tech_score + "/100" : "—");
  setText("met-fund", d.metrics?.fundamental_score !== undefined ? d.metrics.fundamental_score + "/100" : "—");

  // Прогноз
  setText("fg-7", d.forecast?.predicted_7d ? fmtUSD(d.forecast.predicted_7d) : "—");
  setText("fg-30", d.forecast?.predicted_30d ? fmtUSD(d.forecast.predicted_30d) : "—");
  setText("lv-sup", d.forecast?.support ? fmtUSD(d.forecast.support) : "—");
  setText("lv-res", d.forecast?.resistance ? fmtUSD(d.forecast.resistance) : "—");

  // Уверенность
  var conf = Number(d.forecast?.confidence || 0);
  setText("conf-pct", conf + "%");
  var confFill = document.getElementById("conf-fill");
  if (confFill) {
    confFill.style.width = conf + "%";
  }

  // Аналитика ИИ
  setText("ai-summary", String(d.ai_analysis?.summary || ""));
  setText("ai-risks", String(d.ai_analysis?.risks || "—"));
  setText("ai-opp", String(d.ai_analysis?.opportunity || ""));

  // Мониторинг
  setText(
    "monitor-text",
    (d.symbol || selCoin || "") +
      " на " +
      (d.exchange || selExchange || "").toUpperCase() +
      " отслеживается.\nПришлю уведомление в Telegram при изменении цены на " +
      alertPct +
      "% от " +
      fmtUSD(priceUsd) +
      "."
  );

  // Отскроллить вверх
  var body = document.querySelector(".res-body");
  if (body) {
    body.scrollTop = 0;
  }

  // Обновляем блок обзора ИИ и похожих товаров
  updateAIAnalysis(d);
}

/* ── Обновление блока анализа ИИ и похожих товаров ── */
function updateAIAnalysis(d) {
  // Показать блок обзора ИИ
  var aiBlock = document.getElementById("ai-analysis");
  if (aiBlock) {
    aiBlock.style.display = "flex"; // или "block", если нужно
  }

  // Обновляем описание
  var summaryEl = document.getElementById("r-summary");
  if (summaryEl) {
    summaryEl.textContent = String(d.ai_analysis?.summary || "Нет анализа");
  }

  // Обновляем риски
  var risksEl = document.getElementById("r-usd-impact");
  if (risksEl) {
    risksEl.textContent = String(d.ai_analysis?.risks || "Нет данных");
  }

  // Обработка похожих товаров
  var altsContainer = document.getElementById("r-alts");
  if (altsContainer) {
    altsContainer.innerHTML = ""; // Очистить
    var alts = d.alts || [];
    if (alts.length > 0) {
      document.getElementById("r-alts-card").style.display = "flex"; // или "block"
      alts.forEach(function (item) {
        var alt = document.createElement("div");
        alt.className = "alt-card";
        alt.innerHTML = `
          <img src="${item.img || ''}" class="alt-img" />
          <div class="alt-info">
            <div class="alt-name">${item.name || "Товар"}</div>
            <div class="alt-store">${item.store || ""}</div>
            <div class="alt-price">${item.price || ""}</div>
          </div>`;
        altsContainer.appendChild(alt);
      });
    } else {
      // Нет похожих товаров — скрываем блок
      document.getElementById("r-alts-card").style.display = "none";
    }
  }
}

/* ── График цены ── */
function drawChart(hist) {
  var ctx = document.getElementById("price-chart");
  if (!ctx) return;
  if (activeChart) {
    activeChart.destroy();
    activeChart = null;
  }
  if (!hist || hist.length === 0) return;

  var labels = [];
  var dataPoints = [];
  for (var i = 0; i < hist.length; i++) {
    labels.push(String(hist[i].day || ""));
    dataPoints.push(Number(hist[i].price || 0));
  }
  var isUp = dataPoints.length > 1 && dataPoints[dataPoints.length - 1] >= dataPoints[0];
  var color = isUp ? "#F5C518" : "#EF4444";

  var grad = ctx.getContext("2d").createLinearGradient(0, 0, 0, 140);
  grad.addColorStop(0, isUp ? "rgba(245,197,24,0.20)" : "rgba(239,68,68,0.18)");
  grad.addColorStop(1, "rgba(0,0,0,0)");

  activeChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          data: dataPoints,
          borderColor: color,
          borderWidth: 2,
          backgroundColor: grad,
          fill: true,
          tension: 0.45,
          pointBackgroundColor: color,
          pointRadius: 3,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#161A1F",
          borderColor: "rgba(245,197,24,0.25)",
          borderWidth: 1,
          titleColor: "#7A7060",
          bodyColor: color,
          bodyFont: { family: "'Space Mono'", weight: "700", size: 13 },
          padding: 10,
          callbacks: {
            label: function (c) {
              return " " + fmtUSD(c.raw);
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.03)" },
          ticks: { color: "#35302A", font: { size: 10, family: "'Space Mono'" } },
        },
        y: {
          grid: { color: "rgba(255,255,255,0.03)" },
          ticks: {
            color: "#35302A",
            font: { size: 10, family: "'Space Mono'" },
            maxTicksLimit: 4,
            callback: function (v) {
              return fmtUSD(v);
            },
          },
        },
      },
    },
  });
}

/* ── Новая аналитика / Сброс данных ── */
document.getElementById("new-btn").addEventListener("click", function () {
  selExchange = null;
  selCoin = null;
  alertPct = 5;
  document.querySelectorAll(".chip").forEach(function (c) {
    c.classList.remove("selected", "hidden");
  });
  var en = document.getElementById("exchange-next"),
    cn = document.getElementById("coin-next");
  if (en) en.disabled = true;
  if (cn) cn.disabled = true;
  var es = document.getElementById("exchange-search"),
    cs = document.getElementById("coin-search");
  if (es) (es.value = "");
  if (cs) (cs.value = "");
  updatePct();
  showExchange();
});

/* ── Обработка клавиатуры (поддержка высоты окна) ── */
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", function () {
    var off = window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop;
    document.querySelectorAll(".step-footer, .res-footer").forEach(function (f) {
      f.style.transform = "translateY(-" + Math.max(0, off) + "px)";
    });
  });
}


/* ── ИСПРАВЛЕННЫЙ БЛОК ЛОАДЕРА В КОНЦЕ ФАЙЛА ── */
window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('screen-loading');
        if (loader && loader.classList.contains('active')) {
            console.log("Скрытие экрана загрузки");
            loader.classList.remove('active');
            loader.style.display = 'none'; // Гарантированное скрытие

            // Активируем начальный экран (обычно это экран бирж)
            // Если у вас в index.html другой ID для экрана бирж, замените 'screen-exchange'
            var startScreen = document.getElementById('screen-exchange'); 
            if (startScreen) {
                startScreen.style.display = 'flex';
                startScreen.classList.add('active');
            }
        }
    }, 2000); 
});
