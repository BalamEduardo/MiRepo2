# DineroMio

- Expo SDK 57 project using JavaScript and React Navigation, targeting Expo Go on iPhone.
- Product behavior and privacy constraints are recorded in `PRODUCT.md`.
- Keep Inicio and Historial as tabs; Presupuesto and Detalle del corte are full navigation screens. Present capture/edit and the expense ledger as sheets.
- Store weekly cuts locally on the device. Do not add a backend, account login, cloud sync, live quotes, or imported financial history.
- Track Santander, Nu, Openbank, GBM cash, VTI, VXUS, and BTC separately in MXN.
- Validate every entered amount before saving; accept comma or period decimals and prevent unexpected closures.
- Keep copy in Spanish and use a fixed light theme, and respect iOS safe areas, system navigation, and Reduce Motion.
- Manual verification only; do not add automated tests.

- Budgets are optional and saved with each cut. Only banks and GBM cash form the budget base; category allocations cannot exceed the reserved amount.
- A supporting expense sheet records, edits and deletes local expenses per cut. Expenses affect estimates only; a new cut starts an empty expense period.
- Keep the budget explanation in its own contextual sheet; preserve separate navigation counts for full screens and modal sheets.
