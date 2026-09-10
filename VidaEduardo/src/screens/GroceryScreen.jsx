import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { addGroceryItem, removeCompletedItems, toggleGroceryItem } from "../utils/grocery";
import { colors } from "../theme/colors";

export default function GroceryScreen() {
  const [items, setItems] = useState([]);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const completedCount = useMemo(() => items.filter((item) => item.completed).length, [items]);

  const addItem = () => {
    const updatedItems = addGroceryItem(items, input);

    if (updatedItems === items) {
      setMessage(input.trim() ? "Ese artículo ya está en tu lista." : "Escribe un artículo primero.");
      return;
    }

    setItems(updatedItems);
    setInput("");
    setMessage("");
  };

  const toggleItem = (id) => {
    setItems((currentItems) => toggleGroceryItem(currentItems, id));
  };

  const deleteItem = (id) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  };

  const clearCompleted = () => {
    setItems((currentItems) => removeCompletedItems(currentItems));
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemRow}>
      <Pressable
        accessibilityLabel={`Marcar ${item.name}`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.completed }}
        onPress={() => toggleItem(item.id)}
        style={[styles.check, item.completed && styles.checkCompleted]}
      >
        <Text style={styles.checkMark}>{item.completed ? "✓" : ""}</Text>
      </Pressable>
      <Pressable onPress={() => toggleItem(item.id)} style={styles.itemNameButton}>
        <Text style={[styles.itemName, item.completed && styles.itemNameCompleted]}>{item.name}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={`Eliminar ${item.name}`}
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => deleteItem(item.id)}
        style={styles.deleteButton}
      >
        <Text style={styles.deleteText}>×</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={items}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>Tu lista está vacía</Text>
            <Text style={styles.emptyText}>Agrega lo que necesitas para tu próxima visita al súper.</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {items.length > 0 ? (
              <Pressable onPress={clearCompleted} style={styles.clearCompletedButton}>
                <Text style={styles.clearCompletedText}>Quitar comprados ({completedCount})</Text>
              </Pressable>
            ) : null}
            <Text style={styles.memoryNote}>Se guarda solo en memoria mientras la app está abierta.</Text>
          </View>
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.eyebrow}>ORGANIZA TUS COMPRAS</Text>
            <Text style={styles.title}>Lista del súper</Text>
            <Text style={styles.subtitle}>Tacha cada cosa conforme la encuentres.</Text>

            <View style={styles.addRow}>
              <TextInput
                autoCapitalize="sentences"
                onChangeText={(value) => {
                  setInput(value);
                  if (message) {
                    setMessage("");
                  }
                }}
                onSubmitEditing={addItem}
                placeholder="Ej. tortillas"
                placeholderTextColor="#94A3B8"
                returnKeyType="done"
                style={styles.input}
                value={input}
              />
              <Pressable
                accessibilityLabel="Agregar artículo"
                accessibilityRole="button"
                onPress={addItem}
                style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.addButtonText}>+</Text>
              </Pressable>
            </View>
            {message ? <Text style={styles.message}>{message}</Text> : null}

            {items.length > 0 ? (
              <View style={styles.counterRow}>
                <Text style={styles.counter}>{items.length} artículos</Text>
                <Text style={styles.counter}>{completedCount} comprados</Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={renderItem}
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
    paddingBottom: 30,
  },
  eyebrow: {
    color: colors.orange,
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
  addRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 22,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 15,
    marginRight: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: colors.orange,
    borderRadius: 13,
    height: 49,
    justifyContent: "center",
    width: 49,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 30,
    fontWeight: "300",
    lineHeight: 31,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  message: {
    color: colors.orange,
    fontSize: 12,
    marginTop: 8,
  },
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 22,
  },
  counter: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  itemRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    flexDirection: "row",
    marginBottom: 10,
    minHeight: 62,
    paddingHorizontal: 14,
  },
  check: {
    alignItems: "center",
    borderColor: colors.orange,
    borderRadius: 8,
    borderWidth: 2,
    height: 25,
    justifyContent: "center",
    marginRight: 12,
    width: 25,
  },
  checkCompleted: {
    backgroundColor: colors.orange,
  },
  checkMark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
  },
  itemNameButton: {
    flex: 1,
    paddingVertical: 8,
  },
  itemName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  itemNameCompleted: {
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  deleteButton: {
    padding: 5,
  },
  deleteText: {
    color: colors.textMuted,
    fontSize: 25,
    fontWeight: "300",
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginTop: 16,
    padding: 28,
  },
  emptyIcon: {
    fontSize: 38,
    marginBottom: 10,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    paddingTop: 8,
  },
  clearCompletedButton: {
    padding: 8,
  },
  clearCompletedText: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: "800",
  },
  memoryNote: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 10,
    textAlign: "center",
  },
});
