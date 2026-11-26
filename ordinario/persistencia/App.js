import { SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ListaProductos from './components/ListaProductos';
export default function App() {
  return <SafeAreaView style={styles.container}><ListaProductos /><StatusBar style="auto" /></SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#fff' } });
