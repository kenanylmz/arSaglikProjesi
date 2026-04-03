import {CountdownInfo} from '../types';

export function parseTime(timeStr: string): {hours: number; minutes: number} {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return {hours, minutes};
}

export function formatTime24to12(timeStr: string): string {
  const {hours, minutes} = parseTime(timeStr);
  const period = hours >= 12 ? 'akşam' : 'sabah';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${period} ${displayHour}:${minutes.toString().padStart(2, '0')}`;
}

export function getNextDoseInfo(times: string[]): CountdownInfo {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const sortedTimes = [...times].sort();

  let nextTime: string | null = null;
  let diffMinutes = 0;

  for (const time of sortedTimes) {
    const {hours, minutes} = parseTime(time);
    const timeMinutes = hours * 60 + minutes;
    if (timeMinutes > currentMinutes) {
      nextTime = time;
      diffMinutes = timeMinutes - currentMinutes;
      break;
    }
  }

  if (!nextTime) {
    // Tüm dozlar geçmiş, yarının ilk dozu
    const firstTime = sortedTimes[0];
    const {hours, minutes} = parseTime(firstTime);
    const timeMinutes = hours * 60 + minutes;
    diffMinutes = 24 * 60 - currentMinutes + timeMinutes;
    nextTime = firstTime;
  }

  const isOverdue =
    sortedTimes.some(time => {
      const {hours, minutes} = parseTime(time);
      const timeMinutes = hours * 60 + minutes;
      const diff = currentMinutes - timeMinutes;
      return diff > 0 && diff <= 30;
    });

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  const seconds = 60 - now.getSeconds();

  return {
    hours,
    minutes,
    seconds,
    nextTime,
    isOverdue,
  };
}

export function getCurrentTimeStr(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}
