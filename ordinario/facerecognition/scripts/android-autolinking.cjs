const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function remapBuildPaths(value, physicalRoot, shortRoot) {
  if (Array.isArray(value)) return value.map((entry) => remapBuildPaths(entry, physicalRoot, shortRoot));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) =>
      [key, remapBuildPaths(entry, physicalRoot, shortRoot)]));
  }
  if (typeof value !== 'string') return value;
  const root = physicalRoot.replace(/\\/g, '/');
  const normalized = value.replace(/\\/g, '/');
  if (normalized.toLowerCase() !== root.toLowerCase() &&
      !normalized.toLowerCase().startsWith(`${root.toLowerCase()}/`)) return value;
  const result = shortRoot.replace(/\\/g, '/') + normalized.slice(root.length);
  return value.includes('\\') ? result.replace(/\//g, '\\') : result;
}

if (require.main === module) {
  const root = process.env.FACERECOGNITION_SHORT_ROOT || path.resolve(__dirname, '..');
  const cli = path.join(path.dirname(require.resolve('expo-modules-autolinking/package.json')),
    'bin/expo-modules-autolinking.js');
  const result = spawnSync(process.execPath,
    [cli, 'react-native-config', '--platform', 'android', '--json', '--project-root', root],
    { cwd: root, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error || result.status !== 0) {
    if (result.error) process.stderr.write(String(result.error));
    process.exit(result.status || 1);
  }
  const config = JSON.parse(result.stdout);
  const output = process.env.FACERECOGNITION_SHORT_ROOT
    ? remapBuildPaths(config, fs.realpathSync.native(root), root)
    : config;
  process.stdout.write(JSON.stringify(output));
}

module.exports = { remapBuildPaths };
