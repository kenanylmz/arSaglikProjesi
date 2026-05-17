import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors} from '../constants/colors';
import {MEDICINES} from '../constants/medicines';
import {MedicineSchedule, DoseRecord} from '../types';
import {fetchUserDayData, fetchUserWeekData} from '../services/firestoreService';
import {generateAndOpenWeeklyReport} from '../services/pdfReportService';
import {formatTime24to12} from '../utils/timeUtils';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type DoseStatus = 'taken' | 'missed' | 'pending';

function calcStatus(
  date: string,
  scheduledTime: string,
  doses: DoseRecord[],
  medicineId: string,
): DoseStatus {
  const taken = doses.some(
    d =>
      d.medicineId === medicineId &&
      d.scheduledTime === scheduledTime &&
      d.taken,
  );
  if (taken) {
    return 'taken';
  }

  const todayStr = new Date().toISOString().split('T')[0];
  if (date < todayStr) {
    return 'missed';
  }

  const [h, m] = scheduledTime.split(':').map(Number);
  const doseMs = new Date().setHours(h, m, 0, 0);
  if (Date.now() > doseMs + 30 * 60 * 1000) {
    return 'missed';
  }
  return 'pending';
}

function takenAtLabel(
  medicineId: string,
  scheduledTime: string,
  doses: DoseRecord[],
): string | null {
  const rec = doses.find(
    d =>
      d.medicineId === medicineId &&
      d.scheduledTime === scheduledTime &&
      d.taken,
  );
  if (!rec?.takenAt) {
    return null;
  }
  const d = new Date(rec.takenAt);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}'de alındı`;
}

export function CaregiverModal({visible, onClose}: Props) {
  const [inputId, setInputId] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    schedule: MedicineSchedule;
    doses: DoseRecord[];
    date: string;
    queriedId: string;
  } | null>(null);

  const handleQuery = async () => {
    const trimmed = inputId.trim().toUpperCase();
    if (trimmed.length < 4) {
      setError("Geçerli bir kullanıcı ID'si girin.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await fetchUserDayData(trimmed, today);
      setResult({...data, date: today, queriedId: trimmed});
    } catch (e: any) {
      setError(
        e?.message ?? 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result) {
      return;
    }
    setPdfLoading(true);
    try {
      const weekData = await fetchUserWeekData(result.queriedId);
      await generateAndOpenWeeklyReport({
        userId: result.queriedId,
        schedule: weekData.schedule,
        dosesByDate: weekData.dosesByDate,
        dates: weekData.dates,
      });
    } catch (e: any) {
      ToastAndroid.show(
        e?.message ?? 'PDF oluşturulamadı.',
        ToastAndroid.LONG,
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const handleClose = () => {
    setInputId('');
    setError(null);
    setResult(null);
    onClose();
  };

  const todayLabel = (() => {
    const d = new Date();
    return `${d.getDate()} ${
      [
        'Ocak',
        'Şubat',
        'Mart',
        'Nisan',
        'Mayıs',
        'Haziran',
        'Temmuz',
        'Ağustos',
        'Eylül',
        'Ekim',
        'Kasım',
        'Aralık',
      ][d.getMonth()]
    } ${d.getFullYear()}`;
  })();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Başlık */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Icon name="shield-account" size={24} color={Colors.primary} />
              <Text style={styles.headerTitle}>Ebeveyn / Bakıcı Kontrolü</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Icon name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            Takip etmek istediğiniz kişinin uygulama ID'sini girin.
          </Text>

          {/* Arama */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              value={inputId}
              onChangeText={t => {
                setInputId(t);
                setError(null);
              }}
              placeholder="AR-XXXX-XXXX"
              placeholderTextColor={Colors.border}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
            />
            <TouchableOpacity
              style={[styles.queryBtn, loading && styles.queryBtnDisabled]}
              onPress={handleQuery}
              disabled={loading}
              activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.queryBtnText}>Sorgula</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Hata */}
          {error && (
            <View style={styles.errorBox}>
              <Icon
                name="alert-circle-outline"
                size={18}
                color={Colors.warning}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Sonuçlar */}
          {result && (
            <>
              <ScrollView
                style={styles.results}
                showsVerticalScrollIndicator={false}>
                {/* Tarih + ID */}
                <View style={styles.resultHeader}>
                  <Text style={styles.resultDate}>{todayLabel}</Text>
                  <Text style={styles.resultId}>ID: {result.queriedId}</Text>
                </View>

                {MEDICINES.map(medicine => {
                  const times =
                    result.schedule[medicine.id] ?? medicine.defaultTimes;
                  return (
                    <View key={medicine.id} style={styles.medicineBlock}>
                      {/* İlaç başlığı */}
                      <View style={styles.medicineHeader}>
                        <View
                          style={[
                            styles.colorBar,
                            {backgroundColor: medicine.color},
                          ]}
                        />
                        <View style={styles.medicineInfo}>
                          <Text style={styles.medicineName}>
                            {medicine.name}
                          </Text>
                          <Text style={styles.medicineSub}>
                            {medicine.genericName} · {medicine.dosage}
                          </Text>
                        </View>
                      </View>

                      {/* Dozlar */}
                      {times.map(time => {
                        const status = calcStatus(
                          result.date,
                          time,
                          result.doses,
                          medicine.id,
                        );
                        const takenAt = takenAtLabel(
                          medicine.id,
                          time,
                          result.doses,
                        );

                        return (
                          <View key={time} style={styles.doseRow}>
                            <Text style={styles.doseTime}>
                              {formatTime24to12(time)}
                            </Text>
                            <View style={styles.doseRight}>
                              {status === 'taken' && (
                                <View
                                  style={[
                                    styles.statusBadge,
                                    styles.badgeTaken,
                                  ]}>
                                  <Icon
                                    name="check-circle"
                                    size={14}
                                    color={Colors.success}
                                  />
                                  <Text
                                    style={[
                                      styles.statusText,
                                      {color: Colors.success},
                                    ]}>
                                    {takenAt ?? 'Alındı'}
                                  </Text>
                                </View>
                              )}
                              {status === 'missed' && (
                                <View
                                  style={[
                                    styles.statusBadge,
                                    styles.badgeMissed,
                                  ]}>
                                  <Icon
                                    name="close-circle"
                                    size={14}
                                    color={Colors.warning}
                                  />
                                  <Text
                                    style={[
                                      styles.statusText,
                                      {color: Colors.warning},
                                    ]}>
                                    Kaçırıldı
                                  </Text>
                                </View>
                              )}
                              {status === 'pending' && (
                                <View
                                  style={[
                                    styles.statusBadge,
                                    styles.badgePending,
                                  ]}>
                                  <Icon
                                    name="clock-outline"
                                    size={14}
                                    color={Colors.secondary}
                                  />
                                  <Text
                                    style={[
                                      styles.statusText,
                                      {color: Colors.secondary},
                                    ]}>
                                    Bekleniyor
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}

                <View style={{height: 8}} />
              </ScrollView>

              {/* PDF İndir Butonu */}
              <TouchableOpacity
                style={[
                  styles.pdfButton,
                  pdfLoading && styles.pdfButtonDisabled,
                ]}
                onPress={handleDownloadPdf}
                disabled={pdfLoading}
                activeOpacity={0.8}>
                {pdfLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text style={styles.pdfButtonText}>Rapor Hazırlanıyor...</Text>
                  </>
                ) : (
                  <>
                    <Icon name="file-pdf-box" size={22} color="#FFF" />
                    <Text style={styles.pdfButtonText}>
                      Haftalık Raporu İndir (PDF)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  hint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    letterSpacing: 2,
  },
  queryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  queryBtnDisabled: {
    opacity: 0.6,
  },
  queryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warning + '15',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '500',
  },
  results: {
    marginTop: 8,
    maxHeight: 380,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultDate: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  resultId: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  medicineBlock: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  medicineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  colorBar: {
    width: 4,
    height: 34,
    borderRadius: 2,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  medicineSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  doseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  doseTime: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  doseRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  badgeTaken: {
    backgroundColor: Colors.success + '18',
  },
  badgeMissed: {
    backgroundColor: Colors.warning + '18',
  },
  badgePending: {
    backgroundColor: Colors.secondary + '18',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // PDF Butonu
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: '#1565C0',
    elevation: 3,
    shadowColor: '#1565C0',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  pdfButtonDisabled: {
    opacity: 0.65,
  },
  pdfButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
