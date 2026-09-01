package expo.modules.btcalarm

import android.Manifest
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.util.UUID

class BtcAlarmModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BtcAlarm")
    Events("onAlarmFired", "onAlarmStopped")

    OnCreate {
      AlarmEventBus.emitter = { name, body ->
        try {
          sendEvent(name, body)
        } catch (_: Exception) {
        }
      }
    }

    OnDestroy {
      AlarmEventBus.emitter = null
    }

    AsyncFunction("getAlarms") {
      AlarmStore.getAlarms(context).map { it.toMap() }
    }

    AsyncFunction("saveAlarm") { map: Map<String, Any?> ->
      val incoming = AlarmRecord.fromMap(map)
      val existing = AlarmStore.getAlarm(context, incoming.id)
      val lockedMood = if (existing?.lockedMood != null && incoming.lockedMood == null) {
        existing.lockedMood
      } else {
        incoming.lockedMood
      }
      val createdAt = incoming.createdAt.takeIf { it > 0L }
        ?: existing?.createdAt?.takeIf { it > 0L }
        ?: createdAtFromId(incoming.id).takeIf { it > 0L }
        ?: System.currentTimeMillis()
      val alarm = incoming.copy(lockedMood = lockedMood, snoozeUntil = null, createdAt = createdAt)
      AlarmStore.upsertAlarm(context, alarm)
      AlarmScheduler.cancel(context, alarm.id)
      if (alarm.enabled) {
        AlarmScheduler.schedule(context, alarm)
      }
      alarm.toMap()
    }

    AsyncFunction("deleteAlarm") { id: String ->
      AlarmScheduler.cancel(context, id)
      AlarmStore.deleteAlarm(context, id)
    }

    AsyncFunction("getSettings") {
      AlarmStore.getSettings(context).toMap()
    }

    AsyncFunction("saveSettings") { map: Map<String, Any?> ->
      val settings = AppSettingsRecord.fromMap(map)
      AlarmStore.saveSettings(context, settings)
      settings.toMap()
    }

    AsyncFunction("getPendingHandoff") {
      AlarmStore.getHandoff(context)?.toMap()
    }

    AsyncFunction("clearPendingHandoff") {
      AlarmStore.setHandoff(context, null)
    }

    AsyncFunction("snooze") { id: String ->
      val alarm = AlarmStore.getAlarm(context, id) ?: return@AsyncFunction null
      AlarmRingingService.stop(context)
      AlarmPlayer.stop()
      val minutes = AlarmStore.getSettings(context).snoozeMinutes
      val trigger = System.currentTimeMillis() + minutes * 60_000L
      AlarmStore.upsertAlarm(context, alarm.copy(snoozeUntil = trigger))
      AlarmScheduler.schedule(context, alarm, trigger, isSnooze = true)
      AlarmEventBus.emit("onAlarmStopped", mapOf("alarmId" to id, "reason" to "snooze"))
      mapOf("ok" to true, "triggerAt" to trigger)
    }

    AsyncFunction("stopAlarm") { id: String ->
      val handoff = AlarmStore.getHandoff(context)
      AlarmDismissal.finish(context, id, haltRinging = true)
      handoff?.takeIf { it.alarmId == id }?.toMap()
    }

    AsyncFunction("getPermissions") {
      PermissionHelper.snapshot(context)
    }

    AsyncFunction("openExactAlarmSettings") {
      PermissionHelper.openExactAlarmSettings(context)
    }

    AsyncFunction("openFullScreenIntentSettings") {
      PermissionHelper.openFullScreenIntentSettings(context)
    }

    AsyncFunction("openBatteryOptimizationSettings") {
      PermissionHelper.openBatteryOptimizationSettings(context)
    }

    AsyncFunction("openNotificationSettings") {
      PermissionHelper.openAppNotificationSettings(context)
    }

    AsyncFunction("rescheduleAll") {
      AlarmScheduler.rescheduleAll(context)
    }

    AsyncFunction("getUserSounds") {
      AlarmStore.getUserSounds(context)
    }

    AsyncFunction("importUserSound") { sourcePath: String, title: String ->
      val dir = AlarmStore.userSoundsDir(context)
      val id = "user_${UUID.randomUUID().toString().replace("-", "")}"
      val ext = sourcePath.substringAfterLast('.', "mp3").lowercase().ifBlank { "mp3" }
      val fileName = "$id.$ext"
      val dest = File(dir, fileName)
      File(sourcePath.removePrefix("file://")).copyTo(dest, overwrite = true)
      val sounds = AlarmStore.getUserSounds(context).toMutableList()
      sounds.add(mapOf("id" to id, "title" to title, "fileName" to fileName))
      AlarmStore.saveUserSounds(context, sounds)
      mapOf("id" to id, "title" to title, "fileName" to fileName, "path" to dest.absolutePath)
    }

    AsyncFunction("deleteUserSound") { id: String ->
      val sounds = AlarmStore.getUserSounds(context)
      val match = sounds.find { it["id"] == id }
      if (match != null) {
        File(AlarmStore.userSoundsDir(context), match["fileName"] ?: "").delete()
      }
      AlarmStore.saveUserSounds(context, sounds.filter { it["id"] != id })
      AlarmStore.detachUserSound(context, id)
    }

    AsyncFunction("userSoundPath") { id: String ->
      val match = AlarmStore.getUserSounds(context).find { it["id"] == id } ?: return@AsyncFunction null
      File(AlarmStore.userSoundsDir(context), match["fileName"] ?: "").absolutePath
    }

    AsyncFunction("cachePrice") { usd: Double, at: String ->
      AlarmStore.cachePrice(context, usd, at)
    }

    AsyncFunction("nextTriggerAt") { id: String ->
      val alarm = AlarmStore.getAlarm(context, id) ?: return@AsyncFunction null
      AlarmScheduler.nextTriggerMillis(alarm)
    }

    Function("notificationPermission") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        Manifest.permission.POST_NOTIFICATIONS
      } else {
        null
      }
    }
  }

  private val context
    get() = requireNotNull(appContext.reactContext) { "React context is not available" }
}
