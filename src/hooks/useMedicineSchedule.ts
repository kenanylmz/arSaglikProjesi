import {useState, useEffect, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {MedicineSchedule} from '../types';
import {MEDICINES} from '../constants/medicines';
import {scheduleAllNotifications} from '../services/notificationService';
import {syncSchedule} from '../services/firestoreService';

const STORAGE_KEY = '@medicine_schedule';

function getDefaultSchedule(): MedicineSchedule {
  const schedule: MedicineSchedule = {};
  MEDICINES.forEach(med => {
    schedule[med.id] = [...med.defaultTimes];
  });
  return schedule;
}

export function useMedicineSchedule() {
  const [schedule, setSchedule] = useState<MedicineSchedule>(
    getDefaultSchedule(),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSchedule(JSON.parse(stored));
      }
    } catch {
      // Varsayılan saatlerle devam et
    } finally {
      setLoading(false);
    }
  };

  const updateTimes = useCallback(
    async (medicineId: string, times: string[]) => {
      const newSchedule = {...schedule, [medicineId]: times};
      setSchedule(newSchedule);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSchedule));
        // Saat güncellenince alarmları yeniden planla + Firestore'a yaz
        await Promise.all([
          scheduleAllNotifications(newSchedule),
          syncSchedule(newSchedule),
        ]);
      } catch {
        // Sessizce hata yut
      }
    },
    [schedule],
  );

  const getTimes = useCallback(
    (medicineId: string): string[] => {
      return schedule[medicineId] || [];
    },
    [schedule],
  );

  return {schedule, loading, updateTimes, getTimes};
}
