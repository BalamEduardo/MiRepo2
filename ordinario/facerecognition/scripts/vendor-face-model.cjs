// Development-time download only. The installed app never downloads these files.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const revision = 'a86f011d72124e5fb93e59d5c4ab98f699dd5c9c';
const root = path.join(__dirname, '../assets/face-embedding');
const models = ['tiny_face_detector', 'face_landmark_68_tiny', 'face_recognition'];

async function download(remote, name) {
  const response = await fetch(`https://raw.githubusercontent.com/justadudewhohacks/face-api.js/${revision}/${remote}`);
  if (!response.ok) throw new Error(`${remote}: ${response.status}`);
  fs.writeFileSync(path.join(root, name), Buffer.from(await response.arrayBuffer()));
}

async function main() {
  fs.mkdirSync(root, { recursive: true });
  await download('dist/face-api.min.js', 'face-api.min.js');
  await download('LICENSE', 'LICENSE.face-api.txt');
  for (const model of models) {
    const name = `${model}_model-weights_manifest.json`;
    await download(`weights/${name}`, name);
    const manifest = JSON.parse(fs.readFileSync(path.join(root, name)));
    for (const shard of manifest.flatMap((group) => group.paths)) {
      await download(`weights/${shard}`, shard);
    }
  }
  const files = fs.readdirSync(root).filter((name) => name !== 'provenance.json' && !name.endsWith('.facebundle'));
  fs.writeFileSync(path.join(root, 'provenance.json'), JSON.stringify({
    repository: 'https://github.com/justadudewhohacks/face-api.js', revision,
    files: Object.fromEntries(files.map((name) => [name, crypto.createHash('sha256')
      .update(fs.readFileSync(path.join(root, name))).digest('hex')])),
  }, null, 2) + '\n');
  require('./build-face-engine.cjs');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
