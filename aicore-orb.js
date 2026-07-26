/* ══════════════════════════════════════════════════════════════
   AI CORE — Executive Intelligence Command Center
   JS v3 — Information Architecture Rebuild
   • لا تغيير في أي Backend / APIs / Functions / Data Sources
   • إعادة بناء طبقة العرض فقط
   • Public API محفوظ: window.AICore.{open,close,setState,setPresenceText,showAlert,refresh}
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── SVG icon set ─────────────────────────────────────────── */
  var ICONS = {
    brain:       '<path d="M9 2a3 3 0 0 0-3 3v.2A3 3 0 0 0 4 8v1a3 3 0 0 0 1 2.24V13a3 3 0 0 0 3 3h1"/><path d="M15 2a3 3 0 0 1 3 3v.2A3 3 0 0 1 20 8v1a3 3 0 0 1-1 2.24V13a3 3 0 0 1-3 3h-1"/><path d="M9 5v14a2 2 0 0 0 4 0V5a2 2 0 0 0-4 0Z"/>',
    activity:    '<path d="M3 12h4l2-8 4 16 2-8h6"/>',
    shield:      '<path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z"/>',
    dollar:      '<path d="M12 2v20"/><path d="M17 6.5c0-1.9-2.2-3.5-5-3.5s-5 1.4-5 3.5S9.2 10 12 10s5 1.6 5 3.5S14.8 17 12 17s-5-1.6-5-3.5"/>',
    check:       '<path d="M20 6 9 17l-5-5"/>',
    alert:       '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    target:      '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    clock:       '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    trend:       '<path d="m3 17 6-6 4 4 8-8"/><path d="M17 7h4v4"/>',
    layers:      '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    x:           '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    send:        '<path d="m22 2-7 20-4-9-9-4 20-7Z"/>',
    spark:       '<path d="M12 2v4"/><path d="m6.3 6.3 2.8 2.8"/><path d="M2 12h4"/><path d="m6.3 17.7 2.8-2.8"/><path d="M12 18v4"/><path d="m14.9 14.9 2.8 2.8"/><path d="M18 12h4"/><path d="m14.9 9.1 2.8-2.8"/>',
    info:        '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    schools:     '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    flag:        '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    stop:        '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    copy:        '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    redo:        '<path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 3 21 9 15 9"/>',
    trash:       '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
    expand:      '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>',
    collapse:    '<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>'
  };

  function svg(name, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round"' + (extra ? ' ' + extra : '') + '>' +
      (ICONS[name] || '') + '</svg>';
  }

  /* ── ai_heart_mind_orb_v2 — Living Energy Orb
     Full animated SVG with heartbeat pulse, rotating mesh,
     floating particles, energy ripples, and parallax layers.
     uid keeps gradient/filter ids unique per instance.
  ─────────────────────────────────────────────────── */
  function acWireOrbSVG(uid) {
    var u = uid || 'orb';
    var ORB_PATH = 'M340 112 C 435 110, 512 160, 542 244 C 570 322, 552 408, 500 470 C 452 528, 376 558, 298 542 C 214 525, 148 468, 128 388 C 108 304, 136 214, 204 160 C 246 128, 293 113, 340 112 Z';
    return (
      '<svg class="ac-wire-orb" data-uid="' + u + '" width="100%" viewBox="0 0 680 680" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs>' +
        '<radialGradient id="coreG4-' + u + '" cx="42%" cy="36%" r="65%">' +
          '<stop offset="0%" stop-color="#6bf3f4" stop-opacity="0.95"/>' +
          '<stop offset="20%" stop-color="#22d6e6" stop-opacity="0.95"/>' +
          '<stop offset="45%" stop-color="#0d849c" stop-opacity="0.92"/>' +
          '<stop offset="72%" stop-color="#0a5a68" stop-opacity="0.85"/>' +
          '<stop offset="100%" stop-color="#04303a" stop-opacity="0.55"/>' +
        '</radialGradient>' +
        '<radialGradient id="innerHeart-' + u + '" cx="50%" cy="50%" r="50%">' +
          '<stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>' +
          '<stop offset="20%" stop-color="#ccffff" stop-opacity="1"/>' +
          '<stop offset="55%" stop-color="#00E5F0" stop-opacity="0.9"/>' +
          '<stop offset="100%" stop-color="#007B88" stop-opacity="0"/>' +
        '</radialGradient>' +
        '<radialGradient id="haloG4-' + u + '" cx="50%" cy="50%" r="50%">' +
          '<stop offset="0%" stop-color="#00E5F0" stop-opacity="0.55"/>' +
          '<stop offset="30%" stop-color="#069CA8" stop-opacity="0.35"/>' +
          '<stop offset="65%" stop-color="#007B88" stop-opacity="0.15"/>' +
          '<stop offset="100%" stop-color="#004450" stop-opacity="0"/>' +
        '</radialGradient>' +
        '<radialGradient id="coreGlow-' + u + '" cx="50%" cy="48%" r="45%">' +
          '<stop offset="0%" stop-color="#00E5F0" stop-opacity="0.5"/>' +
          '<stop offset="60%" stop-color="#007B88" stop-opacity="0.15"/>' +
          '<stop offset="100%" stop-color="#004450" stop-opacity="0"/>' +
        '</radialGradient>' +
        '<linearGradient id="rimG4-' + u + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#ccffff"/>' +
          '<stop offset="35%" stop-color="#00E5F0"/>' +
          '<stop offset="70%" stop-color="#069CA8"/>' +
          '<stop offset="100%" stop-color="#00C8D4"/>' +
        '</linearGradient>' +
        '<linearGradient id="meshG4-' + u + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>' +
          '<stop offset="50%" stop-color="#eafeff" stop-opacity="0.95"/>' +
          '<stop offset="100%" stop-color="#ffffff" stop-opacity="1"/>' +
        '</linearGradient>' +
        '<linearGradient id="meshG4b-' + u + '" x1="100%" y1="0%" x2="0%" y2="100%">' +
          '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>' +
          '<stop offset="100%" stop-color="#eafeff" stop-opacity="0.65"/>' +
        '</linearGradient>' +
        '<filter id="soft7-' + u + '" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="16"/></filter>' +
        '<filter id="soft8-' + u + '" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4"/></filter>' +
        '<filter id="soft9-' + u + '" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="22"/></filter>' +
        '<mask id="centerClear-' + u + '">' +
          '<rect x="0" y="0" width="680" height="680" fill="#fff"/>' +
          '<circle cx="340" cy="335" r="102" fill="#000"/>' +
        '</mask>' +
        '<filter id="glow-' + u + '" x="-60%" y="-60%" width="220%" height="220%">' +
          '<feGaussianBlur stdDeviation="18" result="blur"/>' +
          '<feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
        '</filter>' +
        '<filter id="outerGlow-' + u + '" x="-100%" y="-100%" width="300%" height="300%">' +
          '<feGaussianBlur stdDeviation="30" result="blur"/>' +
          '<feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="blur"/></feMerge>' +
        '</filter>' +
        '<filter id="energyGlow-' + u + '" x="-50%" y="-50%" width="200%" height="200%">' +
          '<feGaussianBlur stdDeviation="8" result="blur"/>' +
          '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
        '</filter>' +
        '<clipPath id="orbClip4-' + u + '">' +
          '<path d="' + ORB_PATH + '"/>' +
        '</clipPath>' +
      '</defs>' +

      /* ─── LAYER 1: Outer Glow & Halo (parallax far) ─── */
      '<g class="ac-wire-parallax-far ac-wire-halo-group">' +
        '<circle cx="340" cy="335" r="310" fill="#00E5F0" opacity="0.06" filter="url(#outerGlow-' + u + ')"/>' +
        '<circle cx="340" cy="335" r="270" fill="#00C8D4" opacity="0.1" filter="url(#outerGlow-' + u + ')"/>' +
        '<circle cx="340" cy="335" r="290" fill="url(#haloG4-' + u + ')"/>' +
      '</g>' +

      /* ─── Energy Ripple Rings ─── */
      '<circle class="ac-wire-ripple" cx="340" cy="335" r="200" fill="none" stroke="#00E5F0" stroke-width="1.5" opacity="0"/>' +
      '<circle class="ac-wire-ripple-2" cx="340" cy="335" r="200" fill="none" stroke="#069CA8" stroke-width="1" opacity="0"/>' +

      /* ─── LAYER 2: Orb Body (parallax mid) ─── */
      '<g class="ac-wire-parallax-mid">' +
        /* Core fill with glow */
        '<path d="' + ORB_PATH + '" fill="url(#coreG4-' + u + ')" filter="url(#glow-' + u + ')"/>' +
        /* Inner energy glow */
        '<circle cx="340" cy="335" r="120" fill="url(#coreGlow-' + u + ')" class="ac-wire-heart-glow"/>' +
        /* Rim stroke with pulse */
        '<path class="ac-wire-rim" d="' + ORB_PATH + '" fill="none" stroke="url(#rimG4-' + u + ')" stroke-width="2" opacity="0.92"/>' +
      '</g>' +

      /* ─── LAYER 3: Internal Structure (parallax near) ─── */
      '<g class="ac-wire-parallax-near" clip-path="url(#orbClip4-' + u + ')">' +
        /* Grid layer 1 — meridian lines (longitude), evenly spaced every 30° for a true globe wireframe */
        '<g class="ac-wire-grid-group" opacity="0.85" mask="url(#centerClear-' + u + ')">' +
          '<ellipse cx="340" cy="335" rx="210" ry="210" fill="none" stroke="url(#meshG4-' + u + ')" stroke-width="0.9"/>' +
          '<ellipse cx="340" cy="335" rx="105" ry="210" fill="none" stroke="url(#meshG4-' + u + ')" stroke-width="0.8" transform="rotate(0 340 335)"/>' +
          '<ellipse cx="340" cy="335" rx="105" ry="210" fill="none" stroke="url(#meshG4-' + u + ')" stroke-width="0.8" transform="rotate(30 340 335)"/>' +
          '<ellipse cx="340" cy="335" rx="105" ry="210" fill="none" stroke="url(#meshG4-' + u + ')" stroke-width="0.8" transform="rotate(60 340 335)"/>' +
          '<ellipse cx="340" cy="335" rx="105" ry="210" fill="none" stroke="url(#meshG4-' + u + ')" stroke-width="0.8" transform="rotate(90 340 335)"/>' +
          '<ellipse cx="340" cy="335" rx="105" ry="210" fill="none" stroke="url(#meshG4-' + u + ')" stroke-width="0.75" opacity="0.8" transform="rotate(120 340 335)"/>' +
          '<ellipse cx="340" cy="335" rx="105" ry="210" fill="none" stroke="url(#meshG4-' + u + ')" stroke-width="0.75" opacity="0.8" transform="rotate(150 340 335)"/>' +
        '</g>' +
        /* Grid layer 2 — latitude lines (evenly stacked horizontal bands, equal steps) */
        '<g class="ac-wire-grid-group-2" opacity="0.55">' +
          '<ellipse cx="340" cy="335" rx="210" ry="158" fill="none" stroke="url(#meshG4b-' + u + ')" stroke-width="0.6"/>' +
          '<ellipse cx="340" cy="335" rx="207" ry="105" fill="none" stroke="url(#meshG4b-' + u + ')" stroke-width="0.55"/>' +
          '<ellipse cx="340" cy="335" rx="200" ry="53"  fill="none" stroke="url(#meshG4b-' + u + ')" stroke-width="0.5"/>' +
        '</g>' +

        /* Neural network lines — spokes to core only (no closed ring/polygon) */
        '<g class="ac-wire-neural" opacity="0.95" mask="url(#centerClear-' + u + ')">' +
          '<line x1="340" y1="200" x2="340" y2="335" stroke="url(#meshG4-' + u + ')" stroke-width="0.7" opacity="0.6"/>' +
          '<line x1="270" y1="250" x2="340" y2="335" stroke="url(#meshG4-' + u + ')" stroke-width="0.7" opacity="0.6"/>' +
          '<line x1="420" y1="260" x2="340" y2="335" stroke="url(#meshG4-' + u + ')" stroke-width="0.7" opacity="0.6"/>' +
          '<line x1="230" y1="330" x2="340" y2="335" stroke="url(#meshG4-' + u + ')" stroke-width="0.7" opacity="0.6"/>' +
          '<line x1="450" y1="340" x2="340" y2="335" stroke="url(#meshG4-' + u + ')" stroke-width="0.7" opacity="0.6"/>' +
          '<line x1="280" y1="410" x2="340" y2="335" stroke="url(#meshG4-' + u + ')" stroke-width="0.7" opacity="0.6"/>' +
          '<line x1="400" y1="420" x2="340" y2="335" stroke="url(#meshG4-' + u + ')" stroke-width="0.7" opacity="0.6"/>' +
        '</g>' +

        /* حلقة حدودية حول الحرفين — كل الخطوط المقطوعة تلمس هذه الحلقة
           فتبدو "ملتصقة" بها بدل ما تختفي فجأة في فراغ */
        '<g class="ac-wire-eye-track" data-eye-uid="' + u + '">' +
          '<g class="ac-wire-eye-ring-spin">' +
            '<circle class="ac-wire-eye-ring" cx="340" cy="335" r="102" fill="none" stroke="url(#meshG4-' + u + ')" stroke-width="1.1" opacity="0.9"/>' +
          '</g>' +
        '</g>' +

        /* Node dots with twinkle */
        '<circle class="ac-wire-dot" cx="340" cy="200" r="3.5" fill="#8FEEF3" filter="url(#energyGlow-' + u + ')"/>' +
        '<circle class="ac-wire-dot" cx="270" cy="250" r="3.5" fill="#069CA8" style="animation-delay:0.3s" filter="url(#energyGlow-' + u + ')"/>' +
        '<circle class="ac-wire-dot" cx="420" cy="260" r="3.5" fill="#00C8D4" style="animation-delay:0.6s" filter="url(#energyGlow-' + u + ')"/>' +
        '<circle class="ac-wire-dot" cx="230" cy="330" r="3.5" fill="#069CA8" style="animation-delay:0.9s" filter="url(#energyGlow-' + u + ')"/>' +
        '<circle class="ac-wire-dot" cx="450" cy="340" r="3.5" fill="#00C8D4" style="animation-delay:1.2s" filter="url(#energyGlow-' + u + ')"/>' +
        '<circle class="ac-wire-dot" cx="280" cy="410" r="3.5" fill="#069CA8" style="animation-delay:1.5s" filter="url(#energyGlow-' + u + ')"/>' +
        '<circle class="ac-wire-dot" cx="400" cy="420" r="3.5" fill="#00C8D4" style="animation-delay:1.8s" filter="url(#energyGlow-' + u + ')"/>' +

        /* Inner core — soft colored glow, sits exactly behind the word, pulses in sync with it */
        '<g class="ac-wire-heart">' +
          '<circle cx="340" cy="335" r="68" fill="url(#coreGlow-' + u + ')" opacity="0.6"/>' +
        '</g>' +
      '</g>' +

      /* ─── LAYER 4: Specular highlights ─── */
      '<g class="ac-wire-specular">' +
        '<ellipse cx="265" cy="210" rx="75" ry="42" fill="#ffffff" opacity="0.28" filter="url(#soft7-' + u + ')"/>' +
        '<ellipse cx="410" cy="440" rx="60" ry="32" fill="#00E5F0" opacity="0.18" filter="url(#soft7-' + u + ')"/>' +
      '</g>' +

      /* ─── LAYER 5: Ambient floating particles ─── */
      '<g class="ac-wire-parallax-far">' +
        '<circle class="ac-wire-halo-dot" cx="510" cy="220" r="2.4" fill="#069CA8" filter="url(#soft8-' + u + ')"/>' +
        '<circle class="ac-wire-halo-dot" cx="145" cy="290" r="1.8" fill="#00C8D4" filter="url(#soft8-' + u + ')" style="animation-delay:0.4s"/>' +
        '<circle class="ac-wire-halo-dot" cx="480" cy="450" r="2"   fill="#069CA8" filter="url(#soft8-' + u + ')" style="animation-delay:0.8s"/>' +
        '<circle class="ac-wire-halo-dot" cx="195" cy="450" r="2.2" fill="#00C8D4" filter="url(#soft8-' + u + ')" style="animation-delay:1.2s"/>' +
        '<circle class="ac-wire-halo-dot" cx="360" cy="140" r="1.6" fill="#069CA8" filter="url(#soft8-' + u + ')" style="animation-delay:1.6s"/>' +
        '<circle class="ac-wire-halo-dot" cx="545" cy="335" r="1.7" fill="#00C8D4" filter="url(#soft8-' + u + ')" style="animation-delay:2s"/>' +
        '<circle class="ac-wire-halo-dot" cx="135" cy="380" r="1.5" fill="#069CA8" filter="url(#soft8-' + u + ')" style="animation-delay:0.2s"/>' +
        '<circle class="ac-wire-halo-dot" cx="425" cy="535" r="1.8" fill="#00C8D4" filter="url(#soft8-' + u + ')" style="animation-delay:1s"/>' +
        '<circle class="ac-wire-halo-dot" cx="250" cy="555" r="1.6" fill="#069CA8" filter="url(#soft8-' + u + ')" style="animation-delay:1.4s"/>' +
        '<circle class="ac-wire-halo-dot" cx="570" cy="285" r="1.4" fill="#00C8D4" filter="url(#soft8-' + u + ')" style="animation-delay:0.6s"/>' +
        '<circle class="ac-wire-halo-dot" cx="110" cy="240" r="1.5" fill="#069CA8" filter="url(#soft8-' + u + ')" style="animation-delay:2.4s"/>' +
        '<circle class="ac-wire-halo-dot" cx="330" cy="575" r="1.7" fill="#00C8D4" filter="url(#soft8-' + u + ')" style="animation-delay:1.8s"/>' +
      '</g>' +

      '</svg>'
    );
  }


  /* ── Presence cycling text ─────────────────────────────────── */
  var PRESENCE = [
    { icon: 'layers',   text: 'فهم سياق اللوحة التنفيذية' },
    { icon: 'activity', text: 'قراءة بيانات الداشبورد الحية' },
    { icon: 'alert',    text: 'تحديد المخاطر الحرجة' },
    { icon: 'target',   text: 'تحليل المنشآت المدرسية' },
    { icon: 'trend',    text: 'توليد الرؤى التنفيذية' }
  ];

  var TIMELINE_STEPS = [
    'الاتصال بالنظام', 'تحميل بيانات اللوحة', 'قراءة بيانات المدارس',
    'تحليل تقييم FCA', 'حساب التكاليف', 'استخلاص المخاطر',
    'توليد الرؤى', 'إعداد التوصيات'
  ];

  /* ── Helper: DOM element factory ───────────────────────────── */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls)      e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* ── Helper: safe numeric check ──────────────────────────── */
  function hasValue(v) {
    return v !== null && v !== undefined && v !== '' && v !== '—' && v !== '-';
  }
  function isPositiveNum(v) {
    var n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
    return !isNaN(n) && n > 0;
  }

  /* ── Particles ─────────────────────────────────────────────── */
  function buildParticles(container, count) {
    for (var i = 0; i < count; i++) {
      var s = document.createElement('span');
      s.className = 'ac-p';
      var size = 2 + Math.random() * 2.5;
      s.style.cssText = 'width:' + size + 'px;height:' + size + 'px;' +
        'left:' + Math.random() * 100 + '%;bottom:-10px;' +
        'animation-duration:' + (7 + Math.random() * 9) + 's;' +
        'animation-delay:' + Math.random() * 10 + 's';
      container.appendChild(s);
    }
  }

  function timelineMarkup() {
    return TIMELINE_STEPS.map(function (label, i) {
      return '<div class="ac-tl-item" data-step="' + i + '">' + label + '</div>';
    }).join('');
  }

  /* ════════════════════════════════════════════════════════════
     MAIN INIT
     ════════════════════════════════════════════════════════════ */
  function init() {
    var root = el('div');
    root.id = 'aicore-root';

    var backdrop = el('div');
    backdrop.id = 'aicore-backdrop';

    /* ── Trigger button ── */
    var trigger = el('button');
    trigger.id = 'aicore-trigger';
    trigger.type = 'button';
    trigger.setAttribute('aria-label', 'فتح مركز الذكاء التنفيذي');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML =
      '<span class="ac-t-shadow"></span>' +
      '<span class="ac-t-bloom"></span>' +
      acWireOrbSVG('trig') +
      '<span class="ac-t-aurora"></span>' +
      '<span class="ac-t-ring"></span>' +
      '<span class="ac-t-ring-thin"></span>' +
      '<span class="ac-t-core"></span>' +
      '<span class="ac-t-plasma"></span>' +
      '<span class="ac-t-shine"></span>' +
      '<span class="ac-t-spark"></span><span class="ac-t-spark"></span><span class="ac-t-spark"></span>' +
      '<span class="ac-t-ripple"></span>' +
      '<span class="ac-badge"></span>';

    /* ── Panel ── */
    var panel = el('div');
    panel.id = 'aicore-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'مركز الذكاء التنفيذي');

    /* Ambient field */
    var field = el('div', 'ac-field');
    field.innerHTML = '<div class="ac-aurora"></div><div class="ac-grid"></div><div class="ac-orb-watermark">' + acWireOrbSVG('wm') + '</div>';
    panel.appendChild(field);

    /* ── Hero ── */
    var hero = el('div', 'ac-hero');
    hero.innerHTML =
      '<div class="ac-hero-top">' +
        '<div class="ac-orb">' +
          '<span class="ac-o-bloom"></span>' +
          acWireOrbSVG('hero') +
          '<span class="ac-o-glow"></span>' +
          '<span class="ac-o-aurora"></span>' +
          '<span class="ac-o-ring2"></span>' +
          '<span class="ac-o-ring1"></span>' +
          '<span class="ac-o-ring-thin"></span>' +
          '<span class="ac-o-core"></span>' +
          '<span class="ac-o-plasma"></span>' +
          '<span class="ac-o-shine"></span>' +
          '<span class="ac-o-particles"><i></i><i></i><i></i><i></i></span>' +
        '</div>' +
        '<div class="ac-hero-title">' +
          '<h2>مساعد إدارة المرافق الذكي</h2>' +
          '<div class="ac-sub">محلل المرافق التعليمية التنفيذي</div>' +
        '</div>' +
        '<button class="ac-clear-chat-btn-top" type="button" id="ac-clear-chat-btn" title="حذف المحادثة">' + svg('trash') + '</button>' +
        '<button class="ac-clear-chat-btn-top" type="button" id="ac-expand-btn" title="تكبير النافذة">' + svg('expand') + '</button>' +
        '<button class="ac-close" type="button" aria-label="إغلاق">' + svg('x') + '</button>' +
      '</div>' +
      '<div class="ac-status-strip">' +
        '<div class="ac-status-item ac-live"><div class="ac-si-label">الحالة</div><div class="ac-si-value"><span class="ac-si-dot"></span>متصل</div></div>' +
        '<div class="ac-status-item"><div class="ac-si-label">البلاغات</div><div class="ac-si-value" id="ac-stat-reports">' + svg('flag') + ' …</div></div>' +
        '<div class="ac-status-item"><div class="ac-si-label">المدارس</div><div class="ac-si-value" id="ac-stat-schools">' + svg('target') + ' …</div></div>' +
        '<div class="ac-status-item"><div class="ac-si-label">آخر تحديث</div><div class="ac-si-value" id="ac-stat-updated">' + svg('clock') + ' …</div></div>' +
      '</div>' +
      '<div class="ac-presence">' + svg('spark') + '<span class="ac-presence-text">جاهز</span></div>';
    panel.appendChild(hero);

    /* ── Body ── */
    var body = el('div', 'ac-body');

    /* ═══ Executive Summary section ═══ */
    body.innerHTML +=
      '<div class="ac-section-label">' + svg('layers') + ' الملخص التنفيذي</div>' +
      '<div id="ac-exec-section"></div>';

    /* ═══ Risk Center section ═══ */
    body.innerHTML +=
      '<div class="ac-section-label" id="ac-risk-section-label">' + svg('shield') + ' مركز المخاطر</div>' +
      '<div id="ac-risk-section"></div>';

    /* ═══ Cost & Priority section ═══ */
    body.innerHTML +=
      '<div class="ac-section-label" id="ac-cost-section-label">' + svg('dollar') + ' التكلفة والأولوية</div>' +
      '<div class="ac-cost-grid" id="ac-cost-grid">' +
        '<div class="ac-cost-item">' +
          '<div class="ac-ci-label">التكلفة التقديرية الإجمالية</div>' +
          '<div class="ac-ci-value" id="ac-cost-total">…</div>' +
          '<div class="ac-bar-track"><div class="ac-bar-fill" id="ac-cost-bar1" style="width:0%"></div></div>' +
        '</div>' +
        '<div class="ac-cost-item ac-opex">' +
          '<div class="ac-ci-label">مدارس بحاجة قرار فوري</div>' +
          '<div class="ac-ci-value" id="ac-cost-priority">…</div>' +
          '<div class="ac-bar-track"><div class="ac-bar-fill" id="ac-cost-bar2" style="width:0%"></div></div>' +
        '</div>' +
      '</div>';

    /* ═══ Recommendations section ═══ */
    body.innerHTML +=
      '<div class="ac-section-label" id="ac-rec-section-label">' + svg('check') + ' الأولويات والتوصيات</div>' +
      '<div class="ac-rec-list" id="ac-rec-list"></div>';

    panel.appendChild(body);

    /* ── Chat thread ── */
    var chatWrap = el('div', 'ac-chat-wrap');
    chatWrap.innerHTML =
      '<div class="ac-section-label">' + svg('brain') + ' المحادثة</div>' +
      '<div class="ac-chat-thread" id="ac-chat-thread"></div>' +
      '<div class="ac-quick-replies" id="ac-quick-replies">' +
        '<button type="button" class="ac-qr-pill">أعطني أسوأ 10 مدارس في FCA</button>' +
        '<button type="button" class="ac-qr-pill">كم عدد المدارس حسب المحافظة؟</button>' +
        '<button type="button" class="ac-qr-pill">ما متوسط درجة البيئة المدرسية؟</button>' +
        '<button type="button" class="ac-qr-pill">لخّص أهم المؤشرات في العرض الحالي</button>' +
      '</div>';
    body.appendChild(chatWrap);

    /* ── Footer / Command input ── */
    var AC_MAX_CHARS = 2000;
    var footer = el('div', 'ac-footer');
    footer.innerHTML =
      '<div class="ac-input-shell">' +
        '<textarea class="ac-input" id="ac-input" rows="1" maxlength="' + AC_MAX_CHARS + '" ' +
          'placeholder="اسأل…" aria-label="اكتب سؤالك"></textarea>' +
        '<span class="ac-char-count" id="ac-char-count" aria-hidden="true"></span>' +
        '<button class="ac-send" type="button" id="ac-send-btn" aria-label="إرسال">' + svg('send') + '</button>' +
      '</div>' +
      '<div class="ac-footer-note" id="ac-footer-note">قد يحدث خطأ — راجع القرارات الحرجة قبل التنفيذ</div>';
    panel.appendChild(footer);

    root.appendChild(backdrop);
    root.appendChild(trigger);
    root.appendChild(panel);
    document.body.appendChild(root);
    buildParticles(field, 16);

    /* ════════════════════════════════════════════════════════════
       عين تتابع الماوس — الحلقة حول "AI" بتتحرك شوية ناحية المؤشر
       لما يقرب منها، وترجع للمنتصف لما يبعد. تأثير بصري بحت،
       بيشتغل على الكرتين (برا وجوا) بنفس المبدأ.
       ════════════════════════════════════════════════════════════ */
    (function setupEyeTracking() {
      var EYE_MAX_OFFSET  = 13;  // أقصى إزاحة بالبكسل جوه الحلقة
      var EYE_RANGE       = 260; // بعد أقصى (بالبكسل) يبدأ عنده التأثير
      var tracks = [trigger, panel].map(function(container) {
        return container.querySelector('.ac-wire-eye-track');
      }).filter(Boolean);
      if (!tracks.length) return;

      var raf = null;
      function updateEyes(mx, my) {
        tracks.forEach(function(track) {
          var svgEl = track.ownerSVGElement;
          if (!svgEl) return;
          var rect = svgEl.getBoundingClientRect();
          if (!rect.width || !rect.height) return; // مخفي (display:none) — تجاهله
          var cx = rect.left + rect.width / 2;
          var cy = rect.top + rect.height / 2;
          var dx = mx - cx, dy = my - cy;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var strength = Math.max(0, 1 - dist / EYE_RANGE);
          if (strength <= 0) {
            track.style.transform = 'translate(0px,0px)';
            return;
          }
          var ang = Math.atan2(dy, dx);
          var offset = EYE_MAX_OFFSET * strength;
          var ox = Math.cos(ang) * offset;
          var oy = Math.sin(ang) * offset;
          track.style.transform = 'translate(' + ox.toFixed(2) + 'px,' + oy.toFixed(2) + 'px)';
        });
      }
      document.addEventListener('mousemove', function(e) {
        if (raf) return;
        var mx = e.clientX, my = e.clientY;
        raf = requestAnimationFrame(function() { raf = null; updateEyes(mx, my); });
      }, { passive: true });
    })();

    /* ════════════════════════════════════════════════════════════
       DATA BRIDGE — يقرأ فقط من window.fcbBuildImpactReport()
       و window.DashboardContextBuilder — لا تغيير على المصادر
       ════════════════════════════════════════════════════════════ */

    var RING_CIRC = 194; // 2 * PI * 31

    function safeCall(fn) {
      try { return fn(); } catch(e) { console.warn('[AICore bridge]', e); return null; }
    }

    /* ── Helpers: safe value display ── */
    function safeNum(v, fallback) { return (v != null && v !== '' && !isNaN(Number(v))) ? v : (fallback || null); }
    function emptyState(icon, title, desc) {
      return '<div class="ac-empty-state">' +
        '<div class="ac-es-icon">' + icon + '</div>' +
        '<div class="ac-es-title">' + title + '</div>' +
        (desc ? '<div class="ac-es-desc">' + desc + '</div>' : '') +
      '</div>';
    }

    /* ── Risk score calculation ── */
    function countRiskItems(risks) {
      var n = 0;
      if (!risks) return 0;
      if (risks.FCA)                      n += (risks.FCA.مدارس_حرجة_تحت_25 || 0) * 3 + (risks.FCA.مدارس_متوسطة_25_50 || 0);
      if (risks.مباني_قديمة_فوق_40_سنة)  n += (risks.مباني_قديمة_فوق_40_سنة.العدد || 0) * 2;
      if (risks.بلاغات_SLA_مخترق)         n += (risks.بلاغات_SLA_مخترق.الإجمالي || 0) * 2 + (risks.بلاغات_SLA_مخترق.منها_عالية_الأولوية || 0) * 3;
      if (risks.مصاعد_متعطلة)             n += (risks.مصاعد_متعطلة.العدد || 0) * 3;
      if (risks.عقود_FM)                  n += (risks.عقود_FM.منتهية || 0) * 3 + (risks.عقود_FM.قاربت_الانتهاء_90_يوم || 0);
      return n;
    }

    /* ══════════════════════════════════════════════════════════
       RENDER: Executive Summary — structured cards, not paragraph
       ══════════════════════════════════════════════════════════ */
    function renderExecSummary(report, kpis) {
      var execSection = body.querySelector('#ac-exec-section');
      if (!execSection) return;

      var totalSchools = safeNum((report && report.إجمالي_المدارس) || kpis.totalSchools);
      var achievements = report && report['٢_ما_تم_إنجازه'];
      var risks        = report && report['٣_نقاط_الخطر_والمخاوف'];
      var priorities   = report && report['٤_أعلى_5_أولويات_تستحق_قراراً_الآن'];

      /* ── إذا لم يكن هناك تقرير كامل — Empty State احترافي ── */
      if (!report && !kpis.totalSchools) {
        execSection.innerHTML =
          '<div class="ac-card">' +
            emptyState('📊', 'لا توجد بيانات متاحة حالياً', 'سيظهر الملخص التنفيذي عند اكتمال تحميل البيانات') +
          '</div>';
        return;
      }

      var items = '';

      /* البطاقة 1: إجمالي المدارس */
      if (totalSchools != null) {
        items += execItem('إجمالي المدارس المتابَعة', numBig(totalSchools), true);
      }

      /* البطاقة 2: الحالة العامة */
      var fcaCritical = risks && risks.FCA ? (risks.FCA.مدارس_حرجة_تحت_25 || 0) : null;
      if (fcaCritical != null) {
        var statusLabel = fcaCritical > 10 ? 'danger' : (fcaCritical > 3 ? 'warn' : '');
        var statusText  = fcaCritical > 10 ? 'وضع حرج' : (fcaCritical > 3 ? 'يحتاج متابعة' : 'مستقر');
        items += execItem('الحالة العامة', badge(statusText, statusLabel), false);
      }

      /* البطاقة 3: FCA حرجة */
      if (fcaCritical != null) {
        items += execItem('مدارس FCA حرجة', numBig(fcaCritical) + ' مدرسة', false);
      }

      /* البطاقة 4: بلاغات SLA */
      var slaBreach = risks && risks.بلاغات_SLA_مخترق ? risks.بلاغات_SLA_مخترق.الإجمالي : null;
      if (slaBreach != null && slaBreach > 0) {
        items += execItem('بلاغات SLA مخترقة', numBig(slaBreach) + ' بلاغ', false);
      }

      /* إذا لم تتوفر أي بطاقة — Empty State */
      if (!items) {
        execSection.innerHTML =
          '<div class="ac-card">' +
            emptyState('📊', 'لا توجد بيانات متاحة حالياً', 'سيظهر الملخص التنفيذي عند اكتمال تحميل البيانات') +
          '</div>';
        return;
      }

      execSection.innerHTML = '<div class="ac-exec-grid">' + items + '</div>';
    }

    function execItem(label, value, full) {
      return '<div class="ac-exec-item' + (full ? ' ac-exec-full' : '') + '">' +
        '<div class="ac-ei-label">' + label + '</div>' +
        '<div class="ac-ei-value">' + value + '</div>' +
      '</div>';
    }
    function numBig(v) {
      return '<span class="ac-ei-big">' + v + '</span>';
    }
    function badge(text, type) {
      return '<span class="ac-ei-badge' + (type ? ' ' + type : '') + '">' + text + '</span>';
    }

    /* ══════════════════════════════════════════════════════════
       RENDER: Risk Center — smart empty state, no hollow ring
       ══════════════════════════════════════════════════════════ */
    function renderRisk(report) {
      var riskSection = body.querySelector('#ac-risk-section');
      var riskLabel   = body.querySelector('#ac-risk-section-label');
      if (!riskSection) return;

      var risks = report && report['٣_نقاط_الخطر_والمخاوف'];

      /* لا مخاطر — Empty State */
      if (!risks) {
        riskSection.innerHTML =
          '<div class="ac-card ac-accent-good">' +
            emptyState('✅', 'لا توجد مخاطر حالياً', 'ستظهر هنا أي مؤشرات خطر عند تحميل بيانات التقييم') +
          '</div>';
        return;
      }

      var riskRaw   = countRiskItems(risks);
      var riskScore = Math.max(0, Math.min(100, riskRaw));

      /* لو درجة الخطر صفر — Empty State بسيط */
      if (riskScore === 0) {
        riskSection.innerHTML =
          '<div class="ac-card ac-accent-good">' +
            emptyState('✅', 'لا توجد مخاطر مرصودة', 'لا توجد مخاطر ضمن نطاق التحليل الحالي') +
          '</div>';
        return;
      }

      var ringStroke = riskScore >= 60 ? 'var(--ac-danger)' : (riskScore >= 30 ? 'var(--ac-warn)' : 'var(--ac-good)');
      var offset     = RING_CIRC - (RING_CIRC * riskScore / 100);

      var criticalFca = risks.FCA ? (risks.FCA.مدارس_حرجة_تحت_25 || 0) : null;
      var overdueSla  = risks.بلاغات_SLA_مخترق ? (risks.بلاغات_SLA_مخترق.الإجمالي || 0) : null;
      var brokenElv   = risks.مصاعد_متعطلة ? (risks.مصاعد_متعطلة.العدد || 0) : null;

      /* بناء صفوف المخاطر فقط إذا كان لديها قيمة */
      var metaRows = '';
      if (criticalFca != null) metaRows += riskRow('مدارس FCA حرجة (&lt;25)', criticalFca);
      if (overdueSla  != null) metaRows += riskRow('بلاغات SLA مخترقة',        overdueSla);
      if (brokenElv   != null) metaRows += riskRow('مصاعد متعطلة',             brokenElv);

      /* Heatbar */
      var heatLevel = riskScore >= 60 ? 3 : (riskScore >= 30 ? 2 : 1);
      var heatCells = '';
      for (var h = 0; h < 5; h++) {
        heatCells += '<i class="' + (h < heatLevel * (5 / 3) ? 'ac-h' + heatLevel : '') + '"></i>';
      }

      riskSection.innerHTML =
        '<div class="ac-card ac-accent-danger">' +
          '<div class="ac-risk-grid">' +
            '<div class="ac-ring-wrap">' +
              '<svg viewBox="0 0 74 74">' +
                '<circle class="ac-ring-track" cx="37" cy="37" r="31"/>' +
                '<circle class="ac-ring-val" cx="37" cy="37" r="31" style="stroke:' + ringStroke + ';stroke-dashoffset:' + offset + '"/>' +
              '</svg>' +
              '<div class="ac-ring-center"><div class="ac-ring-num">' + riskScore + '</div><div class="ac-ring-lbl">درجة الخطر</div></div>' +
            '</div>' +
            '<div class="ac-risk-meta">' + metaRows + '</div>' +
          '</div>' +
          '<div class="ac-heatbar">' + heatCells + '</div>' +
        '</div>';
    }

    function riskRow(label, value) {
      return '<div class="ac-risk-row"><span>' + label + '</span><span>' + value + '</span></div>';
    }

    /* ══════════════════════════════════════════════════════════
       RENDER: Cost & Priority — hide section if no data
       ══════════════════════════════════════════════════════════ */
    function renderCost(report, kpis) {
      var costGrid    = body.querySelector('#ac-cost-grid');
      var costLabel   = body.querySelector('#ac-cost-section-label');
      if (!costGrid || !costLabel) return;

      var priorities    = report && report['٤_أعلى_5_أولويات_تستحق_قراراً_الآن'];
      var priorityCount = priorities ? priorities.reduce(function(s, p) { return s + (p.عدد || 0); }, 0) : null;
      var totalCost     = kpis.totalCost || null;

      /* لا بيانات — أخفِ القسم بالكامل */
      if (!totalCost && !priorityCount) {
        costGrid.style.display  = 'none';
        costLabel.style.display = 'none';
        return;
      }
      costGrid.style.display  = '';
      costLabel.style.display = '';

      var el1 = costGrid.querySelector('#ac-cost-total');
      var el2 = costGrid.querySelector('#ac-cost-priority');
      var b1  = costGrid.querySelector('#ac-cost-bar1');
      var b2  = costGrid.querySelector('#ac-cost-bar2');

      if (el1) el1.textContent = totalCost || 'بانتظار البيانات';
      if (el2) el2.textContent = (priorityCount != null ? priorityCount : 'بانتظار البيانات');
      if (b1)  b1.style.width  = (totalCost    ? '70%' : '5%');
      if (b2)  b2.style.width  = (priorityCount ? Math.min(100, priorityCount * 4) + '%' : '5%');
    }

    /* ══════════════════════════════════════════════════════════
       RENDER: Recommendations — structured cards, no raw text
       ══════════════════════════════════════════════════════════ */
    function renderRecommendations(report) {
      var recList  = body.querySelector('#ac-rec-list');
      var recLabel = body.querySelector('#ac-rec-section-label');
      if (!recList || !recLabel) return;

      var priorities = report && report['٤_أعلى_5_أولويات_تستحق_قراراً_الآن'];

      /* لا توصيات — أخفِ القسم */
      if (!priorities || !priorities.length) {
        recList.style.display  = 'none';
        recLabel.style.display = 'none';
        return;
      }
      recList.style.display  = '';
      recLabel.style.display = '';

      recList.innerHTML = priorities.map(function(p, i) {
        var prClass = i === 0 ? 'ac-pr-high' : (i < 3 ? '' : 'ac-pr-low');
        var priorText = i === 0 ? 'عالية' : (i < 3 ? 'متوسطة' : 'عادية');
        var countText = (p.عدد != null && p.عدد !== '') ? p.عدد + ' حالة' : '';
        var desc      = [p.الإجراء, p.أمثلة ? 'مثال: ' + p.أمثلة : ''].filter(Boolean).join(' — ');

        return '<div class="ac-rec ' + prClass + '">' +
          '<div class="ac-rec-header">' +
            '<div class="ac-rec-priority-bar"></div>' +
            '<div class="ac-rec-title">' + acEscHtml(p.عنوان || 'توصية ' + (i + 1)) + '</div>' +
            '<span class="ac-rec-badge">' + priorText + '</span>' +
          '</div>' +
          (desc ? '<div class="ac-rec-body"><div class="ac-rec-desc">' + acEscHtml(desc) + '</div></div>' : '') +
          '<div class="ac-rec-footer">' +
            (countText ? '<span>' + svg('target') + ' ' + acEscHtml(countText) + '</span>' : '') +
            '<span>' + svg('clock') + ' أولوية ' + (i + 1) + '</span>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    /* ══════════════════════════════════════════════════════════
       RENDER: Status bar (schools + updated)
       ══════════════════════════════════════════════════════════ */
    function renderStatusBar(report, kpis) {
      var elSchools = panel.querySelector('#ac-stat-schools');
      var elUpdated = panel.querySelector('#ac-stat-updated');
      var elReports = panel.querySelector('#ac-stat-reports');

      var totalSchools = (report && report.إجمالي_المدارس) || kpis.totalSchools;
      if (elSchools) {
        elSchools.innerHTML = svg('target') + ' ' + (totalSchools || '—');
      }
      if (elReports) {
        var totalReports = Array.isArray(window.RAW_BALAGH) ? window.RAW_BALAGH.length : null;
        elReports.innerHTML = svg('flag') + ' ' + (totalReports != null ? totalReports.toLocaleString('ar') : '—');
      }
      if (elUpdated) {
        elUpdated.innerHTML = svg('clock') + ' ' +
          new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
      }
    }

    /* ══════════════════════════════════════════════════════════
       pullLiveData — الجسر الحي (يبقى بنفس المنطق، يتغير العرض فقط)
       ══════════════════════════════════════════════════════════ */
    function pullLiveData() {
      var hasReport  = typeof window.fcbBuildImpactReport === 'function';
      var hasBuilder = window.DashboardContextBuilder &&
                       typeof window.DashboardContextBuilder.collectDashboardData === 'function';

      if (!hasReport && !hasBuilder) {
        /* لا يوجد محرك بيانات — اعرض Empty State نظيفاً */
        var execSection = body.querySelector('#ac-exec-section');
        if (execSection) {
          execSection.innerHTML =
            '<div class="ac-card">' +
              emptyState('🔌', 'محرك البيانات غير متاح', 'تأكد أن dashboard.js محمَّل قبل aicore-orb.js') +
            '</div>';
        }
        return;
      }

      var report    = hasReport  ? safeCall(window.fcbBuildImpactReport) : null;
      var collected = hasBuilder ? safeCall(function() { return window.DashboardContextBuilder.collectDashboardData(); }) : null;
      var kpis      = (collected && collected.kpisDom) || {};

      renderExecSummary(report, kpis);
      renderRisk(report);
      renderCost(report, kpis);
      renderRecommendations(report);
      renderStatusBar(report, kpis);
    }

    /* ════════════════════════════════════════════════════════════
       STATE MACHINE — unchanged signatures
       ════════════════════════════════════════════════════════════ */
    var presenceTextEl = hero.querySelector('.ac-presence-text');
    var presenceIconEl = hero.querySelector('.ac-presence svg');
    var tlItems        = body.querySelectorAll('.ac-tl-item');
    var presenceIdx = 0, presenceTimer = null, tlTimer = null;
    var STATE_CLASSES = ['ac-thinking','ac-generating','ac-critical','ac-warning','ac-success','ac-offline'];

    function setState(name) {
      STATE_CLASSES.forEach(function(c) { panel.classList.remove(c); root.classList.remove(c); });
      if (name && name !== 'idle') { panel.classList.add('ac-' + name); root.classList.add('ac-' + name); }
    }
    function setPresenceText(iconName, text) {
      if (ICONS[iconName] && presenceIconEl) presenceIconEl.innerHTML = ICONS[iconName];
      if (presenceTextEl) presenceTextEl.textContent = text;
    }
    function cyclePresence() {
      var p = PRESENCE[presenceIdx % PRESENCE.length];
      setPresenceText(p.icon, p.text);
      presenceIdx++;
    }
    function runTimeline() {
      var step = 0;
      tlItems.forEach(function(n) { n.classList.remove('ac-active','ac-done'); });
      clearInterval(tlTimer);
      tlTimer = setInterval(function() {
        if (step > 0) tlItems[step - 1].classList.add('ac-done');
        if (step >= tlItems.length) { clearInterval(tlTimer); return; }
        tlItems[step].classList.remove('ac-done');
        tlItems[step].classList.add('ac-active');
        step++;
      }, 420);
    }
    function startThinking() {
      setState('thinking');
      cyclePresence();
      presenceTimer = setInterval(cyclePresence, 1400);
      runTimeline();
    }
    function stopThinking(finalText) {
      clearInterval(presenceTimer);
      clearInterval(tlTimer);
      tlItems.forEach(function(n) { n.classList.remove('ac-active'); n.classList.add('ac-done'); });
      setState('idle');
      setPresenceText('check', finalText || 'جاهز');
    }

    /* ════════════════════════════════════════════════════════════
       OPEN / CLOSE
       ════════════════════════════════════════════════════════════ */
    var liveRefreshTimer = null;

    function open() {
      root.classList.add('ac-open');
      trigger.setAttribute('aria-expanded', 'true');
      startThinking();
      pullLiveData();
      acRestoreHistoryOnce();
      setTimeout(function() { stopThinking('جاهز للاستخدام'); }, 3400);
      clearInterval(liveRefreshTimer);
      liveRefreshTimer = setInterval(pullLiveData, 8000);
      setTimeout(function() { var i = footer.querySelector('#ac-input'); if (i) i.focus(); }, 60);
    }
    function close() {
      root.classList.remove('ac-open');
      trigger.setAttribute('aria-expanded', 'false');
      clearInterval(presenceTimer);
      clearInterval(tlTimer);
      clearInterval(liveRefreshTimer);
      trigger.focus();
    }

    /* ── Focus trap: keep Tab navigation inside the panel while open ── */
    document.addEventListener('keydown', function(e) {
      if (e.key !== 'Tab' || !root.classList.contains('ac-open')) return;
      var focusables = panel.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      var list = Array.prototype.filter.call(focusables, function(n) { return !n.disabled && n.offsetParent !== null; });
      if (!list.length) return;
      var first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    /* ── Visual-only: click ripple feedback on trigger ── */
    try {
      trigger.addEventListener('pointerdown', function() {
        trigger.classList.remove('ac-t-rippling');
        void trigger.offsetWidth; /* restart animation if clicked rapidly */
        trigger.classList.add('ac-t-rippling');
      });
      trigger.addEventListener('animationend', function(e) {
        if (e.animationName === 'ac-ripple-out') trigger.classList.remove('ac-t-rippling');
      });
    } catch (e) {}

    /* ── Visual-only: magnetic cursor attraction on trigger ── */
    try {
      var acMagnetActive = false;
      trigger.addEventListener('pointerenter', function() { acMagnetActive = true; });
      trigger.addEventListener('pointerleave', function() {
        acMagnetActive = false;
        trigger.style.setProperty('--mx', '0px');
        trigger.style.setProperty('--my', '0px');
      });
      trigger.addEventListener('pointermove', function(e) {
        if (!acMagnetActive) return;
        var r = trigger.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.22;
        trigger.style.setProperty('--mx', dx.toFixed(1) + 'px');
        trigger.style.setProperty('--my', dy.toFixed(1) + 'px');
      });
    } catch (e) {}

    /* ── Mouse parallax for orb layers inside the panel ── */
    try {
      var orbEl = hero.querySelector('.ac-orb');
      if (orbEl) {
        panel.addEventListener('pointermove', function(e) {
          if (!root.classList.contains('ac-open')) return;
          var r = orbEl.getBoundingClientRect();
          var cx = r.left + r.width / 2;
          var cy = r.top + r.height / 2;
          var dx = (e.clientX - cx) * 0.04;
          var dy = (e.clientY - cy) * 0.04;
          var orbSvg = orbEl.querySelector('.ac-wire-orb');
          if (orbSvg) {
            orbSvg.style.setProperty('--orb-px', dx.toFixed(2));
            orbSvg.style.setProperty('--orb-py', dy.toFixed(2));
          }
        });
        panel.addEventListener('pointerleave', function() {
          var orbSvg = orbEl.querySelector('.ac-wire-orb');
          if (orbSvg) {
            orbSvg.style.setProperty('--orb-px', '0');
            orbSvg.style.setProperty('--orb-py', '0');
          }
        });
      }
      /* Also parallax for trigger orb */
      trigger.addEventListener('pointermove', function(e) {
        var orbSvg = trigger.querySelector('.ac-wire-orb');
        if (!orbSvg) return;
        var r = trigger.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.06;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.06;
        orbSvg.style.setProperty('--orb-px', dx.toFixed(2));
        orbSvg.style.setProperty('--orb-py', dy.toFixed(2));
      });
      trigger.addEventListener('pointerleave', function() {
        var orbSvg = trigger.querySelector('.ac-wire-orb');
        if (orbSvg) {
          orbSvg.style.setProperty('--orb-px', '0');
          orbSvg.style.setProperty('--orb-py', '0');
        }
      });
    } catch (e) {}

    trigger.addEventListener('click', function() { root.classList.contains('ac-open') ? close() : open(); });
    panel.querySelector('.ac-close').addEventListener('click', close);
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && root.classList.contains('ac-open')) close(); });

    /* ════════════════════════════════════════════════════════════
       CHAT — composer, streaming reveal, stop/regenerate, actions
       ════════════════════════════════════════════════════════════ */
    var inputEl        = footer.querySelector('#ac-input');
    var sendBtn         = footer.querySelector('#ac-send-btn');
    var charCountEl     = footer.querySelector('#ac-char-count');
    var footerNote      = footer.querySelector('#ac-footer-note');
    var threadEl        = body.querySelector('#ac-chat-thread');
    var quickRepliesEl  = body.querySelector('#ac-quick-replies');
    if (threadEl) { threadEl.setAttribute('aria-live', 'polite'); threadEl.setAttribute('aria-relevant', 'additions'); }

    function acTimeNow() {
      return new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    }

    /* ── Textarea auto-height + live char counter ── */
    var AC_INPUT_MAX_H = 132;
    function acAutosize() {
      if (!inputEl) return;
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, AC_INPUT_MAX_H) + 'px';
    }
    function acUpdateCounter() {
      if (!inputEl || !charCountEl) return;
      var len = inputEl.value.length;
      charCountEl.textContent = len > 0 ? (len + '/' + AC_MAX_CHARS) : '';
      charCountEl.classList.toggle('ac-char-warn', len > AC_MAX_CHARS * .9);
    }
    if (inputEl) {
      inputEl.addEventListener('input', function() { acAutosize(); acUpdateCounter(); });
    }

    /* ── Message actions: copy + regenerate ── */
    function acCopyText(rawText, btn) {
      var done = function() {
        btn.classList.add('ac-copied');
        var prevLabel = btn.getAttribute('aria-label');
        btn.setAttribute('aria-label', 'تم النسخ');
        setTimeout(function() { btn.classList.remove('ac-copied'); btn.setAttribute('aria-label', prevLabel); }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(rawText).then(done).catch(function() {});
      } else {
        try {
          var ta = document.createElement('textarea');
          ta.value = rawText; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); document.body.removeChild(ta);
          done();
        } catch(e) {}
      }
    }
    function acLastUserPrompt() {
      var rows = threadEl.querySelectorAll('.ac-msg-row.ac-msg-user');
      if (!rows.length) return '';
      return rows[rows.length - 1].getAttribute('data-raw') || '';
    }
    function acClearRegenerateButtons() {
      threadEl.querySelectorAll('.ac-msg-regen').forEach(function(b) { b.remove(); });
    }

    /* Smart autoscroll: only snap to bottom if the user was already near
       the bottom (or force=true, e.g. right after their own message).
       Without this, reading earlier history while a reply streams in
       gets interrupted every ~26ms by a forced jump. */
    function acScrollToBottom(force) {
      if (!threadEl) return;
      var nearBottom = (threadEl.scrollHeight - threadEl.scrollTop - threadEl.clientHeight) < 80;
      if (force || nearBottom) threadEl.scrollTop = threadEl.scrollHeight;
    }

    function acAppendMsg(html, who, rawText) {
      var safeHtml = (html != null && String(html).trim() !== '')
        ? html
        : '<p class="ac-empty-note">لا يوجد محتوى لعرضه.</p>';
      var row = el('div', 'ac-msg-row ac-msg-' + who);
      if (rawText != null) row.setAttribute('data-raw', rawText);
      var actionsHtml = '';
      if (who === 'bot') {
        acClearRegenerateButtons();
        actionsHtml = '<div class="ac-msg-actions">' +
          '<button type="button" class="ac-msg-act ac-msg-copy" aria-label="نسخ الرد">' + svg('copy') + '</button>' +
          '<button type="button" class="ac-msg-act ac-msg-regen" aria-label="إعادة توليد الرد">' + svg('redo') + '</button>' +
        '</div>';
      }
      var avatarHtml = who === 'user'
        ? '<div class="ac-msg-avatar" aria-hidden="true">أنت</div>'
        : '<div class="ac-msg-avatar" aria-hidden="true">' + svg('brain') + '</div>';
      row.innerHTML =
        avatarHtml +
        '<div class="ac-msg-col">' +
          '<div class="ac-msg-bubble"><div class="ac-msg-content">' + safeHtml + '</div></div>' +
          actionsHtml +
          '<div class="ac-msg-time">' + acTimeNow() + '</div>' +
        '</div>';
      threadEl.appendChild(row);
      acScrollToBottom(who === 'user');
      acMountPendingCharts();

      if (who === 'bot') {
        var copyBtn  = row.querySelector('.ac-msg-copy');
        var regenBtn = row.querySelector('.ac-msg-regen');
        if (copyBtn)  copyBtn.addEventListener('click', function() { acCopyText(rawText != null ? rawText : row.querySelector('.ac-msg-content').textContent, copyBtn); });
        if (regenBtn) regenBtn.addEventListener('click', function() {
          var prompt = acLastUserPrompt();
          if (prompt) sendToAI(prompt, { regenerate: true });
        });
      }
      return row;
    }

    var typingRow = null;
    function acShowTyping() {
      typingRow = el('div', 'ac-msg-row ac-msg-bot ac-msg-typing');
      typingRow.innerHTML = '<div class="ac-msg-avatar" aria-hidden="true">' + svg('brain') + '</div><div class="ac-msg-col"><div class="ac-msg-bubble"><span class="ac-typing-dots"><i></i><i></i><i></i></span></div></div>';
      threadEl.appendChild(typingRow);
      acScrollToBottom(true);
    }
    function acHideTyping() { if (typingRow) { typingRow.remove(); typingRow = null; } }
    function acHideQuickReplies() { if (quickRepliesEl) quickRepliesEl.style.display = 'none'; }

    var acHistoryRestored = false;
    function acRestoreHistoryOnce() {
      if (acHistoryRestored) return;
      acHistoryRestored = true;
      if (typeof window.fcbLoadHistory !== 'function') return;
      try {
        var hist = window.fcbLoadHistory() || [];
        if (hist.length) acHideQuickReplies();
        hist.forEach(function(m) {
          var isUser = m.role === 'user';
          acAppendMsg(isUser ? acInlineMd(m.content) : acRenderMarkdown(m.content), isUser ? 'user' : 'bot', m.content);
        });
      } catch(e) { console.warn('[AICore] history restore error', e); }
    }

    if (quickRepliesEl) {
      quickRepliesEl.querySelectorAll('.ac-qr-pill').forEach(function(btn) {
        btn.addEventListener('click', function() { sendToAI(btn.textContent.trim()); });
      });
    }

    /* ── حذف المحادثة: يمسح السجل المحفوظ (history) والشاشة، مع تأكيد قبل الحذف ── */
    var clearChatBtn = panel.querySelector('#ac-clear-chat-btn');
    if (clearChatBtn) {
      clearChatBtn.addEventListener('click', function() {
        if (!threadEl || !threadEl.children.length) return; // مفيش محادثة أصلاً
        if (!window.confirm('هل تريد حذف هذه المحادثة نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.')) return;
        if (acGenerating) acStopGenerating();
        if (typeof window.fcbForgetAll === 'function') window.fcbForgetAll();
        threadEl.innerHTML = '';
        acHistoryRestored = true; // منع أي محاولة استعادة سجل بعد الحذف
        if (quickRepliesEl) quickRepliesEl.style.display = '';
      });
    }

    /* ── تكبير/تصغير نافذة الشات — تبديل + حفظ التفضيل محلياً ── */
    var EXPAND_STORAGE_KEY = 'ac_panel_expanded_v1';
    var expandBtn = panel.querySelector('#ac-expand-btn');
    function applyExpandState(expanded) {
      panel.classList.toggle('ac-expanded', expanded);
      if (expandBtn) {
        expandBtn.innerHTML = svg(expanded ? 'collapse' : 'expand');
        expandBtn.title = expanded ? 'تصغير النافذة' : 'تكبير النافذة';
      }
    }
    if (expandBtn) {
      var savedExpanded = true; // الافتراضي: النافذة موسّعة من أول فتح
      try {
        var savedRaw = localStorage.getItem(EXPAND_STORAGE_KEY);
        if (savedRaw !== null) savedExpanded = savedRaw === '1'; // احترم اختيار المستخدم لو غيّره قبل كده
      } catch (_) {}
      applyExpandState(savedExpanded);
      expandBtn.addEventListener('click', function() {
        var next = !panel.classList.contains('ac-expanded');
        applyExpandState(next);
        try { localStorage.setItem(EXPAND_STORAGE_KEY, next ? '1' : '0'); } catch (_) {}
      });
    }

    if (sendBtn) sendBtn.addEventListener('click', function() {
      if (acGenerating) { acStopGenerating(); return; }
      sendToAI();
    });
    if (inputEl) inputEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendToAI(); }
    });

    /* ── Stop / Generating state ── */
    var acGenerating   = false;
    var acStreamTimer  = null;
    var acStreamAbort  = false;
    function acSetSendMode(mode) {
      /* mode: 'send' | 'stop' */
      if (!sendBtn) return;
      acGenerating = (mode === 'stop');
      sendBtn.classList.toggle('ac-send-is-stop', acGenerating);
      sendBtn.innerHTML = svg(acGenerating ? 'stop' : 'send');
      sendBtn.setAttribute('aria-label', acGenerating ? 'إيقاف التوليد' : 'إرسال');
    }
    function acStopGenerating() {
      acStreamAbort = true;
      clearTimeout(acStreamTimer);
      acHideTyping();
      stopThinking('تم الإيقاف');
      acSetSendMode('send');
    }

    /* ── Simulated progressive reveal of the final reply ──
       ملاحظة: fcbAskOpenAI يُرجع الرد كاملاً دفعة واحدة (لا يوجد
       streaming حقيقي من الخادم)، لذا هذه محاكاة بصرية للعرض
       التدريجي بعد استلام الرد كاملاً، مع دعم إيقاف فوري. */
    function acStreamReply(rawReply) {
      acStreamAbort = false;
      acSetSendMode('stop');
      setState('generating');
      var row = acAppendMsg('<span class="ac-caret"></span>', 'bot', rawReply);
      var contentEl = row.querySelector('.ac-msg-content');
      var text = String(rawReply || '');
      var chunks = text.split(/(\s+)/); // keep whitespace tokens
      var idx = 0, shown = '';

      function step() {
        if (acStreamAbort) { finish(); return; }
        var burst = 2; // words per tick
        for (var k = 0; k < burst && idx < chunks.length; k++, idx++) shown += chunks[idx];
        contentEl.innerHTML = acInlineMd(shown) + '<span class="ac-caret"></span>';
        acScrollToBottom(false);
        if (idx < chunks.length) {
          acStreamTimer = setTimeout(step, 26);
        } else {
          finish();
        }
      }
      function finish() {
        clearTimeout(acStreamTimer);
        contentEl.innerHTML = acRenderMarkdown(text);
        acMountPendingCharts();
        acSetSendMode('send');
        setState('idle');
        stopThinking('جاهز');
      }
      step();
    }

    function sendToAI(presetText, opts) {
      opts = opts || {};
      var text = (typeof presetText === 'string' ? presetText : (inputEl ? inputEl.value : '')).trim();
      if (!text) return;
      acHideQuickReplies();
      if (!opts.regenerate) {
        acAppendMsg(acInlineMd(text), 'user', text);
      }
      if (inputEl) { inputEl.value = ''; acAutosize(); acUpdateCounter(); }

      /* أوامر الذاكرة — نفس المنطق القديم */
      if (/^(انسَ|انسى|امسح الذاكرة|امسح ذاكرتك)\s*(كل شيء|الكل)?\.?$/i.test(text)) {
        if (typeof window.fcbForgetAll === 'function') window.fcbForgetAll();
        acAppendMsg('🗑️ تم مسح كل الذاكرة والمحادثات المحفوظة.', 'bot');
        return;
      }
      if (typeof window.fcbMaybeLearnFact === 'function') {
        var learned = window.fcbMaybeLearnFact(text);
        if (learned) {
          acAppendMsg('✅ تم الحفظ في الذاكرة: "' + acEscHtml(learned) + '"', 'bot');
          return;
        }
      }

      var hasAsk = typeof window.fcbAskOpenAI === 'function';
      startThinking();
      acShowTyping();
      acSetSendMode('stop');
      acStreamAbort = false;

      if (!hasAsk) {
        acHideTyping();
        stopThinking('جاهز');
        acSetSendMode('send');
        acAppendMsg('<p>⚠️ خدمة الذكاء الاصطناعي غير متاحة حالياً — تحقق من تهيئة dashboard.js.</p>', 'bot');
        return;
      }

      window.fcbAskOpenAI(text).then(function(reply) {
        acHideTyping();
        if (acStreamAbort) { acSetSendMode('send'); stopThinking('جاهز'); return; }
        acStreamReply(reply);
      }).catch(function(err) {
        acHideTyping();
        if (acStreamAbort) { acSetSendMode('send'); stopThinking('جاهز'); return; }
        stopThinking('جاهز');
        acSetSendMode('send');
        var prefix = err && err.code === 'NO_API_KEY'
          ? '<p>⚠️ لا يوجد اتصال متاح حالياً (تحقق من CFG.PROXY_URL).</p>'
          : err && err.code === 'INVALID_KEY'
            ? '<p>⚠️ مفتاح API غير صحيح أو منتهٍ.</p>'
            : '<p>⚠️ فشل الاتصال — إليك إجابة مبدئية محدودة:</p>';
        var fallback = typeof window.fcbReplyFor === 'function' ? window.fcbReplyFor(text) : '';
        var errRow = acAppendMsg(prefix + (fallback ? acRenderMarkdown(fallback) : ''), 'bot');
        errRow.classList.add('ac-msg-error');
        var retryBtn = el('button', 'ac-retry-btn', 'إعادة المحاولة');
        retryBtn.type = 'button';
        retryBtn.addEventListener('click', function() { retryBtn.disabled = true; sendToAI(text); });
        errRow.querySelector('.ac-msg-bubble').appendChild(retryBtn);
      });
    }

    /* Footer note */
    (function checkOpenAIConnection() {
      var connected = typeof window.fcbAskOpenAI === 'function' &&
        window.AIService && typeof window.AIService.hasKey === 'function' && window.AIService.hasKey();
      if (footerNote) {
        footerNote.textContent = connected
          ? 'متصل بخدمة الذكاء الاصطناعي عبر البروكسي الآمن'
          : 'قد يحدث خطأ — راجع القرارات الحرجة قبل التنفيذ';
      }
    })();

    /* ════════════════════════════════════════════════════════════
       MARKDOWN RENDERER — نفس المحرك، نفس الصيغة، ألوان أنظف
       ════════════════════════════════════════════════════════════ */
    function acEscHtml(str) {
      return String(str == null ? '' : str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
    function acInlineMd(s) {
      return acEscHtml(s)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<img class="ac-md-img" src="$2" alt="$1" loading="lazy">')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a class="ac-md-link" href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/\[(\d{1,2})\](?!\()/g, '<sup class="ac-citation">$1</sup>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\$([^$\n]+)\$/g, '<span class="ac-md-math">$1</span>')
        .replace(/(\d[\d.,%٪\/\-]*\d|\d+%?)/g, '<span class="ac-num">$1</span>');
    }

    var AC_STATUS_MAP = [
      { re: /^\s*⚠️/,      cls: 'ac-alert-warn'   },
      { re: /^\s*(✅|✔)/,  cls: 'ac-alert-good'   },
      { re: /^\s*(❌|🗑️)/, cls: 'ac-alert-danger' },
      { re: /^\s*(💡|📊)/, cls: 'ac-alert-info'   }
    ];
    function acWrapStatusLine(lineHtml, rawLine) {
      for (var i = 0; i < AC_STATUS_MAP.length; i++) {
        if (AC_STATUS_MAP[i].re.test(rawLine)) {
          return '<div class="ac-alert-box ' + AC_STATUS_MAP[i].cls + '">' + lineHtml + '</div>';
        }
      }
      return '<p>' + lineHtml + '</p>';
    }

    function acBuildTableHtml(headerCells, rows) {
      var thead = '<thead><tr>' + headerCells.map(function(h) { return '<th>' + acInlineMd(h.trim()) + '</th>'; }).join('') + '</tr></thead>';
      var tbody = '<tbody>' + rows.map(function(r) {
        return '<tr>' + r.map(function(c) { return '<td>' + acInlineMd(c.trim()) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody>';
      return '<div class="ac-table-wrap"><table class="ac-md-table">' + thead + tbody + '</table></div>';
    }

    var acChartQueue = [];
    function acBuildChartPlaceholder(specJson) {
      var id = 'ac-chart-' + Date.now() + '-' + Math.floor(Math.random() * 9999);
      acChartQueue.push({ id: id, specJson: specJson });
      return '<div class="ac-chart-wrap" id="' + id + '-wrap">' +
        '<div class="ac-chart-loading">' + svg('activity') + ' جارٍ تجهيز الرسم البياني…</div>' +
        '<canvas id="' + id + '" height="200" style="display:none"></canvas>' +
      '</div>';
    }
    function acBuildFallbackBars(spec) {
      var labels = spec.labels || [];
      var ds     = (spec.datasets && spec.datasets[0]) || { data: [] };
      var data   = ds.data || [];
      if (!labels.length || !data.length) return '';
      var max = Math.max.apply(null, data.map(function(v) { return Math.abs(Number(v) || 0); })) || 1;
      var rows = labels.map(function(lbl, i) {
        var v   = Number(data[i]) || 0;
        var pct = Math.max(2, Math.round((Math.abs(v) / max) * 100));
        return '<div class="ac-fb-row">' +
          '<div class="ac-fb-label">' + acInlineMd(String(lbl)) + '</div>' +
          '<div class="ac-fb-track"><div class="ac-fb-fill" style="width:' + pct + '%"></div></div>' +
          '<div class="ac-fb-val ac-num">' + acInlineMd(String(data[i])) + '</div>' +
        '</div>';
      }).join('');
      var title = spec.title ? '<div class="ac-fb-title">' + acInlineMd(spec.title) + '</div>' : '';
      return title + '<div class="ac-fb-chart">' + rows + '</div>';
    }
    function acMountPendingCharts() {
      if (!acChartQueue.length) return;
      var pending = acChartQueue.slice();
      acChartQueue.length = 0;
      pending.forEach(function(item) {
        var wrap   = document.getElementById(item.id + '-wrap');
        var canvas = document.getElementById(item.id);
        if (!wrap || !canvas) return;
        var spec;
        try { spec = JSON.parse(item.specJson); } catch(e) {
          wrap.innerHTML = '<div class="ac-alert-box ac-alert-warn">⚠️ تعذّر عرض هذا الرسم البياني.</div>';
          return;
        }
        if (typeof window.Chart === 'undefined') {
          wrap.innerHTML = acBuildFallbackBars(spec) || '<div class="ac-alert-box ac-alert-warn">⚠️ لا توجد بيانات كافية.</div>';
          return;
        }
        wrap.querySelector('.ac-chart-loading').style.display = 'none';
        canvas.style.display = 'block';
        try {
          new window.Chart(canvas.getContext('2d'), {
            type: spec.type || 'bar',
            data: {
              labels: spec.labels || [],
              datasets: (spec.datasets || []).map(function(d) {
                return { label: d.label || '', data: d.data || [], backgroundColor: 'rgba(30,194,224,.52)', borderColor: 'rgba(13,132,156,.85)', borderWidth: 1 };
              })
            },
            options: { responsive: true, plugins: { title: { display: !!spec.title, text: spec.title || '' } } }
          });
        } catch(e) {
          wrap.innerHTML = acBuildFallbackBars(spec) || '<div class="ac-alert-box ac-alert-warn">⚠️ تعذّر رسم هذا المخطط.</div>';
        }
      });
    }

    /* ── Lightweight syntax highlighting (regex-based, no external lib) ──
       Not a full tokenizer — good enough to make code blocks read like a
       real editor (keywords / strings / comments / numbers) without
       pulling in a heavy dependency for a chat widget. */
    var AC_HL_KEYWORDS = /\b(function|return|const|let|var|if|else|for|while|class|import|export|from|new|try|catch|finally|async|await|def|elif|print|True|False|None|null|true|false|public|static|void|int|string|self|this)\b/g;
    function acHighlightCode(code, lang) {
      var esc = acEscHtml(code);
      var isHashComment = /^(py|python|rb|ruby|sh|bash|yaml|yml)$/i.test(lang || '');
      var strRe = /(&quot;.*?&quot;|&#39;.*?&#39;|"[^"\n]*"|'[^'\n]*')/g;
      var cmtRe = isHashComment ? /(#.*$)/gm : /(\/\/.*$)/gm;
      var numRe = /\b(\d+\.?\d*)\b/g;
      var placeholders = [];
      function stash(html) { placeholders.push(html); return '\x00P' + (placeholders.length - 1) + '\x00'; }
      esc = esc.replace(cmtRe, function(m) { return stash('<span class="ac-hl-comment">' + m + '</span>'); });
      esc = esc.replace(strRe, function(m) { return stash('<span class="ac-hl-string">' + m + '</span>'); });
      esc = esc.replace(numRe, function(m) { return '<span class="ac-hl-number">' + m + '</span>'; });
      esc = esc.replace(AC_HL_KEYWORDS, function(m) { return '<span class="ac-hl-keyword">' + m + '</span>'; });
      esc = esc.replace(/\x00P(\d+)\x00/g, function(_, idx) { return placeholders[idx]; });
      return esc;
    }
    function acPrettyJson(raw) {
      try { return JSON.stringify(JSON.parse(raw), null, 2); } catch (e) { return raw; }
    }
    function acParseCsv(raw) {
      var lines = raw.replace(/\r/g,'').split('\n').filter(function(l){ return l.trim() !== ''; });
      return lines.map(function(l) { return l.split(',').map(function(c){ return c.trim(); }); });
    }

    function acRenderMarkdown(raw) {
      if (raw == null) return '';
      var text = String(raw);
      var lines = text.replace(/```chart\s*([\s\S]*?)```/g, function(m, json) {
        return '\x00CHART\x00' + json.trim() + '\x00/CHART\x00';
      }).split(/\r?\n/);

      var i = 0, htmlParts = [];
      while (i < lines.length) {
        var line = lines[i];

        var chartMatch = line.match(/^\x00CHART\x00([\s\S]*)$/);
        if (chartMatch) {
          var full = lines.slice(i).join('\n');
          var m2   = full.match(/^\x00CHART\x00([\s\S]*?)\x00\/CHART\x00/);
          if (m2) {
            htmlParts.push(acBuildChartPlaceholder(m2[1]));
            i += m2[0].split(/\r?\n/).length;
            continue;
          }
        }
        var codeFence = line.match(/^\s*```(\S*)\s*$/);
        if (codeFence) {
          var codeLang  = (codeFence[1] || '').toLowerCase();
          var codeLines = [];
          var k = i + 1;
          while (k < lines.length && !/^\s*```\s*$/.test(lines[k])) { codeLines.push(lines[k]); k++; }
          var codeRaw = codeLines.join('\n');
          if (codeLang === 'json') {
            htmlParts.push(
              '<div class="ac-code-wrap ac-code-json" data-lang="json">' +
              '<pre><code>' + acHighlightCode(acPrettyJson(codeRaw), 'json') + '</code></pre></div>'
            );
          } else if (codeLang === 'csv') {
            var csvRows = acParseCsv(codeRaw);
            if (csvRows.length) {
              htmlParts.push('<div class="ac-csv-badge">CSV</div>' + acBuildTableHtml(csvRows[0], csvRows.slice(1)));
            }
          } else if (codeLang === 'html' || codeLang === 'htm') {
            /* Rendered as a labeled, escaped preview — not executed —
               to avoid running untrusted markup inside the panel. */
            htmlParts.push(
              '<div class="ac-code-wrap ac-code-html" data-lang="html">' +
              '<pre><code>' + acHighlightCode(codeRaw, 'html') + '</code></pre></div>'
            );
          } else {
            htmlParts.push(
              '<div class="ac-code-wrap"' + (codeLang ? ' data-lang="' + acEscHtml(codeLang) + '"' : '') + '>' +
              '<pre><code>' + acHighlightCode(codeRaw, codeLang) + '</code></pre></div>'
            );
          }
          i = (k < lines.length) ? k + 1 : k;
          continue;
        }
        var mathFence = line.match(/^\s*\$\$\s*$/);
        if (mathFence) {
          var mathLines = [];
          var mk = i + 1;
          while (mk < lines.length && !/^\s*\$\$\s*$/.test(lines[mk])) { mathLines.push(lines[mk]); mk++; }
          htmlParts.push('<div class="ac-md-math-block">' + acEscHtml(mathLines.join('\n')) + '</div>');
          i = (mk < lines.length) ? mk + 1 : mk;
          continue;
        }
        var calloutMatch = line.match(/^:::(info|warning|success|danger)\s*(.*)$/);
        if (calloutMatch) {
          var calloutType  = calloutMatch[1];
          var calloutTitle = calloutMatch[2];
          var calloutLines = [];
          var ck = i + 1;
          while (ck < lines.length && !/^:::\s*$/.test(lines[ck])) { calloutLines.push(lines[ck]); ck++; }
          htmlParts.push(
            '<div class="ac-callout ac-callout-' + calloutType + '">' +
            (calloutTitle ? '<div class="ac-callout-title">' + acInlineMd(calloutTitle) + '</div>' : '') +
            '<div class="ac-callout-body">' + calloutLines.map(function(l){ return acInlineMd(l); }).join('<br>') + '</div>' +
            '</div>'
          );
          i = (ck < lines.length) ? ck + 1 : ck;
          continue;
        }
        if (/^\s*\|.*\|\s*$/.test(line) && lines[i + 1] && /^\s*\|?[\s:-]+\|[\s:|-]+\s*$/.test(lines[i + 1])) {
          var headerCells = line.trim().replace(/^\||\|$/g,'').split('|');
          var rows = [];
          var j    = i + 2;
          while (j < lines.length && /^\s*\|.*\|\s*$/.test(lines[j])) {
            rows.push(lines[j].trim().replace(/^\||\|$/g,'').split('|'));
            j++;
          }
          htmlParts.push(acBuildTableHtml(headerCells, rows));
          i = j;
          continue;
        }
        if (/^###\s+/.test(line)) { htmlParts.push('<h4 class="ac-md-h">' + acInlineMd(line.replace(/^###\s+/,'')) + '</h4>'); i++; continue; }
        if (/^##\s+/.test(line))  { htmlParts.push('<h3 class="ac-md-h">' + acInlineMd(line.replace(/^##\s+/, ''))  + '</h3>'); i++; continue; }
        if (/^>\s?/.test(line)) {
          var qlines = [];
          while (i < lines.length && /^>\s?/.test(lines[i])) { qlines.push(lines[i].replace(/^>\s?/, '')); i++; }
          htmlParts.push('<blockquote class="ac-md-blockquote">' + qlines.map(function(q){ return acInlineMd(q); }).join('<br>') + '</blockquote>');
          continue;
        }
        if (/^\s*[-*]\s+\[[ xX]\]\s+/.test(line)) {
          var titems = [];
          while (i < lines.length && /^\s*[-*]\s+\[[ xX]\]\s+/.test(lines[i])) {
            var tm = lines[i].match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
            var done = tm[1].toLowerCase() === 'x';
            titems.push('<li class="ac-task-item' + (done ? ' ac-task-done' : '') + '"><span class="ac-task-box" aria-hidden="true">' + (done ? '✓' : '') + '</span>' + acInlineMd(tm[2]) + '</li>');
            i++;
          }
          htmlParts.push('<ul class="ac-md-ul ac-task-list">' + titems.join('') + '</ul>');
          continue;
        }
        if (/^[-*]\s+/.test(line)) {
          var items = [];
          while (i < lines.length && /^([-*]\s+|\s{2,}[-*]\s+)/.test(lines[i])) {
            var indented = /^\s{2,}[-*]\s+/.test(lines[i]);
            var itemText = acInlineMd(lines[i].replace(/^\s*[-*]\s+/, ''));
            if (indented && items.length) {
              items[items.length - 1] = items[items.length - 1].replace(/<\/li>$/, '') +
                (items[items.length - 1].indexOf('<ul class="ac-md-ul ac-md-nested">') === -1 ? '<ul class="ac-md-ul ac-md-nested">' : '');
              items[items.length - 1] += '<li>' + itemText + '</li>';
            } else {
              if (items.length && items[items.length - 1].indexOf('<ul class="ac-md-ul ac-md-nested">') !== -1 && items[items.length - 1].slice(-5) !== '</ul>') {
                items[items.length - 1] += '</ul></li>';
              }
              items.push('<li>' + itemText);
              items[items.length - 1] += (indented ? '' : '</li>');
            }
            i++;
          }
          if (items.length) {
            var last = items[items.length - 1];
            if (last.indexOf('<ul class="ac-md-ul ac-md-nested">') !== -1 && last.slice(-5) !== '</ul>') items[items.length - 1] = last + '</ul></li>';
          }
          htmlParts.push('<ul class="ac-md-ul">' + items.join('') + '</ul>');
          continue;
        }
        if (/^\d+[.)]\s+/.test(line)) {
          var oitems = [];
          while (i < lines.length && /^\d+[.)]\s+/.test(lines[i])) { oitems.push('<li>' + acInlineMd(lines[i].replace(/^\d+[.)]\s+/,'')) + '</li>'); i++; }
          htmlParts.push('<ol class="ac-md-ol">' + oitems.join('') + '</ol>');
          continue;
        }
        if (line.trim() === '') { i++; continue; }
        htmlParts.push(acWrapStatusLine(acInlineMd(line), line));
        i++;
      }
      var joined = htmlParts.join('');
      return joined.trim() ? joined : '<p class="ac-empty-note">تعذّر توليد محتوى لهذا الرد.</p>';
    }

    /* ════════════════════════════════════════════════════════════
       PUBLIC API — unchanged signatures
       ════════════════════════════════════════════════════════════ */
    window.AICore = {
      open:            open,
      close:           close,
      setState:        setState,
      setPresenceText: function(icon, text) { setPresenceText(icon, text); },
      showAlert:       function(show) { trigger.classList.toggle('ac-has-alert', !!show); },
      refresh:         pullLiveData
    };

    /* Bootstrap — جلب بيانات مبكر + تنبيه مخاطر حرجة */
    setTimeout(function() {
      pullLiveData();
      try {
        var r     = window.fcbBuildImpactReport && window.fcbBuildImpactReport();
        var risks = r && r['٣_نقاط_الخطر_والمخاوف'];
        if (risks && risks.FCA && risks.FCA.مدارس_حرجة_تحت_25 > 0) {
          trigger.classList.add('ac-has-alert');
        }
      } catch(e) {}
    }, 600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
