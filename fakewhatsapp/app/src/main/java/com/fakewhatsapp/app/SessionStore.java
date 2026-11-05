package com.fakewhatsapp.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import org.json.JSONException;
import org.json.JSONObject;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

final class SessionStore {
    private static final String ALIAS = "fakewhatsapp.auth.v1";
    private static final String ENTRY = "session";
    private static final String PENDING = "pending_email";

    record PendingEmail(String email, String verifier, long expiresAt) {
        String challenge() throws GeneralSecurityException {
            byte[] digest = java.security.MessageDigest.getInstance("SHA-256")
                    .digest(verifier.getBytes(StandardCharsets.US_ASCII));
            return Base64.encodeToString(digest, Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING);
        }

        static PendingEmail create(String email) {
            byte[] random = new byte[32];
            new java.security.SecureRandom().nextBytes(random);
            String verifier = Base64.encodeToString(random, Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING);
            return new PendingEmail(email, verifier, System.currentTimeMillis() + 3_600_000);
        }
    }
    private final SharedPreferences preferences;

    SessionStore(Context context) {
        preferences = context.getSharedPreferences(ALIAS, Context.MODE_PRIVATE);
    }

    AuthClient.Session read() throws IOException, GeneralSecurityException, JSONException {
        JSONObject session = readEncrypted(ENTRY);
        return session == null ? null : new AuthClient.Session(session.getString("access"),
                session.getString("refresh"), session.getString("email"), session.getLong("expires"));
    }

    PendingEmail pending() throws IOException, GeneralSecurityException, JSONException {
        JSONObject data = readEncrypted(PENDING);
        if (data == null || data.optBoolean("recovery") || data.getLong("expires") <= System.currentTimeMillis()) {
            return null;
        }
        return new PendingEmail(data.getString("email"), data.getString("verifier"),
                data.getLong("expires"));
    }

    void savePending(PendingEmail pending) throws IOException, GeneralSecurityException, JSONException {
        writeEncrypted(PENDING, new JSONObject().put("email", pending.email())
                .put("verifier", pending.verifier())
                .put("expires", pending.expiresAt()));
    }

    private JSONObject readEncrypted(String entry) throws IOException, GeneralSecurityException {
        String encoded = preferences.getString(entry, null);
        if (encoded == null) {
            return null;
        }
        try {
            JSONObject envelope = new JSONObject(encoded);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key(),
                    new GCMParameterSpec(128, decode(envelope.getString("iv"))));
            return new JSONObject(new String(
                    cipher.doFinal(decode(envelope.getString("data"))), StandardCharsets.UTF_8));
        } catch (GeneralSecurityException | JSONException | IllegalArgumentException failure) {
            remove(entry);
            return null;
        }
    }

    void save(AuthClient.Session session) throws IOException, GeneralSecurityException, JSONException {
        JSONObject data = new JSONObject().put("access", session.access())
                .put("refresh", session.refresh()).put("email", session.email())
                .put("expires", session.expiresAt());
        writeEncrypted(ENTRY, data);
    }

    private void writeEncrypted(String entry, JSONObject data)
            throws IOException, GeneralSecurityException, JSONException {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key());
        JSONObject envelope = new JSONObject().put("iv", encode(cipher.getIV()))
                .put("data", encode(cipher.doFinal(data.toString().getBytes(StandardCharsets.UTF_8))));
        if (!preferences.edit().putString(entry, envelope.toString()).commit()) {
            throw new IOException("Session could not be saved");
        }
    }

    void clear() throws IOException {
        if (!preferences.edit().remove(ENTRY).remove(PENDING).commit()) {
            throw new IOException("Session could not be removed");
        }
    }

    void clearPending() throws IOException {
        remove(PENDING);
    }

    private void remove(String entry) throws IOException {
        if (!preferences.edit().remove(entry).commit()) {
            throw new IOException("Session could not be removed");
        }
    }

    private SecretKey key() throws GeneralSecurityException, IOException {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        if (keyStore.getKey(ALIAS, null) instanceof SecretKey existing) {
            return existing;
        }
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .build());
        return generator.generateKey();
    }

    private static String encode(byte[] bytes) {
        return Base64.encodeToString(bytes, Base64.NO_WRAP);
    }

    private static byte[] decode(String text) {
        return Base64.decode(text, Base64.NO_WRAP);
    }
}
