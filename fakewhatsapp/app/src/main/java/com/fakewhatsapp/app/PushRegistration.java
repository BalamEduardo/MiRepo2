package com.fakewhatsapp.app;

import android.content.Context;
import android.util.Log;

import com.google.android.gms.tasks.Tasks;
import com.google.firebase.messaging.FirebaseMessaging;

import org.json.JSONObject;

import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import okhttp3.HttpUrl;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

final class PushRegistration {
    private static final ExecutorService WORKER = Executors.newSingleThreadExecutor();
    private static final Object LOCK = new Object();
    private static final OkHttpClient HTTP = new OkHttpClient.Builder().callTimeout(15, TimeUnit.SECONDS)
            .followRedirects(false).followSslRedirects(false).build();

    static void sync(Context context) {
        Context app = context.getApplicationContext();
        WORKER.execute(() -> {
            try {
                String token = Tasks.await(FirebaseMessaging.getInstance().getToken(), 15, TimeUnit.SECONDS);
                register(app, token);
            } catch (Exception failure) {
                Log.w("PushRegistration", "No se pudo registrar el token FCM", failure);
            }
        });
    }

    static void tokenChanged(Context context, String token) {
        Context app = context.getApplicationContext();
        WORKER.execute(() -> {
            try {
                register(app, token);
            } catch (Exception failure) {
                Log.w("PushRegistration", "No se pudo actualizar el token FCM", failure);
            }
        });
    }

    private static void register(Context context, String token) throws Exception {
        synchronized (LOCK) {
            SessionStore store = new SessionStore(context);
            AuthClient.Session session = store.read();
            if (session == null) return;
            if (session.needsRefresh()) {
                session = new AuthClient().refresh(session);
                store.save(session);
            }
            JSONObject data = new JSONObject().put("instalacion_id", installationId(context)).put("token", token);
            HttpUrl url = url().newBuilder().addQueryParameter("on_conflict", "usuario_id,instalacion_id").build();
            Request request = authorized(url, session.access()).header("Prefer", "resolution=merge-duplicates")
                    .post(RequestBody.create(data.toString(), MediaType.get("application/json"))).build();
            try (Response response = HTTP.newCall(request).execute()) {
                if (!response.isSuccessful()) throw new java.io.IOException("FCM registration HTTP " + response.code());
            }
        }
    }

    static void remove(Context context, SessionStore store, AuthClient.Session session) throws java.io.IOException {
        synchronized (LOCK) {
            try {
                HttpUrl url = url().newBuilder().addQueryParameter("instalacion_id", "eq." + installationId(context)).build();
                try (Response response = HTTP.newCall(authorized(url, session.access()).delete().build()).execute()) {
                    if (!response.isSuccessful()) Log.w("PushRegistration", "No se pudo retirar el token del servidor");
                }
            } catch (Exception failure) {
                Log.w("PushRegistration", "No se pudo retirar el token del servidor", failure);
            }
            try {
                Tasks.await(FirebaseMessaging.getInstance().deleteToken(), 15, TimeUnit.SECONDS);
            } catch (Exception failure) {
                Log.w("PushRegistration", "No se pudo invalidar el token FCM", failure);
            }
            store.clear();
        }
    }

    private static String installationId(Context context) {
        android.content.SharedPreferences prefs = context.getSharedPreferences("push_installation", Context.MODE_PRIVATE);
        String id = prefs.getString("id", null);
        if (id == null) {
            id = UUID.randomUUID().toString();
            prefs.edit().putString("id", id).commit();
        }
        return id;
    }

    private static HttpUrl url() throws java.io.IOException {
        HttpUrl base = HttpUrl.parse(BuildConfig.SUPABASE_URL);
        if (base == null || !base.isHttps()) throw new java.io.IOException("Supabase URL inválida");
        return base.newBuilder().encodedPath("/rest/v1/tokens_fcm").build();
    }

    private static Request.Builder authorized(HttpUrl url, String access) {
        return new Request.Builder().url(url).header("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
                .header("Authorization", "Bearer " + access);
    }
}
