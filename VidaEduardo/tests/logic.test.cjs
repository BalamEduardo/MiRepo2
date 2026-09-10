const test = require("node:test");
const assert = require("node:assert/strict");

const { calculateImc, classifyImc } = require("../src/utils/imc");
const { getWinner } = require("../src/utils/ticTacToe");
const { createMemoryDeck, evaluateMemoryPair } = require("../src/utils/memory");
const {
  addGroceryItem,
  toggleGroceryItem,
  removeCompletedItems,
} = require("../src/utils/grocery");

test("calcula el IMC con peso en kg y altura en cm", () => {
  const resultado = calculateImc("70", "175");

  assert.equal(resultado.toFixed(1), "22.9");
  assert.equal(classifyImc(resultado).label, "Peso saludable");
});

test("rechaza datos de IMC vacíos, cero o no numéricos", () => {
  assert.equal(calculateImc("", "175"), null);
  assert.equal(calculateImc("70", "0"), null);
  assert.equal(calculateImc("peso", "175"), null);
});

test("detecta un ganador y un empate en Tic Tac Toe", () => {
  assert.equal(
    getWinner(["X", "X", "X", "O", null, "O", null, null, null]),
    "X",
  );
  assert.equal(
    getWinner(["X", "O", "X", "X", "O", "O", "O", "X", "X"]),
    "Empate",
  );
  assert.equal(getWinner(["X", null, "O", null, null, null, null, null, null]), null);
});

test("crea un mazo de Memorama con dos cartas de cada valor", () => {
  const deck = createMemoryDeck(["🌙", "⭐", "🍀"]);
  const values = deck.map((card) => card.value);

  assert.equal(deck.length, 6);
  assert.equal(new Set(deck.map((card) => card.id)).size, 6);
  assert.deepEqual(
    values.sort(),
    ["🌙", "🌙", "⭐", "⭐", "🍀", "🍀"].sort(),
  );
  assert.equal(evaluateMemoryPair(deck[0], { value: deck[0].value }), true);
  assert.equal(evaluateMemoryPair(deck[0], { value: "otro" }), false);
});

test("administra artículos del súper en memoria", () => {
  let items = addGroceryItem([], "  Leche  ", "leche");

  assert.deepEqual(items, [{ id: "leche", name: "Leche", completed: false }]);
  assert.equal(addGroceryItem(items, "leche", "duplicado"), items);

  items = toggleGroceryItem(items, "leche");
  assert.equal(items[0].completed, true);
  assert.deepEqual(removeCompletedItems(items), []);
});
