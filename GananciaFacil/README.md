# DineroMio

Aplicación personal para registrar una vez por semana siete saldos en pesos mexicanos, ver el total, su distribución y la variación frente al corte anterior.

Construida con JavaScript, React Native y Expo SDK 57 para ejecutarse en Expo Go en iPhone.

## Ejecutar

```powershell
npm install
npx expo start
```

Abre Expo Go en el iPhone y escanea el código QR. Se requiere estar conectado a la misma red que la computadora.

## Datos

Los cortes se guardan localmente en el espacio de la app mediante AsyncStorage. No hay cuentas, backend, cotizaciones automáticas ni sincronización propia. La app inicia con un historial vacío; el primer corte se captura en el iPhone.

## Saldos incluidos

- Santander, Nu y Openbank.
- Efectivo sin invertir en GBM.
- Posiciones VTI, VXUS y BTC, cada una por separado.

Los valores anteriores se precargan al registrar el siguiente corte. La variación es el cambio entre totales y no representa rendimiento de inversión.
