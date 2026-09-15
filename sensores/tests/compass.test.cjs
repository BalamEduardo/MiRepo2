const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const componentSource = fs.readFileSync(
  path.join(__dirname, '..', 'components', 'Compass.js'),
  'utf8'
);

test('Compass calcula el rumbo con el magnetómetro y gira la flecha', () => {
  assert.match(componentSource, /import\s+\{\s*Magnetometer\s*\}\s+from\s+['"]expo-sensors['"]/);
  assert.match(componentSource, /Magnetometer\.addListener/);
  assert.match(componentSource, /Math\.atan2\(y,\s*x\)/);
  assert.match(componentSource, /rotate/);
  assert.match(componentSource, />N<|>N<\/Text/);
});
