---
name: runtime-permissions
description: Covers Android runtime permissions — requesting dangerous permissions with ActivityResult APIs and rememberLauncherForActivityResult, showing rationale, handling permanent denial, one-time and partial grants for location/media/notifications, and minimizing requests. Use when an Android app needs to request dangerous permissions, handle denial flows, or adapt behavior to partial grants such as approximate location or selected photos.
---

## When to use

Apply this skill when a feature requires a dangerous (runtime) permission — camera, microphone, precise or approximate location, contacts, call logs, Bluetooth, media, or `POST_NOTIFICATIONS` — and you are building the request flow in Compose or in an Activity/Fragment. It covers the full decision tree from first request through permanent denial and Settings redirect, and addresses the special partial-grant behaviors introduced for location (precise vs approximate), media (photo/video picker vs full library), and notifications (Android 13+).

Do not apply this skill to normal permissions (`INTERNET`, `VIBRATE`, etc.) declared only in the manifest — those require no runtime approval.

## Core guidance

### Declare before requesting

- Add every permission to `AndroidManifest.xml` with `<uses-permission android:name="..."/>` before requesting it at runtime; requesting an undeclared permission always returns denied.
- For permissions only needed on certain API levels, guard the declaration with `android:maxSdkVersion` or `tools:node="remove"` on older flavors where appropriate.

### Use the ActivityResult APIs — never `requestPermissions` directly

- In Compose, use `rememberLauncherForActivityResult` with `ActivityResultContracts.RequestPermission()` for a single permission and `RequestMultiplePermissions()` for a group.
- Create the launcher at the composable level, not inside a click callback; the registration must happen before the composable enters the composition.
- Call `launcher.launch(permission)` from a button click, an event lambda, or a `LaunchedEffect` — never from the composable body.

### Rationale — show it at the right moment

- Check `ActivityCompat.shouldShowRequestPermissionRationale(activity, permission)` *before* launching the request. If it returns `true`, the user previously denied without ticking "Don't ask again" — show a brief explanation of why the feature needs the permission, then let them proceed or decline.
- Do not show rationale on the very first request; the system dialog is the first explanation.
- Keep rationale UI non-blocking — prefer a Snackbar or a small in-context card over a full-screen modal.

### Handle denial and the "don't ask again" state

- After the launcher callback fires, re-check `shouldShowRequestPermissionRationale`. If the permission is denied *and* rationale returns `false`, the user has chosen "Don't ask again" (or is on first-ever denial on some OEMs). Offer a path to Settings instead of re-launching the request.
- Never launch the request in a loop. Track a "has already asked" flag in a `ViewModel` or `DataStore` and stop after one rationale cycle.
- Open app settings with `Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)` carrying a `data` URI of `"package:${context.packageName}"`.

### Partial and one-time grants

- **Location** — `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` must both be declared if you want precise; if the user grants only coarse (approximate), the system delivers ~3 km accuracy even if you asked for fine. Always handle the coarse-only outcome gracefully.
- **Media (Android 13+)** — prefer the system Photo Picker (`PickVisualMedia` / `PickMultipleVisualMedia`) contract; it requires no permission and grants scoped access. Only fall back to `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` when the feature genuinely needs full library access.
- **Partial media access (Android 14+)** — users can grant access to selected photos only. The permission result is granted but `READ_MEDIA_IMAGES` is partial. Detect this by checking `READ_MEDIA_VISUAL_USER_SELECTED` alongside the full permission; show a "Manage access" affordance rather than treating partial as full denial.
- **Notifications (Android 13+)** — request `POST_NOTIFICATIONS` before your first notification. On devices running Android 12 and below the permission is auto-granted, so guard the request with a `Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU` check.
- **One-time permissions** — location, camera, and microphone can be granted "only this time." The grant looks identical to a permanent grant; the permission is revoked when the app is no longer in the foreground. Design these flows to re-request when the app resumes rather than caching a permanent grant flag.

### Minimize requests

- Request permissions only at the moment the feature is first used (contextual request), not at app launch.
- Request the minimum scope — prefer coarse location when nearby results are sufficient; prefer the photo picker over library access; prefer `RECORD_AUDIO` without `CAPTURE_AUDIO_OUTPUT` unless truly needed.
- If the feature works in a degraded but still useful way without the permission, implement that fallback and let users opt in rather than blocking them.

```kotlin
@Composable
fun CameraFeature(viewModel: CameraViewModel = hiltViewModel()) {
    val context = LocalContext.current
    val activity = context as Activity

    val permissionState by viewModel.permissionState.collectAsStateWithLifecycle()

    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
    ) { granted ->
        if (granted) {
            viewModel.onCameraGranted()
        } else {
            val showRationale = ActivityCompat.shouldShowRequestPermissionRationale(
                activity,
                Manifest.permission.CAMERA,
            )
            viewModel.onCameraDenied(canShowRationale = showRationale)
        }
    }

    when (permissionState) {
        PermissionState.Granted -> CameraPreview()
        PermissionState.ShowRationale -> CameraRationaleCard(
            onConfirm = { launcher.launch(Manifest.permission.CAMERA) },
            onDismiss = { viewModel.onRationaleDismissed() },
        )
        PermissionState.PermanentlyDenied -> OpenSettingsPrompt(
            onOpenSettings = {
                val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.fromParts("package", context.packageName, null)
                }
                context.startActivity(intent)
            },
        )
        PermissionState.NotRequested -> RequestCameraButton(
            onClick = { launcher.launch(Manifest.permission.CAMERA) },
        )
    }
}
```

## Platform notes

- On **large screens and foldables** the activity may be embedded or in multi-window mode. `shouldShowRequestPermissionRationale` behaves the same, but keep in mind the activity may not be fullscreen. Prefer Snackbar or contextual inline UI for rationale over dialogs that may appear clipped.
- On **Android 11+ (API 30+)** the system auto-resets permissions for apps unused for several months. Apps that need persistent access (e.g., a background location tracker) should check permission status on resume, not just on first launch.
- On **Android 12+ (API 31+)** Bluetooth permissions were restructured — `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, and `BLUETOOTH_ADVERTISE` replace the older `BLUETOOTH` and `BLUETOOTH_ADMIN`. Use `neverForLocation` attribute on `BLUETOOTH_SCAN` if you do not use Bluetooth to derive location.
- On **Android 14+ (API 34+)** body sensors and health permissions have additional granularity. For these use `android.permission.health.*` and be prepared for users to grant or deny each sensor type independently.
- The Accompanist Permissions library (`com.google.accompanist:accompanist-permissions`) wraps the state machine into `rememberPermissionState` / `rememberMultiplePermissionsState`. It is convenient for simple flows but adds a dependency; evaluate whether the raw ActivityResult API suffices.

## Pitfalls

- Calling `launcher.launch()` before the composable has been composed (e.g., from `init {}` in a ViewModel) — the launcher is not registered yet and will crash.
- Caching a "permission was granted" boolean in a non-persistent ViewModel field and never re-checking it on resume — one-time grants and auto-reset will cause silent failures.
- Treating a denied result on the very first request as "permanently denied" — on first denial `shouldShowRequestPermissionRationale` returns `false`, which looks identical to "don't ask again." Track whether you have ever asked using persistent storage (`DataStore`).
- Requesting a group of unrelated permissions in one `RequestMultiplePermissions` call. Users mentally associate a dialog with the action that triggered it; mixing camera and contacts in one request looks suspicious.
- Showing a permission rationale dialog every time the user opens the screen without a feature trigger — this trains users to dismiss dialogs rather than reading them.
- Using the deprecated `onRequestPermissionsResult` override in an Activity or Fragment instead of the ActivityResult API; the new API handles configuration changes and process death correctly.
- Forgetting to handle the case where `ContextCompat.checkSelfPermission` already returns `PERMISSION_GRANTED` on re-entry after the user grants via Settings — always check the current state before launching the request.

## References

- **Documentation:** [Permissions on Android — overview](https://developer.android.com/guide/topics/permissions/overview)
- **Documentation:** [Request runtime permissions](https://developer.android.com/training/permissions/requesting)

## See also

For the Material 3 design patterns and copy guidelines that accompany permission request flows, see `m3-permissions` design skill. For the ActivityResult API in non-permission contexts (file picking, camera capture), see `compose-side-effects`. For storing the "has asked" flag across process death, see `datastore`. For notification channels and foreground service requirements that gate on `POST_NOTIFICATIONS`, see `user-notifications`.
