# BTC Alarm Clock

Android alarm clock that wakes you with music based on whether Bitcoin went **up** or **down**.

- **Number Go Up** music if BTC/USD rose
- **Number Go Down** music otherwise (including equal or missing price)

Built by [RITREK](https://ritrek.com). Application ID: `com.ritrek.btcpricealarmclock`. Android only — iOS cannot run a reliable alarm clock like this.

This is **not** an Expo Go app. Alarms use a native Android module (`modules/btc-alarm`) so you need a development build (`expo run:android` or EAS).

## How it works

Alarms are stored as local **hour and minute**, not a UTC instant. “7:00” means 7:00 in whatever timezone the phone is in when it fires.

| Mode | When it rings | Price comparison |
| --- | --- | --- |
| Once | Next occurrence of that time | Live ticker vs price captured when you turn the alarm on / save it |
| Every day | Same time each day | Live ticker vs Kraken OHLC ~8 hours earlier |
| Custom days | Selected weekdays | Same as every day |

At fire time the native ringing service:

1. Wakes via `AlarmManager.setAlarmClock` (survives app kill, Doze, and a locked screen)
2. Fetches BTC/USD from [Kraken](https://kraken.com) (ticker for live; 15-minute OHLC for the 8-hour lookback)
3. Loops the matching sound on `STREAM_ALARM` (rings through silent / DND)
4. Optionally vibrates (Settings toggle, on by default)
5. Opens a full-screen ringing UI

**Stop** speaks the USD price. **Snooze** uses the duration from Settings and fetches mood again when it re-rings (it does not lock the previous up/down result).

Boot, timezone, and clock changes reschedule from device-protected storage so alarms still work after reboot, including before first unlock.

## Requirements

- macOS or Linux with [Android Studio](https://developer.android.com/studio)
- Android SDK 36, Build-Tools 36, JDK 17
- An emulator (API 26+) or a physical device with USB debugging
- Node.js matching the Expo SDK 53 toolchain

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools"
```

## Run locally

```bash
npm install
```

Start an emulator (recommended so you control which AVD):

```bash
emulator -avd Pixel_9_Pro_XL
```

Then in another terminal:

```bash
npm run android
```

That compiles native code, installs the APK, starts Metro, and launches the app. If no device is running, Expo may boot the first AVD it finds.

| Script | What it does |
| --- | --- |
| `npm run android` | Incremental native build + install (`expo run:android`) |
| `npm run clean` | Stop Gradle, wipe Expo/Metro/Kotlin build caches |
| `npm run rebuild` | `clean`, re-run Android prebuild (plugins, sounds, icons), then `android` |
| `npm run lint` | ESLint + TypeScript |
| `npm run build-licenses` | Regenerate in-app dependency license list (`licenses.json`) |

Use **`rebuild`** after Kotlin changes, icon/sound plugin copies, or when Metro incremental builds look stale. JS-only edits reload with Metro.

## Native module

`modules/btc-alarm` is a local Expo module (Kotlin). It owns:

- Exact alarm scheduling and cancel
- Foreground ringing service and alarm-stream playback
- Price fetch at fire time
- Direct Boot storage for alarms/settings
- Boot / timezone receivers

JS talks to it through `modules/btc-alarm/src`. Changing `.kt` files requires a native rebuild (`npm run android` or `npm run rebuild`), not a Metro reload.

## Price data

Live price: Kraken `Ticker` pair `XBTUSD`.

Historical (repeating alarms): Kraken `OHLC` with `interval=15` and `since` set to the 8-hour target minus one hour, then the closest candle close.

Shared in `utils/price.ts` (JS) and `modules/btc-alarm/.../PriceFetcher.kt` (native at ring time).

## Sounds

Bundled NGU/NGD recordings are public-domain / CC works. Attribution is in [LICENSES.md](LICENSES.md).

You can set app-wide defaults, override per alarm, or import a file from disk.

## Project layout

```
app/                 Screens (list, settings, sounds, ringing)
components/          Alarm cards, sheets, themed UI
context/             App state (alarms, settings)
modules/btc-alarm/   Native alarm clock + Kotlin price fetch
utils/               Schedule, format, JS price client, speech
assets/sounds/       Bundled NGU / NGD MP3s
```

## Store builds

```bash
npm run build:android:dev          # EAS development client
npm run build:android:apk          # sideloadable APK (no Play listing)
npm run build:android:preview      # Play internal / draft AAB
npm run build:android:production   # production AAB
npm run submit:android:preview     # upload latest preview AAB to Play internal (draft)
npm run submit:android:production  # upload latest production AAB to Play production (draft)
```

Profiles live in `eas.json`. Submit needs a Play Console app and a Google service account linked in EAS; skip it until those exist.

## Related

[RITREK](https://ritrek.com) also makes a [Timelock Recovery Android app](https://play.google.com/store/apps/details?id=com.ritrek.app) for pre-signed Bitcoin recovery plans.

The app source is proprietary (`UNLICENSED`). Bundled recordings keep the licenses listed in [LICENSES.md](LICENSES.md).
