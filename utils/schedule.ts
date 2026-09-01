import { Alarm } from '@/types';
import { compareAlarms } from '@/utils/alarm';

export function nextTriggerMillis(alarm: Alarm, from = Date.now()): number | null {
  if (!alarm.enabled) {
    return null;
  }
  const cal = new Date(from);
  cal.setSeconds(0, 0);
  cal.setHours(alarm.hour, alarm.minute, 0, 0);

  if (alarm.mode === 'once') {
    if (cal.getTime() <= from) {
      cal.setDate(cal.getDate() + 1);
    }
    return cal.getTime();
  }

  for (let i = 0; i < 8; i += 1) {
    const ourDay = cal.getDay();
    const matches = alarm.mode === 'daily' || alarm.days.includes(ourDay);
    if (matches && cal.getTime() > from) {
      return cal.getTime();
    }
    cal.setDate(cal.getDate() + 1);
  }
  return null;
}

export function nextScheduledAlarm(alarms: Alarm[]): Alarm | null {
  let best: { alarm: Alarm; at: number } | null = null;
  for (const alarm of alarms) {
    const at = nextTriggerMillis(alarm);
    if (at == null) {
      continue;
    }
    if (!best || at < best.at || (at === best.at && compareAlarms(alarm, best.alarm) < 0)) {
      best = { alarm, at };
    }
  }
  return best?.alarm ?? null;
}
