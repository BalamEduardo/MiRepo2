---
name: DineroMio
description: Registro semanal, local y claro de saldos personales.
colors:
  tint: "#3848C8"
  tint-soft: "#E9EBFF"
  background: "#F5F4EE"
  surface: "#FFFFFF"
  surface-muted: "#ECEEF4"
  text: "#181B27"
  secondary: "#5E6472"
  separator: "#D9DCE5"
  date-mark: "#B94732"
  date-mark-soft: "#F8EAE5"
  positive: "#176D4A"
  positive-soft: "#E6F3EC"
  negative: "#AE352E"
  negative-soft: "#F9E9E7"
  bar-track: "#E0E3EA"
  field: "#FFFFFF"
  placeholder: "#5E6472"
  on-tint: "#FFFFFF"
  dark-background: "#11131B"
  dark-surface: "#1B1E29"
  dark-surface-muted: "#252A37"
  dark-text: "#F3F4F7"
  dark-secondary: "#A5AAB7"
  dark-separator: "#343947"
  dark-tint: "#B7C0FF"
  dark-tint-soft: "#292F52"
  dark-date-mark: "#FF9A78"
  dark-date-mark-soft: "#402820"
  dark-positive: "#6BD6A0"
  dark-positive-soft: "#183A2E"
  dark-negative: "#FF8B83"
  dark-negative-soft: "#482727"
  dark-bar-track: "#333847"
  dark-field: "#202431"
  dark-placeholder: "#9AA0AE"
  dark-on-tint: "#11131B"
typography:
  display:
    fontFamily: "System, -apple-system, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.24
    letterSpacing: "-0.4px"
  headline:
    fontFamily: "System, -apple-system, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.22
    letterSpacing: "-0.35px"
  body:
    fontFamily: "System, -apple-system, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "System, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.38
    letterSpacing: "normal"
rounded:
  control: "14px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.on-tint}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "50px"
    padding: "0 18px"
  amount-field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    height: "52px"
    padding: "0 14px"
  tab-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    height: "62px"
---

# Design System: DineroMio

## Overview

**Creative North Star: “La agenda del corte semanal”**

DineroMio convierte la revisión semanal de saldos en una página fechada, ordenada y fácil de retomar. El diseño conserva el ritmo de una agenda, pero deja que los importes y sus etiquetas sean lo primero que se lee.

La interfaz usa controles nativos de iOS, símbolos del sistema y espacio suficiente para revisar cada cuenta en el teléfono. La superficie es sobria; el índigo guía las acciones y la distribución, mientras el ladrillo identifica las fechas.

**Key Characteristics:**

- Total y variación antes del desglose.
- Siete posiciones en un orden estable entre Inicio, Corte e Historial.
- Diseño claro y oscuro que sigue la apariencia del sistema.
- Ilustración local de la primera semana, sin saldos ficticios.
- Una animación corta en las barras de distribución, con respeto a Reducir movimiento.

## Colors

La paleta combina fondos neutros con un índigo de acción; verde y rojo expresan variaciones con etiquetas y signo, no solo con color.

### Primary
- **Índigo de registro** (`#3848C8`): acción principal, pestaña seleccionada y proporciones en el tema claro.
- **Índigo nocturno** (`#B7C0FF`): el mismo papel de acción en el tema oscuro.

### Secondary
- **Ladrillo de fecha** (`#B94732`): identifica el corte fechado sin competir con el total.
- **Ladrillo nocturno** (`#FF9A78`): acento de fecha en el tema oscuro.

### Neutral
- **Papel cálido** (`#F5F4EE`): fondo claro de la app.
- **Superficie blanca** (`#FFFFFF`): campos y controles en tema claro.
- **Tinta** (`#181B27`): texto principal en tema claro.
- **Gris de lectura** (`#5E6472`): descripciones, subtítulos y valores secundarios.
- **Línea fría** (`#D9DCE5`): separadores finos.
- **Noche** (`#11131B`): fondo oscuro.
- **Superficie nocturna** (`#1B1E29`): controles y navegación oscuros.
- **Texto nocturno** (`#F3F4F7`): texto principal oscuro.

### Named Rules
**The Sign-and-Label Rule.** La variación siempre se acompaña de signo y texto; el color por sí solo nunca define si el balance subió o bajó.

## Typography

- **Display Font:** System (San Francisco en iOS)
- **Body Font:** System (San Francisco en iOS)

**Character:** La tipografía del sistema mantiene la app familiar y legible en iPhone. Los importes usan cifras tabulares para facilitar la comparación vertical.

### Hierarchy
- **Display** (700, 34 px, 42 px): total principal del corte.
- **Headline** (700, 27–28 px, 34 px): título de Inicio e Historial.
- **Title** (600–700, 15–21 px, 21–27 px): nombres de cuentas y encabezados de grupos.
- **Body** (400, 14–16 px, 20–24 px): indicaciones y explicaciones.
- **Label** (600, 12–13 px, 16–19 px): fecha, subtítulo y participación porcentual.

### Named Rules
**The Numeric Alignment Rule.** Los montos y porcentajes conservan cifras tabulares y alineación a la derecha.

## Layout

La app usa una columna móvil de ancho completo, respetando las áreas seguras de iOS. Las pantallas principales tienen 24 px de margen horizontal; la hoja de captura permite desplazamiento para que los siete campos y el teclado quepan en iPhone. Inicio y corte muestran los grupos “Efectivo y bancos” e “Inversiones” en ese orden. Historial presenta cada corte como una fila expandible.

La navegación inferior tiene dos destinos, Inicio e Historial. La captura y edición se presentan como una hoja nativa del stack, con opción de expandirla.

## Elevation & Depth

El sistema es plano y no usa sombras decorativas. Los límites se indican con superficies tonales y separadores finos; la hoja nativa y el modal de ayuda aportan la profundidad propia de iOS.

## Shapes

Los campos, botones y notas usan radio de 14 px. Los botones de icono son circulares y los marcadores de fecha tienen esquinas más compactas. Los renglones se separan con líneas de grosor fino. Las barras de distribución tienen 3 px de alto y extremos redondeados.

## Components

### Buttons
- **Shape:** radio de 14 px; mínimo de 50 px de alto.
- **Primary:** índigo sólido con texto e icono claros, centrados y con área táctil generosa.
- **Secondary:** transparente, borde de separador e índigo para etiqueta e icono.
- **Destructive:** fondo rojo tenue para eliminar; la confirmación final usa el diálogo destructivo nativo.
- **Pressed / Disabled:** el estado presionado reduce opacidad; el deshabilitado cambia a superficie mutada.
- **Discard guard:** si hay montos editados sin guardar, cancelar o cerrar la hoja pide confirmación; el guardado desactiva edición y cierre hasta terminar.

### Inputs / Fields
- **Style:** fondo de campo, borde de 1 px, radio de 14 px y altura mínima de 52 px.
- **Content:** símbolo `$`, monto editable y sufijo `MXN`; teclado decimal.
- **Error / Focus:** error con borde, texto e icono rojos; las etiquetas indican el saldo y el tipo de valor esperado.

### Navigation
- **Style:** barra nativa inferior con Inicio e Historial, símbolos SF y etiquetas de sistema.
- **Active:** índigo; **inactive:** gris secundario.
- **Capture:** hoja de formulario nativa con título, cancelar y guardar.

### Weekly Balance Row
- Cada renglón conserva el nombre y el monto; en Inicio suma su participación y una barra corta al valor numérico.
- Las barras usan el mismo índigo y aparecen una vez al cargar un corte actualizado. Reducir movimiento elimina el desplazamiento.

### First-cut Illustration
- Una ilustración local de agenda y distribución acompaña el estado vacío de Inicio.
- No incorpora nombres de bancos ni valores de ejemplo.

## Do's and Don'ts

### Do:
- **Do** mostrar el total y la variación antes de las siete posiciones.
- **Do** conservar nombres y orden de las posiciones en las vistas.
- **Do** acompañar cada variación con texto y signo.
- **Do** mantener el tema claro y oscuro en controles, texto y separadores.

### Don't:
- **Don't** presentar depósitos o retiros como rendimiento de inversión.
- **Don't** depender solo del color para comunicar una variación.
- **Don't** añadir sombras decorativas, datos de ejemplo o gráficos sin etiqueta.
- **Don't** mover el orden de las cuentas entre Inicio, Corte e Historial.
