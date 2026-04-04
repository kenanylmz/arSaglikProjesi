"""
AR Sağlık Projesi - SWOT Analizi Word Belgesi Oluşturucu
"""

from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_ORIENT
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml
import os

# ── Renkler ──────────────────────────────────────────────
COLOR_PRIMARY    = RGBColor(0x0D, 0x6E, 0x6E)  # Teal
COLOR_STRENGTH   = RGBColor(0x27, 0xAE, 0x60)  # Yeşil
COLOR_WEAKNESS   = RGBColor(0xE7, 0x4C, 0x3C)  # Kırmızı
COLOR_OPP        = RGBColor(0x29, 0x80, 0xB9)  # Mavi
COLOR_THREAT     = RGBColor(0xE6, 0x7E, 0x22)  # Turuncu
COLOR_WHITE      = RGBColor(0xFF, 0xFF, 0xFF)
COLOR_DARK       = RGBColor(0x1A, 0x1A, 0x2E)
COLOR_GRAY       = RGBColor(0x4A, 0x4A, 0x6A)
COLOR_LIGHT_BG   = RGBColor(0xF5, 0xF7, 0xFA)

# ── Yardımcı fonksiyonlar ────────────────────────────────
def set_cell_shading(cell, hex_color):
    """Hücre arka plan rengini ayarla."""
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}" w:val="clear"/>')
    cell._tc.get_or_add_tcPr().append(shading)


def add_cell_text(cell, text, bold=False, color=COLOR_DARK, size=11, alignment=WD_ALIGN_PARAGRAPH.LEFT):
    """Hücreye formatlı metin ekle."""
    cell.text = ""
    p = cell.paragraphs[0]
    p.alignment = alignment
    p.space_before = Pt(4)
    p.space_after = Pt(4)
    run = p.add_run(text)
    run.bold = bold
    run.font.size = Pt(size)
    run.font.color.rgb = color
    run.font.name = "Calibri"


def add_bullet_cell(cell, items, color=COLOR_DARK, bg_hex="FFFFFF"):
    """Hücreye madde işaretli liste ekle."""
    set_cell_shading(cell, bg_hex)
    cell.text = ""
    for i, item in enumerate(items):
        p = cell.paragraphs[0] if i == 0 else cell.add_paragraph()
        p.space_before = Pt(3)
        p.space_after = Pt(3)
        p.paragraph_format.left_indent = Cm(0.5)

        bullet = p.add_run("● ")
        bullet.font.size = Pt(10)
        bullet.font.color.rgb = color
        bullet.font.name = "Calibri"
        bullet.bold = True

        # Başlık ve açıklama ayır
        if ":" in item:
            title, desc = item.split(":", 1)
            title_run = p.add_run(title + ":")
            title_run.font.size = Pt(10.5)
            title_run.font.color.rgb = COLOR_DARK
            title_run.font.name = "Calibri"
            title_run.bold = True

            desc_run = p.add_run(desc)
            desc_run.font.size = Pt(10.5)
            desc_run.font.color.rgb = COLOR_GRAY
            desc_run.font.name = "Calibri"
        else:
            text_run = p.add_run(item)
            text_run.font.size = Pt(10.5)
            text_run.font.color.rgb = COLOR_DARK
            text_run.font.name = "Calibri"


def add_heading_styled(doc, text, level=1, color=COLOR_PRIMARY):
    """Renkli başlık ekle."""
    heading = doc.add_heading(level=level)
    run = heading.add_run(text)
    run.font.color.rgb = color
    run.font.name = "Calibri"
    return heading


def add_paragraph_styled(doc, text, bold=False, color=COLOR_DARK, size=11, alignment=WD_ALIGN_PARAGRAPH.LEFT):
    """Formatlı paragraf ekle."""
    p = doc.add_paragraph()
    p.alignment = alignment
    run = p.add_run(text)
    run.bold = bold
    run.font.size = Pt(size)
    run.font.color.rgb = color
    run.font.name = "Calibri"
    return p


def add_divider(doc):
    """Yatay çizgi ekle."""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("─" * 80)
    run.font.size = Pt(8)
    run.font.color.rgb = RGBColor(0xD0, 0xD0, 0xD0)


# ── SWOT Verileri ────────────────────────────────────────

STRENGTHS = [
    "Artırılmış Gerçeklik (AR) Teknolojisi: Geleneksel ilaç takip uygulamalarından farklı olarak, hastalar ilaç kutusunu kameraya tutarak gerçek zamanlı 3D model ve sesli bilgi alabilmektedir. Bu, özellikle yaşlı ve teknolojiye uzak hastalar için son derece sezgisel bir deneyim sunar.",
    "Sesli Komut Sistemi (TTS): Türkçe dil desteğiyle entegre edilen metin-konuşma teknolojisi, görme güçlüğü çeken yaşlı hastalar için kritik bir erişilebilirlik özelliğidir. Hasta ilacını kameraya tuttuğunda 'Bu Sandimmun Neoral. Bir sonraki kullanım saati akşam 8. 3 saat 22 dakika kaldı.' gibi net ve anlaşılır sesli bildirimler alır.",
    "Yaşlı Dostu Arayüz Tasarımı: 18-24pt büyük fontlar, yüksek kontrastlı teal-turuncu renk paleti ve minimal navigasyon yapısı ile yaşlı hastaların teknolojiyle etkileşimindeki bariyerler en aza indirilmiştir. Sadece iki ekran (Ana Ekran + AR Kamera) ile karmaşıklıktan uzak bir kullanıcı deneyimi sunulur.",
    "Gerçek Zamanlı Geri Sayım Sistemi: Her ilaç için saniye bazında güncellenen geri sayım sayaçları, hastaların bir sonraki doz zamanını her an görebilmesini sağlar. Bu özellik, karaciğer nakli sonrası kritik olan ilaç uyumluluğunu (adherence) önemli ölçüde artırır.",
    "Kişiselleştirilebilir İlaç Saatleri: Varsayılan ilaç saatleri tanımlı olmakla birlikte, hasta veya hasta yakını tarafından kolayca düzenlenebilir. Bu esneklik, farklı doktorların farklı reçete protokollerine uyum sağlamayı mümkün kılar.",
    "Offline Çalışma Kapasitesi: Uygulama internet bağlantısı gerektirmeden çalışır. İlaç saatleri AsyncStorage ile cihaz üzerinde saklanır, AR tanıma ve TTS yerel olarak çalışır. Bu, yaşlı hastaların internet erişimi olmayan ortamlarda bile uygulamayı kullanabilmesini garantiler.",
    "Çapraz Platform Potansiyeli: React Native altyapısı sayesinde, şu an Android odaklı olan uygulama minimum eforla iOS platformuna da taşınabilir. Bu, gelecekte hasta erişimini önemli ölçüde genişletme potansiyeli sunar.",
    "3D Model Entegrasyonu: İlaç kutularının gerçekçi 3D modellemeleri (.glb formatında) AR deneyimini zenginleştirir. Hasta ilacını tanıdığında, kutunun 3D modelinin dönerek belirmesi hem bilgisel hem de görsel açıdan etkileyici bir deneyim yaratır.",
    "Giriş Gerektirmeyen Yapı: Uygulama herhangi bir kayıt veya giriş süreci gerektirmez. Yaşlı hastalar uygulamayı açtığı anda kullanmaya başlayabilir. Bu, kullanım bariyerini minimuma indiren kritik bir tasarım kararıdır.",
    "Clean Code Mimarisi: Proje; constants, hooks, services, components, screens ve navigation katmanlarıyla temiz ve sürdürülebilir bir kod mimarisine sahiptir. TypeScript kullanımı tip güvenliği sağlar ve gelecekteki geliştirmeleri kolaylaştırır.",
]

WEAKNESSES = [
    "Sınırlı İlaç Veritabanı: Uygulama şu an yalnızca iki ilaç (Sandimmun Neoral ve Deltacortril) tanıyabilmektedir. Karaciğer nakli sonrası hastaların kullanabileceği Mycophenolate Mofetil (CellCept), Tacrolimus (Prograf), Ursodeoxycholic Acid gibi ek ilaçlar henüz desteklenmemektedir.",
    "AR Görüntü Tanıma Hassasiyeti: ViroARImageMarker tabanlı tanıma, ilaç kutusunun fiziksel durumuna (yıpranmış, buruşmuş, farklı baskı serisi) ve ortam aydınlatmasına bağlı olarak tutarsız sonuçlar verebilir. Düşük ışık koşullarında veya kutu açıldığında tanıma doğruluğu düşebilir.",
    "İnternet Bağımsız Güncelleme Eksikliği: Yeni ilaçlar veya doz değişiklikleri için uygulama güncellemesi gerekir. Uzaktan ilaç listesi güncelleme mekanizması bulunmamaktadır. Bu, doktor reçete değişikliklerinde gecikmeye neden olabilir.",
    "Tek Platform Desteği (Android): Şu anki sürüm yalnızca Android cihazları desteklemektedir. iOS kullanan hastaların uygulamadan yararlanamaması, erişilebilirliği kısıtlar.",
    "Bildirim/Alarm Eksikliği: Uygulama pasif bir bilgi aracıdır; proaktif olarak ilaç saati geldiğinde push notification veya alarm göndermez. Hasta uygulamayı açmadığı sürece ilaç hatırlatması almaz.",
    "Doktor-Hasta Entegrasyonu Yok: Doktor veya eczacının hastanın ilaç programını uzaktan görüntülemesi veya güncellemesi mümkün değildir. Tedavi takibi tamamen hastanın kendi sorumluluğundadır.",
    "İlaç Etkileşimi Bilgisi Yok: Uygulama, ilaçlar arası etkileşim, yan etkiler veya kontraendikasyon bilgisi sunmamaktadır. Hastanın besin-ilaç etkileşimleri (örn. Ciclosporin ile greyfurt) hakkında uyarılmaması risk oluşturabilir.",
    "Erişilebilirlik Sınırlamaları: Ekran okuyucu (TalkBack) uyumluluğu, renk körlüğü desteği ve motor engelli kullanıcılar için büyük dokunma alanları gibi gelişmiş erişilebilirlik özellikleri henüz implemente edilmemiştir.",
    "Veri Yedekleme Yok: İlaç saatleri yalnızca cihaz yerel deposunda saklanır. Cihaz değişikliğinde veya uygulama silinmesinde tüm kişiselleştirilmiş veriler kaybolur.",
    "ARCore Cihaz Bağımlılığı: AR özellikleri ARCore destekli cihaz gerektirir. Eski veya düşük seviye Android cihazlarda AR fonksiyonları çalışmayabilir, bu da yaşlı hastaların genellikle eski cihaz kullanması göz önüne alındığında önemli bir kısıtlamadır.",
]

OPPORTUNITIES = [
    "Sağlık Sektöründe AR Büyümesi: Küresel artırılmış gerçeklik sağlık pazarı 2025-2030 arasında yıllık %25+ büyüme öngörülmektedir. Bu proje, bu büyüme trendinin erken dönem uygulamalarından biri olarak konumlanabilir ve yatırımcı ilgisi çekebilir.",
    "Hastane ve Klinik Entegrasyonları: Karaciğer nakli merkezleri ve organ nakli koordinasyon birimleriyle işbirliği yapılarak, uygulama taburculuk sürecinin standart bir parçası haline getirilebilir. Bu, hasta uyumluluğunu %30-40 artırma potansiyeline sahiptir.",
    "Yapay Zeka ile İlaç Tanıma Geliştirme: TensorFlow Lite veya Google ML Kit entegrasyonu ile görüntü tabanlı ilaç tanıma sistemi, kutunun yanı sıra tablet/kapsül bazında da tanıma yapabilir hale getirilebilir. Bu, AR marker bağımlılığını ortadan kaldırır.",
    "Çoklu Hastalık Alanlarına Genişleme: Aynı AR altyapısı; böbrek nakli, kalp nakli, diyabet, hipertansiyon, onkoloji gibi farklı hastalık alanlarına adapte edilebilir. Her hastalık için özelleştirilmiş ilaç veritabanı ve protokol eklenebilir.",
    "Giyilebilir Cihaz Entegrasyonu: AR gözlükler (Meta Quest, Apple Vision Pro) ve akıllı saat entegrasyonuyla hands-free ilaç tanıma ve hatırlatma sistemi oluşturulabilir. Bu, yaşlı hastalar için kullanım kolaylığını katlamalı olarak artırır.",
    "Eczane ve İlaç Firması Ortaklıkları: İlaç firmaları (Novartis, Pfizer) ve eczane zincirleriyle sponsorluk anlaşmaları yapılarak, uygulama ücretsiz dağıtılabilir ve ilaç bilgi içeriği zenginleştirilebilir.",
    "Akademik Araştırma Potansiyeli: Proje, 'AR tabanlı ilaç uyumluluğu' alanında akademik yayın ve tez çalışmaları için özgün bir vaka sunmaktadır. Üniversite hastaneleriyle klinik çalışmalar planlanabilir.",
    "Devlet Sağlık Politikalarıyla Uyum: Türkiye'nin dijital sağlık dönüşümü stratejisi ve e-Nabız entegrasyonlarıyla uyumlu bir şekilde konumlanarak, SGK veya Sağlık Bakanlığı desteği alınabilir.",
    "Çok Dilli Genişleme: Uygulama altyapısı dil desteğine uygun tasarlanmıştır. Arapça, Kürtçe, Almanca gibi dillerin eklenmesiyle diaspora toplulukları ve uluslararası pazarlara açılabilir.",
    "IoT ve Akıllı İlaç Kutusu Entegrasyonu: Bluetooth destekli akıllı ilaç kutuları ile entegrasyon sağlanarak, fiziksel ilaç alımının otomatik takibi ve doktora raporlanması mümkün hale getirilebilir.",
    "Teletıp Entegrasyonu: Video görüşme modülü eklenerek, hasta AR kamerasıyla ilacı gösterirken doktorun uzaktan doğrulama yapması ve anlık reçete düzenlemesi sağlanabilir.",
]

THREATS = [
    "Yasal ve Düzenleyici Riskler: Tıbbi cihaz yazılımı olarak sınıflandırılma riski mevcuttur. T.C. İlaç ve Tıbbi Cihaz Kurumu (TİTCK) veya CE/FDA onayı gerekebilir. Onay süreçleri uzun ve maliyetli olabilir.",
    "Veri Gizliliği ve KVKK Uyumu: Kamera kullanımı ve sağlık verisi işlenmesi, KVKK (Kişisel Verilerin Korunması Kanunu) ve GDPR kapsamında ciddi yükümlülükler doğurur. Veri ihlali durumunda ağır yaptırımlar uygulanabilir.",
    "Teknolojik Eskime Riski: React Native, ViroReact ve ARCore kütüphanelerinin sürdürülebilirliği üçüncü taraf topluluklara bağlıdır. ViroReact'ın topluluk tarafından sürdürülmesi, uzun vadede bakım ve güncelleme riskleri oluşturur.",
    "Hasta Güvenliği Riskleri: Yanlış ilaç tanıma veya hatalı saat bilgisi, hastanın yanlış ilacı almasına veya dozunu kaçırmasına neden olabilir. Karaciğer nakli hastalarında bu durum organ reddi gibi hayati sonuçlara yol açabilir.",
    "Rekabet Ortamı: Medisafe, MyTherapy, Pill Reminder gibi olgun ilaç hatırlatma uygulamaları milyonlarca kullanıcıya sahiptir. AR özelliği diferansiyasyon sağlasa da, bu uygulamaların geniş özellik seti ve kullanıcı tabanı ciddi rekabet oluşturur.",
    "Yaşlı Kullanıcı Adaptasyon Zorluğu: Hedef kitle olan 60+ yaş grubu, AR teknolojisine adapte olmakta güçlük çekebilir. Akıllı telefon kullanım oranlarının bu yaş grubunda düşük olması, uygulama benimsenmesini olumsuz etkileyebilir.",
    "ARCore Platformu Kısıtlamaları: Google'ın ARCore desteğini azaltması veya API değişiklikleri yapması durumunda, uygulamanın AR fonksiyonları çalışmaz hale gelebilir. Platform bağımlılığı stratejik bir risk oluşturur.",
    "Yanlış Tıbbi Bilgi Riski: Uygulamanın sağladığı ilaç bilgilerinin güncel ve doğru tutulması sorumluluğu kritiktir. Güncel olmayan prospektüs bilgileri veya doz önerileri hukuki sorumluluk doğurabilir.",
    "Cihaz Donanım Gereksinimleri: AR uygulamaları yüksek işlemci gücü ve pil tüketimi gerektirir. Yaşlı hastaların cihazlarının bu gereksinimleri karşılamaması veya pilin hızla tükenmesi, kullanıcı memnuniyetini düşürebilir.",
    "Siber Güvenlik Tehditleri: Sağlık verilerini hedefleyen siber saldırılar artmaktadır. Yerel depolama şifrelenmemiş olması durumunda, cihaz çalınması veya kötü amaçlı yazılım bulaşması halinde hasta verileri risk altına girebilir.",
]

# ── AR Teknolojisi Genel SWOT ────────────────────────────

AR_STRENGTHS = [
    "Gerçek Dünya ile Dijital Bilgi Birleşimi: AR, fiziksel nesnelerin üzerine dijital içerik bindirerek kullanıcıya bağlamsal ve anlık bilgi sunar. Bu, sağlık alanında ilaç tanıma, cerrahi navigasyon ve hasta eğitiminde devrim niteliğindedir.",
    "Sezgisel Etkileşim Modeli: Kullanıcılar doğal hareketlerle (bakma, tutma, yönlendirme) dijital içerikle etkileşim kurar. Bu, ekran tabanlı arayüzlere kıyasla öğrenme eğrisini önemli ölçüde düşürür.",
    "Mekansal Anlayış: AR teknolojisi ortamı 3D olarak algılar ve anlam çıkarır. SLAM (Simultaneous Localization and Mapping) algoritmaları sayesinde gerçek dünyadaki yüzeyleri, nesneleri ve derinliği anlayabilir.",
    "Çoklu Duyusal Deneyim: Görsel (3D model), işitsel (sesli komut) ve haptik (titreşim) geri bildirimleri birleştirerek çok kanallı bir kullanıcı deneyimi sunar.",
    "Eğitim ve Simülasyon Gücü: Tıp öğrencileri anatomik yapıları AR ile inceleyebilir, cerrahlar ameliyat öncesi 3D planlama yapabilir. AR, teorik bilgiyi pratik uygulamaya dönüştürme potansiyeli taşır.",
]

AR_WEAKNESSES = [
    "Donanım Bağımlılığı: AR deneyimi, cihazın kamerası, işlemcisi, sensörleri ve ekran kalitesine doğrudan bağlıdır. Düşük seviye cihazlarda performans sorunları ve deneyim kalitesi düşüşü kaçınılmazdır.",
    "Pil Tüketimi: Sürekli kamera, GPS, sensör ve GPU kullanımı cihaz pilini hızla tüketir. Mobil AR uygulamalarında ortalama %300-400 daha fazla pil tüketimi gözlemlenir.",
    "Çevresel Koşullara Duyarlılık: Yetersiz aydınlatma, düz yüzey eksikliği, reflektif materyaller ve hızlı hareket, AR deneyiminin kalitesini ciddi şekilde etkiler.",
    "Kullanıcı Yorgunluğu: Uzun süreli AR kullanımı göz yorgunluğu, baş dönmesi ve hareket tutarsızlığı (motion sickness) gibi fizyolojik sorunlara yol açabilir.",
    "Gizlilik Endişeleri: AR uygulamaları sürekli kamera erişimi gerektirir. Bu durum, kullanıcıların ve çevredekilerin gizliliği konusunda ciddi etik ve hukuki sorular doğurur.",
]

AR_OPPORTUNITIES = [
    "5G ve Edge Computing: 5G ağlarının yaygınlaşması, bulut tabanlı AR işlemeyi mümkün kılarak cihaz bağımlılığını azaltacak ve daha karmaşık AR deneyimlerini mobil cihazlarda gerçekleştirmeyi sağlayacaktır.",
    "AR Gözlüklerin Yaygınlaşması: Apple Vision Pro, Meta Quest, ve diğer AR gözlüklerin tüketici pazarına girmesiyle, hands-free AR deneyimleri günlük hayatın parçası haline gelecektir.",
    "WebAR Standartları: Tarayıcı tabanlı AR (WebXR API) olgunlaştıkça, uygulama indirme gerekliliği ortadan kalkacak ve AR erişimi demokratikleşecektir.",
    "Yapay Zeka + AR Sinerjisi: Makine öğrenmesi modelleriyle güçlendirilen AR, nesne tanıma, sahne anlama ve tahminsel içerik yerleştirme konularında çığır açıcı gelişmeler sunacaktır.",
    "Endüstri 4.0 Entegrasyonu: Üretim, lojistik, bakım-onarım ve sağlık sektörlerinde AR tabanlı iş akışları standart hale gelecek, verimlilik artışları %20-35 arasında öngörülmektedir.",
]

AR_THREATS = [
    "Platform Parçalanması: ARCore (Google), ARKit (Apple), OpenXR ve çeşitli SDK'lar arasındaki uyumsuzluklar, geliştiricilerin çoklu platform desteği sağlamasını zorlaştırır ve maliyetleri artırır.",
    "Düzenleyici Belirsizlik: AR içeriklerinin denetlenmesi, sorumluluk paylaşımı ve dijital içeriklerle fiziksel dünyayı birleştirmenin hukuki çerçevesi henüz net değildir.",
    "Sosyal Kabul Bariyerleri: Kamuya açık alanlarda AR cihaz kullanımı, toplumsal tepki ve gizlilik endişeleri yaratabilir. 'Google Glass sendromu' hâlâ sektör için bir uyarıdır.",
    "Güvenlik Açıkları: AR overlay'leri manipüle edilerek kullanıcıları yanıltma (AR spoofing/phishing) potansiyeli, yeni siber güvenlik tehdit vektörleri oluşturmaktadır.",
    "Yüksek Geliştirme Maliyetleri: Kaliteli AR içerik üretimi (3D modelleme, mekansal ses, gerçek zamanlı rendering) geleneksel mobil uygulama geliştirmeden 3-5 kat daha maliyetlidir.",
]


# ── Belge Oluşturma ──────────────────────────────────────

def create_document():
    doc = Document()

    # Sayfa ayarları
    section = doc.sections[0]
    section.page_width = Cm(21)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(2)
    section.bottom_margin = Cm(2)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(2.5)

    # ── KAPAK SAYFASI ────────────────────────────────────
    for _ in range(6):
        doc.add_paragraph()

    # Başlık
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("AR SAĞLIK PROJESİ")
    run.font.size = Pt(36)
    run.font.color.rgb = COLOR_PRIMARY
    run.font.name = "Calibri"
    run.bold = True

    # Alt başlık
    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = subtitle.add_run("SWOT ANALİZİ")
    run.font.size = Pt(28)
    run.font.color.rgb = COLOR_GRAY
    run.font.name = "Calibri"

    # Açıklama
    doc.add_paragraph()
    desc = doc.add_paragraph()
    desc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = desc.add_run("Karaciğer Nakli Sonrası Hasta İlaç Takip Sistemi\nArtırılmış Gerçeklik (AR) Tabanlı Mobil Uygulama")
    run.font.size = Pt(14)
    run.font.color.rgb = COLOR_GRAY
    run.font.name = "Calibri"

    doc.add_paragraph()
    doc.add_paragraph()

    # Tarih ve bilgiler
    info_items = [
        "Teknoloji: React Native CLI + ViroReact + ARCore",
        "Platform: Android",
        "İlaçlar: Sandimmun Neoral (Ciclosporin) | Deltacortril (Prednisolone)",
        "Tarih: Nisan 2026",
    ]
    for item in info_items:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(item)
        run.font.size = Pt(11)
        run.font.color.rgb = COLOR_GRAY
        run.font.name = "Calibri"

    # Sayfa sonu
    doc.add_page_break()

    # ── İÇİNDEKİLER ─────────────────────────────────────
    add_heading_styled(doc, "İÇİNDEKİLER", level=1)
    doc.add_paragraph()

    toc_items = [
        ("1.", "Giriş ve Proje Tanımı"),
        ("2.", "SWOT Analizi Nedir?"),
        ("3.", "Proje SWOT Analizi"),
        ("   3.1.", "Güçlü Yönler (Strengths)"),
        ("   3.2.", "Zayıf Yönler (Weaknesses)"),
        ("   3.3.", "Fırsatlar (Opportunities)"),
        ("   3.4.", "Tehditler (Threats)"),
        ("4.", "SWOT Matrisi"),
        ("5.", "AR Teknolojisi Genel SWOT Analizi"),
        ("   5.1.", "AR Güçlü Yönler"),
        ("   5.2.", "AR Zayıf Yönler"),
        ("   5.3.", "AR Fırsatlar"),
        ("   5.4.", "AR Tehditler"),
        ("6.", "Stratejik Öneriler"),
        ("7.", "Sonuç ve Değerlendirme"),
    ]

    for num, title_text in toc_items:
        p = doc.add_paragraph()
        run_num = p.add_run(num + " ")
        run_num.font.size = Pt(12)
        run_num.font.color.rgb = COLOR_PRIMARY
        run_num.font.name = "Calibri"
        run_num.bold = True

        run_title = p.add_run(title_text)
        run_title.font.size = Pt(12)
        run_title.font.color.rgb = COLOR_DARK
        run_title.font.name = "Calibri"

    doc.add_page_break()

    # ── 1. GİRİŞ ────────────────────────────────────────
    add_heading_styled(doc, "1. Giriş ve Proje Tanımı", level=1)

    intro_text = (
        "AR Sağlık Projesi, karaciğer nakli sonrası tedavi sürecindeki yaşlı hastaların ilaç yönetimini "
        "kolaylaştırmak amacıyla geliştirilmiş bir artırılmış gerçeklik (Augmented Reality - AR) tabanlı "
        "mobil uygulamadır. Uygulama, React Native CLI altyapısı üzerine inşa edilmiş olup, ViroReact "
        "kütüphanesi aracılığıyla ARCore destekli Android cihazlarda çalışmaktadır."
    )
    add_paragraph_styled(doc, intro_text)

    intro2 = (
        "Karaciğer nakli sonrası hastalar, bağışıklık sistemini baskılamak ve organ reddini önlemek için "
        "ömür boyu ilaç kullanmak zorundadır. Bu ilaçların düzenli ve doğru zamanda alınması hayati "
        "önem taşır. Özellikle yaşlı hasta grubunda ilaç uyumsuzluğu (non-adherence) oranları %40-60 "
        "arasında seyretmekte ve bu durum organ reddi, hastaneye yeniden yatış ve ölüm riskini "
        "önemli ölçüde artırmaktadır."
    )
    add_paragraph_styled(doc, intro2)

    intro3 = (
        "Bu proje, geleneksel ilaç hatırlatma yöntemlerinin ötesine geçerek, hastanın ilaç kutusunu "
        "kameraya tutması yeterli olacak şekilde tasarlanmıştır. Uygulama ilacı tanıdığında, kutunun "
        "üzerinde 3D model gösterir ve Türkçe sesli komutla bir sonraki doz zamanını bildirir. "
        "Bu yaklaşım, teknolojiye uzak yaşlı hastalar için bile sezgisel ve kullanımı kolay "
        "bir deneyim sunmaktadır."
    )
    add_paragraph_styled(doc, intro3)

    # İlaç bilgisi tablosu
    doc.add_paragraph()
    add_paragraph_styled(doc, "Projede Kullanılan İlaçlar:", bold=True, color=COLOR_PRIMARY, size=13)

    med_table = doc.add_table(rows=3, cols=5)
    med_table.alignment = WD_TABLE_ALIGNMENT.CENTER

    # Başlıklar
    headers = ["İlaç Adı", "Etken Madde", "Doz", "Üretici", "Kullanım"]
    for i, h in enumerate(headers):
        add_cell_text(med_table.rows[0].cells[i], h, bold=True, color=COLOR_WHITE, size=10, alignment=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell_shading(med_table.rows[0].cells[i], "0D6E6E")

    # Neoral
    neoral_data = ["Sandimmun Neoral", "Ciclosporin", "100 mg", "Novartis", "Günde 2 kez\n(08:00 - 20:00)"]
    for i, d in enumerate(neoral_data):
        add_cell_text(med_table.rows[1].cells[i], d, size=10, alignment=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell_shading(med_table.rows[1].cells[i], "FFF8E7")

    # Deltacortril
    delta_data = ["Deltacortril", "Prednisolone", "5 mg", "Pfizer", "Günde 1 kez\n(10:00)"]
    for i, d in enumerate(delta_data):
        add_cell_text(med_table.rows[2].cells[i], d, size=10, alignment=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell_shading(med_table.rows[2].cells[i], "E8EEF5")

    doc.add_page_break()

    # ── 2. SWOT ANALİZİ NEDİR? ──────────────────────────
    add_heading_styled(doc, "2. SWOT Analizi Nedir?", level=1)

    swot_desc = (
        "SWOT Analizi, bir projenin, organizasyonun veya ürünün stratejik konumunu değerlendirmek için "
        "kullanılan dört boyutlu bir analiz çerçevesidir. SWOT kısaltması İngilizce Strengths (Güçlü Yönler), "
        "Weaknesses (Zayıf Yönler), Opportunities (Fırsatlar) ve Threats (Tehditler) kelimelerinin "
        "baş harflerinden oluşur."
    )
    add_paragraph_styled(doc, swot_desc)

    doc.add_paragraph()

    # SWOT açıklama tablosu
    swot_info = doc.add_table(rows=2, cols=2)
    swot_info.alignment = WD_TABLE_ALIGNMENT.CENTER

    cells_info = [
        ("GÜÇLÜ YÖNLER (S)", "İç faktörler: Projenin sahip olduğu avantajlar, benzersiz özellikler ve rekabet üstünlükleri.", "27AE60", "E8F8F5"),
        ("ZAYIF YÖNLER (W)", "İç faktörler: Projenin eksiklikleri, iyileştirmeye açık alanlar ve dezavantajlar.", "E74C3C", "FDEDEC"),
        ("FIRSATLAR (O)", "Dış faktörler: Projenin büyümesi ve gelişmesi için yararlanılabilecek dış koşullar.", "2980B9", "EBF5FB"),
        ("TEHDİTLER (T)", "Dış faktörler: Projenin başarısını riske atan dış tehlikeler ve engeller.", "E67E22", "FDF2E9"),
    ]

    positions = [(0, 0), (0, 1), (1, 0), (1, 1)]
    for (row, col), (title_text, desc_text, header_color, bg_color) in zip(positions, cells_info):
        cell = swot_info.rows[row].cells[col]
        cell.text = ""

        # Başlık
        p_title = cell.paragraphs[0]
        p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_title.space_before = Pt(8)
        run = p_title.add_run(title_text)
        run.font.size = Pt(13)
        run.font.color.rgb = RGBColor(int(header_color[:2], 16), int(header_color[2:4], 16), int(header_color[4:], 16))
        run.font.name = "Calibri"
        run.bold = True

        # Açıklama
        p_desc = cell.add_paragraph()
        p_desc.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_desc.space_after = Pt(8)
        run = p_desc.add_run(desc_text)
        run.font.size = Pt(10)
        run.font.color.rgb = COLOR_GRAY
        run.font.name = "Calibri"

        set_cell_shading(cell, bg_color)

    doc.add_page_break()

    # ── 3. PROJE SWOT ANALİZİ ───────────────────────────
    add_heading_styled(doc, "3. Proje SWOT Analizi", level=1)
    add_paragraph_styled(
        doc,
        "Bu bölümde AR Sağlık Projesi'nin güçlü yönleri, zayıf yönleri, fırsatları ve tehditleri "
        "ayrıntılı olarak incelenmektedir.",
        color=COLOR_GRAY
    )
    doc.add_paragraph()

    # 3.1 Güçlü Yönler
    add_heading_styled(doc, "3.1 Güçlü Yönler (Strengths)", level=2, color=COLOR_STRENGTH)
    for i, item in enumerate(STRENGTHS, 1):
        title_part, desc_part = item.split(":", 1) if ":" in item else (f"Madde {i}", item)
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(4)

        num_run = p.add_run(f"  {i}. ")
        num_run.font.size = Pt(11)
        num_run.font.color.rgb = COLOR_STRENGTH
        num_run.font.name = "Calibri"
        num_run.bold = True

        title_run = p.add_run(title_part.strip() + ":")
        title_run.font.size = Pt(11)
        title_run.font.color.rgb = COLOR_DARK
        title_run.font.name = "Calibri"
        title_run.bold = True

        desc_run = p.add_run(desc_part.strip())
        desc_run.font.size = Pt(11)
        desc_run.font.color.rgb = COLOR_GRAY
        desc_run.font.name = "Calibri"

    doc.add_page_break()

    # 3.2 Zayıf Yönler
    add_heading_styled(doc, "3.2 Zayıf Yönler (Weaknesses)", level=2, color=COLOR_WEAKNESS)
    for i, item in enumerate(WEAKNESSES, 1):
        title_part, desc_part = item.split(":", 1) if ":" in item else (f"Madde {i}", item)
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(4)

        num_run = p.add_run(f"  {i}. ")
        num_run.font.size = Pt(11)
        num_run.font.color.rgb = COLOR_WEAKNESS
        num_run.font.name = "Calibri"
        num_run.bold = True

        title_run = p.add_run(title_part.strip() + ":")
        title_run.font.size = Pt(11)
        title_run.font.color.rgb = COLOR_DARK
        title_run.font.name = "Calibri"
        title_run.bold = True

        desc_run = p.add_run(desc_part.strip())
        desc_run.font.size = Pt(11)
        desc_run.font.color.rgb = COLOR_GRAY
        desc_run.font.name = "Calibri"

    doc.add_page_break()

    # 3.3 Fırsatlar
    add_heading_styled(doc, "3.3 Fırsatlar (Opportunities)", level=2, color=COLOR_OPP)
    for i, item in enumerate(OPPORTUNITIES, 1):
        title_part, desc_part = item.split(":", 1) if ":" in item else (f"Madde {i}", item)
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(4)

        num_run = p.add_run(f"  {i}. ")
        num_run.font.size = Pt(11)
        num_run.font.color.rgb = COLOR_OPP
        num_run.font.name = "Calibri"
        num_run.bold = True

        title_run = p.add_run(title_part.strip() + ":")
        title_run.font.size = Pt(11)
        title_run.font.color.rgb = COLOR_DARK
        title_run.font.name = "Calibri"
        title_run.bold = True

        desc_run = p.add_run(desc_part.strip())
        desc_run.font.size = Pt(11)
        desc_run.font.color.rgb = COLOR_GRAY
        desc_run.font.name = "Calibri"

    doc.add_page_break()

    # 3.4 Tehditler
    add_heading_styled(doc, "3.4 Tehditler (Threats)", level=2, color=COLOR_THREAT)
    for i, item in enumerate(THREATS, 1):
        title_part, desc_part = item.split(":", 1) if ":" in item else (f"Madde {i}", item)
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(4)

        num_run = p.add_run(f"  {i}. ")
        num_run.font.size = Pt(11)
        num_run.font.color.rgb = COLOR_THREAT
        num_run.font.name = "Calibri"
        num_run.bold = True

        title_run = p.add_run(title_part.strip() + ":")
        title_run.font.size = Pt(11)
        title_run.font.color.rgb = COLOR_DARK
        title_run.font.name = "Calibri"
        title_run.bold = True

        desc_run = p.add_run(desc_part.strip())
        desc_run.font.size = Pt(11)
        desc_run.font.color.rgb = COLOR_GRAY
        desc_run.font.name = "Calibri"

    doc.add_page_break()

    # ── 4. SWOT MATRİSİ ─────────────────────────────────
    add_heading_styled(doc, "4. SWOT Matrisi (Özet Tablo)", level=1)
    add_paragraph_styled(
        doc,
        "Aşağıdaki matris, projenin SWOT analizini özet olarak sunmaktadır.",
        color=COLOR_GRAY
    )
    doc.add_paragraph()

    # 2x2 matris tablosu
    matrix = doc.add_table(rows=3, cols=3)
    matrix.alignment = WD_TABLE_ALIGNMENT.CENTER

    # Sol üst köşe boş
    add_cell_text(matrix.rows[0].cells[0], "", size=10)
    set_cell_shading(matrix.rows[0].cells[0], "0D6E6E")

    # Üst başlıklar
    add_cell_text(matrix.rows[0].cells[1], "OLUMLU\n(Destekleyici)", bold=True, color=COLOR_WHITE, size=11, alignment=WD_ALIGN_PARAGRAPH.CENTER)
    set_cell_shading(matrix.rows[0].cells[1], "0D6E6E")
    add_cell_text(matrix.rows[0].cells[2], "OLUMSUZ\n(Engelleyici)", bold=True, color=COLOR_WHITE, size=11, alignment=WD_ALIGN_PARAGRAPH.CENTER)
    set_cell_shading(matrix.rows[0].cells[2], "0D6E6E")

    # İç faktörler satırı
    add_cell_text(matrix.rows[1].cells[0], "İÇ\nFAKTÖRLER", bold=True, color=COLOR_WHITE, size=11, alignment=WD_ALIGN_PARAGRAPH.CENTER)
    set_cell_shading(matrix.rows[1].cells[0], "0D6E6E")

    strength_summary = [s.split(":")[0] for s in STRENGTHS[:6]]
    add_bullet_cell(matrix.rows[1].cells[1], strength_summary, COLOR_STRENGTH, "E8F8F5")

    weakness_summary = [w.split(":")[0] for w in WEAKNESSES[:6]]
    add_bullet_cell(matrix.rows[1].cells[2], weakness_summary, COLOR_WEAKNESS, "FDEDEC")

    # Dış faktörler satırı
    add_cell_text(matrix.rows[2].cells[0], "DIŞ\nFAKTÖRLER", bold=True, color=COLOR_WHITE, size=11, alignment=WD_ALIGN_PARAGRAPH.CENTER)
    set_cell_shading(matrix.rows[2].cells[0], "0D6E6E")

    opp_summary = [o.split(":")[0] for o in OPPORTUNITIES[:6]]
    add_bullet_cell(matrix.rows[2].cells[1], opp_summary, COLOR_OPP, "EBF5FB")

    threat_summary = [t.split(":")[0] for t in THREATS[:6]]
    add_bullet_cell(matrix.rows[2].cells[2], threat_summary, COLOR_THREAT, "FDF2E9")

    doc.add_page_break()

    # ── 5. AR TEKNOLOJİSİ GENEL SWOT ────────────────────
    add_heading_styled(doc, "5. Artırılmış Gerçeklik (AR) Teknolojisi - Genel SWOT Analizi", level=1)
    add_paragraph_styled(
        doc,
        "Bu bölümde, projenin temelini oluşturan Artırılmış Gerçeklik teknolojisinin genel olarak "
        "güçlü ve zayıf yönleri, sektörel fırsatları ve tehditleri değerlendirilmektedir.",
        color=COLOR_GRAY
    )
    doc.add_paragraph()

    # AR SWOT - her bölüm
    ar_sections = [
        ("5.1 AR - Güçlü Yönler", AR_STRENGTHS, COLOR_STRENGTH),
        ("5.2 AR - Zayıf Yönler", AR_WEAKNESSES, COLOR_WEAKNESS),
        ("5.3 AR - Fırsatlar", AR_OPPORTUNITIES, COLOR_OPP),
        ("5.4 AR - Tehditler", AR_THREATS, COLOR_THREAT),
    ]

    for section_title, items, color in ar_sections:
        add_heading_styled(doc, section_title, level=2, color=color)
        for i, item in enumerate(items, 1):
            title_part, desc_part = item.split(":", 1) if ":" in item else (f"Madde {i}", item)
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(4)

            num_run = p.add_run(f"  {i}. ")
            num_run.font.size = Pt(11)
            num_run.font.color.rgb = color
            num_run.font.name = "Calibri"
            num_run.bold = True

            title_run = p.add_run(title_part.strip() + ":")
            title_run.font.size = Pt(11)
            title_run.font.color.rgb = COLOR_DARK
            title_run.font.name = "Calibri"
            title_run.bold = True

            desc_run = p.add_run(" " + desc_part.strip())
            desc_run.font.size = Pt(11)
            desc_run.font.color.rgb = COLOR_GRAY
            desc_run.font.name = "Calibri"

        doc.add_paragraph()

    doc.add_page_break()

    # ── 6. STRATEJİK ÖNERİLER ───────────────────────────
    add_heading_styled(doc, "6. Stratejik Öneriler", level=1)

    strategies = [
        ("SO Stratejileri (Güçlü Yönler + Fırsatlar)", COLOR_STRENGTH, [
            "AR teknolojisinin sezgisel yapısını kullanarak hastane taburculuk süreçlerine entegre olun. Yaşlı dostu arayüz, hastane yöneticileri için güçlü bir satış argümanıdır.",
            "3D model ve TTS altyapısını genişleterek, yapay zeka destekli ilaç tanıma sistemine geçiş yapın. Bu, ARCore marker bağımlılığını ortadan kaldırır ve tanıma doğruluğunu artırır.",
            "React Native'in çapraz platform avantajını kullanarak iOS sürümünü çıkarın. Böylece hasta erişim tabanını iki katına çıkarabilirsiniz.",
            "Offline çalışma kapasitesini öne çıkararak kırsal bölgelerdeki hastanelere ve sağlık ocaklarına ulaşın.",
            "Akademik yayınlar ve klinik çalışmalarla projenin bilimsel geçerliliğini kanıtlayın; bu, devlet desteği ve hibe almayı kolaylaştırır.",
        ]),
        ("WO Stratejileri (Zayıf Yönler + Fırsatlar)", COLOR_OPP, [
            "İlaç veritabanı sınırlılığını, eczane ve ilaç firması ortaklıklarıyla aşın. Novartis ve Pfizer gibi firmalardan ilaç verisi ve finansal destek alın.",
            "Bildirim eksikliğini gidermek için push notification ve alarm sistemi ekleyin. Bu özellik, rekabet avantajını önemli ölçüde artıracaktır.",
            "Doktor-hasta entegrasyonu eksikliğini teletıp modülüyle çözün. Bulut tabanlı bir backend ile doktorların hasta ilaç programını uzaktan yönetmesini sağlayın.",
            "ARCore cihaz bağımlılığını azaltmak için, AR desteklemeyen cihazlarda kamera tabanlı basit ilaç tanıma modu (fallback) sunun.",
            "Erişilebilirlik sınırlamalarını TalkBack uyumluluğu ve sesli navigasyon ile aşarak, engelli hasta grubuna da hizmet verin.",
        ]),
        ("ST Stratejileri (Güçlü Yönler + Tehditler)", COLOR_THREAT, [
            "Yasal riskleri minimize etmek için 'tıbbi bilgi aracı' olarak konumlanın, 'tıbbi cihaz' sınıflandırmasından kaçının. Uygulama içi yasal uyarılar ekleyin.",
            "Hasta güvenliği risklerini azaltmak için çoklu doğrulama sistemi uygulayın: ilaç tanındığında hastaya 'Bu ilacı aldığınızı onaylıyor musunuz?' sorusu sorun.",
            "ViroReact teknolojik eskime riskine karşı, AR katmanını soyutlanmış bir mimariyle tasarlayın. Böylece gelecekte başka bir AR SDK'ya geçiş kolay olur.",
            "Rekabet tehdidine karşı, AR ile ilaç tanıma özelliğini patent veya faydalı model ile koruma altına alın.",
            "KVKK uyumu için kamera verilerinin cihaz üzerinde işlenip sunucuya gönderilmediğini belgeleyin ve gizlilik politikası oluşturun.",
        ]),
        ("WT Stratejileri (Zayıf Yönler + Tehditler)", COLOR_WEAKNESS, [
            "Sınırlı ilaç veritabanı ve yasal riskler birleştiğinde, yanlış tanıma riski artar. Bu nedenle, tanınmayan ilaçlar için 'Bu ilacı tanıyamadım, lütfen doktorunuza danışın' mesajı zorunlu olmalıdır.",
            "Yaşlı kullanıcı adaptasyon zorluğu ve donanım gereksinimleri birlikte ele alınmalıdır. Hasta yakınları için bir 'kurulum rehberi' ve cihaz uyumluluk listesi hazırlayın.",
            "Veri yedekleme eksikliği ve siber güvenlik tehditleri birlikte çözülmelidir. Şifreli yerel depolama ve opsiyonel bulut yedekleme özelliği ekleyin.",
            "Bildirim eksikliği ve ARCore kısıtlamaları, AR olmayan bir 'basit mod' ile dengelenebilir. Bu mod sadece ilaç listesi, geri sayım ve alarmları içerir.",
            "Düzenleyici belirsizliğe karşı, Sağlık Bakanlığı ve TİTCK ile erken aşamada iletişime geçerek, uygulamanın yasal statüsünü netleştirin.",
        ]),
    ]

    for title_text, color, items in strategies:
        add_heading_styled(doc, title_text, level=2, color=color)
        for i, item in enumerate(items, 1):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.left_indent = Cm(0.5)

            num_run = p.add_run(f"{i}. ")
            num_run.font.size = Pt(11)
            num_run.font.color.rgb = color
            num_run.font.name = "Calibri"
            num_run.bold = True

            text_run = p.add_run(item)
            text_run.font.size = Pt(11)
            text_run.font.color.rgb = COLOR_GRAY
            text_run.font.name = "Calibri"

    doc.add_page_break()

    # ── 7. SONUÇ ─────────────────────────────────────────
    add_heading_styled(doc, "7. Sonuç ve Değerlendirme", level=1)

    conclusion_paras = [
        "AR Sağlık Projesi, karaciğer nakli sonrası ilaç yönetimi alanında artırılmış gerçeklik "
        "teknolojisini kullanan yenilikçi bir çözüm olarak önemli bir potansiyel taşımaktadır. "
        "SWOT analizi sonuçları, projenin güçlü bir teknolojik temele sahip olduğunu, ancak "
        "bazı kritik alanlarda iyileştirme gerektirdiğini ortaya koymaktadır.",

        "Projenin en belirgin güçlü yönleri; AR tabanlı sezgisel ilaç tanıma, Türkçe sesli "
        "komut sistemi ve yaşlı dostu arayüz tasarımıdır. Bu özellikler, uygulamayı mevcut "
        "ilaç hatırlatma uygulamalarından açık bir şekilde farklılaştırmaktadır. Özellikle "
        "hastanın ilacını kameraya tutarak bilgi alması paradigması, dijital sağlık okuryazarlığı "
        "düşük olan yaşlı hastalar için devrim niteliğinde bir yaklaşımdır.",

        "Öte yandan, sınırlı ilaç veritabanı, proaktif bildirim eksikliği ve tek platform "
        "desteği gibi zayıf yönler, uygulamanın klinik etkinliğini kısıtlamaktadır. Bu "
        "zayıflıkların giderilmesi, projenin piyasa başarısı için kritik öneme sahiptir.",

        "Fırsatlar açısından değerlendirildiğinde, küresel AR sağlık pazarının hızlı büyümesi, "
        "hastane entegrasyonu potansiyeli ve yapay zeka ile güçlendirme imkanları, projenin "
        "gelecek vizyonunu oldukça parlak kılmaktadır. Ancak bu fırsatların "
        "değerlendirilmesi, yasal düzenlemeler, hasta güvenliği riskleri ve teknolojik "
        "eskime tehditleriyle dengelenmelidir.",

        "Stratejik öneriler çerçevesinde, kısa vadede bildirim sistemi ve ilaç veritabanı "
        "genişletilmesi, orta vadede iOS desteği ve doktor entegrasyonu, uzun vadede ise "
        "yapay zeka destekli tanıma ve giyilebilir cihaz entegrasyonu hedeflenmelidir. "
        "Bu aşamalı yaklaşım, projenin sürdürülebilir büyümesini ve klinik etkisini "
        "maksimize edecektir.",

        "Sonuç olarak, AR Sağlık Projesi; doğru stratejik kararlarla, karaciğer nakli sonrası "
        "ilaç uyumluluğu sorununa yenilikçi ve etkili bir çözüm sunma potansiyeline sahip, "
        "umut vadeden bir dijital sağlık girişimidir.",
    ]

    for para_text in conclusion_paras:
        add_paragraph_styled(doc, para_text)

    # ── ALT BİLGİ ────────────────────────────────────────
    doc.add_paragraph()
    add_divider(doc)
    doc.add_paragraph()

    footer = doc.add_paragraph()
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = footer.add_run("AR Sağlık Projesi - SWOT Analizi Raporu\nNisan 2026")
    run.font.size = Pt(10)
    run.font.color.rgb = COLOR_GRAY
    run.font.name = "Calibri"
    run.italic = True

    return doc


# ── Ana çalıştırma ───────────────────────────────────────
if __name__ == "__main__":
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "AR_Saglik_SWOT_Analizi.docx")

    print("SWOT Analizi Word belgesi oluşturuluyor...")
    doc = create_document()
    doc.save(output_path)
    print(f"Belge başarıyla oluşturuldu: {output_path}")
    print(f"Toplam sayfa: ~15+")
    print(f"Proje SWOT: {len(STRENGTHS)} güçlü yön, {len(WEAKNESSES)} zayıf yön, {len(OPPORTUNITIES)} fırsat, {len(THREATS)} tehdit")
    print(f"AR SWOT: {len(AR_STRENGTHS)} güçlü yön, {len(AR_WEAKNESSES)} zayıf yön, {len(AR_OPPORTUNITIES)} fırsat, {len(AR_THREATS)} tehdit")
