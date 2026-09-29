# DineroMio

- Expo SDK 57 project using JavaScript and React Navigation, targeting Expo Go on iPhone.
- Product behavior and privacy constraints are recorded in `PRODUCT.md`.
- Keep three main surfaces: Inicio, Corte, and Historial. Present capture/edit as a sheet; history details stay within Historial.
- Store weekly cuts locally on the device. Do not add a backend, account login, cloud sync, live quotes, or imported financial history.
- Track Santander, Nu, Openbank, GBM cash, VTI, VXUS, and BTC separately in MXN.
- Validate every entered amount before saving; accept comma or period decimals and prevent unexpected closures.
- Keep copy in Spanish and respect iOS safe areas, system navigation, and Reduce Motion.
- Manual verification only; do not add automated tests.
