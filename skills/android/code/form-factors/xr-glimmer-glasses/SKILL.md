---
name: xr-glimmer-glasses
description: Covers building for Android XR glasses with Jetpack Compose and the Glimmer display model — lightweight glanceable surfaces, constrained rendering budgets, audio and voice interaction, and hands-free UX patterns for AI/display glasses. Use when targeting XR glasses hardware with Jetpack XR SDK, authoring Glimmer panels, designing hands-free or audio-first flows, or adapting existing Compose UI for a constrained, head-worn display.
globs:
  - "**/*.kt"
tags: [xr, glasses, glimmer, jetpack-xr, hands-free]
x-skills-master:
  domain: android
  class: code
  category: form-factors
  platforms: ["xr", "glasses"]
  requires: {android: "16", kotlin: "2.2", xr-compose: "1.0"}
  pairs_with: [m3-ai-glasses]
  sources:
    - https://developer.android.com/develop/xr
    - https://developer.android.com/develop/xr/jetpack-xr-sdk
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill when building apps or features that run on Android XR glasses — wearable head-mounted displays that project lightweight UI into the user's field of view. It covers the Glimmer rendering model (spatially anchored, low-footprint panels), the hands-free interaction vocabulary (voice commands, head gestures, companion-phone delegation), and the constraints that separate glasses from phone or headset XR. It does not cover immersive VR/MR experiences on full headsets; for those, start with the broader Jetpack XR SDK guidance.

## Core guidance

**Understand the Glimmer display model**

- Glimmer panels are spatially anchored Compose surfaces projected into the user's field of view. They are intentionally small — treat them as high-density glances, not full screens. A panel that would be comfortable on a phone will feel overwhelming on glasses.
- Each panel occupies a `GlimmerPanel` anchor in world space. Position panels so they sit comfortably at a natural gaze angle — centered slightly below the horizon line, never at the periphery where the user must move their head to read it.
- Panels support a small subset of Material 3 components: text, icons, progress indicators, and compact chips. Avoid anything that requires precise pointer interaction (sliders, text fields, drag handles) — there is no touch surface on glasses.
- Keep content density low. Two to four lines of text, one or two action chips, and a status icon is a generous panel. Design for a 250–400 ms comprehension window.

**Session lifecycle and panel management**

- Obtain the `XrSession` from `XrSession.create(context)` inside a `lifecycleScope.launch` block, guarded by `Session.State.READY`. Panels must not be created until the session is ready.
- Create panels with `session.createGlimmerPanel(config)`. Panels have their own composable content scope — pass a `setContent { }` lambda that hosts your `@Composable` tree.
- Destroy panels in `onStop` or when the feature they represent is dismissed. Leaked panels accumulate in the user's field of view across app restarts.
- When the session moves to `PAUSED` or `STOPPED`, release any panel references and cancel spatial anchors; re-acquire them when the session returns to `READY`.

**Audio and voice interaction**

- Voice is the primary input on glasses. Wire `SpeechRecognizer` or the higher-level `VoiceInteractionSession` API to drive state changes, and reflect confirmations in the Glimmer panel immediately (optimistic update, then correct on error).
- Audio feedback replaces tap feedback. Use short synthesized tones via `AudioManager` or `SoundPool` — avoid `Vibrator`, which is absent on most glasses hardware.
- Keep voice prompts short and non-blocking. Emit synthesized speech with `TextToSpeech` at rate 1.1–1.2× (slightly faster than natural) because glasses contexts are often noisy and time-compressed.
- Do not rely on voice as the only feedback channel. Show a brief text confirmation in the panel for accessibility and noisy environments where audio is masked.

**Hands-free interaction patterns**

- Head-gaze dwell: detect when the user holds their gaze on an action chip for a configurable threshold (typically 1.5–2 s) and trigger the action. Use `GlimmerPanel`'s focus/hover callbacks rather than building custom timers.
- Companion delegation: for complex input (search queries, settings changes), launch the companion phone flow with a deep link via `Intent.ACTION_VIEW` plus a custom scheme. The glasses panel shows a "Sent to phone" confirmation and polls for a result broadcast.
- Physical button: most glasses expose one or two hardware buttons. Register a `KeyEvent.KEYCODE_STEM_PRIMARY` listener in `onKeyDown` on the hosting `Activity` to handle confirm/dismiss without voice.

**Compose in a Glimmer panel**

- The panel's composable tree runs on the standard Compose main thread — `remember`, `LaunchedEffect`, `StateFlow` collection, and `collectAsStateWithLifecycle` all work normally.
- Restrict imports to non-touch Material 3 components. Avoid `TextField`, `DropdownMenu`, `Slider`, `DatePicker`, and any component whose interaction model assumes pointer precision.
- Use `LocalDensity` and `LocalConfiguration` to read the panel's reported size in dp; panels may be smaller than the smallest phone screen, so never hard-code widths wider than 200 dp.
- Wrap root panel content in `XrMaterialTheme` (the XR-flavored Material 3 token set) rather than plain `MaterialTheme` so color and shape tokens map correctly to the transparent display surface.

```kotlin
// Minimal Glimmer panel: session setup + stateful content
class GlassesFeatureManager(private val context: Context, private val scope: CoroutineScope) {

    private var session: XrSession? = null
    private var panel: GlimmerPanel? = null

    fun start() {
        scope.launch {
            val s = XrSession.create(context)
            s.state.collect { state ->
                if (state == XrSession.State.READY && panel == null) {
                    panel = s.createGlimmerPanel(
                        GlimmerPanelConfig(
                            widthDp = 180,
                            heightDp = 120,
                            anchor = GlimmerAnchor.HeadLocked(pitchDeg = -10f)
                        )
                    ).also { p ->
                        p.setContent {
                            XrMaterialTheme {
                                StatusPanel(
                                    onDismiss = { scope.launch { p.destroy() } }
                                )
                            }
                        }
                    }
                    session = s
                }
            }
        }
    }

    fun stop() {
        panel?.destroy()
        panel = null
        session?.close()
        session = null
    }
}

@Composable
private fun StatusPanel(onDismiss: () -> Unit) {
    val message by produceState(initialValue = "Ready") {
        // collect from your domain state here
    }
    Column(
        modifier = Modifier.padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(message, style = MaterialTheme.typography.labelLarge, maxLines = 2)
        AssistChip(onClick = onDismiss, label = { Text("Dismiss") })
    }
}
```

## Platform notes

- Android XR glasses require API level 16 as the minimum compile target but surface a glasses-specific runtime ABI; always gate feature availability with `PackageManager.FEATURE_XR_GLASSES` before attempting `XrSession.create`.
- The Jetpack XR SDK (`xr-compose:1.0`) ships outside the Compose BOM — declare it explicitly in your version catalog and keep it aligned with the XR SDK bill of materials.
- Glasses run a power-constrained SoC. Avoid continuous `Canvas` redraws, animated shimmers, or `LazyColumn` with many items — keep the composable tree shallow and content static unless an explicit user event drives an update.
- Location and sensor APIs (GPS, barometer, camera) behave identically to phone APIs at the Kotlin level, but battery impact is amplified on glasses. Batch sensor reads and coalesce updates to 1 Hz or lower for ambient-awareness data.
- Multi-panel layouts (showing more than one `GlimmerPanel` simultaneously) are supported but should be used sparingly. More than two simultaneous panels cause visual clutter; dismiss lower-priority panels before presenting new ones.
- Not all glasses support hand-tracking or eye-tracking APIs. Query `session.capabilities` at runtime; fall back to dwell-gaze or button input when these capabilities are absent.

## Pitfalls

- Creating a panel before `XrSession.State.READY` — the call throws `IllegalStateException`. Always gate on state collection.
- Forgetting to destroy panels on `onStop` — panels remain visible in world space even after the Activity is backgrounded, confusing the user and leaking resources.
- Using `LocalContext.current` inside a `GlimmerPanel` `setContent` block without verifying it returns the correct context — prefer passing the `Application` context explicitly to avoid lifecycle mismatches.
- Sizing panel content to phone dimensions — 300–400 dp wide layouts overflow the panel bounds and are clipped without warning. Design at 180×120 dp as a safe default.
- Relying solely on `TextToSpeech` for confirmations — TTS initialization is asynchronous; always set an `OnInitListener` and queue utterances only after `SUCCESS` is reported, otherwise the first message is silently dropped.
- Combining `SpeechRecognizer` with a persistent voice listener in the foreground without a foreground service — the system will kill the recognizer session when the app is backgrounded. Use a foreground service with `FOREGROUND_SERVICE_TYPE_MICROPHONE` for always-on voice.
- Hard-coding `KeyEvent.KEYCODE_STEM_PRIMARY` handling without also supporting the voice path — not all glasses models expose a hardware button; both input paths must work independently.

## References

- **Documentation:** [Android XR overview](https://developer.android.com/develop/xr)
- **Documentation:** [Jetpack XR SDK](https://developer.android.com/develop/xr/jetpack-xr-sdk)

## See also

For the Material 3 design tokens and visual guidelines specific to display glasses, pair with the `m3-ai-glasses` design skill. For voice and speech recognition APIs used to drive hands-free flows, see the `speech` skill. For foreground service setup required by persistent microphone access, see `foreground-services`. For adapting standard Compose layouts to constrained panel sizes, see `compose-layout` and `compose-window-insets`. For managing XR session state with Kotlin coroutines, see `swift-concurrency`'s Android analog in `compose-side-effects`.
