import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { File, Paths } from 'expo-file-system';
import { EMBEDDING_MODEL, validateEmbedding } from './face-records';

const errorMessages = {
  NO_FACE: 'No se encontró un rostro en la captura. Mira de frente y mejora la iluminación.',
  MULTIPLE_FACES: 'Hay varios rostros en la captura. Registra a una sola persona a la vez.',
  NOT_READY: 'El modelo todavía se está preparando. Inténtalo de nuevo.',
  ANALYSIS_FAILED: 'No se pudo generar el embedding. Inténtalo de nuevo.',
};

// Share installation work if a registration is cancelled and immediately reopened.
let installedEngine;
async function getEngineUri() {
  if (installedEngine) {
    const uri = await installedEngine;
    if (new File(uri).exists) return uri;
  }
  installedEngine = (async () => {
    const asset = Asset.fromModule(require('./assets/face-embedding/engine.facebundle'));
    await asset.downloadAsync();
    if (!asset.localUri) throw new Error('Missing bundled model');
    const file = new File(Paths.cache, `face-engine-${asset.hash || 'bundled'}.html`);
    if (!file.exists) {
      const temporary = new File(Paths.cache, `${file.name}.tmp`);
      try {
        await new File(asset.localUri).copy(temporary, { overwrite: true });
        await temporary.move(file);
      } catch (error) {
        try { const leftover = new File(Paths.cache, `${file.name}.tmp`); if (leftover.exists) leftover.delete(); } catch {}
        throw error;
      }
    }
    return file.uri;
  })().catch((error) => { installedEngine = null; throw error; });
  return installedEngine;
}

export default forwardRef(function EmbeddingEngine({ onStatus }, ref) {
  const webview = useRef(null);
  const pending = useRef(null);
  const ready = useRef(false);
  const counter = useRef(0);
  const mounted = useRef(false);
  const activeGeneration = useRef(0);
  const callbacks = useRef(onStatus);
  callbacks.current = onStatus;
  const [uri, setUri] = useState(null);
  const [generation, setGeneration] = useState(0);
  activeGeneration.current = generation;

  const rejectPending = (message) => {
    const request = pending.current;
    pending.current = null;
    if (request) {
      clearTimeout(request.timer);
      request.reject(new Error(message));
    }
  };
  const failEngine = () => {
    if (!mounted.current || activeGeneration.current !== generation) return;
    ready.current = false;
    rejectPending('No se pudo cargar el modelo local. Cierra el registro e inténtalo de nuevo.');
    callbacks.current('error');
  };

  useEffect(() => {
    let alive = true;
    mounted.current = true;
    ready.current = false;
    callbacks.current('loading');
    const timeout = setTimeout(() => { if (alive && !ready.current) failEngine(); }, 90000);
    (async () => {
      const source = await getEngineUri();
      if (alive) setUri(source);
    })().catch(() => { if (alive) failEngine(); });
    return () => {
      alive = false;
      mounted.current = false;
      ready.current = false;
      clearTimeout(timeout);
      rejectPending('Registro cancelado.');
    };
  }, [generation]);

  useImperativeHandle(ref, () => ({
    generate(image) {
      if (!ready.current || !webview.current) return Promise.reject(new Error(errorMessages.NOT_READY));
      if (pending.current) return Promise.reject(new Error('Ya se está generando un embedding.'));
      const id = `${generation}-${++counter.current}`;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          if (pending.current?.id !== id) return;
          ready.current = false;
          rejectPending('El análisis tardó demasiado. Inténtalo con más luz y el rostro de frente.');
          setUri(null);
          setGeneration((value) => value + 1);
        }, 90000);
        pending.current = { id, resolve, reject, timer };
        const serialized = JSON.stringify({ id, image }).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
        webview.current.injectJavaScript(`window.embedFacePhoto(${serialized}); true;`);
      });
    },
  }), [generation]);

  const onMessage = ({ nativeEvent }) => {
    if (!mounted.current || activeGeneration.current !== generation) return;
    try {
      const message = JSON.parse(nativeEvent.data);
      if (message.type === 'ready' && message.model === EMBEDDING_MODEL) {
        ready.current = true;
        callbacks.current('ready');
        return;
      }
      if (message.type === 'init-error') { failEngine(); return; }
      const request = pending.current;
      if (!request || message.id !== request.id) return;
      if (message.type === 'error') {
        rejectPending(errorMessages[message.code] || errorMessages.ANALYSIS_FAILED);
      } else if (message.type === 'embedding') {
        validateEmbedding(message.descriptor, message.model);
        pending.current = null;
        clearTimeout(request.timer);
        request.resolve(message);
      }
    } catch {
      rejectPending(errorMessages.ANALYSIS_FAILED);
    }
  };

  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.hidden}>
    {uri ? <WebView
      key={generation}
      ref={webview}
      source={{ uri }}
      originWhitelist={['file://*', 'about:blank']}
      allowingReadAccessToURL={uri}
      allowFileAccess
      allowFileAccessFromFileURLs={false}
      allowUniversalAccessFromFileURLs={false}
      javaScriptEnabled
      domStorageEnabled={false}
      cacheEnabled={false}
      mixedContentMode="never"
      setSupportMultipleWindows={false}
      onShouldStartLoadWithRequest={(request) => request.url === uri || request.url === 'about:blank'}
      onMessage={onMessage}
      onError={failEngine}
      onContentProcessDidTerminate={failEngine}
      onRenderProcessGone={failEngine}
    /> : null}
  </View>;
});

const styles = StyleSheet.create({ hidden: { position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' } });
