package com.fakewhatsapp.app;

import android.os.Handler;
import android.os.Looper;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.UUID;

import okhttp3.HttpUrl;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

final class MessageSubscription {
    interface Listener {
        void joined();
        void inserted(ProfilesClient.Message message);
        void updated(ProfilesClient.Message message);
        void peerPresence(boolean online);
        void peerTyping(boolean typing);
        void disconnected();
    }

    private static final OkHttpClient HTTP = new OkHttpClient.Builder()
            .followRedirects(false).followSslRedirects(false).build();
    private static final String JOIN_REF = "1";
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final String chatId;
    private final String table;
    private final String topic;
    private final String userId;
    private final String otherUserId;
    private final boolean practice;
    private final Listener listener;
    private final Map<String, String> presenceByClient = new HashMap<>();
    private final Runnable beat = this::heartbeat;
    private final Runnable joinTimeout = this::fail;

    private WebSocket socket;
    private boolean closed;
    private boolean joined;
    private boolean joinAccepted;
    private boolean postgresReady;
    private boolean presenceTracked;
    private int nextRef = 2;
    private String heartbeatRef;

    MessageSubscription(String chatId, boolean practice, String userId, String otherUserId,
                        String token, Listener listener) throws JSONException {
        this.chatId = chatId;
        this.practice = practice;
        this.userId = userId;
        this.otherUserId = otherUserId;
        table = practice ? "mensajes_prueba" : "mensajes";
        topic = "realtime:" + table + ":" + chatId;
        this.listener = listener;

        HttpUrl base = HttpUrl.parse(BuildConfig.SUPABASE_URL);
        if (base == null || !base.isHttps() || BuildConfig.SUPABASE_PUBLISHABLE_KEY.isEmpty()) {
            throw new IllegalArgumentException("Missing Realtime configuration");
        }
        HttpUrl url = base.newBuilder().encodedPath("/realtime/v1/websocket").query(null).fragment(null)
                .addQueryParameter("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
                .addQueryParameter("vsn", "2.0.0").build();

        JSONArray changes = new JSONArray().put(new JSONObject().put("event", "INSERT")
                .put("schema", "public").put("table", table)
                .put("filter", "conversacion_id=eq." + chatId));
        if (!practice) {
            changes.put(new JSONObject().put("event", "UPDATE").put("schema", "public")
                    .put("table", table).put("filter", "conversacion_id=eq." + chatId));
        }
        String deviceId = UUID.randomUUID().toString();
        JSONObject presence = new JSONObject().put("enabled", !practice)
                .put("key", userId + ":" + deviceId);
        JSONObject config = new JSONObject()
                .put("broadcast", new JSONObject().put("ack", false).put("self", false))
                .put("presence", presence)
                .put("postgres_changes", changes)
                .put("private", !practice);
        JSONObject join = new JSONObject().put("config", config).put("access_token", token);

        socket = HTTP.newWebSocket(new Request.Builder().url(url).build(), new WebSocketListener() {
            @Override
            public void onOpen(WebSocket webSocket, Response response) {
                handler.post(() -> {
                    if (!closed) {
                        send(JOIN_REF, JOIN_REF, topic, "phx_join", join);
                    }
                });
            }

            @Override
            public void onMessage(WebSocket webSocket, String text) {
                handler.post(() -> receive(text));
            }

            @Override
            public void onClosing(WebSocket webSocket, int code, String reason) {
                handler.post(MessageSubscription.this::fail);
            }

            @Override
            public void onFailure(WebSocket webSocket, Throwable failure, Response response) {
                handler.post(MessageSubscription.this::fail);
            }

            @Override
            public void onClosed(WebSocket webSocket, int code, String reason) {
                handler.post(MessageSubscription.this::fail);
            }
        });
        handler.postDelayed(joinTimeout, 15_000);
    }

    private void receive(String text) {
        if (closed) {
            return;
        }
        try {
            JSONArray frame = new JSONArray(text);
            String reference = frame.optString(1);
            String channel = frame.optString(2);
            String event = frame.optString(3);
            JSONObject payload = frame.getJSONObject(4);
            if ("phoenix".equals(channel) && "phx_reply".equals(event) && reference.equals(heartbeatRef)) {
                heartbeatRef = null;
                return;
            }
            if (!topic.equals(channel)) {
                return;
            }
            if ("phx_reply".equals(event) && JOIN_REF.equals(reference)) {
                if (!"ok".equals(payload.optString("status"))) {
                    fail();
                    return;
                }
                joinAccepted = true;
                trackPresence();
                startWhenReady();
            } else if ("phx_error".equals(event) || "phx_close".equals(event)
                    || ("system".equals(event) && "error".equals(payload.optString("status")))) {
                fail();
            } else if ("system".equals(event) && "postgres_changes".equals(payload.optString("extension"))
                    && "ok".equals(payload.optString("status"))) {
                postgresReady = true;
                startWhenReady();
            } else if ("presence_state".equals(event)) {
                readPresenceState(payload);
            } else if ("presence_diff".equals(event)) {
                readPresenceDiff(payload);
            } else if ("broadcast".equals(event)) {
                readBroadcast(payload);
            } else if (joined && "postgres_changes".equals(event)) {
                readPostgresChange(payload);
            }
        } catch (JSONException ignored) {
            // Unrecognized frames have no effect on the conversation.
        }
    }

    private void readPostgresChange(JSONObject payload) throws JSONException {
        JSONObject change = payload.getJSONObject("data");
        if (!table.equals(change.optString("table"))) {
            return;
        }
        JSONObject row = change.getJSONObject("record");
        if (!chatId.equals(row.optString("conversacion_id"))) {
            return;
        }
        ProfilesClient.Message message = ProfilesClient.Message.from(row);
        if ("INSERT".equals(change.optString("type"))) {
            listener.inserted(message);
        } else if ("UPDATE".equals(change.optString("type"))) {
            listener.updated(message);
        }
    }

    private void readPresenceState(JSONObject state) {
        presenceByClient.clear();
        Iterator<String> clients = state.keys();
        while (clients.hasNext()) {
            String client = clients.next();
            String peer = userId(state.optJSONObject(client));
            if (peer != null) {
                presenceByClient.put(client, peer);
            }
        }
        notifyPeerPresence();
    }

    private void readPresenceDiff(JSONObject diff) {
        readPresenceEntries(diff.optJSONObject("joins"), false);
        readPresenceEntries(diff.optJSONObject("leaves"), true);
        notifyPeerPresence();
    }

    private void readPresenceEntries(JSONObject entries, boolean leaving) {
        if (entries == null) {
            return;
        }
        Iterator<String> clients = entries.keys();
        while (clients.hasNext()) {
            String client = clients.next();
            String peer = userId(entries.optJSONObject(client));
            if (leaving) {
                presenceByClient.remove(client);
            } else if (peer != null) {
                presenceByClient.put(client, peer);
            }
        }
    }

    private static String userId(JSONObject presence) {
        JSONArray metas = presence == null ? null : presence.optJSONArray("metas");
        if (metas == null) {
            return null;
        }
        for (int index = 0; index < metas.length(); index++) {
            JSONObject meta = metas.optJSONObject(index);
            if (meta != null && meta.has("user_id")) {
                return meta.optString("user_id", null);
            }
        }
        return null;
    }

    private void notifyPeerPresence() {
        boolean online = !practice && presenceByClient.containsValue(otherUserId);
        listener.peerPresence(online);
    }

    private void readBroadcast(JSONObject event) {
        if (!"typing".equals(event.optString("event"))) {
            return;
        }
        JSONObject data = event.optJSONObject("payload");
        if (data != null && otherUserId != null && otherUserId.equals(data.optString("user_id"))) {
            listener.peerTyping(data.optBoolean("typing"));
        }
    }

    private void trackPresence() throws JSONException {
        if (practice || presenceTracked || !joinAccepted || closed) {
            return;
        }
        presenceTracked = true;
        JSONObject presence = new JSONObject().put("type", "presence").put("event", "track");
        JSONObject state = new JSONObject().put("user_id", userId)
                .put("online_at", System.currentTimeMillis());
        presence.put("payload", state);
        send(JOIN_REF, Integer.toString(nextRef++), topic, "presence", presence);
    }

    void sendTyping(boolean typing) {
        if (closed || !joined || practice) {
            return;
        }
        try {
            JSONObject data = new JSONObject().put("user_id", userId).put("typing", typing);
            JSONObject event = new JSONObject().put("event", "typing")
                    .put("type", "broadcast").put("payload", data);
            send(JOIN_REF, Integer.toString(nextRef++), topic, "broadcast", event);
        } catch (JSONException failure) {
            fail();
        }
    }

    private void startWhenReady() {
        if (!joined && joinAccepted && postgresReady) {
            joined = true;
            handler.removeCallbacks(joinTimeout);
            handler.postDelayed(beat, 20_000);
            listener.joined();
        }
    }

    private void heartbeat() {
        if (heartbeatRef != null) {
            fail();
            return;
        }
        heartbeatRef = Integer.toString(nextRef++);
        send(null, heartbeatRef, "phoenix", "heartbeat", new JSONObject());
        if (!closed) {
            handler.postDelayed(beat, 20_000);
        }
    }

    private void send(String joinRef, String ref, String channel, String event, JSONObject payload) {
        JSONArray frame = new JSONArray().put(joinRef).put(ref).put(channel).put(event).put(payload);
        if (!socket.send(frame.toString())) {
            fail();
        }
    }

    private void fail() {
        if (!closed) {
            close();
            listener.disconnected();
        }
    }

    void close() {
        closed = true;
        handler.removeCallbacks(beat);
        handler.removeCallbacks(joinTimeout);
        socket.cancel();
    }
}
