import React, {useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Colors} from '../constants/colors';
import {Strings} from '../constants/strings';
import {MEDICINES} from '../constants/medicines';
import {MedicineCard} from '../components/MedicineCard';
import {useMedicineSchedule} from '../hooks/useMedicineSchedule';
import {useMedicineHistory} from '../hooks/useMedicineHistory';
import {initTTS} from '../services/ttsService';
import {
  requestNotificationPermission,
  scheduleAllNotifications,
} from '../services/notificationService';
import {getOrCreateUserId} from '../hooks/useUserId';
import {ensureUserDoc, syncSchedule} from '../services/firestoreService';
import type {RootStackParamList} from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {getTimes, updateTimes, loading, schedule} = useMedicineSchedule();
  const {loadRecords, isDoseTaken} = useMedicineHistory();

  useEffect(() => {
    initTTS();
    requestNotificationPermission();
  }, []);

  // Schedule yüklendikten sonra: bildirimler + Firestore ilk sync
  useEffect(() => {
    if (!loading) {
      scheduleAllNotifications(schedule);
      // Kullanıcı dokümanı yoksa oluştur, schedule'ı aktar
      getOrCreateUserId()
        .then(userId => ensureUserDoc(userId))
        .catch(() => {});
      syncSchedule(schedule).catch(() => {});
    }
  }, [loading]);

  // AR kameradan dönünce kayıtları yenile
  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [loadRecords]),
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="pill" size={48} color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryDark}
      />

      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>{Strings.home.title}</Text>
            <Text style={styles.headerSubtitle}>{Strings.home.subtitle}</Text>
          </View>
          <Icon name="heart-pulse" size={40} color="rgba(255,255,255,0.3)" />
        </View>
      </LinearGradient>

      {/* İlaç Kartları */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {MEDICINES.map(medicine => {
          const times = getTimes(medicine.id);
          const today = new Date().toISOString().split('T')[0];
          const takenTimes = times.filter(t =>
            isDoseTaken(medicine.id, today, t),
          );
          return (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              times={times}
              takenTimesToday={takenTimes}
              onUpdateTimes={newTimes => updateTimes(medicine.id, newTimes)}
            />
          );
        })}

        {/* Boşluk (AR butonu için) */}
        <View style={{height: 100}} />
      </ScrollView>

      {/* AR Kamera Butonu */}
      <View style={styles.arButtonContainer}>
        <TouchableOpacity
          style={styles.arButton}
          onPress={() => navigation.navigate('ARCamera')}
          activeOpacity={0.85}>
          <LinearGradient
            colors={[Colors.secondary, '#E8941E']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.arButtonGradient}>
            <Icon name="camera" size={28} color={Colors.textLight} />
            <View style={styles.arButtonTextContainer}>
              <Text style={styles.arButtonTitle}>
                {Strings.home.openCamera}
              </Text>
              <Text style={styles.arButtonDesc}>
                {Strings.home.openCameraDesc}
              </Text>
            </View>
            <Icon
              name="chevron-right"
              size={28}
              color="rgba(255,255,255,0.7)"
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textLight,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  arButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: 'transparent',
  },
  arButton: {
    borderRadius: 20,
    elevation: 8,
    shadowColor: Colors.secondary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  arButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  arButtonTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  arButtonTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.textLight,
  },
  arButtonDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
