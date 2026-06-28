/* dashboard.js — updated 2026-06-24 07:40 */
/* تنسيقات الشارتات بعد تحميل الصفحة */
document.addEventListener("DOMContentLoaded", () => {
  "undefined" != typeof Chart &&
    ((Chart.defaults.font.family = "'IBM Plex Sans Arabic','Tajawal',sans-serif"),
    (Chart.defaults.font.size = 11),
    (Chart.defaults.color = "#7095A4"),
    (Chart.defaults.animation.duration = 700),
    (Chart.defaults.animation.easing = "easeOutQuart"),
    (Chart.defaults.plugins.legend.labels.boxWidth = 10),
    (Chart.defaults.plugins.legend.labels.boxHeight = 10),
    (Chart.defaults.plugins.legend.labels.borderRadius = 3),
    (Chart.defaults.plugins.legend.labels.padding = 16),
    (Chart.defaults.plugins.legend.labels.usePointStyle = !0),
    (Chart.defaults.plugins.legend.labels.pointStyle = "circle"),
    (Chart.defaults.plugins.tooltip.backgroundColor = "rgba(7,28,38,.92)"),
    (Chart.defaults.plugins.tooltip.titleColor = "rgba(255,255,255,.95)"),
    (Chart.defaults.plugins.tooltip.bodyColor = "rgba(255,255,255,.75)"),
    (Chart.defaults.plugins.tooltip.borderColor = "rgba(8,145,178,.3)"),
    (Chart.defaults.plugins.tooltip.borderWidth = 1),
    (Chart.defaults.plugins.tooltip.padding = 10),
    (Chart.defaults.plugins.tooltip.cornerRadius = 10),
    (Chart.defaults.plugins.tooltip.displayColors = !0),
    (Chart.defaults.plugins.tooltip.boxPadding = 4),
    (Chart.defaults.plugins.tooltip.titleFont = { size: 12, weight: "700" }),
    (Chart.defaults.plugins.tooltip.bodyFont = { size: 11 }),
    (Chart.defaults.plugins.tooltip.caretSize = 5),
    (Chart.defaults.scale.grid.color = "rgba(168,195,214,.18)"),
    (Chart.defaults.scale.grid.drawBorder = !1),
    (Chart.defaults.scale.ticks.padding = 6),
    (Chart.defaults.scale.border = { dash: [3, 3] }));
});


/* تحديد لغة الصفحة (عربي افتراضياً) */
window.LANG = window.LANG || "ar";


/* وضع العرض المؤقت: إخفاء/إظهار عناصر محددة بدون حذف أي كود */
// عند الفتح دايماً كل التبويبات ظاهرة (OFF) — لا يتذكر آخر حالة
window.__PRESENTATION_MODE__ = false;

function setPresentationMode(nextMode) {
  window.__PRESENTATION_MODE__ = !!nextMode;
  applyPresentationModeUI();
}

function togglePresentationMode() {
  setPresentationMode(!window.__PRESENTATION_MODE__);
}

function applyPresentationModeUI() {
  const on = !!window.__PRESENTATION_MODE__;
  const idsToHide = [
    "tabbtn-students",
    "tabbtn-seyana",
    "tab-students",
    "tab-seyana",
    "kpi-students-total",
    "kpi-students-max",
    "kpi-age-avg",
    "kpi-age-old",
    "kpi-age-new",
  ];
  idsToHide.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("presentation-hidden", on);
  });

  // الرقم الحقيقي دايماً — لا يُستبدل بأي رقم وهمي
  const kTotal = document.getElementById("k-total");
  if (kTotal && window.__ACTUAL_K_TOTAL__ != null) {
    kTotal.textContent = window.__ACTUAL_K_TOTAL__;
  }

  const btn = document.getElementById("btnPresentationMode");
  if (btn) {
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.title = on ? "إخفاء التبويبات: ON" : "إخفاء التبويبات: OFF";
    btn.textContent = on ? "👁" : "◌";
  }

  if (on) {
    const activeTab = document.querySelector(".tab.active");
    if (activeTab && (activeTab.id === "tabbtn-students" || activeTab.id === "tabbtn-seyana")) {
      const fallback = document.querySelector('.tab[onclick*="showTab(\'overview\'"]');
      if (fallback && typeof showTab === "function") showTab("overview", fallback);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // عند كل فتح: تأكد إن الوضع OFF (كل حاجة ظاهرة)
  window.__PRESENTATION_MODE__ = false;
  applyPresentationModeUI();
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key || "").toLowerCase() === "p") {
      e.preventDefault();
      togglePresentationMode();
    }
  });
});


/* === الإعدادات العامة + الفلاتر + التبويبات الأساسية === */
const CFG = {
    GAS_URL:
      "https://script.google.com/macros/s/AKfycbwkzDdgEXRJSzmDJqyk5LAUslLCXfqQ-nfi4VWxA4pDtb9uiG_LSFiioK9VgbI-KhAZ/exec",
    AUTO_INTERVAL_MS: 3e5,
    RETRY_MAX: 3,
    RETRY_DELAY_MS: 4e3,
    LOW_FCA_THRESHOLD: 50,

    // ════════════════════════════════════════════════════════════════
    // 🔑 إعدادات المساعد الذكي (OpenAI API)
    // ════════════════════════════════════════════════════════════════
    // ⚠️ هذه اللوحة تُستضاف على GitHub Pages بدون أي سيرفر خلفي، لذلك
    // لا يوجد — ولا يجب أن يوجد — أي مفتاح API داخل الكود المصدري.
    // كل مستخدم يُدخل مفتاحه الخاص من ⚙️ إعدادات المساعد، ويُخزَّن
    // محلياً في متصفحه فقط (localStorage) ولا يُرسل لأي مكان غير
    // OpenAI مباشرة. راجع وحدة AIService بالأسفل لكل منطق الاتصال —
    // لو احتجت لاحقاً تمرير الطلبات عبر سيرفر/بروكسي خاص بك، التعديل
    // يكون في AIService فقط دون لمس بقية اللوحة.
    OPENAI_MODEL: "gpt-5.4-mini", // الموديل الافتراضي لو المستخدم لم يحدد موديل آخر في الإعدادات
    OPENAI_API_URL: "https://api.openai.com/v1/chat/completions",
  },
  COLS = {
    minId: ["minId"],
    schoolSeq: ["schoolSeq"],
    mainMinId: ["mainMinId"],
    buildingSeq: ["buildingSeq"],
    buildingName: ["اسم_المدرسة"],
    name: ["اسم_المدرسة"],
    gender: ["الجنس"],
    stage: ["المرحلة"],
    ownership: ["حكومي_مستأجر"],
    linkType: ["نوع_الربط"],
    city: ["المدينة_الرئيسية"],
    district: ["الحي"],
    sector: ["المحافظة"],
    districtId: ["معرف_المحافظة"],
    classrooms: ["عدد_الفصول"],
    schoolSize: ["حجم_المدرسة"],
    buildingSize: ["نوع_المبنى", "حجم_المبنى"],
    lng: ["خط_الطول"],
    lat: ["خط_العرض"],
    acUnits: ["وحدات_التكييف"],
    alerts: ["عدد_البلاغات"],
    equipment: ["التجهيزات"],
    preventive: ["الصيانة_الوقائية"],
    drainage: ["خنادق_الصرف"],
    fca: ["قيمة_FCA"],
    envScore: ["درجة_البيئة_المدرسية"],
    envText: ["البيئة_المدرسية_نص"],
    contractId: ["معرف_العقد"],
    contractMaint: ["رقم_عقد_الصيانة"],
    contractAC: ["رقم_عقد_التكييف"],
    contractClean: ["رقم_عقد_النظافة"],
    contrMaint: ["مقاول_الصيانة"],
    contrAC: ["مقاول_التكييف"],
    contrClean: ["مقاول_النظافة"],
    projMaint: ["رقم_مشروع_الصيانة"],
    projAC: ["رقم_مشروع_التكييف"],
    projClean: ["رقم_مشروع_النظافة"],
    expMaint: ["حالة_الصيانة", "تاريخ_انتهاء_الصيانة"],
    expClean: ["حالة_النظافة", "تاريخ_انتهاء_النظافة"],
    expAC: ["حالة_التكييف", "تاريخ_انتهاء_التكييف"],
    notes: ["ملاحظات"],
    description: ["وصف_الصنف"],
    quantity: ["الكمية"],
    unitValue: ["قيمة_وحدة_البيئة", "سعر_الوحدة"],
    subscriptionStatus: ["حالة_الاشتراك"],
    students: ["عدد_الطلاب"],
    buildingAge: ["عمر_المبني"],
    ayenScore: ["تقييم_عاين"],
  },
  TIER = {
    critical: { label: "حرج", color: "#DC2626", bg: "#FEF2F2", min: 0, max: 24.99 },
    fair: { label: "متوسط", color: "#D97706", bg: "#FFFBEB", min: 25, max: 49.99 },
    good: { label: "جيد", color: "#059669", bg: "#ECFDF5", min: 50, max: 74.99 },
    vgood: { label: "جيد جداً", color: "#0891B2", bg: "#ECFEFF", min: 75, max: 100 },
  },
  PALETTE = [
    "#083D4F",
    "#0891B2",
    "#059669",
    "#D97706",
    "#DC2626",
    "#7C3AED",
    "#0E7490",
    "#B8860B",
    "#1D4ED8",
    "#9333EA",
    "#0F766E",
    "#C2410C",
  ];
let RAW = [],
  FILTERED = [],
  CHARTS = {},
  autoTimer = null,
  retryCount = 0,
  _filterTimer = null;
const TBL = { cur: 0, PAGE: 50 };
function getVal(row, field) {
  for (const k of COLS[field] || [field]) {
    const v = row[k];
    if (null != v && "" !== v && "#N/A" !== v && "NaT" !== v) return v;
  }
  return null;
}
const num = (v) => {
    if (null == v || "" === v || "#N/A" === v || "NaT" === v) return null;
    const n = parseFloat(String(v).replace(/,/g, ""));
    return isFinite(n) ? n : null;
  },
  fmt = (v, d = 0) =>
    null == v
      ? "—"
      : Number(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }),
  pct = (v, d = 1) => (null == v ? "—" : fmt(v, d) + "%"),
  esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m],
    ),
  avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
function getTier(v) {
  return null == v
    ? null
    : v <= 24.99
      ? "critical"
      : v <= 49.99
        ? "fair"
        : v <= 74.99
          ? "good"
          : "vgood";
}
const tierColor = (v) => TIER[getTier(v)]?.color || "#64748b",
  tierBg = (v) => TIER[getTier(v)]?.bg || "#f1f5f9";
function killChart(id) {
  if (CHARTS[id]) {
    try {
      CHARTS[id].destroy();
    } catch (_) {}
    delete CHARTS[id];
  }
}

/* ════════════════════════════════════════════════════════════════
   🛡️ دوال حماية عامة للرسوم البيانية (Chart.js Sanitizers)
   هدفها: منع ظهور undefined / null / NaN على أي محور أو تسمية أو
   tooltip في أي رسم بياني بالداشبورد بالكامل — تُستخدم كطبقة حماية
   أخيرة قبل تمرير البيانات لـ new Chart(...)
   ════════════════════════════════════════════════════════════════ */

// ينظّف قيمة نصية مفردة (label واحد): يرجع fallback لو القيمة فاضية/تالفة
function sanitizeText(value, fallback = "غير متوفر") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "number" && !Number.isFinite(value)) return fallback;
  const s = String(value).trim();
  if (!s || s === "undefined" || s === "null" || s === "NaN" || s === "#N/A") return fallback;
  return s;
}

// ينظّف قيمة رقمية مفردة: يرجع fallback (افتراضيًا null، آمن لـ Chart.js) لو القيمة غير صالحة
function safeNumber(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : fallback;
}

// يضمن أن القيمة دائماً مصفوفة (يحوّل أي قيمة غير مصفوفة لمصفوفة فاضية)
function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

// ينظّف مصفوفة تسميات (labels) كاملة لرسم بياني — كل عنصر يصبح نصاً آمناً دائماً
function sanitizeChartLabels(labels, fallback = "غير متوفر") {
  return safeArray(labels).map((l) => sanitizeText(l, fallback));
}

// ينظّف مصفوفة بيانات رقمية (data) كاملة — كل عنصر يصبح رقماً صالحاً أو null
function sanitizeChartValues(values) {
  return safeArray(values).map((v) => safeNumber(v, null));
}

/* ينظّف labels + datasets معاً قبل تمريرهما لـ Chart.js:
   - يوحّد طول labels مع أطول dataset
   - ينظّف كل تسمية وكل قيمة رقمية
   - dataset بدون أي قيمة صالحة يُستثنى تلقائياً من الرسم */
function normalizeChartData(labels, datasets) {
  const safeDatasets = safeArray(datasets)
    .map((ds) => {
      if (!ds || typeof ds !== "object") return null;
      const cleanData = sanitizeChartValues(ds.data);
      const hasAnyValidValue = cleanData.some((v) => v !== null);
      if (!cleanData.length || !hasAnyValidValue) return null; // dataset بدون أي قيمة صالحة لا يُرسم
      return { ...ds, label: sanitizeText(ds.label, ""), data: cleanData };
    })
    .filter(Boolean);
  const maxLen = safeDatasets.reduce((m, ds) => Math.max(m, ds.data.length), 0);
  let cleanLabels = sanitizeChartLabels(labels);
  // لو الـ labels أقصر من البيانات، نكمّلها بقيمة آمنة بدل ما تظهر undefined
  while (cleanLabels.length < maxLen) cleanLabels.push("غير متوفر");
  return { labels: cleanLabels, datasets: safeDatasets };
}

// يعرض رسالة "لا توجد بيانات" أنيقة بدل الكانفس الفاضي عند عدم وجود بيانات كافية لرسم شارت
function renderEmptyState(container, message = "لا توجد بيانات متاحة") {
  const el = typeof container === "string" ? document.getElementById(container) : container;
  if (!el) return;
  el.innerHTML = `<div class="chart-empty-state" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:160px;color:var(--tx-muted);gap:8px">
    <div style="font-size:30px;opacity:.5">📭</div>
    <div style="font-size:12px;font-weight:700">${sanitizeText(message)}</div>
  </div>`;
}

/* Callback آمن لمحاور Chart.js (ticks.callback) — يُستخدم في scales.x/y.ticks.callback
   لمنع ظهور undefined/null/NaN حتى لو وصلت القيمة الخام فاسدة لأي سبب وقت الرسم فعلياً.
   يعمل مع كلا نوعي المحاور: category (تمرّر index، نجيب label الحقيقي) وlinear (تمرّر القيمة مباشرة). */
function safeTickCallback(value, index, ticks) {
  const hasLabelGetter = this && typeof this.getLabelForValue === "function";
  const raw = hasLabelGetter ? this.getLabelForValue(value) : value;
  // لو الناتج رقم صالح (محور خطي)، نرجّعه كرقم بدل تحويله لنص "غير متوفر"
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  return sanitizeText(raw, "");
}

function setDot(s) {
  document.getElementById("dot").className = "dot " + s;
}
function setProgress(p) {
  const b = document.getElementById("prog");
  ((b.style.width = p + "%"), p >= 100 && setTimeout(() => (b.style.width = "0%"), 600));
}
function setText(id, v) {
  const el = document.getElementById(id);
  el && (el.textContent = v);
}
function setBtn(loading) {
  const btn = document.getElementById("btnReload");
  ((btn.disabled = loading), (btn.textContent = loading ? "جاري..." : "↻ تحديث"));
}
function showToast(html, type) {
  document.getElementById("toast-area").innerHTML = `<div class="toast ${type}">${html}</div>`;
}
function clearToast() {
  document.getElementById("toast-area").innerHTML = "";
}
function debounceFilter() {
  (clearTimeout(_filterTimer), (_filterTimer = setTimeout(applyFilters, 300)));
}
function updateDistrictBySector() {
  const city = document.getElementById("fCity").value;
  const sector = document.getElementById("fSector").value;
  const el = document.getElementById("fDistrict");
  if (!el) return;
  const prevDistrict = el.value;
  const allLabel = "en" === LANG ? "All" : "الكل";
  // Filter source: if sector selected → districts of that sector; else if city selected → districts of that city; else all
  let filtered;
  if (sector) {
    filtered = [
      ...new Set(
        RAW.filter((r) => r.sector === sector)
          .map((r) => r.district)
          .filter((d) => d && "—" !== d && "#N/A" !== d),
      ),
    ].sort((a, b) => a.localeCompare(b, "en" === LANG ? "en" : "ar"));
  } else if (city) {
    filtered = [
      ...new Set(
        RAW.filter((r) => r.city === city)
          .map((r) => r.district)
          .filter((d) => d && "—" !== d && "#N/A" !== d),
      ),
    ].sort((a, b) => a.localeCompare(b, "en" === LANG ? "en" : "ar"));
  } else {
    filtered = [
      ...new Set(RAW.map((r) => r.district).filter((d) => d && "—" !== d && "#N/A" !== d)),
    ].sort((a, b) => a.localeCompare(b, "en" === LANG ? "en" : "ar"));
  }
  el.innerHTML =
    `<option value="">${allLabel}</option>` +
    filtered.map((v) => `<option value="${v}">${v}</option>`).join("");
  // Restore previous value if still valid
  if (prevDistrict && [...el.options].some((o) => o.value === prevDistrict)) {
    el.value = prevDistrict;
  } else {
    el.value = "";
  }
}
function updateSectorByCity() {
  const city = document.getElementById("fCity").value;
  const el = document.getElementById("fSector");
  if (!el) return;
  const prevSector = el.value;
  // Build filtered sector list based on selected city
  const allLabel = "en" === LANG ? "All" : "الكل";
  if (!city) {
    // No city selected: show all sectors
    const allSectors = [
      ...new Set(RAW.map((r) => r.sector).filter((s) => s && "—" !== s && "#N/A" !== s)),
    ].sort((a, b) => a.localeCompare(b, "en" === LANG ? "en" : "ar"));
    el.innerHTML =
      `<option value="">${allLabel}</option>` +
      allSectors.map((v) => `<option value="${v}">${v}</option>`).join("");
  } else {
    // Filter sectors to only those belonging to the selected city
    const filtered = [
      ...new Set(
        RAW.filter((r) => r.city === city)
          .map((r) => r.sector)
          .filter((s) => s && "—" !== s && "#N/A" !== s),
      ),
    ].sort((a, b) => a.localeCompare(b, "en" === LANG ? "en" : "ar"));
    el.innerHTML =
      `<option value="">${allLabel}</option>` +
      filtered.map((v) => `<option value="${v}">${v}</option>`).join("");
  }
  // Restore previous sector if still valid, otherwise reset
  if (prevSector && [...el.options].some((o) => o.value === prevSector)) {
    el.value = prevSector;
  } else {
    el.value = "";
  }
}
function buildDynamicFilters() {
  function fillSelect(id, values) {
    const el = document.getElementById(id);
    if (!el) return;
    const prev = el.value,
      sorted = [...new Set(values.filter((v) => v && "—" !== v && "#N/A" !== v))].sort((a, b) =>
        a.localeCompare(b, "en" === LANG ? "en" : "ar"),
      ),
      allLabel = "en" === LANG ? "All" : "الكل";
    ((el.innerHTML =
      `<option value="">${allLabel}</option>` +
      sorted.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("")),
      prev && sorted.includes(prev) && (el.value = prev));
  }
  (fillSelect(
    "fCity",
    RAW.map((r) => r.city),
  ),
    fillSelect(
      "fStage",
      RAW.map((r) => r.stage),
    ),
    fillSelect(
      "fGender",
      RAW.map((r) => r.gender.replace(/\s+$/, "")),
    ),
    fillSelect(
      "fSize",
      RAW.map((r) => r.schoolSize),
    ),
    fillSelect(
      "fOwner",
      RAW.map((r) => r.ownership),
    ),
    fillSelect(
      "fDistrict",
      RAW.map((r) => r.district),
    ),
    fillSelect(
      "fSector",
      RAW.map((r) => r.sector),
    ),
    fillSelect(
      "fSubStatus",
      RAW.map((r) => r.subscriptionStatus),
    ));
  const cities = [...new Set(RAW.map((r) => r.city).filter((c) => c))],
    sectors = [...new Set(RAW.map((r) => r.sector).filter((s) => s && "#N/A" !== s))];
  ((document.getElementById("fg-city").style.display = cities.length > 1 ? "" : "none"),
    (document.getElementById("fg-sector").style.display = sectors.length > 1 ? "" : "none"));
  (setText("topTitle", "en" === LANG ? "Educational Facilities Management Dashboard" : "لوحة بيانات إدارة المرافق التعليمية"),
    setText("topSub", "FACILITIES MANAGEMENT DASHBOARD"),
    (window._SHOW_CITY_COL = cities.length > 1));
  const cityTh = document.getElementById("th-city");
  (cityTh && (cityTh.style.display = window._SHOW_CITY_COL ? "" : "none"),
    (window._SHOW_SECTOR_COL = sectors.length > 0));
  const sectorTh = document.getElementById("th-sector");
  sectorTh && (sectorTh.style.display = window._SHOW_SECTOR_COL ? "" : "none");
}
function applyFilters() {
  try {
    const city = document.getElementById("fCity").value,
      sector = document.getElementById("fSector").value,
      stage = document.getElementById("fStage").value,
      gender = document.getElementById("fGender").value,
      size = document.getElementById("fSize").value,
      owner = document.getElementById("fOwner").value,
      fcaMin = parseFloat(document.getElementById("fFcaMin").value) || 0,
      district = document.getElementById("fDistrict").value,
      subStatus = document.getElementById("fSubStatus")?.value || "",
      search = document.getElementById("fSearch").value.trim().toLowerCase(),
      linkChecked = [...document.querySelectorAll("#fLinkType input:checked")].map(
        (cb) => cb.value,
      );

    FILTERED = RAW.filter(
      (r) =>
        (!city || r.city === city) &&
        (!sector || r.sector === sector) &&
        (!stage || r.stage === stage) &&
        (!gender || r.gender.replace(/\s+$/, "") === gender.replace(/\s+$/, "")) &&
        (!size || r.schoolSize === size) &&
        (!owner || r.ownership === owner) &&
        (!district || r.district === district) &&
        (!subStatus || r.subscriptionStatus === subStatus) &&
        !(linkChecked.length && !linkChecked.includes(r.linkType)) &&
        (!fcaMin || !(null == r.fca || r.fca < fcaMin)) &&
        !(
          search &&
          !r.name.toLowerCase().includes(search) &&
          !String(r.minId || "")
            .toLowerCase()
            .includes(search) &&
          !r.district.toLowerCase().includes(search) &&
          !r.sector.toLowerCase().includes(search)
        ),
    );

    renderKPIs();
    renderTierStrip();

    const activeId = document.querySelector(".panel.active")?.id;
    const safeRun = (fn, name) => {
      try {
        fn();
      } catch (e) {
        console.error("[render:" + name + "]", e);
      }
    };

    if (activeId === "tab-overview") safeRun(renderOverviewCharts, "overview");
    if (activeId === "tab-fca") safeRun(renderFcaCharts, "fca");
    if (activeId === "tab-env") safeRun(renderEnvCharts, "env");
    if (activeId === "tab-stages") safeRun(renderStageCharts, "stages");
    if (activeId === "tab-stage-compare") safeRun(renderStageCompareTab, "stage-compare");
    if (activeId === "tab-fca-ref") safeRun(renderFcaRefTab, "fca-ref");
    if (activeId === "tab-contracts") safeRun(renderContractCharts, "contracts");
    if (activeId === "tab-all-contracts") safeRun(renderAllContracts, "all-contracts");
    if (activeId === "tab-sys-main") safeRun(renderSysMain, "sys-main");
    if (activeId === "tab-sys-detail") safeRun(renderSysDetail, "sys-detail");
    if (activeId === "tab-balagh") safeRun(renderBalaghTab, "balagh");
    if (activeId === "tab-tajheez") safeRun(renderTajheezInventoryTab, "tajheez");
    if (activeId === "tab-gatekeepers" && typeof renderGatekeepersTab === "function")
      safeRun(renderGatekeepersTab, "gatekeepers");
    if (activeId === "tab-seyana")
      safeRun(
        () =>
          renderSingleMetricTab(
            "seyana",
            "preventive",
            "الصيانة الوقائية",
            "#0891B2",
            "#ECFEFF",
            "🔧",
          ),
        "seyana",
      );
    if (activeId === "tab-khanadeq") safeRun(renderKhanadeqTab, "khanadeq");
    if (activeId === "tab-map") safeRun(renderMap, "map");
    if (activeId === "tab-spare") safeRun(renderSpareTab, "spare");
    if (activeId === "tab-students") safeRun(renderStudentsTab, "students");
    if (activeId === "tab-ayen") safeRun(renderAyenTab, "ayen");
    if (activeId === "tab-table") {
      TBL.cur = 0;
      safeRun(renderTable, "table");
    }
    if (activeId === "tab-ac-plan") safeRun(renderAcPlanTab, "ac-plan");
  } catch (err) {
    console.error("[applyFilters]", err);
    if (typeof showToast === "function") showToast("خطأ أثناء تحديث العرض: " + err.message, "err");
  }
}

function clearFilters() {
  (["fCity", "fSector", "fStage", "fGender", "fSize", "fOwner", "fDistrict", "fSubStatus"].forEach(
    (id) => {
      const el = document.getElementById(id);
      el && (el.value = "");
    },
  ),
    (document.getElementById("fFcaMin").value = "0"),
    (document.getElementById("fSearch").value = ""),
    document.querySelectorAll("#fLinkType input").forEach((cb) => (cb.checked = !1)),
    applyFilters());
}
function renderKPIs() {
  const D = FILTERED,
    total = D.length,
    govt = D.filter((r) => (r.ownership || "").includes("حكومي")).length,
    rented = D.filter((r) => (r.ownership || "").includes("مستأجر")).length,
    fcaArr = D.filter((r) => null != r.fca).map((r) => r.fca),
    envArr = D.filter((r) => null != r.envScore).map((r) => r.envScore),
    lowFca = fcaArr.filter((v) => v < CFG.LOW_FCA_THRESHOLD).length,
    dists = new Set(D.map((r) => r.district).filter((d) => d)).size,
    sectors = new Set(D.map((r) => r.sector).filter((s) => s)).size,
    classes = D.reduce((s, r) => s + (r.classrooms || 0), 0),
    alertsTotal = D.reduce((s, r) => s + (r.alerts || 0), 0),
    acTotal = D.reduce((s, r) => s + (r.acUnits || 0), 0);

  // حساب آخر تاريخ تقييم FCA ظهر في البيانات (لعرضه كمرجع)
  const fcaWithDate = D.filter((r) => null != r.fca && r.fcaDateObj);
  const latestDateObj = fcaWithDate.length
    ? fcaWithDate.reduce((mx, r) => (r.fcaDateObj > mx.fcaDateObj ? r : mx), fcaWithDate[0]).fcaDateObj
    : null;
  const latestDateLabel = latestDateObj
    ? latestDateObj.toLocaleDateString("ar-SA-u-nu-latn", { month: "long", year: "numeric" })
    : null;

  // دايماً احفظ الرقم الحقيقي واعرضه
  window.__ACTUAL_K_TOTAL__ = total.toLocaleString();
  (setText("k-total", total.toLocaleString()),
    setText(
      "k-total-sub",
      `${fcaArr.length.toLocaleString()} ${LANG === "en" ? "with FCA score" : "لها درجة FCA"} · ${sectors} ${LANG === "en" ? "governorate" : "محافظة"}`,
    ),
    setText("k-govt", govt.toLocaleString()),
    setText("k-rented", `${rented.toLocaleString()} ${LANG === "en" ? "rented" : "مستأجرة"}`),
    setText("k-fca-avg", pct(avg(fcaArr))),
    setText(
      "k-fca-cnt",
      latestDateLabel
        ? `${fcaArr.length.toLocaleString()} مدرسة · آخر تقييم: ${latestDateLabel}`
        : `${fcaArr.length.toLocaleString()} ${LANG === "en" ? "schools assessed" : "مدرسة مقيّمة"}`,
    ),
    setText("k-env-avg", pct(avg(envArr))),
    setText(
      "k-env-cnt",
      `${envArr.length.toLocaleString()} ${LANG === "en" ? "schools with score" : "مدرسة لها درجة"}`,
    ),
    setText("k-low-fca", lowFca.toLocaleString()),
    setText("k-districts", dists.toLocaleString()),
    setText(
      "k-classrooms",
      `${classes.toLocaleString()} ${LANG === "en" ? "total classrooms" : "فصل إجمالي"}`,
    ),
    setText("k-alerts-total", alertsTotal.toLocaleString()),
    setText("k-ac-total", acTotal.toLocaleString()));
  const studArr = D.filter((r) => null != r.students && r.students > 0),
    studTotal = studArr.reduce((s, r) => s + r.students, 0),
    studAvg = studArr.length ? studTotal / studArr.length : null,
    studMax = studArr.length
      ? studArr.reduce((mx, r) => (r.students > mx.students ? r : mx), studArr[0])
      : null;
  (setText("k-students-total", studTotal > 0 ? studTotal.toLocaleString() : "—"),
    setText(
      "k-students-avg",
      null != studAvg
        ? `${"en" === LANG ? "Avg" : "متوسط"} ${Math.round(studAvg).toLocaleString()} ${"en" === LANG ? "student/school" : "طالب/مدرسة"}`
        : "—",
    ),
    setText(
      "k-students-ctx",
      studArr.length > 0
        ? `${"en" === LANG ? "Based on" : "استناداً لبيانات"} ${studArr.length.toLocaleString()} ${"en" === LANG ? "schools" : "مدرسة"}`
        : "",
    ),
    setText("k-students-max", studMax ? studMax.students.toLocaleString() : "—"),
    setText("k-students-max-name", studMax ? studMax.name.slice(0, 28) : "—"));
  const ageArr = D.filter((r) => null != r.buildingAge && r.buildingAge > 0),
    ageAvg = ageArr.length ? ageArr.reduce((s, r) => s + r.buildingAge, 0) / ageArr.length : null,
    ageOld = ageArr.filter((r) => r.buildingAge > 40).length,
    ageNew = ageArr.filter((r) => r.buildingAge < 10).length;
  (setText("k-age-avg", null != ageAvg ? Math.round(ageAvg).toLocaleString() : "—"),
    setText(
      "k-age-cnt",
      `${ageArr.length.toLocaleString()} ${"en" === LANG ? "buildings assessed" : "مبنى مقيّم"}`,
    ),
    setText("k-age-old", ageOld.toLocaleString()),
    setText(
      "k-age-old-pct",
      ageArr.length
        ? `${"en" === LANG ? "of" : "من أصل"} ${ageArr.length.toLocaleString()} ${"en" === LANG ? "assessed" : "مبنى مقيّم"}`
        : "",
    ),
    setText("k-age-new", ageNew.toLocaleString()),
    setText(
      "k-age-new-pct",
      ageArr.length
        ? `${"en" === LANG ? "of" : "من أصل"} ${ageArr.length.toLocaleString()} ${"en" === LANG ? "assessed" : "مبنى مقيّم"}`
        : "",
    ));
}
function renderTierStrip() {
  const fcaArr = FILTERED.filter((r) => null != r.fca),
    total = fcaArr.length,
    counts = { critical: 0, fair: 0, good: 0, vgood: 0 };
  (fcaArr.forEach((r) => {
    const t = getTier(r.fca);
    t && counts[t]++;
  }),
    ["crit", "fair", "good", "vgood"].forEach((k, i) => {
      const key = ["critical", "fair", "good", "vgood"][i];
      (setText("t-" + k, counts[key]),
        setText("t-" + k + "-pct", total ? Math.round((counts[key] / total) * 100) + "%" : "—"));
    }),
    setText(
      "tier-sub",
      `${total.toLocaleString()} ${"en" === LANG ? "schools assessed" : "مدرسة مقيّمة"}`,
    ));
}
/* ╔════════════════════════════════════════════════════════════════╗
   ║            📖 دليل إضافة تبويب جديد — HOW TO ADD A NEW TAB    ║
   ╠════════════════════════════════════════════════════════════════╣
   ║                                                                ║
   ║  الخطوات (4 خطوات فقط):                                       ║
   ║                                                                ║
   ║  الخطوة 1 - أضف زر التبويب في HTML (حوالي السطر 649):         ║
   ║    <div class="tab" onclick="showTab('MY_TAB',this)">          ║
   ║      اسم التبويب                                               ║
   ║    </div>                                                       ║
   ║                                                                ║
   ║  الخطوة 2 - أضف محتوى HTML للتبويب (بعد آخر panel):           ║
   ║    <div class="panel" id="tab-MY_TAB">                         ║
   ║      <!-- محتوى التبويب HTML -->                               ║
   ║    </div>                                                       ║
   ║                                                                ║
   ║  الخطوة 3 - أضف دالة JS في قسم مناسب:                         ║
   ║    function renderMyTab() {                                    ║
   ║      const D = FILTERED;  // البيانات المفلترة               ║
   ║      const el = document.getElementById('my-tab-content');    ║
   ║      // ... كود التبويب ...                                   ║
   ║    }                                                           ║
   ║                                                                ║
   ║  الخطوة 4 - أضف السطرين التاليين في:                          ║
   ║    أ) دالة showTab() أدناه:                                    ║
   ║       "MY_TAB"===name && renderMyTab()                         ║
   ║    ب) دالة applyFilters():                                     ║
   ║       "tab-MY_TAB"===activeId && renderMyTab()                 ║
   ║                                                                ║
   ╚════════════════════════════════════════════════════════════════╝ */
function showTab(name, el) {
  if (window.__PRESENTATION_MODE__ && (name === "students" || name === "seyana")) {
    const fallback = document.getElementById("tabbtn-overview");
    return showTab("overview", fallback);
  }
  (document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active")),
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active")),
    document.getElementById("tab-" + name).classList.add("active"),
    el && el.classList.add("active"),
    "overview" === name && renderOverviewCharts(),
    "fca" === name && renderFcaCharts(),
    "env" === name && renderEnvCharts(),
    "stages" === name && renderStageCharts(),
    "stage-compare" === name && renderStageCompareTab(),
    "fca-ref" === name && renderFcaRefTab(),
    "contracts" === name && renderContractCharts(),
    "all-contracts" === name && renderAllContracts(),
    "sys-main" === name && renderSysMain(),
    "sys-detail" === name && renderSysDetail(),
    "balagh" === name && renderBalaghTab(),
    "tajheez" === name && renderTajheezInventoryTab(),
    "gatekeepers" === name && "function" === typeof renderGatekeepersTab && renderGatekeepersTab(),
    "seyana" === name &&
      renderSingleMetricTab("seyana", "preventive", "الصيانة الوقائية", "#0891B2", "#ECFEFF", "🔧"),
    "khanadeq" === name && renderKhanadeqTab(),
    "elevators" === name && renderElevatorsTab(),
    "cost" === name && renderCostTab(),
    "map" === name && renderMap(),
    "spare" === name && renderSpareTab(),
    "students" === name && renderStudentsTab(),
    "ayen" === name && renderAyenTab(),
    "table" === name && ((TBL.cur = 0), renderTable()),
    "ac-plan" === name && renderAcPlanTab(),
    "mag-kpi" === name && renderMagKpiTab());

}
function makeDoughnut(id, dataMap, colorMap = {}) {
  killChart(id);
  const entries = Object.entries(dataMap)
    .filter((x) => x[1] > 0)
    .sort((a, b) => b[1] - a[1]);
  entries.length &&
    (CHARTS[id] = new Chart(document.getElementById(id), {
      type: "doughnut",
      data: {
        labels: entries.map((x) => x[0] || "—"),
        datasets: [
          {
            data: entries.map((x) => x[1]),
            backgroundColor: entries.map(
              ([k], i) => (colorMap[k] || PALETTE[i % PALETTE.length]) + "DD",
            ),
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        maintainAspectRatio: !1,
        cutout: "60%",
        plugins: {
          legend: { position: "bottom", labels: { font: { size: 10 }, boxWidth: 12, padding: 6 } },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label || "—"}: ${ctx.raw.toLocaleString()} مدرسة`,
            },
          },
        },
      },
    }));
}
function makeHBar(id, labels, values, colors, maxVal = null, fullLabels = null) {
  killChart(id);
  const displayLabels = labels.map((l) =>
      String(l ?? "").length > 28 ? String(l ?? "").slice(0, 28) + "…" : String(l ?? ""),
    ),
    tooltipLabels = fullLabels || labels;
  CHARTS[id] = new Chart(document.getElementById(id), {
    type: "bar",
    data: {
      labels: displayLabels,
      datasets: [
        {
          label: "",
          data: values,
          backgroundColor: colors,
          borderColor: colors.map((c) => String(c).replace("BB", "FF")),
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      indexAxis: "y",
      maintainAspectRatio: !1,
      plugins: {
        legend: { display: !1 },
        tooltip: {
          mode: "nearest",
          intersect: !0,
          callbacks: {
            title: (ctx) => String(tooltipLabels[ctx[0].dataIndex] ?? ctx[0].label ?? "") || "—",
            label: (ctx) => `  ${maxVal ? ctx.raw + "%" : Number(ctx.raw).toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: !0,
          max: maxVal || void 0,
          ticks: { callback: (v) => (maxVal ? v + "%" : v.toLocaleString()) },
        },
        y: {
          ticks: { font: { size: 10 }, maxRotation: 0 },
          afterFit: (s) => {
            s.width = Math.max(s.width, 220);
          },
        },
      },
      onHover: (event, elements) => {
        event.native.target.style.cursor = elements.length ? "pointer" : "default";
      },
    },
  });
}
function makeVBar(id, labels, datasets) {
  killChart(id);
  // 🛡️ تنظيف شامل: نمنع وصول undefined/null/NaN لأي تسمية أو قيمة على المحاور
  const { labels: cleanLabels, datasets: cleanDatasets } = normalizeChartData(labels, datasets);
  if (!cleanLabels.length || !cleanDatasets.length) {
    renderEmptyState(document.getElementById(id)?.closest(".chart-box") || document.getElementById(id), "لا توجد بيانات متاحة");
    return;
  }
  const fullLabels = cleanLabels,
    displayLabels = cleanLabels.map((l) => (l.length > 16 ? l.slice(0, 16) + "…" : l));
  CHARTS[id] = new Chart(document.getElementById(id), {
    type: "bar",
    data: { labels: displayLabels, datasets: cleanDatasets },
    options: {
      maintainAspectRatio: !1,
      plugins: {
        legend: { position: "top", labels: { font: { size: 10 }, boxWidth: 10, padding: 10 } },
        tooltip: {
          callbacks: {
            title: (ctx) => sanitizeText(fullLabels[ctx[0].dataIndex] ?? ctx[0].label, "—"),
          },
        },
      },
      scales: {
        y: { beginAtZero: !0, ticks: { font: { size: 10 }, callback: safeTickCallback } },
        x: { ticks: { font: { size: 10 }, maxRotation: 30, callback: safeTickCallback } },
      },
    },
  });
}
/* ╔════════════════════════════════════════════════════════════╗
   ║  📊  JS تبويب: نظرة عامة
   ║  (tab-overview) — الدوال الخاصة بهذا التبويب تبدأ هنا
   ╚════════════════════════════════════════════════════════════╝ */
function renderOverviewCharts() {
  const D = FILTERED,
    histLabels = [
      "0–9",
      "10–19",
      "20–29",
      "30–39",
      "40–49",
      "50–59",
      "60–69",
      "70–79",
      "80–89",
      "90–100",
    ];
  killChart("ch-fca-hist");
  const fcaBins = Array(10).fill(0);
  (D.forEach((r) => {
    null != r.fca && fcaBins[Math.min(9, Math.floor(r.fca / 10))]++;
  }),
    (CHARTS["ch-fca-hist"] = new Chart(document.getElementById("ch-fca-hist"), {
      type: "bar",
      data: {
        labels: histLabels,
        datasets: [
          {
            label: "عدد المدارس",
            data: fcaBins,
            backgroundColor: histLabels.map((_, i) => tierColor(10 * i + 5) + "BB"),
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        maintainAspectRatio: !1,
        plugins: { legend: { display: !1 } },
        scales: {
          y: { beginAtZero: !0, title: { display: !0, text: "عدد المدارس" } },
          x: { title: { display: !0, text: "نطاق FCA" }, ticks: { font: { size: 10 } } },
        },
      },
    })),
    killChart("ch-env-hist"));
  const envBins = Array(10).fill(0);
  (D.forEach((r) => {
    null != r.envScore && envBins[Math.min(9, Math.floor(r.envScore / 10))]++;
  }),
    (CHARTS["ch-env-hist"] = new Chart(document.getElementById("ch-env-hist"), {
      type: "bar",
      data: {
        labels: histLabels,
        datasets: [
          {
            label: "عدد المدارس",
            data: envBins,
            backgroundColor: "#059669BB",
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        maintainAspectRatio: !1,
        plugins: { legend: { display: !1 } },
        scales: {
          y: { beginAtZero: !0, title: { display: !0, text: "عدد المدارس" } },
          x: { title: { display: !0, text: "نطاق البيئة" }, ticks: { font: { size: 10 } } },
        },
      },
    })));
  const sizeMap = {},
    ownerMap = {},
    linkMap = {};
  (D.forEach((r) => {
    (r.schoolSize && (sizeMap[r.schoolSize] = (sizeMap[r.schoolSize] || 0) + 1),
      r.ownership && (ownerMap[r.ownership] = (ownerMap[r.ownership] || 0) + 1),
      r.linkType &&
        "#N/A" !== r.linkType &&
        (linkMap[r.linkType] = (linkMap[r.linkType] || 0) + 1));
  }),
    makeDoughnut("ch-size", sizeMap, { كبير: "#083D4F", متوسط: "#0891B2", صغير: "#059669" }),
    makeDoughnut("ch-owner", ownerMap, { حكومي: "#083D4F", مستأجر: "#D97706" }),
    makeDoughnut("ch-link", linkMap, { مستقل: "#0891B2", "مشترك أساسي": "#059669" }));
  const subMap = {};
  (D.forEach((r) => {
    r.subscriptionStatus &&
      (subMap[r.subscriptionStatus] = (subMap[r.subscriptionStatus] || 0) + 1);
  }),
    makeDoughnut("ch-sub-status", subMap, { مستقل: "#0891B2", "مشترك أساسي": "#059669" }));
}
/* ╔════════════════════════════════════════════════════════════╗
   ║  📈  JS تبويب: تحليل FCA
   ║  (tab-fca) — الدوال الخاصة بهذا التبويب تبدأ هنا
   ╚════════════════════════════════════════════════════════════╝ */
function renderFcaCharts() {
  const D = FILTERED,
    withFca = D.filter((r) => null != r.fca).sort((a, b) => a.fca - b.fca),
    bot = withFca.slice(0, 20),
    top = [...withFca].reverse().slice(0, 20);
  (makeHBar(
    "ch-fca-bot",
    bot.map((r) => r.name),
    bot.map((r) => +r.fca.toFixed(1)),
    bot.map((r) => tierColor(r.fca) + "BB"),
    100,
    bot.map((r) => r.name),
  ),
    makeHBar(
      "ch-fca-top",
      top.map((r) => r.name),
      top.map((r) => +r.fca.toFixed(1)),
      top.map((r) => tierColor(r.fca) + "BB"),
      100,
      top.map((r) => r.name),
    ));
  const dMap = {};
  D.forEach((r) => {
    r.district &&
      null != r.fca &&
      (dMap[r.district] || (dMap[r.district] = []), dMap[r.district].push(r.fca));
  });
  const distData = Object.entries(dMap)
    .map(([k, v]) => ({ k: k, a: avg(v) }))
    .sort((a, b) => b.a - a.a)
    .slice(0, 20);
  (killChart("ch-fca-dist"),
    makeVBar(
      "ch-fca-dist",
      distData.map((x) => x.k),
      [
        {
          label: "متوسط FCA",
          data: distData.map((x) => +x.a.toFixed(1)),
          backgroundColor: distData.map((x) => tierColor(x.a) + "BB"),
          borderColor: distData.map((x) => tierColor(x.a)),
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
      "الحي",
      "متوسط FCA (%)",
    ));
  const stMap = {};
  D.forEach((r) => {
    r.stage &&
      null != r.fca &&
      (stMap[r.stage] || (stMap[r.stage] = []), stMap[r.stage].push(r.fca));
  });
  const stData = Object.entries(stMap).map(([k, v]) => ({ k: k, a: avg(v) }));
  (killChart("ch-fca-stage"),
    makeVBar(
      "ch-fca-stage",
      stData.map((x) => x.k),
      [
        {
          label: "متوسط FCA",
          data: stData.map((x) => +x.a.toFixed(1)),
          backgroundColor: "#0891B2BB",
          borderColor: "#0891B2",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
      "المرحلة",
      "متوسط FCA (%)",
    ));
  const szMap = {};
  D.forEach((r) => {
    r.schoolSize &&
      null != r.fca &&
      (szMap[r.schoolSize] || (szMap[r.schoolSize] = []), szMap[r.schoolSize].push(r.fca));
  });
  const szData = Object.entries(szMap).map(([k, v]) => ({ k: k, a: avg(v) })),
    szColors = { كبير: "#083D4F", متوسط: "#0891B2", صغير: "#059669" };
  (killChart("ch-fca-size"),
    makeVBar(
      "ch-fca-size",
      szData.map((x) => x.k),
      [
        {
          label: "متوسط FCA",
          data: szData.map((x) => +x.a.toFixed(1)),
          backgroundColor: szData.map((x) => (szColors[x.k] || "#64748b") + "BB"),
          borderColor: szData.map((x) => szColors[x.k] || "#64748b"),
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
      "حجم المدرسة",
      "متوسط FCA (%)",
    ));
}
/* ╔════════════════════════════════════════════════════════════╗
   ║  🌿  JS تبويب: البيئة المدرسية
   ║  (tab-env) — الدوال الخاصة بهذا التبويب تبدأ هنا
   ╚════════════════════════════════════════════════════════════╝ */
function renderEnvCharts() {
  const D = FILTERED; /* ===== FCA × البيئة — Heatmap مخصص ===== */
  (function renderFcaEnvHeatmap() {
    const wrap = document.getElementById("ch-scatter-heatmap");
    if (!wrap) return;
    wrap.innerHTML = "";

    const pts = D.filter((r) => null != r.fca && null != r.envScore);
    if (!pts.length) {
      wrap.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--tx-muted);font-size:13px">لا توجد بيانات</div>';
      return;
    }

    /* --- تهيئة canvas --- */
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
    wrap.style.position = "relative";
    wrap.appendChild(canvas);

    /* حجم الخلية: 5 نطاقات × 5 نطاقات = 25 خلية (كل 20%) */
    const BINS = 5;
    const grid = Array.from({ length: BINS }, () => Array(BINS).fill(0));
    const cells = Array.from({ length: BINS }, () =>
      Array(BINS)
        .fill(null)
        .map(() => []),
    );

    pts.forEach((r) => {
      const fx = Math.min(BINS - 1, Math.floor(r.fca / 20));
      const fy = Math.min(BINS - 1, Math.floor(r.envScore / 20));
      grid[fy][fx]++;
      cells[fy][fx].push(r);
    });

    const maxVal = Math.max(1, ...grid.flat());

    /* --- رسم --- */
    function draw() {
      const dpr = window.devicePixelRatio || 1;
      const W = wrap.clientWidth,
        H = wrap.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);

      const PAD = { top: 14, right: 14, bottom: 46, left: 52 };
      const plotW = W - PAD.left - PAD.right;
      const plotH = H - PAD.top - PAD.bottom;
      const cellW = plotW / BINS,
        cellH = plotH / BINS;

      const FONT = "'IBM Plex Sans Arabic','Tajawal',sans-serif";

      /* خلفية */
      ctx.fillStyle =
        getComputedStyle(document.documentElement).getPropertyValue("--bg-2") || "#f8fafc";
      ctx.fillRect(0, 0, W, H);

      /* ألوان الكثافة: من أبيض/رمادي فاتح → تيل غامق */
      function cellColor(v, alpha) {
        if (v === 0) return `rgba(240,247,250,${alpha})`;
        const t = v / maxVal;
        if (t < 0.2) return `rgba(186,230,253,${alpha})`; /* أزرق فاتح جداً */
        if (t < 0.4) return `rgba(56,189,248,${alpha})`; /* سماوي */
        if (t < 0.6) return `rgba(8,145,178,${alpha})`; /* تيل */
        if (t < 0.8) return `rgba(6,95,115,${alpha})`; /* تيل داكن */
        return `rgba(4,55,68,${alpha})`; /* داكن جداً */
      }
      function textColor(v) {
        const t = v / maxVal;
        return t < 0.35 ? "#0B3443" : "#ffffff";
      }

      /* خلايا */
      for (let row = 0; row < BINS; row++) {
        for (let col = 0; col < BINS; col++) {
          const yIdx = BINS - 1 - row; /* البيئة: أعلى = جيد جداً */
          const v = grid[yIdx][col];
          const x = PAD.left + col * cellW;
          const y = PAD.top + row * cellH;

          /* خلفية الخلية */
          ctx.fillStyle = cellColor(v, 1);
          ctx.beginPath();
          ctx.roundRect
            ? ctx.roundRect(x + 1, y + 1, cellW - 2, cellH - 2, 5)
            : ctx.rect(x + 1, y + 1, cellW - 2, cellH - 2);
          ctx.fill();

          /* العدد */
          if (v > 0) {
            ctx.fillStyle = textColor(v);
            ctx.font = `800 ${Math.max(11, Math.min(16, cellW * 0.28))}px ${FONT}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(v.toLocaleString("en-US"), x + cellW / 2, y + cellH / 2 - 3);

            /* النسبة */
            const pctStr = ((v / pts.length) * 100).toFixed(0) + "%";
            ctx.font = `600 ${Math.max(8, Math.min(11, cellW * 0.2))}px ${FONT}`;
            ctx.globalAlpha = 0.75;
            ctx.fillText(pctStr, x + cellW / 2, y + cellH / 2 + cellH * 0.2);
            ctx.globalAlpha = 1;
          }
        }
      }

      /* --- محاور --- */
      const LABELS = ["0–20", "20–40", "40–60", "60–80", "80–100"];
      const TIER_COLORS = ["#DC2626", "#D97706", "#059669", "#059669", "#0891B2"];

      ctx.textAlign = "center";
      ctx.font = `700 10px ${FONT}`;

      /* X axis labels — FCA */
      LABELS.forEach((lbl, i) => {
        const x = PAD.left + (i + 0.5) * cellW;
        ctx.fillStyle = TIER_COLORS[i];
        ctx.fillText(lbl, x, H - PAD.bottom + 14);
      });
      ctx.fillStyle = "#6B8795";
      ctx.font = `700 11px ${FONT}`;
      ctx.fillText("FCA %", PAD.left + plotW / 2, H - PAD.bottom + 30);

      /* Y axis labels — البيئة */
      ctx.textAlign = "right";
      ctx.font = `700 10px ${FONT}`;
      LABELS.forEach((lbl, i) => {
        const yIdx = BINS - 1 - i;
        const y = PAD.top + (i + 0.5) * cellH;
        ctx.fillStyle = TIER_COLORS[yIdx];
        ctx.fillText(lbl, PAD.left - 6, y + 3);
      });
      /* Y title */
      ctx.save();
      ctx.translate(13, PAD.top + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillStyle = "#6B8795";
      ctx.font = `700 10px ${FONT}`;
      ctx.fillText("البيئة المدرسية %", 0, 0);
      ctx.restore();

      /* خط الحدود للمخطط */
      ctx.strokeStyle = "rgba(168,195,214,.4)";
      ctx.lineWidth = 1;
      ctx.strokeRect(PAD.left, PAD.top, plotW, plotH);
    }

    draw();

    /* --- Tooltip تفاعلي --- */
    const tooltip = document.createElement("div");
    tooltip.style.cssText =
      "position:fixed;background:rgba(7,24,33,.94);color:#fff;font-family:'IBM Plex Sans Arabic','Tajawal',sans-serif;font-size:12px;padding:10px 14px;border-radius:10px;pointer-events:none;display:none;z-index:9999;direction:rtl;max-width:220px;border:1px solid rgba(8,145,178,.3);line-height:1.6";
    document.body.appendChild(tooltip);

    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width,
        H = rect.height;
      const PAD = { top: 14, right: 14, bottom: 46, left: 52 };
      const mx = e.clientX - rect.left,
        my = e.clientY - rect.top;
      const plotW = W - PAD.left - PAD.right,
        plotH = H - PAD.top - PAD.bottom;
      const cellW = plotW / BINS,
        cellH = plotH / BINS;

      const col = Math.floor((mx - PAD.left) / cellW);
      const row = Math.floor((my - PAD.top) / cellH);

      if (col < 0 || col >= BINS || row < 0 || row >= BINS) {
        tooltip.style.display = "none";
        return;
      }
      const yIdx = BINS - 1 - row;
      const v = grid[yIdx][col];
      const schoolList = cells[yIdx][col];
      const xMin = col * 20,
        xMax = (col + 1) * 20;
      const yMin = yIdx * 20,
        yMax = (yIdx + 1) * 20;

      const TIER_LBL = ["حرج", "متوسط", "جيد", "جيد", "جيد جداً"];
      const sample = schoolList
        .slice(0, 3)
        .map(
          (r) =>
            `<div style="font-size:10px;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">• ${r.name.slice(0, 28)}</div>`,
        )
        .join("");

      tooltip.innerHTML = `
      <div style="font-weight:800;color:#06B6D4;margin-bottom:5px">FCA: ${xMin}–${xMax}% × بيئة: ${yMin}–${yMax}%</div>
      <div style="font-size:13px;font-weight:800">${v} مدرسة <span style="font-size:10px;opacity:.7">(${((v / pts.length) * 100).toFixed(1)}%)</span></div>
      ${sample}
      ${schoolList.length > 3 ? `<div style="font-size:10px;opacity:.6;margin-top:3px">+ ${schoolList.length - 3} مدارس أخرى</div>` : ""}`;
      tooltip.style.display = "block";
      tooltip.style.left = e.clientX + 14 + "px";
      tooltip.style.top = e.clientY - 10 + "px";
    });
    canvas.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });
    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width,
        H = rect.height;
      const PAD = { top: 14, right: 14, bottom: 46, left: 52 };
      const mx = e.clientX - rect.left,
        my = e.clientY - rect.top;
      const plotW = W - PAD.left - PAD.right,
        plotH = H - PAD.top - PAD.bottom;
      const cellW = plotW / BINS,
        cellH = plotH / BINS;
      const col = Math.floor((mx - PAD.left) / cellW);
      const row = Math.floor((my - PAD.top) / cellH);
      if (col < 0 || col >= BINS || row < 0 || row >= BINS) return;
      const yIdx = BINS - 1 - row;
      const schoolList = cells[yIdx][col];
      if (!schoolList.length) return;
      const xMin = col * 20,
        xMax = (col + 1) * 20,
        yMin = yIdx * 20,
        yMax = (yIdx + 1) * 20;
      alert(
        `FCA: ${xMin}–${xMax}%  |  بيئة: ${yMin}–${yMax}%\n${schoolList.length} مدرسة:\n\n` +
          schoolList
            .slice(0, 15)
            .map(
              (r, i) =>
                `${i + 1}. ${r.name}  (FCA:${r.fca?.toFixed(0)}% | بيئة:${r.envScore?.toFixed(0)}%)`,
            )
            .join("\n") +
          (schoolList.length > 15 ? `\n...و${schoolList.length - 15} مدرسة أخرى` : ""),
      );
    });

    /* resize */
    const ro = new ResizeObserver(() => draw());
    ro.observe(wrap);
    /* cleanup عند تدمير التبويب */
    wrap._heatmapCleanup = () => {
      ro.disconnect();
      tooltip.remove();
    };
  })();
  const eMap = {};
  D.forEach((r) => {
    r.district &&
      null != r.envScore &&
      (eMap[r.district] || (eMap[r.district] = []), eMap[r.district].push(r.envScore));
  });
  const eData = Object.entries(eMap)
    .map(([k, v]) => ({ k: k, a: avg(v) }))
    .sort((a, b) => b.a - a.a)
    .slice(0, 20);
  (killChart("ch-env-dist"),
    makeVBar(
      "ch-env-dist",
      eData.map((x) => x.k),
      [
        {
          label: "متوسط البيئة",
          data: eData.map((x) => +x.a.toFixed(1)),
          backgroundColor: "#059669BB",
          borderColor: "#059669",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
      "الحي",
      "متوسط البيئة (%)",
    ));
  const ratingMap = {};
  D.forEach((r) => {
    r.envRating && (ratingMap[r.envRating] = (ratingMap[r.envRating] || 0) + 1);
  });
  makeDoughnut("ch-env-rating", ratingMap, {
    التميز: "#0891B2",
    التقدم: "#059669",
    الانطلاق: "#D97706",
    التهيئة: "#DC2626",
  });
  const secMapEnv = {};
  D.forEach((r) => {
    r.sector &&
      null != r.fca &&
      (secMapEnv[r.sector] || (secMapEnv[r.sector] = []), secMapEnv[r.sector].push(r.fca));
  });
  const secDataEnv = Object.entries(secMapEnv)
    .map(([k, v]) => ({ k: k, a: avg(v) }))
    .sort((a, b) => b.a - a.a);
  (killChart("ch-fca-sector"),
    makeVBar(
      "ch-fca-sector",
      secDataEnv.map((x) => x.k),
      [
        {
          label: "متوسط FCA",
          data: secDataEnv.map((x) => +x.a.toFixed(1)),
          backgroundColor: secDataEnv.map((x) => tierColor(x.a) + "BB"),
          borderColor: secDataEnv.map((x) => tierColor(x.a)),
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
      "المحافظة",
      "متوسط FCA (%)",
    ));
  const sorted = D.filter((r) => null != r.envScore).sort((a, b) => b.envScore - a.envScore),
    makeList = (schools, color) =>
      schools
        .map(
          (r) =>
            `\n    <div class="school-row">\n      <span class="school-score" style="color:${color}">${pct(r.envScore)}</span>\n      <div class="mini-track"><div class="mini-fill" style="width:${r.envScore}%;background:${color}80"></div></div>\n      <div style="min-width:0;flex:2">\n        <div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px">${esc(r.name)}</div>\n        <div style="font-size:10px;color:var(--tx-muted)">${esc(r.sector || r.district)} · ${esc(r.stage)} ${r.envRating ? "· <strong>" + esc(r.envRating) + "</strong>" : ""}${null != r.fca ? ' · FCA: <strong style="color:' + tierColor(r.fca) + '">' + pct(r.fca) + "</strong>" : ""}</div>\n      </div>\n    </div>`,
        )
        .join("");
  ((document.getElementById("env-top-list").innerHTML = makeList(sorted.slice(0, 10), "#059669")),
    (document.getElementById("env-bot-list").innerHTML = makeList(
      [...sorted].reverse().slice(0, 10),
      "#DC2626",
    )));
}
/* ╔════════════════════════════════════════════════════════════╗
   ║  🎓  JS تبويب: المرحلة الدراسية
   ║  (tab-stages) — الدوال الخاصة بهذا التبويب تبدأ هنا
   ╚════════════════════════════════════════════════════════════╝ */
function renderStageCharts() {
  const D = FILTERED,
    stCount = {};
  (D.forEach((r) => {
    r.stage && (stCount[r.stage] = (stCount[r.stage] || 0) + 1);
  }),
    killChart("ch-stages"),
    makeVBar(
      "ch-stages",
      Object.keys(stCount),
      [
        {
          label: "عدد المدارس",
          data: Object.values(stCount),
          backgroundColor: PALETTE.map((c) => c + "BB"),
          borderColor: PALETTE,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
      "المرحلة",
      "عدد المدارس",
    ));
  const stages = [...new Set(D.filter((r) => r.stage).map((r) => r.stage))];
  (killChart("ch-gender-stage"),
    (CHARTS["ch-gender-stage"] = new Chart(document.getElementById("ch-gender-stage"), {
      type: "bar",
      data: {
        labels: stages,
        datasets: [
          {
            label: "بنات",
            data: stages.map((s) => D.filter((r) => r.stage === s && "بنات" === r.gender).length),
            backgroundColor: "#DC262688",
            borderColor: "#DC2626",
            borderWidth: 1,
            borderRadius: 3,
          },
          {
            label: "بنين",
            data: stages.map((s) => D.filter((r) => r.stage === s && "بنين" === r.gender).length),
            backgroundColor: "#0891B288",
            borderColor: "#0891B2",
            borderWidth: 1,
            borderRadius: 3,
          },
        ],
      },
      options: {
        maintainAspectRatio: !1,
        plugins: { legend: { position: "top", labels: { font: { size: 10 }, boxWidth: 10 } } },
        scales: { x: { stacked: !1, ticks: { font: { size: 10 } } }, y: { beginAtZero: !0 } },
      },
    })),
    killChart("ch-fca-gender"));
  const girlAvg = stages.map((s) =>
      avg(D.filter((r) => r.stage === s && "بنات" === r.gender && null != r.fca).map((r) => r.fca)),
    ),
    boyAvg = stages.map((s) =>
      avg(D.filter((r) => r.stage === s && "بنين" === r.gender && null != r.fca).map((r) => r.fca)),
    );
  (makeVBar("ch-fca-gender", stages, [
    {
      label: "بنات",
      data: girlAvg.map((v) => (v ? +v.toFixed(1) : null)),
      backgroundColor: "#DC262688",
      borderColor: "#DC2626",
      borderWidth: 1,
      borderRadius: 3,
    },
    {
      label: "بنين",
      data: boyAvg.map((v) => (v ? +v.toFixed(1) : null)),
      backgroundColor: "#0891B288",
      borderColor: "#0891B2",
      borderWidth: 1,
      borderRadius: 3,
    },
  ]),
    killChart("ch-classes"));
  const clData = [0, 0, 0, 0, 0];
  (D.forEach((r) => {
    null != r.classrooms &&
      (r.classrooms <= 10
        ? clData[0]++
        : r.classrooms <= 20
          ? clData[1]++
          : r.classrooms <= 30
            ? clData[2]++
            : r.classrooms <= 40
              ? clData[3]++
              : clData[4]++);
  }),
    makeVBar(
      "ch-classes",
      ["1–10", "11–20", "21–30", "31–40", "41+"],
      [
        {
          label: "مدارس",
          data: clData,
          backgroundColor: "#0891B2BB",
          borderColor: "#0891B2",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    ),
    killChart("ch-ac"));
  const acData = [0, 0, 0, 0, 0];
  (D.forEach((r) => {
    null != r.acUnits &&
      (0 === r.acUnits
        ? acData[0]++
        : r.acUnits <= 15
          ? acData[1]++
          : r.acUnits <= 30
            ? acData[2]++
            : r.acUnits <= 50
              ? acData[3]++
              : acData[4]++);
  }),
    makeVBar(
      "ch-ac",
      ["0", "1–15", "16–30", "31–50", "50+"],
      [
        {
          label: "مدارس",
          data: acData,
          backgroundColor: "#0E7490BB",
          borderColor: "#0E7490",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    ));
}


// ════════════════════════════════════════════════════════════════════════
// renderStageCompareTab — ديناميكي: يتكيف مع أي عدد من المراحل والأشهر
// ════════════════════════════════════════════════════════════════════════
function renderStageCompareTab() {
  /* ── helpers ── */
  const normText = (v) => String(v ?? "").replace(/\uFEFF/g, "").trim().replace(/\s+/g, " ");
  const stripAr  = (v) => normText(v).replace(/[أإآ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/ـ/g,"").replace(/[\u064B-\u065F\u0670]/g,"");
  const schoolKey = (v) => stripAr(v).toLowerCase().replace(/[^\u0600-\u06FF0-9a-z]+/gi,"");

  const normMinId = (v) => { let s=String(v??"").replace(/\uFEFF/g,"").trim(); if(!s||s==="—")return""; return s.replace(/\.0+$/,""); };
  const getMinId  = (r) => normMinId(r["رقم_المدرسة_الوزاري"]??r["رقم_وزاري"]??r["رقم وزاري"]??r.minId??"");
  const getSchool = (r) => normText(r["اسم_المدرسة"]??r.schoolName??r.name??"");
  const getSector = (r) => normText(r["المحافظة"]??r.sector??"");
  const getCity   = (r) => normText(r["المدينة_الرئيسية"]??r["المدينة"]??r.city??"");
  const getStage  = (r) => normText(r["المرحلة"]??r.stage??r.phase??"");
  const getScore  = (r) => {
    const v = r["تقييم_FCA"]??r["تقييم_FCA_المرحلة"]??r["قيمة_FCA"]??r.fca??r.score??r["FCA"]??null;
    return num(v);
  };
  const monMap = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
  const getDate = (r) => {
    const v = r["التاريخ"]??r.date??null; if(!v)return null;
    const sm = String(v).match(/^([A-Za-z]{3})[- ](\d{2})$/);
    if(sm){ const m=monMap[sm[1].toLowerCase()]; if(m!==undefined)return new Date(2000+parseInt(sm[2]),m,1); }
    const d=new Date(v); return isNaN(d)?null:d;
  };
  const monthKey   = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  const monthLabel = (k) => { const mm=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]; const[y,m]=k.split("-").map(Number); return `${mm[m-1]} ${y}`; };

  // ألوان ديناميكية لأي عدد من المراحل
  const STAGE_PALETTE = [
    {bg:"rgba(8,145,178,0.55)",  bd:"#0891B2", kc:"kc-blue"},
    {bg:"rgba(124,58,237,0.55)", bd:"#7C3AED", kc:"kc-purple"},
    {bg:"rgba(5,150,105,0.55)",  bd:"#059669", kc:"kc-green"},
    {bg:"rgba(245,158,11,0.55)", bd:"#D97706", kc:"kc-amber"},
    {bg:"rgba(239,68,68,0.55)",  bd:"#DC2626", kc:"kc-red"},
    {bg:"rgba(99,102,241,0.55)", bd:"#6366F1", kc:"kc-blue"},
    {bg:"rgba(20,184,166,0.55)", bd:"#14B8A6", kc:"kc-teal"},
    {bg:"rgba(249,115,22,0.55)", bd:"#EA580C", kc:"kc-amber"},
  ];

  /* ── مصدر البيانات ── */
  const rawHistory = Array.isArray(window.RAW_FCA_HISTORY) ? window.RAW_FCA_HISTORY : [];
  const source     = rawHistory.length ? rawHistory : (Array.isArray(FILTERED) ? FILTERED : []);

  // بناء الصفوف الأولية — نقبل أي مرحلة غير فارغة
  const allRows = source.map(r => ({
    school:  getSchool(r),
    schoolK: schoolKey(getSchool(r)),
    sector:  getSector(r),
    city:    getCity(r),
    minId:   getMinId(r),
    stage:   getStage(r),
    score:   getScore(r),
    date:    getDate(r),
  })).filter(r => (r.minId||r.schoolK) && r.score!=null && r.stage);

  /* ── المراحل الفريدة — مرتبة بأول تاريخ ظهرت فيه (Apr→May→Jun→...) ── */
  const stageFirstDate = {};
  allRows.forEach(r => {
    if(r.date && r.stage){
      const k = monthKey(r.date);
      if(!stageFirstDate[r.stage] || k < stageFirstDate[r.stage]) stageFirstDate[r.stage] = k;
    }
  });
  // عنوان كل مرحلة = اسم الشهر العربي (أبريل/مايو/يونيو...) بدل "المرحلة الأولى/الثانية/..."
  const MM_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const stageLabel = (s) => {
    const k = stageFirstDate[s];
    if(!k) return s;
    const [,m] = k.split("-").map(Number);
    return MM_AR[m-1];
  };
  const allStages = [...new Set(allRows.map(r=>r.stage))].filter(Boolean).sort((a,b) => {
    const da = stageFirstDate[a] || "9999-99";
    const db = stageFirstDate[b] || "9999-99";
    return da !== db ? da.localeCompare(db) : a.localeCompare(b,"ar");
  });

  /* ── الأشهر الفريدة ── */
  const allMonthKeys = [...new Set(allRows.filter(r=>r.date).map(r=>monthKey(r.date)))].sort();

  /* ── فلتر المدينة ── */
  const cityEl = document.getElementById("stageCompareCity");
  if(cityEl){
    const cities=[...new Set(allRows.map(r=>r.city).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ar"));
    const cur=cityEl.value;
    cityEl.innerHTML='<option value="">— كل المناطق —</option>'+cities.map(c=>`<option value="${esc(c)}"${c===cur?" selected":""}>${esc(c)}</option>`).join("");
  }

  /* ── فلتر المرحلة ── */
  const stageFilterEl = document.getElementById("stageCompareStageFilter");
  if(stageFilterEl){
    const cur=stageFilterEl.value;
    stageFilterEl.innerHTML='<option value="">— كل المراحل —</option>'+allStages.map(s=>`<option value="${esc(s)}"${s===cur?" selected":""}>${esc(s)}</option>`).join("");
  }

  /* ── قراءة الفلاتر الحالية ── */
  const search      = (document.getElementById("stageCompareSearch")?.value||"").trim().toLowerCase();
  const cityFilter  = cityEl?.value||"";
  const stageFilter = stageFilterEl?.value||"";
  const sortMode    = document.getElementById("stageCompareSort")?.value||"avg_asc";

  /* ── تجميع البيانات per school ── */
  const groupKey = (r) => r.minId ? "ID::"+r.minId : "NM::"+schoolKey(r.sector)+"::"+r.schoolK;
  const bySchool = new Map();
  allRows.forEach(r => {
    if(cityFilter  && r.city!==cityFilter) return;
    if(stageFilter && r.stage!==stageFilter) return;
    const key = groupKey(r);
    if(!bySchool.has(key)) bySchool.set(key,{school:r.school,minId:r.minId,sector:r.sector,city:r.city,stages:{}});
    const entry = bySchool.get(key);
    if(!entry.stages[r.stage]) entry.stages[r.stage]={scores:[],dates:[]};
    entry.stages[r.stage].scores.push(r.score);
    if(r.date) entry.stages[r.stage].dates.push({score:r.score,date:r.date});
  });

  /* ── بناء صفوف الجدول ── */
  let rows = [...bySchool.values()].map(o => {
    const stageData = {};
    allStages.forEach(s => {
      const sd = o.stages[s];
      stageData[s] = sd ? { avg: avg(sd.scores), count: sd.scores.length, dates: sd.dates } : { avg: null, count: 0, dates: [] };
    });
    const scored = Object.values(stageData).filter(d=>d.avg!=null);
    const overallAvg = scored.length ? avg(scored.map(d=>d.avg)) : null;
    return { school: o.school||o.minId, minId: o.minId, sector: o.sector, city: o.city, stageData, overallAvg };
  });

  /* ── بحث ── */
  if(search) rows = rows.filter(r =>
    r.school.toLowerCase().includes(search)||String(r.minId??"").toLowerCase().includes(search)||
    String(r.sector??"").toLowerCase().includes(search)||String(r.city??"").toLowerCase().includes(search)
  );

  /* ── ترتيب ── */
  rows.sort((a,b)=>{
    if(sortMode==="avg_asc")  return (a.overallAvg??1e9)-(b.overallAvg??1e9);
    if(sortMode==="avg_desc") return (b.overallAvg??-1)-(a.overallAvg??-1);
    return a.school.localeCompare(b.school,"ar");
  });

  /* ── KPIs ── */
  const kpisEl = document.getElementById("stageCompareKpis");
  if(kpisEl){
    kpisEl.innerHTML = allStages.map((s,i)=>{
      const col = STAGE_PALETTE[i%STAGE_PALETTE.length];
      const cnt = rows.filter(r=>r.stageData[s]?.count>0).length;
      const avgV = avg(rows.filter(r=>r.stageData[s]?.avg!=null).map(r=>r.stageData[s].avg));
      return `<div class="kpi ${col.kc}" style="border-top:3px solid ${col.bd}">
        <div class="kpi-val" style="color:${col.bd}">${cnt}</div>
        <div class="kpi-lbl">${esc(stageLabel(s))}</div>
        <div class="kpi-sub">متوسط: ${avgV!=null?avgV.toFixed(1)+"%":"—"}</div>
      </div>`;
    }).join("")+`<div class="kpi kc-navy">
      <div class="kpi-val">${rows.length}</div>
      <div class="kpi-lbl">إجمالي المدارس</div>
      <div class="kpi-sub">بعد الفلاتر</div>
    </div>`;
  }

  const metaEl = document.getElementById("stageCompareMeta");
  if(metaEl) metaEl.textContent = `${rows.length} مدرسة · ${allStages.length} مراحل · ${allMonthKeys.length} شهر`;

  /* ── Chart 1: متوسط FCA لكل مرحلة (bar chart) ── */
  killChart("ch-stage-compare-main");
  // Top 15 schools by lowest avg
  const topRows = [...rows].sort((a,b)=>(a.overallAvg??1e9)-(b.overallAvg??1e9)).slice(0,15);
  if(topRows.length){
    CHARTS["ch-stage-compare-main"] = new Chart(document.getElementById("ch-stage-compare-main"),{
      type:"bar",
      data:{
        labels: topRows.map(r=>r.school.length>18?r.school.slice(0,18)+"…":r.school),
        datasets: allStages.map((s,i)=>{
          const col=STAGE_PALETTE[i%STAGE_PALETTE.length];
          return { label:stageLabel(s), data:topRows.map(r=>r.stageData[s]?.avg!=null?+r.stageData[s].avg.toFixed(1):null),
            backgroundColor:col.bg, borderColor:col.bd, borderWidth:1.5, borderRadius:4 };
        }),
      },
      options:{ maintainAspectRatio:false,
        plugins:{ legend:{position:"top",labels:{font:{size:10,weight:"700"},boxWidth:10}} },
        scales:{ x:{ticks:{font:{size:9},maxRotation:35},grid:{display:false}},
          y:{beginAtZero:true,suggestedMax:100,ticks:{font:{size:10}},
            title:{display:true,text:"تقييم FCA",font:{size:10,weight:"700"},color:"#6B8795"}} } }
    });
  }

  /* ── Chart 2: التطور الزمني لكل مرحلة ── */
  killChart("ch-stage-time");
  const timeEmpty  = document.getElementById("stageTimeChartEmpty");
  const timeCanvas = document.getElementById("ch-stage-time");
  // تجميع شهري لكل مرحلة
  const monthlyByStage = {};
  allStages.forEach(s=>{ monthlyByStage[s]=new Map(); });
  rows.forEach(r=>{
    allStages.forEach(s=>{
      (r.stageData[s]?.dates||[]).forEach(d=>{
        const k=monthKey(d.date);
        if(!monthlyByStage[s].has(k)) monthlyByStage[s].set(k,[]);
        monthlyByStage[s].get(k).push(d.score);
      });
    });
  });
  // نملأ كل الشهور من أول لآخر
  let chartMonthKeys=[];
  if(allMonthKeys.length){
    const[minY,minM]=allMonthKeys[0].split("-").map(Number);
    const[maxY,maxM]=allMonthKeys[allMonthKeys.length-1].split("-").map(Number);
    let cy=minY,cm=minM;
    while(cy<maxY||(cy===maxY&&cm<=maxM)){
      chartMonthKeys.push(`${cy}-${String(cm).padStart(2,"0")}`);
      cm++; if(cm>12){cm=1;cy++;}
    }
  }
  const hasTimeData = chartMonthKeys.length>0;
  if(timeEmpty) timeEmpty.style.display=hasTimeData?"none":"block";
  if(timeCanvas) timeCanvas.style.display=hasTimeData?"block":"none";
  if(hasTimeData && timeCanvas){
    CHARTS["ch-stage-time"]=new Chart(timeCanvas,{
      type:"line",
      data:{
        labels:chartMonthKeys.map(monthLabel),
        datasets:allStages.map((s,i)=>{
          const col=STAGE_PALETTE[i%STAGE_PALETTE.length];
          const series=chartMonthKeys.map(k=>{
            const scores=monthlyByStage[s].get(k);
            return scores?+avg(scores).toFixed(1):null;
          });
          return { label:stageLabel(s), data:series, borderColor:col.bd,
            backgroundColor:col.bd.replace(")",",0.08)").replace("rgb","rgba"),
            borderWidth:2.5, pointRadius:5, pointHoverRadius:8,
            pointBackgroundColor:"#fff", pointBorderColor:col.bd, pointBorderWidth:2.5,
            fill:false, tension:0.3, spanGaps:true };
        }),
      },
      options:{ maintainAspectRatio:false, interaction:{mode:"index",intersect:false},
        plugins:{ legend:{position:"top",labels:{font:{size:10,weight:"700"},boxWidth:10}} },
        scales:{ x:{ticks:{font:{size:10},maxRotation:40},grid:{display:false}},
          y:{beginAtZero:false,suggestedMin:0,suggestedMax:100,ticks:{font:{size:10}},
            title:{display:true,text:"متوسط FCA",font:{size:10,weight:"700"},color:"#6B8795"}} } }
    });
  }

  /* ── Chart 3: حسب المنطقة ── */
  killChart("ch-stage-region");
  const regionEmpty  = document.getElementById("stageRegionEmpty");
  const regionCanvas = document.getElementById("ch-stage-region");
  const byRegion = new Map();
  rows.forEach(r=>{
    const reg=r.city||"غير محدد";
    if(!byRegion.has(reg)) byRegion.set(reg,{region:reg,stages:{}});
    const entry=byRegion.get(reg);
    allStages.forEach(s=>{
      if(!entry.stages[s]) entry.stages[s]=[];
      if(r.stageData[s]?.avg!=null) entry.stages[s].push(r.stageData[s].avg);
    });
  });
  const regionRows=[...byRegion.values()].sort((a,b)=>{
    const na=allStages.reduce((s,st)=>s+(a.stages[st]?.length||0),0);
    const nb=allStages.reduce((s,st)=>s+(b.stages[st]?.length||0),0);
    return nb-na;
  });
  if(regionEmpty) regionEmpty.style.display=regionRows.length?"none":"block";
  if(regionCanvas) regionCanvas.style.display=regionRows.length?"block":"none";
  if(regionRows.length && regionCanvas){
    CHARTS["ch-stage-region"]=new Chart(regionCanvas,{
      type:"bar",
      data:{
        labels:regionRows.map(r=>r.region),
        datasets:allStages.map((s,i)=>{
          const col=STAGE_PALETTE[i%STAGE_PALETTE.length];
          return { label:stageLabel(s), data:regionRows.map(r=>{ const sc=r.stages[s]; return sc&&sc.length?+avg(sc).toFixed(1):null; }),
            backgroundColor:col.bg, borderColor:col.bd, borderWidth:1.5, borderRadius:4 };
        }),
      },
      options:{ maintainAspectRatio:false,
        plugins:{ legend:{position:"top",labels:{font:{size:10,weight:"700"},boxWidth:10}} },
        scales:{ x:{ticks:{font:{size:9},maxRotation:35},grid:{display:false}},
          y:{beginAtZero:true,suggestedMax:100,ticks:{font:{size:10}},
            title:{display:true,text:"متوسط FCA",font:{size:10,weight:"700"},color:"#6B8795"}} } }
    });
  }

  /* ── Chart 4: تغطية البيانات — doughnut per stage ── */
  const coverEl = document.getElementById("stageCoverCharts");
  if(coverEl){
    coverEl.innerHTML="";
    // نحسب عرض كل donut بناءً على عدد المراحل (max 4 في صف)
    const perRow = Math.min(allStages.length, 4);
    const cellW  = Math.floor(100 / perRow);
    allStages.forEach((s,i)=>{
      const col=STAGE_PALETTE[i%STAGE_PALETTE.length];
      const cnt=rows.filter(r=>r.stageData[s]?.count>0).length;
      const total=rows.length;
      const missing=total-cnt;
      const div=document.createElement("div");
      div.style.cssText=`width:${cellW}%;max-width:220px;min-width:120px;flex-shrink:0;text-align:center;padding:0 8px;box-sizing:border-box`;
      div.innerHTML=`<div style="font-size:11px;font-weight:700;margin-bottom:6px;color:${col.bd}">${esc(stageLabel(s))}</div>
        <div style="position:relative;height:160px"><canvas id="ch-stage-cover-${i}"></canvas></div>
        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">${cnt} من ${total}</div>`;
      coverEl.appendChild(div);
      const chartId=`ch-stage-cover-${i}`;
      killChart(chartId);
      CHARTS[chartId]=new Chart(document.getElementById(chartId),{
        type:"doughnut",
        data:{ labels:["مقيّمة","بدون تقييم"],
          datasets:[{data:[cnt,missing],backgroundColor:[col.bd,"#E5E7EB"],borderColor:"#fff",borderWidth:2}] },
        options:{ maintainAspectRatio:false,
          plugins:{ legend:{position:"bottom",labels:{font:{size:9},boxWidth:8}},
            tooltip:{callbacks:{label:(ctx)=>` ${ctx.label}: ${ctx.raw} مدرسة`}} } }
      });
    });
  }

  /* ── الجدول ── */
  const headEl = document.getElementById("stageCompareHead");
  const tbody  = document.getElementById("stageCompareBody");
  const emptyEl= document.getElementById("stageCompareEmpty");

  if(headEl){
    headEl.innerHTML="<tr>"+
      '<th style="text-align:right;padding-right:14px;min-width:180px">اسم المدرسة</th>'+
      '<th style="min-width:90px">الرقم الوزاري</th>'+
      '<th style="min-width:90px">المنطقة</th>'+
      '<th style="min-width:90px">المحافظة</th>'+
      allStages.map((s,i)=>{const col=STAGE_PALETTE[i%STAGE_PALETTE.length];return`<th style="min-width:80px;color:${col.bd}" title="${esc(s)}">${esc(stageLabel(s))}</th>`;}).join("")+
      '<th style="min-width:70px">متوسط</th>'+
      "</tr>";
  }

  if(emptyEl) emptyEl.style.display=rows.length?"none":"block";

  if(tbody){
    tbody.innerHTML="";
    if(rows.length){
      const frag=document.createDocumentFragment();
      // pagination simple: show all (could add paging later)
      rows.slice(0,500).forEach(r=>{
        const tr=document.createElement("tr");
        const stageCells=allStages.map((s,i)=>{
          const col=STAGE_PALETTE[i%STAGE_PALETTE.length];
          const sd=r.stageData[s];
          if(!sd||sd.avg==null) return `<td style="color:#ccc">—</td>`;
          const fc=tierColor(sd.avg);
          return `<td><span style="font-weight:800;color:${fc}">${sd.avg.toFixed(1)}%</span><span style="font-size:9px;color:var(--tx-muted);margin-inline-start:4px">(${sd.count})</span></td>`;
        }).join("");
        const avgColor = r.overallAvg!=null?tierColor(r.overallAvg):"#ccc";
        tr.innerHTML=
          `<td style="text-align:right;padding-right:14px;font-weight:700;white-space:normal;line-height:1.4">${esc(r.school)}</td>`+
          `<td style="font-size:11px;color:var(--tx-muted)">${esc(r.minId||"—")}</td>`+
          `<td style="font-size:11px">${esc(r.city||"—")}</td>`+
          `<td style="font-size:11px">${esc(r.sector||"—")}</td>`+
          stageCells+
          `<td><span style="font-weight:900;color:${avgColor}">${r.overallAvg!=null?r.overallAvg.toFixed(1)+"%":"—"}</span></td>`;
        frag.appendChild(tr);
      });
      tbody.appendChild(frag);
    } else {
      tbody.innerHTML='<tr><td colspan="20" class="empty-msg">لا توجد بيانات مطابقة.</td></tr>';
    }
  }
}

// ════════════════════════════════════════════════════════════════════════
// renderFcaRefTab — جدول FCA المرجعي (آخر تقييم لكل مدرسة)
// ════════════════════════════════════════════════════════════════════════
(function(){
  let _pageSize = 50; // قابل للتغيير من المستخدم
  let _page = 0;
  let _lastRows = [];

  window.setFcaRefPageSize = function(n){ _pageSize = parseInt(n)||50; _page=0; renderFcaRefTab(); };

  window.renderFcaRefTab = function renderFcaRefTab(resetPage) {
    if(resetPage) _page=0;
    const search   = (document.getElementById("fcaRefSearch")?.value||"").trim().toLowerCase();
    const cityF    = document.getElementById("fcaRefCity")?.value||"";
    const sectorF  = document.getElementById("fcaRefSector")?.value||"";
    const dateF    = document.getElementById("fcaRefDate")?.value||"";
    const tierF    = document.getElementById("fcaRefTier")?.value||"";
    const sortMode = document.getElementById("fcaRefSort")?.value||"fca_asc";

    // مصدر البيانات: RAW (كل المباني) مع fca و fcaDate
    const D = Array.isArray(RAW) ? RAW : [];

    // بناء قائمة المدن والمحافظات والتواريخ للفلاتر
    const cities  = [...new Set(D.map(r=>r.city).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ar"));
    const sectors = [...new Set(D.map(r=>r.sector).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ar"));
    const dates   = [...new Set(D.map(r=>r.fcaDate).filter(Boolean))].sort();

    const cityEl   = document.getElementById("fcaRefCity");
    const secEl    = document.getElementById("fcaRefSector");
    const dateEl   = document.getElementById("fcaRefDate");
    if(cityEl   && cityEl.options.length<=1)
      cityEl.innerHTML='<option value="">— كل —</option>'+cities.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");
    if(secEl    && secEl.options.length<=1)
      secEl.innerHTML='<option value="">— كل —</option>'+sectors.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join("");
    if(dateEl   && dateEl.options.length<=1)
      dateEl.innerHTML='<option value="">— كل —</option>'+dates.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join("");

    // فلترة — نستخدم نفس getTier الموجود في الداشبورد (critical/fair/good/vgood)
    let rows = D.filter(r=>{
      if(search && !r.name.toLowerCase().includes(search) && !String(r.minId??"").toLowerCase().includes(search)) return false;
      if(cityF   && r.city!==cityF)   return false;
      if(sectorF && r.sector!==sectorF) return false;
      if(dateF   && (r.fcaDate||"")!==dateF) return false;
      if(tierF){
        if(tierF==="none" && r.fca!=null) return false;
        if(tierF!=="none" && (r.fca==null || getTier(r.fca)!==tierF)) return false;
      }
      return true;
    });

    // ترتيب
    rows.sort((a,b)=>{
      if(sortMode==="fca_asc")  return (a.fca??1e9)-(b.fca??1e9);
      if(sortMode==="fca_desc") return (b.fca??-1)-(a.fca??-1);
      if(sortMode==="date_desc"){
        const da=a.fcaDateObj||new Date(0), db=b.fcaDateObj||new Date(0);
        return db-da;
      }
      return (a.name||"").localeCompare(b.name||"","ar");
    });

    _lastRows = rows;

    // KPIs
    const kpisEl = document.getElementById("fcaRefKpis");
    if(kpisEl){
      const withFca = rows.filter(r=>r.fca!=null);
      const avgFca  = withFca.length ? avg(withFca.map(r=>r.fca)) : null;
      const low     = withFca.filter(r=>r.fca<50).length;
      const dates_dist = {};
      withFca.forEach(r=>{ const d=r.fcaDate||"غير محدد"; dates_dist[d]=(dates_dist[d]||0)+1; });
      const latestDate = Object.entries(dates_dist).sort((a,b)=>b[0].localeCompare(a[0])).map(e=>`${e[0]}: ${e[1]}`).slice(0,3).join(" · ");
      kpisEl.innerHTML=
        `<div class="kpi kc-blue"><div class="kpi-val">${rows.length.toLocaleString()}</div><div class="kpi-lbl">إجمالي المدارس</div><div class="kpi-sub">بعد الفلاتر</div></div>`+
        `<div class="kpi kc-green"><div class="kpi-val">${withFca.length.toLocaleString()}</div><div class="kpi-lbl">لديها تقييم FCA</div><div class="kpi-sub">متوسط: ${avgFca!=null?avgFca.toFixed(1)+"%":"—"}</div></div>`+
        `<div class="kpi kc-amber"><div class="kpi-val">${(rows.length-withFca.length).toLocaleString()}</div><div class="kpi-lbl">بدون تقييم</div><div class="kpi-sub">لم يُقيَّم بعد</div></div>`+
        `<div class="kpi kc-red"><div class="kpi-val">${low.toLocaleString()}</div><div class="kpi-lbl">FCA أقل من 50%</div><div class="kpi-sub">تحتاج تدخل</div></div>`;
    }

    // الجدول مع pagination
    const tbody  = document.getElementById("fcaRefBody");
    const pagEl  = document.getElementById("fcaRefPag");
    if(!tbody) return;

    const pages   = Math.ceil(rows.length/_pageSize);
    _page         = Math.min(_page, Math.max(0,pages-1));
    const pageRows= rows.slice(_page*_pageSize, (_page+1)*_pageSize);

    tbody.innerHTML="";
    if(pageRows.length){
      const frag=document.createDocumentFragment();
      pageRows.forEach(r=>{
        const tr=document.createElement("tr");
        const fc = r.fca!=null ? tierColor(r.fca) : "#ccc";
        const tierLabel = r.fca!=null ? (TIER[getTier(r.fca)]?.label||"") : "—";
        tr.innerHTML=
          `<td style="text-align:right;padding-right:14px;font-weight:700;white-space:normal;line-height:1.4">${esc(r.name)}</td>`+
          `<td style="font-size:11px;color:var(--tx-muted)">${esc(r.minId||"—")}</td>`+
          `<td style="font-size:11px">${esc(r.city||"—")}</td>`+
          `<td style="font-size:11px">${esc(r.sector||"—")}</td>`+
          `<td>${r.fca!=null?`<span style="font-size:14px;font-weight:900;color:${fc}">${r.fca.toFixed(1)}%</span>`:'<span style="color:#ddd">—</span>'}</td>`+
          `<td>${r.fca!=null?`<span class="badge" style="background:${tierColor(r.fca)}22;color:${fc};border:1px solid ${fc}44">${tierLabel}</span>`:'—'}</td>`+
          `<td style="font-size:11px;color:var(--tx-muted)">${esc(r.fcaDate||"—")}</td>`;
        frag.appendChild(tr);
      });
      tbody.appendChild(frag);
    } else {
      tbody.innerHTML='<tr><td colspan="7" class="empty-msg">لا توجد نتائج مطابقة.</td></tr>';
    }

    // Pagination
    if(pagEl){
      if(pages<=1){ pagEl.innerHTML=""; return; }
      const prev = _page>0?`<button class="pag-btn" onclick="window.__fcaRefGo(${_page-1})">◀ السابق</button>`:`<button class="pag-btn" disabled>◀ السابق</button>`;
      const next = _page<pages-1?`<button class="pag-btn" onclick="window.__fcaRefGo(${_page+1})">التالي ▶</button>`:`<button class="pag-btn" disabled>التالي ▶</button>`;
      pagEl.innerHTML=`<span class="pag-info">الصفحة ${(_page+1).toLocaleString()} من ${pages.toLocaleString()} · ${rows.length.toLocaleString()} مدرسة</span><div class="pag-btns">${prev}<button class="pag-btn active">${_page+1}</button>${next}</div>`;
    }
  };

  window.__fcaRefGo = function(p){ _page=p; renderFcaRefTab(); };

  // ── Export CSV ──
  window.exportFcaRefCSV = function(){
    const rows = _lastRows;
    if(!rows||!rows.length){ alert("لا توجد بيانات للتصدير"); return; }
    const headers=["اسم_المدرسة","الرقم_الوزاري","المنطقة","المحافظة","آخر_FCA","التصنيف","آخر_شهر_تقييم"];
    const escCSV=(v)=>'"'+String(v==null?"":v).replace(/"/g,'""')+'"';
    const getTierLabel=(v)=>v==null?"—": TIER[getTier(v)]?.label || "—";
    const lines=[headers.map(escCSV).join(",")];
    rows.forEach(r=>{
      lines.push([r.name,r.minId,r.city,r.sector,r.fca!=null?r.fca.toFixed(2):"",getTierLabel(r.fca),r.fcaDate||""].map(escCSV).join(","));
    });
    const blob=new Blob(["\uFEFF"+lines.join("\n")],{type:"text/csv;charset=utf-8;"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download="FCA_المرجعي_"+new Date().toISOString().slice(0,10)+".csv"; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  };
})();



/* ╔════════════════════════════════════════════════════════════╗
   ║  📋  JS تبويب: العقود
   ║  (tab-contracts) — الدوال الخاصة بهذا التبويب تبدأ هنا
   ╚════════════════════════════════════════════════════════════╝ */
function renderContractCharts() {
  const D = FILTERED,
    mMap = {},
    acMap = {},
    clMap = {};
  (D.forEach((r) => {
    const m = r.contrMaint?.trim();
    m && (mMap[m] = (mMap[m] || 0) + 1);
    const a = r.contrAC?.trim();
    a && (acMap[a] = (acMap[a] || 0) + 1);
    const c = r.contrClean?.trim();
    c && (clMap[c] = (clMap[c] || 0) + 1);
  }),
    makeDoughnut("ch-cont-maint", mMap),
    makeDoughnut("ch-cont-ac", acMap),
    makeDoughnut("ch-cont-clean", clMap));
  document.getElementById("contracts-expiry").innerHTML = [
    { key: "expMaint", label: "الصيانة", color: "#0891B2", icon: "🔧" },
    { key: "expClean", label: "النظافة", color: "#059669", icon: "🧹" },
    { key: "expAC", label: "التكييف", color: "#D97706", icon: "❄️" },
  ]
    .map((f) => {
      const vals = D.map((r) => r[f.key]).filter(
          (v) => v && "NaT" !== v && null !== v && "" !== String(v).trim(),
        ),
        unique = [
          ...new Set(
            vals.map((v) => {
              const s = String(v).trim();
              try {
                const d = new Date(s);
                if (!isNaN(d.getTime()))
                  return d.toLocaleDateString("en" === LANG ? "en-US" : "ar-SA", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });
              } catch (_) {}
              return s;
            }),
          ),
        ].filter(Boolean),
        count = D.filter((r) => r[f.key] && "NaT" !== r[f.key]).length,
        pctCov = D.length ? Math.round((count / D.length) * 100) : 0;
      return `<div class="contract-card" style="border-right-color:${f.color}">\n      <div style="font-size:12px;font-weight:800;color:${f.color};margin-bottom:6px">${f.icon} عقود ${f.label}</div>\n      <div style="font-size:18px;font-weight:800;color:${f.color};margin-bottom:4px">${count.toLocaleString()} مبنى</div>\n      <div style="font-size:10px;color:var(--tx-muted);margin-bottom:8px">التغطية: ${pctCov}%</div>\n      <div style="font-size:11px;color:var(--tx-muted)">\n        ${
        unique.length
          ? unique
              .slice(0, 3)
              .map((d) => `<div style="margin-bottom:3px">📅 ${d}</div>`)
              .join("")
          : "<div>— لا توجد بيانات</div>"
      }\n        ${unique.length > 3 ? `<div style="color:var(--tx-sec)">+${unique.length - 3} تاريخ آخر</div>` : ""}\n      </div>\n    </div>`;
    })
    .join("");
}
/* ╔════════════════════════════════════════════════════════════╗
   ║  📢  JS مشترك: تبويب البلاغات (balagh) + الصيانة الوقائية (seyana)
   ║  كلا التبويبين يستخدمان نفس الدالة: renderSingleMetricTab()
   ║  البلاغات: renderSingleMetricTab("balagh", "alerts", ...)
   ║  الصيانة:  renderSingleMetricTab("seyana", "preventive", ...)
   ╚════════════════════════════════════════════════════════════╝ */
function renderSingleMetricTab(tabId, field, label, color, bgColor, icon) {
  const el = document.getElementById(tabId + "-content");
  if (!el) return;
  const D = FILTERED,
    vals = D.filter((r) => null != r[field]).map((r) => ({
      name: r.name,
      val: r[field],
      district: r.district,
      stage: r.stage,
    }));
  if (!vals.length)
    return void (el.innerHTML = `<div class="card" style="text-align:center;padding:48px 24px">\n      <div style="font-size:48px;margin-bottom:12px">${icon}</div>\n      <div style="font-size:16px;font-weight:800;color:var(--tx-main);margin-bottom:6px">لم يتم التحميل</div>\n    </div>`);
  const total = vals.reduce((s, r) => s + r.val, 0),
    avgVal = total / vals.length,
    maxVal = Math.max(...vals.map((r) => r.val)),
    minVal = Math.min(...vals.map((r) => r.val)),
    sorted = [...vals].sort((a, b) => b.val - a.val),
    byDistrict = {};
  D.filter((r) => null != r[field]).forEach((r) => {
    r.district &&
      (byDistrict[r.district] || (byDistrict[r.district] = []),
      byDistrict[r.district].push(r[field]));
  });
  const distData = Object.entries(byDistrict)
      .map(([k, v]) => ({ k: k, avg: v.reduce((a, b) => a + b, 0) / v.length }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 20),
    byStage = {};
  D.filter((r) => null != r[field] && r.stage).forEach((r) => {
    (byStage[r.stage] || (byStage[r.stage] = []), byStage[r.stage].push(r[field]));
  });
  const stageData = Object.entries(byStage).map(([k, v]) => ({
    k: k,
    avg: v.reduce((a, b) => a + b, 0) / v.length,
  }));
  ((el.innerHTML = `\n    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px">\n      <div class="card" style="border-top:3px solid ${color}">\n        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">إجمالي ${label}</div>\n        <div style="font-size:26px;font-weight:800;color:${color};letter-spacing:-.02em">${total.toLocaleString()}</div>\n        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">${vals.length.toLocaleString()} مدرسة</div>\n      </div>\n      <div class="card" style="border-top:3px solid ${color}">\n        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">المتوسط</div>\n        <div style="font-size:26px;font-weight:800;color:${color};letter-spacing:-.02em">${avgVal.toFixed(1)}</div>\n        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">لكل مدرسة</div>\n      </div>\n      <div class="card" style="border-top:3px solid ${color}">\n        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">أعلى قيمة</div>\n        <div style="font-size:26px;font-weight:800;color:${color};letter-spacing:-.02em">${maxVal.toLocaleString()}</div>\n        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">${esc(sorted[0]?.name?.slice(0, 25) || "")}</div>\n      </div>\n      <div class="card" style="border-top:3px solid ${color}">\n        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">أدنى قيمة</div>\n        <div style="font-size:26px;font-weight:800;color:${color};letter-spacing:-.02em">${minVal.toLocaleString()}</div>\n        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">${esc(sorted[sorted.length - 1]?.name?.slice(0, 25) || "")}</div>\n      </div>\n    </div>\n    <div class="g2 mb14">\n      <div class="card">\n        <div class="card-title">أعلى 20 مدرسة — ${label}</div>\n        <div class="chart-box" style="height:480px"><canvas id="ch-${tabId}-top"></canvas></div>\n      </div>\n      <div class="card">\n        <div class="card-title">متوسط ${label} حسب الحي <span class="sub">أعلى 20</span></div>\n        <div class="chart-box" style="height:480px"><canvas id="ch-${tabId}-dist"></canvas></div>\n      </div>\n    </div>\n    <div class="g2 mb14">\n      <div class="card">\n        <div class="card-title">توزيع القيم — ${label}</div>\n        <div class="chart-box" style="height:250px"><canvas id="ch-${tabId}-hist"></canvas></div>\n      </div>\n      <div class="card">\n        <div class="card-title">متوسط ${label} حسب المرحلة</div>\n        <div class="chart-box" style="height:250px"><canvas id="ch-${tabId}-stage"></canvas></div>\n      </div>\n    </div>`),
    requestAnimationFrame(() => {
      const top20 = sorted.slice(0, 20);
      (killChart(`ch-${tabId}-top`),
        (CHARTS[`ch-${tabId}-top`] = new Chart(document.getElementById(`ch-${tabId}-top`), {
          type: "bar",
          data: {
            labels: top20.map((r) => (r.name.length > 30 ? r.name.slice(0, 30) + "…" : r.name)),
            datasets: [
              {
                label: label,
                data: top20.map((r) => r.val),
                backgroundColor: color + "99",
                borderColor: color,
                borderWidth: 1.5,
                borderRadius: 4,
              },
            ],
          },
          options: {
            indexAxis: "y",
            maintainAspectRatio: !1,
            plugins: { legend: { display: !1 } },
            scales: { x: { beginAtZero: !0 }, y: { ticks: { font: { size: 10 } } } },
          },
        })),
        killChart(`ch-${tabId}-dist`),
        (CHARTS[`ch-${tabId}-dist`] = new Chart(document.getElementById(`ch-${tabId}-dist`), {
          type: "bar",
          data: {
            labels: distData.map((d) => (d.k.length > 18 ? d.k.slice(0, 18) + "…" : d.k)),
            datasets: [
              {
                label: "المتوسط",
                data: distData.map((d) => +d.avg.toFixed(1)),
                backgroundColor: color + "88",
                borderColor: color,
                borderWidth: 1,
                borderRadius: 4,
              },
            ],
          },
          options: {
            indexAxis: "y",
            maintainAspectRatio: !1,
            plugins: { legend: { display: !1 } },
            scales: { x: { beginAtZero: !0 }, y: { ticks: { font: { size: 10 } } } },
          },
        })));
      const bSize = (maxVal - minVal || 1) / 10,
        histLabels = Array.from(
          { length: 10 },
          (_, i) => `${Math.round(minVal + i * bSize)}–${Math.round(minVal + (i + 1) * bSize)}`,
        ),
        histData = Array(10).fill(0);
      (vals.forEach((r) => {
        histData[Math.min(9, Math.floor((r.val - minVal) / bSize))]++;
      }),
        killChart(`ch-${tabId}-hist`),
        (CHARTS[`ch-${tabId}-hist`] = new Chart(document.getElementById(`ch-${tabId}-hist`), {
          type: "bar",
          data: {
            labels: histLabels,
            datasets: [
              {
                label: label,
                data: histData,
                backgroundColor: color + "AA",
                borderColor: color,
                borderWidth: 1,
                borderRadius: 4,
              },
            ],
          },
          options: {
            maintainAspectRatio: !1,
            plugins: { legend: { display: !1 } },
            scales: {
              x: { ticks: { font: { size: 9 }, maxRotation: 40 } },
              y: { beginAtZero: !0, ticks: { stepSize: 1 } },
            },
          },
        })),
        killChart(`ch-${tabId}-stage`),
        (CHARTS[`ch-${tabId}-stage`] = new Chart(document.getElementById(`ch-${tabId}-stage`), {
          type: "bar",
          data: {
            labels: stageData.map((s) => s.k),
            datasets: [
              {
                label: "المتوسط",
                data: stageData.map((s) => +s.avg.toFixed(1)),
                backgroundColor: stageData.map(
                  (_, i) => [color, "#0891B2", "#059669", "#D97706"][i % 4] + "BB",
                ),
                borderColor: stageData.map(
                  (_, i) => [color, "#0891B2", "#059669", "#D97706"][i % 4],
                ),
                borderWidth: 1.5,
                borderRadius: 5,
              },
            ],
          },
          options: {
            maintainAspectRatio: !1,
            plugins: { legend: { display: !1 } },
            scales: { x: { ticks: { font: { size: 10 } } }, y: { beginAtZero: !0 } },
          },
        })));
    }));
}
/* ╔════════════════════════════════════════════════════════════╗
   ║  📅  JS تبويب: الجدول التفصيلي
   ║  (tab-table) — الدوال الخاصة بهذا التبويب تبدأ هنا
   ╚════════════════════════════════════════════════════════════╝ */
function renderTable() {
  const D = [...FILTERED],
    sort = document.getElementById("tbl-sort")?.value || "fca_asc",
    searchVal = (document.getElementById("tbl-search")?.value || "").trim().toLowerCase(),
    sorters = {
      fca_asc: (a, b) => (a.fca ?? 999) - (b.fca ?? 999),
      fca_desc: (a, b) => (b.fca ?? -1) - (a.fca ?? -1),
      env_asc: (a, b) => (a.envScore ?? 999) - (b.envScore ?? 999),
      env_desc: (a, b) => (b.envScore ?? -1) - (a.envScore ?? -1),
      ayen_asc: (a, b) => (a.ayenScore ?? 999) - (b.ayenScore ?? 999),
      ayen_desc: (a, b) => (b.ayenScore ?? -1) - (a.ayenScore ?? -1),
      students_desc: (a, b) => (b.students ?? -1) - (a.students ?? -1),
      age_desc: (a, b) => (b.buildingAge ?? -1) - (a.buildingAge ?? -1),
      name: (a, b) => a.name.localeCompare(b.name, "ar"),
    },
    filtered = searchVal
      ? D.filter(
          (r) =>
            r.name.toLowerCase().includes(searchVal) ||
            String(r.minId || "")
              .toLowerCase()
              .includes(searchVal) ||
            String(r.schoolSeq || "")
              .toLowerCase()
              .includes(searchVal),
        )
      : D;
  filtered.sort(sorters[sort] || sorters.fca_asc);
  const total = filtered.length,
    pageSize = TBL.PAGE,
    maxPage = Math.max(0, Math.ceil(total / pageSize) - 1);
  TBL.cur = Math.min(TBL.cur, maxPage);
  const start = TBL.cur * pageSize,
    page = filtered.slice(start, start + pageSize);
  setText(
    "tbl-cnt",
    `${total.toLocaleString()} ${"en" === LANG ? "school" : "مدرسة"}${searchVal ? ("en" === LANG ? " (search results)" : " (نتائج البحث)") : ""}`,
  );
  const showCity = !0 === window._SHOW_CITY_COL,
    showSector = !1 !== window._SHOW_SECTOR_COL,
    cityTh = document.getElementById("th-city"),
    sectorTh = document.getElementById("th-sector");
  (cityTh && (cityTh.style.display = showCity ? "" : "none"),
    sectorTh && (sectorTh.style.display = showSector ? "" : "none"));
  const frag = document.createDocumentFragment(),
    tbody = document.getElementById("tbl-body");
  ((tbody.innerHTML = ""),
    page.forEach((r, pageIdx) => {
      const fc = null != r.fca ? tierColor(r.fca) : "#ccc",
        ec = null != r.envScore ? tierColor(r.envScore) : "#ccc",
        genderStyle =
          "بنات" === r.gender
            ? "background:#FEF2F2;color:#DC2626;border-color:#FECACA"
            : "بنين" === r.gender
              ? "background:#ECFEFF;color:#0891B2;border-color:#A5F3FC"
              : "",
        tr = document.createElement("tr");
      tr.dataset.rowIdx = String(start + pageIdx);
      tr.dataset.minId = r.minId || "";
      ((tr.innerHTML = `
 <td style="text-align:right;padding-right:14px"> <div style="font-weight:700;font-size:12px;max-width:200px;white-space:normal;line-height:1.4">${esc(r.name)}</div> </td> <td style="font-size:11px;display:${showCity ? "" : "none"}">${esc(r.city)}</td> <td style="font-size:11px;display:${showSector ? "" : "none"}">${esc(r.sector) || "—"}</td> <td style="font-size:10px;color:var(--tx-muted)">${esc(r.minId) || "—"}</td> <td><span class="badge" style="${genderStyle};border:1px solid">${esc(r.gender)}</span></td> <td style="font-size:11px;white-space:normal">${esc(r.stage)}</td> <td> <span class="badge" style="background:${"حكومي" === r.ownership ? "#ECFEFF" : "#FFFBEB"}; color:${"حكومي" === r.ownership ? "#0891B2" : "#D97706"}; border:1px solid ${"حكومي" === r.ownership ? "#A5F3FC" : "#FDE68A"}"> ${esc(r.ownership)} </span> </td> <td style="font-size:11px;max-width:100px;white-space:normal">${esc(r.district)}</td> <td style="font-weight:700">${r.classrooms ?? "—"}</td> <td style="font-size:11px">${esc(r.schoolSize)}</td> <td> ${null != r.fca ? `<span style="font-size:13px;font-weight:800;color:${fc}">${pct(r.fca)}</span>` : '<span style="color:#ddd">—</span>'} </td> <td> ${null != r.envScore ? `<span style="font-size:13px;font-weight:800;color:${ec}">${pct(r.envScore)}</span>` : '<span style="color:#ddd">—</span>'} </td> <td style="background:${null != r.ayenScore ? tierBg(r.ayenScore) : "transparent"};text-align:center"> ${null != r.ayenScore ? `<span style="font-size:13px;font-weight:800;color:${tierColor(r.ayenScore)}">${r.ayenScore.toFixed(1)}%</span> <div style="height:3px;width:${Math.min(r.ayenScore, 100)}%;max-width:56px;margin:3px auto 0;background:${tierColor(r.ayenScore)};border-radius:2px;opacity:.55"></div>` : '<span style="color:#ddd">—</span>'} </td> <td style="font-weight:700;color:${null != r.students ? "#059669" : "#ccc"}">${null != r.students ? r.students.toLocaleString() : "—"}</td> <td style="font-weight:700;color:${null != r.buildingAge ? (r.buildingAge >= 40 ? "#DC2626" : r.buildingAge >= 25 ? "#D97706" : "#059669") : "#ccc"}">${null != r.buildingAge ? r.buildingAge + ("en" === LANG ? " yr" : " سنة") : "—"}</td> <td style="font-size:11px;max-width:160px;white-space:normal;line-height:1.4;color:${r.description ? "var(--tx-main)" : "#ccc"}">${esc(r.description) || "—"}</td> <td style="font-weight:700;color:${null != r.quantity ? "#059669" : "#ccc"}">${r.quantity ?? "—"}</td> <td style="font-weight:700;color:${null != r.unitValue ? "#0891B2" : "#ccc"}">${null != r.unitValue ? fmt(r.unitValue, 2) : "—"}</td>`),
        frag.appendChild(tr));
    }),
    tbody.appendChild(frag),
    setText(
      "pag-info",
      "en" === LANG
        ? `Rows ${(start + 1).toLocaleString()}–${Math.min(start + pageSize, total).toLocaleString()} of ${total.toLocaleString()}`
        : `الصفوف ${(start + 1).toLocaleString()}–${Math.min(start + pageSize, total).toLocaleString()} من ${total.toLocaleString()}`,
    ));
  const pagBtns = document.getElementById("pag-btns");
  pagBtns.innerHTML = "";
  const addBtn = (label, page, disabled, active = !1) => {
    const b = document.createElement("button");
    ((b.className = "pag-btn" + (active ? " active" : "")),
      (b.textContent = label),
      (b.disabled = disabled),
      disabled ||
        (b.onclick = () => {
          ((TBL.cur = page), renderTable());
        }),
      pagBtns.appendChild(b));
  };
  addBtn("en" === LANG ? "◄ Prev" : "◄ السابق", TBL.cur - 1, 0 === TBL.cur);
  let lo = Math.max(0, TBL.cur - 3),
    hi = Math.min(maxPage, TBL.cur + 3);
  lo > 0 &&
    (addBtn("1", 0, !1, !1),
    lo > 1 &&
      pagBtns.appendChild(
        Object.assign(document.createElement("span"), {
          textContent: "…",
          style: "padding:0 4px;color:var(--tx-muted)",
        }),
      ));
  for (let i = lo; i <= hi; i++) addBtn(String(i + 1), i, !1, i === TBL.cur);
  (hi < maxPage &&
    (pagBtns.appendChild(
      Object.assign(document.createElement("span"), {
        textContent: "…",
        style: "padding:0 4px;color:var(--tx-muted)",
      }),
    ),
    addBtn(String(maxPage + 1), maxPage, !1, !1)),
    addBtn("en" === LANG ? "Next ►" : "التالي ►", TBL.cur + 1, TBL.cur >= maxPage));
}
((window.loadData = async function (silent = !1) {
  (setDot("loading"),
    setBtn(!0),
    setProgress(15),
    silent || showToast("جاري تحميل البيانات...", "loading"));
  try {
    setProgress(20);
    let buildings = [],
      contracts = [],
      districts = [],
      fcaHistory = [],
      spareParts = [],
      fmContracts = [],
      allSystems = [],
      elevators = [];
    setProgress(30);
    const resp = await fetch(CFG.GAS_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    if ("error" === json.status) throw new Error(json.message || "Apps Script error");
    const d = json.data || {};
    ((buildings = d.buildings || []),
      (contracts = d.contracts || []),
      (districts = d.districts || []),
      (fcaHistory = d.fcaHistory || []),
      (spareParts = d.spareParts || []),
      (fmContracts = d.fmContracts || []),
      (allSystems = d.allSystems || []),
      (elevators = d.elevators || []),
      (window.RAW_TAJHEEZ_INV = d.tajheezInventory || []),
      (window.RAW_BALAGH = d.balaghReports || d.balagh || d.alertsCsv || []),
      (window.RAW_INVOICES_TRACKER = d.kpiContractor || d.invoicesTracker || []),
      (window.RAW_GATEKEEPERS = d.gatekeepers || []),
      // ── تبويب المدفوعات — من شيت المدفوعات مباشرة ──
      (window.RAW_PAYMENTS = d.payments || []),
      setProgress(60));
    if (typeof fcaHistory === "string") {
      const fcaPath = fcaHistory.trim();
      if (fcaPath) {
        try {
          const csvResp = await fetch(fcaPath, { cache: "no-store" });
          if (csvResp.ok) {
            const csvText = await csvResp.text();
            const parsed = Papa.parse(csvText, {
              header: true,
              skipEmptyLines: true,
              transformHeader: (h) => String(h || "").replace(/^﻿/g, "").trim(),
            });
            fcaHistory = Array.isArray(parsed.data)
              ? parsed.data.filter((row) => row && Object.keys(row).length)
              : [];
          } else {
            console.warn("[loadData] fcaHistory CSV not reachable:", fcaPath, csvResp.status);
            fcaHistory = [];
          }
        } catch (csvErr) {
          console.warn("[loadData] fcaHistory CSV fallback failed:", csvErr);
          fcaHistory = [];
        }
      } else {
        fcaHistory = [];
      }
    }
    if (!Array.isArray(fcaHistory)) fcaHistory = [];

    // ══════════════════════════════════════════════════════════════════════
    // بناء خريطة "آخر تقييم FCA" لكل مدرسة من ملف تقييمات_FCA_المراحل
    // المنطق: أحدث تاريخ يحتوي قيمة فعلية (Jun > May > Apr)
    //         لو Jun فارغ → نرجع May، لو May فارغ → نرجع Apr
    // مفتاح الربط: رقم_المدرسة_الوزاري (S-42671) — يطابق 3673 مدرسة
    // ══════════════════════════════════════════════════════════════════════
    const latestFcaMap = {}; // key: رقم_المدرسة_الوزاري → { score, dateObj, dateRaw }
    (function buildLatestFcaMap() {
      const monMap = {
        jan:0, feb:1, mar:2, apr:3, may:4, jun:5,
        jul:6, aug:7, sep:8, oct:9, nov:10, dec:11,
        يناير:0, فبراير:1, مارس:2, أبريل:3, ابريل:3,
        مايو:4, يونيو:5, يوليو:6, أغسطس:7, اغسطس:7,
        سبتمبر:8, أكتوبر:9, اكتوبر:9, نوفمبر:10, ديسمبر:11
      };
      function parseFcaDate(v) {
        if (!v) return null;
        const s = String(v).trim();
        // "Apr-26" / "May-26" / "Jun-26"
        const short = s.match(/^([A-Za-z]{3})[- ](\d{2})$/);
        if (short) {
          const m = monMap[short[1].toLowerCase()];
          if (m !== undefined) return new Date(2000 + parseInt(short[2], 10), m, 1);
        }
        const d = new Date(s);
        return isNaN(d) ? null : d;
      }
      for (const row of fcaHistory) {
        // مفتاح الربط الصحيح: رقم_المدرسة_الوزاري (يحتوي على S- prefix)
        const rawId = String(
          row["رقم_المدرسة_الوزاري"] ?? row["رقم_وزاري"] ?? row["رقم وزاري"] ?? ""
        ).replace(/\uFEFF/g, "").trim();
        if (!rawId || rawId === "—") continue;

        // اسم العمود الصحيح في ملف تقييمات_FCA_المراحل: تقييم_FCA
        const scoreRaw = row["تقييم_FCA"] ?? row["تقييم_FCA_المرحلة"] ?? row["قيمة_FCA"] ?? row["FCA"] ?? null;
        const score = (scoreRaw !== null && String(scoreRaw).trim() !== "" && !isNaN(parseFloat(scoreRaw)))
          ? parseFloat(scoreRaw) : null;

        // نتجاهل الصفوف الفارغة — نريد فقط السجلات التي فيها قيمة فعلية
        if (score === null) continue;

        const dateObj = parseFcaDate(row["التاريخ"] ?? null);
        const existing = latestFcaMap[rawId];
        if (!existing) {
          latestFcaMap[rawId] = { score, dateObj, dateRaw: String(row["التاريخ"] ?? "").trim() || null };
        } else {
          // نحتفظ بالأحدث تاريخاً الذي يحتوي قيمة (Jun > May > Apr)
          const existDate = existing.dateObj;
          if (!existDate && dateObj) {
            latestFcaMap[rawId] = { score, dateObj, dateRaw: String(row["التاريخ"] ?? "").trim() || null };
          } else if (dateObj && existDate && dateObj > existDate) {
            latestFcaMap[rawId] = { score, dateObj, dateRaw: String(row["التاريخ"] ?? "").trim() || null };
          }
        }
      }
      window.LATEST_FCA_MAP = latestFcaMap;
      console.log("[FCA] latestFcaMap:", Object.keys(latestFcaMap).length, "مدرسة مقيّمة");
    })();

    const contractsMap = {};
    for (const c of contracts) {
      const k = String(c["معرف_العقد"] ?? "")
        .trim()
        .replace(/^\uFEFF/, "");
      k && (contractsMap[k] = c);
    }
    const districtsMap = {};
    for (const d of districts) {
      const k = String(d["معرف_المحافظة"] ?? "")
        .trim()
        .replace(/^\uFEFF/, "");
      k && (districtsMap[k] = d);
    }
    function normalizeStatus(v) {
      if (!v) return "";
      return String(v)
        .trim()
        .replace(/\s+/g, " ")
        .replace(/مستقلة/g, "مستقل")
        .replace(/اساسي مشترك|مشترك اساسي/g, "مشترك أساسي");
    }
    (setProgress(75),
      (RAW = buildings
        .map((b) => {
          const schoolId = String(b["رقم_المدرسة_الوزاري"] ?? b["رقم_وزاري"] ?? "")
              .trim()
              .replace(/^\uFEFF/, ""),
            minIdRaw = String(b["رقم_وزاري"] ?? b["رقم_المدرسة_الوزاري"] ?? "")
              .trim()
              .replace(/^\uFEFF/, ""),
            cid = String(b["معرف_العقد"] ?? "1").trim(),
            con = contractsMap[cid] || contractsMap[1] || {},
            did = String(b["معرف_المحافظة"] ?? "").trim(),
            dist = districtsMap[did] || {},
            expMaint = con["تاريخ_انتهاء_الصيانة"] ?? b["تاريخ_انتهاء_الصيانة"] ?? null,
            expClean = con["تاريخ_انتهاء_النظافة"] ?? b["تاريخ_انتهاء_النظافة"] ?? null,
            expAC = con["تاريخ_انتهاء_التكييف"] ?? b["تاريخ_انتهاء_التكييف"] ?? null;
          return {
            buildingSeq: schoolId,
            schoolSeq: schoolId,
            mainMinId: minIdRaw,
            minId: minIdRaw,
            buildingName: String(b["اسم_المدرسة"] ?? "").trim(),
            name: String(b["اسم_المدرسة"] ?? "").trim(),
            gender: String(b["الجنس"] ?? "")
              .trim()
              .replace(/\s+$/, ""),
            stage: String(b["المرحلة"] ?? "").trim(),
            ownership: String(b["حكومي_مستأجر"] ?? "").trim(),
            linkType: normalizeStatus(b["حالة_الاشتراك"] ?? ""),
            city: String(b["المدينة_الرئيسية"] ?? dist["المدينة_الرئيسية"] ?? "").trim(),
            district: String(b["الحي"] ?? "").trim(),
            sector: String(b["المحافظة"] ?? dist["المحافظة"] ?? "").trim(),
            classrooms: num(b["عدد_الفصول"]),
            schoolSize: String(b["حجم_المدرسة"] ?? "").trim(),
            buildingSize: String(b["نوع_المبنى"] ?? b["حجم_المبنى"] ?? "").trim(),
            lng: num(b["خط_الطول"]),
            lat: num(b["خط_العرض"]),
            fca: (() => {
              // آخر تقييم FCA من ملف تقييمات_FCA_المراحل
              // مفتاح الربط: رقم_المدرسة_الوزاري (S-42671) أولاً — يطابق 3673 مدرسة
              const id = String(b["رقم_المدرسة_الوزاري"] ?? b["رقم_وزاري"] ?? "")
                .replace(/\uFEFF/g, "").trim();
              const entry = latestFcaMap[id];
              return entry ? entry.score : null;
            })(),
            fcaDate: (() => {
              const id = String(b["رقم_المدرسة_الوزاري"] ?? b["رقم_وزاري"] ?? "")
                .replace(/\uFEFF/g, "").trim();
              const entry = latestFcaMap[id];
              return entry ? (entry.dateRaw ?? null) : null;
            })(),
            fcaDateObj: (() => {
              const id = String(b["رقم_المدرسة_الوزاري"] ?? b["رقم_وزاري"] ?? "")
                .replace(/\uFEFF/g, "").trim();
              const entry = latestFcaMap[id];
              return entry ? (entry.dateObj ?? null) : null;
            })(),
            envScore: num(b["درجة_البيئة_المدرسية"]),
            envRating: String(b["تقدير_البيئة_المدرسية"] ?? "").trim(),
            students: num(b["عدد_الطلاب"]),
            buildingAge: num(b["عمر_المبني"]),
            ayenScore: num(b["تقييم_عاين"]),
            subscriptionStatus: normalizeStatus(b["حالة_الاشتراك"]),
            alerts: num(b["عدد_البلاغات"]) ?? 0,
            equipment: num(b["التجهيزات"]),
            preventive: num(b["الصيانة_الوقائية"]),
            drainage: num(b["خنادق_الصرف"]),
            acUnits: num(b["وحدات_التكييف"]),
            contractMaint: String(b["رقم_عقد_الصيانة"] ?? con["رقم_عقد_الصيانة"] ?? "").trim(),
            contractAC: String(b["رقم_عقد_التكييف"] ?? con["رقم_عقد_التكييف"] ?? "").trim(),
            contractClean: String(b["رقم_عقد_النظافة"] ?? con["رقم_عقد_النظافة"] ?? "").trim(),
            contrMaint: String(b["مقاول_الصيانة"] ?? con["مقاول_الصيانة"] ?? "").trim(),
            contrAC: String(b["مقاول_التكييف"] ?? con["مقاول_التكييف"] ?? "").trim(),
            contrClean: String(b["مقاول_النظافة"] ?? con["مقاول_النظافة"] ?? "").trim(),
            projMaint: String(b["رقم_مشروع_الصيانة"] ?? con["رقم_مشروع_الصيانة"] ?? "").trim(),
            projAC: String(b["رقم_مشروع_التكييف"] ?? con["رقم_مشروع_التكييف"] ?? "").trim(),
            projClean: String(b["رقم_مشروع_النظافة"] ?? con["رقم_مشروع_النظافة"] ?? "").trim(),
            expMaint: expMaint,
            expClean: expClean,
            expAC: expAC,
            notes: String(b["ملاحظات"] ?? "").trim(),
            description: "",
            quantity: null,
            unitValue: null,
          };
        })
        .filter((r) => r.name && "—" !== r.name && "null" !== r.name && "" !== r.name)));
    const spareMap = {};
    for (const sp of spareParts) {
      const bid = String(sp["رقم_وزاري"] ?? sp["رقم_المدرسة_الوزاري"] ?? "").trim();
      bid &&
        !spareMap[bid] &&
        (spareMap[bid] = {
          description: String(sp["وصف_الصنف"] ?? "").trim(),
          quantity: num(sp["الكمية"]),
          unitValue: num(sp["سعر_الوحدة"]),
        });
    }
    (RAW.forEach((r) => {
      const sp = spareMap[r.minId] || spareMap[r.schoolSeq];
      sp &&
        (sp.description && (r.description = sp.description),
        null != sp.quantity && (r.quantity = sp.quantity),
        null != sp.unitValue && (r.unitValue = sp.unitValue));
    }),
      (window.RAW_FCA_HISTORY = fcaHistory),
      (window.RAW_SPARE_PARTS = spareParts),
      (window.RAW_ALL_SYSTEMS = allSystems),
      (window.RAW_ELEVATORS = elevators),
      (window.RAW_FM_CONTRACTS = fmContracts),
      (retryCount = 0),
      setProgress(90),
      setDot("live"));

    // ══════════════════════════════════════════════════════════════════
    // 🔄 استبدال حقل alerts بالعدد الفعلي من ملف COW (RAW_BALAGH)
    // الربط: School Number (COW) ↔ رقم_المدرسة_الوزاري (RAW)
    // ══════════════════════════════════════════════════════════════════
    (function patchAlertsFromCOW() {
      try {
        const balaghRaw = window.RAW_BALAGH;
        if (!Array.isArray(balaghRaw) || !balaghRaw.length) return;

        // دالة تطبيع الرقم الوزاري (إزالة BOM + مسافات + ".0")
        function normId(v) {
          return String(v ?? "").replace(/\uFEFF/g, "").trim().replace(/\.0+$/, "").toUpperCase();
        }
        // نسخة بدون S- prefix
        function normIdPlain(v) {
          const k = normId(v);
          return k.startsWith("S-") ? k.slice(2) : k;
        }

        // بناء خريطتين: بالرقم كما هو + بدون S-
        const alertsMap = {};
        const alertsMapPlain = {};
        balaghRaw.forEach((row) => {
          const sn = normId(row["School Number"]);
          if (!sn) return;
          alertsMap[sn] = (alertsMap[sn] || 0) + 1;
          const plain = normIdPlain(row["School Number"]);
          if (plain !== sn) alertsMapPlain[plain] = (alertsMapPlain[plain] || 0) + 1;
        });

        // تحديث حقل alerts في كل مدرسة في RAW — يجرب الأشكال المختلفة للرقم
        let patched = 0;
        RAW.forEach((r) => {
          const id = normId(r.minId || r.schoolSeq);
          if (!id) { r.alerts = 0; return; }
          const idPlain = normIdPlain(r.minId || r.schoolSeq);
          const count = alertsMap[id] ?? alertsMapPlain[idPlain] ??
                        alertsMap["S-" + idPlain] ?? alertsMapPlain[id.replace(/^S-/i, "")] ?? null;
          r.alerts = count != null ? count : 0;
          if (count != null) patched++;
        });

        console.log(
          `[COW Alerts] ربط ${patched} مدرسة · إجمالي البلاغات: ${Object.values(alertsMap).reduce((a, b) => a + b, 0)}`
        );
      } catch (e) {
        console.warn("[COW Alerts] خطأ في حساب البلاغات:", e);
      }
    })();
    const now = new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    (setText("lastTime", now),
      buildDynamicFilters(),
      silent ||
        (showToast(`تم التحميل — <strong>${RAW.length.toLocaleString()}</strong> مبنى`, "ok"),
        setTimeout(clearToast, 5e3)),
      setProgress(100),
      (document.getElementById("filtersRow").style.display = "flex"),
      applyFilters());
  } catch (err) {
    if (
      (console.error("[loadData]", err), setDot("error"), setProgress(0), retryCount++, !silent)
    ) {
      const retryNote =
        retryCount < CFG.RETRY_MAX
          ? `<br><small style="opacity:.8">إعادة المحاولة تلقائياً (${retryCount}/${CFG.RETRY_MAX})</small>`
          : "";
      showToast(
        `فشل تحميل الملفات<br><small style="opacity:.75">${err.message}</small>\n        <br><button onclick="loadData()" style="margin-top:6px;border:none;background:transparent;\n          color:#991B1B;text-decoration:underline;font-family:'IBM Plex Sans Arabic','Tajawal';font-size:12px;cursor:pointer">\n          إعادة المحاولة</button>${retryNote}`,
        "err",
      );
    }
    retryCount < CFG.RETRY_MAX &&
      setTimeout(() => loadData(silent), CFG.RETRY_DELAY_MS * retryCount);
  } finally {
    setBtn(!1);
  }
}),
  (window.toggleAuto = function () {
    const btn = document.getElementById("btnAuto");
    autoTimer
      ? (clearInterval(autoTimer),
        (autoTimer = null),
        (btn.innerHTML = `◷ <span id="btnAutoText" data-ar="تلقائي" data-en="Auto">${"en" === LANG ? "Auto" : "تلقائي"}</span>`),
        btn.classList.remove("on"))
      : ((autoTimer = setInterval(() => loadData(!0), CFG.AUTO_INTERVAL_MS)),
        (btn.textContent =
          "en" === LANG
            ? `◷ Every ${CFG.AUTO_INTERVAL_MS / 6e4} min`
            : `◷ كل ${CFG.AUTO_INTERVAL_MS / 6e4} دقائق`),
        btn.classList.add("on"));
  }));
let _map = null,
  _mapLayer = null,
  _mapMode = "fca";
function getMarkerStyle(r, mode) {
  if ("fca" === mode) {
    if (null == r.fca) return { color: "#94A3B8", label: "—" };
    const t = getTier(r.fca);
    return { color: TIER[t].color, label: pct(r.fca) };
  }
  if ("env" === mode) {
    if (null == r.envScore) return { color: "#94A3B8", label: "—" };
    const t = getTier(r.envScore);
    return { color: TIER[t].color, label: pct(r.envScore) };
  }
  if ("gender" === mode) {
    return {
      color: "بنات" === r.gender ? "#DC2626" : "بنين" === r.gender ? "#0891B2" : "#94A3B8",
      label: r.gender || "—",
    };
  }
  if ("owner" === mode) {
    return {
      color: "حكومي" === r.ownership ? "#0891B2" : "مستأجر" === r.ownership ? "#D97706" : "#94A3B8",
      label: r.ownership || "—",
    };
  }
  return { color: "#083D4F", label: "" };
}
function buildLegendHTML(mode) {
  if ("fca" === mode || "env" === mode) {
    return `<div class="map-legend-title">🎨 ${"fca" === mode ? "درجة FCA" : "البيئة المدرسية"}</div>\n      <div class="map-legend-item"><div class="map-legend-dot" style="background:#DC2626"></div>حرج · 0–24%</div>\n      <div class="map-legend-item"><div class="map-legend-dot" style="background:#D97706"></div>متوسط · 25–49%</div>\n      <div class="map-legend-item"><div class="map-legend-dot" style="background:#059669"></div>جيد · 50–74%</div>\n      <div class="map-legend-item"><div class="map-legend-dot" style="background:#0891B2"></div>جيد جداً · 75–100%</div>\n      <div class="map-legend-item"><div class="map-legend-dot" style="background:#94A3B8"></div>لا توجد بيانات</div>`;
  }
  return "gender" === mode
    ? '<div class="map-legend-title">👦👧 الجنس</div>\n      <div class="map-legend-item"><div class="map-legend-dot" style="background:#DC2626"></div>بنات</div>\n      <div class="map-legend-item"><div class="map-legend-dot" style="background:#0891B2"></div>بنين</div>\n      <div class="map-legend-item"><div class="map-legend-dot" style="background:#94A3B8"></div>غير محدد</div>'
    : "owner" === mode
      ? '<div class="map-legend-title">🏛️ الملكية</div>\n      <div class="map-legend-item"><div class="map-legend-dot" style="background:#0891B2"></div>حكومي</div>\n      <div class="map-legend-item"><div class="map-legend-dot" style="background:#D97706"></div>مستأجر</div>\n      <div class="map-legend-item"><div class="map-legend-dot" style="background:#94A3B8"></div>غير محدد</div>'
      : "";
}
/* ╔════════════════════════════════════════════════════════════╗
   ║  🗺️  JS تبويب: الخريطة
   ║  (tab-map) — الدوال الخاصة بهذا التبويب تبدأ هنا
   ╚════════════════════════════════════════════════════════════╝ */
function renderMap() {
  const D = FILTERED,
    withCoords = D.filter((r) => r.lat && r.lng && Math.abs(r.lat) > 0.1 && Math.abs(r.lng) > 0.1),
    noCoords = D.length - withCoords.length,
    statCrit = D.filter((r) => null != r.fca && r.fca < 25).length,
    statFair = D.filter((r) => null != r.fca && r.fca >= 25 && r.fca < 50).length,
    statGood = D.filter((r) => null != r.fca && r.fca >= 50 && r.fca < 75).length,
    statVgood = D.filter((r) => null != r.fca && r.fca >= 75).length;
  if (
    (setText("ms-crit", statCrit.toLocaleString()),
    setText("ms-fair", statFair.toLocaleString()),
    setText("ms-good", statGood.toLocaleString()),
    setText("ms-vgood", statVgood.toLocaleString()),
    setText("ms-nocoord", noCoords.toLocaleString()),
    !_map)
  ) {
    ((_map = L.map("map-container", {
      center: [24.7, 46.7],
      zoom: 10,
      zoomControl: !0,
      attributionControl: !1,
    })),
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(_map),
      L.control.attribution({ prefix: !1, position: "bottomleft" }).addTo(_map));
    const legend = L.control({ position: "bottomright" });
    ((legend.onAdd = function () {
      const div = L.DomUtil.create("div", "map-legend");
      return ((div.id = "map-legend-content"), (div.innerHTML = buildLegendHTML(_mapMode)), div);
    }),
      legend.addTo(_map));
  }
  const legendEl = document.getElementById("map-legend-content");
  if (
    (legendEl && (legendEl.innerHTML = buildLegendHTML(_mapMode)),
    _mapLayer && (_map.removeLayer(_mapLayer), (_mapLayer = null)),
    0 === withCoords.length)
  )
    return;
  const markers = [];
  (withCoords.forEach((r) => {
    const { color: color, label: label } = getMarkerStyle(r, _mapMode),
      radius = "fca" === _mapMode && null != r.fca ? Math.max(6, Math.min(14, r.fca / 10)) : 8,
      circle = L.circleMarker([r.lat, r.lng], {
        radius: radius,
        fillColor: color,
        color: "#fff",
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.85,
      }),
      fcaLine =
        null != r.fca
          ? `<div class="map-popup-row"><span class="map-popup-lbl">FCA</span><span class="map-popup-val" style="color:${tierColor(r.fca)};font-size:14px">${pct(r.fca)}</span></div>`
          : "",
      envLine =
        null != r.envScore
          ? `<div class="map-popup-row"><span class="map-popup-lbl">البيئة</span><span class="map-popup-val" style="color:${tierColor(r.envScore)}">${pct(r.envScore)}</span></div>`
          : "",
      alertsLine =
        null != r.alerts
          ? `<div class="map-popup-row"><span class="map-popup-lbl">البلاغات</span><span class="map-popup-val">${r.alerts}</span></div>`
          : "";
    (circle.bindPopup(
      `\n      <div style="min-width:190px;direction:rtl;font-family:'IBM Plex Sans Arabic',Tajawal,sans-serif">\n        <div class="map-popup-name">${esc(r.name)}</div>\n        <div style="display:inline-block;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:${color}22;color:${color};border:1px solid ${color}44;margin-bottom:8px">${label}</div>\n        ${fcaLine}${envLine}\n        <div class="map-popup-row"><span class="map-popup-lbl">الحي</span><span class="map-popup-val">${esc(r.district) || "—"}</span></div>\n        <div class="map-popup-row"><span class="map-popup-lbl">المرحلة</span><span class="map-popup-val">${esc(r.stage) || "—"}</span></div>\n        <div class="map-popup-row"><span class="map-popup-lbl">الجنس</span><span class="map-popup-val">${esc(r.gender) || "—"}</span></div>\n        <div class="map-popup-row"><span class="map-popup-lbl">الملكية</span><span class="map-popup-val">${esc(r.ownership) || "—"}</span></div>\n        ${alertsLine}\n      </div>\n    `,
      { maxWidth: 260, className: "map-popup-custom" },
    ),
      markers.push(circle));
  }),
    (_mapLayer = L.layerGroup(markers).addTo(_map)));
  try {
    const bounds = L.latLngBounds(withCoords.map((r) => [r.lat, r.lng]));
    bounds.isValid() && _map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
  } catch (e) {}
  setTimeout(() => {
    _map && _map.invalidateSize();
  }, 150);
}
/* ╔════════════════════════════════════════════════════════════╗
   ║  👨‍🎓  JS تبويب: الطلاب وعمر المبنى
   ║  (tab-students) — الدوال الخاصة بهذا التبويب تبدأ هنا
   ╚════════════════════════════════════════════════════════════╝ */
function renderStudentsTab() {
  const el = document.getElementById("students-content");
  if (!el) return;
  const D = FILTERED,
    withStudents = D.filter((r) => null != r.students && r.students > 0),
    withAge = D.filter((r) => null != r.buildingAge && r.buildingAge > 0);
  if (!withStudents.length && !withAge.length)
    return void (el.innerHTML =
      '<div class="card empty-state">\n      <div class="empty-state-icon">👨‍🎓</div>\n      <div class="empty-state-title">لم يتم التحميل</div>\n    </div>');
  const totalStudents = withStudents.reduce((s, r) => s + r.students, 0),
    avgStudents = withStudents.length ? totalStudents / withStudents.length : 0,
    avgAge =
      (withStudents.reduce((mx, r) => (r.students > mx.students ? r : mx), withStudents[0]),
      withStudents.reduce((mn, r) => (r.students < mn.students ? r : mn), withStudents[0]),
      withAge.length ? withAge.reduce((s, r) => s + r.buildingAge, 0) / withAge.length : 0),
    maxAge = withAge.length
      ? withAge.reduce((mx, r) => (r.buildingAge > mx.buildingAge ? r : mx), withAge[0])
      : null,
    studByStage = {};
  withStudents.forEach((r) => {
    r.stage &&
      (studByStage[r.stage] || (studByStage[r.stage] = { total: 0, count: 0 }),
      (studByStage[r.stage].total += r.students),
      (studByStage[r.stage].count += 1));
  });
  const stageStudData = Object.entries(studByStage).sort((a, b) => b[1].total - a[1].total),
    studByDist = {};
  withStudents.forEach((r) => {
    r.district &&
      (studByDist[r.district] || (studByDist[r.district] = { total: 0, count: 0 }),
      (studByDist[r.district].total += r.students),
      (studByDist[r.district].count += 1));
  });
  const distStudData = Object.entries(studByDist)
      .map(([k, v]) => ({ k: k, avg: v.total / v.count, total: v.total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20),
    ageByStage = {};
  withAge.forEach((r) => {
    r.stage &&
      (ageByStage[r.stage] || (ageByStage[r.stage] = []), ageByStage[r.stage].push(r.buildingAge));
  });
  const stageAgeData = Object.entries(ageByStage).map(([k, v]) => ({
      k: k,
      avg: v.reduce((a, b) => a + b, 0) / v.length,
    })),
    top20stud = [...withStudents].sort((a, b) => b.students - a.students).slice(0, 20),
    top20age = [...withAge].sort((a, b) => b.buildingAge - a.buildingAge).slice(0, 20),
    ageBins = ["0–9", "10–19", "20–29", "30–39", "40–49", "50–59", "60+"],
    ageBinData = [0, 0, 0, 0, 0, 0, 0];
  withAge.forEach((r) => {
    const a = r.buildingAge;
    a < 10
      ? ageBinData[0]++
      : a < 20
        ? ageBinData[1]++
        : a < 30
          ? ageBinData[2]++
          : a < 40
            ? ageBinData[3]++
            : a < 50
              ? ageBinData[4]++
              : a < 60
                ? ageBinData[5]++
                : ageBinData[6]++;
  });
  const studNums = withStudents.map((r) => r.students),
    studBins =
      (Math.min(...studNums),
      Math.max(...studNums),
      ["1–200", "201–400", "401–600", "601–800", "801–1000", "1001–1500", "1500+"]),
    studBinData = [0, 0, 0, 0, 0, 0, 0];
  (withStudents.forEach((r) => {
    const s = r.students;
    s <= 200
      ? studBinData[0]++
      : s <= 400
        ? studBinData[1]++
        : s <= 600
          ? studBinData[2]++
          : s <= 800
            ? studBinData[3]++
            : s <= 1e3
              ? studBinData[4]++
              : s <= 1500
                ? studBinData[5]++
                : studBinData[6]++;
  }),
    (el.innerHTML = `\n    \n    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px">\n      <div class="card" style="border-top:3px solid #059669">\n        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">إجمالي الطلاب</div>\n        <div style="font-size:26px;font-weight:800;color:#059669;letter-spacing:-.02em">${totalStudents.toLocaleString()}</div>\n        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">${withStudents.length.toLocaleString()} مدرسة</div>\n      </div>\n      <div class="card" style="border-top:3px solid #0891B2">\n        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">متوسط الطلاب/مدرسة</div>\n        <div style="font-size:26px;font-weight:800;color:#0891B2;letter-spacing:-.02em">${Math.round(avgStudents).toLocaleString()}</div>\n        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">طالب لكل مدرسة</div>\n      </div>\n      <div class="card" style="border-top:3px solid #D97706">\n        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">متوسط عمر المبنى</div>\n        <div style="font-size:26px;font-weight:800;color:#D97706;letter-spacing:-.02em">${Math.round(avgAge).toLocaleString()}</div>\n        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">${withAge.length.toLocaleString()} مبنى مقيّم · سنة</div>\n      </div>\n      <div class="card" style="border-top:3px solid #DC2626">\n        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">أقدم مبنى</div>\n        <div style="font-size:26px;font-weight:800;color:#DC2626;letter-spacing:-.02em">${maxAge ? maxAge.buildingAge : "—"}</div>\n        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">${maxAge ? esc(maxAge.name.slice(0, 28)) : "—"} · سنة</div>\n      </div>\n    </div>\n\n    \n    <div class="g2 mb14">\n      <div class="card">\n        <div class="card-title">أعلى 20 مدرسة — عدد الطلاب</div>\n        <div class="chart-box" style="height:480px"><canvas id="ch-stud-top"></canvas></div>\n      </div>\n      <div class="card">\n        <div class="card-title">أعمر 20 مبنى <span class="sub">بالسنوات</span></div>\n        <div class="chart-box" style="height:480px"><canvas id="ch-age-top"></canvas></div>\n      </div>\n    </div>\n\n    \n    <div class="g2 mb14">\n      <div class="card">\n        <div class="card-title">توزيع عدد الطلاب </div>\n        <div class="chart-box" style="height:260px"><canvas id="ch-stud-hist"></canvas></div>\n      </div>\n      <div class="card">\n        <div class="card-title">توزيع عمر المبنى بالسنوات </div>\n        <div class="chart-box" style="height:260px"><canvas id="ch-age-hist"></canvas></div>\n      </div>\n    </div>\n\n    \n    <div class="g2 mb14">\n      <div class="card">\n        <div class="card-title">إجمالي الطلاب حسب المرحلة</div>\n        <div class="chart-box" style="height:250px"><canvas id="ch-stud-stage"></canvas></div>\n      </div>\n      <div class="card">\n        <div class="card-title">متوسط عمر المبنى حسب المرحلة</div>\n        <div class="chart-box" style="height:250px"><canvas id="ch-age-stage"></canvas></div>\n      </div>\n    </div>\n\n    \n    <div class="card mb14">\n      <div class="card-title">إجمالي الطلاب حسب الحي <span class="sub">أعلى 20 حي</span></div>\n      <div class="chart-box" style="height:300px"><canvas id="ch-stud-dist"></canvas></div>\n    </div>\n\n    \n    <div class="g2 mb14">\n      <div class="card">\n        <div class="card-title">FCA مقابل عمر المبنى <span class="sub">كل نقطة = مدرسة</span></div>\n        <div class="chart-box" style="height:310px"><canvas id="ch-fca-age-scatter"></canvas></div>\n      </div>\n      <div class="card">\n        <div class="card-title">عدد الطلاب مقابل FCA <span class="sub">كل نقطة = مدرسة</span></div>\n        <div class="chart-box" style="height:310px"><canvas id="ch-stud-fca-scatter"></canvas></div>\n      </div>\n    </div>`),
    requestAnimationFrame(() => {
      (killChart("ch-stud-top"),
        (CHARTS["ch-stud-top"] = new Chart(document.getElementById("ch-stud-top"), {
          type: "bar",
          data: {
            labels: top20stud.map((r) => (r.name.length > 30 ? r.name.slice(0, 30) + "…" : r.name)),
            datasets: [
              {
                label: "عدد الطلاب",
                data: top20stud.map((r) => r.students),
                backgroundColor: "#05966988",
                borderColor: "#059669",
                borderWidth: 1.5,
                borderRadius: 4,
              },
            ],
          },
          options: {
            indexAxis: "y",
            maintainAspectRatio: !1,
            plugins: {
              legend: { display: !1 },
              tooltip: { callbacks: { title: (ctx) => top20stud[ctx[0].dataIndex].name } },
            },
            scales: {
              x: { beginAtZero: !0, ticks: { callback: (v) => v.toLocaleString() } },
              y: {
                ticks: { font: { size: 10 } },
                afterFit: (s) => {
                  s.width = Math.max(s.width, 220);
                },
              },
            },
          },
        })),
        killChart("ch-age-top"),
        (CHARTS["ch-age-top"] = new Chart(document.getElementById("ch-age-top"), {
          type: "bar",
          data: {
            labels: top20age.map((r) => (r.name.length > 30 ? r.name.slice(0, 30) + "…" : r.name)),
            datasets: [
              {
                label: "عمر المبنى (سنة)",
                data: top20age.map((r) => r.buildingAge),
                backgroundColor: top20age.map((r) =>
                  r.buildingAge >= 40
                    ? "#DC262688"
                    : r.buildingAge >= 25
                      ? "#D9770688"
                      : "#05966988",
                ),
                borderColor: top20age.map((r) =>
                  r.buildingAge >= 40 ? "#DC2626" : r.buildingAge >= 25 ? "#D97706" : "#059669",
                ),
                borderWidth: 1.5,
                borderRadius: 4,
              },
            ],
          },
          options: {
            indexAxis: "y",
            maintainAspectRatio: !1,
            plugins: {
              legend: { display: !1 },
              tooltip: { callbacks: { title: (ctx) => top20age[ctx[0].dataIndex].name } },
            },
            scales: {
              x: { beginAtZero: !0 },
              y: {
                ticks: { font: { size: 10 } },
                afterFit: (s) => {
                  s.width = Math.max(s.width, 220);
                },
              },
            },
          },
        })),
        killChart("ch-stud-hist"),
        (CHARTS["ch-stud-hist"] = new Chart(document.getElementById("ch-stud-hist"), {
          type: "bar",
          data: {
            labels: studBins,
            datasets: [
              {
                label: "عدد المدارس",
                data: studBinData,
                backgroundColor: "#0891B2BB",
                borderColor: "#0891B2",
                borderWidth: 1,
                borderRadius: 4,
              },
            ],
          },
          options: {
            maintainAspectRatio: !1,
            plugins: { legend: { display: !1 } },
            scales: { y: { beginAtZero: !0 }, x: { ticks: { font: { size: 10 } } } },
          },
        })),
        killChart("ch-age-hist"),
        (CHARTS["ch-age-hist"] = new Chart(document.getElementById("ch-age-hist"), {
          type: "bar",
          data: {
            labels: ageBins,
            datasets: [
              {
                label: "عدد المباني",
                data: ageBinData,
                backgroundColor: ageBins.map(
                  (_, i) =>
                    [
                      "#05966988",
                      "#0891B288",
                      "#D9770688",
                      "#D9770688",
                      "#DC262688",
                      "#DC262688",
                      "#7C3AED88",
                    ][i],
                ),
                borderColor: ageBins.map(
                  (_, i) =>
                    ["#059669", "#0891B2", "#D97706", "#D97706", "#DC2626", "#DC2626", "#7C3AED"][
                      i
                    ],
                ),
                borderWidth: 1,
                borderRadius: 4,
              },
            ],
          },
          options: {
            maintainAspectRatio: !1,
            plugins: { legend: { display: !1 } },
            scales: { y: { beginAtZero: !0 }, x: { ticks: { font: { size: 10 } } } },
          },
        })),
        killChart("ch-stud-stage"),
        (CHARTS["ch-stud-stage"] = new Chart(document.getElementById("ch-stud-stage"), {
          type: "bar",
          data: {
            labels: stageStudData.map((x) => x[0]),
            datasets: [
              {
                label: "إجمالي الطلاب",
                data: stageStudData.map((x) => x[1].total),
                backgroundColor: PALETTE.map((c) => c + "BB"),
                borderColor: PALETTE,
                borderWidth: 1.5,
                borderRadius: 5,
              },
            ],
          },
          options: {
            maintainAspectRatio: !1,
            plugins: { legend: { display: !1 } },
            scales: {
              x: { ticks: { font: { size: 10 } } },
              y: { beginAtZero: !0, ticks: { callback: (v) => v.toLocaleString() } },
            },
          },
        })),
        killChart("ch-age-stage"),
        (CHARTS["ch-age-stage"] = new Chart(document.getElementById("ch-age-stage"), {
          type: "bar",
          data: {
            labels: stageAgeData.map((x) => x.k),
            datasets: [
              {
                label: "متوسط عمر المبنى",
                data: stageAgeData.map((x) => +x.avg.toFixed(1)),
                backgroundColor: ["#D97706BB", "#DC2626BB", "#0891B2BB", "#059669BB"],
                borderColor: ["#D97706", "#DC2626", "#0891B2", "#059669"],
                borderWidth: 1.5,
                borderRadius: 5,
              },
            ],
          },
          options: {
            maintainAspectRatio: !1,
            plugins: { legend: { display: !1 } },
            scales: { x: { ticks: { font: { size: 10 } } }, y: { beginAtZero: !0 } },
          },
        })),
        killChart("ch-stud-dist"),
        (CHARTS["ch-stud-dist"] = new Chart(document.getElementById("ch-stud-dist"), {
          type: "bar",
          data: {
            labels: distStudData.map((x) => x.k),
            datasets: [
              {
                label: "إجمالي الطلاب",
                data: distStudData.map((x) => x.total),
                backgroundColor: "#05966988",
                borderColor: "#059669",
                borderWidth: 1,
                borderRadius: 4,
              },
            ],
          },
          options: {
            maintainAspectRatio: !1,
            plugins: { legend: { display: !1 } },
            scales: {
              x: { ticks: { font: { size: 10 }, maxRotation: 30 } },
              y: { beginAtZero: !0, ticks: { callback: (v) => v.toLocaleString() } },
            },
          },
        })),
        killChart("ch-fca-age-scatter"));
      const scatterPts1 = D.filter((r) => null != r.fca && null != r.buildingAge).map((r) => ({
        x: +r.buildingAge.toFixed(0),
        y: +r.fca.toFixed(1),
        name: r.name,
        age: r.buildingAge,
      }));
      ((CHARTS["ch-fca-age-scatter"] = new Chart(document.getElementById("ch-fca-age-scatter"), {
        type: "scatter",
        data: {
          datasets: [
            {
              label: "المدارس",
              data: scatterPts1,
              backgroundColor: scatterPts1.map((p) =>
                p.age >= 40 ? "#DC262666" : p.age >= 25 ? "#D9770666" : "#05966666",
              ),
              borderColor: scatterPts1.map((p) =>
                p.age >= 40 ? "#DC2626" : p.age >= 25 ? "#D97706" : "#059669",
              ),
              borderWidth: 1,
              pointRadius: 4,
              pointHoverRadius: 7,
            },
          ],
        },
        options: {
          maintainAspectRatio: !1,
          plugins: {
            legend: { display: !1 },
            tooltip: {
              callbacks: {
                label: (ctx) => [
                  `📍 ${ctx.raw.name}`,
                  `العمر: ${ctx.raw.x} سنة`,
                  `FCA: ${ctx.raw.y}%`,
                ],
              },
            },
          },
          scales: {
            x: { title: { display: !0, text: "عمر المبنى (سنة)" }, beginAtZero: !0 },
            y: { title: { display: !0, text: "FCA %" }, min: 0, max: 100 },
          },
        },
      })),
        killChart("ch-stud-fca-scatter"));
      const scatterPts2 = D.filter((r) => null != r.students && null != r.fca).map((r) => ({
        x: r.students,
        y: +r.fca.toFixed(1),
        name: r.name,
      }));
      CHARTS["ch-stud-fca-scatter"] = new Chart(document.getElementById("ch-stud-fca-scatter"), {
        type: "scatter",
        data: {
          datasets: [
            {
              label: "المدارس",
              data: scatterPts2,
              backgroundColor: "#0891B266",
              borderColor: "#0891B2",
              borderWidth: 1,
              pointRadius: 4,
              pointHoverRadius: 7,
            },
          ],
        },
        options: {
          maintainAspectRatio: !1,
          plugins: {
            legend: { display: !1 },
            tooltip: {
              callbacks: {
                label: (ctx) => [
                  `📍 ${ctx.raw.name}`,
                  `الطلاب: ${ctx.raw.x.toLocaleString()}`,
                  `FCA: ${ctx.raw.y}%`,
                ],
              },
            },
          },
          scales: {
            x: {
              title: { display: !0, text: "عدد الطلاب" },
              beginAtZero: !0,
              ticks: { callback: (v) => v.toLocaleString() },
            },
            y: { title: { display: !0, text: "FCA %" }, min: 0, max: 100 },
          },
        },
      });
    }));
}
/* ╔════════════════════════════════════════════════════════════╗
   ║  ❄️  JS تبويب: خطة استبدال المكيفات (شباك ↔ سبلت)
   ║  (tab-ac-plan) — الدوال الخاصة بهذا التبويب تبدأ هنا
   ║
   ║  📝 لتعديل الأرقام فقط عدّل المصفوفة AC_PLAN_DATA بالأسفل مباشرة.
   ║     كل عنصر = منطقة واحدة:
   ║       region : اسم المنطقة (يظهر بالجدول والرسم)
   ║       split  : عدد مكيفات السبلت
   ║       window : عدد مكيفات الشباك
   ║     لإضافة منطقة جديدة: أضف سطر { region: "...", split: 0, window: 0 }
   ║     لحذف منطقة: احذف سطرها بالكامل
   ╚════════════════════════════════════════════════════════════╝ */
const AC_PLAN_DATA = [
  { region: "جدة",        split: 610, window: 875 },
  { region: "مكه",        split: 388, window: 775 },
  { region: "الليث",      split: 95,  window: 75  },
  { region: "القنفذة",    split: 207, window: 40  },
  { region: "المدينة",    split: 401, window: 462 },
  { region: "مهد الذهب",  split: 45,  window: 158 },
  { region: "ينبع",       split: 60,  window: 81  },
  { region: "العلا",      split: 42,  window: 45  },
  { region: "الطائف",     split: 328, window: 461 },
];

function renderAcPlanTab() {
  const el = document.getElementById("ac-plan-content");
  if (!el) return;
  const data = AC_PLAN_DATA,
    COLOR_SPLIT = "#0891B2",
    COLOR_WINDOW = "#D97706",
    totalSplit = data.reduce((s, r) => s + (r.split || 0), 0),
    totalWindow = data.reduce((s, r) => s + (r.window || 0), 0),
    totalAll = totalSplit + totalWindow,
    sortedByTotal = [...data].sort((a, b) => (b.split + b.window) - (a.split + a.window)),
    topRegion = sortedByTotal[0];

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px">
      <div class="card" style="border-top:3px solid ${COLOR_SPLIT}">
        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">عدد مكيفات السبلت</div>
        <div style="font-size:26px;font-weight:800;color:${COLOR_SPLIT};letter-spacing:-.02em">${totalSplit.toLocaleString()}</div>
        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">${data.length.toLocaleString()} منطقة</div>
      </div>
      <div class="card" style="border-top:3px solid ${COLOR_WINDOW}">
        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">عدد مكيفات الشباك</div>
        <div style="font-size:26px;font-weight:800;color:${COLOR_WINDOW};letter-spacing:-.02em">${totalWindow.toLocaleString()}</div>
        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">${data.length.toLocaleString()} منطقة</div>
      </div>
      <div class="card" style="border-top:3px solid #059669">
        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">إجمالي المكيفات</div>
        <div style="font-size:26px;font-weight:800;color:#059669;letter-spacing:-.02em">${totalAll.toLocaleString()}</div>
        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">سبلت + شباك</div>
      </div>
      <div class="card" style="border-top:3px solid #7C3AED">
        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">الأعلى احتياجاً</div>
        <div style="font-size:20px;font-weight:800;color:#7C3AED;letter-spacing:-.02em">${topRegion ? topRegion.region : "—"}</div>
        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">${topRegion ? (topRegion.split + topRegion.window).toLocaleString() : ""} مكيف إجمالي</div>
      </div>
    </div>

    <div class="card mb14">
      <div class="card-title">عدد المكيفات حسب المنطقة (سبلت / شباك)</div>
      <div class="chart-box" style="height:380px"><canvas id="ch-ac-plan-bar"></canvas></div>
    </div>

    <div class="g2 mb14">
      <div class="card">
        <div class="card-title">إجمالي سبلت مقابل شباك</div>
        <div class="chart-box" style="height:260px"><canvas id="ch-ac-plan-donut"></canvas></div>
      </div>
      <div class="card">
        <div class="card-title">نسبة كل منطقة من إجمالي المكيفات</div>
        <div class="chart-box" style="height:260px"><canvas id="ch-ac-plan-share"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title" style="margin-bottom:14px">
        تفصيل خطة استبدال المكيفات حسب المنطقة
        <span class="sub">${data.length.toLocaleString()} منطقة</span>
      </div>
      <div class="tbl-wrap">
        <table>
          <thead><tr>
            <th style="text-align:right;padding-right:14px;min-width:160px">المنطقة</th>
            <th style="min-width:120px">عدد مكيفات سبلت</th>
            <th style="min-width:130px">عدد مكيفات الشباك</th>
            <th style="min-width:110px">الإجمالي</th>
          </tr></thead>
          <tbody>
            ${data
              .map(
                (r) => `<tr>
              <td style="text-align:right;padding-right:14px;font-weight:600">${r.region}</td>
              <td>${(r.split || 0).toLocaleString()}</td>
              <td>${(r.window || 0).toLocaleString()}</td>
              <td style="font-weight:700">${((r.split || 0) + (r.window || 0)).toLocaleString()}</td>
            </tr>`,
              )
              .join("")}
            <tr style="font-weight:800;background:var(--bg-2)">
              <td style="text-align:right;padding-right:14px">الإجمالي</td>
              <td>${totalSplit.toLocaleString()}</td>
              <td>${totalWindow.toLocaleString()}</td>
              <td>${totalAll.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`;

  requestAnimationFrame(() => {
    killChart("ch-ac-plan-bar");
    CHARTS["ch-ac-plan-bar"] = new Chart(document.getElementById("ch-ac-plan-bar"), {
      type: "bar",
      data: {
        labels: data.map((r) => r.region),
        datasets: [
          {
            label: "سبلت",
            data: data.map((r) => r.split),
            backgroundColor: COLOR_SPLIT + "AA",
            borderColor: COLOR_SPLIT,
            borderWidth: 1.5,
            borderRadius: 4,
          },
          {
            label: "شباك",
            data: data.map((r) => r.window),
            backgroundColor: COLOR_WINDOW + "AA",
            borderColor: COLOR_WINDOW,
            borderWidth: 1.5,
            borderRadius: 4,
          },
        ],
      },
      options: {
        maintainAspectRatio: !1,
        plugins: { legend: { position: "bottom" } },
        scales: {
          x: { ticks: { font: { size: 10 } } },
          y: { beginAtZero: !0, ticks: { callback: (v) => v.toLocaleString() } },
        },
      },
    });

    killChart("ch-ac-plan-donut");
    CHARTS["ch-ac-plan-donut"] = new Chart(document.getElementById("ch-ac-plan-donut"), {
      type: "doughnut",
      data: {
        labels: ["سبلت", "شباك"],
        datasets: [
          {
            data: [totalSplit, totalWindow],
            backgroundColor: [COLOR_SPLIT + "DD", COLOR_WINDOW + "DD"],
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        maintainAspectRatio: !1,
        cutout: "60%",
        plugins: {
          legend: { position: "bottom", labels: { font: { size: 10 }, boxWidth: 12, padding: 6 } },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw.toLocaleString()} (${Math.round((ctx.raw / totalAll) * 100)}%)`,
            },
          },
        },
      },
    });

    const shareSorted = [...data].sort((a, b) => (b.split + b.window) - (a.split + a.window));
    killChart("ch-ac-plan-share");
    CHARTS["ch-ac-plan-share"] = new Chart(document.getElementById("ch-ac-plan-share"), {
      type: "pie",
      data: {
        labels: shareSorted.map((r) => r.region),
        datasets: [
          {
            data: shareSorted.map((r) => r.split + r.window),
            backgroundColor: shareSorted.map((_, i) => PALETTE[i % PALETTE.length] + "DD"),
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        maintainAspectRatio: !1,
        plugins: {
          legend: { position: "bottom", labels: { font: { size: 9 }, boxWidth: 10, padding: 5 } },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw.toLocaleString()} (${Math.round((ctx.raw / totalAll) * 100)}%)`,
            },
          },
        },
      },
    });
  });
}
/* ╔════════════════════════════════════════════════════════════╗
   ║  📊  JS تبويب: مؤشرات الأداء للمقاول (Regional KPI)
   ║  (tab-mag-kpi) — الدوال الخاصة بهذا التبويب تبدأ هنا
   ║
   ║  📝 لتعديل الأرقام فقط عدّل المصفوفة MAG_KPI_DATA بالأسفل مباشرة.
   ║     كل عنصر = منطقة واحدة:
   ║       region   : اسم المنطقة (يظهر بالجدول والرسم)
   ║       contract : رقم عقد المقاول (TBC) الخاص بالمنطقة
   ║       values   : نسب الأداء الشهرية بالترتيب (يناير ← مايو) من 0 إلى 100
   ║     لإضافة شهر فعلي جديد (بيانات حقيقية): أضف رقمًا لكل منطقة في
   ║       values + اسم الشهر في MAG_KPI_MONTHS بنفس الترتيب
   ║     لإضافة منطقة جديدة: أضف سطر
   ║       { region: "...", contract: "...", values: [.., .., .., .., ..] }
   ║
   ║  🔮 التوقع المستقبلي (الخط المنقّط في الرسم):
   ║     عدد شهور التوقع يتحكم فيه متغيّر واحد فقط بالأسفل:
   ║       MAG_KPI_FORECAST_MONTHS  ← غيّره لـ 3 أو 4 أو أي رقم تاني
   ║     طريقة الحساب: انحدار خطي بسيط (Linear Trend) على بيانات كل
   ║     منطقة الفعلية — مفيهوش أي تدخل يدوي، بيتحسب تلقائي في دالة
   ║     linearForecast() تحت. القيمة محصورة بين 0% و100%.
   ║     أسماء الشهور المستقبلية موجودة في MAG_KPI_FUTURE_MONTH_NAMES،
   ║     لو محتاج تتوقع لفترة أطول من 7 شهور زوّد أسماء فيها.
   ╚════════════════════════════════════════════════════════════╝ */
const MAG_KPI_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو"];
const MAG_KPI_DATA = [
  { region: "مكة",     contract: "TBC005842", values: [85.34, 87.75, 87.27, 72.11, 71.98] },
  { region: "المدينة", contract: "TBC005841", values: [89.70, 88.60, 88.28, 90.25, 88.48] },
  { region: "جدة",     contract: "TBC005843", values: [85.02, 91.68, 92.00, 90.42, 91.21] },
  { region: "الطائف",  contract: "TBC005789", values: [80.07, 80.04, 80.29, 83.75, 85.16] },
];

// ⚙️ عدد شهور التوقع القادمة في اللاين تشارت — غيّر الرقم ده بس
const MAG_KPI_FORECAST_MONTHS = 4; // مثال: 3 لو عايز توقع 3 شهور بدل 4

// أسماء الشهور المستقبلية المتاحة (تتقرأ بالترتيب حسب عدد شهور التوقع أعلاه)
const MAG_KPI_FUTURE_MONTH_NAMES = [
  "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

/* 🔮 انحدار خطي بسيط (Least-Squares Linear Regression) لتوقع قيم مستقبلية
   اعتمادًا على اتجاه البيانات الفعلية السابقة لكل منطقة.
   values  : مصفوفة القيم الفعلية بالترتيب الزمني
   nFuture : عدد النقاط المطلوب توقّعها بعد آخر قيمة فعلية
   يرجع مصفوفة بطول nFuture بقيم محصورة بين 0 و100 */
function linearForecast(values, nFuture) {
  const n = values.length,
    xs = values.map((_, i) => i),
    xMean = avg(xs),
    yMean = avg(values);
  let num = 0,
    den = 0;
  xs.forEach((x, i) => {
    num += (x - xMean) * (values[i] - yMean);
    den += (x - xMean) ** 2;
  });
  const slope = den === 0 ? 0 : num / den,
    intercept = yMean - slope * xMean,
    future = [];
  for (let i = 0; i < nFuture; i++) {
    const x = n + i,
      y = Math.max(0, Math.min(100, intercept + slope * x));
    future.push(+y.toFixed(2));
  }
  return future;
}

function renderMagKpiTab() {
  const el = document.getElementById("mag-kpi-content");
  if (!el) return;
  const data = MAG_KPI_DATA,
    months = MAG_KPI_MONTHS,
    lastIdx = months.length - 1;

  // إحصائيات لكل منطقة
  const stats = data.map((r) => {
    const avgVal = avg(r.values),
      first = r.values[0],
      last = r.values[lastIdx],
      delta = last - first;
    return { ...r, avgVal, first, last, delta, tier: getTier(last) };
  });

  // المتوسط العام لكل شهر (عبر كل المناطق)
  const monthlyAvg = months.map((_, i) => avg(data.map((r) => r.values[i]))),
    overallFirst = monthlyAvg[0],
    overallLast = monthlyAvg[lastIdx],
    overallDelta = overallLast - overallFirst;

  const sortedByLast = [...stats].sort((a, b) => b.last - a.last),
    best = sortedByLast[0],
    worst = sortedByLast[sortedByLast.length - 1],
    sortedByDelta = [...stats].sort((a, b) => a.delta - b.delta),
    mostDeclined = sortedByDelta[0],
    mostImproved = sortedByDelta[sortedByDelta.length - 1];

  const deltaColor = (d) => (d > 0 ? "#059669" : d < 0 ? "#DC2626" : "#64748B"),
    deltaArrow = (d) => (d > 0 ? "▲" : d < 0 ? "▼" : "—"),
    deltaText = (d) => `${d > 0 ? "+" : ""}${d.toFixed(2)}`;

  // 🔮 حساب التوقع المستقبلي لكل منطقة (انظر إعداد MAG_KPI_FORECAST_MONTHS أعلى الملف)
  const nFuture = MAG_KPI_FORECAST_MONTHS,
    futureMonths = Array.from(
      { length: nFuture },
      (_, i) => MAG_KPI_FUTURE_MONTH_NAMES[i] || `شهر +${i + 1}`,
    ),
    forecastByRegion = data.map((r) => linearForecast(r.values, nFuture));

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px">
      <div class="card" style="border-top:3px solid #0891B2">
        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">متوسط الأداء العام — ${esc(months[lastIdx])} 2026</div>
        <div style="font-size:26px;font-weight:800;color:#0891B2;letter-spacing:-.02em">${overallLast.toFixed(1)}%</div>
        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">${data.length.toLocaleString()} مناطق</div>
      </div>
      <div class="card" style="border-top:3px solid ${deltaColor(overallDelta)}">
        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">التغير منذ ${esc(months[0])}</div>
        <div style="font-size:26px;font-weight:800;color:${deltaColor(overallDelta)};letter-spacing:-.02em">${deltaArrow(overallDelta)} ${deltaText(overallDelta)}</div>
        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">نقطة مئوية (متوسط عام)</div>
      </div>
      <div class="card" style="border-top:3px solid #059669">
        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">أفضل منطقة أداءً</div>
        <div style="font-size:20px;font-weight:800;color:#059669;letter-spacing:-.02em">${esc(best.region)}</div>
        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">${best.last.toFixed(1)}% · عقد ${esc(best.contract)}</div>
      </div>
      <div class="card" style="border-top:3px solid #DC2626">
        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">تحتاج متابعة مع المقاول</div>
        <div style="font-size:20px;font-weight:800;color:#DC2626;letter-spacing:-.02em">${esc(mostDeclined.region)}</div>
        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">${deltaText(mostDeclined.delta)} نقطة · عقد ${esc(mostDeclined.contract)}</div>
      </div>
    </div>

    <div class="card mb14">
      <div class="card-title">📈 تطور مؤشر الأداء الشهري حسب المنطقة <span class="sub">${esc(months[0])} – ${esc(months[lastIdx])} 2026 (فعلي) + توقع ${nFuture} شهور قادمة</span></div>
      <div class="chart-box" style="height:380px"><canvas id="ch-mag-kpi-line"></canvas></div>
      <div style="font-size:11px;color:var(--tx-muted);margin-top:10px;display:flex;align-items:center;gap:6px">
        <span style="display:inline-block;width:18px;height:0;border-top:2.5px dashed #64748B"></span>
        الخط المنقّط = توقع تقديري بانحدار خطي بسيط من اتجاه البيانات الفعلية، وليس تأكيدًا — للمتابعة الفعلية مع المقاول
      </div>
    </div>

    <div class="card mb14">
      <div class="card-title">🔍 تحليل الأداء</div>
      <div style="font-size:13px;line-height:2;color:var(--tx-main)">
        ${magKpiAnalysisHTML(stats, monthlyAvg, best, worst, mostImproved, mostDeclined, overallDelta)}
      </div>
    </div>

    <div class="card">
      <div class="card-title" style="margin-bottom:14px">
        تفصيل مؤشرات الأداء حسب المنطقة وعقد المقاول
        <span class="sub">${data.length.toLocaleString()} مناطق</span>
      </div>
      <div class="tbl-wrap">
        <table>
          <thead><tr>
            <th style="text-align:right;padding-right:14px;min-width:100px">المنطقة</th>
            <th style="min-width:120px">رقم عقد المقاول</th>
            ${months.map((m) => `<th style="min-width:78px">${esc(m)}</th>`).join("")}
            <th style="min-width:90px">المتوسط</th>
            <th style="min-width:90px">التغير</th>
            <th style="min-width:110px">التصنيف</th>
          </tr></thead>
          <tbody>
            ${stats
              .map(
                (r) => `<tr>
              <td style="text-align:right;padding-right:14px;font-weight:700">${esc(r.region)}</td>
              <td style="font-family:monospace;font-size:11px;font-weight:700;color:#0891B2">${esc(r.contract)}</td>
              ${r.values.map((v) => `<td style="font-weight:600">${v.toFixed(2)}%</td>`).join("")}
              <td style="font-weight:700">${r.avgVal.toFixed(2)}%</td>
              <td style="font-weight:700;color:${deltaColor(r.delta)}">${deltaArrow(r.delta)} ${deltaText(r.delta)}</td>
              <td><span style="background:${tierBg(r.last)};color:${tierColor(r.last)};border:1px solid ${tierColor(r.last)}33;border-radius:20px;padding:3px 10px;font-size:10px;font-weight:700">${TIER[r.tier]?.label || "—"}</span></td>
            </tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>`;

  requestAnimationFrame(() => {
    killChart("ch-mag-kpi-line");
    CHARTS["ch-mag-kpi-line"] = new Chart(document.getElementById("ch-mag-kpi-line"), {
      type: "line",
      data: {
        labels: [...months, ...futureMonths].map((m) => `${m} 2026`),
        datasets: [
          // الخط الفعلي (متصل) — بيانات حقيقية فقط، فاضي (null) في شهور التوقع
          ...data.map((r, i) => ({
            label: r.region,
            data: [...r.values, ...Array(nFuture).fill(null)],
            borderColor: PALETTE[i % PALETTE.length],
            backgroundColor: PALETTE[i % PALETTE.length] + "22",
            borderWidth: 2.5,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: PALETTE[i % PALETTE.length],
          })),
          // خط التوقع (منقّط) — بيبدأ من آخر نقطة فعلية عشان يكمّل بصريًا
          // وبيتحسب تلقائي من linearForecast() فوق — مفيش أرقام يدوية هنا
          ...data.map((r, i) => ({
            label: r.region + " (توقع)",
            data: [
              ...Array(months.length - 1).fill(null),
              r.values[r.values.length - 1],
              ...forecastByRegion[i],
            ],
            borderColor: PALETTE[i % PALETTE.length],
            backgroundColor: "transparent",
            borderWidth: 2.5,
            borderDash: [6, 4],
            tension: 0.3,
            pointRadius: 3,
            pointStyle: "rectRot",
            pointHoverRadius: 5,
            pointBackgroundColor: PALETTE[i % PALETTE.length],
          })),
          {
            label: "المتوسط العام",
            data: [...monthlyAvg, ...Array(nFuture).fill(null)],
            borderColor: "#64748B",
            borderDash: [6, 4],
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 0,
            fill: !1,
          },
        ],
      },
      options: {
        maintainAspectRatio: !1,
        interaction: { mode: "index", intersect: !1 },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: { size: 10 },
              boxWidth: 12,
              padding: 10,
              // إخفاء مدخلات "(توقع)" من الليجند عشان مايتكررش اسم المنطقة مرتين
              filter: (item) => !String(item.text || "").includes("(توقع)"),
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                ` ${ctx.dataset.label}: ${ctx.raw == null ? "—" : ctx.raw.toFixed(2) + "%"}`,
            },
          },
        },
        scales: {
          y: { suggestedMin: 60, suggestedMax: 100, ticks: { callback: (v) => v + "%" } },
        },
      },
    });
  });
}

function magKpiAnalysisHTML(stats, monthlyAvg, best, worst, mostImproved, mostDeclined, overallDelta) {
  const m = MAG_KPI_MONTHS,
    last = m.length - 1,
    trendWord = overallDelta > 0.05 ? "تحسّناً" : overallDelta < -0.05 ? "تراجعاً" : "استقراراً نسبياً",
    lines = [];

  lines.push(
    `سجّل متوسط مؤشر الأداء العام ${trendWord} خلال الفترة من ${esc(m[0])} إلى ${esc(m[last])} 2026، منتقلاً من ${monthlyAvg[0].toFixed(1)}% إلى ${monthlyAvg[last].toFixed(1)}% (${overallDelta >= 0 ? "+" : ""}${overallDelta.toFixed(1)} نقطة مئوية).`,
  );

  lines.push(
    `<strong>${esc(best.region)}</strong> تتصدّر المناطق بمتوسط أداء ${best.avgVal.toFixed(1)}% (عقد ${esc(best.contract)})، بينما تسجّل <strong>${esc(worst.region)}</strong> أدنى متوسط أداء بـ ${worst.avgVal.toFixed(1)}% (عقد ${esc(worst.contract)}).`,
  );

  if (mostDeclined.delta < -3) {
    lines.push(
      `⚠️ منطقة <strong>${esc(mostDeclined.region)}</strong> (عقد المقاول ${esc(mostDeclined.contract)}) سجّلت أكبر تراجع بمقدار ${Math.abs(mostDeclined.delta).toFixed(1)} نقطة بين ${esc(m[0])} (${mostDeclined.first.toFixed(1)}%) و${esc(m[last])} (${mostDeclined.last.toFixed(1)}%)، وتحتاج متابعة مباشرة مع المقاول لمعرفة الأسباب ووضع خطة تصحيحية.`,
    );
  }

  if (mostImproved.delta > 3) {
    lines.push(
      `✅ منطقة <strong>${esc(mostImproved.region)}</strong> (عقد ${esc(mostImproved.contract)}) حقّقت أفضل تحسّن بمقدار +${mostImproved.delta.toFixed(1)} نقطة، ما يعكس التزاماً جيداً بمستوى الخدمة المتعاقد عليه.`,
    );
  }

  const belowTarget = stats.filter((r) => r.last < 75);
  lines.push(
    belowTarget.length
      ? `${belowTarget.length === 1 ? "منطقة واحدة" : belowTarget.length + " مناطق"} (${belowTarget.map((r) => esc(r.region)).join("، ")}) أقل من نسبة 75% المستهدفة (تصنيف "جيد جداً") في آخر شهر مرصود، وتحتاج خطة تحسين من المقاول المختص بكل عقد.`
      : `جميع المناطق حافظت على أداء 75% فأعلى (تصنيف "جيد جداً") خلال آخر شهر مرصود.`,
  );

  return lines.map((t) => `<p style="margin:0 0 10px">${t}</p>`).join("");
}

/* ╔════════════════════════════════════════════════════════════╗
   ║  🔩  JS تبويب: قطع الغيار
   ║  (tab-spare) — الدوال الخاصة بهذا التبويب تبدأ هنا
   ╚════════════════════════════════════════════════════════════╝ */
function renderSpareTab() {
  const el = document.getElementById("spare-content");
  if (!el) return;
  const D = FILTERED,
    COLOR = "#0E7490",
    rows = D.filter((r) => r.description || null != r.quantity || null != r.unitValue);
  if (!rows.length)
    return void (el.innerHTML =
      '<div class="card empty-state">\n      <div class="empty-state-icon">🔩</div>\n      <div class="empty-state-title">لم يتم التحميل</div>\n    </div>');
  const withQty = rows.filter((r) => null != r.quantity),
    withUnit = rows.filter((r) => null != r.unitValue),
    withBoth = rows.filter((r) => null != r.quantity && null != r.unitValue),
    totalQty = withQty.reduce((s, r) => s + r.quantity, 0),
    totalVal = withBoth.reduce((s, r) => s + r.quantity * r.unitValue, 0),
    avgUnit = withUnit.length
      ? withUnit.reduce((s, r) => s + r.unitValue, 0) / withUnit.length
      : null,
    maxUnit = withUnit.length ? Math.max(...withUnit.map((r) => r.unitValue)) : null,
    byStage = (withUnit.sort((a, b) => b.unitValue - a.unitValue)[0], {});
  rows.forEach((r) => {
    r.stage &&
      (byStage[r.stage] || (byStage[r.stage] = { qty: 0, val: 0, count: 0 }),
      (byStage[r.stage].qty += r.quantity || 0),
      (byStage[r.stage].val += r.quantity && r.unitValue ? r.quantity * r.unitValue : 0),
      (byStage[r.stage].count += 1));
  });
  const stageArr = Object.entries(byStage).sort((a, b) => b[1].qty - a[1].qty),
    byDist = {};
  rows.forEach((r) => {
    r.district &&
      (byDist[r.district] || (byDist[r.district] = { qty: 0, count: 0 }),
      (byDist[r.district].qty += r.quantity || 0),
      (byDist[r.district].count += 1));
  });
  const distArr = Object.entries(byDist)
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 20),
    top20qty = [...rows]
      .filter((r) => null != r.quantity)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 20);
  ((el.innerHTML = `\n    \n    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px">\n      <div class="card" style="border-top:3px solid ${COLOR}">\n        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">عدد المدارس</div>\n        <div style="font-size:26px;font-weight:800;color:${COLOR};letter-spacing:-.02em">${rows.length.toLocaleString()}</div>\n        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">من إجمالي ${D.length.toLocaleString()}</div>\n      </div>\n      <div class="card" style="border-top:3px solid #059669">\n        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">إجمالي الكميات</div>\n        <div style="font-size:26px;font-weight:800;color:#059669;letter-spacing:-.02em">${totalQty.toLocaleString()}</div>\n        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">${withQty.length.toLocaleString()} مدرسة</div>\n      </div>\n      <div class="card" style="border-top:3px solid #7C3AED">\n        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">إجمالي القيمة</div>\n        <div style="font-size:26px;font-weight:800;color:#7C3AED;letter-spacing:-.02em">${fmt(totalVal, 0)}</div>\n        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">الكمية × قيمة الوحدة</div>\n      </div>\n      <div class="card" style="border-top:3px solid #D97706">\n        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">متوسط قيمة الوحدة</div>\n        <div style="font-size:26px;font-weight:800;color:#D97706;letter-spacing:-.02em">${null != avgUnit ? fmt(avgUnit, 2) : "—"}</div>\n        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">أعلى: ${null != maxUnit ? fmt(maxUnit, 2) : "—"}</div>\n      </div>\n    </div>\n\n    \n    <div class="g2 mb14">\n      <div class="card">\n        <div class="card-title">أعلى 20 مدرسة — الكمية</div>\n        <div class="chart-box" style="height:480px"><canvas id="ch-spare-top-qty"></canvas></div>\n      </div>\n      <div class="card">\n        <div class="card-title">إجمالي الكميات حسب الحي <span class="sub">أعلى 20</span></div>\n        <div class="chart-box" style="height:480px"><canvas id="ch-spare-dist"></canvas></div>\n      </div>\n    </div>\n    <div class="g2 mb14">\n      <div class="card">\n        <div class="card-title">توزيع الكميات حسب المرحلة</div>\n        <div class="chart-box" style="height:250px"><canvas id="ch-spare-stage-qty"></canvas></div>\n      </div>\n      <div class="card">\n        <div class="card-title">إجمالي القيمة حسب المرحلة</div>\n        <div class="chart-box" style="height:250px"><canvas id="ch-spare-stage-val"></canvas></div>\n      </div>\n    </div>\n\n    \n    <div class="card">\n      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px">\n        <div class="card-title" style="margin:0">\n          تفصيل قطع الغيار\n          <span class="sub" id="spare-tbl-cnt">${rows.length.toLocaleString()} مدرسة</span>\n        </div>\n        <select class="fsel" id="spare-tbl-sort" onchange="renderSpareTable()" style="font-size:11px">\n          <option value="qty_desc">الكمية ↓ تنازلي</option>\n          <option value="qty_asc">الكمية ↑ تصاعدي</option>\n          <option value="unit_desc">قيمة الوحدة ↓ تنازلي</option>\n          <option value="unit_asc">قيمة الوحدة ↑ تصاعدي</option>\n          <option value="total_desc">إجمالي القيمة ↓ تنازلي</option>\n          <option value="name">الاسم أ-ي</option>\n        </select>\n      </div>\n      <div class="tbl-wrap">\n        <table>\n          <thead><tr>\n            <th style="text-align:right;padding-right:14px;min-width:200px">اسم المدرسة</th>\n            <th style="min-width:80px">الرقم الوزاري</th>\n            <th style="min-width:100px">الحي</th>\n            <th style="min-width:110px">المرحلة</th>\n            <th style="min-width:180px">الوصف</th>\n            <th style="min-width:80px">الكمية</th>\n            <th style="min-width:100px">قيمة الوحدة</th>\n            <th style="min-width:110px">إجمالي القيمة</th>\n          </tr></thead>\n          <tbody id="spare-tbl-body"></tbody>\n        </table>\n      </div>\n      <div class="pag-bar" id="spare-tbl-pag">\n        <span class="pag-info" id="spare-pag-info"></span>\n        <div class="pag-btns" id="spare-pag-btns"></div>\n      </div>\n    </div>`),
    requestAnimationFrame(() => {
      (killChart("ch-spare-top-qty"),
        (CHARTS["ch-spare-top-qty"] = new Chart(document.getElementById("ch-spare-top-qty"), {
          type: "bar",
          data: {
            labels: top20qty.map((r) => (r.name.length > 30 ? r.name.slice(0, 30) + "…" : r.name)),
            datasets: [
              {
                label: "الكمية",
                data: top20qty.map((r) => r.quantity),
                backgroundColor: "#05966999",
                borderColor: "#059669",
                borderWidth: 1.5,
                borderRadius: 4,
              },
            ],
          },
          options: {
            indexAxis: "y",
            maintainAspectRatio: !1,
            plugins: {
              legend: { display: !1 },
              tooltip: { callbacks: { title: (ctx) => top20qty[ctx[0].dataIndex].name } },
            },
            scales: {
              x: { beginAtZero: !0 },
              y: {
                ticks: { font: { size: 10 } },
                afterFit: (s) => {
                  s.width = Math.max(s.width, 220);
                },
              },
            },
          },
        })),
        killChart("ch-spare-dist"),
        (CHARTS["ch-spare-dist"] = new Chart(document.getElementById("ch-spare-dist"), {
          type: "bar",
          data: {
            labels: distArr.map((d) => (d[0].length > 28 ? d[0].slice(0, 28) + "…" : d[0])),
            datasets: [
              {
                label: "الكمية",
                data: distArr.map((d) => d[1].qty),
                backgroundColor: COLOR + "88",
                borderColor: COLOR,
                borderWidth: 1,
                borderRadius: 4,
              },
            ],
          },
          options: {
            indexAxis: "y",
            maintainAspectRatio: !1,
            plugins: {
              legend: { display: !1 },
              tooltip: { callbacks: { title: (ctx) => distArr[ctx[0].dataIndex][0] } },
            },
            scales: {
              x: { beginAtZero: !0 },
              y: {
                ticks: { font: { size: 10 } },
                afterFit: (s) => {
                  s.width = Math.max(s.width, 220);
                },
              },
            },
          },
        })),
        killChart("ch-spare-stage-qty"),
        (CHARTS["ch-spare-stage-qty"] = new Chart(document.getElementById("ch-spare-stage-qty"), {
          type: "bar",
          data: {
            labels: stageArr.map((s) => s[0]),
            datasets: [
              {
                label: "الكمية",
                data: stageArr.map((s) => s[1].qty),
                backgroundColor: stageArr.map(
                  (_, i) => ["#059669", COLOR, "#7C3AED", "#D97706"][i % 4] + "BB",
                ),
                borderColor: stageArr.map(
                  (_, i) => ["#059669", COLOR, "#7C3AED", "#D97706"][i % 4],
                ),
                borderWidth: 1.5,
                borderRadius: 5,
              },
            ],
          },
          options: {
            maintainAspectRatio: !1,
            plugins: { legend: { display: !1 } },
            scales: { x: { ticks: { font: { size: 10 } } }, y: { beginAtZero: !0 } },
          },
        })),
        killChart("ch-spare-stage-val"),
        (CHARTS["ch-spare-stage-val"] = new Chart(document.getElementById("ch-spare-stage-val"), {
          type: "bar",
          data: {
            labels: stageArr.map((s) => s[0]),
            datasets: [
              {
                label: "إجمالي القيمة",
                data: stageArr.map((s) => +s[1].val.toFixed(0)),
                backgroundColor: stageArr.map(
                  (_, i) => ["#7C3AED", "#D97706", COLOR, "#059669"][i % 4] + "BB",
                ),
                borderColor: stageArr.map(
                  (_, i) => ["#7C3AED", "#D97706", COLOR, "#059669"][i % 4],
                ),
                borderWidth: 1.5,
                borderRadius: 5,
              },
            ],
          },
          options: {
            maintainAspectRatio: !1,
            plugins: { legend: { display: !1 } },
            scales: { x: { ticks: { font: { size: 10 } } }, y: { beginAtZero: !0 } },
          },
        })));
    }),
    (window._SPARE_ROWS = rows),
    (window._SPARE_PAGE = { cur: 0, SIZE: 50 }),
    renderSpareTable());
}
function renderSpareTable() {
  const rows = window._SPARE_ROWS || [],
    pg = window._SPARE_PAGE || { cur: 0, SIZE: 50 },
    sort = document.getElementById("spare-tbl-sort")?.value || "qty_desc",
    sorters = {
      qty_desc: (a, b) => (b.quantity ?? -1) - (a.quantity ?? -1),
      qty_asc: (a, b) => (a.quantity ?? 999) - (b.quantity ?? 999),
      unit_desc: (a, b) => (b.unitValue ?? -1) - (a.unitValue ?? -1),
      unit_asc: (a, b) => (a.unitValue ?? 999) - (b.unitValue ?? 999),
      total_desc: (a, b) =>
        (b.quantity || 0) * (b.unitValue || 0) - (a.quantity || 0) * (a.unitValue || 0),
      name: (a, b) => a.name.localeCompare(b.name, "ar"),
    },
    sorted = [...rows].sort(sorters[sort] || sorters.qty_desc),
    total = sorted.length,
    maxPage = Math.max(0, Math.ceil(total / pg.SIZE) - 1);
  pg.cur = Math.min(pg.cur, maxPage);
  const start = pg.cur * pg.SIZE,
    page = sorted.slice(start, start + pg.SIZE),
    tbody = document.getElementById("spare-tbl-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  const frag = document.createDocumentFragment();
  (page.forEach((r) => {
    const totalVal = null != r.quantity && null != r.unitValue ? r.quantity * r.unitValue : null,
      tr = document.createElement("tr");
 ((tr.innerHTML = ` <td style="text-align:right;padding-right:14px"> <div style="font-weight:700;font-size:12px;max-width:200px;white-space:normal;line-height:1.4">${esc(r.name)}</div> </td> <td style="font-size:10px;color:var(--tx-muted)">${esc(r.minId) || "—"}</td> <td style="font-size:11px;color:var(--tx-muted)">${esc(r.district) || "—"}</td> <td style="font-size:11px;white-space:normal">${esc(r.stage) || "—"}</td> <td style="font-size:11px;max-width:180px;white-space:normal;line-height:1.4">${esc(r.description) || "—"}</td> <td style="font-weight:700;color:#059669;text-align:center">${r.quantity ?? "—"}</td> <td style="font-weight:700;color:#7C3AED;text-align:center">${null != r.unitValue ? fmt(r.unitValue, 2) : "—"}</td> <td style="font-weight:800;color:#0E7490;text-align:center">${null != totalVal ? fmt(totalVal, 2) : "—"}</td>`),
      frag.appendChild(tr));
  }),
    tbody.appendChild(frag));
  const infoEl = document.getElementById("spare-pag-info"),
    btnsEl = document.getElementById("spare-pag-btns");
  if (
    (infoEl &&
      (infoEl.textContent = `الصفوف ${(start + 1).toLocaleString()}–${Math.min(start + pg.SIZE, total).toLocaleString()} من ${total.toLocaleString()}`),
    btnsEl)
  ) {
    btnsEl.innerHTML = "";
    const addBtn = (label, page, disabled, active = !1) => {
      const b = document.createElement("button");
      ((b.className = "pag-btn" + (active ? " active" : "")),
        (b.textContent = label),
        (b.disabled = disabled),
        disabled ||
          (b.onclick = () => {
            ((pg.cur = page), renderSpareTable());
          }),
        btnsEl.appendChild(b));
    };
    addBtn("◄ السابق", pg.cur - 1, 0 === pg.cur);
    const range = 3;
    let lo = Math.max(0, pg.cur - range),
      hi = Math.min(maxPage, pg.cur + range);
    lo > 0 &&
      (addBtn("1", 0, !1),
      lo > 1 &&
        btnsEl.appendChild(
          Object.assign(document.createElement("span"), {
            textContent: "…",
            style: "padding:0 4px;color:var(--tx-muted)",
          }),
        ));
    for (let i = lo; i <= hi; i++) addBtn(String(i + 1), i, !1, i === pg.cur);
    (hi < maxPage &&
      (btnsEl.appendChild(
        Object.assign(document.createElement("span"), {
          textContent: "…",
          style: "padding:0 4px;color:var(--tx-muted)",
        }),
      ),
      addBtn(String(maxPage + 1), maxPage, !1)),
      addBtn("التالي ►", pg.cur + 1, pg.cur >= maxPage));
  }
}
/* ╔════════════════════════════════════════════════════════════╗
   ║  🔍  JS تبويب: تقييم عاين
   ║  (tab-ayen) — الدوال الخاصة بهذا التبويب تبدأ هنا
   ╚════════════════════════════════════════════════════════════╝ */
function renderAyenTab() {
  const el = document.getElementById("ayen-content");
  if (!el) return;
  const D = FILTERED,
    scored = D.filter((r) => null != r.ayenScore)
      .map((r) => ({ ...r }))
      .sort((a, b) => a.ayenScore - b.ayenScore);
  if (!scored.length)
    return void (el.innerHTML =
      '<div class="card empty-state">\n      <div class="empty-state-icon">🔍</div>\n      <div class="empty-state-title">لم يتم التحميل</div>\n    </div>');
  const avgAyen = scored.reduce((s, r) => s + r.ayenScore, 0) / scored.length,
    critical = scored.filter((r) => r.ayenScore < 25).length,
    needWork = scored.filter((r) => r.ayenScore >= 25 && r.ayenScore < 50).length,
    good = scored.filter((r) => r.ayenScore >= 50 && r.ayenScore < 75).length,
    excellent = scored.filter((r) => r.ayenScore >= 75).length,
    total = scored.length,
    byDist = {};
  scored.forEach((r) => {
    r.district &&
      (byDist[r.district] || (byDist[r.district] = []), byDist[r.district].push(r.ayenScore));
  });
  const distArr = Object.entries(byDist)
      .map(([k, v]) => ({ k: k, avg: v.reduce((a, b) => a + b, 0) / v.length, count: v.length }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 20),
    byStage = {};
  scored.forEach((r) => {
    r.stage && (byStage[r.stage] || (byStage[r.stage] = []), byStage[r.stage].push(r.ayenScore));
  });
  const stageArr = Object.entries(byStage)
      .map(([k, v]) => ({ k: k, avg: v.reduce((a, b) => a + b, 0) / v.length, count: v.length }))
      .sort((a, b) => b.avg - a.avg),
    byGender = {};
  scored.forEach((r) => {
    const g = r.gender?.trim() || "غير محدد";
    (byGender[g] || (byGender[g] = []), byGender[g].push(r.ayenScore));
  });
  const byOwner = {};
  scored.forEach((r) => {
    const o = r.ownership || "غير محدد";
    (byOwner[o] || (byOwner[o] = []), byOwner[o].push(r.ayenScore));
  });
  const bins = [
      "0–9",
      "10–19",
      "20–29",
      "30–39",
      "40–49",
      "50–59",
      "60–69",
      "70–79",
      "80–89",
      "90–100",
    ],
    binData = Array(10).fill(0);
  scored.forEach((r) => {
    binData[Math.min(9, Math.floor(r.ayenScore / 10))]++;
  });
  const worst10 = scored.slice(0, 10),
    best10 = [...scored].reverse().slice(0, 10);
  ((el.innerHTML = `\n    \n    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:16px">\n      <div class="card" style="border-top:3px solid #0E7490">\n        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">متوسط تقييم عاين</div>\n        <div style="font-size:26px;font-weight:800;color:#0E7490;letter-spacing:-.02em">${avgAyen.toFixed(1)}%</div>\n        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">${total.toLocaleString()} مدرسة مقيّمة من ${D.length.toLocaleString()}</div>\n      </div>\n      <div class="card" style="border-top:3px solid #DC2626">\n        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">حرج · أقل من 25%</div>\n        <div style="font-size:26px;font-weight:800;color:#DC2626;letter-spacing:-.02em">${critical.toLocaleString()}</div>\n        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">${total ? ((critical / total) * 100).toFixed(0) : 0}% من المقيّمات · تدخل عاجل</div>\n      </div>\n      <div class="card" style="border-top:3px solid #D97706">\n        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">متوسط · 25–49%</div>\n        <div style="font-size:26px;font-weight:800;color:#D97706;letter-spacing:-.02em">${needWork.toLocaleString()}</div>\n        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">${total ? ((needWork / total) * 100).toFixed(0) : 0}% · تحتاج متابعة</div>\n      </div>\n      <div class="card" style="border-top:3px solid #059669">\n        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">جيد · 50–74%</div>\n        <div style="font-size:26px;font-weight:800;color:#059669;letter-spacing:-.02em">${good.toLocaleString()}</div>\n        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">${total ? ((good / total) * 100).toFixed(0) : 0}% · مستوى مقبول</div>\n      </div>\n      <div class="card" style="border-top:3px solid #0891B2">\n        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">جيد جداً · 75–100%</div>\n        <div style="font-size:26px;font-weight:800;color:#0891B2;letter-spacing:-.02em">${excellent.toLocaleString()}</div>\n        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">${total ? ((excellent / total) * 100).toFixed(0) : 0}% · مستوى جيد جداً</div>\n      </div>\n    </div>\n\n    \n    <div class="card mb14" style="padding-bottom:20px">\n      <div class="card-title">\n        <span class="card-title-icon" style="background:#ECFEFF;color:#0E7490">🔍</span>\n        توزيع درجة تقييم عاين\n        <span class="sub">${total.toLocaleString()} مدرسة · متوسط ${avgAyen.toFixed(1)}%</span>\n      </div>\n      <div class="tier-strip">\n        <div class="tier-seg" style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;--pct:${total ? ((critical / total) * 100).toFixed(0) : 0}%">\n          <div class="tier-indicator" style="background:#DC2626"></div>\n          <div class="tier-num">${critical}</div>\n          <div class="tier-pct">${total ? ((critical / total) * 100).toFixed(0) : 0}%</div>\n          <div class="tier-sub">حرج · 0–24%</div>\n        </div>\n        <div class="tier-seg" style="background:#FFFBEB;color:#D97706;border:1px solid #FDE68A;--pct:${total ? ((needWork / total) * 100).toFixed(0) : 0}%">\n          <div class="tier-indicator" style="background:#D97706"></div>\n          <div class="tier-num">${needWork}</div>\n          <div class="tier-pct">${total ? ((needWork / total) * 100).toFixed(0) : 0}%</div>\n          <div class="tier-sub">متوسط · 25–49%</div>\n        </div>\n        <div class="tier-seg" style="background:#F0FDF4;color:#059669;border:1px solid #A7F3D0;--pct:${total ? ((good / total) * 100).toFixed(0) : 0}%">\n          <div class="tier-indicator" style="background:#059669"></div>\n          <div class="tier-num">${good}</div>\n          <div class="tier-pct">${total ? ((good / total) * 100).toFixed(0) : 0}%</div>\n          <div class="tier-sub">جيد · 50–74%</div>\n        </div>\n        <div class="tier-seg" style="background:#ECFEFF;color:#0891B2;border:1px solid #A5F3FC;--pct:${total ? ((excellent / total) * 100).toFixed(0) : 0}%">\n          <div class="tier-indicator" style="background:#0891B2"></div>\n          <div class="tier-num">${excellent}</div>\n          <div class="tier-pct">${total ? ((excellent / total) * 100).toFixed(0) : 0}%</div>\n          <div class="tier-sub">جيد جداً · 75–100%</div>\n        </div>\n      </div>\n    </div>\n\n    \n    <div class="g2 mb14">\n      <div class="card">\n        <div class="card-title">توزيع درجات عاين </div>\n        <div class="chart-box" style="height:260px"><canvas id="ch-ayen-hist"></canvas></div>\n      </div>\n      <div class="g2" style="margin-bottom:0">\n        <div class="card">\n          <div class="card-title">متوسط عاين حسب الجنس</div>\n          <div class="chart-box" style="height:260px"><canvas id="ch-ayen-gender"></canvas></div>\n        </div>\n        <div class="card">\n          <div class="card-title">متوسط عاين حسب الملكية</div>\n          <div class="chart-box" style="height:260px"><canvas id="ch-ayen-owner"></canvas></div>\n        </div>\n      </div>\n    </div>\n\n    \n    <div class="g2 mb14">\n      <div class="card">\n        <div class="card-title">أسوأ 20 حي — متوسط درجة عاين</div>\n        <div class="chart-box" style="height:520px"><canvas id="ch-ayen-dist"></canvas></div>\n      </div>\n      <div class="card">\n        <div class="card-title">متوسط درجة عاين حسب المرحلة</div>\n        <div class="chart-box" style="height:520px"><canvas id="ch-ayen-stage"></canvas></div>\n      </div>\n    </div>\n\n    \n    <div class="card mb14">\n      <div class="card-title">تقييم عاين مقابل FCA <span class="sub">كل نقطة = مدرسة</span></div>\n      <div class="chart-box" style="height:320px"><canvas id="ch-ayen-scatter"></canvas></div>\n    </div>\n\n    \n    <div class="card mb14">\n      <div class="card-title">أفضل وأسوأ المدارس — تقييم عاين</div>\n      <div class="g2">\n        <div>\n          <div style="font-size:11px;font-weight:700;color:#DC2626;margin-bottom:10px;padding:6px 12px;background:#FFF5F5;border-radius:8px;display:inline-flex;align-items:center;gap:6px">\n            ⚠️ أسوأ 10 مدارس — تحتاج تدخل عاجل\n          </div>\n          <div id="ayen-worst-list"></div>\n        </div>\n        <div>\n          <div style="font-size:11px;font-weight:700;color:#059669;margin-bottom:10px;padding:6px 12px;background:#F0FDF4;border-radius:8px;display:inline-flex;align-items:center;gap:6px">\n            ✅ أفضل 10 مدارس — نموذج يُحتذى\n          </div>\n          <div id="ayen-best-list"></div>\n        </div>\n      </div>\n    </div>\n\n`),
    (window._AYEN_ROWS = scored),
    (window._AYEN_PAGE = { cur: 0, SIZE: 50 }),
    requestAnimationFrame(() => {
      (killChart("ch-ayen-hist"),
        (CHARTS["ch-ayen-hist"] = new Chart(document.getElementById("ch-ayen-hist"), {
          type: "bar",
          data: {
            labels: bins,
            datasets: [
              {
                label: "عدد المدارس",
                data: binData,
                backgroundColor: bins.map((_, i) => tierColor(10 * i + 5) + "BB"),
                borderWidth: 1,
                borderRadius: 4,
              },
            ],
          },
          options: {
            maintainAspectRatio: !1,
            plugins: { legend: { display: !1 } },
            scales: { y: { beginAtZero: !0 }, x: { ticks: { font: { size: 10 } } } },
          },
        })));
      const genderData = Object.entries(byGender).map(([k, v]) => ({
          k: k,
          avg: v.reduce((a, b) => a + b, 0) / v.length,
        })),
        gColors = { بنات: "#DC262688", بنين: "#0891B288" };
      (killChart("ch-ayen-gender"),
        (CHARTS["ch-ayen-gender"] = new Chart(document.getElementById("ch-ayen-gender"), {
          type: "bar",
          data: {
            labels: genderData.map((x) => x.k),
            datasets: [
              {
                label: "متوسط عاين",
                data: genderData.map((x) => +x.avg.toFixed(1)),
                backgroundColor: genderData.map((x) => gColors[x.k] || "#083D4F88"),
                borderColor: genderData.map((x) => (gColors[x.k] || "#083D4F").replace("88", "FF")),
                borderWidth: 1.5,
                borderRadius: 5,
              },
            ],
          },
          options: {
            maintainAspectRatio: !1,
            plugins: { legend: { display: !1 } },
            scales: { y: { beginAtZero: !0, max: 100 }, x: { ticks: { font: { size: 11 } } } },
          },
        })));
      const ownerData = Object.entries(byOwner).map(([k, v]) => ({
          k: k,
          avg: v.reduce((a, b) => a + b, 0) / v.length,
        })),
        oColors = { حكومي: "#0891B288", مستأجر: "#D9770688" };
      (killChart("ch-ayen-owner"),
        (CHARTS["ch-ayen-owner"] = new Chart(document.getElementById("ch-ayen-owner"), {
          type: "bar",
          data: {
            labels: ownerData.map((x) => x.k),
            datasets: [
              {
                label: "متوسط عاين",
                data: ownerData.map((x) => +x.avg.toFixed(1)),
                backgroundColor: ownerData.map((x) => oColors[x.k] || "#083D4F88"),
                borderColor: ownerData.map((x) => (oColors[x.k] || "#083D4F").replace("88", "FF")),
                borderWidth: 1.5,
                borderRadius: 5,
              },
            ],
          },
          options: {
            maintainAspectRatio: !1,
            plugins: { legend: { display: !1 } },
            scales: { y: { beginAtZero: !0, max: 100 }, x: { ticks: { font: { size: 11 } } } },
          },
        })),
        killChart("ch-ayen-dist"),
        (CHARTS["ch-ayen-dist"] = new Chart(document.getElementById("ch-ayen-dist"), {
          type: "bar",
          data: {
            labels: distArr.map((x) => (x.k.length > 28 ? x.k.slice(0, 28) + "…" : x.k)),
            datasets: [
              {
                label: "متوسط تقييم عاين",
                data: distArr.map((x) => +x.avg.toFixed(1)),
                backgroundColor: distArr.map((x) => tierColor(x.avg) + "88"),
                borderColor: distArr.map((x) => tierColor(x.avg)),
                borderWidth: 1.5,
                borderRadius: 4,
              },
            ],
          },
          options: {
            indexAxis: "y",
            maintainAspectRatio: !1,
            plugins: {
              legend: { display: !1 },
              tooltip: {
                callbacks: {
                  title: (ctx) => distArr[ctx[0].dataIndex].k,
                  label: (ctx) =>
                    `  متوسط: ${ctx.raw}%  (${distArr[ctx[0].dataIndex].count} مدرسة)`,
                },
              },
            },
            scales: {
              x: { beginAtZero: !0, max: 100, ticks: { callback: (v) => v + "%" } },
              y: {
                ticks: { font: { size: 10 } },
                afterFit: (s) => {
                  s.width = Math.max(s.width, 220);
                },
              },
            },
          },
        })),
        killChart("ch-ayen-stage"),
        (CHARTS["ch-ayen-stage"] = new Chart(document.getElementById("ch-ayen-stage"), {
          type: "bar",
          data: {
            labels: stageArr.map((x) => x.k),
            datasets: [
              {
                label: "متوسط تقييم عاين",
                data: stageArr.map((x) => +x.avg.toFixed(1)),
                backgroundColor: stageArr.map((x) => tierColor(x.avg) + "BB"),
                borderColor: stageArr.map((x) => tierColor(x.avg)),
                borderWidth: 1.5,
                borderRadius: 5,
              },
            ],
          },
          options: {
            maintainAspectRatio: !1,
            plugins: {
              legend: { display: !1 },
              tooltip: {
                callbacks: {
                  label: (ctx) =>
                    `  متوسط: ${ctx.raw}%  (${stageArr[ctx[0].dataIndex].count} مدرسة)`,
                },
              },
            },
            scales: { x: { ticks: { font: { size: 10 } } }, y: { beginAtZero: !0, max: 100 } },
          },
        })),
        killChart("ch-ayen-scatter"));
      const scPts = scored
        .filter((r) => null != r.fca)
        .map((r) => ({
          x: +r.fca.toFixed(1),
          y: +r.ayenScore.toFixed(1),
          name: r.name,
          stage: r.stage,
        }));
      CHARTS["ch-ayen-scatter"] = new Chart(document.getElementById("ch-ayen-scatter"), {
        type: "scatter",
        data: {
          datasets: [
            {
              label: "المدارس",
              data: scPts,
              backgroundColor: scPts.map((p) => tierColor(p.y) + "66"),
              borderColor: scPts.map((p) => tierColor(p.y)),
              borderWidth: 1,
              pointRadius: 4,
              pointHoverRadius: 7,
            },
          ],
        },
        options: {
          maintainAspectRatio: !1,
          plugins: {
            legend: { display: !1 },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  [
                    `📍 ${ctx.raw.name}`,
                    `FCA: ${ctx.raw.x}%`,
                    `عاين: ${ctx.raw.y}%`,
                    ctx.raw.stage ? `المرحلة: ${ctx.raw.stage}` : "",
                  ].filter(Boolean),
              },
            },
          },
          scales: {
            x: { title: { display: !0, text: "FCA %" }, min: 0, max: 100 },
            y: { title: { display: !0, text: "تقييم عاين %" }, min: 0, max: 100 },
          },
        },
      });
    }));
  const makeAyenList = (schools, color) =>
    schools
      .map(
        (r) =>
          `\n    <div class="school-row">\n      <span class="school-score" style="color:${color}">${r.ayenScore.toFixed(1)}%</span>\n      <div class="mini-track"><div class="mini-fill" style="width:${r.ayenScore}%;background:${color}80"></div></div>\n      <div style="min-width:0;flex:2">\n        <div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:230px">${esc(r.name)}</div>\n        <div style="font-size:10px;color:var(--tx-muted)">\n          FCA: <strong style="color:${null != r.fca ? tierColor(r.fca) : "#ccc"}">${null != r.fca ? pct(r.fca) : "—"}</strong>\n          ${null != r.envScore ? ` · بيئة: <strong>${pct(r.envScore)}</strong>` : ""}\n          · ${esc(r.district || r.sector || "")} · ${esc(r.stage || "")}\n        </div>\n      </div>\n    </div>`,
      )
      .join("");
  ((document.getElementById("ayen-worst-list").innerHTML = makeAyenList(worst10, "#DC2626")),
    (document.getElementById("ayen-best-list").innerHTML = makeAyenList(best10, "#059669")),
    renderAyenTable());
}
function renderAyenTable() {
  const rows = window._AYEN_ROWS || [],
    pg = window._AYEN_PAGE || { cur: 0, SIZE: 50 },
    sort = document.getElementById("ayen-tbl-sort")?.value || "asc",
    searchVal = (document.getElementById("ayen-tbl-search")?.value || "").trim().toLowerCase(),
    sorters = {
      asc: (a, b) => a.ayenScore - b.ayenScore,
      desc: (a, b) => b.ayenScore - a.ayenScore,
      fca_desc: (a, b) => (b.fca ?? -1) - (a.fca ?? -1),
      env_desc: (a, b) => (b.envScore ?? -1) - (a.envScore ?? -1),
      name: (a, b) => a.name.localeCompare(b.name, "ar"),
    },
    sorted = [
      ...(searchVal
        ? rows.filter(
            (r) =>
              r.name.toLowerCase().includes(searchVal) || String(r.minId || "").includes(searchVal),
          )
        : rows),
    ].sort(sorters[sort] || sorters.asc),
    total = sorted.length,
    maxPg = Math.max(0, Math.ceil(total / pg.SIZE) - 1);
  pg.cur = Math.min(pg.cur, maxPg);
  const start = pg.cur * pg.SIZE,
    page = sorted.slice(start, start + pg.SIZE),
    tbody = document.getElementById("ayen-tbl-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  const frag = document.createDocumentFragment();
  (page.forEach((r) => {
    const ac = tierColor(r.ayenScore),
      fc = null != r.fca ? tierColor(r.fca) : "#ccc",
      ec = null != r.envScore ? tierColor(r.envScore) : "#ccc",
      tier = getTier(r.ayenScore),
      tierLbl = TIER[tier]?.label || "—",
      tierClr = TIER[tier]?.color || "#888",
      tierBg = TIER[tier]?.bg || "#f5f5f5",
      tr = document.createElement("tr");
 ((tr.innerHTML = ` <td style="text-align:right;padding-right:14px"> <div style="font-weight:700;font-size:12px;white-space:normal;line-height:1.4">${esc(r.name)}</div> <div style="font-size:10px;color:var(--tx-muted)">${esc(r.district || "")}</div> </td> <td style="font-size:10px;color:var(--tx-muted)">${esc(r.minId) || "—"}</td> <td style="font-size:11px">${esc(r.district) || "—"}</td> <td style="font-size:11px">${esc(r.stage) || "—"}</td> <td style="font-size:11px">${esc(r.gender) || "—"}</td> <td><span style="font-weight:800;color:${fc}">${pct(r.fca)}</span></td> <td><span style="font-weight:800;color:${ec}">${pct(r.envScore)}</span></td> <td> <span style="font-size:14px;font-weight:900;color:${ac}">${r.ayenScore.toFixed(1)}%</span> <div style="height:4px;width:${r.ayenScore}%;max-width:60px;background:${ac};border-radius:2px;margin-top:3px;opacity:.6"></div> </td> <td> <span style="font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px; background:${tierBg};color:${tierClr};border:1px solid ${tierClr}44;white-space:nowrap"> ${tierLbl} </span> </td>`),
      frag.appendChild(tr));
  }),
    tbody.appendChild(frag));
  const cntEl = document.getElementById("ayen-tbl-cnt");
  cntEl &&
    (cntEl.textContent = `${total.toLocaleString()} مدرسة${searchVal ? " (نتائج البحث)" : ""}`);
  const infoEl = document.getElementById("ayen-pag-info"),
    btnsEl = document.getElementById("ayen-pag-btns");
  if (
    (infoEl &&
      (infoEl.textContent = `الصفوف ${(start + 1).toLocaleString()}–${Math.min(start + pg.SIZE, total).toLocaleString()} من ${total.toLocaleString()}`),
    btnsEl)
  ) {
    btnsEl.innerHTML = "";
    const addBtn = (label, page, disabled, active = !1) => {
      const b = document.createElement("button");
      ((b.className = "pag-btn" + (active ? " active" : "")),
        (b.textContent = label),
        (b.disabled = disabled),
        disabled ||
          (b.onclick = () => {
            ((pg.cur = page), renderAyenTable());
          }),
        btnsEl.appendChild(b));
    };
    addBtn("◄ السابق", pg.cur - 1, 0 === pg.cur);
    const range = 3;
    let lo = Math.max(0, pg.cur - range),
      hi = Math.min(maxPg, pg.cur + range);
    lo > 0 &&
      (addBtn("1", 0, !1),
      lo > 1 &&
        btnsEl.appendChild(
          Object.assign(document.createElement("span"), {
            textContent: "…",
            style: "padding:0 4px;color:var(--tx-muted)",
          }),
        ));
    for (let i = lo; i <= hi; i++) addBtn(String(i + 1), i, !1, i === pg.cur);
    (hi < maxPg &&
      (btnsEl.appendChild(
        Object.assign(document.createElement("span"), {
          textContent: "…",
          style: "padding:0 4px;color:var(--tx-muted)",
        }),
      ),
      addBtn(String(maxPg + 1), maxPg, !1)),
      addBtn("التالي ►", pg.cur + 1, pg.cur >= maxPg));
  }
}
/* ╔════════════════════════════════════════════════════════════╗
   ║  📌  JS تبويب: عقود غير المجال
   ║  (tab-all-contracts) — الدوال الخاصة بهذا التبويب تبدأ هنا
   ║  المصدر: window.RAW_FM_CONTRACTS (شيت عقود_عدا_المجال)
   ║  يعرض كل المقاولين بدون فلترة مسبقة، مع فلتر اختياري بالمقاول
   ╚════════════════════════════════════════════════════════════╝ */
function acNormContractor(v) {
  return String(v || "")
    .replace(/^\s*شركة\s+/, "")
    .replace(/^\s*مؤسسة\s+/, "")
    .trim();
}
function acRemDays(r) {
  return num(r["المدة المتبقية بالأيام"]);
}
function acStatusBadge(rem) {
  return null == rem
    ? '<span style="background:#f1f5f9;color:#64748b;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;border:1px solid #64748b33">—</span>'
    : rem <= 0
      ? '<span style="background:#FEF2F2;color:#DC2626;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;border:1px solid #DC262633">منتهي</span>'
      : rem <= 90
        ? '<span style="background:#FFFBEB;color:#D97706;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;border:1px solid #D9770633">قارب على الانتهاء</span>'
        : '<span style="background:#ECFDF5;color:#059669;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;border:1px solid #05966933">جاري</span>';
}
window._acState = { contractor: "", search: "" };
function renderAllContracts() {
  const el = document.getElementById("all-contracts-content");
  if (!el) return;
  const all = window.RAW_FM_CONTRACTS || [];
  if (!all.length)
    return void (el.innerHTML =
      '<div class="card empty-state">\n      <div class="empty-state-icon">📌</div>\n      <div class="empty-state-title" style="margin-bottom:8px">لم يتم التحميل</div>\n    </div>');

  const contractorList = [...new Set(all.map((r) => acNormContractor(r["المقاول"])).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "ar"),
  );

  ((el.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px">
      <select id="ac-contractor"
        onchange="window._acState.contractor=this.value;renderAllContractsBody()"
        style="font-family:inherit;font-size:12px;padding:8px 14px;border:1px solid var(--bd-light);border-radius:10px;background:var(--bg-2);cursor:pointer;min-width:200px">
        <option value="">كل المقاولين (${contractorList.length})</option>
        ${contractorList
          .map(
            (c) =>
              `<option value="${esc(c)}" ${window._acState.contractor === c ? "selected" : ""}>${esc(c)}</option>`,
          )
          .join("")}
      </select>
      <input id="ac-search" type="text" placeholder="بحث في كل الأعمدة…"
        value="${esc(window._acState.search)}"
        oninput="window._acState.search=this.value;renderAllContractsBody()"
        style="flex:1;min-width:200px;padding:8px 14px;border:1px solid var(--bd-light);border-radius:10px;
        font-family:inherit;font-size:12px;direction:rtl">
      ${
        window._acState.contractor || window._acState.search
          ? `<button type="button" onclick="window._acState={contractor:'',search:''};renderAllContracts()"
        style="font-family:inherit;font-size:11px;font-weight:700;padding:8px 14px;border-radius:10px;cursor:pointer;border:1px solid var(--bd-mid);background:var(--bg-3);color:var(--tx-sec);white-space:nowrap">✕ إلغاء الفلاتر</button>`
          : ""
      }
    </div>
    <div id="ac-body"></div>
  `),
    renderAllContractsBody());
}
function renderAllContractsBody() {
  const el = document.getElementById("ac-body");
  if (!el) return;
  const all = window.RAW_FM_CONTRACTS || [];
  const st = window._acState || { contractor: "", search: "" };
  let data = all;
  if (st.contractor) data = data.filter((r) => acNormContractor(r["المقاول"]) === st.contractor);
  if (st.search) {
    const q = st.search.toLowerCase();
    data = data.filter((r) =>
      Object.values(r).some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }
  if (!data.length) {
    el.innerHTML =
      '<div class="card" style="text-align:center;padding:36px 24px">\n      <div style="font-size:32px;margin-bottom:10px">🔍</div>\n      <div style="font-size:13px;color:var(--tx-muted)">لا توجد نتائج مطابقة للفلتر/البحث الحالي</div>\n    </div>';
    return;
  }

  const total = data.length,
    active = data.filter((r) => {
      const rem = acRemDays(r);
      return null != rem && rem > 0;
    }).length,
    expired = data.filter((r) => {
      const rem = acRemDays(r);
      return null != rem && rem <= 0;
    }).length,
    expiring = data.filter((r) => {
      const rem = acRemDays(r);
      return null != rem && rem > 0 && rem <= 90;
    }).length,
    totalBase = data.reduce((s, r) => s + (num(r["قيمة العقد الأساسي"]) || 0), 0),
    totalValue = data.reduce((s, r) => s + (num(r["قيمة العقد المحدثة"]) || 0), 0),
    totalSpent = data.reduce((s, r) => s + (num(r["تراكمي المستخلصات المصروفة"]) || 0), 0);

  const byRegion = {},
    byScope = {},
    byContractor = {};
  data.forEach((r) => {
    const reg = r["المنطقة"] || "غير محدد";
    (byRegion[reg] || (byRegion[reg] = { total: 0, active: 0, expired: 0 }),
      byRegion[reg].total++,
      (() => {
        const rem = acRemDays(r);
        null != rem && rem > 0 ? byRegion[reg].active++ : byRegion[reg].expired++;
      })());
    const sc = r["النطاق"] || "غير محدد";
    byScope[sc] = (byScope[sc] || 0) + 1;
    const ctr = acNormContractor(r["المقاول"]) || "غير محدد";
    byContractor[ctr] = (byContractor[ctr] || 0) + 1;
  });

  const regionColors = ["#0891B2", "#059669", "#D97706", "#7C3AED", "#DC2626", "#0E7490", "#DB2777", "#65A30D"];
  const regions = Object.keys(byRegion);
  const topContractors = Object.entries(byContractor)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  ((el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="border-top:3px solid #0891B2;padding:16px">
        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px">إجمالي العقود</div>
        <div style="font-size:28px;font-weight:800;color:#0891B2">${total}</div>
        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">عقد</div>
      </div>
      <div class="card" style="border-top:3px solid #7C3AED;padding:16px">
        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px">إجمالي قيمة العقود (محدثة)</div>
        <div style="font-size:18px;font-weight:800;color:#7C3AED">${fmt(totalValue, 0)}</div>
        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">ر.س · أساسي ${fmt(totalBase, 0)}</div>
      </div>
      <div class="card" style="border-top:3px solid #0E7490;padding:16px">
        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px">إجمالي المستخلصات المصروفة</div>
        <div style="font-size:18px;font-weight:800;color:#0E7490">${fmt(totalSpent, 0)}</div>
        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">ر.س · ${totalValue ? Math.round((totalSpent / totalValue) * 100) : 0}% من إجمالي القيمة</div>
      </div>
      <div class="card" style="border-top:3px solid ${expired ? "#DC2626" : "#059669"};padding:16px">
        <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px">جارية / منتهية / قاربت</div>
        <div style="font-size:20px;font-weight:800;color:var(--tx-main)">
          <span style="color:#059669">${active}</span>
          <span style="color:var(--tx-muted);font-size:13px"> / </span>
          <span style="color:#DC2626">${expired}</span>
          <span style="color:var(--tx-muted);font-size:13px"> / </span>
          <span style="color:#D97706">${expiring}</span>
        </div>
        <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">من إجمالي ${total} عقد</div>
      </div>
    </div>

    <div class="g2 mb14">
      <div class="card">
        <div class="card-title">توزيع العقود حسب المنطقة</div>
        <div class="chart-box" style="height:260px"><canvas id="ch-ac-region"></canvas></div>
      </div>
      <div class="card">
        <div class="card-title">توزيع العقود حسب النطاق</div>
        <div class="chart-box" style="height:260px"><canvas id="ch-ac-scope"></canvas></div>
      </div>
    </div>

    <div class="card mb14">
      <div class="card-title">عدد العقود حسب المقاول
        <span class="sub">أعلى ${topContractors.length} مقاول</span>
      </div>
      <div class="chart-box" style="height:${Math.max(220, topContractors.length * 28)}px"><canvas id="ch-ac-contractor"></canvas></div>
    </div>

    <div class="card mb14">
      <div class="card-title">📋 كل العقود
        <span class="sub">${total} عقد</span>
      </div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead>
            <tr style="text-align:right">
              <th>المقاول</th>
              <th>رقم العقد</th>
              <th>المشروع</th>
              <th>المنطقة</th>
              <th>النطاق</th>
              <th>الفترة</th>
              <th>المتبقي (يوم)</th>
              <th>% الإنجاز</th>
              <th>آخر مستخلص</th>
              <th>القيمة المستحقة</th>
              <th>حالة مشاهد الإنجاز</th>
              <th>المسؤل / التواصل</th>
              <th>الإجراءات والملاحظات</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map((r, i) => {
                const rem = acRemDays(r),
                  remBadge =
                    null == rem
                      ? "—"
                      : rem <= 0
                        ? `<span style="color:#DC2626;font-weight:800">${rem} (منتهي)</span>`
                        : `<span style="color:${rem <= 90 ? "#D97706" : "#059669"};font-weight:800">${rem}</span>`,
                  lastVal = num(r["القيمة"]),
                  lastMonth = r["الشهر"],
                  lastYear = r["السنة"],
                  lastInvoice =
                    null == lastVal
                      ? "—"
                      : `${fmt(lastVal, 0)} ر.س<div style="font-size:9px;color:var(--tx-muted);margin-top:2px">${esc([lastMonth, lastYear].filter(Boolean).join(" "))}</div>`,
                  dueVal = num(r["القيمة المستحقة للمستخلصات حتى تاريخه"]),
                  responsible = [r["اسم المسؤل من المقاول"], r["رقم التواصل"]].filter(Boolean).join(" · ");
                return `<tr style="border-bottom:1px solid var(--bd-light);background:${i % 2 == 0 ? "#fff" : "#fbfdfe"}">
                  <td style="padding:10px 12px;font-weight:600;line-height:1.4;max-width:160px">${esc(r["المقاول"] || "")}</td>
                  <td style="padding:10px 12px;font-family:monospace;font-size:10px;font-weight:700;color:#0891B2">${esc(r["رقم العقد"] || "—")}</td>
                  <td style="padding:10px 12px;font-weight:600;line-height:1.4;max-width:240px">${esc(r["المشروع"] || "")}</td>
                  <td style="padding:10px 8px;font-weight:600">${esc(r["المنطقة"] || "")}</td>
                  <td style="padding:10px 8px;font-size:10px">${esc(r["النطاق"] || "—")}</td>
                  <td style="padding:10px 8px;white-space:nowrap;font-family:monospace;font-size:10px">${esc(r["تاريخ بداية العقد"] || "—")} ← ${esc(r["تاريخ نهاية العقد المحدثة"] || "—")}</td>
                  <td style="padding:10px 8px">${remBadge}</td>
                  <td style="padding:10px 8px;font-weight:700">${esc(r["نسبة الإنجاز  POC%"] || r["نسبة الإنجاز POC%"] || "—")}</td>
                  <td style="padding:10px 8px;white-space:nowrap">${lastInvoice}</td>
                  <td style="padding:10px 8px;white-space:nowrap;font-weight:600;color:#7C3AED">${null == dueVal ? "—" : fmt(dueVal, 0) + " ر.س"}</td>
                  <td style="padding:10px 8px;font-size:10px">${r["حالة مشاهد الإنجاز (مكتملة / غير مكتملة)"] === "مكتملة " || r["حالة مشاهد الإنجاز (مكتملة / غير مكتملة)"] === "مكتملة"
                    ? '<span style="background:#ECFDF5;color:#059669;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;border:1px solid #05966933">مكتملة</span>'
                    : r["حالة مشاهد الإنجاز (مكتملة / غير مكتملة)"]
                    ? '<span style="background:#FEF2F2;color:#DC2626;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;border:1px solid #DC262633">غير مكتملة</span>'
                    : "—"}</td>
                  <td style="padding:10px 8px;font-size:10px;color:var(--tx-sec)">${esc(responsible || "—")}</td>
                  <td style="padding:10px 12px;font-size:10px;color:var(--tx-sec);line-height:1.5;max-width:260px">${esc(r["الإجراءات المتخذة والملاحظات"] || "—")}</td>
                  <td style="padding:10px 8px">${acStatusBadge(rem)}</td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `),
    requestAnimationFrame(() => {
      const regionLabels = regions,
        regionActive = regionLabels.map((k) => byRegion[k].active),
        regionExpired = regionLabels.map((k) => byRegion[k].expired);
      (killChart("ch-ac-region"),
        (CHARTS["ch-ac-region"] = new Chart(document.getElementById("ch-ac-region"), {
          type: "bar",
          data: {
            labels: regionLabels,
            datasets: [
              {
                label: "جارية",
                data: regionActive,
                backgroundColor: "#05966988",
                borderColor: "#059669",
                borderWidth: 1.5,
                borderRadius: 4,
              },
              {
                label: "منتهية",
                data: regionExpired,
                backgroundColor: "#DC262688",
                borderColor: "#DC2626",
                borderWidth: 1.5,
                borderRadius: 4,
              },
            ],
          },
          options: {
            maintainAspectRatio: !1,
            plugins: { legend: { position: "top", labels: { font: { size: 11 } } } },
            scales: {
              x: { ticks: { font: { size: 11 } } },
              y: { beginAtZero: !0, ticks: { stepSize: 1 } },
            },
          },
        })));

      const scopeLabels = Object.keys(byScope),
        scopeData = scopeLabels.map((k) => byScope[k]);
      (killChart("ch-ac-scope"),
        (CHARTS["ch-ac-scope"] = new Chart(document.getElementById("ch-ac-scope"), {
          type: "doughnut",
          data: {
            labels: scopeLabels,
            datasets: [
              {
                data: scopeData,
                backgroundColor: regionColors.concat(regionColors).slice(0, scopeLabels.length),
                borderWidth: 2,
                borderColor: "#fff",
              },
            ],
          },
          options: {
            maintainAspectRatio: !1,
            plugins: { legend: { position: "right", labels: { font: { size: 10 }, padding: 8 } } },
          },
        })));

      const ctrLabels = topContractors.map((c) => c[0]),
        ctrData = topContractors.map((c) => c[1]);
      (killChart("ch-ac-contractor"),
        (CHARTS["ch-ac-contractor"] = new Chart(document.getElementById("ch-ac-contractor"), {
          type: "bar",
          data: {
            labels: ctrLabels,
            datasets: [
              {
                label: "عدد العقود",
                data: ctrData,
                backgroundColor: "#0891B299",
                borderColor: "#0891B2",
                borderWidth: 1.5,
                borderRadius: 4,
              },
            ],
          },
          options: {
            indexAxis: "y",
            maintainAspectRatio: !1,
            plugins: { legend: { display: !1 } },
            scales: {
              x: { beginAtZero: !0, ticks: { stepSize: 1 } },
              y: { ticks: { font: { size: 10 } } },
            },
          },
        })));
    }));
}
((window.setMapMode = function (mode) {
  ((_mapMode = mode),
    document.querySelectorAll(".map-ctrl-btn").forEach((b) => b.classList.remove("active")));
  const btn = document.getElementById("mctrl-" + mode);
  (btn && btn.classList.add("active"), renderMap());
}),
  "undefined" != typeof Chart &&
    ((Chart.defaults.font.family = "'IBM Plex Sans Arabic','Tajawal',sans-serif"),
    (Chart.defaults.font.weight = "500"),
    (Chart.defaults.color = "#2E6478"),
    (Chart.defaults.plugins.legend.labels.usePointStyle = !0),
    (Chart.defaults.plugins.legend.labels.padding = 12),
    (Chart.defaults.plugins.tooltip.backgroundColor = "#083D4F"),
    (Chart.defaults.plugins.tooltip.titleColor = "#06B6D4"),
    (Chart.defaults.plugins.tooltip.bodyColor = "rgba(255,255,255,.88)"),
    (Chart.defaults.plugins.tooltip.borderColor = "rgba(8,145,178,.35)"),
    (Chart.defaults.plugins.tooltip.borderWidth = 1),
    (Chart.defaults.plugins.tooltip.padding = 10),
    (Chart.defaults.plugins.tooltip.cornerRadius = 8),
    (Chart.defaults.scale.grid.color = "rgba(0,0,0,.04)"),
    (Chart.defaults.elements.bar.borderSkipped = !1)));
const SYS_TIER = {
  حرج: { color: "#DC2626", bg: "#FEF2F2", border: "#DC262644" },
  متوسط: { color: "#D97706", bg: "#FFFBEB", border: "#D9770644" },
  جيد: { color: "#059669", bg: "#ECFDF5", border: "#05966944" },
  "جيد جداً": { color: "#0891B2", bg: "#ECFEFF", border: "#0891B244" },
};
function sysBadge(cat) {
  const t = SYS_TIER[cat] || { color: "#64748b", bg: "#f1f5f9", border: "#64748b44" };
  return `<span style="padding:2px 10px;border-radius:20px;font-size:10px;font-weight:700;\n    background:${t.bg};color:${t.color};border:1px solid ${t.border}">${cat || "—"}</span>`;
}
function sysScoreDot(score) {
  const s = parseFloat(score);
  if (isNaN(s)) return '<span style="color:var(--tx-muted)">—</span>';
  return `<span style="font-weight:800;color:${["", "#DC2626", "#D97706", "#D97706", "#059669", "#0891B2"][Math.round(s)] || "#64748b"}">${s.toFixed(0)}</span>`;
}
/* ╔════════════════════════════════════════════════════════════╗
   ║  ⚙️  JS تبويب: الأنظمة الرئيسية
   ║  (tab-sys-main) — الدوال الخاصة بهذا التبويب تبدأ هنا
   ╚════════════════════════════════════════════════════════════╝ */
function renderSysMain() {
  const raw = window.RAW_ALL_SYSTEMS || [],
    el = document.getElementById("sys-main-content");
  if (!el) return;
  if (!raw.length)
    return void (el.innerHTML =
      '<div class="card empty-state">\n      <div class="empty-state-icon">⚠️</div>\n      <div class="empty-state-title">لم يتم التحميل</div>\n    </div>');
  const cityF = document.getElementById("fCity")?.value || "",
    sectorF = document.getElementById("fSector")?.value || "";
  let data = raw.filter(
    (r) => (!cityF || r["المدينة الرئيسية"] === cityF) && (!sectorF || r["المحافظة"] === sectorF),
  );
  if (!data.length)
    return void (el.innerHTML = '<div class="empty-msg">لا توجد نتائج للفلاتر المحددة</div>');
  const totalSchools = new Set(data.map((r) => r["رقم المدرسة"])).size,
    schoolScores = (new Set(data.map((r) => r["رقم المدرسة"] + "|" + r["تاريخ الزيارة"])).size, {});
  data.forEach((r) => {
    r["رقم المدرسة"] &&
      null != r["الدرجة الموزونة الكلية للمبنى"] &&
      (schoolScores[r["رقم المدرسة"]] = r["الدرجة الموزونة الكلية للمبنى"]);
  });
  const scoreVals = Object.values(schoolScores).filter((v) => null != v),
    avgScore = scoreVals.length
      ? (scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length).toFixed(1)
      : "—",
    cntExcellent = scoreVals.filter((v) => v >= 70).length,
    cntLow = scoreVals.filter((v) => v < 50).length,
    tierCount = {};
  data.forEach((r) => {
    const t = r["فئة الدرجة الموزونة الكلية"];
    t && (tierCount[t] = (tierCount[t] || 0) + 1);
  });
  const sysSum = {},
    sysCnt = {};
  data.forEach((r) => {
    const s = r["القسم الرئيسي"],
      v = parseFloat(r["التقييم (1–5)"]);
    s &&
      !isNaN(v) &&
      v > 0 &&
      !HIDDEN_SYSTEMS.includes(s) &&
      ((sysSum[s] = (sysSum[s] || 0) + v), (sysCnt[s] = (sysCnt[s] || 0) + 1));
  });
  const sysAvg = Object.keys(sysSum)
      .map((k) => ({ name: k, avg: sysSum[k] / sysCnt[k] }))
      .sort((a, b) => a.avg - b.avg),
    tierRows = {};
  data.forEach((r) => {
    const sys = r["القسم الرئيسي"],
      cat = r["فئة التقييم"],
      _vt = parseFloat(r["التقييم (1–5)"]);
    sys &&
      cat &&
      _vt > 0 &&
      !HIDDEN_SYSTEMS.includes(sys) &&
      (tierRows[sys] || (tierRows[sys] = { حرج: 0, متوسط: 0, جيد: 0, "جيد جداً": 0 }),
      (tierRows[sys][cat] = (tierRows[sys][cat] || 0) + 1));
  });
  const schoolRows = {};
  data.forEach((r) => {
    const id = r["رقم المدرسة"];
    if (!id) return;
    schoolRows[id] ||
      (schoolRows[id] = {
        id: id,
        name: r["اسم المدرسة"],
        city: r["المدينة الرئيسية"],
        sector: r["المحافظة"],
        score: parseFloat(r["الدرجة الموزونة الكلية للمبنى"]),
        tier: r["فئة الدرجة الموزونة الكلية"],
        date: r["تاريخ الزيارة"],
        eng: r["اسم المهندس"],
        systems: {},
      });
    const sys = r["القسم الرئيسي"],
      v = parseFloat(r["التقييم (1–5)"]);
    sys &&
      !isNaN(v) &&
      !HIDDEN_SYSTEMS.includes(sys) &&
      (schoolRows[id].systems[sys] || (schoolRows[id].systems[sys] = { sum: 0, cnt: 0 }),
      (schoolRows[id].systems[sys].sum += v),
      (schoolRows[id].systems[sys].cnt += 1));
  });
  const mainSystems = [...new Set(data.map((r) => r["القسم الرئيسي"]).filter(Boolean))]
    .filter((s) => !HIDDEN_SYSTEMS.includes(s))
    .sort();
  ((el.innerHTML = `\n  \n  <div class="g4 mb14">\n    <div class="card" style="border-top:3px solid var(--teal)">\n      <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px">المدارس المقيّمة</div>\n      <div style="font-size:28px;font-weight:800;color:var(--teal)">${totalSchools.toLocaleString()}</div>\n      <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">مدرسة</div>\n    </div>\n        <div class="card" style="border-top:3px solid #0891B2">\n      <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px">مدارس جيد جداً (≥70%)</div>\n      <div style="font-size:28px;font-weight:800;color:#0891B2">${cntExcellent.toLocaleString()}</div>\n      <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">مدرسة</div>\n    </div>\n    <div class="card" style="border-top:3px solid #DC2626">\n      <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px">مدارس تحتاج تدخل (<50%)</div>\n      <div style="font-size:28px;font-weight:800;color:#DC2626">${cntLow.toLocaleString()}</div>\n      <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">مدرسة</div>\n    </div>\n  </div>\n\n  \n  <div class="g2 mb14">\n    <div class="card">\n      <div class="card-title">متوسط التقييم لكل نظام رئيسي (1–5)</div>\n      <div class="chart-box" style="height:280px"><canvas id="ch-sys-avg"></canvas></div>\n    </div>\n    <div class="card">\n      <div class="card-title">توزيع فئات الدرجة الكلية للمباني</div>\n      <div class="chart-box" style="height:280px"><canvas id="ch-sys-tier"></canvas></div>\n    </div>\n  </div>\n\n  \n  <div class="card mb14">\n    <div class="card-title">📊 توزيع فئات التقييم لكل نظام رئيسي</div>\n    <div style="overflow-x:auto">\n      <table style="width:100%;border-collapse:collapse;font-size:12px">\n        <thead>\n          <tr style="text-align:right">\n            <th>النظام الرئيسي</th>\n            <th style="color:#FCA5A5!important;text-align:center">حرج</th>\n            <th style="color:#FCD34D!important;text-align:center">متوسط</th>\n            <th style="color:#6EE7B7!important;text-align:center">جيد</th>\n            <th style="color:#7DD3FC!important;text-align:center">جيد جداً</th>\n            <th style="text-align:center">المجموع</th>\n          </tr>\n        </thead>\n        <tbody>\n          ${Object.entries(
    tierRows,
  )
    .filter(([k]) => "6" !== k)
    .map(([sys, cats], i) => {
      const total = Object.values(cats).reduce((a, b) => a + b, 0),
        pctCrit = total ? (((cats["حرج"] || 0) / total) * 100).toFixed(1) : "0.0",
        barW = parseFloat(pctCrit);
      return `<tr style="border-bottom:1px solid var(--bd-light);background:${i % 2 == 0 ? "#fff" : "#fbfdfe"}">\n              <td style="padding:10px 14px;font-weight:600">${esc(sys)}</td>\n              <td style="padding:10px;text-align:center;color:#DC2626;font-weight:700">${(cats["حرج"] || 0).toLocaleString()}</td>\n              <td style="padding:10px;text-align:center;color:#D97706;font-weight:700">${(cats["متوسط"] || 0).toLocaleString()}</td>\n              <td style="padding:10px;text-align:center;color:#059669;font-weight:700">${(cats["جيد"] || 0).toLocaleString()}</td>\n              <td style="padding:10px;text-align:center;color:#0891B2;font-weight:700">${(cats["جيد جداً"] || 0).toLocaleString()}</td>\n              <td style="padding:10px;text-align:center;font-weight:600">${total.toLocaleString()}</td>\n                          </tr>`;
    })
    .join(
      "",
    )}\n        </tbody>\n      </table>\n    </div>\n  </div>\n\n  \n  <div class="card">\n    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px">\n      <div class="card-title" style="margin:0;padding:0;border:0">🏫 المدارس المقيّمة مع تفاصيل الأنظمة\n        <span class="sub" id="sysm-count">${Object.keys(schoolRows).length.toLocaleString()} مدرسة</span>\n      </div>\n      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">\n        <input class="finp" id="sysm-search" type="text" placeholder="🔍 بحث بالاسم أو الرقم…"\n          style="min-width:200px" oninput="filterSysMainTable()">\n        <button type="button" class="export-btn export-btn-csv" onclick="exportSysMainCSV()">⬇ CSV</button>\n        <button type="button" class="export-btn export-btn-excel" onclick="exportSysMainExcel()">⬇ Excel</button>\n      </div>\n    </div>\n\n    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px">\n      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">\n        <span style="font-size:11px;color:var(--tx-muted);font-weight:700">عدد المدارس الظاهرة:</span>\n        <select id="sysm-limit"\n          onchange="window._sysMainState.showN=parseInt(this.value)||30;filterSysMainTable()"\n          style="font-family:inherit;font-size:11px;padding:6px 12px;border:1px solid var(--bd-light);border-radius:10px;background:var(--bg-2);cursor:pointer">\n          ${[
    10,
    20,
    30,
    50,
    100,
    Object.keys(schoolRows).length,
  ]
    .filter((n, i, a) => n <= Object.keys(schoolRows).length && a.indexOf(n) === i)
    .map(
      (n) =>
        `<option value="${n}" ${(window._sysMainState?.showN || 30) === n ? "selected" : ""}>${n === Object.keys(schoolRows).length ? "الكل (" + n + ")" : n + " مدرسة"}</option>`,
    )
    .join(
      "",
    )}\n        </select>\n        <span id="sysm-visible-count" style="font-size:11px;color:var(--tx-muted);font-weight:700"></span>\n      </div>\n      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-size:11px;color:var(--tx-muted);font-weight:700">ترتيب:</span>
        <select id="sysm-sort"
          onchange="window._sysMainState.sortBy=this.value;filterSysMainTable()"
          style="font-family:inherit;font-size:11px;padding:6px 12px;border:1px solid var(--bd-light);border-radius:10px;background:var(--bg-2);cursor:pointer">
          <option value="score_desc" ${(window._sysMainState?.sortBy || "score_desc") === "score_desc" ? "selected" : ""}>الأعلى درجة أولاً</option>
          <option value="score_asc"  ${window._sysMainState?.sortBy === "score_asc" ? "selected" : ""}>الأقل درجة أولاً</option>
        </select>
      </div>\n    </div>\n\n    <div style="overflow-x:auto">\n      <table style="width:100%;border-collapse:collapse;font-size:11px" id="sysm-table">\n        <thead>\n          <tr style="text-align:right">\n            <th style="white-space:nowrap">اسم المدرسة</th>\n            <th style="white-space:nowrap">المدينة</th>\n            <th style="white-space:nowrap">الدرجة الكلية</th>\n            <th style="white-space:nowrap">الفئة</th>\n            ${mainSystems
        .filter((s) => "6" !== s)
        .map(
          (s) =>
            `<th style="white-space:nowrap">${esc(s)}</th>`,
        )
        .join(
          "",
        )}\n            <th style="white-space:nowrap">المهندس</th>\n          </tr>\n        </thead>\n        <tbody id="sysm-tbody">\n        </tbody>\n      </table>\n    </div>\n  </div>\n  `),
    requestAnimationFrame(() => {
      const avgLabels = sysAvg.filter((s) => "6" !== s.name).map((s) => s.name),
        avgVals = sysAvg.filter((s) => "6" !== s.name).map((s) => +s.avg.toFixed(2)),
        barColors = avgVals.map((v) =>
          v >= 4 ? "#0891B2" : v >= 3 ? "#059669" : v >= 2 ? "#D97706" : "#DC2626",
        );
      (killChart("ch-sys-avg"),
        (CHARTS["ch-sys-avg"] = new Chart(document.getElementById("ch-sys-avg"), {
          type: "bar",
          data: {
            labels: avgLabels,
            datasets: [
              {
                label: "متوسط التقييم",
                data: avgVals,
                backgroundColor: barColors,
                borderColor: barColors,
                borderWidth: 1.5,
                borderRadius: 5,
              },
            ],
          },
          options: {
            indexAxis: "y",
            maintainAspectRatio: !1,
            plugins: { legend: { display: !1 } },
            scales: {
              x: {
                min: 0,
                max: 5,
                ticks: { stepSize: 1, font: { size: 10 } },
                title: { display: !0, text: "التقييم (1–5)", font: { size: 10 } },
              },
              y: { ticks: { font: { size: 10 } } },
            },
          },
        })));
      const tierLabels = Object.keys(tierCount).filter((k) => k),
        tierVals = tierLabels.map((k) => tierCount[k]),
        tierColors = tierLabels.map((k) => SYS_TIER[k]?.color || "#64748b");
      (killChart("ch-sys-tier"),
        (CHARTS["ch-sys-tier"] = new Chart(document.getElementById("ch-sys-tier"), {
          type: "doughnut",
          data: {
            labels: tierLabels,
            datasets: [
              {
                data: tierVals,
                backgroundColor: tierColors.map((c) => c + "99"),
                borderColor: tierColors,
                borderWidth: 2,
              },
            ],
          },
          options: {
            maintainAspectRatio: !1,
            plugins: {
              legend: { position: "bottom", labels: { font: { size: 11 }, padding: 14 } },
            },
          },
        })));
    }),
    (window._sysMainData = schoolRows),
    (window._sysMainSystems = mainSystems.filter((s) => "6" !== s)),
    window._sysMainState || (window._sysMainState = { showN: 30, sortBy: "score_desc" }),
    (window._sysMainRows = Object.values(schoolRows).sort(
      (a, b) =>
        (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0) ||
        String(a.name || "").localeCompare(String(b.name || ""), "ar"),
    )),
    (window._sysMainExport = { rows: window._sysMainRows, systems: window._sysMainSystems }),
    filterSysMainTable());
}
function fillSysMainTable(rows) {
  const tbody = document.getElementById("sysm-tbody"),
    systems = window._sysMainSystems || [];
  tbody &&
    (tbody.innerHTML = rows
      .map((r, i) => {
        const scoreNum = parseFloat(r.score),
          scoreClr = isNaN(scoreNum)
            ? "#64748b"
            : scoreNum >= 70
              ? "#0891B2"
              : scoreNum >= 50
                ? "#059669"
                : scoreNum >= 35
                  ? "#D97706"
                  : "#DC2626",
          sysAvgCells = systems
            .map((s) => {
              const sg = r.systems[s];
              if (!sg)
                return '<td style="padding:8px 6px;text-align:center;color:var(--tx-muted)">—</td>';
              const av = sg.sum / sg.cnt;
              return `<td style="padding:8px 6px;text-align:center;font-weight:700;color:${av >= 4 ? "#0891B2" : av >= 3 ? "#059669" : av >= 2 ? "#D97706" : "#DC2626"}">${av.toFixed(1)}</td>`;
            })
            .join(""),
          dateStr = r.date
            ? r.date instanceof Date
              ? r.date.toLocaleDateString("en" === LANG ? "en-US" : "ar-SA")
              : String(r.date).slice(0, 10)
            : "—";
        return `<tr style="border-bottom:1px solid var(--bd-light);background:${i % 2 == 0 ? "#fff" : "#fbfdfe"}">\n      <td style="padding:9px 12px;font-weight:600">${esc(r.name || "")}${r.id || r.minId ? `<span style="font-size:9px;color:var(--tx-muted);margin-right:5px;font-weight:500">(${esc(r.id || r.minId || "")})</span>` : ""}${!r.id && !r.minId ? "" : ""}</td>\n      <td style="padding:9px 8px;white-space:nowrap">${esc(r.city || "")}</td>\n      <td style="padding:9px 8px;font-weight:800;color:${scoreClr};white-space:nowrap">${isNaN(scoreNum) ? "—" : scoreNum.toFixed(1) + "%"}</td>\n      <td style="padding:9px 8px">${sysBadge(r.tier)}</td>\n      ${sysAvgCells}\n      <td style="padding:9px 8px;white-space:nowrap;font-size:10px">${esc(r.eng || "")}</td>\n    </tr>`;
      })
      .join(""));
}
/* ╔════════════════════════════════════════════════════════════╗
   ║  🔩  JS تبويب: الأنظمة التفصيلية
   ║  (tab-sys-detail) — الدوال الخاصة بهذا التبويب تبدأ هنا
   ╚════════════════════════════════════════════════════════════╝ */
function renderSysDetail() {
  const raw = window.RAW_ALL_SYSTEMS || [],
    el = document.getElementById("sys-detail-content");
  if (!el) return;
  if (!raw.length)
    return void (el.innerHTML =
      '<div class="card empty-state">\n      <div class="empty-state-icon">⚠️</div>\n      <div class="empty-state-title">لا توجد بيانات</div>\n    </div>');
  const cityF = document.getElementById("fCity")?.value || "",
    sectorF = document.getElementById("fSector")?.value || "";
  let base = raw.filter(
    (r) => (!cityF || r["المدينة الرئيسية"] === cityF) && (!sectorF || r["المحافظة"] === sectorF),
  );
  const allMainSys = [
    ...new Set(
      base
        .map((r) => r["القسم الرئيسي"])
        .filter((s) => s && "6" !== s && !HIDDEN_SYSTEMS.includes(s)),
    ),
  ].sort();
  window._sdActiveSection || (window._sdActiveSection = "");
  const selMain = window._sdActiveSection;
  let data = selMain ? base.filter((r) => r["القسم الرئيسي"] === selMain) : base;
  const subSum = {},
    subCnt = {},
    subMainMap = {};
  data.forEach((r) => {
    const s = r["النظام الفرعي"],
      m = r["القسم الرئيسي"],
      v = parseFloat(r["التقييم (1–5)"]);
    s &&
      !isNaN(v) &&
      v > 0 &&
      "6" !== s &&
      !HIDDEN_SYSTEMS.includes(s) &&
      ((subSum[s] = (subSum[s] || 0) + v), (subCnt[s] = (subCnt[s] || 0) + 1), (subMainMap[s] = m));
  });
  const subAvg = Object.keys(subSum)
      .map((k) => ({ name: k, avg: subSum[k] / subCnt[k], main: subMainMap[k], cnt: subCnt[k] }))
      .sort((a, b) => a.avg - b.avg),
    subTiers = {};
  data.forEach((r) => {
    const s = r["النظام الفرعي"],
      cat = r["فئة التقييم"],
      _vs = parseFloat(r["التقييم (1–5)"]);
    s &&
      cat &&
      "6" !== s &&
      _vs > 0 &&
      !HIDDEN_SYSTEMS.includes(s) &&
      (subTiers[s] || (subTiers[s] = { حرج: 0, متوسط: 0, جيد: 0, "جيد جداً": 0 }),
      (subTiers[s][cat] = (subTiers[s][cat] || 0) + 1));
  });
  const schoolMap = {};
  (data.forEach((r) => {
    const id = r["رقم المدرسة"],
      sub = r["النظام الفرعي"],
      v = parseFloat(r["التقييم (1–5)"]);
    id &&
      sub &&
      !isNaN(v) &&
      v > 0 &&
      "6" !== sub &&
      !HIDDEN_SYSTEMS.includes(sub) &&
      (schoolMap[id] ||
        (schoolMap[id] = {
          id: id,
          name: r["اسم المدرسة"],
          score: parseFloat(r["الدرجة الموزونة الكلية للمبنى"]) || 0,
          city: r["المدينة الرئيسية"],
          systems: {},
        }),
      schoolMap[id].systems[sub] || (schoolMap[id].systems[sub] = { sum: 0, cnt: 0 }),
      (schoolMap[id].systems[sub].sum += v),
      schoolMap[id].systems[sub].cnt++);
  }),
    window._hmSdState || (window._hmSdState = { showN: 30, sortBy: "score" }));
  const hmSt = window._hmSdState;
  let hmSchools = Object.values(schoolMap);
  "score" === hmSt.sortBy
    ? hmSchools.sort((a, b) => a.score - b.score)
    : "score_desc" === hmSt.sortBy
      ? hmSchools.sort((a, b) => b.score - a.score)
      : hmSchools.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"));
  window._hmSdExport = {
    rows: hmSchools.map((r) => ({
      main: selMain || "",
      id: r.id,
      name: r.name,
      score: r.score,
      systems: r.systems,
    })),
    subCols: subAvg.map((s) => s.name),
    selMain: selMain,
  };
  const showN = Math.min(parseInt(hmSt.showN) || 30, hmSchools.length),
    showSch = hmSchools.slice(0, showN),
    subCols = subAvg.map((s) => s.name),
    thCells = subCols
      .map((sys) => {
        const avgV = subSum[sys] / subCnt[sys],
          lbl = sys.length > 14 ? sys.slice(0, 13) + "…" : sys;
        return `<th title="${esc(sys)} — متوسط: ${avgV.toFixed(2)}" style="white-space:nowrap;text-align:center">${esc(lbl)}</th>`;
      })
      .join(""),
    bodyRows = showSch
      .map((s) => {
        const sc = s.score || 0,
          scoreClr = sc >= 70 ? "#0891B2" : sc >= 50 ? "#059669" : sc >= 35 ? "#D97706" : "#DC2626",
          cells = subCols
            .map((sys) => {
              const sg = s.systems[sys];
              if (!sg) return '<td style="text-align:center;color:var(--tx-muted)">—</td>';
              const v = sg.sum / sg.cnt;
              return `<td style="text-align:center;font-weight:700;color:${v >= 4 ? "#0891B2" : v >= 3 ? "#059669" : v >= 2 ? "#D97706" : "#DC2626"}">${v.toFixed(1)}</td>`;
            })
            .join("");
        return `<tr>\n      <td style="white-space:nowrap">${esc(s.id || "—")}</td>\n      <td style="white-space:normal;word-break:break-word">${esc(s.name || "")}</td>\n      <td style="text-align:center;font-weight:800;color:${scoreClr};white-space:nowrap">${sc > 0 ? sc.toFixed(1) + "%" : "—"}</td>\n      ${cells}\n    </tr>`;
      })
      .join("");
  const sectionChips = `\n    <div style="display:flex;flex-wrap:wrap;gap:7px;align-items:center;margin-bottom:10px">\n      <span style="font-size:11px;color:var(--tx-muted);font-weight:700;white-space:nowrap">تصفية سريعة:</span>\n      <button onclick="window._sdActiveSection='';renderSysDetail()"\n        style="font-family:inherit;font-size:11px;font-weight:700;padding:5px 14px;border-radius:20px;cursor:pointer;transition:.15s;\n          border:1.5px solid ${selMain ? "var(--bd-mid)" : "var(--teal)"};\n          background:${selMain ? "transparent" : "var(--teal)"};\n          color:${selMain ? "var(--tx-muted)" : "#fff"}">الكل</button>\n      ${allMainSys.map((sec) => `\n        <button onclick="window._sdActiveSection='${sec.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}';renderSysDetail()"\n          style="font-family:inherit;font-size:11px;font-weight:600;padding:5px 14px;border-radius:20px;cursor:pointer;transition:.15s;\n            border:1.5px solid ${selMain === sec ? "var(--teal)" : "var(--bd-mid)"};\n            background:${selMain === sec ? "var(--teal)" : "transparent"};\n            color:${selMain === sec ? "#fff" : "var(--tx-muted)"}">${esc(sec)}</button>\n      `).join("")}\n    </div>`,
    nOptsHtml = [
      ...new Set([10, 20, 30, 50, hmSchools.length].filter((n) => n <= hmSchools.length)),
    ]
      .map(
        (n) =>
          `<option value="${n}" ${n === showN ? "selected" : ""}>${n === hmSchools.length ? "الكل (" + n + ")" : n + " مدرسة"}</option>`,
      )
      .join("");
  ((el.innerHTML = `\n  \n  <div class="card mb14" style="padding:14px 18px">\n    <div style="font-size:12px;font-weight:800;color:var(--tx-sec);margin-bottom:10px">تصفية حسب القسم الرئيسي</div>\n    ${sectionChips}\n    <div style="font-size:11px;color:var(--tx-muted);margin-top:4px">\n      ${subAvg.length} نظام فرعي\n      &nbsp;·&nbsp; ${hmSchools.length} مدرسة\n      &nbsp;·&nbsp; ${data.filter((r) => "6" !== r["النظام الفرعي"]).length.toLocaleString()} تقييم\n      ${selMain ? `&nbsp;<span style="background:rgba(8,145,178,.1);color:var(--teal);padding:2px 10px;border-radius:20px;font-weight:700">📌 ${esc(selMain)}</span>` : ""}\n    </div>\n  </div>\n\n  \n  <div class="g2 mb14">\n    <div class="card">\n      <div class="card-title">متوسط التقييم للأنظمة الفرعية (من الأسوأ للأفضل)</div>\n      <div class="chart-box" style="height:${Math.min(600, Math.max(280, 26 * subAvg.length))}px"><canvas id="ch-syd-avg"></canvas></div>\n    </div>\n    <div class="card">\n      <div class="card-title">نسبة التقييمات الحرجة لكل نظام فرعي</div>\n      <div class="chart-box" style="height:${Math.min(600, Math.max(280, 26 * subAvg.length))}px"><canvas id="ch-syd-crit"></canvas></div>\n    </div>\n  </div>\n\n  \n  <div class="card mb14">\n    <div class="card-title">📋 تفاصيل التقييم لكل نظام فرعي</div>\n    <div style="overflow-x:auto;max-height:480px">\n      <table style="width:100%;border-collapse:collapse;font-size:11px">\n        <thead style="position:sticky;top:0;z-index:2">\n          <tr style="text-align:right">\n            <th>القسم الرئيسي</th>\n            <th>النظام الفرعي</th>\n            <th style="text-align:center">متوسط</th>\n            <th style="color:#FCA5A5!important;text-align:center">حرج</th>\n            <th style="color:#FCD34D!important;text-align:center">متوسط</th>\n            <th style="color:#6EE7B7!important;text-align:center">جيد</th>\n            <th style="color:#7DD3FC!important;text-align:center">جيد جداً</th>\n          </tr>\n        </thead>\n        <tbody>\n          ${subAvg
    .map((row, i) => {
      const cats = subTiers[row.name] || {},
        total = row.cnt,
        pctCrit = total ? (((cats["حرج"] || 0) / total) * 100).toFixed(1) : "0.0",
        avgClr =
          row.avg >= 4
            ? "#0891B2"
            : row.avg >= 3
              ? "#059669"
              : row.avg >= 2
                ? "#D97706"
                : "#DC2626",
        riskW = parseFloat(pctCrit);
      return `<tr style="border-bottom:1px solid var(--bd-light);background:${i % 2 == 0 ? "#fff" : "var(--bg-2)"}">\n              <td style="padding:9px 14px;font-size:10px;color:var(--tx-muted)">${esc(row.main || "")}</td>\n              <td style="padding:9px 14px;font-weight:600">${esc(row.name)}</td>\n              <td style="padding:9px 8px;text-align:center">\n                <span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:800;color:${avgClr};background:${avgClr}18">${row.avg.toFixed(2)}</span>\n              </td>\n              <td style="padding:9px 8px;text-align:center;color:#DC2626;font-weight:700">${(cats["حرج"] || 0).toLocaleString()}</td>\n              <td style="padding:9px 8px;text-align:center;color:#D97706;font-weight:700">${(cats["متوسط"] || 0).toLocaleString()}</td>\n              <td style="padding:9px 8px;text-align:center;color:#059669;font-weight:700">${(cats["جيد"] || 0).toLocaleString()}</td>\n              <td style="padding:9px 8px;text-align:center;color:#0891B2;font-weight:700">${(cats["جيد جداً"] || 0).toLocaleString()}</td>\n              \n            </tr>`;
    })
    .join(
      "",
    )}\n        </tbody>\n      </table>\n    </div>\n  </div>\n\n  \n  <div class="card">\n    <div class="card-title">\n      🏫 المدارس المقيّمة حسب النظام الفرعي\n      ${selMain ? `<span style="background:rgba(8,145,178,.1);color:var(--teal);border:1px solid rgba(8,145,178,.2);border-radius:20px;padding:3px 12px;font-size:10px;font-weight:700;margin-right:8px">📌 ${esc(selMain)}</span>` : ""}\n      <span class="sub">${subCols.length} نظام · ${hmSchools.length} مدرسة</span>\n    </div>\n\n    \n    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:14px">\n      <div style="display:flex;align-items:center;gap:6px">\n        <span style="font-size:11px;color:var(--tx-muted);font-weight:700">عدد المدارس:</span>\n        <select onchange="window._hmSdState.showN=parseInt(this.value);renderSysDetail()"\n          style="font-family:inherit;font-size:11px;padding:6px 12px;border:1px solid var(--bd-light);border-radius:10px;background:var(--bg-2);cursor:pointer">\n          ${nOptsHtml}\n        </select>\n      </div>\n      <div style="display:flex;align-items:center;gap:6px">\n        <span style="font-size:11px;color:var(--tx-muted);font-weight:700">ترتيب:</span>\n        <select onchange="window._hmSdState.sortBy=this.value;renderSysDetail()"\n          style="font-family:inherit;font-size:11px;padding:6px 12px;border:1px solid var(--bd-light);border-radius:10px;background:var(--bg-2);cursor:pointer">\n          <option value="score"      ${"score" === hmSt.sortBy ? "selected" : ""}>الأقل درجة أولاً</option>\n          <option value="score_desc" ${"score_desc" === hmSt.sortBy ? "selected" : ""}>الأعلى درجة أولاً</option>\n          <option value="name"       ${"name" === hmSt.sortBy ? "selected" : ""}>أبجدي</option>\n        </select>\n      </div>\n      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">\n        <button class="export-btn export-btn-csv" onclick="exportSysDetailCSV()">⬇ CSV</button>\n        <button class="export-btn export-btn-excel" onclick="exportSysDetailExcel()">⬇ Excel</button>\n      </div>\n    </div>\n\n    \n    <div class="tbl-wrap" style="max-height:680px">\n      <table>\n        <thead>\n          <tr>\n            <th style="white-space:nowrap">رقم المدرسة</th>\n            <th style="text-align:right">اسم المدرسة</th>\n            <th style="text-align:center;white-space:nowrap">الدرجة</th>\n            ${thCells}\n          </tr>\n        </thead>\n        <tbody>${bodyRows}</tbody>\n      </table>\n    </div>\n  </div>\n  `),
    requestAnimationFrame(() => {
      const subLabels = subAvg.map((s) =>
          s.name.length > 22 ? s.name.slice(0, 22) + "…" : s.name,
        ),
        subVals = subAvg.map((s) => +s.avg.toFixed(2)),
        subColors = subVals.map((v) =>
          v >= 4 ? "#0891B299" : v >= 3 ? "#05966999" : v >= 2 ? "#D9770699" : "#DC262699",
        );
      (killChart("ch-syd-avg"),
        (CHARTS["ch-syd-avg"] = new Chart(document.getElementById("ch-syd-avg"), {
          type: "bar",
          data: {
            labels: subLabels,
            datasets: [
              {
                label: "متوسط التقييم",
                data: subVals,
                backgroundColor: subColors,
                borderColor: subColors.map((c) => c.slice(0, 7)),
                borderWidth: 1.5,
                borderRadius: 4,
              },
            ],
          },
          options: {
            indexAxis: "y",
            maintainAspectRatio: !1,
            plugins: { legend: { display: !1 } },
            scales: {
              x: {
                min: 0,
                max: 5,
                ticks: { stepSize: 1, font: { size: 9 } },
                title: {
                  display: !0,
                  text: "التقييم (1–5)",
                  color: "#6B8795",
                  font: { size: 10, weight: "700" },
                },
              },
              y: {
                ticks: { font: { size: 9 } },
                title: {
                  display: !0,
                  text: "النظام الفرعي",
                  color: "#6B8795",
                  font: { size: 10, weight: "700" },
                },
              },
            },
          },
        })));
      const critVals = subAvg.map((s) => {
          const cats = subTiers[s.name] || {};
          return s.cnt ? +(((cats["حرج"] || 0) / s.cnt) * 100).toFixed(1) : 0;
        }),
        critColors = critVals.map((v) =>
          v >= 40 ? "#DC262699" : v >= 20 ? "#D9770699" : "#05966999",
        );
      (killChart("ch-syd-crit"),
        (CHARTS["ch-syd-crit"] = new Chart(document.getElementById("ch-syd-crit"), {
          type: "bar",
          data: {
            labels: subLabels,
            datasets: [
              {
                label: "نسبة الحرج %",
                data: critVals,
                backgroundColor: critColors,
                borderColor: critColors.map((c) => c.slice(0, 7)),
                borderWidth: 1.5,
                borderRadius: 4,
              },
            ],
          },
          options: {
            indexAxis: "y",
            maintainAspectRatio: !1,
            plugins: { legend: { display: !1 } },
            scales: {
              x: {
                min: 0,
                max: 100,
                ticks: { callback: (v) => v + "%", font: { size: 9 } },
                title: {
                  display: !0,
                  text: "نسبة الحرج (%)",
                  color: "#6B8795",
                  font: { size: 10, weight: "700" },
                },
              },
              y: {
                ticks: { font: { size: 9 } },
                title: {
                  display: !0,
                  text: "النظام الفرعي",
                  color: "#6B8795",
                  font: { size: 10, weight: "700" },
                },
              },
            },
          },
        })));
    }));
}
function getExportData() {
  const D = [...FILTERED],
    sort = document.getElementById("tbl-sort")?.value || "fca_asc",
    searchVal = (document.getElementById("tbl-search")?.value || "").trim().toLowerCase(),
    sorters = {
      fca_asc: (a, b) => (a.fca ?? 999) - (b.fca ?? 999),
      fca_desc: (a, b) => (b.fca ?? -1) - (a.fca ?? -1),
      env_asc: (a, b) => (a.envScore ?? 999) - (b.envScore ?? 999),
      env_desc: (a, b) => (b.envScore ?? -1) - (a.envScore ?? -1),
      ayen_asc: (a, b) => (a.ayenScore ?? 999) - (b.ayenScore ?? 999),
      ayen_desc: (a, b) => (b.ayenScore ?? -1) - (a.ayenScore ?? -1),
      students_desc: (a, b) => (b.students ?? -1) - (a.students ?? -1),
      age_desc: (a, b) => (b.buildingAge ?? -1) - (a.buildingAge ?? -1),
      name: (a, b) => a.name.localeCompare(b.name, "ar"),
    };
  return [
    ...(searchVal
      ? D.filter(
          (r) =>
            r.name.toLowerCase().includes(searchVal) ||
            String(r.minId || "")
              .toLowerCase()
              .includes(searchVal),
        )
      : D),
  ].sort(sorters[sort] || sorters.fca_asc);
}
((window.filterSysMainTable = function () {
  const q = (document.getElementById("sysm-search")?.value || "").toLowerCase().trim(),
    all = window._sysMainRows || Object.values(window._sysMainData || {}),
    filtered = q
      ? all.filter(
          (r) =>
            String(r.name || "")
              .toLowerCase()
              .includes(q) ||
            String(r.city || "")
              .toLowerCase()
              .includes(q) ||
            String(r.eng || "")
              .toLowerCase()
              .includes(q),
        )
      : all,
    st = window._sysMainState || (window._sysMainState = { showN: 30, sortBy: "score_desc" });
  const sortBy = st.sortBy || "score_desc";
  const sorted = [...filtered].sort((a, b) =>
    "score_asc" === sortBy
      ? (parseFloat(a.score) || 0) - (parseFloat(b.score) || 0) ||
        String(a.name || "").localeCompare(String(b.name || ""), "ar")
      : (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0) ||
        String(a.name || "").localeCompare(String(b.name || ""), "ar"),
  );
  const showN = Math.min(parseInt(st.showN) || sorted.length, sorted.length),
    visible = sorted.slice(0, showN);
  fillSysMainTable(visible);
  const countEl = document.getElementById("sysm-visible-count");
  countEl &&
    (countEl.textContent = `عرض ${visible.length.toLocaleString()} من ${sorted.length.toLocaleString()} مدرسة`);
  const totalEl = document.getElementById("sysm-count");
  totalEl && (totalEl.textContent = `${all.length.toLocaleString()} مدرسة`);
  const limitSel = document.getElementById("sysm-limit");
  if (limitSel) {
    const desired = String(st.showN || 30);
    limitSel.value !== desired && (limitSel.value = desired);
  }
  const sortSel = document.getElementById("sysm-sort");
  if (sortSel) {
    sortSel.value !== sortBy && (sortSel.value = sortBy);
  }
}),
  (window.exportTableCSV = function () {
    const rows = getExportData(),
      csvRows = [
        ("en" === LANG
          ? [
              "School Name",
              "Main Region",
              "Governorate",
              "Min. ID",
              "Gender",
              "Stage",
              "Ownership",
              "District",
              "Classrooms",
              "Size",
              "FCA%",
              "Env%",
              "Ayen Score%",
              "Students",
              "Building Age",
              "Part Description",
              "Qty (Parts)",
              "Unit Price (Parts)",
            ]
          : [
              "اسم المدرسة",
              "المنطقة الرئيسية",
              "المحافظة",
              "الرقم الوزاري",
              "الجنس",
              "المرحلة",
              "الملكية",
              "الحي",
              "الفصول",
              "الحجم",
              "FCA%",
              "البيئة%",
              "تقييم عاين%",
              "عدد الطلاب",
              "عمر المبنى",
              "وصف الصنف (قطع غيار)",
              "الكمية (قطع غيار)",
              "سعر الوحدة (قطع غيار)",
            ]
        )
          .map((h) => `"${h}"`)
          .join(","),
      ];
    rows.forEach((r) => {
      const vals = [
        r.name,
        r.city,
        r.sector,
        r.minId,
        r.gender,
        r.stage,
        r.ownership,
        r.district,
        r.classrooms ?? "",
        r.schoolSize,
        null != r.fca ? r.fca.toFixed(1) : "",
        null != r.envScore ? r.envScore.toFixed(1) : "",
        null != r.ayenScore ? r.ayenScore.toFixed(1) : "",
        r.students ?? "",
        r.buildingAge ?? "",
        r.description,
        r.quantity ?? "",
        null != r.unitValue ? r.unitValue.toFixed(2) : "",
      ].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`);
      csvRows.push(vals.join(","));
    });
    const blob = new Blob(["\ufeff" + csvRows.join("\r\n")], { type: "text/csv;charset=utf-8;" }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    ((a.href = url),
      (a.download = "schools_data_" + new Date().toISOString().slice(0, 10) + ".csv"),
      a.click(),
      URL.revokeObjectURL(url));
  }),
  (window.exportTableExcel = function () {
    const rows = getExportData(),
      isEn = "en" === LANG;
    const headers = isEn
      ? [
          "School Name",
          "Main Region",
          "Governorate",
          "Min. ID",
          "Gender",
          "Stage",
          "Ownership",
          "District",
          "Classrooms",
          "Size",
          "FCA%",
          "Env%",
          "Ayen Score%",
          "Students",
          "Building Age",
          "Part Description",
          "Qty (Parts)",
          "Unit Price (Parts)",
        ]
      : [
          "اسم المدرسة",
          "المنطقة الرئيسية",
          "المحافظة",
          "الرقم الوزاري",
          "الجنس",
          "المرحلة",
          "الملكية",
          "الحي",
          "الفصول",
          "الحجم",
          "FCA%",
          "البيئة%",
          "تقييم عاين%",
          "عدد الطلاب",
          "عمر المبنى",
          "وصف الصنف (قطع غيار)",
          "الكمية (قطع غيار)",
          "سعر الوحدة (قطع غيار)",
        ];
    const dataArr = [headers];
    rows.forEach((r) => {
      dataArr.push([
        r.name ?? "",
        r.city ?? "",
        r.sector ?? "",
        r.minId ?? "",
        r.gender ?? "",
        r.stage ?? "",
        r.ownership ?? "",
        r.district ?? "",
        r.classrooms ?? "",
        r.schoolSize ?? "",
        null != r.fca ? +r.fca.toFixed(1) : "",
        null != r.envScore ? +r.envScore.toFixed(1) : "",
        null != r.ayenScore ? +r.ayenScore.toFixed(1) : "",
        r.students ?? "",
        r.buildingAge ?? "",
        r.description ?? "",
        r.quantity ?? "",
        null != r.unitValue ? +r.unitValue.toFixed(2) : "",
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(dataArr);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isEn ? "Schools Data" : "بيانات المدارس");
    XLSX.writeFile(wb, "schools_data_" + new Date().toISOString().slice(0, 10) + ".xlsx");
  })); //_REPLACED_exportTableExcel_
function _sysExportSafeName(name) {
  return String(name || "")
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, "_")
    .replace(/^_+|_+$/g, "");
}
function _sysCsvCell(v) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}
function _sysDownloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 150);
}
function _sysExcelTableHTML(title, headers, rows) {
  const escHtml = (v) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table border="1"><tr>${headers.map((h) => `<th>${escHtml(h)}</th>`).join("")}</tr>${rows.map((row) => `<tr>${row.map((v) => `<td>${escHtml(v)}</td>`).join("")}</tr>`).join("")}</table></body></html>`;
}


/* ╔════════════════════════════════════════════════════════════╗
   ║  📢  JS تبويب البلاغات — ملف CSV مستقل
   ║  يعتمد على: window.RAW_BALAGH
   ╚════════════════════════════════════════════════════════════╝ */
(function () {
  const STATE = (window.__BALAGH_STATE__ = window.__BALAGH_STATE__ || {
    page: 0,
    size: 25,
    search: "",
    status: "",
    category: "",
    priority: "",
    location: "",
    dateFrom: "",
    dateTo: "",
    sort: "date_desc",
    topSchoolN: 10,
  });

  const STATUS_ORDER = {
    "In Progress": 1,
    "Consultant Approval In Progress": 2,
    Open: 3,
    Closed: 4,
    Cancelled: 5,
  };

  function getRaw() {
    return Array.isArray(window.RAW_BALAGH) ? window.RAW_BALAGH : [];
  }

  function norm(v) {
    return String(v ?? "")
      .replace(/\uFEFF/g, "")
      .trim();
  }

  function toLower(v) {
    return norm(v).toLowerCase();
  }

  const BALAGH_STATUS_LABELS = {
    Open: "مفتوح",
    New: "جديد",
    Assigned: "تم التعيين",
    "In Progress": "قيد التنفيذ",
    "Consultant Approval In Progress": "موافقة الاستشاري قيد التنفيذ",
    Closed: "مغلق",
    Resolved: "تم حله",
    Cancelled: "ملغى",
    "تم التعيين": "تم التعيين",
    "تم حله": "تم حله",
    جديد: "جديد",
    "قيد التنفيذ": "قيد التنفيذ",
    "موافقة الاستشاري قيد التنفيذ": "موافقة الاستشاري قيد التنفيذ",
    ملغى: "ملغى",
    ملغي: "ملغى",
    مغلق: "مغلق",
    مفتوح: "مفتوح",
  };

  // الحالات التي تعني أن البلاغ "مغلق" (انتهى العمل عليه: تم حله أو ألغي)
  const BALAGH_CLOSED_STATUSES = new Set([
    "تم حله",
    "ملغى",
    "ملغي",
    "مغلق",
    "closed",
    "cancelled",
    "resolved",
  ]);

  // الحالات التي تُحسب ضمن "قيد التنفيذ" (بما فيها انتظار موافقة الاستشاري)
  const BALAGH_INPROGRESS_STATUSES = new Set([
    "قيد التنفيذ",
    "موافقة الاستشاري قيد التنفيذ",
    "in progress",
    "consultant approval in progress",
  ]);

  function balaghIsClosed(status) {
    return BALAGH_CLOSED_STATUSES.has(
      String(status ?? "")
        .trim()
        .toLowerCase(),
    );
  }

  function balaghIsInProgress(status) {
    return BALAGH_INPROGRESS_STATUSES.has(
      String(status ?? "")
        .trim()
        .toLowerCase(),
    );
  }

  // ترتيب الأولويات من الأعلى للأقل (يدعم القيم العربية والإنجليزية)
  const BALAGH_PRIORITY_RANK = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
    حرج: 4,
    مرتفع: 3,
    متوسط: 2,
    منخفض: 1,
  };

  // ترتيب السجلات حسب الخيار المختار
  function sortBalaghRows(list, sortKey) {
    const arr = [...list];
    const time = (d) => (d instanceof Date && !isNaN(d.getTime()) ? d.getTime() : null);
    switch (sortKey) {
      case "date_asc":
        arr.sort(
          (a, b) => (time(a.creationDateObj) ?? Infinity) - (time(b.creationDateObj) ?? Infinity),
        );
        break;
      case "priority_desc":
        arr.sort(
          (a, b) =>
            (BALAGH_PRIORITY_RANK[b.priority] || 0) - (BALAGH_PRIORITY_RANK[a.priority] || 0),
        );
        break;
      case "sla_asc":
        arr.sort(
          (a, b) =>
            (Number.isFinite(a.slaNum) ? a.slaNum : Infinity) -
            (Number.isFinite(b.slaNum) ? b.slaNum : Infinity),
        );
        break;
      case "school":
        arr.sort((a, b) => (a.schoolName || "").localeCompare(b.schoolName || "", "ar"));
        break;
      case "date_desc":
      default:
        arr.sort(
          (a, b) => (time(b.creationDateObj) ?? -Infinity) - (time(a.creationDateObj) ?? -Infinity),
        );
        break;
    }
    return arr;
  }

  const BALAGH_PRIORITY_LABELS = {
    Low: "منخفض",
    Medium: "متوسط",
    High: "مرتفع",
    Critical: "حرج",
  };

  function balaghStatusLabel(v) {
    const k = norm(v);
    return BALAGH_STATUS_LABELS[k] || k || "—";
  }

  function balaghPriorityLabel(v) {
    const k = norm(v);
    return BALAGH_PRIORITY_LABELS[k] || k || "—";
  }

  function parseNumFromText(v) {
    const m = String(v ?? "").match(/-?\d+/);
    return m ? Number(m[0]) : null;
  }

  // يحاول تفسير تاريخ من نصوص بصيغ مختلفة (YYYY-MM-DD أو DD/MM/YYYY أو غيرها)
  function parseBalaghDate(v) {
    const s = norm(v);
    if (!s) return null;
    let m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // ── تطبيع الرقم الوزاري (يشيل فراغات / BOM / صيغة "12345.0" من ملفات الإكسل) ──
  function normSchoolNo(v) {
    let s = String(v ?? "")
      .replace(/\uFEFF/g, "")
      .trim();
    if (!s || "—" === s) return "";
    s = s.replace(/\.0+$/, "");
    return s;
  }

  // ── خريطة المدارس (من RAW: المباني) بالرقم الوزاري، لربط كل بلاغ بمدرسته ──
  function buildSchoolByMinIdMap() {
    const map = {};
    (Array.isArray(RAW) ? RAW : []).forEach((s) => {
      // نسجّل الرقم بأشكاله المختلفة لضمان أعلى نسبة ربط
      const keys = new Set();
      [s.minId, s.schoolSeq, s.mainMinId, s.buildingSeq].forEach(v => {
        const k = normSchoolNo(v);
        if (k) keys.add(k);
        // بدون S- prefix (لو كان S-12345 نضيف 12345 أيضاً)
        if (k && k.toUpperCase().startsWith("S-")) keys.add(k.slice(2));
        // مع S- prefix (لو كان 12345 نضيف S-12345 أيضاً)
        if (k && !k.toUpperCase().startsWith("S-") && /^\d/.test(k)) keys.add("S-" + k);
      });
      keys.forEach(k => { if (!map[k]) map[k] = s; });
    });
    return map;
  }

  function normalizeRows() {
    const schoolByMinId = buildSchoolByMinIdMap();
    return getRaw()
      .map((r, idx) => {
        const created = norm(r["Creation Date.1"] || r["Creation Date"]);
        const finished = norm(r["Finish Date.1"] || r["Finish Date"]);
        const status = norm(r["Status"]);
        const slaText = norm(r["SLA DAYS"]);
        const slaNum = parseNumFromText(slaText);
        const openLike = !balaghIsClosed(status);
        const creationDateObj = parseBalaghDate(created);
        const schoolNumber = norm(r["School Number"]);
        const linkedSchool = schoolByMinId[normSchoolNo(schoolNumber)] || null;
        return {
          idx: idx + 1,
          recordNo: norm(r["Record No."]),
          creationDate: created,
          creationDateObj,
          finishDate: finished,
          slaDays: slaText,
          slaNum,
          slaStatus: norm(r["Sla Status"]),
          reopen: norm(r["Re-Open"]),
          status,
          schoolNumber,
          schoolName: norm(r["School Name"]),
          // ── ربط البلاغ بسجل المدرسة (من المباني) عبر الرقم الوزاري ──
          linkedMinId: linkedSchool ? linkedSchool.minId : "",
          linkedSchoolName: linkedSchool ? linkedSchool.name : "",
          linkedSector: linkedSchool ? linkedSchool.sector : "",
          linkedCity: linkedSchool ? linkedSchool.city : "",
          isLinked: !!linkedSchool,
          location: norm(r["Location"]),
          category: norm(r["Category"]),
          problemDescription: norm(r["Problem Description"]),
          priority: norm(r["Priority"]),
          issueDescription: norm(r["Issue Description"]),
          creator: norm(r["Creator"]),
          notes: norm(r["service provider notes"]),
          package: norm(r["Package"]),
          cleaning: norm(r["Cleaning"]),
          hvac: norm(r["HVAC"]),
          om: norm(r["OM "]),
          isOpen: openLike,
          isClosed: !openLike,
          isOverdue: Number.isFinite(slaNum) ? slaNum < 0 : false,
        };
      })
      .filter((r) => r.recordNo || r.schoolName || r.problemDescription);
  }

  function filteredRows(all) {
    // نقرأ من STATE أولاً (دائماً محدّث)، ثم DOM كاحتياط
    const ST = window.__BALAGH_STATE__ || {};
    const s = (ST.search || document.getElementById("balagh-search")?.value || "")
      .trim()
      .toLowerCase();
    const status = ST.status || document.getElementById("balagh-status")?.value || "";
    const category = ST.category || document.getElementById("balagh-category")?.value || "";
    const priority = ST.priority || document.getElementById("balagh-priority")?.value || "";
    const location = ST.location || document.getElementById("balagh-location")?.value || "";
    const dateFrom = ST.dateFrom || document.getElementById("balagh-date-from")?.value || "";
    const dateTo = ST.dateTo || document.getElementById("balagh-date-to")?.value || "";

    return all.filter((r) => {
      if (status && r.status !== status) return false;
      if (category && r.category !== category) return false;
      if (priority && r.priority !== priority) return false;
      if (location && r.location !== location) return false;
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (!r.creationDateObj || r.creationDateObj < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (!r.creationDateObj || r.creationDateObj > to) return false;
      }
      if (!s) return true;

      const hay = [
        r.recordNo,
        r.schoolNumber,
        r.schoolName,
        r.location,
        r.category,
        r.problemDescription,
        r.issueDescription,
        r.creator,
        r.status,
        r.priority,
        r.notes,
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(s);
    });
  }

  function pct(n, total) {
    if (!total) return "0%";
    return ((n / total) * 100).toFixed(1) + "%";
  }

  function topCounts(rows, key, limit) {
    const map = new Map();
    rows.forEach((r) => {
      const v = norm(r[key]);
      if (!v) return;
      map.set(v, (map.get(v) || 0) + 1);
    });
    return [...map.entries()]
      .map(([k, v]) => ({ k, v }))
      .sort((a, b) => b.v - a.v)
      .slice(0, limit);
  }

  function escText(v) {
    return esc(v);
  }

  function renderBarList(items, total, color, labelFormatter) {
    if (!items.length) return '<div class="empty-msg" style="padding:18px">لا توجد بيانات</div>';
    return items
      .map((it) => {
        const w = total ? Math.max(6, (it.v / total) * 100) : 0;
        // لو labelFormatter موجود يُرجع HTML جاهز — لا نُطبّق escText عليه
        // لو لم يكن موجوداً — نُطبّق escText على النص الخام لمنع XSS
        const labelHtml = typeof labelFormatter === "function"
          ? labelFormatter(it.k)
          : escText(String(it.k ?? ""));
        return `
        <div class="school-row" style="align-items:flex-start">
          <div style="min-width:120px;flex:0 0 120px;font-size:12px;font-weight:700;color:var(--tx-main)">${labelHtml}</div>
          <div style="flex:1">
            <div class="mini-track"><div class="mini-fill" style="width:${w}%;background:${color}"></div></div>
          </div>
          <div style="min-width:56px;text-align:left;font-weight:800;color:${color};font-variant-numeric:tabular-nums">${fmt(it.v)}</div>
        </div>`;
      })
      .join("");
  }

  function renderPager(total) {
    const pages = Math.max(1, Math.ceil(total / STATE.size));
    const current = Math.min(STATE.page, pages - 1);
    STATE.page = current;
    const start = current * STATE.size;
    const end = Math.min(start + STATE.size, total);
    const prevDisabled = current <= 0 ? "disabled" : "";
    const nextDisabled = current >= pages - 1 ? "disabled" : "";

    return `
      <div class="pag-bar">
        <div class="pag-info">عرض ${fmt(start + 1)} - ${fmt(end)} من ${fmt(total)} سجل</div>
        <div class="pag-btns">
          <button class="pag-btn" ${prevDisabled} onclick="window.__BALAGH_STATE__.page=Math.max(0,window.__BALAGH_STATE__.page-1);renderBalaghTab()">◀ السابق</button>
          <button class="pag-btn active">${fmt(current + 1)} / ${fmt(pages)}</button>
          <button class="pag-btn" ${nextDisabled} onclick="window.__BALAGH_STATE__.page=Math.min(${pages - 1},window.__BALAGH_STATE__.page+1);renderBalaghTab()">التالي ▶</button>
        </div>
      </div>`;
  }

  function exportCSV(rows) {
    const headers = [
      "Record No.",
      "Creation Date",
      "Finish Date",
      "SLA DAYS",
      "Status",
      "School Number",
      "School Name",
      "Location",
      "Category",
      "Problem Description",
      "Priority",
      "Issue Description",
      "Creator",
      "service provider notes",
    ];
    const csv = [headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(",")];
    rows.forEach((r) => {
      const vals = [
        r.recordNo,
        r.creationDate,
        r.finishDate,
        r.slaDays,
        r.status,
        r.schoolNumber,
        r.schoolName,
        r.location,
        r.category,
        r.problemDescription,
        r.priority,
        r.issueDescription,
        r.creator,
        r.notes,
      ].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`);
      csv.push(vals.join(","));
    });
    const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `بلاغات_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function renderBalaghTab() {
    const el = document.getElementById("balagh-content");
    if (!el) return;

    const all = normalizeRows();
    const rows = sortBalaghRows(filteredRows(all), STATE.sort || "date_desc");
    const total = all.length;
    const filteredTotal = rows.length;
    // الكروت أعلى الصفحة تُحسب من السجلات بعد تطبيق الفلاتر (rows)
    // حتى تتأثر بالفلاتر (الحالة / الفئة / الأولوية / المنطقة / البحث)
    const openCount = rows.filter((r) => r.isOpen).length;
    const closedCount = rows.filter((r) => r.isClosed).length;
    const inProgressCount = rows.filter((r) => balaghIsInProgress(r.status)).length;
    const overdueCount = rows.filter((r) => r.isOverdue).length;
    const schoolsCount = new Set(
      rows.map((r) => (r.isLinked ? "ID::" + r.linkedMinId : "NM::" + (r.schoolNumber || r.schoolName))).filter(Boolean),
    ).size;

    // أكثر المدارس تكراراً: نستخدم اسم المدرسة الموحّد من الربط (إن وُجد) بدل الاسم الخام،
    // لتفادي تكرار نفس المدرسة بأكثر من اسم/تهجئة في ملف البلاغات
    // نعد بـ schoolNumber (الرقم الثابت) لتجنب تكرار نفس المدرسة بأسماء مختلفة
    // ونبني خريطة: schoolNumber → displayName لعرض الاسم
    const schoolNumberNameMap = {};
    rows.forEach((r) => {
      const sn = r.schoolNumber || "";
      if (!sn) return;
      if (!schoolNumberNameMap[sn]) {
        schoolNumberNameMap[sn] = r.isLinked ? r.linkedSchoolName : (r.schoolName || sn);
      }
    });
    const schoolCounts = topCounts(rows, "schoolNumber", STATE.topSchoolN || 10);
    const categoryCounts = topCounts(rows, "category", 6);
    const priorityCounts = topCounts(rows, "priority", 6);
    const locationCounts = topCounts(rows, "location", 6);

    const list = rows.slice(STATE.page * STATE.size, STATE.page * STATE.size + STATE.size);
    const totalForBars = Math.max(1, filteredTotal);

    el.innerHTML = `
      <div class="card mb14">
        <div class="card-title">
          <span class="card-title-icon" style="background:#FFF7ED;color:#D97706">📢</span>
          <span>لوحة البلاغات — ملف CSV</span>
          <span class="sub">${fmt(filteredTotal)} من ${fmt(total)}</span>
        </div>

        <div class="g4" style="grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:0">
          <div class="kpi kc-amber">
            <div class="kpi-val" style="color:#D97706">${fmt(filteredTotal)}</div>
            <div class="kpi-lbl">إجمالي البلاغات</div>
            <div class="kpi-sub">${total === filteredTotal ? "كل السجلات من ملف CSV" : `من إجمالي ${fmt(total)} سجل`}</div>
          </div>
          <div class="kpi kc-red">
            <div class="kpi-val" style="color:#991b1b">${fmt(openCount)}</div>
            <div class="kpi-lbl">بلاغات مفتوحة</div>
            <div class="kpi-sub">${pct(openCount, filteredTotal)} من المعروض</div>
          </div>
          <div class="kpi kc-green">
            <div class="kpi-val" style="color:#059669">${fmt(closedCount)}</div>
            <div class="kpi-lbl">بلاغات مغلقة</div>
            <div class="kpi-sub">${pct(closedCount, filteredTotal)} من المعروض</div>
          </div>
          <div class="kpi kc-blue">
            <div class="kpi-val" style="color:#0891B2">${fmt(overdueCount)}</div>
            <div class="kpi-lbl">متأخرة SLA</div>
            <div class="kpi-sub">${pct(overdueCount, filteredTotal)} من المعروض</div>
          </div>
        </div>

        <div class="g4" style="grid-template-columns:repeat(4,minmax(0,1fr));margin-top:14px">
          <div class="kpi kc-navy">
            <div class="kpi-val" style="color:#083D4F">${fmt(inProgressCount)}</div>
            <div class="kpi-lbl">قيد التنفيذ</div>
            <div class="kpi-sub">قيد التنفيذ + موافقة الاستشاري قيد التنفيذ</div>
          </div>
          <div class="kpi kc-teal">
            <div class="kpi-val" style="color:#0E7490">${fmt(schoolsCount)}</div>
            <div class="kpi-lbl">مدارس متأثرة</div>
            <div class="kpi-sub">حسب رقم المدرسة أو الاسم</div>
          </div>
          <div class="kpi kc-purple">
            <div class="kpi-val" style="color:#6D28D9">${fmt(new Set(rows.map((r) => r.category).filter(Boolean)).size)}</div>
            <div class="kpi-lbl">فئات البلاغات</div>
            <div class="kpi-sub">الفئات</div>
          </div>
          <div class="kpi kc-amber">
            <div class="kpi-val" style="color:#92400e">${fmt(new Set(rows.map((r) => r.priority).filter(Boolean)).size)}</div>
            <div class="kpi-lbl">مستويات الأولوية</div>
            <div class="kpi-sub">درجات الأولوية</div>
          </div>
        </div>
      </div>

      <div class="filters-row" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
        <div class="fg">
          <div class="fg-lbl">بحث</div>
          <input class="finp" id="balagh-search" placeholder="🔍 رقم البلاغ أو المدرسة أو الوصف..." value="${escText(STATE.search)}"
            oninput="window.__BALAGH_STATE__.search=this.value;window.__BALAGH_STATE__.page=0;var s=document.getElementById('balagh-table-search');if(s)s.value=this.value;renderBalaghTab()">
        </div>
        <div class="fg">
          <div class="fg-lbl">الحالة</div>
          <select class="fsel" id="balagh-status" onchange="window.__BALAGH_STATE__.status=this.value;window.__BALAGH_STATE__.page=0;renderBalaghTab()">
            <option value="">الكل</option>
            ${[...new Set(all.map((r) => r.status).filter(Boolean))]
              .sort()
              .map(
                (v) =>
                  `<option value="${escText(v)}"${STATE.status === v ? " selected" : ""}>${escText(balaghStatusLabel(v))}</option>`,
              )
              .join("")}
          </select>
        </div>
        <div class="fg">
          <div class="fg-lbl">الفئة</div>
          <select class="fsel" id="balagh-category" onchange="window.__BALAGH_STATE__.category=this.value;window.__BALAGH_STATE__.page=0;renderBalaghTab()">
            <option value="">الكل</option>
            ${[...new Set(all.map((r) => r.category).filter(Boolean))]
              .sort()
              .map(
                (v) =>
                  `<option value="${escText(v)}"${STATE.category === v ? " selected" : ""}>${escText(v)}</option>`,
              )
              .join("")}
          </select>
        </div>
        <div class="fg">
          <div class="fg-lbl">الأولوية</div>
          <select class="fsel" id="balagh-priority" onchange="window.__BALAGH_STATE__.priority=this.value;window.__BALAGH_STATE__.page=0;renderBalaghTab()">
            <option value="">الكل</option>
            ${[...new Set(all.map((r) => r.priority).filter(Boolean))]
              .sort()
              .map(
                (v) =>
                  `<option value="${escText(v)}"${STATE.priority === v ? " selected" : ""}>${escText(balaghPriorityLabel(v))}</option>`,
              )
              .join("")}
          </select>
        </div>
        <div class="fg">
          <div class="fg-lbl">المنطقة</div>
          <select class="fsel" id="balagh-location" onchange="window.__BALAGH_STATE__.location=this.value;window.__BALAGH_STATE__.page=0;renderBalaghTab()">
            <option value="">الكل</option>
            ${[...new Set(all.map((r) => r.location).filter(Boolean))]
              .sort()
              .map(
                (v) =>
                  `<option value="${escText(v)}"${STATE.location === v ? " selected" : ""}>${escText(v)}</option>`,
              )
              .join("")}
          </select>
        </div>
        <div class="fg">
          <div class="fg-lbl">من تاريخ</div>
          <input class="finp" type="date" id="balagh-date-from" value="${escText(STATE.dateFrom)}"
            onchange="window.__BALAGH_STATE__.dateFrom=this.value;window.__BALAGH_STATE__.page=0;renderBalaghTab()">
        </div>
        <div class="fg">
          <div class="fg-lbl">إلى تاريخ</div>
          <input class="finp" type="date" id="balagh-date-to" value="${escText(STATE.dateTo)}"
            onchange="window.__BALAGH_STATE__.dateTo=this.value;window.__BALAGH_STATE__.page=0;renderBalaghTab()">
        </div>
        <button class="f-clear" onclick="window.__BALAGH_STATE__={page:0,size:25,search:'',status:'',category:'',priority:'',location:'',dateFrom:'',dateTo:'',sort:'date_desc'};renderBalaghTab()">✕ مسح الفلاتر</button>
        <button class="export-btn export-btn-csv" onclick="exportCSV(filteredRows(normalizeRows()))">⬇ تصدير CSV</button>
      </div>

      <div class="g21" style="align-items:start">
        <div class="card">
          <div class="card-title">
            <span class="card-title-icon" style="background:#FEF3C7;color:#B45309">🏫</span>
            <span>أكثر المدارس تكرارًا في البلاغات</span>
            <span style="margin-right:auto;display:flex;align-items:center;gap:6px">
              <label style="font-size:11px;color:var(--tx-muted);font-weight:600">عدد المدارس:</label>
              <select style="font-family:inherit;font-size:11px;padding:4px 10px;border:1px solid var(--bd-light);border-radius:8px;background:var(--bg-2);cursor:pointer"
                onchange="window.__BALAGH_STATE__.topSchoolN=parseInt(this.value);renderBalaghTab()">
                ${[5, 10, 15, 20, 30, 50].map((n) => `<option value="${n}" ${STATE.topSchoolN == n ? "selected" : ""}>${n} مدرسة</option>`).join("")}
              </select>
            </span>
          </div>
          ${renderBarList(schoolCounts, totalForBars, "#D97706", (sn) => {
            const name = schoolNumberNameMap[sn] || sn;
            // نستخدم data-sn بدل onclick inline لتفادي كسر الـ JS لو كان sn يحتوي '
            const safeAttr = escText(sn);
            const safeName = escText(name);
            return `<span data-balagh-filter="${safeAttr}" style="cursor:pointer;text-decoration:underline;text-underline-offset:2px" title="فلترة بهذه المدرسة">${safeName}</span>`;
          })}
        </div>
        <div class="card">
          <div class="card-title">
            <span class="card-title-icon" style="background:#FEE2E2;color:#B91C1C">⚠️</span>
            <span>الأولوية</span>
          </div>
          ${renderBarList(priorityCounts, totalForBars, "#DC2626", balaghPriorityLabel)}
        </div>
      </div>

      <div class="g21" style="align-items:start">
        <div class="card">
          <div class="card-title">
            <span class="card-title-icon" style="background:#E0F2FE;color:#0369A1">🏷️</span>
            <span>الفئات</span>
          </div>
          ${renderBarList(categoryCounts, totalForBars, "#0891B2")}
        </div>
        <div class="card">
          <div class="card-title">
            <span class="card-title-icon" style="background:#ECFDF5;color:#047857">📍</span>
            <span>المدن / المواقع</span>
          </div>
          ${renderBarList(locationCounts, totalForBars, "#059669")}
        </div>
      </div>


      <div class="card mb14">
        <div class="card-title">
          <span class="card-title-icon" style="background:#EDE9FE;color:#7C3AED">📅</span>
          <span>المقارنات الزمنية — البلاغات بمرور الوقت</span>
          <span class="sub">${fmt(filteredTotal)} سجل</span>
        </div>
        <div class="g2" style="margin-bottom:0">
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--tx-sec);margin-bottom:8px">البلاغات شهرياً</div>
            <div class="chart-box" style="height:240px"><canvas id="balagh-monthly-chart"></canvas></div>
          </div>
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--tx-sec);margin-bottom:8px">توزيع الحالة شهرياً</div>
            <div class="chart-box" style="height:240px"><canvas id="balagh-status-monthly-chart"></canvas></div>
          </div>
        </div>
      </div>

      <div class="card mb14">
        <div class="card-title">
          <span class="card-title-icon" style="background:#FEF3C7;color:#B45309">📆</span>
          <span>البلاغات أسبوعياً (آخر 12 أسبوع)</span>
        </div>
        <div class="chart-box" style="height:220px"><canvas id="balagh-weekly-chart"></canvas></div>
      </div>

      <div class="g2 mb14" style="align-items:start">
        <div class="card">
          <div class="card-title">
            <span class="card-title-icon" style="background:#ECFDF5;color:#047857">⏱️</span>
            <span>متوسط أيام الإغلاق شهرياً</span>
          </div>
          <div class="chart-box" style="height:220px"><canvas id="balagh-sla-monthly-chart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-title">
            <span class="card-title-icon" style="background:#EFF6FF;color:#1D4ED8">🏷️</span>
            <span>تطور الفئات الأعلى خلال 6 أشهر</span>
          </div>
          <div class="chart-box" style="height:220px"><canvas id="balagh-cat-trend-chart"></canvas></div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span class="card-title-icon" style="background:#EEF2FF;color:#4338CA">🧾</span>
          <span>تفاصيل البلاغات</span>
          <span class="sub">${fmt(filteredTotal)} سجل</span>
        </div>

        <div class="filters-row" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;margin-bottom:14px;padding:14px">
          <div class="fg" style="flex:1;min-width:220px">
            <div class="fg-lbl">بحث في التفاصيل</div>
            <input class="finp" id="balagh-table-search" placeholder="🔍 رقم البلاغ أو المدرسة أو الوصف..." value="${escText(STATE.search)}" style="width:100%"
              oninput="window.__BALAGH_STATE__.search=this.value;window.__BALAGH_STATE__.page=0;var s=document.getElementById('balagh-search');if(s)s.value=this.value;renderBalaghTab()">
          </div>
          <div class="fg">
            <div class="fg-lbl">الترتيب</div>
            <select class="fsel" id="balagh-sort" onchange="window.__BALAGH_STATE__.sort=this.value;window.__BALAGH_STATE__.page=0;renderBalaghTab()">
              <option value="date_desc"${STATE.sort === "date_desc" ? " selected" : ""}>الأحدث أولاً</option>
              <option value="date_asc"${STATE.sort === "date_asc" ? " selected" : ""}>الأقدم أولاً</option>
              <option value="priority_desc"${STATE.sort === "priority_desc" ? " selected" : ""}>الأولوية (الأعلى أولاً)</option>
              <option value="sla_asc"${STATE.sort === "sla_asc" ? " selected" : ""}>الأكثر تأخرًا في SLA</option>
              <option value="school"${STATE.sort === "school" ? " selected" : ""}>اسم المدرسة (أبجدي)</option>
            </select>
          </div>
        </div>

        <div class="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>رقم البلاغ</th>
                <th>تاريخ الإنشاء</th>
                <th>الحالة</th>
                <th>المدرسة</th>
                <th>الرقم الوزاري</th>
                <th>الموقع</th>
                <th>الفئة</th>
                <th>الأولوية</th>
                <th>وصف المشكلة</th>
                <th>وصف إضافي</th>
                <th>المسجل</th>
              </tr>
            </thead>
            <tbody>
              ${
                list.length
                  ? list
                      .map(
                        (r) => `
                <tr>
                  <td style="font-weight:800">${escText(r.recordNo)}</td>
                  <td>${escText(r.creationDate)}</td>
                  <td><span class="badge" style="background:${r.isClosed ? "#ECFDF5" : r.isOverdue ? "#FEF2F2" : "#FFF7ED"};color:${r.isClosed ? "#047857" : r.isOverdue ? "#B91C1C" : "#B45309"}">${escText(balaghStatusLabel(r.status))}</span></td>
                  <td style="text-align:right;font-weight:700">${escText(r.schoolName)}</td>
                  <td style="font-size:11px;font-weight:700;color:${r.schoolNumber ? '#0891B2' : '#ccc'}">${escText(r.schoolNumber || '—')}</td>
                  <td>${escText(r.location)}</td>
                  <td>${escText(r.category)}</td>
                  <td><span class="badge" style="background:${r.priority === "Critical" ? "#FEE2E2" : r.priority === "High" ? "#FEF3C7" : "#ECFDF5"};color:${r.priority === "Critical" ? "#991B1B" : r.priority === "High" ? "#B45309" : "#047857"}">${escText(balaghPriorityLabel(r.priority))}</span></td>
                  <td style="text-align:right;max-width:320px">${escText(r.problemDescription)}</td>
                  <td style="text-align:right;max-width:360px">${escText(r.issueDescription || "—")}</td>
                  <td>${escText(r.creator || "—")}</td>
                </tr>
              `,
                      )
                      .join("")
                  : `
                <tr><td colspan="11"><div class="empty-msg">لا توجد نتائج مطابقة للفلاتر الحالية</div></td></tr>
              `
              }
            </tbody>
          </table>
        </div>

        ${renderPager(filteredTotal)}
      </div>
    `;

    // === ربط data-balagh-filter بالبحث (بديل onclick inline) ===
    el.querySelectorAll("[data-balagh-filter]").forEach((span) => {
      span.addEventListener("click", function () {
        const sn = this.dataset.balaghFilter;
        window.__BALAGH_STATE__.search = sn;
        window.__BALAGH_STATE__.page = 0;
        renderBalaghTab();
        // مزامنة حقلَي البحث بعد إعادة الرسم
        ["balagh-search", "balagh-table-search"].forEach((id) => {
          const el2 = document.getElementById(id);
          if (el2) el2.value = sn;
        });
      });
    });

    // === رسم الشارتات الزمنية — مرتبطة بالفلاتر ===
    requestAnimationFrame(() => {
      const allRowsForTime = rows; // البيانات المفلترة بالكامل (ليس فقط الصفحة الحالية)

      // دوال مساعدة لاستخراج مفاتيح التاريخ
      function parseMonthKey(v) {
        if (!v) return null;
        // حاول استخدام creationDateObj أولاً ثم النص
        const d = v instanceof Date ? v : new Date(v);
        if (isNaN(d)) return null;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      }
      function parseWeekKey(v) {
        if (!v) return null;
        const d = v instanceof Date ? v : new Date(v);
        if (isNaN(d)) return null;
        const jan1 = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
        return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
      }
      function monthKeyToLabel(k) {
        const [y, m] = k.split("-");
        const names = [
          "يناير",
          "فبراير",
          "مارس",
          "أبريل",
          "مايو",
          "يونيو",
          "يوليو",
          "أغسطس",
          "سبتمبر",
          "أكتوبر",
          "نوفمبر",
          "ديسمبر",
        ];
        return `${names[parseInt(m) - 1]} ${y}`;
      }

      // ═══ 1. البلاغات شهرياً ═══
      // إذا لم توجد بيانات بعد الفلترة: اعرض رسالة "لا توجد بيانات"
      const timeChartsIds = [
        "balagh-monthly-chart",
        "balagh-status-monthly-chart",
        "balagh-weekly-chart",
        "balagh-sla-monthly-chart",
        "balagh-cat-trend-chart",
      ];
      if (!allRowsForTime.length) {
        timeChartsIds.forEach((id) => {
          const el2 = document.getElementById(id);
          if (!el2) return;
          // destroy old chart
          if (typeof CHARTS !== "undefined" && CHARTS[id]) {
            try {
              CHARTS[id].destroy();
            } catch (e) {}
            delete CHARTS[id];
          }
          const ctx = el2.getContext("2d");
          ctx.clearRect(0, 0, el2.width, el2.height);
          el2.parentElement.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:center;height:100%;min-height:120px;color:var(--tx-muted);font-size:12px;font-weight:600">لا توجد بيانات تطابق الفلاتر المختارة</div>';
        });
        return;
      }

      const monthlyMap = new Map();
      allRowsForTime.forEach((r) => {
        // استخدم creationDateObj (كائن Date) إذا كان متاحاً
        const k = parseMonthKey(r.creationDateObj || r.creationDate);
        if (!k) return;
        monthlyMap.set(k, (monthlyMap.get(k) || 0) + 1);
      });
      const sortedMonths = [...monthlyMap.keys()].sort();
      // آخر 18 شهر من البيانات المفلترة فعلاً
      const last18Months = sortedMonths.slice(-18);
      const monthLabels = last18Months.map(monthKeyToLabel);
      const monthVals = last18Months.map((k) => monthlyMap.get(k) || 0);

      if (document.getElementById("balagh-monthly-chart")) {
        if (typeof CHARTS !== "undefined" && CHARTS["balagh-monthly-chart"]) {
          try {
            CHARTS["balagh-monthly-chart"].destroy();
          } catch (e) {}
          delete CHARTS["balagh-monthly-chart"];
        }
        CHARTS["balagh-monthly-chart"] = new Chart(
          document.getElementById("balagh-monthly-chart"),
          {
            type: "bar",
            data: {
              labels: monthLabels,
              datasets: [
                {
                  label: "عدد البلاغات",
                  data: monthVals,
                  backgroundColor: PALETTE.map((c) => c + "BB")
                    .slice(0, monthVals.length)
                    .map((_, i) => (i === monthVals.length - 1 ? "#D97706BB" : "#0891B2BB")),
                  borderColor: "#0891B2",
                  borderWidth: 1.5,
                  borderRadius: 6,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false } },
              scales: {
                x: {
                  ticks: { font: { size: 9 }, maxRotation: 45 },
                  grid: { color: "rgba(168,195,214,.15)" },
                },
                y: {
                  beginAtZero: true,
                  ticks: { font: { size: 10 } },
                  title: {
                    display: true,
                    text: "عدد البلاغات",
                    color: "#6B8795",
                    font: { size: 10, weight: "700" },
                  },
                },
              },
            },
          },
        );
      }

      // ═══ 2. توزيع الحالة شهرياً (stacked) ═══
      const monthOpenMap = new Map(),
        monthClosedMap = new Map(),
        monthProgMap = new Map();
      allRowsForTime.forEach((r) => {
        const k = parseMonthKey(r.creationDateObj || r.creationDate);
        if (!k || !last18Months.includes(k)) return;
        if (r.isOpen) monthOpenMap.set(k, (monthOpenMap.get(k) || 0) + 1);
        else if (r.isClosed) monthClosedMap.set(k, (monthClosedMap.get(k) || 0) + 1);
        else monthProgMap.set(k, (monthProgMap.get(k) || 0) + 1);
      });
      if (document.getElementById("balagh-status-monthly-chart")) {
        if (typeof CHARTS !== "undefined" && CHARTS["balagh-status-monthly-chart"]) {
          try {
            CHARTS["balagh-status-monthly-chart"].destroy();
          } catch (e) {}
          delete CHARTS["balagh-status-monthly-chart"];
        }
        CHARTS["balagh-status-monthly-chart"] = new Chart(
          document.getElementById("balagh-status-monthly-chart"),
          {
            type: "bar",
            data: {
              labels: monthLabels,
              datasets: [
                {
                  label: "مغلقة",
                  data: last18Months.map((k) => monthClosedMap.get(k) || 0),
                  backgroundColor: "#05966999",
                  borderColor: "#059669",
                  borderWidth: 1.5,
                  borderRadius: 4,
                },
                {
                  label: "قيد التنفيذ",
                  data: last18Months.map((k) => monthProgMap.get(k) || 0),
                  backgroundColor: "#0891B299",
                  borderColor: "#0891B2",
                  borderWidth: 1.5,
                  borderRadius: 4,
                },
                {
                  label: "مفتوحة",
                  data: last18Months.map((k) => monthOpenMap.get(k) || 0),
                  backgroundColor: "#DC262699",
                  borderColor: "#DC2626",
                  borderWidth: 1.5,
                  borderRadius: 4,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: "bottom", labels: { font: { size: 10 } } },
                tooltip: { mode: "index", intersect: false },
                // تعطيل plugin الأرقام التلقائية لهذا الشارت (stacked) لأنها تتراكم
                tbcPremiumValueLabels: false,
              },
              scales: {
                x: {
                  stacked: true,
                  ticks: { font: { size: 9 }, maxRotation: 45 },
                  grid: { color: "rgba(168,195,214,.15)" },
                },
                y: { stacked: true, beginAtZero: true, ticks: { font: { size: 10 } } },
              },
            },
          },
        );
      }

      // ═══ 3. البلاغات أسبوعياً ═══
      const weeklyMap = new Map();
      allRowsForTime.forEach((r) => {
        const k = parseWeekKey(r.creationDateObj || r.creationDate);
        if (!k) return;
        weeklyMap.set(k, (weeklyMap.get(k) || 0) + 1);
      });
      const sortedWeeks = [...weeklyMap.keys()].sort().slice(-12);
      const weekVals = sortedWeeks.map((k) => weeklyMap.get(k) || 0);
      const weekLabels = sortedWeeks.map((k) => k.replace("-", " "));
      if (document.getElementById("balagh-weekly-chart")) {
        if (typeof CHARTS !== "undefined" && CHARTS["balagh-weekly-chart"]) {
          try {
            CHARTS["balagh-weekly-chart"].destroy();
          } catch (e) {}
          delete CHARTS["balagh-weekly-chart"];
        }
        CHARTS["balagh-weekly-chart"] = new Chart(document.getElementById("balagh-weekly-chart"), {
          type: "line",
          data: {
            labels: weekLabels,
            datasets: [
              {
                label: "بلاغات أسبوعية",
                data: weekVals,
                backgroundColor: "rgba(109,40,217,0.12)",
                borderColor: "#7C3AED",
                borderWidth: 2.5,
                pointBackgroundColor: "#7C3AED",
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.35,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false } },
            scales: {
              x: { ticks: { font: { size: 10 } }, grid: { color: "rgba(168,195,214,.15)" } },
              y: {
                beginAtZero: true,
                ticks: { font: { size: 10 } },
                title: {
                  display: true,
                  text: "عدد البلاغات",
                  color: "#6B8795",
                  font: { size: 10, weight: "700" },
                },
              },
            },
          },
        });
      }

      // ═══ 4. متوسط أيام الإغلاق شهرياً ═══
      const slaMonthlySumMap = new Map(),
        slaMonthlyCntMap = new Map();
      allRowsForTime.forEach((r) => {
        if (!r.isClosed) return;
        const k = parseMonthKey(r.creationDateObj || r.creationDate);
        if (!k || !last18Months.includes(k)) return;
        // نستخدم slaNum (مُحوَّل مسبقاً في normalizeRows بـ parseNumFromText) بدل parseFloat على نص خام
        const sla = r.slaNum;
        if (Number.isFinite(sla) && sla >= 0) {
          slaMonthlySumMap.set(k, (slaMonthlySumMap.get(k) || 0) + sla);
          slaMonthlyCntMap.set(k, (slaMonthlyCntMap.get(k) || 0) + 1);
        }
      });
      const slaMonthlyVals = last18Months.map((k) => {
        const cnt = slaMonthlyCntMap.get(k) || 0;
        return cnt ? +(slaMonthlySumMap.get(k) / cnt).toFixed(1) : null;
      });
      if (document.getElementById("balagh-sla-monthly-chart")) {
        if (typeof CHARTS !== "undefined" && CHARTS["balagh-sla-monthly-chart"]) {
          try {
            CHARTS["balagh-sla-monthly-chart"].destroy();
          } catch (e) {}
          delete CHARTS["balagh-sla-monthly-chart"];
        }
        CHARTS["balagh-sla-monthly-chart"] = new Chart(
          document.getElementById("balagh-sla-monthly-chart"),
          {
            type: "line",
            data: {
              labels: monthLabels,
              datasets: [
                {
                  label: "متوسط أيام الإغلاق",
                  data: slaMonthlyVals,
                  backgroundColor: "rgba(5,150,105,0.12)",
                  borderColor: "#059669",
                  borderWidth: 2.5,
                  pointBackgroundColor: "#059669",
                  pointRadius: 5,
                  pointHoverRadius: 7,
                  fill: true,
                  tension: 0.35,
                  spanGaps: true,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  mode: "index",
                  intersect: false,
                  callbacks: { label: (ctx) => (ctx.raw !== null ? `${ctx.raw} يوم` : "—") },
                },
              },
              scales: {
                x: {
                  ticks: { font: { size: 9 }, maxRotation: 45 },
                  grid: { color: "rgba(168,195,214,.15)" },
                },
                y: {
                  beginAtZero: true,
                  ticks: { font: { size: 10 }, callback: (v) => v + " ي" },
                  title: {
                    display: true,
                    text: "أيام",
                    color: "#6B8795",
                    font: { size: 10, weight: "700" },
                  },
                },
              },
            },
          },
        );
      }

      // ═══ 5. تطور الفئات الأعلى خلال 6 أشهر ═══
      const last6 = last18Months.slice(-6);
      const catMonthMap = {};
      allRowsForTime.forEach((r) => {
        const k = parseMonthKey(r.creationDateObj || r.creationDate);
        if (!k || !last6.includes(k)) return;
        const cat = r.category || "—";
        if (!catMonthMap[cat]) catMonthMap[cat] = {};
        catMonthMap[cat][k] = (catMonthMap[cat][k] || 0) + 1;
      });
      // Top 5 categories by total
      const catTotals = Object.entries(catMonthMap)
        .map(([cat, mv]) => ({ cat, total: Object.values(mv).reduce((a, b) => a + b, 0) }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      const last6Labels = last6.map((k) => {
        const [y, m] = k.split("-");
        return (
          [
            "يناير",
            "فبراير",
            "مارس",
            "أبريل",
            "مايو",
            "يونيو",
            "يوليو",
            "أغسطس",
            "سبتمبر",
            "أكتوبر",
            "نوفمبر",
            "ديسمبر",
          ][parseInt(m) - 1] +
          " " +
          y
        );
      });
      const catColors = ["#0891B2", "#7C3AED", "#D97706", "#DC2626", "#059669"];
      if (document.getElementById("balagh-cat-trend-chart")) {
        if (typeof CHARTS !== "undefined" && CHARTS["balagh-cat-trend-chart"]) {
          try {
            CHARTS["balagh-cat-trend-chart"].destroy();
          } catch (e) {}
          delete CHARTS["balagh-cat-trend-chart"];
        }
        CHARTS["balagh-cat-trend-chart"] = new Chart(
          document.getElementById("balagh-cat-trend-chart"),
          {
            type: "line",
            data: {
              labels: last6Labels,
              datasets: catTotals.map((item, i) => ({
                label: item.cat.length > 20 ? item.cat.slice(0, 20) + "…" : item.cat,
                data: last6.map((k) => catMonthMap[item.cat]?.[k] || 0),
                borderColor: catColors[i % catColors.length],
                backgroundColor: catColors[i % catColors.length] + "22",
                borderWidth: 2,
                pointRadius: 4,
                tension: 0.3,
                fill: false,
              })),
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "bottom",
                  labels: { font: { size: 9 }, boxWidth: 10, boxHeight: 10 },
                },
                tooltip: { mode: "index", intersect: false },
              },
              scales: {
                x: {
                  ticks: { font: { size: 9 }, maxRotation: 30 },
                  grid: { color: "rgba(168,195,214,.15)" },
                },
                y: { beginAtZero: true, ticks: { font: { size: 10 } } },
              },
            },
          },
        );
      }
    });
    // === نهاية الشارتات الزمنية ===
  }

  window.renderBalaghTab = renderBalaghTab;
  window.balaghExportCSV = function () {
    exportCSV(filteredRows(normalizeRows()));
  };
})();


/* دوال مساعدة لتنسيق التواريخ في تبويب الأنظمة التفصيلية */
function _sysDateVal(v) {
  if (!v) return "";
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}
function _sysNum(v, d = 1) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(d) : "";
}
window.exportSysMainCSV = function () {
  const isEn = "en" === LANG,
    systems = (window._sysMainSystems || []).filter((s) => "6" !== s),
    rows = (window._sysMainRows || []).filter((r) => {
      const q = (document.getElementById("sysm-search")?.value || "").toLowerCase().trim();
      return (
        !q ||
        String(r.name || "")
          .toLowerCase()
          .includes(q) ||
        String(r.city || "")
          .toLowerCase()
          .includes(q) ||
        String(r.eng || "")
          .toLowerCase()
          .includes(q)
      );
    }),
    headers = isEn
      ? ["School Name", "City", "Total Score", "Tier", ...systems, "Visit Date", "Engineer"]
      : [
          "اسم المدرسة",
          "المدينة",
          "الدرجة الكلية",
          "الفئة",
          ...systems,
          "تاريخ الزيارة",
          "المهندس",
        ],
    csv = [headers.map(_sysCsvCell).join(",")];
  rows.forEach((r) => {
    csv.push(
      [
        r.name || "",
        r.city || "",
        _sysNum(r.score, 1),
        r.tier || "",
        ...systems.map((s) => {
          const sg = r.systems?.[s];
          return sg ? +(sg.sum / sg.cnt).toFixed(1) : "";
        }),
        _sysDateVal(r.date),
        r.eng || "",
      ]
        .map(_sysCsvCell)
        .join(","),
    );
  });
  _sysDownloadFile(
    `sys_main_${_sysExportSafeName(isEn ? "data" : "الأنظمة_الرئيسية")}_${new Date().toISOString().slice(0, 10)}.csv`,
    `\ufeff${csv.join("\r\n")}`,
    "text/csv;charset=utf-8;",
  );
};
window.exportSysMainExcel = function () {
  const isEn = "en" === LANG,
    systems = (window._sysMainSystems || []).filter((s) => "6" !== s),
    rows = (window._sysMainRows || []).filter((r) => {
      const q = (document.getElementById("sysm-search")?.value || "").toLowerCase().trim();
      return (
        !q ||
        String(r.name || "")
          .toLowerCase()
          .includes(q) ||
        String(r.city || "")
          .toLowerCase()
          .includes(q) ||
        String(r.eng || "")
          .toLowerCase()
          .includes(q)
      );
    }),
    headers = isEn
      ? ["School Name", "City", "Total Score", "Tier", ...systems, "Visit Date", "Engineer"]
      : [
          "اسم المدرسة",
          "المدينة",
          "الدرجة الكلية",
          "الفئة",
          ...systems,
          "تاريخ الزيارة",
          "المهندس",
        ];
  const dataArr = [headers];
  rows.forEach((r) => {
    dataArr.push([
      r.name || "",
      r.city || "",
      _sysNum(r.score, 1),
      r.tier || "",
      ...systems.map((s) => {
        const sg = r.systems?.[s];
        return sg ? +(sg.sum / sg.cnt).toFixed(1) : "";
      }),
      _sysDateVal(r.date),
      r.eng || "",
    ]);
  });
  const ws = XLSX.utils.aoa_to_sheet(dataArr);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isEn ? "Sys Main" : "الأنظمة الرئيسية");
  XLSX.writeFile(
    wb,
    `sys_main_${_sysExportSafeName(isEn ? "data" : "الأنظمة_الرئيسية")}_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
};
window.exportSysDetailCSV = function () {
  const isEn = "en" === LANG,
    meta = window._hmSdExport || {},
    rows = meta.rows || [],
    subCols = meta.subCols || [],
    headers = isEn
      ? ["Main System", "School Number", "School Name", "Score", ...subCols]
      : ["القسم الرئيسي", "رقم المدرسة", "اسم المدرسة", "الدرجة", ...subCols],
    csv = [headers.map(_sysCsvCell).join(",")];
  rows.forEach((r) => {
    csv.push(
      [
        r.main || window._sdActiveSection || "",
        r.id || "",
        r.name || "",
        _sysNum(r.score, 1),
        ...subCols.map((sys) => {
          const sg = r.systems?.[sys];
          return sg ? +(sg.sum / sg.cnt).toFixed(1) : "";
        }),
      ]
        .map(_sysCsvCell)
        .join(","),
    );
  });
  _sysDownloadFile(
    `sys_detail_${_sysExportSafeName(isEn ? "data" : "الأنظمة_التفصيلية")}_${new Date().toISOString().slice(0, 10)}.csv`,
    `\ufeff${csv.join("\r\n")}`,
    "text/csv;charset=utf-8;",
  );
};
window.exportSysDetailExcel = function () {
  const isEn = "en" === LANG,
    meta = window._hmSdExport || {},
    rows = meta.rows || [],
    subCols = meta.subCols || [],
    headers = isEn
      ? ["Main System", "School Number", "School Name", "Score", ...subCols]
      : ["القسم الرئيسي", "رقم المدرسة", "اسم المدرسة", "الدرجة", ...subCols];
  const dataArr = [headers];
  rows.forEach((r) => {
    dataArr.push([
      r.main || window._sdActiveSection || "",
      r.id || "",
      r.name || "",
      _sysNum(r.score, 1),
      ...subCols.map((sys) => {
        const sg = r.systems?.[sys];
        return sg ? +(sg.sum / sg.cnt).toFixed(1) : "";
      }),
    ]);
  });
  const ws = XLSX.utils.aoa_to_sheet(dataArr);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isEn ? "Sys Detail" : "الأنظمة التفصيلية");
  XLSX.writeFile(
    wb,
    `sys_detail_${_sysExportSafeName(isEn ? "data" : "الأنظمة_التفصيلية")}_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
};

const HIDDEN_SYSTEMS = ["سؤال الوزارة: هل توجد مبانٍ فرعية عشوائية / غير نظامية داخل الموقع؟"];
window.LANG = window.LANG || "ar";
var LANG = window.LANG;

window.__DASH_AUTO_STARTED__ = window.__DASH_AUTO_STARTED__ || false;
function __startDashboardLoad() {
  if (window.__DASH_AUTO_STARTED__) return;
  if (typeof window.loadData !== "function") return;
  window.__DASH_AUTO_STARTED__ = true;
  window.loadData(false);
}
function __scheduleDashboardLoad() {
  setTimeout(__startDashboardLoad, 0);
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", __scheduleDashboardLoad, { once: true });
} else {
  __scheduleDashboardLoad();
}
window.addEventListener("load", __scheduleDashboardLoad, { once: true });

// تحميل بيانات تبويب التكلفة وتبويب المدفوعات تلقائياً عند فتح الداشبورد
window.__COST_PAY_AUTO_STARTED__ = window.__COST_PAY_AUTO_STARTED__ || false;
function __startCostPaymentsAutoLoad() {
  if (window.__COST_PAY_AUTO_STARTED__) return;
  window.__COST_PAY_AUTO_STARTED__ = true;
  if (typeof window.renderCostTab === "function") window.renderCostTab();
  if (typeof window.paymentsInitTab === "function") window.paymentsInitTab();
}
function __scheduleCostPaymentsAutoLoad() {
  setTimeout(__startCostPaymentsAutoLoad, 0);
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", __scheduleCostPaymentsAutoLoad, { once: true });
} else {
  __scheduleCostPaymentsAutoLoad();
}
window.addEventListener("load", __scheduleCostPaymentsAutoLoad, { once: true });


!(function () {
  /* تحسينات شكل الشارتات: تنسيق الأرقام، الألوان، الخطوط */
  const FONT = "'IBM Plex Sans Arabic','Tajawal',sans-serif";
  function formatNumber(value) {
    if (null == value || "" === value || Number.isNaN(value)) return "—";
    const num = Number(value);
    return Number.isFinite(num)
      ? Number.isInteger(num)
        ? num.toLocaleString("en-US")
        : num.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      : String(value);
  }
  function drawLabelPill(ctx, text, x, y, fill, stroke, textColor = "#0B2530") {
    (ctx.save(), (ctx.font = `700 10px ${FONT}`));
    const w = ctx.measureText(text).width + 12;
    ((ctx.fillStyle = fill),
      (ctx.strokeStyle = stroke),
      (ctx.lineWidth = 1),
      (function (ctx, x, y, w, h, r) {
        const radius = Math.min(r, w / 2, h / 2);
        (ctx.beginPath(),
          ctx.moveTo(x + radius, y),
          ctx.arcTo(x + w, y, x + w, y + h, radius),
          ctx.arcTo(x + w, y + h, x, y + h, radius),
          ctx.arcTo(x, y + h, x, y, radius),
          ctx.arcTo(x, y, x + w, y, radius),
          ctx.closePath());
      })(ctx, x - w / 2, y - 9, w, 18, 9),
      ctx.fill(),
      ctx.stroke(),
      (ctx.fillStyle = textColor),
      (ctx.textAlign = "center"),
      (ctx.textBaseline = "middle"),
      ctx.fillText(text, x, y + 0.25),
      ctx.restore());
  }
  function enhanceChartScales(options, xTitle, yTitle, isHorizontal = !1) {
    const opts = options || {};
    ((opts.responsive = !0),
      (opts.maintainAspectRatio = !1),
      (opts.layout = opts.layout || { padding: { top: 18, right: 18, bottom: 8, left: 10 } }),
      (opts.plugins = opts.plugins || {}),
      (opts.plugins.legend = opts.plugins.legend || {}),
      (opts.plugins.legend.position = opts.plugins.legend.position || "bottom"),
      (opts.plugins.legend.labels = opts.plugins.legend.labels || {}),
      (opts.plugins.legend.labels.usePointStyle = !0),
      (opts.plugins.legend.labels.pointStyle = "circle"),
      (opts.plugins.legend.labels.boxWidth = 8),
      (opts.plugins.legend.labels.boxHeight = 8),
      (opts.plugins.legend.labels.padding = 12),
      (opts.plugins.tooltip = opts.plugins.tooltip || {}),
      (opts.plugins.tooltip.mode = opts.plugins.tooltip.mode || "index"),
      (opts.plugins.tooltip.intersect = opts.plugins.tooltip.intersect ?? !1),
      (opts.scales = opts.scales || {}));
    const x = (opts.scales.x = opts.scales.x || {}),
      y = (opts.scales.y = opts.scales.y || {});
    return (
      (x.grid = x.grid || {}),
      (y.grid = y.grid || {}),
      (x.grid.color = x.grid.color || "rgba(168,195,214,.22)"),
      (y.grid.color = y.grid.color || "rgba(168,195,214,.22)"),
      (x.grid.drawBorder = !1),
      (y.grid.drawBorder = !1),
      (x.ticks = x.ticks || {}),
      (y.ticks = y.ticks || {}),
      (x.ticks.color = x.ticks.color || "#6B8795"),
      (y.ticks.color = y.ticks.color || "#6B8795"),
      (x.ticks.padding = x.ticks.padding ?? 6),
      (y.ticks.padding = y.ticks.padding ?? 6),
      xTitle &&
        (x.title = {
          display: !0,
          text: xTitle,
          color: "#6B8795",
          font: { size: 10, weight: "700" },
        }),
      yTitle &&
        (y.title = {
          display: !0,
          text: yTitle,
          color: "#6B8795",
          font: { size: 10, weight: "700" },
        }),
      isHorizontal &&
        (y.afterFit =
          y.afterFit ||
          ((s) => {
            s.width = Math.max(s.width, 220);
          })),
      opts
    );
  }
  function bootEnhancements() {
    "undefined" != typeof Chart &&
      (window.__TBC_PREMIUM_PLUGIN_REGISTERED__ ||
        ((window.__TBC_PREMIUM_PLUGIN_REGISTERED__ = !0),
        Chart.register({
          id: "tbcPremiumValueLabels",
          afterDatasetsDraw(chart, args, pluginOptions) {
            if (pluginOptions === false || chart.options?.plugins?.tbcPremiumValueLabels === false)
              return;
            const type = chart.config.type;
            if ("bar" !== type && "doughnut" !== type && "pie" !== type) return;
            const { ctx: ctx, chartArea: chartArea } = chart;
            if (!chartArea) return;
            const datasets = chart.data.datasets || [];
            if (
              (ctx.save(),
              (ctx.font = `700 10px ${FONT}`),
              (ctx.textBaseline = "middle"),
              (ctx.textAlign = "center"),
              "bar" === type)
            ) {
              const horizontal = "y" === (chart.options?.indexAxis || "x");
              datasets.forEach((dataset, dsIndex) => {
                const meta = chart.getDatasetMeta(dsIndex);
                meta &&
                  !meta.hidden &&
                  meta.data.forEach((element, index) => {
                    const raw = dataset.data?.[index],
                      num = Number(raw);
                    if (!Number.isFinite(num)) return;
                    const text = formatNumber(num),
                      pillW = (text.length, ctx.measureText(text).width + 10),
                      fill = "rgba(255,255,255,.90)";
                    if (horizontal) {
                      const x = element.x + 8,
                        y = element.y;
                      if (x + pillW / 2 > chartArea.right - 2) return;
                      drawLabelPill(
                        ctx,
                        text,
                        x + pillW / 2 - 2,
                        y,
                        fill,
                        "rgba(13,43,54,.08)",
                        "#0B2530",
                      );
                    } else {
                      const y =
                          element.y - 20 < chartArea.top + 8 ? element.y + 12 : element.y - 12,
                        x = element.x;
                      if (y < chartArea.top + 8 || y > chartArea.bottom - 4) return;
                      drawLabelPill(ctx, text, x, y, fill, "rgba(13,43,54,.08)", "#0B2530");
                    }
                  });
              });
            }
            if ("doughnut" === type || "pie" === type) {
              const dataset = datasets[0],
                meta = chart.getDatasetMeta(0);
              if (!dataset || !meta || meta.hidden) return void ctx.restore();
              const total = (dataset.data || [])
                  .map((v) => Number(v))
                  .filter((v) => Number.isFinite(v) && v > 0)
                  .reduce((a, b) => a + b, 0),
                centerX = (chartArea.left + chartArea.right) / 2,
                centerY = (chartArea.top + chartArea.bottom) / 2;
              (ctx.save(),
                (ctx.fillStyle = "#0B2530"),
                (ctx.textAlign = "center"),
                (ctx.textBaseline = "middle"),
                (ctx.font = `800 16px ${FONT}`),
                ctx.fillText(formatNumber(total), centerX, centerY - 4),
                (ctx.font = `600 10px ${FONT}`),
                (ctx.fillStyle = "#6B8795"),
                ctx.fillText("إجمالي", centerX, centerY + 16),
                ctx.restore());
            }
            ctx.restore();
          },
        }),
        (Chart.defaults.font.family = FONT),
        (Chart.defaults.font.size = 11),
        (Chart.defaults.color = "#6B8795"),
        (Chart.defaults.animation.duration = 650),
        (Chart.defaults.animation.easing = "easeOutQuart"),
        (Chart.defaults.maintainAspectRatio = !1),
        (Chart.defaults.responsive = !0),
        (Chart.defaults.elements.bar.borderRadius = 7),
        (Chart.defaults.elements.bar.borderSkipped = !1),
        (Chart.defaults.elements.line.tension = 0.35),
        (Chart.defaults.plugins.legend.position = "bottom"),
        (Chart.defaults.plugins.legend.labels.usePointStyle = !0),
        (Chart.defaults.plugins.legend.labels.pointStyle = "circle"),
        (Chart.defaults.plugins.legend.labels.boxWidth = 10),
        (Chart.defaults.plugins.legend.labels.boxHeight = 10),
        (Chart.defaults.plugins.legend.labels.padding = 12),
        (Chart.defaults.plugins.legend.labels.color = "#3D6070"),
        (Chart.defaults.plugins.legend.labels.font = { size: 11, weight: "600" }),
        (Chart.defaults.plugins.tooltip.backgroundColor = "rgba(7,24,33,.94)"),
        (Chart.defaults.plugins.tooltip.titleColor = "#FFFFFF"),
        (Chart.defaults.plugins.tooltip.bodyColor = "rgba(255,255,255,.88)"),
        (Chart.defaults.plugins.tooltip.borderColor = "rgba(8,145,178,.24)"),
        (Chart.defaults.plugins.tooltip.borderWidth = 1),
        (Chart.defaults.plugins.tooltip.padding = 12),
        (Chart.defaults.plugins.tooltip.cornerRadius = 12),
        (Chart.defaults.plugins.tooltip.displayColors = !0),
        (Chart.defaults.plugins.tooltip.boxPadding = 4),
        (Chart.defaults.plugins.tooltip.titleFont = { size: 12, weight: "700" }),
        (Chart.defaults.plugins.tooltip.bodyFont = { size: 11, weight: "600" }),
        (Chart.defaults.plugins.tooltip.caretSize = 5),
        (Chart.defaults.scale.grid.color = "rgba(168,195,214,.22)"),
        (Chart.defaults.scale.grid.drawBorder = !1),
        (Chart.defaults.scale.ticks.padding = 6),
        (Chart.defaults.scale.border = { dash: [3, 3] }),
        (Chart.defaults.scale.title = {
          display: !0,
          color: "#6B8795",
          font: { size: 10, weight: "700" },
        })));
  }
  ((window.makeDoughnut = function (id, dataMap, colorMap = {}) {
    killChart(id);
    const entries = Object.entries(dataMap)
      .filter(([, v]) => Number(v) > 0)
      .sort((a, b) => b[1] - a[1]);
    if (!entries.length) return;
    const total = entries.reduce((s, [, v]) => s + Number(v), 0);
    CHARTS[id] = new Chart(document.getElementById(id), {
      type: "doughnut",
      data: {
        labels: entries.map(([k, v]) => {
          const pct = total ? ((v / total) * 100).toFixed(1) : "0.0";
          const kS = k.length > 22 ? k.slice(0, 22) + "\u2026" : k;
          return `${kS}  (${Number(v).toLocaleString()} · ${pct}%)`;
        }),
        datasets: [
          {
            data: entries.map((x) => x[1]),
            backgroundColor: entries.map(
              ([k], i) => (colorMap[k] || PALETTE[i % PALETTE.length]) + "DD",
            ),
            borderWidth: 2,
            borderColor: "#FFFFFF",
            hoverOffset: 6,
          },
        ],
      },
      options: {
        cutout: "60%",
        responsive: !0,
        maintainAspectRatio: !1,
        layout: { padding: { top: 10, bottom: 10, left: 10, right: 10 } },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: !0,
              pointStyle: "circle",
              boxWidth: 10,
              boxHeight: 10,
              padding: 8,
              font: { size: 10, weight: "600" },
              color: "#3D6070",
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const raw = ctx.dataset.data[ctx.dataIndex],
                  tot = ctx.dataset.data.reduce((a, b) => a + (+b || 0), 0),
                  pct = tot ? ((raw / tot) * 100).toFixed(1) : "0.0";
                return ` ${entries[ctx.dataIndex]?.[0] || "—"}: ${Number(raw).toLocaleString()} مدرسة (${pct}%)`;
              },
            },
          },
          tbcPremiumValueLabels: { showCenter: !0 },
        },
      },
    });
  }),
    (window.makeHBar = function (id, labels, values, colors, maxVal = null, fullLabels = null) {
      killChart(id);
      const displayLabels = labels.map((l) => {
          const s = String(l ?? "");
          return s.length > 28 ? s.slice(0, 28) + "…" : s;
        }),
        tooltipLabels = fullLabels || labels;
      CHARTS[id] = new Chart(document.getElementById(id), {
        type: "bar",
        data: {
          labels: displayLabels,
          datasets: [
            {
              label: "",
              data: values,
              backgroundColor: colors,
              borderColor: colors.map((c) => String(c).replace("BB", "FF")),
              borderWidth: 1,
              borderRadius: 7,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: !0,
          maintainAspectRatio: !1,
          layout: { padding: { top: 8, right: 18, bottom: 8, left: 10 } },
          plugins: {
            legend: { display: !1 },
            tooltip: {
              mode: "nearest",
              intersect: !0,
              callbacks: {
                title: (ctx) =>
                  String(tooltipLabels[ctx[0].dataIndex] ?? ctx[0].label ?? "") || "—",
                label: (ctx) => `  ${maxVal ? `${ctx.raw}%` : formatNumber(ctx.raw)}`,
              },
            },
          },
          scales: {
            x: {
              beginAtZero: !0,
              max: maxVal || void 0,
              grid: { color: "rgba(168,195,214,.22)" },
              title: { display: !!maxVal, text: maxVal ? "درجة FCA (%)" : "" },
              ticks: {
                color: "#6B8795",
                padding: 6,
                callback: (v) => (maxVal ? `${v}%` : formatNumber(v)),
              },
            },
            y: {
              grid: { color: "rgba(168,195,214,.08)" },
              ticks: { color: "#6B8795", font: { size: 10 }, maxRotation: 0, padding: 6 },
              afterFit: (s) => {
                s.width = Math.max(s.width, 220);
              },
            },
          },
          onHover: (event, elements) => {
            event.native.target.style.cursor = elements.length ? "pointer" : "default";
          },
        },
      });
    }),
    (window.makeVBar = function (id, labels, datasets, xTitle, yTitle) {
      killChart(id);
      // 🛡️ تنظيف شامل: نمنع وصول undefined/null/NaN لأي تسمية أو قيمة على المحاور
      const { labels: cleanLabels, datasets: cleanDatasets } = normalizeChartData(labels, datasets);
      if (!cleanLabels.length || !cleanDatasets.length) {
        renderEmptyState(document.getElementById(id)?.closest(".chart-box") || document.getElementById(id), "لا توجد بيانات متاحة");
        return;
      }
      const fullLabels = cleanLabels,
        displayLabels = cleanLabels.map((l) => (l.length > 16 ? l.slice(0, 16) + "…" : l));
      CHARTS[id] = new Chart(document.getElementById(id), {
        type: "bar",
        data: { labels: displayLabels, datasets: cleanDatasets },
        options: enhanceChartScales(
          {
            plugins: {
              legend: { position: "top" },
              tooltip: {
                callbacks: {
                  title: (ctx) => sanitizeText(fullLabels[ctx[0].dataIndex] ?? ctx[0].label, "—"),
                },
              },
            },
            scales: {
              x: { ticks: { font: { size: 10 }, maxRotation: 30, callback: safeTickCallback } },
              y: { beginAtZero: !0, ticks: { font: { size: 10 }, callback: safeTickCallback } },
            },
          },
          xTitle || "الفئات",
          yTitle || "القيمة",
          !1,
        ),
      });
    }),
    "loading" === document.readyState
      ? document.addEventListener("DOMContentLoaded", bootEnhancements)
      : bootEnhancements());
})();


/* ╔════════════════════════════════════════════════════════════╗
   ║  🛗  JS تبويب: المصاعد
   ║  (tab-elevators) — الدوال الخاصة بهذا التبويب تبدأ هنا
   ╚════════════════════════════════════════════════════════════╝ */
window.renderElevatorsTab = function () {
  const el = document.getElementById("elevators-content");
  if (!el) return;

  const rows = window.RAW_ELEVATORS || [];
  if (!rows.length) {
    el.innerHTML =
      '<div class="empty-msg">لم يتم التحميل</div>';
    return;
  }

  /* ─── إصلاح أسماء الأعمدة: CSV يستخدم اسم_المدرسة/المدينة_الرئيسية/رقم_وزاري ─── */
  const gv = (r, keys) => {
    for (const k of keys) {
      const v = r[k];
      if (v != null && v !== "" && v !== "—") return v;
    }
    return "—";
  };

  const getCity = (r) => gv(r, ["المدينة_الرئيسية", "المدينة"]);
  const getName = (r) => gv(r, ["اسم_المدرسة", "اسم المدرسة"]);
  const getMinId = (r) => gv(r, ["رقم_وزاري", "الرقم الوزاري"]);
  const getAge = (r) => gv(r, ["عمر المصعد"]);
  const getCount = (r) => gv(r, ["عدد المصاعد بالمبنى"]);
  const getType = (r) => {
    for (const k of Object.keys(r)) {
      if (k.includes("نوع المصاعد") || k.includes("المُصنع")) return r[k] || "—";
    }
    return "—";
  };
  const getStatus = (r) => gv(r, ["حالة المصعد"]);
  const num = (v) => (v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));
  const norm = (v) => String(v == null ? "" : v).trim();

  const cities = [...new Set(rows.map((r) => norm(getCity(r))).filter((v) => v && v !== "—"))].sort(
    (a, b) => a.localeCompare(b, "ar"),
  );

  window._elevatorsCityFilter = window._elevatorsCityFilter || "";
  const selectedCity = window._elevatorsCityFilter;
  const filteredRows = selectedCity ? rows.filter((r) => norm(getCity(r)) === selectedCity) : rows;

  const totalSchools = new Set(filteredRows.map((r) => getName(r)).filter((v) => v && v !== "—"))
    .size;
  const totalElevators = filteredRows.reduce((s, r) => s + (num(getCount(r)) || 0), 0);
  const ages = filteredRows.map((r) => num(getAge(r))).filter((v) => Number.isFinite(v));
  const avgAge = ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : null;
  const broken = filteredRows.filter((r) => {
    const s = String(getStatus(r) || "").trim();
    return s.length > 1 && (s.includes("متعطل") || s.includes("لا يعمل"));
  }).length;
  const working = filteredRows.filter((r) => {
    const s = String(getStatus(r) || "").trim();
    return s.length > 1 && s.includes("يعمل") && !s.includes("لا يعمل");
  }).length;
  const empty = filteredRows.filter((r) => {
    const s = String(getStatus(r) || "").trim();
    return s.length > 1 && s.includes("مخلى");
  }).length;

  const statusColor = (status) => {
    const s = String(status || "").trim();
    return s && s !== "—"
      ? s.includes("متعطل") || s.includes("لا يعمل")
        ? "#DC2626"
        : s.includes("يعمل")
          ? "#059669"
          : s.includes("مخلى")
            ? "#94A3B8"
            : s.includes("صيانة")
              ? "#D97706"
              : "#0891B2"
      : "#6B7280";
  };

  const cityOptions = ['<option value="">الكل</option>']
    .concat(
      cities.map(
        (c) =>
          `<option value="${esc(c)}"${c === selectedCity ? " selected" : ""}>${esc(c)}</option>`,
      ),
    )
    .join("");

  el.innerHTML = `
    <div class="filters-row" style="margin-bottom:16px">
      <div class="fg" style="min-width:220px">
        <div class="fg-lbl">المدينة</div>
        <select class="fsel" id="elev-city-filter" onchange="window._elevatorsCityFilter=this.value;renderElevatorsTab()">
          ${cityOptions}
        </select>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi kc-blue">
        <div class="kpi-val">${totalSchools.toLocaleString("en-US")}</div>
        <div class="kpi-lbl">المدارس</div>
        <div class="kpi-sub">مدرسة تحتوي على بيانات مصاعد</div>
      </div>
      <div class="kpi kc-navy">
        <div class="kpi-val">${totalElevators.toLocaleString("en-US")}</div>
        <div class="kpi-lbl">إجمالي المصاعد</div>
        <div class="kpi-sub">مجموع عدد المصاعد بالمباني</div>
      </div>
      <div class="kpi kc-green">
        <div class="kpi-val">${working.toLocaleString("en-US")}</div>
        <div class="kpi-lbl">يعمل بشكل طبيعي</div>
        <div class="kpi-sub">${avgAge == null ? "—" : avgAge.toFixed(1)} سنة متوسط العمر</div>
      </div>
      <div class="kpi kc-red">
        <div class="kpi-val">${broken.toLocaleString("en-US")}</div>
        <div class="kpi-lbl">متعطل / لا يعمل</div>
        <div class="kpi-sub">${empty > 0 ? empty + " مبنى مخلى" : ""}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">
        تفاصيل المصاعد
        <span class="sub">${filteredRows.length.toLocaleString("en-US")} صف</span>
      </div>
      <div class="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>المدينة</th>
              <th>اسم المدرسة</th>
              <th>الرقم الوزاري</th>
              <th>عمر المصعد</th>
              <th>عدد المصاعد بالمبنى</th>
              <th>نوع المصاعد (المُصنع)</th>
              <th>حالة المصعد</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRows
              .map((r) => {
                const st = getStatus(r);
                return `
              <tr>
                <td>${getCity(r)}</td>
                <td style="text-align:right">${getName(r)}</td>
                <td>${getMinId(r)}</td>
                <td>${getAge(r)}</td>
                <td>${getCount(r)}</td>
                <td>${getType(r)}</td>
                <td><span class="badge" style="background:${statusColor(st)}18;color:${statusColor(st)};border:1px solid ${statusColor(st)}33">${st || "—"}</span></td>
              </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
};


(function () {
  /* === تبويب التكلفة — جلب البيانات من الشيت الخاص بالتكلفة === */
  const COST_URL =
    "https://script.google.com/macros/s/AKfycbweVcD1cOAqFa6nkt9555c1kOyATcU6t_UWHGmySeOENb4y8XfmVbl9juXgRtqp2uEdeA/exec";
  const state = window.RAW_COST_STATE = {
    loaded: false,
    loading: false,
    error: "",
    rows: [],
    schools: [],
    filteredRows: [],
    filteredSchools: [],
    cities: new Set(),
    categories: new Set(),
    search: "",
    city: "",
    category: "",
    sort: "qty_desc",
  };
  const charts = {};
  const $ = (id) => document.getElementById(id);

  function esc(v) {
    return String(v ?? "").replace(
      /[&<>"']/g,
      (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m],
    );
  }
  function clean(v) {
    if (v === null || v === undefined) return "";
    return String(v).trim().replace(/\s+/g, " ");
  }
  function num(v) {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(String(v).replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }
  function fmt(n, d = 0) {
    if (n === null || n === undefined || !Number.isFinite(Number(n))) return "—";
    return Number(n).toLocaleString("en-US", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
  }
  function fmtSAR(v) {
    if (v === null || v === undefined || !Number.isFinite(Number(v))) return "—";
    const n = Number(v);
    return (
      n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " ر.س"
    );
  }
  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
  }
  function showToast(msg, type = "info") {
    const el = $("cost-toast");
    if (!el) return;
    const styles = {
      ok: { bg: "#ECFDF5", bd: "#A7F3D0", tx: "#065F46" },
      err: { bg: "#FEF2F2", bd: "#FECACA", tx: "#991B1B" },
      info: { bg: "#ECFEFF", bd: "#A5F3FC", tx: "#0E7490" },
    };
    const s = styles[type] || styles.info;
    el.innerHTML =
      '<div style="padding:10px 14px;border-radius:12px;display:inline-flex;align-items:center;gap:8px;background:' +
      s.bg +
      ";border:1px solid " +
      s.bd +
      ";color:" +
      s.tx +
      ';font-size:12px;font-weight:700">' +
      esc(msg) +
      "</div>";
    if (type === "ok")
      setTimeout(() => {
        if (el) el.innerHTML = "";
      }, 3500);
  }
  function setStatus(kind) {
    const dot = $("cost-status-dot");
    if (!dot) return;
    dot.style.background = kind === "live" ? "#059669" : kind === "loading" ? "#D97706" : "#DC2626";
  }
  function destroyChart(id) {
    if (charts[id]) {
      try {
        charts[id].destroy();
      } catch (e) {}
      delete charts[id];
    }
  }
  function normalizeRows(payload) {
    const rows = Array.isArray(payload)
      ? payload
      : payload && Array.isArray(payload.data)
        ? payload.data
        : [];
    const HEADER_VALUES = new Set([
      "school id",
      "school name",
      "city",
      "sr",
      "category",
      "sub category",
      "quantity",
      "link",
      "unit measure",
      "unit price",
      "total price",
      "cons rate",
    ]);
    return rows
      .filter((r) => r && typeof r === "object")
      .map((r) => ({
        schoolId: clean(r["School ID"] ?? r.schoolId ?? r.school_id),
        schoolName: clean(r["School Name"] ?? r.schoolName ?? r.school_name),
        city: clean(r["City"] ?? r.city),
        sr: clean(r["SR"] ?? r.sr),
        category: clean(r["Category"] ?? r.category),
        subCategory: clean(r["Sub Category"] ?? r.subCategory ?? r.sub_category),
        quantity: num(r["Quantity"] ?? r.quantity),
        link: clean(r["Link"] ?? r.link),
        unitMeasure: clean(r["Unit Measure"] ?? r.unitMeasure ?? r.unit_measure),
        unitPrice: num(r["Unit Price"] ?? r.unitPrice ?? r.unit_price),
        totalPrice: num(r["Total Price"] ?? r.totalPrice ?? r.total_price),
        consRate: num(r["CONS Rate"] ?? r.consRate ?? r.cons_rate),
      }))
      .filter((r) => {
        if (!r.schoolId && !r.schoolName && !r.city && !r.category && !r.subCategory) return false;
        // تجاهل صف رؤوس الأعمدة
        const nameVal = (r.schoolName || r.schoolId || r.category || "").toLowerCase().trim();
        if (HEADER_VALUES.has(nameVal)) return false;
        return true;
      });
  }
  function schoolKey(r) {
    if (r.schoolId) return "id:" + r.schoolId;
    return "nm:" + r.schoolName + "|" + r.city;
  }
  function groupData(rows) {
    const schoolsMap = new Map();
    const catMap = new Map();
    const subMap = new Map();
    const cityMap = new Map();

    let totalQty = 0;
    let totalPrice = 0;
    let totalUnitWeighted = 0;
    let unitWeight = 0;
    const categoriesSet = new Set();
    const subCategoriesSet = new Set();

    rows.forEach((r) => {
      const q = Number.isFinite(r.quantity) ? r.quantity : 0;
      const tp = Number.isFinite(r.totalPrice)
        ? r.totalPrice
        : Number.isFinite(r.unitPrice) && Number.isFinite(r.quantity)
          ? r.unitPrice * r.quantity
          : 0;
      totalQty += q;
      totalPrice += tp;
      if (Number.isFinite(r.unitPrice) && r.unitPrice > 0) {
        totalUnitWeighted += r.unitPrice * (q > 0 ? q : 1);
        unitWeight += q > 0 ? q : 1;
      }

      const c = r.category || "—";
      const s = r.subCategory || "—";
      const city = r.city || "—";
      categoriesSet.add(c);
      if (c !== "—") {
        if (!catMap.has(c))
          catMap.set(c, { qty: 0, price: 0, schools: new Set(), subs: new Set() });
        const cc = catMap.get(c);
        cc.qty += q;
        cc.price += tp;
        cc.schools.add(schoolKey(r));
        if (s !== "—") cc.subs.add(s);
      }
      if (s !== "—") {
        subCategoriesSet.add(s);
        if (!subMap.has(s)) subMap.set(s, { qty: 0, price: 0, schools: new Set(), category: c });
        const ss = subMap.get(s);
        ss.qty += q;
        ss.price += tp;
        ss.schools.add(schoolKey(r));
      }
      if (city !== "—") {
        if (!cityMap.has(city)) cityMap.set(city, { qty: 0, price: 0, schools: new Set() });
        const cm = cityMap.get(city);
        cm.qty += q;
        cm.price += tp;
        cm.schools.add(schoolKey(r));
      }

      const k = schoolKey(r);
      if (!schoolsMap.has(k)) {
        schoolsMap.set(k, {
          key: k,
          schoolId: r.schoolId || "—",
          schoolName: r.schoolName || "—",
          city: r.city || "—",
          rows: 0,
          categories: new Set(),
          subCategories: new Set(),
          qty: 0,
          price: 0,
          hasQty: false,
          avgUnit: null,
        });
      }
      const sh = schoolsMap.get(k);
      sh.rows += 1;
      sh.qty += q;
      sh.price += tp;
      if (q > 0) sh.hasQty = true;
      if (c !== "—") sh.categories.add(c);
      if (s !== "—") sh.subCategories.add(s);
    });

    const schools = [...schoolsMap.values()].map((s) => ({
      ...s,
      categoryCount: s.categories.size,
      subCategoryCount: s.subCategories.size,
      avgUnit: s.qty > 0 ? s.price / s.qty : null,
    }));

    return {
      schools,
      totalQty,
      totalPrice,
      avgUnit: totalQty > 0 ? totalPrice / totalQty : null,
      categoriesCount: [...categoriesSet].filter((v) => v && v !== "—").length,
      subCategoriesCount: subCategoriesSet.size,
      catMap,
      subMap,
      cityMap,
    };
  }
  function applyFilters() {
    const q = clean(state.search).toLowerCase();
    const filtered = state.rows.filter((r) => {
      if (state.city && r.city !== state.city) return false;
      if (state.category && r.category !== state.category) return false;
      if (q) {
        const hay = [r.schoolName, r.schoolId, r.city, r.category, r.subCategory, r.sr]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    state.filteredRows = filtered;
    const grouped = groupData(filtered);
    state.filteredSchools = grouped.schools.slice();
    sortSchools();
    renderAll(grouped);
  }
  function sortSchools() {
    const arr = state.filteredSchools;
    arr.sort((a, b) => {
      if (state.sort === "qty_asc") return (a.qty || 0) - (b.qty || 0);
      if (state.sort === "price_desc") return (b.price || 0) - (a.price || 0);
      if (state.sort === "price_asc") return (a.price || 0) - (b.price || 0);
      if (state.sort === "school")
        return (a.schoolName || "").localeCompare(b.schoolName || "", "ar");
      return (b.qty || 0) - (a.qty || 0);
    });
  }
  function buildOptions(elId, values, current) {
    const el = $(elId);
    if (!el) return;
    const unique = [...new Set(values.filter((v) => v && v !== "—"))].sort((a, b) =>
      a.localeCompare(b, "ar"),
    );
    const labelAll = "الكل";
    el.innerHTML =
      '<option value="">' +
      labelAll +
      "</option>" +
      unique.map((v) => '<option value="' + esc(v) + '">' + esc(v) + "</option>").join("");
    el.value = current || "";
  }
  function renderSummary(meta) {
    const schoolsCount = meta.schools.length;
    const withQty = meta.schools.filter((s) => s.qty > 0).length;
    const withoutQty = schoolsCount - withQty;
    setText("cost-k-categories", fmt(meta.categoriesCount));
    setText("cost-k-subcats", fmt(meta.subCategoriesCount));
    setText("cost-k-qty", fmt(meta.totalQty, 0));
    setText("cost-k-schools", fmt(schoolsCount));
    setText("cost-k-withqty", fmt(withQty));
    setText("cost-k-withoutqty", fmt(withoutQty));
    setText("cost-k-totalprice", fmtSAR(meta.totalPrice));
    setText("cost-k-avgunit", meta.avgUnit == null ? "—" : meta.avgUnit.toFixed(2));

    const schoolsKey = meta.schools.length ? meta.schools : [];
    const maxSchool = schoolsKey.slice().sort((a, b) => (b.price || 0) - (a.price || 0))[0];
    const totalPrice = meta.totalPrice;
    const totalQty = meta.totalQty;
    setText("cost-subtitle", "All Cities · Complete Data");
    setText(
      "cost-meta-line",
      "إجمالي القيمة: " +
        fmtSAR(totalPrice) +
        " · متوسط الوحدة: " +
        (meta.avgUnit == null ? "—" : meta.avgUnit.toFixed(2)),
    );
    setText(
      "cost-school-top",
      maxSchool ? maxSchool.schoolName + " · " + fmtSAR(maxSchool.price) : "—",
    );
  }
  function renderCharts(meta) {
    const topCats = [...meta.catMap.entries()]
      .map(([k, v]) => ({
        key: k,
        qty: v.qty,
        price: v.price,
        schools: v.schools.size,
        subcats: v.subs.size,
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 12);

    const topCities = [...meta.cityMap.entries()]
      .map(([k, v]) => ({ key: k, qty: v.qty, price: v.price, schools: v.schools.size }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 12);

    const topSubs = [...meta.subMap.entries()]
      .map(([k, v]) => ({
        key: k,
        qty: v.qty,
        price: v.price,
        schools: v.schools.size,
        category: v.category,
      }))
      .sort((a, b) => b.price - a.price)
      .slice(0, 12);

    const topSchools = meta.schools
      .slice()
      .sort((a, b) => (b.price || 0) - (a.price || 0))
      .slice(0, 12);

    const barBase = [
      "#083D4F",
      "#0891B2",
      "#059669",
      "#D97706",
      "#7C3AED",
      "#DC2626",
      "#0E7490",
      "#B8860B",
      "#1D4ED8",
      "#9333EA",
      "#0F766E",
      "#C2410C",
    ];

    destroyChart("cost-chart-categories");
    destroyChart("cost-chart-cities");
    destroyChart("cost-chart-subcats");
    destroyChart("cost-chart-schools");

    const c1 = $("cost-chart-categories");
    if (c1 && topCats.length) {
      charts["cost-chart-categories"] = new Chart(c1, {
        type: "bar",
        data: {
          labels: topCats.map((x) => (x.key.length > 22 ? x.key.slice(0, 22) + "…" : x.key)),
          datasets: [
            {
              label: "الكمية",
              data: topCats.map((x) => x.qty),
              backgroundColor: barBase.map((c) => c + "BB").slice(0, topCats.length),
              borderColor: barBase.slice(0, topCats.length),
              borderWidth: 1,
              borderRadius: 6,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { ticks: { font: { size: 10 } } }, y: { beginAtZero: true } },
        },
      });
    }

    const c2 = $("cost-chart-cities");
    if (c2 && topCities.length) {
      charts["cost-chart-cities"] = new Chart(c2, {
        type: "bar",
        data: {
          labels: topCities.map((x) => x.key),
          datasets: [
            {
              label: "إجمالي التكلفة",
              data: topCities.map((x) => x.price),
              backgroundColor: barBase.map((c) => c + "AA").slice(0, topCities.length),
              borderColor: barBase.slice(0, topCities.length),
              borderWidth: 1,
              borderRadius: 6,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { ticks: { font: { size: 10 } } }, y: { beginAtZero: true } },
        },
      });
    }

    const c3 = $("cost-chart-subcats");
    if (c3 && topSubs.length) {
      charts["cost-chart-subcats"] = new Chart(c3, {
        type: "doughnut",
        data: {
          labels: topSubs.map((x) => (x.key.length > 18 ? x.key.slice(0, 18) + "…" : x.key)),
          datasets: [
            {
              data: topSubs.map((x) => x.price),
              backgroundColor: barBase.map((c) => c + "CC").slice(0, topSubs.length),
              borderWidth: 2,
              borderColor: "#fff",
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom", labels: { font: { size: 10 } } } },
        },
      });
    }

    const c4 = $("cost-chart-schools");
    if (c4 && topSchools.length) {
      charts["cost-chart-schools"] = new Chart(c4, {
        type: "bar",
        data: {
          labels: topSchools.map((x) =>
            (x.schoolName || "—").length > 22
              ? (x.schoolName || "—").slice(0, 22) + "…"
              : x.schoolName || "—",
          ),
          datasets: [
            {
              label: "إجمالي التكلفة",
              data: topSchools.map((x) => x.price),
              backgroundColor: barBase.map((c) => c + "BB").slice(0, topSchools.length),
              borderColor: barBase.slice(0, topSchools.length),
              borderWidth: 1,
              borderRadius: 6,
            },
          ],
        },
        options: {
          indexAxis: "y",
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true }, y: { ticks: { font: { size: 10 } } } },
        },
      });
    }
  }
  function renderTables(meta) {
    const schoolTbody = $("cost-school-tbody");
    if (schoolTbody) {
      schoolTbody.innerHTML = state.filteredSchools
        .filter((s) => s.price > 0)
        .map(
          (s, i) => `
        <tr>
          <td style="padding:10px 8px;text-align:center;color:var(--tx-muted);font-size:11px">${i + 1}</td>
          <td style="padding:10px 12px;text-align:right;font-weight:700">${esc(s.schoolName)}</td>
          <td style="padding:10px 12px;text-align:center">${esc(s.city)}</td>
          <td style="padding:10px 12px;text-align:center">${fmt(s.categoryCount)}</td>
          <td style="padding:10px 12px;text-align:center">${fmt(s.subCategoryCount)}</td>
          <td style="padding:10px 12px;text-align:center;font-weight:800">${fmt(s.qty, 0)}</td>
          <td style="padding:10px 12px;text-align:center;font-weight:800;color:#B8860B">${fmtSAR(s.price)}</td>
          <td style="padding:10px 12px;text-align:center;font-weight:800;color:#0891B2">${s.avgUnit == null ? "—" : s.avgUnit.toFixed(2)}</td>
        </tr>
      `,
        )
        .join("");
      setText("cost-school-count", fmt(state.filteredSchools.filter((s) => s.price > 0).length));
    }

    const catBody = $("cost-cat-tbody");
    if (catBody) {
      const cats = [...meta.catMap.entries()]
        .map(([k, v]) => ({
          key: k,
          qty: v.qty,
          price: v.price,
          schools: v.schools.size,
          subcats: v.subs.size,
        }))
        .sort((a, b) => b.qty - a.qty);
      catBody.innerHTML = cats
        .map(
          (c, i) => `
        <tr>
          <td style="padding:10px 8px;text-align:center;color:var(--tx-muted);font-size:11px">${i + 1}</td>
          <td style="padding:10px 12px;text-align:right;font-weight:700">${esc(c.key)}</td>
          <td style="padding:10px 12px;text-align:center">${fmt(c.schools)}</td>
          <td style="padding:10px 12px;text-align:center">${fmt(c.subcats)}</td>
          <td style="padding:10px 12px;text-align:center;font-weight:800">${fmt(c.qty, 0)}</td>
          <td style="padding:10px 12px;text-align:center;font-weight:800;color:#B8860B">${fmtSAR(c.price)}</td>
        </tr>
      `,
        )
        .join("");
      setText("cost-cat-count", fmt(cats.length));
    }
  }
  function renderFilters(meta) {
    buildOptions(
      "cost-city-filter",
      state.rows.map((r) => r.city),
      state.city,
    );
    buildOptions(
      "cost-cat-filter",
      state.rows.map((r) => r.category),
      state.category,
    );
    const searchEl = $("cost-search");
    const cityEl = $("cost-city-filter");
    const catEl = $("cost-cat-filter");
    if (searchEl) searchEl.value = state.search;
    if (cityEl) cityEl.value = state.city;
    if (catEl) catEl.value = state.category;
  }
  function renderAll(meta) {
    renderSummary(meta);
    renderFilters(meta);
    renderCharts(meta);
    renderTables(meta);
    setStatus("live");
    const last = $("cost-last-update");
    if (last)
      last.textContent =
        "آخر تحديث: " +
        new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    const body = $("cost-body");
    const empty = $("cost-empty");
    const skeleton = $("cost-skeleton");
    if (skeleton) skeleton.style.display = "none";
    if (body) body.style.display = "block";
    if (empty) empty.style.display = meta.schools.length ? "none" : "block";
    if (state.error) {
      const msg = $("cost-error");
      if (msg) msg.textContent = "";
    }
  }
  async function loadData(silent = false) {
    if (state.loading) return;
    state.loading = true;
    state.error = "";
    setStatus("loading");
    const reloadBtn = $("cost-reload-btn");
    if (reloadBtn) {
      reloadBtn.disabled = true;
      reloadBtn.textContent = "جاري التحميل...";
    }
    const skeleton = $("cost-skeleton");
    const body = $("cost-body");
    const empty = $("cost-empty");
    if (skeleton) skeleton.style.display = "block";
    if (body) body.style.display = "none";
    if (empty) empty.style.display = "none";
    if (!silent) showToast("جاري تحميل بيانات التكلفة...", "info");
    try {
      const resp = await fetch(COST_URL, { cache: "no-store", mode: "cors" });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const text = await resp.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        throw new Error("تعذر قراءة JSON");
      }
      const rows = normalizeRows(json);
      state.rows = rows;
      const meta = groupData(rows);
      state.schools = meta.schools;
      state.loaded = true;
      if (!silent) showToast("تم تحميل البيانات بنجاح", "ok");
      applyFilters();
    } catch (err) {
      state.error = err && err.message ? err.message : "فشل التحميل";
      setStatus("error");
      showToast("لم يتم التحميل", "err");
      console.error("[cost]", err);
      if (empty) empty.style.display = "block";
      if (body) body.style.display = "none";
      const errBox = $("cost-error");
      if (errBox) errBox.textContent = "خطأ: " + state.error;
    } finally {
      state.loading = false;
      if (reloadBtn) {
        reloadBtn.disabled = false;
        reloadBtn.textContent = "↻ تحديث";
      }
    }
  }

  function buildMarkup() {
    const host = $("an-dash");
    if (!host) return;
    host.innerHTML = `
        <div id="cost-toast" style="min-height:40px;margin-bottom:10px"></div>

        <div class="card mb14" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:16px 18px">
          <div class="card-title" style="margin:0;padding:0;border:0">
            <span class="card-title-icon" style="background:#ECFEFF;color:#0891B2">💰</span>
            <span>تحليل التكلفة</span>
            <span id="cost-status-dot" class="dot loading"></span>
            <span id="cost-subtitle" class="sub">All Cities · Complete Data</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <span id="cost-last-update" style="font-size:10px;color:var(--tx-muted)"></span>
            <button id="cost-reload-btn" class="f-clear" onclick="window.costReload && window.costReload()">↻ تحديث</button>
          </div>
        </div>

        <div id="cost-skeleton" style="display:none;margin-bottom:14px">
          <div class="kpi-grid">
            ${Array.from({ length: 8 })
              .map(
                () =>
                  '<div style="height:112px;border-radius:20px;background:linear-gradient(90deg,#edf4f8 25%,#f7fbfd 50%,#edf4f8 75%);background-size:200% 100%;animation:costPulse 1.2s infinite"></div>',
              )
              .join("")}
          </div>
          <style>@keyframes costPulse{0%{background-position:200% 0}100%{background-position:-200% 0}}</style>
        </div>

        <div id="cost-empty" class="card" style="display:none;padding:56px 20px;text-align:center;color:var(--tx-muted);font-size:13px;font-weight:700">
          لا توجد بيانات تكلفة متاحة.
          <div id="cost-error" style="margin-top:8px;font-weight:600;color:#991b1b"></div>
        </div>

        <div id="cost-body" style="display:none">
          <div class="kpi-grid">
            ${[
              ["cost-k-categories", "kc-blue", "Categories", "عدد الفئات"],
              ["cost-k-subcats", "kc-teal", "Sub Categories", "عدد الفئات الفرعية"],
              ["cost-k-qty", "kc-navy", "Total Qty", "إجمالي الكمية"],
              ["cost-k-schools", "kc-green", "Schools", "إجمالي المدارس"],
              ["cost-k-withqty", "kc-green", "With Qty", "مدارس بها كمية"],
              ["cost-k-withoutqty", "kc-red", "Without Qty", "مدارس بدون كمية"],
              ["cost-k-totalprice", "kc-amber", "Total Price", "إجمالي السعر"],
              ["cost-k-avgunit", "kc-purple", "Avg Unit", "متوسط سعر الوحدة"],
            ]
              .map(
                ([id, kc, title, sub]) => `
              <div class="kpi ${kc}">
                <div class="kpi-val" id="${id}">—</div>
                <div class="kpi-lbl">${title}</div>
                <div class="kpi-sub">${sub}</div>
              </div>
            `,
              )
              .join("")}
          </div>

          <div class="g12" style="align-items:start">
            <div class="card" style="position:sticky;top:72px">
              <div class="card-title">
                <span class="card-title-icon" style="background:#EFF6FF;color:#1D4ED8">▤</span>
                <span>الفلاتر</span>
              </div>
              <div style="display:grid;gap:12px">
                <div class="fg">
                  <div class="fg-lbl">بحث</div>
                  <input class="finp" id="cost-search" oninput="window.costSearch && window.costSearch(this.value)" placeholder="🔍 اسم المدرسة / المدينة / الفئة" style="width:100%">
                </div>
                <div class="fg">
                  <div class="fg-lbl">المدينة</div>
                  <select class="fsel" id="cost-city-filter" onchange="window.costCityFilter && window.costCityFilter(this.value)" style="width:100%"></select>
                </div>
                <div class="fg">
                  <div class="fg-lbl">الفئة</div>
                  <select class="fsel" id="cost-cat-filter" onchange="window.costCatFilter && window.costCatFilter(this.value)" style="width:100%"></select>
                </div>
                <div class="fg">
                  <div class="fg-lbl">الترتيب</div>
                  <select class="fsel" id="cost-sort-filter" onchange="window.costSortFilter && window.costSortFilter(this.value)" style="width:100%">
                    <option value="qty_desc">الأعلى كمية</option>
                    <option value="qty_asc">الأقل كمية</option>
                    <option value="price_desc">الأعلى تكلفة</option>
                    <option value="price_asc">الأقل تكلفة</option>
                    <option value="school">اسم المدرسة</option>
                  </select>
                </div>
                <button class="f-clear" onclick="window.costClearFilters && window.costClearFilters()" style="align-self:stretch">✕ مسح الفلاتر</button>
              </div>
              <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--bd-light);font-size:11px;color:var(--tx-muted);line-height:1.8">
                <div>• الاعتماد على ملف التكلفة فقط.</div>
                <div>• التجميع يتم حسب المدرسة ثم الفئة.</div>
              </div>
            </div>

            <div style="display:grid;gap:16px">
              <div class="g2" style="margin-bottom:0">
                <div class="card" style="padding-bottom:14px">
                  <div class="card-title">
                    <span class="card-title-icon" style="background:#ECFEFF;color:#0891B2">▦</span>
                    <span>أكبر الفئات حسب الكمية</span>
                  </div>
                  <div class="chart-box" style="height:320px"><canvas id="cost-chart-categories"></canvas></div>
                </div>
                <div class="card" style="padding-bottom:14px">
                  <div class="card-title">
                    <span class="card-title-icon" style="background:#F0FDF4;color:#059669">▦</span>
                    <span>أكبر المدن حسب التكلفة</span>
                  </div>
                  <div class="chart-box" style="height:320px"><canvas id="cost-chart-cities"></canvas></div>
                </div>
              </div>

              <div class="g2" style="margin-bottom:0">
                <div class="card" style="padding-bottom:14px">
                  <div class="card-title">
                    <span class="card-title-icon" style="background:#FAF5FF;color:#7C3AED">▦</span>
                    <span>أهم الفئات الفرعية حسب التكلفة</span>
                  </div>
                  <div class="chart-box" style="height:320px"><canvas id="cost-chart-subcats"></canvas></div>
                </div>
                <div class="card" style="padding-bottom:14px">
                  <div class="card-title">
                    <span class="card-title-icon" style="background:#FFFBEB;color:#D97706">▦</span>
                    <span>أعلى المدارس تكلفة</span>
                  </div>
                  <div class="chart-box" style="height:320px"><canvas id="cost-chart-schools"></canvas></div>
                </div>
              </div>
            </div>
          </div>

          <div class="card mb14" style="padding:0;overflow:hidden">
            <div class="card-title" style="margin:0;padding:16px 18px;border-bottom:1px solid var(--bd-light)">
              <span class="card-title-icon" style="background:#ECFEFF;color:#0891B2">📋</span>
              <span>تحليل الفئات</span>
              <span class="sub" id="cost-cat-count"></span>
            </div>
            <div class="tbl-wrap" style="max-height:420px;border:0;border-radius:0;box-shadow:none">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th style="text-align:right">الفئة</th>
                    <th>المدارس</th>
                    <th>الفئات الفرعية</th>
                    <th>الكمية</th>
                    <th>إجمالي السعر</th>
                  </tr>
                </thead>
                <tbody id="cost-cat-tbody"></tbody>
              </table>
            </div>
          </div>

          <div class="card" style="padding:0;overflow:hidden">
            <div class="card-title" style="margin:0;padding:16px 18px;border-bottom:1px solid var(--bd-light)">
              <span class="card-title-icon" style="background:#F0FDF4;color:#059669">🏫</span>
              <span>ملخص المدارس</span>
              <span class="sub" id="cost-school-count"></span>
            </div>
            <div class="tbl-wrap" style="max-height:520px;border:0;border-radius:0;box-shadow:none">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th style="text-align:right">المدرسة</th>
                    <th>المدينة</th>
                    <th>الفئات</th>
                    <th>الفئات الفرعية</th>
                    <th>الكمية</th>
                    <th>إجمالي السعر</th>
                    <th>متوسط الوحدة</th>
                  </tr>
                </thead>
                <tbody id="cost-school-tbody"></tbody>
              </table>
            </div>
          </div>
        </div>
    `;

    window.costReload = async function () {
      await loadData(false);
    };
    window.costSearch = function (v) {
      state.search = clean(v);
      applyFilters();
    };
    window.costCityFilter = function (v) {
      state.city = v;
      applyFilters();
    };
    window.costCatFilter = function (v) {
      state.category = v;
      applyFilters();
    };
    window.costSortFilter = function (v) {
      state.sort = v;
      applyFilters();
    };
    window.costClearFilters = function () {
      state.search = "";
      state.city = "";
      state.category = "";
      state.sort = "qty_desc";
      const s = $("cost-search");
      if (s) s.value = "";
      const c = $("cost-city-filter");
      if (c) c.value = "";
      const cat = $("cost-cat-filter");
      if (cat) cat.value = "";
      const so = $("cost-sort-filter");
      if (so) so.value = "qty_desc";
      applyFilters();
    };
  }

  window.renderCostTab = function () {
    buildMarkup();
    if (!state.loaded && !state.loading) {
      loadData(true);
    } else if (state.loaded) {
      applyFilters();
    }
  };
})();


/* ===== شريط التمرير العلوي للجدول التفصيلي ===== */
(function () {
  function initTopScroll() {
    var topBar = document.getElementById("tbl-top-scroll");
    var topInner = document.getElementById("tbl-top-inner");
    var wrap = document.getElementById("tbl-wrap-main");
    if (!topBar || !topInner || !wrap) return;

    function syncWidth() {
      topInner.style.width = wrap.scrollWidth + "px";
    }

    var ticking = false;
    topBar.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          wrap.scrollLeft = topBar.scrollLeft;
          ticking = false;
        });
      }
    });
    wrap.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          topBar.scrollLeft = wrap.scrollLeft;
          ticking = false;
        });
      }
    });

    syncWidth();
    var ro = new ResizeObserver(syncWidth);
    ro.observe(wrap);

    /* إعادة المزامنة عند تغيير البيانات */
    var origRender = window.renderTable;
    if (origRender) {
      window.renderTable = function () {
        origRender.apply(this, arguments);
        setTimeout(syncWidth, 80);
      };
    }
  }

  /* ننتظر اكتمال DOM */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTopScroll);
  } else {
    initTopScroll();
  }
})();


/* ╔════════════════════════════════════════════════════════════╗
   ║  💳  JS تبويب: المدفوعات  (tab-payments)
   ║  المصدر: شيت "المدفوعات" من Google Sheet
   ║  العرض: سمري فقط (KPIs + تقدم لكل عقد + شارت)
   ╚════════════════════════════════════════════════════════════╝ */
(function () {
  "use strict";

  /* ── البيانات تأتي من loadData الرئيسي عبر window.RAW_PAYMENTS ── */
  const $ = (id) => document.getElementById(id);
  const esc = (v) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  function payNum(v) {
    if (v === null || v === undefined || v === "") return 0;
    const n = parseFloat(String(v).replace(/,/g, ""));
    return isNaN(n) ? 0 : n;
  }

  function payFmt(n) {
    if (n === null || n === undefined || isNaN(n)) return "—";
    if (Math.abs(n) >= 1e9)
      return (n / 1e9).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " مليار";
    if (Math.abs(n) >= 1e6)
      return (n / 1e6).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " م";
    return Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " SAR";
  }

  function payFmtFull(n) {
    if (n === null || n === undefined || isNaN(n)) return "—";
    return Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " SAR";
  }

  function payPct(n) {
    if (n === null || n === undefined || isNaN(n)) return "—";
    return (Number(n) * 100 > 1 ? Number(n).toFixed(1) : (Number(n) * 100).toFixed(1) + "%");
  }

  let PAY_CHART = null;

  function killPayChart() {
    if (PAY_CHART) { try { PAY_CHART.destroy(); } catch (e) {} PAY_CHART = null; }
  }

  /* ══════════════════════════════════════
     حساب KPIs من بيانات المدفوعات
     يقبل المصفوفة كاملة أو مصفوفة المناطق فقط (بدون صف TOTAL)
  ══════════════════════════════════════ */
  function calcKPIs(rows) {
    // استخدم صف TOTAL لو موجود (أضمن)، وإلا احسب يدوياً
    const totalRow = rows.find(r =>
      (r["Contract No."] || r["Contract_No"] || "").toString().toUpperCase().trim() === "TOTAL" ||
      (r["Region"] || r["المنطقة"] || "").toString().toUpperCase().trim() === "ALL REGIONS"
    );
    if (totalRow) {
      return {
        baseContract  : payNum(totalRow["Base Contract Value (SAR)"]  || totalRow["Base_Contract_Value_SAR"]  || 0),
        updatedContract: payNum(totalRow["Updated Contract Value (SAR)"] || totalRow["Updated_Contract_Value_SAR"] || 0),
        paid          : payNum(totalRow["Payment Released (SAR)"]     || totalRow["Payment_Released_SAR"]     || 0),
        remaining     : payNum(totalRow["Remaining (SAR)"]            || totalRow["Remaining_SAR"]            || 0),
        kpiDeduction  : payNum(totalRow["KPI Deduction"]              || totalRow["KPI_Deduction"]            || 0),
        totalDeduction: payNum(totalRow["Total Deduction"]            || totalRow["Total_Deduction"]          || 0),
        pct           : payNum(totalRow["% Paid"]                     || totalRow["Pct_Paid"]                 || 0),
      };
    }
    // حساب يدوي من الصفوف (بدون صف TOTAL)
    const dataRows = rows.filter(r => {
      const cn = (r["Contract No."] || r["Contract_No"] || "").toString().toUpperCase().trim();
      return cn !== "TOTAL";
    });
    let base = 0, updated = 0, paid = 0, remaining = 0, kpi = 0, total = 0;
    dataRows.forEach(r => {
      base      += payNum(r["Base Contract Value (SAR)"]  || r["Base_Contract_Value_SAR"]  || 0);
      updated   += payNum(r["Updated Contract Value (SAR)"] || r["Updated_Contract_Value_SAR"] || 0);
      paid      += payNum(r["Payment Released (SAR)"]     || r["Payment_Released_SAR"]     || 0);
      remaining += payNum(r["Remaining (SAR)"]            || r["Remaining_SAR"]            || 0);
      kpi       += payNum(r["KPI Deduction"]              || r["KPI_Deduction"]            || 0);
      total     += payNum(r["Total Deduction"]            || r["Total_Deduction"]          || 0);
    });
    return {
      baseContract: base, updatedContract: updated,
      paid, remaining, kpiDeduction: kpi, totalDeduction: total,
      pct: updated > 0 ? paid / updated : 0,
    };
  }

  /* ══════════════════════════════════════
     نقطة الدخول
  ══════════════════════════════════════ */
  window.paymentsInitTab = function () {
    const rows = Array.isArray(window.RAW_PAYMENTS) ? window.RAW_PAYMENTS : [];
    renderPaymentsTab(rows);
  };

  /* ══════════════════════════════════════
     بناء الواجهة
  ══════════════════════════════════════ */
  function renderPaymentsTab(rows) {
    const el = $("payments-content");
    if (!el) return;

    // الصفوف بدون TOTAL
    const dataRows = rows.filter(r => {
      const cn = (r["Contract No."] || r["Contract_No"] || "").toString().toUpperCase().trim();
      const rg = (r["Region"] || r["المنطقة"] || "").toString().toUpperCase().trim();
      return cn !== "TOTAL" && rg !== "ALL REGIONS";
    });

    if (!rows.length) {
      el.innerHTML = `
        <div class="card" style="text-align:center;padding:56px 24px">
          <div style="font-size:40px;margin-bottom:14px">📊</div>
          <div style="font-size:15px;font-weight:800;color:var(--tx-main);margin-bottom:8px">لا توجد بيانات مدفوعات</div>
          <div style="font-size:12px;color:var(--tx-muted);margin-bottom:18px">
            تأكد من وجود شيت "المدفوعات" في Google Sheet
          </div>
          <button onclick="loadData()" class="f-clear" style="margin:0 auto">🔄 إعادة التحميل</button>
        </div>`;
      return;
    }

    const kpi = calcKPIs(rows);
    const pctNum = kpi.pct <= 1 ? kpi.pct * 100 : kpi.pct; // نسبة مئوية
    const pctColor = pctNum >= 70 ? "#059669" : pctNum >= 40 ? "#D97706" : "#0891B2";

    el.innerHTML = `
    <!-- شريط الحالة -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <span class="dot" style="background:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,.18)"></span>
      <span style="font-size:11px;font-weight:700;color:var(--tx-muted)">البيانات محمّلة — ${dataRows.length} عقد</span>
      <button onclick="loadData()" class="f-clear" style="margin-right:auto;padding:6px 14px;font-size:11px">🔄 تحديث</button>
    </div>

    <!-- بطاقات KPI الرئيسية -->
    <div class="kpi-grid" style="margin-bottom:18px">
      <div class="kpi kc-blue">
        <div class="kpi-icon">💰</div>
        <div class="kpi-val" title="${payFmtFull(kpi.updatedContract)}">${payFmt(kpi.updatedContract)}</div>
        <div class="kpi-lbl">إجمالي قيمة العقود المحدثة</div>
        <div class="kpi-sub" style="font-size:10px;opacity:.7">القيمة الأصلية: ${payFmt(kpi.baseContract)}</div>
      </div>
      <div class="kpi kc-green">
        <div class="kpi-icon">✅</div>
        <div class="kpi-val" title="${payFmtFull(kpi.paid)}">${payFmt(kpi.paid)}</div>
        <div class="kpi-lbl">المدفوعات المصروفة</div>
        <div class="kpi-sub">إجمالي ما تم صرفه</div>
      </div>
      <div class="kpi kc-amber">
        <div class="kpi-icon">⏳</div>
        <div class="kpi-val" title="${payFmtFull(kpi.remaining)}">${payFmt(kpi.remaining)}</div>
        <div class="kpi-lbl">المتبقي</div>
        <div class="kpi-sub">المبلغ المتبقي غير المصروف</div>
      </div>
      <div class="kpi kc-teal">
        <div class="kpi-icon">📊</div>
        <div class="kpi-val" style="color:${pctColor}">${pctNum.toFixed(1)}%</div>
        <div class="kpi-lbl">نسبة الصرف</div>
        <div class="kpi-sub">مدفوعات ÷ قيمة العقد</div>
      </div>
    </div>

    <!-- بطاقتا الخصومات -->
    <div class="g2 mb14">
      <div class="card" style="padding:18px 20px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <span style="font-size:22px">⚠️</span>
          <div>
            <div style="font-size:11px;color:var(--tx-muted);font-weight:700">خصومات KPI</div>
            <div style="font-size:22px;font-weight:900;color:#D97706" title="${payFmtFull(kpi.kpiDeduction)}">${payFmt(kpi.kpiDeduction)}</div>
          </div>
        </div>
        <div style="font-size:10px;color:var(--tx-muted)">خصومات مؤشرات الأداء</div>
      </div>
      <div class="card" style="padding:18px 20px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <span style="font-size:22px">🔻</span>
          <div>
            <div style="font-size:11px;color:var(--tx-muted);font-weight:700">إجمالي الخصومات</div>
            <div style="font-size:22px;font-weight:900;color:#DC2626" title="${payFmtFull(kpi.totalDeduction)}">${payFmt(kpi.totalDeduction)}</div>
          </div>
        </div>
        <div style="font-size:10px;color:var(--tx-muted)">KPI + خصومات أخرى</div>
      </div>
    </div>

    <!-- شريط التقدم الإجمالي -->
    <div class="card mb14" style="padding:20px 22px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:13px;font-weight:800;color:var(--tx-main)">التقدم الإجمالي في الصرف</div>
        <div style="font-size:20px;font-weight:900;color:${pctColor}">${pctNum.toFixed(1)}%</div>
      </div>
      <div style="height:14px;background:var(--bg-deep);border-radius:999px;overflow:hidden;margin-bottom:10px">
        <div style="height:100%;width:${Math.min(pctNum, 100).toFixed(1)}%;background:${pctColor};border-radius:999px;transition:width 1s cubic-bezier(.22,.61,.36,1)"></div>
      </div>
      <div style="display:flex;gap:20px;flex-wrap:wrap;font-size:11px">
        <div><span style="color:var(--tx-muted)">مصروف: </span><strong style="color:#059669">${payFmt(kpi.paid)}</strong></div>
        <div><span style="color:var(--tx-muted)">متبقي: </span><strong style="color:#D97706">${payFmt(kpi.remaining)}</strong></div>
        <div><span style="color:var(--tx-muted)">الإجمالي: </span><strong style="color:var(--tx-main)">${payFmt(kpi.updatedContract)}</strong></div>
      </div>
    </div>

    <!-- تقدم لكل عقد -->
    <div class="card mb14">
      <div class="card-title">
        <span class="card-title-icon" style="background:#ECFEFF;color:#0891B2">📋</span>
        تقدم الصرف لكل عقد
        <span class="sub">${dataRows.length} عقد</span>
      </div>
      <div id="pay-contracts-list" style="display:flex;flex-direction:column;gap:12px"></div>
    </div>

    <!-- شارت مقارنة العقود -->
    <div class="card">
      <div class="card-title">
        <span class="card-title-icon" style="background:#F0FDF4;color:#059669">📈</span>
        مقارنة قيم العقود والمصروف لكل منطقة
      </div>
      <div class="chart-box" style="height:280px"><canvas id="pay-ch-contracts"></canvas></div>
    </div>`;

    // رسم تقدم كل عقد
    renderContractsList(dataRows);

    // رسم الشارت
    renderContractsChart(dataRows);
  }

  /* ══════════════════════════════════════
     تقدم كل عقد
  ══════════════════════════════════════ */
  function renderContractsList(rows) {
    const el = $("pay-contracts-list");
    if (!el) return;
    if (!rows.length) {
      el.innerHTML = '<div class="empty-msg">لا توجد بيانات عقود</div>';
      return;
    }
    el.innerHTML = rows.map(r => {
      const contractNo = r["Contract No."] || r["Contract_No"] || "—";
      const region     = r["Region"]       || r["المنطقة"]    || "—";
      const updated    = payNum(r["Updated Contract Value (SAR)"] || r["Updated_Contract_Value_SAR"] || 0);
      const paid       = payNum(r["Payment Released (SAR)"]       || r["Payment_Released_SAR"]       || 0);
      const remaining  = payNum(r["Remaining (SAR)"]              || r["Remaining_SAR"]              || 0);
      const kpiDed     = payNum(r["KPI Deduction"]                || r["KPI_Deduction"]              || 0);
      const pctRaw     = payNum(r["% Paid"]                       || r["Pct_Paid"]                   || 0);
      const pct        = pctRaw <= 1 ? pctRaw * 100 : pctRaw;
      const pctColor   = pct >= 70 ? "#059669" : pct >= 40 ? "#D97706" : "#0891B2";

      return `
      <div style="background:var(--bg-2);border:1px solid var(--bd-light);border-radius:14px;padding:16px 18px;border-right:3px solid ${pctColor}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:10px">
          <div>
            <div style="font-size:13px;font-weight:800;color:var(--tx-main)">${esc(region)}</div>
            <div style="font-size:11px;color:var(--tx-muted);margin-top:3px;font-family:monospace">${esc(contractNo)}</div>
          </div>
          <div style="text-align:left">
            <div style="font-size:22px;font-weight:900;color:${pctColor}">${pct.toFixed(1)}%</div>
            <div style="font-size:10px;color:var(--tx-muted)">نسبة الصرف</div>
          </div>
        </div>
        <div style="height:10px;background:var(--bg-deep);border-radius:999px;overflow:hidden;margin-bottom:10px">
          <div style="height:100%;width:${Math.min(pct, 100).toFixed(1)}%;background:${pctColor};border-radius:999px;transition:width .9s cubic-bezier(.22,.61,.36,1)"></div>
        </div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:11px">
          <div><span style="color:var(--tx-muted)">القيمة المحدثة: </span><strong style="color:var(--tx-main)" title="${payFmtFull(updated)}">${payFmt(updated)}</strong></div>
          <div><span style="color:var(--tx-muted)">المدفوع: </span><strong style="color:#059669" title="${payFmtFull(paid)}">${payFmt(paid)}</strong></div>
          <div><span style="color:var(--tx-muted)">المتبقي: </span><strong style="color:#D97706" title="${payFmtFull(remaining)}">${payFmt(remaining)}</strong></div>
          ${kpiDed > 0 ? `<div><span style="color:var(--tx-muted)">خصم KPI: </span><strong style="color:#DC2626" title="${payFmtFull(kpiDed)}">${payFmt(kpiDed)}</strong></div>` : ""}
        </div>
      </div>`;
    }).join("");
  }

  /* ══════════════════════════════════════
     شارت مقارنة العقود
  ══════════════════════════════════════ */
  function renderContractsChart(rows) {
    killPayChart();
    const canvas = $("pay-ch-contracts");
    if (!canvas || !rows.length) return;

    const labels   = rows.map(r => r["Region"] || r["المنطقة"] || "—");
    const updated  = rows.map(r => payNum(r["Updated Contract Value (SAR)"] || r["Updated_Contract_Value_SAR"] || 0));
    const paid     = rows.map(r => payNum(r["Payment Released (SAR)"]       || r["Payment_Released_SAR"]       || 0));
    const remaining= rows.map(r => payNum(r["Remaining (SAR)"]              || r["Remaining_SAR"]              || 0));

    PAY_CHART = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "المدفوع", data: paid,      backgroundColor: "#05966988", borderColor: "#059669", borderWidth: 1.5, borderRadius: 4 },
          { label: "المتبقي", data: remaining, backgroundColor: "#D9770644", borderColor: "#D97706", borderWidth: 1.5, borderRadius: 4 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.raw;
                const total = updated[ctx.dataIndex];
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
                return ` ${ctx.dataset.label}: ${(val/1e6).toFixed(1)}م SAR (${pct}%)`;
              },
            },
          },
        },
        scales: {
          x: { stacked: false, ticks: { font: { size: 11 } } },
          y: { beginAtZero: true, ticks: { callback: (v) => (v / 1e6).toFixed(0) + "م" } },
        },
      },
    });
  }

  /* ══════════════════════════════════════
     ربط مع loadData الرئيسي
  ══════════════════════════════════════ */
  const _origLoadData = window.loadData;
  if (typeof _origLoadData === "function") {
    window.loadData = async function (silent) {
      await _origLoadData.apply(this, arguments);
      const tabPanel = document.getElementById("tab-payments");
      if (tabPanel && tabPanel.classList.contains("active")) {
        paymentsInitTab();
      }
    };
  }
})();



/* ══════════════════════════════════════════════════════════════
   تبويب خنادق الصرف — عرض متكامل بناءً على بيانات المدن
   ══════════════════════════════════════════════════════════════ */

/* ╔════════════════════════════════════════════════════════════╗
   ║  🌊  JS تبويب: خنادق الصرف
   ║  (tab-khanadeq) — الدوال الخاصة بهذا التبويب تبدأ هنا
   ╚════════════════════════════════════════════════════════════╝ */
function renderKhanadeqTab() {
  const el = document.getElementById("khanadeq-content");
  if (!el) return;

  // ══════════════════════════════════════════════════════
  // 🔧 عدّل أرقام khanadeq هنا — عدد المدارس من الملخص
  // ══════════════════════════════════════════════════════
  const cityData = window.RAW_KHANADEQ_CITY_DATA = [
    { city: "مكة", schools: 46, khanadeq: 46 },
    { city: "جدة", schools: 161, khanadeq: 161 },
    { city: "الطائف", schools: 528, khanadeq: 528 },
    { city: "المدينة", schools: 142, khanadeq: 142 },
    { city: "العلا", schools: 73, khanadeq: 73 },
    { city: "ينبع", schools: 178, khanadeq: 178 },
    { city: "المهد", schools: 86, khanadeq: 86 },
    { city: "الليث", schools: 157, khanadeq: 157 },
    { city: "القنفذة", schools: 261, khanadeq: 261 },
    // الإجمالي: 1,632 مدرسة = 1,632 خندق — عدّل khanadeq لكل مدينة لو تغير
  ];
  // ══════════════════════════════════════════════════════

  const totalSchools = cityData.reduce((s, r) => s + r.schools, 0);
  const totalKhanadeq = cityData.reduce((s, r) => s + (r.khanadeq || 0), 0);
  const citiesWithData = cityData.filter((r) => r.khanadeq > 0).length;
  const avgPerSchool =
    totalKhanadeq > 0 && totalSchools > 0 ? (totalKhanadeq / totalSchools).toFixed(2) : "—";
  const maxCity = cityData.length
    ? cityData.reduce((mx, r) => (r.khanadeq > mx.khanadeq ? r : mx), cityData[0])
    : null;

  // ── ألوان المدن ──
  const CITY_COLORS = [
    "#083D4F",
    "#0891B2",
    "#059669",
    "#D97706",
    "#7C3AED",
    "#0E7490",
    "#DC2626",
    "#B8860B",
    "#1D4ED8",
  ];

  // ── نسب الخنادق لكل مدرسة ──
  const ratios = cityData.map((r) => ({
    ...r,
    ratio: r.schools > 0 ? +(r.khanadeq / r.schools).toFixed(2) : 0,
  }));

  el.innerHTML = `
  <!-- ── KPIs ── -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px">
    <div class="card" style="border-top:3px solid #7C3AED">
      <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;letter-spacing:.04em">إجمالي المدارس</div>
      <div style="font-size:28px;font-weight:800;color:#7C3AED">${totalSchools.toLocaleString()}</div>
      <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">في ${cityData.length} مدن</div>
    </div>
    <div class="card" style="border-top:3px solid #0891B2">
      <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;letter-spacing:.04em">إجمالي خنادق الصرف</div>
      <div style="font-size:28px;font-weight:800;color:#0891B2">${totalKhanadeq > 0 ? totalKhanadeq.toLocaleString() : "—"}</div>
      <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">${citiesWithData > 0 ? citiesWithData + " مدن لها بيانات" : "أدخل الأرقام في الكود"}</div>
    </div>
    <div class="card" style="border-top:3px solid #059669">
      <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;letter-spacing:.04em">متوسط خندق / مدرسة</div>
      <div style="font-size:28px;font-weight:800;color:#059669">${avgPerSchool}</div>
      <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">خندق لكل مدرسة</div>
    </div>
    <div class="card" style="border-top:3px solid #D97706">
      <div style="font-size:10px;color:var(--tx-muted);font-weight:700;margin-bottom:6px;letter-spacing:.04em">أعلى مدينة</div>
      <div style="font-size:28px;font-weight:800;color:#D97706">${maxCity && maxCity.khanadeq > 0 ? maxCity.khanadeq.toLocaleString() : "—"}</div>
      <div style="font-size:10px;color:var(--tx-muted);margin-top:4px">${maxCity && maxCity.khanadeq > 0 ? maxCity.city : "لا توجد بيانات بعد"}</div>
    </div>
  </div>

  <!-- ── مؤشر توجيهي ── -->
  ${
    totalKhanadeq === 0
      ? `
  <div style="background:linear-gradient(135deg,#F5F3FF,#EDE9FE);border:1.5px dashed #7C3AED55;
    border-radius:16px;padding:18px 22px;margin-bottom:16px;display:flex;align-items:center;gap:14px">
    <div style="font-size:28px">⚙️</div>
    <div>
      <div style="font-size:13px;font-weight:800;color:#5B21B6;margin-bottom:4px">أضف بيانات خنادق الصرف</div>
      <div style="font-size:11px;color:#7C3AED;line-height:1.6">
        عدّل قيم <code style="background:#DDD6FE;padding:1px 6px;border-radius:4px">khanadeq</code> في الجزء المخصص داخل الكود<br>
        ابحث عن التعليق: <code style="background:#DDD6FE;padding:1px 6px;border-radius:4px">🔧 بيانات خنادق الصرف — عدّل الأرقام هنا فقط</code>
      </div>
    </div>
  </div>`
      : ""
  }

  <!-- ── جدول المدن ── -->
  <div class="card" style="margin-bottom:16px">
    <div class="card-title">
      <span class="card-title-icon" style="background:#F5F3FF;color:#7C3AED">🕳️</span>
      ملخص خنادق الصرف حسب المدينة
      <span class="sub">${cityData.length} مدينة · ${totalSchools.toLocaleString()} مدرسة</span>
    </div>
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th style="text-align:right;padding-right:18px">المدينة</th>
            <th>عدد المدارس</th>
            <th>خنادق الصرف</th>
            <th>خندق / مدرسة</th>
            <th>نسبة التغطية</th>
            <th>التوزيع</th>
          </tr>
        </thead>
        <tbody>
          ${cityData
            .map((r, i) => {
              const ratio = r.schools > 0 ? (r.khanadeq / r.schools).toFixed(2) : "—";
              const pctOfTotal =
                totalKhanadeq > 0 ? ((r.khanadeq / totalKhanadeq) * 100).toFixed(1) : 0;
              const barW = totalKhanadeq > 0 ? Math.round((r.khanadeq / totalKhanadeq) * 100) : 0;
              const color = CITY_COLORS[i % CITY_COLORS.length];
              return `<tr>
              <td style="text-align:right;padding-right:18px;font-weight:700">${r.city}</td>
              <td style="font-weight:700;color:#083D4F">${r.schools.toLocaleString()}</td>
              <td style="font-weight:800;color:${color};font-size:15px">${r.khanadeq > 0 ? r.khanadeq.toLocaleString() : "—"}</td>
              <td style="font-weight:700;color:#059669">${r.khanadeq > 0 ? ratio : "—"}</td>
              <td style="font-size:11px;color:var(--tx-muted)">${r.khanadeq > 0 ? pctOfTotal + "%" : "—"}</td>
              <td style="min-width:120px">
                <div style="background:#F3F4F6;border-radius:999px;height:8px;overflow:hidden;width:100%">
                  <div style="width:${barW}%;height:100%;background:${color};border-radius:999px;transition:width .6s ease"></div>
                </div>
              </td>
            </tr>`;
            })
            .join("")}
        </tbody>
        <tfoot>
          <tr style="background:#F8FAFC;border-top:2px solid #E0EAF0">
            <td style="text-align:right;padding-right:18px;font-weight:800;color:#083D4F">الإجمالي</td>
            <td style="font-weight:800;color:#083D4F">${totalSchools.toLocaleString()}</td>
            <td style="font-weight:800;color:#7C3AED;font-size:15px">${totalKhanadeq > 0 ? totalKhanadeq.toLocaleString() : "—"}</td>
            <td style="font-weight:800;color:#059669">${avgPerSchool}</td>
            <td style="font-weight:700">100%</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>

  <!-- ── الرسوم البيانية ── -->
  <div class="g2" style="margin-bottom:16px">
    <div class="card">
      <div class="card-title">توزيع خنادق الصرف حسب المدينة</div>
      <div class="chart-box" style="height:340px"><canvas id="ch-kh-city-bar"></canvas></div>
    </div>
    <div class="card">
      <div class="card-title">نسبة خنادق الصرف لكل مدرسة (حسب المدينة)</div>
      <div class="chart-box" style="height:340px"><canvas id="ch-kh-ratio-bar"></canvas></div>
    </div>
  </div>

  <div class="g2" style="margin-bottom:16px">
    <div class="card">
      <div class="card-title">التوزيع النسبي لخنادق الصرف</div>
      <div class="chart-box" style="height:300px"><canvas id="ch-kh-pie"></canvas></div>
    </div>
    <div class="card">
      <div class="card-title">خنادق الصرف مقابل عدد المدارس</div>
      <div class="chart-box" style="height:300px"><canvas id="ch-kh-scatter"></canvas></div>
    </div>
  </div>


  `;

  // رسم الرسوم البيانية
  requestAnimationFrame(() => {
    const labels = cityData.map((r) => r.city);
    const kValues = cityData.map((r) => r.khanadeq);
    const colors = cityData.map((_, i) => CITY_COLORS[i % CITY_COLORS.length]);

    // 1) مخطط الأعمدة - عدد الخنادق
    killChart("ch-kh-city-bar");
    if (document.getElementById("ch-kh-city-bar") && kValues.some((v) => v > 0)) {
      CHARTS["ch-kh-city-bar"] = new Chart(document.getElementById("ch-kh-city-bar"), {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "خنادق الصرف",
              data: kValues,
              backgroundColor: colors.map((c) => c + "99"),
              borderColor: colors,
              borderWidth: 1.5,
              borderRadius: 6,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { font: { size: 10 } } },
            x: { ticks: { font: { size: 11 } } },
          },
        },
      });
    }

    // 2) مخطط النسبة خندق/مدرسة
    killChart("ch-kh-ratio-bar");
    if (document.getElementById("ch-kh-ratio-bar")) {
      const ratioVals = cityData.map((r) =>
        r.schools > 0 ? +(r.khanadeq / r.schools).toFixed(2) : 0,
      );
      CHARTS["ch-kh-ratio-bar"] = new Chart(document.getElementById("ch-kh-ratio-bar"), {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "خندق / مدرسة",
              data: ratioVals,
              backgroundColor: colors.map((c) => c + "88"),
              borderColor: colors,
              borderWidth: 1.5,
              borderRadius: 6,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { font: { size: 10 } } },
            x: { ticks: { font: { size: 11 } } },
          },
        },
      });
    }

    // 3) دائرة التوزيع النسبي
    killChart("ch-kh-pie");
    if (document.getElementById("ch-kh-pie") && kValues.some((v) => v > 0)) {
      CHARTS["ch-kh-pie"] = new Chart(document.getElementById("ch-kh-pie"), {
        type: "doughnut",
        data: {
          labels,
          datasets: [
            {
              data: kValues,
              backgroundColor: colors.map((c) => c + "CC"),
              borderColor: "#fff",
              borderWidth: 2,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          cutout: "55%",
          plugins: {
            legend: {
              position: "right",
              labels: { font: { size: 10 }, padding: 10, boxWidth: 12 },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.raw.toLocaleString()} خندق`,
              },
            },
          },
        },
      });
    }

    // 4) scatter مدارس vs خنادق
    killChart("ch-kh-scatter");
    if (document.getElementById("ch-kh-scatter") && kValues.some((v) => v > 0)) {
      const scPts = cityData
        .filter((r) => r.khanadeq > 0)
        .map((r, i) => ({
          x: r.schools,
          y: r.khanadeq,
          label: r.city,
          c: CITY_COLORS[cityData.indexOf(r) % CITY_COLORS.length],
        }));
      CHARTS["ch-kh-scatter"] = new Chart(document.getElementById("ch-kh-scatter"), {
        type: "scatter",
        data: {
          datasets: [
            {
              label: "المدن",
              data: scPts.map((p) => ({ x: p.x, y: p.y })),
              backgroundColor: scPts.map((p) => p.c + "99"),
              borderColor: scPts.map((p) => p.c),
              borderWidth: 2,
              pointRadius: 8,
              pointHoverRadius: 11,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const pt = scPts[ctx.dataIndex];
                  return [
                    ` ${pt ? pt.label : ""}`,
                    ` المدارس: ${ctx.raw.x.toLocaleString()}`,
                    ` الخنادق: ${ctx.raw.y.toLocaleString()}`,
                  ];
                },
              },
            },
          },
          scales: {
            x: { title: { display: true, text: "عدد المدارس" }, beginAtZero: true },
            y: { title: { display: true, text: "خنادق الصرف" }, beginAtZero: true },
          },
        },
      });
    }
  });
}

/* ══════════════════════════════════════════════════════════
   تبويب التجهيزات — نظام إدارة المخزون والاحتياجات
   يقرأ من: window.RAW_TAJHEEZ_INV (key: tajheezInventory في GAS)
   أعمدة: القسم، اسم_الصنف، سعر_الوحدة،
           مخصص_{مكة,جدة,الطائف,القنفذة,الليث,المدينة,ينبع,العلا,المهد}،
           مخصص_الكمية_الكلية، مخصص_القيمة_الكلية،
           احتياج_{مكة,جدة,الطائف,المدينة}،
           احتياج_الكمية_الكلية، احتياج_القيمة_الكلية،
           فرق_الكمية، فرق_القيمة، نسبة_الاحتياج
══════════════════════════════════════════════════════════ */

const TAJHEEZ_CITIES = [
  "مكة",
  "جدة",
  "الطائف",
  "القنفذة",
  "الليث",
  "المدينة",
  "ينبع",
  "العلا",
  "المهد",
];
const TAJHEEZ_NEED_CITIES = ["مكة", "جدة", "الطائف", "المدينة"];

function getTajheezRaw() {
  return window.RAW_TAJHEEZ_INV || [];
}

function parseTajheezRow(r) {
  const g = (k) => {
    const v = r[k];
    return v === null ||
      v === undefined ||
      v === "" ||
      v === "#N/A" ||
      String(v).toLowerCase() === "nan"
      ? null
      : v;
  };
  const n = (k) => {
    const v = g(k);
    if (v === null) return null;
    const f = parseFloat(String(v).replace(/,/g, ""));
    return isFinite(f) ? f : null;
  };
  const s = (k) => {
    const v = g(k);
    return v ? String(v).trim() : "";
  };
  return {
    قسم: s("القسم"),
    صنف: s("اسم_الصنف"),
    سعر: n("سعر_الوحدة"),
    مخصص: {
      مكة: n("مخصص_مكة"),
      جدة: n("مخصص_جدة"),
      الطائف: n("مخصص_الطائف"),
      القنفذة: n("مخصص_القنفذة"),
      الليث: n("مخصص_الليث"),
      المدينة: n("مخصص_المدينة"),
      ينبع: n("مخصص_ينبع"),
      العلا: n("مخصص_العلا"),
      المهد: n("مخصص_المهد"),
      كلي: n("مخصص_الكمية_الكلية"),
      قيمة: n("مخصص_القيمة_الكلية"),
    },
    احتياج: {
      مكة: n("احتياج_مكة"),
      جدة: n("احتياج_جدة"),
      الطائف: n("احتياج_الطائف"),
      المدينة: n("احتياج_المدينة"),
      كلي: n("احتياج_الكمية_الكلية"),
      قيمة: n("احتياج_القيمة_الكلية"),
    },
    فرق_كمية: n("فرق_الكمية"),
    فرق_قيمة: n("فرق_القيمة"),
    نسبة: n("نسبة_الاحتياج"),
    _raw: r,
  };
}

function sarFmt(v) {
  if (v === null || v === undefined) return "—";
  return (
    Number(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " ﷼"
  );
}
function sarFmt2(v) {
  if (v === null || v === undefined) return "—";
  return (
    Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ﷼"
  );
}
function numFmt(v, d = 0) {
  if (v === null || v === undefined) return "—";
  return Number(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function pctFmt(v) {
  if (v === null || v === undefined) return "—";
  return (
    Number(v).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%"
  );
}

/* مؤشر تغطية لوني */
function coverageBadge(need, alloc) {
  if (need === null || alloc === null)
    return { color: "#64748b", bg: "#F1F5F9", label: "غير محدد" };
  if (alloc === 0 && need > 0) return { color: "#DC2626", bg: "#FEF2F2", label: "عجز كامل" };
  const pct = need > 0 ? (alloc / need) * 100 : 100;
  if (pct >= 100) return { color: "#059669", bg: "#ECFDF5", label: "مغطى ✓" };
  if (pct >= 75) return { color: "#D97706", bg: "#FFFBEB", label: "قريب" };
  return { color: "#DC2626", bg: "#FEF2F2", label: "عجز" };
}

function getTajheezFiltered() {
  const all = getTajheezRaw()
    .map(parseTajheezRow)
    .filter((r) => r.صنف || r.قسم);
  const fQ = (document.getElementById("taj-f-qism")?.value || "").trim();
  const fS = (document.getElementById("taj-f-sanf")?.value || "").trim().toLowerCase();
  const fC = (document.getElementById("taj-f-city")?.value || "").trim();
  return all.filter((r) => {
    if (fQ && r.قسم !== fQ) return false;
    if (fS && !r.صنف.toLowerCase().includes(fS)) return false;
    if (fC) {
      const mc = r.مخصص[fC],
        nc = r.احتياج[fC];
      if (mc === null && nc === null) return false;
    }
    return true;
  });
}

function makeTajPagBtn(label, page, disabled, active, onClick) {
  const b = document.createElement("button");
  b.className = "pag-btn" + (active ? " active" : "");
  b.textContent = label;
  b.disabled = disabled;
  if (!disabled) b.onclick = onClick;
  return b;
}

function renderTajheezTable(tableId, rows, cols, pagState, pagBarId, onPageChange) {
  const tbody = document.getElementById(tableId);
  if (!tbody) return;
  const total = rows.length;
  const maxPage = Math.max(0, Math.ceil(total / pagState.size) - 1);
  pagState.cur = Math.min(pagState.cur, maxPage);
  const start = pagState.cur * pagState.size;
  const page = rows.slice(start, start + pagState.size);
  tbody.innerHTML = "";
  const frag = document.createDocumentFragment();
  page.forEach((row, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = cols.map((c) => c(row, i)).join("");
    frag.appendChild(tr);
  });
  tbody.appendChild(frag);
  // pagination
  const bar = document.getElementById(pagBarId);
  if (!bar) return;
  const info = bar.querySelector(".pag-info");
  const btns = bar.querySelector(".pag-btns");
  if (info)
    info.textContent = `الصفوف ${(start + 1).toLocaleString()}–${Math.min(start + pagState.size, total).toLocaleString()} من ${total.toLocaleString()}`;
  if (!btns) return;
  btns.innerHTML = "";
  btns.appendChild(
    makeTajPagBtn("◄ السابق", pagState.cur - 1, pagState.cur === 0, false, () => {
      pagState.cur--;
      onPageChange();
    }),
  );
  let lo = Math.max(0, pagState.cur - 3),
    hi = Math.min(maxPage, pagState.cur + 3);
  if (lo > 0) {
    btns.appendChild(
      makeTajPagBtn("1", 0, false, false, () => {
        pagState.cur = 0;
        onPageChange();
      }),
    );
    if (lo > 1) {
      const sp = document.createElement("span");
      sp.textContent = "…";
      sp.style = "padding:0 4px;color:var(--tx-muted)";
      btns.appendChild(sp);
    }
  }
  for (let i = lo; i <= hi; i++)
    btns.appendChild(
      makeTajPagBtn(String(i + 1), i, false, i === pagState.cur, () => {
        pagState.cur = i;
        onPageChange();
      }),
    );
  if (hi < maxPage) {
    const sp = document.createElement("span");
    sp.textContent = "…";
    sp.style = "padding:0 4px;color:var(--tx-muted)";
    btns.appendChild(sp);
    btns.appendChild(
      makeTajPagBtn(String(maxPage + 1), maxPage, false, false, () => {
        pagState.cur = maxPage;
        onPageChange();
      }),
    );
  }
  btns.appendChild(
    makeTajPagBtn("التالي ►", pagState.cur + 1, pagState.cur >= maxPage, false, () => {
      pagState.cur++;
      onPageChange();
    }),
  );
}

function exportTajheezCSV(rows) {
  const headers = [
    "القسم",
    "اسم_الصنف",
    "سعر_الوحدة",
    "مخصص_الكمية_الكلية",
    "مخصص_القيمة_الكلية",
    "احتياج_الكمية_الكلية",
    "احتياج_القيمة_الكلية",
    "فرق_الكمية",
    "فرق_القيمة",
    "نسبة_الاحتياج",
  ];
  const csv = [headers.map((h) => `"${h}"`).join(",")];
  rows.forEach((r) => {
    csv.push(
      [
        r.قسم,
        r.صنف,
        r.سعر ?? "",
        r.مخصص.كلي ?? "",
        r.مخصص.قيمة ?? "",
        r.احتياج.كلي ?? "",
        r.احتياج.قيمة ?? "",
        r.فرق_كمية ?? "",
        r.فرق_قيمة ?? "",
        r.نسبة ?? "",
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(","),
    );
  });
  const blob = new Blob(["\ufeff" + csv.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "tajheez_" + new Date().toISOString().slice(0, 10) + ".csv";
  a.click();
}

function exportTajheezExcel(rows) {
  const headers = [
    "القسم",
    "اسم الصنف",
    "سعر الوحدة",
    "مخصص الكمية الكلية",
    "مخصص القيمة الكلية",
    "احتياج الكمية الكلية",
    "احتياج القيمة الكلية",
    "فرق الكمية",
    "فرق القيمة",
    "نسبة الاحتياج",
  ];
  const dataArr = [headers];
  rows.forEach((r) => {
    dataArr.push([
      r.قسم ?? "",
      r.صنف ?? "",
      r.سعر ?? "",
      r.مخصص?.كلي ?? "",
      r.مخصص?.قيمة ?? "",
      r.احتياج?.كلي ?? "",
      r.احتياج?.قيمة ?? "",
      r.فرق_كمية ?? "",
      r.فرق_قيمة ?? "",
      r.نسبة ?? "",
    ]);
  });
  const ws = XLSX.utils.aoa_to_sheet(dataArr);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "التجهيزات");
  XLSX.writeFile(wb, "tajheez_" + new Date().toISOString().slice(0, 10) + ".xlsx");
}

window._tajPagNeed = { cur: 0, size: 50 };
window._tajPagFaed = { cur: 0, size: 50 };
window._tajPagAjz = { cur: 0, size: 50 };
window._tajPagAll = { cur: 0, size: 50 };
window._tajSortNeed = "val_desc";
window._tajSortFaed = "val_desc";
window._tajSortAjz = "val_desc";
window._tajSortAll = "qism";

/* ╔════════════════════════════════════════════════════════════╗
   ║  🏗️  JS تبويب: التجهيزات
   ║  (tab-tajheez) — الدوال الخاصة بهذا التبويب تبدأ هنا
   ╚════════════════════════════════════════════════════════════╝ */
function renderTajheezInventoryTab() {
  const el = document.getElementById("tajheez-content");
  if (!el) return;
  const raw = getTajheezRaw();

  if (!raw.length) {
    el.innerHTML = `<div class="card" style="text-align:center;padding:64px 24px">
      <div style="font-size:48px;margin-bottom:14px">🏗️</div>
      <div style="font-size:16px;font-weight:800;color:var(--tx-main);margin-bottom:8px">لم يتم التحميل</div>
    </div>`;
    return;
  }

  const all = raw.map(parseTajheezRow).filter((r) => r.صنف || r.قسم);
  const أقسام = [...new Set(all.map((r) => r.قسم).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "ar"),
  );
  const fQ = (document.getElementById("taj-f-qism")?.value || "").trim();
  const fS = (document.getElementById("taj-f-sanf")?.value || "").trim().toLowerCase();
  const fC = (document.getElementById("taj-f-city")?.value || "").trim();

  const filtered = all.filter((r) => {
    if (fQ && r.قسم !== fQ) return false;
    if (fS && !r.صنف.toLowerCase().includes(fS)) return false;
    if (fC) {
      const mc = r.مخصص[fC],
        nc = r.احتياج[fC];
      if (mc === null && nc === null) return false;
    }
    return true;
  });

  // حسابات KPI
  const totalItems = filtered.length;
  const totalAllocVal = filtered.reduce((s, r) => s + (r.مخصص.قيمة || 0), 0);
  const totalNeedVal = filtered.reduce((s, r) => s + (r.احتياج.قيمة || 0), 0);
  const totalDiffVal = filtered.reduce((s, r) => s + (r.فرق_قيمة || 0), 0);
  const surplus = filtered.filter((r) => r.فرق_قيمة !== null && r.فرق_قيمة > 0);
  const deficit = filtered.filter((r) => r.فرق_قيمة !== null && r.فرق_قيمة < 0);
  const covered = filtered.filter(
    (r) => r.احتياج.كلي !== null && r.مخصص.كلي !== null && r.مخصص.كلي >= r.احتياج.كلي,
  );
  const coverPct = totalItems > 0 ? Math.round((covered.length / totalItems) * 100) : 0;

  // بيانات الرسم البياني — قيمة الاحتياج حسب القسم
  const byQismNeed = {},
    byQismAlloc = {};
  filtered.forEach((r) => {
    if (r.قسم) {
      byQismNeed[r.قسم] = (byQismNeed[r.قسم] || 0) + (r.احتياج.قيمة || 0);
      byQismAlloc[r.قسم] = (byQismAlloc[r.قسم] || 0) + (r.مخصص.قيمة || 0);
    }
  });
  const qismEntries = Object.entries(byQismNeed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  // أعلى أصناف احتياجاً
  const needSorted = [...filtered]
    .filter((r) => r.احتياج.قيمة !== null)
    .sort((a, b) => (b.احتياج.قيمة || 0) - (a.احتياج.قيمة || 0));
  const faedSorted = [...filtered]
    .filter((r) => r.فرق_قيمة !== null && r.فرق_قيمة > 0)
    .sort((a, b) => b.فرق_قيمة - a.فرق_قيمة);
  const ajzSorted = [...filtered]
    .filter((r) => r.فرق_قيمة !== null && r.فرق_قيمة < 0)
    .sort((a, b) => a.فرق_قيمة - b.فرق_قيمة);

  el.innerHTML = `
  <!-- ══ فلاتر التجهيزات ══ -->
  <div class="filters-row" style="margin-bottom:18px">
    <div class="fg">
      <div class="fg-lbl">القسم</div>
      <select class="fsel" id="taj-f-qism" onchange="renderTajheezInventoryTab()" style="min-width:150px">
        <option value="">الكل</option>
        ${أقسام.map((q) => `<option value="${esc(q)}" ${fQ === q ? "selected" : ""}>${esc(q)}</option>`).join("")}
      </select>
    </div>
    <div class="fg">
      <div class="fg-lbl">اسم الصنف</div>
      <input class="finp" id="taj-f-sanf" type="text" placeholder="بحث…" value="${esc(fS)}" oninput="renderTajheezInventoryTab()">
    </div>
    <div class="fg">
      <div class="fg-lbl">المدينة</div>
      <select class="fsel" id="taj-f-city" onchange="renderTajheezInventoryTab()" style="min-width:130px">
        <option value="">الكل</option>
        ${TAJHEEZ_CITIES.map((c) => `<option value="${esc(c)}" ${fC === c ? "selected" : ""}>${esc(c)}</option>`).join("")}
      </select>
    </div>
    <button class="f-clear" onclick="document.getElementById('taj-f-qism').value='';document.getElementById('taj-f-sanf').value='';document.getElementById('taj-f-city').value='';renderTajheezInventoryTab()">✕ مسح</button>
    <div style="margin-right:auto;display:flex;gap:8px;align-items:center">
      <button class="export-btn export-btn-csv" onclick="exportTajheezCSV(getTajheezFiltered())">⬇ CSV</button>
      <button class="export-btn export-btn-excel" onclick="exportTajheezExcel(getTajheezFiltered())">⬇ Excel</button>
    </div>
  </div>

  <!-- ══ KPIs ══ -->
  <div class="kpi-grid" style="margin-bottom:18px">
    <div class="kpi kc-navy">
      <div class="kpi-icon">🏗️</div>
      <div class="kpi-val">${numFmt(totalItems)}</div>
      <div class="kpi-lbl">إجمالي الأصناف</div>
      <div class="kpi-sub">${أقسام.length} قسم</div>
    </div>
    <div class="kpi kc-blue">
      <div class="kpi-icon">📦</div>
      <div class="kpi-val" style="font-size:18px">${sarFmt(totalAllocVal)}</div>
      <div class="kpi-lbl">إجمالي المخصصات</div>
      <div class="kpi-sub">${numFmt(filtered.reduce((s, r) => s + (r.مخصص.كلي || 0), 0))} وحدة</div>
    </div>
    <div class="kpi kc-amber">
      <div class="kpi-icon">📋</div>
      <div class="kpi-val" style="font-size:18px">${sarFmt(totalNeedVal)}</div>
      <div class="kpi-lbl">إجمالي الاحتياج</div>
      <div class="kpi-sub">${numFmt(filtered.reduce((s, r) => s + (r.احتياج.كلي || 0), 0))} وحدة</div>
    </div>
    <div class="kpi ${totalDiffVal >= 0 ? "kc-green" : "kc-red"}">
      <div class="kpi-icon">${totalDiffVal >= 0 ? "📈" : "📉"}</div>
      <div class="kpi-val" style="font-size:18px">${sarFmt(Math.abs(totalDiffVal))}</div>
      <div class="kpi-lbl">${totalDiffVal >= 0 ? "إجمالي الفائض" : "إجمالي العجز"}</div>
      <div class="kpi-sub">فرق القيمة الكلية</div>
    </div>
    <div class="kpi kc-teal">
      <div class="kpi-icon">✅</div>
      <div class="kpi-val">${coverPct}%</div>
      <div class="kpi-lbl">نسبة تغطية التجهيزات</div>
      <div class="kpi-sub">${numFmt(covered.length)} من ${numFmt(totalItems)} صنف مغطى</div>
    </div>
  </div>

  <!-- ══ رسوم بيانية ══ -->
  <div class="g2 mb14">
    <div class="card">
      <div class="card-title">
        <span class="card-title-icon" style="background:#FFFBEB;color:#D97706">📊</span>
        أكبر الأقسام من حيث قيمة الاحتياج
      </div>
      <div class="chart-box" style="height:300px"><canvas id="ch-taj-qism-need"></canvas></div>
    </div>
    <div class="card">
      <div class="card-title">
        <span class="card-title-icon" style="background:#ECFDF5;color:#059669">⚖️</span>
        مقارنة المخصصات والاحتياج لكل قسم
      </div>
      <div class="chart-box" style="height:300px"><canvas id="ch-taj-compare"></canvas></div>
    </div>
  </div>
  <div class="g2 mb14">
    <div class="card">
      <div class="card-title">
        <span class="card-title-icon" style="background:#ECFEFF;color:#0891B2">🥧</span>
        توزيع قيمة الاحتياج حسب الأقسام
      </div>
      <div class="chart-box" style="height:280px"><canvas id="ch-taj-pie"></canvas></div>
    </div>
    <div class="card">
      <div class="card-title">
        <span class="card-title-icon" style="background:#F5F3FF;color:#7C3AED">🌡️</span>
        توزيع حالة التغطية
      </div>
      <div class="chart-box" style="height:280px"><canvas id="ch-taj-coverage"></canvas></div>
    </div>
  </div>

  <!-- ══ جدول أكثر الأصناف احتياجاً ══ -->
  <div class="card mb14">
    <div class="card-title">
      <span class="card-title-icon" style="background:#FFFBEB;color:#D97706">📋</span>
      أكثر الأصناف احتياجاً
      <span class="sub" id="taj-need-cnt">${needSorted.length}</span>
      <select id="taj-sort-need" class="fsel" style="margin-right:auto;font-size:11px;min-width:auto" onchange="renderTajheezNeedTable()">
        <option value="val_desc">قيمة الاحتياج ↓</option>
        <option value="qty_desc">كمية الاحتياج ↓</option>
        <option value="pct_desc">نسبة الاحتياج ↓</option>
        <option value="qism">حسب القسم</option>
      </select>
    </div>
    <div class="tbl-wrap">
      <table>
        <thead><tr>
          <th style="text-align:right;padding-right:14px;min-width:160px">اسم الصنف</th>
          <th style="min-width:100px">القسم</th>
          <th style="min-width:90px">سعر الوحدة</th>
          <th style="min-width:100px">الاحتياج (كمية)</th>
          <th style="min-width:120px">الاحتياج (قيمة)</th>
          <th style="min-width:100px">المخصص (كمية)</th>
          <th style="min-width:80px">نسبة الاحتياج</th>
          <th style="min-width:90px">حالة التغطية</th>
        </tr></thead>
        <tbody id="taj-need-body"></tbody>
      </table>
    </div>
    <div class="pag-bar" id="taj-need-pag">
      <span class="pag-info" id="taj-need-info"></span>
      <div class="pag-btns" id="taj-need-btns"></div>
    </div>
  </div>

  <!-- ══ جدول أكبر الفوائض ══ -->
  <div class="card mb14">
    <div class="card-title">
      <span class="card-title-icon" style="background:#ECFDF5;color:#059669">📈</span>
      أكبر الفوائض
      <span class="sub" style="background:#ECFDF5;color:#059669">${faedSorted.length} صنف</span>
      <select id="taj-sort-faed" class="fsel" style="margin-right:auto;font-size:11px;min-width:auto" onchange="renderTajheezFaedTable()">
        <option value="val_desc">قيمة الفائض ↓</option>
        <option value="qty_desc">كمية الفائض ↓</option>
        <option value="qism">حسب القسم</option>
      </select>
    </div>
    <div class="tbl-wrap">
      <table>
        <thead><tr>
          <th style="text-align:right;padding-right:14px;min-width:160px">اسم الصنف</th>
          <th style="min-width:100px">القسم</th>
          <th style="min-width:100px">فرق الكمية</th>
          <th style="min-width:120px">فرق القيمة (فائض)</th>
          <th style="min-width:110px">المخصص (قيمة)</th>
          <th style="min-width:110px">الاحتياج (قيمة)</th>
        </tr></thead>
        <tbody id="taj-faed-body"></tbody>
      </table>
    </div>
    <div class="pag-bar" id="taj-faed-pag">
      <span class="pag-info" id="taj-faed-info"></span>
      <div class="pag-btns" id="taj-faed-btns"></div>
    </div>
  </div>

  <!-- ══ جدول أكبر العجز ══ -->
  <div class="card mb14">
    <div class="card-title">
      <span class="card-title-icon" style="background:#FEF2F2;color:#DC2626">📉</span>
      أكبر حالات العجز
      <span class="sub" style="background:#FEF2F2;color:#DC2626">${ajzSorted.length} صنف</span>
      <select id="taj-sort-ajz" class="fsel" style="margin-right:auto;font-size:11px;min-width:auto" onchange="renderTajheezAjzTable()">
        <option value="val_desc">قيمة العجز ↓</option>
        <option value="qty_desc">كمية العجز ↓</option>
        <option value="qism">حسب القسم</option>
      </select>
    </div>
    <div class="tbl-wrap">
      <table>
        <thead><tr>
          <th style="text-align:right;padding-right:14px;min-width:160px">اسم الصنف</th>
          <th style="min-width:100px">القسم</th>
          <th style="min-width:100px">فرق الكمية</th>
          <th style="min-width:130px">قيمة العجز</th>
          <th style="min-width:110px">المخصص (قيمة)</th>
          <th style="min-width:110px">الاحتياج (قيمة)</th>
        </tr></thead>
        <tbody id="taj-ajz-body"></tbody>
      </table>
    </div>
    <div class="pag-bar" id="taj-ajz-pag">
      <span class="pag-info" id="taj-ajz-info"></span>
      <div class="pag-btns" id="taj-ajz-btns"></div>
    </div>
  </div>

  <!-- ══ جدول كامل ══ -->
  <div class="card">
    <div class="card-title">
      <span class="card-title-icon" style="background:#EEF3F7;color:#0891B2">📋</span>
      جدول التجهيزات الكامل
      <span class="sub" id="taj-all-cnt">${filtered.length}</span>
      <select id="taj-sort-all" class="fsel" style="margin-right:auto;font-size:11px;min-width:auto" onchange="renderTajheezAllTable()">
        <option value="qism">حسب القسم</option>
        <option value="need_desc">الاحتياج ↓</option>
        <option value="alloc_desc">المخصص ↓</option>
        <option value="diff_desc">الفائض ↓</option>
        <option value="diff_asc">العجز ↓</option>
        <option value="pct_desc">نسبة الاحتياج ↓</option>
      </select>
    </div>
    <div class="tbl-wrap" style="max-height:480px">
      <table>
        <thead><tr>
          <th style="text-align:right;padding-right:14px;min-width:160px">اسم الصنف</th>
          <th>القسم</th>
          <th>سعر الوحدة</th>
          <th>مخصص كلي</th>
          <th>قيمة المخصص</th>
          <th>احتياج كلي</th>
          <th>قيمة الاحتياج</th>
          <th>فرق الكمية</th>
          <th>فرق القيمة</th>
          <th>نسبة الاحتياج</th>
          <th>الحالة</th>
        </tr></thead>
        <tbody id="taj-all-body"></tbody>
      </table>
    </div>
    <div class="pag-bar" id="taj-all-pag">
      <span class="pag-info" id="taj-all-info"></span>
      <div class="pag-btns" id="taj-all-btns"></div>
    </div>
  </div>
  `;

  // حفظ بيانات للجداول
  window._tajNeedRows = needSorted;
  window._tajFaedRows = faedSorted;
  window._tajAjzRows = ajzSorted;
  window._tajAllRows = filtered;
  window._tajPagNeed.cur = 0;
  window._tajPagFaed.cur = 0;
  window._tajPagAjz.cur = 0;
  window._tajPagAll.cur = 0;

  requestAnimationFrame(() => {
    // رسم 1: أكبر الأقسام احتياجاً (أفقي)
    killChart("ch-taj-qism-need");
    if (qismEntries.length) {
      CHARTS["ch-taj-qism-need"] = new Chart(document.getElementById("ch-taj-qism-need"), {
        type: "bar",
        data: {
          labels: qismEntries.map(([k]) => (k.length > 20 ? k.slice(0, 20) + "…" : k)),
          datasets: [
            {
              label: "قيمة الاحتياج",
              data: qismEntries.map(([, v]) => +v.toFixed(0)),
              backgroundColor: "#D9770688",
              borderColor: "#D97706",
              borderWidth: 1.5,
              borderRadius: 5,
            },
          ],
        },
        options: {
          indexAxis: "y",
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => `  ${sarFmt(ctx.raw)}` } },
          },
          scales: {
            x: { beginAtZero: true, ticks: { callback: (v) => sarFmt(v) } },
            y: { ticks: { font: { size: 10 } } },
          },
        },
      });
    }

    // رسم 2: مقارنة مخصص vs احتياج
    killChart("ch-taj-compare");
    if (qismEntries.length) {
      CHARTS["ch-taj-compare"] = new Chart(document.getElementById("ch-taj-compare"), {
        type: "bar",
        data: {
          labels: qismEntries.map(([k]) => (k.length > 14 ? k.slice(0, 14) + "…" : k)),
          datasets: [
            {
              label: "المخصصات",
              data: qismEntries.map(([k]) => +(byQismAlloc[k] || 0).toFixed(0)),
              backgroundColor: "#0891B288",
              borderColor: "#0891B2",
              borderWidth: 1.5,
              borderRadius: 4,
            },
            {
              label: "الاحتياج",
              data: qismEntries.map(([, v]) => +v.toFixed(0)),
              backgroundColor: "#D9770688",
              borderColor: "#D97706",
              borderWidth: 1.5,
              borderRadius: 4,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "top", labels: { font: { size: 10 }, boxWidth: 10, padding: 10 } },
            tooltip: {
              callbacks: { label: (ctx) => `  ${ctx.dataset.label}: ${sarFmt(ctx.raw)}` },
            },
          },
          scales: {
            x: { ticks: { font: { size: 10 }, maxRotation: 30 } },
            y: { beginAtZero: true, ticks: { callback: (v) => sarFmt(v) } },
          },
        },
      });
    }

    // رسم 3: دائري - توزيع الاحتياج
    killChart("ch-taj-pie");
    if (qismEntries.length) {
      CHARTS["ch-taj-pie"] = new Chart(document.getElementById("ch-taj-pie"), {
        type: "doughnut",
        data: {
          labels: qismEntries.map(([k]) => k),
          datasets: [
            {
              data: qismEntries.map(([, v]) => +v.toFixed(0)),
              backgroundColor: PALETTE.map((c) => c + "CC"),
              borderWidth: 2,
              borderColor: "#fff",
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          cutout: "55%",
          plugins: {
            legend: {
              position: "bottom",
              labels: { font: { size: 10 }, boxWidth: 12, padding: 6 },
            },
            tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${sarFmt(ctx.raw)}` } },
          },
        },
      });
    }

    // رسم 4: توزيع حالة التغطية
    killChart("ch-taj-coverage");
    const cov3 = { مغطى: 0, قريب: 0, عجز: 0 };
    filtered.forEach((r) => {
      const cb = coverageBadge(r.احتياج.كلي, r.مخصص.كلي);
      if (cb.label === "مغطى ✓" || cb.label === "مغطى") cov3.مغطى++;
      else if (cb.label === "قريب") cov3.قريب++;
      else if (cb.label.includes("عجز")) cov3.عجز++;
    });
    CHARTS["ch-taj-coverage"] = new Chart(document.getElementById("ch-taj-coverage"), {
      type: "doughnut",
      data: {
        labels: ["مغطى ✓", "قريب من الاحتياج", "يوجد عجز"],
        datasets: [
          {
            data: [cov3.مغطى, cov3.قريب, cov3.عجز],
            backgroundColor: ["#05966999", "#D9770699", "#DC262699"],
            borderColor: ["#059669", "#D97706", "#DC2626"],
            borderWidth: 2,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        cutout: "55%",
        plugins: {
          legend: { position: "bottom", labels: { font: { size: 11 }, padding: 12, boxWidth: 12 } },
          tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} صنف` } },
        },
      },
    });

    renderTajheezNeedTable();
    renderTajheezFaedTable();
    renderTajheezAjzTable();
    renderTajheezAllTable();
  });
}

function renderTajheezNeedTable() {
  const sort = document.getElementById("taj-sort-need")?.value || "val_desc";
  let rows = [...(window._tajNeedRows || [])];
  if (sort === "qty_desc") rows.sort((a, b) => (b.احتياج.كلي || 0) - (a.احتياج.كلي || 0));
  else if (sort === "pct_desc") rows.sort((a, b) => (b.نسبة || 0) - (a.نسبة || 0));
  else if (sort === "qism") rows.sort((a, b) => a.قسم.localeCompare(b.قسم, "ar"));
  else rows.sort((a, b) => (b.احتياج.قيمة || 0) - (a.احتياج.قيمة || 0));
  const pg = window._tajPagNeed;
  renderTajheezTable(
    "taj-need-body",
    rows,
    [
      (r) =>
        `<td style="text-align:right;padding-right:14px"><div style="font-weight:700;font-size:12px;max-width:200px;white-space:normal;line-height:1.4">${esc(r.صنف)}</div></td>`,
      (r) => `<td style="font-size:11px;color:var(--tx-sec)">${esc(r.قسم) || "—"}</td>`,
      (r) => `<td style="font-weight:700;color:#0891B2">${sarFmt2(r.سعر)}</td>`,
      (r) => `<td style="font-weight:700;color:#D97706">${numFmt(r.احتياج.كلي)}</td>`,
      (r) => `<td style="font-weight:800;color:#D97706">${sarFmt(r.احتياج.قيمة)}</td>`,
      (r) => `<td style="color:var(--tx-muted)">${numFmt(r.مخصص.كلي)}</td>`,
      (r) =>
        `<td style="font-weight:700;color:${r.نسبة !== null && r.نسبة > 100 ? "#DC2626" : r.نسبة !== null && r.نسبة > 75 ? "#D97706" : "#059669"}">${pctFmt(r.نسبة)}</td>`,
      (r) => {
        const cb = coverageBadge(r.احتياج.كلي, r.مخصص.كلي);
        return `<td><span style="padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700;background:${cb.bg};color:${cb.color};border:1px solid ${cb.color}33;white-space:nowrap">${cb.label}</span></td>`;
      },
    ],
    pg,
    "taj-need-pag",
    renderTajheezNeedTable,
  );
}

function renderTajheezFaedTable() {
  const sort = document.getElementById("taj-sort-faed")?.value || "val_desc";
  let rows = [...(window._tajFaedRows || [])];
  if (sort === "qty_desc") rows.sort((a, b) => (b.فرق_كمية || 0) - (a.فرق_كمية || 0));
  else if (sort === "qism") rows.sort((a, b) => a.قسم.localeCompare(b.قسم, "ar"));
  else rows.sort((a, b) => (b.فرق_قيمة || 0) - (a.فرق_قيمة || 0));
  renderTajheezTable(
    "taj-faed-body",
    rows,
    [
      (r) =>
        `<td style="text-align:right;padding-right:14px"><div style="font-weight:700;font-size:12px;max-width:200px;white-space:normal;line-height:1.4">${esc(r.صنف)}</div></td>`,
      (r) => `<td style="font-size:11px;color:var(--tx-sec)">${esc(r.قسم) || "—"}</td>`,
      (r) => `<td style="font-weight:700;color:#059669">${numFmt(r.فرق_كمية)}</td>`,
      (r) => `<td style="font-weight:800;color:#059669">${sarFmt(r.فرق_قيمة)}</td>`,
      (r) => `<td style="color:var(--tx-muted)">${sarFmt(r.مخصص.قيمة)}</td>`,
      (r) => `<td style="color:var(--tx-muted)">${sarFmt(r.احتياج.قيمة)}</td>`,
    ],
    window._tajPagFaed,
    "taj-faed-pag",
    renderTajheezFaedTable,
  );
}

function renderTajheezAjzTable() {
  const sort = document.getElementById("taj-sort-ajz")?.value || "val_desc";
  let rows = [...(window._tajAjzRows || [])];
  if (sort === "qty_desc") rows.sort((a, b) => a.فرق_كمية - b.فرق_كمية);
  else if (sort === "qism") rows.sort((a, b) => a.قسم.localeCompare(b.قسم, "ar"));
  else rows.sort((a, b) => a.فرق_قيمة - b.فرق_قيمة);
  renderTajheezTable(
    "taj-ajz-body",
    rows,
    [
      (r) =>
        `<td style="text-align:right;padding-right:14px"><div style="font-weight:700;font-size:12px;max-width:200px;white-space:normal;line-height:1.4">${esc(r.صنف)}</div></td>`,
      (r) => `<td style="font-size:11px;color:var(--tx-sec)">${esc(r.قسم) || "—"}</td>`,
      (r) => `<td style="font-weight:700;color:#DC2626">${numFmt(r.فرق_كمية)}</td>`,
      (r) => `<td style="font-weight:800;color:#DC2626">${sarFmt(Math.abs(r.فرق_قيمة))}</td>`,
      (r) => `<td style="color:var(--tx-muted)">${sarFmt(r.مخصص.قيمة)}</td>`,
      (r) => `<td style="color:var(--tx-muted)">${sarFmt(r.احتياج.قيمة)}</td>`,
    ],
    window._tajPagAjz,
    "taj-ajz-pag",
    renderTajheezAjzTable,
  );
}

function renderTajheezAllTable() {
  const sort = document.getElementById("taj-sort-all")?.value || "qism";
  let rows = [...(window._tajAllRows || [])];
  if (sort === "need_desc") rows.sort((a, b) => (b.احتياج.قيمة || 0) - (a.احتياج.قيمة || 0));
  else if (sort === "alloc_desc") rows.sort((a, b) => (b.مخصص.قيمة || 0) - (a.مخصص.قيمة || 0));
  else if (sort === "diff_desc") rows.sort((a, b) => (b.فرق_قيمة || 0) - (a.فرق_قيمة || 0));
  else if (sort === "diff_asc") rows.sort((a, b) => (a.فرق_قيمة || 0) - (b.فرق_قيمة || 0));
  else if (sort === "pct_desc") rows.sort((a, b) => (b.نسبة || 0) - (a.نسبة || 0));
  else rows.sort((a, b) => a.قسم.localeCompare(b.قسم, "ar"));
  const pg = window._tajPagAll;
  renderTajheezTable(
    "taj-all-body",
    rows,
    [
      (r) =>
        `<td style="text-align:right;padding-right:14px"><div style="font-weight:700;font-size:12px;max-width:200px;white-space:normal;line-height:1.4">${esc(r.صنف)}</div></td>`,
      (r) => `<td style="font-size:10px;color:var(--tx-sec)">${esc(r.قسم) || "—"}</td>`,
      (r) => `<td style="font-size:11px">${sarFmt2(r.سعر)}</td>`,
      (r) => `<td style="font-weight:700;text-align:center">${numFmt(r.مخصص.كلي)}</td>`,
      (r) => `<td style="font-weight:700">${sarFmt(r.مخصص.قيمة)}</td>`,
      (r) => `<td style="font-weight:700;text-align:center">${numFmt(r.احتياج.كلي)}</td>`,
      (r) => `<td style="font-weight:700;color:#D97706">${sarFmt(r.احتياج.قيمة)}</td>`,
      (r) =>
        `<td style="text-align:center;font-weight:700;color:${r.فرق_كمية !== null ? (r.فرق_كمية >= 0 ? "#059669" : "#DC2626") : "#ccc"}">${numFmt(r.فرق_كمية)}</td>`,
      (r) =>
        `<td style="font-weight:700;color:${r.فرق_قيمة !== null ? (r.فرق_قيمة >= 0 ? "#059669" : "#DC2626") : "#ccc"}">${sarFmt(r.فرق_قيمة)}</td>`,
      (r) =>
        `<td style="font-weight:700;color:${r.نسبة !== null && r.نسبة > 100 ? "#DC2626" : r.نسبة !== null && r.نسبة > 75 ? "#D97706" : "#059669"}">${pctFmt(r.نسبة)}</td>`,
      (r) => {
        const cb = coverageBadge(r.احتياج.كلي, r.مخصص.كلي);
        return `<td><span style="padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:${cb.bg};color:${cb.color};border:1px solid ${cb.color}33;white-space:nowrap">${cb.label}</span></td>`;
      },
    ],
    pg,
    "taj-all-pag",
    renderTajheezAllTable,
  );
}
/* ══════════════════════════════════ نهاية تبويب التجهيزات ══════════════════════════════════ */


  function fcbToggle() {
    document.getElementById("fcbPanel").classList.toggle("open");
    document.getElementById("fcbFab").classList.toggle("active");
    fcbCloseSettings();
  }

  function fcbAutoGrow(el) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 92) + "px";
  }

  /* ════════════════════════════════════════════════════════════════
     ⚙️ إعدادات المساعد — قراءة/حفظ مفتاح API من واجهة الإعدادات
     الأولوية: المفتاح المحفوظ محلياً (localStorage) > المفتاح بالكود (CFG)
  ════════════════════════════════════════════════════════════════ */
  /* ════════════════════════════════════════════════════════════════
     🤖 AIService — الوحدة الوحيدة المسؤولة عن كل اتصال بالذكاء
     الاصطناعي (OpenAI) في اللوحة بالكامل.

     لماذا وحدة واحدة؟
     • لا يوجد أي مفتاح API داخل الكود المصدري إطلاقاً — اللوحة
       مستضافة على GitHub Pages بدون سيرفر خلفي، فأي مفتاح بالكود
       يكون مرئياً للجميع (View Source). المفتاح يُدخله كل مستخدم
       بنفسه من ⚙️ إعدادات المساعد، ويُخزَّن فقط في متصفحه
       (localStorage) — لا يُرسل لأي مكان عدا OpenAI مباشرة.
     • لو احتجت لاحقاً تمرير الطلبات عبر سيرفر/بروكسي خاص بك (مثلاً
       لإخفاء المفتاح أو لتطبيق Rate Limiting)، التعديل الوحيد
       المطلوب هو داخل AIService.chat (تغيير الـ endpoint وطريقة
       الإرسال) — بقية اللوحة (fcbSend وكل أدوات الشات) لا تحتاج أي
       تعديل لأنها لا تتحدث مباشرة مع OpenAI، بل فقط مع AIService.
  ════════════════════════════════════════════════════════════════ */
  const AIService = {
    /** المفتاح المحفوظ محلياً في متصفح هذا المستخدم فقط، أو "" لو غير موجود */
    getApiKey() {
      return (localStorage.getItem("fcb_openai_key") || "").trim();
    },
    /** هل يوجد مفتاح صالح حالياً؟ */
    hasKey() {
      return this.getApiKey().length > 0;
    },
    /** اسم الموديل: المحفوظ محلياً، وإلا الافتراضي من CFG */
    getModel() {
      const local = (localStorage.getItem("fcb_openai_model") || "").trim();
      return local || CFG.OPENAI_MODEL || "gpt-5.4-mini";
    },
    saveSettings(key, model) {
      if (key) localStorage.setItem("fcb_openai_key", key);
      else localStorage.removeItem("fcb_openai_key");
      if (model) localStorage.setItem("fcb_openai_model", model);
      else localStorage.removeItem("fcb_openai_model");
    },
    clearSettings() {
      localStorage.removeItem("fcb_openai_key");
      localStorage.removeItem("fcb_openai_model");
    },
    /**
     * يرسل محادثة كاملة (system + history + رسالة المستخدم) إلى OpenAI
     * ويرجع نص الرد. يرمي استثناء بكود NO_API_KEY لو لا يوجد مفتاح،
     * حتى يتعامل المستدعي مع الحالتين (لا مفتاح / فشل اتصال) بشكل مختلف.
     *
     * هذه هي الدالة الوحيدة التي تعرف عنوان واجهة OpenAI — أي بروكسي
     * مستقبلي يُستبدل هنا فقط.
     */
    async chat(messages) {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        const err = new Error("NO_API_KEY");
        err.code = "NO_API_KEY";
        throw err;
      }
      const resp = await fetch(CFG.OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey,
        },
        body: JSON.stringify({
          model: this.getModel(),
          messages: messages,
          temperature: 0.4,
          max_completion_tokens: 1500,
        }),
      });
      if (!resp.ok) {
        let errMsg = "HTTP " + resp.status;
        try {
          const errJson = await resp.json();
          errMsg = errJson?.error?.message || errMsg;
        } catch (_) {}
        const err = new Error(errMsg);
        err.code = resp.status === 401 ? "INVALID_KEY" : "REQUEST_FAILED";
        throw err;
      }
      const data = await resp.json();
      const reply = data?.choices?.[0]?.message?.content?.trim();
      if (!reply) {
        const err = new Error("EMPTY_RESPONSE");
        err.code = "EMPTY_RESPONSE";
        throw err;
      }
      return reply;
    },
  };
  function fcbOpenSettings() {
    document.getElementById("fcbApiKeyInput").value = AIService.getApiKey();
    document.getElementById("fcbModelInput").value = AIService.getModel();
    document.getElementById("fcbSettingsPanel").style.display = "flex";
  }
  function fcbCloseSettings() {
    document.getElementById("fcbSettingsPanel").style.display = "none";
  }
  function fcbSaveSettings() {
    const key = document.getElementById("fcbApiKeyInput").value.trim();
    const model = document.getElementById("fcbModelInput").value.trim();
    AIService.saveSettings(key, model);
    fcbCloseSettings();
    showToast(
      key ? "تم حفظ إعدادات المساعد ✅" : "تم الحفظ — لكن لم تُدخل مفتاح API، سيستخدم المساعد الردود المبرمجة فقط ⚠️",
      key ? "ok" : "info",
    );
  }
  function fcbClearSettings() {
    AIService.clearSettings();
    document.getElementById("fcbApiKeyInput").value = "";
    document.getElementById("fcbModelInput").value = "";
    showToast("تم مسح الإعدادات المحلية 🗑️", "ok");
  }

  /* ════════════════════════════════════════════════════════════════
     📊 بناء ملخص ذكي وشامل من بيانات الداشبورد (من RAW + كل المصادر)
     الهدف: تلخيص آلاف الصفوف في كائن JSON مضغوط يقدر الموديل يفهمه
     ويجاوب عليه بدقة، بدون إرسال كل البيانات الخام (توفير Token)
  ════════════════════════════════════════════════════════════════ */
  function fcbTopN(arr, key, n = 8, asc = true) {
    const valid = arr.filter((r) => null != r[key]);
    const sorted = [...valid].sort((a, b) => (asc ? a[key] - b[key] : b[key] - a[key]));
    return sorted.slice(0, n).map((r) => ({ name: r.name, value: r[key] }));
  }
  function fcbCountBy(arr, key, n = 10) {
    const map = {};
    arr.forEach((r) => {
      const v = (r[key] ?? "").toString().trim();
      if (!v || v === "—" || v === "#N/A") return;
      map[v] = (map[v] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k, v]) => ({ name: k, count: v }));
  }
  function fcbAvg(arr, key) {
    const vals = arr.filter((r) => null != r[key]).map((r) => r[key]);
    return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : null;
  }
  /* ── دوال مساعدة عامة (مضافة لدعم تغطية كل التبويبات في ملخص الشات بوت) ── */
  function fcbSum(arr, key) {
    return arr.reduce((s, r) => s + (Number(r[key]) || 0), 0);
  }
  function fcbNum(v) {
    if (v === null || v === undefined || v === "" || v === "—" || v === "#N/A") return null;
    const f = parseFloat(String(v).replace(/,/g, ""));
    return isFinite(f) ? f : null;
  }
  // يجمع قيمة عددية (numKey) مجمّعة حسب مفتاح فئة (groupKey)، ويرجع أعلى n فئات
  function fcbGroupBySum(arr, groupKey, numKey, n = 10) {
    const map = {};
    arr.forEach((r) => {
      const g = (r[groupKey] ?? "").toString().trim();
      const v = fcbNum(r[numKey]);
      if (!g || g === "—" || v === null) return;
      map[g] = (map[g] || 0) + v;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k, v]) => ({ name: k, value: +v.toFixed(2) }));
  }
  function fcbBuildDashboardSummary() {
    const D = (typeof RAW !== "undefined" && Array.isArray(RAW)) ? RAW : [];
    const total = D.length;
    if (!total) {
      return { error: "لا توجد بيانات محمّلة حالياً في اللوحة. اطلب من المستخدم الضغط على زر التحديث ↻ أولاً." };
    }

    const fcaArr = D.filter((r) => null != r.fca);
    const envArr = D.filter((r) => null != r.envScore);
    const summary = {
      عدد_المباني_الإجمالي: total,
      توزيع_حكومي_مستأجر: fcbCountBy(D, "ownership", 5),
      توزيع_المدن: fcbCountBy(D, "city", 15),
      توزيع_المحافظات: fcbCountBy(D, "sector", 15),
      توزيع_المراحل_الدراسية: fcbCountBy(D, "stage", 10),
      توزيع_الجنس: fcbCountBy(D, "gender", 5),

      تحليل_FCA: {
        عدد_المدارس_المقيّمة: fcaArr.length,
        المتوسط_العام: fcbAvg(D, "fca"),
        عدد_حرجة_اقل_من_25: fcaArr.filter((r) => r.fca < 25).length,
        عدد_متوسطة_25_50: fcaArr.filter((r) => r.fca >= 25 && r.fca < 50).length,
        عدد_جيدة_50_75: fcaArr.filter((r) => r.fca >= 50 && r.fca < 75).length,
        عدد_جيدة_جداً_75_100: fcaArr.filter((r) => r.fca >= 75).length,
        أسوأ_10_مدارس: fcbTopN(fcaArr, "fca", 10, true),
        أفضل_10_مدارس: fcbTopN(fcaArr, "fca", 10, false),
      },

      البيئة_المدرسية: {
        عدد_المدارس_المقيّمة: envArr.length,
        المتوسط_العام: fcbAvg(D, "envScore"),
        أسوأ_10_مدارس: fcbTopN(envArr, "envScore", 10, true),
        أفضل_10_مدارس: fcbTopN(envArr, "envScore", 10, false),
      },

      الطلاب_وعمر_المبنى: {
        إجمالي_الطلاب: D.reduce((s, r) => s + (r.students || 0), 0),
        متوسط_الطلاب_للمدرسة: fcbAvg(D, "students"),
        أكبر_5_مدارس_من_حيث_عدد_الطلاب: fcbTopN(D, "students", 5, false),
        متوسط_عمر_المبنى: fcbAvg(D, "buildingAge"),
        عدد_مبانٍ_عمرها_اكثر_من_40_سنة: D.filter((r) => r.buildingAge > 40).length,
        عدد_مبانٍ_جديدة_اقل_من_10_سنوات: D.filter((r) => r.buildingAge < 10).length,
      },

      الفصول_والتكييف: {
        إجمالي_الفصول: D.reduce((s, r) => s + (r.classrooms || 0), 0),
        إجمالي_وحدات_التكييف: D.reduce((s, r) => s + (r.acUnits || 0), 0),
      },

      البلاغات_الصيانة: {
        إجمالي_البلاغات_من_بيانات_المباني: D.reduce((s, r) => s + (r.alerts || 0), 0),
        أعلى_10_مدارس_بلاغات: fcbTopN(D, "alerts", 10, false),
      },

      الصيانة_الوقائية_حسب_المبنى: {
        ملاحظة: "هذا عدد أعمال/بنود الصيانة الوقائية المسجّلة لكل مبنى من بيانات الخدمات — لتفاصيل أوسع راجع تبويب الصيانة الوقائية مباشرة.",
        إجمالي_بنود_الصيانة_الوقائية: D.reduce((s, r) => s + (r.preventive || 0), 0),
        أعلى_10_مدارس_صيانة_وقائية: fcbTopN(D, "preventive", 10, false),
      },

      التجهيزات_حسب_المبنى: {
        ملاحظة: "هذا عدد بنود التجهيزات المسجّلة لكل مبنى من بيانات الخدمات — لتفاصيل المخزون والاحتياج الكامل راجع قسم تجهيزات_المخزون بالأسفل (من تبويب التجهيزات نفسه).",
        إجمالي_بنود_التجهيزات: D.reduce((s, r) => s + (r.equipment || 0), 0),
        أعلى_10_مدارس_تجهيزات: fcbTopN(D, "equipment", 10, false),
      },

      خنادق_الصرف_حسب_المبنى: {
        إجمالي_من_بيانات_الخدمات: D.reduce((s, r) => s + (r.drainage || 0), 0),
      },

      العقود: {
        أهم_مقاولي_الصيانة: fcbCountBy(D, "contrMaint", 8),
        أهم_مقاولي_التكييف: fcbCountBy(D, "contrAC", 8),
        أهم_مقاولي_النظافة: fcbCountBy(D, "contrClean", 8),
        حالة_الاشتراك_توزيع: fcbCountBy(D, "subscriptionStatus", 8),
      },

      تقييم_عاين: {
        عدد_المقيّم: D.filter((r) => null != r.ayenScore).length,
        المتوسط: fcbAvg(D, "ayenScore"),
      },
    };

    // ════════════════════════════════════════════════════════════════
    // 🏗️ تبويب التجهيزات (window.RAW_TAJHEEZ_INV) — مخزون شامل: مخصص/احتياج/فروقات
    // ════════════════════════════════════════════════════════════════
    try {
      const tajRaw = Array.isArray(window.RAW_TAJHEEZ_INV) ? window.RAW_TAJHEEZ_INV : [];
      if (tajRaw.length && typeof parseTajheezRow === "function") {
        const taj = tajRaw.map(parseTajheezRow).filter((r) => r.صنف || r.قسم);
        const أقسام = [...new Set(taj.map((r) => r.قسم).filter(Boolean))];
        const إجمالي_مخصص_كمية = fcbSum(taj.map((r) => ({ v: r.مخصص?.كلي })), "v");
        const إجمالي_مخصص_قيمة = fcbSum(taj.map((r) => ({ v: r.مخصص?.قيمة })), "v");
        const إجمالي_احتياج_كمية = fcbSum(taj.map((r) => ({ v: r.احتياج?.كلي })), "v");
        const إجمالي_احتياج_قيمة = fcbSum(taj.map((r) => ({ v: r.احتياج?.قيمة })), "v");
        // تجميع الاحتياج بالقيمة حسب القسم (أكبر الأقسام احتياجاً)
        const احتياجَ_حسب_القسم = {};
        taj.forEach((r) => {
          const q = r.قسم || "—";
          const v = r.احتياج?.قيمة || 0;
          if (!v) return;
          احتياجَ_حسب_القسم[q] = (احتياجَ_حسب_القسم[q] || 0) + v;
        });
        const أعلى_10_أقسام_احتياجاً_بالقيمة = Object.entries(احتياجَ_حسب_القسم)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([k, v]) => ({ name: k, value: +v.toFixed(2) }));
        const أعلى_15_صنف_احتياجاً_بالقيمة = [...taj]
          .filter((r) => r.احتياج?.قيمة)
          .sort((a, b) => (b.احتياج.قيمة || 0) - (a.احتياج.قيمة || 0))
          .slice(0, 15)
          .map((r) => ({ القسم: r.قسم, الصنف: r.صنف, قيمة_الاحتياج: r.احتياج.قيمة, كمية_الاحتياج: r.احتياج.كلي }));
        const أعلى_10_فروقات_نقص_بالقيمة = [...taj]
          .filter((r) => null != r.فرق_قيمة)
          .sort((a, b) => (a.فرق_قيمة || 0) - (b.فرق_قيمة || 0)) // أكثر سالب = أكبر نقص
          .slice(0, 10)
          .map((r) => ({ القسم: r.قسم, الصنف: r.صنف, فرق_القيمة: r.فرق_قيمة, فرق_الكمية: r.فرق_كمية }));
        summary.تجهيزات_المخزون = {
          مصدر: "تبويب التجهيزات — ملف التجهيزات_منظف.csv (مخصص حالي مقابل احتياج فعلي لكل مدينة)",
          عدد_الأصناف_الإجمالي: taj.length,
          الأقسام: أقسام,
          عدد_الأقسام: أقسام.length,
          إجمالي_الكمية_المخصصة_حالياً: +إجمالي_مخصص_كمية.toFixed(2),
          إجمالي_قيمة_المخصص_حالياً_ريال: +إجمالي_مخصص_قيمة.toFixed(2),
          إجمالي_الكمية_المطلوبة_احتياج: +إجمالي_احتياج_كمية.toFixed(2),
          إجمالي_قيمة_الاحتياج_ريال: +إجمالي_احتياج_قيمة.toFixed(2),
          الفرق_الإجمالي_قيمة_ريال: +(إجمالي_مخصص_قيمة - إجمالي_احتياج_قيمة).toFixed(2),
          أعلى_10_أقسام_احتياجاً_بالقيمة: أعلى_10_أقسام_احتياجاً_بالقيمة,
          أعلى_15_صنف_احتياجاً_بالقيمة: أعلى_15_صنف_احتياجاً_بالقيمة,
          أعلى_10_فروقات_نقص_بالقيمة_الأكثر_عجزاً: أعلى_10_فروقات_نقص_بالقيمة,
          توزيع_المخصص_حسب_المدينة: {
            مكة: fcbSum(taj.map((r) => ({ v: r.مخصص?.مكة })), "v"),
            جدة: fcbSum(taj.map((r) => ({ v: r.مخصص?.جدة })), "v"),
            الطائف: fcbSum(taj.map((r) => ({ v: r.مخصص?.الطائف })), "v"),
            القنفذة: fcbSum(taj.map((r) => ({ v: r.مخصص?.القنفذة })), "v"),
            الليث: fcbSum(taj.map((r) => ({ v: r.مخصص?.الليث })), "v"),
            المدينة: fcbSum(taj.map((r) => ({ v: r.مخصص?.المدينة })), "v"),
            ينبع: fcbSum(taj.map((r) => ({ v: r.مخصص?.ينبع })), "v"),
            العلا: fcbSum(taj.map((r) => ({ v: r.مخصص?.العلا })), "v"),
            المهد: fcbSum(taj.map((r) => ({ v: r.مخصص?.المهد })), "v"),
          },
          توزيع_الاحتياج_حسب_المدينة: {
            مكة: fcbSum(taj.map((r) => ({ v: r.احتياج?.مكة })), "v"),
            جدة: fcbSum(taj.map((r) => ({ v: r.احتياج?.جدة })), "v"),
            الطائف: fcbSum(taj.map((r) => ({ v: r.احتياج?.الطائف })), "v"),
            المدينة: fcbSum(taj.map((r) => ({ v: r.احتياج?.المدينة })), "v"),
          },
        };
      } else if (tajRaw.length) {
        summary.تجهيزات_المخزون = { تنبيه: "بيانات التجهيزات موجودة لكن دالة parseTajheezRow غير متاحة في هذا السياق.", إجمالي_السجلات: tajRaw.length };
      }
    } catch (e) {
      summary.تجهيزات_المخزون = { تنبيه: "تعذّر تلخيص بيانات التجهيزات: " + (e?.message || e) };
    }

    // ════════════════════════════════════════════════════════════════
    // ⚙️ تبويب الأنظمة الرئيسية والتفصيلية (window.RAW_ALL_SYSTEMS)
    // ════════════════════════════════════════════════════════════════
    try {
      const sysRaw = Array.isArray(window.RAW_ALL_SYSTEMS) ? window.RAW_ALL_SYSTEMS : [];
      if (sysRaw.length) {
        const schoolScores = {};
        sysRaw.forEach((r) => {
          const id = r["رقم المدرسة"];
          if (id && null != r["الدرجة الموزونة الكلية للمبنى"]) {
            schoolScores[id] = fcbNum(r["الدرجة الموزونة الكلية للمبنى"]);
          }
        });
        const scoreVals = Object.values(schoolScores).filter((v) => null != v);
        const avgScore = scoreVals.length ? +(scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length).toFixed(2) : null;
        const tierCount = {};
        sysRaw.forEach((r) => {
          const t = r["فئة الدرجة الموزونة الكلية"];
          if (t) tierCount[t] = (tierCount[t] || 0) + 1;
        });
        const sysSum = {}, sysCnt = {};
        sysRaw.forEach((r) => {
          const s = r["القسم الرئيسي"], v = fcbNum(r["التقييم (1–5)"]);
          if (s && v != null && v > 0) {
            sysSum[s] = (sysSum[s] || 0) + v;
            sysCnt[s] = (sysCnt[s] || 0) + 1;
          }
        });
        const متوسط_كل_نظام_رئيسي = Object.keys(sysSum)
          .map((k) => ({ النظام: k, المتوسط_من_5: +(sysSum[k] / sysCnt[k]).toFixed(2), عدد_التقييمات: sysCnt[k] }))
          .sort((a, b) => a.المتوسط_من_5 - b.المتوسط_من_5);
        const مدن = [...new Set(sysRaw.map((r) => r["المدينة الرئيسية"]).filter(Boolean))];
        summary.الأنظمة_الرئيسية_والتفصيلية = {
          مصدر: "تبويب الأنظمة الرئيسية والتفصيلية — ملف جميع_المدن_جميع_الانظمة",
          إجمالي_سجلات_التقييم: sysRaw.length,
          عدد_المدارس_المقيّمة_بالأنظمة: Object.keys(schoolScores).length,
          متوسط_الدرجة_الموزونة_الكلية_للمباني: avgScore,
          توزيع_فئات_الدرجة_الموزونة: tierCount,
          متوسط_كل_نظام_رئيسي_من_الأضعف_للأقوى: متوسط_كل_نظام_رئيسي,
          المدن_المغطاة: مدن,
        };
      }
    } catch (e) {
      summary.الأنظمة_الرئيسية_والتفصيلية = { تنبيه: "تعذّر تلخيص بيانات الأنظمة: " + (e?.message || e) };
    }

    // ════════════════════════════════════════════════════════════════
    // 🛗 تبويب المصاعد (window.RAW_ELEVATORS)
    // ════════════════════════════════════════════════════════════════
    try {
      const elvRaw = Array.isArray(window.RAW_ELEVATORS) ? window.RAW_ELEVATORS : [];
      if (elvRaw.length) {
        const gv = (r, keys) => {
          for (const k of keys) { const v = r[k]; if (v != null && v !== "" && v !== "—") return v; }
          return null;
        };
        const getCity = (r) => gv(r, ["المدينة_الرئيسية", "المدينة"]);
        const getAge = (r) => fcbNum(gv(r, ["عمر المصعد"]));
        const getCount = (r) => fcbNum(gv(r, ["عدد المصاعد بالمبنى"]));
        const getStatus = (r) => gv(r, ["حالة المصعد"]);
        const totalSchools = new Set(elvRaw.map((r) => gv(r, ["اسم_المدرسة", "اسم المدرسة"])).filter(Boolean)).size;
        const totalElevators = elvRaw.reduce((s, r) => s + (getCount(r) || 0), 0);
        const ages = elvRaw.map(getAge).filter((v) => v != null);
        const avgAge = ages.length ? +(ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : null;
        const broken = elvRaw.filter((r) => { const s = String(getStatus(r) || ""); return s.includes("متعطل") || s.includes("لا يعمل"); }).length;
        const working = elvRaw.filter((r) => { const s = String(getStatus(r) || ""); return s.includes("يعمل") && !s.includes("لا يعمل"); }).length;
        const cityCount = {};
        elvRaw.forEach((r) => { const c = getCity(r); if (c) cityCount[c] = (cityCount[c] || 0) + (getCount(r) || 0); });
        summary.المصاعد = {
          مصدر: "تبويب المصاعد",
          عدد_المدارس_التي_لديها_مصاعد: totalSchools,
          إجمالي_عدد_المصاعد: totalElevators,
          متوسط_عمر_المصعد: avgAge,
          عدد_المصاعد_المتعطلة: broken,
          عدد_المصاعد_العاملة: working,
          توزيع_عدد_المصاعد_حسب_المدينة: cityCount,
        };
      }
    } catch (e) {
      summary.المصاعد = { تنبيه: "تعذّر تلخيص بيانات المصاعد: " + (e?.message || e) };
    }

    // ════════════════════════════════════════════════════════════════
    // 🌊 تبويب خنادق الصرف (window.RAW_KHANADEQ_CITY_DATA)
    // ════════════════════════════════════════════════════════════════
    try {
      const khRaw = Array.isArray(window.RAW_KHANADEQ_CITY_DATA) ? window.RAW_KHANADEQ_CITY_DATA : [];
      if (khRaw.length) {
        const totalSchools = khRaw.reduce((s, r) => s + (r.schools || 0), 0);
        const totalKhanadeq = khRaw.reduce((s, r) => s + (r.khanadeq || 0), 0);
        summary.خنادق_الصرف = {
          مصدر: "تبويب خنادق الصرف",
          إجمالي_المدارس: totalSchools,
          إجمالي_خنادق_الصرف: totalKhanadeq,
          متوسط_خندق_لكل_مدرسة: totalSchools ? +(totalKhanadeq / totalSchools).toFixed(2) : null,
          توزيع_حسب_المدينة: khRaw.map((r) => ({ المدينة: r.city, المدارس: r.schools, الخنادق: r.khanadeq })),
        };
      }
    } catch (e) {
      summary.خنادق_الصرف = { تنبيه: "تعذّر تلخيص بيانات خنادق الصرف: " + (e?.message || e) };
    }

    // ════════════════════════════════════════════════════════════════
    // 💰 تبويب التكلفة (window.RAW_COST_STATE)
    // ════════════════════════════════════════════════════════════════
    try {
      const costState = window.RAW_COST_STATE;
      if (costState && Array.isArray(costState.rows) && costState.rows.length) {
        const rows = costState.rows;
        const totalQty = fcbSum(rows, "quantity");
        const totalPrice = rows.reduce((s, r) => {
          const tp = Number.isFinite(r.totalPrice) ? r.totalPrice
            : (Number.isFinite(r.unitPrice) && Number.isFinite(r.quantity) ? r.unitPrice * r.quantity : 0);
          return s + tp;
        }, 0);
        const بالقيمة_حسب_الفئة = {};
        rows.forEach((r) => {
          const c = r.category || "—";
          const tp = Number.isFinite(r.totalPrice) ? r.totalPrice
            : (Number.isFinite(r.unitPrice) && Number.isFinite(r.quantity) ? r.unitPrice * r.quantity : 0);
          if (c !== "—" && tp) بالقيمة_حسب_الفئة[c] = (بالقيمة_حسب_الفئة[c] || 0) + tp;
        });
        const أعلى_10_فئات_تكلفة = Object.entries(بالقيمة_حسب_الفئة)
          .sort((a, b) => b[1] - a[1]).slice(0, 10)
          .map(([k, v]) => ({ name: k, value: +v.toFixed(2) }));
        const بالقيمة_حسب_المدينة = {};
        rows.forEach((r) => {
          const c = r.city || "—";
          const tp = Number.isFinite(r.totalPrice) ? r.totalPrice
            : (Number.isFinite(r.unitPrice) && Number.isFinite(r.quantity) ? r.unitPrice * r.quantity : 0);
          if (c !== "—" && tp) بالقيمة_حسب_المدينة[c] = (بالقيمة_حسب_المدينة[c] || 0) + tp;
        });
        summary.التكلفة = {
          مصدر: "تبويب التكلفة",
          عدد_المدارس_في_بيانات_التكلفة: (costState.schools || []).length,
          إجمالي_عدد_السجلات: rows.length,
          إجمالي_الكمية: +totalQty.toFixed(2),
          إجمالي_التكلفة_ريال: +totalPrice.toFixed(2),
          أعلى_10_فئات_من_حيث_التكلفة: أعلى_10_فئات_تكلفة,
          التكلفة_حسب_المدينة: Object.entries(بالقيمة_حسب_المدينة).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ المدينة: k, التكلفة: +v.toFixed(2) })),
        };
      } else if (costState && costState.error) {
        summary.التكلفة = { تنبيه: "بيانات التكلفة لم تُحمَّل بنجاح: " + costState.error };
      }
    } catch (e) {
      summary.التكلفة = { تنبيه: "تعذّر تلخيص بيانات التكلفة: " + (e?.message || e) };
    }

    // ── بيانات إضافية من مصادر أخرى (لو متاحة في الصفحة) ──
    try {
      if (Array.isArray(window.RAW_BALAGH) && window.RAW_BALAGH.length) {
        const bal = window.RAW_BALAGH;
        // نحاول استخراج توزيع حسب أكثر مفتاح تصنيف شائع (نوع البلاغ/الحالة) لو موجود
        const sampleKeys = Object.keys(bal[0] || {});
        const typeKey = sampleKeys.find((k) => /نوع|تصنيف|فئة/i.test(k));
        const statusKey = sampleKeys.find((k) => /حالة|status/i.test(k));
        summary.بلاغات_CSV = {
          مصدر: "تبويب البلاغات — ملف بلاغات منفصل (CSV)",
          إجمالي_السجلات: bal.length,
          ...(typeKey ? { توزيع_حسب_النوع: fcbCountBy(bal, typeKey, 10) } : {}),
          ...(statusKey ? { توزيع_حسب_الحالة: fcbCountBy(bal, statusKey, 10) } : {}),
        };
      }
    } catch (_) {}
    try {
      if (Array.isArray(window.RAW_SPARE_PARTS) && window.RAW_SPARE_PARTS.length) {
        const sp = window.RAW_SPARE_PARTS;
        const items = sp.map((r) => ({
          name: String(r["وصف_الصنف"] ?? "—").trim(),
          qty: fcbNum(r["الكمية"]) || 0,
          unitPrice: fcbNum(r["سعر_الوحدة"]) || 0,
        }));
        const totalQty = items.reduce((s, r) => s + r.qty, 0);
        const totalValue = items.reduce((s, r) => s + r.qty * r.unitPrice, 0);
        const valueByItem = {};
        items.forEach((r) => { if (r.name && r.name !== "—") valueByItem[r.name] = (valueByItem[r.name] || 0) + r.qty * r.unitPrice; });
        const أعلى_10_أصناف_قيمة = Object.entries(valueByItem).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => ({ name: k, value: +v.toFixed(2) }));
        summary.قطع_الغيار = {
          مصدر: "تبويب قطع الغيار",
          إجمالي_السجلات: sp.length,
          إجمالي_الكمية: +totalQty.toFixed(2),
          إجمالي_القيمة_التقديرية_ريال: +totalValue.toFixed(2),
          أعلى_10_أصناف_من_حيث_القيمة: أعلى_10_أصناف_قيمة,
        };
      }
    } catch (_) {}
    try {
      if (Array.isArray(window.RAW_FM_CONTRACTS) && window.RAW_FM_CONTRACTS.length) {
        const fm = window.RAW_FM_CONTRACTS;
        const fmNum = (v) => { const n = parseFloat(String(v||"").replace(/,/g,"").replace(/ - /g,"").trim()); return isFinite(n)?n:null; };
        const fmRemDays = (r) => fmNum(r["المدة المتبقية بالأيام"]);

        // إحصائيات الحالة
        const active   = fm.filter(r => { const d=fmRemDays(r); return d!=null && d>0; }).length;
        const expired  = fm.filter(r => { const d=fmRemDays(r); return d!=null && d<=0; }).length;
        const expiring = fm.filter(r => { const d=fmRemDays(r); return d!=null && d>0 && d<=90; }).length;
        const noDate   = fm.filter(r => fmRemDays(r)==null).length;

        // مشاهد الإنجاز
        const scenesComplete   = fm.filter(r => String(r["حالة مشاهد الإنجاز (مكتملة / غير مكتملة)"]||"").includes("مكتملة") && !String(r["حالة مشاهد الإنجاز (مكتملة / غير مكتملة)"]||"").includes("غير")).length;
        const scenesIncomplete = fm.filter(r => String(r["حالة مشاهد الإنجاز (مكتملة / غير مكتملة)"]||"").includes("غير مكتملة")).length;

        // القيم المالية
        const totalBase    = fm.reduce((s,r)=>s+(fmNum(r["قيمة العقد الأساسي"])||0),0);
        const totalUpdated = fm.reduce((s,r)=>s+(fmNum(r["قيمة العقد المحدثة"])||0),0);
        const totalSpent   = fm.reduce((s,r)=>s+(fmNum(r["تراكمي المستخلصات المصروفة"])||0),0);
        const totalDue     = fm.reduce((s,r)=>s+(fmNum(r["القيمة المستحقة للمستخلصات حتى تاريخه"])||0),0);
        const totalLastInv = fm.reduce((s,r)=>s+(fmNum(r["القيمة"])||0),0);

        // توزيعات
        const byRegion     = fcbCountBy(fm, "المنطقة", 10);
        const byScope      = fcbCountBy(fm, "النطاق", 15);
        const byContractor = fcbCountBy(fm, "المقاول", 15);

        // أعلى عقود من حيث القيمة المستحقة غير المصروفة
        const topDue = [...fm]
          .filter(r => fmNum(r["القيمة المستحقة للمستخلصات حتى تاريخه"]) > 0)
          .sort((a,b) => (fmNum(b["القيمة المستحقة للمستخلصات حتى تاريخه"])||0) - (fmNum(a["القيمة المستحقة للمستخلصات حتى تاريخه"])||0))
          .slice(0,10)
          .map(r => ({
            المقاول: r["المقاول"],
            المشروع: String(r["المشروع"]||"").slice(0,60),
            رقم_العقد: r["رقم العقد"],
            المنطقة: r["المنطقة"],
            القيمة_المستحقة: fmNum(r["القيمة المستحقة للمستخلصات حتى تاريخه"]),
            نسبة_الإنجاز: r["نسبة الإنجاز  POC%"] || r["نسبة الإنجاز POC%"],
            حالة_مشاهد: r["حالة مشاهد الإنجاز (مكتملة / غير مكتملة)"],
            الإجراءات: String(r["الإجراءات المتخذة والملاحظات"]||"").slice(0,120),
          }));

        // عقود منتهية مع ملاحظات
        const expiredContracts = [...fm]
          .filter(r => { const d=fmRemDays(r); return d!=null && d<=0; })
          .sort((a,b) => (fmRemDays(a)||0) - (fmRemDays(b)||0))
          .slice(0,10)
          .map(r => ({
            المقاول: r["المقاول"],
            رقم_العقد: r["رقم العقد"],
            المنطقة: r["المنطقة"],
            المدة_المتبقية: fmRemDays(r),
            نسبة_الإنجاز: r["نسبة الإنجاز  POC%"] || r["نسبة الإنجاز POC%"],
            الإجراءات: String(r["الإجراءات المتخذة والملاحظات"]||"").slice(0,120),
          }));

        summary.عقود_FM = {
          مصدر: "تبويب عقود غير المجال — شيت عقود_عدا_المجال",
          إجمالي_العقود: fm.length,
          حالة_العقود: { جارية: active, منتهية: expired, قاربت_الانتهاء_90_يوم: expiring, بدون_تاريخ: noDate },
          مشاهد_الإنجاز: { مكتملة: scenesComplete, غير_مكتملة: scenesIncomplete },
          ملخص_مالي_ريال: {
            إجمالي_قيمة_العقود_الأساسية: +totalBase.toFixed(0),
            إجمالي_قيمة_العقود_المحدثة: +totalUpdated.toFixed(0),
            إجمالي_المستخلصات_المصروفة: +totalSpent.toFixed(0),
            نسبة_الصرف_من_المحدثة: totalUpdated ? +(totalSpent/totalUpdated*100).toFixed(1) : 0,
            إجمالي_القيمة_المستحقة_غير_المصروفة: +totalDue.toFixed(0),
            إجمالي_آخر_مستخلص_شهري: +totalLastInv.toFixed(0),
          },
          توزيع_حسب_المنطقة: byRegion,
          توزيع_حسب_النطاق: byScope,
          توزيع_حسب_المقاول: byContractor,
          أعلى_10_عقود_من_حيث_القيمة_المستحقة_غير_المصروفة: topDue,
          أبرز_العقود_المنتهية: expiredContracts,
        };
      }
    } catch (e) {
      summary.عقود_FM = { تنبيه: "تعذّر تلخيص بيانات عقود غير المجال: " + (e?.message || e) };
    }
    try {
      if (Array.isArray(window.RAW_INVOICES_TRACKER) && window.RAW_INVOICES_TRACKER.length) {
        const inv = window.RAW_INVOICES_TRACKER;
        const sampleKeys = Object.keys(inv[0] || {});
        const amountKey = sampleKeys.find((k) => /قيمة|مبلغ|amount|سعر/i.test(k));
        const statusKey = sampleKeys.find((k) => /حالة|status/i.test(k));
        summary.متابعة_الفواتير = {
          مصدر: "تبويب متابعة الفواتير",
          إجمالي_السجلات: inv.length,
          ...(amountKey ? { إجمالي_القيمة_ريال: +fcbSum(inv.map((r) => ({ v: fcbNum(r[amountKey]) })), "v").toFixed(2) } : {}),
          ...(statusKey ? { توزيع_حسب_الحالة: fcbCountBy(inv, statusKey, 10) } : {}),
        };
      }
    } catch (_) {}
    try {
      const payRows = Array.isArray(window.RAW_PAYMENTS) ? window.RAW_PAYMENTS : [];
      const payData = payRows.filter(r => {
        const cn = (r["Contract No."] || r["Contract_No"] || "").toString().toUpperCase().trim();
        const rg = (r["Region"] || "").toString().toUpperCase().trim();
        return cn !== "TOTAL" && rg !== "ALL REGIONS";
      });
      const totalRow = payRows.find(r =>
        (r["Contract No."] || r["Contract_No"] || "").toString().toUpperCase().trim() === "TOTAL" ||
        (r["Region"] || "").toString().toUpperCase().trim() === "ALL REGIONS"
      );
      if (payRows.length) {
        const pn = (v) => { const n = parseFloat(String(v||0).replace(/,/g,"")); return isNaN(n)?0:n; };
        const paid     = pn(totalRow?.["Payment Released (SAR)"] || 0) || payData.reduce((s,r)=>s+pn(r["Payment Released (SAR)"]||0),0);
        const updated  = pn(totalRow?.["Updated Contract Value (SAR)"] || 0) || payData.reduce((s,r)=>s+pn(r["Updated Contract Value (SAR)"]||0),0);
        const remaining= pn(totalRow?.["Remaining (SAR)"] || 0) || payData.reduce((s,r)=>s+pn(r["Remaining (SAR)"]||0),0);
        const pct      = updated > 0 ? ((paid/updated)*100).toFixed(1) : "0";
        summary.المدفوعات = {
          عدد_العقود: payData.length,
          إجمالي_قيمة_العقود_المحدثة: Math.round(updated).toLocaleString("en-US") + " SAR",
          المدفوعات_المصروفة: Math.round(paid).toLocaleString("en-US") + " SAR",
          المتبقي: Math.round(remaining).toLocaleString("en-US") + " SAR",
          نسبة_الصرف: pct + "%",
          تفاصيل_العقود: payData.map(r => ({
            المنطقة: r["Region"] || "—",
            رقم_العقد: r["Contract No."] || "—",
            مدفوع: pn(r["Payment Released (SAR)"]||0).toLocaleString("en-US") + " SAR",
            نسبة: (() => { const p=pn(r["% Paid"]||0); return ((p<=1?p*100:p).toFixed(1))+"%"; })(),
          })),
        };
      }
    } catch (_) {}

    // ════════════════════════════════════════════════════════════════
    // 🧍 تبويب البوابين (window.RAW_GATEKEEPERS)
    // أعمدة: المدينة، اسم المدرسة، الرقم الوزاري، اسم البواب، رقم الجوال، رقم الهوية
    // ════════════════════════════════════════════════════════════════
    try {
      const gkRaw = Array.isArray(window.RAW_GATEKEEPERS) ? window.RAW_GATEKEEPERS : [];
      if (gkRaw.length) {
        const norm = (v) => String(v == null ? "" : v).replace(/\uFEFF/g, "").trim();
        const gk = gkRaw.map(r => ({
          city:       norm(r["المدينة"]),
          schoolName: norm(r["اسم المدرسة"]),
          minId:      norm(r["الرقم الوزاري"]),
          gateName:   norm(r["اسم البواب"]),
          phone:      norm(r["رقم الجوال"]),
          nationalId: norm(r["رقم الهوية"]),
        }));

        // توزيع حسب المدينة
        const byCity = {};
        gk.forEach(r => { if (r.city) byCity[r.city] = (byCity[r.city] || 0) + 1; });
        const توزيع_حسب_المدينة = Object.entries(byCity)
          .sort((a,b) => b[1]-a[1])
          .map(([k,v]) => ({ المدينة: k, عدد_البوابين: v }));

        // المدارس المغطاة لكل مدينة
        const schoolsByCity = {};
        gk.forEach(r => {
          if (!r.city) return;
          if (!schoolsByCity[r.city]) schoolsByCity[r.city] = new Set();
          if (r.minId || r.schoolName) schoolsByCity[r.city].add(r.minId || r.schoolName);
        });
        const مدارس_مغطاة_حسب_المدينة = Object.entries(schoolsByCity)
          .sort((a,b) => b[1].size - a[1].size)
          .map(([k,v]) => ({ المدينة: k, عدد_المدارس: v.size }));

        // بوابين بدون جوال
        const noPhone = gk.filter(r => !r.phone);

        // قائمة كاملة بالبوابين (للتشات يقدر يجاوب "مين بواب مدرسة X")
        const قائمة_البوابين_كاملة = gk.map(r => ({
          المدينة: r.city,
          اسم_المدرسة: r.schoolName,
          الرقم_الوزاري: r.minId,
          اسم_البواب: r.gateName,
          رقم_الجوال: r.phone || "—",
          رقم_الهوية: r.nationalId || "—",
        }));

        // ⚠️ قائمة_البوابين_كاملة لا تُحفظ هنا — تُحقن في الـ context بشكل منفصل عند الطلب فقط
        // (window.__GK_FULL__ يُستخدم داخل fcbAskOpenAI عند الكشف عن سؤال عن بواب)
        window.__GK_FULL__ = gk;
        summary.البوابين = {
          مصدر: "تبويب البوابين — قائمة_البوابين_منظفة",
          إجمالي_البوابين: gk.length,
          عدد_المدارس_المغطاة: new Set(gk.map(r => r.minId || r.schoolName).filter(Boolean)).size,
          عدد_المدن: Object.keys(byCity).length,
          بدون_رقم_جوال: noPhone.length,
          توزيع_حسب_المدينة,
          مدارس_مغطاة_حسب_المدينة,
        };
      }
    } catch (e) {
      summary.البوابين = { تنبيه: "تعذّر تلخيص بيانات البوابين: " + (e?.message || e) };
    }

    // ════════════════════════════════════════════════════════════════
    // 📈 تاريخ تقييمات FCA (window.RAW_FCA_HISTORY)
    // ════════════════════════════════════════════════════════════════
    try {
      const fcaH = Array.isArray(window.RAW_FCA_HISTORY) ? window.RAW_FCA_HISTORY : [];
      if (fcaH.length) {
        const getMrhalah = (r) => r["المرحلة"] || r["stage"] || r["مرحلة"] || "";
        const getScore   = (r) => { const v = r["الدرجة"] ?? r["درجة"] ?? r["fca"] ?? r["score"]; const n = parseFloat(v); return isFinite(n) ? n : null; };
        const getYear    = (r) => r["السنة"] || r["year"] || r["عام"] || "";
        const getCity    = (r) => r["المدينة"] || r["city"] || r["مدينة"] || "";

        const يقيمات_حسب_المرحلة = {};
        fcaH.forEach(r => {
          const m = getMrhalah(r);
          const s = getScore(r);
          if (m && s != null) {
            if (!يقيمات_حسب_المرحلة[m]) يقيمات_حسب_المرحلة[m] = [];
            يقيمات_حسب_المرحلة[m].push(s);
          }
        });
        const متوسط_حسب_المرحلة = Object.entries(يقيمات_حسب_المرحلة).map(([k,v]) => ({
          المرحلة: k,
          متوسط_FCA: +(v.reduce((a,b)=>a+b,0)/v.length).toFixed(2),
          عدد_التقييمات: v.length,
        }));

        const يقيمات_حسب_السنة = {};
        fcaH.forEach(r => {
          const y = String(getYear(r)).trim();
          const s = getScore(r);
          if (y && s != null) {
            if (!يقيمات_حسب_السنة[y]) يقيمات_حسب_السنة[y] = [];
            يقيمات_حسب_السنة[y].push(s);
          }
        });
        const اتجاه_FCA_عبر_السنوات = Object.entries(يقيمات_حسب_السنة)
          .sort((a,b) => a[0].localeCompare(b[0]))
          .map(([k,v]) => ({
            السنة: k,
            متوسط_FCA: +(v.reduce((a,b)=>a+b,0)/v.length).toFixed(2),
            عدد_التقييمات: v.length,
          }));

        summary.تاريخ_تقييمات_FCA = {
          مصدر: "تبويب تحليل FCA — تاريخ التقييمات",
          إجمالي_السجلات: fcaH.length,
          متوسط_حسب_المرحلة,
          اتجاه_FCA_عبر_السنوات,
        };
      }
    } catch (e) {
      summary.تاريخ_تقييمات_FCA = { تنبيه: "تعذّر تلخيص تاريخ تقييمات FCA: " + (e?.message || e) };
    }

    // ════════════════════════════════════════════════════════════════
    // 📋 تبويب البلاغات (window.RAW_BALAGH)
    // الأعمدة: Record No., Status, Category, Priority, School Name, School Number,
    //          Location, Problem Description, SLA DAYS, Sla Status, Creation Date
    // ════════════════════════════════════════════════════════════════
    try {
      const bal = Array.isArray(window.RAW_BALAGH) ? window.RAW_BALAGH : [];
      if (bal.length) {
        const n = (v) => String(v ?? "").replace(/\uFEFF/g, "").trim();
        const CLOSED = new Set(["تم حله","ملغى","ملغي","مغلق","closed","cancelled","resolved"]);
        const INPROG = new Set(["قيد التنفيذ","موافقة الاستشاري قيد التنفيذ","in progress","consultant approval in progress"]);
        const isClosed = (s) => CLOSED.has(n(s).toLowerCase());
        const isInProg = (s) => INPROG.has(n(s).toLowerCase());

        const rows = bal.map(r => ({
          recordNo:    n(r["Record No."]),
          status:      n(r["Status"]),
          category:    n(r["Category"]),
          priority:    n(r["Priority"]),
          schoolName:  n(r["School Name"]),
          schoolNo:    n(r["School Number"]),
          location:    n(r["Location"]),
          problem:     n(r["Problem Description"]),
          slaDays:     n(r["SLA DAYS"]),
          slaStatus:   n(r["Sla Status"]),
          created:     n(r["Creation Date.1"] || r["Creation Date"]),
        })).filter(r => r.recordNo || r.schoolName);

        const closed   = rows.filter(r => isClosed(r.status)).length;
        const inprog   = rows.filter(r => isInProg(r.status)).length;
        const open     = rows.filter(r => !isClosed(r.status) && !isInProg(r.status)).length;

        // فئات وأولويات
        const byCategory = {}; rows.forEach(r => { if(r.category) byCategory[r.category]=(byCategory[r.category]||0)+1; });
        const byPriority = {}; rows.forEach(r => { if(r.priority) byPriority[r.priority]=(byPriority[r.priority]||0)+1; });
        const byLocation = {}; rows.forEach(r => { if(r.location) byLocation[r.location]=(byLocation[r.location]||0)+1; });

        // أعلى مدارس في عدد البلاغات
        const bySchool = {}; rows.forEach(r => { if(r.schoolName) bySchool[r.schoolName]=(bySchool[r.schoolName]||0)+1; });
        const أعلى_10_مدارس = Object.entries(bySchool).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>({المدرسة:k,عدد_البلاغات:v}));

        // متأخرة (SLA سالبة)
        const overdue = rows.filter(r => { const m=String(r.slaDays||"").match(/-?\d+/); return m && Number(m[0])<0; });

        summary.البلاغات = {
          مصدر: "تبويب البلاغات — ملف البلاغات CSV",
          إجمالي_البلاغات: rows.length,
          حالة_البلاغات: { مغلقة: closed, قيد_التنفيذ: inprog, مفتوحة_أخرى: open },
          متأخرة_عن_SLA: overdue.length,
          توزيع_حسب_الفئة: Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>({الفئة:k,العدد:v})),
          توزيع_حسب_الأولوية: Object.entries(byPriority).sort((a,b)=>b[1]-a[1]).map(([k,v])=>({الأولوية:k,العدد:v})),
          توزيع_حسب_الموقع: Object.entries(byLocation).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>({الموقع:k,العدد:v})),
          أعلى_10_مدارس_في_عدد_البلاغات: أعلى_10_مدارس,
        };
      }
    } catch (e) {
      summary.البلاغات = { تنبيه: "تعذّر تلخيص البلاغات: " + (e?.message || e) };
    }

    // ════════════════════════════════════════════════════════════════
    // 📊 تبويب مؤشرات الأداء للمقاول (MAG_KPI_DATA — بيانات ثابتة في الكود)
    // ════════════════════════════════════════════════════════════════
    try {
      if (typeof MAG_KPI_DATA !== "undefined" && Array.isArray(MAG_KPI_DATA) && MAG_KPI_DATA.length) {
        const months = typeof MAG_KPI_MONTHS !== "undefined" ? MAG_KPI_MONTHS : [];
        const kpiRows = MAG_KPI_DATA.map(r => {
          const vals = r.values || [];
          const avg  = vals.length ? +(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2) : null;
          const last = vals.length ? vals[vals.length-1] : null;
          const monthData = {};
          months.forEach((m,i) => { if (vals[i] != null) monthData[m] = vals[i]; });
          return { المنطقة: r.region, رقم_العقد: r.contract, متوسط_الأداء: avg, آخر_شهر: last, الأداء_الشهري: monthData };
        });
        const أقل_منطقة = kpiRows.reduce((a,b)=>(a.متوسط_الأداء||100)<(b.متوسط_الأداء||100)?a:b, kpiRows[0]);
        summary.مؤشرات_أداء_المقاول = {
          مصدر: "تبويب مؤشرات الأداء — MAG_KPI_DATA",
          الشهور_المتاحة: months,
          تفاصيل_حسب_المنطقة: kpiRows,
          أقل_منطقة_أداءً: أقل_منطقة?.المنطقة,
          متوسط_الأداء_الكلي: kpiRows.length ? +(kpiRows.reduce((s,r)=>s+(r.متوسط_الأداء||0),0)/kpiRows.length).toFixed(2) : null,
        };
      }
    } catch (e) {
      summary.مؤشرات_أداء_المقاول = { تنبيه: "تعذّر تلخيص مؤشرات الأداء: " + (e?.message || e) };
    }

    // ════════════════════════════════════════════════════════════════
    // ❄️ تبويب خطة استبدال المكيفات (RAW — من بيانات المباني الرئيسية)
    // الحقول المستخدمة: acUnits, acWindowUnits, acSplitUnits, acPlanYear
    // ════════════════════════════════════════════════════════════════
    try {
      const D = (typeof RAW !== "undefined" && Array.isArray(RAW)) ? RAW : [];
      if (D.length) {
        const withAC = D.filter(r => null != r.acUnits);
        const totalWindow = D.reduce((s,r)=>s+(r.acWindowUnits||0),0);
        const totalSplit  = D.reduce((s,r)=>s+(r.acSplitUnits||0),0);
        const totalAC     = D.reduce((s,r)=>s+(r.acUnits||0),0);
        const byPlanYear  = {};
        D.forEach(r => { const y=r.acPlanYear||r.replacementYear; if(y) byPlanYear[y]=(byPlanYear[y]||0)+1; });
        summary.خطة_استبدال_المكيفات = {
          إجمالي_وحدات_التكييف: totalAC,
          وحدات_شباك: totalWindow,
          وحدات_سبلت: totalSplit,
          مدارس_بها_وحدات_تكييف: withAC.length,
          توزيع_خطة_الاستبدال_حسب_السنة: Object.entries(byPlanYear).sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>({السنة:k,عدد_المدارس:v})),
        };
      }
    } catch (e) {
      summary.خطة_استبدال_المكيفات = { تنبيه: "تعذّر تلخيص خطة المكيفات: " + (e?.message || e) };
    }

    // ════════════════════════════════════════════════════════════════
    // 🗺️ تبويب الخريطة — ملخص للمساعد (بيانات المباني مع الإحداثيات)
    // ════════════════════════════════════════════════════════════════
    try {
      const D = (typeof RAW !== "undefined" && Array.isArray(RAW)) ? RAW : [];
      const withCoords = D.filter(r => r.lat && r.lng);
      const byCity = {};
      withCoords.forEach(r => { const c=r.city||"غير محدد"; byCity[c]=(byCity[c]||0)+1; });
      summary.الخريطة = {
        إجمالي_المباني_على_الخريطة: withCoords.length,
        بدون_إحداثيات: D.length - withCoords.length,
        توزيع_حسب_المدينة: Object.entries(byCity).sort((a,b)=>b[1]-a[1]).map(([k,v])=>({المدينة:k,عدد:v})),
      };
    } catch (e) {}

    // ════════════════════════════════════════════════════════════════
    // 👨‍🎓 تبويب الطلاب وعمر المبنى — تفاصيل إضافية أعمق
    // ════════════════════════════════════════════════════════════════
    try {
      const D = (typeof RAW !== "undefined" && Array.isArray(RAW)) ? RAW : [];
      if (D.length) {
        const ageGroups = {
          "أقل من 10 سنوات": D.filter(r=>r.buildingAge!=null && r.buildingAge<10).length,
          "10 إلى 20 سنة":   D.filter(r=>r.buildingAge!=null && r.buildingAge>=10 && r.buildingAge<20).length,
          "20 إلى 30 سنة":   D.filter(r=>r.buildingAge!=null && r.buildingAge>=20 && r.buildingAge<30).length,
          "30 إلى 40 سنة":   D.filter(r=>r.buildingAge!=null && r.buildingAge>=30 && r.buildingAge<40).length,
          "أكثر من 40 سنة":  D.filter(r=>r.buildingAge!=null && r.buildingAge>=40).length,
        };
        const topStudents = [...D].filter(r=>r.students>0).sort((a,b)=>b.students-a.students).slice(0,10).map(r=>({الاسم:r.name,المدينة:r.city,عدد_الطلاب:r.students,عمر_المبنى:r.buildingAge}));
        const topAge = [...D].filter(r=>r.buildingAge>0).sort((a,b)=>b.buildingAge-a.buildingAge).slice(0,10).map(r=>({الاسم:r.name,المدينة:r.city,عمر_المبنى:r.buildingAge,درجة_FCA:r.fca}));
        summary.الطلاب_وعمر_المبنى_تفصيلي = {
          توزيع_أعمار_المباني: ageGroups,
          أعلى_10_مدارس_طلاباً: topStudents,
          أقدم_10_مباني: topAge,
          متوسط_عمر_المبنى: D.filter(r=>r.buildingAge!=null).length ? +(D.reduce((s,r)=>s+(r.buildingAge||0),0)/D.filter(r=>r.buildingAge!=null).length).toFixed(1) : null,
        };
      }
    } catch (e) {}

    // ════════════════════════════════════════════════════════════════
    // 🔍 تبويب تقييم عاين — تفاصيل إضافية
    // ════════════════════════════════════════════════════════════════
    try {
      const D = (typeof RAW !== "undefined" && Array.isArray(RAW)) ? RAW : [];
      const ayenArr = D.filter(r => r.ayenScore != null);
      if (ayenArr.length) {
        const tiers = {
          "حرج (أقل من 25)":      ayenArr.filter(r=>r.ayenScore<25).length,
          "متوسط (25-50)":         ayenArr.filter(r=>r.ayenScore>=25&&r.ayenScore<50).length,
          "جيد (50-75)":           ayenArr.filter(r=>r.ayenScore>=50&&r.ayenScore<75).length,
          "جيد جداً (75-100)":     ayenArr.filter(r=>r.ayenScore>=75).length,
        };
        const worst = [...ayenArr].sort((a,b)=>a.ayenScore-b.ayenScore).slice(0,10).map(r=>({الاسم:r.name,المدينة:r.city,تقييم_عاين:r.ayenScore,FCA:r.fca}));
        const byCity = {};
        ayenArr.forEach(r=>{ const c=r.city||"—"; if(!byCity[c]) byCity[c]=[]; byCity[c].push(r.ayenScore); });
        const متوسط_عاين_حسب_المدينة = Object.entries(byCity).map(([k,v])=>({المدينة:k,المتوسط:+(v.reduce((a,b)=>a+b,0)/v.length).toFixed(2),عدد:v.length})).sort((a,b)=>a.المتوسط-b.المتوسط);
        summary.تقييم_عاين_تفصيلي = {
          عدد_المقيّمة: ayenArr.length,
          المتوسط_العام: +(ayenArr.reduce((s,r)=>s+r.ayenScore,0)/ayenArr.length).toFixed(2),
          توزيع_التصنيفات: tiers,
          أسوأ_10_مدارس: worst,
          متوسط_حسب_المدينة: متوسط_عاين_حسب_المدينة,
        };
      }
    } catch (e) {}

    // ════════════════════════════════════════════════════════════════
    // 📈 تبويب المرحلة الدراسية — تحليل حسب المرحلة
    // ════════════════════════════════════════════════════════════════
    try {
      const D = (typeof RAW !== "undefined" && Array.isArray(RAW)) ? RAW : [];
      if (D.length) {
        const stageMap = {};
        D.forEach(r => {
          const s = r.stage || r.مرحلة || "غير محدد";
          if (!stageMap[s]) stageMap[s] = { count:0, fcaSum:0, fcaCount:0, envSum:0, envCount:0, students:0 };
          stageMap[s].count++;
          if (r.fca != null) { stageMap[s].fcaSum+=r.fca; stageMap[s].fcaCount++; }
          if (r.envScore != null) { stageMap[s].envSum+=r.envScore; stageMap[s].envCount++; }
          stageMap[s].students += r.students||0;
        });
        summary.المرحلة_الدراسية = {
          تحليل_حسب_المرحلة: Object.entries(stageMap).map(([k,v])=>({
            المرحلة: k,
            عدد_المدارس: v.count,
            متوسط_FCA: v.fcaCount ? +(v.fcaSum/v.fcaCount).toFixed(2) : null,
            متوسط_البيئة: v.envCount ? +(v.envSum/v.envCount).toFixed(2) : null,
            إجمالي_الطلاب: v.students,
          })),
        };
      }
    } catch (e) {}

    return summary;


  }

  /* ════════════════════════════════════════════════════════════════
     🧮 محرّك أولويات وحلول إدارة المرافق (Facilities Decision Engine)
     يحسب فعلياً من البيانات الخام درجة خطورة لكل مبنى ويرتّب الأولويات
     بمنطق متعارف عليه في إدارة المرافق: FCA + عمر المبنى + البلاغات
     + البيئة المدرسية، ثم يصنّف الحل المناسب (استبدال/إصلاح/مراقبة)
  ════════════════════════════════════════════════════════════════ */
  function fcbConditionTier(conditionScore) {
    if (conditionScore < 25) return { tier: "حرج 🔴", action: "تدخّل عاجل خلال 30 يوماً — جدولة فحص فني ميداني وتخصيص بند طارئ بالميزانية." };
    if (conditionScore < 50) return { tier: "متوسط 🟠", action: "صيانة تصحيحية مجدولة خلال الفصل الحالي، مع مراجعة عقد المقاول المسؤول." };
    if (conditionScore < 75) return { tier: "جيد 🟡", action: "صيانة وقائية دورية + إعادة تقييم بعد 2-3 أشهر." };
    return { tier: "جيد جداً 🟢", action: "مراقبة روتينية ضمن خطة الصيانة الوقائية العامة." };
  }

  function fcbBuildPriorityActions(topN = 8) {
    const D = (typeof RAW !== "undefined" && Array.isArray(RAW)) ? RAW : [];
    if (!D.length) return null;

    const maxAlerts = Math.max(1, ...D.map((r) => r.alerts || 0));
    const scored = D
      .filter((r) => null != r.fca)
      .map((r) => {
        // درجة الخطورة الداخلية (لترتيب الأولوية فقط): FCA منخفض يرفعها، عمر المبنى
        // الكبير يرفعها، البيئة الضعيفة ترفعها، وكثرة البلاغات ترفعها — كل عامل بوزنه
        const fcaRisk = (100 - (r.fca ?? 100)) * 0.5;
        const ageRisk = Math.min(100, ((r.buildingAge ?? 0) / 50) * 100) * 0.2;
        const envRisk = (100 - (r.envScore ?? 100)) * 0.15;
        const alertsRisk = (((r.alerts ?? 0) / maxAlerts) * 100) * 0.15;
        const riskScore = Math.round(fcaRisk + ageRisk + envRisk + alertsRisk);
        // درجة الحالة المعروضة من 100 (الأعلى = أفضل) — معكوسة عن درجة الخطورة
        // لتتوافق مع نظام التصنيف الموحّد المستخدم في كل اللوحة (حرج → جيد جداً)
        const conditionScore = Math.max(0, Math.min(100, 100 - riskScore));
        return { name: r.name, fca: r.fca, buildingAge: r.buildingAge, envScore: r.envScore, alerts: r.alerts, riskScore, conditionScore };
      })
      .sort((a, b) => b.riskScore - a.riskScore);

    const top = scored.slice(0, topN).map((r) => ({ ...r, ...fcbConditionTier(r.conditionScore) }));
    const tierCounts = { "حرج 🔴": 0, "متوسط 🟠": 0, "جيد 🟡": 0, "جيد جداً 🟢": 0 };
    scored.forEach((r) => { tierCounts[fcbConditionTier(r.conditionScore).tier]++; });

    return { top, tierCounts, totalScored: scored.length };
  }

  /* ════════════════════════════════════════════════════════════════
     🧠 ردود مبرمجة بسيطة (Rule-based) — تُستخدم فقط كحل احتياطي
     لو ما فيه مفتاح API أو فشل الاتصال بـ OpenAI
  ════════════════════════════════════════════════════════════════ */
  const FCB_RULES = [
    { test: /هذه اللوحة|عن اللوحة|اللوحة دي|what is this dashboard|من انت|انت مين|مين انت/i, reply: "أنا مساعد إدارة المرافق الذكي 🏫 — أساعدك في تحليل الحالة الفنية FCA، الصيانة الوقائية والتصحيحية، إدارة العقود والأصول، التجهيزات المدرسية، والبوابين وأنظمة المباني. اسألني عن أي قسم في اللوحة 📊" },
    { test: /تبويب|تبويبات|اقسام|أقسام|tabs|قائمة|أين أجد|وين الاقي|where/i, reply: "التبويبات الرئيسية في الشريط العلوي:\n• نظرة عامة — أهم المؤشرات KPIs\n• تحليل FCA — الحالة الفنية للمباني\n• البيئة المدرسية — جودة بيئة التعلم\n• العقود — حالة ومدد التعاقدات\n• عقود غير المجال — عقود FM\n• الصيانة الوقائية — جدولة الأعمال المبرمجة\n• البلاغات — الأعطال والاستجابة\n• التجهيزات — الأصول ودورة حياتها\n• الأنظمة الرئيسية — التكييف والكهرباء والسباكة\n• البوابين — قائمة البوابين وبيانات التواصل\n• الخريطة — توزيع المواقع جغرافياً 🗂️" },
    { test: /fca|الحالة الفنية|تقييم المبان|حالة المبان|بنية تحتية/i, reply: "تقييم الحالة الفنية FCA (Facility Condition Assessment) 🏗️\n\nيقيس حالة المبنى من 0-100 ويُصنَّف:\n• 75-100: جيد جداً 🟢 — مراقبة روتينية\n• 50-74: جيد 🟡 — صيانة وقائية دورية\n• 25-49: متوسط 🟠 — صيانة تصحيحية عاجلة\n• 0-24: حرج 🔴 — تدخّل فوري خلال 30 يوماً\n\nقاعدة الاستبدال: إذا تجاوزت تكاليف الإصلاح 60% من قيمة الاستبدال، الاستبدال أجدى اقتصادياً." },
    { test: /بيئة|نظاف|ترتيب|جودة البيئة|environment/i, reply: "البيئة المدرسية 🌿 — مؤشر مباشر على جودة الخدمة وسلامة المستخدمين.\n\nتشمل: النظافة، السلامة، الراحة الحرارية، والإضاءة. تبويب البيئة يعرض أفضل 10 وأسوأ 10 مدارس — ركّز جهود التحسين على الأدنى أداءً أولاً." },
    { test: /عقد|عقود|تعاقد|مورد|contract|انتهاء|تجديد/i, reply: "إدارة العقود 📁\n\n• تتبّع تواريخ الانتهاء وتجديدها قبل 60-90 يوماً لضمان استمرارية الخدمة.\n• قياس أداء المقاول وربطه بجودة الصيانة الفعلية (SLA).\n• توثيق كل أعمال الصيانة المنجزة.\n\nتبويب العقود يعرض كل التعاقدات مع حالتها ومدتها، وتبويب عقود غير المجال يعرض عقود FM." },
    { test: /صيان|بلاغ|عطل|إصلاح|maintenance|work order|أمر عمل|وقائية/i, reply: "الصيانة الوقائية والتصحيحية 🔧\n\n• الصيانة الوقائية: تخطيط مسبق لتفادي الأعطال قبل وقوعها.\n• الصيانة التصحيحية: استجابة سريعة لإصلاح الأعطال الطارئة.\n\nتبويب الصيانة الوقائية يعرض الأعمال المجدولة، وتبويب البلاغات يتابع الأعطال وسرعة الاستجابة." },
    { test: /تجهيز|أصول|اصول|معدات|asset|equipment|جرد|استبدال/i, reply: "إدارة الأصول والتجهيزات 🪑\n\n• توثيق الأصول وتصنيفها وتتبع حالتها.\n• تخطيط الاستبدال بناءً على العمر التشغيلي وتكاليف الصيانة.\n\nتبويب التجهيزات يحصر الأصول مع الفرق بين المخصص والاحتياج الفعلي — الفرق السالب يعني عجزاً يحتاج ميزانية." },
    { test: /تكييف|كهرباء|سباكة|أنظمة|hvac|electrical|plumbing/i, reply: "أنظمة المباني ⚙️ — التكييف والكهرباء والسباكة\n\n• التكييف: العمر الافتراضي 10-15 سنة — يحتاج صيانة وقائية دورية.\n• الكهرباء: فحص دوري سنوي كحد أدنى.\n• السباكة: مراقبة الصرف وضغط المياه بشكل منتظم.\n\nتبويب الأنظمة الرئيسية والتفصيلية يعرض تقييم كل نظام حسب المدرسة." },
    { test: /بواب|بوابين|حارس|gatekeeper/i, reply: "تبويب البوابين 🧍 — يعرض قائمة كاملة بجميع البوابين مع اسم المدرسة ورقم الجوال ورقم الهوية والمدينة. اسألني مباشرة عن بواب مدرسة معينة وسأخبرك." },
    { test: /خريط|موقع|مواقع|جغراف|map|توزيع/i, reply: "تبويب الخريطة 🗺️ يعرض توزيع المدارس جغرافياً مع مؤشرات حالتها (FCA والبيئة)، لتحديد التجمعات الجغرافية ذات الأولوية وتخطيط جولات الفحص الميداني بكفاءة." },
    { test: /مؤشر|kpi|إحصائ|احصائ|أرقام|ملخص|نظرة عامة|overview/i, reply: "مؤشرات الأداء KPIs 📈 — أبرزها:\n• متوسط زمن الاستجابة للبلاغات.\n• نسبة إغلاق البلاغات خلال المدة المحددة.\n• نسبة الصيانة الوقائية للتصحيحية.\n• متوسط FCA للمحفظة.\n• معدل إنجاز العقود.\n\nتبويب نظرة عامة يجمع أهم KPIs في بطاقات سريعة." },
    { test: /تحديث|بيانات|مصدر|refresh|محدّث|متى/i, reply: "تقدر تحدّث البيانات من زر «↻ تحديث» في الشريط العلوي، أو تفعّل «◷ تلقائي» للتحديث الدوري. يظهر وقت آخر تحديث بجانب الأزرار ⏱️" },
    { test: /لغة|عربي|english|انجليزي|ترجم/i, reply: "اللوحة تدعم العربية والإنجليزية — تقدر تبدّل اللغة من الشريط العلوي 🌐" },
    { test: /شكر|thanks|thank you|تمام|ممتاز|رائع/i, reply: "في خدمتك دائماً 🙌" },
    { test: /سلام|أهلا|اهلا|مرحب|هلا|hi|hello/i, reply: "أهلًا وسهلًا 👋 أنا مساعد إدارة المرافق الذكي. اسألني عن أي شيء في اللوحة — FCA، العقود، البوابين، البلاغات، التجهيزات، وأكثر." },
  ];
  const FCB_FALLBACK = "ما قدرت أحدد سؤالك بدقة 🙂 — جرّب تسألني عن: تحليل FCA، البيئة المدرسية، العقود، الصيانة، التجهيزات، البوابين، أو الأنظمة الرئيسية.";

  /* رد ديناميكي: جدول من بيانات الداشبورد الفعلية (يعمل بدون مفتاح API) */
  function fcbDynamicTableReply() {
    const s = fcbBuildDashboardSummary();
    const rows = [];
    Object.keys(s).forEach((k) => {
      const v = s[k];
      if (v && typeof v === "object") {
        const firstNumKey = Object.keys(v).find((kk) => typeof v[kk] === "number");
        if (firstNumKey) rows.push([k.replace(/_/g, " "), String(v[firstNumKey])]);
      }
    });
    if (!rows.length) return null;
    let md = "📋 ملخص سريع من بيانات اللوحة الحالية:\n\n| القسم | القيمة |\n|---|---|\n";
    rows.forEach((r) => { md += `| ${r[0]} | ${r[1]} |\n`; });
    return md;
  }

  /* رد ديناميكي: رسم بياني تجريبي من بيانات الداشبورد الفعلية (يعمل بدون مفتاح API) */
  function fcbDynamicChartReply() {
    const s = fcbBuildDashboardSummary();
    const labels = [];
    const data = [];
    Object.keys(s).forEach((k) => {
      const v = s[k];
      if (v && typeof v === "object") {
        const firstNumKey = Object.keys(v).find((kk) => typeof v[kk] === "number");
        if (firstNumKey) { labels.push(k.replace(/_/g, " ")); data.push(v[firstNumKey]); }
      }
    });
    if (!labels.length) return null;
    const spec = { type: "bar", title: "نظرة سريعة على أحجام البيانات بكل قسم", labels, datasets: [{ label: "عدد السجلات", data }] };
    return "📊 هذا مخطط تجريبي مبني على بيانات اللوحة الحالية:\n\n```chart\n" + JSON.stringify(spec) + "\n```";
  }

  /* رد ديناميكي: أولويات وحلول فعلية من محرك الأولويات (يعمل بدون مفتاح API) */
  function fcbDynamicPriorityReply() {
    const p = fcbBuildPriorityActions(8);
    if (!p || !p.top.length) return null;
    let md = "🧮 **محرك الأولويات** — ترتيب المباني حسب درجة الحالة الفعلية من 100 (مبنية على FCA + عمر المبنى + البيئة + البلاغات):\n\n";
    md += "| المبنى | الدرجة من 100 | التصنيف |\n|---|---|---|\n";
    p.top.forEach((r) => { md += `| ${r.name} | ${r.conditionScore} | ${r.tier} |\n`; });
    md += "\n**الإجراء المقترح للحالة الأكثر احتياجاً:**\n" + p.top[0].action;
    md += `\n\n📌 توزيع عام: ${p.tierCounts["حرج 🔴"]} حرج، ${p.tierCounts["متوسط 🟠"]} متوسط، ${p.tierCounts["جيد 🟡"]} جيد، ${p.tierCounts["جيد جداً 🟢"]} جيد جداً، من إجمالي ${p.totalScored} مبنى مقيّم.`;
    return md;
  }

  function fcbReplyFor(text) {
    if (/حل|حلول|أولوي|اولوي|priority|priorities|إيش أعمل|ايش اعمل|توصي|اقترح/i.test(text)) {
      const p = fcbDynamicPriorityReply();
      if (p) return p;
    }
    if (/جدول|table/i.test(text)) {
      const t = fcbDynamicTableReply();
      if (t) return t;
    }
    if (/رسم|مخطط|chart|graph|بياني|رسمة/i.test(text)) {
      const c = fcbDynamicChartReply();
      if (c) return c;
    }
    for (const r of FCB_RULES) if (r.test.test(text)) return r.reply;
    return FCB_FALLBACK;
  }

  /* ════════════════════════════════════════════════════════════════
     🖋️ تحويل Markdown مبسّط إلى HTML — يدعم الآن أيضاً:
     • جداول Markdown (| ... | ... |)
     • كتل رسوم بيانية ```chart {json} ``` → تُرسم بـ Chart.js
  ════════════════════════════════════════════════════════════════ */
  function fcbEscapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  let FCB_CHART_SEQ = 0;
  const FCB_CHART_PALETTE = ["#0891b2", "#0d9488", "#7c3aed", "#d97706", "#dc2626", "#059669", "#2563eb", "#db2777"];

  /* ════════════════════════════════════════════════════════════════
     📤 ExportEngine — تصدير أي محتوى يولّده المساعد الذكي (جدول/رسم/نص)
     إلى CSV / Excel / PDF / PNG، يعمل بالكامل من المتصفح بدون سيرفر.

     ملاحظة عن PDF والعربي: تصدير PDF يعتمد على نافذة طباعة المتصفح
     (window.print) لا على تحويل العنصر لصورة، لأن محرّك المتصفح نفسه
     هو الوحيد الذي يرسم تشكيل الحروف العربية (Shaping/Ligatures)
     والاتجاه RTL بشكل صحيح دائماً. التفاصيل والأسباب موجودة في تعليق
     دالة elementToPDF بالأسفل.
  ════════════════════════════════════════════════════════════════ */
  const ExportEngine = {
    _ts() {
      const d = new Date();
      const p = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
    },
    _downloadBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    },
    _csvCell(v) {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    },

    /** تصدير جدول (مصفوفة رؤوس + مصفوفة صفوف) إلى CSV */
    tableToCSV(headers, rows, filenameBase = "جدول") {
      const lines = [headers.map(this._csvCell).join(",")];
      rows.forEach((r) => lines.push(r.map(this._csvCell).join(",")));
      // BOM لضمان ظهور العربي بشكل صحيح في Excel عند فتح CSV
      const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      this._downloadBlob(blob, `${filenameBase}_${this._ts()}.csv`);
      if (typeof showToast === "function") showToast("تم تصدير CSV ✅", "ok");
    },

    /** تصدير جدول إلى ملف Excel حقيقي (.xlsx) عبر SheetJS المُحمّلة بالفعل */
    tableToExcel(headers, rows, filenameBase = "جدول") {
      if (typeof XLSX === "undefined") {
        if (typeof showToast === "function") showToast("⚠️ مكتبة Excel لم تُحمَّل بعد، حاول مرة أخرى", "err");
        return;
      }
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      XLSX.writeFile(wb, `${filenameBase}_${this._ts()}.xlsx`);
      if (typeof showToast === "function") showToast("تم تصدير Excel ✅", "ok");
    },

    /**
     * تصدير أي عنصر DOM (جدول/رسم/نص) إلى PDF عبر نافذة طباعة مخصّصة
     * يفتحها المتصفح، باستخدام window.print() ثم اختيار المستخدم
     * "حفظ كـ PDF" من نافذة الطباعة.
     *
     * ⚠️ لماذا ليس html2canvas + jsPDF؟ تم تجربة هذا النهج وفشل مع
     * العربي: html2canvas يبني محرّك قياس/تخطيط نص خاص به بدل استخدام
     * محرّك المتصفح، فلا يدعم تشكيل الحروف العربية (ligatures) ولا
     * ترتيب الاتجاه (RTL bidi) بشكل صحيح — وهذه مشكلة معروفة وموجودة
     * في المكتبة منذ سنوات بدون حل جذري (انظر niklasvh/html2canvas
     * issues #289 #686 #948 #2432 #2488). النتيجة كانت حروفاً عربية
     * متقطعة/متراكبة بدل متصلة، خصوصاً بالكلمات الطويلة.
     *
     * الحل الموثوق: نفتح نافذة طباعة جديدة، نضع فيها نسخة من العنصر
     * المطلوب تصديره بنفس تنسيقه (CSS الأساسي للوحة)، ثم نستدعي
     * window.print(). هنا محرّك المتصفح نفسه (الذي يعرض العربي بشكل
     * صحيح على الشاشة أصلاً) هو من يرسم الصفحة، فيظهر العربي متصلاً
     * وسليماً 100%. المستخدم يختار "حفظ كـ PDF" كوجهة الطباعة بدل
     * طابعة فعلية — هذه هي الطريقة القياسية لإنتاج PDF بعربي سليم من
     * صفحة بدون أي سيرفر خلفي (GitHub Pages).
     */
    elementToPDF(el, filenameBase = "تقرير", title = "") {
      if (!el) return;
      try {
        const printWin = window.open("", "_blank", "width=900,height=1100");
        if (!printWin) {
          if (typeof showToast === "function") {
            showToast("⚠️ المتصفح منع فتح نافذة الطباعة — اسمح بالنوافذ المنبثقة لهذا الموقع وحاول مرة أخرى", "err");
          }
          return;
        }
        // ننسخ العنصر ونحذف صف أزرار التصدير نفسه من النسخة، حتى لا
        // تظهر أزرار "نسخ / PDF / Excel" داخل الصفحة المطبوعة
        const clone = el.cloneNode(true);
        clone.querySelectorAll(".fcb-export-row").forEach((n) => n.remove());

        const fontLink = '<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">';
        const styles = `
          * { box-sizing: border-box; }
          body {
            font-family: "IBM Plex Sans Arabic", Tajawal, sans-serif;
            direction: rtl;
            padding: 24px;
            color: #1a2b33;
            margin: 0;
          }
          .fcb-print-title { font-size: 16px; font-weight: 800; margin-bottom: 16px; color: #083D4F; }
          .fcb-bubble, .fcb-table-wrap, .fcb-chart-wrap { max-width: 100%; }
          .fcb-table-wrap { border: 1px solid #e2e8ec; border-radius: 10px; overflow: hidden; }
          .fcb-table { width: 100%; border-collapse: collapse; font-size: 13px; }
          .fcb-table thead th { background: #083D4F; color: #fff; padding: 8px 10px; text-align: center; }
          .fcb-table tbody td { padding: 7px 10px; text-align: center; border-bottom: 1px solid #e2e8ec; }
          .fcb-table tbody tr:nth-child(even) { background: #f7f9fa; }
          .fcb-chart-canvas-box { position: relative; height: 320px; width: 100%; }
          .fcb-bubble p { margin: 0 0 10px; line-height: 1.8; }
          .fcb-bubble strong { font-weight: 800; }
          .fcb-bubble code { background: #f1f5f7; padding: 1px 6px; border-radius: 6px; direction: ltr; display: inline-block; }
          @media print {
            @page { margin: 14mm; }
            body { padding: 0; }
          }
        `;
        printWin.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">${fontLink}<style>${styles}</style></head><body>${title ? `<div class="fcb-print-title">${fcbEscapeHtml(title)}</div>` : ""}${clone.outerHTML}</body></html>`);
        printWin.document.close();

        const triggerPrint = () => {
          // إن كان العنصر يحتوي رسماً بيانياً (canvas)، ننسخ محتوى الرسم
          // كصورة لأن canvas الأصلي بقيمه لا يُستنسخ تلقائياً بـ cloneNode
          el.querySelectorAll("canvas").forEach((srcCanvas, idx) => {
            const destCanvas = printWin.document.querySelectorAll("canvas")[idx];
            if (destCanvas && srcCanvas.toDataURL) {
              try {
                const img = printWin.document.createElement("img");
                img.src = srcCanvas.toDataURL("image/png");
                img.style.width = "100%";
                destCanvas.replaceWith(img);
              } catch (_) {}
            }
          });
          printWin.focus();
          printWin.print();
        };

        // ننتظر تحميل خطوط نافذة الطباعة فعلياً قبل استدعاء الطباعة، حتى
        // يرسم المتصفح العربي بالخط الصحيح المتصل من أول مرة
        if (printWin.document.fonts && printWin.document.fonts.ready) {
          printWin.document.fonts.ready.then(() => setTimeout(triggerPrint, 150));
        } else {
          setTimeout(triggerPrint, 400);
        }
        if (typeof showToast === "function") showToast("افتحت نافذة الطباعة — اختر «حفظ كـ PDF» 🖨️", "info");
      } catch (e) {
        console.warn("[ExportEngine] PDF export failed:", e);
        if (typeof showToast === "function") showToast("⚠️ تعذّر تحضير الطباعة: " + (e?.message || e), "err");
      }
    },

    /** تصدير Canvas الرسم البياني مباشرة كصورة PNG (بدون إعادة رسم) */
    chartCanvasToPNG(canvasEl, filenameBase = "رسم_بياني") {
      if (!canvasEl) return;
      try {
        // نرسم على خلفية بيضاء لأن canvas الأصلي شفاف، فتظهر الصورة المُصدّرة سليمة على أي عارض صور
        const tmp = document.createElement("canvas");
        tmp.width = canvasEl.width;
        tmp.height = canvasEl.height;
        const ctx = tmp.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, tmp.width, tmp.height);
        ctx.drawImage(canvasEl, 0, 0);
        tmp.toBlob((blob) => {
          this._downloadBlob(blob, `${filenameBase}_${this._ts()}.png`);
          if (typeof showToast === "function") showToast("تم تصدير الصورة ✅", "ok");
        }, "image/png");
      } catch (e) {
        console.warn("[ExportEngine] PNG export failed:", e);
        if (typeof showToast === "function") showToast("⚠️ تعذّر تصدير الصورة: " + (e?.message || e), "err");
      }
    },

    /** نسخ نص خام (بدون تنسيق Markdown) إلى الحافظة */
    async copyText(text) {
      try {
        await navigator.clipboard.writeText(text);
        if (typeof showToast === "function") showToast("تم النسخ 📋", "ok");
      } catch (e) {
        if (typeof showToast === "function") showToast("⚠️ تعذّر النسخ", "err");
      }
    },
  };

  /** يقرأ جدول HTML (الذي بنته fcbBuildTableHtml) ويرجع رؤوسه وصفوفه كنص خام للتصدير */
  function fcbExtractTableData(tableEl) {
    const headers = [...tableEl.querySelectorAll("thead th")].map((th) => th.textContent.trim());
    const rows = [...tableEl.querySelectorAll("tbody tr")].map((tr) =>
      [...tr.querySelectorAll("td")].map((td) => td.textContent.trim()),
    );
    return { headers, rows };
  }

  function fcbBuildTableExportRow(tableWrapId) {
    return `<div class="fcb-export-row">
      <button type="button" class="fcb-export-btn" onclick="fcbExportTable('${tableWrapId}','csv')">📋 CSV</button>
      <button type="button" class="fcb-export-btn" onclick="fcbExportTable('${tableWrapId}','excel')">📊 Excel</button>
      <button type="button" class="fcb-export-btn" onclick="fcbExportTable('${tableWrapId}','pdf')">📄 PDF</button>
    </div>`;
  }

  function fcbExportTable(wrapId, format) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    const table = wrap.querySelector("table");
    if (format === "pdf") {
      ExportEngine.elementToPDF(wrap, "جدول");
      return;
    }
    const { headers, rows } = fcbExtractTableData(table);
    if (format === "csv") ExportEngine.tableToCSV(headers, rows, "جدول");
    else if (format === "excel") ExportEngine.tableToExcel(headers, rows, "جدول");
  }

  function fcbBuildChartExportRow(chartWrapId, canvasId) {
    return `<div class="fcb-export-row">
      <button type="button" class="fcb-export-btn" onclick="fcbExportChart('${canvasId}','png')">🖼 PNG</button>
      <button type="button" class="fcb-export-btn" onclick="fcbExportChart('${chartWrapId}','pdf')">📄 PDF</button>
    </div>`;
  }

  function fcbExportChart(id, format) {
    if (format === "png") {
      const canvas = document.getElementById(id);
      ExportEngine.chartCanvasToPNG(canvas, "رسم_بياني");
    } else if (format === "pdf") {
      const wrap = document.getElementById(id);
      if (wrap) ExportEngine.elementToPDF(wrap, "رسم_بياني");
    }
  }

  /** يصدّر فقاعة رد كاملة (نص/كود/خطاب/اقتراح) كـ PDF بنفس مظهرها في الشات */
  function fcbExportBubble(bubbleId) {
    const bubble = document.getElementById(bubbleId);
    if (bubble) ExportEngine.elementToPDF(bubble, "رد_المساعد");
  }

  function fcbCopyBubble(bubbleId) {
    const bubble = document.getElementById(bubbleId);
    if (bubble) ExportEngine.copyText(bubble.innerText || bubble.textContent || "");
  }

  let FCB_MSG_SEQ = 0;

  function fcbParseChartBlock(jsonText) {
    let spec;
    try { spec = JSON.parse(jsonText); } catch (e) { return null; }
    if (!spec || !Array.isArray(spec.labels) || !Array.isArray(spec.datasets)) return null;
    return spec;
  }

  function fcbBuildChartHtml(spec) {
    const id = "fcbChart_" + (++FCB_CHART_SEQ);
    const wrapId = id + "_wrap";
    const title = spec.title ? `<div class="fcb-chart-title">${fcbEscapeHtml(spec.title)}</div>` : "";
    // نخزّن المخطط ليُرسم بعد إدراج الـ HTML في الصفحة (Canvas يحتاج يكون موجوداً بالـ DOM فعلياً)
    FCB_PENDING_CHARTS.push({ id, spec });
    return `<div class="fcb-chart-wrap" id="${wrapId}">${title}<div class="fcb-chart-canvas-box"><canvas id="${id}"></canvas></div>${fcbBuildChartExportRow(wrapId, id)}</div>`;
  }

  function fcbBuildTableHtml(headerCells, rows) {
    const wrapId = "fcbTable_" + (++FCB_MSG_SEQ) + "_wrap";
    let html = `<div class="fcb-table-wrap" id="${wrapId}"><table class="fcb-table"><thead><tr>`;
    headerCells.forEach((h) => { html += `<th>${h}</th>`; });
    html += "</tr></thead><tbody>";
    rows.forEach((r) => {
      html += "<tr>";
      r.forEach((c) => { html += `<td>${c}</td>`; });
      html += "</tr>";
    });
    html += "</tbody></table>" + fcbBuildTableExportRow(wrapId) + "</div>";
    return html;
  }

  let FCB_PENDING_CHARTS = [];

  function fcbRenderMarkdown(raw) {
    const escaped = fcbEscapeHtml(raw).replace(/\r\n/g, "\n");
    const lines = escaped.split("\n");
    let html = "";
    let listType = null; // 'ul' | 'ol' | null
    let paraBuf = [];

    function inlineFormat(line) {
      return line
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, "<em>$1</em>")
        .replace(/`([^`]+?)`/g, "<code>$1</code>")
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    }
    function flushPara() {
      if (paraBuf.length) {
        html += "<p>" + paraBuf.join(" ") + "</p>";
        paraBuf = [];
      }
    }
    function closeList() {
      if (listType) { html += "</" + listType + ">"; listType = null; }
    }
    function isTableSepRow(line) {
      return /^\|?[\s:|-]+\|?$/.test(line) && line.includes("-");
    }
    function splitTableRow(line) {
      let l = line.trim();
      if (l.startsWith("|")) l = l.slice(1);
      if (l.endsWith("|")) l = l.slice(0, -1);
      return l.split("|").map((c) => inlineFormat(c.trim()));
    }

    let i = 0;
    while (i < lines.length) {
      const raw_line = lines[i];
      const line = raw_line.trim();

      // كتلة كود ```chart ... ``` أو ```json-chart ... ```
      const codeFenceMatch = line.match(/^```(\w[\w-]*)?\s*$/);
      if (codeFenceMatch) {
        const lang = (codeFenceMatch[1] || "").toLowerCase();
        const bodyLines = [];
        i++;
        while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) {
          bodyLines.push(lines[i]);
          i++;
        }
        i++; // تجاوز سطر الإغلاق ```
        const bodyText = bodyLines.join("\n")
          .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
        if (lang === "chart" || lang === "json-chart") {
          flushPara(); closeList();
          const spec = fcbParseChartBlock(bodyText);
          if (spec) {
            html += fcbBuildChartHtml(spec);
          } else {
            html += '<div class="fcb-chart-error">⚠️ تعذّر رسم المخطط البياني</div>';
          }
        } else {
          flushPara(); closeList();
          html += `<p><code>${fcbEscapeHtml(bodyText).replace(/\n/g, "<br>")}</code></p>`;
        }
        continue;
      }

      if (!line) { flushPara(); closeList(); i++; continue; }

      if (/^---+$/.test(line)) { flushPara(); closeList(); html += "<hr>"; i++; continue; }

      const hMatch = line.match(/^#{1,4}\s+(.+)/);
      if (hMatch) { flushPara(); closeList(); html += "<h4>" + inlineFormat(hMatch[1]) + "</h4>"; i++; continue; }

      // جدول Markdown: سطر header | سطر فاصل --- | صفوف بيانات
      if (line.includes("|") && i + 1 < lines.length && isTableSepRow(lines[i + 1].trim())) {
        flushPara(); closeList();
        const headerCells = splitTableRow(line);
        i += 2; // تجاوز الهيدر وسطر الفاصل
        const rows = [];
        while (i < lines.length && lines[i].trim().includes("|") && lines[i].trim() !== "") {
          rows.push(splitTableRow(lines[i]));
          i++;
        }
        html += fcbBuildTableHtml(headerCells, rows);
        continue;
      }

      const ulMatch = line.match(/^[-•*]\s+(.+)/);
      if (ulMatch) {
        flushPara();
        if (listType !== "ul") { closeList(); html += "<ul>"; listType = "ul"; }
        html += "<li>" + inlineFormat(ulMatch[1]) + "</li>";
        i++; continue;
      }

      const olMatch = line.match(/^\d+[.)]\s+(.+)/);
      if (olMatch) {
        flushPara();
        if (listType !== "ol") { closeList(); html += "<ol>"; listType = "ol"; }
        html += "<li>" + inlineFormat(olMatch[1]) + "</li>";
        i++; continue;
      }

      closeList();
      paraBuf.push(inlineFormat(line));
      i++;
    }
    flushPara();
    closeList();
    return html || "<p></p>";
  }

  /* يرسم كل المخططات البيانية المؤجلة بعد إدراج الفقاعة في الـ DOM فعلياً */
  function fcbMountPendingCharts() {
    if (!FCB_PENDING_CHARTS.length) return;
    const queue = FCB_PENDING_CHARTS;
    FCB_PENDING_CHARTS = [];
    queue.forEach(({ id, spec }) => {
      const canvas = document.getElementById(id);
      if (!canvas || typeof Chart === "undefined") return;
      const type = ["bar", "line", "pie", "doughnut", "radar"].includes(spec.type) ? spec.type : "bar";

      // 🛡️ تنظيف شامل: spec قادمة من نص يولّده الذكاء الاصطناعي، لذا قد تحتوي
      // على قيم ناقصة أو null — ننظفها هنا قبل أي استخدام لمنع ظهور undefined/NaN
      const { labels: cleanLabels, datasets: cleanRawDatasets } = normalizeChartData(
        spec.labels,
        spec.datasets,
      );

      if (!cleanLabels.length || !cleanRawDatasets.length) {
        canvas.closest(".fcb-chart-wrap").innerHTML =
          '<div class="fcb-chart-error">📭 لا توجد بيانات كافية لعرض هذا المخطط</div>';
        return;
      }

      const isFill = type === "pie" || type === "doughnut";
      const datasets = cleanRawDatasets.map((ds, idx) => {
        const color = ds.color || FCB_CHART_PALETTE[idx % FCB_CHART_PALETTE.length];
        return {
          label: ds.label || "",
          data: ds.data,
          backgroundColor: isFill
            ? cleanLabels.map((_, i2) => FCB_CHART_PALETTE[i2 % FCB_CHART_PALETTE.length])
            : (type === "line" ? color + "22" : color + "cc"),
          borderColor: color,
          borderWidth: type === "line" ? 2.5 : 1,
          borderRadius: type === "bar" ? 6 : 0,
          fill: type === "line" ? true : undefined,
          tension: type === "line" ? 0.35 : undefined,
          pointRadius: type === "line" ? 3 : undefined,
        };
      });
      try {
        new Chart(canvas, {
          type,
          data: { labels: cleanLabels, datasets },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: datasets.length > 1 || type === "pie" || type === "doughnut", position: "bottom", labels: { font: { size: 10, family: "IBM Plex Sans Arabic" }, boxWidth: 10, padding: 8 } },
              tooltip: {
                rtl: true,
                titleFont: { family: "IBM Plex Sans Arabic" },
                bodyFont: { family: "IBM Plex Sans Arabic" },
                callbacks: {
                  // طبقة حماية أخيرة: حتى لو وصل عنوان/قيمة فاسدة، لا تظهر undefined في الـ tooltip
                  title: (items) => items.map((it) => sanitizeText(it.label, "")),
                  label: (item) => {
                    const v = safeNumber(item.parsed?.y ?? item.parsed, null);
                    const dsLabel = sanitizeText(item.dataset?.label, "");
                    return `${dsLabel ? dsLabel + ": " : ""}${v === null ? "غير متوفر" : v.toLocaleString("ar-SA")}`;
                  },
                },
              },
            },
            scales: (type === "pie" || type === "doughnut" || type === "radar") ? {} : {
              x: { ticks: { font: { size: 9.5, family: "IBM Plex Sans Arabic" }, callback: safeTickCallback }, grid: { display: false } },
              y: { ticks: { font: { size: 9.5, family: "IBM Plex Sans Arabic" }, callback: safeTickCallback }, grid: { color: "rgba(8,45,60,0.06)" }, beginAtZero: true },
            },
          },
        });
      } catch (e) {
        console.warn("[fcb] chart render error:", e);
        canvas.closest(".fcb-chart-wrap").innerHTML = '<div class="fcb-chart-error">⚠️ تعذّر رسم المخطط البياني</div>';
      }
    });
  }


  function fcbTimeNow() {
    const d = new Date();
    const h12 = d.getHours() % 12 || 12;
    return `${h12}:${String(d.getMinutes()).padStart(2, "0")} ${d.getHours() < 12 ? "ص" : "م"}`;
  }

  function fcbAppendMsg(text, who) {
    const wrap = document.getElementById("fcbMessages");
    const row = document.createElement("div");
    row.className = "fcb-row " + who;
    const bubbleId = who === "bot" ? "fcbBubble_" + (++FCB_MSG_SEQ) : "";
    row.innerHTML =
      (who === "bot" ? '<div class="fcb-msg-avatar"><svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M12 3.2c-5.1 0-9.3 3.55-9.3 7.95 0 2.3 1.15 4.4 3.05 5.9-.18 1.15-.6 2.45-1.25 3.6a.55.55 0 0 0 .65.8c1.85-.6 3.3-1.35 4.3-1.95a11.4 11.4 0 0 0 2.55.3c5.1 0 9.3-3.55 9.3-7.95s-4.2-7.95-9.3-7.95Z" fill="#ffffff" fill-opacity="0.13" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 6.1 6.6 9.05v.9h10.8v-.9L12 6.1Z" fill="#fff"/><rect x="7.35" y="9.95" width="9.3" height="4.65" rx="0.3" fill="#fff"/><rect x="10.85" y="11.55" width="2.3" height="3.05" fill="#0a2530"/><rect x="6.6" y="14.6" width="10.8" height="0.95" rx="0.25" fill="#fff"/></svg></div>' : "") +
      `<div class="fcb-col"><div class="fcb-bubble"${bubbleId ? ` id="${bubbleId}"` : ""}></div><div class="fcb-time"></div></div>`;
    const bubble = row.querySelector(".fcb-bubble");
    if (who === "bot") {
      bubble.innerHTML = fcbRenderMarkdown(text);
      // صف تصدير عام (نسخ + PDF) لأي رد فيه محتوى يستحق الحفظ: نص/كود/خطاب/
      // اقتراح... نتجاهله للردود القصيرة جداً (تحيات، تأكيدات) لتجنّب ازدحام الواجهة
      const meaningfulLen = (text || "").replace(/```[\s\S]*?```/g, "").trim().length;
      if (meaningfulLen > 40) {
        const exportRow = document.createElement("div");
        exportRow.className = "fcb-export-row fcb-export-row-msg";
        exportRow.innerHTML =
          `<button type="button" class="fcb-export-btn" onclick="fcbCopyBubble('${bubbleId}')">📋 نسخ</button>` +
          `<button type="button" class="fcb-export-btn" onclick="fcbExportBubble('${bubbleId}')">📄 PDF</button>`;
        bubble.appendChild(exportRow);
      }
    } else {
      bubble.textContent = text;
    }
    row.querySelector(".fcb-time").textContent = fcbTimeNow();
    wrap.appendChild(row);
    if (who === "bot") fcbMountPendingCharts();
    const body = document.getElementById("fcbBody");
    body.scrollTop = body.scrollHeight;
  }

  function fcbShowTyping() {
    const wrap = document.getElementById("fcbMessages");
    const row = document.createElement("div");
    row.className = "fcb-row bot";
    row.id = "fcbTyping";
    row.innerHTML =
      '<div class="fcb-msg-avatar"><svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M12 3.2c-5.1 0-9.3 3.55-9.3 7.95 0 2.3 1.15 4.4 3.05 5.9-.18 1.15-.6 2.45-1.25 3.6a.55.55 0 0 0 .65.8c1.85-.6 3.3-1.35 4.3-1.95a11.4 11.4 0 0 0 2.55.3c5.1 0 9.3-3.55 9.3-7.95s-4.2-7.95-9.3-7.95Z" fill="#ffffff" fill-opacity="0.13" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 6.1 6.6 9.05v.9h10.8v-.9L12 6.1Z" fill="#fff"/><rect x="7.35" y="9.95" width="9.3" height="4.65" rx="0.3" fill="#fff"/><rect x="10.85" y="11.55" width="2.3" height="3.05" fill="#0a2530"/><rect x="6.6" y="14.6" width="10.8" height="0.95" rx="0.25" fill="#fff"/></svg></div><div class="fcb-col"><div class="fcb-bubble fcb-typing"><span></span><span></span><span></span></div></div>';
    wrap.appendChild(row);
    const body = document.getElementById("fcbBody");
    body.scrollTop = body.scrollHeight;
  }

  function fcbHideTyping() {
    const t = document.getElementById("fcbTyping");
    if (t) t.remove();
  }

  /* ════════════════════════════════════════════════════════════════
     💬 سجل المحادثة (للحفاظ على سياق الحوار مع OpenAI)
  ════════════════════════════════════════════════════════════════ */
  const FCB_HISTORY = [];
  const FCB_HISTORY_MAX = 12; // آخر 12 رسالة (6 أسئلة + 6 ردود) كسياق

  /* ════════════════════════════════════════════════════════════════
     🤖 استدعاء OpenAI API مع تمرير ملخص بيانات الداشبورد كسياق
  ════════════════════════════════════════════════════════════════ */
  // ════════════════════════════════════════════════════════════════
  // 🧠 كشف نوع السؤال — يحدد أي بيانات نضيفها للـ context
  // ════════════════════════════════════════════════════════════════
  function fcbDetectTopics(text) {
    const t = text;
    return {
      بوابين:    /بواب|بوابين|حارس|gatekeeper/i.test(t),
      عقود:      /عقد|عقود|مستحق|مقاول|contract|مدة|انتهاء|تجديد|fm|صروف/i.test(t),
      بلاغات:    /بلاغ|عطل|إصلاح|sla|حالة البلاغ|متأخر|مفتوح|مغلق/i.test(t),
      fca:       /fca|حالة فنية|تقييم|حرج|متوسط.*مبنى|أسوأ مدرسة/i.test(t),
      أنظمة:     /نظام|تكييف|كهرباء|سباكة|hvac|درجة.*نظام/i.test(t),
      تجهيزات:   /تجهيز|أصول|مخزون|احتياج|مخصص|عجز/i.test(t),
      مدفوعات:   /دفع|مدفوع|متبقي|صرف.*ميزانية|payment/i.test(t),
      أولويات:   /أولوي|حل|يستحق|أشد|أخطر|أهم|urgent/i.test(t),
      طلاب:      /طالب|طلاب|عمر.*مبنى|مبنى.*قديم/i.test(t),
      قطع:       /قطع.*غيار|قطعة|spare/i.test(t),
      مصاعد:     /مصعد|مصاعد|elevator/i.test(t),
      كبير:      false, // يتحدد بعد كشف الباقي
    };
  }

  async function fcbAskOpenAI(userText) {
    if (!AIService.hasKey()) {
      const err = new Error("NO_API_KEY");
      err.code = "NO_API_KEY";
      throw err;
    }

    const topics = fcbDetectTopics(userText);

    // ── الملخص الأساسي دايماً (خفيف) ──
    const base = fcbBuildDashboardSummary();

    // ── عقود FM: التفاصيل الكاملة بس لو سؤال عقود ──
    if (!topics.عقود && base.عقود_FM) {
      const { أعلى_10_عقود_من_حيث_القيمة_المستحقة_غير_المصروفة, أبرز_العقود_المنتهية, ...بدون } = base.عقود_FM;
      base.عقود_FM = بدون;
    }

    // ── مدفوعات: تفاصيل العقود بس لو سؤال مدفوعات ──
    if (!topics.مدفوعات && base.المدفوعات) {
      const { تفاصيل_العقود, ...بدون } = base.المدفوعات;
      base.المدفوعات = بدون;
    }

    // ── أولويات: نضيف محرك الأولويات كامل بس لو سألها ──
    const priorityData = topics.أولويات ? fcbBuildPriorityActions(10) : fcbBuildPriorityActions(5);

    // ── بيانات خام إضافية لو السؤال يحتاجها بالتفصيل ──
    let extraContext = "";

    if (topics.بوابين) {
      const gkFull = window.__GK_FULL__ || [];
      if (gkFull.length) {
        // لو ذكر اسم مدرسة أو مدينة → نفلتر، وإلا نبعت كل القايمة (مضغوطة)
        const schoolMatch = userText.match(/مدرسة\s+([\u0600-\u06FF\s]+)/)?.[1]?.trim();
        const cityMatch   = userText.match(/(?:في|ب|مدينة)\s*(مكة|جدة|الطائف|المدينة|القنفذة|الليث|ينبع|العلا|المهد)/)?.[1];
        let subset = gkFull;
        if (schoolMatch) subset = gkFull.filter(r => r.schoolName.includes(schoolMatch) || r.minId.includes(schoolMatch));
        else if (cityMatch) subset = gkFull.filter(r => r.city.includes(cityMatch));
        // نضغط الأعمدة عشان نوفر tokens
        const compressed = subset.map(r => `${r.schoolName}|${r.minId}|${r.city}|${r.gateName}|${r.phone}|${r.nationalId}`);
        extraContext += `\n\nقائمة البوابين (اسم المدرسة|الرقم الوزاري|المدينة|اسم البواب|الجوال|الهوية):\n${compressed.join("\n")}`;
      }
    }

    if (topics.بلاغات && Array.isArray(window.RAW_BALAGH) && window.RAW_BALAGH.length) {
      // نبعت أعلى 30 بلاغ مفتوح بالتفاصيل
      const n = (v) => String(v ?? "").trim();
      const CLOSED = new Set(["تم حله","ملغى","ملغي","مغلق","closed","cancelled","resolved"]);
      const open30 = window.RAW_BALAGH
        .filter(r => !CLOSED.has(n(r["Status"]).toLowerCase()))
        .slice(0, 30)
        .map(r => ({
          رقم: n(r["Record No."]),
          حالة: n(r["Status"]),
          فئة: n(r["Category"]),
          أولوية: n(r["Priority"]),
          مدرسة: n(r["School Name"]),
          sla: n(r["SLA DAYS"]),
          مشكلة: n(r["Problem Description"]).slice(0, 80),
        }));
      extraContext += `\n\nأعلى 30 بلاغ مفتوح حالياً:\n${JSON.stringify(open30)}`;
    }

    if (topics.أنظمة && Array.isArray(window.RAW_ALL_SYSTEMS) && window.RAW_ALL_SYSTEMS.length) {
      // أسوأ 20 مدرسة في الأنظمة
      const scores = {};
      window.RAW_ALL_SYSTEMS.forEach(r => {
        const id = r["رقم المدرسة"] || r["اسم_المدرسة"];
        const v = parseFloat(r["الدرجة الموزونة الكلية للمبنى"]);
        if (id && isFinite(v)) scores[id] = { درجة: v, مدينة: r["المدينة الرئيسية"] || "" };
      });
      const worst20 = Object.entries(scores).sort((a,b)=>a[1].درجة-b[1].درجة).slice(0,20)
        .map(([k,v])=>({ مدرسة:k, ...v }));
      extraContext += `\n\nأسوأ 20 مدرسة في تقييم الأنظمة:\n${JSON.stringify(worst20)}`;
    }

    if (topics.مصاعد && Array.isArray(window.RAW_ELEVATORS) && window.RAW_ELEVATORS.length) {
      const broken = window.RAW_ELEVATORS
        .filter(r => String(r["حالة المصعد"]||"").includes("متعطل"))
        .slice(0, 20)
        .map(r => ({ مدرسة: r["اسم_المدرسة"]||r["اسم المدرسة"], مدينة: r["المدينة"]||"", عمر: r["عمر المصعد"] }));
      extraContext += `\n\nمصاعد متعطلة:\n${JSON.stringify(broken)}`;
    }

    const systemPrompt = `أنت مساعد إدارة المرافق الذكي، تعمل داخل لوحة بيانات إدارة المرافق التعليمية (Educational Facilities Management Dashboard).

══════════════════════════════════════════════════════
خبرتك التخصصية
══════════════════════════════════════════════════════
- إدارة الأصول والمرافق التعليمية.
- الصيانة الوقائية والتصحيحية وترتيب الأولويات.
- إدارة العقود وقياس أداء المقاولين.
- التجهيزات المدرسية وإدارة المخزون.
- أنظمة المباني: التكييف والكهرباء والسباكة وشبكات الصرف.
- مؤشرات الأداء KPI وقراءتها في سياق اتخاذ القرار.
- تقييم الحالة الفنية FCA وتفسير نتائجه لترتيب الأولويات.
- البيئة المدرسية كمؤشر فعلي على جودة الخدمة.

══════════════════════════════════════════════════════
نظام التصنيف الموحّد — التزم به في كل رد
══════════════════════════════════════════════════════
أي مؤشر من 100 (FCA، البيئة، تقييم عاين، درجة الحالة) يُصنَّف حصرياً هكذا:
- 0 إلى أقل من 25 → "حرج 🔴" (تدخّل عاجل خلال 30 يوماً)
- 25 إلى أقل من 50 → "متوسط 🟠" (صيانة تصحيحية مجدولة بالفصل الحالي)
- 50 إلى أقل من 75 → "جيد 🟡" (صيانة وقائية دورية + إعادة تقييم بعد 2-3 أشهر)
- 75 إلى 100 → "جيد جداً 🟢" (مراقبة روتينية ضمن الخطة العامة)
لا تستخدم مسميات بديلة (ممتاز، ضعيف، منخفض...) — فقط المصطلحات الأربعة أعلاه.

══════════════════════════════════════════════════════
قواعد الإجابة
══════════════════════════════════════════════════════
مهمتك: الإجابة على أسئلة المستخدم باللغة العربية (إلا لو سأل بالإنجليزية) بدقة، معتمداً على بيانات اللوحة الفعلية المرفقة بالأسفل.

- اعتمد فقط على البيانات المرفقة في أي رقم أو إحصائية — لا تخترع أرقاماً.
- البيانات تغطي كل التبويبات — ابحث فيها كلها قبل ما تقول "غير متوفر".
- لو قسم معيّن ظهر بمفتاح "تنبيه"، وضّح أن البيانات لم تُحمَّل واطلب الضغط على ↻.
- لو التفصيل غير موجود في الملخص، وجّه المستخدم للتبويب المناسب في اللوحة.
- لو المستخدم سأل سؤالاً عاماً لا يخص اللوحة، جاوبه بشكل طبيعي.

══════════════════════════════════════════════════════
دليل التبويبات — أين تجد كل بيانات
══════════════════════════════════════════════════════
• نظرة عامة              → عدد_المباني_الإجمالي، توزيع_المدن، توزيع_المراحل
• تحليل FCA              → تحليل_FCA: متوسط، حرجة، أسوأ/أفضل مدارس
• تاريخ تقييمات FCA      → تاريخ_تقييمات_FCA: متوسط حسب المرحلة، اتجاه عبر السنوات
• البيئة المدرسية         → البيئة_المدرسية: متوسط، أسوأ/أفضل مدارس
• المرحلة الدراسية        → المرحلة_الدراسية: تحليل_حسب_المرحلة (FCA+بيئة+طلاب)
• العقود (المجال)         → العقود: مقاولو الصيانة/التكييف/النظافة
• عقود غير المجال (FM)   → عقود_FM: إجمالي، مالي، منتهية، مستحقة، توزيع
• البلاغات               → البلاغات: إجمالي، حالة، SLA، فئات، أولويات، أعلى مدارس
• التجهيزات (مخزون)      → تجهيزات_المخزون: مخصص vs احتياج، عجز، أقسام
• الأنظمة الرئيسية       → الأنظمة_الرئيسية_والتفصيلية: درجات، فئات، متوسطات
• الصيانة الوقائية        → الصيانة_الوقائية_حسب_المبنى
• خنادق الصرف            → خنادق_الصرف: إجمالي، توزيع حسب المدينة
• المصاعد                → المصاعد: إجمالي، متعطلة، عاملة، توزيع
• التكلفة                → التكلفة: إجمالي، أعلى فئات، توزيع حسب المدينة
• الخريطة                → الخريطة: مباني بإحداثيات، توزيع حسب المدينة
• الطلاب وعمر المبنى     → الطلاب_وعمر_المبنى_تفصيلي + الطلاب_وعمر_المبنى
• قطع الغيار             → قطع_الغيار: إجمالي، أعلى أصناف قيمة
• تقييم عاين             → تقييم_عاين_تفصيلي: متوسط، تصنيفات، أسوأ مدارس
• المدفوعات والعقود       → المدفوعات: قيمة العقود، مدفوع، متبقي، نسبة صرف
• متابعة الفواتير         → متابعة_الفواتير
• مؤشرات أداء المقاول    → مؤشرات_أداء_المقاول: نسب شهرية لكل منطقة، توقع مستقبلي
• خطة استبدال المكيفات   → خطة_استبدال_المكيفات: شباك/سبلت، خطة حسب السنة
• البوابين               → البوابين: إحصائيات + توزيع (القايمة الكاملة تُحقن تلقائياً لو السؤال عن بواب)

══════════════════════════════════════════════════════
تعليمات خاصة لكل نوع سؤال
══════════════════════════════════════════════════════
▸ أسئلة عن البوابين:
  قايمة البوابين الكاملة تُحقن تلقائياً في الـ context لما تُكشف كلمة "بواب" في السؤال.
  البيانات بصيغة: اسم المدرسة|الرقم الوزاري|المدينة|اسم البواب|الجوال|الهوية — اقرأها واعرضها مباشرة.
  لو ذكر اسم مدرسة بعينها → أعطِ بيانات البواب المرتبط بها فقط.

▸ أسئلة عن الأولويات والحلول:
  استخدم محرك_الأولويات + تحليل_FCA + البيئة_المدرسية + البلاغات.
  قدّم: (1) المشكلة بالأرقام (2) السبب (3) خطوة فورية (4) متابعة متوسط المدى.

▸ أسئلة عن العقود والمستحقات:
  استخدم عقود_FM للعقود غير المجال، والعقود للمجال، والمدفوعات للدفعات.
  اعرض المنتهية والقيمة المستحقة غير المصروفة والملاحظات.

▸ أسئلة عن مقاول بعينه:
  ابحث في عقود_FM.توزيع_حسب_المقاول وعقود_FM.أعلى_10_عقود، والعقود.
  اعرض كل عقوده وحالتها وقيمتها.

▸ أسئلة عن منطقة بعينها (جدة/مكة/الطائف/المدينة):
  صفّ البيانات من كل التبويبات الخاصة بتلك المنطقة مجتمعةً.

▸ أسئلة مقارنة أو توزيع → جدول Markdown.
▸ أسئلة اتجاه زمني أو نسب → رسم بياني:
\`\`\`chart
{"type":"bar","title":"عنوان","labels":["أ","ب"],"datasets":[{"label":"السلسلة","data":[10,20]}]}
\`\`\`
  bar: مقارنة | line: زمني | pie/doughnut: نسب | radar: متعدد المؤشرات.
  بيانات حقيقية فقط — لا تكرر في نص وجدول ورسم معاً، اختر الأنسب.

══════════════════════════════════════════════════════
كيف تتعامل مع التبويبات الجديدة تلقائياً
══════════════════════════════════════════════════════
البيانات المرفقة أسفله تتحدث لحظة كل سؤال مباشرةً من اللوحة — إذا أضاف المطوّر تبويباً جديداً وظهرت مفاتيحه في JSON أسفله، ابحث فيها واستخدمها مباشرة بدون انتظار تعليمات إضافية. مبدأ: أي مفتاح موجود في JSON = بيانات متاحة يمكنك الإجابة عنها.

بيانات اللوحة الحالية (محدّثة لحظة هذا السؤال):
${JSON.stringify(base)}
${extraContext}

محرك الأولويات:
${JSON.stringify(priorityData)}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...FCB_HISTORY,
      { role: "user", content: userText },
    ];

    const reply = await AIService.chat(messages);

    FCB_HISTORY.push({ role: "user", content: userText });
    FCB_HISTORY.push({ role: "assistant", content: reply });
    while (FCB_HISTORY.length > FCB_HISTORY_MAX) FCB_HISTORY.shift();

    return reply;
  }

  /* ════════════════════════════════════════════════════════════════
     📨 إرسال الرسالة — يجرّب OpenAI أولاً، ولو فشل أو ما فيه مفتاح
     يرجع تلقائياً للردود المبرمجة (Rule-based) كحل احتياطي
  ════════════════════════════════════════════════════════════════ */
  async function fcbSend(presetText) {
    const inputEl = document.getElementById("fcbInput");
    const sendBtn = document.getElementById("fcbSendBtn");
    const val = (typeof presetText === "string" ? presetText : inputEl.value).trim();
    if (!val) return;
    fcbAppendMsg(val, "user");
    inputEl.value = "";
    inputEl.style.height = "auto";
    sendBtn.disabled = true;
    fcbShowTyping();

    try {
      if (!AIService.hasKey()) {
        // لا يوجد مفتاح API محفوظ — نوضّح ذلك بصراحة للمستخدم، ثم نكمل
        // بالردود المبرمجة (Rule-based) كحل احتياطي مفيد بدل توقف كامل
        fcbHideTyping();
        fcbAppendMsg(
          "⚠️ لم تُدخل مفتاح OpenAI API بعد، فالردود الحالية مبرمجة (محدودة) وليست من الذكاء الاصطناعي الكامل.\n\nلتفعيل المساعد الذكي الكامل: اضغط ⚙️ بالأعلى وأدخل مفتاحك الخاص — يُخزَّن في متصفحك فقط ولا يُرسل لأي مكان عدا OpenAI مباشرة.\n\nوإليك إجابة مبدئية:\n\n" + fcbReplyFor(val),
          "bot",
        );
        return;
      }
      const reply = await fcbAskOpenAI(val);
      fcbHideTyping();
      fcbAppendMsg(reply, "bot");
    } catch (err) {
      console.warn("[fcb] OpenAI error, falling back to rule-based:", err);
      fcbHideTyping();
      const prefix = err?.code === "INVALID_KEY"
        ? "⚠️ مفتاح API غير صحيح أو منتهي — راجعه من ⚙️ الإعدادات.\n\n"
        : err?.code === "REQUEST_FAILED"
          ? `⚠️ فشل الاتصال بـ OpenAI (${err.message || "خطأ غير محدد"}) — تحقق من الاتصال أو المفتاح.\n\n`
          : err?.code === "EMPTY_RESPONSE"
            ? "⚠️ الموديل لم يرجع رد — جرب مرة ثانية.\n\n"
            : "";
      fcbAppendMsg(prefix + fcbReplyFor(val), "bot");
    } finally {
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

/* ══════════════════════════════════════════════════════════════════════
   تبويب البوابين
   المصدر: window.RAW_GATEKEEPERS (key: gatekeepers في GAS)
   أعمدة الملف: المدينة، اسم المدرسة، الرقم الوزاري، اسم البواب، رقم الجوال، رقم الهوية

   لتشخيص أي مشكلة، افتح Console واكتب:
      typeof renderGatekeepersTab   → يجب أن تكون "function"
      window.RAW_GATEKEEPERS        → يجب أن تكون مصفوفة فيها بيانات
══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  console.log("[gatekeepers] الملف بدأ التحميل بنجاح ✅");

  // ── حماية: تأكد أن الدوال العامة المطلوبة من dashboard.js متوفرة ──────
  var fmt_ = typeof fmt === "function" ? fmt : function (v, d) {
    d = d || 0;
    return v == null ? "—" : Number(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  };
  var esc_ = typeof esc === "function" ? esc : function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  };
  if (typeof fmt !== "function" || typeof esc !== "function") {
    console.warn(
      "[gatekeepers] تحذير: fmt/esc غير متوفرة بشكل غير متوقع — سيتم استخدام نسخة احتياطية محلية.",
    );
  }

  var STATE = (window.__GATE_STATE__ = window.__GATE_STATE__ || {
    page: 0,
    size: 25,
    search: "",
    city: "",
    sort: "city",
  });

  function getRaw() {
    return Array.isArray(window.RAW_GATEKEEPERS) ? window.RAW_GATEKEEPERS : [];
  }

  function norm(v) {
    return String(v == null ? "" : v)
      .replace(/\uFEFF/g, "")
      .trim();
  }

  function normalizeRows() {
    return getRaw().map(function (r) {
      return {
        city: norm(r["المدينة"]),
        schoolName: norm(r["اسم المدرسة"]),
        minId: norm(r["الرقم الوزاري"]),
        gateName: norm(r["اسم البواب"]),
        phone: norm(r["رقم الجوال"]),
        nationalId: norm(r["رقم الهوية"]),
      };
    });
  }

  function filteredRows(all) {
    var q = STATE.search.trim().toLowerCase();
    return all.filter(function (r) {
      if (STATE.city && r.city !== STATE.city) return false;
      if (!q) return true;
      return (
        r.gateName.toLowerCase().indexOf(q) !== -1 ||
        r.schoolName.toLowerCase().indexOf(q) !== -1 ||
        r.minId.toLowerCase().indexOf(q) !== -1 ||
        r.phone.toLowerCase().indexOf(q) !== -1 ||
        r.nationalId.toLowerCase().indexOf(q) !== -1 ||
        r.city.toLowerCase().indexOf(q) !== -1
      );
    });
  }

  var SORTERS = {
    city: function (a, b) {
      return a.city.localeCompare(b.city, "ar") || a.schoolName.localeCompare(b.schoolName, "ar");
    },
    school: function (a, b) {
      return a.schoolName.localeCompare(b.schoolName, "ar");
    },
    name: function (a, b) {
      return a.gateName.localeCompare(b.gateName, "ar");
    },
    minId: function (a, b) {
      return (parseInt(a.minId, 10) || 0) - (parseInt(b.minId, 10) || 0);
    },
  };

  function sortRows(rows, sort) {
    return rows.slice().sort(SORTERS[sort] || SORTERS.city);
  }

  function escText(v) {
    return esc_(v);
  }

  function pctOf(n, total) {
    if (!total) return "0%";
    return ((n / total) * 100).toFixed(1) + "%";
  }

  function renderBarList(items, total, color) {
    if (!items.length) return '<div class="empty-msg" style="padding:18px">لا توجد بيانات</div>';
    return items
      .map(function (it) {
        var w = total ? Math.max(6, (it.v / total) * 100) : 0;
        return (
          '<div class="school-row" style="align-items:flex-start">' +
          '<div style="min-width:140px;flex:0 0 140px;font-size:12px;font-weight:700;color:var(--tx-main)">' +
          escText(it.k) +
          "</div>" +
          '<div style="flex:1"><div class="mini-track"><div class="mini-fill" style="width:' +
          w +
          "%;background:" +
          color +
          '"></div></div></div>' +
          '<div style="min-width:56px;text-align:left;font-weight:800;color:' +
          color +
          ';font-variant-numeric:tabular-nums">' +
          fmt_(it.v) +
          "</div></div>"
        );
      })
      .join("");
  }

  function renderPager(total) {
    var pages = Math.max(1, Math.ceil(total / STATE.size));
    var current = Math.min(STATE.page, pages - 1);
    STATE.page = current;
    var start = current * STATE.size;
    var end = Math.min(start + STATE.size, total);
    var prevDisabled = current <= 0 ? "disabled" : "";
    var nextDisabled = current >= pages - 1 ? "disabled" : "";

    return (
      '<div class="pag-bar">' +
      '<div class="pag-info">عرض ' +
      fmt_(start + 1) +
      " - " +
      fmt_(end) +
      " من " +
      fmt_(total) +
      " سجل</div>" +
      '<div class="pag-btns">' +
      '<button class="pag-btn" ' +
      prevDisabled +
      ' onclick="window.__GATE_STATE__.page=Math.max(0,window.__GATE_STATE__.page-1);renderGatekeepersTab()">◀ السابق</button>' +
      '<button class="pag-btn active">' +
      fmt_(current + 1) +
      " / " +
      fmt_(pages) +
      "</button>" +
      '<button class="pag-btn" ' +
      nextDisabled +
      ' onclick="window.__GATE_STATE__.page=Math.min(' +
      (pages - 1) +
      ',window.__GATE_STATE__.page+1);renderGatekeepersTab()">التالي ▶</button>' +
      "</div></div>"
    );
  }

  function exportGateCSV(rows) {
    var headers = ["المدينة", "اسم المدرسة", "الرقم الوزاري", "اسم البواب", "رقم الجوال", "رقم الهوية"];
    var csv = [headers.map(function (h) { return '"' + String(h).replace(/"/g, '""') + '"'; }).join(",")];
    rows.forEach(function (r) {
      var vals = [r.city, r.schoolName, r.minId, r.gateName, r.phone, r.nationalId].map(function (v) {
        return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
      });
      csv.push(vals.join(","));
    });
    var blob = new Blob(["\uFEFF" + csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "البوابين_" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function showErrorState(el, message) {
    el.innerHTML =
      '<div class="card empty-state">' +
      '<div class="empty-state-icon">⚠️</div>' +
      '<div class="empty-state-title">تعذّر عرض بيانات البوابين</div>' +
      '<div class="empty-state-sub">' +
      escText(message) +
      "</div></div>";
  }

  window.renderGatekeepersTab = function renderGatekeepersTab() {
    var el = document.getElementById("gatekeepers-content");
    if (!el) {
      console.warn('[gatekeepers] العنصر "gatekeepers-content" غير موجود في الصفحة — تحقق من index.html');
      return;
    }

    try {
      var all = normalizeRows();

      if (!all.length) {
        el.innerHTML =
          '<div class="card empty-state">' +
          '<div class="empty-state-icon">🧍</div>' +
          '<div class="empty-state-title">لم يتم التحميل</div>' +
          "</div></div>";
        console.warn("[gatekeepers] window.RAW_GATEKEEPERS فارغة أو غير موجودة. القيمة الحالية:", window.RAW_GATEKEEPERS);
        return;
      }

      var rows = sortRows(filteredRows(all), STATE.sort);
      var total = all.length;
      var filteredTotal = rows.length;

      var citiesSet = {};
      all.forEach(function (r) { if (r.city) citiesSet[r.city] = true; });
      var citiesList = Object.keys(citiesSet);

      var schoolsSet = {};
      rows.forEach(function (r) { var k = r.minId || r.schoolName; if (k) schoolsSet[k] = true; });
      var schoolsCount = Object.keys(schoolsSet).length;

      var missingPhone = rows.filter(function (r) { return !r.phone; }).length;

      var cityCounts = citiesList
        .map(function (c) {
          return { k: c, v: rows.filter(function (r) { return r.city === c; }).length };
        })
        .sort(function (a, b) { return b.v - a.v; });

      var list = rows.slice(STATE.page * STATE.size, STATE.page * STATE.size + STATE.size);
      var totalForBars = Math.max(1, filteredTotal);

      var cityOptions = citiesList
        .slice()
        .sort(function (a, b) { return a.localeCompare(b, "ar"); })
        .map(function (v) {
          return '<option value="' + escText(v) + '"' + (STATE.city === v ? " selected" : "") + ">" + escText(v) + "</option>";
        })
        .join("");

      var rowsHtml = list.length
        ? list
            .map(function (r) {
              return (
                "<tr>" +
                '<td style="text-align:right;font-weight:700">' + escText(r.schoolName || "—") + "</td>" +
                '<td style="font-weight:800">' + escText(r.minId || "—") + "</td>" +
                "<td>" + escText(r.city || "—") + "</td>" +
                '<td style="text-align:right;font-weight:700">' + escText(r.gateName || "—") + "</td>" +
                '<td style="font-variant-numeric:tabular-nums">' +
                (r.phone ? '<a href="tel:' + escText(r.phone) + '" style="color:#0891B2;text-decoration:none">' + escText(r.phone) + "</a>" : "—") +
                "</td>" +
                '<td style="font-variant-numeric:tabular-nums;color:var(--tx-muted)">' + escText(r.nationalId || "—") + "</td>" +
                "</tr>"
              );
            })
            .join("")
        : '<tr><td colspan="6"><div class="empty-msg">لا توجد نتائج مطابقة للفلاتر الحالية</div></td></tr>';

      el.innerHTML =
        '<div class="card mb14">' +
        '<div class="card-title">' +
        '<span class="card-title-icon" style="background:#EEF2FF;color:#4338CA">🧍</span>' +
        "<span>قائمة البوابين </span>" +
        '<span class="sub">' + fmt_(filteredTotal) + " من " + fmt_(total) + "</span>" +
        "</div>" +
        '<div class="g4" style="grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:0">' +
        '<div class="kpi kc-navy"><div class="kpi-val" style="color:#083D4F">' + fmt_(filteredTotal) + '</div><div class="kpi-lbl">إجمالي البوابين</div><div class="kpi-sub">' +
        (total === filteredTotal ? "كل السجلات من ملف CSV" : "من إجمالي " + fmt_(total) + " سجل") + "</div></div>" +
        '<div class="kpi kc-blue"><div class="kpi-val" style="color:#0891B2">' + fmt_(schoolsCount) + '</div><div class="kpi-lbl">عدد المدارس المغطاة</div><div class="kpi-sub">حسب الرقم الوزاري</div></div>' +
        '<div class="kpi kc-green"><div class="kpi-val" style="color:#059669">' + fmt_(citiesList.length) + '</div><div class="kpi-lbl">عدد المدن</div><div class="kpi-sub">' +
        escText(citiesList.slice(0, 3).join("، ") + (citiesList.length > 3 ? "…" : "")) + "</div></div>" +
        '<div class="kpi kc-amber"><div class="kpi-val" style="color:#92400e">' + fmt_(missingPhone) + '</div><div class="kpi-lbl">بدون رقم جوال</div><div class="kpi-sub">' +
        pctOf(missingPhone, filteredTotal) + " من المعروض</div></div>" +
        "</div></div>" +
        '<div class="filters-row" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">' +
        '<div class="fg" style="flex:1;min-width:240px"><div class="fg-lbl">بحث</div>' +
        '<input class="finp" id="gate-search" placeholder="🔍 اسم البواب أو المدرسة أو الجوال أو الهوية..." value="' + escText(STATE.search) + '" style="width:100%" ' +
        'oninput="window.__GATE_STATE__.search=this.value;window.__GATE_STATE__.page=0;renderGatekeepersTab()"></div>' +
        '<div class="fg"><div class="fg-lbl">المدينة</div>' +
        '<select class="fsel" id="gate-city" onchange="window.__GATE_STATE__.city=this.value;window.__GATE_STATE__.page=0;renderGatekeepersTab()">' +
        '<option value="">الكل</option>' + cityOptions + "</select></div>" +
        '<div class="fg"><div class="fg-lbl">الترتيب</div>' +
        '<select class="fsel" id="gate-sort" onchange="window.__GATE_STATE__.sort=this.value;window.__GATE_STATE__.page=0;renderGatekeepersTab()">' +
        '<option value="city"' + (STATE.sort === "city" ? " selected" : "") + ">المدينة ثم المدرسة</option>" +
        '<option value="school"' + (STATE.sort === "school" ? " selected" : "") + ">اسم المدرسة (أبجدي)</option>" +
        '<option value="name"' + (STATE.sort === "name" ? " selected" : "") + ">اسم البواب (أبجدي)</option>" +
        '<option value="minId"' + (STATE.sort === "minId" ? " selected" : "") + ">الرقم الوزاري</option>" +
        "</select></div>" +
        '<button class="f-clear" onclick="window.__GATE_STATE__={page:0,size:25,search:\'\',city:\'\',sort:\'city\'};renderGatekeepersTab()">✕ مسح الفلاتر</button>' +
        '<button class="export-btn export-btn-csv" onclick="window.exportGateCSV_dispatch && window.exportGateCSV_dispatch()">⬇ تصدير CSV</button>' +
        "</div>" +
        '<div class="card"><div class="card-title">' +
        '<span class="card-title-icon" style="background:#ECFDF5;color:#047857">📍</span>' +
        "<span>عدد البوابين حسب المدينة</span></div>" +
        renderBarList(cityCounts, totalForBars, "#0891B2") +
        "</div>" +
        '<div class="card"><div class="card-title">' +
        '<span class="card-title-icon" style="background:#EEF2FF;color:#4338CA">🧾</span>' +
        "<span>تفاصيل البوابين</span>" +
        '<span class="sub">' + fmt_(filteredTotal) + " سجل</span></div>" +
        '<div class="tbl-wrap"><table><thead><tr>' +
        '<th style="text-align:right;padding-right:14px;min-width:200px">اسم المدرسة</th>' +
        '<th style="min-width:90px">الرقم الوزاري</th>' +
        '<th style="min-width:100px">المدينة</th>' +
        '<th style="text-align:right;min-width:200px">اسم البواب</th>' +
        '<th style="min-width:110px">رقم الجوال</th>' +
        '<th style="min-width:110px">رقم الهوية</th>' +
        "</tr></thead><tbody>" + rowsHtml + "</tbody></table></div>" +
        renderPager(filteredTotal) +
        "</div>";

      window.exportGateCSV_dispatch = function () { exportGateCSV(rows); };
    } catch (err) {
      console.error("[gatekeepers] خطأ أثناء رسم تبويب البوابين:", err);
      showErrorState(el, "حدث خطأ غير متوقع: " + (err && err.message ? err.message : String(err)) + " — افتح Console (F12) للتفاصيل.");
    }
  };

  console.log(
    "[gatekeepers] تم تحميل الملف بنجاح. typeof renderGatekeepersTab =",
    typeof window.renderGatekeepersTab,
  );
})();
