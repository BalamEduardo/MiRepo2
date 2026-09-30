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

## Presupuesto semanal

Debajo de los saldos, activa **Apartar para gastos** y captura el monto. La base suma únicamente Santander, Nu, Openbank y GBM sin invertir. **Repartir por categorías** es opcional: Súper, Comida, Cena, Gustos y Otros. Puedes dejar parte sin asignar y los campos vacíos de categorías valen cero.

Inicio muestra dinero en cuentas, apartado para gastos, restante en cuentas y total después de apartar. Este último incluye todas las inversiones y resta el presupuesto previsto del patrimonio del corte. **Ajustar presupuesto** abre Corte en ese apartado. Cada corte conserva su presupuesto en Historial. El siguiente corte copia el anterior. Los registros antiguos comienzan sin presupuesto.

El presupuesto es un plan: no descuenta saldos ni registra compras. La app siempre utiliza apariencia clara, incluso si el iPhone está en modo oscuro.
