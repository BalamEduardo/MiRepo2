import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import { createFaceDetectorOutput } from 'react-native-vision-camera-face-detector';
import { createDetectionSession, projectFaceBounds } from './detection';

export default function LiveFaceCamera({ device, photoOutput, onReady, onCameraError, onDetection }) {
  const cameraRef = useRef(null);
  const alive = useRef(false);
  const viewport = useRef({ width: 0, height: 0 });
  const callbacks = useRef({ onReady, onCameraError, onDetection });
  callbacks.current = { onReady, onCameraError, onDetection };
  const [output, setOutput] = useState(null);
  const [faces, setFaces] = useState([]);

  useEffect(() => {
    alive.current = true;
    let detector;
    let mounted = true;
    let staleTimer;
    const clearFaces = () => {
      setFaces([]);
      callbacks.current.onDetection({ status: 'waiting', count: 0 });
    };
    const session = createDetectionSession((detected) => {
      const camera = cameraRef.current;
      if (!camera?.preview) return;
      try {
        const projected = detected.map((face, index) => ({
          id: face.trackingId ?? index,
          bounds: projectFaceBounds(face.bounds,
            (point) => camera.convertCameraPointToViewPoint(point), viewport.current),
        })).filter((face) => face.bounds);
        setFaces(projected);
        callbacks.current.onDetection({ status: 'ready', count: projected.length });
        clearTimeout(staleTimer);
        staleTimer = setTimeout(() => { if (mounted) clearFaces(); }, 1500);
      } catch (error) {
        session.fail(error);
      }
    }, () => {
      clearTimeout(staleTimer);
      setFaces([]);
      callbacks.current.onDetection({ status: 'error', count: 0 });
    });

    try {
      detector = createFaceDetectorOutput({
        performanceMode: 'fast',
        outputResolution: 'preview',
        autoMode: true,
        cameraFacing: 'front',
        mirrorMode: 'on',
        trackingEnabled: true,
        minFaceSize: 0.15,
        runContours: false,
        runLandmarks: false,
        runClassifications: false,
        onFacesDetected: (detected) => session.accept(detected),
        onError: (error) => session.fail(error),
      });
      setOutput(detector);
    } catch (error) {
      session.fail(error);
    }
    return () => {
      alive.current = false;
      mounted = false;
      session.close();
      clearTimeout(staleTimer);
      // Let the Camera's child cleanup detach its native outputs before releasing ML Kit.
      setTimeout(() => detector?.dispose(), 0);
    };
  }, []);

  return (
    <View style={styles.fill} onLayout={({ nativeEvent: { layout } }) => {
      viewport.current = { width: layout.width, height: layout.height };
      setFaces([]);
    }}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        mirrorMode="on"
        resizeMode="cover"
        outputs={output ? [photoOutput, output] : [photoOutput]}
        onStarted={() => { if (alive.current) callbacks.current.onReady(); }}
        onError={() => { if (alive.current) callbacks.current.onCameraError(); }}
        onInterruptionStarted={() => {
          if (!alive.current) return;
          setFaces([]);
          callbacks.current.onCameraError();
        }}
      />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {faces.map((face) => <View key={face.id} style={[styles.faceBox, face.bounds]} />)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  faceBox: { position: 'absolute', borderColor: '#C5F36A', borderWidth: 3, borderRadius: 12 },
});
