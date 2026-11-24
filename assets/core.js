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
    ['name', 'slogan', 'logo', 'phone', 'instagram', 'address', 'wifiName', 'wifiPassword', 'note', 'menuUrl', 'cover', 'website', 'facebook', 'hours', 'mapsUrl'].forEach(function (k) {
      if (typeof c[k] !== 'string') c[k] = '';
    });
    if (!c.currency) c.currency = '₺';
    if (!m.theme.accent) m.theme.accent = '#b5651d';
    if (!m.theme.tvSeconds) m.theme.tvSeconds = 12;
    if (!m.theme.tvColumns) m.theme.tvColumns = 3;
    m.theme.tvScale = Math.max(0.7, Math.min(2.5, Number(m.theme.tvScale) || 1));
    m.theme.tvSlideSeconds = Math.max(3, Math.min(120, Number(m.theme.tvSlideSeconds) || 8));
    m.tvSlides = (Array.isArray(m.tvSlides) ? m.tvSlides : []).filter(function (s) { return s && s.image; });
    m.tvSlides.forEach(function (s) { if (!s.id) s.id = MenuCore.uid(); s.active = s.active !== false; });
    if (['auto', 'light', 'dark', 'custom'].indexOf(m.theme.mode) === -1) m.theme.mode = 'auto';
    if (['always', 'noqr', 'never'].indexOf(m.theme.landing) === -1) m.theme.landing = 'always';
    if (['zoom', 'spin', 'none'].indexOf(m.theme.landingMotion) === -1) m.theme.landingMotion = 'zoom';
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
      });
    });
    return m;
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

  MenuCore.qrSvg = function (text) {
    var qr = global.qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 8, scalable: true });
  };

  global.MenuCore = MenuCore;
})(window);
