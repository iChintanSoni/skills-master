---
name: app-actions-assistant
description: Teaches how to expose app capabilities to Android system surfaces via App Actions and shortcuts — Use when integrating with Google Assistant, surfacing app capabilities in launcher search, or wiring static/dynamic/pinned shortcuts so the OS can deep-link into your features.
---

## When to use

Apply this skill whenever you want to surface app functionality outside the app itself — via Google Assistant voice commands, launcher long-press shortcuts, system search, or predictive suggestions. It covers the full shortcut surface area: static shortcuts declared in XML, dynamic shortcuts created at runtime via `ShortcutManagerCompat`, pinned shortcuts added to the home screen, and the `shortcuts.xml` capability file that powers App Actions in Google Assistant.

## Core guidance

### Shortcuts (static, dynamic, pinned)

**Static shortcuts** are declared at build time in `res/xml/shortcuts.xml` and registered in `AndroidManifest.xml` on your launcher `Activity`. They appear in the launcher long-press menu and are fastest for fixed, high-value actions.

- Limit to **four or fewer** static shortcuts; the launcher only shows the top four.
- Use a `targetPackage`/`targetClass` intent so the OS can deep-link directly to the right screen without routing through your main activity.
- Always supply `shortcutShortLabel` (≤ 10 chars) and `shortcutLongLabel` (≤ 25 chars).

**Dynamic shortcuts** are created and updated at runtime — prefer `ShortcutManagerCompat` (Jetpack) over the platform `ShortcutManager` to get backport support.

- Call `pushDynamicShortcut` rather than `setDynamicShortcuts` when updating individual items so you do not accidentally wipe others.
- Respect the `ShortcutManagerCompat.getMaxShortcutCountPerActivity` cap before pushing.
- Remove stale dynamic shortcuts with `removeDynamicShortcuts` promptly; stale shortcuts erode trust and can surface broken deep links.

**Pinned shortcuts** are user-initiated. Request pinning via `ShortcutManagerCompat.requestPinShortcut`; the system shows a confirmation dialog — never call this in response to an automated trigger.

```kotlin
// Push a dynamic shortcut pointing at a Compose destination
fun pushRecentSessionShortcut(context: Context, sessionId: String, title: String) {
    if (!ShortcutManagerCompat.isRequestPinShortcutSupported(context)) return

    val intent = Intent(context, MainActivity::class.java).apply {
        action = Intent.ACTION_VIEW
        putExtra("destination", "session_detail")
        putExtra("sessionId", sessionId)
        // Mandatory: dynamic shortcuts must have a non-default action
    }

    val shortcut = ShortcutInfoCompat.Builder(context, "session_$sessionId")
        .setShortLabel(title.take(10))
        .setLongLabel(title.take(25))
        .setIcon(IconCompat.createWithResource(context, R.drawable.ic_session))
        .setIntent(intent)
        .setCategories(setOf(ShortcutInfo.SHORTCUT_CATEGORY_CONVERSATION))
        .build()

    ShortcutManagerCompat.pushDynamicShortcut(context, shortcut)
}
```

### App Actions and shortcuts.xml capability file

App Actions let Google Assistant trigger your app with natural-language voice or text commands, resolved against built-in Android intents (BIIs). The capability file is **separate** from the shortcuts file used for launcher shortcuts, though they share the same `res/xml/` directory and can share intent definitions.

- Map each capability to the most specific BII — e.g. `actions.intent.START_EXERCISE`, `actions.intent.PLAY_MEDIA`, `actions.intent.GET_THING`. Avoid generic BIIs when a domain-specific one exists.
- Declare the `<capability>` in `shortcuts.xml` and reference it from `AndroidManifest.xml` as a `<meta-data>` element with `name="com.google.android.actions"`.
- For each capability, define one or more `<intent>` fulfillment targets (an Activity, a Slice, or a widget) that accept the resolved parameters as extras.
- Use `<parameter>` elements to map BII parameters (e.g. `exercise.name`) to your own intent extras. Keep parameter names stable across releases — changing them breaks existing Assistant routines users have saved.
- Test capabilities in the **App Actions Test Tool** plugin for Android Studio before shipping.

### Manifest wiring

```xml
<!-- AndroidManifest.xml -->
<activity android:name=".MainActivity" android:exported="true">
    <!-- Launcher shortcuts -->
    <meta-data
        android:name="android.app.shortcuts"
        android:resource="@xml/shortcuts" />
    <!-- App Actions capability file -->
    <meta-data
        android:name="com.google.android.actions"
        android:resource="@xml/shortcuts" />
</activity>
```

Both meta-data entries can reference the **same** `shortcuts.xml` if you combine launcher shortcuts and capability declarations in one file, which is the recommended approach to keep intent definitions DRY.

### Ranking and reporting

- Report shortcut usage to the system via `ShortcutManagerCompat.reportShortcutUsed(context, shortcutId)` each time the user completes the shortcut's action. The OS uses this signal to boost prediction ranking and suggest the shortcut proactively.
- Disable shortcuts rather than deleting them when the underlying resource is temporarily unavailable (e.g. offline content). Use `disableShortcuts` with a user-facing message string so the launcher can display it instead of silently hiding the entry.

## Platform notes

**Large screens / foldables:** On large-screen devices the launcher long-press menu is often replaced by a taskbar context menu. Shortcut labels and icons must still render clearly at higher densities — prefer vector drawables or adaptive icons, and ensure long labels do not exceed 25 characters so they are not truncated in multi-window contexts.

**API level 25+:** `ShortcutManager` was introduced at API 25. `ShortcutManagerCompat` from `androidx.core:core` backports the API surface gracefully — on older devices dynamic/pinned shortcuts are no-ops rather than crashes, so always use the compat layer.

**Android 12+ (API 32) conversation shortcuts:** If your app handles messaging, set `setCategories(setOf(ShortcutInfo.SHORTCUT_CATEGORY_CONVERSATION))` and provide a `Person` via `setPerson`. This unlocks priority conversations, bubbles, and notification ranking improvements at the OS level.

**App Actions publishing:** Capability changes require a Play Store release before they are active for end users. Use the App Actions Test Tool to validate locally without a release.

## Pitfalls

- **Forgetting `android:exported="true"`** on the Activity receiving shortcut intents — the OS cannot launch it and your shortcut silently fails.
- **Hardcoding shortcut IDs** as magic strings scattered across the codebase — centralise them in a `ShortcutIds` object to prevent typos breaking `reportShortcutUsed` calls.
- **Calling `setDynamicShortcuts` (overwrite-all)** instead of `pushDynamicShortcut` — this resets usage stats and ranking for all existing shortcuts simultaneously.
- **Not validating against the count cap** before pushing — exceeding `getMaxShortcutCountPerActivity` silently drops the lowest-ranked shortcuts, which may not be the ones you expect.
- **Using non-stable shortcut IDs** (e.g. auto-generated UUIDs per session) — the OS cannot match usage history across launches, so prediction ranking never improves.
- **Skipping the App Actions Test Tool** and relying on production Assistant to test capabilities — the turnaround is too slow and surface-level errors are cryptic without the plugin's structured output.
- **Omitting `shortcutDisabledMessage`** when calling `disableShortcuts` — the launcher shows a generic error, giving users no context.

## References

- **Documentation:** [App Actions Overview](https://developer.android.com/guide/app-actions/overview)
- **Documentation:** [App Shortcuts](https://developer.android.com/guide/topics/ui/shortcuts)
- **API Reference:** [ShortcutManagerCompat (Jetpack)](https://developer.android.com/reference/androidx/core/content/pm/ShortcutManagerCompat)

## See also

The `app-intents` skill (if building cross-platform intent integration) and `deep-linking` cover complementary ways to route users into specific in-app destinations. The `navigation-architecture` skill explains how to wire the receiving Activity or Composable destination once the OS launches your app via a shortcut intent.
