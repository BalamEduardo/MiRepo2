# FakeWhatsApp

Abre esta carpeta como proyecto en Android Studio. Usa JDK 17 o 21 para Gradle
e instala Android SDK Platform 36 y Build Tools 35.0.0 desde SDK Manager.

Crea un archivo supabase.properties en la raíz de este proyecto con estas
propiedades. Copia los valores del cuadro Connect o de Settings → API Keys
en el panel de Supabase.

    SUPABASE_URL=https://referencia-del-proyecto.supabase.co
    SUPABASE_PUBLISHABLE_KEY=sb_publishable_reemplazar

El archivo local está excluido de Git. Usa únicamente la clave pública
publicable en la aplicación Android.

## Autenticación

Ejecuta la app en un dispositivo o emulador. Para registrarte, abre el enlace de confirmación
en el mismo dispositivo. En un proyecto nuevo, habilita el proveedor Email, la confirmación
y agrega el callback `com.fakewhatsapp.app://auth/callback` en Authentication → URL Configuration.
El envío predeterminado de confirmación se limita a direcciones del equipo.

Para recuperar la contraseña, genera y guarda un código desde **Tu cuenta**.
Luego usa **Recuperar contraseña** en el formulario de acceso e ingresa el código y la nueva
contraseña. El código es de un solo uso y uno nuevo reemplaza al anterior.

En un proyecto nuevo, aplica las migraciones de Supabase y despliega la función
`password-recovery` con la configuración incluida. La función comprueba la sesión al emitir
un código y exige el código de un solo uso para restablecer la contraseña.

La sesión se cifra con una clave de Android Keystore. La app restaura la sesión al abrirse,
renueva el JWT cerca del vencimiento y solicita el cierre de la sesión de este dispositivo
a Supabase. Si falla la solicitud de cierre remoto, la app borra la sesión local y lo indica.

## Estados de mensajes y presencia

En conversaciones entre dos cuentas, cada mensaje propio muestra **Enviado**, **Recibido**
o **Leído**. La app marca los mensajes entrantes como recibidos y leídos cuando el chat
está abierto. Los contactos de prueba no tienen un segundo usuario y solo muestran **Enviado**.

Al abrir una conversación, la pantalla muestra si el otro participante está en línea,
escribiendo o su última conexión conocida. La última conexión se guarda cuando FakeWhatsApp
pasa a segundo plano o se cierra. La presencia y el indicador de escritura usan Supabase Realtime.

La migración `20261110021919_fase8_estados_mensajes_presencia.sql` agrega los campos de
recibo a `mensajes`, `ultima_conexion` a `perfiles` y las funciones protegidas por la sesión
para actualizar esos valores. Ya está aplicada al proyecto Supabase configurado.

Para compilar y ejecutar lint en PowerShell, abre una terminal en esta carpeta.

    .\gradlew.bat assembleDebug lintDebug

## Fases 11 y 12

En **Nuevo chat → Mi perfil** puedes guardar nombre y fotografía. En un chat entre
cuentas o grupo, **Enviar imagen** abre el selector de Android, comprime la imagen a
JPEG de hasta 512 px y la guarda en el bucket privado `imagenes-chat` (máximo 2 MB).
Solo miembros del chat pueden descargarla mientras el mensaje siga visible.
**Crear grupo** permite elegir entre 1 y 49 usuarios, además del creador. El chat
muestra los nombres de los remitentes y **Miembros** muestra sus integrantes.
**Eliminar mensaje** requiere confirmación y solo aparece en mensajes propios;
los participantes ven “Mensaje eliminado”. Es una eliminación lógica: la imagen deja
de ser accesible por la app, pero el archivo puede seguir almacenado en Supabase.
**Buscar mensajes** busca texto dentro del chat y devuelve como máximo 100 resultados.
Los contactos de práctica conservan su flujo de texto y no admiten estas funciones.

La migración `20261112030343_fases11_12_multimedia_grupos.sql` agrega grupos,
multimedia, eliminación, búsqueda y autorización privada de Presence/Broadcast.
Las tablas de conversaciones, miembros y mensajes exigen pertenencia al chat mediante
RLS. Solo el autor puede eliminar un mensaje mediante la función protegida. Los tokens
FCM son privados de cada usuario. Las tablas auxiliares sin políticas permanecen
cerradas al cliente y son usadas únicamente por funciones del servidor.

No incluyas `service_role`, la cuenta de servicio de Firebase ni secretos de webhooks
en Android. `supabase.properties` contiene solo URL y clave pública; las claves
públicas de Android se pueden extraer del APK y la protección depende de RLS.
La sesión usa AES-GCM y Android Keystore, las copias de seguridad están deshabilitadas
y solo se permite HTTPS. Los secretos FCM/webhook viven en Edge Functions y Vault.
Las notificaciones comprueban el destinatario de la sesión local y el acceso al chat.

Para otro proyecto configura Firebase y coloca su `google-services.json` en `app/`.
Despliega `notificar-mensaje` y configura sus secretos de servidor por separado.
La instalación actual está vinculada al proyecto Supabase de FakeWhatsApp.

APK instalable de pruebas: `app/build/outputs/apk/debug/app-debug.apk`.
Está firmado con la clave de depuración. Una publicación en Google Play requiere
firma de producción propia, versión definitiva y revisión de políticas.
Supabase aún advierte que la protección contra contraseñas filtradas está desactivada;
puede habilitarse en Auth si el plan del proyecto la admite.

## Prueba manual en dos dispositivos

1. Usa dos cuentas distintas y abre **Grupo de pruebas** en ambas pantallas.
2. Envía texto desde cada una: debe aparecer sin pulsar Actualizar y mostrar el remitente.
3. Envía una imagen y comprueba que ambos dispositivos la muestran.
4. Busca una palabra del mensaje: debe aparecer; una palabra inexistente no da resultados.
5. Elimina un mensaje propio y confirma: ambos ven “Mensaje eliminado” y no sale en búsqueda.
6. Comprueba que un mensaje recibido no ofrece el botón de eliminar.
7. En Nuevo chat → Mi perfil cambia la foto y guarda; consulta el perfil desde la otra cuenta.
8. Vuelve a Chats y abre el grupo: se conserva el historial. Repite en chat individual.
9. En un chat individual comprueba Enviado/Recibido/Leído y el indicador de escritura.
10. Envía con la otra app en segundo plano; pulsa la notificación para abrir el chat.
11. Desactiva la red de un dispositivo, intenta enviar y reconecta: debe mostrar error
    y permitir reintento sin duplicar mensajes de texto.

Los estados de grupo indican recepción/lectura por algún participante, no por todos.
El envío de imágenes fallido puede dejar un archivo sin mensaje; vuelve a seleccionarlo.
Las notificaciones usan el webhook de base de datos; todavía no hay cola de reintentos.
