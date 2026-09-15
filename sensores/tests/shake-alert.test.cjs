const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const componentSource = fs.readFileSync(
  path.join(__dirname, '..', 'components', 'ShakeAlert.js'),
  'utf8'
);

test('ShakeAlert muestra una alerta y elimina su suscripción', () => {
  assert.match(componentSource, /import\s+\{\s*Alert\s*\}\s+from\s+['"]react-native['"]/);
  assert.match(componentSource, /import\s+\{\s*Accelerometer\s*\}\s+from\s+['"]expo-sensors['"]/);
  assert.match(componentSource, /Accelerometer\.addListener/);
  assert.match(componentSource, /Alert\.alert/);
  assert.match(componentSource, /subscription\.remove\(\)/);
});
