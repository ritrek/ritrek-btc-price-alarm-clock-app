import * as Updates from 'expo-updates';

/**
 * Check and download on a direct open; apply only on the next direct open.
 * Never call this during an alarm-clock wake.
 */
export async function syncOtaUpdates(): Promise<void> {
  if (!Updates.isEnabled) {
    return;
  }
  try {
    if (Updates.isUpdatePending) {
      await Updates.reloadAsync();
      return;
    }
    const check = await Updates.checkForUpdateAsync();
    if (check.isAvailable) {
      await Updates.fetchUpdateAsync();
    }
  } catch {
    // OTA must not interfere with alarms or a normal launch.
  }
}
