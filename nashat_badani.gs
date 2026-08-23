// ╔══════════════════════════════════════════════════════════════════════╗
// ║   TBC Dashboard — تبويب "مبادرة النشاط البدني" (Google Apps Script)     ║
// ║   المصدر: هذا الملف نفسه (ملف "الموقف التنفيذي المجمع للنشاط البدني —  ║
// ║           منظف") — الناتج من أداة "منظّف مبادرة النشاط البدني.html"    ║
// ║                                                                        ║
// ║   ⚠️ لا يُقرأ شيت "توضيح_منهجية_التنظيف" — هذا الداشبورد يُعرض على      ║
// ║   الإدارة، وليس مكانًا مناسبًا لملاحظات منهجية التنظيف الداخلية. حتى    ║
// ║   لو الشيت ده موجود في ملف جوجل شيتس، الكود هنا مبيقراهوش خالص.        ║
// ║                                                                        ║
// ║   الشيتات المقروءة: التوزيع_التفصيلي / دليل_الأصناف /                  ║
// ║                     ملخص_حسب_الشركة / ملخص_حسب_المنطقة                 ║
// ╠══════════════════════════════════════════════════════════════════════╣
// ║  طريقة التثبيت والنشر (نفس خطوات ملفات التجهيزات):                    ║
// ║  1) افتح "منظّف مبادرة النشاط البدني.html" على جهازك، اسحب عليه ملف    ║
// ║     "الموقف التنفيذي المجمع للنشاط البدني" الخام، ونزّل الملف الناتج   ║
// ║     ("... - منظف.xlsx").                                              ║
// ║  2) ارفع الملف الناتج على جوجل درايف وحوّله لجوجل شيتس (أو افتحه       ║
// ║     مباشرة بجوجل شيتس).                                               ║
// ║  3) Extensions ▸ Apps Script ▸ الصق هذا الكود بالكامل في Code.gs.      ║
// ║  4) Deploy ▸ New deployment ▸ Web app                                  ║
// ║     - Execute as: Me   |   Who has access: Anyone                     ║
// ║  5) Deploy ▸ Authorize ▸ انسخ الرابط المنتهي بـ /exec.                 ║
// ║  6) الصقه في dashboard.js بدل NASHAT_BADANI_URL.                       ║
// ║                                                                        ║
// ║  ملاحظة: لو حدّثت بيانات المصدر لاحقًا، لازم تعيد تشغيل أداة التنظيف   ║
// ║  وترفع النسخة المنظفة الجديدة بدل القديمة في نفس ملف جوجل شيتس ده —    ║
// ║  الكود هنا بيقرا الشيتات المنظفة فقط، مش الملف الخام الأصلي.           ║
// ╚══════════════════════════════════════════════════════════════════════╝

const NASHAT_SHEET_NAMES = {
  distribution: 'التوزيع_التفصيلي',
  itemsGuide:   'دليل_الأصناف',
  byCompany:    'ملخص_حسب_الشركة',
  byRegion:     'ملخص_حسب_المنطقة',
};

const NASHAT_CACHE_SECONDS = 600;
const NASHAT_CACHE_KEY_FULL = 'tbc_nashat_badani_v2';
const NASHAT_CACHE_CHUNK_MAX = 95 * 1024;

function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const cache = CacheService.getScriptCache();

    if (String(params.refresh || '') === '1') {
      nashatClearCache_(cache);
    } else {
      const cached = nashatReadFromCache_(cache);
      if (cached) {
        return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
      }
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const result = {};
    const errors = {};

    for (const key of Object.keys(NASHAT_SHEET_NAMES)) {
      try {
        result[key] = nashatReadSheet_(ss, key);
      } catch (err) {
        result[key] = [];
        errors[key] = err.message;
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
    nashatWriteToCache_(cache, jsonText);

    return ContentService.createTextOutput(jsonText).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err && err.message ? err.message : String(err),
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function nashatReadSheet_(ss, key) {
  const sheetName = NASHAT_SHEET_NAMES[key];
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('الشيت غير موجودة: ' + sheetName);
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];

  const allValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();

  const rawHeaders = allValues[0];
  const headers = rawHeaders.map((h, i) => nashatCleanHeader_(h, i));
  const result = [];

  for (let i = 1; i < allValues.length; i++) {
    const row = allValues[i];
    if (row.every((cell) => nashatNormalizeCell_(cell) === null)) continue;

    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = nashatNormalizeCell_(row[j]);
    }
    result.push(obj);
  }

  return result;
}

function nashatCleanHeader_(header, index) {
  let h = String(header == null ? '' : header);
  if (index === 0) h = h.replace(/^﻿/, '');
  h = h.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
  return h;
}

function nashatNormalizeCell_(value) {
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

function nashatWriteToCache_(cache, jsonText) {
  try {
    if (jsonText.length <= NASHAT_CACHE_CHUNK_MAX) {
      cache.put(NASHAT_CACHE_KEY_FULL, jsonText, NASHAT_CACHE_SECONDS);
      cache.put(NASHAT_CACHE_KEY_FULL + '_chunks', '0', NASHAT_CACHE_SECONDS);
      return;
    }
    const chunks = [];
    for (let i = 0; i < jsonText.length; i += NASHAT_CACHE_CHUNK_MAX) {
      chunks.push(jsonText.slice(i, i + NASHAT_CACHE_CHUNK_MAX));
    }
    const map = {};
    chunks.forEach((c, idx) => { map[NASHAT_CACHE_KEY_FULL + '_' + idx] = c; });
    cache.putAll(map, NASHAT_CACHE_SECONDS);
    cache.put(NASHAT_CACHE_KEY_FULL + '_chunks', String(chunks.length), NASHAT_CACHE_SECONDS);
  } catch (err) {}
}

function nashatReadFromCache_(cache) {
  try {
    const meta = cache.get(NASHAT_CACHE_KEY_FULL + '_chunks');
    if (meta === null) return null;
    const n = parseInt(meta, 10);
    if (!n || n === 0) return cache.get(NASHAT_CACHE_KEY_FULL);
    const keys = [];
    for (let i = 0; i < n; i++) keys.push(NASHAT_CACHE_KEY_FULL + '_' + i);
    const got = cache.getAll(keys);
    let out = '';
    for (let i = 0; i < n; i++) {
      const part = got[NASHAT_CACHE_KEY_FULL + '_' + i];
      if (part == null) return null;
      out += part;
    }
    return out;
  } catch (err) { return null; }
}

function nashatClearCache_(cache) {
  try {
    const meta = cache.get(NASHAT_CACHE_KEY_FULL + '_chunks');
    const keys = [NASHAT_CACHE_KEY_FULL, NASHAT_CACHE_KEY_FULL + '_chunks'];
    if (meta) {
      const n = parseInt(meta, 10) || 0;
      for (let i = 0; i < n; i++) keys.push(NASHAT_CACHE_KEY_FULL + '_' + i);
    }
    cache.removeAll(keys);
  } catch (err) {}
}
