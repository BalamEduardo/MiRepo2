import { useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function FaceRecords({ records, onClose, onDelete }) {
  const [selected, setSelected] = useState(null);
  return <Modal animationType="slide" onRequestClose={selected ? () => setSelected(null) : onClose}>
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{selected ? selected.name : 'Rostros guardados'}</Text>
        <Pressable accessibilityRole="button" onPress={selected ? () => setSelected(null) : onClose} style={styles.action}>
          <Text style={styles.link}>{selected ? 'Volver' : 'Cerrar'}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.text}>Los registros permanecen en los archivos privados de esta aplicación. Al desinstalarla o borrar sus datos, se eliminan.</Text>
        {selected ? <>
          <Text selectable style={styles.text}>Modelo: {selected.model}{'\n'}Fecha: {new Date(selected.createdAt).toLocaleString()}{'\n'}Dimensiones: {selected.dimensions}</Text>
          <Text selectable style={styles.vector}>{JSON.stringify(selected.embedding, null, 2)}</Text>
        </> : records.length ? records.map((record) => <View key={record.id} style={styles.card}>
          <Text style={styles.name}>{record.name}</Text>
          <Text style={styles.text}>128 valores · {new Date(record.createdAt).toLocaleString()}</Text>
          <View style={styles.row}>
            <Pressable accessibilityRole="button" onPress={() => setSelected(record)} style={styles.action}><Text style={styles.link}>Ver embedding</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Eliminar registro de ${record.name}`} onPress={() => onDelete(record)} style={styles.action}><Text style={styles.delete}>Eliminar</Text></Pressable>
          </View>
        </View>) : <Text style={styles.text}>Todavía no hay embeddings guardados. Usa Registrar rostro desde la cámara.</Text>}
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#10131C' },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { color: '#F8FAFF', fontSize: 23, fontWeight: '800', flex: 1 },
  content: { padding: 20, paddingTop: 0, gap: 16 },
  text: { color: '#A8B0C2', fontSize: 14, lineHeight: 21 },
  card: { backgroundColor: '#1A1F2B', borderRadius: 16, padding: 16, gap: 8 },
  name: { color: '#F8FAFF', fontSize: 18, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  action: { paddingVertical: 12, paddingHorizontal: 4 },
  link: { color: '#C5F36A', fontSize: 15, fontWeight: '600' },
  delete: { color: '#FF9E9E', fontSize: 15 },
  vector: { color: '#F8FAFF', fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
});
