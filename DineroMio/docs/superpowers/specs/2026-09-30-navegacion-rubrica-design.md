# Navegación para cubrir la rúbrica de 20 puntos

## Objetivo

Hacer que la aplicación presente más de tres pantallas completas y más de tres modales propios, todos accesibles mediante navegación visible, sin contar avisos nativos del sistema.

## Diseño aprobado

La navegación tendrá cuatro pantallas completas: Inicio, Historial, Presupuesto y Detalle del corte. Se mantienen las hojas de Corte y Gastos como modales, junto con Ayuda de cálculo. Se añade Ayuda del presupuesto como cuarto modal propio.

Desde Inicio se abre Presupuesto. Desde el detalle expandido de un corte en Historial se abre Detalle del corte. La pantalla de Presupuesto explica el periodo y la comparación, ofrece el acceso para ajustar presupuesto y muestra una ayuda contextual. Detalle del corte presenta fecha, saldos, presupuesto, gastos del periodo y acceso a editar el corte o ver sus gastos.

## Restricciones

Se conserva Expo SDK 57, JavaScript, AsyncStorage y la apariencia clara. No se agregan dependencias, cuentas, sincronización ni cambios al modelo de saldos/gastos. Las hojas existentes continúan como hojas; las dos pantallas nuevas usan la presentación normal de navegación.

## Criterio de aceptación

Hay cuatro rutas de pantalla completa, cuatro modales propios y todos se alcanzan desde acciones identificables. La compilación Expo continúa generando el bundle iOS. La revisión visual en Expo Go la realiza el usuario.
