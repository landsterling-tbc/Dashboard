/* report_generator.js — توليد تقرير PowerPoint (نفس تمبلت "_تقرير_متابعة_البلاغات") من بيانات
   تبويب البلاغات الحيّة. بيشتغل بالكامل جوه المتصفح (بدون سيرفر): بيجيب report_template.pptx
   الثابت، يعدّل نصوص/جداول/تشارتات سلايدات محددة بأرقام الفترة الحالية، وينزّل ملف .pptx.
   الشعارات/الألوان/التخطيط زي ما هي بالظبط — الملف الأصلي مش بيتلمس غير في القيم. */

(function () {
  "use strict";

  const TEMPLATE_URL = "report_template.pptx";
  // نسخة من نفس التمبلت كـbase64 جوه ملف JS — بتتحمّل بس لو fetch فشل (أهمها: لو
  // الداشبورد مفتوح كملف محلي file:// — المتصفح بيمنع fetch للملفات المحلية، بينما
  // <script> شغّال عادي). ⚠️ أي تعديل على report_template.pptx لازم يتبعه إعادة
  // توليد report_template_data.js من نفس الملف، وتغيير TEMPLATE_VERSION.
  const TEMPLATE_DATA_JS = "report_template_data.js";
  const TEMPLATE_VERSION = "20260926";
  const REGION_ORDER = ["جدة", "مكة المكرمة", "المدينة المنورة", "الطائف"];
  const CLEANING_CATEGORY_VALUES = ["نظافة", "النظافة", "أعمال النظافة", "بند النظافة"];
  // ── مناطق فرعية تتبع كل منطقة رئيسية (نفس BALAGH_SECTOR_TO_REGION في dashboard.js) —
  // مهمة لسلايد "توزيع بلاغات النظافة على المقاولين": المحافظة الفرعية ممكن يكون
  // ليها مقاول نظافة مختلف عن المحافظة الرئيسية اللي بتتبعها.
  const PRIMARY_LOCATION_BY_REGION = { "جدة": "جدة", "مكة المكرمة": "مكة المكرمة", "المدينة المنورة": "المدينة المنورة", "الطائف": "الطائف" };
  const SUB_LOCATIONS_BY_REGION = { "مكة المكرمة": ["القنفذة", "الليث"], "المدينة المنورة": ["ينبع", "العلا", "المهد"], "جدة": [], "الطائف": [] };

  // ── كلمة مرور تنزيل التقرير — بنفس كلمة مرور دخول شعار Land Sterling (LANDSTERLING_PASSWORD
  // في index.html) عشان تبقى كلمة مرور واحدة يتذكرها المستخدم بدل اتنين. غيّرها هنا لو
  // عايز كلمة منفصلة لاحقًا (لازم تفضل نفس القيمة اللي في index.html لو عايز تفضل موحّدة).
  const REPORT_DOWNLOAD_PASSWORD = "1248";

  function norm_(v) {
    return String(v == null ? "" : v).trim();
  }
  function fmtNum_(n) {
    return Math.round(n || 0).toLocaleString("en-US");
  }
  function pct1_(n, d) {
    return d > 0 ? ((n / d) * 100).toFixed(1) : "0.0";
  }
  // (طلب صريح 2026-09-26) "أي رقم ينفع نكتب جنبه نسبة" → "العدد (النسبة%)". الصفر
  // بيتكتب "0" لوحده من غير نسبة عشان الجداول ماتبقاش زحمة بـ"0 (0.0%)".
  function cntPct_(n, d) {
    n = Math.round(n || 0);
    return n > 0 ? `${fmtNum_(n)} (${pct1_(n, d)}%)` : "0";
  }
  // ⚠️ (طلب صريح) "طارئ" = الأولوية "حرج/Critical" فقط. "روتيني" = أي حاجة تانية
  // (متوسط/مرتفع/منخفض...إلخ) — مختلف عن window.isHighRiskPriority العام المستخدم في
  // باقي الداشبورد (اللي بيحسب حرج+مرتفع سوا)، خصيصًا لتعريف روتيني/طارئ في هذا التقرير.
  function isEmergencyPriority_(p) {
    const v = norm_(p).toLowerCase();
    return v === "حرج" || v === "critical";
  }

  // ── الأسبوع (الأحد → السبت) — طلب صريح من المستخدم (2026-09-26): أسبوع التقرير
  // دايمًا من الأحد لغاية السبت (مثال: "20 سبتمبر – 26 سبتمبر 2026"، الأحد للسبت)
  // — مختلف عمدًا عن الأسبوع (سبت→جمعة) المستخدم في كارت "مقارنة يومية وأسبوعية"
  // بتبويب البلاغات نفسه (renderBalaghTab/balaghWeekStart_)، واللي فضل زي ما هو من
  // غير تغيير لأنه مش جزء من التقرير المطلوب تعديله هنا.
  function weekStart_(d) {
    const back = d.getDay(); // getDay(): الأحد=0 ... السبت=6
    const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    s.setDate(s.getDate() - back);
    return s;
  }
  function endOfDay_(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  }
  // حدود الفترة: 7 أيام (أسبوع واحد، مربوط على الأحد) أو 14 يوم (أسبوعين متتاليين)
  // + فترة المقارنة (نفس الطول قبلها مباشرة) لسلايد المقارنة
  function computePeriodBounds_(latestDate, periodDays) {
    const anchorWeekStart = weekStart_(latestDate);
    const curStart = new Date(anchorWeekStart);
    if (periodDays === 14) curStart.setDate(curStart.getDate() - 7);
    const curEnd = new Date(curStart);
    curEnd.setDate(curEnd.getDate() + periodDays - 1);
    const prevStart = new Date(curStart);
    prevStart.setDate(prevStart.getDate() - periodDays);
    const prevEnd = new Date(curStart);
    prevEnd.setDate(prevEnd.getDate() - 1);
    return { curStart, curEnd, curEndFull: endOfDay_(curEnd), prevStart, prevEnd, prevEndFull: endOfDay_(prevEnd) };
  }
  // ⚠️ نجبر التقويم الميلادي صراحةً (calendar: "gregory") — "ar-SA" افتراضيًا
  // بيستخدم التقويم الهجري في بعض المتصفحات، بينما التمبلت الأصلي وكل تواريخ
  // البلاغات ميلادية (زي "15 أغسطس - 15 سبتمبر 2026" في التقرير المرجعي)
  function arDate_(d) {
    return d.toLocaleDateString("ar-SA-u-ca-gregory-nu-latn", { day: "numeric", month: "long" });
  }
  function arDateShort_(d) {
    return d.toLocaleDateString("ar-SA-u-ca-gregory-nu-latn", { day: "numeric", month: "short" });
  }

  // ═══════════════════════════════ حساب بيانات التقرير ═══════════════════════════════
  // periodDays: 7 (آخر أسبوع فقط) أو 14 (آخر أسبوعين مجمّعين) — افتراضي 7
  function computeReportData(periodDays) {
    periodDays = periodDays === 14 ? 14 : 7;
    if (typeof window.__balaghNormalizeRows !== "function") {
      throw new Error("بيانات البلاغات غير محمّلة بعد — انتظر اكتمال التحميل ثم أعد المحاولة");
    }
    const all = window.__balaghNormalizeRows();
    const now = new Date();
    // ⚠️ حماية دفاعية: أي "تاريخ إنشاء" في المستقبل (بيانات تالفة/خطأ إدخال) بنتجاهله
    // عند حساب "أحدث تاريخ" — عشان تاريخ خاطئ في صف واحد ما يزحزحش نافذة الأسبوع كلها
    const validDates = all.map((r) => r.creationDateObj).filter((d) => d && d.getTime() <= now.getTime());
    if (!validDates.length) throw new Error("لا توجد بلاغات بتاريخ إنشاء صالح لحساب فترة التقرير");
    const latestDate = new Date(Math.max(...validDates.map((d) => d.getTime())));

    const bounds = computePeriodBounds_(latestDate, periodDays);
    const { curStart, curEnd, curEndFull, prevStart, prevEnd, prevEndFull } = bounds;

    const inRange = (r, s, e) => r.creationDateObj && r.creationDateObj >= s && r.creationDateObj <= e;
    const periodRows = all.filter((r) => inRange(r, curStart, curEndFull));
    const prevPeriodRows = all.filter((r) => inRange(r, prevStart, prevEndFull));

    const periodLabel = `${arDate_(curStart)} – ${arDate_(curEnd)} ${curEnd.getFullYear()}`;
    // تسمية مختصرة (لعناوين الجداول/التشارت الضيقة): شهر واحد فقط لو الأسبوع
    // ما بيعديش من شهر لشهر، بدل تكرار اسم الشهر مرتين وتكسير عرض الخانة
    function weekRangeCompact_(s, e) {
      const sameMonth = s.getMonth() === e.getMonth();
      if (sameMonth) return `${s.getDate()}-${e.getDate()} ${arDate_(e).split(" ").slice(1).join(" ")}`;
      return `${arDateShort_(s)} – ${arDateShort_(e)}`;
    }
    const curShort = weekRangeCompact_(curStart, curEnd);
    const prevShort = weekRangeCompact_(prevStart, prevEnd);

    // ── مساعد: تجميع صفوف حسب المنطقة (الترتيب الثابت REGION_ORDER) ──
    function byRegion(rows) {
      const m = new Map(REGION_ORDER.map((r) => [r, []]));
      rows.forEach((r) => {
        if (m.has(r.region)) m.get(r.region).push(r);
      });
      return m;
    }
    function regionCounts(rows) {
      const m = byRegion(rows);
      return REGION_ORDER.map((r) => ({ region: r, count: m.get(r).length }));
    }
    function sortDesc(list) {
      return [...list].sort((a, b) => b.count - a.count);
    }

    // ── سلايد 3: بلاغات الأمن والسلامة — حسب القسم × المنطقة ──
    const secRowsAll = typeof window.getSecuritySafetyBalaghRows === "function" ? window.getSecuritySafetyBalaghRows() : [];
    const secRows = secRowsAll.filter((r) => inRange(r, curStart, curEndFull));
    const groupsOrder = ["المصاعد", "مخارج الطوارئ", "أنظمة الأمن والسلامة", "اعمال الكهرباء"];
    const secByGroup = new Map(groupsOrder.map((g) => [g, { group: g, total: 0, byRegion: new Map(REGION_ORDER.map((r) => [r, 0])) }]));
    secRows.forEach((r) => {
      const grp = typeof window.securitySafetyCategoryGroup_ === "function" ? window.securitySafetyCategoryGroup_(r.subCategory) : "أخرى";
      const entry = secByGroup.get(grp);
      if (!entry) return;
      entry.total++;
      if (entry.byRegion.has(r.region)) entry.byRegion.set(r.region, entry.byRegion.get(r.region) + 1);
    });
    const secGroupsSorted = [...secByGroup.values()].sort((a, b) => b.total - a.total);
    const secTotal = secRows.length;

    // ── سلايد 4: نظرة عامة ──
    const overviewTotal = periodRows.length;
    const consultantApprovalRows = periodRows.filter((r) => {
      const s = norm_(r.status);
      return s === "Consultant Approval In Progress" || s === "موافقة الاستشاري قيد التنفيذ";
    });
    const emergencyRows = periodRows.filter((r) => isEmergencyPriority_(r.priority));
    const buildingsTotal = Array.isArray(window.RAW) ? window.RAW.length : null;
    const overviewByRegion = sortDesc(
      REGION_ORDER.map((region) => {
        const rows = periodRows.filter((r) => r.region === region);
        return {
          region,
          total: rows.length,
          reopened: 0, // ⚠️ لا يوجد عمود/حالة "معاد فتحها" في نموذج البيانات الحالي — راجع ملاحظة التسليم
          consultantApproval: rows.filter((r) => {
            const s = norm_(r.status);
            return s === "Consultant Approval In Progress" || s === "موافقة الاستشاري قيد التنفيذ";
          }).length,
        };
      }),
      "total"
    ).map((x) => ({ ...x, count: x.total })); // توحيد مفتاح الفرز

    // ── سلايد 5: توزيع المباني (الفريدة) اللي عندها بلاغات — حسب المنطقة ──
    const buildingsByRegion = REGION_ORDER.map((region) => {
      const keys = new Set(periodRows.filter((r) => r.region === region).map((r) => r.schoolKey));
      return { region, count: keys.size };
    });

    // ── سلايد 6: مقارنة الأسبوع الحالي بالأسبوع السابق ──
    const curByRegion = regionCounts(periodRows);
    const prevByRegionMap = new Map(regionCounts(prevPeriodRows).map((x) => [x.region, x.count]));
    const weekCompareByRegion = sortDesc(curByRegion).map((x) => ({
      region: x.region,
      current: x.count,
      previous: prevByRegionMap.get(x.region) || 0,
    }));

    // ── سلايد 7: الأولوية (روتيني/طارئ) حسب المنطقة ──
    const priorityByRegion = sortDesc(
      REGION_ORDER.map((region) => {
        const rows = periodRows.filter((r) => r.region === region);
        const emergency = rows.filter((r) => isEmergencyPriority_(r.priority)).length;
        return { region, count: emergency, emergency, routine: rows.length - emergency, pct: pct1_(emergency, rows.length) };
      })
    );

    // ── سلايد 8: الالتزام بـ SLA (العام) — نفس الحقل المستخدم فعليًا في renderBalaghTab (isOverdue) ──
    const overdueCount = periodRows.filter((r) => r.isOverdue).length;
    const compliantCount = overviewTotal - overdueCount;
    const compliancePct = overviewTotal > 0 ? (compliantCount / overviewTotal) * 100 : 0;
    const breachPct = overviewTotal > 0 ? (overdueCount / overviewTotal) * 100 : 0;

    // ── سلايد 9: حالة قيد موافقة الاستشاري — حسب المنطقة ──
    const consultantByRegion = sortDesc(
      REGION_ORDER.map((region) => ({
        region,
        count: periodRows.filter((r) => r.region === region && (() => {
          const s = norm_(r.status);
          return s === "Consultant Approval In Progress" || s === "موافقة الاستشاري قيد التنفيذ";
        })()).length,
      }))
    );

    // ── سلايد 10/11: بلاغات النظافة ──
    const cleaningRows = periodRows.filter((r) => CLEANING_CATEGORY_VALUES.includes(norm_(r.category)));
    const cleaningByRegion = sortDesc(
      REGION_ORDER.map((region) => ({ region, count: cleaningRows.filter((r) => r.region === region).length }))
    );

    // ═══ سلايد 11: توزيع بلاغات النظافة على المقاولين (مراجعة 2026-09-26) ═══
    // (اختيار صريح من المستخدم) كل بلاغ نظافة بيتحسب على المقاول المكتوب فيه فعلاً
    // (عمود Package ← "المقاول")، والبلاغ اللي خانة المقاول فيه فاضية بس هو اللي بيتعبى
    // بمقاول المحافظة "الحالي". الصفوف = (منطقة × مقاول)، ومعاها عمود منفصل بالمحافظات
    // اللي المقاول ده غطاها — وكل محافظة بتظهر حتى لو ملهاش بلاغات في الفترة (بعدد 0).
    //
    // ⚠️ ليه "الحالي" مش "الأغلب على مدار السنة": فحص البيانات الحقيقية أثبت إن المقاول
    // بيتغير (مثال: نظافة المدينة المنورة كانت Gulf Development لغاية مايو، وبقت Gulf
    // Advanced من يونيو). فمقاول المحافظة بيتحدد بالترتيب ده:
    //   1) الأغلب في بلاغات نفس المحافظة جوه فترة التقرير نفسها
    //   2) وإلا الأغلب في آخر 90 يوم قبل نهاية الفترة
    //   3) وإلا آخر مقاول ظهر فعلاً في المحافظة دي (أحدث تاريخ)
    //   4) وإلا "غير محدد"
    const CLEANING_UNKNOWN_CONTRACTOR_ = "غير محدد";
    const cleaningRowsAll_ = all.filter((r) => CLEANING_CATEGORY_VALUES.includes(norm_(r.category)));
    const recentStart_ = new Date(curStart);
    recentStart_.setDate(recentStart_.getDate() - 90);
    const cleaningKnownByLoc_ = new Map(); // location -> [{c, t}] (بلاغات نظافة فيها مقاول مكتوب فعلاً)
    cleaningRowsAll_.forEach((r) => {
      const loc = norm_(r.location);
      const c = norm_(r.contractor);
      if (!loc || !c || !r.creationDateObj) return;
      if (!cleaningKnownByLoc_.has(loc)) cleaningKnownByLoc_.set(loc, []);
      cleaningKnownByLoc_.get(loc).push({ c, t: r.creationDateObj.getTime() });
    });
    function dominantOf_(list) {
      if (!list.length) return null;
      const m = new Map();
      list.forEach((x) => m.set(x.c, (m.get(x.c) || 0) + 1));
      return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
    }
    const currentContractorCache_ = new Map();
    function currentCleaningContractor_(loc) {
      if (currentContractorCache_.has(loc)) return currentContractorCache_.get(loc);
      const list = cleaningKnownByLoc_.get(loc) || [];
      const inPeriod = list.filter((x) => x.t >= curStart.getTime() && x.t <= curEndFull.getTime());
      const recent = list.filter((x) => x.t >= recentStart_.getTime() && x.t <= curEndFull.getTime());
      const upToEnd = list.filter((x) => x.t <= curEndFull.getTime());
      const latest = upToEnd.length ? upToEnd.reduce((a, b) => (b.t > a.t ? b : a)).c : null;
      const c = dominantOf_(inPeriod) || dominantOf_(recent) || latest || CLEANING_UNKNOWN_CONTRACTOR_;
      currentContractorCache_.set(loc, c);
      return c;
    }

    // تجميع بلاغات الفترة: (منطقة × مقاول فعلي) مع عدد كل محافظة جوه المجموعة
    const cleaningGroups_ = new Map(); // `${region}||${contractor}` -> {region, contractor, count, locs: Map(loc -> count)}
    const cleaningLocsWithRows_ = new Set();
    function cleaningGroup_(region, contractor) {
      const key = `${region}||${contractor}`;
      if (!cleaningGroups_.has(key)) cleaningGroups_.set(key, { region, contractor, count: 0, locs: new Map() });
      return cleaningGroups_.get(key);
    }
    cleaningRows.forEach((r) => {
      if (!REGION_ORDER.includes(r.region)) return;
      const loc = norm_(r.location) || r.region;
      const contractor = norm_(r.contractor) || currentCleaningContractor_(loc);
      const g = cleaningGroup_(r.region, contractor);
      g.count++;
      g.locs.set(loc, (g.locs.get(loc) || 0) + 1);
      cleaningLocsWithRows_.add(loc);
    });
    // كل محافظة لازم تظهر بمقاولها حتى لو ملهاش بلاغات نظافة في الفترة (عددها 0)
    REGION_ORDER.forEach((region) => {
      const locs = [PRIMARY_LOCATION_BY_REGION[region] || region, ...(SUB_LOCATIONS_BY_REGION[region] || [])];
      locs.forEach((loc) => {
        if (cleaningLocsWithRows_.has(loc)) return;
        const g = cleaningGroup_(region, currentCleaningContractor_(loc));
        if (!g.locs.has(loc)) g.locs.set(loc, 0);
      });
    });

    const cleaningContractorRows = [];
    REGION_ORDER.forEach((region) => {
      const locOrder = [PRIMARY_LOCATION_BY_REGION[region] || region, ...(SUB_LOCATIONS_BY_REGION[region] || [])];
      const groups = [...cleaningGroups_.values()].filter((g) => g.region === region);
      const regionTotal = groups.reduce((s, g) => s + g.count, 0);
      groups
        .sort((a, b) => b.count - a.count || a.contractor.localeCompare(b.contractor))
        .forEach((g) => {
          const locs = [...g.locs.keys()].sort((a, b) => {
            const ia = locOrder.indexOf(a), ib = locOrder.indexOf(b);
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
          });
          cleaningContractorRows.push({
            region,
            governorates: locs.join("، "),
            contractor: g.contractor,
            count: g.count,
            pct: pct1_(g.count, regionTotal),
          });
        });
    });

    // ── سلايد 12-15: أعلى 10 مدارس لكل منطقة ──
    function topSchoolsForRegion(region) {
      const rows = periodRows.filter((r) => r.region === region);
      const bySchool = new Map(); // schoolKey -> {name, minId, count, emergency}
      rows.forEach((r) => {
        const key = r.schoolKey;
        if (!bySchool.has(key)) {
          bySchool.set(key, {
            name: r.linkedSchoolName || r.schoolName || "—",
            minId: r.linkedMinId || r.schoolNumber || "—",
            count: 0,
            emergency: 0,
          });
        }
        const e = bySchool.get(key);
        e.count++;
        if (isEmergencyPriority_(r.priority)) e.emergency++;
      });
      return [...bySchool.values()].sort((a, b) => b.count - a.count).slice(0, 10);
    }
    const topSchoolsByRegion = {
      "جدة": topSchoolsForRegion("جدة"),
      "مكة المكرمة": topSchoolsForRegion("مكة المكرمة"),
      "المدينة المنورة": topSchoolsForRegion("المدينة المنورة"),
      "الطائف": topSchoolsForRegion("الطائف"),
    };

    return {
      periodLabel, curShort, prevShort, curStart, curEnd, prevStart, prevEnd,
      overviewTotal, buildingsTotal, emergencyRows, consultantApprovalRows, overviewByRegion,
      secTotal, secGroupsSorted, buildingsByRegion, weekCompareByRegion, priorityByRegion,
      overdueCount, compliantCount, compliancePct, breachPct,
      consultantByRegion, cleaningByRegion, cleaningTotal: cleaningRows.length, cleaningContractorRows,
      topSchoolsByRegion,
    };
  }

  // ═══════════════════════════════ أدوات XML عامة (DOMParser) ═══════════════════════════════
  function parseXml_(str) {
    return new DOMParser().parseFromString(str, "application/xml");
  }
  function serializeXml_(doc) {
    return new XMLSerializer().serializeToString(doc);
  }
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
  function setParagraphText_(pEl, text) {
    const ts = pEl.getElementsByTagName("a:t");
    if (!ts.length) return;
    ts[0].textContent = text;
    for (let i = 1; i < ts.length; i++) ts[i].textContent = "";
  }
  function setShapeLines_(doc, shapeId, lines) {
    const sp = findShapeById_(doc, shapeId);
    if (!sp) return;
    const txBody = sp.getElementsByTagName("p:txBody")[0];
    if (!txBody) return;
    const ps = txBody.getElementsByTagName("a:p");
    for (let i = 0; i < ps.length; i++) setParagraphText_(ps[i], i < lines.length ? String(lines[i]) : "");
  }
  // مثل setShapeLines_ لكن للحالة اللي الأسطر جوه نفس الـ <a:p> الواحدة
  // ومفصولة بـ <a:br/> بدل فقرات منفصلة (زي عنوان سلايد 1)
  function setShapeBrSegments_(doc, shapeId, lines) {
    const sp = findShapeById_(doc, shapeId);
    if (!sp) return;
    const txBody = sp.getElementsByTagName("p:txBody")[0];
    if (!txBody) return;
    const p = txBody.getElementsByTagName("a:p")[0];
    if (!p) return;
    const children = Array.from(p.childNodes).filter((n) => n.nodeName === "a:r" || n.nodeName === "a:br");
    const segments = [];
    let cur = [];
    children.forEach((n) => {
      if (n.nodeName === "a:br") { segments.push(cur); cur = []; }
      else cur.push(n);
    });
    segments.push(cur);
    segments.forEach((seg, i) => {
      if (!seg.length) return;
      const text = i < lines.length ? String(lines[i]) : "";
      const firstT = seg[0].getElementsByTagName("a:t")[0];
      if (firstT) firstT.textContent = text;
      for (let j = 1; j < seg.length; j++) {
        const t = seg[j].getElementsByTagName("a:t")[0];
        if (t) t.textContent = "";
      }
    });
  }
  function getTableInShape_(shapeEl) {
    return shapeEl ? shapeEl.getElementsByTagName("a:tbl")[0] : null;
  }
  function setCell_(tbl, rowIdx, colIdx, text) {
    const trs = tbl.getElementsByTagName("a:tr");
    const tr = trs[rowIdx];
    if (!tr) return;
    const tcs = tr.getElementsByTagName("a:tc");
    const tc = tcs[colIdx];
    if (!tc) return;
    const p = tc.getElementsByTagName("a:p")[0];
    if (p) setParagraphText_(p, String(text));
  }
  function setDynamicDataRows_(tbl, dataRows, fillRowFn) {
    const trs = Array.from(tbl.getElementsByTagName("a:tr"));
    if (trs.length < 2) return;
    const templateRow = trs[1].cloneNode(true);
    trs.slice(1).forEach((r) => r.parentNode.removeChild(r));
    dataRows.forEach((rowData, i) => {
      const newRow = templateRow.cloneNode(true);
      fillRowFn(newRow, rowData, i);
      tbl.appendChild(newRow);
    });
  }
  function setChartCategoriesValues_(chartDoc, seriesIdx, categories, values) {
    const sers = chartDoc.getElementsByTagName("c:ser");
    const ser = sers[seriesIdx];
    if (!ser) return;
    const cat = ser.getElementsByTagName("c:cat")[0];
    const val = ser.getElementsByTagName("c:val")[0];
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
  // ⚠️ (اكتُشف أثناء اختبار هذه الجولة) بعض التشارتات في التمبلت الأصلي (تحديدًا
  // تشارت سلايد 5 "توزيع المباني...") بتحتوي على تراكيب "<c:dLbl>" لكل نقطة —
  // نص ثابت (rich text) مكتوب حرفيًا زي "1,097 (31.2%)" وقت تصميم التمبلت، منفصل
  // تمامًا عن قيم السلسلة الفعلية (<c:v> جوه <c:val>). تعديل القيم وحدها (عبر
  // setChartCategoriesValues_) مش كفاية هنا — الليبل الظاهر على العمود فعليًا
  // بيفضل ثابت على رقم التمبلت القديم لأنه نص مكتوب صراحة مش مربوط بالقيمة.
  // الدالة دي بتحدّث نص كل Data Label بترتيب idx (0..N-1) — نفس ترتيب النقاط
  // اللي بتتحدث بيه setChartCategoriesValues_، فمفيش داعي لمطابقة أسماء.
  function setChartDataLabelTexts_(chartDoc, seriesIdx, texts) {
    const sers = chartDoc.getElementsByTagName("c:ser");
    const ser = sers[seriesIdx];
    if (!ser) return;
    const dLbls = ser.getElementsByTagName("c:dLbls")[0];
    if (!dLbls) return;
    Array.from(dLbls.getElementsByTagName("c:dLbl")).forEach((dLbl) => {
      const idxEl = dLbl.getElementsByTagName("c:idx")[0];
      const idx = idxEl ? parseInt(idxEl.getAttribute("val"), 10) : -1;
      if (idx < 0 || idx >= texts.length) return;
      const tNodes = dLbl.getElementsByTagName("a:t");
      if (tNodes.length) tNodes[0].textContent = String(texts[idx]);
    });
  }
  function setSeriesName_(chartDoc, seriesIdx, name) {
    const sers = chartDoc.getElementsByTagName("c:ser");
    const ser = sers[seriesIdx];
    if (!ser) return;
    const tx = ser.getElementsByTagName("c:tx")[0];
    if (!tx) return;
    const v = tx.getElementsByTagName("c:v")[0];
    if (v) v.textContent = name;
  }

  async function resolveDeckSlidePaths_(zip) {
    const presXml = await zip.file("ppt/presentation.xml").async("string");
    const presDoc = parseXml_(presXml);
    const relsXml = await zip.file("ppt/_rels/presentation.xml.rels").async("string");
    const relsDoc = parseXml_(relsXml);
    const relMap = {};
    Array.from(relsDoc.getElementsByTagName("Relationship")).forEach((r) => {
      relMap[r.getAttribute("Id")] = r.getAttribute("Target");
    });
    const sldIds = Array.from(presDoc.getElementsByTagName("p:sldId"));
    return sldIds.map((s) => "ppt/" + relMap[s.getAttribute("r:id")]);
  }
  async function getSlideChartPath_(zip, slidePath) {
    const parts = slidePath.split("/");
    const fname = parts.pop();
    const relsPath = parts.join("/") + "/_rels/" + fname + ".rels";
    const relsFile = zip.file(relsPath);
    if (!relsFile) return null;
    const relsDoc = parseXml_(await relsFile.async("string"));
    const rel = Array.from(relsDoc.getElementsByTagName("Relationship")).find((r) => (r.getAttribute("Type") || "").indexOf("/chart") !== -1);
    if (!rel) return null;
    return "ppt/" + rel.getAttribute("Target").replace(/^\.\.\//, "");
  }

  // ═══════════════════════════════ تعديل كل سلايد ═══════════════════════════════
  async function patchSlide_(zip, slidePath, patchFn) {
    const xml = await zip.file(slidePath).async("string");
    const doc = parseXml_(xml);
    await patchFn(doc);
    zip.file(slidePath, serializeXml_(doc));
  }
  async function patchChart_(zip, chartPath, patchFn) {
    if (!chartPath || !zip.file(chartPath)) return;
    const xml = await zip.file(chartPath).async("string");
    const doc = parseXml_(xml);
    patchFn(doc);
    zip.file(chartPath, serializeXml_(doc));
  }

  function loadScriptOnce_(src) {
    return new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = src;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error("load failed: " + src));
      document.head.appendChild(el);
    });
  }
  // تحميل التمبلت: (1) النسخة المضمّنة لو اتحمّلت قبل كده، (2) fetch لو الصفحة شغالة
  // على http/https، (3) وإلا تحميل report_template_data.js كـ<script> (بيشتغل حتى من file://)
  async function loadTemplateZip_() {
    if (window.__BALAGH_REPORT_TEMPLATE_B64__) {
      return JSZip.loadAsync(window.__BALAGH_REPORT_TEMPLATE_B64__, { base64: true });
    }
    if (location.protocol !== "file:") {
      try {
        const r = await fetch(`${TEMPLATE_URL}?v=${TEMPLATE_VERSION}`);
        if (r.ok) return JSZip.loadAsync(await r.arrayBuffer());
      } catch (_) { /* نكمّل على النسخة المضمّنة */ }
    }
    try {
      await loadScriptOnce_(`${TEMPLATE_DATA_JS}?v=${TEMPLATE_VERSION}`);
    } catch (_) { /* الرسالة تحت */ }
    if (window.__BALAGH_REPORT_TEMPLATE_B64__) {
      return JSZip.loadAsync(window.__BALAGH_REPORT_TEMPLATE_B64__, { base64: true });
    }
    throw new Error("تعذّر تحميل قالب التقرير — تأكد إن report_template.pptx و report_template_data.js موجودين جنب index.html");
  }

  async function buildReportZip_(data) {
    const zip = await loadTemplateZip_();
    const slides = await resolveDeckSlidePaths_(zip); // 16 مسار بترتيب العرض الفعلي

    // سلايد 1: العنوان (سطرين جوه نفس الفقرة، مفصولين بـ <a:br/>)
    await patchSlide_(zip, slides[0], (doc) => {
      setShapeBrSegments_(doc, 2, ["تقرير متابعة البلاغات", data.periodLabel]);
    });

    // سلايد 3: بلاغات الأمن والسلامة
    await patchSlide_(zip, slides[2], (doc) => {
      const kpiIds = [78, 80, 82, 84]; // من الأقل للأكبر (يمين→يسار = الأكبر أولاً)
      const sortedAsc = [...data.secGroupsSorted].reverse();
      sortedAsc.forEach((g, i) => {
        setShapeLines_(doc, kpiIds[i], [fmtNum_(g.total), `${g.group} (${pct1_(g.total, data.secTotal)}%)`]);
      });
      const sp = findShapeById_(doc, 86);
      const tbl = getTableInShape_(sp);
      if (tbl) {
        data.secGroupsSorted.forEach((g, rowIdx) => {
          const r = rowIdx + 1;
          setCell_(tbl, r, 0, `${fmtNum_(g.total)} (${pct1_(g.total, data.secTotal)}%)`);
          // النسبة جنب كل منطقة = نصيب المنطقة من إجمالي نفس التصنيف (مجموع الصف = 100%)
          setCell_(tbl, r, 1, cntPct_(g.byRegion.get("الطائف"), g.total));
          setCell_(tbl, r, 2, cntPct_(g.byRegion.get("المدينة المنورة"), g.total));
          setCell_(tbl, r, 3, cntPct_(g.byRegion.get("مكة المكرمة"), g.total));
          setCell_(tbl, r, 4, cntPct_(g.byRegion.get("جدة"), g.total));
          setCell_(tbl, r, 5, g.group);
        });
        setCell_(tbl, 5, 0, `${fmtNum_(data.secTotal)} (100%)`);
        // صف الإجمالي: نصيب كل منطقة من إجمالي بلاغات الأمن والسلامة
        setCell_(tbl, 5, 1, cntPct_(REGION_ORDER_SUM_(data.secGroupsSorted, "الطائف"), data.secTotal));
        setCell_(tbl, 5, 2, cntPct_(REGION_ORDER_SUM_(data.secGroupsSorted, "المدينة المنورة"), data.secTotal));
        setCell_(tbl, 5, 3, cntPct_(REGION_ORDER_SUM_(data.secGroupsSorted, "مكة المكرمة"), data.secTotal));
        setCell_(tbl, 5, 4, cntPct_(REGION_ORDER_SUM_(data.secGroupsSorted, "جدة"), data.secTotal));
        setCell_(tbl, 5, 5, "الإجمالي");
      }
    });

    // سلايد 4: نظرة عامة
    await patchSlide_(zip, slides[3], (doc) => {
      setShapeLines_(doc, 2, [`نظرة عامة على البلاغات - الفترة: ${data.periodLabel}`]);
      // البلاغات المعاد فتحها: مفيش لها داتا في الداشبورد — المستخدم بيكتبها لكل منطقة
      // في نافذة التنزيل (data.manual). لو مش متوفرة (استدعاء برمجي) بتتكتب "—".
      const reopenedMap = data.manual ? data.manual.reopenedByRegion : null;
      const reopenedOf = (region) => (reopenedMap && reopenedMap[region] != null ? reopenedMap[region] : null);
      const reopenedKnown = REGION_ORDER.every((r) => reopenedOf(r) !== null);
      const reopenedTotal = reopenedKnown ? REGION_ORDER.reduce((s, r) => s + reopenedOf(r), 0) : null;
      setShapeLines_(doc, 78, reopenedTotal === null
        ? ["—", "بلاغات أُعيد فتحها"]
        : [fmtNum_(reopenedTotal), `بلاغات أُعيد فتحها (${pct1_(reopenedTotal, data.overviewTotal)}%)`]);
      setShapeLines_(doc, 80, [fmtNum_(data.consultantApprovalRows.length), `قيد موافقة الاستشاري (${pct1_(data.consultantApprovalRows.length, data.overviewTotal)}%)`]);
      setShapeLines_(doc, 82, [data.buildingsTotal != null ? fmtNum_(data.buildingsTotal) : "—", "عدد المباني المدرسة"]);
      setShapeLines_(doc, 84, [fmtNum_(data.emergencyRows.length), `بلاغات طارئة (${pct1_(data.emergencyRows.length, data.overviewTotal)}%)`]);
      setShapeLines_(doc, 86, [fmtNum_(data.overviewTotal), "إجمالي البلاغات"]);
      const sp = findShapeById_(doc, 88);
      const tbl = getTableInShape_(sp);
      if (tbl) {
        data.overviewByRegion.forEach((x, i) => {
          const r = i + 1;
          setCell_(tbl, r, 0, `${pct1_(x.total, data.overviewTotal)}%`);
          // النسبة جنب "قيد موافقة الاستشاري" و"المعاد فتحها" = من إجمالي بلاغات المنطقة نفسها
          setCell_(tbl, r, 1, cntPct_(x.consultantApproval, x.total));
          setCell_(tbl, r, 2, reopenedOf(x.region) === null ? "—" : cntPct_(reopenedOf(x.region), x.total));
          setCell_(tbl, r, 3, fmtNum_(x.total));
          setCell_(tbl, r, 4, x.region);
        });
        setCell_(tbl, 5, 0, "100.0%");
        setCell_(tbl, 5, 1, cntPct_(data.consultantApprovalRows.length, data.overviewTotal));
        setCell_(tbl, 5, 2, reopenedTotal === null ? "—" : cntPct_(reopenedTotal, data.overviewTotal));
        setCell_(tbl, 5, 3, fmtNum_(data.overviewTotal));
        setCell_(tbl, 5, 4, "الإجمالي");
      }
    });

    // سلايد 5: توزيع المباني اللي عندها بلاغات
    await patchSlide_(zip, slides[4], (doc) => {});
    {
      const chartPath = await getSlideChartPath_(zip, slides[4]);
      const sortedB = [...data.buildingsByRegion].sort((a, b) => b.count - a.count);
      const totalB = sortedB.reduce((s, x) => s + x.count, 0);
      await patchChart_(zip, chartPath, (cdoc) => {
        setChartCategoriesValues_(cdoc, 0, sortedB.map((x) => x.region), sortedB.map((x) => x.count));
        // 🛠️ (إصلاح جوهري) الليبلات الظاهرة على كل عمود نص ثابت من التمبلت الأصلي —
        // لازم تُحدَّث صراحة، غير كده هتفضل عارضة أرقام التمبلت القديمة زي "1,097"
        // بغض النظر عن بيانات الفترة الفعلية (راجع تعليق setChartDataLabelTexts_)
        setChartDataLabelTexts_(cdoc, 0, sortedB.map((x) => `${fmtNum_(x.count)} (${pct1_(x.count, totalB)}%)`));
      });
    }

    // سلايد 6: مقارنة الأسبوعين
    await patchSlide_(zip, slides[5], (doc) => {
      setShapeLines_(doc, 2, [`مقارنة البلاغات - ${data.curShort} مقابل ${data.prevShort}`]);
      const sp = findShapeById_(doc, 80);
      const tbl = getTableInShape_(sp);
      if (tbl) {
        setCell_(tbl, 0, 1, data.curShort);
        setCell_(tbl, 0, 2, data.prevShort);
        let totCur = 0, totPrev = 0;
        data.weekCompareByRegion.forEach((x, i) => {
          const r = i + 1;
          const diffPct = x.previous > 0 ? (((x.current - x.previous) / x.previous) * 100).toFixed(1) : (x.current > 0 ? "100.0" : "0.0");
          setCell_(tbl, r, 0, `${diffPct}%`);
          setCell_(tbl, r, 1, fmtNum_(x.current));
          setCell_(tbl, r, 2, fmtNum_(x.previous));
          setCell_(tbl, r, 3, x.region);
          totCur += x.current; totPrev += x.previous;
        });
        const totDiffPct = totPrev > 0 ? (((totCur - totPrev) / totPrev) * 100).toFixed(1) : "0.0";
        setCell_(tbl, 5, 0, `${totDiffPct}%`);
        setCell_(tbl, 5, 1, fmtNum_(totCur));
        setCell_(tbl, 5, 2, fmtNum_(totPrev));
        setCell_(tbl, 5, 3, "الإجمالي");
      }
    });
    {
      const chartPath = await getSlideChartPath_(zip, slides[5]);
      await patchChart_(zip, chartPath, (cdoc) => {
        const cats = data.weekCompareByRegion.map((x) => x.region);
        setSeriesName_(cdoc, 0, data.prevShort);
        setSeriesName_(cdoc, 1, data.curShort);
        setChartCategoriesValues_(cdoc, 0, cats, data.weekCompareByRegion.map((x) => x.previous));
        setChartCategoriesValues_(cdoc, 1, cats, data.weekCompareByRegion.map((x) => x.current));
      });
    }

    // سلايد 7: الأولوية (روتيني/طارئ)
    await patchSlide_(zip, slides[6], (doc) => {
      const sp = findShapeById_(doc, 80);
      const tbl = getTableInShape_(sp);
      if (tbl) {
        let totE = 0, totR = 0;
        data.priorityByRegion.forEach((x, i) => {
          const r = i + 1;
          // النسبة = من إجمالي بلاغات المنطقة (روتيني + طارئ = 100%)
          setCell_(tbl, r, 0, cntPct_(x.emergency, x.emergency + x.routine));
          setCell_(tbl, r, 1, cntPct_(x.routine, x.emergency + x.routine));
          setCell_(tbl, r, 2, x.region);
          totE += x.emergency; totR += x.routine;
        });
        setCell_(tbl, 5, 0, cntPct_(totE, totE + totR));
        setCell_(tbl, 5, 1, cntPct_(totR, totE + totR));
        setCell_(tbl, 5, 2, "الإجمالي");
      }
    });
    {
      const chartPath = await getSlideChartPath_(zip, slides[6]);
      await patchChart_(zip, chartPath, (cdoc) => {
        setChartCategoriesValues_(cdoc, 0, data.priorityByRegion.map((x) => x.region), data.priorityByRegion.map((x) => x.pct));
      });
    }

    // سلايد 8: الالتزام بـ SLA
    // (طلب صريح 2026-09-26) تشارت "المقاول (BMC) مقابل الاستشاري": النسبتين بيكتبهم
    // المستخدم في نافذة التنزيل، والفجوة = الكبير − الصغير. القسم الأول (عدد البلاغات
    // ضمن/متجاوزة SLA) فاضل محسوب من البيانات زي ما هو.
    const slaContractor = data.manual && data.manual.slaContractor != null ? data.manual.slaContractor : data.compliancePct;
    const slaConsultant = data.manual && data.manual.slaConsultant != null ? data.manual.slaConsultant : data.compliancePct;
    const slaGap = Math.abs(slaContractor - slaConsultant);
    await patchSlide_(zip, slides[7], (doc) => {
      setShapeLines_(doc, 79, [fmtNum_(data.overdueCount), `بلاغات تجاوزت ال SLA  من اجمالي البلاغات بنسبة ${data.breachPct.toFixed(1)}%`]);
      setShapeLines_(doc, 81, [fmtNum_(data.compliantCount), `بلاغات ضمنSLA  من اجمالي البلاغات بنسبة ${data.compliancePct.toFixed(1)}%`]);
      setShapeLines_(doc, 86, [`%${slaGap.toFixed(1)}`, "الفجوة"]);
    });
    {
      const chartPath = await getSlideChartPath_(zip, slides[7]);
      await patchChart_(zip, chartPath, (cdoc) => {
        // ترتيب التمبلت: النقطة 0 = المقاول (يمين)، النقطة 1 = الاستشاري (يسار)
        setChartCategoriesValues_(cdoc, 0, ["المقاول (BMC)", "الاستشاري"], [slaContractor.toFixed(1), slaConsultant.toFixed(1)]);
      });
    }

    // سلايد 9: قيد موافقة الاستشاري
    await patchSlide_(zip, slides[8], (doc) => {
      const sp = findShapeById_(doc, 80);
      const tbl = getTableInShape_(sp);
      if (tbl) {
        // ⚠️ (تصحيح) النسبة = من إجمالي بلاغات المنطقة نفسها — نفس تعريف التقرير الأصلي
        // (جدة 183 من 13,719 = 1.3%). قبل كده كانت بتتحسب من إجمالي كل المناطق بالغلط.
        const regionTotalOf = new Map(data.overviewByRegion.map((o) => [o.region, o.total]));
        let tot = 0;
        data.consultantByRegion.forEach((x, i) => {
          const r = i + 1;
          setCell_(tbl, r, 0, `${pct1_(x.count, regionTotalOf.get(x.region) || 0)}%`);
          setCell_(tbl, r, 1, fmtNum_(x.count));
          setCell_(tbl, r, 2, x.region);
          tot += x.count;
        });
        setCell_(tbl, 5, 0, `${pct1_(tot, data.overviewTotal)}%`);
        setCell_(tbl, 5, 1, fmtNum_(tot));
        setCell_(tbl, 5, 2, "الإجمالي");
      }
    });
    {
      const chartPath = await getSlideChartPath_(zip, slides[8]);
      await patchChart_(zip, chartPath, (cdoc) => {
        setChartCategoriesValues_(cdoc, 0, data.consultantByRegion.map((x) => x.region), data.consultantByRegion.map((x) => x.count));
      });
    }

    // سلايد 10: بلاغات النظافة حسب المنطقة
    await patchSlide_(zip, slides[9], (doc) => {
      const sp = findShapeById_(doc, 80);
      const tbl = getTableInShape_(sp);
      if (tbl) {
        let tot = 0;
        data.cleaningByRegion.forEach((x, i) => {
          const r = i + 1;
          setCell_(tbl, r, 0, `${pct1_(x.count, data.cleaningTotal)}%`);
          setCell_(tbl, r, 1, fmtNum_(x.count));
          setCell_(tbl, r, 2, x.region);
          tot += x.count;
        });
        setCell_(tbl, 5, 0, "100%");
        setCell_(tbl, 5, 1, fmtNum_(tot));
        setCell_(tbl, 5, 2, "الإجمالي");
      }
    });
    {
      const chartPath = await getSlideChartPath_(zip, slides[9]);
      await patchChart_(zip, chartPath, (cdoc) => {
        setChartCategoriesValues_(cdoc, 0, data.cleaningByRegion.map((x) => x.region), data.cleaningByRegion.map((x) => x.count));
      });
    }

    // سلايد 11: توزيع بلاغات النظافة على المقاولين
    // تمبلت الجدول (5 أعمدة، من الشمال لليمين): النسبة داخل المنطقة | عدد البلاغات |
    // المقاول | المحافظات | المنطقة — وصفوفه: هيدر، نمط صف أبيض، نمط صف أخضر فاتح، إجمالي.
    // وقت التشغيل: صف لكل (منطقة × مقاول)، خلية المنطقة مدموجة رأسيًا لكل صفوف نفس
    // المنطقة، ولون الخلفية بيتبادل لكل منطقة (مش لكل صف) عشان المجموعات تبان واضحة.
    await patchSlide_(zip, slides[10], (doc) => {
      const sp = findShapeById_(doc, 78);
      const tbl = getTableInShape_(sp);
      if (!tbl) return;
      const rowsData = data.cleaningContractorRows;
      const cols = tbl.getElementsByTagName("a:gridCol").length;
      const trs = Array.from(tbl.getElementsByTagName("a:tr"));
      const setText = (tr, idx, text) => {
        const tcs = Array.from(tr.getElementsByTagName("a:tc"));
        const p = tcs[idx] && tcs[idx].getElementsByTagName("a:p")[0];
        if (p) setParagraphText_(p, String(text));
      };
      const setRowId = (tr, id) => {
        const rid = tr.getElementsByTagName("a16:rowId")[0];
        if (rid) rid.setAttribute("val", String(id));
      };

      if (cols === 5 && trs.length >= 4) {
        const patA = trs[1].cloneNode(true);
        const patB = trs[2].cloneNode(true);
        const totalRow = trs[trs.length - 1].cloneNode(true);
        const headerH = Number(trs[0].getAttribute("h")) || 438994;
        const totalH = Number(totalRow.getAttribute("h")) || 438994;
        trs.slice(1).forEach((r) => r.parentNode.removeChild(r));
        // ارتفاع الصفوف: نملأ نفس مساحة جداول باقي السلايدات (4,389,948 EMU)، بحد
        // أدنى وأقصى عشان الجدول مايبقاش مضغوط ولا مفروط
        const AREA = 4389948;
        const n = Math.max(rowsData.length, 1);
        const rowH = Math.max(300000, Math.min(520000, Math.floor((AREA - headerH - totalH) / n)));
        let group = -1;
        let prevRegion = null;
        const built = [];
        rowsData.forEach((rd, i) => {
          if (rd.region !== prevRegion) { group++; prevRegion = rd.region; }
          const tr = (group % 2 === 0 ? patA : patB).cloneNode(true);
          tr.setAttribute("h", String(rowH));
          setRowId(tr, 10001 + i);
          setText(tr, 0, `${rd.pct}%`);
          setText(tr, 1, fmtNum_(rd.count));
          setText(tr, 2, rd.contractor);
          setText(tr, 3, rd.governorates);
          setText(tr, 4, rd.region);
          tbl.appendChild(tr);
          built.push({ tr, region: rd.region });
        });
        // دمج خلية "المنطقة" رأسيًا لكل صفوف نفس المنطقة (rowSpan + vMerge)
        for (let i = 0; i < built.length; ) {
          let j = i;
          while (j + 1 < built.length && built[j + 1].region === built[i].region) j++;
          const span = j - i + 1;
          if (span > 1) {
            const first = Array.from(built[i].tr.getElementsByTagName("a:tc"))[4];
            first.setAttribute("rowSpan", String(span));
            for (let k = i + 1; k <= j; k++) {
              const cell = Array.from(built[k].tr.getElementsByTagName("a:tc"))[4];
              cell.setAttribute("vMerge", "1");
              const p = cell.getElementsByTagName("a:p")[0];
              if (p) setParagraphText_(p, "");
            }
          }
          i = j + 1;
        }
        // صف الإجمالي
        const total = rowsData.reduce((s, r) => s + r.count, 0);
        totalRow.setAttribute("h", String(totalH));
        setRowId(totalRow, 10001 + rowsData.length);
        setText(totalRow, 0, total > 0 ? "100.0%" : "0.0%");
        setText(totalRow, 1, fmtNum_(total));
        setText(totalRow, 2, `عدد المقاولين: ${new Set(rowsData.filter((r) => r.count > 0).map((r) => r.contractor)).size}`);
        setText(totalRow, 3, "");
        setText(totalRow, 4, "الإجمالي");
        tbl.appendChild(totalRow);
        // ارتفاع إطار الجدول = مجموع الصفوف الفعلي
        const ext = sp.getElementsByTagName("a:ext");
        for (const e of Array.from(ext)) {
          if (e.getAttribute("cx") && e.getAttribute("cy")) {
            e.setAttribute("cy", String(headerH + totalH + rowH * rowsData.length));
            break;
          }
        }
      } else {
        // احتياطي: تمبلت قديم (4 أعمدة) — المحافظات بين قوسين جنب المنطقة
        const rowsLegacy = rowsData.slice(0, 9);
        setDynamicDataRows_(tbl, rowsLegacy, () => {});
        const trs2 = tbl.getElementsByTagName("a:tr");
        rowsLegacy.forEach((rd, i) => {
          const tr = trs2[i + 1];
          if (!tr) return;
          setRowId(tr, 10001 + i);
          setText(tr, 0, `${rd.pct}%`);
          setText(tr, 1, fmtNum_(rd.count));
          setText(tr, 2, rd.contractor);
          setText(tr, 3, rd.governorates && rd.governorates !== rd.region ? `${rd.region} (${rd.governorates})` : rd.region);
        });
      }
    });

    // سلايد 12-15: أعلى 10 مدارس لكل منطقة
    const schoolSlideRegions = ["جدة", "مكة المكرمة", "المدينة المنورة", "الطائف"];
    for (let i = 0; i < schoolSlideRegions.length; i++) {
      const region = schoolSlideRegions[i];
      await patchSlide_(zip, slides[11 + i], (doc) => {
        const sp = findShapeById_(doc, 78);
        const tbl = getTableInShape_(sp);
        if (!tbl) return;
        const trs = tbl.getElementsByTagName("a:tr");
        const list = data.topSchoolsByRegion[region] || [];
        const regionTotal = (data.overviewByRegion.find((o) => o.region === region) || { total: 0 }).total;
        for (let rIdx = 0; rIdx < 10; rIdx++) {
          const tr = trs[rIdx + 1];
          if (!tr) continue;
          const tcs = tr.getElementsByTagName("a:tc");
          const setTc = (idx, text) => {
            const p = tcs[idx] && tcs[idx].getElementsByTagName("a:p")[0];
            if (p) setParagraphText_(p, String(text));
          };
          const s = list[rIdx];
          if (s) {
            // "منها طارئة" = نسبة من بلاغات المدرسة نفسها، "عدد البلاغات" = نسبة من بلاغات المنطقة
            setTc(0, cntPct_(s.emergency, s.count));
            setTc(1, cntPct_(s.count, regionTotal));
            setTc(2, s.name);
            setTc(3, s.minId);
            setTc(4, String(rIdx + 1));
          } else {
            setTc(0, "0"); setTc(1, "0"); setTc(2, "—"); setTc(3, "—"); setTc(4, String(rIdx + 1));
          }
        }
      });
    }

    return zip;
  }

  function REGION_ORDER_SUM_(groups, region) {
    return groups.reduce((s, g) => s + (g.byRegion.get(region) || 0), 0);
  }

  async function downloadReportPptx_(zip, data) {
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = `${data.curStart.getFullYear()}-${String(data.curStart.getMonth() + 1).padStart(2, "0")}-${String(data.curStart.getDate()).padStart(2, "0")}`;
    a.download = `تقرير_متابعة_البلاغات_${stamp}.pptx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  // ── الأرقام اليدوية اللي المستخدم بيكتبها في نافذة التنزيل (مفيش لها مصدر في
  // الداشبورد): نسبة التزام المقاول والاستشاري بـSLA (لتشارت المقارنة + الفجوة)،
  // وعدد البلاغات المعاد فتحها لكل منطقة. بنطبّعها هنا لشكل ثابت؛ لو مش متوفرة
  // (استدعاء برمجي من غير النافذة) بترجع null وكل سلايد بيتعامل معاها بأمان.
  function normalizeManual_(manual) {
    if (!manual || typeof manual !== "object") return null;
    const num = (v) => (v === null || v === undefined || v === "" || !isFinite(Number(v)) ? null : Number(v));
    const reopened = {};
    REGION_ORDER.forEach((r) => {
      const v = manual.reopenedByRegion ? num(manual.reopenedByRegion[r]) : null;
      reopened[r] = v === null ? null : Math.max(0, Math.round(v));
    });
    return {
      slaContractor: num(manual.slaContractor),
      slaConsultant: num(manual.slaConsultant),
      reopenedByRegion: reopened,
    };
  }

  // periodDays: 7 أو 14 — manual: {slaContractor, slaConsultant, reopenedByRegion:{جدة:..}}
  window.generateBalaghReportPptx = async function generateBalaghReportPptx(periodDays, manual) {
    if (typeof JSZip === "undefined") {
      throw new Error("مكتبة JSZip لم تُحمَّل بعد — تأكد من اتصال الإنترنت وأعد المحاولة");
    }
    const data = computeReportData(periodDays);
    data.manual = normalizeManual_(manual);
    const zip = await buildReportZip_(data);
    await downloadReportPptx_(zip, data);
    return data;
  };
  window.__balaghReportComputeData_ = computeReportData; // للاختبار فقط

  // ═══════════════ نافذة التنزيل: الفترة + الأرقام اليدوية + كلمة المرور ═══════════════
  // (طلب صريح) الزرار لازم "يبقى بباسورد" قبل التنزيل، ويدّي اختيار بين "آخر أسبوع
  // فقط" و"آخر أسبوعين". (طلب صريح 2026-09-26) في نفس النافذة: خانات يكتب فيها
  // المستخدم نسبة التزام المقاول والاستشاري بـSLA (الفجوة = الكبير − الصغير)، وعدد
  // البلاغات المعاد فتحها لكل منطقة — كلها إجبارية (الصفر مسموح) عشان التقرير ما
  // يطلعش بأرقام ناقصة. نافذة بعناصر DOM عادية من غير أي مكتبة خارجية؛ بترجع
  // Promise<{password, periodDays, manual} | null> (null = المستخدم ألغى).

  // تحويل أي رقم مكتوب (أرقام عربية ٠-٩ / فارسية ۰-۹، فاصلة عشرية "٫" أو ","، علامة %)
  // لرقم عادي. بيرجع null لو النص مش رقم صالح.
  function parseUserNumber_(raw) {
    let t = String(raw == null ? "" : raw).trim();
    if (!t) return null;
    t = t
      .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
      .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
      .replace(/[٫,]/g, ".")
      .replace(/[%٪\s]/g, "");
    if (!/^\d+(\.\d+)?$/.test(t)) return null;
    return Number(t);
  }

  function openReportOptionsModal_() {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.id = "balagh-report-modal-overlay";
      overlay.style.cssText =
        "position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:inherit;padding:12px;box-sizing:border-box";
      const card = document.createElement("div");
      card.style.cssText =
        "background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.3);padding:20px 22px;width:430px;max-width:100%;max-height:100%;overflow:auto;direction:rtl;text-align:right;box-sizing:border-box";
      const secTitle = "font-size:12px;font-weight:800;color:#334155;margin-bottom:6px";
      const inputCss = "width:100%;box-sizing:border-box;border:1.5px solid #CBD5E1;border-radius:9px;padding:7px 9px;font-size:13px;font-family:inherit;direction:ltr;text-align:center";
      const lblCss = "display:block;font-size:11.5px;font-weight:700;color:#475569;margin-bottom:4px";
      const errCss = "min-height:14px;font-size:10.5px;font-weight:700;color:#DC2626;margin-top:3px";
      const box = "border:1px solid #E2E8F0;border-radius:12px;padding:10px 12px;margin-bottom:12px;background:#F8FAFC";
      const reopenInputs = REGION_ORDER.map((r, i) => `
            <div>
              <label for="balagh-report-reopen-${i}" style="${lblCss}">${r}</label>
              <input type="text" inputmode="numeric" id="balagh-report-reopen-${i}" data-region="${r}" style="${inputCss}" placeholder="العدد" autocomplete="off">
              <div data-err="reopen-${i}" style="${errCss}"></div>
            </div>`).join("");
      card.innerHTML = `
        <div style="font-size:15px;font-weight:900;color:#1E293B;margin-bottom:4px">📄 تنزيل تقرير PowerPoint</div>
        <div style="font-size:11.5px;color:#64748B;margin-bottom:12px">اختر الفترة، اكتب الأرقام اليدوية، ثم أدخل كلمة المرور للمتابعة</div>

        <div style="${secTitle}">فترة التقرير</div>
        <div style="display:flex;gap:16px;margin-bottom:4px">
          <label style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:#334155;cursor:pointer">
            <input type="radio" name="balagh-report-period" value="7" checked style="accent-color:#7C3AED"> آخر أسبوع فقط
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:#334155;cursor:pointer">
            <input type="radio" name="balagh-report-period" value="14" style="accent-color:#7C3AED"> آخر أسبوعين
          </label>
        </div>
        <div id="balagh-report-period-hint" style="font-size:11px;color:#7C3AED;font-weight:700;margin-bottom:12px;min-height:14px"></div>

        <div style="${box}">
          <div style="${secTitle}">نسبة الالتزام بـSLA — لتشارت "المقاول (BMC) مقابل الاستشاري"</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div>
              <label for="balagh-report-sla-contractor" style="${lblCss}">نسبة المقاول (BMC) %</label>
              <input type="text" inputmode="decimal" id="balagh-report-sla-contractor" style="${inputCss}" placeholder="مثال: 82.5" autocomplete="off">
              <div data-err="sla-contractor" style="${errCss}"></div>
            </div>
            <div>
              <label for="balagh-report-sla-consultant" style="${lblCss}">نسبة الاستشاري %</label>
              <input type="text" inputmode="decimal" id="balagh-report-sla-consultant" style="${inputCss}" placeholder="مثال: 74" autocomplete="off">
              <div data-err="sla-consultant" style="${errCss}"></div>
            </div>
          </div>
          <div id="balagh-report-sla-hint" style="font-size:10.5px;color:#64748B;margin-top:2px;min-height:13px"></div>
          <div id="balagh-report-gap-preview" style="font-size:12px;font-weight:800;color:#0F766E;margin-top:4px;min-height:16px"></div>
        </div>

        <div style="${box}">
          <div style="${secTitle}">عدد البلاغات المعاد فتحها — لكل منطقة</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 10px">${reopenInputs}
          </div>
          <div id="balagh-report-reopen-total" style="font-size:12px;font-weight:800;color:#0F766E;margin-top:2px;min-height:16px"></div>
        </div>

        <div style="${secTitle}">كلمة المرور</div>
        <input type="password" id="balagh-report-pw-input" style="width:100%;box-sizing:border-box;border:1.5px solid #CBD5E1;border-radius:9px;padding:8px 10px;font-size:13px;font-family:inherit;margin-bottom:4px" placeholder="********" autocomplete="off">
        <div id="balagh-report-pw-err" style="min-height:16px;font-size:11px;font-weight:700;color:#DC2626;margin-bottom:4px"></div>
        <div style="display:flex;gap:8px;margin-top:6px">
          <button type="button" id="balagh-report-modal-cancel" style="flex:1;padding:8px 0;border-radius:9px;border:1px solid #CBD5E1;background:#F8FAFC;color:#475569;font-weight:800;font-size:12.5px;cursor:pointer;font-family:inherit">إلغاء</button>
          <button type="button" id="balagh-report-modal-ok" style="flex:1;padding:8px 0;border-radius:9px;border:1px solid #7C3AED;background:#7C3AED;color:#fff;font-weight:800;font-size:12.5px;cursor:pointer;font-family:inherit">تنزيل</button>
        </div>
      `;
      overlay.appendChild(card);
      document.body.appendChild(overlay);

      const $ = (sel) => card.querySelector(sel);
      const pwInput = $("#balagh-report-pw-input");
      const pwErrEl = $("#balagh-report-pw-err");
      const slaC = $("#balagh-report-sla-contractor");
      const slaK = $("#balagh-report-sla-consultant");
      const reopenEls = REGION_ORDER.map((_, i) => $(`#balagh-report-reopen-${i}`));
      const periodDaysNow = () => {
        const el = card.querySelector('input[name="balagh-report-period"]:checked');
        return el && el.value === "14" ? 14 : 7;
      };
      const setErr = (key, msg, inputEl) => {
        const e = card.querySelector(`[data-err="${key}"]`);
        if (e) e.textContent = msg || "";
        if (inputEl) inputEl.style.borderColor = msg ? "#DC2626" : "#CBD5E1";
      };

      // ── تلميحات (اختيارية، للمساعدة بس): الفترة الفعلية + نسبة الالتزام المحسوبة من
      // البيانات للفترة المختارة. بتتحسب مرة لكل فترة وتتخزن؛ أي خطأ = من غير تلميح ──
      const hintCache = {};
      function refreshHints() {
        const pd = periodDaysNow();
        const apply = (d) => {
          $("#balagh-report-period-hint").textContent = d ? `الفترة: ${d.periodLabel}` : "";
          $("#balagh-report-sla-hint").textContent = d
            ? `للاسترشاد: نسبة الالتزام المحسوبة من بيانات الفترة = ${d.compliancePct.toFixed(1)}%`
            : "";
        };
        if (hintCache[pd] !== undefined) return apply(hintCache[pd]);
        setTimeout(() => {
          try { hintCache[pd] = computeReportData(pd); } catch (_) { hintCache[pd] = null; }
          if (periodDaysNow() === pd) apply(hintCache[pd]);
        }, 0);
      }
      function refreshGap() {
        const a = parseUserNumber_(slaC.value);
        const b = parseUserNumber_(slaK.value);
        $("#balagh-report-gap-preview").textContent =
          a !== null && b !== null && a <= 100 && b <= 100 ? `الفجوة = ${Math.abs(a - b).toFixed(1)}%` : "";
      }
      function refreshReopenTotal() {
        const vals = reopenEls.map((el) => parseUserNumber_(el.value));
        const ok = vals.every((v) => v !== null && Number.isInteger(v));
        $("#balagh-report-reopen-total").textContent = ok
          ? `الإجمالي = ${vals.reduce((s, v) => s + v, 0).toLocaleString("en-US")}`
          : "";
      }

      function cleanup(result) {
        document.removeEventListener("keydown", onKeydown);
        overlay.remove();
        resolve(result);
      }
      function submit() {
        let firstBad = null;
        const mark = (el) => { if (!firstBad) firstBad = el; };
        // نسب SLA: إجبارية، من 0 لـ 100
        const slaVals = [
          [slaC, "sla-contractor"],
          [slaK, "sla-consultant"],
        ].map(([el, key]) => {
          const v = parseUserNumber_(el.value);
          if (!String(el.value).trim()) { setErr(key, "مطلوب", el); mark(el); return null; }
          if (v === null || v > 100) { setErr(key, "اكتب رقم من 0 لـ 100", el); mark(el); return null; }
          setErr(key, "", el);
          return v;
        });
        // البلاغات المعاد فتحها: إجبارية، عدد صحيح ≥ 0
        const reopenedByRegion = {};
        reopenEls.forEach((el, i) => {
          const key = `reopen-${i}`;
          const v = parseUserNumber_(el.value);
          if (!String(el.value).trim()) { setErr(key, "مطلوب (اكتب 0 لو مفيش)", el); mark(el); return; }
          if (v === null || !Number.isInteger(v)) { setErr(key, "اكتب عدد صحيح", el); mark(el); return; }
          setErr(key, "", el);
          reopenedByRegion[REGION_ORDER[i]] = v;
        });
        // كلمة المرور
        const pw = pwInput.value;
        if (pw !== REPORT_DOWNLOAD_PASSWORD) {
          pwErrEl.textContent = "❌ كلمة المرور غير صحيحة";
          pwInput.style.borderColor = "#DC2626";
          mark(pwInput);
        }
        if (firstBad) {
          firstBad.focus();
          if (firstBad.select) firstBad.select();
          return;
        }
        cleanup({
          password: pw,
          periodDays: periodDaysNow(),
          manual: { slaContractor: slaVals[0], slaConsultant: slaVals[1], reopenedByRegion },
        });
      }
      function onKeydown(e) {
        if (e.key === "Escape") { e.preventDefault(); cleanup(null); }
        else if (e.key === "Enter") { e.preventDefault(); submit(); }
      }
      $("#balagh-report-modal-ok").addEventListener("click", submit);
      $("#balagh-report-modal-cancel").addEventListener("click", () => cleanup(null));
      overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) cleanup(null); });
      document.addEventListener("keydown", onKeydown);
      card.querySelectorAll('input[name="balagh-report-period"]').forEach((r) => r.addEventListener("change", refreshHints));
      [slaC, slaK].forEach((el, i) => el.addEventListener("input", () => {
        setErr(i === 0 ? "sla-contractor" : "sla-consultant", "", el);
        refreshGap();
      }));
      reopenEls.forEach((el, i) => el.addEventListener("input", () => {
        setErr(`reopen-${i}`, "", el);
        refreshReopenTotal();
      }));
      pwInput.addEventListener("input", () => {
        pwErrEl.textContent = "";
        pwInput.style.borderColor = "#CBD5E1";
      });
      slaC.focus();
      refreshHints();
    });
  }
  window.__balaghReportOpenModal_ = openReportOptionsModal_; // للاختبار فقط

  window.__balaghReportButtonClick_ = async function (btn) {
    const statusEl = document.getElementById("balagh-report-status");
    const choice = await openReportOptionsModal_();
    if (!choice) return; // المستخدم ألغى من نافذة كلمة المرور/الفترة
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.style.cursor = "default";
    btn.style.opacity = "0.7";
    btn.innerHTML = "⏳ جارٍ تجهيز التقرير…";
    if (statusEl) { statusEl.textContent = ""; statusEl.style.color = ""; }
    try {
      const data = await window.generateBalaghReportPptx(choice.periodDays, choice.manual);
      if (statusEl) {
        statusEl.style.color = "#059669";
        statusEl.textContent = `✅ تم تنزيل التقرير — الفترة: ${data.periodLabel}`;
      }
    } catch (e) {
      console.error("[balagh report]", e);
      if (statusEl) {
        statusEl.style.color = "#DC2626";
        statusEl.textContent = "❌ " + (e && e.message ? e.message : "تعذّر توليد التقرير");
      }
    } finally {
      btn.disabled = false;
      btn.style.cursor = "pointer";
      btn.style.opacity = "1";
      btn.innerHTML = originalHtml;
    }
  };
})();
