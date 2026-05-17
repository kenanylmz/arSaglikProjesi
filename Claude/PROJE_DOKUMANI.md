# AR Sağlık Projesi — Genel Döküman

## Amaç
Karaciğer nakli sonrası yaşlı hastaların ilaçlarını kameraya tutarak tanımasını, 3D modelini görmesini ve Türkçe sesli komutla bir sonraki doz zamanını öğrenmesini sağlayan Android AR uygulaması.

## İlaçlar
| ID | İlaç Adı | Etken Madde | Doz | Saat |
|----|----------|-------------|-----|------|
| `neoral` | Sandimmun Neoral | Ciclosporin | 100 mg | 08:00 / 20:00 |
| `deltacortril` | Deltacortril | Prednisolone | 5 mg | 10:00 |
| `cellcept` | CellCept | Mycophenolate Mofetil | 500 mg | 08:00 / 20:00 |

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

---

## Tamamlanan Geliştirmeler

### ✅ Faz 1 — İlaç Geçmişi & "İlacı Aldım" Sistemi

**Yeni Dosyalar:**
- `src/hooks/useMedicineHistory.ts` — AsyncStorage CRUD: doz kayıtları okuma/yazma, son 30 gün tutulur
- `src/types/index.ts` — `DoseRecord` tipi eklendi: `{ id, medicineId, date, scheduledTime, takenAt, taken }`

**Değişen Dosyalar:**
- `src/components/ARMedicineScene.tsx` — Bilgi kartı altına **"İlacı Aldım"** butonu eklendi, `onDoseTaken` prop callback
- `src/screens/ARCameraScreen.tsx` — `useMedicineHistory` bağlandı, `findCurrentDoseTime` ile en yakın doz saati bulunur
- `src/components/MedicineCard.tsx` — `takenTimesToday` prop: alındı/bekleniyor/kısmi badge gösterimi
- `src/screens/HomeScreen.tsx` — `useMedicineHistory` ile bugünkü kayıtlar kartlara aktarılır; `useFocusEffect` ile AR kameradan dönünce yenilenir
- `src/utils/timeUtils.ts` — `findCurrentDoseTime()` ve `getTodayDateStr()` eklendi

**Kayıt ID formatı:** `{medicineId}_{YYYY-MM-DD}_{HHMM}` (örn: `neoral_2024-04-24_0800`)

---

### ✅ Faz 2 — Haftalık Rutinim Ekranı & Alt Menü

**Yeni Dosyalar:**
- `src/screens/RoutineScreen.tsx` — 7 günlük grid, uyum yüzdesi, özet kart
- `src/navigation/AppNavigator.tsx` — Stack → BottomTabs (İlaçlarım + Rutinim) + ARCamera modal

**Yeni Paketler:**
```
@react-navigation/bottom-tabs
```

**Dot Renkleri:**
| Durum | Renk |
|-------|------|
| Alındı | Yeşil ✓ |
| Kaçırıldı (geçti + alınmadı) | Kırmızı ✗ |
| Bekleniyor (30dk grace süresi) | Turuncu |
| Gelecek | Gri |

**Navigation Yapısı:**
```
RootStack (headerShown: false)
  ├── MainTabs
  │     ├── HomeTab → HomeScreen
  │     └── RoutineTab → RoutineScreen
  └── ARCamera (slide_from_bottom)
```

**Type değişikliği:**
```typescript
// Eski
RootStackParamList: { Home, ARCamera }
// Yeni
RootStackParamList: { MainTabs, ARCamera }
TabParamList: { HomeTab, RoutineTab }
```

---

### ✅ Faz 3 — Alarm / Push Notification Sistemi

**Yeni Dosyalar:**
- `src/services/notificationService.ts` — `@notifee/react-native` ile günlük tekrarlayan alarmlar

**Yeni Paket:**
```
@notifee/react-native
```

**AndroidManifest.xml'e eklenen izinler:**
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

**Kurallar:**
- Sessiz saatler: **23:00–07:00** arası alarm kurulmaz
- Saat güncellenince eski alarmlar iptal, yenileri planlanır
- Bildirim içeriği: `💊 {İlaç Adı} — {Doz}, ilaç alma zamanı!`
- `useMedicineSchedule.updateTimes` → `scheduleAllNotifications` otomatik tetiklenir
- `HomeScreen` yüklenince (`loading: false`) stored saatlerle alarmlar planlanır

---

### ✅ Faz 4 — Firebase Firestore & Ebeveyn Kontrolü

**Yeni Dosyalar:**
- `src/hooks/useUserId.ts` — Cihaza kalıcı `AR-XXXX-XXXX` formatında ID üretir/okur
- `src/services/firestoreService.ts` — Tüm Firestore işlemleri (schedule sync, doz sync, bakıcı sorgusu)
- `src/components/CaregiverModal.tsx` — Bottom sheet: ID girerek başka kullanıcının günlük durumunu sorgular

**Yeni Paketler:**
```
@react-native-firebase/app
@react-native-firebase/firestore
```

**Android Gradle Değişiklikleri:**
- `android/build.gradle` → `classpath("com.google.gms:google-services:4.4.2")`
- `android/app/build.gradle` → `apply plugin: "com.google.gms.google-services"`

**Firebase Project:** `arsaglik` (project ID)
**google-services.json:** `android/app/google-services.json` ✅

**Firestore Şeması:**
```
users/
  {AR-XXXX-XXXX}/
    createdAt: Timestamp
    schedule/current/
      medicines: { neoral: ['08:00','20:00'], deltacortril: ['10:00'] }
      updatedAt: Timestamp
    doses/
      {medicineId_date_HHMM}/
        medicineId, date, scheduledTime, takenAt, taken
```

**Firestore Security Rules:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Sync Mantığı (Local-First):**
- Uygulama tamamen AsyncStorage'dan çalışır (offline güvenli)
- Firestore yazmaları arka planda, `catch(() => {})` ile sessiz
- Saat güncelleme → Firestore schedule güncellenir
- "İlacı Aldım" → Firestore doz kaydedilir
- İlk açılış → user doc oluşturulur, schedule aktarılır

**Ebeveyn Kontrolü — RoutineScreen sağ üst kalkan ikonu:**
- Hedef kullanıcının `AR-XXXX-XXXX` ID'si girilir
- Firestore'dan o günün schedule + doses verileri çekilir
- Her ilaç / her saat için alındı/kaçırıldı/bekleniyor gösterilir
- Alınan dozlarda `HH:MM'de alındı` formatında saat yazılır

---

### ✅ Faz 5 — Uygulama Adı, Logo & APK

**Uygulama Adı:** `Nefes Saati`
- Değişen dosya: `android/app/src/main/res/values/strings.xml`

**Logo:** AndroidAssetStudio ile üretildi
- Klasörler: `mipmap-anydpi-v26`, `mipmap-hdpi`, `mipmap-xhdpi`, `mipmap-xxhdpi`, `mipmap-xxxhdpi`
- `AndroidManifest.xml` → `android:roundIcon` → `@mipmap/ic_launcher` (round versiyonu üretilmediği için)

**Keystore Bilgileri:**
- Dosya: `android/app/nefes-saati.keystore`
- Alias: `nefes-saati`
- Şifre: `gradle.properties`'te `MYAPP_UPLOAD_*` değişkenleri ile saklanır
- Keytool tam yolu: `"C:/Program Files/Java/jdk-19/bin/keytool.exe"` (PATH'e eklenmemiş)

**Signing Config (`android/app/build.gradle`):**
```groovy
signingConfigs {
    release {
        storeFile file(MYAPP_UPLOAD_STORE_FILE)
        storePassword MYAPP_UPLOAD_STORE_PASSWORD
        keyAlias MYAPP_UPLOAD_KEY_ALIAS
        keyPassword MYAPP_UPLOAD_KEY_PASSWORD
    }
}
```

**APK Üretme:**
```powershell
# Gradle lock hatası alırsa önce Java process'lerini öldür:
Get-Process -Name "java" -ErrorAction SilentlyContinue | Stop-Process -Force

cd android
./gradlew clean
./gradlew assembleRelease
```

**APK Çıktısı:** `android/app/build/outputs/apk/release/app-release.apk`

---

### ✅ Faz 6 — 3. İlaç (CellCept) & Bakıcı PDF Raporu

#### 6A — CellCept İlacı Eklendi

**Yeni İlaç:**
| ID | İlaç Adı | Etken Madde | Doz | Üretici | Saat | Renk |
|----|----------|-------------|-----|---------|------|------|
| `cellcept` | CellCept | Mycophenolate Mofetil | 500 mg | Roche | 08:00 / 20:00 | `#2E7D32` |

**Varlıklar:**
- Görsel: `src/assets/ilac/ilaç 3.png`
- 3D Model: `src/assets/3D Model/ilaç 3.glb` → kopyalandı: `android/app/src/main/assets/models/ilac3.glb`

**Değişen Dosyalar:**
- `src/constants/medicines.ts` — `MEDICINES` dizisine CellCept nesnesi eklendi
- `src/constants/colors.ts` — `cardCellcept: '#E8F5E9'` (açık yeşil kart arka planı) eklendi
- `src/components/MedicineCard.tsx` — `medicineImages` kaydına `cellcept: require('../assets/ilac/ilaç 3.png')` eklendi; `cardBg` mantığına `cellcept → Colors.cardCellcept` eklendi
- `src/components/Model3DViewer.tsx` — `modelFile` prop tipine `'ilac3.glb'` eklendi
- `src/components/ARMedicineScene.tsx` — `MODEL_FILES` kaydına `cellcept: 'ilac3.glb'` eklendi
- `src/screens/ARCameraScreen.tsx` — `MEDICINE_KEYWORDS`'e CellCept anahtar kelimeleri eklendi: `['cellcept', 'mycophenolate', 'mycophenolic', 'mofetil', 'roche', 'mmc']`
- `src/hooks/useMedicineSchedule.ts` — `loadSchedule`'da stored schedule ile default schedule merge edilir (`{...defaults, ...parsed}`); böylece sonradan eklenen ilaçlar eski cihazlarda boş saatsiz kalmaz

**Otomatik kapsanan yerler (kod değişikliği gerekmedi):**
- HomeScreen → `MEDICINES.map()` ile 3. kart otomatik görünür
- RoutineScreen → `MEDICINES.map()` ile CellCept satırı otomatik görünür
- Bakıcı modalı → `MEDICINES.map()` ile 3. ilaç otomatik listelenir
- Firestore doz sync → `logDose()` herhangi bir `medicineId` için çalışır
- Bildirimler → `scheduleAllNotifications` tüm ilaçları döner
- PDF raporu → `MEDICINES.forEach()` ile 3 ilaç tablosu otomatik oluşur

---

#### 6B — Bakıcı Modalı: Haftalık PDF Raporu

**Yeni Dosya:**
- `src/services/pdfReportService.ts` — HTML şablon oluşturma + PDF dönüştürme + otomatik açma

**Yeni Paketler:**
```
react-native-html-to-pdf
react-native-blob-util
```

**`AndroidManifest.xml`'e eklenen izinler:**
```xml
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
```

**Değişen Dosyalar:**
- `src/services/firestoreService.ts` — `fetchUserWeekData(targetUserId)` fonksiyonu eklendi: son 7 günün schedule + doses verilerini Firestore'dan paralel çeker, `dosesByDate` map olarak döner
- `src/components/CaregiverModal.tsx` — Sorgulama sonucu gösterildikten sonra **"Haftalık Raporu İndir (PDF)"** butonu eklendi; tıklanınca `fetchUserWeekData` → `generateAndOpenWeeklyReport` zinciri çalışır

**PDF İçeriği:**
```
Nefes Saati — Haftalık İlaç Takip Raporu
├── Rapor başlığı: Hasta ID, dönem (7 gün), rapor tarihi
├── Haftalık özet kutusu
│     ├── Genel uyum yüzdesi (renk kodlu: yeşil/turuncu/kırmızı)
│     ├── Alınan doz sayısı
│     ├── Kaçırılan doz sayısı
│     └── Toplam doz sayısı
├── Her ilaç için ayrı tablo (3 ilaç × 7 gün)
│     ├── İlaç adı, etken madde, doz, üretici, açıklama
│     ├── İlaca özgü uyum yüzdesi
│     └── Saat × Gün grid tablosu
│           ├── Alındı → yeşil hücre + tam saat (ör: 08:05 / alındı)
│           ├── Alınmadı → kırmızı hücre + ✗ alınmadı
│           └── Gelecek/Bekliyor → gri hücre + —
└── Kaçırılan dozlar detay listesi (varsa)
```

**PDF Akışı:**
```
Sorgula butonu → fetchUserDayData (bugün görünümü)
PDF butonu    → fetchUserWeekData (7 gün)
               → generateAndOpenWeeklyReport()
                    ├── buildHtml() — istatistik hesaplama + HTML şablon
                    ├── generatePDF() — react-native-html-to-pdf ile PDF üret
                    │    Çıktı: Downloads/nefes_saati_{userId}_{tarih}.pdf
                    └── RNFetchBlob.android.actionViewIntent() — PDF otomatik açılır
```

**Doz Durumu Hesaplama Kuralları (PDF için):**
- Geçmiş gün + alınmadı → `missed`
- Bugün + 30dk grace süresi geçti + alınmadı → `missed`
- Henüz gelmemiş / grace süresi içinde → `pending` (tabloda sayılmaz)
- `taken` + `missed` dozlar toplam uyum hesabına dahil edilir; `pending` dahil edilmez

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
