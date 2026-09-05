const { AndroidConfig, withAndroidManifest } = require('@expo/config-plugins');

/**
 * The UI is English-only. Keep layout LTR even when the device language is RTL.
 */
function withForceLtr(config) {
  return withAndroidManifest(config, (config) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    application.$['android:supportsRtl'] = 'false';
    application.$['android:layoutDirection'] = 'ltr';
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
    activity.$['android:layoutDirection'] = 'ltr';
    return config;
  });
}

module.exports = withForceLtr;
