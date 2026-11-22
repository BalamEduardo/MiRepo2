package com.fakewhatsapp.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.ImageDecoder;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.LruCache;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class ContactsActivity extends Activity {
    private static final int PICK_PHOTO = 1;
    private static final int PICK_CHAT_IMAGE = 3;
    private String imageChat;
    private enum Panel { CHATS, DIRECTORY, PROFILE, CHAT }
    private final ProfilesClient client = new ProfilesClient();
    private final AuthClient auth = new AuthClient();
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final ExecutorService photos = Executors.newFixedThreadPool(2);
    private final LruCache<String, Bitmap> avatars = new LruCache<>(32);
    private final List<ProfilesClient.Chat> chats = new ArrayList<>();
    private final List<ProfilesClient.Profile> contacts = new ArrayList<>();
    private final Runnable search = () -> loadContacts(0);

    private SessionStore store;
    private volatile AuthClient.Session session;
    private String userId;
    private ProfilesClient.Profile own;
    private ProfilesClient.Profile recipient;
    private Bitmap pendingPhoto;
    private volatile int searchVersion;
    private int nextOffset;
    private Panel panel = Panel.CHATS;
    private boolean openingChat;
    private boolean savingContact;
    private boolean savedOnly;
    private ChatView chatView;
    private boolean profileBusy;
    private boolean profileLoaded;

    private ContactsAdapter adapter;
    private ChatsAdapter chatsAdapter;
    private EditText query;
    private EditText name;
    private TextView directoryStatus;
    private TextView profileStatus;
    private ImageView profileAvatar;
    private Button more;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        setContentView(R.layout.activity_contacts);
        store = new SessionStore(getApplicationContext());
        View root = findViewById(R.id.contacts_root);
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                var safe = insets.getInsets(WindowInsets.Type.systemBars()
                        | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(safe.left, safe.top, safe.right, safe.bottom);
            } else {
                view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                        insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets;
        });
        root.requestApplyInsets();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::goBack);
        }

        query = findViewById(R.id.contact_query);
        name = findViewById(R.id.profile_name);
        directoryStatus = findViewById(R.id.directory_status);
        profileStatus = findViewById(R.id.profile_status);
        profileAvatar = findViewById(R.id.profile_avatar);
        more = findViewById(R.id.directory_more);
        RecyclerView list = findViewById(R.id.contact_list);
        list.setLayoutManager(new LinearLayoutManager(this));
        adapter = new ContactsAdapter();
        list.setAdapter(adapter);
        RecyclerView chatList = findViewById(R.id.chat_list);
        chatList.setLayoutManager(new LinearLayoutManager(this));
        chatsAdapter = new ChatsAdapter();
        chatList.setAdapter(chatsAdapter);
        findViewById(R.id.chats_group).setOnClickListener(view -> createGroup());
        findViewById(R.id.chats_new).setOnClickListener(view -> showDirectory());
        findViewById(R.id.create_practice_contact).setOnClickListener(view -> showNewContact());
        findViewById(R.id.chat_back).setOnClickListener(view -> goBack());
        findViewById(R.id.contacts_filter).setOnClickListener(view -> toggleContactFilter());
        findViewById(R.id.recipient_save).setOnClickListener(view -> saveSelectedContact());
        chatView = new ChatView(this, client, (action, failure) -> submit(action::run, failure), this::access);
        findViewById(R.id.recipient_open).setOnClickListener(view -> openSelectedChat());
        findViewById(R.id.edit_profile).setOnClickListener(view -> openProfile());
        findViewById(R.id.profile_back).setOnClickListener(view -> goBack());
        findViewById(R.id.profile_save).setOnClickListener(view -> saveProfile());
        findViewById(R.id.profile_photo).setOnClickListener(view -> pickPhoto());
        findViewById(R.id.recipient_clear).setOnClickListener(view -> selectRecipient(null));
        selectRecipient(null);
        query.addTextChangedListener(new TextWatcher() {
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                searchVersion++;
                more.setVisibility(View.GONE);
                handler.removeCallbacks(search);
                handler.postDelayed(search, 300);
            }
            public void afterTextChanged(Editable value) {}
        });
        query.setOnEditorActionListener((view, action, event) -> {
            hideKeyboard();
            return true;
        });
        root.setFocusableInTouchMode(true);
        root.requestFocus();
        loadChats(0);
        String notificationChat = getIntent().getStringExtra("conversacion_id");
        if (notificationChat != null) openNotificationChat(notificationChat);
    }

    private void openNotificationChat(String id) {
        submit(() -> {
            String token = access();
            if (userId == null) userId = client.userId(token);
            int offset = 0;
            ProfilesClient.Chat found = null;
            while (true) {
                ProfilesClient.ChatPage page = client.chats(token, offset);
                for (ProfilesClient.Chat chat : page.chats()) {
                    if (!chat.practice() && id.equals(chat.id())) {
                        found = chat;
                        break;
                    }
                }
                if (found != null || !page.hasMore() || page.chats().isEmpty()) break;
                offset += page.chats().size();
            }
            ProfilesClient.Chat chat = found;
            if (chat != null) onUi(() -> showChat(chat.id(), chat.contact().name(), chat.contact().id(), false));
        }, failure -> status(findViewById(R.id.chats_status), error(failure)));
    }

    private String access() throws Exception {
        if (session == null) {
            session = store.read();
        }
        if (session == null) {
            throw new AuthClient.Rejected(401, "");
        }
        if (session.needsRefresh()) {
            session = auth.refresh(session);
            store.save(session);
        }
        return session.access();
    }

    private void showDirectory() {
        showPanel(Panel.DIRECTORY);
        loadContacts(0);
    }

    private void loadChats(int offset) {
        TextView feedback = findViewById(R.id.chats_status);
        Button moreChats = findViewById(R.id.chats_more);
        moreChats.setVisibility(View.GONE);
        status(feedback, R.string.chats_loading);
        submit(() -> {
            String token = access();
            if (userId == null) {
                userId = client.userId(token);
            }
            ProfilesClient.ChatPage page = client.chats(token, offset);
            onUi(() -> {
                if (offset == 0) {
                    chats.clear();
                }
                chats.addAll(page.chats());
                chatsAdapter.notifyDataSetChanged();
                status(feedback, chats.isEmpty() ? R.string.chats_empty : 0);
                moreChats.setVisibility(page.hasMore() ? View.VISIBLE : View.GONE);
                moreChats.setText(R.string.contacts_load);
                moreChats.setOnClickListener(view -> loadChats(offset + page.chats().size()));
            });
        }, failure -> {
            status(feedback, error(failure));
            moreChats.setVisibility(View.VISIBLE);
            moreChats.setText(R.string.contacts_retry);
            moreChats.setOnClickListener(view -> loadChats(offset));
        });
    }

    private void openSelectedChat() {
        ProfilesClient.Profile selected = recipient;
        if (selected == null || openingChat || savingContact) {
            return;
        }
        openingChat = true;
        View open = findViewById(R.id.recipient_open);
        TextView feedback = findViewById(R.id.chat_creation_status);
        open.setEnabled(false);
        findViewById(R.id.edit_profile).setEnabled(false);
        status(feedback, R.string.chats_opening);
        submit(() -> {
            String token = access();
            if (userId == null) {
                userId = client.userId(token);
            }
            String chatId = client.openChat(token, selected.id());
            onUi(() -> {
                finishOpeningChat();
                selectRecipient(null);
                showChat(chatId, selected.name(), selected.id(), false);
            });
        }, failure -> {
            finishOpeningChat();
            if (failure instanceof AuthClient.Rejected rejected) {
                if ("perfil_requerido".equals(rejected.code)) {
                    status(feedback, R.string.chats_profile_required);
                    return;
                }
                if ("destinatario_invalido".equals(rejected.code)) {
                    selectRecipient(null);
                    status(feedback, R.string.chats_recipient_unavailable);
                    return;
                }
            }
            status(feedback, error(failure));
        });
    }

    private void finishOpeningChat() {
        openingChat = false;
        findViewById(R.id.recipient_open).setEnabled(true);
        findViewById(R.id.edit_profile).setEnabled(true);
        findViewById(R.id.create_practice_contact).setEnabled(true);
    }

    private void showNewContact() {
        if (openingChat || savingContact) {
            return;
        }
        EditText contactName = new EditText(this);
        contactName.setSingleLine(true);
        contactName.setInputType(android.text.InputType.TYPE_CLASS_TEXT
                | android.text.InputType.TYPE_TEXT_FLAG_CAP_WORDS);
        contactName.setFilters(new android.text.InputFilter[] {new android.text.InputFilter.LengthFilter(80)});
        contactName.setHint(R.string.contacts_name);
        android.widget.FrameLayout form = new android.widget.FrameLayout(this);
        int gutter = getResources().getDimensionPixelSize(R.dimen.auth_gutter);
        form.setPadding(gutter, 0, gutter, 0);
        form.addView(contactName, new android.widget.FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        android.app.AlertDialog dialog = new android.app.AlertDialog.Builder(this)
                .setTitle(R.string.contacts_create)
                .setMessage(R.string.contacts_practice_hint)
                .setView(form)
                .setNegativeButton(android.R.string.cancel, null)
                .setPositiveButton(R.string.contacts_create_open, null)
                .create();
        dialog.setOnShowListener(ignored -> dialog.getButton(android.app.AlertDialog.BUTTON_POSITIVE)
                .setOnClickListener(view -> {
                    String contact = contactName.getText().toString().trim();
                    if (contact.isEmpty()) {
                        contactName.setError(getString(R.string.contacts_name_error));
                        return;
                    }
                    dialog.dismiss();
                    createPracticeContact(contact);
                }));
        contactName.requestFocus();
        dialog.getWindow().setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_STATE_VISIBLE);
        dialog.show();
    }

    private void createPracticeContact(String name) {
        openingChat = true;
        findViewById(R.id.create_practice_contact).setEnabled(false);
        findViewById(R.id.recipient_open).setEnabled(false);
        findViewById(R.id.edit_profile).setEnabled(false);
        TextView feedback = findViewById(R.id.chat_creation_status);
        status(feedback, R.string.chats_opening);
        submit(() -> {
            String token = access();
            if (userId == null) {
                userId = client.userId(token);
            }
            String id = client.createPracticeContact(token, name);
            onUi(() -> {
                finishOpeningChat();
                selectRecipient(null);
                showChat(id, name, null, true);
            });
        }, failure -> {
            finishOpeningChat();
            status(feedback, error(failure));
        });
    }

    private String chatPreview(ProfilesClient.Chat chat) {
        if (chat.lastMessage().isEmpty()) {
            return getString(R.string.chats_no_messages);
        }
        if (chat.id().equals(chat.contact().id()) && !chat.practice()) return chat.lastMessage();
        String sender = chat.lastSenderId().equals(userId)
                ? getString(R.string.chats_sender_you) : chat.contact().name();
        return getString(R.string.chats_preview, sender, chat.lastMessage());
    }

    private void showChat(String chatId, String name, String contactId, boolean practice) {
        showPanel(Panel.CHAT);
        chatView.open(chatId, name, userId, chatId.equals(contactId) ? null : contactId, practice);
    }

    void pickChatImage(String chatId) {
        imageChat = chatId;
        startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("image/*")
                .addCategory(Intent.CATEGORY_OPENABLE), PICK_CHAT_IMAGE);
    }

    private void createGroup() {
        status(findViewById(R.id.chats_status), R.string.contacts_loading);
        submit(() -> {
            String token = access();
            List<ProfilesClient.Profile> people = new ArrayList<>();
            int offset = 0;
            while (true) {
                ProfilesClient.Page page = client.search(token, "", offset, false);
                people.addAll(page.contacts());
                if (!page.hasMore() || page.contacts().isEmpty()) break;
                offset += page.contacts().size();
            }
            onUi(() -> {
                status(findViewById(R.id.chats_status), 0);
                EditText title = new EditText(this);
                title.setHint(R.string.group_name);
                title.setSingleLine(true);
                title.setFilters(new android.text.InputFilter[]{new android.text.InputFilter.LengthFilter(80)});
                boolean[] checked = new boolean[people.size()];
                String[] names = people.stream().map(ProfilesClient.Profile::name).toArray(String[]::new);
                android.app.AlertDialog dialog = new android.app.AlertDialog.Builder(this)
                        .setTitle(R.string.group_create).setView(title)
                        .setMultiChoiceItems(names, checked, (d, which, value) -> checked[which] = value)
                        .setNegativeButton(android.R.string.cancel, null)
                        .setPositiveButton(R.string.group_create, null).create();
                dialog.setOnShowListener(ignored -> dialog.getButton(android.app.AlertDialog.BUTTON_POSITIVE)
                        .setOnClickListener(v -> {
                            List<String> ids = new ArrayList<>();
                            for (int i = 0; i < checked.length; i++) if (checked[i]) ids.add(people.get(i).id());
                            String name = title.getText().toString().trim();
                            if (name.isEmpty() || ids.isEmpty() || ids.size() > 49) {
                                title.setError("Escribe un nombre y elige entre 1 y 49 participantes");
                                return;
                            }
                            dialog.dismiss();
                            submit(() -> {
                                String access = access();
                                if (userId == null) userId = client.userId(access);
                                String id = client.createGroup(access, name, ids);
                                onUi(() -> showChat(id, name, id, false));
                            }, failure -> status(findViewById(R.id.chats_status), error(failure)));
                        }));
                dialog.show();
            });
        }, failure -> status(findViewById(R.id.chats_status), error(failure)));
    }

    private void toggleContactFilter() {
        if (openingChat || savingContact) {
            return;
        }
        savedOnly = !savedOnly;
        ((Button) findViewById(R.id.contacts_filter)).setText(savedOnly
                ? R.string.contacts_everyone : R.string.contacts_saved_only);
        selectRecipient(null);
        handler.removeCallbacks(search);
        loadContacts(0);
    }

    private void saveSelectedContact() {
        ProfilesClient.Profile selected = recipient;
        if (selected == null || savedOnly || openingChat || savingContact) {
            return;
        }
        setSavingContact(true);
        TextView feedback = findViewById(R.id.chat_creation_status);
        submit(() -> {
            client.saveContact(access(), selected.id());
            onUi(() -> {
                setSavingContact(false);
                status(feedback, R.string.contacts_added);
            });
        }, failure -> {
            setSavingContact(false);
            int notice = failure instanceof AuthClient.Rejected rejected && rejected.status == 409
                    ? R.string.contacts_add_profile_required : error(failure);
            status(feedback, notice);
        });
    }

    private void setSavingContact(boolean saving) {
        savingContact = saving;
        findViewById(R.id.recipient_save).setEnabled(!saving);
        findViewById(R.id.recipient_open).setEnabled(!saving);
        findViewById(R.id.edit_profile).setEnabled(!saving);
    }

    private void showPanel(Panel next) {
        panel = next;
        findViewById(R.id.chats_panel).setVisibility(next == Panel.CHATS ? View.VISIBLE : View.GONE);
        findViewById(R.id.directory_panel).setVisibility(next == Panel.DIRECTORY ? View.VISIBLE : View.GONE);
        findViewById(R.id.profile_panel).setVisibility(next == Panel.PROFILE ? View.VISIBLE : View.GONE);
        findViewById(R.id.chat_detail).setVisibility(next == Panel.CHAT ? View.VISIBLE : View.GONE);
    }

    private void loadContacts(int offset) {
        int version = ++searchVersion;
        String term = query.getText().toString().trim();
        boolean onlySaved = savedOnly;
        more.setVisibility(View.GONE);
        if (offset == 0) {
            contacts.clear();
            adapter.notifyDataSetChanged();
        }
        status(directoryStatus, R.string.contacts_loading);
        submit(() -> {
            if (version != searchVersion) {
                return;
            }
            ProfilesClient.Page page = client.search(access(), term, offset, onlySaved);
            onUi(() -> {
                if (searchVersion != version) {
                    return;
                }
                contacts.addAll(page.contacts());
                adapter.notifyDataSetChanged();
                nextOffset = offset + page.contacts().size();
                status(directoryStatus, contacts.isEmpty()
                        ? (term.isEmpty() ? (onlySaved ? R.string.contacts_saved_empty : R.string.contacts_empty)
                                : R.string.contacts_no_matches) : 0);
                more.setVisibility(page.hasMore() ? View.VISIBLE : View.GONE);
                more.setText(R.string.contacts_load);
                more.setOnClickListener(view -> loadContacts(nextOffset));
            });
        }, failure -> {
            if (searchVersion == version) {
                status(directoryStatus, error(failure));
                more.setVisibility(View.VISIBLE);
                more.setText(R.string.contacts_retry);
                more.setOnClickListener(view -> loadContacts(offset));
            }
        });
    }

    private void openProfile() {
        profileLoaded = false;
        hideKeyboard();
        showPanel(Panel.PROFILE);
        setProfileBusy(true);
        status(profileStatus, R.string.contacts_profile_loading);
        submit(() -> {
            String token = access();
            if (userId == null) {
                userId = client.userId(token);
            }
            ProfilesClient.Profile loaded = client.ownProfile(token, userId);
            onUi(() -> {
                own = loaded;
                profileLoaded = true;
                name.setText(own == null ? "" : own.name());
                bindAvatar(findViewById(R.id.profile_initial), profileAvatar, own);
                setProfileBusy(false);
                status(profileStatus, 0);
            });
        }, failure -> {
            status(profileStatus, error(failure));
            setProfileBusy(false);
        });
    }

    private void pickPhoto() {
        Intent picker = new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("image/*")
                .addCategory(Intent.CATEGORY_OPENABLE);
        startActivityForResult(picker, PICK_PHOTO);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == PICK_CHAT_IMAGE) {
            if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                String selectedChat = imageChat;
                Uri uri = data.getData();
                submit(() -> {
                    Bitmap bitmap = decodePhoto(uri);
                    onUi(() -> chatView.sendImage(selectedChat, bitmap));
                }, failure -> status(findViewById(R.id.chat_status), R.string.contacts_photo_error));
            }
            return;
        }
        if (requestCode != PICK_PHOTO || resultCode != RESULT_OK || data == null || data.getData() == null) {
            return;
        }
        Uri uri = data.getData();
        setProfileBusy(true);
        submit(() -> {
            Bitmap photo = decodePhoto(uri);
            onUi(() -> {
                pendingPhoto = photo;
                profileAvatar.setTag(null);
                profileAvatar.setImageBitmap(photo);
                setProfileBusy(false);
                status(profileStatus, 0);
            });
        }, failure -> {
            status(profileStatus, R.string.contacts_photo_error);
            setProfileBusy(false);
        });
    }

    private Bitmap decodePhoto(Uri uri) throws IOException {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            return ImageDecoder.decodeBitmap(ImageDecoder.createSource(getContentResolver(), uri),
                    (decoder, info, source) -> {
                        int width = info.getSize().getWidth();
                        int height = info.getSize().getHeight();
                        float scale = Math.min(1f, 512f / Math.max(width, height));
                        decoder.setTargetSize(Math.max(1, Math.round(width * scale)),
                                Math.max(1, Math.round(height * scale)));
                        decoder.setAllocator(ImageDecoder.ALLOCATOR_SOFTWARE);
                    });
        }
        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inJustDecodeBounds = true;
        try (InputStream stream = getContentResolver().openInputStream(uri)) {
            BitmapFactory.decodeStream(stream, null, options);
        }
        options.inSampleSize = 1;
        while (Math.max(options.outWidth, options.outHeight) / options.inSampleSize > 512) {
            options.inSampleSize *= 2;
        }
        options.inJustDecodeBounds = false;
        try (InputStream stream = getContentResolver().openInputStream(uri)) {
            Bitmap bitmap = BitmapFactory.decodeStream(stream, null, options);
            if (bitmap == null) {
                throw new IOException("Unreadable image");
            }
            return bitmap;
        }
    }

    private void saveProfile() {
        String displayName = name.getText().toString().trim();
        if (displayName.isEmpty() || displayName.length() > 80) {
            name.setError(getString(R.string.contacts_name_error));
            return;
        }
        Bitmap upload = pendingPhoto;
        boolean hasPhoto = upload != null || own != null && own.photo();
        setProfileBusy(true);
        hideKeyboard();
        status(profileStatus, R.string.contacts_busy);
        submit(() -> {
            String token = access();
            if (userId == null) {
                userId = client.userId(token);
            }
            ProfilesClient.Profile saved = new ProfilesClient.Profile(userId, displayName, hasPhoto);
            if (upload != null) {
                ByteArrayOutputStream bytes = new ByteArrayOutputStream();
                if (!upload.compress(Bitmap.CompressFormat.JPEG, 85, bytes)) {
                    throw new IOException("Cannot encode image");
                }
                client.upload(token, userId, bytes.toByteArray());
            }
            client.save(token, saved);
            onUi(() -> {
                own = saved;
                pendingPhoto = null;
                if (upload != null) {
                    avatars.put(saved.id(), upload);
                }
                bindAvatar(findViewById(R.id.profile_initial), profileAvatar, saved);
                setProfileBusy(false);
                status(profileStatus, R.string.contacts_saved);
            });
        }, failure -> {
            setProfileBusy(false);
            status(profileStatus, error(failure));
        });
    }

    private void bindAvatar(TextView initial, ImageView image, ProfilesClient.Profile contact) {
        initial.setText(contact == null ? "" : contact.name().substring(0,
                contact.name().offsetByCodePoints(0, 1)).toUpperCase(java.util.Locale.getDefault()));
        image.setImageDrawable(null);
        image.setTag(null);
        if (contact == null || !contact.photo()) {
            return;
        }
        String id = contact.id();
        image.setTag(id);
        Bitmap cached = avatars.get(id);
        if (cached != null) {
            image.setImageBitmap(cached);
            return;
        }
        photos.execute(() -> {
            AuthClient.Session current = session;
            if (current == null) {
                return;
            }
            try {
                Bitmap bitmap = client.avatar(current.access(), id);
                if (bitmap != null) {
                    avatars.put(id, bitmap);
                    onUi(() -> {
                        if (id.equals(image.getTag())) {
                            image.setImageBitmap(bitmap);
                        }
                    });
                }
            } catch (IOException | AuthClient.Rejected ignored) {
                // The initial remains visible when the photo cannot be loaded.
            }
        });
    }

    private void selectRecipient(ProfilesClient.Profile selected) {
        if (openingChat || savingContact) {
            return;
        }
        recipient = selected;
        findViewById(R.id.recipient_save).setVisibility(
                selected == null || savedOnly ? View.GONE : View.VISIBLE);
        status(findViewById(R.id.chat_creation_status), 0);
        findViewById(R.id.recipient_open).setVisibility(selected == null ? View.GONE : View.VISIBLE);
        View panel = findViewById(R.id.recipient_panel);
        panel.setVisibility(selected == null ? View.GONE : View.VISIBLE);
        if (selected != null) {
            ((TextView) findViewById(R.id.recipient_name)).setText(
                    getString(R.string.contacts_selected, selected.name()));
            hideKeyboard();
        }
        adapter.notifyDataSetChanged();
    }

    private void setProfileBusy(boolean busy) {
        profileBusy = busy;
        name.setEnabled(!busy && profileLoaded);
        findViewById(R.id.profile_photo).setEnabled(!busy && profileLoaded);
        findViewById(R.id.profile_save).setEnabled(!busy && profileLoaded);
        findViewById(R.id.profile_back).setEnabled(!busy);
    }

    int error(Exception failure) {
        return failure instanceof AuthClient.Rejected rejected && rejected.invalidSession()
                ? R.string.contacts_expired : R.string.contacts_error;
    }

    private void status(TextView view, int message) {
        view.setVisibility(message == 0 ? View.GONE : View.VISIBLE);
        if (message != 0) {
            view.setText(message);
        }
    }

    private void hideKeyboard() {
        getSystemService(InputMethodManager.class).hideSoftInputFromWindow(query.getWindowToken(), 0);
        query.clearFocus();
        name.clearFocus();
    }

    private void submit(Work work, java.util.function.Consumer<Exception> failed) {
        worker.execute(() -> {
            try {
                work.run();
            } catch (Exception failure) {
                onUi(() -> failed.accept(failure));
            }
        });
    }

    void onUi(Runnable task) {
        runOnUiThread(() -> {
            if (!isDestroyed() && !isFinishing()) {
                task.run();
            }
        });
    }

    private interface Work {
        void run() throws Exception;
    }

    @android.annotation.SuppressLint("GestureBackNavigation")
    @Override
    public void onBackPressed() {
        goBack();
    }

    private void goBack() {
        if (openingChat || profileBusy || savingContact || chatView.sending()) {
            return;
        }
        switch (panel) {
            case CHATS -> finish();
            case CHAT -> {
                EditText composer = findViewById(R.id.chat_input);
                getSystemService(InputMethodManager.class).hideSoftInputFromWindow(composer.getWindowToken(), 0);
                chatView.close();
                showPanel(Panel.CHATS);
                loadChats(0);
            }
            case DIRECTORY -> {
                hideKeyboard();
                showPanel(Panel.CHATS);
            }
            case PROFILE -> {
                hideKeyboard();
                pendingPhoto = null;
                showPanel(Panel.DIRECTORY);
            }
        }
    }

    @Override
    protected void onStart() {
        super.onStart();
        chatView.setForeground(true);
    }

    @Override
    protected void onStop() {
        chatView.setForeground(false);
        if (userId != null) {
            worker.execute(() -> {
                try {
                    client.updateLastSeen(access());
                } catch (Exception ignored) {
                    // The last-seen time remains unchanged if the device is offline.
                }
            });
        }
        super.onStop();
    }

    @Override
    protected void onDestroy() {
        chatView.close();
        handler.removeCallbacks(search);
        worker.shutdown();
        photos.shutdownNow();
        super.onDestroy();
    }

    private final class ContactsAdapter extends RecyclerView.Adapter<ContactHolder> {
        @Override
        public ContactHolder onCreateViewHolder(ViewGroup parent, int type) {
            return new ContactHolder(LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.contact_row, parent, false));
        }

        @Override
        public void onBindViewHolder(ContactHolder holder, int position) {
            ProfilesClient.Profile contact = contacts.get(position);
            boolean selected = recipient != null && recipient.id().equals(contact.id());
            holder.name.setText(contact.name());
            holder.selected.setChecked(selected);
            holder.itemView.setSelected(selected);
            holder.itemView.setContentDescription(getString(selected
                    ? R.string.contacts_current : R.string.contacts_choose, contact.name()));
            holder.itemView.setFocusable(true);
            holder.itemView.setOnClickListener(view -> selectRecipient(contact));
            bindAvatar(holder.initial, holder.avatar, contact);
        }

        @Override
        public int getItemCount() {
            return contacts.size();
        }
    }

    private final class ChatsAdapter extends RecyclerView.Adapter<ContactHolder> {
        @Override
        public ContactHolder onCreateViewHolder(ViewGroup parent, int type) {
            return new ContactHolder(LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.contact_row, parent, false));
        }

        @Override
        public void onBindViewHolder(ContactHolder holder, int position) {
            ProfilesClient.Chat chat = chats.get(position);
            holder.name.setText(chat.practice()
                    ? getString(R.string.contacts_practice_name, chat.contact().name())
                    : chat.contact().name());
            holder.preview.setText(chatPreview(chat));
            holder.preview.setVisibility(View.VISIBLE);
            holder.selected.setVisibility(View.GONE);
            holder.itemView.setFocusable(true);
            holder.itemView.setOnClickListener(view -> showChat(chat.id(), chat.contact().name(),
                    chat.practice() ? null : chat.contact().id(), chat.practice()));
            bindAvatar(holder.initial, holder.avatar, chat.contact());
        }

        @Override
        public int getItemCount() {
            return chats.size();
        }
    }

    private static final class ContactHolder extends RecyclerView.ViewHolder {
        final TextView name;
        final TextView initial;
        final TextView preview;
        final ImageView avatar;
        final android.widget.RadioButton selected;

        ContactHolder(View row) {
            super(row);
            name = row.findViewById(R.id.contact_name);
            initial = row.findViewById(R.id.contact_initial);
            preview = row.findViewById(R.id.contact_preview);
            avatar = row.findViewById(R.id.contact_avatar);
            selected = row.findViewById(R.id.contact_selected);
        }
    }
}
