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

Para compilar y ejecutar lint en PowerShell, abre una terminal en esta carpeta.

    .\gradlew.bat assembleDebug lintDebug
