---
name: DineroMio
description: Cortes y presupuesto semanal en una interfaz clara.
colors:
  background: "#F5F5F7"
  surface: "#FFFFFF"
  text: "#1D1D1F"
  secondary: "#5E6472"
  tint: "#0066CC"
  tint-soft: "#EAF3FF"
  separator: "#E0E0E0"
  positive: "#176D4A"
  negative: "#AE352E"
typography:
  display:
    fontFamily: "System, -apple-system, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.24
  body:
    fontFamily: "System, -apple-system, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  control: "14px"
spacing:
  sm: "10px"
  lg: "24px"
---

# Design System: DineroMio

## Overview

**Creative North Star: La agenda del corte semanal.**

El corte conserva la fecha, siete saldos y un presupuesto opcional. El diseño adapta la guía Apple de awesome-design-md a una app de uso personal mediante Impeccable: superficies claras, tipografía del sistema y azul para acciones. El dato permanece antes que la decoración.

## Colors

La apariencia es siempre clara. Blanco y gris suave separan superficies; tinta oscura y gris legible ordenan la información. Un solo azul identifica acciones, fechas y distribución. Verde y rojo acompañan aumentos, disminuciones y errores, siempre con texto o signo.

## Typography

San Francisco en iPhone, con cifras tabulares en importes. El total usa el mayor tamaño; los grupos y el presupuesto tienen encabezados legibles y las notas usan un tamaño secundario.

## Layout

Una columna con márgenes de 24 puntos y áreas seguras. Inicio coloca el total, el presupuesto y las posiciones en ese orden. Corte conserva los siete campos y añade el presupuesto debajo. Historial muestra filas expandibles. Se mantienen dos pestañas principales y la hoja de Corte.

## Elevation & Depth

Superficies planas y separadores finos. La hoja de formulario y la ayuda usan la presentación nativa de iOS. Sin sombras decorativas.

## Shapes

Campos, botones y notas usan radio de 14 puntos. Los botones de icono tienen un área táctil circular de 44 puntos. Las barras de distribución son finas y etiquetadas.

## Components

- **Monto:** símbolo de pesos, campo decimal y sufijo MXN. Error visible junto al campo.
- **Presupuesto:** interruptor Apartar para gastos, monto y reparto opcional. Súper, Comida, Cena, Gustos y Otros permanecen en orden fijo.
- **Resumen:** destaca Total estimado actual con la nota Según los gastos anotados. Gastado y Presupuesto restante se muestran juntos; el exceso tiene texto explícito. Ver presupuesto revela la proyección, la comparación contra el total original anterior y el reparto planeado.
- **Gastos:** hoja nativa con lista y formulario de monto, categoría y descripción opcional. El historial permite corregir o eliminar gastos dentro del periodo original.
- **Acciones:** azul para confirmar; borde fino para acciones secundarias; confirmación nativa para descartar o eliminar.
- **Estados:** guardado bloquea edición; salir con cambios pide confirmación; historial vacío, carga y error de almacenamiento tienen mensajes claros.
- **Movimiento:** las barras se ajustan después de guardar un corte, respetando Reducir movimiento.
- **Ilustración:** agenda geométrica local en blanco, gris y azul; sin saldos ficticios.

## Do's and Don'ts

### Do:

- Mantener la app clara incluso con el sistema oscuro.
- Diferenciar patrimonio total y dinero en cuentas.
- Conservar el presupuesto junto con su corte.
- Distinguir presupuesto planeado, gastos reales y total estimado.

### Don't:

- Restar el presupuesto de los saldos registrados.
- Incluir VTI, VXUS o BTC en la base del presupuesto.
- Obligar a repartir todo el monto por categorías.
- Añadir ingresos, transferencias, cotizaciones, backend o nuevas dependencias.
