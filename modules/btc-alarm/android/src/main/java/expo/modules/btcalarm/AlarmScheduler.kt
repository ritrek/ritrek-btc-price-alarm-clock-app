package expo.modules.btcalarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import java.util.Calendar

object AlarmScheduler {
  const val ACTION_FIRE = "expo.modules.btcalarm.ALARM_FIRE"
  const val EXTRA_ALARM_ID = "alarmId"
  const val EXTRA_IS_SNOOZE = "isSnooze"

  fun schedule(context: Context, alarm: AlarmRecord, triggerAtMillis: Long? = null, isSnooze: Boolean = false) {
    val base = triggerAtMillis ?: nextTriggerMillis(alarm) ?: return
    val trigger = if (isSnooze) base else base + sameSlotOffsetMs(context, alarm)
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val clockInfo = AlarmManager.AlarmClockInfo(trigger, showPendingIntent(context, alarm.id))
    alarmManager.setAlarmClock(clockInfo, firePendingIntent(context, alarm.id, isSnooze))
  }

  fun cancel(context: Context, alarmId: String) {
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    alarmManager.cancel(firePendingIntent(context, alarmId, false))
    alarmManager.cancel(firePendingIntent(context, alarmId, true))
  }

  fun rescheduleAll(context: Context) {
    val now = System.currentTimeMillis()
    AlarmStore.getAlarms(context).forEach { alarm ->
      cancel(context, alarm.id)
      val snoozeUntil = alarm.snoozeUntil
      val snoozeActive = alarm.enabled && snoozeUntil != null && snoozeUntil > now
      if (alarm.enabled) {
        schedule(context, alarm)
      }
      if (snoozeActive) {
        schedule(context, alarm, snoozeUntil, isSnooze = true)
      } else if (alarm.snoozeUntil != null) {
        AlarmStore.upsertAlarm(context, alarm.copy(snoozeUntil = null))
      }
    }
  }

  fun nextTriggerMillis(alarm: AlarmRecord, fromMillis: Long = System.currentTimeMillis()): Long? {
    if (!alarm.enabled) {
      return null
    }
    val cal = Calendar.getInstance()
    cal.timeInMillis = fromMillis
    cal.set(Calendar.SECOND, 0)
    cal.set(Calendar.MILLISECOND, 0)
    cal.set(Calendar.HOUR_OF_DAY, alarm.hour)
    cal.set(Calendar.MINUTE, alarm.minute)

    if (alarm.mode == "once") {
      if (cal.timeInMillis <= fromMillis) {
        cal.add(Calendar.DAY_OF_YEAR, 1)
      }
      return cal.timeInMillis
    }

    for (i in 0..8) {
      val ourDay = cal.get(Calendar.DAY_OF_WEEK) - 1
      val matches = alarm.mode == "daily" || alarm.days.contains(ourDay)
      if (matches && cal.timeInMillis > fromMillis) {
        return cal.timeInMillis
      }
      cal.add(Calendar.DAY_OF_YEAR, 1)
    }
    return null
  }

  private fun sameSlotOffsetMs(context: Context, alarm: AlarmRecord): Long {
    return AlarmStore.getAlarms(context).count { other ->
      other.id != alarm.id &&
        other.enabled &&
        other.hour == alarm.hour &&
        other.minute == alarm.minute &&
        other.createdAt < alarm.createdAt
    }.toLong()
  }

  private fun firePendingIntent(context: Context, alarmId: String, isSnooze: Boolean): PendingIntent {
    val intent = Intent(context, AlarmReceiver::class.java).apply {
      action = ACTION_FIRE
      setPackage(context.packageName)
      putExtra(EXTRA_ALARM_ID, alarmId)
      putExtra(EXTRA_IS_SNOOZE, isSnooze)
      data = android.net.Uri.parse("btc-alarm://$alarmId/${if (isSnooze) "snooze" else "fire"}")
    }
    val requestCode = requestCode(alarmId, isSnooze)
    return PendingIntent.getBroadcast(
      context,
      requestCode,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or pendingFlags()
    )
  }

  private fun showPendingIntent(context: Context, alarmId: String): PendingIntent {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
      ?: Intent().setClassName(context.packageName, "${context.packageName}.MainActivity")
    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    launch.data = android.net.Uri.parse("btcpricealarmclock://ringing/$alarmId")
    return PendingIntent.getActivity(
      context,
      alarmId.hashCode(),
      launch,
      PendingIntent.FLAG_UPDATE_CURRENT or pendingFlags()
    )
  }

  private fun requestCode(alarmId: String, isSnooze: Boolean): Int {
    val seed = if (isSnooze) "$alarmId-snooze" else alarmId
    return seed.hashCode()
  }

  private fun pendingFlags(): Int {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      PendingIntent.FLAG_IMMUTABLE
    } else {
      0
    }
  }
}
