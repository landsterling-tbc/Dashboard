/* report_generator.js — توليد تقرير PowerPoint (نفس تمبلت "_تقرير_متابعة_البلاغات") من بيانات
   تبويب البلاغات الحيّة. بيشتغل بالكامل جوه المتصفح (بدون سيرفر): بيجيب report_template.pptx
   الثابت، يعدّل نصوص/جداول/تشارتات سلايدات محددة بأرقام الفترة الحالية، وينزّل ملف .pptx.
   الشعارات/الألوان/التخطيط زي ما هي بالظبط — الملف الأصلي مش بيتلمس غير في القيم. */

(function () {
  "use strict";

  const TEMPLATE_URL = "report_template.pptx";
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
  // ⚠️ (طلب صريح) "طارئ" = الأولوية "حرج/Critical" فقط. "روتيني" = أي حاجة تانية
  // (متوسط/مرتفع/منخفض...إلخ) — مختلف عن window.isHighRiskPriority العام المستخدم في
  // باقي الداشبورد (اللي بيحسب حرج+مرتفع سوا)، خصيصًا لتعريف روتيني/طارئ في هذا التقرير.
  function isEmergencyPriority_(p) {
    const v = norm_(p).toLowerCase();
    return v === "حرج" || v === "critical";
  }

  // ── الأسبوع (السبت → الجمعة) — نفس منطق balaghWeekStart_ المستخدم فعليًا في renderBalaghTab ──
  function weekStart_(d) {
    const back = (d.getDay() - 6 + 7) % 7;
    const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    s.setDate(s.getDate() - back);
    return s;
  }
  function endOfDay_(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  }
  // حدود الفترة: 7 أيام (أسبوع واحد، مربوط على السبت) أو 14 يوم (أسبوعين متتاليين)
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

    // 🧹 (طلب صريح) مقاول النظافة "الثابت" لكل محافظة خام (location) — بيُحسب من
    // كل البلاغات على مر الزمن (all)، مش بس فترة التقرير، لأن العلاقة محافظة↔مقاول
    // علاقة ثابتة (نفس منطق cleaningKnownContractorByLocation_ في dashboard.js/
    // renderBalaghTab). بنستخدمها في (أ) تعبئة "المقاول" لأي بلاغ نظافة الخانة
    // بتاعته فاضية و(ب) تحديد مقاول كل محافظة المعروض في سلايد 11.
    const cleaningRowsAll_ = all.filter((r) => CLEANING_CATEGORY_VALUES.includes(norm_(r.category)));
    const cleaningContractorByLocationAll_ = new Map(); // location -> Map(contractor -> count)
    cleaningRowsAll_.forEach((r) => {
      const loc = norm_(r.location);
      const c = norm_(r.contractor);
      if (!loc || !c) return;
      if (!cleaningContractorByLocationAll_.has(loc)) cleaningContractorByLocationAll_.set(loc, new Map());
      const m = cleaningContractorByLocationAll_.get(loc);
      m.set(c, (m.get(c) || 0) + 1);
    });
    const cleaningKnownContractorByLocation_ = new Map(); // location -> المقاول الأكثر تكرارًا (الثابت/المعروف)
    cleaningContractorByLocationAll_.forEach((m, loc) => {
      const entries = [...m.entries()].sort((a, b) => b[1] - a[1]);
      cleaningKnownContractorByLocation_.set(loc, entries[0][0]);
    });
    const CLEANING_UNKNOWN_CONTRACTOR_ = "غير محدد";
    function cleaningLocContractor_(loc) {
      return cleaningKnownContractorByLocation_.get(loc) || CLEANING_UNKNOWN_CONTRACTOR_;
    }

    // ── تجميع بلاغات النظافة الخاصة بفترة التقرير حسب المحافظة الخام (location) ──
    const cleaningByLocationPeriod_ = new Map(); // location -> count
    cleaningRows.forEach((r) => {
      const loc = norm_(r.location) || norm_(r.region);
      if (!loc) return;
      cleaningByLocationPeriod_.set(loc, (cleaningByLocationPeriod_.get(loc) || 0) + 1);
    });

    // ── بناء صفوف سلايد 11: صف رئيسي لكل منطقة (المحافظة الرئيسية + أي محافظة فرعية
    // بنفس المقاول) + صف إضافي بين قوسين لكل مجموعة محافظات فرعية ليها نفس المقاول
    // المختلف عن المحافظة الرئيسية. (طلب صريح: "لو المجال هو السائد في جدة يبقي
    // فعلًا كل جدة المجال، لكن لو محافظة فرعية زي القنفذة ليها مقاول مختلف عن مكة
    // المكرمة، بنكتب مكة مرتين وتحت التانية بين قوسين القنفذة لأن المقاول مختلف").
    // ⚠️ (تحسين بعد فحص بيانات حقيقية فعلية) لو أكتر من محافظة فرعية في نفس المنطقة
    // بيشتركوا في نفس المقاول البديل (مثال حقيقي وجدته: ينبع والعلا في المدينة
    // المنورة، الاتنين "Samt")، بندمجهم في صف واحد "المدينة المنورة (ينبع، العلا)"
    // بدل ما نكررهم في صفين منفصلين بنفس المقاول — أوضح للقارئ ومطابق لروح الطلب.
    const cleaningContractorRows = [];
    REGION_ORDER.forEach((region) => {
      const primaryLoc = PRIMARY_LOCATION_BY_REGION[region] || region;
      const subLocs = SUB_LOCATIONS_BY_REGION[region] || [];
      const locEntries = [primaryLoc, ...subLocs]
        .map((loc) => ({ loc, count: cleaningByLocationPeriod_.get(loc) || 0, contractor: cleaningLocContractor_(loc) }))
        .filter((x) => x.count > 0);
      if (!locEntries.length) return; // لا بلاغات نظافة في المنطقة دي خلال الفترة

      const regionTotal = locEntries.reduce((s, x) => s + x.count, 0);

      // نجمع المحافظات (رئيسية + فرعية) حسب المقاول الفعلي — كل مجموعة بمقاول
      // واحد هتطلع كصف واحد لاحقًا
      const byContractor = new Map(); // contractor -> { locs:[...], count }
      locEntries.forEach((x) => {
        if (!byContractor.has(x.contractor)) byContractor.set(x.contractor, { locs: [], count: 0 });
        const g = byContractor.get(x.contractor);
        g.locs.push(x.loc);
        g.count += x.count;
      });

      // مقاول "المنطقة" الأساسي: مقاول المحافظة الرئيسية لو عندها بلاغات في الفترة،
      // وإلا أكبر مجموعة (الأكثر بلاغات) بتاخد دور المحافظة الرئيسية مؤقتًا
      const primaryEntry = locEntries.find((x) => x.loc === primaryLoc);
      const mainContractor = primaryEntry
        ? primaryEntry.contractor
        : [...byContractor.entries()].sort((a, b) => b[1].count - a[1].count)[0][0];
      const mainGroup = byContractor.get(mainContractor);

      cleaningContractorRows.push({ region, contractor: mainContractor, count: mainGroup.count, pct: pct1_(mainGroup.count, regionTotal) });
      [...byContractor.entries()]
        .filter(([contractor]) => contractor !== mainContractor)
        .sort((a, b) => b[1].count - a[1].count)
        .forEach(([contractor, g]) => {
          cleaningContractorRows.push({
            region: `${region} (${g.locs.join("، ")})`,
            contractor,
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

  async function buildReportZip_(data) {
    const buf = await fetch(TEMPLATE_URL).then((r) => {
      if (!r.ok) throw new Error("تعذّر تحميل قالب التقرير (report_template.pptx)");
      return r.arrayBuffer();
    });
    const zip = await JSZip.loadAsync(buf);
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
          setCell_(tbl, r, 1, fmtNum_(g.byRegion.get("الطائف")));
          setCell_(tbl, r, 2, fmtNum_(g.byRegion.get("المدينة المنورة")));
          setCell_(tbl, r, 3, fmtNum_(g.byRegion.get("مكة المكرمة")));
          setCell_(tbl, r, 4, fmtNum_(g.byRegion.get("جدة")));
          setCell_(tbl, r, 5, g.group);
        });
        setCell_(tbl, 5, 0, `${fmtNum_(data.secTotal)} (100%)`);
        setCell_(tbl, 5, 1, fmtNum_(REGION_ORDER_SUM_(data.secGroupsSorted, "الطائف")));
        setCell_(tbl, 5, 2, fmtNum_(REGION_ORDER_SUM_(data.secGroupsSorted, "المدينة المنورة")));
        setCell_(tbl, 5, 3, fmtNum_(REGION_ORDER_SUM_(data.secGroupsSorted, "مكة المكرمة")));
        setCell_(tbl, 5, 4, fmtNum_(REGION_ORDER_SUM_(data.secGroupsSorted, "جدة")));
        setCell_(tbl, 5, 5, "الإجمالي");
      }
    });

    // سلايد 4: نظرة عامة
    await patchSlide_(zip, slides[3], (doc) => {
      setShapeLines_(doc, 2, [`نظرة عامة على البلاغات - الفترة: ${data.periodLabel}`]);
      setShapeLines_(doc, 78, ["0", "بلاغات أُعيد فتحها (غير متتبَّعة حاليًا)"]);
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
          setCell_(tbl, r, 1, fmtNum_(x.consultantApproval));
          setCell_(tbl, r, 2, "0");
          setCell_(tbl, r, 3, fmtNum_(x.total));
          setCell_(tbl, r, 4, x.region);
        });
        setCell_(tbl, 5, 0, "100.0%");
        setCell_(tbl, 5, 1, fmtNum_(data.consultantApprovalRows.length));
        setCell_(tbl, 5, 2, "0");
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
          setCell_(tbl, r, 0, fmtNum_(x.emergency));
          setCell_(tbl, r, 1, fmtNum_(x.routine));
          setCell_(tbl, r, 2, x.region);
          totE += x.emergency; totR += x.routine;
        });
        setCell_(tbl, 5, 0, fmtNum_(totE));
        setCell_(tbl, 5, 1, fmtNum_(totR));
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
    await patchSlide_(zip, slides[7], (doc) => {
      setShapeLines_(doc, 79, [fmtNum_(data.overdueCount), `بلاغات تجاوزت ال SLA  من اجمالي البلاغات بنسبة ${data.breachPct.toFixed(1)}%`]);
      setShapeLines_(doc, 81, [fmtNum_(data.compliantCount), `بلاغات ضمنSLA  من اجمالي البلاغات بنسبة ${data.compliancePct.toFixed(1)}%`]);
      const gap = 0; // المقاول والاستشاري بنفس القيمة المحسوبة مبدئيًا — عدّلها يدويًا في PowerPoint لو عندك رقم الاستشاري الفعلي
      setShapeLines_(doc, 86, [`%${gap.toFixed(1)}`, "الفجوة"]);
    });
    {
      const chartPath = await getSlideChartPath_(zip, slides[7]);
      await patchChart_(zip, chartPath, (cdoc) => {
        setChartCategoriesValues_(cdoc, 0, ["المقاول (BMC)", "الاستشاري"], [data.compliancePct.toFixed(1), data.compliancePct.toFixed(1)]);
      });
    }

    // سلايد 9: قيد موافقة الاستشاري
    await patchSlide_(zip, slides[8], (doc) => {
      const sp = findShapeById_(doc, 80);
      const tbl = getTableInShape_(sp);
      if (tbl) {
        let tot = 0;
        data.consultantByRegion.forEach((x, i) => {
          const r = i + 1;
          setCell_(tbl, r, 0, `${pct1_(x.count, data.overviewTotal)}%`);
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

    // سلايد 11: توزيع بلاغات النظافة على المقاولين (صفوف ديناميكية، بحد أقصى 9)
    await patchSlide_(zip, slides[10], (doc) => {
      const sp = findShapeById_(doc, 78);
      const tbl = getTableInShape_(sp);
      if (tbl) {
        const rowsData = data.cleaningContractorRows.slice(0, 9);
        setDynamicDataRows_(tbl, rowsData, () => {}); // ينسخ عدد الصفوف المطلوب فقط؛ تعبئة النصوص تتم تحت
        const trs = tbl.getElementsByTagName("a:tr");
        rowsData.forEach((rd, i) => {
          const tr = trs[i + 1];
          if (!tr) return;
          const tcs = tr.getElementsByTagName("a:tc");
          const setTc = (idx, text) => {
            const p = tcs[idx] && tcs[idx].getElementsByTagName("a:p")[0];
            if (p) setParagraphText_(p, String(text));
          };
          setTc(0, `${rd.pct}%`);
          setTc(1, fmtNum_(rd.count));
          setTc(2, rd.contractor);
          setTc(3, rd.region);
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
            setTc(0, fmtNum_(s.emergency));
            setTc(1, fmtNum_(s.count));
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

  window.generateBalaghReportPptx = async function generateBalaghReportPptx(periodDays) {
    if (typeof JSZip === "undefined") {
      throw new Error("مكتبة JSZip لم تُحمَّل بعد — تأكد من اتصال الإنترنت وأعد المحاولة");
    }
    const data = computeReportData(periodDays);
    const zip = await buildReportZip_(data);
    await downloadReportPptx_(zip, data);
    return data;
  };
  window.__balaghReportComputeData_ = computeReportData; // للاختبار فقط

  // ═══════════════ نافذة اختيار الفترة + كلمة المرور (قبل التنزيل الفعلي) ═══════════════
  // (طلب صريح) الزرار لازم "يبقى بباسورد" قبل التنزيل، وكمان يدّي اختيار بين "آخر
  // أسبوع فقط" و"آخر أسبوعين". نافذة بسيطة بعناصر DOM عادية (من غير أي مكتبة خارجية)
  // بترجع Promise<{password, periodDays} | null> (null = المستخدم ألغى العملية).
  function openReportOptionsModal_() {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.id = "balagh-report-modal-overlay";
      overlay.style.cssText =
        "position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:inherit";
      const card = document.createElement("div");
      card.style.cssText =
        "background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.3);padding:22px 24px;width:340px;max-width:92vw;direction:rtl;text-align:right";
      card.innerHTML = `
        <div style="font-size:15px;font-weight:900;color:#1E293B;margin-bottom:4px">📄 تنزيل تقرير PowerPoint</div>
        <div style="font-size:11.5px;color:#64748B;margin-bottom:14px">اختر الفترة وأدخل كلمة المرور للمتابعة</div>
        <div style="font-size:12px;font-weight:800;color:#334155;margin-bottom:6px">فترة التقرير</div>
        <label style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:#334155;margin-bottom:6px;cursor:pointer">
          <input type="radio" name="balagh-report-period" value="7" checked style="accent-color:#7C3AED"> آخر أسبوع فقط
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:#334155;margin-bottom:14px;cursor:pointer">
          <input type="radio" name="balagh-report-period" value="14" style="accent-color:#7C3AED"> آخر أسبوعين
        </label>
        <div style="font-size:12px;font-weight:800;color:#334155;margin-bottom:6px">كلمة المرور</div>
        <input type="password" id="balagh-report-pw-input" style="width:100%;box-sizing:border-box;border:1.5px solid #CBD5E1;border-radius:9px;padding:8px 10px;font-size:13px;font-family:inherit;margin-bottom:6px" placeholder="********" autocomplete="off">
        <div id="balagh-report-pw-err" style="min-height:16px;font-size:11px;font-weight:700;color:#DC2626;margin-bottom:6px"></div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button type="button" id="balagh-report-modal-cancel" style="flex:1;padding:8px 0;border-radius:9px;border:1px solid #CBD5E1;background:#F8FAFC;color:#475569;font-weight:800;font-size:12.5px;cursor:pointer;font-family:inherit">إلغاء</button>
          <button type="button" id="balagh-report-modal-ok" style="flex:1;padding:8px 0;border-radius:9px;border:1px solid #7C3AED;background:#7C3AED;color:#fff;font-weight:800;font-size:12.5px;cursor:pointer;font-family:inherit">تنزيل</button>
        </div>
      `;
      overlay.appendChild(card);
      document.body.appendChild(overlay);

      const pwInput = card.querySelector("#balagh-report-pw-input");
      const errEl = card.querySelector("#balagh-report-pw-err");
      const okBtn = card.querySelector("#balagh-report-modal-ok");
      const cancelBtn = card.querySelector("#balagh-report-modal-cancel");
      pwInput.focus();

      function cleanup(result) {
        document.removeEventListener("keydown", onKeydown);
        overlay.remove();
        resolve(result);
      }
      function submit() {
        const pw = pwInput.value;
        if (pw !== REPORT_DOWNLOAD_PASSWORD) {
          errEl.textContent = "❌ كلمة المرور غير صحيحة";
          pwInput.style.borderColor = "#DC2626";
          pwInput.focus();
          pwInput.select();
          return;
        }
        const periodEl = card.querySelector('input[name="balagh-report-period"]:checked');
        const periodDays = periodEl && periodEl.value === "14" ? 14 : 7;
        cleanup({ password: pw, periodDays });
      }
      function onKeydown(e) {
        if (e.key === "Escape") { e.preventDefault(); cleanup(null); }
        else if (e.key === "Enter") { e.preventDefault(); submit(); }
      }
      okBtn.addEventListener("click", submit);
      cancelBtn.addEventListener("click", () => cleanup(null));
      overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) cleanup(null); });
      document.addEventListener("keydown", onKeydown);
      pwInput.addEventListener("input", () => {
        errEl.textContent = "";
        pwInput.style.borderColor = "#CBD5E1";
      });
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
      const data = await window.generateBalaghReportPptx(choice.periodDays);
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
