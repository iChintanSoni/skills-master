## Posting a grouped email notification bundle

An email app receives three new messages for the same account. Each message gets its own notification with `BigTextStyle`, and a summary notification collapses them into a group on API 24+.

```kotlin
data class EmailMessage(val id: Int, val sender: String, val subject: String, val preview: String)

private const val GROUP_KEY_EMAIL = "com.example.app.EMAIL"
private const val SUMMARY_ID = 0

fun postEmailNotifications(context: Context, messages: List<EmailMessage>) {
    val nm = NotificationManagerCompat.from(context)

    // Post one notification per message
    for (msg in messages) {
        val notification = NotificationCompat.Builder(context, "email")
            .setSmallIcon(R.drawable.ic_email)
            .setContentTitle(msg.sender)
            .setContentText(msg.subject)
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText(msg.preview)
                    .setSummaryText(msg.sender)
            )
            .setGroup(GROUP_KEY_EMAIL)
            .setAutoCancel(true)
            .setContentIntent(
                PendingIntent.getActivity(
                    context,
                    msg.id,
                    Intent(context, EmailDetailActivity::class.java).putExtra("id", msg.id),
                    PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
                )
            )
            .build()
        nm.notify(msg.id, notification)
    }

    // Summary notification — required for grouping on all API levels
    val summary = NotificationCompat.Builder(context, "email")
        .setSmallIcon(R.drawable.ic_email)
        .setContentTitle("${messages.size} new emails")
        .setContentText(messages.joinToString(", ") { it.sender })
        .setStyle(
            NotificationCompat.InboxStyle()
                .also { style -> messages.forEach { style.addLine("${it.sender} — ${it.subject}") } }
                .setSummaryText(context.getString(R.string.app_name))
        )
        .setGroup(GROUP_KEY_EMAIL)
        .setGroupSummary(true)
        .setAutoCancel(true)
        .build()
    nm.notify(SUMMARY_ID, summary)
}
```

---

## Requesting POST_NOTIFICATIONS permission inside a Compose settings screen

A Compose settings screen that explains the value of notifications before requesting, and handles the permanently-denied case by directing the user to Settings.

```kotlin
@Composable
fun NotificationPermissionRow(modifier: Modifier = Modifier) {
    val context = LocalContext.current

    // On API < 33 the permission is auto-granted; reflect that in initial state.
    val isGrantedInitially = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        ContextCompat.checkSelfPermission(context, POST_NOTIFICATIONS) == PERMISSION_GRANTED
    } else true

    var isGranted by remember { mutableStateOf(isGrantedInitially) }
    var showRationale by remember { mutableStateOf(false) }
    val activity = context as? ComponentActivity

    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        isGranted = granted
        if (!granted) showRationale = true
    }

    if (showRationale) {
        AlertDialog(
            onDismissRequest = { showRationale = false },
            title = { Text("Enable notifications") },
            text = { Text("Notifications let you know when important events happen, even while the app is closed.") },
            confirmButton = {
                TextButton(onClick = {
                    showRationale = false
                    val canAsk = activity?.shouldShowRequestPermissionRationale(POST_NOTIFICATIONS) == true
                    if (canAsk) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            launcher.launch(POST_NOTIFICATIONS)
                        }
                    } else {
                        // Permanently denied — open system settings
                        context.startActivity(Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                            putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                        })
                    }
                }) { Text("Open settings") }
            },
            dismissButton = {
                TextButton(onClick = { showRationale = false }) { Text("Not now") }
            }
        )
    }

    ListItem(
        headlineContent = { Text("Notifications") },
        supportingContent = { Text(if (isGranted) "Enabled" else "Tap to enable") },
        trailingContent = {
            Switch(
                checked = isGranted,
                onCheckedChange = { checked ->
                    if (checked && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        launcher.launch(POST_NOTIFICATIONS)
                    }
                }
            )
        },
        modifier = modifier
    )
}
```

---

## MessagingStyle conversation with bubble support

A chat feature that posts a `MessagingStyle` notification with a bubble. The shortcut is published via `ShortcutManagerCompat` so the notification is eligible for conversation ranking.

```kotlin
fun postConversationNotification(context: Context, thread: ChatThread, messages: List<ChatMessage>) {
    // 1. Publish a dynamic shortcut for this conversation
    val shortcut = ShortcutInfoCompat.Builder(context, thread.shortcutId)
        .setLongLived(true)
        .setShortLabel(thread.title)
        .setIcon(IconCompat.createWithBitmap(thread.avatarBitmap))
        .setIntent(
            Intent(context, ChatActivity::class.java)
                .setAction(Intent.ACTION_VIEW)
                .putExtra("thread_id", thread.id)
        )
        .setPerson(thread.me)
        .build()
    ShortcutManagerCompat.pushDynamicShortcut(context, shortcut)

    // 2. Build the MessagingStyle
    val style = NotificationCompat.MessagingStyle(thread.me)
        .setConversationTitle(thread.title)
        .setGroupConversation(thread.isGroup)
    messages.takeLast(8).forEach { style.addMessage(it.text, it.timestamp, it.sender) }

    // 3. Bubble metadata (user must have granted bubble permission separately)
    val bubbleIntent = PendingIntent.getActivity(
        context, thread.id.hashCode(),
        Intent(context, BubbleActivity::class.java).putExtra("thread_id", thread.id),
        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )
    val bubbleMetadata = NotificationCompat.BubbleMetadata.Builder(
        bubbleIntent,
        IconCompat.createWithBitmap(thread.avatarBitmap)
    )
        .setDesiredHeight(480)
        .setAutoExpandBubble(false)
        .setSuppressNotification(false)
        .build()

    // 4. Direct-reply action
    val replyInput = RemoteInput.Builder("reply_text")
        .setLabel(context.getString(R.string.action_reply))
        .build()
    val replyPi = PendingIntent.getBroadcast(
        context, thread.id.hashCode(),
        Intent(context, ReplyReceiver::class.java).putExtra("thread_id", thread.id),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
    )
    val replyAction = NotificationCompat.Action.Builder(
        R.drawable.ic_reply, context.getString(R.string.action_reply), replyPi
    ).addRemoteInput(replyInput).setAllowGeneratedReplies(true).build()

    // 5. Build and post
    val notification = NotificationCompat.Builder(context, "messages")
        .setSmallIcon(R.drawable.ic_notification)
        .setLargeIcon(thread.avatarBitmap)
        .setStyle(style)
        .addAction(replyAction)
        .setShortcutId(thread.shortcutId)
        .setBubbleMetadata(bubbleMetadata)
        .setCategory(NotificationCompat.CATEGORY_MESSAGE)
        .setContentIntent(
            PendingIntent.getActivity(
                context, 0,
                Intent(context, ChatActivity::class.java).putExtra("thread_id", thread.id),
                PendingIntent.FLAG_IMMUTABLE
            )
        )
        .setAutoCancel(true)
        .build()

    NotificationManagerCompat.from(context).notify(thread.id.hashCode(), notification)
}
```

---

## Handling direct reply in a BroadcastReceiver

A `BroadcastReceiver` that extracts the inline reply text, sends it to the repository, then updates the notification to clear the spinner.

```kotlin
class ReplyReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val threadId = intent.getStringExtra("thread_id") ?: return
        val replyText = RemoteInput.getResultsFromIntent(intent)
            ?.getCharSequence("reply_text")
            ?.toString()
            ?: return

        // Send on a background thread — BroadcastReceiver.goAsync() keeps the process alive
        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                ChatRepository.sendMessage(threadId, replyText)

                // Refresh the notification to clear the typing spinner
                val updatedMessages = ChatRepository.getMessages(threadId)
                postConversationNotification(
                    context,
                    ChatRepository.getThread(threadId),
                    updatedMessages
                )
            } finally {
                pendingResult.finish()
            }
        }
    }
}
```
