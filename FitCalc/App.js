import React from "react";
import { View, StyleSheet } from "react-native";

import IMC from "./componentes/imc";

export default function App() {
    return (
        <View style={styles.container}>
            <IMC />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
    },
});