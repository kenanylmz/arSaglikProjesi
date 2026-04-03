import Tts from 'react-native-tts';

let initialized = false;

export async function initTTS(): Promise<void> {
  if (initialized) {
    return;
  }

  try {
    await Tts.setDefaultLanguage('tr-TR');
    await Tts.setDefaultRate(0.45);
    await Tts.setDefaultPitch(1.0);
    initialized = true;
  } catch {
    // Türkçe yoksa varsayılan dille devam et
    try {
      await Tts.setDefaultRate(0.45);
      initialized = true;
    } catch {
      // Sessizce hata yut
    }
  }
}

export function speak(text: string): void {
  Tts.stop();
  Tts.speak(text);
}

export function stopSpeaking(): void {
  Tts.stop();
}
