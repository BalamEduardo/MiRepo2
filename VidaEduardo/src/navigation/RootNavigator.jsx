import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";

import AboutScreen from "../screens/AboutScreen";
import GroceryScreen from "../screens/GroceryScreen";
import ImcScreen from "../screens/ImcScreen";
import MainTabs from "./MainTabs";
import MemoryScreen from "../screens/MemoryScreen";
import TicTacToeScreen from "../screens/TicTacToeScreen";
import { colors } from "../theme/colors";

const Drawer = createDrawerNavigator();

const drawerIcons = {
  Inicio: "home-outline",
  "Tic Tac Toe": "grid-outline",
  Memorama: "albums-outline",
  IMC: "fitness-outline",
  "Súper": "cart-outline",
  "Acerca de": "information-circle-outline",
};

const drawerIcon = (name) => ({ color, size }) => (
  <Ionicons color={color} name={name} size={size} />
);

const moduleHeaderOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.primaryDark },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: "800" },
};

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        initialRouteName="Inicio"
        screenOptions={{
          headerShown: false,
          drawerActiveTintColor: colors.primary,
          drawerInactiveTintColor: colors.textMuted,
          drawerLabelStyle: {
            fontSize: 15,
            fontWeight: "700",
          },
          drawerStyle: {
            backgroundColor: colors.surface,
            width: 286,
          },
        }}
      >
        <Drawer.Screen
          name="Inicio"
          component={MainTabs}
          options={{ title: "Inicio", drawerIcon: drawerIcon(drawerIcons.Inicio) }}
        />
        <Drawer.Screen
          name="Tic Tac Toe"
          component={TicTacToeScreen}
          options={{ ...moduleHeaderOptions, title: "Tic Tac Toe", drawerIcon: drawerIcon(drawerIcons["Tic Tac Toe"]) }}
        />
        <Drawer.Screen
          name="Memorama"
          component={MemoryScreen}
          options={{ ...moduleHeaderOptions, title: "Memorama", drawerIcon: drawerIcon(drawerIcons.Memorama) }}
        />
        <Drawer.Screen
          name="IMC"
          component={ImcScreen}
          options={{ ...moduleHeaderOptions, title: "Calcular IMC", drawerIcon: drawerIcon(drawerIcons.IMC) }}
        />
        <Drawer.Screen
          name="Súper"
          component={GroceryScreen}
          options={{ ...moduleHeaderOptions, title: "Lista del súper", drawerIcon: drawerIcon(drawerIcons["Súper"]) }}
        />
        <Drawer.Screen
          name="Acerca de"
          component={AboutScreen}
          options={{
            ...moduleHeaderOptions,
            title: "Acerca de",
            drawerIcon: drawerIcon(drawerIcons["Acerca de"]),
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
