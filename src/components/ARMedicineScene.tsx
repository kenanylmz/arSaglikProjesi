import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  ToastAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors} from '../constants/colors';
import {Strings} from '../constants/strings';
import {MEDICINES} from '../constants/medicines';
import {getNextDoseInfo, formatTime24to12} from '../utils/timeUtils';
import {speak} from '../services/ttsService';
import {Model3DViewer} from './Model3DViewer';

const MODEL_FILES: Record<string, 'ilac1.glb' | 'ilac2.glb' | 'ilac3.glb'> = {
  neoral: 'ilac1.glb',
  deltacortril: 'ilac2.glb',
  cellcept: 'ilac3.glb',
};

interface Props {
  medicineId: string;
  times: Record<string, string[]>;
  onDoseTaken?: () => Promise<boolean>;
}

export function ARMedicineOverlay({medicineId, times, onDoseTaken}: Props) {
  const [doseTaken, setDoseTaken] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const cardSlideAnim = useRef(new Animated.Value(50)).current;
  const cardOpacityAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const spokenRef = useRef(false);

  const medicine = MEDICINES.find(m => m.id === medicineId);
  if (!medicine) {
    return null;
  }

  const medicineTimes = times[medicineId] || medicine.defaultTimes;
  const countdown = getNextDoseInfo(medicineTimes);
  const nextTimeFormatted = formatTime24to12(countdown.nextTime);

  useEffect(() => {
    // 3D model giriş animasyonu
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Bilgi kartı animasyonu (gecikmiş)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(cardSlideAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, 300);

    // Glow pulse animasyonu
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.7,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Sesli bildirim
    if (!spokenRef.current) {
      spokenRef.current = true;
      setTimeout(() => {
        if (countdown.isOverdue) {
          speak(Strings.tts.overdueSpeech(medicine.name));
        } else {
          speak(
            Strings.tts.medicineSpeech(
              medicine.name,
              nextTimeFormatted,
              countdown.hours,
              countdown.minutes,
            ),
          );
        }
      }, 600);
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* 3D Model - Gerçek .glb dosyası */}
      <Animated.View
        style={[
          styles.modelWrapper,
          {transform: [{scale: scaleAnim}]},
        ]}>
        <Animated.View
          style={[
            styles.glowRing,
            {opacity: glowAnim, shadowColor: medicine.color},
          ]}
        />
        <Model3DViewer modelFile={MODEL_FILES[medicineId]} size={260} />
      </Animated.View>

      {/* İlaç Bilgi Kartı */}
      <Animated.View
        style={[
          styles.infoCard,
          {
            transform: [{translateY: cardSlideAnim}],
            opacity: cardOpacityAnim,
          },
        ]}>
        {/* Tanındı badge */}
        <View style={[styles.badge, {backgroundColor: medicine.color + '25'}]}>
          <View style={[styles.badgeDot, {backgroundColor: Colors.success}]} />
          <Text style={styles.badgeText}>{Strings.ar.recognized}</Text>
        </View>

        {/* İlaç adı */}
        <Text style={styles.medicineName}>{medicine.name}</Text>
        <Text style={styles.medicineGeneric}>
          {medicine.genericName} - {medicine.dosage}
        </Text>
        <Text style={styles.medicineDesc} numberOfLines={2}>
          {medicine.description}
        </Text>

        <View style={styles.divider} />

        {/* Zaman bilgisi */}
        <View style={styles.timeSection}>
          <View style={styles.timeRow}>
            <Text style={styles.timeIcon}>⏰</Text>
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>{Strings.ar.nextDoseAt}</Text>
              <Text style={styles.timeValue}>{nextTimeFormatted}</Text>
            </View>
          </View>

          <View style={styles.countdownBox}>
            {countdown.isOverdue ? (
              <Text style={styles.overdueText}>{Strings.home.overdue}</Text>
            ) : (
              <>
                <Text style={styles.countdownValue}>
                  {countdown.hours}sa {countdown.minutes}dk
                </Text>
                <Text style={styles.countdownLabel}>
                  {Strings.ar.timeRemaining}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* İlacı Aldım butonu */}
        {onDoseTaken && (
          <TouchableOpacity
            style={[
              styles.takeDoseButton,
              doseTaken && styles.takeDoseButtonDone,
            ]}
            onPress={async () => {
              if (doseTaken) {
                return;
              }
              const saved = await onDoseTaken();
              if (saved) {
                setDoseTaken(true);
                ToastAndroid.show(Strings.ar.doseSaved, ToastAndroid.SHORT);
              } else {
                ToastAndroid.show(
                  Strings.ar.doseAlreadyTaken,
                  ToastAndroid.SHORT,
                );
              }
            }}
            activeOpacity={0.8}>
            <Icon
              name={doseTaken ? 'check-circle' : 'pill'}
              size={22}
              color="#FFF"
            />
            <Text style={styles.takeDoseButtonText}>
              {doseTaken ? Strings.ar.doseAlreadyTaken : Strings.ar.doseTaken}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    flex: 1,
  },
  // 3D Model
  modelWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  glowRing: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    elevation: 20,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 30,
  },
  // Bilgi Kartı
  infoCard: {
    backgroundColor: 'rgba(10, 10, 20, 0.88)',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success,
  },
  medicineName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  medicineGeneric: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  medicineDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 6,
    lineHeight: 17,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 14,
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  timeInfo: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
    marginTop: 2,
  },
  countdownBox: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  countdownValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  countdownLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  overdueText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.warning,
  },
  takeDoseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.success,
  },
  takeDoseButtonDone: {
    backgroundColor: 'rgba(39,174,96,0.4)',
  },
  takeDoseButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
});
