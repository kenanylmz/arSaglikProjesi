# AR Sağlık Projesi — Genel Döküman

## Amaç
Karaciğer nakli sonrası yaşlı hastaların ilaçlarını kameraya tutarak tanımasını, 3D modelini görmesini ve Türkçe sesli komutla bir sonraki doz zamanını öğrenmesini sağlayan Android AR uygulaması.

## İlaçlar
| ID | İlaç Adı | Etken Madde | Doz | Saat |
|----|----------|-------------|-----|------|
| `neoral` | Sandimmun Neoral | Ciclosporin | 100 mg | 08:00 / 20:00 |
| `deltacortril` | Deltacortril | Prednisolone | 5 mg | 10:00 |

## Teknoloji Stack
- React Native CLI 0.83.4 (Android only)
- `react-native-vision-camera` — kamera görüntüsü
- `@react-native-ml-kit/text-recognition` — OCR ile ilaç tanıma
- `react-native-webview` + Three.js (CDN) + GLTFLoader — 3D model render
- `react-native-tts` — Türkçe sesli komut
- `@react-navigation/native-stack` — ekran navigasyonu
- `@react-native-async-storage/async-storage` v2.1.2 — ilaç saatlerini yerel kaydetme
- `react-native-vector-icons` (MaterialCommunityIcons)
- `react-native-linear-gradient`

---

## Dosya Yapısı

```
src/
├── assets/
│   ├── ilac/          ilaç 1.png (Neoral), ilaç 2.png (Deltacortril)
│   └── 3D Model/      ilaç 1.glb, ilaç 2.glb
├── types/index.ts          Medicine, MedicineSchedule, CountdownInfo, RootStackParamList
├── constants/
│   ├── colors.ts           Renk paleti (teal/turuncu, yaşlı dostu yüksek kontrast)
│   ├── medicines.ts        MEDICINES dizisi — id, name, defaultTimes, color, description
│   └── strings.ts          Tüm Türkçe metinler + TTS konuşma şablonları
├── utils/timeUtils.ts      parseTime, formatTime24to12, getNextDoseInfo, getCurrentTimeStr
├── hooks/
│   ├── useMedicineSchedule.ts   AsyncStorage CRUD — schedule okuma/yazma
│   └── useCountdown.ts          Saniyeli geri sayım (setInterval 1s)
├── services/ttsService.ts       initTTS (tr-TR), speak(), stopSpeaking()
├── navigation/AppNavigator.tsx  Stack: Home → ARCamera (slide_from_bottom)
├── components/
│   ├── CountdownTimer.tsx        SS:DK:SN blokları — isOverdue varsa kırmızı uyarı
│   ├── MedicineCard.tsx          İlaç kartı + saat düzenleme modalı (AsyncStorage'a kaydeder)
│   ├── Model3DViewer.tsx         WebView + Three.js GLTFLoader — .glb render + PanResponder kontrol
│   └── ARMedicineScene.tsx       Overlay: 3D model + animasyonlu bilgi kartı + TTS tetikler
└── screens/
    ├── HomeScreen.tsx            Ana ekran: gradient header, ilaç kartları, AR aç butonu
    └── ARCameraScreen.tsx        Kamera + OCR tarama + overlay yönetimi
```

---

## Ekranlar

### HomeScreen
- Gradient header (teal), iki `MedicineCard`, sabit "Kamerayı Aç" butonu (turuncu)
- Her kart: ilaç görseli, isim/doz/üretici, kullanım saatleri, geri sayım
- Saat ikonu → modal açılır → saatler düzenlenir → AsyncStorage'a kaydedilir

### ARCameraScreen
- Vision Camera tam ekran (arka plan)
- Tarama çerçevesi (köşe işaretleri + animasyonlu tarama çizgisi)
- "Tara" butonu → `camera.takePhoto()` → ML Kit OCR
- OCR metni içinde `neoral / sandimmun / ciclosporin` veya `deltacortril / prednisolone / pfizer` aranır
- Tanınınca `ARMedicineOverlay` gösterilir
- "Yeniden Tara" ile sıfırlanır

### ARMedicineScene (Overlay)
- `Model3DViewer` (3D model, 260px)
- Glow ring animasyonu (ilaç rengiyle)
- Bilgi kartı (fade-in): ilaç adı, doz, açıklama, sonraki kullanım saati, geri sayım
- TTS 600ms gecikmeli başlar

### Model3DViewer
- Three.js ES module (importmap via CDN: `cdn.jsdelivr.net/npm/three@0.160.0`)
- `.glb` dosyaları `android/app/src/main/assets/models/` içinde (ilac1.glb, ilac2.glb)
- XHR ile `file:///android_asset/models/` okur, `loader.parse()` ile sahneye ekler
- **PanResponder (React Native tarafı)** touch yakalar → `injectJavaScript` ile WebView'a iletir
  - Tek parmak sürükle → `window.__rotate(dx, dy)` → spherical kamera rotasyonu
  - İki parmak pinch → `window.__zoom(delta)` → radius değişimi
  - 2.5s bırakılınca oto-rotasyon başlar

---

## Android Yapılandırma
- `AndroidManifest.xml`: `CAMERA` izni
- `android/app/src/main/assets/models/`: ilac1.glb + ilac2.glb kopyalandı
- `android/app/build.gradle`: `react-native-vector-icons/fonts.gradle` eklendi
- `android/build.gradle`: `allprojects { repositories { google(); mavenCentral() } }`
- `metro.config.js`: assetExts'e `.glb, .gltf, .obj` eklendi

---

## Çözülen Hatalar

| Hata | Çözüm |
|------|-------|
| `jcenter()` Gradle 9'da kaldırıldı | `react-native-tts` build.gradle'dan `buildscript { jcenter() }` bloğu silindi + `patch-package` ile patch oluşturuldu |
| `AsyncStorage v3` → `org.asyncstorage.shared_storage:1.0.0` bulunamadı | v2.1.2'ye downgrade |
| `@reactvision/react-viro` RN 0.83 Fabric ile çalışmıyor | ViroReact kaldırıldı, Vision Camera + ML Kit + Three.js/WebView yaklaşımına geçildi |
| `@react-native-ml-kit/text-recognition` `dl.google.com` erişim hatası | İnternet bağlantısı sağlandı, Gradle cache temizlendi |
| Three.js `examples/js/` r160'ta kaldırıldı | ES module + importmap yaklaşımı: `three/addons/` |
| GLTFLoader `"three"` bare specifier hatası | `<script type="importmap">` ile `three` → CDN URL eşlendi |
| OrbitControls touch çalışmıyor (WebView event interception) | OrbitControls kaldırıldı; React Native PanResponder ile touch yakalanıp `injectJavaScript` → `window.__rotate/__zoom/__stopAutoRotate` |

---

## Ek Dosyalar
- `generate_swot.py` + `AR_Saglik_SWOT_Analizi.docx` — proje SWOT analizi (python-docx)
- `patches/react-native-tts+4.1.1.patch` — jcenter fix
- `Claude/PROJE_DOKUMANI.md` — bu dosya

---

## Uygulama Akışı (Özet)
```
Uygulama aç
  └─ HomeScreen
       ├─ İlaç kartları + geri sayım görünür
       ├─ Saat ikonu → saat düzenleme modalı
       └─ "Kamerayı Aç" butonu
            └─ ARCameraScreen
                 ├─ Kamera açılır
                 ├─ İlacı çerçeveye al → "Tara" butonuna bas
                 ├─ OCR → ilaç adı eşleşir
                 └─ ARMedicineOverlay açılır
                      ├─ 3D model (döner, hareket ettirilebilir)
                      ├─ Bilgi kartı (saat + geri sayım)
                      └─ TTS: "Bu Sandimmun Neoral. Akşam 8'e 7 saat 14 dakika kaldı."
```

---

## Planlanan Geliştirmeler

### 🔔 1. Alarm / Push Notification Sistemi
**Öncelik: Kritik**
İlaç saati gelince cihaz alarm verir, hasta uygulamayı açmadan bildirim alır.
- Kütüphane: `@notifee/react-native`
- Her ilaç için günlük tekrarlayan alarm kurulur (defaultTimes veya kullanıcının ayarladığı saatler)
- Bildirime tıklayınca ARCameraScreen açılır
- Sessiz saatler (gece 23:00–07:00) arası bildirim bastırılır

### ✅ 2. İlaç Alındı Onayı + Geçmiş Takibi
**Öncelik: Yüksek**
AR overlay açılınca "İlacı Aldım" butonu eklenir. Günlük doz geçmişi AsyncStorage'da loglanır.
- Her doz için `{ medicineId, scheduledTime, takenAt, taken: boolean }` kaydı
- HomeScreen'de kartlarda bugünkü alım durumu gösterilir (✅ alındı / ⚠️ bekleniyor / ❌ kaçırıldı)
- Haftalık uyum yüzdesi hesaplanır ve gösterilir
- Geçmiş ekranı: takvim görünümünde hangi günler alındı/kaçırıldı

### 👨‍👩‍👧 3. Bakıcı / Aile Modu
**Öncelik: Orta**
Hasta yakını kendi telefonundan hastanın ilaç alım durumunu uzaktan takip eder.
- Backend: Firebase Firestore + Firebase Auth (anonim veya telefon numarası ile)
- Hasta cihazında "İlacı Aldım" onayı Firestore'a yazılır
- Bakıcı uygulaması anlık bildirim alır: "Anneniz Neoral'ı aldı ✅"
- Doz kaçırılırsa bakıcıya push notification gider
- Basit bakıcı ekranı: hasta listesi + bugünkü alım durumu özeti
