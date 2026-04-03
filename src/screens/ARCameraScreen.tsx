import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {ViroARSceneNavigator} from '@reactvision/react-viro';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {Colors} from '../constants/colors';
import {Strings} from '../constants/strings';
import {ARMedicineScene} from '../components/ARMedicineScene';
import {useMedicineSchedule} from '../hooks/useMedicineSchedule';
import {MEDICINES} from '../constants/medicines';
import {getNextDoseInfo, formatTime24to12} from '../utils/timeUtils';
import {stopSpeaking} from '../services/ttsService';

export function ARCameraScreen() {
  const navigation = useNavigation();
  const {schedule} = useMedicineSchedule();
  const [cameraPermission, setCameraPermission] = useState(false);
  const [detectedMedicine, setDetectedMedicine] = useState<string | null>(null);

  useEffect(() => {
    requestCameraPermission();
    return () => {
      stopSpeaking();
    };
  }, []);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Kamera İzni',
          message: 'İlaçlarınızı tanımak için kamera erişimi gereklidir.',
          buttonPositive: 'İzin Ver',
          buttonNegative: 'Reddet',
        },
      );
      setCameraPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
    }
  };

  const handleMedicineDetected = (medicineId: string) => {
    setDetectedMedicine(medicineId);
  };

  const detectedInfo = detectedMedicine
    ? MEDICINES.find(m => m.id === detectedMedicine)
    : null;

  const detectedCountdown = detectedMedicine
    ? getNextDoseInfo(
        schedule[detectedMedicine] ||
          MEDICINES.find(m => m.id === detectedMedicine)?.defaultTimes ||
          [],
      )
    : null;

  if (!cameraPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Icon name="camera-off" size={64} color={Colors.textSecondary} />
        <Text style={styles.permissionText}>
          Kamera izni gereklidir
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={requestCameraPermission}>
          <Text style={styles.retryText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* AR Sahne */}
      <ViroARSceneNavigator
        initialScene={{
          scene: () => (
            <ARMedicineScene
              times={schedule}
              onMedicineDetected={handleMedicineDetected}
            />
          ),
        }}
        style={styles.arScene}
      />

      {/* Üst bar - Geri butonu + talimat */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            stopSpeaking();
            navigation.goBack();
          }}>
          <Icon name="arrow-left" size={28} color={Colors.textLight} />
          <Text style={styles.backText}>{Strings.ar.back}</Text>
        </TouchableOpacity>
      </View>

      {/* Talimat veya tanınan ilaç bilgisi */}
      <View style={styles.bottomBar}>
        {detectedInfo && detectedCountdown ? (
          <View style={styles.detectedContainer}>
            <View style={styles.detectedHeader}>
              <Icon name="check-circle" size={24} color={Colors.success} />
              <Text style={styles.detectedTitle}>{Strings.ar.recognized}</Text>
            </View>
            <Text style={styles.detectedName}>{detectedInfo.name}</Text>
            <Text style={styles.detectedDose}>
              {detectedInfo.genericName} - {detectedInfo.dosage}
            </Text>
            <View style={styles.detectedTimeRow}>
              <Icon name="clock-outline" size={20} color={Colors.secondary} />
              <Text style={styles.detectedTime}>
                {Strings.ar.nextDoseAt}:{' '}
                {formatTime24to12(detectedCountdown.nextTime)}
              </Text>
            </View>
            <Text style={styles.detectedCountdown}>
              {detectedCountdown.isOverdue
                ? Strings.home.overdue
                : `${detectedCountdown.hours} saat ${detectedCountdown.minutes} dakika ${Strings.ar.timeRemaining}`}
            </Text>
          </View>
        ) : (
          <View style={styles.instructionContainer}>
            <Icon name="cube-scan" size={32} color={Colors.textLight} />
            <Text style={styles.instructionText}>
              {Strings.ar.instruction}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 24,
  },
  permissionText: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textLight,
  },
  arScene: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textLight,
    marginLeft: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    gap: 12,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textLight,
  },
  detectedContainer: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 20,
    padding: 20,
  },
  detectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detectedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.success,
  },
  detectedName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textLight,
  },
  detectedDose: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  detectedTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  detectedTime: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.secondary,
  },
  detectedCountdown: {
    fontSize: 16,
    color: Colors.textLight,
    marginTop: 6,
  },
});
