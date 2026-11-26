# FaceRecognition

Actividad Expo SDK 57 con detección de rostros **en vivo mientras la cámara frontal está encendida**. VisionCamera 5 y ML Kit procesan los fotogramas en el teléfono; los recuadros siguen a los rostros y se muestra cuántos se detectaron. No identifica personas.

El detector usa el modelo incluido en la dependencia nativa (`com.google.mlkit:face-detection` en Android y ML Kit en iOS). No se envían imágenes a un servidor ni se descarga un modelo para detectar. Los fotogramas se descartan después del procesamiento. **Tomar foto** crea una fotografía; **Guardar** la añade a la galería, sin recuadros. **Registrar rostro** usa una captura temporal para generar y almacenar un embedding local.

## Embeddings faciales locales

1. Coloca un solo rostro delante de la cámara y pulsa **Registrar rostro**.
2. Escribe un nombre para el registro. Espera a que se prepare el modelo local.
3. Pulsa **Generar y guardar embedding**. La cámara conserva su detección en vivo.
4. Abre **Registros** para consultar el vector de 128 valores y sus datos, o eliminarlo.

La foto temporal se decodifica con su orientación y se reduce a un lado mayor de 1280 píxeles. Una WebView privada ejecuta Tiny Face Detector, puntos faciales y `faceRecognitionNet` de face-api.js 0.22.2 sobre CPU. Comprueba que haya exactamente un rostro y calcula el descriptor con alineación facial. No se utilizan los identificadores de seguimiento ni las coordenadas de ML Kit como embedding.

El código y los pesos se incluyen en `assets/face-embedding/engine.facebundle`: no hay CDN, API ni descarga de modelos durante el uso. La WebView bloquea navegación externa y conexiones de red. En dispositivos lentos el análisis puede tardar; tras 90 segundos muestra un error y reinicia el motor. Cancelar o pasar a segundo plano descarta un análisis pendiente.

Cada embedding se almacena como un JSON en `Paths.document/face-embeddings/<id>.json`, dentro de los archivos privados de la app. Incluye `schemaVersion`, `id`, `name`, `createdAt`, `model`, `dimensions` y `embedding`. Se escribe primero un archivo temporal y se renombra tras completar la escritura. El vector conserva la salida del modelo; no se transforma ni se compara con otros registros en esta etapa. La imagen temporal no se conserva ni se añade a la galería. Los registros sobreviven al cierre y a una actualización normal; desinstalar la app o borrar sus datos los elimina. El almacenamiento no incorpora cifrado adicional.

Los archivos originales, su revisión y sus SHA-256 están en `assets/face-embedding/provenance.json`; la licencia MIT está en esa carpeta. `npm run build:face-model` vuelve a ensamblar el documento sin red a partir de los recursos incluidos. `scripts/vendor-face-model.cjs` es únicamente una herramienta de desarrollo para obtener esa revisión del repositorio original; la aplicación no la ejecuta.

Comprobación manual: registrar un rostro, cerrar y abrir la app, consultar los 128 valores, eliminar el registro, cancelar durante el análisis y repetir en modo avión. También comprobar que cero o varios rostros produzcan un mensaje sin guardar registros.

## Instalar una compilación propia

Expo Go no incluye estos módulos. Si se abre allí, la app indica que necesitas una compilación propia. Desde esta carpeta:

```sh
npm ci
```

Android: necesitas Java 21, Android Studio/SDK y un teléfono conectado con depuración USB, o un emulador con cámara.

```sh
npm run android -- --device
```

iPhone: necesitas un Mac con Xcode y configurar la firma para tu dispositivo.

```sh
npm run ios -- --device
```

Estos comandos compilan e instalan sin abrir Metro. Cuando quieras abrir el servidor:

```sh
npm start
```

Abre FaceRecognition instalada, no Expo Go. Una compilación de desarrollo necesita Metro para cargar JavaScript; esto no es una API de detección. Para usar la app sin ninguna conexión, compila Release con JavaScript incorporado.

## APK de prueba sin servidor (Android ARM64)

En PowerShell, desde esta carpeta:

```powershell
npm run build:android
```

El APK queda en `android/app/build/outputs/apk/release/app-release.apk`. Desde la carpeta de la actividad puedes instalarlo con:

```sh
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

El comando usa una unidad temporal para evitar rutas demasiado largas en CMake en Windows y la libera al terminar. No mueve la actividad ni abre Metro. Para compilar Debug o para un emulador x86_64:

```sh
npm run build:android -- -Configuration Debug -Architecture x86_64
```

Puedes instalar Debug con `adb install -r android/app/build/outputs/apk/debug/app-debug.apk` y luego abrir el servidor con `npm start`. Si `npm run android` falla por rutas largas en Windows, utiliza este comando de compilación y la instalación con adb.

La configuración local de Expo utiliza una firma de prueba; no es una entrega para Play Store. La variante ARM64 es para teléfonos Android de esa arquitectura. Al añadir dependencias nativas o modificar permisos, reconstruye la app.

## Comportamiento y comprobación

- Solicita permiso de cámara y ofrece Ajustes si ya no se puede solicitar.
- Marca uno o varios rostros mientras la cámara está activa; al salir del encuadre desaparecen sus recuadros.
- Pausa la cámara y el detector al pasar a segundo plano o mostrar la foto. Al volver a tomar, comienza una sesión nueva.
- Si falla el detector, permite reintentar y seguir tomando fotos. Si falla la cámara, permite reiniciarla.
- Pide permiso para añadir fotos al guardar. Borrar la captura temporal al repetir no borra la copia de la galería.
- Verifica en un teléfono: cero/uno/varios rostros, movimiento lateral con cámara frontal espejada, diferentes tamaños de pantalla, repetir captura, permisos denegados y regreso desde segundo plano.
- Prueba Release en modo avión desde su primer arranque: los recuadros deben funcionar y la foto debe poder guardarse.

Pruebas automatizadas de coordenadas, recorte, espejo y descarte de resultados de sesiones cerradas:

```sh
npm test
```

La fluidez y la alineación final de los recuadros requieren comprobación en el dispositivo. No se inicia ningún servidor automáticamente al compilar.

`npm ci` aplica un parche de compatibilidad al detector 2.1.0: detiene el analizador al liberarlo y utiliza `ExecutorService.shutdown()` para funcionar también en Android anterior a API 36. El ajuste se conserva en `patches/` y no modifica el modelo de ML Kit.
