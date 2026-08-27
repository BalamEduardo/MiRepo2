import React from "react";
import {Modal,View,Text,Button,StyleSheet} from "react-native";

const ResultadoIMC = ({ visible, resultado, cerrar }) => {

    return (
         <Modal
            visible={visible}
            transparent={true}
            
        >

            <View style={styles.fondo}>

                <View style={styles.dialogo}>

                    <Text style={styles.texto}>
                        Tu IMC es: {resultado}
                    </Text>

                    <Button
                        title="Cerrar"
                        onPress={cerrar}
                    />

                </View>

            </View>

        </Modal>
    );
};

const styles = StyleSheet.create({

    fondo: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },

    dialogo: {
        backgroundColor: "white",
        padding: 40,
        borderRadius: 10,
        width: 300,
        alignItems: "center",
    },

    texto: {
        fontSize: 20,
        marginBottom: 20,
    },

});

export default ResultadoIMC;