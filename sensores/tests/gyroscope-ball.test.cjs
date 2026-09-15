const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const componentSource = fs.readFileSync(
  path.join(__dirname, '..', 'components', 'GyroscopeBall.js'),
  'utf8'
);

test('GyroscopeBall usa el giroscopio para mover una pelota', () => {
  assert.match(componentSource, /import\s+\{\s*Gyroscope\s*\}\s+from\s+['"]expo-sensors['"]/);
  assert.match(componentSource, /Gyroscope\.addListener/);
  assert.match(componentSource, /position/);
  assert.match(componentSource, /borderRadius/);
});
