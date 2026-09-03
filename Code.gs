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
// نقطة الدخول الرئيسية
// ══════════════════════════════════════════════════════════════════
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const cache  = CacheService.getScriptCache();

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
  Logger.log('[warmCache_] ✅ Updated at ' + new Date().toISOString());
}

function onSheetEdit_(e) {
  try {
    const cache = CacheService.getScriptCache();
    clearCache_(cache);
    Logger.log('[onSheetEdit_] Cache cleared after edit in: ' +
      (e && e.source ? e.source.getActiveSheet().getName() : 'unknown sheet'));
  } catch (err) {
    Logger.log('[onSheetEdit_] Error: ' + err.message);
  }
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
