# Nefes Saati – AR Destekli Akıllı İlaç Takip ve Hatırlatma Sistemi

---

## 1. Proje Başlığı

**Nefes Saati** — Artırılmış Gerçeklik (AR) ve Mobil Yapay Zeka Teknolojileriyle Desteklenmiş Akıllı İlaç Takip ve Hatırlatma Sistemi

---

## 2. Proje Özeti

Nefes Saati, kronik hastalığa sahip bireyler ve yaşlı hastaların günlük ilaç uyumunu artırmak amacıyla geliştirilmiş bir Android mobil uygulamasıdır. Uygulama; artırılmış gerçeklik kamera modülü aracılığıyla ilaç kutularını optik karakter tanıma (OCR) ile otomatik olarak tanır ve sisteme ekler. Kullanıcılar ilaç alma saatlerini yapılandırabilir, günlük alarm bildirimleri alabilir ve haftalık ilaç uyum takibini görsel bir takvim üzerinden izleyebilir. Bakıcılar veya aile üyeleri ise uygulamaya özel kısa kimlik kodu (AR-XXXX-XXXX) aracılığıyla yakınlarının ilaç uyumunu gerçek zamanlı olarak uzaktan takip edebilir.

---

## 3. Problem Tanımı

Kronik hastalık yönetiminde ilaç uyumu kritik bir sağlık göstergesidir. Mevcut sistemlerdeki temel sorunlar şunlardır:

- **Unutma ve düzensizlik:** Yaşlı bireyler ve çoklu ilaç kullanan hastalar, hangi ilacı ne zaman almaları gerektiğini sıklıkla unutmaktadır.
- **İlaç tanımlama güçlüğü:** Benzer ambalajlı ilaçlar arasındaki karışıklık yanlış doz alımına yol açabilmektedir.
- **Uzaktan izleme eksikliği:** Bakıcılar ve aile üyeleri, hastanın ilaç alıp almadığını gerçek zamanlı olarak doğrulayamamaktadır.
- **Manuel veri girişi yükü:** Mevcut ilaç takip uygulamalarında ilaç bilgileri tamamen manuel girilmekte, bu da kullanıcı direncini artırmaktadır.
- **İnternet bağımlılığı:** Pek çok çözüm çevrimdışı çalışamamakta; bağlantı kesilmesi veri kaybına neden olmaktadır.

---

## 4. Amaçlar

- AR kamera ve OCR teknolojisi ile ilaç kutularının otomatik tanınmasını ve sisteme eklenmesini sağlamak
- Kullanıcı tarafından yapılandırılabilir saatlere göre günlük ilaç alarm bildirimleri sunmak
- "İlacı Aldım" onay mekanizması ile doz kayıtlarını güvenilir biçimde tutmak
- Haftalık ilaç uyum takibini görsel takvim bileşeniyle kullanıcıya sunmak
- Kimlik doğrulama (Auth) gerektirmeyen, cihaza özgü AR-XXXX-XXXX kodu ile bakıcı uzaktan izleme modunu hayata geçirmek
- Firebase Firestore ile çok cihazlı bulut senkronizasyonu sağlamak
- Yerel-önce (local-first) mimarisiyle çevrimdışı ortamda tam işlevsellik sunmak
- 3D ilaç model görselleştirmesi ile kullanıcı farkındalığını artırmak

---

## 5. Temel Kavramlar

| Kavram | Açıklama |
|--------|----------|
| **Artırılmış Gerçeklik (AR)** | Gerçek dünya görüntüsü üzerine dijital katmanlar (metin, 3D model vb.) eklenmesidir. Kamera akışı üzerinde çalışır ve kullanıcının fiziksel ortamla etkileşimini dijital içerikle zenginleştirir. |
| **Optik Karakter Tanıma (OCR)** | Görüntü veya kamera çerçevesindeki yazılı metinlerin yapay zeka modelleri aracılığıyla dijital metne dönüştürülmesi işlemidir. |
| **Yerel-Önce Mimari (Local-First)** | Tüm verilerin öncelikle cihaz üzerindeki yerel depoda (AsyncStorage) tutulduğu, bulut senkronizasyonunun arka planda ve sessizce gerçekleştiği bir tasarım yaklaşımıdır. |
| **Bakıcı Modu** | Üçüncü bir kişinin (bakıcı, aile üyesi), kimlik doğrulama gerektirmeksizin yalnızca kısa bir kod ile başka bir kullanıcının ilaç uyum verilerini görüntüleyebildiği uzaktan izleme özelliğidir. |
| **Push Bildirim Alarmı** | Belirli saatlerde tetiklenerek kullanıcıyı ilaç alma konusunda uyaran, ön plan bildirim sistemidir. Sessiz saatlerde (23:00–07:00) gönderilmez. |
| **İlaç Uyumu** | Bir hastanın reçete edilen ilaç tedavisine belirlenen doz ve zamanlama doğrultusunda ne ölçüde uyduğunu ifade eden sağlık göstergesidir. |

---

## 6. Kullanılan Teknolojiler

### Geliştirme Çatısı
- **React Native CLI 0.83** — Android platformu için çapraz platform mobil uygulama geliştirme
- **TypeScript** — Tip güvenli kod tabanı

### AR ve Görüntü İşleme
- **react-native-vision-camera** — Yüksek performanslı kamera API'si
- **Google ML Kit (Vision / OCR)** — Cihaz üzerinde çalışan makine öğrenmesi ile metin tanıma
- **Three.js + WebView + GLTFLoader** — WebGL tabanlı 3D ilaç model görselleştirmesi

### Bildirim ve Alarm
- **@notifee/react-native** — Günlük, saate özel tekrarlayan lokal bildirim alarmları

### Veri Yönetimi
- **AsyncStorage** — Cihaz içi yerel veri deposu (birincil katman)
- **Firebase Firestore** — Bulut senkronizasyonu (ikincil katman, Auth'suz)
- **@react-native-firebase/firestore** — Firestore SDK

### Ses ve Erişilebilirlik
- **react-native-tts** — Türkçe sesli geri bildirim (metin-okuma)

### Navigasyon ve UI
- **@react-navigation/native + bottom-tabs** — Sekme tabanlı navigasyon
- **react-native-vector-icons** — İkon seti

### Derleme ve Dağıtım
- **Gradle + PKCS12 Keystore** — İmzalı APK üretimi

---

## 7. Proje Kapsamı

### Kapsam Dahili
- Android platformu (minSdk 24+, ARCore uyumlu cihazlar)
- İlaç kutusu fotoğrafı üzerinden OCR ile otomatik ilaç tanıma ve kayıt
- Çoklu doz ve çoklu ilaç desteği (her ilaca birden fazla günlük saat atanabilir)
- Günlük alarm bildirimleri (kullanıcı saatlerine göre dinamik güncelleme)
- "İlacı Aldım" onay akışı ve doz geçmişi kaydı
- 7 günlük haftalık ilaç uyum takvimi
- AR-XXXX-XXXX kimlik sistemi ile bakıcı uzaktan izleme modu
- Firebase Firestore ile bulut senkronizasyonu
- İmzalı APK üretimi ve cihaza yükleme

### Kapsam Dışı
- iOS platformu
- Kullanıcı hesabı / kimlik doğrulama sistemi
- Reçete tarama veya eczane entegrasyonu
- Çok kullanıcılı bakıcı yönetimi (bir bakıcı yalnızca tek hastayı izleyebilir)
- Ücretli abonelik veya uygulama mağazası yayını

---

## 8. Beklenen Çıktılar

- **Çalışan Android APK** — İmzalı, cihaza yüklenebilir sürüm (`app-release.apk`)
- **AR İlaç Tanıma Modülü** — Kamera üzerinden OCR ile otomatik ilaç adı ve bilgi çıkarımı
- **Haftalık Rutin Ekranı** — 7 günlük ilaç uyum ızgarası; alınan (yeşil), kaçırılan (kırmızı), beklenen (turuncu), gelecek (gri) göstergeli
- **Bakıcı İzleme Paneli** — Uzaktan erişim için AR-XXXX-XXXX kodlu modal ekran
- **Bildirim Altyapısı** — Kullanıcı saatlerine senkronize, günlük tekrarlayan alarm sistemi
- **Firestore Veri Şeması** — `users/{userId}/schedule/current` ve `users/{userId}/doses/{recordId}` yapısı
- **Proje Dokümantasyonu** — PROJE_DOKUMANI.md, SWOT analizi ve bu README

---

## 9. Katkıda Bulunanlar

| Ad Soyad | Okul Numarası | Rol |
|----------|---------------|-----|
| Kenan Yılmaz | 210542011 | Proje Geliştirici |

---

## 10. Kaynaklar

- React Native Resmi Dokümantasyonu — https://reactnative.dev/docs/getting-started
- VisionCamera Dokümantasyonu — https://react-native-vision-camera.com
- Google ML Kit Metin Tanıma — https://developers.google.com/ml-kit/vision/text-recognition
- Firebase Firestore Dokümantasyonu — https://firebase.google.com/docs/firestore
- Notifee Bildirim Kütüphanesi — https://notifee.app/react-native/docs
- Three.js WebGL Kütüphanesi — https://threejs.org/docs
- React Native TTS — https://github.com/ak1394/react-native-tts
- ARCore Destekli Cihazlar Listesi — https://developers.google.com/ar/devices
- Ivaturi R. et al. (2020). *Mobile Applications for Medication Adherence.* Journal of Medical Systems.
- Dayer L. et al. (2013). *Smartphone Medication Adherence Apps.* Journal of the American Pharmacists Association.

---

## 11. Anahtar Kelimeler

`Artırılmış Gerçeklik` `AR` `Mixed Reality` `İlaç Takibi` `OCR` `Optik Karakter Tanıma`
`React Native` `Firebase Firestore` `Mobil Sağlık` `mHealth` `İlaç Uyumu`
`Bakıcı Modu` `Push Bildirim` `Local-First Mimari` `Android` `VisionCamera`
`Google ML Kit` `Three.js` `TTS` `Kronik Hastalık Yönetimi` `Nefes Saati`
