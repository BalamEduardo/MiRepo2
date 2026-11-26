package com.fakewhatsapp.app;

import org.json.JSONException;
import org.json.JSONObject;
import java.io.IOException;
import java.util.concurrent.TimeUnit;
import okhttp3.HttpUrl;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

final class AuthClient {
    static final String REDIRECT = "com.fakewhatsapp.app://auth/callback";
    private static final MediaType JSON = MediaType.get("application/json");
    private final OkHttpClient http = new OkHttpClient.Builder()
            .callTimeout(15, TimeUnit.SECONDS)
            .retryOnConnectionFailure(false)
            .followRedirects(false)
            .followSslRedirects(false)
            .build();

    record Session(String access, String refresh, String email, long expiresAt) {
        boolean needsRefresh() {
            return expiresAt <= System.currentTimeMillis() / 1000 + 60;
        }

        static Session fromResponse(JSONObject data) throws JSONException {
            String access = data.getString("access_token");
            String refresh = data.getString("refresh_token");
            String email = data.getJSONObject("user").getString("email");
            if (access.isEmpty() || refresh.isEmpty()) {
                throw new JSONException("Missing session tokens");
            }
            return new Session(access, refresh, email,
                    System.currentTimeMillis() / 1000 + data.getLong("expires_in"));
        }
    }

    static final class Rejected extends Exception {
        final int status;
        final String code;

        Rejected(int status, String code) {
            this.status = status;
            this.code = code;
        }

        boolean invalidSession() {
            return status == 401 || status == 403 || "refresh_token_not_found".equals(code)
                    || "refresh_token_already_used".equals(code) || "session_not_found".equals(code);
        }
    }

    Session signIn(String email, String password) throws IOException, JSONException, Rejected {
        return Session.fromResponse(request("POST", "token", "grant_type", "password",
                credentials(email, password), null));
    }

    Session signUp(String email, String password, String challenge) throws IOException, JSONException, Rejected {
        JSONObject response = request("POST", "signup", "redirect_to", REDIRECT,
                withChallenge(credentials(email, password), challenge), null);
        return response.has("access_token") ? Session.fromResponse(response) : null;
    }

    String generateRecoveryCode(Session session) throws IOException, JSONException, Rejected {
        return request("POST", "/functions/v1/password-recovery", null, null,
                new JSONObject().put("action", "generate"), session.access()).getString("code");
    }

    void resetPassword(String code, String password) throws IOException, JSONException, Rejected {
        request("POST", "/functions/v1/password-recovery", null, null,
                new JSONObject().put("action", "reset").put("code", code).put("password", password), null);
    }

    Session exchange(String code, String verifier) throws IOException, JSONException, Rejected {
        return Session.fromResponse(request("POST", "token", "grant_type", "pkce",
                new JSONObject().put("auth_code", code).put("code_verifier", verifier), null));
    }

    private JSONObject withChallenge(JSONObject data, String challenge) throws JSONException {
        return data.put("code_challenge", challenge).put("code_challenge_method", "s256");
    }

    Session verify(String email, String code)
            throws IOException, JSONException, Rejected {
        JSONObject data = new JSONObject().put("email", email).put("token", code)
                .put("type", "signup");
        return Session.fromResponse(request("POST", "verify", null, null, data, null));
    }

    Session refresh(Session session) throws IOException, JSONException, Rejected {
        return Session.fromResponse(request("POST", "token", "grant_type", "refresh_token",
                new JSONObject().put("refresh_token", session.refresh()), null));
    }

    void signOut(Session session) throws IOException, JSONException, Rejected {
        request("POST", "logout", "scope", "local", new JSONObject(), session.access());
    }

    private JSONObject credentials(String email, String password) throws JSONException {
        return new JSONObject().put("email", email).put("password", password);
    }

    private JSONObject request(String method, String path, String parameter, String value,
                               JSONObject data, String access) throws IOException, JSONException, Rejected {
        HttpUrl base = HttpUrl.parse(BuildConfig.SUPABASE_URL);
        String key = BuildConfig.SUPABASE_PUBLISHABLE_KEY;
        if (base == null || !base.isHttps() || !key.matches("sb_publishable_[A-Za-z0-9_-]+")) {
            throw new Rejected(0, "configuration");
        }
        HttpUrl.Builder url = base.newBuilder().encodedPath(path.startsWith("/") ? path : "/auth/v1/" + path).query(null).fragment(null);
        if (parameter != null) {
            url.addQueryParameter(parameter, value);
        }
        Request.Builder request = new Request.Builder().url(url.build())
                .header("apikey", key).method(method, RequestBody.create(data.toString(), JSON));
        if (access != null) {
            request.header("Authorization", "Bearer " + access);
        }
        try (Response response = http.newCall(request.build()).execute()) {
            String body = response.body() == null ? "" : response.body().string();
            if (!response.isSuccessful()) {
                String code = "";
                try {
                    code = new JSONObject(body).optString("error_code");
                } catch (JSONException ignored) {
                    // HTTP status still identifies gateway and rate-limit errors.
                }
                throw new Rejected(response.code(), code);
            }
            return body.isEmpty() ? new JSONObject() : new JSONObject(body);
        }
    }
}
