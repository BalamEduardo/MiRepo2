# DineroMio

La navegación incluye cuatro pantallas completas: Inicio, Historial, Presupuesto y Detalle del corte. Corte y Gastos se abren como hojas; la ayuda de cálculo y la ayuda del presupuesto son modales propios.

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

Inicio destaca **Total estimado actual**, con **Gastado** y **Presupuesto restante**. **Ver presupuesto** muestra la proyección, el reparto planeado y su comparación con el total original del corte anterior. **Ajustar presupuesto** abre Corte en ese apartado. El presupuesto y los saldos se copian al crear el siguiente corte; los registros antiguos sin presupuesto siguen interpretándose como sin presupuesto.

## Gastos reales

**Registrar gasto** abre un formulario con monto positivo en MXN, categoría y descripción opcional (hasta 160 caracteres). La fecha y hora son automáticas. **Ver gastos** permite editar y eliminar, con confirmación. Historial ofrece las mismas correcciones para cada periodo. Todos los importes aceptan punto o coma y hasta dos decimales; el formulario se conserva si falla el guardado.

Cada corte conserva sus siete saldos originales y una lista independiente de gastos. Los cortes antiguos sin lista comienzan con una vacía. Eliminar un corte también elimina sus gastos.

- Total estimado actual = total original del corte − gastos anotados.
- Presupuesto restante = máximo entre presupuesto − gastos y cero.
- Total previsto = total estimado actual − presupuesto restante.

Ejemplo: corte de $10,000, presupuesto de $2,000 y comida de $300 muestran $9,700 estimados, $1,700 pendientes y $8,000 previstos. Si gastas $2,300, verás $300 de exceso, $0 pendientes y $7,700 estimados/previstos. Sin presupuesto, los gastos reducen únicamente la estimación.

El nuevo corte empieza sin gastos y requiere actualizar los saldos reales, que ya incluyen los gastos anteriores. Un nuevo saldo de $9,700 queda en $9,700 hasta anotar gastos nuevos: los $300 del periodo anterior no se descuentan otra vez. Corregir gastos antiguos no cambia los cortes posteriores.

No se selecciona cuenta de pago ni se registran ingresos, transferencias o cambios de inversiones posteriores al corte. La estimación refleja solo lo anotado. La app conserva su apariencia clara incluso con el iPhone en modo oscuro.

## Comprobación

La comprobación visual y de uso en Expo Go corresponde al usuario: registrar, editar y eliminar gastos; cerrar y reabrir para comprobar persistencia; guardar un nuevo corte con saldos reales; y revisar los errores de captura y la apariencia clara. No se incluye una suite de pruebas automatizadas.
