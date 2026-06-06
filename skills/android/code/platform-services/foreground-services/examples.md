## Media playback foreground service with MediaSession

A music player that survives screen-off and responds to media button events.

```kotlin
// In AndroidManifest.xml (abridged):
// <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
// <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
// <service android:name=".MusicService"
//          android:foregroundServiceType="mediaPlayback" />

class MusicService : MediaBrowserServiceCompat() {

    private lateinit var mediaSession: MediaSessionCompat
    private lateinit var player: ExoPlayer
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    override fun onCreate() {
        super.onCreate()
        player = ExoPlayer.Builder(this).build()

        mediaSession = MediaSessionCompat(this, "MusicService").apply {
            setCallback(mediaSessionCallback)
            isActive = true
        }
        sessionToken = mediaSession.sessionToken

        observePlayerState()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        MediaButtonReceiver.handleIntent(mediaSession, intent)
        return START_STICKY
    }

    private fun observePlayerState() {
        scope.launch {
            snapshotFlow { player.playbackState }
                .collect { state ->
                    val isPlaying = player.isPlaying
                    val notification = buildMediaNotification(isPlaying)
                    if (isPlaying || state == Player.STATE_BUFFERING) {
                        ServiceCompat.startForeground(
                            this@MusicService,
                            NOTIFICATION_ID,
                            notification,
                            ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
                        )
                    } else {
                        ServiceCompat.stopForeground(
                            this@MusicService,
                            ServiceCompat.STOP_FOREGROUND_DETACH
                        )
                    }
                }
        }
    }

    private fun buildMediaNotification(isPlaying: Boolean): Notification {
        val channel = NotificationChannel(
            CHANNEL_ID, "Playback", NotificationManager.IMPORTANCE_LOW
        )
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Now Playing")
            .setContentText(player.currentMediaItem?.mediaMetadata?.title)
            .setSmallIcon(R.drawable.ic_music_note)
            .setOngoing(isPlaying)
            .addAction(
                R.drawable.ic_skip_previous, "Previous",
                buildMediaPendingIntent(PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS)
            )
            .addAction(
                if (isPlaying) R.drawable.ic_pause else R.drawable.ic_play,
                if (isPlaying) "Pause" else "Play",
                buildMediaPendingIntent(
                    if (isPlaying) PlaybackStateCompat.ACTION_PAUSE
                    else PlaybackStateCompat.ACTION_PLAY
                )
            )
            .addAction(
                R.drawable.ic_skip_next, "Next",
                buildMediaPendingIntent(PlaybackStateCompat.ACTION_SKIP_TO_NEXT)
            )
            .setStyle(
                androidx.media.app.NotificationCompat.MediaStyle()
                    .setMediaSession(mediaSession.sessionToken)
                    .setShowActionsInCompactView(0, 1, 2)
            )
            .build()
    }

    private fun buildMediaPendingIntent(action: Long): PendingIntent =
        MediaButtonReceiver.buildMediaButtonPendingIntent(
            this, action
        )

    private val mediaSessionCallback = object : MediaSessionCompat.Callback() {
        override fun onPlay() { player.play() }
        override fun onPause() { player.pause() }
        override fun onSkipToNext() { player.seekToNextMediaItem() }
        override fun onSkipToPrevious() { player.seekToPreviousMediaItem() }
        override fun onStop() { stopSelf() }
    }

    override fun onDestroy() {
        scope.cancel()
        player.release()
        mediaSession.release()
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }

    override fun onGetRoot(clientPackageName: String, clientUid: Int, rootHints: Bundle?) =
        BrowserRoot("root", null)

    override fun onLoadChildren(parentId: String, result: Result<List<MediaBrowserCompat.MediaItem>>) {
        result.sendResult(emptyList())
    }

    companion object {
        private const val NOTIFICATION_ID = 2001
        private const val CHANNEL_ID = "music_playback"
    }
}
```

## Location tracking service with coroutine-based updates

A route-recording service that posts location updates to a StateFlow for the UI.

```kotlin
// Manifest additions:
// <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
// <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
// <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
// <service android:name=".RouteService"
//          android:foregroundServiceType="location" />

class RouteService : Service() {

    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private val fusedClient by lazy {
        LocationServices.getFusedLocationProviderClient(this)
    }

    companion object {
        private const val NOTIFICATION_ID = 3001
        private const val CHANNEL_ID = "route_tracking"

        // Shared state the UI can observe
        val locationFlow = MutableStateFlow<Location?>(null)

        fun startIntent(context: Context) =
            Intent(context, RouteService::class.java).also {
                context.startForegroundService(it)
            }

        fun stopIntent(context: Context) =
            Intent(context, RouteService::class.java).also {
                context.stopService(it)
            }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        ServiceCompat.startForeground(
            this,
            NOTIFICATION_ID,
            buildNotification(),
            ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
        )
        startCollectingLocations()
        return START_STICKY
    }

    @SuppressLint("MissingPermission")
    private fun startCollectingLocations() {
        val request = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY, 3_000L
        ).build()

        scope.launch {
            fusedClient.locationFlow(request).collect { location ->
                locationFlow.value = location
                updateNotification(location)
            }
        }
    }

    private fun updateNotification(location: Location) {
        val text = "%.4f, %.4f".format(location.latitude, location.longitude)
        val notification = buildNotification(text)
        getSystemService(NotificationManager::class.java)
            .notify(NOTIFICATION_ID, notification)
    }

    private fun buildNotification(subtitle: String = "Acquiring GPS…"): Notification {
        val channel = NotificationChannel(
            CHANNEL_ID, "Route Tracking", NotificationManager.IMPORTANCE_LOW
        )
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Recording route")
            .setContentText(subtitle)
            .setSmallIcon(R.drawable.ic_route)
            .setOngoing(true)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        scope.cancel()
        locationFlow.value = null
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }
}
```

## Short service for a brief critical task

Use `shortService` for a bounded task that should not be interrupted (e.g., saving a file before the user quits). No special type-specific permission beyond `FOREGROUND_SERVICE_SHORT_SERVICE`.

```kotlin
// Manifest:
// <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
// <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SHORT_SERVICE" />
// <service android:name=".SaveService"
//          android:foregroundServiceType="shortService" />

class SaveService : Service() {

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        ServiceCompat.startForeground(
            this,
            NOTIFICATION_ID,
            buildNotification(),
            ServiceInfo.FOREGROUND_SERVICE_TYPE_SHORT_SERVICE
        )
        scope.launch {
            try {
                performCriticalSave()
            } finally {
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private suspend fun performCriticalSave() {
        // Flush in-memory state to disk
        withContext(Dispatchers.IO) {
            // ... write files
        }
    }

    private fun buildNotification(): Notification {
        val channel = NotificationChannel(
            CHANNEL_ID, "Saving", NotificationManager.IMPORTANCE_LOW
        )
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Saving your work")
            .setSmallIcon(R.drawable.ic_save)
            .setOngoing(true)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        scope.cancel()
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }

    companion object {
        private const val NOTIFICATION_ID = 4001
        private const val CHANNEL_ID = "save_progress"
    }
}
```

## WorkManager foreground task as the correct alternative

For deferrable uploads, use WorkManager's `setForeground` instead of a service. This avoids background-start restrictions and is battery-optimized.

```kotlin
class UploadWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        setForeground(createForegroundInfo())
        return try {
            performUpload()
            Result.success()
        } catch (e: Exception) {
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }

    private suspend fun performUpload() {
        // ... chunked upload logic with progress
    }

    private fun createForegroundInfo(): ForegroundInfo {
        val channel = NotificationChannel(
            CHANNEL_ID, "Upload", NotificationManager.IMPORTANCE_LOW
        )
        applicationContext
            .getSystemService(NotificationManager::class.java)
            .createNotificationChannel(channel)

        val notification = NotificationCompat.Builder(applicationContext, CHANNEL_ID)
            .setContentTitle("Uploading photos")
            .setSmallIcon(R.drawable.ic_upload)
            .setOngoing(true)
            .build()

        return ForegroundInfo(
            NOTIFICATION_ID,
            notification,
            ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
        )
    }

    companion object {
        private const val NOTIFICATION_ID = 5001
        private const val CHANNEL_ID = "upload_progress"

        fun enqueue(context: Context) {
            val request = OneTimeWorkRequestBuilder<UploadWorker>()
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED)
                        .build()
                )
                .build()
            WorkManager.getInstance(context).enqueue(request)
        }
    }
}
```
