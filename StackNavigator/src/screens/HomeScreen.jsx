import React from "react";
import { View, Button } from "react-native";

export default function HomeScreen({ navigation }) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
            <Button
                title="Calcular IMC"
                onPress={() => navigation.navigate('IMC')}
            />

            <Button
                title="Convertir divisas"
                onPress={() => navigation.navigate("Divisas")}
            />

            <Button
                title="Calcular propina"
                onPress={() => navigation.navigate("Tips")}
            />
        </View>
    );
}