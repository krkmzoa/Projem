# Kafe QR Menü

Telefonda, masadaki QR kodda, barın üstündeki akıllı TV'de ve tablette aynı menü. Menüyü tek bir panelden düzenlersiniz, "Yayınla" dediğinizde her yer 1-2 dakika içinde kendiliğinden güncellenir.

| Sayfa | Ne işe yarar |
|---|---|
| `index.html` (ana adres) | Müşterinin telefonda gördüğü menü. Kategoriler, arama, ürün detayı, Wi-Fi bilgisi. QR'dan gelince "Masa 5" gibi masa numarasını gösterir. |
| `tv.html` | Akıllı TV ekranı. Koyu tema, uzaktan okunur, saat ve QR kod içerir. Menü sığmazsa sayfalara bölüp sırayla gösterir. |
| `?kiosk=1` | Tablet modu. 90 saniye dokunulmazsa başa döner, menüyü kendi yeniler. |
| `qr.html` | Masa QR kodlarını hazırlar; A4'e yazdırıp kesip yapıştırırsınız. |
| `admin.html` | Düzenleme paneli: ürün, fiyat, fotoğraf, "Tükendi", kategori sırası, Wi-Fi, logo, renk. |
| `menu.json` | Menünün kendisi. Panel bu dosyayı günceller; elle düzenlemeniz gerekmez. |

Sunucu, veritabanı veya aylık ücret yok: site **GitHub Pages** üzerinde ücretsiz yayınlanır.

---

## Kurulum (bir kerelik, ~10 dakika)

### 1. Siteyi yayına alın
1. Bu çalışmayı `main` dalına birleştirin (pull request açıp "Merge").
2. Depo **herkese açık (public)** olmalı. Ücretsiz GitHub planında Pages yalnızca açık depolarda çalışır. Menü zaten herkese açık bir bilgi; şifre veya anahtar depoda **tutulmaz**.
   *Settings → General → en altta "Change visibility" → Public*
3. *Settings → Pages* → **Source:** "Deploy from a branch" → **Branch:** `main`, klasör `/ (root)` → **Save**.
4. 1-2 dakika sonra siteniz şu adreste açılır:
   **`https://krkmzoa.github.io/Projem/`**

### 2. Düzenleme panelini bağlayın
1. `https://krkmzoa.github.io/Projem/admin.html` adresini açın.
2. **Ayarlar** sekmesi → "Anahtar (token) nasıl alınır?" adımlarını izleyin:
   GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token →
   *Only select repositories:* `Projem` → *Permissions → Contents:* **Read and write**.
3. Anahtarı yapıştırıp **Kaydet ve bağlan**'a basın. Anahtar yalnızca o cihazın tarayıcısında saklanır.
   Telefon, bilgisayar gibi birden fazla cihazdan düzenleyecekseniz her birinde bir kez girmeniz yeterli.

### 3. Menünüzü girin
- **Kafe Bilgileri:** kafe adı, logo, Wi-Fi, Instagram, tema rengi.
- **Menü:** örnek ürünleri silin veya düzenleyin, kendi ürünlerinizi ekleyin.
- Sağ üstteki **Yayınla**'ya basın. Site 1-2 dakika içinde güncellenir.

---

## QR kodları masalara
1. Panel → **Ekranlar & QR** → *Masa QR kodları* (veya `qr.html`).
2. Masa sayısını girin → **Yazdır / PDF kaydet**. Yazdırma penceresinde *Arka plan grafikleri*ni açın.
3. Kesip laminasyonlayın veya şeffaf bantla yapıştırın.

> ⚠️ QR'lar sitenin adresine bağlıdır. Bastıktan sonra **depo adını değiştirmeyin**, yoksa kodlar çalışmaz. Menünün **içeriğini** dilediğiniz kadar değiştirebilirsiniz; QR'ları yeniden basmanız gerekmez.

## Akıllı TV
- TV'nin internet tarayıcısında `https://krkmzoa.github.io/Projem/tv.html` adresini açın ve yer imlerine ekleyin.
- TV menüdeki değişiklikleri dakikada bir kendisi kontrol eder. Siz Yayınla'ya bastıktan birkaç dakika sonra ekran kendiliğinden güncellenir.
- TV ayarlarından **ekran koruyucuyu / otomatik kapanmayı** kapatın.
- TV'nin kendi tarayıcısı yavaş veya sorunluysa en sağlam çözüm ucuz bir **Android TV box / Fire TV Stick** ile **Fully Kiosk Browser** uygulaması kullanmaktır. TV açılınca menü otomatik tam ekran başlar.
- Sayfa değişim süresi ve sütun sayısı: Panel → **Ekranlar & QR → TV ekranı**.
- Ekrandaki QR kodu gizlemek isterseniz adres: `tv.html?qr=0`.

## Tablet
- Tablette Chrome veya Safari ile `https://krkmzoa.github.io/Projem/?kiosk=1` adresini açın.
- **Ana ekrana ekle** deyin; uygulama gibi tam ekran açılır.
- Müşteri başka uygulamaya geçemesin diye:
  - Android: *Ayarlar → Güvenlik → Uygulama sabitleme (Ekran sabitleme)*
  - iPad: *Ayarlar → Erişilebilirlik → Rehberli Erişim*

---

## Günlük kullanım
- **Bir ürün bitti:** Panel → ürünün yanındaki "Satışta" anahtarını kapatın → **Yayınla**. Menüde "Tükendi" yazar.
- **Fiyat değişti:** Ürüne dokunun → fiyatı yazın → Tamam → **Yayınla**.
- **Fotoğraf:** Ürüne dokunun → *Fotoğraf yükle*. Telefon kamerasından da çekebilirsiniz; fotoğraf otomatik küçültülür.
- **Kategori gizleme / sıralama:** Kategori başlığındaki "Göster" anahtarı ve ↑ ↓ okları.
- **Kaydetmeyi unuttum:** Panel yayınlanmamış değişiklikleri cihazda tutar ve bir dahaki açılışta sorar.
- **Geri alma:** Panel → Ayarlar → *Menü yedeğini indir* / *Yedekten geri yükle*. Ayrıca her sürüm GitHub'da saklanır (`menu.json` → History).

## Güvenlik
- `admin.html` herkese açık bir sayfadır ama anahtar olmadan hiçbir şeyi değiştiremez.
- Anahtarın girildiği bir cihaz kaybolursa: GitHub → Settings → Developer settings → Fine-grained tokens → ilgili anahtarı **Delete**. Sonra yeni bir anahtar oluşturun.
- Anahtarın süresi dolunca panel uyarır; aynı adımlarla yenisini alın.

## Teknik notlar
- Saf HTML/CSS/JS; derleme adımı yok. QR üretimi için `assets/vendor/qrcode.js` (MIT, Kazuhiko Arase) depoya dahildir.
- Yerelde denemek için: `python3 -m http.server` → `http://localhost:8000`
- Otomatik güncelleme: sayfalar `version.json` dosyasını kontrol eder. Koddaki `BUILD` sayısından büyük bir sürüm görürlerse kendilerini yenilerler (ana ekran uygulaması, tablet ve TV eski sürümde kalmasın diye). Koda değişiklik yapıldığında `version.json` içindeki `v` ile sayfalardaki `BUILD` ve `?v=` numaraları birlikte artırılmalıdır.
