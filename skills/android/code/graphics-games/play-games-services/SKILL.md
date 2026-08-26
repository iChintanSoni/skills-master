---
name: play-games-services
description: "Covers Play Games Services v2 on Android — PlayGamesSdk.initialize plus automatic platform sign-in through GamesSignInClient, achievements and leaderboards, saved games via SnapshotsClient, friends and player profile comparison, server-side access with requestServerSideAccess, and the Recall API for cross-device account linking. Use when adding social and progression features to an Android game, migrating a v1 integration off GoogleSignInClient before the v1 shutdown, or preparing a title for Google Play Games on PC."
license: MIT
globs:
  - "**/*.kt"
tags: []
x-skills-master:
  domain: android
  class: code
  category: graphics-games
  platforms: ["android"]
  requires: { android: "17", kotlin: "2.2", "play-services-games-v2": "22.0.0" }
  pairs_with: [play-console-publishing]
  sources:
    - https://developer.android.com/games/pgs/android/android-signin
    - https://developer.android.com/games/pgs/android/migrate-to-v2
    - https://developer.android.com/games/pgs/recall/recall-setup
  snapshot_date: "2026-08-25"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for Play Games Services (PGS) when an Android game needs a platform identity and the social scaffolding around it: achievements, leaderboards, cloud-synced saves, a friends list, and cross-device progress restore. PGS owns the *platform* identity (the Gamer Profile, Play Points, Play social progress); it deliberately does **not** own your in-game account or your inventory — that stays yours, backed by your own server or by Credential Manager sign-in. Everything below targets **v2** (`com.google.android.gms:play-services-games-v2`). If you are reading guidance that mentions `GoogleSignInClient`, `GoogleSignInOptions`, or `Games.getLeaderboardsClient(activity, account)`, it is v1 and no longer compiles against a supported SDK.

## Core guidance

- **Initialize once per process.** Call `PlayGamesSdk.initialize(this)` from `Application.onCreate()`, before any `PlayGames.*` accessor runs, and add the manifest meta-data `com.google.android.gms.games.APP_ID` pointing at your PGS project ID string resource. Both are mandatory — a missing APP_ID is the single most common "nothing works" cause.
- **Sign-in is automatic; do not build a sign-in button as the primary path.** v2 authenticates the player at game start and retries on its own. Query state with `PlayGames.getGamesSignInClient(activity).isAuthenticated()`, which returns a `Task`; treat the player as signed in only when `task.isSuccessful` **and** `task.result.isAuthenticated`. Call `signIn()` solely as a fallback after that check comes back false (the player declined, or you set `SUPPRESS_GAME_PROFILE_CREATION`).
- **There is no sign-out.** v1's `GoogleSignInClient.signOut()` has no v2 counterpart; account control lives at the platform level. Design your UI so nothing depends on the game being able to drop the PGS session.
- **Get every feature client from `PlayGames`,** with an `Activity` and nothing else: `getAchievementsClient`, `getLeaderboardsClient`, `getSnapshotsClient`, `getPlayersClient`, `getEventsClient`, `getPlayerStatsClient`, `getRecallClient`. No account object is threaded through any more. `GamesClient` and `GamesMetadataClient` were dropped with no replacement — delete that code rather than looking for an equivalent.
- **Never key your backend on the client-reported player ID.** Call `gamesSignInClient.requestServerSideAccess(webClientId, forceRefreshToken, scopes)`, take the `AuthResponse`, and exchange its authorization code on your server. Client-side identity is a display concern, not an authentication one.
- **Achievements:** `unlock(id)` for one-shot, `increment(id, steps)` for incremental (PGS unlocks it automatically at the final step). Batch increments — accumulate locally and flush per round or per milestone, never per gameplay event. Show the system UI by awaiting `getAchievementsIntent()` and launching the resulting `Intent`. Play's quality bar asks for at least 10 visible achievements with 4 or more reachable inside the first hour.
- **Leaderboards:** `submitScore(leaderboardId, score)` at game over or a natural checkpoint, not on a timer — the client library already filters out submissions worse than the last one it sent. Present with `getLeaderboardIntent(id)` or `getAllLeaderboardsIntent()`. Define a plausible upper bound and validate server-side; client score submissions are trivially forged.
- **Saved games (`SnapshotsClient`):** `open(name, createIfMissing, conflictPolicy)` yields a `DataOrConflict<Snapshot>`; write through `snapshot.snapshotContents.writeBytes(...)` and finish with `commitAndClose(snapshot, SnapshotMetadataChange)`. Hard limits are **3 MB of binary data and 800 KB for the cover image**; there is no cap on how many saves a player may hold. Save every few minutes at most.
- **Resolve conflicts explicitly.** Always branch on `DataOrConflict.isConflict()` and merge, then call `resolveConflict(conflictId, resolvedSnapshot)`. `RESOLUTION_POLICY_MOST_RECENTLY_MODIFIED` will auto-resolve for you, but it silently discards the losing device's progress.
- **Friends require consent.** `PlayersClient.loadFriends(pageSize, forceReload)` fails with `FriendsResolutionRequiredException` until the player grants access; take `getResolution()` and start the `PendingIntent` with `startIntentSenderForResult`. That intent is **single-use** — re-request on the next failure. Profile comparison (`getCompareProfileIntent(playerId)`, or `getCompareProfileIntentWithAlternativeNameHints` to show in-game names) needs no friends permission.
- **Recall links progress across devices and across your catalogue.** `PlayGames.getRecallClient(activity).requestRecallAccess()` returns a `RecallAccess` whose `sessionId` you hand to your server; the server calls `linkPersona` with an opaque encrypted persona and token (each capped at 256 characters) and later `retrieveTokens` or `lastTokenFromAllDeveloperGames`. Profileless recall is opt-in via the `PROFILELESS_RECALL_ENABLED` manifest flag and defaults to a 30-day token TTL.

```kotlin
class GameApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        PlayGamesSdk.initialize(this)          // before any PlayGames.* accessor
    }
}

// Later, in an Activity — the platform has already tried to sign the player in.
private fun resolvePlayer(activity: Activity) {
    val signIn = PlayGames.getGamesSignInClient(activity)
    signIn.isAuthenticated().addOnCompleteListener { task ->
        val signedIn = task.isSuccessful && task.result.isAuthenticated
        if (signedIn) enableSocialFeatures(activity) else offerManualSignIn(signIn)
    }
}
```

## Platform notes

- **Dependency:** `com.google.android.gms:play-services-games-v2` (22.0.0 is current as of July 2026). Pin it in your version catalogue. Do **not** add `com.google.android.gms:play-services-games` — that is v1, and 25.0.0 (June 15, 2026) removed the v1 API surface outright.
- **v1 shutdown timeline:** the v1 SDK was deprecated in September 2025 (`play-services-games:24.0.0`), the APIs left the SDK on June 15, 2026, and v1 traffic is scheduled to be blocked in **May 2027**. A game still on v1 stops working then, whether or not it is rebuilt.
- **Google Sign-In removal spills over.** `play-services-auth` dropped the GSI APIs in May 2026, so any third-party SDK still referencing them breaks the build. App-level identity belongs to Credential Manager now; PGS v2 platform identity is separate and additive.
- **Console setup gates everything.** Create the PGS project, add an Android OAuth credential per signing certificate SHA-1 (one for the Play-held release certificate, one for your debug keystore), add a game-server web credential for `requestServerSideAccess`, allowlist testers, and **publish the PGS configuration before publishing the game**. A non-tester hitting an unpublished configuration sees OAuth and 404 failures that look like SDK bugs.
- **Google Play Games on PC** ships the same AAB and the same PGS integration, and PGS is what carries progress between the phone and the PC session. The PC surface adds obligations: keyboard and mouse support (the Input SDK handles remapping), x86/x86_64 native libraries alongside ARM in the bundle, and layouts that survive player-chosen resolutions up to 4K.
- **`SUPPRESS_GAME_PROFILE_CREATION`** meta-data turns off automatic profile creation. If you set it, you own the flow: watch for `GamesClientStatusCodes.SIGN_IN_REQUIRED` and drive `signIn()` yourself.
- PGS rides on Google Play services. Devices without it — some emulators, much of the China market — have no PGS at all. Degrade to local progress rather than gating play.

## Pitfalls

- **Porting v1 code verbatim.** `GoogleSignIn`, `GoogleSignInOptions`, `GoogleSignInClient`, `Games.getXClient(activity, account)`, `GamesClient`, and `GamesMetadataClient` are all gone. Swap in the `PlayGames.getXClient(activity)` accessors and delete the rest.
- **Leading with a "Sign in with Play Games" button.** It duplicates work the platform already did and reads as broken when the player is silently authenticated. Show it only after `isAuthenticated()` returns false.
- **Expecting a sign-out API** and building account-switching UI around it.
- **Trusting client-side identity or scores.** Both need a server round trip via `requestServerSideAccess`.
- **Calling `increment()` per gameplay action.** Quota is per Cloud project and rate limiting kicks in; batch instead.
- **Exceeding the snapshot limits.** Over 3 MB of data or an 800 KB cover image and the commit fails — compress state and downscale the screenshot before writing.
- **Ignoring `DataOrConflict.isConflict()`.** Two devices playing offline will produce a conflict; unhandled, one device's session vanishes.
- **Reusing the `FriendsResolutionRequiredException` intent.** It resolves once; cache it and the second consent prompt never appears.
- **SHA-1 mismatch under Play App Signing.** The OAuth credential needs the fingerprint of the *release* certificate Google holds, not your upload key's. This is the classic "works in debug, fails in production" PGS failure.
- **Skipping `startActivityForResult` for PGS intents.** Even when you ignore the result, PGS uses it to identify the calling package; `startActivity` alone can fail.

## References

- **Documentation:** [Play Games Services overview](https://developer.android.com/games/pgs/overview)
- **Documentation:** [Platform authentication (Android)](https://developer.android.com/games/pgs/android/android-signin)
- **Documentation:** [Migrate to Play Games Services v2](https://developer.android.com/games/pgs/android/migrate-to-v2)
- **Documentation:** [Recall API setup](https://developer.android.com/games/pgs/recall/recall-setup)
- **Documentation:** [Saved games](https://developer.android.com/games/pgs/savedgames)
- **Documentation:** [Quality checklist](https://developer.android.com/games/pgs/quality)
- **Documentation:** [Deprecation schedule](https://developer.android.com/games/pgs/deprecation)
- **Documentation:** [Google Play Games on PC](https://developer.android.com/games/playgames/overview)

## See also

Pair with `play-console-publishing` — the PGS configuration, OAuth credentials, and tester allowlist all live in the same Play Console release flow, and publishing order matters. See `credential-manager` for the app-level sign-in that replaces Google Sign-In and coexists with PGS platform identity, `play-billing` when achievements or saves gate purchasable content, and `play-asset-delivery` for shipping the game's bulk content. For the Google Play Games on PC input requirements, see `keyboard-mouse-stylus`.
