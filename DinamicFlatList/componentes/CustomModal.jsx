import React from "react";
import { Modal, View, Text, Button, StyleSheet } from "react-native";

const customModal = ({ visible, onClose, contenido }) => {

    return (

        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >

            <View>

                <View>

                    <Text>
                        Hola, te has inscrito al curso: {contenido ? contenido.valor: "Ninguno"} 
                    </Text>

                    <Button
                        tittle="Cerrar"
                        onPress={onClose}
                    />


                </View>


            </View>


        </Modal>

    );


};

const styles = StyleSheet.create({

    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },

    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 16,
        padding: 35,
        alignItems: "center",

    },

    modalText: {
        marginBottom: 20, 
        textAlign: "center",
        fontSize: 16,
        color: "#180606"

    },

});

export default customModal;