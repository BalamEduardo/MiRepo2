# Navegación para la rúbrica Implementation Plan

> **For agentic workers:** Implement the approved design task-by-task in this session using the existing React Navigation stack and local components.

**Goal:** Provide four full screens and four app-owned modals with clear navigation.

**Architecture:** Inicio and Historial remain tabs. Add full-screen Presupuesto and DetalleCorte stack routes. Keep Corte and Gastos as native form sheets, retain calculation help, and add a separate budget help modal.

**Tech Stack:** Expo SDK 57, React Native, React Navigation, AsyncStorage, JavaScript.

---

### Task 1: Add the budget screen and fourth modal

**Files:** Create `src/screens/BudgetScreen.jsx`, create `src/components/BudgetHelpSheet.jsx`, modify `src/components/BudgetSummary.jsx`, `src/screens/HomeScreen.jsx`, and `App.js`.

- [ ] Let `BudgetSummary` navigate to a dedicated budget screen when `onViewBudget` is supplied; keep its current disclosure behavior in History.
- [ ] Build `BudgetScreen` from the current snapshot, preceding snapshot, expanded budget summary, budget-edit action, and help-sheet trigger.
- [ ] Build `BudgetHelpSheet` with a short explanation of actual expenses, remaining plan, projected amount, and single subtraction.
- [ ] Register Presupuesto as a normal card screen and BudgetHelpSheet as a native page sheet.

### Task 2: Add full snapshot details

**Files:** Create `src/screens/SnapshotDetailScreen.jsx`, modify `src/screens/HistoryScreen.jsx` and `App.js`.

- [ ] Add an “Abrir detalle del corte” action to each expanded history item.
- [ ] Show its recorded date, seven balances, historical budget/expenditure summary, and buttons to edit or view expenses.
- [ ] Register DetalleCorte as a normal card screen; pass only the snapshot id and read data from context.

### Task 3: Update guidance and verify

**Files:** Modify `AGENTS.md`, `DESIGN.md`, and `README.md`.

- [ ] Document the four full screens and four app-owned modals.
- [ ] Parse all JavaScript/JSX sources and run `npx expo export --platform ios --output-dir .expo/check-ios`.
- [ ] Do not perform visual inspection; the user will review the app in Expo Go.
