import { formatCentsForInput, getAmountError, parseAmountToCents } from './amounts';

export const CASH_KEYS = ['santander', 'nu', 'openbank', 'gbmCash'];
export const CATEGORIES = [
  { key: 'super', label: 'Súper' },
  { key: 'comida', label: 'Comida' },
  { key: 'cena', label: 'Cena' },
  { key: 'gustos', label: 'Gustos' },
  { key: 'otros', label: 'Otros' },
];

export function cashCentsFor(values) {
  return CASH_KEYS.reduce((sum, key) => sum + (values[key] || 0), 0);
}

export function allocatedCentsFor(budget) {
  return CATEGORIES.reduce((sum, { key }) => sum + (budget?.categories?.[key] || 0), 0);
}

export function budgetDraftFor(budget) {
  return {
    enabled: Boolean(budget),
    amount: budget ? formatCentsForInput(budget.amountCents) : '',
    distribute: Boolean(budget?.categories),
    categories: Object.fromEntries(CATEGORIES.map(({ key }) => [
      key, budget?.categories ? formatCentsForInput(budget.categories[key]) : '',
    ])),
  };
}

export function validateBudgetDraft(draft, cashCents) {
  if (!draft.enabled) return { budget: null, errors: {} };

  const errors = {};
  const amountError = getAmountError(draft.amount);
  const amountCents = parseAmountToCents(draft.amount);
  if (amountError) errors.budgetAmount = amountError;
  else if (amountCents > cashCents) errors.budgetAmount = 'El monto supera tu dinero en cuentas. Reduce el presupuesto.';

  const categories = draft.distribute ? {} : null;
  if (categories) {
    CATEGORIES.forEach(({ key }) => {
      const input = draft.categories[key].trim() || '0';
      const error = getAmountError(input);
      if (error) errors[key] = error;
      categories[key] = parseAmountToCents(input);
    });
    if (!Object.keys(errors).length && allocatedCentsFor({ categories }) > amountCents) {
      errors.distribution = 'Las categorías superan el monto apartado. Reduce alguna cantidad.';
    }
  }

  return { budget: { amountCents, categories }, errors };
}

// Also validate persisted data and callers outside the form before writing.
export function validateStoredBudget(budget, cashCents) {
  if (budget == null) return null;
  if (!Number.isSafeInteger(budget.amountCents) || budget.amountCents < 0 || budget.amountCents > cashCents) {
    throw new Error('El presupuesto supera el dinero en cuentas o no es válido.');
  }
  const categories = budget.categories == null ? null : {};
  if (categories) {
    for (const { key } of CATEGORIES) {
      const amount = budget.categories[key];
      if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('Una categoría del presupuesto no es válida.');
      categories[key] = amount;
    }
    if (allocatedCentsFor({ categories }) > budget.amountCents) throw new Error('Las categorías superan el presupuesto.');
  }
  return { amountCents: budget.amountCents, categories };
}
