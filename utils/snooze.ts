import { useEffect, useState } from 'react';

export function formatSnoozeCountdown(remainingMs: number): string {
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function useSnoozeRemaining(snoozeUntil: number | null | undefined): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (snoozeUntil == null || snoozeUntil <= Date.now()) {
      return;
    }
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [snoozeUntil]);

  if (snoozeUntil == null) {
    return null;
  }
  const remaining = snoozeUntil - now;
  return remaining > 0 ? remaining : null;
}
