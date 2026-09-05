const {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PERMISSIONS = [
  'android.permission.INTERNET',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.WAKE_LOCK',
  'android.permission.VIBRATE',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
  'android.permission.USE_EXACT_ALARM',
  'android.permission.SCHEDULE_EXACT_ALARM',
  'android.permission.USE_FULL_SCREEN_INTENT',
  'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
  'android.permission.MODIFY_AUDIO_SETTINGS',
];

function ensureToolingNs(manifest) {
  if (!manifest.$) {
    manifest.$ = {};
  }
  if (!manifest.$['xmlns:tools']) {
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
  }
}

function upsertPermission(manifest, name) {
  if (!manifest['uses-permission']) {
    manifest['uses-permission'] = [];
  }
  const exists = manifest['uses-permission'].some(
    (entry) => entry.$?.['android:name'] === name
  );
  if (!exists) {
    manifest['uses-permission'].push({ $: { 'android:name': name } });
  }
}

function withBtcAlarmManifest(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    ensureToolingNs(manifest);
    for (const permission of PERMISSIONS) {
      upsertPermission(manifest, permission);
    }

    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    if (!app.service) {
      app.service = [];
    }
    if (!app.receiver) {
      app.receiver = [];
    }

    const hasService = app.service.some(
      (service) => service.$?.['android:name'] === 'expo.modules.btcalarm.AlarmRingingService'
    );
    if (!hasService) {
      app.service.push({
        $: {
          'android:name': 'expo.modules.btcalarm.AlarmRingingService',
          'android:exported': 'false',
          'android:foregroundServiceType': 'mediaPlayback',
          'android:directBootAware': 'true',
        },
      });
    }

    const hasAlarmReceiver = app.receiver.some(
      (receiver) => receiver.$?.['android:name'] === 'expo.modules.btcalarm.AlarmReceiver'
    );
    if (!hasAlarmReceiver) {
      app.receiver.push({
        $: {
          'android:name': 'expo.modules.btcalarm.AlarmReceiver',
          'android:exported': 'false',
          'android:directBootAware': 'true',
        },
      });
    }

    const hasBootReceiver = app.receiver.some(
      (receiver) => receiver.$?.['android:name'] === 'expo.modules.btcalarm.BootReceiver'
    );
    if (!hasBootReceiver) {
      app.receiver.push({
        $: {
          'android:name': 'expo.modules.btcalarm.BootReceiver',
          'android:exported': 'true',
          'android:directBootAware': 'true',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } },
              { $: { 'android:name': 'android.intent.action.LOCKED_BOOT_COMPLETED' } },
              { $: { 'android:name': 'android.intent.action.MY_PACKAGE_REPLACED' } },
              { $: { 'android:name': 'android.intent.action.QUICKBOOT_POWERON' } },
            ],
          },
        ],
      });
    }

    const hasTimeReceiver = app.receiver.some(
      (receiver) => receiver.$?.['android:name'] === 'expo.modules.btcalarm.TimeChangeReceiver'
    );
    if (!hasTimeReceiver) {
      app.receiver.push({
        $: {
          'android:name': 'expo.modules.btcalarm.TimeChangeReceiver',
          'android:exported': 'true',
          'android:directBootAware': 'true',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.intent.action.TIMEZONE_CHANGED' } },
              { $: { 'android:name': 'android.intent.action.TIME_SET' } },
            ],
          },
        ],
      });
    }

    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
    activity.$['android:showWhenLocked'] = 'true';
    activity.$['android:turnScreenOn'] = 'true';
    activity.$['android:directBootAware'] = 'true';
    if (!activity.$['android:launchMode']) {
      activity.$['android:launchMode'] = 'singleTask';
    }

    return config;
  });
}

function withBtcAlarmSounds(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const rawDir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/res/raw'
      );
      fs.mkdirSync(rawDir, { recursive: true });
      const soundsRoot = path.join(config.modRequest.projectRoot, 'assets/sounds');
      if (fs.existsSync(soundsRoot)) {
        for (const mood of ['ngu', 'ngd']) {
          const dir = path.join(soundsRoot, mood);
          if (!fs.existsSync(dir)) {
            continue;
          }
          for (const file of fs.readdirSync(dir)) {
            if (!file.endsWith('.mp3')) {
              continue;
            }
            const rawName = `${mood}_${file}`.replace(/-/g, '_');
            fs.copyFileSync(path.join(dir, file), path.join(rawDir, rawName));
          }
        }
        const fallback = path.join(soundsRoot, 'fallback_chime.mp3');
        if (fs.existsSync(fallback)) {
          fs.copyFileSync(fallback, path.join(rawDir, 'fallback_chime.mp3'));
        }
      }
      fs.writeFileSync(
        path.join(rawDir, 'keep.xml'),
        [
          '<?xml version="1.0" encoding="utf-8"?>',
          '<resources xmlns:tools="http://schemas.android.com/tools"',
          '    tools:keep="@raw/*" />',
          '',
        ].join('\n')
      );
      return config;
    },
  ]);
}

function withBtcAlarm(config) {
  config = withBtcAlarmManifest(config);
  config = withBtcAlarmSounds(config);
  return config;
}

module.exports = withBtcAlarm;
