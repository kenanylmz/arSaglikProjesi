import {useState, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {DoseRecord} from '../types';
import {syncDose} from '../services/firestoreService';

const STORAGE_KEY = '@dose_history_v1';
const MAX_DAYS = 30;

function buildRecordId(
  medicineId: string,
  date: string,
  scheduledTime: string,
): string {
  return `${medicineId}_${date}_${scheduledTime.replace(':', '')}`;
}

function getDateStr(daysAgo = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export function useMedicineHistory() {
  const [records, setRecords] = useState<DoseRecord[]>([]);

  const loadRecords = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecords(JSON.parse(stored));
      }
    } catch {
      // sessiz hata
    }
  }, []);

  const persistRecords = async (updated: DoseRecord[]) => {
    const cutoff = getDateStr(MAX_DAYS);
    const trimmed = updated.filter(r => r.date >= cutoff);
    setRecords(trimmed);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // sessiz hata
    }
  };

  const logDose = useCallback(
    async (medicineId: string, scheduledTime: string): Promise<boolean> => {
      const date = getDateStr(0);
      const id = buildRecordId(medicineId, date, scheduledTime);
      const existing = records.find(r => r.id === id);
      if (existing?.taken) {
        return false; // zaten kaydedildi
      }

      const newRecord: DoseRecord = {
        id,
        medicineId,
        date,
        scheduledTime,
        takenAt: new Date().toISOString(),
        taken: true,
      };

      const updated = records.filter(r => r.id !== id).concat(newRecord);
      await persistRecords(updated);
      // Arka planda Firestore'a yaz — hata olursa sessiz geç
      syncDose(newRecord).catch(() => {});
      return true;
    },
    [records],
  );

  const isDoseTaken = useCallback(
    (medicineId: string, date: string, scheduledTime: string): boolean => {
      const id = buildRecordId(medicineId, date, scheduledTime);
      return records.some(r => r.id === id && r.taken);
    },
    [records],
  );

  const getWeekRecords = useCallback((): DoseRecord[] => {
    const dates = Array.from({length: 7}, (_, i) => getDateStr(6 - i));
    return records.filter(r => dates.includes(r.date));
  }, [records]);

  const getTodayRecords = useCallback((): DoseRecord[] => {
    const today = getDateStr(0);
    return records.filter(r => r.date === today);
  }, [records]);

  return {
    records,
    loadRecords,
    logDose,
    isDoseTaken,
    getWeekRecords,
    getTodayRecords,
  };
}
