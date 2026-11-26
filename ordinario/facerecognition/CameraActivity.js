import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useCameraDevice, useCameraPermission, usePhotoOutput } from 'react-native-vision-camera';
import { Asset, usePermissions as useMediaLibraryPermissions } from 'expo-media-library';
import { File } from 'expo-file-system';
import LiveFaceCamera from './LiveFaceCamera';
import FaceEnrollment from './FaceEnrollment';
import FaceRecords from './FaceRecords';
import { deleteFaceRecord, loadFaceRecords } from './face-records';
import { prepareFacePhoto } from './prepare-face-photo';

const MEDIA_PERMISSION_OPTIONS = {
  writeOnly: true,
  granularPermissions: [],
};

export default function CameraActivity() {
  const cameraPermission = useCameraPermission();
  const device = useCameraDevice('front');
  const photoOutput = usePhotoOutput({ containerFormat: 'jpeg', quality: 0.9 });
  const captureLock = useRef(false);
  const mounted = useRef(true);
  const photoFile = useRef(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const [detection, setDetection] = useState({ status: 'waiting', count: 0 });
  const [mediaPermission, requestMediaPermission, getMediaPermission] =
    useMediaLibraryPermissions(MEDIA_PERMISSION_OPTIONS);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [photoUri, setPhotoUri] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSettingsNeeded, setSaveSettingsNeeded] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [records, setRecords] = useState([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const onEnrollmentBusy = useCallback((value) => {
    if (mounted.current) setIsRegistering(value);
  }, []);

  useEffect(() => {
    let alive = true;
    loadFaceRecords().then(({ records: saved, unreadable }) => {
      if (!alive) return;
      setRecords((current) => [...current, ...saved.filter((record) => !current.some((item) => item.id === record.id))]);
      if (unreadable) setFeedback({ type: 'error', text: 'Algunos registros locales no se pudieron leer. Los archivos originales se conservan.' });
    }).catch(() => {
      if (alive) setFeedback({ type: 'error', text: 'No se pudieron leer los registros locales.' });
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setAppState(state);
      setCameraReady(false);
      setDetection({ status: 'waiting', count: 0 });
      if (state !== 'active') setEnrollmentOpen(false);
      if (state === 'active') {
        getMediaPermission().catch(() => {});
      }
    });

    return () => subscription.remove();
  }, [getMediaPermission]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      deleteTemporaryPhoto(photoFile.current);
    };
  }, []);

  useEffect(() => {
    if (mediaPermission?.granted) {
      setSaveSettingsNeeded(false);
      setFeedback((current) => (current?.type === 'permission' ? null : current));
    }
  }, [mediaPermission?.granted]);

  const openSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      setFeedback({
        type: 'error',
        text: 'No se pudieron abrir los ajustes. Puedes habilitar el permiso desde la configuración del teléfono.',
      });
    }
  };

  const handleCameraPermission = async () => {
    try {
      await cameraPermission.requestPermission();
      setFeedback(null);
    } catch {
      setFeedback({ type: 'error', text: 'No se pudo solicitar el permiso de cámara.' });
    }
  };

  const takePhoto = async () => {
    if (!cameraReady || captureLock.current || appState !== 'active') {
      return;
    }

    captureLock.current = true;
    setIsCapturing(true);
    setFeedback(null);

    try {
      const photo = await photoOutput.capturePhotoToFile({ flashMode: 'off' }, {});
      if (!photo?.filePath) {
        throw new Error('La cámara no devolvió una ruta para la foto.');
      }

      const uri = photo.filePath.startsWith('file://') ? photo.filePath : `file://${photo.filePath}`;
      if (!mounted.current) {
        deleteTemporaryPhoto(uri);
        return;
      }
      photoFile.current = uri;
      setPhotoUri(uri);
      setCameraReady(false);
      setDetection({ status: 'waiting', count: 0 });
    } catch {
      if (mounted.current) setFeedback({ type: 'error', text: 'No se pudo tomar la foto. Inténtalo de nuevo.' });
    } finally {
      captureLock.current = false;
      if (mounted.current) setIsCapturing(false);
    }
  };

  const retakePhoto = () => {
    deleteTemporaryPhoto(photoFile.current);
    photoFile.current = null;
    setPhotoUri(null);
    setCameraReady(false);
    setCameraError(false);
    setCameraKey((current) => current + 1);
    setSaveSettingsNeeded(false);
    setFeedback(null);
    setDetection({ status: 'waiting', count: 0 });
  };

  const retryCamera = () => {
    setCameraError(false);
    setCameraReady(false);
    setDetection({ status: 'waiting', count: 0 });
    setCameraKey((current) => current + 1);
  };

  const captureForEmbedding = async () => {
    if (!cameraReady || captureLock.current || appState !== 'active') {
      throw new Error('La cámara no está lista. Inténtalo de nuevo.');
    }
    captureLock.current = true;
    let uri;
    try {
      const photo = await photoOutput.capturePhotoToFile({ flashMode: 'off' }, {});
      if (!photo?.filePath) throw new Error('No se pudo capturar el rostro.');
      uri = photo.filePath.startsWith('file://') ? photo.filePath : `file://${photo.filePath}`;
      return await prepareFacePhoto(uri);
    } finally {
      deleteTemporaryPhoto(uri);
      captureLock.current = false;
    }
  };

  const removeRecord = (record) => Alert.alert('Eliminar registro', `¿Eliminar el embedding de ${record.name}?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: () => {
      try {
        deleteFaceRecord(record.id);
        setRecords((current) => current.filter((item) => item.id !== record.id));
      } catch {
        Alert.alert('No se pudo eliminar', 'Inténtalo de nuevo.');
      }
    } },
  ]);

  const savePhoto = async () => {
    if (!photoUri || isSaving) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const permission = mediaPermission?.granted
        ? mediaPermission
        : await requestMediaPermission();

      if (!permission?.granted) {
        const settingsNeeded = permission?.canAskAgain === false;
        setSaveSettingsNeeded(settingsNeeded);
        setFeedback({
          type: 'permission',
          text: settingsNeeded
            ? 'Activa el permiso para guardar fotos desde los ajustes del teléfono.'
            : 'Se necesita permiso para guardar la foto. Puedes volver a intentarlo.',
        });
        return;
      }

      await Asset.create(photoUri);
      setSaveSettingsNeeded(false);
      setFeedback({ type: 'success', text: 'Foto guardada en la galería.' });
    } catch {
      setFeedback({ type: 'error', text: 'No se pudo guardar la foto. Inténtalo de nuevo.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!cameraPermission.hasPermission) {
    const canAskAgain = cameraPermission.canRequestPermission;

    return (
      <PermissionScreen
        title="Permiso de cámara"
        message="FaceRecognition necesita acceso a la cámara para detectar rostros en vivo y tomar fotos."
        actionLabel={canAskAgain ? 'Permitir cámara' : 'Abrir Ajustes'}
        onAction={canAskAgain ? handleCameraPermission : openSettings}
        feedback={feedback}
      />
    );
  }

  if (!device && !photoUri) {
    return <PermissionScreen title="Cámara frontal no disponible" message="Este dispositivo no tiene una cámara frontal disponible. Comprueba la cámara o utiliza otro teléfono." actionLabel="Abrir Ajustes" onAction={openSettings} feedback={feedback} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ACTIVIDAD</Text>
          <Text style={styles.title}>FaceRecognition</Text>
          <Text style={styles.subtitle}>Detección de rostros en vivo, en tu teléfono.</Text>
        </View>

        <View style={styles.previewFrame}>
          {photoUri ? (
            <Image
              accessibilityLabel="Vista previa de la foto"
              source={{ uri: photoUri }}
              resizeMode="cover"
              style={styles.previewImage}
            />
          ) : (
            <>
              {appState === 'active' && !cameraError && !recordsOpen ? <LiveFaceCamera
                key={cameraKey}
                device={device}
                photoOutput={photoOutput}
                onDetection={setDetection}
                onReady={() => {
                  setCameraReady(true);
                  setCameraError(false);
                }}
                onCameraError={() => {
                  setCameraReady(false);
                  setCameraError(true);
                  setDetection({ status: 'waiting', count: 0 });
                }}
              /> : null}
              {!cameraReady && !cameraError ? (
                <View style={styles.cameraOverlay}>
                  <ActivityIndicator color={palette.white} size="large" />
                  <Text style={styles.overlayText}>Preparando cámara…</Text>
                </View>
              ) : null}
              {cameraError ? (
                <View style={styles.cameraOverlay}>
                  <Text style={styles.overlayTitle}>No se pudo iniciar la cámara</Text>
                  <Text style={styles.overlayText}>Comprueba el dispositivo e inténtalo otra vez.</Text>
                  <ActionButton
                    label="Reintentar"
                    onPress={retryCamera}
                    variant="secondary"
                  />
                </View>
              ) : null}
              {isCapturing ? (
                <View style={styles.busyOverlay}>
                  <ActivityIndicator color={palette.white} size="large" />
                </View>
              ) : null}
            </>
          )}
        </View>

        <View style={styles.footer}>
          {photoUri ? (
            <>
              <Text style={styles.hint}>Revisa la foto antes de guardarla.</Text>
              <View style={styles.buttonRow}>
                <ActionButton
                  label="Volver a tomar"
                  onPress={retakePhoto}
                  variant="secondary"
                  disabled={isSaving}
                />
                <ActionButton
                  label={
                    isSaving ? 'Guardando…' : feedback?.type === 'success' ? 'Guardada' : 'Guardar'
                  }
                  onPress={savePhoto}
                  disabled={isSaving || feedback?.type === 'success'}
                  loading={isSaving}
                />
              </View>
              {saveSettingsNeeded ? (
                <ActionButton label="Abrir Ajustes" onPress={openSettings} variant="text" />
              ) : null}
            </>
          ) : (
            <>
              <Text style={styles.hint}>
                {cameraReady ? 'Colócate frente a la cámara.' : 'La cámara se está preparando.'}
              </Text>
              {cameraReady ? <Text accessibilityLiveRegion="polite" style={styles.detectionStatus}>
                {detection.status === 'error'
                  ? 'No se pudo detectar rostros. Puedes seguir tomando fotos.'
                  : detection.status === 'waiting'
                    ? 'Iniciando detección…'
                    : detection.count === 0
                      ? 'No se detectaron rostros'
                      : `${detection.count} ${detection.count === 1 ? 'rostro detectado' : 'rostros detectados'}`}
              </Text> : null}
              {cameraReady && detection.status === 'error' ? <ActionButton
                label="Reintentar detección" onPress={retryCamera} variant="text" disabled={isCapturing}
              /> : null}
              <ActionButton
                label="Tomar foto"
                onPress={takePhoto}
                disabled={!cameraReady || isCapturing || cameraError || isRegistering}
                loading={isCapturing}
              />
              <View style={styles.registrationActions}>
                <ActionButton label="Registrar rostro" variant="secondary"
                  disabled={!cameraReady || isCapturing || isRegistering || detection.status !== 'ready' || detection.count !== 1}
                  onPress={() => { setFeedback(null); setEnrollmentOpen(true); }} />
                <ActionButton label={`Registros (${records.length})`} variant="text" disabled={isCapturing || isRegistering}
                  onPress={() => { setCameraReady(false); setRecordsOpen(true); }} />
              </View>
            </>
          )}
          {feedback ? <Feedback type={feedback.type} text={feedback.text} /> : null}
        </View>
      </View>
      {enrollmentOpen && appState === 'active' ? <FaceEnrollment
        capture={captureForEmbedding}
        canCapture={cameraReady && !cameraError && detection.status === 'ready' && detection.count === 1}
        onBusy={onEnrollmentBusy}
        onClose={() => setEnrollmentOpen(false)}
        onSaved={(record) => {
          if (!mounted.current) return;
          setRecords((current) => [record, ...current]);
          setFeedback({ type: 'success', text: `Embedding de ${record.name} guardado en el teléfono (128 valores).` });
        }}
      /> : null}
      {recordsOpen ? <FaceRecords records={records} onDelete={removeRecord} onClose={() => setRecordsOpen(false)} /> : null}
    </SafeAreaView>
  );
}

function deleteTemporaryPhoto(uri) {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // A cache file may already have been removed by the operating system.
  }
}

function PermissionScreen({ title, message, actionLabel, onAction, feedback, loading = false }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.permissionScreen}>
        <View style={styles.permissionIcon}>
          <Text style={styles.permissionIconText}>◎</Text>
        </View>
        <Text style={styles.eyebrow}>ACTIVIDAD</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.permissionMessage}>{message}</Text>
        {loading ? (
          <ActivityIndicator color={palette.accent} size="large" />
        ) : (
          <ActionButton label={actionLabel} onPress={onAction} />
        )}
        {feedback ? <Feedback type={feedback.type} text={feedback.text} /> : null}
      </View>
    </SafeAreaView>
  );
}

function ActionButton({ label, onPress, disabled = false, loading = false, variant = 'primary' }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' ? styles.secondaryButton : null,
        variant === 'text' ? styles.textButton : null,
        disabled ? styles.disabledButton : null,
        pressed && !disabled ? styles.pressedButton : null,
      ]}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? palette.ink : palette.white} /> : null}
      <Text
        style={[
          styles.buttonLabel,
          variant === 'secondary' ? styles.secondaryButtonLabel : null,
          variant === 'text' ? styles.textButtonLabel : null,
          disabled ? styles.disabledButtonLabel : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Feedback({ type, text }) {
  return (
    <Text
      accessibilityLiveRegion="polite"
      style={[styles.feedback, type === 'success' ? styles.successFeedback : null]}
    >
      {text}
    </Text>
  );
}

const palette = {
  background: '#10131C',
  surface: '#1A1F2B',
  surfaceRaised: '#242A39',
  border: '#343B4D',
  white: '#F8FAFF',
  muted: '#A8B0C2',
  accent: '#C5F36A',
  ink: '#171C11',
  error: '#FF9E9E',
  success: '#C5F36A',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  header: {
    paddingBottom: 18,
  },
  eyebrow: {
    color: palette.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 7,
  },
  title: {
    color: palette.white,
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  previewFrame: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 26,
    borderWidth: 1,
    flex: 1,
    minHeight: 260,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(16, 19, 28, 0.78)',
    justifyContent: 'center',
    padding: 24,
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(16, 19, 28, 0.4)',
    justifyContent: 'center',
  },
  overlayTitle: {
    color: palette.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  overlayText: {
    color: palette.muted,
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  footer: {
    paddingTop: 16,
  },
  hint: {
    color: palette.muted,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  detectionStatus: {
    color: palette.accent,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  registrationActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  button: {
    alignItems: 'center',
    backgroundColor: palette.accent,
    borderRadius: 16,
    flex: 1,
    flexDirection: 'row',
    gap: 9,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  secondaryButton: {
    backgroundColor: palette.surfaceRaised,
    borderColor: palette.border,
    borderWidth: 1,
  },
  textButton: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
    flex: 0,
    minHeight: 44,
  },
  disabledButton: {
    backgroundColor: '#6C735E',
  },
  pressedButton: {
    opacity: 0.82,
  },
  buttonLabel: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButtonLabel: {
    color: palette.white,
  },
  textButtonLabel: {
    color: palette.accent,
  },
  disabledButtonLabel: {
    color: '#D0D5C6',
  },
  feedback: {
    color: palette.error,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
    textAlign: 'center',
  },
  successFeedback: {
    color: palette.success,
  },
  permissionScreen: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  permissionIcon: {
    alignItems: 'center',
    backgroundColor: palette.surfaceRaised,
    borderColor: palette.border,
    borderRadius: 30,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    marginBottom: 24,
    width: 72,
  },
  permissionIconText: {
    color: palette.accent,
    fontSize: 42,
    lineHeight: 50,
  },
  permissionMessage: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 24,
    marginTop: 10,
    maxWidth: 320,
    textAlign: 'center',
  },
});
