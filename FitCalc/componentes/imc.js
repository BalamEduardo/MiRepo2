import React, { useState } from "react";
import { View, TextInput, StyleSheet, Text, Pressable } from "react-native";

import ResultadoIMC from "./resultadoIMC";

const IMC = () => {

    const [peso, setPeso] = useState("");
    const [altura, setAltura] = useState("");
    const [modal, setModal] = useState(false);
    const [resultado, setResultado] = useState("");

    const calcularIMC = () => {

        const imc = peso / (altura * altura);

        setResultado(imc);

        setModal(true);
    };

    return (
        <View style={styles.container}>

            <Text style={styles.titulo}>
                Calculadora de IMC
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Peso"
                value={peso}
                onChangeText={setPeso}
            />

            <TextInput
                style={styles.input}
                placeholder="Altura"
                value={altura}
                onChangeText={setAltura}
            />

            <Pressable
                style={({ pressed }) => [
                    styles.boton,
                    pressed && styles.botonPresionado
                ]}
                onPress={calcularIMC}
            >
                <Text>
                    Calcular IMC
                </Text>
            </Pressable>

            <ResultadoIMC
                visible={modal}
                resultado={resultado}
                cerrar={() => setModal(false)}
            />

        </View>
    );
};

const styles = StyleSheet.create({

    container: {
        flex: 1,
        justifyContent: "center",
        padding: 30,
    },

    input: {
        borderWidth: 1,
        padding: 10,
        marginBottom: 20,
    },

    titulo: {
        paddingBottom: 20,
        color: "black",
        fontSize: 25,
    },

    boton: {
        borderWidth: 1,
        padding: 10,
        alignItems: "center",
        backgroundColor: "white",
    },

    botonPresionado: {
        backgroundColor: "blue",
    },

});

export default IMC;