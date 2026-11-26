# Persistencia

Aplicación React Native creada con Expo y JavaScript. El cliente de Supabase está en `lib/supabase.js`.

## Ejecutar

1. Usa Node.js 24 LTS (o una versión compatible con Expo SDK 58).
2. Ejecuta `npm install`.
3. Copia `.env.example` a `.env.local` y coloca la URL y la clave **publicable** del proyecto Supabase. Se obtienen en el panel Connect de Supabase. Las variables `EXPO_PUBLIC_` se incluyen en la aplicación y no deben contener claves secretas.
4. Ejecuta `npm start` y abre la aplicación con Expo Go o un emulador.

La pantalla permite crear, consultar, editar y eliminar productos. Las políticas de Supabase conceden acceso público sin iniciar sesión: cualquier persona con la URL y la clave publicable puede leer, crear, modificar o eliminar registros. Las políticas aplicadas están documentadas en `supabase/politica-insercion.sql` y `supabase/politicas-crud.sql`.

Ejecuta las pruebas con `npm test`.

## Dependencias de desarrollo

Se aplica una sustitución de Zod 4.6.7 para `@expo/cli` debido al aviso GHSA-mrhx-c7xc-m3w5. Expo CLI declara Zod 3, por lo que esta sustitución debe revisarse cuando Expo publique una actualización compatible. Las pruebas de la aplicación, la validación básica de esquemas de Expo y la compilación Android han pasado; no se han probado todas las extensiones de Expo CLI.

`npm audit` también señala GHSA-86w9-cpqp-85rv en `node-forge`, utilizado por herramientas de Expo. Todavía no existe una versión corregida publicada; actualiza Expo o esta dependencia cuando haya una corrección oficial.


