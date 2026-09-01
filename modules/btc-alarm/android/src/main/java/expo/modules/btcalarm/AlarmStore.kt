package expo.modules.btcalarm

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

object AlarmStore {
  private const val PREFS = "btc_alarm_store"
  private const val KEY_ALARMS = "alarms"
  private const val KEY_SETTINGS = "settings"
  private const val KEY_HANDOFF = "handoff"
  private const val KEY_CACHED_PRICE = "cached_price_usd"
  private const val KEY_CACHED_PRICE_AT = "cached_price_at"
  private const val KEY_USER_SOUNDS = "user_sounds"

  private fun prefs(context: Context) =
    context.createDeviceProtectedStorageContext()
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun getAlarms(context: Context): List<AlarmRecord> {
    val raw = prefs(context).getString(KEY_ALARMS, "[]") ?: "[]"
    val array = JSONArray(raw)
    val list = mutableListOf<AlarmRecord>()
    for (i in 0 until array.length()) {
      list.add(AlarmRecord.fromJson(array.getJSONObject(i)))
    }
    return list
  }

  fun getAlarm(context: Context, id: String): AlarmRecord? =
    getAlarms(context).find { it.id == id }

  fun saveAlarms(context: Context, alarms: List<AlarmRecord>) {
    val array = JSONArray()
    alarms.forEach { array.put(it.toJson()) }
    prefs(context).edit().putString(KEY_ALARMS, array.toString()).apply()
  }

  fun upsertAlarm(context: Context, alarm: AlarmRecord) {
    val next = getAlarms(context).filter { it.id != alarm.id } + alarm
    saveAlarms(context, next)
  }

  fun deleteAlarm(context: Context, id: String) {
    saveAlarms(context, getAlarms(context).filter { it.id != id })
  }

  fun getSettings(context: Context): AppSettingsRecord {
    val raw = prefs(context).getString(KEY_SETTINGS, null)
    return if (raw.isNullOrBlank()) {
      AppSettingsRecord(DEFAULT_NGU_SOUND_ID, DEFAULT_NGD_SOUND_ID)
    } else {
      AppSettingsRecord.fromJson(JSONObject(raw))
    }
  }

  fun saveSettings(context: Context, settings: AppSettingsRecord) {
    prefs(context).edit().putString(KEY_SETTINGS, settings.toJson().toString()).apply()
  }

  fun getHandoff(context: Context): HandoffRecord? {
    val raw = prefs(context).getString(KEY_HANDOFF, null) ?: return null
    return HandoffRecord.fromJson(JSONObject(raw))
  }

  fun setHandoff(context: Context, handoff: HandoffRecord?) {
    val editor = prefs(context).edit()
    if (handoff == null) {
      editor.remove(KEY_HANDOFF)
    } else {
      editor.putString(KEY_HANDOFF, handoff.toJson().toString())
    }
    editor.apply()
  }

  fun cachePrice(context: Context, usd: Double, at: String) {
    prefs(context).edit()
      .putString(KEY_CACHED_PRICE, usd.toString())
      .putString(KEY_CACHED_PRICE_AT, at)
      .apply()
  }

  fun getCachedPrice(context: Context): Pair<Double, String>? {
    val usd = prefs(context).getString(KEY_CACHED_PRICE, null)?.toDoubleOrNull() ?: return null
    val at = prefs(context).getString(KEY_CACHED_PRICE_AT, null) ?: return null
    return usd to at
  }

  fun getUserSounds(context: Context): List<Map<String, String>> {
    val raw = prefs(context).getString(KEY_USER_SOUNDS, "[]") ?: "[]"
    val array = JSONArray(raw)
    val list = mutableListOf<Map<String, String>>()
    for (i in 0 until array.length()) {
      val obj = array.getJSONObject(i)
      list.add(
        mapOf(
          "id" to obj.getString("id"),
          "title" to obj.getString("title"),
          "fileName" to obj.getString("fileName"),
        )
      )
    }
    return list
  }

  fun saveUserSounds(context: Context, sounds: List<Map<String, String>>) {
    val array = JSONArray()
    sounds.forEach {
      array.put(
        JSONObject()
          .put("id", it["id"])
          .put("title", it["title"])
          .put("fileName", it["fileName"])
      )
    }
    prefs(context).edit().putString(KEY_USER_SOUNDS, array.toString()).apply()
  }

  fun detachUserSound(context: Context, soundId: String) {
    val settings = getSettings(context)
    val nextSettings = settings.copy(
      defaultNguSoundId = if (settings.defaultNguSoundId == soundId) DEFAULT_NGU_SOUND_ID else settings.defaultNguSoundId,
      defaultNgdSoundId = if (settings.defaultNgdSoundId == soundId) DEFAULT_NGD_SOUND_ID else settings.defaultNgdSoundId,
    )
    if (nextSettings != settings) {
      saveSettings(context, nextSettings)
    }
    val alarms = getAlarms(context)
    val nextAlarms = alarms.map { alarm ->
      alarm.copy(
        nguSoundId = if (alarm.nguSoundId == soundId) null else alarm.nguSoundId,
        ngdSoundId = if (alarm.ngdSoundId == soundId) null else alarm.ngdSoundId,
      )
    }
    if (nextAlarms != alarms) {
      saveAlarms(context, nextAlarms)
    }
  }

  fun userSoundsDir(context: Context) =
    context.createDeviceProtectedStorageContext().getDir("sounds", Context.MODE_PRIVATE)
}
