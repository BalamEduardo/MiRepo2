import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';

export async function prepareFacePhoto(uri) {
  const context = ImageManipulator.manipulate(uri);
  let image;
  let resizedContext;
  let resized;
  let jpeg;
  try {
    // Native decoding applies JPEG orientation before measuring and resizing.
    image = await context.renderAsync();
    let output = image;
    if (Math.max(image.width, image.height) > 1280) {
      resizedContext = ImageManipulator.manipulate(image);
      resizedContext.resize(image.width >= image.height ? { width: 1280 } : { height: 1280 });
      resized = await resizedContext.renderAsync();
      output = resized;
    }
    jpeg = await output.saveAsync({ format: SaveFormat.JPEG, compress: 0.9, base64: true });
    if (!jpeg.base64) throw new Error('No se pudo preparar la imagen del rostro.');
    return `data:image/jpeg;base64,${jpeg.base64}`;
  } finally {
    if (jpeg?.uri) {
      try { new File(jpeg.uri).delete(); } catch {}
    }
    resized?.release();
    resizedContext?.release();
    image?.release();
    context.release();
  }
}
