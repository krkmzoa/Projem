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
    ['name', 'slogan', 'logo', 'phone', 'instagram', 'address', 'wifiName', 'wifiPassword', 'note', 'menuUrl'].forEach(function (k) {
      if (typeof c[k] !== 'string') c[k] = '';
    });
    if (!c.currency) c.currency = '₺';
    if (!m.theme.accent) m.theme.accent = '#b5651d';
    if (!m.theme.tvSeconds) m.theme.tvSeconds = 12;
    if (!m.theme.tvColumns) m.theme.tvColumns = 3;
    m.categories.forEach(function (cat) {
      if (!cat.id) cat.id = MenuCore.uid();
      cat.name = cat.name || '';
      cat.icon = cat.icon || '';
      cat.hidden = !!cat.hidden;
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

  MenuCore.applyAccent = function (m) {
    var a = (m && m.theme && m.theme.accent) || '#b5651d';
    if (/^#[0-9a-fA-F]{6}$/.test(a)) {
      document.documentElement.style.setProperty('--accent', a);
    }
  };

  MenuCore.qrSvg = function (text) {
    var qr = global.qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 8, scalable: true });
  };

  global.MenuCore = MenuCore;
})(window);
