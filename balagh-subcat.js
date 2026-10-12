/* ═══════════════════════════════════════════════════════════════════════════
   تبويب "تحليل الفئات الفرعية" للبلاغات (tab-balagh-subcat)
   ───────────────────────────────────────────────────────────────────────────
   ملف مستقل بذاته — لا يعدّل أي منطق موجود في dashboard.js:
   • يقرأ نفس البلاغات المطبَّعة التي يستخدمها تبويب البلاغات و NEW SLA
     عبر الدالة المعرَّضة window.__balaghNormalizeRows() (مصدرها RAW_BALAGH).
   • لا يكتب في أي بيانات ولا يغيّر أي حالة عامة (ما عدا window.__BALAGH_SUBCAT_STATE__
     وكائن الرسوم window.CHARTS بمعرّفات خاصة به "ch-bsc-*").
   • التسجيل: window.renderBalaghSubcatTab() تُستدعى من showTab/safeRun.
   • لو أي خطأ حدث أثناء الرسم يظهر للمستخدم رسالة داخل التبويب فقط، ولا يتأثر باقي اللوحة.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  /* __SVG_ICONS_NO_EMOJI__ */
  var BSC_ICONS = {"building":"<path d=\"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z\"/><path d=\"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2\"/><path d=\"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2\"/><path d=\"M10 6h4\"/><path d=\"M10 10h4\"/><path d=\"M10 14h4\"/><path d=\"M10 18h4\"/>","chart":"<path d=\"M5 21v-6\"/><path d=\"M12 21V3\"/><path d=\"M19 21V9\"/>","download":"<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/><polyline points=\"7 10 12 15 17 10\"/><line x1=\"12\" x2=\"12\" y1=\"15\" y2=\"3\"/>","filter":"<polygon points=\"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3\"/>","list":"<line x1=\"8\" x2=\"21\" y1=\"6\" y2=\"6\"/><line x1=\"8\" x2=\"21\" y1=\"12\" y2=\"12\"/><line x1=\"8\" x2=\"21\" y1=\"18\" y2=\"18\"/><line x1=\"3\" x2=\"3.01\" y1=\"6\" y2=\"6\"/><line x1=\"3\" x2=\"3.01\" y1=\"12\" y2=\"12\"/><line x1=\"3\" x2=\"3.01\" y1=\"18\" y2=\"18\"/>","loader":"<path d=\"M12 2v4\"/><path d=\"m16.2 7.8 2.9-2.9\"/><path d=\"M18 12h4\"/><path d=\"m16.2 16.2 2.9 2.9\"/><path d=\"M12 18v4\"/><path d=\"m4.9 19.1 2.9-2.9\"/><path d=\"M2 12h4\"/><path d=\"m4.9 4.9 2.9 2.9\"/>","maximize":"<polyline points=\"15 3 21 3 21 9\"/><polyline points=\"9 21 3 21 3 15\"/><line x1=\"21\" x2=\"14\" y1=\"3\" y2=\"10\"/><line x1=\"3\" x2=\"10\" y1=\"21\" y2=\"14\"/>","search":"<circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.3-4.3\"/>","x":"<path d=\"M18 6 6 18\"/><path d=\"m6 6 12 12\"/>","xcircle":"<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m15 9-6 6\"/><path d=\"m9 9 6 6\"/>"};
  function bscIco(n) {
    var d = BSC_ICONS[n]; if (!d) return "";
    return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;flex:none" aria-hidden="true">' + d + "</svg>";
  }
  "use strict";

  var CONTENT_ID = "balagh-subcat-content";
  var CANCELLED = { "ملغى": 1, "ملغي": 1, "cancelled": 1, "canceled": 1 };
  var TOP_N_CHART = 12;
  var MONTHS_BACK = 12;

  var ST = (window.__BALAGH_SUBCAT_STATE__ = window.__BALAGH_SUBCAT_STATE__ || {
    dateFrom: "", dateTo: "", category: "", search: "",
    sortKey: "total", sortDir: "desc", showAll: false, openSub: "",
    schoolSearch: "", schoolKey: "", openSchoolSub: "", schoolSortKey: "total", schoolSortDir: "desc", schoolShowAll: false, openSchool: "", schoolSub: ""
  });
  (function ensureDefaults() {
    var d = { schoolSearch: "", schoolKey: "", openSchoolSub: "", schoolSortKey: "total", schoolSortDir: "desc", schoolShowAll: false, openSchool: "", schoolSub: "" };
    Object.keys(d).forEach(function (k) { if (ST[k] === undefined) ST[k] = d[k]; });
  })();

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function fmt(n) { return (n || 0).toLocaleString("en-US"); }
  function pct(n, t) { return t ? ((n / t) * 100).toFixed(1) : null; }
  function pctTxt(n, t) { var p = pct(n, t); return p == null ? "—" : p + "%"; }
  function lc(v) { return String(v == null ? "" : v).trim().toLowerCase(); }
  function monthKey(d) {
    return d.getFullYear() + "-" + (d.getMonth() < 9 ? "0" : "") + (d.getMonth() + 1);
  }
  function isCancelled(r) { return !!CANCELLED[lc(r.status)]; }

  /* ── تجميع الصفوف حسب الفئة الفرعية ── */
  function aggregate(rows, anchorTs) {
    var map = {};
    var DAY = 86400000;
    rows.forEach(function (r) {
      var name = String(r.subCategory || "").trim() || "غير محددة";
      var a = map[name];
      if (!a) {
        a = map[name] = {
          name: name, total: 0, open: 0, closed: 0, cancelled: 0,
          resSum: 0, resN: 0, slaWith: 0, slaBreach: 0,
          last30: 0, prev30: 0, cats: {}, prios: {}, months: {}, schools: {}, contractors: {}, oldOpen: 0
        };
      }
      a.total++;
      var canc = isCancelled(r);
      if (canc) a.cancelled++;
      else if (r.isOpen) a.open++;
      else a.closed++;

      if (!canc && !r.isOpen && typeof r.resolutionDaysActual === "number" && isFinite(r.resolutionDaysActual)) {
        a.resSum += r.resolutionDaysActual; a.resN++;
      }
      if (r.slaStatus) { a.slaWith++; if (r.isOverdue) a.slaBreach++; }

      var cat = r.category || "—"; a.cats[cat] = (a.cats[cat] || 0) + 1;
      if (r.priority) a.prios[r.priority] = (a.prios[r.priority] || 0) + 1;

      if (r.creationDateObj) {
        var ts = r.creationDateObj.getTime();
        var mk = monthKey(r.creationDateObj);
        a.months[mk] = (a.months[mk] || 0) + 1;
        if (anchorTs) {
          var age = anchorTs - ts;
          if (age >= 0 && age < 30 * DAY) a.last30++;
          else if (age >= 30 * DAY && age < 60 * DAY) a.prev30++;
          if (!canc && r.isOpen && age > 30 * DAY) a.oldOpen++;
        }
      }
      var sk = r.schoolKey || r.schoolName || "—";
      var s = a.schools[sk] || (a.schools[sk] = { name: r.schoolName || sk, n: 0 });
      s.n++;
      if (r.contractor) a.contractors[r.contractor] = (a.contractors[r.contractor] || 0) + 1;
    });
    return Object.keys(map).map(function (k) {
      var a = map[k];
      a.mainCat = topKey(a.cats);
      a.mainPrio = topKey(a.prios);
      var denom = a.total - a.cancelled;
      a.closeRate = denom > 0 ? (a.closed / denom) * 100 : null;
      a.avgRes = a.resN ? a.resSum / a.resN : null;
      a.breachRate = a.slaWith ? (a.slaBreach / a.slaWith) * 100 : null;
      a.trend = a.last30 - a.prev30;
      return a;
    });
  }
  function topKey(obj) {
    var best = null, bc = -1;
    Object.keys(obj).forEach(function (k) { if (obj[k] > bc) { bc = obj[k]; best = k; } });
    return best || "—";
  }
  function topList(obj, n, nameFn) {
    return Object.keys(obj).map(function (k) {
      var v = obj[k];
      return typeof v === "object" ? { name: v.name, n: v.n } : { name: k, n: v };
    }).sort(function (x, y) { return y.n - x.n; }).slice(0, n);
  }

  /* ── تجميع الصفوف حسب المدرسة / الرقم الوزاري ── */
  function digitsOf(v) {
    var s = String(v == null ? "" : v);
    if (typeof window.normSchoolId === "function") return window.normSchoolId(s) || "";
    return s.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
  }
  // تطبيع نص عربي بسيط للبحث (تشكيل/همزات/ياء/تاء مربوطة)
  function normAr(v) {
    return lc(v).replace(/[ً-ْـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/\s+/g, " ");
  }
  function subOf(r) { return String(r.subCategory || "").trim() || "غير محددة"; }

  function schoolKeyOf(r) {
    if (r.schoolKey) return r.schoolKey;
    var id = digitsOf(r.linkedMinId || r.schoolNumber);
    var name = String(r.linkedSchoolName || r.schoolName || "").trim();
    return id ? "ID::" + id : (name ? "NM::" + name : "—");
  }
  function aggregateSchools(rows) {
    var map = {};
    rows.forEach(function (r) {
      var id = digitsOf(r.linkedMinId || r.schoolNumber);
      var name = String(r.linkedSchoolName || r.schoolName || "").trim();
      var key = schoolKeyOf(r);
      var a = map[key];
      if (!a) a = map[key] = { key: key, name: name, id: id, total: 0, open: 0, closed: 0, cancelled: 0, subs: {} };
      if (!a.name && name) a.name = name;
      if (!a.id && id) a.id = id;
      a.total++;
      if (isCancelled(r)) a.cancelled++;
      else if (r.isOpen) a.open++;
      else a.closed++;
      var sn = subOf(r);
      a.subs[sn] = (a.subs[sn] || 0) + 1;
    });
    return Object.keys(map).map(function (k) {
      var a = map[k];
      if (!a.name) a.name = a.id ? "مدرسة (رقم " + a.id + ")" : "غير محددة";
      var ks = Object.keys(a.subs);
      a.subCount = ks.length;
      a.topSub = topKey(a.subs);
      a.topSubN = a.subs[a.topSub] || 0;
      return a;
    });
  }
  var SCHOOL_SORTERS = {
    name: function (a, b) { return a.name.localeCompare(b.name, "ar"); },
    id: function (a, b) { return (+a.id || 0) - (+b.id || 0); },
    total: function (a, b) { return a.total - b.total; },
    open: function (a, b) { return a.open - b.open; },
    closed: function (a, b) { return a.closed - b.closed; },
    cancelled: function (a, b) { return a.cancelled - b.cancelled; },
    subCount: function (a, b) { return a.subCount - b.subCount; },
    topSub: function (a, b) { return String(a.topSub).localeCompare(String(b.topSub), "ar"); }
  };
  // فلتر المدرسة العام: مفتاح دقيق (لو اختير من الجدول) أو بحث بالرقم الوزاري/الاسم
  function rowIdOf(r) { return digitsOf(r.linkedMinId || r.schoolNumber); }
  function rowMatchesSchool(r) {
    if (ST.schoolKey) return schoolKeyOf(r) === ST.schoolKey;
    var q = String(ST.schoolSearch || "").trim();
    if (!q) return true;
    var looksId = /^[a-zA-Z\s\-_]*\d[\d\s\-_]*$/.test(q);
    if (looksId) {
      var qd = digitsOf(q) || q.replace(/[^0-9]/g, "");
      var id = rowIdOf(r);
      if (qd && id && id.indexOf(qd) !== -1) return true;
      // احتياط: رقم المدرسة الخام قد يحمل الرقم بشكل مختلف
      return !!qd && String(r.schoolNumber || "").replace(/[^0-9]/g, "").indexOf(qd) !== -1;
    }
    var nq = normAr(q);
    return normAr(r.linkedSchoolName || r.schoolName || "").indexOf(nq) !== -1;
  }

  /* ── ترتيب الجدول ── */
  var SORTERS = {
    name: function (a, b) { return a.name.localeCompare(b.name, "ar"); },
    mainCat: function (a, b) { return String(a.mainCat).localeCompare(String(b.mainCat), "ar"); },
    total: function (a, b) { return a.total - b.total; },
    open: function (a, b) { return a.open - b.open; },
    closed: function (a, b) { return a.closed - b.closed; },
    cancelled: function (a, b) { return a.cancelled - b.cancelled; },
    closeRate: function (a, b) { return nz(a.closeRate) - nz(b.closeRate); },
    avgRes: function (a, b) { return nz(a.avgRes) - nz(b.avgRes); },
    breachRate: function (a, b) { return nz(a.breachRate) - nz(b.breachRate); },
    trend: function (a, b) { return a.trend - b.trend; }
  };
  function nz(v) { return v == null ? -1 : v; }

  function destroyChart(id) {
    try {
      if (window.CHARTS && window.CHARTS[id]) { window.CHARTS[id].destroy(); delete window.CHARTS[id]; }
    } catch (_) {}
  }

  function bannerFor(state) {
    var icon = state === "loading" ? bscIco("loader") : state === "error" ? bscIco("xcircle") : bscIco("download");
    var msg = state === "loading" ? "يتم تحميل بيانات البلاغات…"
      : state === "error" ? (esc(window.__BALAGH_LOAD_ERR__ || "تعذّر تحميل البلاغات") +
        ' — <button onclick="window.loadBalaghSeparate && window.loadBalaghSeparate()" style="background:none;border:none;color:#0891B2;text-decoration:underline;cursor:pointer;font:inherit">إعادة المحاولة</button>')
      : 'لم تُحمَّل بيانات البلاغات بعد. <button onclick="window.loadBalaghSeparate && window.loadBalaghSeparate()" style="background:none;border:none;color:#0891B2;text-decoration:underline;cursor:pointer;font:inherit">تحميل الآن</button>';
    return '<div style="display:flex;align-items:center;gap:10px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:13px;font-weight:700;color:#92400E"><span style="font-size:16px">' + icon + '</span><span style="flex:1">' + msg + "</span></div>";
  }

  /* ═══════════════ الرسم الرئيسي ═══════════════ */
  function render() {
    var el = document.getElementById(CONTENT_ID);
    if (!el) return;
    try {
      renderInner(el);
    } catch (err) {
      console.error("[balagh-subcat]", err);
      el.innerHTML = '<div class="card" style="padding:28px;text-align:center"><div style="font-weight:800;margin-bottom:6px">تعذّر عرض تحليل الفئات الفرعية</div><div style="font-size:12px;color:var(--tx-muted)">' + esc(err && err.message) + "</div></div>";
    }
  }

  function renderInner(el) {
    var state = window.__BALAGH_LOAD_STATE__ || "idle";
    var rawLoaded = Array.isArray(window.RAW_BALAGH) && window.RAW_BALAGH.length > 0;
    var notLoaded = state !== "loaded" || !rawLoaded;
    var banner = notLoaded ? bannerFor(state) : "";
    if (typeof window.__balaghNormalizeRows !== "function" || !rawLoaded) {
      el.innerHTML = banner + '<div class="card" style="text-align:center;padding:48px 24px"><div style="font-size:15px;font-weight:700;color:var(--tx-main)">' +
        (rawLoaded ? "تعذّر تحميل وحدة البلاغات" : "لا توجد بيانات بلاغات لعرضها حتى الآن") + "</div></div>";
      return;
    }

    var all = window.__balaghNormalizeRows() || [];
    window.__bscAllRows = all;
    var dFrom = ST.dateFrom ? new Date(ST.dateFrom + "T00:00:00") : null;
    var dTo = ST.dateTo ? new Date(ST.dateTo + "T23:59:59") : null;

    // قائمة الفئات الرئيسية (من كل البيانات، بصرف النظر عن الفلاتر)
    var catSet = {};
    all.forEach(function (r) { if (r.category) catSet[r.category] = (catSet[r.category] || 0) + 1; });
    var cats = Object.keys(catSet).sort(function (a, b) { return catSet[b] - catSet[a]; });

    var subQ = lc(ST.search);
    var rows = all.filter(function (r) {
      if (ST.category && r.category !== ST.category) return false;
      if (!rowMatchesSchool(r)) return false;
      if (subQ && lc(subOf(r)).indexOf(subQ) === -1) return false;
      if (dFrom || dTo) {
        if (!r.creationDateObj) return false;
        var t = r.creationDateObj.getTime();
        if (dFrom && t < dFrom.getTime()) return false;
        if (dTo && t > dTo.getTime()) return false;
      }
      return true;
    });

    // أحدث تاريخ إنشاء ضمن البيانات المعروضة = مرجع "آخر 30 يوم" (أدق من تاريخ اليوم لو البيانات متأخرة)
    var anchorTs = 0;
    rows.forEach(function (r) { if (r.creationDateObj) { var t = r.creationDateObj.getTime(); if (t > anchorTs) anchorTs = t; } });
    anchorTs = anchorTs ? anchorTs + 86400000 : 0;

    var stats = aggregate(rows, anchorTs);
    var shown = stats.slice();
    var sorter = SORTERS[ST.sortKey] || SORTERS.total;
    shown.sort(function (a, b) { var c = sorter(a, b); return ST.sortDir === "asc" ? c : -c; });

    // ── المدارس (نفس فلاتر التاريخ/الفئة الرئيسية + فلتر الفئة الفرعية الاختياري) ──
    var schoolRows = ST.schoolSub ? rows.filter(function (r) { return subOf(r) === ST.schoolSub; }) : rows;
    var schoolStats = aggregateSchools(schoolRows);
    var schoolShown = schoolStats.slice();
    var sSorter = SCHOOL_SORTERS[ST.schoolSortKey] || SCHOOL_SORTERS.total;
    schoolShown.sort(function (a, b) {
      var c = sSorter(a, b);
      if (c === 0) c = b.total - a.total || a.name.localeCompare(b.name, "ar");
      return ST.schoolSortDir === "asc" ? c : -c;
    });
    window.__bscScope = schoolRows;
    var schoolHtml = schoolCardHtml(schoolStats, schoolShown, schoolRows.length);

    // ── مؤشرات عامة (على كل البلاغات بعد الفلاتر) ──
    var total = rows.length;
    var cancelled = rows.filter(isCancelled).length;
    var open = rows.filter(function (r) { return !isCancelled(r) && r.isOpen; }).length;
    var closed = total - cancelled - open;
    var resN = 0, resSum = 0, slaWith = 0, slaBreach = 0;
    rows.forEach(function (r) {
      if (!isCancelled(r) && !r.isOpen && typeof r.resolutionDaysActual === "number" && isFinite(r.resolutionDaysActual)) { resSum += r.resolutionDaysActual; resN++; }
      if (r.slaStatus) { slaWith++; if (r.isOverdue) slaBreach++; }
    });
    var noSub = rows.filter(function (r) { return !String(r.subCategory || "").trim(); }).length;

    var top = stats.slice().sort(function (a, b) { return b.total - a.total; });
    var top1 = top[0];
    var top5share = total ? top.slice(0, 5).reduce(function (s, x) { return s + x.total; }, 0) : 0;

    var LIMIT = 40;
    var tableRows = ST.showAll ? shown : shown.slice(0, LIMIT);

    function th(key, label, title) {
      var arrow = ST.sortKey === key ? (ST.sortDir === "asc" ? " ▲" : " ▼") : "";
      return '<th style="cursor:pointer;white-space:nowrap" title="' + esc(title || "ترتيب") + '" onclick="window.__bscSort(\'' + key + '\')">' + label + arrow + "</th>";
    }
    function trendCell(s) {
      if (!anchorTs) return "—";
      if (!s.last30 && !s.prev30) return '<span style="color:var(--tx-muted)">—</span>';
      var d = s.trend;
      var col = d > 0 ? "#B91C1C" : d < 0 ? "#047857" : "var(--tx-muted)";
      var sym = d > 0 ? "▲" : d < 0 ? "▼" : "■";
      return '<span style="font-weight:800;color:' + col + '" title="آخر 30 يومًا: ' + s.last30 + " · الـ30 يومًا السابقة: " + s.prev30 + '">' + sym + " " + Math.abs(d) + "</span>";
    }

    var body = tableRows.map(function (s) {
      var isOpenRow = ST.openSub === s.name;
      var brCol = s.breachRate == null ? "var(--tx-muted)" : s.breachRate >= 30 ? "#B91C1C" : s.breachRate >= 10 ? "#B45309" : "#047857";
      var line = '<tr style="cursor:pointer;' + (isOpenRow ? "background:var(--bg-2)" : "") + '" onclick="window.__bscToggle(this.getAttribute(\'data-sub\'))" data-sub="' + esc(s.name) + '">' +
        '<td style="max-width:340px;font-weight:700">' + (isOpenRow ? "▾ " : "▸ ") + esc(s.name) + "</td>" +
        '<td style="max-width:200px;color:var(--tx-muted);font-size:12px">' + esc(s.mainCat) + "</td>" +
        '<td style="font-weight:800">' + fmt(s.total) + "</td>" +
        '<td style="color:#B45309;font-weight:700">' + fmt(s.open) + "</td>" +
        '<td style="color:#047857;font-weight:700">' + fmt(s.closed) + "</td>" +
        '<td style="color:var(--tx-muted)">' + fmt(s.cancelled) + "</td>" +
        "<td>" + (s.closeRate == null ? "—" : s.closeRate.toFixed(1) + "%") + "</td>" +
        "<td>" + (s.avgRes == null ? "—" : s.avgRes.toFixed(1)) + "</td>" +
        '<td style="font-weight:700;color:' + brCol + '">' + (s.breachRate == null ? "—" : s.breachRate.toFixed(1) + "%") + "</td>" +
        "<td>" + trendCell(s) + "</td></tr>";
      if (isOpenRow) line += '<tr><td colspan="10" style="background:var(--bg-2);padding:14px 16px">' + detailHtml(s) + "</td></tr>";
      return line;
    }).join("");

    // شريط "النطاق الحالي": يوضّح ما الذي تعرضه الصفحة الآن
    var chips = [];
    if (ST.schoolKey || String(ST.schoolSearch).trim()) {
      var lbl = ST.schoolKey && schoolStats.length === 1 ? schoolStats[0].name + (schoolStats[0].id ? " (" + schoolStats[0].id + ")" : "") : ST.schoolSearch;
      chips.push("المدرسة: <strong>" + esc(lbl) + "</strong>");
    }
    if (String(ST.search).trim()) chips.push("الفئة الفرعية تحوي: <strong>" + esc(ST.search) + "</strong>");
    if (ST.category) chips.push("الفئة الرئيسية: <strong>" + esc(ST.category) + "</strong>");
    if (ST.dateFrom || ST.dateTo) chips.push("الفترة: <strong>" + esc(ST.dateFrom || "…") + " ← " + esc(ST.dateTo || "…") + "</strong>");
    var schoolsInScope = aggregateSchools(rows).length;
    var scopeBar = '<div style="margin-top:8px;padding:10px 14px;border-radius:10px;background:var(--bg-2);border:1px solid var(--bd-light);font-size:13px;line-height:2">' +
      "<strong>النطاق الحالي:</strong> " + fmt(total) + " بلاغ · " + fmt(schoolsInScope) + " مدرسة · " + fmt(stats.length) + " فئة فرعية" +
      (chips.length ? ' <span style="color:var(--tx-muted)">|</span> ' + chips.map(function (c) { return '<span style="display:inline-block;background:var(--bg-1,#fff);border:1px solid var(--bd-light);border-radius:14px;padding:1px 10px;margin:0 3px">' + c + "</span>"; }).join("") : ' <span style="color:var(--tx-muted)">(بدون فلاتر — كل البلاغات)</span>') +
      "</div>";

    var html =
      banner +
      '<div class="card mb14" id="bsc-filters"><div class="card-title"><span>الفلاتر <span class="sub" style="margin-right:6px">تطبّق على الصفحة كلها: المؤشرات والرسوم وجدول الفئات وجدول المدارس</span></span></div>' +
      '<div class="filters-row" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;padding:6px 0">' +
      '<div class="fg" style="flex:1.3;min-width:260px"><div class="fg-lbl">' + bscIco('building') + ' المدرسة / الرقم الوزاري</div>' +
      '<input class="finp" id="bsc-school-search" style="width:100%" autocomplete="off" placeholder="مثال: 41534 أو S-41534 أو جزء من اسم المدرسة…" value="' + esc(ST.schoolSearch) + '" oninput="window.__bscSchoolSearch(this.value)"></div>' +
      '<div class="fg" style="flex:1.3;min-width:240px"><div class="fg-lbl">' + bscIco('search') + ' الفئة الفرعية</div>' +
      '<input class="finp" id="bsc-search" style="width:100%" autocomplete="off" placeholder="اكتب جزءًا من اسم الفئة الفرعية…" value="' + esc(ST.search) + '" oninput="window.__bscSearch(this.value)"></div>' +
      '<div class="fg"><div class="fg-lbl">الفئة الرئيسية</div><select class="fsel" onchange="window.__bscSet(\'category\',this.value)"><option value="">كل الفئات</option>' +
      cats.map(function (c) { return '<option value="' + esc(c) + '"' + (ST.category === c ? " selected" : "") + ">" + esc(c) + " (" + fmt(catSet[c]) + ")</option>"; }).join("") +
      "</select></div>" +
      '<div class="fg"><div class="fg-lbl">من تاريخ</div><input class="finp" type="date" value="' + esc(ST.dateFrom) + '" onchange="window.__bscSet(\'dateFrom\',this.value)"></div>' +
      '<div class="fg"><div class="fg-lbl">إلى تاريخ</div><input class="finp" type="date" value="' + esc(ST.dateTo) + '" onchange="window.__bscSet(\'dateTo\',this.value)"></div>' +
      '<button class="f-clear" type="button" onclick="window.__bscClear()">مسح كل الفلاتر ' + bscIco('x') + '</button>' +
      "</div>" + scopeBar + "</div>" +

      '<div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">' +
      '<div class="kpi kc-blue"><div class="kpi-val">' + fmt(total) + '</div><div class="kpi-lbl">إجمالي البلاغات</div><div class="kpi-sub">' + fmt(stats.length) + " فئة فرعية</div></div>" +
      '<div class="kpi kc-amber"><div class="kpi-val">' + fmt(open) + '</div><div class="kpi-lbl">مفتوحة</div><div class="kpi-sub">' + pctTxt(open, total - cancelled) + " من غير الملغاة</div></div>" +
      '<div class="kpi kc-green"><div class="kpi-val">' + pctTxt(closed, total - cancelled) + '</div><div class="kpi-lbl">نسبة الإغلاق</div><div class="kpi-sub">' + fmt(closed) + " مغلقة · " + fmt(cancelled) + " ملغاة</div></div>" +
      '<div class="kpi kc-blue"><div class="kpi-val">' + (resN ? (resSum / resN).toFixed(1) : "—") + '</div><div class="kpi-lbl">متوسط زمن الحل</div><div class="kpi-sub">يوم · ' + fmt(resN) + " بلاغ مغلق</div></div>" +
      '<div class="kpi kc-red"><div class="kpi-val">' + pctTxt(slaBreach, slaWith) + '</div><div class="kpi-lbl">اختراق SLA</div><div class="kpi-sub">' + fmt(slaBreach) + " من " + fmt(slaWith) + "</div></div>" +
      "</div>" +

      '<div class="card mb14" style="padding:12px 16px;font-size:12.5px;color:var(--tx-muted);line-height:1.9">' +
      (top1 ? "أكثر فئة فرعية تكرارًا: <strong style=\"color:var(--tx-main)\">" + esc(top1.name) + "</strong> (" + fmt(top1.total) + " بلاغ — " + pctTxt(top1.total, total) + ")" +
        " · أعلى 5 فئات فرعية تمثّل <strong style=\"color:var(--tx-main)\">" + pctTxt(top5share, total) + "</strong> من البلاغات" : "") +
      (noSub ? " · <span title=\"بلاغات لا تحتوي قيمة في عمود الفئة الفرعية\">" + fmt(noSub) + " بلاغ بلا فئة فرعية (تظهر ضمن «غير محددة»)</span>" : "") +
      "</div>" +

      '<div class="g2 mb14">' +
      '<div class="card"><div class="card-title">أكثر ' + TOP_N_CHART + ' فئة فرعية <span class="sub">مفتوحة / مغلقة / ملغاة</span></div><div class="chart-box" style="height:380px"><canvas id="ch-bsc-top"></canvas></div></div>' +
      '<div class="card"><div class="card-title">الاتجاه الشهري لأعلى 5 فئات <span class="sub">آخر ' + MONTHS_BACK + ' شهرًا</span></div><div class="chart-box" style="height:380px"><canvas id="ch-bsc-trend"></canvas></div></div>' +
      "</div>" +

      '<div class="card mb14"><div class="card-title"><span>تفصيل الفئات الفرعية</span><span class="sub">' + fmt(shown.length) + " فئة" + (shown.length !== stats.length ? " من " + fmt(stats.length) : "") + " · اضغط على أي صف لعرض التفاصيل</span></div>" +
      '<div class="tbl-wrap"><table><thead><tr>' +
      th("name", "الفئة الفرعية") + th("mainCat", "الفئة الرئيسية") + th("total", "الإجمالي") + th("open", "مفتوحة") + th("closed", "مغلقة") + th("cancelled", "ملغاة") +
      th("closeRate", "نسبة الإغلاق", "مغلقة ÷ (الإجمالي − الملغاة)") + th("avgRes", "متوسط الحل (يوم)", "من تاريخ الإنشاء إلى تاريخ الحل للبلاغات المغلقة") +
      th("breachRate", "اختراق SLA", "بحسب حالة SLA في الشيت") + th("trend", "آخر 30 يوم", "الفرق بين آخر 30 يومًا والـ30 يومًا التي قبلها") +
      "</tr></thead><tbody>" +
      (body || '<tr><td colspan="10"><div class="empty-msg">لا توجد فئات فرعية مطابقة</div></td></tr>') +
      "</tbody></table></div>" +
      (shown.length > LIMIT ? '<div style="text-align:center;padding:10px"><button class="f-clear" type="button" onclick="window.__bscSet(\'showAll\',' + (ST.showAll ? "false" : "true") + ')">' + (ST.showAll ? "عرض أول " + LIMIT + " فقط" : "عرض كل الفئات (" + fmt(shown.length) + ")") + "</button></div>" : "") +
      "</div>" +
      schoolHtml;

    // نحفظ موضع التمرير وتركيز خانة البحث (إعادة الرسم الكاملة أثناء الكتابة)
    var ae = document.activeElement;
    var focusId = ae && (ae.id === "bsc-search" || ae.id === "bsc-school-search") ? ae.id : null;
    var selStart = focusId ? ae.selectionStart : null;
    el.innerHTML = html;
    if (focusId) {
      var inp = document.getElementById(focusId);
      if (inp) { inp.focus(); try { inp.setSelectionRange(selStart, selStart); } catch (_) {} }
    }
    window.__bscLast = { stats: stats, shown: shown, schools: schoolStats, schoolsShown: schoolShown };

    drawCharts(top, rows);
  }

  function schoolSubRows(key, sub) {
    var rows = window.__bscScope || [];
    return rows.filter(function (r) { return schoolKeyOf(r) === key && (!sub || subOf(r) === sub); });
  }
  function reportsSorted(list) {
    return list.slice().sort(function (a, b) {
      var ta = a.creationDateObj ? a.creationDateObj.getTime() : -1, tb = b.creationDateObj ? b.creationDateObj.getTime() : -1;
      return tb - ta;
    });
  }
  function schoolSubReportsHtml(key, sub) {
    var list = reportsSorted(schoolSubRows(key, sub));
    var CAP = 200;
    var COL = { open: "#B45309", closed: "#047857", cancelled: "#6B7280" };
    var LBL = { open: "مفتوح", closed: "مغلق", cancelled: "ملغى" };
    var rowsHtml = list.slice(0, CAP).map(function (r, i) {
      var st = isCancelled(r) ? "cancelled" : (r.isOpen ? "open" : "closed");
      return "<tr><td>" + (i + 1) + '</td><td style="direction:ltr;text-align:right;font-weight:700;white-space:nowrap">' + esc(r.recordNo || "—") + "</td>" +
        '<td><span style="font-weight:800;color:' + COL[st] + '">' + LBL[st] + "</span></td>" +
        "<td>" + esc(r.priority || "—") + '</td><td style="white-space:nowrap">' + dateTxt(r.creationDateObj) + '</td><td style="white-space:nowrap">' + (st === "open" ? "—" : dateTxt(r.finishDateObj)) + "</td>" +
        '<td style="font-size:12px">' + esc(r.contractor || "—") + '</td><td style="max-width:300px;font-size:11.5px;color:var(--tx-muted)" title="' + esc(r.problemDescription || "") + '">' + esc(String(r.problemDescription || "").slice(0, 100)) + "</td></tr>";
    }).join("");
    return '<div style="margin:6px 0 12px;padding:10px 12px;background:var(--bg-1,#fff);border:1px solid var(--bd-light);border-radius:10px">' +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px"><strong style="font-size:12.5px">' + fmt(list.length) + " بلاغ — " + esc(sub) + "</strong>" +
      '<span style="flex:1"></span>' +

      '<button type="button" class="f-clear" style="padding:3px 12px;font-size:12px" data-key="' + esc(key) + '" data-sub="' + esc(sub) + '" onclick="window.__bscSchoolSubModal(this.getAttribute(\'data-key\'),this.getAttribute(\'data-sub\'))">' + bscIco('maximize') + ' فتح في نافذة كاملة</button></div>' +
      '<div style="overflow:auto;max-height:340px"><table><thead><tr><th>#</th><th>رقم البلاغ</th><th>الحالة</th><th>الأولوية</th><th>تاريخ الإنشاء</th><th>تاريخ الحل</th><th>المقاول</th><th>الوصف</th></tr></thead><tbody>' + rowsHtml + "</tbody></table></div>" +
      (list.length > CAP ? '<div style="font-size:11.5px;color:var(--tx-muted);margin-top:6px">يُعرض أول ' + CAP + " من " + fmt(list.length) + " — اضغط «فتح في نافذة كاملة» لعرضها كلها.</div>" : "") + "</div>";
  }

  /* ── قسم: البلاغات حسب المدرسة / الرقم الوزاري ── */
  function schoolCardHtml(all, shown, rowsCount) {
    var SL = 50;
    var shownTotal = shown.reduce(function (n, x) { return n + x.total; }, 0);
    var list = ST.schoolShowAll ? shown : shown.slice(0, SL);
    function sth(key, label, title) {
      var arrow = ST.schoolSortKey === key ? (ST.schoolSortDir === "asc" ? " ▲" : " ▼") : "";
      return '<th style="cursor:pointer;white-space:nowrap" title="' + esc(title || "ترتيب") + '" onclick="window.__bscSchoolSort(\'' + key + '\')">' + label + arrow + "</th>";
    }
    var body = list.map(function (s) {
      var isOpenRow = ST.openSchool === s.key;
      var line = '<tr style="cursor:pointer;' + (isOpenRow ? "background:var(--bg-2)" : "") + '" data-key="' + esc(s.key) + '" onclick="window.__bscSchoolToggle(this.getAttribute(\'data-key\'))">' +
        '<td style="max-width:320px;font-weight:700">' + (isOpenRow ? "▾ " : "▸ ") + esc(s.name) + "</td>" +
        '<td style="direction:ltr;text-align:right;font-weight:700">' + (s.id ? esc(s.id) : "—") + "</td>" +
        '<td style="font-weight:800">' + fmt(s.total) + "</td>" +
        '<td style="color:#B45309;font-weight:700">' + fmt(s.open) + "</td>" +
        '<td style="color:#047857;font-weight:700">' + fmt(s.closed) + "</td>" +
        '<td style="color:var(--tx-muted)">' + fmt(s.cancelled) + "</td>" +
        "<td>" + fmt(s.subCount) + "</td>" +
        '<td style="max-width:280px;font-size:12px">' + esc(s.topSub) + ' <span style="color:var(--tx-muted)">(' + fmt(s.topSubN) + ")</span></td></tr>";
      if (isOpenRow) {
        var subs = Object.keys(s.subs).map(function (k) { return { name: k, n: s.subs[k] }; }).sort(function (a, b) { return b.n - a.n; });
        var mx = subs.length ? subs[0].n : 1;
        line += '<tr><td colspan="8" style="background:var(--bg-2);padding:12px 16px">' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px" data-key="' + esc(s.key) + '">' +
          '<button class="f-clear" type="button" onclick="event.stopPropagation();window.__bscOpenSchoolReports(this.parentNode.getAttribute(\'data-key\'))">' + bscIco('list') + ' عرض كل البلاغات (' + fmt(s.total) + ')</button>' +
          '<button class="f-clear" type="button" onclick="event.stopPropagation();window.__bscFocusSchool(this.parentNode.getAttribute(\'data-key\'))">' + bscIco('filter') + ' تصفية الصفحة بهذه المدرسة فقط</button>' +
          '</div>' +
          '<div style="font-size:12px;font-weight:800;margin-bottom:8px">الفئات الفرعية لهذه المدرسة (' + fmt(subs.length) + ") <span style=\"font-weight:400;color:var(--tx-muted)\">— اضغط على أي فئة لعرض بلاغاتها، أو «تنزيل» لتحميلها</span></div>" +
          subs.map(function (x) {
            var open = ST.openSchoolSub === s.key + "||" + x.name;
            var h = '<div style="display:flex;align-items:center;gap:10px;font-size:12.5px;padding:5px 4px;border-bottom:1px dashed var(--bd-light);cursor:pointer;' + (open ? "background:var(--bg-1,#fff);border-radius:8px" : "") + '" data-key="' + esc(s.key) + '" data-sub="' + esc(x.name) + '" onclick="window.__bscSchoolSubToggle(this.getAttribute(\'data-key\'),this.getAttribute(\'data-sub\'))">' +
              '<span style="flex:0 0 38%;min-width:140px;overflow:hidden;text-overflow:ellipsis;font-weight:' + (open ? "800" : "600") + '">' + (open ? "▾ " : "▸ ") + esc(x.name) + "</span>" +
              '<span style="flex:1;background:var(--bd-light);height:8px;border-radius:4px;overflow:hidden"><span style="display:block;height:8px;width:' + Math.max(3, Math.round(x.n / mx * 100)) + '%;background:#0891B2"></span></span>' +
              '<strong style="width:40px;text-align:left">' + fmt(x.n) + "</strong>" +
              "</div>";
            if (open) h += schoolSubReportsHtml(s.key, x.name);
            return h;
          }).join("") + "</td></tr>";
      }
      return line;
    }).join("");

    var chip = ST.schoolSub
      ? '<div style="margin:2px 0 10px;font-size:12.5px"><span style="display:inline-block;background:var(--bg-2);border:1px solid var(--bd-light);border-radius:14px;padding:4px 12px">الفئة الفرعية: <strong>' + esc(ST.schoolSub) + '</strong> <a href="javascript:void(0)" style="margin-right:8px;color:#B91C1C;font-weight:800;text-decoration:none" onclick="window.__bscSchoolSub(\'\')" title="إلغاء فلتر الفئة الفرعية">' + bscIco('x') + '</a></span></div>'
      : "";

    return '<div class="card mb14" id="bsc-schools-card"><div class="card-title"><span>البلاغات حسب المدرسة / الرقم الوزاري</span><span class="sub">' +
      fmt(shown.length) + " مدرسة" + (shown.length !== all.length ? " من " + fmt(all.length) : "") + " · " + fmt(rowsCount) + " بلاغ · اضغط على أي صف لعرض فئاتها الفرعية</span></div>" +
      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:4px 0 8px">' +
      '<button class="f-clear" type="button" style="font-weight:800" onclick="window.__bscSchoolAllCsv()" title="ملف واحد فيه كل بلاغات كل المدارس الظاهرة في الجدول: المدرسة، الرقم الوزاري، الفئة الفرعية، الحالة، التواريخ…">⬇ تنزيل كل البلاغات (' + fmt(shownTotal) + ") — " + fmt(shown.length) + " مدرسة</button>" +
      '<button class="f-clear" type="button" onclick="window.__bscSchoolCsv()" title="جدول ملخص: صف لكل مدرسة بأعداد المفتوحة والمغلقة">⬇ ملخص المدارس (صف لكل مدرسة)</button>' +
      "</div>" + chip +
      '<div style="font-size:11.5px;color:var(--tx-muted);margin-bottom:8px">الجدول يتبع الفلاتر في أعلى الصفحة. S-41534 و M41534 و 41534 تُحسب مدرسة واحدة.</div>' +
      '<div class="tbl-wrap"><table><thead><tr>' +
      sth("name", "المدرسة") + sth("id", "الرقم الوزاري") + sth("total", "إجمالي البلاغات") + sth("open", "مفتوحة") + sth("closed", "مغلقة") + sth("cancelled", "ملغاة") +
      sth("subCount", "عدد الفئات الفرعية") + sth("topSub", "أكثر فئة فرعية") +
      "</tr></thead><tbody>" +
      (body || '<tr><td colspan="8"><div class="empty-msg">لا توجد مدارس مطابقة</div></td></tr>') +
      "</tbody></table></div>" +
      (shown.length > SL ? '<div style="text-align:center;padding:10px"><button class="f-clear" type="button" onclick="window.__bscSetSchool(\'schoolShowAll\',' + (ST.schoolShowAll ? "false" : "true") + ')">' + (ST.schoolShowAll ? "عرض أول " + SL + " فقط" : "عرض كل المدارس (" + fmt(shown.length) + ")") + "</button></div>" : "") +
      "</div>";
  }

  /* ── تفاصيل فئة فرعية (داخل الصف المفتوح) ── */
  function detailHtml(s) {
    var months = [];
    var ref = new Date();
    // نرتكز على آخر شهر فيه بيانات لهذه الفئة أو الشهر الحالي
    var keys = Object.keys(s.months).sort();
    if (keys.length) { var p = keys[keys.length - 1].split("-"); ref = new Date(+p[0], +p[1] - 1, 1); }
    for (var i = MONTHS_BACK - 1; i >= 0; i--) {
      var d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
      var k = monthKey(d);
      months.push({ k: k, n: s.months[k] || 0 });
    }
    var maxM = Math.max.apply(null, months.map(function (m) { return m.n; }).concat([1]));
    var bars = months.map(function (m) {
      var h = Math.round((m.n / maxM) * 56);
      return '<div style="flex:1;text-align:center;min-width:0" title="' + m.k + ": " + m.n + '">' +
        '<div style="height:60px;display:flex;align-items:flex-end;justify-content:center"><div style="width:70%;height:' + Math.max(h, m.n ? 3 : 1) + 'px;background:' + (m.n ? "#0891B2" : "var(--bd-light)") + ';border-radius:3px 3px 0 0"></div></div>' +
        '<div style="font-size:9px;color:var(--tx-muted)">' + m.k.slice(5) + "</div><div style=\"font-size:10px;font-weight:700\">" + (m.n || "") + "</div></div>";
    }).join("");

    function listBlock(title, items, emptyTxt) {
      return '<div style="flex:1;min-width:230px"><div style="font-size:12px;font-weight:800;margin-bottom:6px">' + title + "</div>" +
        (items.length ? items.map(function (x) {
          return '<div style="display:flex;justify-content:space-between;gap:8px;font-size:12px;padding:3px 0;border-bottom:1px dashed var(--bd-light)"><span style="overflow:hidden;text-overflow:ellipsis">' + esc(x.name) + '</span><strong>' + fmt(x.n) + "</strong></div>";
        }).join("") : '<div style="font-size:12px;color:var(--tx-muted)">' + emptyTxt + "</div>") + "</div>";
    }
    var prios = topList(s.prios, 5);
    return '<div style="display:flex;gap:18px;flex-wrap:wrap">' +
      '<div style="flex:2;min-width:300px"><div style="font-size:12px;font-weight:800;margin-bottom:6px">البلاغات شهريًا (حسب تاريخ الإنشاء)</div><div style="display:flex;gap:3px;align-items:flex-end">' + bars + "</div>" +
      '<div style="font-size:11.5px;color:var(--tx-muted);margin-top:8px">' + (s.oldOpen ? "<strong style=\"color:#B45309\">" + fmt(s.oldOpen) + "</strong> بلاغ مفتوح مضى عليه أكثر من 30 يومًا" : "لا توجد بلاغات مفتوحة قديمة (أكثر من 30 يومًا)") + "</div></div>" +
      listBlock("أكثر المدارس تكرارًا", topList(s.schools, 5), "لا توجد بيانات") +
      listBlock("المقاولون", topList(s.contractors, 4), "غير محدد") +
      listBlock("الأولوية", prios, "غير محددة") +
      "</div>" +
      '<div style="margin-top:12px"><button class="f-clear" type="button" data-sub="' + esc(s.name) + '" onclick="event.stopPropagation();window.__bscSchoolSub(this.getAttribute(\'data-sub\'))">' + bscIco('building') + ' عرض كل المدارس لهذه الفئة (' + fmt(Object.keys(s.schools).length) + ")</button></div>";
  }

  /* ── الرسوم ── */
  function drawCharts(top, rows) {
    if (typeof Chart === "undefined") return;
    requestAnimationFrame(function () {
      try {
        var c1 = document.getElementById("ch-bsc-top");
        destroyChart("ch-bsc-top");
        if (c1) {
          var t = top.slice(0, TOP_N_CHART);
          window.CHARTS = window.CHARTS || {};
          window.CHARTS["ch-bsc-top"] = new Chart(c1, {
            type: "bar",
            data: {
              labels: t.map(function (x) { return x.name.length > 38 ? x.name.slice(0, 36) + "…" : x.name; }),
              datasets: [
                { label: "مفتوحة", data: t.map(function (x) { return x.open; }), backgroundColor: "#F59E0B" },
                { label: "مغلقة", data: t.map(function (x) { return x.closed; }), backgroundColor: "#10B981" },
                { label: "ملغاة", data: t.map(function (x) { return x.cancelled; }), backgroundColor: "#9CA3AF" }
              ]
            },
            options: {
              indexAxis: "y", responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { title: function (it) { var i = it[0].dataIndex; return t[i] ? t[i].name : ""; } } } },
              scales: { x: { stacked: true, beginAtZero: true }, y: { stacked: true, ticks: { font: { size: 11 } } } }
            }
          });
        }
        var c2 = document.getElementById("ch-bsc-trend");
        destroyChart("ch-bsc-trend");
        if (c2) {
          var top5 = top.slice(0, 5);
          // آخر 12 شهرًا بالنسبة لأحدث شهر في البيانات المعروضة
          var latest = null;
          rows.forEach(function (r) { if (r.creationDateObj && (!latest || r.creationDateObj > latest)) latest = r.creationDateObj; });
          var ref = latest || new Date();
          var labels = [], keys = [];
          for (var i = MONTHS_BACK - 1; i >= 0; i--) {
            var d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
            keys.push(monthKey(d)); labels.push(monthKey(d));
          }
          var PAL = ["#0891B2", "#F59E0B", "#10B981", "#8B5CF6", "#EF4444"];
          window.CHARTS = window.CHARTS || {};
          window.CHARTS["ch-bsc-trend"] = new Chart(c2, {
            type: "line",
            data: {
              labels: labels,
              datasets: top5.map(function (s, i) {
                return {
                  label: s.name.length > 30 ? s.name.slice(0, 28) + "…" : s.name,
                  data: keys.map(function (k) { return s.months[k] || 0; }),
                  borderColor: PAL[i % PAL.length], backgroundColor: PAL[i % PAL.length],
                  tension: 0.3, pointRadius: 2, borderWidth: 2
                };
              })
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } },
              scales: { y: { beginAtZero: true } }
            }
          });
        }
      } catch (e) { console.warn("[balagh-subcat][charts]", e); }
    });
  }

  /* ── تفاعلات (دوال عامة بأسماء خاصة __bsc*) ── */
  window.__bscSet = function (k, v) {
    ST[k] = v;
    if (k !== "showAll") ST.openSub = "";
    render();
  };
  // تأخير بسيط أثناء الكتابة (مع آلاف البلاغات كل إعادة رسم تأخذ ~0.3 ثانية)
  var _dbT = null;
  function renderSoon() { clearTimeout(_dbT); _dbT = setTimeout(render, 260); }
  window.__bscSearch = function (v) { ST.search = v; ST.openSub = ""; ST.openSchoolSub = ""; renderSoon(); };
  window.__bscSort = function (key) {
    if (ST.sortKey === key) ST.sortDir = ST.sortDir === "asc" ? "desc" : "asc";
    else { ST.sortKey = key; ST.sortDir = (key === "name" || key === "mainCat") ? "asc" : "desc"; }
    render();
  };
  window.__bscToggle = function (name) { ST.openSub = ST.openSub === name ? "" : name; render(); };
  window.__bscClear = function () {
    ST.dateFrom = ""; ST.dateTo = ""; ST.category = ""; ST.search = ""; ST.openSub = ""; ST.showAll = false;
    ST.schoolSearch = ""; ST.schoolKey = ""; ST.schoolSub = ""; ST.openSchool = ""; ST.openSchoolSub = ""; ST.schoolShowAll = false;
    render();
  };
  window.__bscSchoolSearch = function (v) { ST.schoolSearch = v; ST.schoolKey = ""; ST.openSub = ""; ST.openSchool = ""; ST.openSchoolSub = ""; ST.schoolShowAll = false; renderSoon(); };
  window.__bscSchoolSort = function (key) {
    if (ST.schoolSortKey === key) ST.schoolSortDir = ST.schoolSortDir === "asc" ? "desc" : "asc";
    else { ST.schoolSortKey = key; ST.schoolSortDir = (key === "name" || key === "topSub" || key === "id") ? "asc" : "desc"; }
    render();
  };
  window.__bscSchoolToggle = function (key) { ST.openSchool = ST.openSchool === key ? "" : key; ST.openSchoolSub = ""; render(); };
  window.__bscSetSchool = function (k, v) { ST[k] = v; render(); };
  window.__bscSchoolClear = function () { ST.schoolSearch = ""; ST.schoolKey = ""; ST.openSchool = ""; ST.schoolShowAll = false; render(); };
  // تصفية الصفحة كلها بمدرسة واحدة (مفتاح دقيق)
  window.__bscFocusSchool = function (key) {
    var L = window.__bscLast, sc = L && L.schools ? L.schools.filter(function (x) { return x.key === key; })[0] : null;
    ST.schoolKey = key; ST.schoolSearch = sc ? (sc.id || sc.name) : key; ST.openSub = ""; ST.openSchool = ""; ST.schoolShowAll = false;
    render();
    var f = document.getElementById("bsc-filters");
    if (f && f.scrollIntoView) { try { f.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_) { f.scrollIntoView(); } }
  };
  window.__bscSchoolSub = function (name) {
    ST.schoolSub = name || ""; ST.openSchool = ""; ST.schoolShowAll = false;
    render();
    if (name) {
      var c = document.getElementById("bsc-schools-card");
      if (c && c.scrollIntoView) { try { c.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_) { c.scrollIntoView(); } }
    }
  };
  window.__bscSchoolCsv = function () {
    var L = window.__bscLast;
    if (!L || !L.schoolsShown) return;
    var head = ["المدرسة", "الرقم الوزاري", "إجمالي البلاغات", "مفتوحة", "مغلقة", "ملغاة", "عدد الفئات الفرعية", "أكثر فئة فرعية", "عدد بلاغات أكثر فئة"];
    function cell(v) { var s = String(v == null ? "" : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
    var lines = [head.map(cell).join(",")].concat(L.schoolsShown.map(function (s) {
      return [s.name, s.id, s.total, s.open, s.closed, s.cancelled, s.subCount, s.topSub, s.topSubN].map(cell).join(",");
    }));
    var blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "البلاغات_حسب_المدرسة" + (ST.schoolSub ? "_" + ST.schoolSub.replace(/[\\/:*?"<>|]/g, "_").slice(0, 40) : "") + ".csv";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  window.__bscCsv = function () {
    var L = window.__bscLast;
    if (!L || !L.shown) return;
    var head = ["الفئة الفرعية", "الفئة الرئيسية", "الإجمالي", "مفتوحة", "مغلقة", "ملغاة", "نسبة الإغلاق %", "متوسط الحل (يوم)", "اختراق SLA %", "آخر 30 يوم", "الـ30 يوم السابقة"];
    function cell(v) { var s = String(v == null ? "" : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
    var lines = [head.map(cell).join(",")].concat(L.shown.map(function (s) {
      return [s.name, s.mainCat, s.total, s.open, s.closed, s.cancelled,
        s.closeRate == null ? "" : s.closeRate.toFixed(1), s.avgRes == null ? "" : s.avgRes.toFixed(1),
        s.breachRate == null ? "" : s.breachRate.toFixed(1), s.last30, s.prev30].map(cell).join(",");
    }));
    var blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "تحليل_الفئات_الفرعية_للبلاغات.csv";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  /* ══════════ نافذة «كل بلاغات المدرسة» ══════════ */
  var RM = { rows: [], title: "", sub: "", status: "", q: "", limit: 100 };
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function dateTxt(d) { return d && d.getTime && !isNaN(d.getTime()) ? d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()) : "—"; }
  function stOf(r) { return isCancelled(r) ? "cancelled" : (r.isOpen ? "open" : "closed"); }
  function rmFiltered() {
    var q = normAr(RM.q);
    var out = RM.rows.filter(function (r) {
      if (RM.status && stOf(r) !== RM.status) return false;
      if (q) {
        var hay = normAr([r.recordNo, r.status, r.category, r.subCategory, r.priority, r.contractor, r.problemDescription].join(" | "));
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    out.sort(function (a, b) {
      var ta = a.creationDateObj ? a.creationDateObj.getTime() : -1, tb = b.creationDateObj ? b.creationDateObj.getTime() : -1;
      return tb - ta;
    });
    return out;
  }
  function rmRender() {
    var ov = document.getElementById("bsc-rm");
    if (!ov) return;
    var list = rmFiltered();
    window.__bscRmShown = list;
    var cnt = { open: 0, closed: 0, cancelled: 0 };
    RM.rows.forEach(function (r) { cnt[stOf(r)]++; });
    var subCnt = {};
    RM.rows.forEach(function (r) { var k = subOf(r); subCnt[k] = (subCnt[k] || 0) + 1; });
    var subList = Object.keys(subCnt).map(function (k) { return { name: k, n: subCnt[k] }; }).sort(function (a, b) { return b.n - a.n; });
    var shownRows = list.slice(0, RM.limit);
    var COL = { open: "#B45309", closed: "#047857", cancelled: "#6B7280" };
    var LBL = { open: "مفتوح", closed: "مغلق", cancelled: "ملغى" };
    var body = shownRows.map(function (r, i) {
      var st = stOf(r);
      return "<tr>" +
        '<td style="color:var(--tx-muted)">' + (i + 1) + "</td>" +
        '<td style="direction:ltr;text-align:right;font-weight:700;white-space:nowrap">' + esc(r.recordNo || "—") + "</td>" +
        '<td><span style="font-weight:800;color:' + COL[st] + '">' + LBL[st] + '</span><div style="font-size:10.5px;color:var(--tx-muted)">' + esc(r.status || "") + "</div></td>" +
        '<td style="max-width:260px;font-weight:700">' + esc(subOf(r)) + '<div style="font-size:10.5px;color:var(--tx-muted);font-weight:400">' + esc(r.category || "") + "</div></td>" +
        "<td>" + esc(r.priority || "—") + "</td>" +
        '<td style="white-space:nowrap">' + dateTxt(r.creationDateObj) + "</td>" +
        '<td style="white-space:nowrap">' + (st === "open" ? "—" : dateTxt(r.finishDateObj)) + "</td>" +
        '<td style="max-width:170px;font-size:12px">' + esc(r.contractor || "—") + "</td>" +
        '<td style="max-width:320px;font-size:11.5px;color:var(--tx-muted)" title="' + esc(r.problemDescription || "") + '">' + esc(String(r.problemDescription || "").slice(0, 110)) + "</td></tr>";
    }).join("");
    var hadFocus = document.activeElement && document.activeElement.id === "bsc-rm-q";
    var pos = hadFocus ? document.activeElement.selectionStart : null;
    ov.innerHTML = '<div style="position:absolute;inset:0;background:rgba(6,20,28,.55)" onclick="window.__bscRmClose()"></div>' +
      '<div style="position:relative;margin:3vh auto;width:min(1180px,96vw);max-height:94vh;display:flex;flex-direction:column;background:var(--bg-3,#fff);border-radius:16px;box-shadow:0 20px 70px rgba(0,0,0,.4);overflow:hidden" dir="rtl">' +
      '<div style="display:flex;align-items:flex-start;gap:12px;padding:16px 20px;border-bottom:1px solid var(--bd-light)">' +
      '<div style="flex:1"><div style="font-size:17px;font-weight:800">' + esc(RM.title) + '</div><div style="font-size:12px;color:var(--tx-muted);margin-top:3px">' + esc(RM.sub) + "</div></div>" +
      '<button class="f-clear" type="button" onclick="window.__bscRmClose()" style="font-size:15px">' + bscIco('x') + ' إغلاق</button></div>' +
      '<div style="padding:12px 20px 0;display:flex;gap:10px;flex-wrap:wrap">' +
      [["", "الكل", RM.rows.length, "var(--tx-main)"], ["open", "مفتوحة", cnt.open, COL.open], ["closed", "مغلقة", cnt.closed, COL.closed], ["cancelled", "ملغاة", cnt.cancelled, COL.cancelled]].map(function (x) {
        var act = RM.status === x[0];
        return '<button type="button" onclick="window.__bscRmSet(\'status\',\'' + x[0] + '\')" style="cursor:pointer;border:2px solid ' + (act ? x[3] : "var(--bd-light)") + ';background:' + (act ? "var(--bg-2)" : "transparent") + ';border-radius:12px;padding:6px 16px;font-family:inherit"><div style="font-size:19px;font-weight:800;color:' + x[3] + '">' + fmt(x[2]) + '</div><div style="font-size:11.5px;color:var(--tx-muted)">' + x[1] + "</div></button>";
      }).join("") + "</div>" +
      '<div style="padding:12px 20px;display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">' +
      '<div class="fg" style="flex:1;min-width:220px"><div class="fg-lbl">بحث في البلاغات (رقم البلاغ، الفئة، الوصف، المقاول…)</div><input id="bsc-rm-q" class="finp" style="width:100%" autocomplete="off" value="' + esc(RM.q) + '" oninput="window.__bscRmSearch(this.value)"></div>' +
      '<div class="fg"><div class="fg-lbl">الفئة الفرعية</div><select class="fsel" onchange="window.__bscRmSet(\'q\',this.value)"><option value="">كل الفئات الفرعية (' + fmt(subList.length) + ")</option>" +
      subList.map(function (x) { return '<option value="' + esc(x.name) + '"' + (RM.q === x.name ? " selected" : "") + ">" + esc(x.name) + " (" + x.n + ")</option>"; }).join("") + "</select></div>" +
      '<button class="f-clear" type="button" onclick="window.__bscRmCsv()">⬇ تصدير CSV</button></div>' +
      '<div style="padding:0 20px 6px;font-size:12px;color:var(--tx-muted)">يُعرض ' + fmt(shownRows.length) + " من " + fmt(list.length) + " بلاغ — الأحدث أولًا</div>" +
      '<div style="overflow:auto;padding:0 20px 10px;flex:1"><table><thead><tr><th>#</th><th>رقم البلاغ</th><th>الحالة</th><th>الفئة الفرعية / الرئيسية</th><th>الأولوية</th><th>تاريخ الإنشاء</th><th>تاريخ الحل</th><th>المقاول</th><th>الوصف</th></tr></thead><tbody>' +
      (body || '<tr><td colspan="9"><div class="empty-msg">لا توجد بلاغات مطابقة</div></td></tr>') + "</tbody></table>" +
      (list.length > RM.limit ? '<div style="text-align:center;padding:12px"><button class="f-clear" type="button" onclick="window.__bscRmMore()">عرض ' + Math.min(100, list.length - RM.limit) + " بلاغ إضافي (المتبقي " + fmt(list.length - RM.limit) + ")</button></div>" : "") +
      "</div></div>";
    if (hadFocus) { var inp = document.getElementById("bsc-rm-q"); if (inp) { inp.focus(); try { inp.setSelectionRange(pos, pos); } catch (_) {} } }
  }
  function openReportsModal(rows, title, sub) {
    RM = { rows: rows.slice(), title: title, sub: sub, status: "", q: "", limit: 100 };
    var ov = document.getElementById("bsc-rm");
    if (!ov) {
      ov = document.createElement("div");
      ov.id = "bsc-rm";
      ov.style.cssText = "position:fixed;inset:0;z-index:9300;overflow:auto;display:none";
      document.body.appendChild(ov);
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") window.__bscRmClose(); });
    }
    ov.style.display = "block";
    document.body.setAttribute("data-bsc-rm", "1");
    rmRender();
  }
  window.__bscRmClose = function () { var ov = document.getElementById("bsc-rm"); if (ov) { ov.style.display = "none"; ov.innerHTML = ""; } document.body.removeAttribute("data-bsc-rm"); };
  window.__bscRmSet = function (k, v) { RM[k] = v; RM.limit = 100; rmRender(); };
  window.__bscRmSearch = function (v) { RM.q = v; RM.limit = 100; rmRender(); };
  window.__bscRmMore = function () { RM.limit += 100; rmRender(); };
  function csvDate(d) { var t = dateTxt(d); return t === "—" ? "" : t; }
  function csvReports(list, fileName) {
    var head = ["المدرسة", "الرقم الوزاري", "رقم البلاغ", "الحالة", "التصنيف", "الفئة الرئيسية", "الفئة الفرعية", "الأولوية", "تاريخ الإنشاء", "تاريخ الحل", "المقاول", "الوصف"];
    function cell(v) { var s = String(v == null ? "" : v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
    var LBL = { open: "مفتوح", closed: "مغلق", cancelled: "ملغى" };
    var lines = [head.map(cell).join(",")].concat(list.map(function (r) {
      return [r.linkedSchoolName || r.schoolName, digitsOf(r.linkedMinId || r.schoolNumber), r.recordNo, r.status, LBL[stOf(r)], r.category, subOf(r), r.priority, csvDate(r.creationDateObj), stOf(r) === "open" ? "" : csvDate(r.finishDateObj), r.contractor, r.problemDescription].map(cell).join(",");
    }));
    var blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = String(fileName).replace(/[\\/:*?"<>|]/g, "_").slice(0, 90) + ".csv";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  window.__bscRmCsv = function () {
    csvReports(window.__bscRmShown || [], "بلاغات_" + String(RM.title).replace(/^كل بلاغات:\s*/, ""));
  };
  // من صف المدرسة: تنزيل بلاغات فئة فرعية (أو كل بلاغات المدرسة لو sub فاضي) ضمن الفلاتر الحالية
  window.__bscSchoolSubCsv = function (key, sub) {
    var list = reportsSorted(schoolSubRows(key, sub));
    var r0 = list[0] || {};
    var nm = String(r0.linkedSchoolName || r0.schoolName || "مدرسة").trim();
    csvReports(list, "بلاغات_" + nm + (sub ? "_" + sub : "") + "_(" + list.length + ")");
  };
  // ملف واحد: كل بلاغات كل المدارس الظاهرة في الجدول (ضمن فلاتر الصفحة)
  window.__bscSchoolAllCsv = function () {
    var L = window.__bscLast;
    if (!L || !L.schoolsShown) return;
    var order = {};
    L.schoolsShown.forEach(function (sc, i) { order[sc.key] = i; });
    var list = (window.__bscScope || []).filter(function (r) { return order[schoolKeyOf(r)] !== undefined; });
    list = reportsSorted(list).sort(function (a, b) { return order[schoolKeyOf(a)] - order[schoolKeyOf(b)]; });
    csvReports(list, "بلاغات_المدارس_(" + L.schoolsShown.length + "_مدرسة_" + list.length + "_بلاغ)");
  };
  window.__bscSchoolSubModal = function (key, sub) {
    var list = schoolSubRows(key, sub);
    var t = schoolTitle(list);
    openReportsModal(list, t.title + " — " + sub, (t.id ? "الرقم الوزاري " + t.id + " · " : "") + fmt(list.length) + " بلاغ في هذه الفئة الفرعية (ضمن فلاتر الصفحة)");
  };
  window.__bscSchoolSubToggle = function (key, sub) {
    var id = key + "||" + sub;
    ST.openSchoolSub = ST.openSchoolSub === id ? "" : id;
    render();
  };
  function schoolTitle(rows) {
    var r0 = rows[0] || {};
    var nm = String(r0.linkedSchoolName || r0.schoolName || "").trim() || "مدرسة";
    var id = digitsOf(r0.linkedMinId || r0.schoolNumber);
    return { title: "كل بلاغات: " + nm, id: id, name: nm };
  }
  // من تبويب الفئات الفرعية: كل بلاغات المدرسة (بدون أي فلاتر)
  window.__bscOpenSchoolReports = function (key) {
    var all = window.__bscAllRows || [];
    var rows = all.filter(function (r) { return schoolKeyOf(r) === key; });
    var t = schoolTitle(rows);
    openReportsModal(rows, t.title, (t.id ? "الرقم الوزاري " + t.id + " · " : "") + fmt(rows.length) + " بلاغ (كل البلاغات بصرف النظر عن فلاتر الصفحة)");
  };

  /* ══════════ ربط بانل المدرسة (الصفحة الرئيسية) ══════════ */
  function panelRows() {
    var raw = window.__bscPanelRaw || [];
    var ids = {};
    raw.forEach(function (r) { var k = String(r && r["مُعرّف الحالة"] != null ? r["مُعرّف الحالة"] : "").trim(); if (k) ids[k] = 1; });
    var norm = [];
    try { norm = typeof window.__balaghNormalizeRows === "function" ? (window.__balaghNormalizeRows() || []) : []; } catch (_) {}
    var rows = norm.filter(function (r) { return r.recordNo && ids[String(r.recordNo).trim()]; });
    return rows;
  }
  window.__bscPanelButtons = function (rawRows) {
    try {
      window.__bscPanelRaw = rawRows || [];
      var n = (rawRows || []).length;
      if (!n) return "";
      return '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 12px">' +
        '<button type="button" class="f-clear" style="flex:1;min-width:150px;font-weight:800;padding:9px 12px" onclick="window.__bscOpenPanelReports()">' + bscIco('list') + ' عرض كل البلاغات (' + fmt(n) + ")</button>" +
        '<button type="button" class="f-clear" style="flex:1;min-width:150px;padding:9px 12px" onclick="window.__bscGoSchoolAnalysis()">' + bscIco('chart') + ' تحليل الفئات الفرعية لها</button></div>';
    } catch (_) { return ""; }
  };
  window.__bscOpenPanelReports = function () {
    var rows = panelRows();
    if (!rows.length) { alert("تعذّر تجهيز قائمة البلاغات — جرّب فتح تبويب البلاغات أولًا."); return; }
    var t = schoolTitle(rows);
    var expected = (window.__bscPanelRaw || []).length;
    openReportsModal(rows, t.title, (t.id ? "الرقم الوزاري " + t.id + " · " : "") + fmt(rows.length) + " بلاغ" + (rows.length !== expected ? " (من أصل " + fmt(expected) + " في البانل)" : ""));
  };
  window.__bscGoSchoolAnalysis = function () {
    var rows = panelRows();
    if (!rows.length) return;
    var t = schoolTitle(rows);
    var keys = {};
    rows.forEach(function (r) { keys[schoolKeyOf(r)] = 1; });
    var kl = Object.keys(keys);
    ST.dateFrom = ""; ST.dateTo = ""; ST.category = ""; ST.search = ""; ST.openSub = ""; ST.showAll = false;
    ST.schoolSub = ""; ST.openSchool = ""; ST.schoolShowAll = false;
    ST.schoolKey = kl.length === 1 ? kl[0] : "";
    ST.schoolSearch = t.id || t.name;
    try { if (typeof window.__IXCloseSchool === "function") window.__IXCloseSchool(); } catch (_) {}
    try { window.__bscRmClose(); } catch (_) {}
    if (typeof window.showTab === "function") window.showTab("balagh-subcat", null);
    else render();
    try { window.scrollTo({ top: 0 }); } catch (_) {}
  };

  window.renderBalaghSubcatTab = render;

  /* ── إعادة رسم تلقائية عند وصول نسخة جديدة من البلاغات (وفقط والتبويب ظاهر) ── */
  var lastRef = null, lastState = null;
  setInterval(function () {
    try {
      var panel = document.getElementById("tab-balagh-subcat");
      if (!panel || !panel.classList.contains("active")) { lastRef = window.RAW_BALAGH; lastState = window.__BALAGH_LOAD_STATE__; return; }
      if (window.RAW_BALAGH !== lastRef || window.__BALAGH_LOAD_STATE__ !== lastState) {
        lastRef = window.RAW_BALAGH; lastState = window.__BALAGH_LOAD_STATE__;
        render();
      }
    } catch (_) {}
  }, 4000);
})();
