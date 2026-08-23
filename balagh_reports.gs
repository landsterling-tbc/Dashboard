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

const BALAGH_CACHE_SECONDS = 600;
const BALAGH_CACHE_KEY_FULL = 'tbc_balagh_v1';
const BALAGH_CACHE_CHUNK_MAX = 95 * 1024;

function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const cache = CacheService.getScriptCache();

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

    const payload = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      rows: data.length,
      data: data,
    };

    const jsonText = JSON.stringify(payload);
    balaghWriteToCache_(cache, jsonText);

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
