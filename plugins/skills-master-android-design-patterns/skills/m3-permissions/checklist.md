## M3 Permissions UX Design Review

### Timing and trigger
- [ ] Every permission request is triggered by a concrete user action that directly requires the permission.
- [ ] No permission is requested on app launch or during onboarding unless the permission is core to the app's primary purpose.
- [ ] Unrelated permissions are not bundled with a single triggering action.
- [ ] Sequential permission dialogs (camera then microphone) are presented together with a shared rationale, not as two independent prompts.

### Pre-permission rationale
- [ ] An in-app rationale is shown before the system dialog whenever the purpose of the permission is not self-evident from the triggering action alone.
- [ ] Rationale answers two questions: what feature the permission enables, and what the user can still do without it.
- [ ] Rationale is one to two sentences — concise and value-positive, not legal or manipulative.
- [ ] A clear "Not now" or "Skip" action is present in the rationale UI and does not trigger the system dialog.
- [ ] Rationale is not shown repeatedly after the first denial cycle.
- [ ] Modal dialog rationale is reserved for high-stakes permissions; non-blocking rationale (Snackbar, inline card) is used for medium-stakes permissions.

### Permission minimization
- [ ] The narrowest permission satisfying the use case is requested (COARSE location instead of FINE, photo picker instead of READ_MEDIA_IMAGES).
- [ ] The Android photo picker has been evaluated as a no-permission alternative for media selection flows.
- [ ] Permissions declared in the manifest reflect features that are currently active in the app.
- [ ] Permissions for removed features have been cleaned up from the manifest.

### Graceful degradation when denied
- [ ] A minimum viable feature experience has been designed and specced before the permission request flow.
- [ ] Degraded states are represented with a neutral, explanatory label — not an empty state, broken UI, or hidden feature.
- [ ] Features unrelated to the denied permission are unaffected and fully functional.
- [ ] Partial grants (approximate location, selected photos) have designed UI states distinct from full access and full denial.

### Permanent denial and Settings redirect
- [ ] The design accounts for the state where `shouldShowRequestPermissionRationale` returns false after denial.
- [ ] A modal dialog (not a Snackbar) is used for the Settings redirect, explaining what was permanently denied and what enabling it unlocks.
- [ ] The Settings redirect action deep-links to the app's system settings page, not to the root Settings app.
- [ ] The Settings redirect modal is shown only once per denial event, not on every subsequent trigger.
- [ ] A persistent but non-blocking UI element (inline banner or contextual label) replaces the modal redirect for all subsequent visits.

### Notification permissions (Android 13+)
- [ ] `POST_NOTIFICATIONS` is not requested during onboarding or on first launch.
- [ ] The notification permission request is deferred until the user engages with a feature that produces meaningful notifications.
- [ ] Rationale for notification permission names the specific notification types the user will receive, not a generic "stay informed" message.

### Content and tone
- [ ] Rationale copy uses value-positive framing ("This lets you...") rather than consequence or guilt framing ("Without this, you will...").
- [ ] The degraded state label is neutral and informative, not punitive.
- [ ] The Settings redirect dialog explains the situation factually without pressuring the user.

### Large screen and adaptive behavior
- [ ] Pre-permission rationale dialogs appear within the pane or context that triggered the request on two-pane layouts.
- [ ] Rationale `AlertDialog` renders at a fixed maximum width on expanded breakpoints, not stretched edge-to-edge.
- [ ] Degraded state UI adapts correctly to both compact and expanded window size classes.
