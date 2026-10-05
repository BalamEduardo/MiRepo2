import { formatMoney, totalCentsFor } from './amounts';
import { allocatedCentsFor, CATEGORIES } from './budget';
import { expenseSummaryFor } from './expenses';
import { HOLDINGS } from './holdings';

function formatDate(value, includeTime = false) {
  return new Date(value).toLocaleString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function snapshotShareText(snapshot) {
  const { spent, remaining, overspent, estimated, projected } = expenseSummaryFor(snapshot);
  const lines = [
    'DineroMio · Corte semanal',
    `Fecha: ${formatDate(snapshot.createdAt)}`,
    'Moneda: MXN',
    '', 'SALDOS REGISTRADOS',
    ...HOLDINGS.map(({ key, label }) => `${label}: ${formatMoney(snapshot.values[key])}`),
    `Total original del corte: ${formatMoney(totalCentsFor(snapshot.values))}`,
    '', 'PRESUPUESTO PLANEADO',
  ];
  if (snapshot.budget) {
    lines.push(`Monto planeado: ${formatMoney(snapshot.budget.amountCents)}`);
    if (snapshot.budget.categories) {
      lines.push('Reparto por categorías:', ...CATEGORIES.map(({ key, label }) =>
        `${label}: ${formatMoney(snapshot.budget.categories[key] ?? 0)}`));
      lines.push(`Sin asignar: ${formatMoney(snapshot.budget.amountCents - allocatedCentsFor(snapshot.budget))}`);
    } else {
      lines.push('Sin reparto por categorías.');
    }
  } else {
    lines.push('Sin presupuesto.');
  }
  lines.push('', 'GASTOS ANOTADOS');
  const expenses = [...(snapshot.expenses ?? [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (!expenses.length) lines.push('Sin gastos anotados.');
  expenses.forEach((expense) => {
    const category = CATEGORIES.find(({ key }) => key === expense.category)?.label ?? 'Otros';
    lines.push(`${formatDate(expense.createdAt, true)} · ${category} · ${formatMoney(expense.amountCents)}`);
    if (expense.description) lines.push(`Descripción: ${expense.description}`);
  });
  lines.push('', 'ESTIMACIONES DEL PERIODO', `Total gastado: ${formatMoney(spent)}`);
  if (snapshot.budget) {
    lines.push(`Presupuesto restante: ${formatMoney(remaining)}`);
    if (overspent > 0) lines.push(`Exceso de presupuesto: ${formatMoney(overspent)}`);
  } else {
    lines.push('Presupuesto restante: no aplica (sin presupuesto).');
  }
  lines.push(`Total estimado según gastos anotados: ${formatMoney(estimated)}`,
    `Total previsto después del presupuesto restante: ${formatMoney(projected)}`,
    '', 'Las estimaciones no cambian los saldos registrados. Cada gasto se descuenta una sola vez.',
    'No incluyen ingresos, transferencias ni cambios de inversiones posteriores al corte.');
  return lines.join('\n');
}
