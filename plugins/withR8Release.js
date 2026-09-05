const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo's default release ProGuard file includes `-dontoptimize`.
 * Use the optimize defaults so Play's obfuscation/optimization scores can pass.
 */
function withR8Release(config) {
  return withAppBuildGradle(config, (config) => {
    config.modResults.contents = config.modResults.contents.replace(
      'getDefaultProguardFile("proguard-android.txt")',
      'getDefaultProguardFile("proguard-android-optimize.txt")'
    );
    return config;
  });
}

module.exports = withR8Release;
