import React, { useState } from "react";
import {View,StyleSheet,Button,SafeAreaView,Text,} from "react-native";

import CustomModal from "./componentes/CustomModal";
import SectionListBasics from "./componentes/SectionList";
import FlatListBasics from "./componentes/Flatlist";

export default function App() {

  const [modalVisible, setModalVisible] = useState(false);

  const objetoContenido = {
    valor: "Juan Perez",
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.content}>

        <Button
          title="Ver mensaje"
          onPress={() => setModalVisible(true)}
        />

        <CustomModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          contenido={objetoContenido}
        />

        <Text style={styles.titulo}>SectionList</Text>

        <View style={styles.lista}>
          <SectionListBasics />
        </View>

        <Text style={styles.titulo}>FlatList</Text>

        <View style={styles.lista}>
          <FlatListBasics />
        </View>

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  content: {
    flex: 1,
  },

  lista: {
    flex: 1,
  },

  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
});