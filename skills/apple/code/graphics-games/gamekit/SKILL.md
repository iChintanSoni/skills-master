---
name: gamekit
description: "Use when adding Game Center to a game with GameKit — authenticating the local player via GKLocalPlayer.authenticateHandler, submitting leaderboard scores and reporting achievements, showing the dashboard with GKAccessPoint or GKGameCenterViewController, running real-time GKMatch or turn-based GKTurnBasedMatch matchmaking, saving games, and adopting the newer Challenges and Activities (GKGameActivity)."
globs:
  - "**/*.swift"
tags: [gamekit, game-center, multiplayer, leaderboards, achievements]
x-skills-master:
  domain: apple
  class: code
  category: graphics-games
  platforms: [ios, ipados, macos, tvos, visionos]
  requires:
    ios: "17"
    swift: "6.0"
  pairs_with: []
  sources:
    - https://developer.apple.com/documentation/gamekit
    - https://developer.apple.com/documentation/gamekit/gklocalplayer
    - https://developer.apple.com/documentation/gamekit/gkaccesspoint
    - https://developer.apple.com/documentation/gamekit/gkgameactivity
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Reach for GameKit when a game needs Game Center: identifying the signed-in player, posting scores to leaderboards, awarding achievements, matching strangers or friends for real-time or turn-based play, and syncing saved games across devices. Authentication is the gate for everything else — leaderboards, matchmaking, and saved games all require an authenticated `GKLocalPlayer`, so wire it up at launch before touching any other API. For social hooks that turn even a single-player game multiplayer, layer on the newer Challenges and Activities surfaced through `GKGameActivity`.

## Core guidance

- **Authenticate first, exactly once, at launch.** Assign `GKLocalPlayer.local.authenticateHandler` early; GameKit hands you a sign-in view controller to present (or `nil` when already authenticated). The closure can fire again, so make it idempotent.
- **Check `isAuthenticated` before every gated call.** Never assume; the player can sign out mid-session, after which submissions silently fail.
- **Prefer the async surface.** Submit scores with `GKLeaderboard.submitScore(_:context:player:leaderboardIDs:)` and report progress with `GKAchievement.report(_:)`; both have `async throws` forms, so drop the legacy completion handlers.
- **Don't store player identity by `displayName` or `gamePlayerID` across games.** Use `teamPlayerID` for a stable, app-scoped identifier; persist `GKPlayer` via its `scopedIDsArePersistent()` guarantee, not raw strings.
- **Show the dashboard through `GKAccessPoint.shared`** (set `.isActive = true`, pick a `.location`) or present `GKGameCenterViewController` directly — don't build a custom leaderboard UI when the system one exists.
- **Register listeners, don't poll.** Conform to `GKLocalPlayerListener` and call `GKLocalPlayer.local.register(_:)` to receive turn events, invites, saved-game conflicts, and `player(_:wantsToPlay:)` activity deep links.
- **Configure with a GameKit bundle (Xcode 26).** Define leaderboards, achievements, and activities locally, test with the Game Progress Manager, and sync to App Store Connect.

```swift
GKLocalPlayer.local.authenticateHandler = { signInVC, error in
    if let signInVC {
        rootViewController.present(signInVC, animated: true)   // user must sign in
    } else if GKLocalPlayer.local.isAuthenticated {
        GKAccessPoint.shared.isActive = true                   // ready for Game Center
        GKLocalPlayer.local.register(matchListener)
    } else {
        log("Game Center unavailable: \(error?.localizedDescription ?? "")")
    }
}
```

## Platform notes

- **iOS/iPadOS 17+, macOS 14+, tvOS 17+, visionOS 1+** cover the modern async surface; **Challenges and Activities (`GKGameActivity`, `GKAccessPoint.trigger(handler:)` with an activity) require the 26 OS cycle** (iOS/iPadOS 26, macOS 26, tvOS 26, visionOS 26).
- **Real-time matchmaking:** present `GKMatchmakerViewController` with a `GKMatchRequest`; once matched you get a `GKMatch`. Send game state via `send(_:to:dataMode:)` or `sendData(toAllPlayers:with:)`, choosing `.reliable` for state that must arrive and `.unreliable` for high-frequency updates. Receive through `GKMatchDelegate`.
- **Turn-based:** use `GKTurnBasedMatchmakerViewController` to create a `GKTurnBasedMatch`; advance play with `endTurn(withNextParticipants:turnTimeout:match:completionHandler:)` and persist shared state in `matchData`.
- **Saved games:** call `GKLocalPlayer.local.saveGameData(_:withName:)` and `fetchSavedGames()`; handle iCloud conflicts through `GKSavedGameListener` by resolving with `resolveConflictingSavedGames(_:with:)`.
- **No `Info.plist` usage string is required**, but the app needs the **Game Center capability** enabled in Signing & Capabilities, and online features need network access. There is no `NSGameCenterUsageDescription` key — sign-in consent is handled by the system UI.

## Pitfalls

- **Gating UI on a cached auth result** — the handler can re-run after a sign-out; always re-read `isAuthenticated`.
- **Calling `authenticateHandler` setup repeatedly** (e.g., per view) presents duplicate sign-in sheets; set it once at app start.
- **Treating `displayName` as an identity key** — it is mutable and not unique; use `teamPlayerID`.
- **Sending large payloads over `.reliable` every frame** floods `GKMatch`; throttle, batch, and reserve `.unreliable` for transient state.
- **Ignoring saved-game conflicts** — multiple devices produce divergent files; you must resolve them, or the latest write silently wins.
- **Submitting scores before authentication completes** — the call throws or no-ops; await the authenticated state first.

## References

- **Documentation:** [GameKit](https://developer.apple.com/documentation/gamekit)
- **Documentation:** [GKLocalPlayer](https://developer.apple.com/documentation/gamekit/gklocalplayer)
- **Documentation:** [GKAccessPoint](https://developer.apple.com/documentation/gamekit/gkaccesspoint)
- **Documentation:** [GKGameActivity](https://developer.apple.com/documentation/gamekit/gkgameactivity)
- **WWDC:** [Get started with Game Center (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/214/)
- **Sample Code:** [GKMatch](https://developer.apple.com/documentation/gamekit/gkmatch)

## See also

Pair this with a cloudkit or icloud skill when saved-game conflict resolution needs to reason about device sync, and with a uikit-swiftui-interop skill to host `GKMatchmakerViewController` and `GKGameCenterViewController` cleanly inside a SwiftUI app. A swiftui-app-lifecycle skill helps anchor the authentication handler and listener registration to true app launch rather than view appearance.
