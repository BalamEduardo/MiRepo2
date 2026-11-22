package com.fakewhatsapp.app;

import android.graphics.drawable.GradientDrawable;

import android.os.Handler;

import android.os.Looper;

import android.view.Gravity;

import android.view.LayoutInflater;

import android.view.View;

import android.view.ViewGroup;

import android.widget.EditText;

import android.widget.LinearLayout;

import android.widget.TextView;

import android.text.Editable;

import android.text.TextWatcher;

import androidx.recyclerview.widget.LinearLayoutManager;

import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;

import java.util.Collections;

import java.util.Locale;

import java.util.List;

import java.util.UUID;

import java.util.function.Consumer;

final class ChatView {

    interface Worker {

        void run(Action action, Consumer<Exception> failure);

    }

    interface Action {

        void run() throws Exception;

    }

    interface TokenSource {

        String access() throws Exception;

    }

    private final ContactsActivity activity;

    private final ProfilesClient client;

    private final Worker worker;

    private final TokenSource tokens;

    private final RecyclerView history;

    private final LinearLayoutManager layout;

    private final EditText input;

    private final TextView status;

    private final TextView presence;

    private final View olderButton;

    private final List<ProfilesClient.Message> messages = new ArrayList<>();

    private final List<ProfilesClient.Message> liveDuringLoad = new ArrayList<>();

    private final MessagesAdapter adapter = new MessagesAdapter();

    private final Handler handler = new Handler(Looper.getMainLooper());

    private final Runnable reconnect = this::connectLive;

    private final Runnable stopTyping = this::stopTyping;

    private final Runnable keepTyping = this::keepTyping;

    private final Runnable clearPeerTyping = () -> {

        peerTyping = false;

        renderPresence();

    };

    private String chatId;

    private String userId;

    private String otherUserId;

    private String peerLastSeen;

    private boolean practice;

    private boolean peerOnline;

    private boolean peerTyping;

    private boolean typingSent;

    private String pendingId;

    private String pendingText;

    private boolean loading;

    private boolean sending;

    private int version;

    private int liveVersion;

    private int retryDelay = 1_000;

    private boolean foreground;

    private boolean catchUp;

    private MessageSubscription subscription;

    private final java.util.Map<String,String> senderNames = new java.util.HashMap<>();
    private final android.util.LruCache<String, android.graphics.Bitmap> imageCache = new android.util.LruCache<>(12);

    ChatView(ContactsActivity activity, ProfilesClient client, Worker worker, TokenSource tokens) {

        this.activity = activity;

        this.client = client;

        this.worker = worker;

        this.tokens = tokens;

        history = activity.findViewById(R.id.chat_history);

        layout = new LinearLayoutManager(activity);

        history.setLayoutManager(layout);

        history.setAdapter(adapter);

        input = activity.findViewById(R.id.chat_input);

        status = activity.findViewById(R.id.chat_status);

        presence = activity.findViewById(R.id.chat_presence);

        olderButton = activity.findViewById(R.id.chat_older);

        olderButton.setOnClickListener(view -> load(true));
        activity.findViewById(R.id.chat_members).setOnClickListener(view -> {
            String id = chatId;
            worker.run(() -> {
                List<String> names = client.members(tokens.access(), id);
                activity.onUi(() -> {
                    if (id.equals(chatId)) new android.app.AlertDialog.Builder(activity)
                            .setTitle(R.string.chat_members).setItems(names.toArray(new String[0]), null)
                            .setPositiveButton(android.R.string.ok, null).show();
                });
            }, failure -> showStatus(activity.error(failure)));
        });

        activity.findViewById(R.id.chat_attach).setOnClickListener(view -> {

            if (chatId != null && !practice && !sending) activity.pickChatImage(chatId);

        });

        activity.findViewById(R.id.chat_search).setOnClickListener(view -> searchMessages());

        activity.findViewById(R.id.chat_send).setOnClickListener(view -> send());

        activity.findViewById(R.id.chat_reload).setOnClickListener(view -> load(false));

        input.addTextChangedListener(new TextWatcher() {

            @Override

            public void beforeTextChanged(CharSequence value, int start, int count, int after) {}

            @Override

            public void onTextChanged(CharSequence value, int start, int before, int count) {

                updateTyping(value);

            }

            @Override

            public void afterTextChanged(Editable value) {}

        });

    }

    void open(String id, String name, String currentUser, String otherUserId, boolean practice) {

        chatId = id;

        userId = currentUser;

        this.otherUserId = otherUserId;

        this.practice = practice;
        activity.findViewById(R.id.chat_members).setVisibility(!practice && otherUserId == null ? View.VISIBLE : View.GONE);

        activity.findViewById(R.id.chat_attach).setEnabled(!practice);

        activity.findViewById(R.id.chat_search).setEnabled(!practice);

        peerLastSeen = null;

        peerOnline = false;

        peerTyping = false;

        typingSent = false;

        version++;

        loading = false;

        pendingId = null;

        pendingText = null;

        input.setText("");

        messages.clear();

        liveDuringLoad.clear();

        adapter.notifyDataSetChanged();

        olderButton.setVisibility(View.GONE);

        ((TextView) activity.findViewById(R.id.chat_title)).setText(name);

        activity.findViewById(R.id.chat_practice_label).setVisibility(practice ? View.VISIBLE : View.GONE);

        presence.setVisibility(practice ? View.GONE : View.VISIBLE);

        renderPresence();

        load(false);

        loadLastSeen(id, otherUserId, practice);

        markRead(id, practice);

        connectLive();

    }

    boolean sending() {

        return sending;

    }

    void close() {

        stopTyping();

        stopLive();

        handler.removeCallbacks(clearPeerTyping);

        version++;

        chatId = null;

        otherUserId = null;

        input.clearFocus();

    }

    void setForeground(boolean value) {

        foreground = value;

        if (value) {

            connectLive();

        } else {

            stopTyping();

            stopLive();

        }

    }

    private void stopLive() {

        liveVersion++;

        handler.removeCallbacks(reconnect);

        catchUp = false;

        retryDelay = 1_000;

        if (subscription != null) {

            subscription.close();

            subscription = null;

        }

    }

    private void connectLive() {

        if (!foreground || chatId == null || subscription != null) {

            return;

        }

        String id = chatId;

        boolean practiceChat = practice;

        String currentUser = userId;

        String contactUser = otherUserId;

        int attempt = ++liveVersion;

        worker.run(() -> {

            String access = tokens.access();

            activity.onUi(() -> {

                if (attempt != liveVersion || !foreground) {

                    return;

                }

                try {

                    subscription = new MessageSubscription(id, practiceChat, currentUser, contactUser,

                            access, new MessageSubscription.Listener() {

                        @Override

                        public void joined() {

                            retryDelay = 1_000;

                            catchUp = true;

                            catchUpIfIdle();

                            markRead(id, practiceChat);

                            if (input.length() > 0) {

                                updateTyping(input.getText());

                            }

                        }

                        @Override

                        public void inserted(ProfilesClient.Message message) {

                            if (loading) {

                                liveDuringLoad.add(message);

                            } else {

                                insertLive(message);

                            }

                            if (!practiceChat && !message.senderId().equals(currentUser)) {

                                acknowledgeIncoming(id, message.id());

                            }

                        }

                        @Override

                        public void updated(ProfilesClient.Message message) {

                            if (loading) {

                                liveDuringLoad.add(message);

                            } else {

                                updateLive(message);

                            }

                        }

                        @Override

                        public void peerPresence(boolean online) {

                            peerOnline = online;

                            renderPresence();

                        }

                        @Override

                        public void peerTyping(boolean typing) {

                            peerTyping = typing;

                            handler.removeCallbacks(clearPeerTyping);

                            if (typing) {

                                handler.postDelayed(clearPeerTyping, 4_000);

                            }

                            renderPresence();

                        }

                        @Override

                        public void disconnected() {

                            retryLive(attempt);

                        }

                    });

                } catch (org.json.JSONException | IllegalArgumentException failure) {

                    retryLive(attempt);

                }

            });

        }, failure -> retryLive(attempt));

    }

    private void retryLive(int attempt) {

        if (attempt == liveVersion && foreground && chatId != null) {

            subscription = null;

            handler.postDelayed(reconnect, retryDelay);

            retryDelay = Math.min(30_000, retryDelay * 2);

        }

    }

    private void catchUpIfIdle() {

        if (catchUp && !loading && !sending) {

            catchUp = false;

            load(false);

        }

    }

    private void markRead(String id, boolean practiceChat) {

        if (practiceChat) {

            return;

        }

        worker.run(() -> client.markMessagesRead(tokens.access(), id), ignored -> {});

    }

    private void acknowledgeIncoming(String id, String messageId) {

        worker.run(() -> {

            String access = tokens.access();

            client.markMessagesReceived(access, id, Collections.singletonList(messageId));

            client.markMessagesRead(access, id);

        }, ignored -> {});

    }

    private void loadLastSeen(String id, String contactId, boolean practiceChat) {

        if (practiceChat || contactId == null) {

            return;

        }

        worker.run(() -> {

            String value = client.lastSeen(tokens.access(), contactId);

            activity.onUi(() -> {

                if (id.equals(chatId)) {

                    peerLastSeen = value;

                    renderPresence();

                }

            });

        }, ignored -> {});

    }

    private void updateTyping(CharSequence draft) {

        if (practice || !foreground || subscription == null || chatId == null) {

            return;

        }

        handler.removeCallbacks(stopTyping);

        if (draft == null || draft.length() == 0) {

            stopTyping();

            return;

        }

        if (!typingSent) {

            subscription.sendTyping(true);

            typingSent = true;

            handler.postDelayed(keepTyping, 2_000);

        }

        handler.postDelayed(stopTyping, 1_300);

    }

    private void keepTyping() {

        if (!typingSent || practice || !foreground || subscription == null || input.length() == 0) {

            return;

        }

        subscription.sendTyping(true);

        handler.postDelayed(keepTyping, 2_000);

    }

    private void stopTyping() {

        handler.removeCallbacks(stopTyping);

        handler.removeCallbacks(keepTyping);

        if (typingSent && subscription != null) {

            subscription.sendTyping(false);

        }

        typingSent = false;

    }

    private void renderPresence() {

        if (practice || chatId == null) {

            presence.setVisibility(View.GONE);

            return;

        }

        presence.setVisibility(View.VISIBLE);

        if (otherUserId == null) {

            presence.setText(R.string.chat_group);

        } else if (peerTyping) {

            presence.setText(R.string.chat_status_typing);

        } else if (peerOnline) {

            presence.setText(R.string.chat_status_online);

        } else if (peerLastSeen == null) {

            presence.setText(R.string.chat_status_offline);

        } else {

            presence.setText(activity.getString(R.string.chat_status_last_seen, formatLastSeen(peerLastSeen)));

        }

    }

    private String formatLastSeen(String timestamp) {

        try {

            java.util.Date date = parseTimestamp(timestamp);

            java.util.Calendar local = java.util.Calendar.getInstance();

            local.setTime(date);

            java.util.Calendar today = java.util.Calendar.getInstance();

            java.text.SimpleDateFormat timeFormat = new java.text.SimpleDateFormat("HH:mm", Locale.getDefault());

            if (sameDay(local, today)) {

                return activity.getString(R.string.chat_last_seen_today, timeFormat.format(date));

            }

            today.add(java.util.Calendar.DAY_OF_YEAR, -1);

            if (sameDay(local, today)) {

                return activity.getString(R.string.chat_last_seen_yesterday, timeFormat.format(date));

            }

            java.text.SimpleDateFormat dateFormat = new java.text.SimpleDateFormat("d MMM, HH:mm", Locale.getDefault());

            String day = dateFormat.format(date);

            return activity.getString(R.string.chat_last_seen_date, day);

        } catch (java.text.ParseException failure) {

            return timestamp;

        }

    }

    private static boolean sameDay(java.util.Calendar first, java.util.Calendar second) {

        return first.get(java.util.Calendar.ERA) == second.get(java.util.Calendar.ERA)

                && first.get(java.util.Calendar.YEAR) == second.get(java.util.Calendar.YEAR)

                && first.get(java.util.Calendar.DAY_OF_YEAR) == second.get(java.util.Calendar.DAY_OF_YEAR);

    }

    private static java.util.Date parseTimestamp(String value) throws java.text.ParseException {

        String normalized = value;

        int fraction = normalized.indexOf('.');

        if (fraction >= 0) {

            int zone = normalized.length();

            for (int index = fraction + 1; index < normalized.length(); index++) {

                char character = normalized.charAt(index);

                if (character == 'Z' || character == '+' || character == '-') {

                    zone = index;

                    break;

                }

            }

            String millis = (normalized.substring(fraction + 1, zone) + "000").substring(0, 3);

            normalized = normalized.substring(0, fraction) + "." + millis + normalized.substring(zone);

        } else {

            int zone = normalized.endsWith("Z") ? normalized.length() - 1

                    : Math.max(normalized.lastIndexOf('+'), normalized.lastIndexOf('-'));

            normalized = normalized.substring(0, zone) + ".000" + normalized.substring(zone);

        }

        if (normalized.endsWith("Z")) {

            normalized = normalized.substring(0, normalized.length() - 1) + "+0000";

        } else if (normalized.matches(".*[+-]\\d{2}:\\d{2}$")) {

            normalized = normalized.substring(0, normalized.length() - 3) + normalized.substring(normalized.length() - 2);

        }

        java.text.SimpleDateFormat parser = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ", Locale.US);

        parser.setLenient(false);

        return parser.parse(normalized);

    }

    private void insertLive(ProfilesClient.Message message) {

        if (messages.stream().anyMatch(existing -> existing.id().equals(message.id()))) {

            return;

        }

        boolean atEnd = !history.canScrollVertically(1);

        int index = messages.size();

        while (index > 0 && compare(messages.get(index - 1), message) > 0) {

            index--;

        }

        messages.add(index, message);

        adapter.notifyItemInserted(index);

        if (atEnd) {

            history.scrollToPosition(messages.size() - 1);

        }

        if (!sending && !loading) {

            showStatus(0);

        }

    }

    private void updateLive(ProfilesClient.Message update) {

        for (int index = 0; index < messages.size(); index++) {

            ProfilesClient.Message current = messages.get(index);

            if (current.id().equals(update.id())) {

                if (update.deleted() && current.imagePath() != null) imageCache.remove(current.imagePath());
                messages.set(index, current.withState(update));

                adapter.notifyItemChanged(index);

                return;

            }

        }

        insertLive(update);

    }

    private static int compare(ProfilesClient.Message first, ProfilesClient.Message second) {

        int time = first.sentAt().replace("Z", "+00:00").compareTo(second.sentAt().replace("Z", "+00:00"));

        return time != 0 ? time : first.id().compareTo(second.id());

    }

    private void load(boolean older) {

        if (chatId == null || loading || sending || (older && messages.isEmpty())) {

            return;

        }

        String id = chatId;

        boolean practiceChat = practice;

        int request = ++version;

        ProfilesClient.Message cursor = older ? messages.get(0) : null;

        loading = true;

        updateActions();

        showStatus(R.string.chat_loading_history);

        worker.run(() -> {

            ProfilesClient.MessagePage page = client.history(tokens.access(), id, practiceChat, cursor);

            activity.onUi(() -> {

                if (request != version) {

                    return;

                }

                if (older) {

                    int first = layout.findFirstVisibleItemPosition();

                    View anchor = layout.findViewByPosition(first);

                    int top = anchor == null ? 0 : anchor.getTop() - history.getPaddingTop();

                    int added = page.messages().size();

                    messages.addAll(0, page.messages());

                    adapter.notifyItemRangeInserted(0, added);

                    if (first >= 0) {

                        layout.scrollToPositionWithOffset(first + added, top);

                    }

                } else {

                    messages.clear();

                    messages.addAll(page.messages());

                    adapter.notifyDataSetChanged();

                    if (!messages.isEmpty()) {

                        history.scrollToPosition(messages.size() - 1);

                    }

                }

                olderButton.setVisibility(page.hasMore() ? View.VISIBLE : View.GONE);

                loading = false;

                mergeBufferedEvents();

                updateActions();

                showStatus(messages.isEmpty() ? R.string.chats_no_messages : 0);

                catchUpIfIdle();

            });

        }, failure -> {

            if (request == version) {

                loading = false;

                mergeBufferedEvents();

                updateActions();

                showStatus(activity.error(failure));

                catchUpIfIdle();

            }

        });

    }

    private void mergeBufferedEvents() {

        for (ProfilesClient.Message message : liveDuringLoad) {

            updateLive(message);

        }

        liveDuringLoad.clear();

    }

    void sendImage(String selectedChat, android.graphics.Bitmap bitmap) {

        if (chatId == null || !chatId.equals(selectedChat) || practice || sending) return;

        new android.app.AlertDialog.Builder(activity).setTitle(R.string.chat_attach)

                .setMessage("¿Enviar la imagen seleccionada a esta conversación?")

                .setNegativeButton(android.R.string.cancel, null)

                .setPositiveButton(R.string.chat_send, (dialog, which) -> {

                    String id = chatId;

                    sending = true;

                    updateActions();

                    showStatus(R.string.chat_sending);

                    worker.run(() -> {

                        client.sendImage(tokens.access(), id, userId, bitmap);

                        activity.onUi(() -> { sending = false; load(false); });

                    }, failure -> {

                        sending = false;

                        updateActions();

                        showStatus(activity.error(failure));

                    });

                }).show();

    }

    private void searchMessages() {

        if (chatId == null || practice) return;

        EditText query = new EditText(activity);

        query.setHint(R.string.chat_search_hint);

        query.setSingleLine(true);

        query.setFilters(new android.text.InputFilter[]{new android.text.InputFilter.LengthFilter(100)});

        String id = chatId;

        new android.app.AlertDialog.Builder(activity).setTitle(R.string.chat_search).setView(query)

                .setNegativeButton(android.R.string.cancel, null)

                .setPositiveButton(R.string.chat_search, (dialog, which) -> worker.run(() -> {

                    List<ProfilesClient.Message> matches = client.searchMessages(tokens.access(), id, query.getText().toString());

                    activity.onUi(() -> {

                        if (!id.equals(chatId)) return;

                        if (matches.isEmpty()) {

                            new android.app.AlertDialog.Builder(activity).setMessage(R.string.chat_search_empty)

                                    .setPositiveButton(android.R.string.ok, null).show();

                        } else {

                            String[] labels = matches.stream().map(m -> m.content()).toArray(String[]::new);

                            new android.app.AlertDialog.Builder(activity).setTitle("Resultados (máximo 100)")

                                    .setItems(labels, (d, index) -> new android.app.AlertDialog.Builder(activity)

                                            .setMessage(matches.get(index).content()).setPositiveButton(android.R.string.ok, null).show())

                                    .setNegativeButton(android.R.string.cancel, null).show();

                        }

                    });

                }, failure -> showStatus(activity.error(failure)))).show();

    }

    private void deleteMessage(ProfilesClient.Message message) {

        new android.app.AlertDialog.Builder(activity).setTitle(R.string.chat_delete)

                .setMessage(R.string.chat_delete_confirm).setNegativeButton(android.R.string.cancel, null)

                .setPositiveButton(R.string.chat_delete, (dialog, which) -> worker.run(() -> {

                    client.deleteMessage(tokens.access(), message.id());

                    activity.onUi(() -> load(false));

                }, failure -> showStatus(activity.error(failure)))).show();

    }

    private void bindImage(MessageHolder holder, ProfilesClient.Message message) {

        String path = message.imagePath();

        holder.image.setImageDrawable(null);
        holder.image.setOnClickListener(null);
        holder.image.setContentDescription(activity.getString(R.string.chat_image));

        holder.image.setTag(path);

        holder.image.setVisibility(path == null ? View.GONE : View.VISIBLE);

        if (path == null) return;

        android.graphics.Bitmap cached = imageCache.get(path);

        if (cached != null) {

            holder.image.setImageBitmap(cached);

            return;

        }

        worker.run(() -> {

            android.graphics.Bitmap bitmap = client.chatImage(tokens.access(), path);

            activity.onUi(() -> {

                if (bitmap != null) imageCache.put(path, bitmap);

                if (path.equals(holder.image.getTag())) holder.image.setImageBitmap(bitmap);

            });

        }, failure -> {

            if (path.equals(holder.image.getTag())) {

                holder.image.setImageResource(android.R.drawable.ic_dialog_alert);
                holder.image.setContentDescription(activity.getString(R.string.chat_image_failed));

                holder.image.setOnClickListener(v -> bindImage(holder, message));

            }

        });

    }

    private void send() {

        String content = input.getText().toString().trim();

        if (chatId == null || content.isEmpty() || loading || sending) {

            return;

        }

        if (!content.equals(pendingText)) {

            pendingText = content;

            pendingId = UUID.randomUUID().toString();

        }

        String id = chatId;

        boolean practiceChat = practice;

        String messageId = pendingId;

        stopTyping();

        sending = true;

        input.setEnabled(false);

        updateActions();

        showStatus(R.string.chat_sending);

        worker.run(() -> {

            client.sendMessage(tokens.access(), id, practiceChat, messageId, content);

            activity.onUi(() -> {

                sending = false;

                pendingId = null;

                pendingText = null;

                input.setEnabled(true);

                input.setText("");

                if (messages.stream().anyMatch(message -> message.id().equals(messageId))) {

                    updateActions();

                    showStatus(0);

                    catchUpIfIdle();

                } else {

                    catchUp = false;

                    load(false);

                }

            });

        }, failure -> {

            sending = false;

            input.setEnabled(true);

            updateActions();

            int notice = activity.error(failure);

            showStatus(notice == R.string.contacts_error ? R.string.chat_send_error : notice);

            catchUpIfIdle();

        });

    }

    private void updateActions() {

        boolean enabled = !loading && !sending;

        activity.findViewById(R.id.chat_send).setEnabled(enabled);

        activity.findViewById(R.id.chat_reload).setEnabled(enabled);

        olderButton.setEnabled(enabled);

    }

    private void showStatus(int message) {

        status.setVisibility(message == 0 ? View.GONE : View.VISIBLE);

        if (message != 0) {

            status.setText(message);

        }

    }

    private final class MessagesAdapter extends RecyclerView.Adapter<MessageHolder> {

        @Override

        public MessageHolder onCreateViewHolder(ViewGroup parent, int type) {

            View row = LayoutInflater.from(parent.getContext()).inflate(R.layout.chat_message_row, parent, false);

            return new MessageHolder(row);

        }

        @Override

        public void onBindViewHolder(MessageHolder holder, int position) {

            ProfilesClient.Message message = messages.get(position);

            boolean own = message.senderId().equals(userId);

            ((LinearLayout) holder.itemView).setGravity(own ? Gravity.END : Gravity.START);

            int width = history.getWidth() > 0 ? history.getWidth()

                    : activity.getResources().getDisplayMetrics().widthPixels;

            holder.bubble.setMaxWidth((int) (width * 0.78f));

            GradientDrawable shape = new GradientDrawable();

            shape.setColor(activity.getColor(own ? R.color.chat_sent_surface : R.color.chat_received_surface));

            shape.setCornerRadius(activity.getResources().getDimension(R.dimen.auth_radius));

            holder.bubble.setBackground(shape);

            holder.sender.setVisibility(!practice && otherUserId == null && !own ? View.VISIBLE : View.GONE);
            holder.sender.setTag(message.senderId());
            if (!practice && otherUserId == null && !own) {
                holder.sender.setText(senderNames.getOrDefault(message.senderId(), "Participante"));
                if (!senderNames.containsKey(message.senderId())) worker.run(() -> {
                    ProfilesClient.Profile profile = client.ownProfile(tokens.access(), message.senderId());
                    if (profile != null) activity.onUi(() -> {
                        senderNames.put(profile.id(), profile.name());
                        if (profile.id().equals(holder.sender.getTag())) holder.sender.setText(profile.name());
                    });
                }, ignored -> {});
            }
            holder.bubble.setText(message.content());

            holder.image.setOnClickListener(null);

            holder.image.setContentDescription(activity.getString(R.string.chat_image));

            bindImage(holder, message);

            holder.actions.setVisibility(own && !practice && !message.deleted() ? View.VISIBLE : View.GONE);

            holder.actions.setOnClickListener(v -> deleteMessage(message));

            holder.delivery.setVisibility(own ? View.VISIBLE : View.GONE);

            if (own) {

                if (message.readAt() != null) {

                    holder.delivery.setText(otherUserId == null && !practice ? R.string.chat_read_group : R.string.chat_state_read);

                    holder.delivery.setTextColor(activity.getColor(R.color.auth_accent));

                } else if (message.receivedAt() != null) {

                    holder.delivery.setText(R.string.chat_state_received);

                    holder.delivery.setTextColor(activity.getColor(R.color.auth_muted));

                } else {

                    holder.delivery.setText(R.string.chat_state_sent);

                    holder.delivery.setTextColor(activity.getColor(R.color.auth_muted));

                }

            }

            holder.bubble.setContentDescription(activity.getString(own

                    ? R.string.chat_sent_accessibility : R.string.chat_received_accessibility, message.content()));

        }

        @Override

        public int getItemCount() {

            return messages.size();

        }

    }

    private static final class MessageHolder extends RecyclerView.ViewHolder {

        final TextView bubble;

        final TextView delivery;
        final TextView sender;

        final android.widget.ImageView image;

        final View actions;

        MessageHolder(View row) {

            super(row);

            bubble = row.findViewById(R.id.message_bubble);

            delivery = row.findViewById(R.id.message_delivery);
            sender = row.findViewById(R.id.message_sender);

            image = row.findViewById(R.id.message_image);

            actions = row.findViewById(R.id.message_actions);

        }

    }

}
