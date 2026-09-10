import React, { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createMemoryDeck, evaluateMemoryPair } from "../utils/memory";
import { colors } from "../theme/colors";

export default function MemoryScreen() {
  const { width } = useWindowDimensions();
  const [deck, setDeck] = useState(createMemoryDeck);
  const [flipped, setFlipped] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const timeoutRef = useRef(null);
  const cardSize = Math.max(72, Math.min(104, Math.floor((width - 72) / 3)));
  const matchedPairs = deck.filter((card) => card.matched).length / 2;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const resetGame = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setDeck(createMemoryDeck());
    setFlipped([]);
    setAttempts(0);
    setIsBusy(false);
  };

  const revealCard = (index) => {
    const card = deck[index];

    if (isBusy || !card || card.revealed || card.matched || flipped.length === 2) {
      return;
    }

    const nextDeck = deck.map((item, itemIndex) =>
      itemIndex === index ? { ...item, revealed: true } : item,
    );
    const nextFlipped = [...flipped, index];

    setDeck(nextDeck);
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      const [firstIndex, secondIndex] = nextFlipped;
      const isMatch = evaluateMemoryPair(deck[firstIndex], deck[secondIndex]);
      setAttempts((currentAttempts) => currentAttempts + 1);
      setIsBusy(true);

      timeoutRef.current = setTimeout(() => {
        setDeck((currentDeck) =>
          currentDeck.map((item, itemIndex) => {
            if (itemIndex !== firstIndex && itemIndex !== secondIndex) {
              return item;
            }

            return {
              ...item,
              matched: isMatch || item.matched,
              revealed: isMatch,
            };
          }),
        );
        setFlipped([]);
        setIsBusy(false);
        timeoutRef.current = null;
      }, 650);
    }
  };

  const renderCard = ({ item, index }) => {
    const visible = item.revealed || item.matched;

    return (
      <Pressable
        accessibilityLabel={visible ? `Carta ${item.value}` : "Carta oculta"}
        accessibilityRole="button"
        onPress={() => revealCard(index)}
        style={({ pressed }) => [
          styles.card,
          { height: cardSize, width: cardSize },
          visible && styles.cardVisible,
          item.matched && styles.cardMatched,
          pressed && !visible && styles.cardPressed,
        ]}
      >
        <Text style={[styles.cardText, visible && styles.cardTextVisible]}>{visible ? item.value : "?"}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
      <FlatList
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        data={deck}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <Text style={styles.eyebrow}>ENCUENTRA LAS PAREJAS</Text>
            <Text style={styles.title}>Memorama</Text>
            <Text style={styles.subtitle}>Toca dos cartas para descubrir si combinan.</Text>

            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{matchedPairs}/6</Text>
                <Text style={styles.statLabel}>parejas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{attempts}</Text>
                <Text style={styles.statLabel}>intentos</Text>
              </View>
            </View>
          </View>
        }
        ListFooterComponent={
          <Pressable
            accessibilityRole="button"
            onPress={resetGame}
            style={({ pressed }) => [styles.resetButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.resetText}>Mezclar de nuevo</Text>
          </Pressable>
        }
        numColumns={3}
        renderItem={renderCard}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 28,
  },
  headerContent: {
    marginBottom: 18,
  },
  eyebrow: {
    color: "#EC4899",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 8,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 5,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  stats: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 19,
    padding: 15,
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    color: colors.primaryDark,
    fontSize: 20,
    fontWeight: "900",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    backgroundColor: colors.border,
    height: 30,
    width: 1,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 17,
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardVisible: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  cardMatched: {
    backgroundColor: "#D1FAE5",
    borderColor: colors.success,
  },
  cardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  cardText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "900",
  },
  cardTextVisible: {
    color: colors.text,
  },
  resetButton: {
    alignSelf: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: 14,
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  resetText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
});
