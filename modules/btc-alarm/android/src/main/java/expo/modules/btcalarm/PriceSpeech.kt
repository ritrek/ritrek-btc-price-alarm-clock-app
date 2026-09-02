package expo.modules.btcalarm

import android.content.Context
import android.media.AudioAttributes
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import java.io.File
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Pre-renders the stop-button price line to a WAV while the alarm music plays,
 * then plays it on STREAM_ALARM (same path as the ringtone, works over lock screen).
 * expo-speech is JS / STREAM_MUSIC and often never starts after a locked cold start.
 */
object PriceSpeech {
  private const val SYNTH_ID = "btc-price-synth"
  private const val LIVE_ID = "btc-price-live"
  private const val MAX_INIT_ATTEMPTS = 3
  private const val PLAY_TIMEOUT_MS = 15_000L
  private const val SYNTH_GRACE_MS = 2_000L

  private val main = Handler(Looper.getMainLooper())
  private val alarmAudio = AudioAttributes.Builder()
    .setUsage(AudioAttributes.USAGE_ALARM)
    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
    .build()

  private var appContext: Context? = null
  private var tts: TextToSpeech? = null
  private var ready = false
  private var initAttempts = 0
  private var pendingUsd: Double? = null
  @Volatile private var speechFile: File? = null
  @Volatile private var synthesizing = false

  fun warmup(context: Context) {
    appContext = context.applicationContext
    main.post { ensureEngine() }
  }

  fun prepare(context: Context, usd: Double) {
    appContext = context.applicationContext
    pendingUsd = usd
    speechFile = null
    main.post {
      ensureEngine()
      if (ready) {
        synthesize(usd)
      }
    }
  }

  fun playOnStop(context: Context, usd: Double, onFinished: () -> Unit) {
    val finished = AtomicBoolean(false)
    val timeout = Runnable {
      if (finished.compareAndSet(false, true)) {
        AlarmPlayer.stop()
        onFinished()
      }
    }
    val done = {
      if (finished.compareAndSet(false, true)) {
        main.removeCallbacks(timeout)
        onFinished()
      }
    }
    main.postDelayed(timeout, PLAY_TIMEOUT_MS)
    main.post {
      val file = speechFile
      if (file != null && file.exists() && file.length() > 0L) {
        AlarmPlayer.playOnce(context, Uri.fromFile(file), done)
        return@post
      }
      if (synthesizing) {
        main.postDelayed({
          val readyFile = speechFile
          if (readyFile != null && readyFile.exists() && readyFile.length() > 0L) {
            AlarmPlayer.playOnce(context, Uri.fromFile(readyFile), done)
          } else {
            speakLive(context, usd, done)
          }
        }, SYNTH_GRACE_MS)
        return@post
      }
      speakLive(context, usd, done)
    }
  }

  fun cancel() {
    pendingUsd = null
    speechFile = null
    synthesizing = false
    try {
      tts?.stop()
    } catch (_: Exception) {
    }
  }

  fun release() {
    cancel()
    val engine = tts
    tts = null
    ready = false
    initAttempts = 0
    appContext = null
    try {
      engine?.shutdown()
    } catch (_: Exception) {
    }
  }

  private fun ensureEngine() {
    if (tts != null || initAttempts >= MAX_INIT_ATTEMPTS) {
      return
    }
    val context = appContext ?: return
    initAttempts += 1
    tts = TextToSpeech(context) { status -> onEngineInit(status) }
  }

  private fun onEngineInit(status: Int) {
    val engine = tts ?: return
    if (status == TextToSpeech.SUCCESS) {
      ready = true
      try {
        engine.language = Locale.US
        engine.setAudioAttributes(alarmAudio)
        pickVoice(engine)
      } catch (_: Exception) {
      }
      engine.setOnUtteranceProgressListener(progressListener)
      pendingUsd?.let { synthesize(it) }
    } else if (initAttempts < MAX_INIT_ATTEMPTS) {
      try {
        engine.shutdown()
      } catch (_: Exception) {
      }
      tts = null
      main.postDelayed({ ensureEngine() }, 750L * initAttempts)
    }
  }

  private fun pickVoice(engine: TextToSpeech) {
    val voices = try {
      engine.voices
    } catch (_: Exception) {
      null
    } ?: return
    val en = voices.filter { it.locale?.language == "en" }
    val pool = en.filter { voice ->
      val label = "${voice.name} ${voice.locale}".lowercase()
      label.contains("female") || label.contains("samantha") || label.contains("zira")
    }.ifEmpty { en }
    val preferred = pool.find { it.locale?.country.equals("US", ignoreCase = true) } ?: pool.firstOrNull()
    if (preferred != null) {
      engine.voice = preferred
    }
  }

  private fun outputFile(context: Context): File {
    val storage = context.createDeviceProtectedStorageContext()
    return File(storage.cacheDir, "btc_alarm_price.wav")
  }

  private fun synthesize(usd: Double) {
    val engine = tts ?: return
    val context = appContext ?: return
    if (!ready) {
      return
    }
    val file = outputFile(context)
    try {
      if (file.exists()) {
        file.delete()
      }
    } catch (_: Exception) {
    }
    synthesizing = true
    val params = Bundle()
    val result = engine.synthesizeToFile(SpokenUsd.sentence(usd), params, file, SYNTH_ID)
    if (result != TextToSpeech.SUCCESS) {
      synthesizing = false
    }
  }

  private fun speakLive(context: Context, usd: Double, onFinished: () -> Unit) {
    val engine = tts
    if (!ready || engine == null) {
      ensureEngine()
      main.postDelayed({
        val retry = tts
        if (ready && retry != null) {
          speakLiveNow(retry, usd, onFinished)
        } else {
          onFinished()
        }
      }, 800)
      return
    }
    speakLiveNow(engine, usd, onFinished)
  }

  private fun speakLiveNow(engine: TextToSpeech, usd: Double, onFinished: () -> Unit) {
    liveFinished = onFinished
    try {
      engine.setAudioAttributes(alarmAudio)
      val params = Bundle()
      val result = engine.speak(SpokenUsd.sentence(usd), TextToSpeech.QUEUE_FLUSH, params, LIVE_ID)
      if (result != TextToSpeech.SUCCESS) {
        liveFinished = null
        onFinished()
      }
    } catch (_: Exception) {
      liveFinished = null
      onFinished()
    }
  }

  private var liveFinished: (() -> Unit)? = null

  private val progressListener = object : UtteranceProgressListener() {
    override fun onStart(utteranceId: String?) {}

    override fun onDone(utteranceId: String?) {
      main.post {
        when (utteranceId) {
          SYNTH_ID -> {
            synthesizing = false
            val file = appContext?.let { outputFile(it) }
            if (file != null && file.exists() && file.length() > 0L) {
              speechFile = file
            }
          }
          LIVE_ID -> {
            val cb = liveFinished
            liveFinished = null
            cb?.invoke()
          }
        }
      }
    }

    @Deprecated("Deprecated in Java")
    override fun onError(utteranceId: String?) {
      onError(utteranceId, -1)
    }

    override fun onError(utteranceId: String?, errorCode: Int) {
      main.post {
        when (utteranceId) {
          SYNTH_ID -> synthesizing = false
          LIVE_ID -> {
            val cb = liveFinished
            liveFinished = null
            cb?.invoke()
          }
        }
      }
    }
  }
}
