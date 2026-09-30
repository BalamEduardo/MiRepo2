export const HOLDINGS = [
  {
    key: 'santander',
    label: 'Santander',
    group: 'Efectivo y bancos',
    symbol: 'bank',
  },
  {
    key: 'nu',
    label: 'Nu',
    group: 'Efectivo y bancos',
    symbol: 'bank',
  },
  {
    key: 'openbank',
    label: 'Openbank',
    group: 'Efectivo y bancos',
    symbol: 'bank',
  },
  {
    key: 'gbmCash',
    label: 'GBM sin invertir',
    description: 'Solo efectivo disponible',
    group: 'Efectivo y bancos',
    symbol: 'cash',
  },
  {
    key: 'vti',
    label: 'VTI',
    description: 'Valor actual de la posición',
    group: 'Inversiones',
    symbol: 'fund',
  },
  {
    key: 'vxus',
    label: 'VXUS',
    description: 'Valor actual de la posición',
    group: 'Inversiones',
    symbol: 'globe',
  },
  {
    key: 'btc',
    label: 'BTC',
    description: 'Valor actual de la posición',
    group: 'Inversiones',
    symbol: 'bitcoin',
  },
];

export const HOLDING_GROUPS = ['Efectivo y bancos', 'Inversiones'];

export function emptyValues() {
  return Object.fromEntries(HOLDINGS.map(({ key }) => [key, '']));
}
