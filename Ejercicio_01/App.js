import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Cat from './Componentes/cat';
import Mensaje from './componentes/mensajes';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <Text style={styles.texto_rojo}> Esto es otro componente de texto </Text>
      <Text style={styles.texto_azul}> Esto es un mensaje en azul </Text>
      <StatusBar style="auto" />
      <Mensaje style={styles.texto_azul} msg="Hola, soy un mensaje desde el componente Mensajes" num={1000}></Mensaje>
      <Cat></Cat>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto_rojo: {
    color: 'red',
  },
  texto_azul: {
    color: 'blue',
    backgroundColor: 'yellow',
  },

});
