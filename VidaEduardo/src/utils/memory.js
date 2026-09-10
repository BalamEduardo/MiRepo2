function shuffle(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function createMemoryDeck(values = ["🍎", "🌈", "🚀", "🎸", "🐶", "⚽"]) {
  const pairs = values.flatMap((value) => [value, value]);

  return shuffle(pairs).map((value, index) => ({
    id: `${value}-${index}`,
    value,
    revealed: false,
    matched: false,
  }));
}

function evaluateMemoryPair(firstCard, secondCard) {
  return Boolean(firstCard && secondCard && firstCard.value === secondCard.value);
}

module.exports = { createMemoryDeck, evaluateMemoryPair };
