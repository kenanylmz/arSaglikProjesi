import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors} from '../constants/colors';
import {Strings} from '../constants/strings';
import {MEDICINES} from '../constants/medicines';
import {useMedicineHistory} from '../hooks/useMedicineHistory';
import {useMedicineSchedule} from '../hooks/useMedicineSchedule';
import {useUserId} from '../hooks/useUserId';
import {CaregiverModal} from '../components/CaregiverModal';

const TR_DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

interface DayInfo {
  date: string;
  dayName: string;
  dayNum: string;
  isToday: boolean;
}

function getWeekDays(): DayInfo[] {
  return Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toISOString().split('T')[0],
      dayName: TR_DAYS[d.getDay()],
      dayNum: d.getDate().toString(),
      isToday: i === 6,
    };
  });
}

type DoseStatus = 'taken' | 'missed' | 'pending' | 'future';

function calcDoseStatus(
  medicineId: string,
  date: string,
  scheduledTime: string,
  isToday: boolean,
  isDoseTaken: (m: string, d: string, t: string) => boolean,
): DoseStatus {
  if (isDoseTaken(medicineId, date, scheduledTime)) {
    return 'taken';
  }
  const todayStr = new Date().toISOString().split('T')[0];
  if (date < todayStr) {
    return 'missed';
  }
  if (isToday) {
    const [hour, minute] = scheduledTime.split(':').map(Number);
    const now = new Date();
    const doseMs = new Date().setHours(hour, minute, 0, 0);
    const gracePeriod = 30 * 60 * 1000;
    if (now.getTime() > doseMs + gracePeriod) {
      return 'missed';
    }
    return 'pending';
  }
  return 'future';
}

function StatusDot({
  status,
  isToday,
}: {
  status: DoseStatus;
  isToday: boolean;
}) {
  const dotStyle = [
    styles.statusDot,
    status === 'taken' && styles.dotTaken,
    status === 'missed' && styles.dotMissed,
    status === 'pending' && styles.dotPending,
    status === 'future' && styles.dotFuture,
    isToday && styles.dotTodayRing,
  ];

  return (
    <View style={dotStyle}>
      {status === 'taken' && (
        <Icon name="check" size={10} color="#FFF" />
      )}
      {status === 'missed' && (
        <Icon name="close" size={10} color="#FFF" />
      )}
    </View>
  );
}

export function RoutineScreen() {
  const {loadRecords, isDoseTaken} = useMedicineHistory();
  const {getTimes, loading} = useMedicineSchedule();
  const userId = useUserId();
  const [caregiverVisible, setCaregiverVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [loadRecords]),
  );

  const weekDays = getWeekDays();
  const todayStr = new Date().toISOString().split('T')[0];

  // Uyum hesabı: geçmiş + bugün geçen dozlar
  let totalDoses = 0;
  let takenCount = 0;

  for (const {date, isToday} of weekDays) {
    if (date > todayStr) {
      continue;
    }
    for (const medicine of MEDICINES) {
      const times = getTimes(medicine.id);
      for (const time of times) {
        const status = calcDoseStatus(
          medicine.id,
          date,
          time,
          isToday,
          isDoseTaken,
        );
        if (status === 'pending' || status === 'future') {
          continue;
        }
        totalDoses++;
        if (status === 'taken') {
          takenCount++;
        }
      }
    }
  }

  const compliance =
    totalDoses > 0 ? Math.round((takenCount / totalDoses) * 100) : 100;
  const complianceColor =
    compliance >= 80
      ? Colors.success
      : compliance >= 50
      ? Colors.secondary
      : Colors.warning;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="calendar-check" size={48} color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{Strings.routine.title}</Text>
            <Text style={styles.headerSubtitle}>{Strings.routine.subtitle}</Text>
            {userId ? (
              <View style={styles.userIdRow}>
                <Icon name="identifier" size={13} color="rgba(255,255,255,0.65)" />
                <Text style={styles.userIdText}>{userId}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.headerRight}>
            {/* Bakıcı kontrolü butonu */}
            <TouchableOpacity
              style={styles.caregiverBtn}
              onPress={() => setCaregiverVisible(true)}
              activeOpacity={0.8}>
              <Icon name="shield-account-outline" size={20} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.complianceBadge}>
              <Text style={[styles.complianceValue, {color: complianceColor}]}>
                {compliance}%
              </Text>
              <Text style={styles.complianceLabel}>{Strings.routine.compliance}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <CaregiverModal
        visible={caregiverVisible}
        onClose={() => setCaregiverVisible(false)}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Lejant */}
        <View style={styles.legend}>
          <LegendItem color={Colors.success} label={Strings.routine.taken} />
          <LegendItem color={Colors.warning} label={Strings.routine.missed} />
          <LegendItem color={Colors.secondary} label={Strings.routine.pending} />
        </View>

        {/* Gün başlıkları — sabit */}
        <View style={styles.weekHeader}>
          <View style={styles.timeLabelPlaceholder} />
          {weekDays.map(day => (
            <View key={day.date} style={styles.dayHeaderCol}>
              <Text
                style={[
                  styles.dayHeaderName,
                  day.isToday && styles.dayHeaderNameToday,
                ]}>
                {day.dayName}
              </Text>
              <View
                style={[
                  styles.dayHeaderNum,
                  day.isToday && styles.dayHeaderNumToday,
                ]}>
                <Text
                  style={[
                    styles.dayHeaderNumText,
                    day.isToday && styles.dayHeaderNumTextToday,
                  ]}>
                  {day.dayNum}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* İlaç bölümleri */}
        {MEDICINES.map(medicine => {
          const times = getTimes(medicine.id);
          return (
            <View key={medicine.id} style={styles.medicineSection}>
              {/* İlaç başlığı */}
              <View style={styles.medicineSectionHeader}>
                <View
                  style={[
                    styles.medicineColorBar,
                    {backgroundColor: medicine.color},
                  ]}
                />
                <View style={styles.medicineTitleBlock}>
                  <Text style={styles.medicineName}>{medicine.name}</Text>
                  <Text style={styles.medicineDosage}>
                    {medicine.genericName} · {medicine.dosage}
                  </Text>
                </View>
              </View>

              {/* Her doz saati için satır */}
              {times.map(time => (
                <View key={time} style={styles.doseRow}>
                  <Text style={styles.doseTimeLabel}>{time}</Text>
                  {weekDays.map(day => (
                    <View key={day.date} style={styles.doseCell}>
                      <StatusDot
                        status={calcDoseStatus(
                          medicine.id,
                          day.date,
                          time,
                          day.isToday,
                          isDoseTaken,
                        )}
                        isToday={day.isToday}
                      />
                    </View>
                  ))}
                </View>
              ))}
            </View>
          );
        })}

        {/* Haftalık özet */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>{Strings.routine.thisWeek}</Text>
          <View style={styles.statsRow}>
            <StatItem
              value={takenCount}
              label={Strings.routine.taken}
              color={Colors.success}
              icon="check-circle"
            />
            <View style={styles.statsDivider} />
            <StatItem
              value={totalDoses - takenCount}
              label={Strings.routine.missed}
              color={Colors.warning}
              icon="close-circle"
            />
            <View style={styles.statsDivider} />
            <StatItem
              value={`${compliance}%`}
              label={Strings.routine.compliance}
              color={complianceColor}
              icon="chart-arc"
            />
          </View>
        </View>

        <View style={{height: 24}} />
      </ScrollView>
    </View>
  );
}

function LegendItem({color, label}: {color: string; label: string}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, {backgroundColor: color}]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function StatItem({
  value,
  label,
  color,
  icon,
}: {
  value: number | string;
  label: string;
  color: string;
  icon: string;
}) {
  return (
    <View style={styles.statItem}>
      <Icon name={icon} size={24} color={color} />
      <Text style={[styles.statValue, {color}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textLight,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 3,
  },
  userIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  userIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1,
  },
  caregiverBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 10,
  },
  complianceBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  complianceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textLight,
  },
  complianceLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginTop: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  // Gün başlıkları
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  timeLabelPlaceholder: {
    width: 50,
  },
  dayHeaderCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  dayHeaderName: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  dayHeaderNameToday: {
    color: Colors.primary,
  },
  dayHeaderNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayHeaderNumToday: {
    backgroundColor: Colors.primary,
  },
  dayHeaderNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  dayHeaderNumTextToday: {
    color: Colors.textLight,
  },
  // İlaç bölümü
  medicineSection: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  medicineSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  medicineColorBar: {
    width: 4,
    height: 36,
    borderRadius: 2,
    marginRight: 12,
  },
  medicineTitleBlock: {
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  medicineDosage: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  doseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  doseTimeLabel: {
    width: 50,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  doseCell: {
    flex: 1,
    alignItems: 'center',
  },
  // Status dot
  statusDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotTaken: {
    backgroundColor: Colors.success,
  },
  dotMissed: {
    backgroundColor: Colors.warning,
  },
  dotPending: {
    backgroundColor: Colors.secondary,
    opacity: 0.85,
  },
  dotFuture: {
    backgroundColor: Colors.border,
  },
  dotTodayRing: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  // İstatistik kartı
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    marginTop: 4,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statsDivider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.border,
  },
});
