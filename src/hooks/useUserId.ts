import {useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const USER_ID_KEY = '@ar_user_id';

// Okunabilir 8 karakterlik ID: AR-XXXX-XXXX
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateUserId(): string {
  const part = (len: number) =>
    Array.from({length: len}, () =>
      CHARS[Math.floor(Math.random() * CHARS.length)],
    ).join('');
  return `AR-${part(4)}-${part(4)}`;
}

export async function getOrCreateUserId(): Promise<string> {
  let id = await AsyncStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = generateUserId();
    await AsyncStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getOrCreateUserId().then(setUserId).catch(() => {
      setUserId(generateUserId());
    });
  }, []);

  return userId;
}
