// ╔══════════════════════════════════════════════════════════════════════╗
// ║   TBC Dashboard — تبويب "التوريدات" (Google Apps Script)               ║
// ║   المصدر: هذا الملف نفسه (ملف "الموقف التنفيذي للتجهيزات" - منظف)     ║
// ║                                                                        ║
// ║   ⚠️ نسخة مُحدّثة بعد إعادة تنظيف الملف المصدر من الصفر: الملف الخام   ║
// ║   لم يكن يحتوي فعليًا على بيانات توريد حقيقية منفصلة لكل مدرسة —       ║
// ║   أعمدة "الكمية لكل مدرسة" كانت معدّلاً موحّداً مكرراً آليًا، مش أرقام  ║
// ║   تسليم فعلية متفرقة. فبقى أصغر وحدة بيانات حقيقية ومتفردة هي:         ║
// ║   مورد × منطقة × صنف (بدل مدرسة × صنف في النسخة القديمة).             ║
// ║                                                                        ║
// ║   لا يُقرأ شيت "دليل_المدارس" ولا شيت "توضيح_منهجية_التنظيف" —         ║
// ║   هذا الداشبورد يُعرض على الإدارة، وليس مكانًا مناسبًا لملاحظات        ║
// ║   منهجية التنظيف الداخلية أو دليل مدارس مرجعي. حتى لو الشيتات دي       ║
// ║   موجودة في ملف جوجل شيتس، الكود هنا مبيقراهاش خالص.                   ║
// ║                                                                        ║
// ║   الشيتات المقروءة: التوزيع_حسب_المنطقة_والصنف / بنود_قيد_اعتماد_امر_العمل /║
// ║                     دليل_الأصناف / مؤشرات_الموردين /                  ║
// ║                     ملخص_حسب_المنطقة / ملخص_حسب_المورد                ║
// ╠══════════════════════════════════════════════════════════════════════╣
// ║  طريقة التثبيت والنشر (نفس خطوات ملف عقود التجهيزات):                 ║
// ║  1) افتح ملف جوجل شيتس "الموقف التنفيذي للتجهيزات - منظف" الجديد.     ║
// ║  2) Extensions ▸ Apps Script ▸ الصق هذا الكود بالكامل في Code.gs.      ║
// ║  3) Deploy ▸ New deployment ▸ Web app                                  ║
// ║     - Execute as: Me   |   Who has access: Anyone                     ║
// ║  4) Deploy ▸ Authorize ▸ انسخ الرابط المنتهي بـ /exec.                 ║
// ║  5) الصقه في dashboard.js بدل TAJHEEZ_SUPPLIES_URL.                    ║
// ║                                                                        ║
// ║  ملاحظة: شيت "بنود_قيد_اعتماد_امر_العمل" ممكن مايكونش موجود لو مفيش   ║
// ║  بنود قيد اعتماد في هذا الملف — الكود هنا يتعامل مع ذلك بهدوء           ║
// ║  (بيرجع مصفوفة فاضية بدل ما يوقف بالكامل).                             ║
// ║  الكاش (CacheService) مدته 10 دقائق ويدعم تقطيع لأن الحمولة ممكن       ║
// ║  تتعدى حد 100KB للخانة.                                                ║
// ╚══════════════════════════════════════════════════════════════════════╝

const SHEET_NAMES = {
  distribution : 'التوزيع_حسب_المنطقة_والصنف',
  pendingItems : 'بنود_قيد_اعتماد_امر_العمل',
  itemsGuide   : 'دليل_الأصناف',
  supplierKpi  : 'مؤشرات_الموردين',
  byRegion     : 'ملخص_حسب_المنطقة',
  bySupplier   : 'ملخص_حسب_المورد',
};

// شيتات اختيارية: لو مش موجودة في الملف منرجعش خطأ، بنرجع []
const OPTIONAL_SHEETS = ['pendingItems'];

const CACHE_SECONDS   = 600;
const CACHE_KEY_FULL  = 'tbc_tajheez_supplies_v3';
const CACHE_CHUNK_MAX = 95 * 1024;

function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const cache  = CacheService.getScriptCache();

    if (String(params.refresh || '') === '1') {
      clearCache_(cache);
    } else {
      const cached = readFromCache_(cache);
      if (cached) {
        return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
      }
    }

    const ss     = SpreadsheetApp.getActiveSpreadsheet();
    const result = {};
    const errors = {};

    for (const key of Object.keys(SHEET_NAMES)) {
      try {
        result[key] = readSheet_(ss, key);
      } catch (err) {
        result[key] = [];
        // شيتات زي دليل_المدارس ممكن ملهاش وجود في نسخة جزئية من الملف —
        // ده مش خطأ حقيقي، فمنسجلوش في errors عشان الحالة تفضل 'ok'
        if (OPTIONAL_SHEETS.indexOf(key) === -1) {
          errors[key] = err.message;
        }
      }
    }

    const payload = {
      status: Object.keys(errors).length ? 'partial' : 'ok',
      timestamp: new Date().toISOString(),
      counts: Object.fromEntries(Object.entries(result).map(([k, v]) => [k, v.length])),
      errors: Object.keys(errors).length ? errors : undefined,
      data: result,
    };

    const jsonText = JSON.stringify(payload);
    writeToCache_(cache, jsonText);

    return ContentService.createTextOutput(jsonText).setMimeType(ContentService.MimeType.JSON);

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

function cleanHeader_(header, index) {
  let h = String(header == null ? '' : header);
  if (index === 0) h = h.replace(/^﻿/, '');
  h = h.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
  return h;
}

function normalizeCell_(value) {
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

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
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
    cache.removeAll(keys);
  } catch (err) {}
}
