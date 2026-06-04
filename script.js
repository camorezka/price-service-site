"use strict";

var API_URL = "https://price-service-51a3.onrender.com";

var tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
if (tg) { tg.ready(); tg.expand(); }

var tgUser    = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) ? tg.initDataUnsafe.user : {};
var TG_ID     = tgUser.id || 0;
var TG_NAME   = tgUser.username || tgUser.first_name || "user";
var TG_FIRST  = tgUser.first_name || "";
var TG_LAST   = tgUser.last_name  || "";
var TG_LANG   = tgUser.language_code || "";
var TG_PLAT   = (tg && tg.platform) ? tg.platform : (navigator.platform || "");

var selExchange = null;
var selCoin     = null;
var selForex    = null;
var tutIdx      = 0;
var activeChart = null;
var TUT_CNT     = 4;
var anTimer     = null;
var anIdx       = 0;
var lastResultType = "crypto";
var allCoins    = [];

var EXCHANGES = [
  { id: "binance",  label: "Binance",  sub: "Крупнейшая биржа мира",        vol: "$76B/сут",  tag: "#1 по объёму" },
  { id: "bybit",    label: "Bybit",    sub: "Spot & Derivatives",            vol: "$18B/сут",  tag: "Derivatives" },
  { id: "okx",      label: "OKX",      sub: "Топ-3 мировая биржа",           vol: "$21B/сут",  tag: "Web3" },
  { id: "kucoin",   label: "KuCoin",   sub: "Альткоины и новинки",           vol: "$3B/сут",   tag: "Altcoins" },
  { id: "coinbase", label: "Coinbase", sub: "Биржа для американцев",         vol: "$5B/сут",   tag: "США" },
  { id: "kraken",   label: "Kraken",   sub: "Надёжность с 2011 года",        vol: "$1.5B/сут", tag: "Проверено" },
  { id: "htx",      label: "HTX",      sub: "Бывший Huobi",                  vol: "$4B/сут",   tag: "Азия" },
  { id: "gate",     label: "Gate.io",  sub: "Максимум торговых пар",         vol: "$2B/сут",   tag: "Макс. пар" },
  { id: "mexc",     label: "MEXC",     sub: "Листинг новых токенов первыми", vol: "$3B/сут",   tag: "Early listing" },
];

var FOREX_LIST = [
  { code: "USD", name: "Доллар США",           flag: "🇺🇸" },
  { code: "EUR", name: "Евро",                 flag: "🇪🇺" },
  { code: "GBP", name: "Британский фунт",      flag: "🇬🇧" },
  { code: "JPY", name: "Японская иена",         flag: "🇯🇵" },
  { code: "CHF", name: "Швейцарский франк",    flag: "🇨🇭" },
  { code: "CNY", name: "Китайский юань",        flag: "🇨🇳" },
  { code: "CAD", name: "Канадский доллар",     flag: "🇨🇦" },
  { code: "AUD", name: "Австралийский доллар", flag: "🇦🇺" },
  { code: "UAH", name: "Украинская гривна",    flag: "🇺🇦" },
  { code: "TRY", name: "Турецкая лира",        flag: "🇹🇷" },
  { code: "BRL", name: "Бразильский реал",     flag: "🇧🇷" },
  { code: "INR", name: "Индийская рупия",      flag: "🇮🇳" },
  { code: "PLN", name: "Польский злотый",      flag: "🇵🇱" },
  { code: "SEK", name: "Шведская крона",       flag: "🇸🇪" },
  { code: "NOK", name: "Норвежская крона",     flag: "🇳🇴" },
  { code: "SGD", name: "Сингапурский доллар",  flag: "🇸🇬" },
  { code: "HKD", name: "Гонконгский доллар",   flag: "🇭🇰" },
  { code: "NZD", name: "Новозеландский доллар",flag: "🇳🇿" },
  { code: "KZT", name: "Казахстанский тенге",  flag: "🇰🇿" },
  { code: "GEL", name: "Грузинский лари",      flag: "🇬🇪" },
  { code: "AED", name: "Дирхам ОАЭ",           flag: "🇦🇪" },
  { code: "SAR", name: "Саудовский риял",      flag: "🇸🇦" },
  { code: "DKK", name: "Датская крона",        flag: "🇩🇰" },
  { code: "MXN", name: "Мексиканское песо",    flag: "🇲🇽" },
  { code: "RUB", name: "Российский рубль",     flag: "🇷🇺" },
  { code: "CZK", name: "Чешская крона",         flag: "🇨🇿" },
  { code: "HUF", name: "Венгерский форинт",     flag: "🇭🇺" },
  { code: "RON", name: "Румынский лей",          flag: "🇷🇴" },
  { code: "BGN", name: "Болгарский лев",         flag: "🇧🇬" },
  { code: "HRK", name: "Хорватская куна",        flag: "🇭🇷" },
  { code: "ISK", name: "Исландская крона",       flag: "🇮🇸" },
  { code: "IDR", name: "Индонезийская рупия",    flag: "🇮🇩" },
  { code: "MYR", name: "Малайзийский ринггит",   flag: "🇲🇾" },
  { code: "THB", name: "Тайский бат",            flag: "🇹🇭" },
  { code: "PHP", name: "Филиппинское песо",      flag: "🇵🇭" },
  { code: "VND", name: "Вьетнамский донг",       flag: "🇻🇳" },
  { code: "PKR", name: "Пакистанская рупия",     flag: "🇵🇰" },
  { code: "BDT", name: "Бангладешская така",     flag: "🇧🇩" },
  { code: "EGP", name: "Египетский фунт",        flag: "🇪🇬" },
  { code: "NGN", name: "Нигерийская найра",      flag: "🇳🇬" },
  { code: "ZAR", name: "Южноафриканский рэнд",   flag: "🇿🇦" },
  { code: "MAD", name: "Марокканский дирхам",    flag: "🇲🇦" },
  { code: "CLP", name: "Чилийское песо",         flag: "🇨🇱" },
  { code: "COP", name: "Колумбийское песо",      flag: "🇨🇴" },
  { code: "ARS", name: "Аргентинское песо",      flag: "🇦🇷" },
  { code: "PEN", name: "Перуанский соль",        flag: "🇵🇪" },
  { code: "ILS", name: "Израильский шекель",     flag: "🇮🇱" },
  { code: "QAR", name: "Катарский риал",         flag: "🇶🇦" },
  { code: "KWD", name: "Кувейтский динар",       flag: "🇰🇼" },
  { code: "BHD", name: "Бахрейнский динар",      flag: "🇧🇭" },
  { code: "OMR", name: "Оманский риал",           flag: "🇴🇲" },
  { code: "JOD", name: "Иорданский динар",       flag: "🇯🇴" },
  { code: "TWD", name: "Тайваньский доллар",     flag: "🇹🇼" },
  { code: "KRW", name: "Южнокорейская вона",     flag: "🇰🇷" },
];

var AN_STEPS_CRYPTO = ["Подключаемся к бирже...","Получаем актуальную цену...","Загружаем историю...","Формируем отчёт..."];
var AN_STEPS_FOREX  = ["Получаем курс валюты...","Загружаем историю...","Анализируем тренд...","Формируем отчёт..."];

/* ── SCREENS ── */
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(function(s) {
    if (s.id === id) {
      s.style.display = "flex";
      s.classList.remove("out");
      requestAnimationFrame(function() { s.classList.add("active"); });
    } else if (s.classList.contains("active")) {
      s.classList.add("out"); s.classList.remove("active");
      (function(el) { setTimeout(function() { if (!el.classList.contains("active")) el.style.display = "none"; }, 350); })(s);
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
  toastTmr = setTimeout(function() { el.classList.remove("show"); }, 3500);
}
function setText(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }

/* ── ПРОВЕРКА ПОДПИСКИ НА КАНАЛ ── */
function checkSubscription(callback) {
  // Проверка только внутри Telegram WebApp
  if (!tg || !TG_ID) { callback(true); return; }
  fetch(API_URL + "/check-sub?tg_id=" + TG_ID)
    .then(function(r) { return r.json(); })
    .then(function(data) { callback(data.subscribed === true); })
    .catch(function() { callback(true); }); // при ошибке — пускаем
}

function showSubOverlay() {
  var el = document.getElementById("sub-overlay");
  if (el) el.style.display = "flex";
}

/* ── INIT ── */
document.addEventListener("DOMContentLoaded", function () {
  buildExchangeCards();
  buildForexCards();
  buildTutDots();

  var topUser = document.getElementById("top-username");
  if (topUser) {
    var displayName = TG_NAME !== "user" ? "@" + TG_NAME : (TG_FIRST || "@user");
    topUser.textContent = displayName;
  }

  var statEl = document.getElementById("load-status");
  var msgs = ["Подключение...", "Авторизация...", "Загрузка данных..."];
  for (var i = 0; i < msgs.length; i++) {
    (function (m, delay) {
      setTimeout(function () { if (statEl) statEl.textContent = m; }, delay);
    })(msgs[i], 300 + i * 650);
  }
  setTimeout(authUser, 500);
});

function authUser() {
  if (!window.Telegram || !window.Telegram.WebApp) {
    showScreen("screen-exchange");
    return;
  }
  var controller = new AbortController();
  var timer = setTimeout(function() { controller.abort(); }, 7000);
  fetch(API_URL + "/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: TG_ID, username: TG_NAME, first_name: TG_FIRST, last_name: TG_LAST, lang: TG_LANG }),
    signal: controller.signal
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    clearTimeout(timer);
    document.getElementById("screen-loading").classList.remove("active");

    // Новая регистрация — показываем уведомление
    if (!data.already_registered) {
      var nick = TG_NAME && TG_NAME !== "user" ? "@" + TG_NAME : (TG_FIRST || "пользователь");
      setTimeout(function() {
        toast("✅ " + nick + " успешно зарегистрирован!", "success");
      }, 600);
    }

    // Проверяем подписку
    checkSubscription(function(subscribed) {
      if (!subscribed) {
        showSubOverlay();
        return;
      }
      showScreen(data.already_registered ? "screen-exchange" : "screen-tutorial");
    });
  })
  .catch(function(err) {
    clearTimeout(timer);
    console.error("Auth error:", err);
    document.getElementById("screen-loading").classList.remove("active");
    checkSubscription(function(subscribed) {
      if (!subscribed) { showSubOverlay(); return; }
      showScreen("screen-exchange");
    });
  });
}

/* ── TUTORIAL ── */
function buildTutDots() {
  var wrap = document.getElementById("tut-dots");
  if (!wrap) return;
  wrap.innerHTML = "";
  for (var i = 0; i < TUT_CNT; i++) {
    var s = document.createElement("span");
    s.className = "dot";
    if (i === 0) s.classList.add("active");
    (function(idx) { s.addEventListener("click", function() { setTutSlide(idx); }); })(i);
    wrap.appendChild(s);
  }
}
function setTutSlide(n) {
  document.querySelectorAll(".tut-slide").forEach(function(s, i) {
    s.classList.remove("active","prev");
    if (i === n) s.classList.add("active");
    else if (i < n) s.classList.add("prev");
  });
  document.querySelectorAll("#tut-dots span").forEach(function(d, j) { d.classList.toggle("active", j === n); });
  tutIdx = n;
  var btn = document.getElementById("tut-next");
  if (btn) btn.textContent = n === TUT_CNT - 1 ? "Начать →" : "Далее";
}

document.getElementById("tut-next")?.addEventListener("click", function() {
  if (tutIdx < TUT_CNT - 1) setTutSlide(tutIdx + 1); else finishTut();
});
document.getElementById("tut-skip")?.addEventListener("click", finishTut);

function finishTut() { localStorage.setItem("cs_done","1"); showScreen("screen-exchange"); }

/* ── EXCHANGE CARDS ── */
function buildExchangeCards() {
  var ec = document.getElementById("exchange-cards");
  if (!ec) return;
  EXCHANGES.forEach(function(e) {
    var el = document.createElement("div");
    el.className = "exch-card"; el.dataset.id = e.id;
    el.innerHTML =
      '<div class="ec-left"><div class="ec-name">' + e.label + '</div><div class="ec-sub">' + e.sub + '</div></div>' +
      '<div class="ec-right"><div class="ec-tag">' + e.tag + '</div><div class="ec-vol">' + e.vol + '</div></div>' +
      '<div class="ec-check">✓</div>';
    el.addEventListener("click", function() { selectExchange(e.id); });
    ec.appendChild(el);
  });
}

/* ── LOAD COINS ── */
function loadCoins(exchange) {
  var cc = document.getElementById("coin-cards");
  var sub = document.getElementById("coin-sub");
  if (cc) cc.innerHTML = '<div class="loading-coins">Загружаем монеты с ' + exchange.toUpperCase() + '...</div>';
  fetch(API_URL + "/coins/" + exchange)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      allCoins = data.coins || [];
      if (sub) sub.textContent = "Топ-20 по объёму — поиск по всем (" + allCoins.length + " монет)";
      renderCoinCards(allCoins.slice(0, 20));
    })
    .catch(function() { if (cc) cc.innerHTML = '<div class="loading-coins">Ошибка загрузки. Попробуй позже.</div>'; });
}

function renderCoinCards(coins) {
  var cc = document.getElementById("coin-cards");
  if (!cc) return;
  cc.innerHTML = "";
  if (!coins.length) { cc.innerHTML = '<div class="loading-coins">Монеты не найдены</div>'; return; }
  coins.forEach(function(co) {
    var el = document.createElement("div");
    el.className = "coin-card"; el.dataset.sym = co.sym;
    el.innerHTML =
      '<div class="cc-sym">' + co.sym + '</div>' +
      '<div class="cc-info"><div class="cc-name">' + (co.name || co.sym) + '</div></div>' +
      '<div class="cc-check">✓</div>';
    el.addEventListener("click", function() { selectCoin(co.sym); });
    cc.appendChild(el);
  });
}

/* ── FOREX CARDS ── */
function buildForexCards() {
  var fc = document.getElementById("forex-cards");
  if (!fc) return;
  FOREX_LIST.forEach(function(f) {
    var el = document.createElement("div");
    el.className = "forex-card"; el.dataset.code = f.code;
    el.innerHTML =
      '<div class="fxc-flag">' + f.flag + '</div>' +
      '<div class="fxc-info"><div class="fxc-code">' + f.code + '</div><div class="fxc-name">' + f.name + '</div></div>' +
      '<div class="fxc-check">✓</div>';
    el.addEventListener("click", function() { selectForex(f.code); });
    fc.appendChild(el);
  });
}

/* ── SELECT ── */
function selectExchange(id) {
  selExchange = id;
  document.querySelectorAll(".exch-card").forEach(function(c) { c.classList.toggle("selected", c.dataset.id === id); });
  var btn = document.getElementById("exchange-next");
  if (btn) btn.disabled = false;
  loadCoins(id);
}
function selectCoin(sym) {
  selCoin = sym;
  document.querySelectorAll(".coin-card").forEach(function(c) { c.classList.toggle("selected", c.dataset.sym === sym); });
  var btn = document.getElementById("coin-next");
  if (btn) btn.disabled = false;
}
function selectForex(code) {
  selForex = code;
  document.querySelectorAll(".forex-card").forEach(function(c) { c.classList.toggle("selected", c.dataset.code === code); });
  var btn = document.getElementById("forex-next");
  if (btn) btn.disabled = false;
}

/* ── SEARCH ── */
document.getElementById("exchange-search").addEventListener("input", function() {
  var q = this.value.toLowerCase();
  document.querySelectorAll(".exch-card").forEach(function(c) { c.classList.toggle("hidden", c.textContent.toLowerCase().indexOf(q) === -1); });
});
document.getElementById("coin-search").addEventListener("input", function() {
  var q = this.value.toLowerCase().trim();
  if (!q) { renderCoinCards(allCoins.slice(0, 20)); return; }
  var filtered = allCoins.filter(function(c) {
    return c.sym.toLowerCase().indexOf(q) !== -1 || (c.name || "").toLowerCase().indexOf(q) !== -1;
  });
  renderCoinCards(filtered.slice(0, 50));
});
document.getElementById("forex-search").addEventListener("input", function() {
  var q = this.value.toLowerCase();
  document.querySelectorAll(".forex-card").forEach(function(c) { c.classList.toggle("hidden", c.textContent.toLowerCase().indexOf(q) === -1); });
});

/* ── NAV ── */
document.getElementById("exchange-next").addEventListener("click", function() { if (selExchange) showScreen("screen-coin"); });
document.getElementById("coin-back").addEventListener("click", function() { showScreen("screen-exchange"); });
document.getElementById("forex-back").addEventListener("click", function() { showScreen("screen-exchange"); });
document.getElementById("res-back").addEventListener("click", function() {
  showScreen(lastResultType === "forex" ? "screen-forex" : "screen-coin");
});

/* ── ANIMATE ── */
function startAnimate(steps, title, icon) {
  var fill = document.getElementById("an-fill");
  var sub  = document.getElementById("an-step");
  var ttl  = document.getElementById("an-title");
  var orb  = document.getElementById("orb-core");
  if (ttl) ttl.textContent = title || "Загружаем";
  if (orb) orb.textContent = icon || "◈";
  anIdx = 0;
  if (fill) fill.style.width = "10%";
  if (sub) sub.textContent = steps[0];
  anTimer = setInterval(function() {
    anIdx++;
    if (anIdx < steps.length) {
      if (sub) sub.textContent = steps[anIdx];
      if (fill) fill.style.width = Math.min(88, Math.round((anIdx + 1) / steps.length * 100)) + "%";
    }
    if (anIdx >= steps.length) clearInterval(anTimer);
  }, 900);
}
function stopAnimate() {
  clearInterval(anTimer);
  var fill = document.getElementById("an-fill");
  if (fill) fill.style.width = "100%";
}

/* ── ANALYZE ── */
document.getElementById("coin-next").addEventListener("click", doCryptoAnalyze);
document.getElementById("forex-next").addEventListener("click", doForexAnalyze);

function doCryptoAnalyze() {
  if (!selExchange || !selCoin) { toast("Выбери биржу и монету", "warn"); return; }
  lastResultType = "crypto";
  showScreen("screen-analyzing");
  startAnimate(AN_STEPS_CRYPTO, "Загружаем данные", selCoin.charAt(0));
  fetch(API_URL + "/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol: selCoin, exchange: selExchange, id: TG_ID, alert_pct: 5 })
  })
  .then(function(r) { return r.json(); })
  .then(function(json) {
    stopAnimate();
    if (!json || json.status !== "ok" || !json.data) {
      showScreen("screen-coin");
      setTimeout(function() { toast(json && json.message ? json.message : "Ошибка", "error"); }, 350);
      return;
    }
    renderResult(json.data, "crypto");
    showScreen("screen-result");
  })
  .catch(function() {
    stopAnimate(); showScreen("screen-coin");
    setTimeout(function() { toast("Сервер не отвечает", "error"); }, 350);
  });
}

function doForexAnalyze() {
  if (!selForex) { toast("Выбери валюту", "warn"); return; }
  lastResultType = "forex";
  showScreen("screen-analyzing");
  startAnimate(AN_STEPS_FOREX, "Загружаем курс", selForex.charAt(0));
  fetch(API_URL + "/analyze-forex", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base: selForex, quote: "USD", id: TG_ID, alert_pct: 1 })
  })
  .then(function(r) { return r.json(); })
  .then(function(json) {
    stopAnimate();
    if (!json || json.status !== "ok" || !json.data) {
      showScreen("screen-forex");
      setTimeout(function() { toast(json && json.message ? json.message : "Ошибка", "error"); }, 350);
      return;
    }
    renderResult(json.data, "forex");
    showScreen("screen-result");
  })
  .catch(function() {
    stopAnimate(); showScreen("screen-forex");
    setTimeout(function() { toast("Сервер не отвечает", "error"); }, 350);
  });
}

/* ── FORMAT ── */
function fmtPrice(v) {
  var n = Number(v) || 0;
  if (n >= 1000) return "$" + n.toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2});
  if (n >= 1)    return "$" + n.toFixed(2);
  if (n >= 0.01) return "$" + n.toFixed(4);
  return "$" + n.toFixed(6);
}
function fmtRate(v) {
  var n = Number(v) || 0;
  if (n >= 100) return n.toFixed(2);
  if (n >= 1)   return n.toFixed(4);
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
  var fc       = d.forecast    || {};
  var an       = d.ai_analysis || {};

  setText("res-sym-badge", isCrypto ? (d.symbol || selCoin) : (d.base + "/" + d.quote));
  setText("res-exch-tag",  isCrypto ? (d.exchange || selExchange || "").toUpperCase() : "FOREX");
  setText("ph-name",       isCrypto ? (d.name || d.symbol) : (d.base_name + " / " + d.quote_name));
  setText("ph-desc",       d.description || "");
  setText("ph-price",      priceStr);

  var chgEl = document.getElementById("ph-chg");
  if (chgEl) { chgEl.textContent = fmtChg(chg24); chgEl.className = "rh-chg mono " + (chg24 >= 0 ? "green" : "red"); }

  var prevPrice = price / (1 + chg24 / 100);
  var absDiff   = price - prevPrice;
  var chgIcon = document.getElementById("change-icon");
  var chgVal  = document.getElementById("change-val");
  var chgAbs  = document.getElementById("change-abs");
  if (chgIcon) { chgIcon.textContent = chg24 >= 0 ? "↑" : "↓"; chgIcon.className = "change-icon " + (chg24 >= 0 ? "green" : "red"); }
  if (chgVal)  { chgVal.textContent = fmtChg(chg24); chgVal.className = "change-val mono " + (chg24 >= 0 ? "green" : "red"); }
  if (chgAbs)  chgAbs.textContent = (absDiff >= 0 ? "+" : "") + (isCrypto ? fmtPrice(Math.abs(absDiff)) : fmtRate(Math.abs(absDiff)));

  var chg7Label = document.getElementById("chg7-label");
  if (chg7Label) { chg7Label.textContent = fmtChg(chg7); chg7Label.className = "chart-chg7 mono " + (chg7 >= 0 ? "green" : "red"); }

  drawChart(history, isCrypto);

  var pred7  = fc.predicted_7d  || 0;
  var pred30 = fc.predicted_30d || 0;
  var conf   = fc.confidence    || 50;
  var confFill = document.getElementById("conf-fill");
  if (confFill) confFill.style.width = conf + "%";
  setText("conf-pct", conf + "%");

  var diff7  = price > 0 ? ((pred7  - price) / price * 100) : 0;
  var diff30 = price > 0 ? ((pred30 - price) / price * 100) : 0;
  setText("fc-7d",  isCrypto ? fmtPrice(pred7)  : fmtRate(pred7));
  setText("fc-30d", isCrypto ? fmtPrice(pred30) : fmtRate(pred30));

  var fc7DirEl = document.getElementById("fc-7d-dir");
  if (fc7DirEl) { fc7DirEl.textContent = fmtChg(diff7); fc7DirEl.className = "fc-dir mono " + (diff7 >= 0 ? "green" : "red"); }
  var fc30DirEl = document.getElementById("fc-30d-dir");
  if (fc30DirEl) { fc30DirEl.textContent = fmtChg(diff30); fc30DirEl.className = "fc-dir mono " + (diff30 >= 0 ? "green" : "red"); }

  var suppEl = document.getElementById("fc-support");
  var resEl  = document.getElementById("fc-resist");
  if (suppEl) suppEl.textContent = fc.support    ? (isCrypto ? fmtPrice(fc.support)    : fmtRate(fc.support))    : "—";
  if (resEl)  resEl.textContent  = fc.resistance ? (isCrypto ? fmtPrice(fc.resistance) : fmtRate(fc.resistance)) : "—";

  setText("ai-summary", an.summary || "");
  setText("ai-risks",   an.risks   || "Волатильность рынка.");
  setText("ai-opp",     an.opportunity || an.factors || "Следите за объёмами.");

  var recTag = document.getElementById("ai-rec-tag");
  var rec    = an.recommendation || "держать";
  var rcls   = { "купить": "green", "накапливать": "green", "продать": "red", "держать": "yellow" };
  if (recTag) { recTag.textContent = rec; recTag.className = "ai-rec-tag " + (rcls[rec] || "yellow"); }

  var mt = d.metrics || {};
  var volEl  = document.getElementById("metric-vol");
  var liqEl  = document.getElementById("metric-liq");
  var sentEl = document.getElementById("metric-sent");
  if (volEl && mt.volatility) volEl.textContent = "Волатильность: " + mt.volatility;
  if (liqEl && mt.liquidity)  liqEl.textContent = "Ликвидность: "   + mt.liquidity;
  var sent = an.sentiment || "нейтральный";
  if (sentEl) {
    sentEl.textContent = "Настрой: " + sent;
    var scls = { "позитивный": "green", "негативный": "red", "осторожный": "yellow" };
    sentEl.className = "metric-pill " + (scls[sent] || "");
  }

  // Показываем кнопку мониторинга только для крипты
  setupMonitorButton(isCrypto);
}

/* ── КНОПКА МОНИТОРИНГА ── */
function setupMonitorButton(isCrypto) {
  var btn  = document.getElementById("start-monitor-btn");
  var info = document.getElementById("monitor-info");
  if (!btn || !info) return;

  // Для форекса — не показываем
  if (!isCrypto) { btn.style.display = "none"; info.style.display = "none"; return; }

  btn.style.display  = "block";
  info.style.display = "none";
  btn.disabled = false;
  btn.textContent = "🔔 Начать мониторинг";

  btn.onclick = function() {
    btn.disabled = true;
    btn.textContent = "Запуск...";
    fetch(API_URL + "/activate-monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tg_id: TG_ID, symbol: selCoin, exchange: selExchange })
    })
    .then(function(r) { return r.json(); })
    .then(function(res) {
      if (res.status === "ok") {
        btn.style.display = "none";
        info.style.display = "block";
        info.className = "monitor-info success";
        info.innerHTML =
          "✅ Мониторинг запущен на 7 дней!<br>" +
          "<span>У тебя осталось <b>" + (res.remaining !== undefined ? res.remaining : "—") + " из 3</b> запусков на эту неделю. Лимит обновляется каждые 7 дней.</span>";
      } else {
        btn.disabled = false;
        btn.textContent = "🔔 Начать мониторинг";
        info.style.display = "block";
        info.className = "monitor-info error";
        var msg = res.message || "Ошибка";
        if (msg.toLowerCase().indexOf("лимит") !== -1) {
          info.innerHTML = "⛔ Лимит исчерпан.<br><span>На этой неделе доступно 3 запуска. Лимит сбрасывается через 7 дней.</span>";
        } else {
          info.textContent = "⚠️ " + msg;
        }
      }
    })
    .catch(function() {
      btn.disabled = false;
      btn.textContent = "🔔 Начать мониторинг";
      info.style.display = "block";
      info.className = "monitor-info error";
      info.textContent = "⚠️ Сервер недоступен";
    });
  };
}

/* ── CHART ── */
function drawChart(history, isCrypto) {
  if (activeChart) { activeChart.destroy(); activeChart = null; }
  var canvas = document.getElementById("price-chart");
  if (!canvas) return;
  var labels = history.map(function(h) { return h.day; });
  var values = history.map(function(h) { return isCrypto ? h.price : h.rate; });
  if (!values.length) return;
  var minV = Math.min.apply(null, values);
  var maxV = Math.max.apply(null, values);
  var isUp = values[values.length - 1] >= values[0];
  var color = isUp ? "#22C55E" : "#EF4444";

  activeChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        data: values, borderColor: color, borderWidth: 2.5,
        pointBackgroundColor: color, pointRadius: 3, pointHoverRadius: 5,
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
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1C1C1F", borderColor: "rgba(245,197,24,0.3)", borderWidth: 1,
          titleColor: "#8A8780", bodyColor: "#F0EFE8",
          bodyFont: { family: "Arial", weight: "700", size: 13 },
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
        x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#8A8780", font: { family: "DM Sans", size: 11 } }, border: { display: false } },
        y: {
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: { color: "#8A8780", font: { family: "Arial", size: 10 },
            callback: function(v) { return isCrypto ? fmtPrice(v) : fmtRate(v); }
          },
          min: minV * 0.995, max: maxV * 1.005, border: { display: false }
        }
      }
    }
  });
}

/* ── NEW ── */
document.getElementById("new-btn").addEventListener("click", function() {
  selCoin = null; selForex = null;
  showScreen("screen-exchange");
});
