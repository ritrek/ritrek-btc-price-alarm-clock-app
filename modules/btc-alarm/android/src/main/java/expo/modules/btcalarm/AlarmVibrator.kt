package expo.modules.btcalarm

import android.content.Context
import android.media.AudioAttributes
import android.os.Build
import android.os.VibrationAttributes
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

object AlarmVibrator {
  private val PATTERN = longArrayOf(0, 600, 400)
  private var vibrator: Vibrator? = null

  fun start(context: Context) {
    stop()
    val next = vibrator(context) ?: return
    if (!next.hasVibrator()) {
      return
    }
    val effect = VibrationEffect.createWaveform(PATTERN, 0)
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        next.vibrate(
          effect,
          VibrationAttributes.Builder()
            .setUsage(VibrationAttributes.USAGE_ALARM)
            .build(),
        )
      } else {
        @Suppress("DEPRECATION")
        next.vibrate(
          effect,
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build(),
        )
      }
      vibrator = next
    } catch (_: Exception) {
    }
  }

  fun stop() {
    try {
      vibrator?.cancel()
    } catch (_: Exception) {
    }
    vibrator = null
  }

  private fun vibrator(context: Context): Vibrator? {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      context.getSystemService(VibratorManager::class.java)?.defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }
  }
}
