---
name: app-shortcuts
description: Covers launcher shortcuts (static, dynamic, pinned) and Google Assistant App Actions. Use when implementing app entry shortcuts, custom intents, or system keyboard shortcuts helper integration.
globs:
  - "**/*.kt"
  - "**/shortcuts.xml"
tags: [shortcuts, app-actions, assistant, launcher, android]
x-skills-master:
  domain: android
  class: code
  category: platform-services
  platforms: ["android"]
  requires:
    android: "16"
    kotlin: "2.2"
  pairs_with: []
  sources:
    - https://developer.android.com/develop/ui/compose/system/shortcuts
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill when implementing entry point shortcuts for the launcher, providing custom shortcuts dynamically based on user usage, pinning shortcuts to the home screen, or exposing actions to the physical keyboard shortcut helper.

## Core guidance

### Static Shortcuts

- Defined in an XML resource file (`res/xml/shortcuts.xml`) and referenced in the manifest using `<meta-data android:name="android.app.shortcuts" ... />` inside the launcher Activity.
- Use for actions that are constant throughout the app's lifetime (e.g. "Create post", "Search library").

### Dynamic Shortcuts

- Published and managed at runtime using `ShortcutManagerCompat`.
- Tailor these to user actions (e.g. "Message Alice", "View order #123").
- Limit the total active dynamic/static shortcuts to 4 (system display limit).

### Pinned Shortcuts

- Created dynamically with the user's explicit consent to be added as individual icons on the home screen.
- Verify support with `ShortcutManagerCompat.isRequestPinShortcutSupported(context)` before requesting.

### Keyboard Shortcut Helper

- Override `onProvideKeyboardShortcuts` in your launcher activity to expose keyboard shortcuts for devices with physical keyboards (e.g. tablets, ChromeOS, foldables).

```kotlin
// Register dynamic shortcut
val shortcut = ShortcutInfoCompat.Builder(context, "shortcut_message_alice")
    .setShortLabel("Message Alice")
    .setLongLabel("Send a direct message to Alice")
    .setIcon(IconCompat.createWithResource(context, R.drawable.ic_user_alice))
    .setIntent(
        Intent(context, ChatActivity::class.java).apply {
            action = Intent.ACTION_VIEW
            putExtra("user_id", "alice_123")
        }
    )
    .build()

ShortcutManagerCompat.pushDynamicShortcut(context, shortcut)
```

```xml
<!-- res/xml/shortcuts.xml -->
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
    <shortcut
        android:shortcutId="new_post"
        android:enabled="true"
        android:icon="@drawable/ic_shortcut_add"
        android:shortcutShortLabel="@string/shortcut_add_short"
        android:shortcutLongLabel="@string/shortcut_add_long">
        <intent
            android:action="android.intent.action.VIEW"
            android:targetPackage="com.example.myapp"
            android:targetClass="com.example.myapp.ui.PostActivity" />
    </shortcut>
</shortcuts>
```

## Platform notes

- **Limit Constraints:** While the manifest supports more, launchers can display a maximum of 4 shortcuts.
- **Dynamic Shortcut Lifespan:** Dynamic shortcuts persist across app updates but are cleared if the app data is cleared. Backup identifier maps if needed.

## Pitfalls

- **Broken Intents:** Specifying incorrect `targetPackage` or `targetClass` in static XML manifests will cause home launcher taps to crash.
- **Too many shortcuts:** Pushing too many dynamic shortcuts without cleaning up old ones. Use `pushDynamicShortcut` to automatically handle scheduling limits.
- **Resource Loading:** Using dynamic icons from arbitrary files that get garbage collected. Always rely on stable resource URIs or Bitmap icons wrapped in `IconCompat`.

## References

- **Documentation:** [App shortcuts overview](https://developer.android.com/develop/ui/compose/system/shortcuts)
- **Documentation:** [Dynamic shortcuts](https://developer.android.com/guide/topics/ui/shortcuts/managing-shortcuts)

## See also

See the `keyboard-mouse-stylus` skill for hardware input handling. For launching details pages using deep links, see `android-navigation-architecture`.
