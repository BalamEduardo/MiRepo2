package com.fakewhatsapp.app;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

import okhttp3.HttpUrl;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

final class ProfilesClient {
    static final int PAGE_SIZE = 50;
    private static final MediaType JSON = MediaType.get("application/json");
    private static final MediaType JPEG = MediaType.get("image/jpeg");
    private static final String PROFILES = "/rest/v1/perfiles";
    private final OkHttpClient http = new OkHttpClient.Builder().callTimeout(20, TimeUnit.SECONDS)
            .followRedirects(false).followSslRedirects(false).build();

    record Profile(String id, String name, boolean photo) {
        static Profile from(JSONObject item) throws JSONException {
            return new Profile(item.getString("id"), item.getString("nombre"), item.getBoolean("tiene_foto"));
        }
    }

    record Page(List<Profile> contacts, boolean hasMore) {}

    String userId(String access) throws IOException, JSONException, AuthClient.Rejected {
        return new JSONObject(new String(call(request("/auth/v1/user", access).build()),
                java.nio.charset.StandardCharsets.UTF_8)).getString("id");
    }

    Profile ownProfile(String access, String id) throws IOException, JSONException, AuthClient.Rejected {
        HttpUrl url = url(PROFILES).newBuilder().addQueryParameter("id", "eq." + id)
                .addQueryParameter("select", "id,nombre,tiene_foto").build();
        JSONArray rows = array(call(request(url, access).build()));
        return rows.length() == 0 ? null : Profile.from(rows.getJSONObject(0));
    }

    Page search(String access, String query, int offset, boolean savedOnly) throws IOException, JSONException, AuthClient.Rejected {
        JSONObject input = new JSONObject().put("busqueda", query).put("desde", offset);
        String rpc = savedOnly ? "buscar_contactos_guardados" : "buscar_contactos";
        Request request = request("/rest/v1/rpc/" + rpc, access).post(json(input)).build();
        JSONArray rows = array(call(request));
        List<Profile> contacts = new ArrayList<>();
        for (int i = 0; i < Math.min(PAGE_SIZE, rows.length()); i++) {
            contacts.add(Profile.from(rows.getJSONObject(i)));
        }
        return new Page(contacts, rows.length() > PAGE_SIZE);
    }

    record Chat(String id, Profile contact, String lastMessage, String lastSenderId, boolean practice) {}

    record ChatPage(List<Chat> chats, boolean hasMore) {}

    ChatPage chats(String access, int offset) throws IOException, JSONException, AuthClient.Rejected {
        JSONObject data = new JSONObject().put("desde", offset);
        JSONArray rows = array(call(request("/rest/v1/rpc/listar_chats_con_prueba", access)
                .post(json(data)).build()));
        List<Chat> chats = new ArrayList<>();
        for (int index = 0; index < Math.min(PAGE_SIZE, rows.length()); index++) {
            JSONObject row = rows.getJSONObject(index);
            Profile contact = new Profile(row.getString("destinatario_id"), row.getString("nombre"),
                    row.getBoolean("tiene_foto"));
            chats.add(new Chat(row.getString("id"), contact, row.isNull("ultimo_mensaje") ? "" : row.getString("ultimo_mensaje"),
                    row.isNull("ultimo_remitente_id") ? "" : row.getString("ultimo_remitente_id"),
                    row.getBoolean("de_prueba")));
        }
        return new ChatPage(chats, rows.length() > PAGE_SIZE);
    }

    String openChat(String access, String recipient) throws IOException, JSONException, AuthClient.Rejected {
        JSONObject data = new JSONObject().put("destinatario", recipient);
        return chatId(access, "abrir_chat_directo", data);
    }

    String createPracticeContact(String access, String name) throws IOException, JSONException, AuthClient.Rejected {
        return chatId(access, "crear_contacto_prueba", new JSONObject().put("nombre_contacto", name));
    }

    private String chatId(String access, String rpc, JSONObject data)
            throws IOException, JSONException, AuthClient.Rejected {
        byte[] body = call(request("/rest/v1/rpc/" + rpc, access).post(json(data)).build());
        return new JSONArray("[" + new String(body, java.nio.charset.StandardCharsets.UTF_8) + "]").getString(0);
    }

    record Message(String id, String senderId, String content, String sentAt,
                   String receivedAt, String readAt, String imagePath, boolean deleted) {
        static Message from(JSONObject row) throws JSONException {
            return new Message(row.getString("id"), row.getString("remitente_id"),
                    row.getString("contenido"), row.getString("enviado_en"),
                    nullableString(row, "recibido_en"), nullableString(row, "leido_en"),
                    nullableString(row, "imagen_ruta"), row.optBoolean("eliminado"));
        }

        Message withState(Message update) {
            return new Message(id, senderId, update.content, sentAt,
                    update.receivedAt == null ? receivedAt : update.receivedAt,
                    update.readAt == null ? readAt : update.readAt, update.imagePath, update.deleted);
        }
    }

    record MessagePage(List<Message> messages, boolean hasMore) {}

    MessagePage history(String access, String chat, boolean practice, Message before)
            throws IOException, JSONException, AuthClient.Rejected {
        HttpUrl.Builder url = url(messagePath(practice)).newBuilder()
                .addQueryParameter("conversacion_id", "eq." + chat)
                .addQueryParameter("select", practice
                        ? "id,remitente_id,contenido,enviado_en"
                        : "id,remitente_id,contenido,enviado_en,recibido_en,leido_en,imagen_ruta,eliminado")
                .addQueryParameter("order", "enviado_en.desc,id.desc")
                .addQueryParameter("limit", String.valueOf(PAGE_SIZE + 1));
        if (before != null) {
            url.addQueryParameter("or", "(enviado_en.lt." + before.sentAt()
                    + ",and(enviado_en.eq." + before.sentAt() + ",id.lt." + before.id() + "))");
        }
        JSONArray rows = array(call(request(url.build(), access).build()));
        List<Message> messages = new ArrayList<>();
        for (int index = Math.min(PAGE_SIZE, rows.length()) - 1; index >= 0; index--) {
            messages.add(Message.from(rows.getJSONObject(index)));
        }
        return new MessagePage(messages, rows.length() > PAGE_SIZE);
    }

    void sendMessage(String access, String chat, boolean practice, String messageId, String content)
            throws IOException, JSONException, AuthClient.Rejected {
        JSONObject data = new JSONObject().put("id", messageId).put("conversacion_id", chat)
                .put("contenido", content);
        call(request(messagePath(practice), access).header("Prefer", "resolution=ignore-duplicates")
                .post(json(data)).build());
    }

    void markMessagesReceived(String access, String chat, List<String> ids)
            throws IOException, JSONException, AuthClient.Rejected {
        if (ids.isEmpty()) {
            return;
        }
        JSONArray messageIds = new JSONArray();
        for (String id : ids) {
            messageIds.put(id);
        }
        JSONObject arguments = new JSONObject().put("p_conversacion_id", chat)
                .put("p_mensajes_ids", messageIds);
        call(request("/rest/v1/rpc/confirmar_mensajes_recibidos", access).post(json(arguments)).build());
    }

    void markMessagesRead(String access, String chat)
            throws IOException, JSONException, AuthClient.Rejected {
        JSONObject arguments = new JSONObject().put("p_conversacion_id", chat);
        call(request("/rest/v1/rpc/marcar_mensajes_leidos", access).post(json(arguments)).build());
    }

    void updateLastSeen(String access)
            throws IOException, JSONException, AuthClient.Rejected {
        call(request("/rest/v1/rpc/registrar_ultima_conexion", access)
                .post(json(new JSONObject())).build());
    }

    String lastSeen(String access, String profileId)
            throws IOException, JSONException, AuthClient.Rejected {
        HttpUrl url = url(PROFILES).newBuilder().addQueryParameter("id", "eq." + profileId)
                .addQueryParameter("select", "ultima_conexion").build();
        JSONArray rows = array(call(request(url, access).build()));
        return rows.length() == 0 ? null : nullableString(rows.getJSONObject(0), "ultima_conexion");
    }

    List<String> members(String access, String chat) throws Exception {
        HttpUrl url = url("/rest/v1/conversaciones_miembros").newBuilder()
                .addQueryParameter("conversacion_id", "eq." + chat).addQueryParameter("select", "perfiles(nombre)").build();
        JSONArray rows = array(call(request(url, access).build()));
        List<String> names = new ArrayList<>();
        for (int i = 0; i < rows.length(); i++) names.add(rows.getJSONObject(i).getJSONObject("perfiles").getString("nombre"));
        return names;
    }

    String createGroup(String access, String title, List<String> members) throws Exception {
        return chatId(access, "crear_grupo", new JSONObject().put("titulo", title)
                .put("participantes", new JSONArray(members)));
    }

    List<Message> searchMessages(String access, String chat, String text) throws Exception {
        JSONArray rows = array(call(request("/rest/v1/rpc/buscar_mensajes", access)
                .post(json(new JSONObject().put("chat", chat).put("consulta", text))).build()));
        List<Message> results = new ArrayList<>();
        for (int i = 0; i < rows.length(); i++) results.add(Message.from(rows.getJSONObject(i)));
        return results;
    }

    void deleteMessage(String access, String id) throws Exception {
        call(request("/rest/v1/rpc/eliminar_mensaje", access)
                .post(json(new JSONObject().put("mensaje", id))).build());
    }

    void sendImage(String access, String chat, String user, Bitmap bitmap) throws Exception {
        String id = java.util.UUID.randomUUID().toString();
        String path = chat + "/" + user + "/" + id + ".jpg";
        java.io.ByteArrayOutputStream bytes = new java.io.ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.JPEG, 85, bytes);
        if (bytes.size() > 2097152) throw new IOException("Imagen demasiado grande");
        call(request("/storage/v1/object/imagenes-chat/" + path, access)
                .post(RequestBody.create(bytes.toByteArray(), JPEG)).build());
        call(request("/rest/v1/mensajes", access).post(json(new JSONObject().put("id", id)
                .put("conversacion_id", chat).put("contenido", "Imagen").put("imagen_ruta", path))).build());
    }

    Bitmap chatImage(String access, String path) throws Exception {
        byte[] bytes = call(request("/storage/v1/object/authenticated/imagenes-chat/" + path, access).build());
        return BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
    }

    private static String messagePath(boolean practice) {
        return practice ? "/rest/v1/mensajes_prueba" : "/rest/v1/mensajes";
    }

    void saveContact(String access, String contactId)
            throws IOException, JSONException, AuthClient.Rejected {
        JSONObject data = new JSONObject().put("contacto_id", contactId);
        call(request("/rest/v1/contactos", access).header("Prefer", "resolution=ignore-duplicates")
                .post(json(data)).build());
    }

    void save(String access, Profile profile) throws IOException, JSONException, AuthClient.Rejected {
        HttpUrl url = url(PROFILES).newBuilder().addQueryParameter("on_conflict", "id").build();
        JSONObject data = new JSONObject().put("id", profile.id()).put("nombre", profile.name())
                .put("tiene_foto", profile.photo());
        call(request(url, access).header("Prefer", "resolution=merge-duplicates")
                .post(json(data)).build());
    }

    void upload(String access, String id, byte[] bytes) throws IOException, AuthClient.Rejected {
        call(request("/storage/v1/object/avatares/" + id + ".jpg", access)
                .header("x-upsert", "true").post(RequestBody.create(bytes, JPEG)).build());
    }

    Bitmap avatar(String access, String id) throws IOException, AuthClient.Rejected {
        byte[] bytes = call(request("/storage/v1/object/authenticated/avatares/" + id + ".jpg", access).build());
        return BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
    }

    private static JSONArray array(byte[] bytes) throws JSONException {
        return new JSONArray(new String(bytes, java.nio.charset.StandardCharsets.UTF_8));
    }

    private static String nullableString(JSONObject row, String key) {
        return row.has(key) && !row.isNull(key) ? row.optString(key) : null;
    }

    private static RequestBody json(JSONObject data) {
        return RequestBody.create(data.toString(), JSON);
    }

    private HttpUrl url(String path) throws AuthClient.Rejected {
        HttpUrl base = HttpUrl.parse(BuildConfig.SUPABASE_URL);
        if (base == null || !base.isHttps() || BuildConfig.SUPABASE_PUBLISHABLE_KEY.isEmpty()) {
            throw new AuthClient.Rejected(0, "configuration");
        }
        return base.newBuilder().encodedPath(path).query(null).fragment(null).build();
    }

    private Request.Builder request(String path, String access) throws AuthClient.Rejected {
        return request(url(path), access);
    }

    private Request.Builder request(HttpUrl url, String access) {
        return new Request.Builder().url(url).header("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
                .header("Authorization", "Bearer " + access);
    }

    private byte[] call(Request request) throws IOException, AuthClient.Rejected {
        try (Response response = http.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String code = "";
                if (response.body() != null) {
                    try {
                        code = new JSONObject(response.body().string()).optString("message");
                    } catch (JSONException ignored) {
                        // Use the HTTP status when the response is not JSON.
                    }
                }
                throw new AuthClient.Rejected(response.code(), code);
            }
            return response.body() == null ? new byte[0] : response.body().bytes();
        }
    }
}
