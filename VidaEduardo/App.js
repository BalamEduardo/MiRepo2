import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import * as NativeSplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import RootNavigator from "./src/navigation/RootNavigator";
import { colors } from "./src/theme/colors";

NativeSplashScreen.preventAutoHideAsync().catch(() => {});

function AnimatedSplashScreen({ onFinish }) {
  const scale = useRef(new Animated.Value(0.65)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const position = useRef(new Animated.Value(34)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(position, {
        toValue: 0,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        onFinish();
      }
    });

    return () => animation.stop();
  }, [onFinish, opacity, position, scale]);

  return (
    <View style={styles.splash}>
      <Animated.View
        style={{
          opacity,
          transform: [{ translateY: position }, { scale }],
        }}
      >
        <Text style={styles.splashIcon}>✦</Text>
      </Animated.View>
      <Animated.Text style={[styles.splashTitle, { opacity }]}>VidaEduardo</Animated.Text>
      <Animated.Text style={[styles.splashSubtitle, { opacity }]}>Tu espacio para vivir mejor</Animated.Text>
    </View>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const finishLoading = useCallback(() => {
    NativeSplashScreen.hideAsync().catch(() => {});
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <>
        <StatusBar style="light" />
        <AnimatedSplashScreen onFinish={finishLoading} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </>
  );
}

const styles = StyleSheet.create({
  splash: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    flex: 1,
    justifyContent: "center",
  },
  splashIcon: {
    color: "#A5B4FC",
    fontSize: 92,
    fontWeight: "300",
    textAlign: "center",
  },
  splashTitle: {
    color: colors.white,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0.4,
    marginTop: 8,
  },
  splashSubtitle: {
    color: "#C7D2FE",
    fontSize: 14,
    marginTop: 8,
  },
});
