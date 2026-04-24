import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {MedicineSchedule, DoseRecord} from '../types';
import {MEDICINES} from '../constants/medicines';
import {USER_ID_KEY} from '../hooks/useUserId';

// ─── Yardımcılar ────────────────────────────────────────────────────────────

async function uid(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(USER_ID_KEY);
  } catch {
    return null;
  }
}

function usersCol() {
  return firestore().collection('users');
}

// ─── Kullanıcı ───────────────────────────────────────────────────────────────

export async function ensureUserDoc(userId: string): Promise<void> {
  try {
    const ref = usersCol().doc(userId);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({createdAt: firestore.FieldValue.serverTimestamp()});
    }
  } catch {
    // offline veya hata — sessiz geç
  }
}

// ─── Schedule Sync ──────────────────────────────────────────────────────────

export async function syncSchedule(schedule: MedicineSchedule): Promise<void> {
  const userId = await uid();
  if (!userId) {
    return;
  }
  try {
    await usersCol()
      .doc(userId)
      .collection('schedule')
      .doc('current')
      .set({
        medicines: schedule,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
  } catch {
    // offline — sessiz geç
  }
}

// ─── Doz Sync ───────────────────────────────────────────────────────────────

export async function syncDose(record: DoseRecord): Promise<void> {
  const userId = await uid();
  if (!userId) {
    return;
  }
  try {
    await usersCol()
      .doc(userId)
      .collection('doses')
      .doc(record.id)
      .set(record);
  } catch {
    // offline — sessiz geç
  }
}

// ─── Bakıcı Sorgusu ─────────────────────────────────────────────────────────

export interface CaregiverDayData {
  schedule: MedicineSchedule;
  doses: DoseRecord[];
}

export async function fetchUserDayData(
  targetUserId: string,
  date: string,
): Promise<CaregiverDayData> {
  // Paralel iste: schedule + o günün dozları
  const [scheduleSnap, dosesSnap] = await Promise.all([
    usersCol()
      .doc(targetUserId)
      .collection('schedule')
      .doc('current')
      .get(),
    usersCol()
      .doc(targetUserId)
      .collection('doses')
      .where('date', '==', date)
      .get(),
  ]);

  if (!scheduleSnap.exists) {
    throw new Error('Kullanıcı bulunamadı.');
  }

  const rawSchedule = scheduleSnap.data()?.medicines ?? null;

  // Firestore'da schedule yoksa default saatler
  const schedule: MedicineSchedule = rawSchedule ?? (() => {
    const def: MedicineSchedule = {};
    MEDICINES.forEach(m => {
      def[m.id] = [...m.defaultTimes];
    });
    return def;
  })();

  const doses = dosesSnap.docs.map(d => d.data() as DoseRecord);

  return {schedule, doses};
}
