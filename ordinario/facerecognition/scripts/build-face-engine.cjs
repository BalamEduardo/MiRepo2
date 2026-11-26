// Assemble a single offline document from checked-in assets; no network access.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.join(__dirname, '../assets/face-embedding');
const provenance = JSON.parse(fs.readFileSync(path.join(root, 'provenance.json')));
for (const [name, expected] of Object.entries(provenance.files)) {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, name))).digest('hex');
  if (actual !== expected) throw new Error(`Changed model asset: ${name}`);
}
const models = ['tiny_face_detector', 'face_landmark_68_tiny', 'face_recognition'].map((name) => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, `${name}_model-weights_manifest.json`)));
  return { name, groups: manifest.map((group) => ({
    weights: group.weights,
    data: Buffer.concat(group.paths.map((shard) => fs.readFileSync(path.join(root, shard)))).toString('base64'),
  })) };
});
const library = fs.readFileSync(path.join(root, 'face-api.min.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
const runtime = fs.readFileSync(path.join(__dirname, '../embedding-runtime.js'), 'utf8');
const html = `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; img-src data:; connect-src 'none'; worker-src 'none'; style-src 'unsafe-inline'">
</head><body><script>${library}</script><script>window.localFaceModels=${JSON.stringify(models)};</script><script>${runtime}</script></body></html>`;
fs.writeFileSync(path.join(root, 'engine.facebundle'), html);
console.log(`Offline embedding engine: ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(1)} MB`);
