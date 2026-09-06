// ╔══════════════════════════════════════════════════════════════════════╗
// ║   TBC Dashboard — تبويب "البلاغات" (Google Apps Script) — ملف مستقل     ║
// ║                                                                        ║
// ║   المصدر: ملف جوجل شيتس منفصل، بأعمدة خام إنجليزية بالضبط كما وردت      ║
// ║   من نظام COW (مثال: Record No. / Creation Date / Finish Date /        ║
// ║   SLA DAYS / Sla Status / Status / School Number / School Name /       ║
// ║   Location / Category / Problem Description / Priority /              ║
// ║   Issue Description / Creator / Package / Cleaning / HVAC / OM ...).   ║
// ║                                                                        ║
// ║   هذا الملف هو اللي بيترجم الأعمدة الخام الإنجليزية للأسماء العربية    ║
// ║   اللي الداشبورد (dashboard.js) شغّال عليها فعلياً من زمان — عشان      ║
// ║   الداشبورد يفضل يعرض كل حاجة بالعربي زي ما هو دلوقتي بالظبط، من       ║
// ║   غير ما نحتاج نعدّل ولا سطر واحد في منطق قراءة البلاغات في            ║
// ║   dashboard.js (أكتر من 40 موضع بيستخدموا نفس المفاتيح العربية دي).    ║
// ║                                                                        ║
// ║   ⚠️ لا نخترع/نقدّر أي قيمة مش موجودة فعلياً في المصدر الخام —          ║
// ║   الحقول اللي معندهاش عمود مصدر مطابق (وصف الحل / بحاجة إلى الانتباه / ║
// ║   رقم المبنى) بترجع فاضية (null) بدل أي تخمين، بالظبط زي مبدأ باقي     ║
// ║   أدوات المشروع.                                                       ║
// ╠══════════════════════════════════════════════════════════════════════╣
// ║  يتعرّف تلقائياً على أي شيت (tab) جوّه الملف فيه عمودَي "Record No."    ║
// ║  و"School Number" في صف العناوين — عشان يشتغل سواء كان الملف شيت       ║
// ║  واحد، أو أكتر من شيت (منطقة لكل شيت مثلاً) بدون ما نحتاج نكتب اسم      ║
// ║  الشيت يدوياً في الكود. أي شيت تاني (لو موجود) بيتجاهل تلقائياً.        ║
// ╠══════════════════════════════════════════════════════════════════════╣
// ║  طريقة التثبيت والنشر:                                                 ║
// ║  1) ارفع ملف البلاغات الخام (بنفس أعمدة نموذج COW) على جوجل درايف      ║
// ║     وحوّله لجوجل شيتس (أو افتحه مباشرة بجوجل شيتس).                    ║
// ║  2) Extensions ▸ Apps Script ▸ الصق هذا الكود بالكامل في Code.gs.       ║
// ║  3) Deploy ▸ New deployment ▸ Web app                                  ║
// ║     - Execute as: Me   |   Who has access: Anyone                     ║
// ║  4) Deploy ▸ Authorize ▸ انسخ الرابط المنتهي بـ /exec.                 ║
// ║  5) ابعت الرابط ده عشان يتحط بدل BALAGH_URL في dashboard.js.           ║
// ║  6) من قائمة Run فوق، اختَر setupBalaghAllTriggers واضغط Run مرة واحدة  ║
// ║     عشان تفعّل التحديث التلقائي السريع (راجع الشرح التفصيلي بالأسفل).  ║
// ╚══════════════════════════════════════════════════════════════════════╝

// ── الأعمدة الخام المطلوب وجودها في صف العناوين عشان نعتبر الشيت "شيت بلاغات" ──
const BALAGH_REQUIRED_HEADERS_NORM = ['record no.', 'school number'];

// ── تعيين مباشر: اسم العمود الخام (بعد التطبيع lowercase) → المفتاح العربي في dashboard.js ──
const BALAGH_SIMPLE_MAP_NORM = {
  'record no.':            'مُعرّف الحالة',
  'status':                'الحالة',
  'school number':         'رقم المدرسة',
  'school name':           'اسم المبنى',
  'category':              'الفئة الرئيسية',
  'problem description':   'الفئة الفرعية',
  'issue description':     'الوصف',
  'priority':              'الأولوية',
  'creator':               'الجنس',
  'package':               'المقاول',
  'sla days':              'SLA DAYS',
};

// ── أعمدة "المرحلة" الثلاثة المتوازية — بيتاخد أول قيمة غير فاضية بينهم ──
const BALAGH_STAGE_HEADERS_NORM = ['cleaning', 'hvac', 'om'];

// ── ترجمة "Sla Status" الخام (Pass/Fail) لنفس القيم اللي الداشبورد بيتعامل معاها ──
// ⚠️ "تم اختراقه" هي القيمة الوحيدة اللي منطق التأخر (isOverdue) في dashboard.js
// بيقارنها حرفياً — لازم تفضل بالظبط كده لأي بلاغ SLA فاشل.
function balaghTranslateSlaStatus_(raw) {
  const v = String(raw == null ? '' : raw).trim().toLowerCase();
  if (v === 'fail') return 'تم اختراقه';
  if (v === 'pass') return 'ضمن SLA';
  const orig = String(raw == null ? '' : raw).trim();
  return orig || null;
}

// (2026-08-30) رُفعت من 600 إلى 1800 ثانية (30 دقيقة) لإعطاء هامش أمان
// إضافي مع نظام التحديث التلقائي في الأسفل — حتى لو تأخّرت دورة تحديث أو
// اتنين لأي سبب، يفضل الكاش صالحاً وميضطرش أي مستخدم للانتظار.
const BALAGH_CACHE_SECONDS = 1800;
const BALAGH_CACHE_KEY_FULL = 'tbc_balagh_v1';
const BALAGH_CACHE_CHUNK_MAX = 95 * 1024;

// ⚡ 2026-09-03: "توقيع" خفيف جداً لبيانات البلاغات (عدد الصفوف + نفس قيمة
// timestamp اللي بترجع مع الحمولة الكاملة) — الغرض منه إن الواجهة تقدر
// تسأل بسرعة عالية جداً (كل 20 ثانية) "هل فيه تغيير فعلي؟" من غير ما تحمّل
// الحمولة الكاملة (ممكن تتجاوز 100 ميجابايت مع أكتر من 100 ألف صف بلاغ).
// بنخزّنه في PropertiesService مش CacheService عشان يفضل موجود دايماً
// وميتأثرش بانتهاء صلاحية الكاش (BALAGH_CACHE_SECONDS) ولا بأي مشكلة
// تخزين مع الحمولة الضخمة نفسها (البيانات الكبيرة والتوقيع الصغير معزولين
// تماماً عن بعض).
const BALAGH_META_PROP_KEY = 'tbc_balagh_meta_v1';

function balaghWriteMeta_(rowCount, isoTimestamp) {
  try {
    PropertiesService.getScriptProperties().setProperty(
      BALAGH_META_PROP_KEY,
      JSON.stringify({ rows: rowCount, timestamp: isoTimestamp })
    );
  } catch (err) {
    Logger.log('⚠️ [balagh] فشل حفظ توقيع البيانات الخفيف (meta): ' + err.message);
  }
}

function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const cache = CacheService.getScriptCache();

    // ⚡ فحص خفيف جداً — يرجّع توقيع صغير (عدد الصفوف + وقت آخر تحديث فعلي
    // للكاش) بدون أي قراءة/معالجة للبيانات الضخمة نفسها. تُستخدم من
    // التحديث الدوري السريع في الواجهة (كل 20 ثانية) عشان تعرف هل فعلاً
    // فيه تغيير قبل ما تطلب الحمولة الكاملة.
    if (String(params.meta || '') === '1') {
      let meta = null;
      try {
        const raw = PropertiesService.getScriptProperties().getProperty(BALAGH_META_PROP_KEY);
        if (raw) meta = JSON.parse(raw);
      } catch (err) {}
      // نادر جداً (أول تشغيلة على الإطلاق قبل أي بناء كاش) — لسه ما فيش
      // توقيع محفوظ، فنرجّع "غير معروف" ونسيب الواجهة تحمّل الحمولة
      // الكاملة عادي (هي أصلاً بتعمل كده في أول تحميل بصرف النظر عن الفحص
      // الخفيف ده) — بدل أي حساب إضافي هنا.
      if (!meta) meta = { rows: null, timestamp: null };
      return ContentService.createTextOutput(JSON.stringify({
        status: 'ok', rows: meta.rows, timestamp: meta.timestamp,
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (String(params.refresh || '') === '1') {
      balaghClearCache_(cache);
    } else {
      const cached = balaghReadFromCache_(cache);
      if (cached) {
        return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
      }
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = balaghReadAllSheets_(ss);
    const nowIso = new Date().toISOString();

    const payload = {
      status: 'ok',
      timestamp: nowIso,
      rows: data.length,
      data: data,
    };

    const jsonText = JSON.stringify(payload);
    balaghWriteToCache_(cache, jsonText);
    balaghWriteMeta_(data.length, nowIso); // ⚡ حدّث التوقيع الخفيف كل مرة يُعاد فيها بناء الكاش فعلياً

    return ContentService.createTextOutput(jsonText).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err && err.message ? err.message : String(err),
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ── يمرّ على كل شيتات الملف، وبيقرأ بس الشيتات اللي شكلها "شيت بلاغات"
//    (فيها Record No. + School Number في صف العناوين)، ويجمع كل الصفوف
//    من كل الشيتات دي في مصفوفة واحدة. أي شيت تاني بيتجاهل تلقائياً. ──
function balaghReadAllSheets_(ss) {
  const sheets = ss.getSheets();
  let out = [];
  for (const sheet of sheets) {
    try {
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      if (lastRow < 2 || lastCol < 1) continue;

      const rawHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      const headersNorm = rawHeaders.map((h, i) => balaghHeaderNorm_(h, i));

      const hasAll = BALAGH_REQUIRED_HEADERS_NORM.every((req) => headersNorm.indexOf(req) !== -1);
      if (!hasAll) continue; // مش شيت بلاغات — نتجاهله

      const sheetRows = balaghReadSheet_(sheet, headersNorm, lastRow, lastCol);
      out = out.concat(sheetRows);
    } catch (err) {
      // شيت واحد فشل معالجته ما يوقفش باقي الشيتات
      Logger.log('[balagh] فشل في شيت "' + sheet.getName() + '": ' + err.message);
    }
  }
  return out;
}

function balaghReadSheet_(sheet, headersNorm, lastRow, lastCol) {
  const allValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();

  // ── فهرسة مواقع الأعمدة (بيدعم أعمدة بنفس الاسم مكررة، زي Creation Date/Finish Date) ──
  const idxByHeader = {}; // normHeader -> [index, index, ...]
  headersNorm.forEach((h, i) => {
    if (!h) return;
    if (!idxByHeader[h]) idxByHeader[h] = [];
    idxByHeader[h].push(i);
  });

  const firstIdx = (normName) => (idxByHeader[normName] ? idxByHeader[normName][0] : -1);
  const allIdx = (normName) => idxByHeader[normName] || [];

  const creationIdxs = allIdx('creation date');
  const finishIdxs = allIdx('finish date');
  const locationIdx = firstIdx('location');
  const slaStatusIdx = firstIdx('sla status');
  const stageIdxs = BALAGH_STAGE_HEADERS_NORM.map((h) => firstIdx(h)).filter((i) => i !== -1);

  const simpleIdxByTarget = {}; // sourceNorm -> index (للأعمدة المباشرة)
  Object.keys(BALAGH_SIMPLE_MAP_NORM).forEach((normName) => {
    const idx = firstIdx(normName);
    if (idx !== -1) simpleIdxByTarget[normName] = idx;
  });

  // ── تُختار أول قيمة غير فاضية من مجموعة أعمدة (لتكرار الأعمدة أو الأعمدة المتوازية) ──
  const firstNonEmpty = (row, idxs) => {
    for (const i of idxs) {
      const v = balaghNormalizeCell_(row[i]);
      if (v !== null) return v;
    }
    return null;
  };

  const result = [];
  for (let i = 1; i < allValues.length; i++) {
    const row = allValues[i];
    if (row.every((cell) => balaghNormalizeCell_(cell) === null)) continue;

    const obj = {};

    // الأعمدة المباشرة (تعيين واحد لواحد)
    Object.keys(BALAGH_SIMPLE_MAP_NORM).forEach((normName) => {
      const idx = simpleIdxByTarget[normName];
      const targetKey = BALAGH_SIMPLE_MAP_NORM[normName];
      obj[targetKey] = idx === undefined ? null : balaghNormalizeCell_(row[idx]);
    });

    // التواريخ (تجميع أول قيمة غير فاضية من الأعمدة المكررة بنفس الاسم)
    obj['تاريخ الإنشاء'] = firstNonEmpty(row, creationIdxs);
    obj['تاريخ الحل'] = firstNonEmpty(row, finishIdxs);

    // الموقع — نفس القيمة تُستخدم للمحافظة والمدينة (العمود الجغرافي الوحيد في المصدر الخام)
    const locVal = locationIdx === -1 ? null : balaghNormalizeCell_(row[locationIdx]);
    obj['المحافظة التابع لها المدرسة'] = locVal;
    obj['TBC مدينة'] = locVal;

    // حالة SLA — ترجمة Pass/Fail
    obj['حالة SLA'] = slaStatusIdx === -1 ? null : balaghTranslateSlaStatus_(row[slaStatusIdx]);

    // المرحلة — أول قيمة غير فاضية من Cleaning/HVAC/OM
    obj['المرحلة'] = firstNonEmpty(row, stageIdxs);

    // حقول مفيش لها عمود مصدر مطابق في الملف الخام — نتركها فاضية عمداً، بدون تخمين
    obj['وصف الحل'] = null;
    obj['بحاجة إلى الانتباه'] = null;
    obj['رقم المبنى'] = null;

    result.push(obj);
  }

  return result;
}

// ── فحص سريع: هل الشيت المُعدَّل ده شكله "شيت بلاغات" فعلاً (فيه Record No.
//    و School Number)؟ بيُستخدم في onBalaghSheetEdit عشان ميعملش إعادة بناء
//    كاملة للكاش (مكلفة مع 100 ألف صف) لو حد عدّل بالغلط في شيت تاني جوه
//    نفس الملف مالوش علاقة بالبلاغات. ──
function balaghSheetLooksLikeBalaghSheet_(sheet) {
  try {
    const lastCol = sheet.getLastColumn();
    if (lastCol < 1) return false;
    const rawHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const headersNorm = rawHeaders.map((h, i) => balaghHeaderNorm_(h, i));
    return BALAGH_REQUIRED_HEADERS_NORM.every((req) => headersNorm.indexOf(req) !== -1);
  } catch (err) {
    return true; // في حالة الشك، نكمل التحديث بدل ما نمنعه بالغلط
  }
}

function balaghHeaderNorm_(header, index) {
  let h = String(header == null ? '' : header);
  if (index === 0) h = h.replace(/^﻿/, '');
  return h.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

function balaghNormalizeCell_(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  let v = String(value).replace(/﻿/g, '').trim();
  if (v === '' || v === 'NaT' || v === '#N/A' || v.toLowerCase() === 'nan' ||
      v.toLowerCase() === 'null' || v.toLowerCase() === 'undefined') {
    return null;
  }
  return v;
}

function balaghWriteToCache_(cache, jsonText) {
  try {
    if (jsonText.length <= BALAGH_CACHE_CHUNK_MAX) {
      cache.put(BALAGH_CACHE_KEY_FULL, jsonText, BALAGH_CACHE_SECONDS);
      cache.put(BALAGH_CACHE_KEY_FULL + '_chunks', '0', BALAGH_CACHE_SECONDS);
      return;
    }
    const chunks = [];
    for (let i = 0; i < jsonText.length; i += BALAGH_CACHE_CHUNK_MAX) {
      chunks.push(jsonText.slice(i, i + BALAGH_CACHE_CHUNK_MAX));
    }
    // ── putAll بيقبل حتى 1000 مفتاح لكل نداء — لو عدد القطع أكبر، نقسّمها على دفعات ──
    const BATCH = 900;
    for (let start = 0; start < chunks.length; start += BATCH) {
      const map = {};
      for (let idx = start; idx < Math.min(start + BATCH, chunks.length); idx++) {
        map[BALAGH_CACHE_KEY_FULL + '_' + idx] = chunks[idx];
      }
      cache.putAll(map, BALAGH_CACHE_SECONDS);
    }
    cache.put(BALAGH_CACHE_KEY_FULL + '_chunks', String(chunks.length), BALAGH_CACHE_SECONDS);
  } catch (err) {
    // لو تجاوزنا حصة الكاش (ملف ضخم جداً) بنتجاهل بصمت — الاستجابة نفسها لسه بترجع
    // صح من غير كاش، وبس هتاخد وقت أطول شوية في المرة الجاية لحد ما تتخزن بنجاح
    Logger.log('[balagh] فشل حفظ الكاش (متوقع لو الملف ضخم جداً): ' + err.message);
  }
}

function balaghReadFromCache_(cache) {
  try {
    const meta = cache.get(BALAGH_CACHE_KEY_FULL + '_chunks');
    if (meta === null) return null;
    const n = parseInt(meta, 10);
    if (!n || n === 0) return cache.get(BALAGH_CACHE_KEY_FULL);
    const keys = [];
    for (let i = 0; i < n; i++) keys.push(BALAGH_CACHE_KEY_FULL + '_' + i);
    const got = cache.getAll(keys);
    let out = '';
    for (let i = 0; i < n; i++) {
      const part = got[BALAGH_CACHE_KEY_FULL + '_' + i];
      if (part == null) return null;
      out += part;
    }
    return out;
  } catch (err) { return null; }
}

function balaghClearCache_(cache) {
  try {
    const meta = cache.get(BALAGH_CACHE_KEY_FULL + '_chunks');
    const keys = [BALAGH_CACHE_KEY_FULL, BALAGH_CACHE_KEY_FULL + '_chunks'];
    if (meta) {
      const n = parseInt(meta, 10) || 0;
      for (let i = 0; i < n; i++) keys.push(BALAGH_CACHE_KEY_FULL + '_' + i);
    }
    cache.removeAll(keys);
  } catch (err) {}
}

// ── دالة اختبار يدوية من محرر Apps Script (Run ▸ testBalagh) — بتطبع عدد
//    الصفوف وأول صف كنموذج، عشان تتأكد إن الترجمة شغالة صح قبل النشر. ──
function testBalagh() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = balaghReadAllSheets_(ss);
  Logger.log('✅ إجمالي البلاغات: ' + data.length);
  if (data.length) {
    Logger.log('   المفاتيح: ' + Object.keys(data[0]).join(' | '));
    Logger.log('   أول صف: ' + JSON.stringify(data[0]));
  }
}

// ╔══════════════════════════════════════════════════════════════════════╗
// ║   (2026-08-31) تحديث فوري عند التعديل + شبكة أمان دورية — بناءً على     ║
// ║   طلب صريح: "أول ما أحط الداتا في الشيت، تتحدث على طول أو خلال دقيقة   ║
// ║   دقيقتين على الأكتر" (مع وصول البلاغات لحوالي 100 ألف صف).            ║
// ║                                                                        ║
// ║   ليه مش "فوري 100%"؟ الداشبورد بيقرأ من كاش (CacheService) مش من       ║
// ║   الشيت مباشرة في كل طلب — لأن قراءة/تحويل 100 ألف صف في كل مرة يفتح    ║
// ║   حد فيها الداشبورد هيبقى أبطأ بكتير من كده. الحل بقى مكوّن من طبقتين:  ║
// ║                                                                        ║
// ║   1) onBalaghSheetEdit — تريجر "عند التعديل" (installable onEdit):      ║
// ║      بيشتغل تلقائياً بمجرد ما تضيف/تعدّل أي صف في شيت البلاغات (كتابة   ║
// ║      يدوية أو لصق) — بيعيد بناء الكاش على طول في نفس اللحظة (ثوانٍ      ║
// ║      معدودة عادةً)، فمفيش داعي تستنى دورة الجدولة الدورية أصلاً في      ║
// ║      الحالة العادية (تعديل يدوي من واجهة جوجل شيتس).                   ║
// ║      ⚠️ ملحوظة مهمة: onEdit ما بيشتغلش لو البيانات اتحطت عن طريق        ║
// ║      أتمتة/سكريبت خارجي (مثلاً استيراد عبر Google Sheets API) بدل       ║
// ║      الكتابة المباشرة في الشيت — في الحالة دي، الطبقة (2) تحت هي        ║
// ║      اللي بتضمن التحديث.                                               ║
// ║                                                                        ║
// ║   2) refreshBalaghCache — شبكة أمان: Trigger زمني كل                    ║
// ║      BALAGH_REFRESH_INTERVAL_MINUTES دقايق (5 دقايق حالياً) بيعيد بناء  ║
// ║      الكاش على أي حال — تغطية للحالات اللي onEdit ميشتغلش فيها، وضمان   ║
// ║      إن التأخير الأقصى (حتى لو onEdit اتعطّل لأي سبب) ميتعديش 5 دقايق.  ║
// ║                                                                        ║
// ║   طريقة التفعيل (خطوة واحدة بس):                                       ║
// ║   1) من القائمة المنسدلة فوق (بجانب زر ▷ Run) اختَر                     ║
// ║      setupBalaghAllTriggers ثم اضغط Run — بتركّب الطبقتين مرة واحدة.    ║
// ║   2) أول مرة هيطلب صلاحيات (Authorize) — دي طبيعية لأنه محتاج صلاحية    ║
// ║      "قراءة/تعديل الشيت" و"إدارة الجدولة (Triggers) بتاعتك"، وافق       ║
// ║      عليها.                                                            ║
// ║   3) تأكد إنها اشتغلت: من القائمة الجانبية اضغط أيقونة الساعة           ║
// ║      (Triggers) وهتلاقي trigger باسم onBalaghSheetEdit (عند التعديل)    ║
// ║      وتريجر تاني باسم refreshBalaghCache (كل 5 دقايق).                 ║
// ║   4) (اختياري للمراجعة) من القائمة الجانبية اضغط Executions عشان تتابع  ║
// ║      كل تشغيلة وتتأكد إنها بتنجح، وتشوف قد ايه بتاخد وقت فعلياً.        ║
// ║                                                                        ║
// ║   مبيحتاجش عمل Deploy جديد لتفعيل أي من الاتنين — بس احفظ (Ctrl/Cmd+S)   ║
// ║   قبل ما تشغّل الدالة. لو حبيت توقف التحديث التلقائي بالكامل في أي وقت، ║
// ║   شغّل removeBalaghAllTriggers مرة واحدة.                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

// كل قد ايه (بالدقايق) تتعمل إعادة بناء دورية للكاش كـ"شبكة أمان" احتياطية
// (بالإضافة للتحديث الفوري عند التعديل في onBalaghSheetEdit تحت). لازم
// يكون أقل بوضوح من مدة صلاحية الكاش (BALAGH_CACHE_SECONDS = 1800 ثانية =
// 30 دقيقة). القيمة الحالية (5 دقايق) بتضمن إن أسوأ سيناريو (لو onEdit
// معطّل أو البيانات بتتحط عن طريق أتمتة خارجية) هو تأخير 5 دقايق كحد أقصى،
// وبرضه آمنة من ناحية حصة تشغيل الـ Triggers اليومية (288 تشغيلة/يوم كحد
// أقصى). لو ظهرت رسالة عن تجاوز الحصة، كبّرها لـ 10.
const BALAGH_REFRESH_INTERVAL_MINUTES = 5;

// أقل مدة (بالثواني) بين تشغيلتين لـ onBalaghSheetEdit — عشان لو حد بيلصق/
// يكتب كذا صف بسرعة (كذا عملية تعديل منفصلة خلال ثوانٍ)، منعملش إعادة بناء
// كاملة (مكلفة مع 100 ألف صف) لكل تعديل على حدة. أي تعديل يتجاهَل بسبب
// الـ debounce ده هيتغطى تلقائياً إما بالتعديل اللي بعده، أو بشبكة الأمان
// الدورية (خلال 5 دقايق كحد أقصى) — فمفيش بيانات بتضيع، بس بنوفر تنفيذات
// زيادة عن الحاجة.
const BALAGH_EDIT_DEBOUNCE_SECONDS = 20;

/**
 * بتتنفذ تلقائياً كل BALAGH_REFRESH_INTERVAL_MINUTES دقيقة (بعد تشغيل
 * setupBalaghAllTriggers مرة واحدة)، وكمان فورياً عند أي تعديل في الشيت
 * (عبر onBalaghSheetEdit). بتنادي نفس doGet فوق وكأنها طلب فيه ?refresh=1
 * — يعني بتجبره يقرأ الشيتات من جديد ويحدّث الكاش — لكن في الخلفية، من غير
 * أي مستخدم مستني الرد.
 */
function refreshBalaghCache() {
  const startedAt = new Date();
  try {
    const fakeRequest = { parameter: { refresh: '1' }, parameters: { refresh: ['1'] } };
    doGet(fakeRequest);
    const ms = new Date() - startedAt;
    Logger.log('✅ تم تحديث كاش البلاغات بنجاح خلال ' + ms + ' مللي ثانية');
  } catch (err) {
    Logger.log('⚠️ فشل تحديث كاش البلاغات: ' + err);
  }
}

/**
 * شغّلها مرة واحدة بس عشان تركّب الجدولة التلقائية. لو شغّلتها تاني
 * بالغلط، هي بتمسح أي نسخة قديمة من الـ Trigger قبل ما تعمل واحدة جديدة،
 * فمفيش تكرار أبداً.
 */
function setupBalaghAutoRefreshTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'refreshBalaghCache') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('refreshBalaghCache')
    .timeBased()
    .everyMinutes(BALAGH_REFRESH_INTERVAL_MINUTES)
    .create();

  // تشغيلة أولى فورية عشان الكاش يبقى دافئاً من أول لحظة، من غير ما نستنى
  // أول دورة تلقائية من الـ Trigger
  refreshBalaghCache();

  Logger.log(
    '✅ تم تفعيل التحديث التلقائي لكاش البلاغات كل ' +
      BALAGH_REFRESH_INTERVAL_MINUTES +
      ' دقايق'
  );
}

/**
 * لو حبيت توقف شبكة الأمان الدورية بس (وتسيب التحديث الفوري عند التعديل
 * شغّال)، شغّل الدالة دي مرة واحدة. للإيقاف الكامل استخدم
 * removeBalaghAllTriggers تحت.
 */
function removeBalaghAutoRefreshTrigger() {
  let removed = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'refreshBalaghCache') {
      ScriptApp.deleteTrigger(t);
      removed++;
    }
  });
  Logger.log('تم حذف ' + removed + ' جدولة/جدولات تلقائية لكاش البلاغات');
}

/**
 * (2026-08-31) بتتنفذ تلقائياً بمجرد ما حد يعدّل أي خلية في ملف الشيت —
 * بعد تركيب onBalaghSheetEdit كـ Trigger "عند التعديل" عبر
 * setupBalaghOnEditTrigger (أو setupBalaghAllTriggers). لو التعديل حصل في
 * شيت شكله فعلاً "شيت بلاغات" (فيه Record No. + School Number)، بتعيد بناء
 * الكاش على طول — عشان أي بلاغ جديد يظهر في الداشبورد خلال ثوانٍ من إضافته،
 * بدل ما ننتظر شبكة الأمان الدورية.
 */
function onBalaghSheetEdit(e) {
  try {
    const sheet = e && e.range ? e.range.getSheet() : null;
    if (sheet && !balaghSheetLooksLikeBalaghSheet_(sheet)) return; // تعديل في شيت تاني غير متعلق بالبلاغات

    // Debounce بسيط: لو حصلت إعادة بناء قبل أقل من BALAGH_EDIT_DEBOUNCE_SECONDS،
    // نتجاهل التعديل ده (هيتغطى بالتعديل اللي بعده أو بشبكة الأمان الدورية)
    const cache = CacheService.getScriptCache();
    const debounceKey = 'tbc_balagh_last_edit_refresh';
    const last = cache.get(debounceKey);
    const now = Date.now();
    if (last && (now - parseInt(last, 10)) < BALAGH_EDIT_DEBOUNCE_SECONDS * 1000) return;
    cache.put(debounceKey, String(now), 120);

    refreshBalaghCache();
  } catch (err) {
    Logger.log('⚠️ [onBalaghSheetEdit] خطأ: ' + err);
  }
}

/**
 * شغّلها مرة واحدة بس عشان تركّب التحديث الفوري عند التعديل. لو شغّلتها
 * تاني بالغلط، هي بتمسح أي نسخة قديمة من الـ Trigger قبل ما تعمل واحدة
 * جديدة، فمفيش تكرار أبداً. (الأسهل: استخدم setupBalaghAllTriggers تحت
 * عشان تركّب التحديث الفوري + شبكة الأمان الدورية مع بعض بضغطة واحدة.)
 */
function setupBalaghOnEditTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onBalaghSheetEdit') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('onBalaghSheetEdit')
    .forSpreadsheet(ss)
    .onEdit()
    .create();
  Logger.log('✅ تم تفعيل التحديث الفوري لكاش البلاغات عند أي تعديل يدوي في الشيت');
}

/**
 * لو حبيت توقف التحديث الفوري عند التعديل بس (وتسيب شبكة الأمان الدورية
 * شغّالة)، شغّل الدالة دي مرة واحدة.
 */
function removeBalaghOnEditTrigger() {
  let removed = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onBalaghSheetEdit') {
      ScriptApp.deleteTrigger(t);
      removed++;
    }
  });
  Logger.log('تم حذف ' + removed + ' جدولة/جدولات للتحديث الفوري عند التعديل');
}

/**
 * ✅ الطريقة الموصى بها للتفعيل: شغّل الدالة دي مرة واحدة بس من قائمة Run —
 * بتركّب الطبقتين مع بعض (التحديث الفوري عند التعديل + شبكة الأمان الدورية
 * كل BALAGH_REFRESH_INTERVAL_MINUTES دقايق) بضغطة واحدة.
 */
function setupBalaghAllTriggers() {
  setupBalaghOnEditTrigger();
  setupBalaghAutoRefreshTrigger();
  Logger.log('✅ تم تفعيل كل أنظمة تحديث كاش البلاغات (فوري عند التعديل + شبكة أمان دورية)');
}

/**
 * لإيقاف كل أنظمة التحديث التلقائي دفعة واحدة (فوري + دوري).
 */
function removeBalaghAllTriggers() {
  removeBalaghOnEditTrigger();
  removeBalaghAutoRefreshTrigger();
  Logger.log('تم إيقاف كل أنظمة تحديث كاش البلاغات التلقائية');
}
