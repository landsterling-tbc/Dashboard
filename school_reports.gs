/**
 * بلاغات المدارس المباشرة — ملف Apps Script (Web App)
 * ──────────────────────────────────────────────────────────────────────
 * المصدر: هذا الملف يجب لصقه داخل مشروع Apps Script المرتبط بملف جوجل
 * شيتس "بلاغات المدارس المباشرة - الردود" (Extensions → Apps Script من
 * داخل الشيت نفسه)، عشان يشتغل كـ"سكريبت مربوط بالحاوية" (Container-bound
 * script) ويقدر يوصل لبيانات الشيت مباشرة بدون أي معرِّف أو مفتاح مكتوب
 * في الكود.
 *
 * الأعمدة بترتيبها الثابت (A→J) كما في تصميم النموذج:
 *   A) Timestamp          B) اسم المُبلّغ        C) رقم التواصل
 *   D) اسم المدرسة        E) الرقم الوزاري       F) المحافظة
 *   G) العنوان بالتفصيل   H) نوع البلاغ          I) وصف المشكلة
 *   J) درجة الأهمية
 *
 * القراءة هنا بترتيب العمود (index) وليس باسمه، عشان أي مسافات أو نقاط
 * زايدة في نص سؤال الفورم (زي ما لوحظ في نموذج فعلي من الشيت) ما تكسرش
 * القراءة أبدًا.
 *
 * خطوات النشر (تُنفَّذ من صاحب الشيت):
 *   1) افتح الشيت "بلاغات المدارس المباشرة - الردود".
 *   2) من القائمة: Extensions → Apps Script.
 *   3) امسح أي كود موجود في الملف (Code.gs) والصق هذا الملف بالكامل مكانه.
 *   4) من زر Deploy (أعلى يمين المحرِّر) → New deployment.
 *   5) اختر النوع (Select type): Web app.
 *   6) Execute as: Me (حسابك) — Who has access: Anyone.
 *   7) اضغط Deploy، وافتح الرابط المولَّد (ينتهي بـ /exec) للتأكد إنه
 *      بيرجّع بيانات JSON صحيحة، وابعت نفس الرابط عشان يُدرَج في
 *      dashboard.js مكان SCHOOL_REPORTS_URL.
 *
 * ملحوظة مهمة عن "رقم التواصل" و"الرقم الوزاري": لو أي عمود من الاتنين
 * دول اتنسّق تلقائيًا كـ"رقم" في جوجل شيتس بدل "نص"، ممكن يضيع أي صفر في
 * أول الرقم بشكل نهائي (مش قابل للاسترجاع من هنا). للوقاية مستقبلًا: حدّد
 * العمودين في الشيت (C وE) → Format → Number → Plain text، قبل وصول أي
 * ردود جديدة.
 */

var SHEET_TAB_NAME = "Form Responses 1";

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_TAB_NAME);
    if (!sheet) {
      throw new Error('التبويب "' + SHEET_TAB_NAME + '" غير موجود في هذا الشيت');
    }

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 2) {
      return _srJsonOutput({ status: "ok", data: [], timestamp: new Date().toISOString() });
    }

    var numCols = Math.min(10, lastCol); // الأعمدة A→J = 10 أعمدة بالترتيب الثابت
    var values = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();

    var data = values
      .filter(function (row) {
        return row[0] !== "" && row[0] !== null; // تجاهل أي صف فاضي بالكامل
      })
      .map(function (row) {
        var ts = row[0];
        return {
          timestamp: ts instanceof Date ? ts.toISOString() : String(ts || ""),
          reporterName: _srAsText(row[1]),
          phone: _srAsText(row[2]),
          schoolName: _srAsText(row[3]),
          ministryId: _srAsText(row[4]),
          city: _srAsText(row[5]),
          address: _srAsText(row[6]),
          reportType: _srAsText(row[7]),
          description: _srAsText(row[8]),
          priority: _srAsText(row[9]),
        };
      });

    return _srJsonOutput({ status: "ok", data: data, timestamp: new Date().toISOString() });
  } catch (err) {
    return _srJsonOutput({ status: "error", message: String(err && err.message ? err.message : err) });
  }
}

function _srAsText(v) {
  if (v === null || v === undefined || v === "") return "";
  return String(v).trim();
}

function _srJsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
