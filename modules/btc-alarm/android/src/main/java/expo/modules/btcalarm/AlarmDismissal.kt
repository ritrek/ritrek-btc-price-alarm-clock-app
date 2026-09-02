package expo.modules.btcalarm

import android.content.Context

object AlarmDismissal {
  fun finish(context: Context, id: String, haltRinging: Boolean, speakPrice: Boolean = false) {
    val priceUsd = AlarmStore.getHandoff(context)?.takeIf { it.alarmId == id }?.currentPriceUsd
    if (haltRinging) {
      AlarmPlayer.stop()
    }
    AlarmScheduler.cancel(context, id)
    val alarm = AlarmStore.getAlarm(context, id)
    if (alarm != null) {
      val updated = alarm.copy(
        enabled = if (alarm.mode == "once") false else alarm.enabled,
        lockedMood = null,
        snoozeUntil = null,
      )
      AlarmStore.upsertAlarm(context, updated)
      if (updated.enabled) {
        AlarmScheduler.schedule(
          context,
          updated,
          AlarmScheduler.nextTriggerMillis(updated, System.currentTimeMillis() + 1000)
        )
      }
    }
    val handoff = AlarmStore.getHandoff(context)
    if (handoff?.alarmId == id) {
      AlarmStore.setHandoff(context, null)
    }
    AlarmEventBus.emit("onAlarmStopped", mapOf("alarmId" to id, "reason" to "stop"))
    if (!haltRinging) {
      return
    }
    if (speakPrice && priceUsd != null) {
      PriceSpeech.playOnStop(context, priceUsd) {
        AlarmRingingService.stop(context)
        PriceSpeech.release()
      }
    } else {
      PriceSpeech.cancel()
      AlarmRingingService.stop(context)
      PriceSpeech.release()
    }
  }
}
