import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import DemoImagen from './componentes/DemoImagen';

export default function App() {
  return (
    <View style={styles.container}>
      <DemoImagen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#db8edc',
  },
  panel1:{
    flex:1,
    backgroundColor:'#616cff',
  },
  panel2:{
    flex:1,
    backgroundColor:'#9d9dff',
  },
  panel3:{
    flex:1,
    backgroundColor:'#d5d0ff',
  },

});
