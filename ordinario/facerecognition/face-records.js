import { Directory, File, Paths } from 'expo-file-system';

export const EMBEDDING_MODEL = 'face-api.js-0.22.2/faceRecognitionNet-128';
const directory = () => new Directory(Paths.document, 'face-embeddings');
const validId = (id) => typeof id === 'string' && /^[0-9]+-[a-f0-9]+$/.test(id);

export function validateEmbedding(descriptor, model) {
  if (model !== EMBEDDING_MODEL || !Array.isArray(descriptor) || descriptor.length !== 128
      || descriptor.some((value) => typeof value !== 'number' || !Number.isFinite(value))
      || descriptor.reduce((sum, value) => sum + value * value, 0) < 1e-10) {
    throw new Error('El modelo devolvió un embedding inválido. Inténtalo de nuevo.');
  }
}

export async function loadFaceRecords() {
  const folder = directory();
  if (!folder.exists) return { records: [], unreadable: 0 };
  const records = [];
  let unreadable = 0;
  for (const file of folder.list()) {
    if (!(file instanceof File) || !file.name.endsWith('.json')) continue;
    try {
      const record = JSON.parse(await file.text());
      validateEmbedding(record.embedding, record.model);
      if (record.schemaVersion !== 1 || !validId(record.id) || file.name !== `${record.id}.json`
          || record.dimensions !== 128 || typeof record.name !== 'string' || !record.name.trim()
          || !Number.isFinite(Date.parse(record.createdAt))) throw new Error('Invalid record');
      records.push(record);
    } catch {
      unreadable++;
    }
  }
  records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { records, unreadable };
}

export async function saveFaceRecord(name, result) {
  const label = name.trim();
  if (!label || label.length > 60) throw new Error('Escribe un nombre de hasta 60 caracteres.');
  validateEmbedding(result.descriptor, result.model);
  const record = {
    schemaVersion: 1,
    id: `${Date.now()}-${Math.random().toString(16).slice(2) || '0'}`,
    name: label,
    createdAt: new Date().toISOString(),
    model: EMBEDDING_MODEL,
    dimensions: 128,
    embedding: result.descriptor,
  };
  const folder = directory();
  folder.create({ idempotent: true, intermediates: true });
  const pending = new File(folder, `${record.id}.tmp`);
  try {
    pending.write(JSON.stringify(record));
    await pending.move(new File(folder, `${record.id}.json`));
  } catch (error) {
    try { if (pending.exists) pending.delete(); } catch {}
    throw error;
  }
  return record;
}

export function deleteFaceRecord(id) {
  if (!validId(id)) throw new Error('Registro inválido.');
  const file = new File(directory(), `${id}.json`);
  if (file.exists) file.delete();
}
