package expo.modules.btcalarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import java.time.Instant
import kotlin.concurrent.thread

class AlarmRingingService : Service() {
  private var wakeLock: PowerManager.WakeLock? = null
  private var ringGeneration = 0
  private var ringingAlarmId: String? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    ensureChannel()
    val pm = getSystemService(POWER_SERVICE) as PowerManager
    wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "btcpricealarm:ring").apply {
      setReferenceCounted(false)
      acquire(30 * 60 * 1000L)
    }
    PriceSpeech.warmup(this)
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val alarmId = intent?.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID)
    val isSnooze = intent?.getBooleanExtra(AlarmScheduler.EXTRA_IS_SNOOZE, false) ?: false
    if (alarmId == null) {
      stopSelf()
      return START_NOT_STICKY
    }

    val alarm = AlarmStore.getAlarm(this, alarmId)
    val previousId = ringingAlarmId
    val previous = previousId?.let { AlarmStore.getAlarm(this, it) }
    val keepCurrent =
      previousId != null &&
        previousId != alarmId &&
        !isSnooze &&
        alarm != null &&
        previous != null &&
        previous.hour == alarm.hour &&
        previous.minute == alarm.minute &&
        alarm.createdAt < previous.createdAt

    val notifyAlarmId = if (keepCurrent) previousId!! else alarmId
    val notification = buildNotification(notifyAlarmId, if (keepCurrent) "BTC Price Alarm" else "Checking Bitcoin price…")
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }

    if (keepCurrent) {
      return START_STICKY
    }

    if (alarm == null || (!alarm.enabled && !isSnooze)) {
      if (ringingAlarmId == null) {
        stopSelf()
      }
      return START_NOT_STICKY
    }

    if (alarm.snoozeUntil != null) {
      AlarmStore.upsertAlarm(this, alarm.copy(snoozeUntil = null))
    }

    val thisGeneration = ++ringGeneration
    if (previousId != null && previousId != alarmId) {
      AlarmDismissal.finish(this, previousId, haltRinging = false)
    }
    ringingAlarmId = alarmId

    if (!isSnooze && alarm.mode != "once") {
      AlarmScheduler.schedule(this, alarm, AlarmScheduler.nextTriggerMillis(alarm, System.currentTimeMillis() + 1000))
    }

    thread(name = "btc-alarm-price") {
      try {
        val result = resolveMood(this, alarm)
        val settings = AlarmStore.getSettings(this)
        val soundId = if (result.mood == "ngu") {
          alarm.nguSoundId ?: settings.defaultNguSoundId
        } else {
          alarm.ngdSoundId ?: settings.defaultNgdSoundId
        }
        val handoff = HandoffRecord(
          alarmId = alarm.id,
          mood = result.mood,
          currentPriceUsd = result.current,
          comparePriceUsd = result.compare,
          usedCachedPrice = result.usedCache,
          isSnooze = isSnooze,
          startedAt = Instant.now().toString(),
        )
        if (thisGeneration != ringGeneration) {
          return@thread
        }
        AlarmStore.setHandoff(this, handoff)
        result.current?.let { PriceSpeech.prepare(this, it) }
        startRinging(soundId, settings.vibrationEnabled)
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(NOTIFICATION_ID, buildNotification(alarm.id, if (result.mood == "ngu") "Bitcoin is up" else "Bitcoin is down"))
        launchRingingUi(alarm.id)
        AlarmEventBus.emit("onAlarmFired", handoff.toMap())
      } catch (_: Exception) {
        if (thisGeneration != ringGeneration) {
          return@thread
        }
        val settings = AlarmStore.getSettings(this)
        val soundId = alarm.ngdSoundId ?: settings.defaultNgdSoundId
        val handoff = HandoffRecord(
          alarmId = alarm.id,
          mood = "ngd",
          currentPriceUsd = null,
          comparePriceUsd = null,
          usedCachedPrice = true,
          isSnooze = isSnooze,
          startedAt = Instant.now().toString(),
        )
        AlarmStore.setHandoff(this, handoff)
        startRinging(soundId, settings.vibrationEnabled)
        launchRingingUi(alarm.id)
        AlarmEventBus.emit("onAlarmFired", handoff.toMap())
      }
    }

    return START_STICKY
  }

  override fun onDestroy() {
    ringingAlarmId = null
    AlarmPlayer.stop()
    try {
      if (wakeLock?.isHeld == true) {
        wakeLock?.release()
      }
    } catch (_: Exception) {
    }
    super.onDestroy()
  }

  private fun startRinging(soundId: String?, vibrate: Boolean) {
    AlarmPlayer.play(this, soundId)
    if (vibrate) {
      AlarmVibrator.start(this)
    }
  }

  private fun launchRingingUi(alarmId: String) {
    val launch = packageManager.getLaunchIntentForPackage(packageName) ?: return
    launch.addFlags(
      Intent.FLAG_ACTIVITY_NEW_TASK or
        Intent.FLAG_ACTIVITY_CLEAR_TOP or
        Intent.FLAG_ACTIVITY_SINGLE_TOP
    )
    launch.data = android.net.Uri.parse("btcpricealarmclock://ringing/$alarmId")
    try {
      startActivity(launch)
    } catch (_: Exception) {
    }
  }

  private fun buildNotification(alarmId: String, text: String): Notification {
    val launch = packageManager.getLaunchIntentForPackage(packageName) ?: Intent()
    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    launch.data = android.net.Uri.parse("btcpricealarmclock://ringing/$alarmId")
    val content = PendingIntent.getActivity(
      this,
      alarmId.hashCode(),
      launch,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(smallIconRes())
      .setContentTitle("BTC Price Alarm")
      .setContentText(text)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setContentIntent(content)
      .setFullScreenIntent(content, true)
      .setSound(null)
      .build()
  }

  private fun smallIconRes(): Int {
    val resId = resources.getIdentifier("notification_icon", "drawable", packageName)
    return if (resId != 0) resId else android.R.drawable.ic_lock_idle_alarm
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val channel = NotificationChannel(
      CHANNEL_ID,
      "Alarms",
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      description = "Bitcoin price alarm clock"
      setSound(null, null)
      enableVibration(false)
      setBypassDnd(true)
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
    }
    val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    nm.deleteNotificationChannel("btc_alarms")
    nm.createNotificationChannel(channel)
  }

  companion object {
    const val CHANNEL_ID = "btc_alarms_v2"
    const val NOTIFICATION_ID = 71001

    fun stop(context: Context) {
      context.stopService(Intent(context, AlarmRingingService::class.java))
    }
  }
}

private data class MoodResult(
  val mood: String,
  val current: Double?,
  val compare: Double?,
  val usedCache: Boolean,
)

private fun resolveMood(context: Context, alarm: AlarmRecord): MoodResult {
  var usedCache = false
  val live = try {
    val quote = PriceFetcher.current()
    AlarmStore.cachePrice(context, quote.usd, quote.at)
    quote.usd
  } catch (_: Exception) {
    usedCache = true
    null
  }
  val current = live ?: AlarmStore.getCachedPrice(context)?.first

  val compare = if (alarm.mode == "once") {
    alarm.baselinePriceUsd
  } else {
    try {
      PriceFetcher.hoursAgo(8).usd
    } catch (_: Exception) {
      usedCache = true
      alarm.baselinePriceUsd
    }
  }

  val mood = if (live != null && compare != null && live > compare) "ngu" else "ngd"
  return MoodResult(mood, current, compare, usedCache)
}
