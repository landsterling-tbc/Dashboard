/**
 * ============================================================================
 *  إضافة تسريع البلاغات — تحديث الكاش تلقائيًا في الخلفية (Cache Pre-Warming)
 * ============================================================================
 *  الفكرة: حاليًا، لما تنتهي صلاحية الكاش (600 ثانية تقريبًا حسب كودك) وأي
 *  مستخدم يفتح الداشبورد بعدها، السكريبت بيضطر يقرأ كل صفوف البلاغات
 *  (عشرات الآلاف من الصفوف) من جديد، يحوّلها، ويعيد تخزينها في الكاش —
 *  وهي بالظبط اللحظة اللي حسّيتم فيها بالبطء.
 *
 *  الحل: نخلي Google نفسها تشغّل عملية إعادة البناء دي في الخلفية كل فترة
 *  قصيرة (Trigger)، فيفضل الكاش "دافئ" طول الوقت تقريبًا، وأي طلب حقيقي من
 *  الداشبورد بيلاقي البيانات جاهزة فورًا من غير أي انتظار.
 *
 *  ✅ هذا الملف إضافة مستقلة بس (Add-on) — لا يلمس ولا يغيّر أي سطر من كودك
 *  الأصلي (doGet، الترجمة، التقسيم على أجزاء الكاش... إلخ). خطوتك الوحيدة
 *  بعد اللصق: تشغيل setupBalaghAutoRefreshTrigger() مرة واحدة فقط (التفاصيل
 *  في رسالة التسليم).
 * ============================================================================
 */

// كل قد ايه (بالدقايق) يُعاد بناء الكاش تلقائيًا. لازم يكون أقل بوضوح من مدة
// صلاحية الكاش (TTL) الموجودة في كودك الأصلي (600 ثانية = 10 دقايق) عشان
// يضمن إن الكاش ميفضلش يفضى قبل ما يتجدد. القيمة الحالية (5 دقايق) بتدّي
// هامش أمان كويس. لو ظهرت رسالة عن تجاوز حصة تشغيل الـ Triggers اليومية،
// كبّرها لـ 10.
var BALAGH_REFRESH_INTERVAL_MINUTES = 5;

/**
 * تتنفذ تلقائيًا كل BALAGH_REFRESH_INTERVAL_MINUTES دقيقة بعد تشغيل
 * setupBalaghAutoRefreshTrigger مرة واحدة. بتنادي نفس doGet الأصلي بتاعك
 * وكأنها طلب فيه ?refresh=1 — يعني بتجبره يقرأ الشيت من جديد ويحدّث الكاش
 * — لكن في الخلفية، من غير أي مستخدم مستني الرد.
 */
function refreshBalaghCache() {
  var startedAt = new Date();
  try {
    var fakeRequest = { parameter: { refresh: "1" }, parameters: { refresh: ["1"] } };
    doGet(fakeRequest);
    var ms = new Date() - startedAt;
    Logger.log("✅ تم تحديث كاش البلاغات بنجاح خلال " + ms + " مللي ثانية");
  } catch (err) {
    Logger.log("⚠️ فشل تحديث كاش البلاغات: " + err);
  }
}

/**
 * شغّلها مرة واحدة بس (اختَرها من القائمة المنسدلة فوق بجانب زر ▷ Run، ثم
 * اضغط Run) عشان تركّب الجدولة التلقائية. لو شغّلتها تاني بالغلط، هي بتمسح
 * أي نسخة قديمة من الـ Trigger قبل ما تعمل واحدة جديدة، فمفيش تكرار أبدًا.
 */
function setupBalaghAutoRefreshTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "refreshBalaghCache") {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger("refreshBalaghCache")
    .timeBased()
    .everyMinutes(BALAGH_REFRESH_INTERVAL_MINUTES)
    .create();

  // تشغيلة أولى فورية عشان الكاش يبقى دافئ من أول لحظة، من غير ما تستنى
  // أول دورة تلقائية من الـ Trigger
  refreshBalaghCache();

  Logger.log(
    "✅ تم تفعيل التحديث التلقائي لكاش البلاغات كل " +
      BALAGH_REFRESH_INTERVAL_MINUTES +
      " دقايق"
  );
}

/**
 * لو حبيت توقف التحديث التلقائي في أي وقت (مش لازم غالبًا)، شغّل الدالة دي
 * مرة واحدة من القائمة المنسدلة فوق.
 */
function removeBalaghAutoRefreshTrigger() {
  var removed = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "refreshBalaghCache") {
      ScriptApp.deleteTrigger(t);
      removed++;
    }
  });
  Logger.log("تم حذف " + removed + " جدولة/جدولات تلقائية لكاش البلاغات");
}
