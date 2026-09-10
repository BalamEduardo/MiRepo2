import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getWinner } from "../utils/ticTacToe";
import { colors } from "../theme/colors";

const createEmptyBoard = () => Array(9).fill(null);

export default function TicTacToeScreen() {
  const [board, setBoard] = useState(createEmptyBoard);
  const [turn, setTurn] = useState("X");
  const winner = getWinner(board);

  const play = (index) => {
    if (board[index] || winner) {
      return;
    }

    const nextBoard = [...board];
    nextBoard[index] = turn;
    setBoard(nextBoard);

    if (!getWinner(nextBoard)) {
      setTurn(turn === "X" ? "O" : "X");
    }
  };

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setTurn("X");
  };

  const statusText = winner
    ? winner === "Empate"
      ? "La partida terminó en empate"
      : `Ganó el jugador ${winner}`
    : `Turno del jugador ${turn}`;

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>DOS JUGADORES · LOCAL</Text>
        <Text style={styles.title}>Tic Tac Toe</Text>
        <Text style={styles.status}>{statusText}</Text>

        <View style={styles.board}>
          {[0, 1, 2].map((row) => (
            <View key={row} style={styles.row}>
              {[0, 1, 2].map((column) => {
                const index = row * 3 + column;
                const value = board[index];

                return (
                  <Pressable
                    key={index}
                    accessibilityLabel={`Casilla ${index + 1}`}
                    accessibilityRole="button"
                    onPress={() => play(index)}
                    style={({ pressed }) => [styles.cell, pressed && !value && styles.cellPressed]}
                  >
                    <Text style={[styles.cellText, value === "X" ? styles.x : styles.o]}>{value}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <Text style={[styles.legendSymbol, styles.x]}>X</Text>
            <Text style={styles.legendText}>Jugador 1</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={[styles.legendSymbol, styles.o]}>O</Text>
            <Text style={styles.legendText}>Jugador 2</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={resetGame}
          style={({ pressed }) => [styles.resetButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.resetText}>Reiniciar partida</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    alignItems: "center",
    flex: 1,
    padding: 24,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 10,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 5,
  },
  status: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 8,
  },
  board: {
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    elevation: 3,
    marginTop: 30,
    maxHeight: 340,
    maxWidth: 340,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    width: "100%",
  },
  row: {
    flex: 1,
    flexDirection: "row",
  },
  cell: {
    alignItems: "center",
    borderColor: colors.border,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
  },
  cellPressed: {
    backgroundColor: colors.primarySoft,
  },
  cellText: {
    fontSize: 55,
    fontWeight: "900",
  },
  x: {
    color: colors.primary,
  },
  o: {
    color: colors.orange,
  },
  legend: {
    flexDirection: "row",
    gap: 28,
    marginTop: 22,
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
  },
  legendSymbol: {
    fontSize: 18,
    fontWeight: "900",
    marginRight: 6,
  },
  legendText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  resetButton: {
    backgroundColor: colors.primaryDark,
    borderRadius: 14,
    marginTop: 30,
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
