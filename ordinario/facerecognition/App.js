import { Component } from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

function BuildRequired({ message }) {
  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>FaceRecognition</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.message}>
        Instala la compilación propia de esta actividad. Consulta las instrucciones del README.
      </Text>
    </SafeAreaView>
  );
}

class NativeModuleBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <BuildRequired message="Esta instalación no pudo cargar la cámara o el detector nativo. Reconstruye la app con sus dependencias actuales." />
    ) : this.props.children;
  }
}

function NativeActivity() {
  // Load native modules only after ruling out Expo Go.
  const CameraActivity = require('./CameraActivity').default;
  return <CameraActivity />;
}

export default function App() {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return <BuildRequired message="La detección de rostros en vivo necesita una compilación propia; Expo Go no incluye este detector." />;
  }
  return <NativeModuleBoundary><NativeActivity /></NativeModuleBoundary>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#10131C', justifyContent: 'center', padding: 28 },
  title: { color: '#F8FAFF', fontSize: 29, fontWeight: '800', marginBottom: 18 },
  message: { color: '#A8B0C2', fontSize: 16, lineHeight: 24, marginBottom: 12 },
});
