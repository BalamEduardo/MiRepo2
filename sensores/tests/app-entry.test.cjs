const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'App.js'), 'utf8');

test('App monta PedometerSensor y no la API nativa como JSX', () => {
  assert.match(
    appSource,
    /import\s+PedometerSensor\s+from\s+['"]\.\/components\/PedometerSensor['"]/
  );
  assert.match(appSource, /<PedometerSensor\s*\/>/);
  assert.doesNotMatch(appSource, /import\s+\{\s*Pedometer\s*\}\s+from\s+['"]expo-sensors['"]/);
  assert.doesNotMatch(appSource, /<Pedometer\s*\/>/);
});
