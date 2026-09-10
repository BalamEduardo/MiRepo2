function addGroceryItem(items, name, id = `${Date.now()}-${Math.random()}`) {
  const normalizedName = String(name ?? "").trim();

  if (!normalizedName) {
    return items;
  }

  const alreadyExists = items.some(
    (item) => item.name.toLowerCase() === normalizedName.toLowerCase(),
  );

  if (alreadyExists) {
    return items;
  }

  return [{ id, name: normalizedName, completed: false }, ...items];
}

function toggleGroceryItem(items, id) {
  return items.map((item) =>
    item.id === id ? { ...item, completed: !item.completed } : item,
  );
}

function removeCompletedItems(items) {
  return items.filter((item) => !item.completed);
}

module.exports = { addGroceryItem, toggleGroceryItem, removeCompletedItems };
