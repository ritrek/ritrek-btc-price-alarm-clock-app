package expo.modules.btcalarm

import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import kotlin.math.abs

object PriceFetcher {
  private const val TICKER = "https://api.kraken.com/0/public/Ticker?pair=XBTUSD"
  private const val OHLC = "https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=15"
  private const val ATTEMPTS = 3
  private const val RETRY_DELAY_MS = 5_000L
  private const val TIMEOUT_MS = 10_000

  data class Quote(val usd: Double, val at: String)

  fun current(): Quote = withRetries {
    val json = getJson(TICKER)
    val usd = json.getJSONObject("result")
      .getJSONObject("XXBTZUSD")
      .getJSONArray("c")
      .getString(0)
      .toDouble()
    if (!usd.isFinite() || usd <= 0) {
      throw IllegalStateException("Invalid ticker price")
    }
    Quote(usd, java.time.Instant.now().toString())
  }

  fun hoursAgo(hours: Int = 8): Quote = withRetries {
    val target = System.currentTimeMillis() / 1000 - hours * 3600L
    val since = target - 3600L
    val json = getJson("$OHLC&since=$since")
    val candles = json.getJSONObject("result").getJSONArray("XXBTZUSD")
    var bestIndex = 0
    var bestDelta = Long.MAX_VALUE
    for (i in 0 until candles.length()) {
      val candle = candles.getJSONArray(i)
      val time = candle.getLong(0)
      val delta = abs(time - target)
      if (delta < bestDelta) {
        bestDelta = delta
        bestIndex = i
      }
    }
    val candle = candles.getJSONArray(bestIndex)
    val usd = candle.getString(4).toDouble()
    if (!usd.isFinite() || usd <= 0) {
      throw IllegalStateException("Invalid historical price")
    }
    val at = java.time.Instant.ofEpochSecond(candle.getLong(0)).toString()
    Quote(usd, at)
  }

  private fun <T> withRetries(block: () -> T): T {
    var lastError: Exception? = null
    for (attempt in 1..ATTEMPTS) {
      try {
        return block()
      } catch (error: Exception) {
        lastError = error
        if (attempt < ATTEMPTS) {
          Thread.sleep(RETRY_DELAY_MS)
        }
      }
    }
    throw lastError ?: IllegalStateException("Failed to fetch Bitcoin price")
  }

  private fun getJson(url: String): JSONObject {
    val connection = URL(url).openConnection() as HttpURLConnection
    connection.connectTimeout = TIMEOUT_MS
    connection.readTimeout = TIMEOUT_MS
    connection.requestMethod = "GET"
    connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
    try {
      val code = connection.responseCode
      if (code !in 200..299) {
        throw IllegalStateException("HTTP $code")
      }
      val body = connection.inputStream.bufferedReader().use { it.readText() }
      return JSONObject(body)
    } finally {
      connection.disconnect()
    }
  }
}
