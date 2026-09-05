const { withMainActivity } = require('@expo/config-plugins');

const MARKER = 'configuration.fontScale = 1f';

const KT_IMPORTS = ['import android.content.Context', 'import android.content.res.Configuration'];

const KT_METHODS = `
  override fun attachBaseContext(newBase: Context) {
    val configuration = Configuration(newBase.resources.configuration)
    configuration.fontScale = 1f
    super.attachBaseContext(newBase.createConfigurationContext(configuration))
  }

  override fun applyOverrideConfiguration(overrideConfiguration: Configuration?) {
    if (overrideConfiguration != null) {
      overrideConfiguration.fontScale = 1f
    }
    super.applyOverrideConfiguration(overrideConfiguration)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    newConfig.fontScale = 1f
    super.onConfigurationChanged(newConfig)
  }
`;

const JAVA_METHODS = `
  @Override
  protected void attachBaseContext(Context newBase) {
    Configuration configuration = new Configuration(newBase.getResources().getConfiguration());
    configuration.fontScale = 1f;
    super.attachBaseContext(newBase.createConfigurationContext(configuration));
  }

  @Override
  public void applyOverrideConfiguration(Configuration overrideConfiguration) {
    if (overrideConfiguration != null) {
      overrideConfiguration.fontScale = 1f;
    }
    super.applyOverrideConfiguration(overrideConfiguration);
  }

  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    newConfig.fontScale = 1f;
    super.onConfigurationChanged(newConfig);
  }
`;

function ensureImport(src, statement) {
  if (src.includes(statement)) {
    return src;
  }
  const imports = [...src.matchAll(/^import .+$/gm)];
  if (!imports.length) {
    return `${statement}\n${src}`;
  }
  const last = imports[imports.length - 1];
  const at = last.index + last[0].length;
  return `${src.slice(0, at)}\n${statement}${src.slice(at)}`;
}

/**
 * Ignore Android display font size so layouts match the default scale.
 */
function withFixedFontScale(config) {
  return withMainActivity(config, (config) => {
    let src = config.modResults.contents;
    if (src.includes(MARKER)) {
      return config;
    }

    if (config.modResults.language === 'kt') {
      for (const statement of KT_IMPORTS) {
        src = ensureImport(src, statement);
      }
      src = src.replace(
        /class MainActivity : ReactActivity\(\) \{/,
        `class MainActivity : ReactActivity() {${KT_METHODS}`
      );
    } else {
      src = ensureImport(src, 'import android.content.Context;');
      src = ensureImport(src, 'import android.content.res.Configuration;');
      src = src.replace(
        /public class MainActivity extends ReactActivity \{/,
        `public class MainActivity extends ReactActivity {${JAVA_METHODS}`
      );
    }

    config.modResults.contents = src;
    return config;
  });
}

module.exports = withFixedFontScale;
