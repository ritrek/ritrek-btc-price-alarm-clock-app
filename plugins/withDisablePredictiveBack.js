const { AndroidConfig, withAndroidManifest } = require('@expo/config-plugins');

/**
 * Android 13+ predictive back skips JS BackHandler and backgrounds the activity.
 * Keep the older back path so Expo Router can pop Settings / Licenses / modals.
 */
function withDisablePredictiveBack(config) {
  return withAndroidManifest(config, (config) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    application.$['android:enableOnBackInvokedCallback'] = 'false';
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
    activity.$['android:enableOnBackInvokedCallback'] = 'false';
    return config;
  });
}

module.exports = withDisablePredictiveBack;
