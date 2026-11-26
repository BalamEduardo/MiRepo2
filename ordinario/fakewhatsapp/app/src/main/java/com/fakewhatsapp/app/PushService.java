package com.fakewhatsapp.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public final class PushService extends FirebaseMessagingService {
    static void createChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel("mensajes", "Mensajes", NotificationManager.IMPORTANCE_DEFAULT);
            context.getSystemService(NotificationManager.class).createNotificationChannel(channel);
        }
    }

    @Override public void onNewToken(String token) {
        PushRegistration.tokenChanged(this, token);
    }

    @Override public void onMessageReceived(RemoteMessage message) {
        String recipient = message.getData().get("usuario_id");
        if (recipient != null) {
            try {
                AuthClient.Session session = new SessionStore(this).read();
                if (session == null) return;
                String[] parts = session.access().split("\\.");
                String payload = new String(android.util.Base64.decode(parts[1], android.util.Base64.URL_SAFE),
                        java.nio.charset.StandardCharsets.UTF_8);
                if (!recipient.equals(new org.json.JSONObject(payload).optString("sub"))) return;
            } catch (Exception invalidSession) { return; }
        }
        String title = message.getData().get("title");
        String body = message.getData().get("body");
        if (body == null && message.getNotification() != null) {
            title = message.getNotification().getTitle();
            body = message.getNotification().getBody();
        }
        if (body == null || body.isEmpty()) return;
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) return;
        createChannel(this);
        String chatId = message.getData().get("conversacion_id");
        Intent intent = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (chatId != null) {
            try {
                java.util.UUID.fromString(chatId);
                intent.putExtra("conversacion_id", chatId);
                intent.setData(android.net.Uri.parse("fakewhatsapp-notification://chat/" + chatId));
            } catch (IllegalArgumentException ignored) {
                // A malformed payload opens the account screen instead.
            }
        }
        PendingIntent pending = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        android.app.Notification.Builder builder = Build.VERSION.SDK_INT >= 26
                ? new android.app.Notification.Builder(this, "mensajes") : new android.app.Notification.Builder(this);
        builder.setSmallIcon(android.R.drawable.ic_dialog_email).setContentTitle(title == null ? getString(R.string.app_name) : title)
                .setContentText(body).setAutoCancel(true).setContentIntent(pending);
        getSystemService(NotificationManager.class).notify(message.getData().getOrDefault("mensaje_id", message.getMessageId() == null ? "message" : message.getMessageId()).hashCode(), builder.build());
    }
}
