import notifee, {
  AndroidImportance,
  TriggerType,
  RepeatFrequency,
} from '@notifee/react-native';
import {MedicineSchedule} from '../types';
import {MEDICINES} from '../constants/medicines';
import {Strings} from '../constants/strings';

const CHANNEL_ID = 'medicine_reminders';

// Sessiz saatler: 23:00 - 07:00
function isSilentHour(hour: number): boolean {
  return hour >= 23 || hour < 7;
}

// Bir sonraki saat:dakika geçişini ms cinsinden döndürür
function getNextTriggerMs(hour: number, minute: number): number {
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hour, minute, 0, 0);
  if (trigger.getTime() <= now.getTime()) {
    trigger.setDate(trigger.getDate() + 1);
  }
  return trigger.getTime();
}

async function ensureChannel() {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: Strings.notification.channelName,
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
}

export async function scheduleAllNotifications(
  schedule: MedicineSchedule,
): Promise<void> {
  try {
    await ensureChannel();

    // Mevcut tüm alarm bildirimlerini iptal et
    const existing = await notifee.getTriggerNotifications();
    await Promise.all(
      existing.map(n =>
        notifee.cancelTriggerNotification(n.notification.id!),
      ),
    );

    for (const medicine of MEDICINES) {
      const times = schedule[medicine.id] ?? medicine.defaultTimes;

      for (const time of times) {
        const [hour, minute] = time.split(':').map(Number);
        if (isSilentHour(hour)) {
          continue;
        }

        const notifId = `${medicine.id}_${time.replace(':', '')}`;

        await notifee.createTriggerNotification(
          {
            id: notifId,
            title: Strings.notification.title(medicine.name),
            body: Strings.notification.body(medicine.dosage),
            android: {
              channelId: CHANNEL_ID,
              smallIcon: 'ic_launcher',
              color: medicine.color,
              pressAction: {
                id: 'default',
                launchActivity: 'default',
              },
            },
          },
          {
            type: TriggerType.TIMESTAMP,
            timestamp: getNextTriggerMs(hour, minute),
            repeatFrequency: RepeatFrequency.DAILY,
          },
        );
      }
    }
  } catch {
    // Bildirim izni verilmemişse sessizce geç
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    const existing = await notifee.getTriggerNotifications();
    await Promise.all(
      existing.map(n =>
        notifee.cancelTriggerNotification(n.notification.id!),
      ),
    );
  } catch {}
}

export async function requestNotificationPermission(): Promise<void> {
  try {
    await notifee.requestPermission();
  } catch {}
}
