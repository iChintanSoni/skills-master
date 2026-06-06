---
name: backup-restore
description: Covers Android Auto Backup and Key/Value Backup — configuring rules, exclusions, device-to-device transfer, cloud restore, and test workflows. Use when implementing or debugging app data backup and restore behavior on Android 16+.
globs:
  - "**/*.kt"
tags: [backup, restore, autobackup, data, jetpack]
x-skills-master:
  domain: android
  class: code
  category: data
  platforms: ["android", "large-screen"]
  requires: {android: "16", kotlin: "2.2"}
  pairs_with: []
  sources:
    - https://developer.android.com/guide/topics/data/autobackup
    - https://developer.android.com/guide/topics/data/testingbackup
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Apply this skill whenever you need to preserve user data across device resets, app reinstalls, or device migrations. This covers:

- Configuring Auto Backup to include or exclude specific files, SharedPreferences, or databases.
- Opting into Key/Value Backup (Android Backup Service) for lightweight data sets.
- Implementing a `BackupAgent` or `BackupAgentHelper` for custom backup logic.
- Handling restore events at first launch after reinstall or device transfer.
- Writing automated tests that exercise backup and restore paths using `bmgr`.

## Core guidance

**Auto Backup (API 23+, required behavior from API 31+)**

- Auto Backup runs automatically; opt out only intentionally via `android:allowBackup="false"` in the manifest, and document the reason.
- Define a backup rules file (XML) and reference it with `android:dataExtractionRules` (API 31+). For backward compatibility also set `android:fullBackupContent`.
- Prefer `<include>` and `<exclude>` rules over wildcard inclusion; be explicit about what constitutes sensitive data that must never leave the device.
- Use `requireFlags` to restrict backup to client-side encrypted transports when the data is sensitive.

**Key/Value Backup**

- Extend `BackupAgentHelper` for automatic helpers; only extend `BackupAgent` directly when you need full control over the backup lifecycle.
- Register `SharedPreferencesBackupHelper` and `FileBackupHelper` in `onCreate()`; the framework calls them in order.
- Keep backed-up key/value data small — the Android Backup Service imposes a per-app quota (typically 5 MB).

**Restore lifecycle**

- Data is restored before `Application.onCreate()` completes after a fresh install. Do not assume a default state at first launch.
- Listen for `ACTION_DEVICE_STORAGE_LOW` and back off writes before backup runs.
- Validate restored data on first use — schema versions may differ if the user restores from an older app version.

**Exclusions — what to always exclude**

- Device-specific identifiers (advertising ID, instance IDs).
- Authentication tokens and session cookies — rely on re-authentication after restore.
- Cached files under `getCacheDir()` (excluded automatically).
- Derived or regeneratable data (image thumbnails, compiled caches).

```kotlin
// BackupAgentHelper for SharedPreferences + a data file
class AppBackupAgent : BackupAgentHelper() {

    override fun onCreate() {
        // Back up the "user_prefs" SharedPreferences file
        val prefsHelper = SharedPreferencesBackupHelper(this, "user_prefs")
        addHelper("prefs_key", prefsHelper)

        // Back up a plain file in filesDir
        val fileHelper = FileBackupHelper(this, "notes.json")
        addHelper("notes_key", fileHelper)
    }

    override fun onRestoreFinished() {
        super.onRestoreFinished()
        // Validate schema or migrate data after restore completes
        getSharedPreferences("user_prefs", MODE_PRIVATE).edit {
            val schemaVersion = getInt("schema_version", 0)
            if (schemaVersion < CURRENT_SCHEMA) {
                migratePrefs(schemaVersion)
                putInt("schema_version", CURRENT_SCHEMA)
            }
        }
    }

    private fun migratePrefs(fromVersion: Int) { /* ... */ }

    companion object {
        const val CURRENT_SCHEMA = 3
    }
}
```

**Manifest wiring**

```xml
<application
    android:allowBackup="true"
    android:backupAgent=".AppBackupAgent"
    android:dataExtractionRules="@xml/data_extraction_rules"
    android:fullBackupContent="@xml/full_backup_content">
```

**data_extraction_rules.xml (API 31+)**

```xml
<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <include domain="sharedpref" path="user_prefs.xml"/>
        <include domain="database" path="app.db"/>
        <exclude domain="sharedpref" path="device_prefs.xml"/>
        <exclude domain="file" path="session_token"/>
    </cloud-backup>
    <device-transfer>
        <!-- Device-to-device can include more data than cloud -->
        <include domain="sharedpref" path="."/>
        <exclude domain="file" path="session_token"/>
    </device-transfer>
</data-extraction-rules>
```

**full_backup_content.xml (API 23–30 compat)**

```xml
<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <include domain="sharedpref" path="user_prefs.xml"/>
    <include domain="database" path="app.db"/>
    <exclude domain="sharedpref" path="device_prefs.xml"/>
</full-backup-content>
```

## Platform notes

**Large-screen / tablets**

- Device-to-device transfer is the primary vector for tablet-to-tablet migrations; `<device-transfer>` rules can safely include larger state (UI layout preferences, sidebar state).
- Test restore on a tablet after backup from a phone — screen-size-dependent preferences may need a migration step in `onRestoreFinished()`.

**Android 12+ (API 31+)**

- `dataExtractionRules` supersedes `fullBackupContent`; supply both for full API range coverage.
- `requireFlags="clientSideEncryption"` restricts cloud backup to only run when the transport supports on-device encryption — strongly recommended for health, finance, and messaging data.

**Android 9+ (API 28+)**

- Auto Backup runs over Wi-Fi only by default; users can change this. Do not rely on backup frequency for data durability.

**Work Profile / Enterprise**

- Managed devices may have backup disabled by EMM policy. Check `DevicePolicyManager.isBackupEnabled()` before surfacing backup-dependent UI.

## Pitfalls

- **Forgetting `onRestoreFinished`** — data is available in `onRestore()` callbacks but the app is not yet running normally; defer heavy migration to `onRestoreFinished()`.
- **Backing up tokens** — restoring an old token to a new device causes silent auth failures. Exclude all tokens explicitly; re-authenticate on first launch.
- **Not versioning backed-up data** — if the database schema or preference keys change between app versions, a restore from an older backup can corrupt state. Always store and check a schema version.
- **Relying on absolute file paths** — reconstructed paths may differ across devices. Use `context.filesDir` / `context.getDatabasePath()` at runtime, never hardcode paths.
- **Large backup payloads** — the Key/Value Backup quota is ~5 MB per app. Exceeding it silently drops data. Prefer Auto Backup for larger datasets.
- **Not testing restore** — backup logic is invisible until restore; use `bmgr` in CI to exercise both paths.
- **Caching sensitive data before backup** — data written to `filesDir` without a corresponding exclude rule will be backed up. Route sensitive data through the Keystore (which is never backed up).

## References

- **Documentation:** [Auto Backup for Apps](https://developer.android.com/guide/topics/data/autobackup)
- **Documentation:** [Testing Backup and Restore](https://developer.android.com/guide/topics/data/testingbackup)
- **Reference:** [BackupAgentHelper — Android SDK](https://developer.android.com/reference/android/app/backup/BackupAgentHelper)

## See also

- **keychain-security** — for storing credentials that must survive restore without exposing raw tokens.
- **core-data / room persistence** — backup rules for Room databases follow the same domain `database` path conventions.
- **work-manager** — for scheduling post-restore migration jobs that must run after the first launch completes.
