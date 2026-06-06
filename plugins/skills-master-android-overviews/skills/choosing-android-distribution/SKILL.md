---
name: choosing-android-distribution
description: Use when deciding how to distribute an Android app — Google Play vs alternative stores vs enterprise/direct sideload — and which delivery format (AAB vs APK), track strategy, and update mechanism to adopt.
---

## When to use

Reach for this skill when you are deciding:

- Where to publish a new or existing Android app (Play, Amazon, Samsung Galaxy Store, direct APK, enterprise MDM).
- Which build artifact to ship (Android App Bundle vs universal APK vs split APKs).
- How to structure release tracks and staged rollouts.
- Which dynamic-delivery mechanism to use for optional or large content (Play Feature Delivery, Play Asset Delivery, in-app updates).
- Whether enterprise / sideload distribution is the right fit and what that entails.

## Core guidance

### Distribution channel

| Channel | Best for | Key constraint |
|---|---|---|
| **Google Play** | Consumer apps targeting the widest Android audience | Must comply with Play policy; AAB required since Aug 2021 |
| **Amazon Appstore** | Primarily Fire tablets / Fire TV; secondary Android market | Separate APK upload; no Google Play Services |
| **Samsung Galaxy Store** | Galaxy-centric OEM features (DeX, SPen, Bixby) | Smaller reach; manual review |
| **Direct / sideload APK** | Beta testers, corporate tools, regulated verticals | No delta updates; users must enable unknown sources |
| **Enterprise MDM (e.g. Intune, JAMF)** | Internal line-of-business apps, zero consumer reach needed | Managed Google Play or private channel required |

**Recommendation: publish to Google Play with an Android App Bundle (AAB) for virtually every consumer app.** Play delivers optimised APK splits per device, manages signing, and gives you staged rollouts, A/B testing, and pre-launch reports at no extra cost. Only choose an alternative channel when there is a concrete reason — legal restriction, OEM partnership, or enterprise mandate.

### Build artifact

Android App Bundle (`.aab`) is the required format on Play and the correct default everywhere else that accepts it. Play's backend generates ABI-, language-, screen-density-, and (on Android 16+) SDK-version-filtered APK splits from a single upload, cutting typical install sizes 20-40 %.

Keep a universal APK build script in CI for:
- Alternative stores that do not yet accept AAB.
- Enterprise MDM deployments.
- Local QA sideloading.

Never ship a fat universal APK to Play; it is rejected since August 2021 for new apps and since June 2024 for all updates.

### Play tracks and staged rollouts

Use the standard track ladder:

1. **Internal testing** — up to 100 testers; instant publish; no review.
2. **Closed (alpha) testing** — invite-only groups; full review.
3. **Open (beta) testing** — opt-in public; full review.
4. **Production** — staged rollout: start at 1–5 %, monitor ANR/crash rate in Play Console, expand or halt from the console.

For hotfix speed, prefer a 10 % staged rollout over a full rollout; Play lets you halt and roll back within the same release.

### Play App Signing

Opt in to Play App Signing (mandatory for new apps since 2021). Google holds the upload key separately from the signing key, so a lost upload key can be rotated without losing the signing identity. Store your upload keystore in a secrets manager (e.g. Google Secret Manager) and never commit it to source control.

### Dynamic delivery and large content

| Mechanism | Use when |
|---|---|
| **Play Feature Delivery** | Optional features > a few MB that most users will never install (e.g., AR mode, accessibility module) |
| **Play Asset Delivery** | Game textures, audio banks, or level packs; replaces APK Expansion Files (OBBs) |
| **In-app updates API** | Critical bug fixes requiring immediate user action (flexible) or app-blocking severity (immediate) |
| **App Startup / baseline profiles** | Not delivery, but pair with AAB to ship a Baseline Profile that Play pre-compiles on device |

Avoid over-splitting features into dynamic modules; each module adds build complexity. Reserve feature modules for genuinely optional, large, or rarely-used code paths.

### Enterprise / direct distribution decision

Choose enterprise distribution (Managed Google Play private channel or MDM) when:

- The app is internal-only and should never appear in the public store.
- Your organisation controls devices via an EMM (Enterprise Mobility Management) solution.
- You need silent, zero-tap installation.

Choose direct APK sideloading only as a last resort (hardware lab devices, regulated markets that block Play). You lose automatic update delivery and must handle version management manually.

## Platform notes

- **Large screens and foldables**: AAB splits can now include `screenLayout`-specific resources. Test on both unfolded and folded states; Play surfaces large-screen quality badges in search results (2026 programme).
- **Android 16 (API 36)**: Predictive back is enforced by default. Ensure your Activity/Fragment back handling uses `OnBackPressedCallback`; this is a release blocker on Play from Q3 2026.
- **Wear OS / Android TV / Auto**: Each platform has a dedicated Play track. Bundle all form-factor APKs in a single AAB using product flavors; Play routes the correct split to each device.
- **In-app updates**: The `FLEXIBLE` flow works for non-critical updates (download in background, prompt to restart). The `IMMEDIATE` flow blocks the app UI until the update is installed — use sparingly and only for genuine data-safety or security fixes.

## Pitfalls

- **Committing the upload keystore to git**: A leaked key cannot be rotated without losing Play App Signing continuity. Use a CI secret store from day one.
- **Skipping staged rollouts**: A 100 % rollout of a bad build cannot be recalled; Play only lets you halt an in-progress staged rollout, not retract a completed one.
- **Hardcoding `versionCode` in Gradle**: Automate `versionCode` from CI build number so parallel tracks never reuse the same code. Play rejects an upload whose `versionCode` is already taken.
- **Bundling assets that belong in Play Asset Delivery**: Shipping > 150 MB of game assets inside the AAB itself inflates install size and increases review time. Use PAD texture packs instead.
- **Forgetting `queries` in `AndroidManifest.xml`**: Apps targeting API 30+ need explicit `<queries>` for intents they resolve. Missing entries cause silent failures that only appear on real devices, not the emulator.
- **Using dynamic feature modules for every screen**: Feature module loading latency and split-compat plumbing is complex. Benchmark against a monolithic build before committing to the split.

## References

- **Google Play distribution overview** — https://developer.android.com/distribute
- **Android App Bundle guide** — https://developer.android.com/guide/app-bundle

## See also

- `build-sign-distribute` — deep how-to on Gradle build configuration, signing configs, and CI pipeline setup for Play uploads.
- `ci-cd-signing` — automating keystore management and upload-key rotation in CI.
- `entitlements-capabilities` — analogous decisions for iOS/iPadOS; useful if you maintain a cross-platform codebase.
