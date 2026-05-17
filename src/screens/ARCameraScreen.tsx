import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {Colors} from '../constants/colors';
import {Strings} from '../constants/strings';
import {ARMedicineOverlay} from '../components/ARMedicineScene';
import {useMedicineSchedule} from '../hooks/useMedicineSchedule';
import {useMedicineHistory} from '../hooks/useMedicineHistory';
import {stopSpeaking} from '../services/ttsService';
import {findCurrentDoseTime} from '../utils/timeUtils';

// İlaç tanıma anahtar kelimeleri
const MEDICINE_KEYWORDS: Record<string, string[]> = {
  neoral: ['neoral', 'sandimmun', 'ciclosporin', 'cyclosporin', 'novartis'],
  deltacortril: [
    'deltacortril',
    'prednisolone',
    'prednisolon',
    'pfizer',
    'enteric',
  ],
  cellcept: [
    'cellcept',
    'mycophenolate',
    'mycophenolic',
    'mofetil',
    'roche',
    'mmc',
  ],
};

function identifyMedicine(recognizedText: string): string | null {
  const lowerText = recognizedText.toLowerCase();

  for (const [medicineId, keywords] of Object.entries(MEDICINE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return medicineId;
      }
    }
  }
  return null;
}

export function ARCameraScreen() {
  const navigation = useNavigation();
  const {schedule} = useMedicineSchedule();
  const {loadRecords, logDose} = useMedicineHistory();
  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);

  const [detectedMedicine, setDetectedMedicine] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Tarama animasyonu
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
    loadRecords();
    return () => {
      stopSpeaking();
    };
  }, []);

  // Tarama çizgisi animasyonu
  useEffect(() => {
    if (!detectedMedicine) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [detectedMedicine]);

  const handleScan = useCallback(async () => {
    if (scanning || !cameraRef.current) {
      return;
    }

    setScanning(true);
    setScanError(null);

    try {
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
      });

      const filePath =
        Platform.OS === 'android' ? `file://${photo.path}` : photo.path;

      const result = await TextRecognition.recognize(filePath);

      const fullText = result.text;
      const medicineId = identifyMedicine(fullText);

      if (medicineId) {
        setDetectedMedicine(medicineId);
      } else {
        setScanError('İlaç tanınamadı. Lütfen kutuyu daha yakından tutun.');
        setTimeout(() => setScanError(null), 3000);
      }
    } catch (error) {
      setScanError('Tarama sırasında hata oluştu. Tekrar deneyin.');
      setTimeout(() => setScanError(null), 3000);
    } finally {
      setScanning(false);
    }
  }, [scanning]);

  const handleReset = useCallback(() => {
    stopSpeaking();
    setDetectedMedicine(null);
  }, []);

  // İzin yok
  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Icon name="camera-off" size={64} color={Colors.textSecondary} />
        <Text style={styles.permissionText}>Kamera izni gereklidir</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={requestPermission}>
          <Text style={styles.retryText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Cihaz bulunamadı
  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <Icon name="camera-off" size={64} color={Colors.textSecondary} />
        <Text style={styles.permissionText}>Kamera bulunamadı</Text>
      </View>
    );
  }

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Kamera */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      {/* Üst bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            stopSpeaking();
            navigation.goBack();
          }}>
          <Icon name="arrow-left" size={26} color="#FFF" />
          <Text style={styles.backText}>{Strings.ar.back}</Text>
        </TouchableOpacity>

        {detectedMedicine && (
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Icon name="refresh" size={22} color="#FFF" />
            <Text style={styles.resetText}>Yeniden Tara</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* İlaç tanındıysa overlay göster */}
      {detectedMedicine ? (
        <View style={styles.overlayContainer}>
          <ARMedicineOverlay
            medicineId={detectedMedicine}
            times={schedule}
            onDoseTaken={async () => {
              const medicineTimes =
                schedule[detectedMedicine] ?? [];
              const doseTime = findCurrentDoseTime(medicineTimes);
              return logDose(detectedMedicine, doseTime);
            }}
          />
        </View>
      ) : (
        <>
          {/* Tarama çerçevesi */}
          <View style={styles.scanFrameContainer}>
            <Animated.View
              style={[styles.scanFrame, {transform: [{scale: pulseAnim}]}]}>
              {/* Köşe işaretleri */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              {/* Tarama çizgisi */}
              <Animated.View
                style={[
                  styles.scanLine,
                  {transform: [{translateY: scanLineTranslate}]},
                ]}
              />
            </Animated.View>
          </View>

          {/* Alt kısım */}
          <View style={styles.bottomBar}>
            {scanError && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={20} color={Colors.warning} />
                <Text style={styles.errorText}>{scanError}</Text>
              </View>
            )}

            {/* Talimat */}
            <View style={styles.instructionContainer}>
              <Icon name="cube-scan" size={24} color="#FFF" />
              <Text style={styles.instructionText}>
                {Strings.ar.instruction}
              </Text>
            </View>

            {/* Tarama butonu */}
            <TouchableOpacity
              style={[styles.scanButton, scanning && styles.scanButtonDisabled]}
              onPress={handleScan}
              disabled={scanning}
              activeOpacity={0.8}>
              {scanning ? (
                <ActivityIndicator size="large" color="#FFF" />
              ) : (
                <>
                  <View style={styles.scanButtonInner}>
                    <Icon name="line-scan" size={36} color="#FFF" />
                  </View>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.scanHint}>
              {scanning ? 'Taranıyor...' : 'İlacı çerçeveye alıp tarayın'}
            </Text>
          </View>
        </>
      )}
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
    color: '#FFF',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 6,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  // Overlay
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 5,
  },
  // Tarama çerçevesi
  scanFrameContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 260,
    height: 260,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Colors.secondary,
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: Colors.secondary,
    top: '50%',
    shadowColor: Colors.secondary,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  // Alt kısım
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231,76,60,0.9)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
    flex: 1,
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 10,
    marginBottom: 24,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  scanButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.secondary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  scanButtonDisabled: {
    opacity: 0.7,
  },
  scanButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 12,
  },
});
