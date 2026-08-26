---
name: xr-glimmer-glasses
description: Covers building for Android XR glasses with Jetpack Compose Glimmer — the Compose UI toolkit for display glasses — plus Jetpack Projected lifecycle, audio and voice interaction, and hands-free UX patterns for AI/display glasses. Use when targeting XR glasses hardware with the Jetpack XR SDK, authoring Glimmer UI, designing hands-free or audio-first flows, or adapting existing Compose UI for a constrained, head-worn display.
---

## When to use

Use this skill when building apps or features that run on Android XR glasses — audio glasses (voice-only) and display glasses (voice plus a small see-through display). It covers Jetpack Compose Glimmer, the Compose-based UI toolkit for display glasses, and Jetpack Projected, the library that launches and manages "projected" activities that run in your phone app but render and interact on the glasses. It does not cover immersive headset experiences with spatial panels; for headsets and wired XR glasses, use `xr-compose-spatial` instead.

## Core guidance

**Two libraries, one activity**

- Glimmer (`androidx.xr.glimmer:glimmer`) is the UI toolkit: composables, a theme, and interaction behaviors designed for tiny, glanceable, optical see-through displays. It builds on standard Jetpack Compose — `remember`, `LaunchedEffect`, state collection all work normally — but its components replace Material 3, not wrap it.
- Jetpack Projected (`androidx.xr.projected:projected`) is the lifecycle layer: it declares which activity can be projected to glasses, launches it there, exposes device capabilities and connection state, and routes hardware access (camera, sensors, audio, microphone) to the glasses.
- Build **one** projected activity that adapts at runtime, rather than separate activities per glasses type. Audio glasses drive the experience through speech; display glasses add Glimmer UI on top of the same flow.

**Set up the projected activity**

- Dependencies (alpha/beta as of August 2026): `androidx.xr.glimmer:glimmer`, `androidx.xr.glimmer:glimmer-google-fonts` (for the Google Sans Flex typography factory), `androidx.xr.projected:projected`, and `androidx.xr.runtime:runtime`; add `androidx.xr.arcore:arcore` only if you need perception.
- The activity is a plain `ComponentActivity`. Projected APIs are experimental — opt in with `@OptIn(ExperimentalProjectedApi::class)`.
- Mark the activity as projected in the manifest and make it discoverable from the glasses launcher and Gemini voice invocation:

```xml
<activity
    android:name=".GlassesActivity"
    android:exported="true"
    android:requiredDisplayCategory="android.hardware.display.category.XR_PROJECTED">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.XR_PROJECTED_LAUNCHER" />
    </intent-filter>
</activity>
```

- To start the activity on the glasses from your phone app, launch it with the options bundle from `ProjectedContext.createProjectedActivityOptions(context)`; check `ProjectedContext` connection state (`isProjectedDeviceConnected`) first and fall back to the phone UI when no glasses are attached.
- Do setup in `onCreate` and release projected resources with a lifecycle observer — in particular, close any `ProjectedDisplayController` you created (`ProjectedDisplayController.create(activity)`) when the activity is destroyed.

**Glimmer theme and components**

- Wrap the content tree in `GlimmerTheme` (package `androidx.xr.glimmer`), not `MaterialTheme`. The theme carries a deliberately small color set, typography, shapes, and component spacing values tuned for legibility on a see-through display worn all day.
- Use the Google Sans Flex typography from `glimmer-google-fonts` (`createGoogleSansFlexTypography()`) — the typeface the toolkit adopted for legibility on optical see-through displays.
- The component roster is intentionally compact: `Text`, `Icon`, `Button`, `IconButton`, `ToggleButton`, `IconToggleButton`, `ButtonGroup`, `TitleChip`, `Card`, `Surface`, lazy lists with `ListItem`, `VerticalStack`, `GlimmerHorizontalPager`, and `VoiceInputIndicator`. There are no text fields, sliders, or pickers — glasses have no precise pointer; delegate that input to voice or the phone.
- Hierarchy is expressed with **depth**, not shadows or tonal elevation: components that sit above others render with a depth effect. For custom components, build on `Surface` or `Modifier.surface()` and its depth-effect parameter rather than re-implementing backgrounds.
- Interaction feedback is **focus-based**: components show a focus outline instead of ripples, and there is no overscroll effect. Since 1.0.0-alpha13, `Modifier.surface()` is purely visual — add `focusable`/`clickable` modifiers yourself on custom interactive elements.

**Lists, stacks, and pagers**

- Prefer one-item-at-a-time containers over long scrollable lists; input is a glasses touchpad (tap and swipe) or an indirect pointer, not a touch screen.
- `VerticalStack` (package `androidx.xr.glimmer.stack`) presents a lazy sequence of items with the current item in the foreground and later items layered behind it on the z-axis; swipes snap-animate the next item forward and focus follows the foreground item automatically. Use it for card-by-card flows.
- `GlimmerHorizontalPager` pages horizontally between full-content pages; pair it with the page indicator API so users can tell where they are.
- `TitleChip` labels a content card with its category or context — use it instead of hand-rolled header rows.
- List components carry a `GlimmerLazyList` naming prefix since alpha13; expect further renames while the library is in alpha.

```kotlin
// Projected activity hosting Glimmer UI on display glasses
@OptIn(ExperimentalProjectedApi::class)
class GlassesActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            GlimmerTheme {
                OrderStatusFlow(onDone = { finish() })
            }
        }
    }
}

@Composable
private fun OrderStatusFlow(onDone: () -> Unit) {
    VerticalStack {
        item {
            Card {
                Text("Courier is 5 minutes away")
            }
        }
        item {
            Card {
                Button(onClick = onDone) { Text("Done") }
            }
        }
    }
}
```

**Capabilities: audio glasses vs display glasses**

- Gate every visual feature on the device actually having a display. Query capabilities at runtime via `ProjectedDeviceController` and check for `CAPABILITY_VISUAL_UI`; on audio-only glasses, drive the same flow entirely with speech.

```kotlin
lifecycleScope.launch {
    val device = ProjectedDeviceController.create(this@GlassesActivity)
    val hasDisplay = device.capabilities.contains(CAPABILITY_VISUAL_UI)
    // hasDisplay == false: audio glasses — run the voice-only path
}
```

- Hardware APIs are device-aware in a projected context: `CameraManager`, `SensorManager`, `AudioManager`, and `AudioRecord` resolve to the glasses hardware. Projected activities already run with a projected context; a phone-side service that needs glasses hardware must obtain one explicitly (`createProjectedDeviceContext`).
- Request glasses hardware permissions through `ProjectedPermissionsResultContract` with `ProjectedPermissionsRequestParams` (permissions plus a user-facing rationale) — not the plain phone permission launcher — so the consent flow renders correctly for the head-worn context.

**Audio and voice interaction**

- Voice is the primary input on all glasses types. The documented input stack is automatic speech recognition (ASR) for commands and dictation, text-to-speech for spoken output, and Gemini Live API integration for conversational experiences.
- On display glasses, reflect the listening state visually with `VoiceInputIndicator` and confirm actions with a short line of `Text` — never rely on audio as the only feedback channel in noisy environments.
- Keep spoken prompts short and non-blocking, and keep the voice path fully functional even when the display path exists: users of display glasses still complete many interactions eyes-free.
- For complex input (long text, credentials, multi-step configuration), delegate to the phone app and show a brief handoff confirmation on the glasses.

### Android 17 era (2026)

- Developer Preview 4 (mid-2026) rounded out Glimmer with Google Sans Flex as the toolkit typeface, Stacks (touchpad-friendly groups presenting one item at a time), and Title Chips (category/context labels for content cards) — the components covered above. Prefer them over hand-rolled equivalents.
- DP4 also added Jetpack Projected's Device Availability API, which folds glasses wear state and connectivity into standard `Lifecycle.State` values, and `ProjectedTestRule` for test-environment setup.
- In August 2026 the XR Runtime, SceneCore, and ARCore for Jetpack XR reached 1.0.0-beta02, while Glimmer remains alpha (1.0.0-alpha17) — expect API renames between alphas, as with the `GlimmerLazyList` prefix change.

## Platform notes

- The whole glasses stack is a Developer Preview: Glimmer and Projected ship as alpha artifacts, and behavior can change between releases. Pin versions in your catalog and re-verify on each bump.
- Glimmer requires a recent toolchain — Compose `compileSdk` 37 and AGP 9.2.0 or newer as of alpha10.
- Your code runs on the **phone**; the glasses are a projected display and input surface. Design for the added latency and for connection loss — the DP4 Device Availability API is the signal to pause or resume the experience when glasses are taken off or disconnect.
- Glimmer components handle tap and swipe from the glasses touchpad by default; indirect pointer input has its own handling guidance in the Glimmer docs and is worth testing explicitly.
- Test without hardware using the glasses AVDs in Android Studio, and preview Glimmer UI with regular composable previews.
- Displays are small, monocular-adjacent, and additive: keep content density low (a short line or two of text and one action is a generous screen), keep the composable tree shallow, and avoid continuous animation that burns the constrained power budget.

## Pitfalls

- Wrapping glasses UI in `MaterialTheme` and Material 3 components instead of `GlimmerTheme` and Glimmer components — Glimmer is a separate toolkit with its own theme, focus feedback, and depth model, not an M3 skin.
- Omitting `android:requiredDisplayCategory="android.hardware.display.category.XR_PROJECTED"` or the `XR_PROJECTED_LAUNCHER` intent-filter category — the activity will not be treated as projected or discoverable from the glasses launcher and Gemini.
- Starting the projected activity with a plain `startActivity(intent)` and no options bundle from `ProjectedContext.createProjectedActivityOptions` — it will not land on the glasses display.
- Assuming a display exists. Audio glasses report no `CAPABILITY_VISUAL_UI`; a flow that only works visually is broken on half the device class. Gate visuals on capabilities and keep the voice path complete.
- Treating `Modifier.surface()` as interactive — since alpha13 it only draws; forgetting `focusable`/`clickable` on custom components leaves them unreachable from the touchpad.
- Requesting camera or microphone permission with the standard phone contract instead of `ProjectedPermissionsResultContract` — the glasses-aware consent flow (with rationale) is bypassed.
- Leaking a `ProjectedDisplayController` — create it once and close it when the activity is destroyed.
- Porting a phone screen's density: long `LazyColumn`-style lists and dense layouts overwhelm the display. Restructure into a `VerticalStack` or pager showing one item at a time.
- Hard-coding against alpha API names without expecting churn — the list components were renamed wholesale in alpha13, and more renames are likely before beta.

## References

- **Documentation:** [Build UI for display glasses with Jetpack Compose Glimmer](https://developer.android.com/develop/xr/jetpack-xr-sdk/jetpack-compose-glimmer)
- **Documentation:** [Create your first activity for audio and display glasses](https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/first-activity)
- **Release notes:** [Jetpack Compose Glimmer releases (androidx.xr.glimmer)](https://developer.android.com/jetpack/androidx/releases/xr-glimmer)
- **Blog:** [Android XR SDK Developer Preview 4](https://android-developers.googleblog.com/2026/05/android-xr-sdk-developer-preview-4-updates.html)
- **Documentation:** [Android XR overview](https://developer.android.com/develop/xr)

## See also

For the design language of display glasses — Glimmer's visual foundations, depth scale, and content guidelines — pair with the `m3-ai-glasses` design skill. For headsets and wired XR glasses with spatial panels, see `xr-compose-spatial`. For foreground service setup required by persistent phone-side microphone access, see `foreground-services`. For adapting standard Compose layouts to constrained sizes, see `compose-layout` and `compose-window-insets`. For coroutine-driven state in the projected activity, see `compose-side-effects`.
