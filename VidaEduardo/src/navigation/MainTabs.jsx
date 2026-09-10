import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeScreen from "../screens/HomeScreen";
import ImcScreen from "../screens/ImcScreen";
import MemoryScreen from "../screens/MemoryScreen";
import TicTacToeScreen from "../screens/TicTacToeScreen";
import GroceryScreen from "../screens/GroceryScreen";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();

const tabIcons = {
  Resumen: "home-outline",
  "Tic Tac Toe": "grid-outline",
  Memorama: "albums-outline",
  IMC: "fitness-outline",
  "Súper": "cart-outline",
};

function DrawerButton({ navigation }) {
  return (
    <Pressable
      accessibilityLabel="Abrir menú"
      accessibilityRole="button"
      hitSlop={12}
      onPress={() => navigation.getParent()?.openDrawer()}
      style={styles.drawerButton}
    >
      <Ionicons color={colors.white} name="menu" size={28} />
    </Pressable>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ navigation, route }) => ({
        headerLeft: () => <DrawerButton navigation={navigation} />,
        headerShown: true,
        headerStyle: styles.header,
        headerTintColor: colors.white,
        headerTitleStyle: styles.headerTitle,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ color, size }) => (
          <Ionicons color={color} name={tabIcons[route.name]} size={size || 22} />
        ),
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
      })}
    >
      <Tab.Screen name="Resumen" component={HomeScreen} options={{ title: "Vida Eduardo" }} />
      <Tab.Screen
        name="Tic Tac Toe"
        component={TicTacToeScreen}
        options={{ tabBarLabel: "Tateti", title: "Tic Tac Toe" }}
      />
      <Tab.Screen name="Memorama" component={MemoryScreen} options={{ title: "Memorama" }} />
      <Tab.Screen name="IMC" component={ImcScreen} options={{ title: "Calcular IMC" }} />
      <Tab.Screen name="Súper" component={GroceryScreen} options={{ title: "Lista del súper" }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primaryDark,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
  },
  drawerButton: {
    marginLeft: 18,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 5,
    paddingTop: 3,
  },
  tabItem: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 0,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: "700",
    marginTop: -1,
  },
});
