import { getAmountError, parseAmountToCents, totalCentsFor, MAX_AMOUNT_CENTS } from './amounts';
import { CATEGORIES } from './budget';

export function getExpenseAmountError(value) {
  if (!String(value ?? '').trim()) return 'Escribe el monto del gasto.';
  const error = getAmountError(value);
  if (error) return error.replace('El saldo', 'El gasto');
  return parseAmountToCents(value) <= 0 ? 'El gasto debe ser mayor que cero.' : '';
}

export function validateStoredExpenses(value = []) {
  if (!Array.isArray(value)) throw new Error('Los gastos guardados no son válidos.');
  const ids = new Set();
  const expenses = value.map((expense) => {
    if (!expense || typeof expense.id !== 'string' || ids.has(expense.id)
      || !Number.isSafeInteger(expense.amountCents) || expense.amountCents <= 0 || expense.amountCents > MAX_AMOUNT_CENTS
      || !CATEGORIES.some(({ key }) => key === expense.category)
      || typeof expense.description !== 'string' || expense.description.length > 160
      || typeof expense.createdAt !== 'string' || Number.isNaN(new Date(expense.createdAt).getTime())) {
      throw new Error('Uno de los gastos no es válido.');
    }
    ids.add(expense.id);
    return { id: expense.id, amountCents: expense.amountCents, category: expense.category,
      description: expense.description.trim(), createdAt: expense.createdAt };
  });
  if (!Number.isSafeInteger(spentCentsFor(expenses))) throw new Error('El total de gastos es demasiado grande.');
  return expenses;
}

export function spentCentsFor(expenses = []) {
  return expenses.reduce((total, expense) => total + expense.amountCents, 0);
}

export function expenseSummaryFor(snapshot) {
  const spent = spentCentsFor(snapshot.expenses);
  const budget = snapshot.budget?.amountCents ?? 0;
  const remaining = Math.max(budget - spent, 0);
  const estimated = totalCentsFor(snapshot.values) - spent;
  return { spent, remaining, estimated, projected: estimated - remaining,
    overspent: snapshot.budget ? Math.max(spent - budget, 0) : 0 };
}
