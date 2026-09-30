import { HOLDINGS } from './holdings';

export const MAX_AMOUNT_CENTS = Math.floor(Number.MAX_SAFE_INTEGER / HOLDINGS.length);

export function parseAmountToCents(value) {
  const normalized = String(value ?? '').trim().replace(',', '.');
  const match = normalized.match(/^(-)?(?:(\d+)(?:\.(\d{0,2}))?|\.(\d{1,2}))$/);

  if (!match) {
    return Number.NaN;
  }

  const wholePart = match[2] || '0';
  const decimalPart = match[3] ?? match[4] ?? '';
  const cents = Number(wholePart) * 100 + Number(`${decimalPart}00`.slice(0, 2));

  if (!Number.isSafeInteger(cents) || cents > MAX_AMOUNT_CENTS) {
    return Number.NaN;
  }

  return match[1] ? -cents : cents;
}

export function getAmountError(value) {
  const input = String(value ?? '').trim();

  if (!input) {
    return 'Escribe un monto. Si no tienes saldo, escribe 0.';
  }

  const normalized = input.replace(',', '.');
  const decimalPart = normalized.split('.')[1] || '';

  if (decimalPart.length > 2) {
    return 'Usa como máximo 2 decimales.';
  }

  const cents = parseAmountToCents(input);

  if (!Number.isFinite(cents)) {
    return 'Escribe un monto válido, por ejemplo 1250.50.';
  }

  if (normalized.startsWith('-') || cents < 0) {
    return 'El saldo no puede ser menor que cero.';
  }

  return '';
}

export function formatCentsForInput(cents) {
  const amount = Number(cents);

  if (!Number.isSafeInteger(amount) || amount < 0) {
    return '';
  }

  const pesos = Math.floor(amount / 100);
  const fraction = String(amount % 100).padStart(2, '0');

  return fraction === '00' ? String(pesos) : `${pesos}.${fraction}`;
}

export function formatMoney(cents) {
  const amount = Number(cents);

  if (!Number.isSafeInteger(amount)) {
    return '$0.00';
  }

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

export function formatSignedMoney(cents) {
  const amount = Number(cents);

  if (!Number.isSafeInteger(amount) || amount === 0) {
    return formatMoney(0);
  }

  const sign = amount > 0 ? '+' : '−';
  return `${sign}${formatMoney(Math.abs(amount))}`;
}

export function formatShare(valueCents, totalCents) {
  if (!Number.isSafeInteger(valueCents) || !Number.isSafeInteger(totalCents) || totalCents <= 0) {
    return '0 %';
  }

  const share = (valueCents / totalCents) * 100;
  const label = new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: share > 0 && share < 10 ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(share);

  return `${label} %`;
}

export function totalCentsFor(values = {}) {
  return HOLDINGS.reduce((total, holding) => {
    const amount = Number(values[holding.key]);
    return total + (Number.isSafeInteger(amount) && amount >= 0 ? amount : 0);
  }, 0);
}

export function formatLongDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  const label = date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

export function formatShortDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  return date.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function sortedNewestFirst(snapshots = []) {
  return [...snapshots].sort((first, second) => (
    new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  ));
}

export function precedingSnapshot(snapshots = [], snapshotId) {
  const ordered = [...snapshots].sort((first, second) => (
    new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
  ));
  const currentIndex = ordered.findIndex((snapshot) => snapshot.id === snapshotId);

  return currentIndex > 0 ? ordered[currentIndex - 1] : null;
}

export function precedingSnapshotsById(snapshots = []) {
  const ordered = [...snapshots].sort((first, second) => (
    new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
  ));
  const previousById = new Map();

  ordered.forEach((snapshot, index) => {
    previousById.set(snapshot.id, index > 0 ? ordered[index - 1] : null);
  });

  return previousById;
}
