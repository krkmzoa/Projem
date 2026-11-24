/* Ortak yardımcılar — müşteri menüsü, TV ekranı, QR ve yönetim sayfaları kullanır.
   Eski akıllı TV tarayıcılarında da çalışsın diye yeni JS söz dizimi (?. ?? vb.) kullanılmadı. */
(function (global) {
  'use strict';

  var MenuCore = {};

  /** menu.json dosyasını önbelleği atlayarak getirir. */
  MenuCore.load = function () {
    return fetch('menu.json?v=' + Date.now(), { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('menu.json yüklenemedi (' + r.status + ')');
      return r.json();
    }).then(MenuCore.normalize);
  };

  /** Eksik alanları varsayılanlarla doldurur; eski/yarım dosyalar da sorunsuz açılır. */
  MenuCore.normalize = function (m) {
    m = m || {};
    m.cafe = m.cafe || {};
    m.theme = m.theme || {};
    m.categories = Array.isArray(m.categories) ? m.categories : [];
    var c = m.cafe;
    ['name', 'slogan', 'logo', 'phone', 'instagram', 'address', 'wifiName', 'wifiPassword', 'note', 'menuUrl', 'cover', 'website', 'facebook', 'hours', 'mapsUrl', 'tiktok', 'whatsapp', 'reviewUrl'].forEach(function (k) {
      if (typeof c[k] !== 'string') c[k] = '';
    });
    if (!c.currency) c.currency = '₺';
    if (!m.theme.accent) m.theme.accent = '#b5651d';
    if (!m.theme.tvSeconds) m.theme.tvSeconds = 12;
    if (!m.theme.tvColumns) m.theme.tvColumns = 3;
    m.theme.tvScale = Math.max(0.7, Math.min(2.5, Number(m.theme.tvScale) || 1));
    var langs = Array.isArray(m.theme.languages) ? m.theme.languages : ['tr', 'en', 'ru'];
    m.theme.languages = ['tr'].concat(langs.filter(function (l) { return l !== 'tr' && MenuCore.LANGS[l]; }));
    c.i18n = c.i18n || {};
    m.theme.tvSlideSeconds = Math.max(3, Math.min(120, Number(m.theme.tvSlideSeconds) || 8));
    m.tvSlides = (Array.isArray(m.tvSlides) ? m.tvSlides : []).filter(function (s) { return s && s.image; });
    m.tvSlides.forEach(function (s) { if (!s.id) s.id = MenuCore.uid(); s.active = s.active !== false; });
    if (['auto', 'light', 'dark', 'custom'].indexOf(m.theme.mode) === -1) m.theme.mode = 'auto';
    if (['always', 'noqr', 'never'].indexOf(m.theme.landing) === -1) m.theme.landing = 'always';
    if (['zoom', 'spin', 'ripple', 'none'].indexOf(m.theme.landingMotion) === -1) m.theme.landingMotion = 'zoom';
    if (m.theme.tvMode !== 'same') m.theme.tvMode = 'dark';
    var pc = m.theme.colors = m.theme.colors || {};
    ['bg', 'surface', 'text', 'muted'].forEach(function (k) { if (!/^#[0-9a-fA-F]{6}$/.test(pc[k] || '')) pc[k] = MenuCore.PALETTES.light[k]; });
    m.categories.forEach(function (cat) {
      if (!cat.id) cat.id = MenuCore.uid();
      cat.name = cat.name || '';
      cat.icon = cat.icon || '';
      cat.hidden = !!cat.hidden;
      cat.image = cat.image || '';
      cat.description = cat.description || '';
      if (cat.i18n && typeof cat.i18n !== 'object') cat.i18n = {};
      cat.items = Array.isArray(cat.items) ? cat.items : [];
      cat.items.forEach(function (it) {
        if (!it.id) it.id = MenuCore.uid();
        it.name = it.name || '';
        it.description = it.description || '';
        it.price = Number(it.price) || 0;
        it.sizes = Array.isArray(it.sizes) ? it.sizes.filter(function (s) { return s && s.name; }) : [];
        it.tags = Array.isArray(it.tags) ? it.tags : [];
        it.image = it.image || '';
        it.available = it.available !== false;
        it.calories = Math.max(0, Math.round(Number(it.calories) || 0));
        ['badges', 'diet', 'allergens', 'pairs'].forEach(function (k) { it[k] = Array.isArray(it[k]) ? it[k].filter(Boolean) : []; });
      });
    });
    return m;
  };

  // ---------- diller ----------
  MenuCore.LANGS = {
    tr: { name: 'Türkçe', short: 'TR' },
    en: { name: 'English', short: 'EN' },
    ru: { name: 'Русский', short: 'RU' }
  };
  /** Bir alanın seçili dildeki hâli; çevirisi yoksa Türkçesi. */
  MenuCore.t = function (obj, field, lang) {
    if (!obj) return '';
    if (lang && lang !== 'tr' && obj.i18n && obj.i18n[lang] && obj.i18n[lang][field]) return obj.i18n[lang][field];
    return obj[field] || '';
  };
  /** Sık kullanılan boyut / etiket kelimeleri için hazır sözlük (panelde ayrıca çeviri girmek gerekmez). */
  MenuCore.DICT = {
    en: {
      'küçük': 'Small', 'orta': 'Medium', 'büyük': 'Large', 'tek': 'Single', 'double': 'Double', 'duble': 'Double', 'sıcak': 'Hot', 'soğuk': 'Cold', 'buzlu': 'Iced',
      'fincan': 'Cup', 'bardak': 'Glass', 'ince belli': 'Tulip glass', 'porsiyon': 'Portion', 'yarım': 'Half', 'tam': 'Full', 'dilim': 'Slice', 'şişe': 'Bottle', 'kutu': 'Can',
      'yeni': 'New', 'popüler': 'Popular', 'vegan': 'Vegan', 'vejetaryen': 'Vegetarian', 'glutensiz': 'Gluten-free', 'mevsimlik': 'Seasonal', 'acı': 'Spicy',
      'şekersiz': 'Sugar-free', 'laktozsuz': 'Lactose-free', 'ev yapımı': 'Homemade', 'şefin önerisi': "Chef's pick", 'kampanya': 'Offer', 'imza': 'Signature'
    },
    ru: {
      'küçük': 'Маленький', 'orta': 'Средний', 'büyük': 'Большой', 'tek': 'Одинарный', 'double': 'Двойной', 'duble': 'Двойной', 'sıcak': 'Горячий', 'soğuk': 'Холодный', 'buzlu': 'Со льдом',
      'fincan': 'Чашка', 'bardak': 'Стакан', 'ince belli': 'Стакан-армуду', 'porsiyon': 'Порция', 'yarım': 'Половина', 'tam': 'Полная', 'dilim': 'Кусочек', 'şişe': 'Бутылка', 'kutu': 'Банка',
      'yeni': 'Новинка', 'popüler': 'Популярное', 'vegan': 'Веган', 'vejetaryen': 'Вегетарианское', 'glutensiz': 'Без глютена', 'mevsimlik': 'Сезонное', 'acı': 'Острое',
      'şekersiz': 'Без сахара', 'laktozsuz': 'Без лактозы', 'ev yapımı': 'Домашнее', 'şefin önerisi': 'Выбор шефа', 'kampanya': 'Акция', 'imza': 'Фирменное'
    }
  };
  MenuCore.word = function (text, lang) {
    if (!text || !lang || lang === 'tr' || !MenuCore.DICT[lang]) return text || '';
    return MenuCore.DICT[lang][String(text).toLocaleLowerCase('tr').trim()] || text;
  };
  /** Boyut adı: elle girilen çeviri > sözlük > Türkçesi */
  MenuCore.sizeName = function (s, lang) {
    if (!s || !s.name) return '';
    if (lang && lang !== 'tr' && s.i18n && s.i18n[lang]) return s.i18n[lang];
    return MenuCore.word(s.name, lang);
  };

  // ---------- simgeler: rozetler, beslenme, alerjenler (AB'nin 14 alerjeni) ----------
  MenuCore.MARKS = {
    badges: ['recommended', 'signature'],
    diet: ['caffeine', 'decaf', 'vegan', 'vegetarian'],
    allergens: ['gluten', 'milk', 'eggs', 'nuts', 'peanuts', 'soy', 'sesame', 'fish', 'crustaceans', 'molluscs', 'celery', 'mustard', 'sulphites', 'lupin']
  };
  MenuCore.MARK_LABELS = {
    recommended: ['Önerilen', 'Recommended', 'Рекомендуем'],
    signature: ['Kafenin imzası', 'House signature', 'Фирменное'],
    caffeine: ['Kafein içerir', 'Contains caffeine', 'Содержит кофеин'],
    decaf: ['Kafeinsiz', 'Decaf', 'Без кофеина'],
    vegan: ['Vegan', 'Vegan', 'Веганское'],
    vegetarian: ['Vejetaryen', 'Vegetarian', 'Вегетарианское'],
    gluten: ['Gluten', 'Gluten', 'Глютен'],
    milk: ['Süt', 'Milk', 'Молоко'],
    eggs: ['Yumurta', 'Eggs', 'Яйца'],
    nuts: ['Sert kabuklu yemiş', 'Tree nuts', 'Орехи'],
    peanuts: ['Yer fıstığı', 'Peanuts', 'Арахис'],
    soy: ['Soya', 'Soy', 'Соя'],
    sesame: ['Susam', 'Sesame', 'Кунжут'],
    fish: ['Balık', 'Fish', 'Рыба'],
    crustaceans: ['Kabuklu deniz ürünleri', 'Crustaceans', 'Ракообразные'],
    molluscs: ['Yumuşakçalar', 'Molluscs', 'Моллюски'],
    celery: ['Kereviz', 'Celery', 'Сельдерей'],
    mustard: ['Hardal', 'Mustard', 'Горчица'],
    sulphites: ['Sülfit', 'Sulphites', 'Сульфиты'],
    lupin: ['Acı bakla (lupin)', 'Lupin', 'Люпин']
  };
  MenuCore.markLabel = function (k, lang) {
    var l = MenuCore.MARK_LABELS[k]; if (!l) return k;
    return l[{ tr: 0, en: 1, ru: 2 }[lang] || 0];
  };
  // 24x24 çizgi simgeler (stroke = currentColor)
  MenuCore.MARK_ICONS = {
    recommended: '<path d="M7 10v10H4V10z"/><path d="M7 10l4-7c1.6 0 2.6 1.2 2.1 3l-1 4h5.7a2 2 0 0 1 2 2.4l-1.2 6A2 2 0 0 1 16.6 20H7"/>',
    signature: '<path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.2 5.8L12 16.4l-5.2 2.9L8 13.5l-4.3-4 5.8-.7z"/>',
    caffeine: '<ellipse cx="12" cy="12" rx="6.5" ry="9" transform="rotate(35 12 12)"/><path d="M8.3 17.3c1.8-1.4 1.2-3.6 3-5.2s3.9-1.5 4.4-4.4"/>',
    decaf: '<ellipse cx="12" cy="12" rx="6.5" ry="9" transform="rotate(35 12 12)"/><path d="M8.3 17.3c1.8-1.4 1.2-3.6 3-5.2s3.9-1.5 4.4-4.4"/><path d="M4 4l16 16"/>',
    vegan: '<path d="M12 21v-8"/><path d="M12 13c0-4.5-3-7.5-7.5-7.5 0 4.5 3 7.5 7.5 7.5z"/><path d="M12 11c0-4.5 3-7.5 7.5-7.5 0 4.5-3 7.5-7.5 7.5z"/>',
    vegetarian: '<path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14z"/><path d="M5 19l8-8"/>',
    gluten: '<path d="M12 21V6"/><path d="M12 9c-2.2-.7-3.3-2.6-3.3-5 2.2.6 3.3 2.4 3.3 5zm0 0c2.2-.7 3.3-2.6 3.3-5-2.2.6-3.3 2.4-3.3 5z"/><path d="M12 13.5c-2.4-.7-3.6-2.8-3.6-5.2 2.4.6 3.6 2.6 3.6 5.2zm0 0c2.4-.7 3.6-2.8 3.6-5.2-2.4.6-3.6 2.6-3.6 5.2z"/><path d="M12 18c-2.4-.7-3.6-2.8-3.6-5.2 2.4.6 3.6 2.6 3.6 5.2zm0 0c2.4-.7 3.6-2.8 3.6-5.2-2.4.6-3.6 2.6-3.6 5.2z"/>',
    milk: '<path d="M10 3h4v3l2 3v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3z"/><path d="M8 13h8"/>',
    eggs: '<path d="M12 3c3.4 0 6 5.8 6 10a6 6 0 0 1-12 0c0-4.2 2.6-10 6-10z"/>',
    nuts: '<path d="M5.5 10h13"/><path d="M6.5 10a5.5 4 0 0 1 11 0"/><path d="M7.5 10c0 6 2.2 10 4.5 10s4.5-4 4.5-10"/><path d="M12 6V3.5"/>',
    peanuts: '<path d="M12 3a4 4 0 0 1 3.2 6.4 4.4 4.4 0 1 1-6.4 0A4 4 0 0 1 12 3z"/><path d="M10.5 6.5h.01M13.5 15h.01M11 17h.01"/>',
    soy: '<path d="M5 19c-1-6.5 4-14 14-14 1 6.5-4 14-14 14z"/><circle cx="9.5" cy="14.5" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="14.5" cy="9.5" r="1.3"/>',
    sesame: '<ellipse cx="8" cy="9" rx="1.7" ry="2.8" transform="rotate(-25 8 9)"/><ellipse cx="15.5" cy="8" rx="1.7" ry="2.8" transform="rotate(20 15.5 8)"/><ellipse cx="11.5" cy="16" rx="1.7" ry="2.8" transform="rotate(10 11.5 16)"/>',
    fish: '<path d="M3 12c3-4.2 8-5.2 12.2-3L19.5 6v12l-4.3-3C11 17.2 6 16.2 3 12z"/><path d="M8 11.3h.01"/>',
    crustaceans: '<path d="M6.5 6C13 4 19 8 19 13c0 3-2.3 5-5.2 5H9"/><path d="M6.5 6C5 8 6 10.5 8.5 10.5"/><path d="M19 13l2.5.8M13.5 18l.8 3M10 18l-.8 3M9.5 10.5c1 2.2 3.3 3.4 6 3"/>',
    molluscs: '<path d="M4 14a8 8 0 0 1 16 0l-3 5.5H7z"/><path d="M12 6v13.5M8.3 7.2l1.8 12.3M15.7 7.2l-1.8 12.3"/>',
    celery: '<path d="M9 21c0-6 .8-12 1-16M13 21V5M16 21c0-5.5-.6-11-1-15"/><path d="M8 5.5c1-2.2 3-2.2 4 0 1-2.2 3-2.2 4 0"/>',
    mustard: '<path d="M9 8.5h6l1 12.5H8z"/><path d="M10 8.5V5.5h4v3M11 3.5h2"/>',
    sulphites: '<path d="M8 3h8c0 5-1.2 8-4 8s-4-3-4-8z"/><path d="M12 11v8M9 21h6M8.4 6.5h7.2"/>',
    lupin: '<path d="M12 21V6"/><path d="M12 3.5v2.5M9 7.5c1.5 0 3 1 3 3M15 7.5c-1.5 0-3 1-3 3M8.5 12c1.8 0 3.5 1.2 3.5 3.4M15.5 12c-1.8 0-3.5 1.2-3.5 3.4"/>'
  };
  MenuCore.markSvg = function (k) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (MenuCore.MARK_ICONS[k] || '') + '</svg>';
  };

  MenuCore.uid = function () {
    return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  };

  MenuCore.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  var nf = null;
  try { nf = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); } catch (e) { nf = null; }

  MenuCore.price = function (n, currency) {
    var v = Number(n) || 0;
    var s = nf ? nf.format(v) : String(v);
    return s + ' ' + (currency || '₺');
  };

  /** Ürünün fiyat(lar)ı: [{name, price}] — tek fiyat için name boş. */
  MenuCore.prices = function (it) {
    if (it.sizes && it.sizes.length) return it.sizes;
    if (it.price) return [{ name: '', price: it.price }];
    return [];
  };

  MenuCore.visibleCategories = function (m) {
    return m.categories.filter(function (c) { return !c.hidden && c.items.length; });
  };

  /** Müşteri menüsünün kök adresi (QR kodlarının göstereceği yer). */
  MenuCore.baseUrl = function (m) {
    if (m && m.cafe && m.cafe.menuUrl) return m.cafe.menuUrl;
    var u = location.href.split('#')[0].split('?')[0];
    return u.replace(/[^/]*$/, '');
  };

  // ---------- renkler ----------
  MenuCore.PALETTES = {
    light: { bg: '#f7f3ee', surface: '#ffffff', text: '#2a201a', muted: '#7a6a5e' },
    dark: { bg: '#16110e', surface: '#211a15', text: '#f3ebe3', muted: '#b3a294' },
    tv: { bg: '#14100d', surface: '#211a15', text: '#f5ede4', muted: '#a8988a' }
  };
  var COLOR_KEYS = ['bg', 'surface', 'text', 'muted'];
  var isHex = function (c) { return /^#[0-9a-fA-F]{6}$/.test(c || ''); };

  function rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  /** İki rengi karıştırır (t=0 → a, t=1 → b). */
  MenuCore.mix = function (a, b, t) {
    var x = rgb(a), y = rgb(b), o = '#';
    for (var i = 0; i < 3; i++) { var v = Math.round(x[i] + (y[i] - x[i]) * t); o += (v < 16 ? '0' : '') + v.toString(16); }
    return o;
  };
  function lum(h) {
    var c = rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  /** WCAG kontrast oranı (1-21). 4.5 ve üstü rahat okunur. */
  MenuCore.contrast = function (a, b) {
    var l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  /** Vurgu renginin üstüne yazılacak yazı rengi (beyaz ya da koyu). */
  MenuCore.onAccent = function (accent) {
    return MenuCore.contrast(accent, '#ffffff') >= MenuCore.contrast(accent, '#1c1714') ? '#ffffff' : '#1c1714';
  };

  MenuCore.applyAccent = function (m) {
    var a = (m && m.theme && m.theme.accent) || '#b5651d';
    if (!isHex(a)) return;
    var r = document.documentElement.style;
    r.setProperty('--accent', a);
    r.setProperty('--on-accent', MenuCore.onAccent(a));
  };

  function setPalette(p) {
    var r = document.documentElement.style;
    COLOR_KEYS.forEach(function (k) { if (isHex(p[k])) r.setProperty('--' + k, p[k]); });
    if (isHex(p.bg) && isHex(p.text)) {
      r.setProperty('--line', MenuCore.mix(p.bg, p.text, 0.13));
      r.setProperty('--chip', MenuCore.mix(p.bg, p.text, 0.07));
      r.setProperty('--surface2', MenuCore.mix(p.surface || p.bg, p.text, 0.04));
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta && isHex(p.bg)) meta.setAttribute('content', p.bg);
  }
  function clearPalette() {
    var r = document.documentElement.style;
    COLOR_KEYS.concat(['line', 'chip', 'surface2']).forEach(function (k) { r.removeProperty('--' + k); });
  }

  /** Menü renklerini uygular. target: 'menu' (telefon/tablet) ya da 'tv'. */
  MenuCore.applyTheme = function (m, target) {
    var t = (m && m.theme) || {}, mode = t.mode || 'auto', root = document.documentElement;
    MenuCore.applyAccent(m);
    clearPalette();
    if (target === 'tv') {
      if (t.tvMode === 'same') {
        if (mode === 'custom') setPalette(t.colors || {});
        else if (mode === 'light') setPalette(MenuCore.PALETTES.light);
      }
      return; // aksi halde tv.html'in kendi koyu renkleri
    }
    root.removeAttribute('data-theme');
    if (mode === 'custom') setPalette(t.colors || {});
    else if (mode === 'light' || mode === 'dark') root.setAttribute('data-theme', mode);
  };

  /** Dosya yolu video mu? */
  MenuCore.isVideo = function (p) { return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(p || ''); };
  /** Hareketli resim (animasyonlu WebP / GIF): video gibi engellenmez, Düşük Güç Modu'nda da oynar. */
  MenuCore.isAnimImage = function (p) { return /\.(webp|gif)(\?|$)/i.test(p || ''); };

  MenuCore.qrSvg = function (text) {
    var qr = global.qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 8, scalable: true });
  };

  global.MenuCore = MenuCore;
})(window);
