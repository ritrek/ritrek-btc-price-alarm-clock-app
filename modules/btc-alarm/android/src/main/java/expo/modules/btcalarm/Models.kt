package expo.modules.btcalarm

import org.json.JSONArray
import org.json.JSONObject

private fun JSONObject.strOrNull(key: String): String? {
  if (!has(key) || isNull(key)) {
    return null
  }
  val value = optString(key)
  return value.takeIf { it.isNotBlank() && it != "null" }
}

private fun JSONObject.longOrNull(key: String): Long? {
  if (!has(key) || isNull(key)) {
    return null
  }
  val value = optLong(key, 0L)
  return value.takeIf { it > 0L }
}

private fun normalizeMode(rawMode: String, days: List<Int>): String {
  if (rawMode != "off") {
    return rawMode
  }
  return if (days.isNotEmpty()) "custom" else "once"
}

private fun JSONObject.parseEnabled(rawMode: String): Boolean {
  return if (has("enabled") && !isNull("enabled")) {
    optBoolean("enabled")
  } else {
    rawMode != "off"
  }
}

private fun parseEnabled(map: Map<String, Any?>, rawMode: String): Boolean {
  return when (val raw = map["enabled"]) {
    is Boolean -> raw
    is Number -> raw.toInt() != 0
    else -> rawMode != "off"
  }
}

internal const val DEFAULT_NGU_SOUND_ID = "ngu_offenbach_cancan"
internal const val DEFAULT_NGD_SOUND_ID = "ngd_chopin_funeral_march"

internal fun migrateSoundId(id: String?): String? {
  if (id == null) {
    return null
  }
  return when {
    id.startsWith("happy_") -> "ngu_" + id.removePrefix("happy_")
    id.startsWith("sad_") -> "ngd_" + id.removePrefix("sad_")
    else -> id
  }
}

private fun migrateMood(value: String?): String? =
  when (value) {
    "happy" -> "ngu"
    "sad" -> "ngd"
    else -> value
  }

private fun JSONObject.soundId(newKey: String, oldKey: String): String? =
  migrateSoundId(strOrNull(newKey) ?: strOrNull(oldKey))

private fun Map<String, Any?>.soundId(newKey: String, oldKey: String): String? =
  migrateSoundId((this[newKey] as? String) ?: (this[oldKey] as? String))

private fun JSONObject.parseCreatedAt(id: String): Long {
  if (has("createdAt") && !isNull("createdAt")) {
    val value = optLong("createdAt", 0L)
    if (value > 0L) {
      return value
    }
  }
  return createdAtFromId(id)
}

private fun Map<String, Any?>.parseCreatedAt(id: String): Long {
  val value = (this["createdAt"] as? Number)?.toLong() ?: 0L
  return if (value > 0L) value else createdAtFromId(id)
}

internal fun createdAtFromId(id: String): Long {
  val parts = id.split("_")
  if (parts.size >= 2) {
    try {
      val parsed = parts[1].toLong(36)
      if (parsed > 0L) {
        return parsed
      }
    } catch (_: Exception) {
    }
  }
  return 0L
}

data class AlarmRecord(
  val id: String,
  val hour: Int,
  val minute: Int,
  val mode: String,
  val enabled: Boolean,
  val days: List<Int>,
  val snoozeMinutes: Int,
  val nguSoundId: String?,
  val ngdSoundId: String?,
  val baselinePriceUsd: Double?,
  val baselineAt: String?,
  val lockedMood: String? = null,
  val snoozeUntil: Long? = null,
  val createdAt: Long = 0L,
) {
  fun toJson(): JSONObject {
    val json = JSONObject()
    json.put("id", id)
    json.put("hour", hour)
    json.put("minute", minute)
    json.put("mode", mode)
    json.put("enabled", enabled)
    json.put("days", JSONArray(days))
    json.put("snoozeMinutes", snoozeMinutes)
    json.put("nguSoundId", nguSoundId ?: JSONObject.NULL)
    json.put("ngdSoundId", ngdSoundId ?: JSONObject.NULL)
    if (baselinePriceUsd == null) json.put("baselinePriceUsd", JSONObject.NULL) else json.put("baselinePriceUsd", baselinePriceUsd)
    json.put("baselineAt", baselineAt ?: JSONObject.NULL)
    json.put("lockedMood", lockedMood ?: JSONObject.NULL)
    if (snoozeUntil == null) json.put("snoozeUntil", JSONObject.NULL) else json.put("snoozeUntil", snoozeUntil)
    json.put("createdAt", createdAt)
    return json
  }

  fun toMap(): Map<String, Any?> = mapOf(
    "id" to id,
    "hour" to hour,
    "minute" to minute,
    "mode" to mode,
    "enabled" to enabled,
    "days" to days,
    "snoozeMinutes" to snoozeMinutes,
    "nguSoundId" to nguSoundId,
    "ngdSoundId" to ngdSoundId,
    "baselinePriceUsd" to baselinePriceUsd,
    "baselineAt" to baselineAt,
    "lockedMood" to lockedMood,
    "snoozeUntil" to snoozeUntil,
    "createdAt" to createdAt,
  )

  companion object {
    fun fromJson(json: JSONObject): AlarmRecord {
      val daysJson = json.optJSONArray("days") ?: JSONArray()
      val days = mutableListOf<Int>()
      for (i in 0 until daysJson.length()) {
        days.add(daysJson.getInt(i))
      }
      val rawMode = json.optString("mode", "once")
      return AlarmRecord(
        id = json.getString("id"),
        hour = json.getInt("hour"),
        minute = json.getInt("minute"),
        mode = normalizeMode(rawMode, days),
        enabled = json.parseEnabled(rawMode),
        days = days,
        snoozeMinutes = json.optInt("snoozeMinutes", 5),
        nguSoundId = json.soundId("nguSoundId", "happySoundId"),
        ngdSoundId = json.soundId("ngdSoundId", "sadSoundId"),
        baselinePriceUsd = if (!json.has("baselinePriceUsd") || json.isNull("baselinePriceUsd")) null else json.optDouble("baselinePriceUsd"),
        baselineAt = json.strOrNull("baselineAt"),
        lockedMood = migrateMood(json.strOrNull("lockedMood")),
        snoozeUntil = json.longOrNull("snoozeUntil"),
        createdAt = json.parseCreatedAt(json.getString("id")),
      )
    }

    fun fromMap(map: Map<String, Any?>): AlarmRecord {
      val daysRaw = map["days"]
      val days = when (daysRaw) {
        is List<*> -> daysRaw.map { (it as Number).toInt() }
        else -> emptyList()
      }
      val rawMode = map["mode"] as? String ?: "once"
      return AlarmRecord(
        id = map["id"] as String,
        hour = (map["hour"] as Number).toInt(),
        minute = (map["minute"] as Number).toInt(),
        mode = normalizeMode(rawMode, days),
        enabled = parseEnabled(map, rawMode),
        days = days,
        snoozeMinutes = (map["snoozeMinutes"] as? Number)?.toInt() ?: 5,
        nguSoundId = map.soundId("nguSoundId", "happySoundId"),
        ngdSoundId = map.soundId("ngdSoundId", "sadSoundId"),
        baselinePriceUsd = (map["baselinePriceUsd"] as? Number)?.toDouble(),
        baselineAt = map["baselineAt"] as? String,
        lockedMood = migrateMood(map["lockedMood"] as? String),
        snoozeUntil = (map["snoozeUntil"] as? Number)?.toLong()?.takeIf { it > 0L },
        createdAt = map.parseCreatedAt(map["id"] as String),
      )
    }
  }
}

data class AppSettingsRecord(
  val defaultNguSoundId: String,
  val defaultNgdSoundId: String,
  val snoozeMinutes: Int = 5,
  val vibrationEnabled: Boolean = true,
  val comparisonLookbackHours: Int = 8,
) {
  fun toJson(): JSONObject {
    val json = JSONObject()
    json.put("defaultNguSoundId", defaultNguSoundId)
    json.put("defaultNgdSoundId", defaultNgdSoundId)
    json.put("snoozeMinutes", snoozeMinutes)
    json.put("vibrationEnabled", vibrationEnabled)
    json.put("comparisonLookbackHours", comparisonLookbackHours)
    return json
  }

  fun toMap(): Map<String, Any?> = mapOf(
    "defaultNguSoundId" to defaultNguSoundId,
    "defaultNgdSoundId" to defaultNgdSoundId,
    "snoozeMinutes" to snoozeMinutes,
    "vibrationEnabled" to vibrationEnabled,
    "comparisonLookbackHours" to comparisonLookbackHours,
  )

  companion object {
    private val SNOOZE_OPTIONS = setOf(1, 2, 3, 5, 10, 15, 20, 30)

    fun normalizeSnooze(minutes: Int): Int =
      if (minutes in SNOOZE_OPTIONS) minutes else 5

    fun normalizeLookback(hours: Int): Int =
      if (hours in 4..10) hours else 8

    private fun parseVibrationEnabled(raw: Any?): Boolean =
      when (raw) {
        is Boolean -> raw
        is Number -> raw.toInt() != 0
        else -> true
      }

    fun fromJson(json: JSONObject) = AppSettingsRecord(
      defaultNguSoundId = json.soundId("defaultNguSoundId", "defaultHappySoundId") ?: DEFAULT_NGU_SOUND_ID,
      defaultNgdSoundId = json.soundId("defaultNgdSoundId", "defaultSadSoundId") ?: DEFAULT_NGD_SOUND_ID,
      snoozeMinutes = normalizeSnooze(json.optInt("snoozeMinutes", 5)),
      vibrationEnabled = if (!json.has("vibrationEnabled") || json.isNull("vibrationEnabled")) {
        true
      } else {
        json.optBoolean("vibrationEnabled", true)
      },
      comparisonLookbackHours = normalizeLookback(json.optInt("comparisonLookbackHours", 8)),
    )

    fun fromMap(map: Map<String, Any?>) = AppSettingsRecord(
      defaultNguSoundId = map.soundId("defaultNguSoundId", "defaultHappySoundId") ?: DEFAULT_NGU_SOUND_ID,
      defaultNgdSoundId = map.soundId("defaultNgdSoundId", "defaultSadSoundId") ?: DEFAULT_NGD_SOUND_ID,
      snoozeMinutes = normalizeSnooze((map["snoozeMinutes"] as? Number)?.toInt() ?: 5),
      vibrationEnabled = parseVibrationEnabled(map["vibrationEnabled"]),
      comparisonLookbackHours = normalizeLookback((map["comparisonLookbackHours"] as? Number)?.toInt() ?: 8),
    )
  }
}

data class HandoffRecord(
  val alarmId: String,
  val mood: String,
  val currentPriceUsd: Double?,
  val comparePriceUsd: Double?,
  val usedCachedPrice: Boolean,
  val isSnooze: Boolean,
  val startedAt: String,
) {
  fun toJson(): JSONObject {
    val json = JSONObject()
    json.put("alarmId", alarmId)
    json.put("mood", mood)
    if (currentPriceUsd == null) json.put("currentPriceUsd", JSONObject.NULL) else json.put("currentPriceUsd", currentPriceUsd)
    if (comparePriceUsd == null) json.put("comparePriceUsd", JSONObject.NULL) else json.put("comparePriceUsd", comparePriceUsd)
    json.put("usedCachedPrice", usedCachedPrice)
    json.put("isSnooze", isSnooze)
    json.put("startedAt", startedAt)
    return json
  }

  fun toMap(): Map<String, Any?> = mapOf(
    "alarmId" to alarmId,
    "mood" to mood,
    "currentPriceUsd" to currentPriceUsd,
    "comparePriceUsd" to comparePriceUsd,
    "usedCachedPrice" to usedCachedPrice,
    "isSnooze" to isSnooze,
    "startedAt" to startedAt,
  )

  companion object {
    fun fromJson(json: JSONObject) = HandoffRecord(
      alarmId = json.getString("alarmId"),
      mood = migrateMood(json.getString("mood")) ?: json.getString("mood"),
      currentPriceUsd = if (json.isNull("currentPriceUsd")) null else json.optDouble("currentPriceUsd"),
      comparePriceUsd = if (json.isNull("comparePriceUsd")) null else json.optDouble("comparePriceUsd"),
      usedCachedPrice = json.optBoolean("usedCachedPrice", false),
      isSnooze = json.optBoolean("isSnooze", false),
      startedAt = json.optString("startedAt"),
    )
  }
}
