package expo.modules.btcalarm

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.net.Uri
import java.io.File

object AlarmPlayer {
  private var player: MediaPlayer? = null

  fun play(context: Context, soundId: String?) {
    stop()
    val uri = resolveUri(context, soundId) ?: return
    val mediaPlayer = MediaPlayer()
    mediaPlayer.setAudioAttributes(
      AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ALARM)
        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
        .build()
    )
    mediaPlayer.setDataSource(context, uri)
    mediaPlayer.isLooping = true
    mediaPlayer.setWakeMode(context, android.os.PowerManager.PARTIAL_WAKE_LOCK)
    mediaPlayer.prepare()
    val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    val max = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM)
    if (max > 0) {
      val current = audioManager.getStreamVolume(AudioManager.STREAM_ALARM)
      if (current == 0) {
        audioManager.setStreamVolume(AudioManager.STREAM_ALARM, (max * 0.8).toInt().coerceAtLeast(1), 0)
      }
    }
    mediaPlayer.start()
    player = mediaPlayer
  }

  fun stop() {
    AlarmVibrator.stop()
    try {
      player?.stop()
    } catch (_: Exception) {
    }
    try {
      player?.release()
    } catch (_: Exception) {
    }
    player = null
  }

  fun isPlaying(): Boolean = player?.isPlaying == true

  private fun resolveUri(context: Context, soundId: String?): Uri? {
    if (!soundId.isNullOrBlank()) {
      val user = AlarmStore.getUserSounds(context).find { it["id"] == soundId }
      if (user != null) {
        val file = File(AlarmStore.userSoundsDir(context), user["fileName"] ?: "")
        if (file.exists()) {
          return Uri.fromFile(file)
        }
      }
      val rawName = soundId.replace("-", "_")
      val rawId = context.resources.getIdentifier(rawName, "raw", context.packageName)
      if (rawId != 0) {
        return Uri.parse("android.resource://${context.packageName}/$rawId")
      }
    }
    val fallbackId = context.resources.getIdentifier("fallback_chime", "raw", context.packageName)
    if (fallbackId != 0) {
      return Uri.parse("android.resource://${context.packageName}/$fallbackId")
    }
    return null
  }
}
