/* report_generator.js — التقرير الأسبوعي لمتابعة البلاغات (4 مناطق + المنطقة الغربية كاملة + شريحة SLA) بصيغة PowerPoint.
   (2026-10-17) أسبوع التقرير صار من السبت إلى الجمعة. أُضيف قسم «المنطقة الغربية كاملة» (غلاف + 5 شرائح، تجميع الأربع مناطق)
   وشريحة «SLA compliance» (رسم خطي قابل للتعديل لآخر 4 أسابيع بحساب NEW SLA) قبل شريحة الختام. القالب الآن 32 شريحة.
   (2026-10-10) استُبدل التقرير القطاعي الشهري القديم بتقرير أسبوعي لكل منطقة على حدة:
   غلاف المنطقة ← نظرة عامة ← اتجاه البلاغات والأولوية ← جودة الخدمة وزيارات الاستشاري
   ← الصيانة الوقائية (PPM Maximo) ← أعلى 10 مدارس. ثم شريحة ختام واحدة للتقرير كله.
   يعمل بالكامل داخل المتصفح: يحمّل report_template.pptx (32 شريحة جاهزة بنفس الشعارات والألوان)
   ويعدّل القيم فقط ثم ينزّل الملف.
   الفترة: الأسبوع من السبت إلى الجمعة المنتهي بالتاريخ المختار (افتراضيًا آخر جمعة) + 4 أسابيع للخلف.
   التراكمي والصيانة الوقائية: من أول الشهر إلى نهاية الأسبوع المختار.
   قيم يدوية (لا مصدر لها في الداشبورد): الرضا ومتوسط التقييم، المعاد فتحها (تكرار 1 / 2–3)،
   وزيارات TFMP (المخطط والمكتمل لأسبوعين) — تُدخل في نافذة واحدة وتُحفظ في المتصفح. */

(function () {
  "use strict";

  const TEMPLATE_URL = "report_template.pptx";
  // نسخة base64 من نفس القالب تُستخدم فقط إن فشل fetch (مثلًا فتح الداشبورد كملف file://).
  // ⚠️ أي تعديل على report_template.pptx يستلزم إعادة توليد report_template_data.js وتغيير TEMPLATE_VERSION.
  const TEMPLATE_DATA_JS = "report_template_data.js";
  const TEMPLATE_VERSION = "20261018a";
  const REGION_ORDER = ["جدة", "مكة المكرمة", "المدينة المنورة", "الطائف"];
  const SLIDES_PER_REGION = 6; // غلاف + 5 شرائح
  const WEST = "المنطقة الغربية";          // تجميع الأربع مناطق
  const WEST_DISPLAY = "المنطقة الغربية كاملة";
  const ALL_REGIONS = REGION_ORDER.concat([WEST]); // ترتيب الأقسام داخل القالب: 4 مناطق ثم الغربية
  const WEST_SLIDE_BASE = REGION_ORDER.length * SLIDES_PER_REGION; // 24: بداية شرائح الغربية
  const SLA_SLIDE_INDEX = WEST_SLIDE_BASE + SLIDES_PER_REGION;     // 30: شريحة SLA compliance
  const EXPECTED_SLIDES = SLA_SLIDE_INDEX + 2;                      // + شريحة الختام = 32
  const SLA_WEEKS = 4;
  // كلمة مرور تنزيل التقرير = نفس كلمة دخول Land Sterling (LANDSTERLING_PASSWORD في index.html)
  const REPORT_DOWNLOAD_PASSWORD = "1248";
  const MANUAL_STORE_KEY = "balaghWeeklyReportManual_v1";
  const SAFETY_GROUP_ORDER = ["المصاعد", "مخارج الطوارئ", "أنظمة الأمن والسلامة", "اعمال الكهرباء"];
  const SAFETY_GROUP_LABEL = { "اعمال الكهرباء": "أعمال الكهرباء" };
  // ألوان القالب
  const C_ORANGE_TXT = "C07F2A", C_ORANGE_BAR = "E0A95E", C_GREEN_BAR = "89A895", C_NAVY = "17355C";
  const C_UP = "F2C27B", C_DOWN = "A8D5B5";

  // ═════════════════════════ دوال عامة ═════════════════════════
  function norm_(v) { return String(v == null ? "" : v).trim(); }
  function fmtNum_(n) { return Math.round(n || 0).toLocaleString("en-US"); }
  function pct1_(n, d) { return d > 0 ? ((n / d) * 100).toFixed(1) : "0.0"; }
  // "العدد (النسبة%)" والصفر يُكتب "0" فقط
  function cntPct_(n, d) { n = Math.round(n || 0); return n > 0 ? `${fmtNum_(n)} (${pct1_(n, d)}%)` : "0"; }
  // "طارئ" = الأولوية "حرج/Critical" فقط. "روتيني" = أي شيء آخر.
  function isEmergencyPriority_(p) { const v = norm_(p).toLowerCase(); return v === "حرج" || v === "critical"; }
  function isConsultantApproval_(r) {
    const s = norm_(r.status);
    return s === "Consultant Approval In Progress" || s === "موافقة الاستشاري قيد التنفيذ";
  }
  // تقويم ميلادي صريحًا (ar-SA الافتراضي قد يكون هجريًا)
  const AR_LOCALE = "ar-SA-u-ca-gregory-nu-latn";
  function dayMonth_(d) { return d.toLocaleDateString(AR_LOCALE, { day: "numeric", month: "long" }); }
  function monthName_(d) { return d.toLocaleDateString(AR_LOCALE, { month: "long" }); }
  function rangeLabel_(s, e, withYear) {
    const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
    const a = sameMonth ? String(s.getDate()) : dayMonth_(s);
    return `${a} – ${dayMonth_(e)}${withYear ? " " + e.getFullYear() : ""}`;
  }
  function startOfDay_(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function endOfDay_(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999); }
  function addDays_(d, n) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
  function iso_(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
  // الجمعة الذي ينتهي به أسبوع (سبت→جمعة) يحوي التاريخ d
  function fridayOfWeek_(d) {
    const x = startOfDay_(d);
    const toFri = (5 - x.getDay() + 7) % 7; // getDay(): الأحد=0 … الجمعة=5 … السبت=6
    return addDays_(x, toFri);
  }
  // آخر جمعة لا يتجاوز اليوم (لو اليوم جمعة فهو اليوم؛ ولو السبت فهو أمس)
  function defaultWeekEnd_() {
    const t = startOfDay_(new Date());
    return addDays_(t, -((t.getDay() + 2) % 7));
  }
  function signedPct_(cur, base) {
    if (!base) return null;
    const v = ((cur - base) / base) * 100;
    return (v > 0 ? "+" : "") + v.toFixed(1) + "%";
  }
  function pctNum_(v) { // نسبة مخزّنة 0..1 أو 0..100
    const n = typeof v === "number" ? v : parseFloat(String(v == null ? "" : v).replace(/[,%]/g, ""));
    if (!isFinite(n)) return null;
    return n <= 1 ? n * 100 : n;
  }
  function plainNum_(v) {
    if (v === null || v === undefined || v === "" || v === "_" || v === "-") return null;
    const n = parseFloat(String(v).replace(/,/g, ""));
    return isNaN(n) ? null : n;
  }
  // تاريخ بداية الصيانة الوقائية بالعربية: «1 أكتوبر 2026» (النمط 01-Oct-26 كان يظهر مقلوبًا «-01Oct-26» في PowerPoint داخل خلايا RTL)
  function ppmDate_(v) {
    if (!v) return "";
    let d = null;
    if (v instanceof Date) d = v;
    else {
      const m = String(v).trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(String(v));
    }
    if (!d || isNaN(d.getTime())) return String(v);
    return `${d.getDate()} ${monthName_(d)} ${d.getFullYear()}`;
  }

  // نسبة رضا المستفيد = متوسط تقييم الحالة ÷ 5 × 100 (تُحسب تلقائيًا ولا تُدخل يدويًا)؛ تكرار 4 إلى 8 افتراضيًا 0
  function normalizeManual_(m) {
    if (!m) return null;
    const o = Object.assign({}, m);
    o.rep3 = o.rep3 == null ? 0 : o.rep3;
    o.sat = o.rating != null ? (Number(o.rating) / 5) * 100 : null;
    return o;
  }

  // ── تجميع الغربية: الصيانة الوقائية حسب اسم المهمة ──
  function ppmDateObj_(v) {
    if (!v) return null;
    let d;
    if (v instanceof Date) d = v;
    else {
      const m = String(v).trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(String(v));
    }
    return d && !isNaN(d.getTime()) ? d : null;
  }
  function pooledPpmRows_(rows) {
    const map = new Map();
    rows.forEach((r) => {
      const name = norm_(r["اسم المهمة"]);
      if (!map.has(name)) map.set(name, { name, tt: 0, ac: 0, tc: 0, date: null, dateRaw: "" });
      const g = map.get(name);
      g.tt += plainNum_(r["اجمالي المستهدف"]) || 0;
      g.ac += plainNum_(r["المحقق التراكمي"]) || 0;
      g.tc += plainNum_(r["المستهدف التراكمي"]) || 0;
      const d = ppmDateObj_(r["تاريخ البداية"]);
      if (d && (!g.date || d < g.date)) { g.date = d; g.dateRaw = r["تاريخ البداية"]; }
    });
    return [...map.values()].map((g) => ({
      __pooled: true,
      "اسم المهمة": g.name,
      "اجمالي المستهدف": g.tt, "المحقق التراكمي": g.ac, "المستهدف التراكمي": g.tc,
      "تاريخ البداية": g.dateRaw,
      __pTotal: g.tt ? (g.ac / g.tt) * 100 : null,
      __pCum: g.tc ? (g.ac / g.tc) * 100 : null,
    }));
  }
  // ── تجميع الغربية: القيم اليدوية (مجموع الأعداد، والتقييم موزون بعدد بلاغات الأسبوع) ──
  function pooledManual_(regionData) {
    const ms = regionData.map((R) => ({ R, M: R.manual })).filter((x) => x.M);
    if (!ms.length) return null;
    const sum = (f) => ms.reduce((s, x) => s + (Number(f(x.M)) || 0), 0);
    const rated = ms.filter((x) => x.M.rating != null && isFinite(Number(x.M.rating)));
    let rating = null;
    if (rated.length) {
      const w = rated.reduce((s, x) => s + (x.R.cur || 0), 0);
      rating = w > 0 ? rated.reduce((s, x) => s + Number(x.M.rating) * (x.R.cur || 0), 0) / w
        : rated.reduce((s, x) => s + Number(x.M.rating), 0) / rated.length;
    }
    return normalizeManual_({
      rating, rep1: sum((m) => m.rep1), rep2: sum((m) => m.rep2), rep3: sum((m) => m.rep3),
      tfmp: { pp: sum((m) => m.tfmp && m.tfmp.pp), pd: sum((m) => m.tfmp && m.tfmp.pd), cp: sum((m) => m.tfmp && m.tfmp.cp), cd: sum((m) => m.tfmp && m.tfmp.cd) },
    });
  }

  // ── اتجاه NEW SLA الأسبوعي (نفس منطق صفحة SLA compliance): ملتزم ÷ (ملتزم + مخترق + مخترق مفتوح)؛ P5 وغير المطابق مستبعدان ──
  function computeSlaTrend_(all, E, regionSet) {
    const wk = [];
    for (let i = SLA_WEEKS - 1; i >= 0; i--) {
      const e = addDays_(E, -7 * i);
      wk.push({ start: addDays_(e, -6), end: e, endFull: endOfDay_(e) });
    }
    const lo = wk[0].start, hi = wk[wk.length - 1].endFull;
    const mk = () => wk.map(() => ({ c: 0, b: 0 }));
    const acc = {}; ALL_REGIONS.forEach((r) => { acc[r] = mk(); });
    all.forEach((r) => {
      if (!regionSet.has(r.region) || !r.newSlaMatched || r.newSlaIsP5) return;
      const d = r.creationDateObj;
      if (!d || d < lo || d > hi) return;
      const st = r.newSlaEvalStatus;
      if (st !== "compliant" && st !== "breach" && st !== "breach_open") return;
      let wi = wk.findIndex((w) => d <= w.endFull);
      if (wi < 0) wi = wk.length - 1;
      [r.region, WEST].forEach((k) => { if (st === "compliant") acc[k][wi].c++; else acc[k][wi].b++; });
    });
    const series = {}, totals = {};
    ALL_REGIONS.forEach((r) => {
      series[r] = acc[r].map((x) => (x.c + x.b ? (x.c / (x.c + x.b)) * 100 : null));
      totals[r] = acc[r].map((x) => x.c + x.b);
    });
    return {
      weeks: wk, series, totals,
      labels: wk.map((w) => `${w.start.getDate()}/${w.start.getMonth() + 1}–${w.end.getDate()}/${w.end.getMonth() + 1}`),
      range: rangeLabel_(wk[0].start, wk[wk.length - 1].end, true),
    };
  }

  // ═════════════════════════ حساب بيانات التقرير ═════════════════════════
  // weekEnd: جمعة (Date) = نهاية أسبوع سبت→جمعة. manual: {region:{rating, rep1, rep2, rep3, tfmp:{pp,pd,cp,cd}}}
  function computeReportData(weekEnd, manual) {
    if (typeof window.__balaghNormalizeRows !== "function") {
      throw new Error("بيانات البلاغات غير محمّلة بعد — انتظر اكتمال التحميل ثم أعد المحاولة");
    }
    const all = window.__balaghNormalizeRows();
    const E = startOfDay_(weekEnd);
    const weeks = []; // الأقدم أولًا (4 أسابيع، آخرها الحالي)
    for (let i = 3; i >= 0; i--) {
      const s = addDays_(E, -6 - 7 * i), e = addDays_(E, -7 * i);
      weeks.push({ start: s, end: e, endFull: endOfDay_(e) });
    }
    const cur = weeks[3];
    const monthStart = new Date(E.getFullYear(), E.getMonth(), 1);
    const inRange = (r, s, e) => r.creationDateObj && r.creationDateObj >= s && r.creationDateObj <= e;
    const regionSet = new Set(REGION_ORDER);
    const rows4 = all.filter((r) => regionSet.has(r.region) && inRange(r, weeks[0].start, cur.endFull));
    const rowsMonth = all.filter((r) => regionSet.has(r.region) && inRange(r, monthStart, cur.endFull));

    const secAll = typeof window.getSecuritySafetyBalaghRows === "function" ? window.getSecuritySafetyBalaghRows() : [];
    const secWeek = secAll.filter((r) => regionSet.has(r.region) && inRange(r, cur.start, cur.endFull));
    const groupOf = (r) =>
      typeof window.securitySafetyCategoryGroup_ === "function" ? window.securitySafetyCategoryGroup_(r.subCategory) : "أخرى";
    const secSectorTotal = secWeek.length;

    const ppmAll = Array.isArray(window.RAW_NEW_PPM_MAXIMO) ? window.RAW_NEW_PPM_MAXIMO : [];

    const perRegion = {};
    // يبني بيانات منطقة (أو الغربية المجمّعة) من صفوفها
    const buildRegion = (region, rr, rmonth, sec, ppmRows, man) => {
      const wk = weeks.map((w) => rr.filter((r) => inRange(r, w.start, w.endFull)));
      const counts = wk.map((x) => x.length);
      const curRows = wk[3];
      const emergency = curRows.filter((r) => isEmergencyPriority_(r.priority)).length;
      const overdue = curRows.filter((r) => r.isOverdue).length;
      // الالتزام بمستوى الخدمة = NEW SLA: ملتزم ÷ (ملتزم + مخترق + مخترق مفتوح)؛ P5 وغير المطابق مستبعدان
      const nsc = curRows.filter((r) => r.newSlaMatched && !r.newSlaIsP5 && r.newSlaEvalStatus === "compliant").length;
      const nsb = curRows.filter((r) => r.newSlaMatched && !r.newSlaIsP5 && (r.newSlaEvalStatus === "breach" || r.newSlaEvalStatus === "breach_open")).length;
      const secGroups = SAFETY_GROUP_ORDER.map((g, i) => ({
        group: g, label: SAFETY_GROUP_LABEL[g] || g, order: i,
        count: sec.filter((r) => groupOf(r) === g).length,
      })).sort((a, b) => b.count - a.count || a.order - b.order);
      // أعلى 10 مدارس
      const bySchool = new Map();
      curRows.forEach((r) => {
        if (!bySchool.has(r.schoolKey)) {
          bySchool.set(r.schoolKey, { name: r.linkedSchoolName || r.schoolName || "—", minId: r.linkedMinId || r.schoolNumber || "—", count: 0, emergency: 0 });
        }
        const e = bySchool.get(r.schoolKey);
        e.count++;
        if (isEmergencyPriority_(r.priority)) e.emergency++;
      });
      const top = [...bySchool.values()].sort((a, b) => b.count - a.count).slice(0, 10);
      return {
        region, counts, cur: counts[3], prev: counts[2], first: counts[0], total4: counts.reduce((s, c) => s + c, 0),
        month: rmonth.length,
        emergency, routine: curRows.length - emergency,
        overdue, slaPct: nsc + nsb ? (nsc / (nsc + nsb)) * 100 : null, slaCompliant: nsc, slaBreach: nsb,
        consultant: curRows.filter(isConsultantApproval_).length,
        buildings: new Set(curRows.map((r) => r.schoolKey)).size,
        secTotal: sec.length, secGroups, top, ppmRows,
        manual: man,
      };
    };
    REGION_ORDER.forEach((region) => {
      perRegion[region] = buildRegion(
        region,
        rows4.filter((r) => r.region === region),
        rowsMonth.filter((r) => r.region === region),
        secWeek.filter((r) => r.region === region),
        ppmAll.filter((r) => norm_(r["المنطقة"]) === region),
        normalizeManual_(manual && manual[region])
      );
    });
    // المنطقة الغربية كاملة = تجميع الأربع مناطق
    perRegion[WEST] = buildRegion(
      WEST, rows4, rowsMonth, secWeek,
      pooledPpmRows_(ppmAll.filter((r) => regionSet.has(norm_(r["المنطقة"])))),
      pooledManual_(REGION_ORDER.map((r) => perRegion[r]))
    );
    // اتجاه الالتزام بـ NEW SLA: آخر 4 أسابيع (سبت→جمعة) تنتهي بنهاية أسبوع التقرير
    const slaTrend = computeSlaTrend_(all, E, regionSet);
    const sectorWeek = REGION_ORDER.reduce((s, r) => s + perRegion[r].cur, 0);
    // أقل رضا بين المناطق (من القيم اليدوية)
    let lowest = null;
    REGION_ORDER.forEach((r) => {
      const m = perRegion[r].manual;
      if (m && m.sat != null && (lowest === null || m.sat < perRegion[lowest].manual.sat)) lowest = r;
    });
    return {
      weekEnd: E, weeks, monthStart, perRegion, slaTrend, sectorWeek, secSectorTotal, lowestSatRegion: lowest,
      periodLabel: rangeLabel_(cur.start, cur.end, true),
      fourWeeksRange: rangeLabel_(weeks[0].start, cur.end, false),
      fourWeeksRangeY: rangeLabel_(weeks[0].start, cur.end, true),
      monthLabel: `${monthName_(E)} ${E.getFullYear()}`,
      monthName: monthName_(E),
      monthRange: `1 – ${E.getDate()} ${monthName_(E)} ${E.getFullYear()}`,
    };
  }

  // ═════════════════════════ أدوات XML ═════════════════════════
  function parseXml_(str) { return new DOMParser().parseFromString(str, "application/xml"); }
  function serializeXml_(doc) { return new XMLSerializer().serializeToString(doc); }
  function findShapeById_(doc, id) {
    const cNvPrs = doc.getElementsByTagName("p:cNvPr");
    for (let i = 0; i < cNvPrs.length; i++) {
      if (cNvPrs[i].getAttribute("id") === String(id)) {
        let node = cNvPrs[i].parentNode;
        while (node && node.nodeName !== "p:sp" && node.nodeName !== "p:graphicFrame") node = node.parentNode;
        return node;
      }
    }
    return null;
  }
  // أسطر: فقرة واحدة لكل عنصر (النص يوضع في أول a:t ويُفرَّغ الباقي)
  function setParagraphText_(pEl, text) {
    const ts = pEl.getElementsByTagName("a:t");
    if (!ts.length) return;
    ts[0].textContent = text;
    for (let i = 1; i < ts.length; i++) ts[i].textContent = "";
  }
  function setShapeLines_(doc, shapeId, lines) {
    const sp = findShapeById_(doc, shapeId);
    if (!sp) return;
    const ps = sp.getElementsByTagName("a:p");
    for (let i = 0; i < ps.length; i++) setParagraphText_(ps[i], i < lines.length ? String(lines[i]) : "");
  }
  // مقاطع (a:r) داخل الفقرة الأولى — لأشكال مثل «208  بلاغات طارئة (8.2%)» (رقم كبير + شرح بتنسيقين)
  function setShapeRuns_(doc, shapeId, runsTexts) {
    const sp = findShapeById_(doc, shapeId);
    if (!sp) return;
    const p = sp.getElementsByTagName("a:p")[0];
    if (!p) return;
    const runs = Array.from(p.childNodes).filter((n) => n.nodeName === "a:r");
    runs.forEach((r, i) => {
      const t = r.getElementsByTagName("a:t")[0];
      if (t) t.textContent = i < runsTexts.length ? String(runsTexts[i]) : "";
    });
  }
  // نص مفصول بـ<a:br/> داخل فقرة واحدة (عنوان شريحة الغلاف)
  function setShapeBrSegments_(doc, shapeId, lines) {
    const sp = findShapeById_(doc, shapeId);
    if (!sp) return;
    const p = sp.getElementsByTagName("a:p")[0];
    if (!p) return;
    const segments = [];
    let curSeg = [];
    Array.from(p.childNodes).filter((n) => n.nodeName === "a:r" || n.nodeName === "a:br").forEach((n) => {
      if (n.nodeName === "a:br") { segments.push(curSeg); curSeg = []; } else curSeg.push(n);
    });
    segments.push(curSeg);
    segments.forEach((seg, i) => {
      if (!seg.length) return;
      const text = i < lines.length ? String(lines[i]) : "";
      const t0 = seg[0].getElementsByTagName("a:t")[0];
      if (t0) t0.textContent = text;
      for (let j = 1; j < seg.length; j++) { const t = seg[j].getElementsByTagName("a:t")[0]; if (t) t.textContent = ""; }
    });
  }
  function setRunColor_(doc, shapeId, hex) {
    const sp = findShapeById_(doc, shapeId);
    if (!sp) return;
    Array.from(sp.getElementsByTagName("a:rPr")).forEach((rp) => {
      const c = rp.getElementsByTagName("a:srgbClr")[0];
      if (c) c.setAttribute("val", hex);
    });
  }
  function setShapeFill_(doc, shapeId, hex) {
    const sp = findShapeById_(doc, shapeId);
    if (!sp) return;
    const spPr = sp.getElementsByTagName("p:spPr")[0];
    const c = spPr && spPr.getElementsByTagName("a:srgbClr")[0];
    if (c) c.setAttribute("val", hex);
  }
  function xfrmOf_(sp) {
    const x = sp.getElementsByTagName("a:xfrm")[0];
    return { off: x.getElementsByTagName("a:off")[0], ext: x.getElementsByTagName("a:ext")[0] };
  }
  // شريط تقدّم: المقبض (fill) محاذٍ لحافة المسار (track) اليمنى (اتجاه عربي)
  function setBar_(doc, trackId, fillId, pct) {
    const tr = findShapeById_(doc, trackId), fl = findShapeById_(doc, fillId);
    if (!tr || !fl) return;
    const t = xfrmOf_(tr), f = xfrmOf_(fl);
    const tx = parseInt(t.off.getAttribute("x"), 10), tw = parseInt(t.ext.getAttribute("cx"), 10);
    const p = Math.max(0, Math.min(100, isFinite(pct) ? pct : 0));
    const w = Math.round((tw * p) / 100);
    f.ext.setAttribute("cx", String(w));
    f.off.setAttribute("x", String(tx + tw - w));
  }
  function removeShape_(doc, id) {
    const sp = findShapeById_(doc, id);
    if (sp && sp.parentNode) sp.parentNode.removeChild(sp);
  }
  function getTableInShape_(sp) { return sp ? sp.getElementsByTagName("a:tbl")[0] : null; }
  // اتجاه الفقرة داخل الخلية من اليمين لليسار (للنص العربي المختلط بأرقام مثل التواريخ)
  function setCellRtl_(tr, colIdx) {
    const tc = tr.getElementsByTagName("a:tc")[colIdx];
    const p = tc && tc.getElementsByTagName("a:p")[0];
    const pPr = p && p.getElementsByTagName("a:pPr")[0];
    if (pPr) pPr.setAttribute("rtl", "1");
  }
  function setCell_(tr, colIdx, text) {
    const tc = tr.getElementsByTagName("a:tc")[colIdx];
    if (!tc) return;
    const p = tc.getElementsByTagName("a:p")[0];
    if (p) setParagraphText_(p, String(text));
  }
  function setChartCategoriesValues_(chartDoc, seriesIdx, categories, values) {
    const ser = chartDoc.getElementsByTagName("c:ser")[seriesIdx];
    if (!ser) return;
    const cat = ser.getElementsByTagName("c:cat")[0], val = ser.getElementsByTagName("c:val")[0];
    if (cat && categories) {
      const pts = cat.getElementsByTagName("c:pt");
      for (let i = 0; i < pts.length && i < categories.length; i++) {
        const v = pts[i].getElementsByTagName("c:v")[0];
        if (v) v.textContent = String(categories[i]);
      }
    }
    if (val && values) {
      const pts = val.getElementsByTagName("c:pt");
      for (let i = 0; i < pts.length && i < values.length; i++) {
        const v = pts[i].getElementsByTagName("c:v")[0];
        if (v) v.textContent = String(values[i]);
      }
    }
  }
  function setChartAxisMax_(chartDoc, max) {
    const va = chartDoc.getElementsByTagName("c:valAx")[0];
    const mx = va && va.getElementsByTagName("c:max")[0];
    if (mx) mx.setAttribute("val", String(max));
  }

  async function resolveDeckSlidePaths_(zip) {
    const presDoc = parseXml_(await zip.file("ppt/presentation.xml").async("string"));
    const relsDoc = parseXml_(await zip.file("ppt/_rels/presentation.xml.rels").async("string"));
    const relMap = {};
    Array.from(relsDoc.getElementsByTagName("Relationship")).forEach((r) => { relMap[r.getAttribute("Id")] = r.getAttribute("Target"); });
    return Array.from(presDoc.getElementsByTagName("p:sldId")).map((s) => "ppt/" + relMap[s.getAttribute("r:id")]);
  }
  async function getRelTarget_(zip, partPath, typePart) {
    const parts = partPath.split("/");
    const fname = parts.pop();
    const relsFile = zip.file(parts.join("/") + "/_rels/" + fname + ".rels");
    if (!relsFile) return null;
    const relsDoc = parseXml_(await relsFile.async("string"));
    const rel = Array.from(relsDoc.getElementsByTagName("Relationship")).find((r) => (r.getAttribute("Type") || "").indexOf(typePart) !== -1);
    if (!rel) return null;
    const t = rel.getAttribute("Target");
    const base = parts.slice();
    t.split("/").forEach((seg) => { if (seg === "..") base.pop(); else if (seg !== ".") base.push(seg); });
    return base.join("/");
  }
  async function patchSlide_(zip, slidePath, fn) {
    const doc = parseXml_(await zip.file(slidePath).async("string"));
    await fn(doc);
    zip.file(slidePath, serializeXml_(doc));
  }
  // يحدّث بيانات التشارت + المصنف المضمّن (حتى لا تعود الأرقام القديمة عند «تحرير البيانات» في PowerPoint)
  async function patchChartPart_(zip, slidePath, values, maxAxis) {
    const chartPath = await getRelTarget_(zip, slidePath, "/chart");
    if (!chartPath || !zip.file(chartPath)) return;
    const cdoc = parseXml_(await zip.file(chartPath).async("string"));
    setChartCategoriesValues_(cdoc, 0, null, values);
    setChartAxisMax_(cdoc, maxAxis);
    zip.file(chartPath, serializeXml_(cdoc));
    const xlsxPath = await getRelTarget_(zip, chartPath, "/package");
    if (!xlsxPath || !zip.file(xlsxPath)) return;
    try {
      const inner = await JSZip.loadAsync(await zip.file(xlsxPath).async("uint8array"));
      const shPath = "xl/worksheets/sheet1.xml";
      let xml = await inner.file(shPath).async("string");
      values.forEach((v, i) => {
        const ref = "B" + (i + 2);
        xml = xml.replace(new RegExp(`(<c r="${ref}"[^>]*>\\s*<v>)[^<]*(</v>)`), `$1${v}$2`);
      });
      inner.file(shPath, xml);
      zip.file(xlsxPath, await inner.generateAsync({ type: "uint8array", compression: "DEFLATE" }));
    } catch (_) { /* التشارت نفسه تحدّث؛ المصنف المضمّن اختياري */ }
  }

  function loadScriptOnce_(src) {
    return new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = src; el.onload = () => resolve(); el.onerror = () => reject(new Error("load failed: " + src));
      document.head.appendChild(el);
    });
  }
  // تحميل القالب: (1) النسخة المضمّنة لو سبق تحميلها (2) fetch على http/https (3) report_template_data.js كـ<script> (يعمل من file://)
  async function loadTemplateZip_() {
    if (window.__BALAGH_REPORT_TEMPLATE_B64__) return JSZip.loadAsync(window.__BALAGH_REPORT_TEMPLATE_B64__, { base64: true });
    if (location.protocol !== "file:") {
      try {
        const r = await fetch(`${TEMPLATE_URL}?v=${TEMPLATE_VERSION}`);
        if (r.ok) return JSZip.loadAsync(await r.arrayBuffer());
      } catch (_) { /* نكمل على النسخة المضمّنة */ }
    }
    try { await loadScriptOnce_(`${TEMPLATE_DATA_JS}?v=${TEMPLATE_VERSION}`); } catch (_) { /* الرسالة بالأسفل */ }
    if (window.__BALAGH_REPORT_TEMPLATE_B64__) return JSZip.loadAsync(window.__BALAGH_REPORT_TEMPLATE_B64__, { base64: true });
    throw new Error("تعذّر تحميل قالب التقرير — تأكد أن report_template.pptx و report_template_data.js موجودان بجانب index.html");
  }

  // ═════════════════════════ تعبئة شرائح منطقة واحدة ═════════════════════════
  async function fillRegion_(zip, slides, regionIdx, data) {
    const region = ALL_REGIONS[regionIdx];
    const disp = region === WEST ? WEST_DISPLAY : region;
    const R = data.perRegion[region];
    const M = R.manual || { sat: 0, rating: 0, rep1: 0, rep2: 0, rep3: 0, tfmp: { pp: 0, pd: 0, cp: 0, cd: 0 } };
    const base = regionIdx * SLIDES_PER_REGION;
    const [sCover, sOver, sTrend, sQual, sPpm, sTop] = [0, 1, 2, 3, 4, 5].map((k) => slides[base + k]);
    const period = `الفترة: ${data.periodLabel}`;

    // ── الغلاف ──
    await patchSlide_(zip, sCover, (doc) => {
      setShapeBrSegments_(doc, 2, [`تقرير متابعة البلاغات – ${region === WEST ? WEST : "منطقة " + region}`, data.periodLabel]);
    });

    // ── 1) نظرة عامة ──
    await patchSlide_(zip, sOver, (doc) => {
      setShapeLines_(doc, 78, [`نظرة عامة على البلاغات – ${disp}`]);
      setShapeLines_(doc, 79, [period]);
      setShapeLines_(doc, 82, [fmtNum_(R.cur)]);
      setShapeLines_(doc, 83, ["البلاغات الأسبوعية", (region === WEST ? "إجمالي الأربع مناطق مجتمعة" : `${pct1_(R.cur, data.sectorWeek)}% من إجمالي القطاع`)]);
      setShapeLines_(doc, 86, [fmtNum_(R.month)]);
      setShapeLines_(doc, 87, ["التراكمي من بداية الشهر", "إجمالي البلاغات منذ بداية الشهر"]);
      setShapeLines_(doc, 90, [R.slaPct != null ? R.slaPct.toFixed(1) + "%" : "—"]);
      setShapeLines_(doc, 91, ["الالتزام بمستوى الخدمة SLA", "نسبة البلاغات الملتزمة (NEW SLA)"]);
      setShapeLines_(doc, 94, [M.sat != null ? M.sat.toFixed(1) + "%" : "—"]);
      setShapeLines_(doc, 95, ["نسبة رضا المستفيد", `متوسط التقييم ${M.rating != null ? Number(M.rating).toFixed(2) : "—"} / 5`]);
      const reopenedTotal = (M.rep1 || 0) + (M.rep2 || 0) + (M.rep3 || 0);
      setShapeRuns_(doc, 97, [fmtNum_(R.emergency) + "  ", `بلاغات طارئة (${pct1_(R.emergency, R.cur)}%)`]);
      setShapeRuns_(doc, 99, [fmtNum_(reopenedTotal) + "  ", `بلاغات أُعيد فتحها (${pct1_(reopenedTotal, R.cur)}%)`]);
      setShapeRuns_(doc, 101, [fmtNum_(R.consultant) + "  ", `قيد موافقة الاستشاري (${pct1_(R.consultant, R.cur)}%)`]);
      setShapeRuns_(doc, 103, [fmtNum_(R.buildings) + "  ", "عدد المباني التعليمية"]);
      setShapeRuns_(doc, 104, [
        "بلاغات الأمن والسلامة",
        `     ${fmtNum_(R.secTotal)} بلاغ  ·  ${pct1_(R.secTotal, data.secSectorTotal)}% من بلاغات الأمن والسلامة في القطاع`,
      ]);
      const cardIds = [[106, 107, 108, 109, 110], [112, 113, 114, 115, 116], [118, 119, 120, 121, 122], [124, 125, 126, 127, 128]];
      R.secGroups.forEach((g, i) => {
        const [vId, lId, tId, fId, pId] = cardIds[i];
        const p = R.secTotal ? (g.count / R.secTotal) * 100 : 0;
        setShapeLines_(doc, vId, [fmtNum_(g.count)]);
        setShapeLines_(doc, lId, [g.label]);
        setBar_(doc, tId, fId, p);
        setShapeLines_(doc, pId, [`${p.toFixed(1)}% من بلاغات الأمن والسلامة بالمنطقة`]);
      });
    });

    // ── 2) اتجاه البلاغات والأولوية ──
    await patchSlide_(zip, sTrend, (doc) => {
      setShapeLines_(doc, 78, [`اتجاه البلاغات والأولوية – ${disp}`]);
      setShapeLines_(doc, 79, [`آخر 4 أسابيع: ${data.fourWeeksRangeY}`]);
      setShapeRuns_(doc, 82, ["عدد البلاغات أسبوعياً", `   ${data.fourWeeksRange}`]);
      // أولوية الأسبوع الحالي: قطعتان في شريط واحد (روتيني + طارئ)
      const tot = R.cur;
      const tr = findShapeById_(doc, 87), em = findShapeById_(doc, 88);
      if (tr && em) {
        const tx = xfrmOf_(tr), ex = xfrmOf_(em);
        const emOffX = parseInt(ex.off.getAttribute("x"), 10);
        const T = parseInt(tx.ext.getAttribute("cx"), 10) + parseInt(ex.ext.getAttribute("cx"), 10);
        const emW = tot ? Math.round((T * R.emergency) / tot) : 0;
        ex.ext.setAttribute("cx", String(emW));
        tx.ext.setAttribute("cx", String(T - emW));
        tx.off.setAttribute("x", String(emOffX + emW));
      }
      setShapeRuns_(doc, 89, [fmtNum_(R.routine), `  روتيني (${pct1_(R.routine, R.cur)}%)`]);
      setShapeRuns_(doc, 90, [fmtNum_(R.emergency), `  طارئ (${pct1_(R.emergency, R.cur)}%)`]);
      const dPrev = signedPct_(R.cur, R.prev), dFirst = signedPct_(R.cur, R.first);
      setShapeLines_(doc, 93, [dPrev == null ? "—" : dPrev]);
      setRunColor_(doc, 93, dPrev != null && dPrev.charAt(0) === "-" ? C_DOWN : C_UP);
      setShapeLines_(doc, 94, ["التغير عن الأسبوع السابق", `${fmtNum_(R.cur)} مقابل ${fmtNum_(R.prev)} بلاغ`]);
      setShapeLines_(doc, 97, [dFirst == null ? "—" : dFirst]);
      setRunColor_(doc, 97, dFirst != null && dFirst.charAt(0) === "-" ? C_DOWN : C_UP);
      setShapeLines_(doc, 98, ["التغير عن الأسبوع الأول", `${fmtNum_(R.cur)} مقابل ${fmtNum_(R.first)} بلاغ`]);
      setShapeLines_(doc, 101, [fmtNum_(R.total4)]);
      setShapeLines_(doc, 102, ["إجمالي آخر 4 أسابيع", data.fourWeeksRange]);
    });
    await patchChartPart_(zip, sTrend, R.counts, Math.max(10, Math.round(Math.max.apply(null, R.counts) * 1.25)));

    // ── 3) جودة الخدمة وزيارات الاستشاري ──
    await patchSlide_(zip, sQual, (doc) => {
      const reopenedTotal = (M.rep1 || 0) + (M.rep2 || 0) + (M.rep3 || 0);
      const p1 = reopenedTotal ? (M.rep1 / reopenedTotal) * 100 : 0;
      const p2 = reopenedTotal ? (M.rep2 / reopenedTotal) * 100 : 0;
      const p3 = reopenedTotal ? ((M.rep3 || 0) / reopenedTotal) * 100 : 0;
      setShapeLines_(doc, 78, [`جودة الخدمة وزيارات الاستشاري – ${disp}`]);
      setShapeLines_(doc, 79, [period]);
      setShapeLines_(doc, 83, [fmtNum_(reopenedTotal)]);
      setShapeLines_(doc, 84, ["بلاغ أُعيد فتحه", `${pct1_(reopenedTotal, R.cur)}% من بلاغات المنطقة`]);
      setShapeLines_(doc, 86, [`${fmtNum_(M.rep1)}  (${Math.round(p1)}%)`]);
      setBar_(doc, 87, 88, p1);
      setShapeLines_(doc, 90, [`${fmtNum_(M.rep2)}  (${Math.round(p2)}%)`]);
      setBar_(doc, 91, 92, p2);
      setShapeLines_(doc, 116, [`${fmtNum_(M.rep3 || 0)}  (${Math.round(p3)}%)`]);
      setBar_(doc, 117, 118, p3);
      // الرضا: الأقل بين المناطق بلون برتقالي + شارة، وغيره أخضر/كحلي
      const isLow = data.lowestSatRegion === region;
      setShapeLines_(doc, 96, [M.sat != null ? M.sat.toFixed(1) + "%" : "—"]);
      setRunColor_(doc, 96, isLow ? C_ORANGE_TXT : C_NAVY);
      setBar_(doc, 98, 99, M.sat || 0);
      setShapeFill_(doc, 99, isLow ? C_ORANGE_BAR : C_GREEN_BAR);
      setShapeRuns_(doc, 101, [M.rating != null ? Number(M.rating).toFixed(2) : "—", "  من 5"]);
      if (!isLow) { removeShape_(doc, 103); removeShape_(doc, 104); }
      // TFMP
      setShapeRuns_(doc, 107, ["الزيارات الميدانية للاستشاري على نظام TFMP", `   الزيارات التفتيشية – ${data.monthLabel}`]);
      const T = M.tfmp || { pp: 0, pd: 0, cp: 0, cd: 0 };
      const pctPrev = T.pp ? (T.pd / T.pp) * 100 : 0, pctCur = T.cp ? (T.cd / T.cp) * 100 : 0;
      const tbl = getTableInShape_(findShapeById_(doc, 108));
      if (tbl) {
        const trs = tbl.getElementsByTagName("a:tr");
        [[trs[1], T.pp, T.pd, pctPrev, "الأسبوع السابق"], [trs[2], T.cp, T.cd, pctCur, "الأسبوع الحالي"]].forEach(([tr, planned, done, pct, label]) => {
          if (!tr) return;
          setCell_(tr, 0, pct.toFixed(1) + "%");
          setCell_(tr, 1, fmtNum_(Math.max(planned - done, 0)));
          setCell_(tr, 2, fmtNum_(done));
          setCell_(tr, 3, fmtNum_(planned));
          setCell_(tr, 4, label);
        });
      }
      const ok = pctCur >= 100;
      setShapeLines_(doc, 110, ["نسبة إنجاز الأسبوع الحالي"]);
      setShapeLines_(doc, 111, [pctCur.toFixed(1) + "%"]);
      setRunColor_(doc, 111, ok ? C_NAVY : C_ORANGE_TXT);
      setBar_(doc, 112, 113, pctCur);
      setShapeFill_(doc, 113, ok ? C_GREEN_BAR : C_ORANGE_BAR);
      const diff = pctCur - pctPrev;
      setShapeLines_(doc, 114, [
        Math.abs(diff) < 0.05 ? "دون تغيير عن الأسبوع السابق" : `${diff > 0 ? "ارتفاع" : "انخفاض"} ${Math.abs(diff).toFixed(1)} نقطة عن الأسبوع السابق`,
      ]);
    });

    // ── 4) الصيانة الوقائية (PPM Maximo) ──
    await patchSlide_(zip, sPpm, (doc) => {
      setShapeLines_(doc, 78, [`خطة الصيانة الوقائية لمقدم الخدمة – ${data.monthName} – ${disp}`]);
      setShapeLines_(doc, 79, [`تقرير متابعة أعمال الصيانة الوقائية  ·  الفترة: ${data.monthRange}`]);
      const tbl = getTableInShape_(findShapeById_(doc, 80));
      if (!tbl) return;
      const trs = Array.from(tbl.getElementsByTagName("a:tr"));
      const totalRow = trs[trs.length - 1];
      const dataTemplates = [trs[1], trs[2] || trs[1]];
      trs.slice(1, trs.length - 1).forEach((r) => r.parentNode.removeChild(r));
      const list = R.ppmRows.slice(0, 12);
      const n = Math.max(list.length, 1);
      let sumTC = 0, sumAC = 0, sumTT = 0;
      const pctTxt = (v) => (v == null ? "" : v.toFixed(1) + "%");
      for (let i = 0; i < n; i++) {
        const row = dataTemplates[i % 2].cloneNode(true);
        const r = list[i];
        if (r) {
          const tc = plainNum_(r["المستهدف التراكمي"]), ac = plainNum_(r["المحقق التراكمي"]), tt = plainNum_(r["اجمالي المستهدف"]);
          sumTC += tc || 0; sumAC += ac || 0; sumTT += tt || 0;
          setCell_(row, 0, pctTxt(r.__pooled ? r.__pTotal : pctNum_(r["نسبة الإنجاز الكلي"])));
          setCell_(row, 1, tt == null ? "" : fmtNum_(tt));
          setCell_(row, 2, pctTxt(r.__pooled ? r.__pCum : pctNum_(r["نسبة الإنجاز التراكمي"])));
          setCell_(row, 3, ac == null ? "" : fmtNum_(ac));
          setCell_(row, 4, tc == null ? "" : fmtNum_(tc));
          setCell_(row, 5, ppmDate_(r["تاريخ البداية"]));
          setCellRtl_(row, 5);
          setCell_(row, 6, norm_(r["اسم المهمة"]));
        } else {
          [0, 1, 2, 3, 4, 5].forEach((c) => setCell_(row, c, ""));
          setCell_(row, 6, "لا توجد بيانات صيانة وقائية لهذه المنطقة");
        }
        tbl.insertBefore(row, totalRow);
      }
      if (list.length) {
        setCell_(totalRow, 0, pctTxt(sumTT ? (sumAC / sumTT) * 100 : null) || "");
        setCell_(totalRow, 1, fmtNum_(sumTT));
        setCell_(totalRow, 2, pctTxt(sumTC ? (sumAC / sumTC) * 100 : null) || "");
        setCell_(totalRow, 3, fmtNum_(sumAC));
        setCell_(totalRow, 4, fmtNum_(sumTC));
        setCell_(totalRow, 5, "");
      }
      // ارتفاع إطار الجدول = مجموع صفوف الجدول الفعلي
      const sp = findShapeById_(doc, 80);
      const fx = sp && sp.getElementsByTagName("p:xfrm")[0];
      const ext = fx && fx.getElementsByTagName("a:ext")[0];
      if (ext) {
        const h = Array.from(tbl.getElementsByTagName("a:tr")).reduce((s, r) => s + (parseInt(r.getAttribute("h"), 10) || 0), 0);
        ext.setAttribute("cy", String(h));
      }
    });

    // ── 5) أعلى 10 مدارس ──
    await patchSlide_(zip, sTop, (doc) => {
      setShapeLines_(doc, 78, [`أعلى 10 مدارس رفعت بلاغات – ${disp}`]);
      setShapeLines_(doc, 79, [period]);
      const tbl = getTableInShape_(findShapeById_(doc, 80));
      if (!tbl) return;
      const trs = tbl.getElementsByTagName("a:tr");
      for (let i = 0; i < 10; i++) {
        const tr = trs[i + 1];
        if (!tr) continue;
        const s = R.top[i];
        if (s) {
          setCell_(tr, 0, cntPct_(s.emergency, s.count));
          setCell_(tr, 1, cntPct_(s.count, R.cur));
          setCell_(tr, 2, s.name);
          setCell_(tr, 3, s.minId);
        } else {
          setCell_(tr, 0, "0"); setCell_(tr, 1, "0"); setCell_(tr, 2, "—"); setCell_(tr, 3, "—");
        }
        setCell_(tr, 4, String(i + 1));
      }
    });
  }

  // ═════════════════════════ شريحة SLA compliance ═════════════════════════
  const SLA_SERIES_ORDER = [WEST].concat(REGION_ORDER); // نفس ترتيب السلاسل في القالب
  const C_NS = "http://schemas.openxmlformats.org/drawingml/2006/chart";
  const A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main";
  function setParaColor_(doc, shapeId, paraIdx, hex) {
    const sp = findShapeById_(doc, shapeId);
    const p = sp && sp.getElementsByTagName("a:p")[paraIdx];
    if (!p) return;
    Array.from(p.getElementsByTagName("a:rPr")).forEach((rp) => {
      const c = rp.getElementsByTagName("a:srgbClr")[0];
      if (c) c.setAttribute("val", hex);
    });
  }
  // مواضع تسميات كل السلاسل: نموذج هندسي بسيط (صناديق بالنقاط) يختار لكل تسمية (فوق/تحت/يمين/يسار) أول موضع لا يصطدم بتسمية أخرى أو بنقطة
  function slaLabelPositions_(trend, rng) {
    const pos = {};
    const ppu = 245 / Math.max(1, rng.max - rng.min); // نقاط (pt) لكل وحدة % على المحور الرأسي
    const nW = trend.labels.length;
    const dims = (r) => (r === WEST ? { w: 60, h: 25, rad: 8 } : { w: 50, h: 21, rad: 5 });
    const overlap = (a, b) => a.x1 < b.x2 - 1 && b.x1 < a.x2 - 1 && a.y1 < b.y2 - 1 && b.y1 < a.y2 - 1;
    for (let w = 0; w < nW; w++) {
      const items = SLA_SERIES_ORDER.map((r) => ({ r, y: trend.series[r][w] })).filter((x) => x.y != null).map((x) => ({ r: x.r, y: x.y * ppu }));
      // نقاط (علامات) كل السلاسل كصناديق ثابتة
      const marks = items.map((it) => { const d = dims(it.r); return { x1: -d.rad, x2: d.rad, y1: it.y - d.rad, y2: it.y + d.rad }; });
      // مقاطع الخطوط (عينات صناديق صغيرة على امتداد الخط في الاتجاهين) حتى لا تقع التسمية فوق خط آخر
      const COLW = 205;
      const lineBoxes = [];
      items.forEach((it) => {
        const hw = it.r === WEST ? 5 : 2.2;
        [-1, 1].forEach((dir) => {
          const nv = trend.series[it.r][w + dir];
          if (nv == null) return;
          const sl = (nv * ppu - it.y) / COLW; // نقاط رأسية لكل نقطة أفقية
          for (let xo = 8; xo <= 90; xo += 7) { const x = dir * xo, y = it.y + sl * xo; lineBoxes.push({ r: it.r, x1: x - 4, x2: x + 4, y1: y - hw, y2: y + hw }); }
        });
      });
      const placed = [];
      // الأولوية: الغربية أولًا ثم الباقي من الأعلى للأسفل
      const order = items.slice().sort((a, b) => (a.r === WEST ? -1 : b.r === WEST ? 1 : b.y - a.y));
      order.forEach((it) => {
        const d = dims(it.r), g = 1.5;
        const cand = {
          t: { x1: -d.w / 2, x2: d.w / 2, y1: it.y + d.rad + g, y2: it.y + d.rad + g + d.h },
          b: { x1: -d.w / 2, x2: d.w / 2, y1: it.y - d.rad - g - d.h, y2: it.y - d.rad - g },
          r: { x1: d.rad + g, x2: d.rad + g + d.w, y1: it.y - d.h / 2, y2: it.y + d.h / 2 },
          l: { x1: -d.rad - g - d.w, x2: -d.rad - g, y1: it.y - d.h / 2, y2: it.y + d.h / 2 },
        };
        const prefs = it.r === WEST ? ["t", "b", "r", "l"] : ["t", "b", w === 0 ? "l" : "r", w === 0 ? "r" : "l"];
        let best = null, bestCost = Infinity;
        prefs.forEach((k, pi) => {
          const bx = cand[k];
          let cost = pi * 0.01;
          placed.forEach((pb) => { if (overlap(bx, pb)) cost += 10; });
          marks.forEach((mk) => { if (overlap(bx, mk)) cost += 6; });
          lineBoxes.forEach((lb) => { if (lb.r !== it.r && overlap(bx, lb)) cost += 0.6; });
          if (cost < bestCost) { bestCost = cost; best = k; }
        });
        placed.push(cand[best]);
        (pos[it.r] = pos[it.r] || [])[w] = best;
      });
    }
    return pos;
  }
  function slaAxisRange_(trend) {
    const all = [];
    SLA_SERIES_ORDER.forEach((r) => trend.series[r].forEach((v) => { if (v != null) all.push(v); }));
    const mn = all.length ? Math.min.apply(null, all) : 50;
    const mx = all.length ? Math.max.apply(null, all) : 90;
    const lo = Math.max(0, Math.min(70, Math.floor((mn - 4) / 10) * 10));
    const hi = Math.min(100, Math.max(lo + 30, Math.ceil((mx + 4) / 5) * 5));
    return { min: lo, max: hi };
  }
  function xmlEsc_(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  async function patchSlaChart_(zip, slidePath, trend) {
    const chartPath = await getRelTarget_(zip, slidePath, "/chart");
    if (!chartPath || !zip.file(chartPath)) throw new Error("قالب التقرير لا يحوي رسم SLA — أعد رفع report_template.pptx الجديد");
    const cdoc = parseXml_(await zip.file(chartPath).async("string"));
    const sers = Array.from(cdoc.getElementsByTagName("c:ser"));
    const rng = slaAxisRange_(trend);
    const nW = trend.labels.length;
    const mkEl = (name, attrs) => { const e = cdoc.createElementNS(C_NS, "c:" + name); Object.keys(attrs || {}).forEach((k) => e.setAttribute(k, attrs[k])); return e; };
    const setCache = (cacheEl, vals, isNum) => {
      Array.from(cacheEl.getElementsByTagName("c:pt")).forEach((pt) => pt.parentNode.removeChild(pt));
      const cnt = cacheEl.getElementsByTagName("c:ptCount")[0];
      if (cnt) cnt.setAttribute("val", String(nW));
      vals.forEach((v, i) => {
        if (v == null) return;
        const pt = mkEl("pt", { idx: String(i) }), ve = mkEl("v");
        ve.textContent = isNum ? String(Math.round(v * 10) / 10) : String(v);
        pt.appendChild(ve); cacheEl.appendChild(pt);
      });
    };
    const posBy = slaLabelPositions_(trend, rng);
    const lblTmpl = sers[0] && sers[0].getElementsByTagName("c:dLbls")[0] ? sers[0].getElementsByTagName("c:dLbls")[0].cloneNode(true) : null;
    SLA_SERIES_ORDER.forEach((region, k) => {
      const ser = sers[k];
      if (!ser) return;
      const vals = trend.series[region];
      setCache(ser.getElementsByTagName("c:cat")[0].getElementsByTagName("c:strCache")[0], trend.labels, false);
      setCache(ser.getElementsByTagName("c:val")[0].getElementsByTagName("c:numCache")[0], vals, true);
      let dl = ser.getElementsByTagName("c:dLbls")[0];
      if (!dl && lblTmpl) {
        dl = lblTmpl.cloneNode(true);
        const lineEl = ser.getElementsByTagName("a:ln")[0];
        const lc = lineEl && lineEl.getElementsByTagName("a:srgbClr")[0];
        const tx = dl.getElementsByTagName("c:txPr")[0];
        const dr = tx && tx.getElementsByTagName("a:defRPr")[0];
        if (dr) {
          dr.setAttribute("sz", "1500");
          const cc = dr.getElementsByTagName("a:srgbClr")[0];
          if (cc && lc) cc.setAttribute("val", lc.getAttribute("val"));
        }
        ser.insertBefore(dl, ser.getElementsByTagName("c:cat")[0]);
      }
      if (!dl) return;
      if (region === WEST) { const wd = dl.getElementsByTagName("a:defRPr")[0]; if (wd) wd.setAttribute("sz", "1800"); }
      Array.from(dl.getElementsByTagName("c:dLbl")).forEach((d) => d.parentNode.removeChild(d));
      const keep = ["c:numFmt", "c:spPr", "c:txPr"].map((n) => Array.from(dl.childNodes).find((c) => c.nodeName === n)).filter(Boolean);
      const frag = [];
      for (let w = 0; w < nW; w++) {
        if (vals[w] == null) continue;
        const d = mkEl("dLbl");
        d.appendChild(mkEl("idx", { val: String(w) }));
        keep.forEach((n) => d.appendChild(n.cloneNode(true)));
        d.appendChild(mkEl("dLblPos", { val: (posBy[region] && posBy[region][w]) || "t" }));
        ["showLegendKey:0", "showVal:1", "showCatName:0", "showSerName:0", "showPercent:0", "showBubbleSize:0"].forEach((kv) => { const [a, b] = kv.split(":"); d.appendChild(mkEl(a, { val: b })); });
        frag.push(d);
      }
      frag.reverse().forEach((d) => dl.insertBefore(d, dl.firstChild));
    });
    Array.from(cdoc.getElementsByTagName("c:dTable")).forEach((t) => t.parentNode.removeChild(t));
    const chartEl = cdoc.getElementsByTagName("c:chart")[0];
    if (chartEl && !chartEl.getElementsByTagName("c:legend")[0]) {
      const lg = mkEl("legend");
      lg.appendChild(mkEl("legendPos", { val: "b" }));
      lg.appendChild(mkEl("overlay", { val: "0" }));
      const tx = parseXml_('<c:txPr xmlns:c="' + C_NS + '" xmlns:a="' + A_NS + '"><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1300" b="1"><a:solidFill><a:srgbClr val="1A3358"/></a:solidFill><a:latin typeface="Tajawal"/></a:defRPr></a:pPr><a:endParaRPr lang="en-US"/></a:p></c:txPr>').documentElement;
      lg.appendChild(cdoc.importNode(tx, true));
      const pa = cdoc.getElementsByTagName("c:plotArea")[0];
      pa.parentNode.insertBefore(lg, pa.nextSibling);
    }
    const va = cdoc.getElementsByTagName("c:valAx")[0];
    if (va) {
      const sc = va.getElementsByTagName("c:scaling")[0];
      const mn = sc && sc.getElementsByTagName("c:min")[0], mx = sc && sc.getElementsByTagName("c:max")[0];
      if (mn) mn.setAttribute("val", String(rng.min));
      if (mx) mx.setAttribute("val", String(rng.max));
    }
    zip.file(chartPath, serializeXml_(cdoc));
    // المصنف المضمّن (عند «تحرير البيانات» في PowerPoint)
    const xlsxPath = await getRelTarget_(zip, chartPath, "/package");
    if (!xlsxPath || !zip.file(xlsxPath)) return;
    try {
      const inner = await JSZip.loadAsync(await zip.file(xlsxPath).async("uint8array"));
      const shPath = "xl/worksheets/sheet1.xml";
      let xml = await inner.file(shPath).async("string");
      const col = (i) => String.fromCharCode(66 + i);
      const str = (ref, t) => `<c r="${ref}" t="inlineStr"><is><t>${xmlEsc_(t)}</t></is></c>`;
      let rows = `<row r="1">${SLA_SERIES_ORDER.map((r, i) => str(col(i) + "1", r)).join("")}</row>`;
      for (let w = 0; w < nW; w++) {
        rows += `<row r="${w + 2}">${str("A" + (w + 2), trend.labels[w])}` + SLA_SERIES_ORDER.map((r, i) => {
          const v = trend.series[r][w];
          return v == null ? "" : `<c r="${col(i)}${w + 2}"><v>${Math.round(v * 10) / 10}</v></c>`;
        }).join("") + "</row>";
      }
      xml = xml.replace(/<sheetData\s*\/>|<sheetData>[\s\S]*<\/sheetData>/, `<sheetData>${rows}</sheetData>`);
      xml = xml.replace(/<dimension ref="[^"]*"\s*\/>/, `<dimension ref="A1:F${nW + 1}"/>`);
      inner.file(shPath, xml);
      zip.file(xlsxPath, await inner.generateAsync({ type: "uint8array", compression: "DEFLATE" }));
    } catch (_) { /* الرسم نفسه تحدّث؛ المصنف المضمّن اختياري */ }
  }
  async function fillSlaSlide_(zip, slidePath, data) {
    const T = data.slaTrend, last = T.labels.length - 1;
    await patchSlide_(zip, slidePath, (doc) => {
      setShapeLines_(doc, 79, [`آخر ${SLA_WEEKS} أسابيع: ${T.range}`]);
      setShapeRuns_(doc, 82, ["نسبة الالتزام الأسبوعية بمستوى الخدمة (NEW SLA)"]);
      SLA_SERIES_ORDER.forEach((r, k) => {
        const id = 111 + 2 * k, v = T.series[r][last];
        let prev = null;
        for (let i = last - 1; i >= 0 && prev == null; i--) prev = T.series[r][i];
        let delta = "—", up = null;
        if (v != null && prev != null) {
          const d = v - prev;
          up = d >= 0;
          delta = Math.abs(d) < 0.05 ? "دون تغيير" : `${d > 0 ? "▲" : "▼"} ${Math.abs(d).toFixed(1)} نقطة`;
        }
        setShapeLines_(doc, id, [r === WEST ? WEST_DISPLAY : r, v == null ? "—" : v.toFixed(1) + "%", delta]);
        if (up != null) {
          const onRed = r === WEST;
          setParaColor_(doc, id, 2, up ? (onRed ? "D6F5E0" : "2E8B57") : (onRed ? "FFD9D2" : "C0392B"));
        }
      });
    });
    await patchSlaChart_(zip, slidePath, T);
  }

  async function buildReportZip_(data) {
    const zip = await loadTemplateZip_();
    const slides = await resolveDeckSlidePaths_(zip);
    if (slides.length < EXPECTED_SLIDES) {
      throw new Error("قالب التقرير غير مطابق (عدد الشرائح أقل من المتوقع) — أعد رفع report_template.pptx الجديد");
    }
    for (let i = 0; i < ALL_REGIONS.length; i++) await fillRegion_(zip, slides, i, data);
    await fillSlaSlide_(zip, slides[SLA_SLIDE_INDEX], data);
    return zip;
  }

  async function downloadReportPptx_(zip, data) {
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `تقرير_متابعة_البلاغات_الأسبوعي_${iso_(data.weekEnd)}.pptx`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  // مدخلات يدوية → شكل ثابت. manual[region] = {rating, rep1, rep2, rep3, tfmp:{pp,pd,cp,cd}}
  window.generateBalaghReportPptx = async function generateBalaghReportPptx(weekEnd, manual) {
    if (typeof JSZip === "undefined") throw new Error("مكتبة JSZip لم تُحمَّل بعد — تأكد من اتصال الإنترنت وأعد المحاولة");
    const data = computeReportData(weekEnd || defaultWeekEnd_(), manual);
    const zip = await buildReportZip_(data);
    await downloadReportPptx_(zip, data);
    return data;
  };
  window.__balaghReportComputeData_ = computeReportData; // للاختبار
  window.__balaghReportBuildZip_ = async function (weekEnd, manual) { const d = computeReportData(weekEnd, manual); return { zip: await buildReportZip_(d), data: d }; }; // للاختبار

  // ═════════════════════════ نافذة التنزيل ═════════════════════════
  function parseUserNumber_(raw) {
    let t = String(raw == null ? "" : raw).trim();
    if (!t) return null;
    t = t.replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
      .replace(/[٫,]/g, ".").replace(/[%٪\s]/g, "");
    if (!/^\d+(\.\d+)?$/.test(t)) return null;
    return Number(t);
  }
  // ── استيراد جدول «المعاد فتحها + تقييم الاستبيان» من Excel ──
  // الأعمدة (بالترتيب أو بأي ترتيب، تُعرف بعناوينها): المنطقة | المعاد فتحها (إجمالي) | Time 1 | Time 2-3 | Time 4-8 | الاستبيان - متوسط تقييم الحالة
  // الخلايا قد تكون «67 (87%)» فيُؤخذ العدد قبل القوس. صف «الإجمالي» (أو أي اسم لا يطابق منطقة) يُتجاهل.
  function normAr_(t) {
    return String(t == null ? "" : t).trim().replace(/[\u064B-\u0652\u0640]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/\s+/g, " ");
  }
  function cellNum_(v) {
    if (v == null || v === "") return null;
    if (typeof v === "number") return isFinite(v) ? v : null;
    const t = String(v).replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660)).replace(/[٫,]/g, ".");
    const m = t.match(/\d+(?:\.\d+)?/);
    return m ? Number(m[0]) : null;
  }
  function parseReopenedAoa_(aoa) {
    const res = { values: {}, warnings: [], regionsFound: [] };
    let hi = -1, cols = null;
    for (let i = 0; i < Math.min(aoa.length, 15) && hi < 0; i++) {
      const row = (aoa[i] || []).map(normAr_);
      const c = { region: -1, total: -1, t1: -1, t2: -1, t3: -1, rating: -1 };
      row.forEach((h, j) => {
        const lh = h.toLowerCase();
        if (/^المنطقه/.test(h)) c.region = j;
        else if (/time\s*1\b|تكرار\s*1\b/.test(lh) && !/time\s*1\d/.test(lh)) c.t1 = j;
        else if (/time\s*2|تكرار\s*2/.test(lh)) c.t2 = j;
        else if (/time\s*4|تكرار\s*4/.test(lh)) c.t3 = j;
        else if (/تقييم|الاستبيان/.test(h)) c.rating = j;
        else if (/المعاد/.test(h)) c.total = j;
      });
      if (c.region >= 0 && (c.t1 >= 0 || c.rating >= 0)) { hi = i; cols = c; }
    }
    if (hi < 0) { res.warnings.push("لم أجد صف العناوين (المنطقة / Time 1 / Time 2-3 / Time 4-8 / الاستبيان)."); return res; }
    const regionNorm = REGION_ORDER.map((r) => ({ r, n: normAr_(r) }));
    for (let i = hi + 1; i < aoa.length; i++) {
      const row = aoa[i] || [];
      const name = normAr_(row[cols.region]);
      if (!name) continue;
      const hit = regionNorm.find((x) => x.n === name) || regionNorm.find((x) => name.indexOf(x.n) >= 0) || (name.length >= 3 ? regionNorm.find((x) => x.n.indexOf(name) === 0) : null);
      if (!hit) continue; // الإجمالي أو غيره
      const v = {};
      if (cols.t1 >= 0) v.rep1 = cellNum_(row[cols.t1]);
      if (cols.t2 >= 0) v.rep2 = cellNum_(row[cols.t2]);
      if (cols.t3 >= 0) v.rep3 = cellNum_(row[cols.t3]);
      if (cols.rating >= 0) v.rating = cellNum_(row[cols.rating]);
      if (v.rep3 == null && cols.t3 < 0) v.rep3 = 0;
      const tot = cols.total >= 0 ? cellNum_(row[cols.total]) : null;
      if (tot != null && v.rep1 != null && v.rep2 != null && tot !== v.rep1 + v.rep2 + (v.rep3 || 0)) {
        res.warnings.push(`${hit.r}: إجمالي المعاد فتحها في الملف (${tot}) لا يساوي مجموع Time 1 + 2-3 + 4-8 (${v.rep1 + v.rep2 + (v.rep3 || 0)}) — راجع الأرقام.`);
      }
      if (v.rating != null && v.rating > 5) res.warnings.push(`${hit.r}: التقييم أكبر من 5 — تم تجاهله.`), (v.rating = null);
      res.values[hit.r] = v; res.regionsFound.push(hit.r);
    }
    REGION_ORDER.forEach((r) => { if (res.regionsFound.indexOf(r) < 0) res.warnings.push(`لم أجد صف منطقة ${r} في الملف.`); });
    return res;
  }
  async function readSheetFile_(file) {
    if (typeof XLSX === "undefined") throw new Error("مكتبة قراءة Excel لم تُحمَّل بعد — تأكد من الاتصال وأعد المحاولة");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
  }
  window.__balaghReportParseReopened_ = parseReopenedAoa_; // للاختبار

  // ── لصق زيارات TFMP (أسبوع واحد) كما تصل: صف عنوان «المكتمل / المخطط / نسبة الإنجاز» ثم صف لكل منطقة ──
  // يتحمّل الأسطر والتبويبات الزائدة (الخلايا متعددة الأسطر)، ويتجاهل اسم الأسبوع وعمود «المدينة» في العنوان (لا أرقام بعده).
  // ترتيب العددين يُؤخذ من العنوان، ويُتحقق منه بنسبة الإنجاز (لو لا تطابق يُعكس تلقائيًا).
  const TFMP_ALIASES = [
    { r: "جدة", re: "جده" }, { r: "مكة المكرمة", re: "مكه(?: المكرمه)?" },
    { r: "المدينة المنورة", re: "المدينه(?: المنوره)?" }, { r: "الطائف", re: "الطائف|الطايف" },
  ];
  function parseTfmpPaste_(text) {
    const res = { values: {}, found: [], warnings: [] };
    const t = normAr_(String(text || "").replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660)).replace(/[٫]/g, "."));
    if (!t) { res.warnings.push("المربع فارغ."); return res; }
    const iDone = t.indexOf("المكتمل"), iPlan = t.indexOf("المخطط");
    const firstIsDone = iDone >= 0 && iPlan >= 0 ? iDone < iPlan : true;
    const rx = new RegExp(TFMP_ALIASES.map((a) => "(" + a.re + ")").join("|"), "g");
    const hits = [];
    let m;
    while ((m = rx.exec(t))) {
      const k = m.slice(1).findIndex((x) => x != null);
      hits.push({ r: TFMP_ALIASES[k].r, start: m.index, end: m.index + m[0].length });
    }
    hits.forEach((h, i) => {
      const seg = t.slice(h.end, i + 1 < hits.length ? hits[i + 1].start : t.length);
      const nums = [], pcts = [];
      const nr = /(\d+(?:\.\d+)?)\s*(%?)/g;
      let n;
      while ((n = nr.exec(seg))) (n[2] ? pcts : nums).push(Number(n[1]));
      if (nums.length < 2) return; // عنوان الجدول أو سطر لا يخصّ منطقة
      let a = nums[0], b = nums[1];            // a = العدد الأول، b = الثاني
      let done = firstIsDone ? a : b, planned = firstIsDone ? b : a;
      const pct = pcts.length ? pcts[0] : nums.length > 2 ? nums[2] : null;
      if (pct != null && planned > 0) {
        const ok = (d, p) => p > 0 && Math.abs((d / p) * 100 - pct) <= 1.5;
        if (!ok(done, planned)) {
          if (ok(planned, done)) { const x = done; done = planned; planned = x; }
          else res.warnings.push(`${h.r}: نسبة الإنجاز في اللصق (${pct}%) لا تطابق ${done}/${planned} — راجع الأرقام.`);
        }
      }
      res.values[h.r] = { done, planned };
    });
    res.found = REGION_ORDER.filter((r) => res.values[r]);
    REGION_ORDER.forEach((r) => { if (!res.values[r]) res.warnings.push(`لم أجد منطقة ${r} في النص الملصوق.`); });
    return res;
  }
  window.__balaghReportParseTfmp_ = parseTfmpPaste_; // للاختبار

  // ── ذاكرة زيارات TFMP: سجل لكل أسبوع (مفتاحه جمعة نهاية الأسبوع) = {المنطقة:{planned, done}} ──
  // الأسبوع «السابق» في أي تقرير يُؤخذ تلقائيًا من سجل الأسبوع الذي قبله. البذرة أدناه من تقرير 27 سبتمبر – 3 أكتوبر 2026 (بنظام الأسبوع القديم أحد→سبت)؛ الأسابيع الجديدة (سبت→جمعة) تُلصق مرة واحدة ثم تُحفظ.
  const TFMP_HIST_KEY = "balaghTfmpHistory_v1";
  const TFMP_SEED = {
    "2026-10-03": {
      "جدة": { planned: 238, done: 119 }, "مكة المكرمة": { planned: 487, done: 600 },
      "المدينة المنورة": { planned: 281, done: 66 }, "الطائف": { planned: 256, done: 265 },
    },
  };
  function loadTfmpHist_() {
    let h = {};
    try { h = JSON.parse(localStorage.getItem(TFMP_HIST_KEY) || "{}") || {}; } catch (_) { h = {}; }
    return Object.assign({}, TFMP_SEED, h); // ما سجّله المستخدم يغلب البذرة
  }
  function isoToDate_(iso) { const [y, m, d] = String(iso).split("-").map(Number); return new Date(y, m - 1, d); }
  function saveTfmpHist_(weekIso, manual) {
    try {
      let h = {};
      try { h = JSON.parse(localStorage.getItem(TFMP_HIST_KEY) || "{}") || {}; } catch (_) { h = {}; }
      const prevIso = iso_(addDays_(isoToDate_(weekIso), -7));
      const cur = {}, prev = {};
      REGION_ORDER.forEach((r) => {
        const T = manual[r] && manual[r].tfmp;
        if (!T) return;
        cur[r] = { planned: T.cp, done: T.cd }; prev[r] = { planned: T.pp, done: T.pd };
      });
      h[weekIso] = cur; h[prevIso] = prev;
      const keys = Object.keys(h).sort();
      while (keys.length > 60) delete h[keys.shift()];
      localStorage.setItem(TFMP_HIST_KEY, JSON.stringify(h));
    } catch (_) { /* التخزين اختياري */ }
  }
  window.__balaghReportTfmpHist_ = loadTfmpHist_; // للاختبار

  function loadSaved_() {
    try { return JSON.parse(localStorage.getItem(MANUAL_STORE_KEY) || "null") || { last: null, byWeek: {} }; } catch (_) { return { last: null, byWeek: {} }; }
  }
  function saveManual_(weekIso, vals) {
    try {
      const s = loadSaved_();
      s.last = vals; s.byWeek = s.byWeek || {}; s.byWeek[weekIso] = vals;
      saveTfmpHist_(weekIso, vals);
      const keys = Object.keys(s.byWeek).sort();
      while (keys.length > 30) delete s.byWeek[keys.shift()];
      localStorage.setItem(MANUAL_STORE_KEY, JSON.stringify(s));
    } catch (_) { /* التخزين اختياري */ }
  }
  // الحقول (الصف) × المناطق (الأعمدة). key: مسار داخل القيم
  const FIELDS = [
    { key: "rating", label: "رضا المستفيد — متوسط تقييم الحالة (من 5)", ph: "مثال: 2.58", dec: true, max: 5 },
    { key: "rep1", label: "المعاد فتحها — تكرار 1", ph: "العدد", dec: false },
    { key: "rep2", label: "المعاد فتحها — تكرار 2 إلى 3", ph: "العدد", dec: false },
    { key: "rep3", label: "المعاد فتحها — تكرار 4 إلى 8", ph: "العدد", dec: false },
    { key: "tfmp.pp", label: "زيارات TFMP — الأسبوع السابق: المخطط", ph: "العدد", dec: false },
    { key: "tfmp.pd", label: "زيارات TFMP — الأسبوع السابق: المكتمل", ph: "العدد", dec: false },
    { key: "tfmp.cp", label: "زيارات TFMP — الأسبوع الحالي: المخطط", ph: "العدد", dec: false },
    { key: "tfmp.cd", label: "زيارات TFMP — الأسبوع الحالي: المكتمل", ph: "العدد", dec: false },
  ];
  function getPath_(o, path) { return path.split(".").reduce((x, k) => (x == null ? undefined : x[k]), o); }
  function setPath_(o, path, v) {
    const ks = path.split(".");
    ks.slice(0, -1).reduce((x, k) => (x[k] = x[k] || {}), o)[ks[ks.length - 1]] = v;
  }

  function openReportOptionsModal_() {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.id = "balagh-report-modal-overlay";
      overlay.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:inherit;padding:12px;box-sizing:border-box";
      const card = document.createElement("div");
      card.style.cssText = "background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.3);padding:20px 22px;width:760px;max-width:100%;max-height:100%;overflow:auto;direction:rtl;text-align:right;box-sizing:border-box";
      const secTitle = "font-size:12px;font-weight:800;color:#334155;margin-bottom:6px";
      const inputCss = "width:100%;box-sizing:border-box;border:1.5px solid #CBD5E1;border-radius:9px;padding:6px 8px;font-size:13px;font-family:inherit;direction:ltr;text-align:center";
      const box = "border:1px solid #E2E8F0;border-radius:12px;padding:10px 12px;margin-bottom:12px;background:#F8FAFC";
      const groupRow = (t) => `<tr><td colspan="${REGION_ORDER.length + 1}" style="padding:8px 6px 2px;font-size:11.5px;font-weight:900;color:#0F766E;border-bottom:1px solid #CCFBF1">${t}</td></tr>`;
      const rowsHtml = FIELDS.map((f, fi) => (fi === 0 ? groupRow("① المعاد فتحها ورضا المستفيد — تأتي من ملف Excel (زر الاستيراد أعلاه)") : f.key === "tfmp.pp" ? groupRow("② زيارات الاستشاري TFMP — تُلصق (زر اللصق أعلاه)، والأسبوع السابق يأتي من الذاكرة") : "") + `
        <tr>
          <td style="padding:4px 6px 4px 10px;font-size:11.5px;font-weight:700;color:#475569;white-space:nowrap">${f.label}</td>
          ${REGION_ORDER.map((r, ri) => `<td style="padding:3px 4px"><input type="text" inputmode="decimal" data-f="${fi}" data-r="${ri}" style="${inputCss}" placeholder="${f.ph}" autocomplete="off"></td>`).join("")}
        </tr>`).join("");
      card.innerHTML = `
        <div style="font-size:15px;font-weight:900;color:#1E293B;margin-bottom:4px">📄 تنزيل التقرير الأسبوعي (PowerPoint)</div>
        <div style="font-size:11.5px;color:#64748B;margin-bottom:12px">اختر الأسبوع، راجع القيم اليدوية لكل منطقة، ثم أدخل كلمة المرور</div>
        <div id="balagh-report-modal-errbanner" style="display:none;background:#FEF2F2;border:1.5px solid #DC2626;color:#B91C1C;border-radius:9px;padding:9px 11px;font-size:12px;font-weight:800;margin-bottom:12px"></div>

        <div style="${box}">
          <div style="${secTitle}">الأسبوع (من السبت إلى الجمعة)</div>
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
            <label style="font-size:12px;font-weight:700;color:#475569">تاريخ نهاية الأسبوع (الجمعة):</label>
            <input type="date" id="balagh-report-week" style="border:1.5px solid #CBD5E1;border-radius:9px;padding:6px 8px;font-size:13px;font-family:inherit">
            <button type="button" id="balagh-report-week-latest" style="padding:6px 12px;border-radius:9px;border:1px solid #CBD5E1;background:#fff;color:#475569;font-weight:800;font-size:11.5px;cursor:pointer;font-family:inherit">آخر جمعة</button>
          </div>
          <div id="balagh-report-week-hint" style="font-size:11.5px;color:#7C3AED;font-weight:700;margin-top:6px;min-height:16px"></div>
        </div>

        <div style="${box}">
          <div style="${secTitle}">القيم اليدوية لكل منطقة <span style="font-weight:600;color:#64748B">(تُحفظ في المتصفح — عدّل ما تغيّر فقط)</span></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
            <div style="flex:1;min-width:250px;border:1px solid #99F6E4;background:#F0FDFA;border-radius:10px;padding:8px 10px">
              <button type="button" id="balagh-report-import-btn" style="padding:5px 11px;border-radius:9px;border:1px solid #0F766E;background:#fff;color:#0F766E;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit">📥 استيراد «المعاد فتحها + رضا المستفيد» من Excel</button>
              <input type="file" id="balagh-report-import-file" accept=".xlsx,.xls,.csv" style="display:none">
              <div style="font-size:11px;color:#475569;margin-top:5px;line-height:1.6">يملأ <b>متوسط تقييم الحالة (رضا المستفيد)</b> و<b>البلاغات المعاد فتحها</b> (تكرار 1 ، 2 إلى 3 ، 4 إلى 8). الأعمدة المطلوبة: المنطقة، المعاد فتحها، <bdi>Time 1</bdi>، <bdi>Time 2-3</bdi>، <bdi>Time 4-8</bdi>، الاستبيان - متوسط تقييم الحالة. صف «الإجمالي» يُتجاهل. نسبة الرضا % تُحسب تلقائيًا (التقييم ÷ 5).</div>
            </div>
            <div style="flex:1;min-width:250px;border:1px solid #DDD6FE;background:#F5F3FF;border-radius:10px;padding:8px 10px">
              <button type="button" id="balagh-report-tfmp-btn" style="padding:5px 11px;border-radius:9px;border:1px solid #7C3AED;background:#fff;color:#7C3AED;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit">📋 لصق زيارات TFMP (الأسبوعان)</button>
              <div style="font-size:11px;color:#475569;margin-top:5px;line-height:1.6">يملأ <b>المخطط والمكتمل</b> للأسبوع السابق والأسبوع الحالي. الصق الجدول كما يصلك (اسم الأسبوع، ثم المكتمل / المخطط / النسبة، ثم المناطق). الأسبوع السابق يُعبّأ تلقائيًا من الذاكرة إن كان مسجَّلًا.</div>
            </div>
          </div>
          <div id="balagh-report-import-msg" style="font-size:11px;font-weight:700;margin-bottom:6px;display:none"></div>
          <div id="balagh-report-tfmp-panel" style="display:none;border:1px dashed #7C3AED;border-radius:10px;padding:8px 10px;margin-bottom:8px;background:#FAF8FF">
            <div style="font-size:11.5px;color:#475569;font-weight:700;margin-bottom:6px">الصق جدول كل أسبوع كما يصلك (اسم الأسبوع + العنوان + 4 مناطق). اترك المربع فارغًا لو لا تريد تغيير ذلك الأسبوع.</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <div style="flex:1;min-width:230px"><div style="font-size:11.5px;font-weight:800;color:#334155;margin-bottom:3px">الأسبوع السابق</div><textarea id="balagh-report-tfmp-prev" rows="6" style="width:100%;box-sizing:border-box;border:1.5px solid #CBD5E1;border-radius:9px;padding:6px;font-size:12px;font-family:inherit;direction:rtl" placeholder="الصق هنا"></textarea></div>
              <div style="flex:1;min-width:230px"><div style="font-size:11.5px;font-weight:800;color:#334155;margin-bottom:3px">الأسبوع الحالي</div><textarea id="balagh-report-tfmp-cur" rows="6" style="width:100%;box-sizing:border-box;border:1.5px solid #CBD5E1;border-radius:9px;padding:6px;font-size:12px;font-family:inherit;direction:rtl" placeholder="الصق هنا"></textarea></div>
            </div>
            <div style="margin-top:6px"><button type="button" id="balagh-report-tfmp-apply" style="padding:5px 14px;border-radius:9px;border:1px solid #7C3AED;background:#7C3AED;color:#fff;font-weight:800;font-size:11.5px;cursor:pointer;font-family:inherit">تطبيق</button></div>
          </div>
          <div style="overflow:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead><tr><th style="background:transparent !important;border:0"></th>${REGION_ORDER.map((r) => `<th style="font-size:12px;font-weight:800;color:#17355C !important;background:#EAF0F7 !important;padding:6px 4px;text-align:center;border-radius:6px">${r}</th>`).join("")}</tr></thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </div>
          <div id="balagh-report-manual-hint" style="font-size:11px;color:#0F766E;font-weight:700;margin-top:6px;min-height:15px"></div>
        </div>

        <div style="${secTitle}">كلمة المرور</div>
        <input type="password" id="balagh-report-pw-input" style="width:100%;box-sizing:border-box;border:1.5px solid #CBD5E1;border-radius:9px;padding:8px 10px;font-size:13px;font-family:inherit;margin-bottom:4px" placeholder="********" autocomplete="off">
        <div id="balagh-report-pw-err" style="min-height:16px;font-size:11px;font-weight:700;color:#DC2626;margin-bottom:4px"></div>
        <div style="display:flex;gap:8px;margin-top:6px">
          <button type="button" id="balagh-report-modal-cancel" style="flex:1;padding:8px 0;border-radius:9px;border:1px solid #CBD5E1;background:#F8FAFC;color:#475569;font-weight:800;font-size:12.5px;cursor:pointer;font-family:inherit">إلغاء</button>
          <button type="button" id="balagh-report-modal-ok" style="flex:1;padding:8px 0;border-radius:9px;border:1px solid #7C3AED;background:#7C3AED;color:#fff;font-weight:800;font-size:12.5px;cursor:pointer;font-family:inherit">تنزيل</button>
        </div>`;
      overlay.appendChild(card);
      document.body.appendChild(overlay);

      const $ = (sel) => card.querySelector(sel);
      const inputs = Array.from(card.querySelectorAll("input[data-f]"));
      const inputAt = (fi, ri) => inputs.find((e) => +e.dataset.f === fi && +e.dataset.r === ri);
      const weekInput = $("#balagh-report-week");
      const pwInput = $("#balagh-report-pw-input");
      const pwErrEl = $("#balagh-report-pw-err");
      const setBorder = (el, bad) => { el.style.borderColor = bad ? "#DC2626" : "#CBD5E1"; };

      function weekEndFromInput() {
        const v = weekInput.value;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
        const [y, m, d] = v.split("-").map(Number);
        return fridayOfWeek_(new Date(y, m - 1, d));
      }
      function fillFromSaved() {
        const we = weekEndFromInput();
        const saved = loadSaved_();
        const vals = (we && saved.byWeek && saved.byWeek[iso_(we)]) || saved.last || {};
        inputs.forEach((el) => {
          const f = FIELDS[+el.dataset.f], region = REGION_ORDER[+el.dataset.r];
          const v = getPath_(vals[region], f.key);
          el.value = v == null ? "" : String(v);
          setBorder(el, false);
        });
        const had = we && saved.byWeek && saved.byWeek[iso_(we)];
        const tmsg = applyTfmpMemory(we, !!had);
        $("#balagh-report-manual-hint").textContent = (had ? "تم تحميل القيم المحفوظة لهذا الأسبوع." : saved.last ? "القيم المعروضة من آخر تقرير — عدّل ما تغيّر." : "") + (tmsg ? "  " + tmsg : "");
      }
      // زيارات TFMP: «السابق» من سجل الأسبوع الذي قبله، و«الحالي» من سجل هذا الأسبوع إن وُجد (وإلا فارغ — الصقه)
      function applyTfmpMemory(we, hadWeek) {
        if (!we) return "";
        const hist = loadTfmpHist_();
        const idx = (k) => FIELDS.findIndex((f) => f.key === k);
        const put = (rec, kp, kd) => REGION_ORDER.forEach((r, ri) => {
          const v = rec && rec[r];
          const ep = inputAt(idx(kp), ri), ed = inputAt(idx(kd), ri);
          if (ep) { ep.value = v ? String(v.planned) : ""; setBorder(ep, false); }
          if (ed) { ed.value = v ? String(v.done) : ""; setBorder(ed, false); }
        });
        const prevIso = iso_(addDays_(we, -7)), curIso = iso_(we);
        const msgs = [];
        if (hist[prevIso]) { put(hist[prevIso], "tfmp.pp", "tfmp.pd"); msgs.push("🧠 زيارات الأسبوع السابق من الذاكرة (" + rangeLabel_(addDays_(we, -13), addDays_(we, -7), true) + ")."); }
        else if (!hadWeek) { put(null, "tfmp.pp", "tfmp.pd"); msgs.push("⚠️ لا يوجد سجل TFMP للأسبوع السابق — الصقه."); }
        if (hist[curIso]) { put(hist[curIso], "tfmp.cp", "tfmp.cd"); msgs.push("🧠 زيارات الأسبوع الحالي محفوظة."); }
        else if (!hadWeek) { put(null, "tfmp.cp", "tfmp.cd"); msgs.push("زيارات هذا الأسبوع: الصق جدول TFMP."); }
        const keys = Object.keys(hist).sort();
        if (keys.length) { const last = isoToDate_(keys[keys.length - 1]); msgs.push("آخر أسبوع مسجَّل لـ TFMP: " + rangeLabel_(addDays_(last, -6), last, true) + "."); }
        return msgs.join(" ");
      }
      $("#balagh-report-import-btn").addEventListener("click", () => $("#balagh-report-import-file").click());
      $("#balagh-report-import-file").addEventListener("change", async (ev) => {
        const file = ev.target.files && ev.target.files[0];
        const msg = $("#balagh-report-import-msg");
        ev.target.value = "";
        if (!file) return;
        const show = (t, ok) => { msg.textContent = t; msg.style.color = ok ? "#0F766E" : "#B45309"; msg.style.display = "block"; };
        try {
          const aoa = await readSheetFile_(file);
          const res = parseReopenedAoa_(aoa);
          const keys = ["rating", "rep1", "rep2", "rep3"];
          let filled = 0;
          res.regionsFound.forEach((r) => {
            const ri = REGION_ORDER.indexOf(r);
            keys.forEach((k) => {
              const v = res.values[r][k];
              if (v == null) return;
              const fi = FIELDS.findIndex((f) => f.key === k);
              const el = inputAt(fi, ri);
              if (el) { el.value = String(v); setBorder(el, false); filled++; }
            });
          });
          if (!res.regionsFound.length) { show("⚠️ " + (res.warnings[0] || "لم أتعرف على أي منطقة في الملف."), false); return; }
          show(`✅ تم استيراد ${res.regionsFound.length} مناطق (${filled} خانة) من «${file.name}» — صف الإجمالي تم تجاهله. راجع القيم قبل التنزيل.` + (res.warnings.length ? "  ⚠️ " + res.warnings.join(" | ") : ""), !res.warnings.length);
        } catch (e) {
          show("⚠️ تعذّر قراءة الملف: " + (e && e.message ? e.message : e), false);
        }
      });
      $("#balagh-report-tfmp-btn").addEventListener("click", () => {
        const pn = $("#balagh-report-tfmp-panel");
        pn.style.display = pn.style.display === "none" ? "block" : "none";
      });
      $("#balagh-report-tfmp-apply").addEventListener("click", () => {
        const msg = $("#balagh-report-import-msg");
        const show = (t, ok) => { msg.textContent = t; msg.style.color = ok ? "#0F766E" : "#B45309"; msg.style.display = "block"; };
        const targets = [["prev", "الأسبوع السابق", "tfmp.pp", "tfmp.pd"], ["cur", "الأسبوع الحالي", "tfmp.cp", "tfmp.cd"]];
        const parts = [], warns = [];
        targets.forEach(([id, label, kp, kd]) => {
          const txt = $("#balagh-report-tfmp-" + id).value;
          if (!String(txt).trim()) return;
          const res = parseTfmpPaste_(txt);
          res.found.forEach((r) => {
            const ri = REGION_ORDER.indexOf(r), v = res.values[r];
            const ep = inputAt(FIELDS.findIndex((f) => f.key === kp), ri), ed = inputAt(FIELDS.findIndex((f) => f.key === kd), ri);
            if (ep) { ep.value = String(v.planned); setBorder(ep, false); }
            if (ed) { ed.value = String(v.done); setBorder(ed, false); }
          });
          parts.push(`${label}: ${res.found.length} مناطق`);
          res.warnings.forEach((w) => warns.push(`${label} — ${w}`));
        });
        if (!parts.length) { show("⚠️ الصق جدول أسبوع واحد على الأقل ثم اضغط تطبيق.", false); return; }
        show(`✅ تم تعبئة زيارات TFMP (${parts.join(" · ")}). راجع القيم قبل التنزيل.` + (warns.length ? "  ⚠️ " + warns.join(" | ") : ""), !warns.length);
      });
      function refreshWeekHint() {
        const we = weekEndFromInput();
        const hint = $("#balagh-report-week-hint");
        if (!we) { hint.textContent = "اختر تاريخًا صحيحًا"; return; }
        const s = addDays_(we, -6), s4 = addDays_(we, -27);
        const snapped = weekInput.value !== iso_(we) ? ` (اعتُمدت الجمعة ${iso_(we)})` : "";
        hint.textContent = `الأسبوع: ${rangeLabel_(s, we, true)} — و4 أسابيع من ${rangeLabel_(s4, we, false)}${snapped}`;
      }
      function cleanup(result) {
        document.removeEventListener("keydown", onKeydown);
        overlay.remove();
        resolve(result);
      }
      function submit() {
        const errBanner = $("#balagh-report-modal-errbanner");
        errBanner.style.display = "none";
        let firstBad = null;
        const mark = (el) => { if (!firstBad) firstBad = el; };
        const we = weekEndFromInput();
        if (!we) { setBorder(weekInput, true); mark(weekInput); } else setBorder(weekInput, false);
        const manual = {};
        REGION_ORDER.forEach((r) => { manual[r] = { tfmp: {} }; });
        inputs.forEach((el) => {
          const f = FIELDS[+el.dataset.f], region = REGION_ORDER[+el.dataset.r];
          const v = parseUserNumber_(el.value);
          const bad = v === null || (f.max != null && v > f.max) || (!f.dec && !Number.isInteger(v));
          setBorder(el, bad);
          if (bad) { mark(el); return; }
          setPath_(manual[region], f.key, v);
        });
        if (pwInput.value !== REPORT_DOWNLOAD_PASSWORD) {
          pwErrEl.textContent = "❌ كلمة المرور غير صحيحة"; setBorder(pwInput, true); mark(pwInput);
        }
        if (firstBad) {
          errBanner.textContent = firstBad === pwInput ? "❌ كلمة المرور غير صحيحة."
            : "⚠️ توجد حقول فارغة أو غير صحيحة (الصفر مسموح؛ التقييم درجة من 5، والباقي أعداد صحيحة) — راجع الخانات الحمراء.";
          errBanner.style.display = "block";
          errBanner.scrollIntoView({ block: "start" });
          firstBad.focus();
          return;
        }
        saveManual_(iso_(we), manual);
        cleanup({ password: pwInput.value, weekEnd: we, manual });
      }
      function onKeydown(e) {
        if (e.key === "Escape") { e.preventDefault(); cleanup(null); }
        else if (e.key === "Enter" && e.target && e.target.tagName === "INPUT") { e.preventDefault(); submit(); }
      }
      $("#balagh-report-modal-ok").addEventListener("click", submit);
      $("#balagh-report-modal-cancel").addEventListener("click", () => cleanup(null));
      overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) cleanup(null); });
      document.addEventListener("keydown", onKeydown);
      weekInput.addEventListener("change", () => { refreshWeekHint(); fillFromSaved(); });
      $("#balagh-report-week-latest").addEventListener("click", () => { weekInput.value = iso_(defaultWeekEnd_()); refreshWeekHint(); fillFromSaved(); });
      inputs.forEach((el) => el.addEventListener("input", () => setBorder(el, false)));
      pwInput.addEventListener("input", () => { pwErrEl.textContent = ""; setBorder(pwInput, false); });
      weekInput.value = iso_(defaultWeekEnd_());
      refreshWeekHint();
      fillFromSaved();
      (inputs.find((e) => !e.value) || pwInput).focus();
    });
  }
  window.__balaghReportOpenModal_ = openReportOptionsModal_; // للاختبار

  window.__balaghReportButtonClick_ = async function (btn) {
    const statusEl = document.getElementById("balagh-report-status");
    const choice = await openReportOptionsModal_();
    if (!choice) return;
    const originalHtml = btn.innerHTML;
    btn.disabled = true; btn.style.cursor = "default"; btn.style.opacity = "0.7";
    btn.innerHTML = "⏳ جارٍ تجهيز التقرير…";
    if (statusEl) { statusEl.textContent = ""; statusEl.style.color = ""; }
    try {
      const data = await window.generateBalaghReportPptx(choice.weekEnd, choice.manual);
      if (statusEl) { statusEl.style.color = "#059669"; statusEl.textContent = `✅ تم تنزيل التقرير — الأسبوع: ${data.periodLabel}`; }
    } catch (e) {
      console.error("[balagh report]", e);
      if (statusEl) { statusEl.style.color = "#DC2626"; statusEl.textContent = "❌ " + (e && e.message ? e.message : "تعذّر توليد التقرير"); }
    } finally {
      btn.disabled = false; btn.style.cursor = "pointer"; btn.style.opacity = "1"; btn.innerHTML = originalHtml;
    }
  };
})();
