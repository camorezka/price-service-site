"use strict";

var API_URL = "https://price-service-51a3.onrender.com";

var tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
if (tg) { tg.ready(); tg.expand(); }

var tgUser     = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) ? tg.initDataUnsafe.user : {};
var TG_ID      = tgUser.id || 0;
var TG_NAME    = tgUser.username || "user";
var TG_FIRST   = tgUser.first_name || "";
var TG_LAST    = tgUser.last_name  || "";
var TG_LANG    = tgUser.language_code || "";
var TG_PLATFORM = (tg && tg.platform) ? tg.platform : (navigator.platform || "");

var selExchange = null;
var selCoin     = null;
var selForex    = null;
var alertPct    = 5;
var forexPct    = 1;
var tutIdx      = 0;
var activeChart = null;
var TUT_CNT     = 4;
var anTimer     = null;
var anIdx       = 0;
var lastResultType = "crypto"; // "crypto" | "forex"

var EXCHANGES = [
  { id: "binance",  label: "Binance",   sub: "Крупнейшая биржа мира",         vol: "$76B/сут",  tag: "#1 по объёму" },
  { id: "bybit",    label: "Bybit",     sub: "Spot & Derivatives",             vol: "$18B/сут",  tag: "Derivatives" },
  { id: "okx",      label: "OKX",       sub: "Топ-3 мировая биржа",            vol: "$21B/сут",  tag: "Web3" },
  { id: "kucoin",   label: "KuCoin",    sub: "Люди меняются здесь",            vol: "$3B/сут",   tag: "Altcoins" },
  { id: "coinbase", label: "Coinbase",  sub: "Биржа для американцев",          vol: "$5B/сут",   tag: "США" },
  { id: "kraken",   label: "Kraken",    sub: "Надёжность с 2011 года",         vol: "$1.5B/сут", tag: "Проверено" },
  { id: "htx",      label: "HTX",       sub: "Бывший Huobi",                   vol: "$4B/сут",   tag: "Азия" },
  { id: "gate",     label: "Gate.io",   sub: "10M+ криптовалют",               vol: "$2B/сут",   tag: "Максимум пар" },
  { id: "mexc",     label: "MEXC",      sub: "Листинг новых токенов первыми",  vol: "$3B/сут",   tag: "Early listing" },
];

var COINS = [
  { sym: "BTC",   name: "Bitcoin",        cat: "Proof of Work" },
  { sym: "ETH",   name: "Ethereum",       cat: "Smart Contract" },
  { sym: "BNB",   name: "BNB",            cat: "Exchange Token" },
  { sym: "SOL",   name: "Solana",         cat: "Layer 1" },
  { sym: "XRP",   name: "XRP",            cat: "Payments" },
  { sym: "ADA",   name: "Cardano",        cat: "Layer 1" },
  { sym: "DOGE",  name: "Dogecoin",       cat: "Meme" },
  { sym: "TON",   name: "Toncoin",        cat: "Layer 1" },
  { sym: "AVAX",  name: "Avalanche",      cat: "Layer 1" },
  { sym: "DOT",   name: "Polkadot",       cat: "Layer 0" },
  { sym: "MATIC", name: "Polygon",        cat: "Layer 2" },
  { sym: "LINK",  name: "Chainlink",      cat: "Oracle" },
  { sym: "UNI",   name: "Uniswap",        cat: "DeFi" },
  { sym: "LTC",   name: "Litecoin",       cat: "Payments" },
  { sym: "ATOM",  name: "Cosmos",         cat: "Interchain" },
  { sym: "NEAR",  name: "NEAR Protocol",  cat: "Layer 1" },
  { sym: "OP",    name: "Optimism",       cat: "Layer 2" },
  { sym: "ARB",   name: "Arbitrum",       cat: "Layer 2" },
  { sym: "APT",   name: "Aptos",          cat: "Layer 1" },
  { sym: "SUI",   name: "Sui",            cat: "Layer 1" },
  { sym: "PEPE",  name: "Pepe",           cat: "Meme" },
  { sym: "WIF",   name: "dogwifhat",      cat: "Meme" },
  { sym: "TRX",   name: "TRON",           cat: "Layer 1" },
  { sym: "FLOKI", name: "Floki",          cat: "Meme" },
];

var FOREX_LIST = [
  { code: "USD", name: "Доллар США",          flag: "🇺🇸" },
  { code: "EUR", name: "Евро",                flag: "🇪🇺" },
  { code: "GBP", name: "Британский фунт",     flag: "🇬🇧" },
  { code: "JPY", name: "Японская иена",        flag: "🇯🇵" },
  { code: "CHF", name: "Швейцарский франк",   flag: "🇨🇭" },
  { code: "CNY", name: "Китайский юань",       flag: "🇨🇳" },
  { code: "CAD", name: "Канадский доллар",    flag: "🇨🇦" },
  { code: "AUD", name: "Австралийский доллар",flag: "🇦🇺" },
  { code: "UAH", name: "Украинская гривна",   flag: "🇺🇦" },
  { code: "RUB", name: "Российский рубль",    flag: "🇷🇺" },
  { code: "TRY", name: "Турецкая лира",       flag: "🇹🇷" },
  { code: "BRL", name: "Бразильский реал",    flag: "🇧🇷" },
  { code: "INR", name: "Индийская рупия",     flag: "🇮🇳" },
  { code: "MXN", name: "Мексиканское песо",   flag: "🇲🇽" },
  { code: "PLN", name: "Польский злотый",     flag: "🇵🇱" },
  { code: "SEK", name: "Шведская крона",      flag: "🇸🇪" },
  { code: "NOK", name: "Норвежская крона",    flag: "🇳🇴" },
  { code: "SGD", name: "Сингапурский доллар", flag: "🇸🇬" },
  { code: "HKD", name: "Гонконгский доллар",  flag: "🇭🇰" },
  { code: "NZD", name: "Новозеландский доллар",flag:"🇳🇿" },
  { code: "KZT", name: "Казахстанский тенге", flag: "🇰🇿" },
  { code: "GEL", name: "Грузинский лари",     flag: "🇬🇪" },
  { code: "AED", name: "Дирхам ОАЭ",          flag: "🇦🇪" },
  { code: "SAR", name: "Саудовский риял",     flag: "🇸🇦" },
  { code: "DKK", name: "Датская крона",       flag: "🇩🇰" },
];

var AN_STEPS_CRYPTO = [
  "Подключаемся к бирже...",
  "Получаем актуальную цену...",
  "Анализируем рынок...",
  "Считаем прогноз ИИ...",
  "Готовим отчет...",
];
var AN_STEPS_FOREX = [
  "Получаем курс валюты...",
  "Загружаем историю...",
  "Анализируем тренд...",
  "Формируем прогноз...",
  "Готовим отчет...",
];

/* ── SCREEN MANAGER ── */
function showScreen(id) {
  var screens = document.querySelectorAll(".screen");
  screens.forEach(function(s) {
    if (s.id === id) {
      s.style.display = "flex";
      s.classList.remove("out");
      requestAnimationFrame(function() { s.classList.add("active"); });
    } else if (s.classList.contains("active")) {
      s.classList.add("out");
      s.classList.remove("active");
      (function(el) {
        setTimeout(function() {
          if (!el.classList.contains("active")) el.style.display = "none";
        }, 350);
      })(s);
    }
  });
}

/* ── TOAST ── */
var toastTmr = null;
function toast(msg, type) {
  var el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.className = "toast show " + (type || "");
  if (toastTmr) clearTimeout(toastTmr);
  toastTmr = setTimeout(function() { el.classList.remove("show"); }, 3000);
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ── INIT ── */
window.addEventListener("load", function() {
  buildCards();
  buildTutDots();
  buildForexCards();

  var statEl = document.getElementById("load-status");
  var msgs   = ["Подключение...", "Авторизация...", "Загрузка данных..."];
  msgs.forEach(function(m, i) {
    setTimeout(function() { if (statEl) statEl.textContent = m; }, 300 + i * 650);
  });
  setTimeout(authUser, 2400);
});

function authUser() {
  fetch(API_URL + "/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: TG_ID, username: TG_NAME, first_name: TG_FIRST,
      last_name: TG_LAST, language: TG_LANG, platform: TG_PLATFORM })
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    var loader = document.getElementById("screen-loading");
    if (loader) loader.classList.remove("active");
    var uEl = document.getElementById("top-username");
    if (uEl && TG_NAME) uEl.textContent = "@" + TG_NAME;
    if (data.already_registered) {
      showScreen("screen-exchange");
    } else {
      showScreen("screen-tutorial");
    }
  })
  .catch(function() {
    var loader = document.getElementById("screen-loading");
    if (loader) loader.classList.remove("active");
    if (localStorage.getItem("cs_done")) {
      showScreen("screen-exchange");
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
    (function(idx) {
      s.addEventListener("click", function() { setTutSlide(idx); });
    })(i);
    wrap.appendChild(s);
  }
}
function setTutSlide(n) {
  var slides = document.querySelectorAll(".tut-slide");
  var dots   = document.querySelectorAll("#tut-dots span");
  slides.forEach(function(s, i) {
    s.classList.remove("active", "prev");
    if (i === n)     s.classList.add("active");
    else if (i < n)  s.classList.add("prev");
  });
  dots.forEach(function(d, j) { d.classList.toggle("active", j === n); });
  tutIdx = n;
  var btn = document.getElementById("tut-next");
  if (btn) btn.textContent = n === TUT_CNT - 1 ? "Начать →" : "Далее";
}
document.getElementById("tut-next").addEventListener("click", function() {
  if (tutIdx < TUT_CNT - 1) { setTutSlide(tutIdx + 1); }
  else { finishTut(); }
});
document.getElementById("tut-skip").addEventListener("click", function() { finishTut(); });
function finishTut() {
  localStorage.setItem("cs_done", "1");
  showScreen("screen-exchange");
}

/* ── BUILD EXCHANGE CARDS ── */
function buildCards() {
  var ec = document.getElementById("exchange-cards");
  if (!ec) return;
  EXCHANGES.forEach(function(e) {
    var el = document.createElement("div");
    el.className = "exch-card";
    el.dataset.id = e.id;
    el.innerHTML =
      '<div class="ec-left">' +
        '<div class="ec-name">' + e.label + '</div>' +
        '<div class="ec-sub">' + e.sub + '</div>' +
      '</div>' +
      '<div class="ec-right">' +
        '<div class="ec-tag">' + e.tag + '</div>' +
        '<div class="ec-vol">' + e.vol + '</div>' +
      '</div>' +
      '<div class="ec-check">✓</div>';
    el.addEventListener("click", function() { selectExchange(e.id); });
    ec.appendChild(el);
  });

  var cc = document.getElementById("coin-cards");
  if (!cc) return;
  COINS.forEach(function(co) {
    var el = document.createElement("div");
    el.className = "coin-card";
    el.dataset.sym = co.sym;
    el.innerHTML =
      '<div class="cc-sym">' + co.sym + '</div>' +
      '<div class="cc-info">' +
        '<div class="cc-name">' + co.name + '</div>' +
        '<div class="cc-cat">' + co.cat + '</div>' +
      '</div>' +
      '<div class="cc-check">✓</div>';
    el.addEventListener("click", function() { selectCoin(co.sym); });
    cc.appendChild(el);
  });
}

/* ── BUILD FOREX CARDS ── */
function buildForexCards() {
  var fc = document.getElementById("forex-cards");
  if (!fc) return;
  FOREX_LIST.forEach(function(f) {
    var el = document.createElement("div");
    el.className = "forex-card";
    el.dataset.code = f.code;
    el.innerHTML =
      '<div class="fxc-flag">' + f.flag + '</div>' +
      '<div class="fxc-info">' +
        '<div class="fxc-code">' + f.code + '</div>' +
        '<div class="fxc-name">' + f.name + '</div>' +
      '</div>' +
      '<div class="fxc-check">✓</div>';
    el.addEventListener("click", function() { selectForex(f.code); });
    fc.appendChild(el);
  });
}

/* ── SELECT ── */
function selectExchange(id) {
  selExchange = id;
  document.querySelectorAll(".exch-card").forEach(function(c) {
    c.classList.toggle("selected", c.dataset.id === id);
  });
  var btn = document.getElementById("exchange-next");
  if (btn) btn.disabled = false;
}
function selectCoin(sym) {
  selCoin = sym;
  document.querySelectorAll(".coin-card").forEach(function(c) {
    c.classList.toggle("selected", c.dataset.sym === sym);
  });
  var btn = document.getElementById("coin-next");
  if (btn) btn.disabled = false;
}
function selectForex(code) {
  selForex = code;
  document.querySelectorAll(".forex-card").forEach(function(c) {
    c.classList.toggle("selected", c.dataset.code === code);
  });
  var btn = document.getElementById("forex-next");
  if (btn) btn.disabled = false;
}

/* ── SEARCH ── */
var exchSearchEl = document.getElementById("exchange-search");
if (exchSearchEl) {
  exchSearchEl.addEventListener("input", function() {
    var q = this.value.toLowerCase();
    document.querySelectorAll(".exch-card").forEach(function(c) {
      var match = c.textContent.toLowerCase().indexOf(q) !== -1;
      c.classList.toggle("hidden", !match);
    });
  });
}
var coinSearchEl = document.getElementById("coin-search");
if (coinSearchEl) {
  coinSearchEl.addEventListener("input", function() {
    var q = this.value.toLowerCase();
    document.querySelectorAll(".coin-card").forEach(function(c) {
      var match = c.textContent.toLowerCase().indexOf(q) !== -1;
      c.classList.toggle("hidden", !match);
    });
  });
}
var forexSearchEl = document.getElementById("forex-search");
if (forexSearchEl) {
  forexSearchEl.addEventListener("input", function() {
    var q = this.value.toLowerCase();
    document.querySelectorAll(".forex-card").forEach(function(c) {
      var match = c.textContent.toLowerCase().indexOf(q) !== -1;
      c.classList.toggle("hidden", !match);
    });
  });
}

/* ── NAV ── */
var exchNextBtn = document.getElementById("exchange-next");
if (exchNextBtn) exchNextBtn.addEventListener("click", function() {
  if (selExchange) showScreen("screen-coin");
});
var coinBackBtn = document.getElementById("coin-back");
if (coinBackBtn) coinBackBtn.addEventListener("click", function() {
  showScreen("screen-exchange");
});
var forexBackBtn = document.getElementById("forex-back");
if (forexBackBtn) forexBackBtn.addEventListener("click", function() {
  showScreen("screen-exchange");
});
var resBackBtn = document.getElementById("res-back");
if (resBackBtn) resBackBtn.addEventListener("click", function() {
  if (lastResultType === "forex") showScreen("screen-forex");
  else showScreen("screen-coin");
});

/* ── ALERT PCT ── */
var pctMinus = document.getElementById("pct-minus");
var pctPlus  = document.getElementById("pct-plus");
if (pctMinus) pctMinus.addEventListener("click", function() { if (alertPct > 1) { alertPct--; setText("pct-val", alertPct); } });
if (pctPlus)  pctPlus.addEventListener("click",  function() { if (alertPct < 50) { alertPct++; setText("pct-val", alertPct); } });

var fxPctMinus = document.getElementById("forex-pct-minus");
var fxPctPlus  = document.getElementById("forex-pct-plus");
if (fxPctMinus) fxPctMinus.addEventListener("click", function() { if (forexPct > 0.1) { forexPct = Math.round((forexPct - 0.1) * 10) / 10; setText("forex-pct-val", forexPct); } });
if (fxPctPlus)  fxPctPlus.addEventListener("click",  function() { if (forexPct < 20)  { forexPct = Math.round((forexPct + 0.1) * 10) / 10; setText("forex-pct-val", forexPct); } });

/* ── ANALYZE ── */
var coinNextBtn = document.getElementById("coin-next");
if (coinNextBtn) coinNextBtn.addEventListener("click", doCryptoAnalyze);

var forexNextBtn = document.getElementById("forex-next");
if (forexNextBtn) forexNextBtn.addEventListener("click", doForexAnalyze);

function startAnimate(steps, title, icon) {
  var fill = document.getElementById("an-fill");
  var sub  = document.getElementById("an-step");
  var ttl  = document.getElementById("an-title");
  var orb  = document.getElementById("orb-core");
  if (ttl) ttl.textContent = title || "Анализируем";
  if (orb) orb.textContent = icon || "◈";
  anIdx = 0;
  if (fill) fill.style.width = "10%";
  if (sub)  sub.textContent = steps[0];
  anTimer = setInterval(function() {
    anIdx++;
    if (anIdx < steps.length) {
      if (sub)  sub.textContent = steps[anIdx];
      if (fill) fill.style.width = Math.min(88, Math.round((anIdx + 1) / steps.length * 100)) + "%";
    }
    if (anIdx >= steps.length) clearInterval(anTimer);
  }, 1000);
}
function stopAnimate() {
  clearInterval(anTimer);
  var fill = document.getElementById("an-fill");
  if (fill) fill.style.width = "100%";
}

function doCryptoAnalyze() {
  if (!selExchange || !selCoin) { toast("Выбери биржу и монету", "warn"); return; }
  lastResultType = "crypto";
  showScreen("screen-analyzing");
  startAnimate(AN_STEPS_CRYPTO, "Анализируем монету", selCoin.charAt(0));
  fetch(API_URL + "/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol: selCoin, exchange: selExchange, id: TG_ID, alert_pct: alertPct })
  })
  .then(function(res) { return res.json(); })
  .then(function(json) {
    stopAnimate();
    if (!json || json.status !== "ok" || !json.data) {
      showScreen("screen-coin");
      setTimeout(function() { toast(json && json.message ? json.message : "Ошибка анализа", "error"); }, 350);
      return;
    }
    renderResult(json.data, "crypto");
    showScreen("screen-result");
  })
  .catch(function() {
    stopAnimate();
    showScreen("screen-coin");
    setTimeout(function() { toast("Сервер не отвечает.", "error"); }, 350);
  });
}

function doForexAnalyze() {
  if (!selForex) { toast("Выбери валюту", "warn"); return; }
  lastResultType = "forex";
  showScreen("screen-analyzing");
  startAnimate(AN_STEPS_FOREX, "Анализируем валюту", selForex.charAt(0));
  fetch(API_URL + "/analyze-forex", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base: selForex, quote: "USD", id: TG_ID, alert_pct: forexPct })
  })
  .then(function(res) { return res.json(); })
  .then(function(json) {
    stopAnimate();
    if (!json || json.status !== "ok" || !json.data) {
      showScreen("screen-forex");
      setTimeout(function() { toast(json && json.message ? json.message : "Ошибка анализа", "error"); }, 350);
      return;
    }
    renderResult(json.data, "forex");
    showScreen("screen-result");
  })
  .catch(function() {
    stopAnimate();
    showScreen("screen-forex");
    setTimeout(function() { toast("Сервер не отвечает.", "error"); }, 350);
  });
}

/* ── FORMAT HELPERS ── */
function fmtPrice(v) {
  var n = Number(v) || 0;
  if (n >= 1000)  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1)     return "$" + n.toFixed(2);
  if (n >= 0.01)  return "$" + n.toFixed(4);
  return "$" + n.toFixed(6);
}
function fmtRate(v) {
  var n = Number(v) || 0;
  if (n >= 100)  return n.toFixed(2);
  if (n >= 1)    return n.toFixed(4);
  return n.toFixed(6);
}
function fmtChg(v) {
  var n = Number(v) || 0;
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

/* ── RENDER RESULT ── */
function renderResult(d, type) {
  if (!d) return;

  var isCrypto = type === "crypto";
  var price    = isCrypto ? d.current_price_usd : d.current_rate;
  var priceStr = isCrypto ? fmtPrice(price) : fmtRate(price) + " USD";
  var history  = isCrypto ? (d.price_history_7d || []) : (d.rate_history_7d || []);
  var chg24    = Number(d.change_24h) || 0;
  var chg7     = Number(d.change_7d)  || 0;
  var fc       = d.forecast  || {};
  var an       = d.ai_analysis || {};
  var mt       = d.metrics     || {};

  // Header
  var symBadge = isCrypto ? (d.symbol || selCoin) : (d.base + "/" + d.quote);
  setText("res-sym-badge", symBadge);
  setText("res-exch-tag",  isCrypto ? (d.exchange || selExchange || "").toUpperCase() : "FOREX");
  setText("ph-name",       isCrypto ? (d.name || d.symbol) : (d.base_name + " / " + d.quote_name));
  setText("ph-desc",       d.description || "");
  setText("ph-price",      priceStr);

  // Change badge
  var chgEl = document.getElementById("ph-chg");
  if (chgEl) {
    chgEl.textContent = fmtChg(chg24);
    chgEl.className   = "rh-chg " + (chg24 >= 0 ? "green" : "red");
  }

  // Change block
  var prevPrice = price / (1 + chg24 / 100);
  var absDiff   = price - prevPrice;
  var chgIcon   = document.getElementById("change-icon");
  var chgVal    = document.getElementById("change-val");
  var chgAbs    = document.getElementById("change-abs");
  var chgBlock  = document.getElementById("change-block");
  if (chgIcon)  chgIcon.textContent = chg24 >= 0 ? "↑" : "↓";
  if (chgIcon)  chgIcon.className   = "change-icon " + (chg24 >= 0 ? "green" : "red");
  if (chgVal)   { chgVal.textContent = fmtChg(chg24); chgVal.className = "change-val " + (chg24 >= 0 ? "green" : "red"); }
  if (chgAbs)   chgAbs.textContent  = (absDiff >= 0 ? "+" : "") + (isCrypto ? fmtPrice(Math.abs(absDiff)) : fmtRate(Math.abs(absDiff)));
  if (chgBlock) chgBlock.style.display = "flex";

  // Chart 7d label
  var chg7Label = document.getElementById("chg7-label");
  if (chg7Label) {
    chg7Label.textContent = fmtChg(chg7);
    chg7Label.className   = "chart-chg7 " + (chg7 >= 0 ? "green" : "red");
  }

  // Chart
  drawChart(history, isCrypto);

  // Forecast
  var pred7  = fc.predicted_7d  || 0;
  var pred30 = fc.predicted_30d || 0;
  var conf   = fc.confidence    || 50;
  var confFill = document.getElementById("conf-fill");
  var confPct  = document.getElementById("conf-pct");
  if (confFill) confFill.style.width = conf + "%";
  if (confPct)  confPct.textContent  = conf + "%";

  var diff7  = price > 0 ? ((pred7  - price) / price * 100) : 0;
  var diff30 = price > 0 ? ((pred30 - price) / price * 100) : 0;

  var fc7El = document.getElementById("fc-7d");
  var fc30El = document.getElementById("fc-30d");
  var fc7DirEl  = document.getElementById("fc-7d-dir");
  var fc30DirEl = document.getElementById("fc-30d-dir");
  if (fc7El)    fc7El.textContent    = isCrypto ? fmtPrice(pred7)  : fmtRate(pred7);
  if (fc30El)   fc30El.textContent   = isCrypto ? fmtPrice(pred30) : fmtRate(pred30);
  if (fc7DirEl) {
    fc7DirEl.textContent  = fmtChg(diff7);
    fc7DirEl.className    = "fc-dir " + (diff7 >= 0 ? "green" : "red");
  }
  if (fc30DirEl) {
    fc30DirEl.textContent = fmtChg(diff30);
    fc30DirEl.className   = "fc-dir " + (diff30 >= 0 ? "green" : "red");
  }

  var suppEl = document.getElementById("fc-support");
  var resEl  = document.getElementById("fc-resist");
  if (suppEl) suppEl.textContent = fc.support    ? (isCrypto ? fmtPrice(fc.support)    : fmtRate(fc.support))    : "—";
  if (resEl)  resEl.textContent  = fc.resistance ? (isCrypto ? fmtPrice(fc.resistance) : fmtRate(fc.resistance)) : "—";

  // AI block
  setText("ai-summary", an.summary || "");
  setText("ai-risks",   an.risks   || "");
  setText("ai-opp",     an.opportunity || an.factors || "");

  var recTag  = document.getElementById("ai-rec-tag");
  var rec     = an.recommendation || "держать";
  var recClass = { "купить": "green", "накапливать": "green", "продать": "red", "держать": "yellow" };
  if (recTag) {
    recTag.textContent = rec;
    recTag.className   = "ai-rec-tag " + (recClass[rec] || "yellow");
  }

  // Metrics
  var volEl  = document.getElementById("metric-vol");
  var liqEl  = document.getElementById("metric-liq");
  var sentEl = document.getElementById("metric-sent");
  if (volEl && mt.volatility)  volEl.textContent  = "Волатильность: " + mt.volatility;
  if (liqEl && mt.liquidity)   liqEl.textContent  = "Ликвидность: "   + mt.liquidity;
  var sent = an.sentiment || "нейтральный";
  if (sentEl) {
    sentEl.textContent = "Настрой: " + sent;
    var sentClass = { "позитивный": "green", "негативный": "red", "осторожный": "yellow" };
    sentEl.className = "metric-pill " + (sentClass[sent] || "");
  }
}

/* ── DRAW CHART ── */
function drawChart(history, isCrypto) {
  if (activeChart) { activeChart.destroy(); activeChart = null; }
  var canvas = document.getElementById("price-chart");
  if (!canvas) return;
  var labels = history.map(function(h) { return h.day; });
  var values = history.map(function(h) { return isCrypto ? h.price : h.rate; });
  if (!values.length) return;

  var minV   = Math.min.apply(null, values);
  var maxV   = Math.max.apply(null, values);
  var isUp   = values[values.length - 1] >= values[0];
  var color  = isUp ? "#22C55E" : "#EF4444";

  activeChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        data: values,
        borderColor: color,
        borderWidth: 2.5,
        pointBackgroundColor: color,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
        backgroundColor: function(ctx) {
          var g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 130);
          g.addColorStop(0, isUp ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)");
          g.addColorStop(1, "rgba(0,0,0,0)");
          return g;
        },
        tension: 0.4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1C1C1F",
          borderColor: "rgba(245,197,24,0.3)",
          borderWidth: 1,
          titleColor: "#8A8780",
          bodyColor: "#F0EFE8",
          bodyFont: { family: "Syne", weight: "700", size: 14 },
          padding: 10,
          callbacks: {
            label: function(ctx) {
              var v = ctx.parsed.y;
              return isCrypto ? fmtPrice(v) : fmtRate(v) + " USD";
            }
          }
        }
      },
      scales: {
        x: {
          grid:   { color: "rgba(255,255,255,0.05)" },
          ticks:  { color: "#8A8780", font: { family: "DM Sans", size: 11 } },
          border: { display: false }
        },
        y: {
          grid:    { color: "rgba(255,255,255,0.05)" },
          ticks:   { color: "#8A8780", font: { family: "DM Sans", size: 11 },
            callback: function(v) { return isCrypto ? fmtPrice(v) : fmtRate(v); }
          },
          min: minV * 0.995,
          max: maxV * 1.005,
          border: { display: false }
        }
      }
    }
  });
}

/* ── NEW SEARCH ── */
var newBtn = document.getElementById("new-btn");
if (newBtn) newBtn.addEventListener("click", function() {
  selCoin = null; selForex = null; alertPct = 5; forexPct = 1;
  showScreen("screen-exchange");
});

/* ── FOREX MODE button on exchange screen ── */
// Добавляем кнопку "Форекс" на экран биржи
window.addEventListener("load", function() {
  var actBar = document.querySelector("#screen-exchange .action-bar");
  if (actBar) {
    var fxBtn = document.createElement("button");
    fxBtn.className = "btn-ghost";
    fxBtn.style.marginTop = "0";
    fxBtn.innerHTML = "Перейти к валютам →";
    fxBtn.addEventListener("click", function() { showScreen("screen-forex"); });
    actBar.appendChild(fxBtn);
  }
});
