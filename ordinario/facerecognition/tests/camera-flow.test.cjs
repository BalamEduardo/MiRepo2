const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.join(__dirname, '..');
const packageConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
const appConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'app.json'), 'utf8'));
const appSource = fs.readFileSync(path.join(projectRoot, 'CameraActivity.js'), 'utf8');
const liveSource = fs.readFileSync(path.join(projectRoot, 'LiveFaceCamera.js'), 'utf8');

test('installs native live camera and media-library dependencies for SDK 57', () => {
  assert.match(packageConfig.dependencies.expo, /^~57\./);
  assert.ok(packageConfig.dependencies['react-native-vision-camera']);
  assert.ok(packageConfig.dependencies['react-native-vision-camera-face-detector']);
  assert.ok(packageConfig.dependencies['expo-dev-client']);
  assert.ok(packageConfig.dependencies['expo-media-library']);
});

test('declares Spanish camera and save-only photo permission messages', () => {
  const plugins = appConfig.expo.plugins;
  const cameraMessage = appConfig.expo.ios.infoPlist.NSCameraUsageDescription;
  const mediaPlugin = plugins.find(([name]) => name === 'expo-media-library')?.[1];

  assert.match(cameraMessage, /cámara.*rostros.*fotos/i);
  assert.ok(appConfig.expo.android.permissions.includes('android.permission.CAMERA'));
  assert.ok(plugins.includes('expo-dev-client'));
  assert.equal(mediaPlugin.photosPermission, false);
  assert.match(mediaPlugin.savePhotosPermission, /guarde fotos.*galería/i);
  assert.deepEqual(mediaPlugin.granularPermissions, []);
  assert.deepEqual(appConfig.expo.android.blockedPermissions, [
    'android.permission.RECORD_AUDIO',
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
  ]);
  assert.equal(
    appConfig.expo.ios.bundleIdentifier,
    appConfig.expo.android.package
  );
});

test('supports capture, preview, retake, and saving the photo to the gallery', () => {
  assert.match(appSource, /writeOnly:\s*true/);
  assert.match(appSource, /granularPermissions:\s*\[\]/);
  assert.match(appSource, /LiveFaceCamera/);
  assert.match(appSource, /useCameraPermission/);
  assert.match(liveSource, /onStarted/);
  assert.match(appSource, /capturePhotoToFile/);
  assert.match(appSource, /<Image/);
  assert.match(appSource, /Volver a tomar/);
  assert.match(appSource, /Guardar/);
  assert.match(appSource, /Asset\.create/);
  assert.match(appSource, /Foto guardada en la galería/);
});

test('handles denied permissions and offers system settings when needed', () => {
  assert.match(appSource, /canRequestPermission/);
  assert.match(appSource, /Linking\.openSettings/);
  assert.match(appSource, /permiso/i);
});
