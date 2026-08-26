---
name: play-asset-delivery
description: "Covers Google Play Asset Delivery — install-time, fast-follow, and on-demand asset packs declared with the com.android.asset-pack Gradle plugin, runtime download and progress tracking through AssetPackManager, texture compression format targeting, Play's per-pack and total size limits, and testing with bundletool local testing or internal app sharing. Use when a game ships gigabytes of assets, replaces legacy OBB expansion files, delivers per-GPU texture variants, or stages heavy content after install."
license: MIT
globs:
  - "**/*.kt"
  - "**/*.gradle.kts"
tags: [app-bundle]
x-skills-master:
  domain: android
  class: code
  category: graphics-games
  platforms: ["android"]
  requires: { android: "17", kotlin: "2.2", agp: "9.1", "asset-delivery": "2.3.0" }
  pairs_with: [app-bundles-size]
  sources:
    - https://developer.android.com/guide/playcore/asset-delivery
    - https://developer.android.com/guide/playcore/asset-delivery/integrate-java
    - https://developer.android.com/guide/app-bundle/asset-delivery/texture-compression
  snapshot_date: "2026-08-25"
  stability: stable
  version: 1.0.0
---

## When to use

Use Play Asset Delivery (PAD) when the *content* of a title dwarfs its code: level geometry, textures, audio banks, cinematics, on-device model weights. PAD lets Play host that content as versioned **asset packs** alongside the app bundle, decide per pack whether it arrives with the install or later, and serve per-device texture variants — with no CDN of your own and no OBB expansion files. It is the asset-shaped sibling of Play Feature Delivery: feature modules carry code and resources, asset packs carry raw assets only. For overall bundle and download-size strategy, `app-bundles-size` is the home skill; this one goes deep on the pack mechanics and the runtime API.

## Core guidance

- **One Gradle module per pack.** Add each pack to `settings.gradle.kts`, apply `com.android.asset-pack` in the pack's own `build.gradle.kts`, and list the packs from the app module. Assets live in `<pack>/src/main/assets/`; AGP generates the pack manifest for you. Pack names must start with a letter and contain only letters, digits, and underscores.
- **Choose the delivery mode by when the asset is first needed**, not by how big it is:
  - `install-time` — served as split APKs, guaranteed present at first launch, **counts toward the app size shown on Play**, and cannot be removed by the player. Installation needs roughly twice the pack size in free space.
  - `fast-follow` — downloads automatically right after install without the player opening the app, delivered as archives expanded into internal storage, and excluded from the listed app size.
  - `on-demand` — fetched while the app runs. The only mode instant apps support.
- **Access differs by mode, so route through the right API.** Install-time packs are ordinary assets: read them with the platform `AssetManager` (`context.assets.open(...)`) and skip the PAD library entirely. Fast-follow and on-demand packs must be located through `AssetPackManager` — never hardcode a filesystem path.
- **Resolve pack location every launch.** `getPackLocation(name)` returns `null` when the pack is absent or unavailable, and a previously valid location can be invalidated by an app update. Treat downloaded packs as a cache you re-verify, not a fact you persist.
- **Disclose the size before fetching.** Call `getPackStates`/`requestPackStates` first, read `totalBytesToDownload()`, show it, then `fetch(listOf(name))` (or the suspend `requestFetch`). Track progress by registering an `AssetPackStateUpdateListener` and switching on `status()`: `PENDING`, `DOWNLOADING`, `TRANSFERRING`, `COMPLETED`, `FAILED`, `CANCELED`, `WAITING_FOR_WIFI`, `REQUIRES_USER_CONFIRMATION`, `NOT_INSTALLED`, `UNKNOWN`.
- **Handle the two consent states or downloads silently stall.** Anything over **200 MB** on a metered connection parks in `WAITING_FOR_WIFI`; a sideloaded or unrecognised install surfaces `REQUIRES_USER_CONFIRMATION`. Both are cleared by `showConfirmationDialog(activityResultLauncher)` — without that call the download simply waits forever.
- **Unregister listeners** in the matching lifecycle callback (`unregisterListener`, or `clearListeners()`); an Activity-scoped lambda held by `AssetPackManager` leaks the Activity.
- **Reclaim space deliberately** with `removePack(name)` / `requestRemovePack(name)` once a chapter or season is finished. Install-time packs cannot be removed.
- **Target texture compression formats (TCF)** instead of shipping the widest-support format to every device. Give each variant its own sibling directory named with the format suffix — `assets/textures` (default), `assets/textures#tcf_astc`, `assets/textures#tcf_etc2`, and so on — and enable texture splits in the bundle config. Play selects by GL capability in priority order (`astc`, `pvrtc`, `s3tc`, `dxt1`, `latc`, `atc`, `3dc`, `etc2`, `etc1`, `paletted`) and falls back to the unsuffixed default when none match. ASTC covers over 80 % of Play devices and ETC2 over 95 %, which makes ETC2 the sane default directory; `s3tc`/`dxt1` are what desktop GPUs report under Google Play Games on PC. Turn on suffix stripping so runtime paths stay format-agnostic.
- **Test locally with bundletool, then for real through Play.** `bundletool build-apks --bundle=app-release.aab --output=app.apks --local-testing` followed by `bundletool install-apks --apks=app.apks` installs packs from external storage; uninstall previous builds first, because local testing does not support updates. Before release, upload the bundle and install it through **internal app sharing** or an internal test track to exercise genuine Play download scheduling.
- **Know the Play ceilings** (per the published size limits): 500 MB per base or feature module, **1.5 GB per asset pack**, **4 GB** for all modules plus install-time packs combined, **30 GB** across fast-follow and on-demand packs, and **34 GB** total compressed download. With TCF these download limits apply *separately per texture format*, which is what makes multi-format targeting affordable.

```kotlin
// levelpack/build.gradle.kts
plugins { id("com.android.asset-pack") }

assetPack {
    packName.set("level_pack_2")
    dynamicDelivery { deliveryType.set("on-demand") }   // or "install-time" / "fast-follow"
}

// app/build.gradle.kts
android { assetPacks += listOf(":levelpack") }
```

```kotlin
// Fetch on demand, then read from the pack's assets directory.
private suspend fun assetsRootFor(packName: String): String? {
    val manager = AssetPackManagerFactory.getInstance(context)
    manager.getPackLocation(packName)?.let { return it.assetsPath() }   // already on device

    val states = manager.requestPackStates(listOf(packName))
    val bytes = states.packStates()[packName]?.totalBytesToDownload() ?: return null
    if (!confirmDownloadWithPlayer(bytes)) return null                 // disclose before fetching

    manager.requestFetch(listOf(packName))                             // progress via a listener
    return manager.getPackLocation(packName)?.assetsPath()
}
```

## Platform notes

- **Libraries:** `com.google.android.play:asset-delivery:2.3.0` for the `Task`-based surface, `com.google.android.play:asset-delivery-ktx:2.3.0` for the `suspend` variants (`requestFetch`, `requestPackStates`, `requestRemovePack`). Both superseded the retired monolithic `com.google.android.play:core` artifact.
- PAD is an app-bundle feature delivered by Play. Builds installed from another store, a sideload, or CI will not receive fast-follow or on-demand packs — keep a code path that fails gracefully or bundles a reduced asset set.
- Asset packs hold **assets only**: no Dalvik code, no `res/`, nothing addressable through `R`. Anything needing a resource ID belongs in a dynamic feature module instead.
- Apps above 200 MB use PAD rather than the legacy OBB expansion files; expansion files are not an option for new bundles.
- Update behaviour differs by mode. Install-time packs ride the app update. Fast-follow and on-demand packs are invalidated on update and patched afterwards, so the app can legitimately launch with its packs mid-update — render an "assets updating" state instead of crashing on a missing file.
- Texture format targeting and asset packs compose: a single pack can carry every `tcf_` variant, and Play splits it per device at serve time.

## Pitfalls

- **Assuming `getPackLocation()` is non-null** because the pack downloaded last session. Re-check on every launch and be ready to re-fetch.
- **Calling `fetch()` without surfacing the size first.** Play's policy expects the download size to be disclosed, and players cancel installs that start a silent multi-gigabyte transfer.
- **Ignoring `WAITING_FOR_WIFI` and `REQUIRES_USER_CONFIRMATION`.** These are not errors and produce no failure callback; the download just never progresses until you show the confirmation dialog.
- **Leaking an Activity through a registered `AssetPackStateUpdateListener`** that is never unregistered.
- **Omitting the unsuffixed default texture directory.** A device that supports none of the listed formats then has no installable variant and the app becomes unavailable to it.
- **Baking `tcf_` suffixes into runtime asset paths** instead of enabling suffix stripping — the installed pack has the suffix removed, so the lookups miss.
- **Overloading install-time packs.** Every megabyte there inflates the Play-listed size and demands roughly double that in free space at install; move anything not needed in the first session to fast-follow.
- **Shipping after only `--local-testing` validation.** Local testing serves packs from external storage, makes fast-follow behave like on-demand, does not support updates, and cannot exercise network failures or the wait-for-Wi-Fi path.
- **Treating pack contents as permanent storage.** Packs can be removed under storage pressure or invalidated by an update; never write player data into a pack directory.

## References

- **Documentation:** [Play Asset Delivery overview](https://developer.android.com/guide/playcore/asset-delivery)
- **Documentation:** [Integrate asset delivery (Kotlin and Java)](https://developer.android.com/guide/playcore/asset-delivery/integrate-java)
- **Documentation:** [Texture compression format targeting](https://developer.android.com/guide/app-bundle/asset-delivery/texture-compression)
- **Documentation:** [Test Play Asset Delivery](https://developer.android.com/guide/playcore/asset-delivery/test)
- **API reference:** [AssetPackManager](https://developer.android.com/reference/com/google/android/play/core/assetpacks/AssetPackManager)
- **Support:** [Google Play maximum size limits](https://support.google.com/googleplay/android-developer/answer/9859372)

## See also

Pair with `app-bundles-size`, which owns overall AAB structure, split configuration, R8 shrinking, and download-size measurement — this skill assumes those decisions are made and drills into pack mechanics. See `play-console-publishing` for the release track and internal app sharing steps that make packs testable, `play-games-services` for the social layer of the same game (and the Google Play Games on PC surface that consumes `s3tc`/`dxt1` textures), and `kotlin-coroutines` for structuring the suspend download flow.
