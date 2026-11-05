package com.fakewhatsapp.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.text.InputType;
import android.view.WindowManager;
import android.content.Intent;
import android.net.Uri;
import android.graphics.Insets;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Patterns;
import android.view.View;
import android.view.WindowInsets;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import org.json.JSONException;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MainActivity extends Activity {
    private enum Screen { LOGIN, REGISTER, RECOVER, CONFIRM, ACCOUNT, RESTORE }
    private static final ExecutorService WORKER = Executors.newSingleThreadExecutor();
    private static final AuthClient AUTH = new AuthClient();

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable renew = this::restore;
    private SessionStore store;
    private AuthClient.Session session;
    private Screen screen;
    private boolean busy;
    private boolean foreground;
    private Uri callback;
    private TextView title, description, status;
    private EditText email, password, code, confirmation;
    private Button primary, secondary, tertiary;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        setContentView(R.layout.activity_main);
        store = new SessionStore(getApplicationContext());
        View root = findViewById(R.id.main);
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                Insets padding = insets.getInsets(WindowInsets.Type.systemBars()
                        | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(padding.left, padding.top, padding.right, padding.bottom);
            } else {
                view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                        insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets;
        });
        root.requestApplyInsets();

        title = findViewById(R.id.title);
        description = findViewById(R.id.description);
        status = findViewById(R.id.status);
        email = findViewById(R.id.email);
        password = findViewById(R.id.password);
        code = findViewById(R.id.code);
        confirmation = findViewById(R.id.confirmation);
        primary = findViewById(R.id.primary);
        secondary = findViewById(R.id.secondary);
        tertiary = findViewById(R.id.tertiary);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::navigateBack);
        }
        show(Screen.RESTORE);
        if (!acceptCallback(getIntent())) {
            restore();
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        acceptCallback(intent);
    }

    private boolean acceptCallback(Intent intent) {
        Uri uri = intent.getData();
        if (uri == null || !"com.fakewhatsapp.app".equals(uri.getScheme())
                || !"auth".equals(uri.getAuthority()) || !"/callback".equals(uri.getPath())) {
            return false;
        }
        callback = uri;
        intent.setData(null);
        finishCallback();
        return true;
    }

    private void finishCallback() {
        if (busy || callback == null) {
            return;
        }
        Uri uri = callback;
        callback = null;
        String authorizationCode = uri.getQueryParameter("code");
        run(() -> {
            AuthClient.Session active = store.read();
            if (active != null) {
                return new Result(Screen.ACCOUNT, active, 0);
            }
            SessionStore.PendingEmail pending = store.pending();
            if (pending == null) {
                return new Result(Screen.LOGIN, null, R.string.auth_expired_code);
            }
            if (authorizationCode == null || !authorizationCode.matches("[A-Za-z0-9_-]{16,256}")) {
                return new Result(Screen.CONFIRM, null, R.string.auth_expired_code, pending.email());
            }
            AuthClient.Session verified;
            try {
                verified = AUTH.exchange(authorizationCode, pending.verifier());
            } catch (AuthClient.Rejected failure) {
                if (failure.status == 400 || failure.status == 404 || failure.status == 422) {
                    return new Result(Screen.CONFIRM, null, R.string.auth_expired_code, pending.email());
                }
                throw failure;
            }
            return completeVerification(verified);
        });
    }

    @Override
    protected void onStart() {
        super.onStart();
        foreground = true;
        scheduleRenewal();
    }

    @Override
    protected void onStop() {
        foreground = false;
        handler.removeCallbacks(renew);
        super.onStop();
    }

    private void scheduleRenewal() {
        handler.removeCallbacks(renew);
        if (foreground && !busy && screen == Screen.ACCOUNT && session != null) {
            long delay = (session.expiresAt() - 60) * 1000 - System.currentTimeMillis();
            handler.postDelayed(renew, Math.max(0, delay));
        }
    }

    private void restore() {
        if (busy) {
            return;
        }
        show(Screen.RESTORE);
        run(() -> {
            AuthClient.Session saved = store.read();
            if (saved == null) {
                SessionStore.PendingEmail pending = store.pending();
                if (pending == null) {
                    return new Result(Screen.LOGIN, null, 0);
                }
                return new Result(Screen.CONFIRM, null, 0, pending.email());
            }
            if (!saved.needsRefresh()) {
                return new Result(Screen.ACCOUNT, saved, 0);
            }
            try {
                AuthClient.Session renewed = AUTH.refresh(saved);
                store.save(renewed);
                return new Result(Screen.ACCOUNT, renewed, 0);
            } catch (AuthClient.Rejected failure) {
                if (!failure.invalidSession()) {
                    throw failure;
                }
                store.clear();
                return new Result(Screen.LOGIN, null, R.string.auth_expired_session);
            }
        });
    }

    private void show(Screen next) {
        screen = next;
        password.setText("");
        confirmation.setText("");
        code.setText("");
        boolean showEmail = next == Screen.LOGIN || next == Screen.REGISTER;
        boolean showPassword = next == Screen.LOGIN || next == Screen.REGISTER || next == Screen.RECOVER;
        boolean showCode = next == Screen.CONFIRM || next == Screen.RECOVER;
        findViewById(R.id.email_row).setVisibility(showEmail ? View.VISIBLE : View.GONE);
        findViewById(R.id.password_row).setVisibility(showPassword ? View.VISIBLE : View.GONE);
        findViewById(R.id.code_row).setVisibility(showCode ? View.VISIBLE : View.GONE);
        findViewById(R.id.confirmation_row).setVisibility(next == Screen.RECOVER ? View.VISIBLE : View.GONE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            password.setAutofillHints(next == Screen.LOGIN ? "password" : "newPassword");
        }

        TextView codeLabel = findViewById(R.id.code_label);
        codeLabel.setText(next == Screen.RECOVER ? R.string.auth_recovery_code : R.string.auth_code);
        code.setInputType(next == Screen.RECOVER
                ? InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
                : InputType.TYPE_CLASS_NUMBER);
        title.setText(switch (next) {
            case LOGIN -> R.string.auth_login;
            case REGISTER -> R.string.auth_register;
            case RECOVER -> R.string.auth_recover;
            case CONFIRM -> R.string.auth_verify_signup;
            case ACCOUNT -> R.string.auth_account;
            case RESTORE -> R.string.auth_restore;
        });
        String detail = switch (next) {
            case LOGIN -> getString(R.string.auth_login_desc);
            case REGISTER -> getString(R.string.auth_register_desc);
            case RECOVER -> getString(R.string.auth_recover_desc);
            case CONFIRM -> getString(R.string.auth_code_desc, address());
            case ACCOUNT -> session.email();
            case RESTORE -> "";
        };
        description.setText(detail);
        description.setVisibility(detail.isEmpty() ? View.GONE : View.VISIBLE);
        button(primary, switch (next) {
            case LOGIN -> R.string.auth_login;
            case REGISTER -> R.string.auth_register;
            case RECOVER -> R.string.auth_save;
            case CONFIRM -> R.string.auth_verify;
            case ACCOUNT -> R.string.auth_logout;
            case RESTORE -> R.string.auth_retry;
        }, this::submit);
        button(secondary, switch (next) {
            case LOGIN -> R.string.auth_register;
            case CONFIRM -> R.string.auth_register_again;
            case REGISTER, RECOVER -> R.string.auth_back;
            case RESTORE -> R.string.auth_logout;
            case ACCOUNT -> R.string.auth_generate_recovery;
        }, () -> {
            switch (screen) {
                case LOGIN -> show(Screen.REGISTER);
                case CONFIRM -> show(Screen.REGISTER);
                case ACCOUNT -> confirmGenerateCode();
                case RESTORE -> signOut();
                default -> backToLogin();
            }
        });
        button(tertiary, switch (next) {
            case LOGIN -> R.string.auth_forgot;
            case CONFIRM -> R.string.auth_back;
            default -> 0;
        }, () -> {
            if (screen == Screen.LOGIN) {
                show(Screen.RECOVER);
            } else {
                backToLogin();
            }
        });
        message(0, false);
    }

    private void button(Button button, int label, Runnable action) {
        button.setVisibility(label == 0 ? View.GONE : View.VISIBLE);
        if (label != 0) {
            button.setText(label);
            button.setOnClickListener(view -> action.run());
        }
    }

    private void submit() {
        switch (screen) {
            case LOGIN, REGISTER -> enter();
            case RECOVER -> resetPassword();
            case CONFIRM -> verify();
            case ACCOUNT -> signOut();
            case RESTORE -> restore();
        }
    }

    private void enter() {
        String address = address();
        String secret = password.getText().toString();
        boolean registering = screen == Screen.REGISTER;
        if (!validateEmail(address) || !validatePassword(secret, registering)) {
            return;
        }
        run(() -> {
            AuthClient.Session received;
            if (registering) {
                SessionStore.PendingEmail pending = SessionStore.PendingEmail.create(address);
                store.savePending(pending);
                received = AUTH.signUp(address, secret, pending.challenge());
            } else {
                received = AUTH.signIn(address, secret);
            }
            if (received == null) {
                return new Result(Screen.CONFIRM, null, 0);
            }
            store.save(received);
            store.clearPending();
            return new Result(Screen.ACCOUNT, received, 0);
        });
    }

    private void verify() {
        String address = address();
        String token = code.getText().toString().trim();
        if (!token.matches("[0-9]{6,10}")) {
            code.setError(getString(R.string.auth_code_error));
            code.requestFocus();
            return;
        }
        run(() -> {
            return completeVerification(AUTH.verify(address, token));
        });
    }

    private Result completeVerification(AuthClient.Session verified)
            throws IOException, GeneralSecurityException, JSONException {
        store.save(verified);
        store.clearPending();
        return new Result(Screen.ACCOUNT, verified, 0);
    }

    private void resetPassword() {
        String secret = password.getText().toString();
        if (!validatePassword(secret, true)) {
            return;
        }
        if (!secret.contentEquals(confirmation.getText())) {
            confirmation.setError(getString(R.string.auth_password_mismatch));
            confirmation.requestFocus();
            return;
        }
        String recoveryCode = code.getText().toString().trim();
        if (!recoveryCode.matches("(?i)[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}")) {
            code.setError(getString(R.string.auth_invalid_recovery));
            code.requestFocus();
            return;
        }
        run(() -> {
            AUTH.resetPassword(recoveryCode, secret);
            store.clearPending();
            return new Result(Screen.LOGIN, null, R.string.auth_password_saved);
        });
    }

    private void confirmGenerateCode() {
        new AlertDialog.Builder(this)
                .setTitle(R.string.auth_generate_recovery)
                .setMessage(R.string.auth_replace_recovery)
                .setNegativeButton(android.R.string.cancel, null)
                .setPositiveButton(R.string.auth_generate_recovery, (dialog, which) -> generateCode())
                .show();
    }

    private void generateCode() {
        AuthClient.Session current = session;
        if (busy || current == null) {
            return;
        }
        run(() -> {
            AuthClient.Session active = current;
            if (current.needsRefresh()) {
                active = AUTH.refresh(current);
                store.save(active);
            }
            String generated = AUTH.generateRecoveryCode(active);
            return new Result(Screen.ACCOUNT, active, 0, active.email(), generated);
        });
    }

    private void showRecoveryCode(String generated) {
        TextView content = new TextView(this);
        int padding = getResources().getDimensionPixelSize(R.dimen.auth_gutter);
        content.setPadding(padding, padding, padding, padding);
        content.setText(getString(R.string.auth_keep_recovery, generated));
        content.setTextIsSelectable(true);
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle(R.string.auth_recovery_code)
                .setView(content)
                .setPositiveButton(android.R.string.ok, null)
                .create();
        dialog.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        dialog.show();
    }

    private void signOut() {
        run(() -> {
            AuthClient.Session saved = store.read();
            boolean revoked = saved == null;
            if (saved != null) {
                try {
                    AuthClient.Session active = saved.needsRefresh() ? AUTH.refresh(saved) : saved;
                    AUTH.signOut(active);
                    revoked = true;
                } catch (AuthClient.Rejected failure) {
                    revoked = failure.invalidSession();
                } catch (IOException | JSONException ignored) {
                    // Clear this device even when the server is unreachable.
                }
            }
            store.clear();
            return new Result(Screen.LOGIN, null, revoked ? R.string.auth_signed_out : R.string.auth_local_logout);
        });
    }

    private void backToLogin() {
        show(Screen.LOGIN);
    }

    private String address() {
        return email.getText().toString().trim();
    }

    private boolean validateEmail(String address) {
        if (Patterns.EMAIL_ADDRESS.matcher(address).matches()) {
            return true;
        }
        email.setError(getString(R.string.auth_email_error));
        email.requestFocus();
        return false;
    }

    private boolean validatePassword(String secret, boolean newPassword) {
        int error = secret.isEmpty() ? R.string.auth_password_required
                : newPassword && secret.length() < 8 ? R.string.auth_password_short : 0;
        if (error == 0) {
            return true;
        }
        password.setError(getString(error));
        password.requestFocus();
        return false;
    }

    private record Result(Screen destination, AuthClient.Session session, int notice, String address, String recoveryCode) {
        Result(Screen destination, AuthClient.Session session, int notice, String address) {
            this(destination, session, notice, address, null);
        }

        Result(Screen destination, AuthClient.Session session, int notice) {
            this(destination, session, notice, session == null ? null : session.email());
        }
    }

    @FunctionalInterface
    private interface Operation {
        Result execute() throws IOException, JSONException, GeneralSecurityException, AuthClient.Rejected;
    }

    private void run(Operation operation) {
        if (busy) {
            return;
        }
        setBusy(true);
        message(R.string.auth_busy, false);
        WORKER.execute(() -> {
            try {
                Result result = operation.execute();
                runOnUiThread(() -> {
                    if (isDestroyed() || isFinishing()) {
                        return;
                    }
                    session = result.destination() == Screen.ACCOUNT ? result.session() : null;
                    if (result.address() != null) {
                        email.setText(result.address());
                    }
                    show(result.destination());
                    message(result.notice(), false);
                    setBusy(false);
                    if (result.recoveryCode() != null) {
                        showRecoveryCode(result.recoveryCode());
                    }
                    finishCallback();
                });
            } catch (AuthClient.Rejected failure) {
                showError(errorMessage(failure));
            } catch (IOException failure) {
                showError(R.string.auth_offline);
            } catch (GeneralSecurityException failure) {
                showError(R.string.auth_storage_error);
            } catch (JSONException failure) {
                showError(R.string.auth_generic);
            }
        });
    }

    private int errorMessage(AuthClient.Rejected failure) {
        if (failure.status == 429) {
            return R.string.auth_rate_limit;
        }
        return switch (failure.code) {
            case "configuration" -> R.string.auth_config;
            case "invalid_credentials" -> R.string.auth_invalid_credentials;
            case "email_not_confirmed" -> R.string.auth_unconfirmed;
            case "otp_expired" -> R.string.auth_expired_code;
            case "email_address_not_authorized", "over_email_send_rate_limit" -> R.string.auth_email_delivery;
            case "weak_password", "same_password" -> R.string.auth_password_rejected;
            case "invalid_recovery_code" -> R.string.auth_invalid_recovery;
            case "recovery_password_length" -> R.string.auth_recovery_password_length;
            case "recovery_consumed" -> R.string.auth_recovery_consumed;
            default -> R.string.auth_generic;
        };
    }

    private void showError(int message) {
        runOnUiThread(() -> {
            if (!isDestroyed() && !isFinishing()) {
                message(message, true);
                setBusy(false);
                finishCallback();
            }
        });
    }

    private void message(int text, boolean error) {
        status.setVisibility(text == 0 ? View.GONE : View.VISIBLE);
        if (text != 0) {
            status.setText(text);
            status.setTextColor(getColor(error ? R.color.auth_error : R.color.auth_muted));
        }
    }

    private void setBusy(boolean value) {
        busy = value;
        for (View view : new View[] {email, password, code, confirmation, primary, secondary, tertiary}) {
            view.setEnabled(!value);
        }
        if (value) {
            getSystemService(InputMethodManager.class).hideSoftInputFromWindow(primary.getWindowToken(), 0);
        }
        scheduleRenewal();
    }

    @SuppressLint("GestureBackNavigation")
    @Override
    public void onBackPressed() {
        navigateBack();
    }

    private void navigateBack() {
        if (busy) {
            return;
        }
        if (screen == Screen.ACCOUNT || screen == Screen.LOGIN || screen == Screen.RESTORE) {
            finish();
        } else {
            backToLogin();
        }
    }
}
