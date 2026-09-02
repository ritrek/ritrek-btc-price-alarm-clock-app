import { Alarm, ClockFormat, RepeatMode } from '@/types';
import { nextTriggerMillis } from '@/utils/schedule';

export const WEEKDAYS = [
  { id: 0, short: 'S', label: 'Sunday' },
  { id: 1, short: 'M', label: 'Monday' },
  { id: 2, short: 'T', label: 'Tuesday' },
  { id: 3, short: 'W', label: 'Wednesday' },
  { id: 4, short: 'T', label: 'Thursday' },
  { id: 5, short: 'F', label: 'Friday' },
  { id: 6, short: 'S', label: 'Saturday' },
];

export function systemUses24HourClock(): boolean {
  try {
    const resolved = Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions() as {
      hour12?: boolean;
      hourCycle?: string;
    };
    if (resolved.hourCycle === 'h23' || resolved.hourCycle === 'h24') {
      return true;
    }
    if (resolved.hourCycle === 'h11' || resolved.hourCycle === 'h12') {
      return false;
    }
    if (typeof resolved.hour12 === 'boolean') {
      return !resolved.hour12;
    }
  } catch {
    // Locale APIs are unavailable in some runtimes.
  }
  return false;
}

export function uses24HourClock(format: ClockFormat): boolean {
  if (format === '24h') {
    return true;
  }
  if (format === '12h') {
    return false;
  }
  return systemUses24HourClock();
}

export function formatAlarmTimeParts(
  hour: number,
  minute: number,
  use24Hour: boolean
): { time: string; period?: string } {
  const m = minute.toString().padStart(2, '0');
  if (use24Hour) {
    return { time: `${hour.toString().padStart(2, '0')}:${m}` };
  }
  const period = hour < 12 ? 'AM' : 'PM';
  const h12 = hour % 12 || 12;
  return { time: `${h12}:${m}`, period };
}

export function formatAlarmTime(hour: number, minute: number, use24Hour = true): string {
  const parts = formatAlarmTimeParts(hour, minute, use24Hour);
  return parts.period ? `${parts.time} ${parts.period}` : parts.time;
}

export function subtractHoursFromAlarmTime(
  hour: number,
  minute: number,
  hours: number
): { hour: number; minute: number } {
  const dayMinutes = 24 * 60;
  const wrapped = (((hour * 60 + minute - hours * 60) % dayMinutes) + dayMinutes) % dayMinutes;
  return { hour: Math.floor(wrapped / 60), minute: wrapped % 60 };
}

export function nextOccurrenceLabel(alarm: Alarm, from = Date.now()): string {
  const at = nextTriggerMillis(alarm, from);
  if (at == null) {
    return 'Not scheduled';
  }
  const next = new Date(at);
  const now = new Date(from);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startNext = new Date(next.getFullYear(), next.getMonth(), next.getDate()).getTime();
  const dayDiff = Math.round((startNext - startToday) / 86_400_000);
  if (dayDiff === 0) {
    return 'Today';
  }
  if (dayDiff === 1) {
    return 'Tomorrow';
  }
  return WEEKDAYS[next.getDay()]?.label ?? '';
}

export function repeatLabel(mode: RepeatMode, days: number[]): string {
  if (mode === 'once') {
    return 'Once';
  }
  if (mode === 'daily') {
    return 'Every day';
  }
  if (!days.length) {
    return 'Custom';
  }
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 7) {
    return 'Every day';
  }
  return sorted.map((day) => WEEKDAYS[day]?.label ?? '').filter(Boolean).join(', ');
}

export function newAlarmId(): string {
  return `alarm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
