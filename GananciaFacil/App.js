import React, { useEffect } from 'react';
import { Appearance } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppIcon from './src/components/AppIcon';
import CaptureScreen from './src/screens/CaptureScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import HomeScreen from './src/screens/HomeScreen';
import { SnapshotProvider } from './src/context/SnapshotContext';
import { palette } from './src/theme';

const Tabs = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs({ palette }) {
  return (
    <Tabs.Navigator
      initialRouteName="Inicio"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: palette.tint,
        tabBarInactiveTintColor: palette.secondary,
        tabBarStyle: {
          minHeight: 62,
          paddingTop: 6,
          paddingBottom: 7,
          backgroundColor: palette.surface,
          borderTopColor: palette.separator,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          lineHeight: 15,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => (
          <AppIcon
            name={route.name === 'Inicio' ? 'home' : 'history'}
            color={color}
            size={size}
          />
        ),
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tabs.Screen
        name="Inicio"
        component={HomeScreen}
        options={{ tabBarLabel: 'Inicio', tabBarAccessibilityLabel: 'Pestaña Inicio' }}
      />
      <Tabs.Screen
        name="Historial"
        component={HistoryScreen}
        options={{ tabBarLabel: 'Historial', tabBarAccessibilityLabel: 'Pestaña Historial' }}
      />
    </Tabs.Navigator>
  );
}

function AppNavigation() {
  const baseTheme = DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.separator,
      primary: palette.tint,
      notification: palette.dateMark,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName="Pestanas"
        screenOptions={{
          contentStyle: { backgroundColor: palette.background },
          headerTintColor: palette.tint,
          headerBackTitle: 'Atrás',
          headerShadowVisible: false,
          gestureEnabled: true,
        }}
      >
        <Stack.Screen
          name="Pestanas"
          options={{ headerShown: false }}
        >
          {() => <MainTabs palette={palette} />}
        </Stack.Screen>
        <Stack.Screen
          name="Corte"
          component={CaptureScreen}
          options={({ route }) => ({
            title: route.params?.snapshotId ? 'Editar corte' : 'Nuevo corte',
            headerShown: false,
            presentation: 'formSheet',
            sheetAllowedDetents: [0.88, 1],
            sheetInitialDetentIndex: 0,
            sheetGrabberVisible: true,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    Appearance.setColorScheme('light');
    return () => Appearance.setColorScheme('unspecified');
  }, []);
  return (
    <SafeAreaProvider>
      <SnapshotProvider>
        <AppNavigation />
      </SnapshotProvider>
    </SafeAreaProvider>
  );
}
