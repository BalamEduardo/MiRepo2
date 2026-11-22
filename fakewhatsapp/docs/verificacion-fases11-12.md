# Verificación de fases 11 y 12

Fecha: 11 de noviembre de 2026 (México).

- `gradlew.bat assembleDebug lintDebug --no-daemon`: BUILD SUCCESSFUL, 47 tareas.
  Lint no reportó errores; conserva advertencias de recursos, APIs y estructura.
- APK actualizado instalado correctamente en emulator-5554 y emulator-5556 (API 36).
- Grupo creado desde Android con dos cuentas reales: Prueba 1 y Prueba 2.
- Texto enviado desde ambas cuentas, recibido sin actualizar; lectura registrada.
- Imagen JPEG seleccionada desde DocumentsUI, subida al bucket privado y visible en ambos.
- Búsqueda de “Hola” encontró el mensaje correspondiente.
- Eliminación de la imagen por su autor actualizó la otra pantalla a “Mensaje eliminado”.
- Fotografía y nombre de Prueba 2 guardados desde Mi perfil.
- Pruebas SQL autenticadas, con fixtures revertidos: creación de grupo, envío y búsqueda;
  usuario ajeno sin lectura ni inserción; destinatario sin permiso de borrar mensaje ajeno;
  autor pudo borrar y el mensaje desapareció de la búsqueda.
- Comprobación adicional con rol authenticated ajeno: cero mensajes, miembros, tokens FCM
  e imágenes visibles. No se leyeron valores de tokens ni credenciales.
- Webhook de los tres mensajes de prueba respondió HTTP 200.
- El asesor de Supabase no mostró nuevas vulnerabilidades de RLS. Advierte protección
  de contraseñas filtradas desactivada y tablas auxiliares cerradas sin políticas.

El emulador 5556 presentó ANR del sistema/System UI; se reinició Android y se cerró el
proceso de System UI desde su diálogo. Después permitió realizar el intercambio.

Límites: APK firmado para depuración; falta firma propia para distribuir en una tienda.
La lectura de grupo corresponde a algún participante. Borrado lógico, sin limpieza física
de imágenes; notificaciones sin cola durable de reintentos. Contactos de práctica solo texto.
Quedan para la prueba manual del usuario: red interrumpida, cierre/reapertura, notificación
con app en segundo plano y fotografía vista por otra cuenta.
