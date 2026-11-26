const test = require('node:test');
const assert = require('node:assert/strict');
const { remapBuildPaths } = require('../scripts/android-autolinking.cjs');

test('keeps all autolinking paths on the same short drive while preserving separators', () => {
  const config = { root: 'C:\\workspace\\activity', modules: [
    { sourceDir: 'C:\\workspace\\activity\\node_modules\\camera\\android',
      cmake: 'C:/workspace/activity/node_modules/camera/CMakeLists.txt', count: 2 },
  ] };
  assert.deepEqual(remapBuildPaths(config, 'C:\\workspace\\activity', 'Z:\\activity'),
    { root: 'Z:\\activity', modules: [
      { sourceDir: 'Z:\\activity\\node_modules\\camera\\android',
        cmake: 'Z:/activity/node_modules/camera/CMakeLists.txt', count: 2 },
    ] });
});
test('does not rewrite neighboring folders or SDK dependencies outside the activity', () => {
  const input = ['C:/workspace/activity-other/file', 'C:/Android/Sdk', null, 23];
  assert.deepEqual(remapBuildPaths(input, 'C:/workspace/activity', 'Z:/activity'), input);
});
