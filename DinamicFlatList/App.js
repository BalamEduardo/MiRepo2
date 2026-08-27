import React, {useState} from 'react';
import { StyleSheet, Text, TouchableOpacity, View, SafeAreaView, FlatList } from 'react-native';
import CustomModal  from './componentes/CustomModal'; 


const Cursos = [
  {id: "1", titulo: "Programacion movil", duracion: "10 horas", rating: "4.8"},
  {id: "2", titulo: "IA para ingenieros", duracion: "20 horas", rating: "4.9"},
  {id: "3", titulo: "Aplicaciones web", duracion: "18 horas", rating: "4.2"},
  {id: "4", titulo: "Base de datos", duracion: "15 horas", rating: "4.6"},
  {id: "5", titulo: "Office", duracion: "30 horas", rating: "4.6"},

];

export default function App() {
  const [modalVisible, setModalVisible] = useState(false);
  const [CursoSeleccionado, setCursoSeleccionado] = useState(null);

  const manejarPresionCurso = (tituloCurso) => {
    setCursoSeleccionado({valor: tituloCurso});
    setModalVisible(true);
  }

  const renderCard = ({item}) => {
    <TouchableOpacity
      onPress={()=>manejarPresionCurso(item.titulo)}
      activeOpacity={0.7}
    >
      <View>

        <Text style={styles.title}> {item.titulo} </Text>
        <Text> {item.duracion} | {item.rating} </Text>
      
      </View>

    </TouchableOpacity>
  };


  return (
    <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Mis cursos</Text>
        <FlatList

          data={Cursos}
          renderItem={renderCard}
          keyExtractor={item=>item.id}
          contentContainerStyle={styles.listContainer }

        />

        <CustomModal
        
          visible={modalVisible}
          onClose={()=>setModalVisible(false)}
          contenido={CursoSeleccionado}

        />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  header: {
    fontSize: 24,   
    fontWeight: "600",
    padding: 16,
    backgroundColor: "rgb(230, 246, 255)"
  },

  listContainer: {
    paddingHorizontal: 16, 
    paddingBottom: 16,

  },

  card: {
    backgroundColor: "white",
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,

  },

  subtitle: {
    fontSize:14,
    color: "#aaa",

  },

});
