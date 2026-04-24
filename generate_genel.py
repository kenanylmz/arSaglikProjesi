#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Genel Doküman - Nefes Saati projesi için doldurulmuş Word belgesi.
Kaynak şablon: Genel Döküman.docx
Çıktı: Genel_Dokuman_NefesiSaati.docx
"""

import shutil
import copy
from docx import Document
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

SRC = r'C:\Users\Kenan\Downloads\Genel Döküman.docx'
DST = r'C:\Users\Kenan\Desktop\arSaglikProjesi\Genel_Dokuman_NefesiSaati.docx'

# ── yardımcı fonksiyonlar ────────────────────────────────────────────────────

def _get_rpr(para):
    for r in para._p.findall(qn('w:r')):
        rpr = r.find(qn('w:rPr'))
        if rpr is not None:
            return copy.deepcopy(rpr)
    return None

def _make_rpr_plain(font='Times New Roman'):
    """Bold olmayan, sadece font ayarlı rPr oluşturur."""
    rpr = OxmlElement('w:rPr')
    fonts = OxmlElement('w:rFonts')
    for attr in ('w:ascii', 'w:hAnsi', 'w:cs', 'w:eastAsia'):
        fonts.set(qn(attr), font)
    kern = OxmlElement('w:kern')
    kern.set(qn('w:val'), '0')
    rpr.append(fonts)
    rpr.append(kern)
    return rpr

def _make_run(text, rpr=None):
    r = OxmlElement('w:r')
    if rpr is not None:
        r.append(copy.deepcopy(rpr))
    t = OxmlElement('w:t')
    t.text = text
    if text and (text[0] == ' ' or text[-1] == ' '):
        t.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    r.append(t)
    return r

def _make_br_run(text, rpr=None):
    """Öncesinde w:br olan run (satır sonu + metin)."""
    r = OxmlElement('w:r')
    if rpr is not None:
        r.append(copy.deepcopy(rpr))
    br = OxmlElement('w:br')
    r.append(br)
    t = OxmlElement('w:t')
    t.text = text
    if text and (text[0] == ' ' or text[-1] == ' '):
        t.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    r.append(t)
    return r

def _clear_runs(para):
    p = para._p
    for tag in (qn('w:r'), qn('w:proofErr'),
                qn('w:bookmarkStart'), qn('w:bookmarkEnd')):
        for elem in p.findall(tag):
            p.remove(elem)

def set_text(para, text):
    """Paragrafı tamamen temizleyip yeni metin koyar (rPr korunur)."""
    rpr = _get_rpr(para) or _make_rpr_plain()
    for tag in (qn('w:b'), qn('w:bCs')):
        e = rpr.find(tag)
        if e is not None:
            rpr.remove(e)
    _clear_runs(para)
    para._p.append(_make_run(text, rpr))

def set_label_value(para, label, value):
    """'Label: değer' formatında label bold, değer normal."""
    rpr_plain = _make_rpr_plain()
    rpr_bold  = copy.deepcopy(rpr_plain)
    for tag in ('w:b', 'w:bCs'):
        rpr_bold.append(OxmlElement(tag))
    _clear_runs(para)
    para._p.append(_make_run(label + ': ', rpr_bold))
    para._p.append(_make_run(value, rpr_plain))

def set_multiline(para, label, *lines):
    """'Label:\nSatır1\nSatır2...' formatında yazar."""
    rpr_plain = _make_rpr_plain()
    rpr_bold  = copy.deepcopy(rpr_plain)
    for tag in ('w:b', 'w:bCs'):
        rpr_bold.append(OxmlElement(tag))
    _clear_runs(para)
    para._p.append(_make_run(label + ':', rpr_bold))
    for line in lines:
        para._p.append(_make_br_run(line, rpr_plain))

def set_plain_multiline(para, *lines):
    """Tamamen plain metin, her satır br ile ayrılır."""
    rpr = _make_rpr_plain()
    _clear_runs(para)
    first = True
    for line in lines:
        if first:
            para._p.append(_make_run(line, rpr))
            first = False
        else:
            para._p.append(_make_br_run(line, rpr))

# ── şablon kopyala ve aç ─────────────────────────────────────────────────────

shutil.copy(SRC, DST)
doc = Document(DST)
p = doc.paragraphs   # kısaltma

# ── [0]  Öğrenci Bilgileri başlığını koru (bold 18pt) ────────────────────────
# para 0 başlık, dokunmuyoruz.

# ── [1]  Ad Soyad / Numara / Proje Adı ──────────────────────────────────────
set_multiline(
    p[1],
    'Ad Soyad',
    'Kenan Yılmaz',
    'Numara: 210542011',
    'Proje Adı: Nefes Saati -- AR Destekli Akıllı İlaç Takip ve Hatırlatma Sistemi',
)

# ── [2]  Proje Fikri ─────────────────────────────────────────────────────────
set_multiline(
    p[2],
    'Proje Fikri (1 sayfa kısa özet)',
    'Nefes Saati, kronik hastalığa sahip bireyler ve yaşlı hastalar için geliştirilmiş '
    'Android tabanlı bir mobil sağlık uygulamasıdır. Uygulama; artırılmış gerçeklik (AR) '
    'kamera modülü aracılığıyla ilaç kutularındaki yazıları optik karakter tanıma (OCR) '
    'teknolojisi ile otomatik tanır ve sisteme ekler.',
    'Kullanıcılar her ilaç için günlük doz saatlerini yapılandırabilir. @notifee '
    'kütüphanesi aracılığıyla saate özel günlük alarm bildirimleri gönderilir. '
    '"İlacı Aldım" butonu ile doz onayı alınarak Firebase Firestore\'a kaydedilir.',
    'Haftalık ilaç uyum takibi 7 günlük renkli takvim üzerinden görselleştiriliyor: '
    'yeşil = alındı, kırmızı = kaçırıldı, turuncu = bekleniyor, gri = gelecek.',
    'Bakıcılar veya aile üyeleri; kimlik doğrulama gerektirmeyen benzersiz cihaz kodu '
    '(AR-XXXX-XXXX) ile uzaktan, anlık ilaç uyumunu izleyebilir.',
    'Tüm veriler önce AsyncStorage\'da yerel olarak saklanır; Firebase Firestore ile '
    'arka planda sessizce buluta senkronize edilir (local-first mimarisi). '
    'İnternet bağlantısı olmadan bile tüm temel işlevler tam çalışır.',
)

# ── [3]  AR / MR kullanımı ───────────────────────────────────────────────────
set_multiline(
    p[3],
    'Karma Gerçeklik (MR) bu projede nasıl kullanılacak',
    'AR teknolojisi iki temel alanda uygulanmaktadır:',
    '1) OCR Tabanlı İlaç Tanıma: VisionCamera kamera akışı üzerinde Google ML Kit OCR '
    'ile gerçek zamanlı ilaç kutusu metin tanıma. Kullanıcı kamerasını ilaç kutusuna '
    'tuttuğunda, kutunun üzerindeki ilaç adı canlı olarak tanınır ve onay için '
    'kullanıcıya sunulur. Böylece manuel veri girişi ortadan kalkar.',
    '2) 3D Model Görselleştirme: Three.js ve WebView entegrasyonu ile GLTF formatındaki '
    '3D ilaç modelleri WebGL üzerinde render edilerek kullanıcıya ilacın görsel temsili '
    'sunulmaktadır. Bu katman kullanıcının doğru ilacı tanımasını destekler.',
)

# ── [4]  Hedeflenen sektör ───────────────────────────────────────────────────
set_multiline(
    p[4],
    'Hedeflenen sektör',
    'Sağlık (Mobil Sağlık / mHealth) -- Kronik hastalık yönetimi, ilaç uyum takibi, '
    'yaşlı bakımı ve uzaktan hasta izleme.',
    'Hedef kullanıcı grupları: çoklu ilaç kullanan kronik hastalar, hafızası zayıflayan '
    'yaşlı bireyler, yakınlarının ilaç düzenini uzaktan takip etmek isteyen aile '
    'üyeleri ve bakıcılar.',
)

# ── [5]  boş paragraf -- dokunmuyoruz

# ── [6]  Problem Tanımı ──────────────────────────────────────────────────────
set_multiline(
    p[6],
    'Problem Tanımı',
    'Kronik hastalığa sahip bireyler ve yaşlı hastalar, günlük ilaç dozlarını düzenli '
    'almakta güçlük çekmektedir. Hangi ilacın ne zaman alınacağını unutmak, benzer '
    'ambalajlı ilaçlar arasındaki karışıklık ve çoklu ilaç yönetimi ciddi sağlık '
    'risklerine yol açmaktadır.',
    'Mevcut ilaç hatırlatma uygulamaları tamamen manuel veri girişi gerektirmekte; '
    'bu durum özellikle teknoloji becerileri sınırlı yaşlı kullanıcılarda kullanım '
    'direncine neden olmaktadır.',
    'Aile üyeleri ve bakıcılar ise hastanın ilaç uyumunu gerçek zamanlı olarak uzaktan '
    'izleyememektedir. Bu durum; bakım sağlayıcıların her gün telefon etmesini veya '
    'fiziksel ziyaret yapmasını gerektirmekte, pratik olmayan bir bakım süreci ortaya '
    'çıkmaktadır.',
)

# ── [7]  Kullanıcı Senaryosu ─────────────────────────────────────────────────
set_multiline(
    p[7],
    'Kullanıcı Senaryosu',
    'Ahmet Bey, 68 yaşında hipertansiyon ve diyabet hastası olup her sabah 3 farklı '
    'ilaç alması gerekmektedir. Nefes Saati uygulamasını ilk kez açar, AR kamerasını '
    'ilaç kutularına tutarak ilaçları birkaç saniyede sisteme ekler.',
    'Uygulama her sabah saat 08:00\'de alarm bildirimi gönderir. Ahmet Bey ilacını '
    'aldıktan sonra "İlacı Aldım" butonuna basar; bu eylem anlık olarak hem yerel '
    'depoya hem de Firebase Firestore\'a kaydedilir.',
    'Kızı Ayşe ise şehir dışında çalıştığından babasının yanında olamaz. Ancak '
    'Ahmet Bey\'in AR-XXXX-XXXX kodunu telefonuna girerek babasının o gün ilaçlarını '
    'alıp almadığını gerçek zamanlı takip edebilmekte; geçmiş 7 günün uyum durumunu '
    'haftalık takvimden görebilmektedir.',
)

# ── [8]  SWOT Analizi başlığını koru

# ── [9]  Güçlü Yönler ───────────────────────────────────────────────────────
set_label_value(
    p[9],
    'Güçlü Yönler',
    'AR destekli OCR ile otomatik ilaç tanıma (manuel giriş yok); '
    'anonim AR-XXXX-XXXX kimlik sistemi ile sıfır PII ve GDPR uyumu; '
    'yerel-önce mimari ile %100 çevrimdışı çalışma; günlük alarm bildirimleri; '
    'haftalık uyum takvimi; uzaktan read-only bakıcı modu; Türkçe TTS erişilebilirliği.',
)

# ── [10] Zayıf Yönler ────────────────────────────────────────────────────────
set_label_value(
    p[10],
    'Zayıf Yönler',
    'Yalnızca Android platformu (iOS desteği yok); '
    'düşük kaliteli ambalajlarda OCR tanıma hatası riski; '
    'Firestore güvenlik kuralları üretim öncesi güçlendirilmeli; '
    'bakıcı modu tek yönlü (salt okunur, yazma erişimi yok); '
    'Firebase\'e vendor bağımlılığı.',
)

# ── [11] Fırsatlar ───────────────────────────────────────────────────────────
set_label_value(
    p[11],
    'Fırsatlar',
    'Yaşlı nüfusun artmasıyla büyüyen mHealth pazarı; '
    'Firebase altyapısıyla çoklu kullanıcı ve klinik portal genişlemesi; '
    'iOS platforma taşıma potansiyeli; '
    'reçete tarama ve eczane entegrasyonu; '
    'IoT bağlantılı akıllı ilaç kutusu entegrasyonu.',
)

# ── [12] Tehditler ───────────────────────────────────────────────────────────
set_label_value(
    p[12],
    'Tehditler',
    'Google ML Kit OCR API değişiklikleri veya ücretlendirme; '
    'Firebase fiyatlandırma politikası değişimi; '
    'Medisafe, Roundhealth gibi küresel rakip uygulamalar; '
    'açık Firestore kurallarıyla veri güvenliği riski (üretim öncesi kritik).',
)

# ── [13] GitHub Repo Linki ───────────────────────────────────────────────────
set_multiline(
    p[13],
    'GitHub Repo Linki',
    'https://github.com/kenanylmz/arSaglikProjesi',
)

# ── [14] Fonksiyonel Gereksinimler başlığını koru

# ── [15-16]  FR satırları ────────────────────────────────────────────────────
set_plain_multiline(
    p[15],
    'FR-01  AR kamera + OCR ile ilaç kutusundan otomatik ilaç adı tanıma ve sisteme ekleme',
    'FR-02  Her ilaç için günlük çoklu doz saati yapılandırması (birden fazla saat atanabilir)',
    'FR-03  Yapılandırılan saatlere göre günlük tekrarlayan push bildirim alarmları',
    'FR-04  "İlacı Aldım" butonu ile doz onayı ve anlık AsyncStorage + Firestore kaydı',
)
set_plain_multiline(
    p[16],
    'FR-05  7 günlük haftalık ilaç uyum takvimi (yeşil/kırmızı/turuncu/gri durum renkleri)',
    'FR-06  AR-XXXX-XXXX cihaz kimliğiyle bakıcı uzaktan izleme modu (read-only)',
    'FR-07  Firebase Firestore ile çok cihazlı bulut senkronizasyonu (auth-free)',
    'FR-08  Türkçe sesli geri bildirim (TTS) ile görsel destekli sesli onay',
)

# ── [17] Non-Fonksiyonel Gereksinimler başlığını koru

# ── [18-19]  NFR satırları ───────────────────────────────────────────────────
set_plain_multiline(
    p[18],
    'NFR-01  Güvenilirlik: Tüm temel işlevler internet bağlantısı olmadan çalışabilmeli (local-first)',
    'NFR-02  Güvenlik: Kişisel sağlık verisi saklanmamalı; anonim kimlik zorunlu (GDPR uyumu)',
    'NFR-03  Performans: Uygulama açılış <3 sn; bildirim tetiklenme gecikmesi <1 sn',
)
set_plain_multiline(
    p[19],
    'NFR-04  Ölçeklenebilirlik: Firebase altyapısı binlerce kullanıcıya eş anlı destek vermeli',
    'NFR-05  Erişilebilirlik: TTS desteği ile görme engelli kullanıcılara uyum sağlanmalı',
    'NFR-06  Süreklilik: Cihaz yeniden başlatıldıktan sonra bildirimler otomatik yenilenmeli',
)

# ── [20-21] boş -- dokunmuyoruz

# ── [22] Trello Board Linki -- boş bırakılıyor ──────────────────────────────
set_multiline(
    p[22],
    'Trello Board Linki',
    '(Trello panosu bu projede kullanılmamıştır.)',
)

# ── [23] Sprint 1 Planı ──────────────────────────────────────────────────────
set_multiline(
    p[23],
    'Sprint 1 Planı (kısa)',
    'Hedef: AR kamera entegrasyonu ve OCR ile ilaç tanıma modülünün temel çalışır '
    'halinin geliştirilmesi.',
    'Kapsam: VisionCamera kurulumu ve izin yönetimi; Google ML Kit OCR bağlantısı; '
    'OCR sonuçlarının onay ekranına taşınması; manuel ilaç ekleme alternatif akışı; '
    'AsyncStorage\'a ilaç listesi kayıt/okuma; HomeScreen temel arayüz.',
    'Süre: 1 hafta | Başarı kriteri: Gerçek bir ilaç kutusunun kamera ile taranıp '
    'sisteme başarıyla eklenmesi.',
)

# ── [24] Backlog başlığını koru

# ── [25-26] Backlog görevleri ────────────────────────────────────────────────
set_plain_multiline(
    p[25],
    'TASK-01  VisionCamera + ML Kit OCR entegrasyonu ve izin yönetimi',
    'TASK-02  useMedicineSchedule hook -- ilaç listesi CRUD (AsyncStorage)',
    'TASK-03  @notifee günlük tekrarlayan alarm bildirimi kurulumu',
    'TASK-04  RoutineScreen haftalık 7 günlük takvim bileşeninin tasarımı',
)
set_plain_multiline(
    p[26],
    'TASK-05  Firebase Firestore Auth-free senkronizasyon ve useUserId hook\'u',
    'TASK-06  AR-XXXX-XXXX kimlik sistemi ve CaregiverModal bakıcı modu',
    'TASK-07  İmzalı APK üretimi için Gradle + PKCS12 Keystore yapılandırması',
    'TASK-08  react-native-tts Türkçe sesli geri bildirim entegrasyonu',
)

# ── [27] boş -- dokunmuyoruz

# ── [28] Kullanılan Teknolojiler ─────────────────────────────────────────────
set_multiline(
    p[28],
    'Kullanılan Teknolojiler',
    'Framework    : React Native CLI 0.83 (Android) + TypeScript',
    'AR / Kamera  : react-native-vision-camera + Google ML Kit OCR (Vision)',
    '3D Render    : Three.js + WebView + GLTFLoader (WebGL)',
    'Bildirimler  : @notifee/react-native (lokal, günlük alarm)',
    'Veritabanı   : AsyncStorage (yerel, birincil) + Firebase Firestore (bulut)',
    'Ses          : react-native-tts (Türkçe metin-okuma)',
    'Navigasyon   : @react-navigation/native + @react-navigation/bottom-tabs',
    'İkonlar      : react-native-vector-icons',
    'Derleme      : Gradle + PKCS12 Keystore (imzalı APK)',
    'Versiyon     : Git + GitHub (https://github.com/kenanylmz/arSaglikProjesi)',
)

# ── [29] Sensör / Kamera Kullanımı ───────────────────────────────────────────
set_multiline(
    p[29],
    'Sensör / Kamera Kullanımı',
    'Kamera: react-native-vision-camera kütüphanesi ile cihazın arka kamerası '
    'kullanılıyor. Kamera akışı Frame Processor aracılığıyla Google ML Kit Vision '
    'API\'sine iletilir; OCR modülü Türkçe ve Latin karakterleri gerçek zamanlı tanır.',
    'İzin: android.permission.CAMERA AndroidManifest.xml\'de beyan edilmiş; '
    'uygulama ilk açılışında kullanıcıdan izin istenmektedir.',
    '3D Render: Three.js/WebView ile OpenGL ES destekli WebView kullanılıyor. '
    'GLTFLoader ile yüklenen 3D ilaç modelleri canvas üzerinde döndürülerek '
    'gösteriliyor.',
    'Bildirim altyapısı: @notifee TimestampTrigger ile saate özel günlük tetikleyiciler '
    'oluşturuluyor. RECEIVE_BOOT_COMPLETED izni ile cihaz yeniden başlatıldıktan '
    'sonra tetikleyiciler otomatik yenileniyor.',
)

# ── [30] Temel sistem mimarisi ───────────────────────────────────────────────
set_multiline(
    p[30],
    'Temel sistem mimarisi (kısa)',
    'Yerel-önce (local-first) katmanlı mimari:',
    'UI Katmanı   -> HomeScreen, RoutineScreen (React Native bileşenler)',
    'Hook Katmanı -> useMedicineSchedule, useMedicineHistory, useUserId',
    'Servis Katm. -> notificationService.ts (@notifee), firestoreService.ts (Firestore)',
    'Depolama     -> AsyncStorage (birincil, anlık) | Firebase Firestore (ikincil, arka plan)',
    'Navigasyon   -> Stack Navigator -> BottomTabs (HomeTab, RoutineTab) + ARCamera Modal',
    'Veri akışı   -> Kullanıcı eylemi -> Hook -> AsyncStorage (anlık yaz) -> '
    'Firestore (fire-and-forget, hata uygulama akışını durdurmaz)',
)

# ── [31] boş -- dokunmuyoruz

# ── [32] Projenin genel durumu ───────────────────────────────────────────────
set_multiline(
    p[32],
    'Projenin genel durumu',
    'Proje 5 geliştirme fazının tamamı hayata geçirilmiş; imzalı APK üretilmiş ve '
    'fiziksel Android cihazda test edilmiştir.',
    'Faz 1: AR kamera + OCR ilaç tanıma modülü -- TAMAMLANDI',
    'Faz 2: Haftalık rutin takvimi + "İlacı Aldım" + @notifee alarmlar -- TAMAMLANDI',
    'Faz 3: Firebase Firestore senkronizasyonu + AR-XXXX-XXXX + bakıcı modu -- TAMAMLANDI',
    'Faz 4: Nefes Saati markası + Keystore + imzalı APK üretimi -- TAMAMLANDI',
    'Faz 5: PROJE_DOKUMANI, SWOT, README, FOY2, RAMS belgeleri -- TAMAMLANDI',
    'Tüm temel özellikler (OCR, alarm, haftalık takvim, bakıcı modu, Firestore) '
    'çalışır durumda ve cihaz üzerinde doğrulanmıştır.',
)

# ── [33] Karşılaşılan zorluklar ──────────────────────────────────────────────
set_multiline(
    p[33],
    'Karşılaşılan zorluklar',
    '1) TypeScript navigasyon tip uyumsuzluğu: "Home" ekranı RootStackParamList\'te '
    'bulunmadığı için NativeStackNavigationProp tip hatası alındı. Bottom tab mimarisine '
    'geçiş sonrası genel NativeStackNavigationProp<RootStackParamList> ile çözüldü.',
    '2) Gradle kilit hatası: Başka bir Java süreci Gradle checksum cache dosyasını '
    'kilitlemişti. "Get-Process -Name java | Stop-Process -Force" ile çözüldü.',
    '3) ic_launcher_round eksikliği: APK build sırasında @mipmap/ic_launcher_round '
    'bulunamadı hatası alındı. AndroidAssetStudio sadece ic_launcher ürettiği için '
    'AndroidManifest\'te roundIcon değeri ic_launcher olarak güncellendi.',
    '4) keytool PATH sorunu: JDK-19 kurulu ancak PATH\'te tanımlı değil. '
    '"& C:/Program Files/Java/jdk-19/bin/keytool.exe" tam yoluyla çağrılarak çözüldü.',
    '5) Auth-free Firestore tasarımı: Kimlik doğrulama olmadan kullanıcıya özel '
    'veri izolasyonunun sağlanması; AR-XXXX-XXXX anonim ID mimarisi ile çözüldü.',
)

# ── [34] Gelecek geliştirmeler ───────────────────────────────────────────────
set_multiline(
    p[34],
    'Gelecek geliştirmeler',
    '1) Firestore güvenlik kurallarının üretim ortamı için güçlendirilmesi (KRİTİK)',
    '2) iOS platformuna taşıma (react-native-vision-camera zaten cross-platform)',
    '3) Bakıcı çift yönlü iletişim: Bakıcının hastaya bildirim gönderebilmesi',
    '4) Google Play Store yayını ve uygulama mağaza optimizasyonu (ASO)',
    '5) Android ana ekran widget\'i ile hızlı doz onay erişimi',
    '6) Otomatik test altyapısı: Jest birim testleri + Detox E2E testleri',
    '7) İlaç etkileşim uyarısı: Birden fazla ilacın etkileşim riskini AI ile analiz',
    '8) Klinik/hastane portal entegrasyonu: Doktorun hasta ilaç uyumunu izlemesi',
)

# ── kaydet ───────────────────────────────────────────────────────────────────

doc.save(DST)
print(f'Belge başarıyla oluşturuldu: {DST}')
