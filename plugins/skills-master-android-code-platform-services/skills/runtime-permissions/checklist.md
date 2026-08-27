# runtime-permissions — checklist

- [ ] Every dangerous permission is declared in `AndroidManifest.xml` before being requested at runtime.
- [ ] Permissions with an API level floor are guarded with `Build.VERSION.SDK_INT` checks or `android:maxSdkVersion` in the manifest.
- [ ] `rememberLauncherForActivityResult` is called at the composable level (composition time), not inside a click lambda or `LaunchedEffect`.
- [ ] `launcher.launch()` is invoked only from event callbacks or `LaunchedEffect` — never from the composable body.
- [ ] `ContextCompat.checkSelfPermission` is called on every `ON_RESUME` lifecycle event to detect one-time grant expiry and Settings grants.
- [ ] `shouldShowRequestPermissionRationale` is checked *before* the first launch to decide whether to show rationale, and *after* a denial callback to distinguish first-denial from permanent denial.
- [ ] A persistent flag (DataStore or SharedPreferences) records whether the app has previously asked for each permission, so first-denial and "don't ask again" can be told apart.
- [ ] The permission request is triggered contextually at feature use — not at app launch or unconditionally on screen entry.
- [ ] Only the minimum permission scope is requested (coarse location when precise is not needed; photo picker when full library access is unnecessary).
- [ ] Partial media access (`READ_MEDIA_VISUAL_USER_SELECTED`) is handled on Android 14+: a "Manage access" affordance is offered rather than treating partial grant as full denial.
- [ ] Precise and approximate location grants are both handled — the feature degrades gracefully when only coarse is granted.
- [ ] `POST_NOTIFICATIONS` is guarded with `Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU` before requesting; the flow skips the request silently on older versions.
- [ ] Permanent denial shows a Settings redirect (`Settings.ACTION_APPLICATION_DETAILS_SETTINGS` + `package:` URI) instead of re-launching the system dialog.
- [ ] No permission is re-requested in a loop; the flow stops after one rationale cycle and falls back to permanent-denial UI.
- [ ] Unrelated permissions are not bundled into a single `RequestMultiplePermissions` call without a clear contextual trigger.
- [ ] The UI remains functional (degraded mode) when permission is denied — users are never hard-blocked from the app.
- [ ] Bluetooth permissions use the API 31+ set (`BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`) with `neverForLocation` set on `BLUETOOTH_SCAN` when location derivation is not needed.
- [ ] Accompanied rationale text is concise, explains the user benefit (not the technical need), and appears at the feature trigger — not on every app open.
