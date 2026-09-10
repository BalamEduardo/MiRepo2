# VidaEduardo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear una aplicación Expo independiente llamada VidaEduardo, lista para Expo Go, con splash animado, Drawer, Tabs y cuatro herramientas locales.

**Architecture:** `App.js` compone un `NavigationContainer` con un Drawer raíz. La pantalla `Inicio` contiene un Bottom Tab Navigator con Resumen, Tic Tac Toe, Memorama, IMC y Súper; el Drawer agrega un acceso a Acerca de. La lógica pura de IMC, juegos y lista vive en `src/utils/` para probarla sin montar React Native.

**Tech Stack:** Expo SDK 57, React 19.2.3, React Native 0.86.3, React Navigation 7, hooks, `Animated`, `expo-splash-screen`, `StyleSheet`, `node:test` y estado local en memoria.

---

### Task 1: Probar la lógica de los cuatro módulos

**Files:**
- Create: `VidaEduardo/tests/logic.test.cjs`
- Create: `VidaEduardo/src/utils/imc.js`
- Create: `VidaEduardo/src/utils/ticTacToe.js`
- Create: `VidaEduardo/src/utils/memory.js`
- Create: `VidaEduardo/src/utils/grocery.js`

- [x] Escribir pruebas para IMC válido/inválido, ganador/empate de Tic Tac Toe, creación/evaluación de pares del Memorama y agregar/tachar/eliminar artículos.
- [x] Ejecutar `node --test tests/logic.test.cjs` desde `VidaEduardo` y confirmar que falla porque aún no existen las utilidades.
- [x] Implementar las funciones puras mínimas (`calculateImc`, `classifyImc`, `getWinner`, `createMemoryDeck`, `evaluateMemoryPair`, `addGroceryItem`, `toggleGroceryItem`, `removeCompletedItems`).
- [x] Ejecutar las mismas pruebas y confirmar que pasan.

### Task 2: Crear el cascarón Expo y la navegación

**Files:**
- Create: `VidaEduardo/package.json`, `VidaEduardo/.gitignore`, `VidaEduardo/AGENTS.md`, `VidaEduardo/CLAUDE.md`, `VidaEduardo/index.js`, `VidaEduardo/App.js`, `VidaEduardo/app.json`
- Create: `VidaEduardo/src/navigation/MainTabs.jsx`
- Create: `VidaEduardo/src/screens/HomeScreen.jsx`, `VidaEduardo/src/screens/AboutScreen.jsx`
- Create: `VidaEduardo/src/theme/colors.js`
- Create: `VidaEduardo/src/components/FeatureCard.jsx`

- [x] Configurar versiones alineadas con el ejemplo SDK 57 y dependencias de Drawer/Bottom Tabs/gesture-handler/reanimated.
- [x] Componer Drawer → Tabs, incluyendo un botón de menú en los headers de las pestañas y enlaces rápidos desde Inicio.
- [x] Implementar `AnimatedSplashScreen` con `Animated.parallel`, escala, opacidad y desplazamiento, y mostrar la navegación al terminar.
- [x] Añadir configuración de splash estático, orientación vertical, iconos y status bar.

### Task 3: Implementar las cuatro pantallas

**Files:**
- Create: `VidaEduardo/src/screens/TicTacToeScreen.jsx`
- Create: `VidaEduardo/src/screens/MemoryScreen.jsx`
- Create: `VidaEduardo/src/screens/ImcScreen.jsx`
- Create: `VidaEduardo/src/screens/GroceryScreen.jsx`

- [x] Implementar Tic Tac Toe para dos turnos locales, ganador/empate y reinicio.
- [x] Implementar Memorama con seis pares, bloqueo durante la comparación, contador de intentos y reinicio.
- [x] Implementar IMC con peso en kg, altura en cm, validación, resultado, clasificación y limpieza.
- [x] Implementar lista del súper con alta, tachado, borrado de comprados, contador y aviso de que vive solo en memoria.

### Task 4: Dependencias, assets y verificación Expo Go

**Files:**
- Copy: `VidaEduardo/assets/*` from `TabNavigation/assets/*`
- Modify: `VidaEduardo/package-lock.json` through `npm install`

- [x] Instalar dependencias con `npm install --no-audit --no-fund`.
- [x] Ejecutar pruebas, `npx expo export --platform web` y `npx expo-doctor` desde `VidaEduardo`.
- [x] Revisar `git diff`/`git status` y confirmar que solo se creó VidaEduardo y el plan, sin cambios en los ejemplos.
