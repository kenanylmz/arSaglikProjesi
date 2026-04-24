export const Strings = {
  appName: 'AR Sağlık',
  home: {
    title: 'İlaçlarım',
    subtitle: 'Karaciğer Nakli Sonrası Tedavi',
    openCamera: 'Kamerayı Aç',
    openCameraDesc: 'İlacınızı kameraya tutarak bilgi alın',
    nextDose: 'Sonraki Doz',
    remaining: 'kaldı',
    overdue: 'Zamanı geçti!',
    editTime: 'Saati Düzenle',
    save: 'Kaydet',
    cancel: 'İptal',
    timeUpdated: 'İlaç saati güncellendi',
    dailyTimes: 'Günlük Kullanım Saatleri',
    dose: 'Doz',
    statusTaken: 'Alındı',
    statusMissed: 'Atlandı',
    statusPending: 'Bekleniyor',
  },
  ar: {
    instruction: 'İlacınızı kameraya tutun',
    recognized: 'İlaç tanındı!',
    back: 'Geri',
    nextDoseAt: 'Bir sonraki kullanım saati',
    timeRemaining: 'Kalan süre',
    doseTaken: 'İlacı Aldım',
    doseAlreadyTaken: 'Zaten kaydedildi',
    doseSaved: 'İlaç alımı kaydedildi ✓',
  },
  routine: {
    title: 'Haftalık Rutinim',
    subtitle: 'Son 7 gün',
    compliance: 'Uyum',
    taken: 'Alındı',
    missed: 'Kaçırıldı',
    pending: 'Bekleniyor',
    thisWeek: 'Bu Hafta',
    noRecords: 'Henüz ilaç kaydı yok',
    noRecordsDesc: 'AR kamerayı kullanarak ilaç aldığınızı kaydedin',
  },
  notification: {
    channelName: 'İlaç Hatırlatıcıları',
    title: (name: string) => `💊 ${name}`,
    body: (dosage: string) => `${dosage} — ilaç alma zamanı!`,
  },
  tts: {
    medicineSpeech: (
      name: string,
      nextTime: string,
      hours: number,
      minutes: number,
    ) => {
      const timeStr =
        hours > 0 ? `${hours} saat ${minutes} dakika` : `${minutes} dakika`;
      return `Bu ${name}. Bir sonraki kullanım saati ${nextTime}. ${timeStr} kaldı.`;
    },
    overdueSpeech: (name: string) =>
      `Dikkat! ${name} ilacınızın kullanım zamanı geçmiştir. Lütfen ilacınızı alın.`,
  },
};
