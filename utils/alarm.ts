import { BtcAlarm } from '@/modules/btc-alarm/src';
import { Alarm, RepeatMode } from '@/types';
import { getCurrentBtcUsd } from '@/utils/price';

export function createdAtFromId(id: string): number {
  const stamp = id.split('_')[1];
  if (!stamp) {
    return 0;
  }
  const parsed = parseInt(stamp, 36);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function compareAlarms(a: Alarm, b: Alarm): number {
  const time = a.hour * 60 + a.minute - (b.hour * 60 + b.minute);
  if (time !== 0) {
    return time;
  }
  const created = a.createdAt - b.createdAt;
  if (created !== 0) {
    return created;
  }
  return a.id.localeCompare(b.id);
}

export function normalizeAlarm(alarm: Alarm): Alarm {
  const rawMode = alarm.mode as string;
  const enabled = typeof alarm.enabled === 'boolean' ? alarm.enabled : rawMode !== 'off';
  const mode: RepeatMode =
    rawMode === 'once' || rawMode === 'daily' || rawMode === 'custom'
      ? rawMode
      : alarm.days?.length
        ? 'custom'
        : 'once';
  const snoozeUntil =
    typeof alarm.snoozeUntil === 'number' && alarm.snoozeUntil > Date.now()
      ? alarm.snoozeUntil
      : null;
  const createdAt =
    typeof alarm.createdAt === 'number' && alarm.createdAt > 0
      ? alarm.createdAt
      : createdAtFromId(alarm.id);
  return { ...alarm, enabled, mode, snoozeUntil, createdAt };
}

export function withCreatedAt(next: Alarm, existing?: Alarm): Alarm {
  if (next.createdAt > 0) {
    return existing?.createdAt && existing.createdAt > 0
      ? { ...next, createdAt: existing.createdAt }
      : next;
  }
  const fallback = existing?.createdAt && existing.createdAt > 0 ? existing.createdAt : Date.now();
  return { ...next, createdAt: fallback };
}

function sameDays(left: number[] | undefined, right: number[] | undefined): boolean {
  const a = [...(left ?? [])].sort((x, y) => x - y);
  const b = [...(right ?? [])].sort((x, y) => x - y);
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function alarmUserFieldsChanged(previous: Alarm, next: Alarm): boolean {
  return (
    previous.hour !== next.hour ||
    previous.minute !== next.minute ||
    previous.mode !== next.mode ||
    !sameDays(previous.days, next.days) ||
    previous.nguSoundId !== next.nguSoundId ||
    previous.ngdSoundId !== next.ngdSoundId
  );
}

/** If an off alarm is edited (time, repeat, or sounds), turn it on. */
export async function enableIfAlarmEdited(previous: Alarm | undefined, next: Alarm): Promise<Alarm> {
  if (!previous || previous.enabled || !alarmUserFieldsChanged(previous, next)) {
    return next;
  }
  const enabled = { ...next, enabled: true };
  return enabled.mode === 'once' ? applyOnceBaseline(enabled) : enabled;
}

/** Once alarms compare against the price at the moment they are turned on or saved. */
export async function applyOnceBaseline(alarm: Alarm): Promise<Alarm> {
  if (alarm.mode !== 'once') {
    return alarm;
  }
  const price = await getCurrentBtcUsd();
  if (BtcAlarm.isAvailable) {
    await BtcAlarm.cachePrice(price.usd, price.at);
  }
  return { ...alarm, baselinePriceUsd: price.usd, baselineAt: price.at };
}
