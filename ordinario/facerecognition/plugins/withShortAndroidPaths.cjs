const { withSettingsGradle } = require('expo/config-plugins');

module.exports = function withShortAndroidPaths(config) {
  return withSettingsGradle(config, (mod) => {
    const original = 'ex.autolinkLibrariesFromCommand(expoAutolinking.rnConfigCommand)';
    const replacement = `if (System.getenv('FACERECOGNITION_SHORT_ROOT') != null) {
      ex.autolinkLibrariesFromCommand(["node", new File(rootDir, "../scripts/android-autolinking.cjs").absolutePath])
    } else {
      ${original}
    }`;
    if (!mod.modResults.contents.includes('scripts/android-autolinking.cjs')) {
      if (!mod.modResults.contents.includes(original)) {
        throw new Error('No se encontró el enlace de módulos Android esperado para Expo SDK 57.');
      }
      mod.modResults.contents = mod.modResults.contents.replace(original, replacement);
    }
    return mod;
  });
};
