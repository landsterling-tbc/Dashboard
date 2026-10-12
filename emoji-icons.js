/* ═══════════════════════════════════════════════════════════════════
   emoji-icons.js — لا إيموجي في الواجهة: أيقونات SVG تلقائيًا
   ───────────────────────────────────────────────────────────────────
   • أي إيموجي يظهر كنص داخل الصفحة يُستبدل بأيقونة SVG (نمط Lucide: خط 2px،
     currentColor) فور إدخاله في الـDOM، فلا يظهر للمستخدم أي إيموجي حتى لو
     كتبه كود قديم أو رد المساعد الذكي أو بيانات قادمة من الشيت.
   • الإيموجي داخل: placeholder / title / alt / aria-label / <option> / نصوص
     الرسوم البيانية (canvas) / alert-confirm-prompt  → يُحذف (لا يقبل SVG).
   • العلامة المائية في كروت البوابة (data-wm) تُرسم بأيقونة SVG.
   • لا يغيّر النصوص المصدرية، فلا يتأثر منطق الكود الذي يعتمد عليها.
   • قاعدة المشروع: لا تكتب إيموجي في واجهة جديدة؛ اكتب أيقونة SVG مباشرة.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  if (window.__EMOJI_ICONS__) return;

  var P = {
    check: '<path d="M20 6 9 17l-5-5"/>',
    "check-circle": '<path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    "x-circle": '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
    warn: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    chart: '<path d="M5 21v-6"/><path d="M12 21V3"/><path d="M19 21V9"/>',
    trend: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    clipboard: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    building: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
    landmark: '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
    factory: '<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>',
    hardhat: '<path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M14 6a6 6 0 0 1 6 6v3"/><path d="M4 15v-3a6 6 0 0 1 6-6"/><rect x="2" y="15" width="20" height="4" rx="1"/>',
    hourglass: '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
    dot: '<circle cx="12" cy="12" r="7" fill="currentColor" stroke="none"/>',
    square: '<rect width="14" height="14" x="5" y="5" rx="2"/>',
    package: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.29 7 8.71 5 8.71-5"/><path d="m7.5 4.27 9 5.15"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    siren: '<path d="M7 18v-6a5 5 0 1 1 10 0v6"/><path d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z"/><path d="M21 12h1"/><path d="M18.5 4.5 18 5"/><path d="M2 12h1"/><path d="M12 2v1"/><path d="m4.929 4.929.707.707"/><path d="M12 12v6"/>',
    banknote: '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
    card: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
    snow: '<line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>',
    map: '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    maximize: '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    pushpin: '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
    compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    timer: '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>',
    hash: '<line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>',
    elevator: '<path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>',
    fuel: '<line x1="3" x2="15" y1="22" y2="22"/><line x1="4" x2="14" y1="9" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/>',
    cap: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
    eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
    activity: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    calc: '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
    car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    ruler: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>',
    door: '<path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z"/>',
    monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
    puzzle: '<path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    "arrow-down": '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    flask: '<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
    phone: '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>',
    unlock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
    minus: '<path d="M5 12h14"/>',
    list: '<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    loader: '<path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'
  };

  /* emoji → [أيقونة, صنف لوني اختياري] — '' = يُحذف (زخرفة لا معنى لها) */
  var C = { ok: "eico-ok", bad: "eico-bad", warn: "eico-warn", red: "eico-red", orange: "eico-orange", yellow: "eico-yellow", green: "eico-green", blue: "eico-blue", gray: "eico-gray" };
  var M = {
    "✅": ["check-circle", C.ok], "✔": ["check"], "✓": ["check"], "☑": ["check-circle", C.ok],
    "❌": ["x-circle", C.bad], "✕": ["x"], "✖": ["x"], "❎": ["x-circle", C.bad],
    "⚠": ["warn", C.warn], "⛔": ["ban", C.bad], "🚫": ["ban", C.bad], "🚨": ["siren", C.bad],
    "⬇": ["download"], "⬆": ["arrow-down"], "📥": ["download"], "🔽": ["download"], "🔻": ["arrow-down"],
    "🔍": ["search"], "🔎": ["search"],
    "📊": ["chart"], "📈": ["trend"], "📉": ["trend"], "📋": ["clipboard"], "📝": ["pencil"], "📄": ["file"], "📃": ["file"], "📑": ["file"],
    "⚙": ["settings"], "🔧": ["wrench"], "🛠": ["wrench"], "🔩": ["wrench"],
    "🏫": ["building"], "🏢": ["building"], "🏙": ["building"], "🏛": ["landmark"], "🏭": ["factory"], "🏗": ["hardhat"], "🦺": ["shield"], "👷": ["hardhat"], "🏠": ["home"],
    "⏳": ["hourglass", C.gray], "⌛": ["hourglass", C.gray], "⏱": ["timer"], "🕘": ["clock"], "⏰": ["clock"],
    "🔴": ["dot", C.red], "🟠": ["dot", C.orange], "🟡": ["dot", C.yellow], "🟢": ["dot", C.green], "🔵": ["dot", C.blue], "⚪": ["dot", C.gray], "⚫": ["dot"], "🟣": ["dot", C.blue], "⬜": ["square", C.gray], "⬛": ["square"],
    "⏹": ["square"],
    "📦": ["package"], "🪑": ["package"], "🗂": ["layers"], "📁": ["folder"], "📂": ["folder"],
    "💰": ["banknote"], "💵": ["banknote"], "💳": ["card"], "🧾": ["receipt"], "🧮": ["calc"],
    "❄": ["snow"], "🔄": ["refresh"], "🔁": ["refresh"],
    "📍": ["pin"], "📌": ["pushpin"], "🗺": ["map"], "🧭": ["compass"], "🌐": ["globe"], "🛰": ["globe"],
    "🔗": ["link"], "👥": ["users"], "👤": ["user"], "🧑‍💼": ["user"], "👮": ["user"], "🧍": ["user"], "👦": ["user"], "👧": ["user"],
    "✉": ["mail"], "📢": ["megaphone"], "📣": ["megaphone"], "⛶": ["maximize"],
    "🚚": ["truck"], "🚐": ["car"], "🚗": ["car"], "📅": ["calendar"], "🎯": ["target"], "🔢": ["hash"],
    "✏": ["pencil"], "🛗": ["elevator"], "⛽": ["fuel"], "🎓": ["cap"], "🧠": ["bulb"], "💡": ["bulb"],
    "🗑": ["trash"], "⭐": ["star"], "★": ["star"], "🌟": ["star"], "✦": ["sparkles"], "✨": ["sparkles"], "🧹": ["sparkles"],
    "👁": ["eye"], "⚡": ["zap"], "🚿": ["droplet"], "🏀": ["activity"], "🤸": ["activity"], "🌳": ["leaf"], "🌿": ["leaf"],
    "🛡": ["shield"], "📐": ["ruler"], "🚪": ["door"], "💻": ["monitor"], "🧰": ["briefcase"], "🧩": ["puzzle"],
    "📭": ["inbox"], "🎨": ["palette"], "🏆": ["trophy"], "📖": ["book"], "📚": ["book"], "🗣": ["message"],
    "🧪": ["flask"], "📞": ["phone"], "🔓": ["unlock"], "🔥": ["flame"], "♞": ["car"],
    "🛈": ["info"], "ℹ": ["info"], "☰": ["menu"], "🔌": ["plug"], "〰": ["minus"], "➖": ["minus"],
    "🙂": [""], "🙌": [""], "👋": [""], "👇": [""], "🔘": [""], "👍": [""], "😊": [""], "😀": [""]
  };

  var RANGES = "\\u{1F300}-\\u{1FAFF}\\u{1F000}-\\u{1F2FF}\\u2600-\\u27BF\\u2B05-\\u2B07\\u2B1B\\u2B1C\\u2B50\\u2B55\\u231A\\u231B\\u23E9-\\u23FF\\u2934\\u2935\\u3030\\u303D";
  var RE_SRC = "[" + RANGES + "]\\uFE0F?(?:\\u200D[" + RANGES + "]\\uFE0F?)*";
  var RE = new RegExp(RE_SRC, "gu");
  var RE_T = new RegExp(RE_SRC, "u");
  var KEEP = /^$/;

  var unmapped = (window.__EMOJI_UNMAPPED__ = {});

  function lookup(seq) {
    var k = seq.replace(/️/g, "");
    var e = M[k];
    if (!e) { var first = Array.from(k)[0]; e = M[first]; }
    return e;
  }

  function strip(s) {
    if (typeof s !== "string" || !RE_T.test(s)) return s;
    return s.replace(RE, function (m) { return KEEP.test(m) ? m : ""; }).replace(/[ \t]{2,}/g, " ").replace(/^[ \t]+(?=\S)/, "");
  }

  var NS = "http://www.w3.org/2000/svg";
  function iconHTML(name, cls) {
    var d = P[name]; if (!d) return "";
    return '<svg class="eico' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + d + "</svg>";
  }
  var TPL = {};
  function makeIcon(entry) {
    var key = entry[0] + "|" + (entry[1] || "");
    var t = TPL[key];
    if (!t) {
      t = document.createElement("span");
      t.className = "eico-w";
      t.setAttribute("aria-hidden", "true");
      t.innerHTML = iconHTML(entry[0], entry[1]);
      TPL[key] = t;
    }
    return t.cloneNode(true);
  }

  var SKIP = /^(SCRIPT|STYLE|TEXTAREA|OPTION|SELECT|TITLE|NOSCRIPT|SVG|INPUT|CODE|PRE)$/;
  function skipText(node) {
    var p = node.parentNode;
    if (!p) return true;
    if (SKIP.test(p.nodeName.toUpperCase())) return p.nodeName.toUpperCase() === "OPTION" ? "strip" : true;
    if (p.closest && p.closest("svg,.eico-w,[contenteditable='true']")) return true;
    return false;
  }

  function processText(node) {
    var t = node.nodeValue;
    if (!t || !RE_T.test(t)) return;
    var sk = skipText(node);
    if (sk === true) return;
    if (sk === "strip") { node.nodeValue = strip(t); return; }
    var frag = document.createDocumentFragment(), last = 0, m, any = false;
    RE.lastIndex = 0;
    while ((m = RE.exec(t))) {
      if (KEEP.test(m[0])) continue;
      var e = lookup(m[0]);
      if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index)));
      if (e && e[0]) { frag.appendChild(makeIcon(e)); any = true; }
      else if (!e) { unmapped[m[0]] = (unmapped[m[0]] || 0) + 1; any = true; }
      else any = true;
      last = m.index + m[0].length;
    }
    if (!any) return;
    if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }

  var ATTRS = ["placeholder", "title", "alt", "aria-label", "label"];
  var ATTR_SEL = "[placeholder],[title],[alt],[aria-label],option[label],optgroup[label]";
  function fixAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var v = el.getAttribute && el.getAttribute(ATTRS[i]);
      if (v && RE_T.test(v)) { var s = strip(v); if (s !== v) el.setAttribute(ATTRS[i], s); }
    }
  }

  function watermark(el) {
    var wm = el.getAttribute("data-wm");
    if (!wm || el.querySelector(":scope > .eico-wm")) return;
    var e = lookup(wm.trim());
    if (!e || !e[0]) return;
    var w = document.createElement("span");
    w.className = "eico-wm"; w.setAttribute("aria-hidden", "true");
    w.innerHTML = iconHTML(e[0]);
    el.appendChild(w);
  }

  function scan(root) {
    if (!root) return;
    if (root.nodeType === 3) { processText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1) {
      if (root.closest && root.closest(".eico-w")) return;
      var rn = root.nodeName.toUpperCase();
      if (SKIP.test(rn) && rn !== "OPTION") return;
    }
    var w = document.createTreeWalker(root, 4 /* SHOW_TEXT */, null);
    var list = [], n;
    while ((n = w.nextNode())) { if (n.nodeValue && RE_T.test(n.nodeValue)) list.push(n); }
    for (var i = 0; i < list.length; i++) processText(list[i]);
    if (root.nodeType === 1) {
      fixAttrs(root);
      if (root.hasAttribute && root.hasAttribute("data-wm")) watermark(root);
    }
    if (root.querySelectorAll) {
      var at = root.querySelectorAll(ATTR_SEL);
      for (var j = 0; j < at.length; j++) fixAttrs(at[j]);
      var wm = root.querySelectorAll("[data-wm]");
      for (var k = 0; k < wm.length; k++) watermark(wm[k]);
    }
  }

  /* ── CSS ── */
  var css =
    ".eico-w{display:inline-flex;align-items:center;justify-content:center;vertical-align:-.2em;line-height:1;flex:none}" +
    ".eico{width:1.1em;height:1.1em;flex:none;overflow:visible}" +
    ".eico-ok{color:var(--c-positive,#066a52)}.eico-bad,.eico-red{color:var(--c-danger,#7d1f2c)}" +
    ".eico-warn{color:var(--c-warning-text,#92590a)}.eico-orange{color:var(--c-orange,#b3541e)}" +
    ".eico-yellow{color:var(--c-warning,#c07a14)}.eico-green{color:var(--c-positive,#066a52)}" +
    ".eico-blue{color:var(--c-info,#0d849c)}.eico-gray{color:var(--c-neutral,#8aa1ad)}" +
    "[class*='placeholder-icon'] .eico-w,.ix-empty .eico-w{color:var(--c-info,#0d849c);opacity:.7}" +
    /* __CARD_WM_FIX__ العلامة المائية في كروت الرئيسية تُخفى تمامًا (كانت تأخذ مساحة 92px داخل الكارت وتكبّره) */
    "#portal-home .portal-card>.eico-wm,.portal-card>.eico-wm{display:none!important}" +
    ".eico-wm .eico{width:100%;height:100%;stroke-width:1.5;color:currentColor}" +
    ".portal-favorites-empty::before{content:\"\"!important;background:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230d849c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='" +
    P.star + "'/%3E%3C/svg%3E\") center/20px no-repeat,rgba(13,132,156,.1)!important}";
  var st = document.createElement("style");
  st.id = "eico-style"; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  /* ── canvas (Chart.js ونحوه): حذف الإيموجي من النصوص المرسومة ── */
  try {
    var cp = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
    if (cp) ["fillText", "strokeText", "measureText"].forEach(function (fn) {
      var o = cp[fn]; if (!o) return;
      cp[fn] = function (t) {
        if (typeof t === "string" && RE_T.test(t)) arguments[0] = strip(t);
        return o.apply(this, arguments);
      };
    });
  } catch (_) {}

  /* ── النوافذ الأصلية ── */
  ["alert", "confirm", "prompt"].forEach(function (fn) {
    var o = window[fn]; if (typeof o !== "function") return;
    window[fn] = function (m) { arguments[0] = typeof m === "string" ? strip(m) : m; return o.apply(window, arguments); };
  });

  /* ── المراقب ── */
  var mo = new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      var m = muts[i];
      if (m.type === "childList") {
        for (var j = 0; j < m.addedNodes.length; j++) scan(m.addedNodes[j]);
      } else if (m.type === "characterData") {
        processText(m.target);
      } else if (m.type === "attributes") {
        if (m.attributeName === "data-wm") watermark(m.target); else fixAttrs(m.target);
      }
    }
  });
  function start() {
    var root = document.documentElement;
    mo.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "title", "alt", "aria-label", "label", "data-wm"] });
    scan(root);
    if (document.title && RE_T.test(document.title)) document.title = strip(document.title);
  }
  start();
  document.addEventListener("DOMContentLoaded", function () { scan(document.body); });
  window.__EMOJI_ICONS__ = { scan: scan, strip: strip, icons: P, map: M };
})();
