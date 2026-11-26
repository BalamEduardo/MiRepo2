# Modelo de embedding incluido

Fuente: https://github.com/justadudewhohacks/face-api.js

Revisión fijada: `a86f011d72124e5fb93e59d5c4ab98f699dd5c9c` (face-api.js 0.22.2).

Se incluyen la distribución para navegador y los pesos de Tiny Face Detector, faceLandmark68TinyNet y faceRecognitionNet. Este último devuelve 128 valores por rostro. La licencia del repositorio se conserva en `LICENSE.face-api.txt`. Los avisos de terceros incluidos en la distribución se conservan sin alterar.

`provenance.json` registra la procedencia y SHA-256 de cada recurso original. `engine.facebundle` se genera con `scripts/build-face-engine.cjs`, comprueba esos hashes e incluye la biblioteca, los pesos y el motor local en un solo documento. Es el recurso que Metro incorpora al APK. No se descargan modelos al ejecutar la aplicación.
