// Runs inside the private, offline WebView. It has no access to saved records.
(function () {
  const send = (message) => window.ReactNativeWebView.postMessage(JSON.stringify(message));
  const MODEL = 'face-api.js-0.22.2/faceRecognitionNet-128';
  let ready = false;
  let busy = false;
  const blocked = () => { throw new Error('Network disabled'); };
  window.fetch = blocked;
  window.XMLHttpRequest = blocked;
  window.WebSocket = blocked;

  async function initialize() {
    await faceapi.tf.setBackend('cpu');
    const nets = {
      tiny_face_detector: faceapi.nets.tinyFaceDetector,
      face_landmark_68_tiny: faceapi.nets.faceLandmark68TinyNet,
      face_recognition: faceapi.nets.faceRecognitionNet,
    };
    for (const model of window.localFaceModels) {
      const weights = {};
      for (const group of model.groups) {
        const raw = atob(group.data);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
        Object.assign(weights, faceapi.tf.io.decodeWeights(bytes.buffer, group.weights));
      }
      await nets[model.name].loadFromWeightMap(weights);
    }
    window.localFaceModels = null;
    ready = true;
    send({ type: 'ready', model: MODEL });
  }

  window.embedFacePhoto = async function (request) {
    if (!ready || busy) {
      send({ type: 'error', id: request.id, code: 'NOT_READY' });
      return;
    }
    busy = true;
    const image = new Image();
    try {
      if (typeof request.image !== 'string' || !request.image.startsWith('data:image/jpeg;base64,')) {
        throw new Error('INVALID_IMAGE');
      }
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error('INVALID_IMAGE'));
        image.src = request.image;
      });
      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 });
      const faces = await faceapi.detectAllFaces(image, options);
      if (faces.length !== 1) {
        send({ type: 'error', id: request.id, code: faces.length ? 'MULTIPLE_FACES' : 'NO_FACE' });
        return;
      }
      const result = await faceapi.detectSingleFace(image, options)
        .withFaceLandmarks(true).withFaceDescriptor();
      if (!result) throw new Error('NO_FACE');
      const descriptor = Array.from(result.descriptor);
      if (descriptor.length !== 128 || descriptor.some((value) => !Number.isFinite(value))) {
        throw new Error('INVALID_DESCRIPTOR');
      }
      send({ type: 'embedding', id: request.id, model: MODEL, descriptor });
    } catch (error) {
      send({ type: 'error', id: request.id, code: error.message === 'NO_FACE' ? 'NO_FACE' : 'ANALYSIS_FAILED' });
    } finally {
      image.onload = null;
      image.onerror = null;
      image.removeAttribute('src');
      busy = false;
    }
  };
  initialize().catch(() => send({ type: 'init-error' }));
})();
