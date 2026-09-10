const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const packageJson = require("../package.json");
const appConfig = require("../app.json");
const rootNavigatorSource = fs.readFileSync(
  path.join(__dirname, "../src/navigation/RootNavigator.jsx"),
  "utf8",
);
const mainTabsSource = fs.readFileSync(
  path.join(__dirname, "../src/navigation/MainTabs.jsx"),
  "utf8",
);

test("mantiene la matriz de versiones de Expo SDK 57", () => {
  assert.equal(packageJson.dependencies.expo, "~57.0.20");
  assert.equal(packageJson.dependencies["expo-splash-screen"], "~57.0.8");
  assert.equal(packageJson.dependencies["expo-font"], "~57.0.3");
  assert.equal(packageJson.dependencies["expo-status-bar"], "~57.0.1");
  assert.equal(packageJson.dependencies.react, "19.2.3");
  assert.equal(packageJson.dependencies["react-native"], "0.86.3");
  assert.equal(packageJson.dependencies["react-native-gesture-handler"], "~2.32.0");
  assert.equal(packageJson.dependencies["react-native-reanimated"], "4.5.1");
  assert.equal(packageJson.dependencies["react-native-safe-area-context"], "~5.7.0");
  assert.equal(packageJson.dependencies["react-native-screens"], "~4.26.0");
  assert.equal(packageJson.dependencies["react-native-worklets"], "0.10.1");
});

test("usa el esquema de splash de Expo SDK 57", () => {
  const expoConfig = appConfig.expo;

  assert.equal(expoConfig.newArchEnabled, undefined);
  assert.equal(expoConfig.splash, undefined);
  assert.equal(expoConfig.android.edgeToEdgeEnabled, undefined);
  assert.deepEqual(expoConfig.plugins[0], [
    "expo-splash-screen",
    {
      backgroundColor: "#0F172A",
      image: "./assets/splash-icon.png",
      imageWidth: 180,
      resizeMode: "contain",
    },
  ]);
});

test("expone los cuatro módulos en el menú lateral con iconos", () => {
  for (const routeName of ["Tic Tac Toe", "Memorama", "IMC", "Súper"]) {
    assert.match(rootNavigatorSource, new RegExp(`name=\\"${routeName}\\"`));
  }

  assert.match(rootNavigatorSource, /drawerIcon:/g);
});

test("mantiene las pestañas dentro del ancho disponible", () => {
  assert.match(mainTabsSource, /tabBarItemStyle:\s*styles\.tabItem/);
  assert.match(mainTabsSource, /tabItem:\s*\{[\s\S]*?flex:\s*1/);
  assert.match(mainTabsSource, /minWidth:\s*0/);
  assert.match(mainTabsSource, /tabBarLabelStyle:\s*styles\.tabLabel/);
});

test("carga solo el set de iconos usado por la aplicación", () => {
  assert.match(rootNavigatorSource, /import Ionicons from "@expo\/vector-icons\/Ionicons"/);
  assert.match(mainTabsSource, /import Ionicons from "@expo\/vector-icons\/Ionicons"/);
  assert.doesNotMatch(rootNavigatorSource, /from "@expo\/vector-icons";/);
  assert.doesNotMatch(mainTabsSource, /from "@expo\/vector-icons";/);
});
