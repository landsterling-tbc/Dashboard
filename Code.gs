// ╔══════════════════════════════════════════════════════════════════════╗
// ║   TBC Dashboard — Google Apps Script (Google Sheet Loader)           ║
// ║   المصدر: Google Sheet واحد بشيتات متعددة (tabs)                     ║
// ║   تحديث الكاش: ?refresh=1  |  كاش 10 دقائق تلقائي                   ║
// ╚══════════════════════════════════════════════════════════════════════╝

// أسماء الشيتات (tabs) داخل الـ Google Sheet — يجب أن تطابق أسماء الشيتات بالضبط
const SHEET_NAMES = {
  buildings         : 'المباني',
  fcaHistory        : 'تقييمات_FCA_المراحل',
  spareParts        : 'قطع_الغيار',
  fmContracts       : 'عقود_عدا_المجال',
  allSystems        : 'المدارس_والأنظمة',
  elevators         : 'المصاعد',
  elevatorStatus    : 'حالة_المصاعد',
  tajheezInventory  : 'التجهيزات_منظف',
  gatekeepers       : 'قائمة_البوابين_منظفة',
  kpiContractor     : 'مؤشرات_الأداء_للمقاول',
  consultantKpi     : 'مؤشرات_اداء_الاستشاري',
  payments          : 'المدفوعات',
  recruitment       : 'التوظيف',
  securitySafety    : 'بلاغات_أمن_وسلامة',
  correctionsEscalations: 'تصحيحات_وتصعيدات_الأمن_والسلامة',  // ★ جديد — تصحيحات وتصعيدات الأمن والسلامة
  fuelConsumption   : 'استهلاك_الوقود',
  vehicles          : 'السيارات',
  training          : 'برامج_التدريب',
  employeeKpi       : 'تقييم_الموظفين',
  safetyTeamKpi     : 'مؤشرات_أداء_فريق_السلامة',
  schoolsSupervisors: 'المدارس_والمشرفين',
};

// ── إعدادات الكاش ───────────────────────────────────────────────
const CACHE_SECONDS  = 600;
const CACHE_KEY_FULL = 'tbc_sheet_v9';   // ★ رُفِّع الإصدار بسبب إضافة شيت المدارس_والمشرفين
const CACHE_CHUNK_MAX = 95 * 1024;

// ══════════════════════════════════════════════════════════════════
// ⚡ تسريع التحميل + سرعة انعكاس التعديلات (إضافة فقط — لا تغيّر أي سلوك
// قديم لمن لا يستخدمها): بدل ما ننتظر أول زائر بعد أي تعديل أو بعد
// انتهاء صلاحية الكاش (600 ثانية) يدفع تكلفة قراءة الـ 21 شيت كاملةً،
// نخلي جوجل نفسها تعيد بناء الكاش في الخلفية: (1) فورًا بعد أي تعديل
// يدوي في الشيت (عبر onSheetEdit_ تحت — بعد تهدئة بسيطة)، و(2) دوريًا
// كل MAIN_REFRESH_INTERVAL_MINUTES دقيقة كشبكة أمان. خطوة التفعيل
// (لو التريجر مش مركّب بالفعل): شغّل setupMainAllTriggers() مرة واحدة
// من قائمة Run. راجع تعليق setupMainAllTriggers تحت للتفاصيل الكاملة.
// ══════════════════════════════════════════════════════════════════

// كل قد ايه (بالدقايق) تتعمل إعادة بناء دورية للكاش كـ"شبكة أمان" —
// لازم تكون أقل بوضوح من مدة صلاحية الكاش (CACHE_SECONDS = 600 ثانية =
// 10 دقايق). القيمة الحالية (5 دقايق) بتضمن إن أسوأ سيناريو (لو onSheetEdit_
// معطّل أو التعديل حصل عبر أتمتة/API خارجي بدل الكتابة المباشرة في الشيت)
// هو تأخير 5 دقايق كحد أقصى.
const MAIN_REFRESH_INTERVAL_MINUTES = 5;

// أقل مدة (بالثواني) بين تشغيلتين لإعادة البناء الفوري عند التعديل —
// عشان لو حد بيلصق/يكتب كذا صف بسرعة، منعملش إعادة بناء كاملة (لكل الـ21
// شيت) لكل تعديل على حدة. أي تعديل يتجاهَل بسبب الـ debounce ده هيتغطى
// تلقائيًا إما بالتعديل اللي بعده، أو بشبكة الأمان الدورية.
const MAIN_EDIT_DEBOUNCE_SECONDS = 20;

// توقيع خفيف جدًا (تاريخ آخر تحديث + عدد صفوف كل شيت) يُخزَّن في
// PropertiesService (لا CacheService) عشان يفضل متاح دايمًا من غير ما
// يعتمد على مدة صلاحية الكاش — يُستخدم مستقبلاً لو حبينا نتأكد هل
// البيانات اتغيّرت فعلاً من غير ما نسحب الحمولة الكاملة (مثل ?meta=1
// في تحديث البلاغات).
const MAIN_META_PROP_KEY = 'tbc_sheet_meta_v1';

function mainWriteMeta_(counts, isoTimestamp) {
  try {
    PropertiesService.getScriptProperties().setProperty(
      MAIN_META_PROP_KEY,
      JSON.stringify({ counts: counts, timestamp: isoTimestamp })
    );
  } catch (err) {
    Logger.log('⚠️ فشل حفظ توقيع البيانات الخفيف (meta): ' + err.message);
  }
}

// ══════════════════════════════════════════════════════════════════
// نقطة الدخول الرئيسية
// ══════════════════════════════════════════════════════════════════
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const cache  = CacheService.getScriptCache();

    // نقطة خفيفة جدًا (توقيع فقط، من غير الحمولة الكاملة) — احتياط
    // مستقبلي لأي فحص ذكي على الواجهة، بنفس فكرة ?meta=1 في تحديث البلاغات.
    if (String(params.meta || '') === '1') {
      let meta = null;
      try {
        const raw = PropertiesService.getScriptProperties().getProperty(MAIN_META_PROP_KEY);
        if (raw) meta = JSON.parse(raw);
      } catch (err) {}
      if (!meta) meta = { counts: null, timestamp: null };
      return jsonResponse_({ status: 'ok', counts: meta.counts, timestamp: meta.timestamp });
    }

    if (String(params.refresh || '') === '1') {
      clearCache_(cache);
    }

    if (params.sheet) {
      const key = String(params.sheet).trim();
      if (!SHEET_NAMES[key]) {
        return jsonResponse_({
          status: 'error',
          message: 'Unknown sheet key: ' + key,
          available: Object.keys(SHEET_NAMES),
        });
      }
      const ss   = SpreadsheetApp.getActiveSpreadsheet();
      const data = readSheet_(ss, key);
      return jsonResponse_({
        status: 'ok',
        sheet: key,
        sheetName: SHEET_NAMES[key],
        rows: data.length,
        data,
      });
    }

    if (String(params.refresh || '') !== '1') {
      const cached = readFromCache_(cache);
      if (cached) {
        return ContentService
          .createTextOutput(cached)
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    const ss     = SpreadsheetApp.getActiveSpreadsheet();
    const result = {};
    const errors = {};

    for (const key of Object.keys(SHEET_NAMES)) {
      try {
        result[key] = readSheet_(ss, key);
      } catch (err) {
        errors[key] = err.message;
        result[key] = [];
      }
    }

    const payload = {
      status: Object.keys(errors).length ? 'partial' : 'ok',
      timestamp: new Date().toISOString(),
      counts: Object.fromEntries(
        Object.entries(result).map(([k, v]) => [k, Array.isArray(v) ? v.length : 0])
      ),
      errors: Object.keys(errors).length ? errors : undefined,
      data: result,
    };

    const jsonText = JSON.stringify(payload);
    writeToCache_(cache, jsonText);
    mainWriteMeta_(payload.counts, payload.timestamp);

    return ContentService
      .createTextOutput(jsonText)
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return jsonResponse_({
      status: 'error',
      message: err && err.message ? err.message : String(err),
    });
  }
}

function readSheet_(ss, key) {
  const sheetName = SHEET_NAMES[key];
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('الشيت غير موجودة: ' + sheetName);
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];

  const allValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();

  const rawHeaders = allValues[0];
  const headers    = rawHeaders.map((h, i) => cleanHeader_(h, i));
  const result     = [];

  for (let i = 1; i < allValues.length; i++) {
    const row = allValues[i];
    if (row.every(cell => normalizeCell_(cell) === null)) continue;

    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = normalizeCell_(row[j]);
    }
    result.push(obj);
  }

  return result;
}

function writeToCache_(cache, jsonText) {
  try {
    if (jsonText.length <= CACHE_CHUNK_MAX) {
      cache.put(CACHE_KEY_FULL, jsonText, CACHE_SECONDS);
      cache.put(CACHE_KEY_FULL + '_chunks', '0', CACHE_SECONDS);
      return;
    }
    const chunks = [];
    for (let i = 0; i < jsonText.length; i += CACHE_CHUNK_MAX) {
      chunks.push(jsonText.slice(i, i + CACHE_CHUNK_MAX));
    }
    const map = {};
    chunks.forEach((c, idx) => { map[CACHE_KEY_FULL + '_' + idx] = c; });
    cache.putAll(map, CACHE_SECONDS);
    cache.put(CACHE_KEY_FULL + '_chunks', String(chunks.length), CACHE_SECONDS);
  } catch (err) {}
}

function readFromCache_(cache) {
  try {
    const meta = cache.get(CACHE_KEY_FULL + '_chunks');
    if (meta === null) return null;
    const n = parseInt(meta, 10);
    if (!n || n === 0) return cache.get(CACHE_KEY_FULL);
    const keys = [];
    for (let i = 0; i < n; i++) keys.push(CACHE_KEY_FULL + '_' + i);
    const got = cache.getAll(keys);
    let out = '';
    for (let i = 0; i < n; i++) {
      const part = got[CACHE_KEY_FULL + '_' + i];
      if (part == null) return null;
      out += part;
    }
    return out;
  } catch (err) { return null; }
}

function clearCache_(cache) {
  try {
    const meta = cache.get(CACHE_KEY_FULL + '_chunks');
    const keys = [CACHE_KEY_FULL, CACHE_KEY_FULL + '_chunks'];
    if (meta) {
      const n = parseInt(meta, 10) || 0;
      for (let i = 0; i < n; i++) keys.push(CACHE_KEY_FULL + '_' + i);
    }
    keys.push(
      'tbc_sheet_v1', 'tbc_sheet_v1_chunks',
      'tbc_sheet_v2', 'tbc_sheet_v2_chunks',
      'tbc_sheet_v3', 'tbc_sheet_v3_chunks',
      'tbc_sheet_v4', 'tbc_sheet_v4_chunks',
      'tbc_sheet_v5', 'tbc_sheet_v5_chunks',
      'tbc_sheet_v6', 'tbc_sheet_v6_chunks',
      'tbc_sheet_v7', 'tbc_sheet_v7_chunks',
      'tbc_sheet_v8', 'tbc_sheet_v8_chunks'
    );
    cache.removeAll(keys);
  } catch (err) {}
}

function cleanHeader_(header, index) {
  let h = String(header == null ? '' : header);
  if (index === 0) h = h.replace(/^\uFEFF/, '');
  h = h.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
  return h;
}

function normalizeCell_(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  let v = String(value).replace(/\uFEFF/g, '').trim();
  if (v === '' || v === 'NaT' || v === '#N/A' || v.toLowerCase() === 'nan' ||
      v.toLowerCase() === 'null' || v.toLowerCase() === 'undefined') {
    return null;
  }
  return v;
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function warmCache_() {
  const cache  = CacheService.getScriptCache();
  const ss     = SpreadsheetApp.getActiveSpreadsheet();
  const result = {};
  const errors = {};

  for (const key of Object.keys(SHEET_NAMES)) {
    try { result[key] = readSheet_(ss, key); }
    catch (err) { errors[key] = err.message; result[key] = []; }
  }
  const payload = {
    status: Object.keys(errors).length ? 'partial' : 'ok',
    timestamp: new Date().toISOString(),
    counts: Object.fromEntries(
      Object.entries(result).map(([k, v]) => [k, Array.isArray(v) ? v.length : 0])
    ),
    errors: Object.keys(errors).length ? errors : undefined,
    data: result,
  };
  clearCache_(cache);
  writeToCache_(cache, JSON.stringify(payload));
  mainWriteMeta_(payload.counts, payload.timestamp);
  Logger.log('[warmCache_] ✅ Updated at ' + new Date().toISOString());
}

/**
 * (⚡ محدَّثة) بتتنفذ تلقائيًا بمجرد ما حد يعدّل أي خلية في الشيت — لو
 * كانت مركّبة بالفعل كـ Trigger "عند التعديل" (onEdit) على مشروعك، هتاخد
 * السلوك الجديد ده تلقائيًا من غير أي إعادة تركيب. بدل ما تكتفي بمسح
 * الكاش (وتسيب أول زائر بعد كده يدفع تكلفة قراءة الـ 21 شيت كاملةً)، بقت
 * تعيد بناء الكاش فورًا في الخلفية (مع تهدئة بسيطة Debounce) — عشان أي
 * حد يفتح الداشبورد بعد كده يلاقي البيانات الجديدة جاهزة فورًا.
 */
function onSheetEdit_(e) {
  try {
    const cache = CacheService.getScriptCache();
    const debounceKey = 'tbc_main_last_edit_refresh';
    const last = cache.get(debounceKey);
    const now = Date.now();
    if (last && (now - parseInt(last, 10)) < MAIN_EDIT_DEBOUNCE_SECONDS * 1000) {
      return; // هيتغطى بالتعديل اللي بعده أو بشبكة الأمان الدورية
    }
    cache.put(debounceKey, String(now), 120);
    refreshMainCache();
    Logger.log('[onSheetEdit_] تمت إعادة بناء الكاش فورًا بعد تعديل في: ' +
      (e && e.source ? e.source.getActiveSheet().getName() : 'unknown sheet'));
  } catch (err) {
    Logger.log('[onSheetEdit_] Error: ' + err.message);
  }
}

/**
 * بتتنفذ تلقائيًا كل MAIN_REFRESH_INTERVAL_MINUTES دقيقة (بعد تشغيل
 * setupMainAllTriggers مرة واحدة)، وكمان فورًا عند أي تعديل (عبر
 * onSheetEdit_ فوق). بتنادي نفس doGet وكأنها طلب فيه ?refresh=1 — يعني
 * بتجبره يقرأ الشيتات من جديد ويحدّث الكاش — لكن في الخلفية، من غير أي
 * مستخدم مستني الرد.
 */
function refreshMainCache() {
  const startedAt = new Date();
  try {
    const fakeRequest = { parameter: { refresh: '1' }, parameters: { refresh: ['1'] } };
    doGet(fakeRequest);
    const ms = new Date() - startedAt;
    Logger.log('✅ تم تحديث كاش البيانات الرئيسية بنجاح خلال ' + ms + ' مللي ثانية');
  } catch (err) {
    Logger.log('⚠️ فشل تحديث كاش البيانات الرئيسية: ' + err);
  }
}

/**
 * شغّلها مرة واحدة بس عشان تركّب شبكة الأمان الدورية. لو شغّلتها تاني
 * بالغلط، هي بتمسح أي نسخة قديمة من الـ Trigger قبل ما تعمل واحدة جديدة،
 * فمفيش تكرار أبدًا.
 */
function setupMainAutoRefreshTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'refreshMainCache') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('refreshMainCache')
    .timeBased()
    .everyMinutes(MAIN_REFRESH_INTERVAL_MINUTES)
    .create();

  // تشغيلة أولى فورية عشان الكاش يبقى دافئًا من أول لحظة
  refreshMainCache();

  Logger.log(
    '✅ تم تفعيل التحديث التلقائي لكاش البيانات الرئيسية كل ' +
      MAIN_REFRESH_INTERVAL_MINUTES +
      ' دقايق'
  );
}

function removeMainAutoRefreshTrigger() {
  let removed = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'refreshMainCache') {
      ScriptApp.deleteTrigger(t);
      removed++;
    }
  });
  Logger.log('تم حذف ' + removed + ' جدولة/جدولات تلقائية لكاش البيانات الرئيسية');
}

/**
 * شغّلها مرة واحدة بس عشان تركّب التحديث الفوري عند التعديل (onSheetEdit_
 * فوق) كـ Trigger "عند التعديل". لو عندك بالفعل Trigger مركّب لنفس
 * الدالة (onSheetEdit_) من قبل، مفيش داعي تشغّل الدالة دي — هتاخد السلوك
 * الجديد تلقائيًا. لو شغّلتها تاني بالغلط، هي بتمسح أي نسخة قديمة قبل ما
 * تعمل واحدة جديدة، فمفيش تكرار أبدًا.
 */
function setupMainOnEditTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onSheetEdit_') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('onSheetEdit_')
    .forSpreadsheet(ss)
    .onEdit()
    .create();
  Logger.log('✅ تم تفعيل التحديث الفوري لكاش البيانات الرئيسية عند أي تعديل يدوي في الشيت');
}

function removeMainOnEditTrigger() {
  let removed = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onSheetEdit_') {
      ScriptApp.deleteTrigger(t);
      removed++;
    }
  });
  Logger.log('تم حذف ' + removed + ' جدولة/جدولات للتحديث الفوري عند التعديل');
}

/**
 * ✅ الطريقة الموصى بها للتفعيل: شغّل الدالة دي مرة واحدة بس من قائمة
 * Run — بتركّب الطبقتين مع بعض (التحديث الفوري عند التعديل + شبكة الأمان
 * الدورية كل MAIN_REFRESH_INTERVAL_MINUTES دقايق) بضغطة واحدة. أول مرة
 * هيطلب صلاحيات (Authorize) لأنه محتاج صلاحية "قراءة/تعديل الشيت"
 * و"إدارة الجدولة (Triggers) بتاعتك" — وافق عليها.
 */
function setupMainAllTriggers() {
  setupMainOnEditTrigger();
  setupMainAutoRefreshTrigger();
  Logger.log('✅ تم تفعيل كل أنظمة تحديث الكاش الرئيسي (فوري عند التعديل + شبكة أمان دورية)');
}

function removeMainAllTriggers() {
  removeMainOnEditTrigger();
  removeMainAutoRefreshTrigger();
  Logger.log('تم إيقاف كل أنظمة تحديث الكاش الرئيسي التلقائية');
}

function testScript() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log('📊 Spreadsheet: ' + ss.getName());
  Logger.log('📋 Available sheets: ' + ss.getSheets().map(s => s.getName()).join(' | '));
  for (const key of Object.keys(SHEET_NAMES)) {
    try {
      const data = readSheet_(ss, key);
      Logger.log('✅ ' + key + ' (' + SHEET_NAMES[key] + '): ' + data.length + ' rows');
      if (data.length) {
        Logger.log('   Headers: ' + Object.keys(data[0]).join(' | '));
        Logger.log('   First row: ' + JSON.stringify(data[0]).slice(0, 300));
      }
    } catch (err) {
      Logger.log('❌ ' + key + ': ' + err.message);
    }
  }
}
