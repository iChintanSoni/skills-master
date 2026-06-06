---
name: xr-arcore
description: Covers ARCore perception for Jetpack XR — planes, anchors, hit testing, and hand tracking — plus the XR permission model and anchoring virtual Compose content to the real world. Use when building Android XR apps that need to detect real-world surfaces, place persistent virtual objects, or read hand-joint poses.
globs:
  - "**/*.kt"
tags: [xr, arcore, anchors, spatial-computing, hand-tracking]
x-skills-master:
  domain: android
  class: code
  category: form-factors
  platforms: ["xr"]
  requires: {android: "16", kotlin: "2.2", xr-compose: "1.0"}
  pairs_with: []
  sources:
    - https://developer.android.com/develop/xr/jetpack-xr-sdk/arcore
    - https://developer.android.com/develop/xr/jetpack-xr-sdk
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

Use this skill whenever an Android XR app needs to perceive and interact with the physical world. Concrete scenarios include: detecting floor, wall, or ceiling planes and snapping content to them; hit-testing a ray from the user's gaze or controller into real geometry; creating persistent anchors so virtual objects survive head movement; and reading hand-joint positions to drive gestures or pointer interactions. This skill assumes you already have a Jetpack XR session established — see the XR session lifecycle guidance before consulting this document.

## Core guidance

### Gradle setup

- Add the ARCore for XR artifact alongside the core XR Compose dependency. Both live under `androidx.xr`:

```kotlin
dependencies {
    implementation("androidx.xr.compose:compose:1.0.0")
    implementation("androidx.xr.arcore:arcore:1.0.0")
}
```

- Keep ARCore for XR separate from the classic ARCore SDK (`com.google.ar:core`). They share perception concepts but have distinct APIs; mixing them in one module causes class conflicts.

### Permissions

- Declare `android.permission.CAMERA` in the manifest — ARCore requires camera frames to run plane detection and hit testing.
- On Android XR, `SCENE_UNDERSTANDING` may also be required to access plane and mesh data; check the manifest requirements for your headset target.
- Request permissions at the point of need using `rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission())` in your Compose entry point; never request on launch before the user understands why.
- If the permission is denied, disable perception features gracefully and surface a rationale rather than silently failing or crashing.

### Session and perception lifecycle

- Obtain the `Session` from `SessionHelper` (or the XR Activity's `xrSession` extension). The `Session` object owns all ARCore state; never cache it beyond the XR lifecycle scope.
- ARCore perception is CPU-intensive. Enable only the tracking modes your feature needs:
  - Plane detection: `session.configure(SessionConfig(planeDetection = PlaneDetectionMode.HORIZONTAL_AND_VERTICAL))`
  - Hand tracking does not require explicit config; it is on by default when the device supports it.
- Pause and resume the session in lock-step with the XR activity's `onPause`/`onResume` to avoid resource leaks and undefined tracking state.

### Plane detection

- Planes are surfaced via `session.getUpdatedPlanes()` on each frame update inside an `XrCoreScope` or a `LaunchedEffect` tied to the frame loop.
- Filter by `Plane.Type`: `HORIZONTAL_UPWARD_FACING` for floors/tables, `HORIZONTAL_DOWNWARD_FACING` for ceilings, `VERTICAL` for walls.
- Planes merge over time as ARCore refines its model; always use the latest `Plane` reference rather than caching geometry from a prior frame.
- A plane is only actionable when its `trackingState` is `TrackingState.TRACKING`. Planes in `PAUSED` or `STOPPED` states have unreliable poses — do not place content on them.

### Hit testing

- Issue a hit test from a screen-space ray using `session.hitTest(ray)`. The most common source for `ray` is the controller or gaze ray provided by the XR input system.
- Iterate the returned `List<HitResult>` and pick the first result whose `trackable` is a `Plane` (or `Mesh` if you need mesh-level precision). Closer results appear first.
- Do not issue hit tests every frame unless your UX needs real-time cursor snapping. For tap-to-place interactions, hit-test only on a confirmed tap event.

### Anchors and spatial persistence

- Create an anchor from a `HitResult`: `val anchor = hitResult.createAnchor()`. The anchor pose updates each frame as ARCore refines the scene.
- Anchor an `Entity` in Compose XR by placing it inside a `SpatialAnchor` composable with the anchor reference:

```kotlin
// Minimal tap-to-place pattern
@Composable
fun TapToPlaceScene(session: Session) {
    var anchor by remember { mutableStateOf<Anchor?>(null) }

    // Frame loop — collect hit results on tap
    val pointerInput = Modifier.pointerInput(Unit) {
        detectTapGestures { offset ->
            val ray = session.calculateRayFromScreenPoint(offset.x, offset.y)
            val hit = session.hitTest(ray)
                .firstOrNull { it.trackable is Plane }
            anchor?.detach()
            anchor = hit?.createAnchor()
        }
    }

    Subspace {
        // Anchor the virtual panel to the real-world hit point
        anchor?.let { a ->
            SpatialPanel(
                SubspaceModifier.anchor(a)
            ) {
                Box(
                    modifier = Modifier.size(300.dp, 200.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Placed in the world")
                }
            }
        }

        // Invisible overlay captures taps
        SpatialPanel(SubspaceModifier.fillMaxWidth()) {
            Box(modifier = pointerInput.fillMaxSize())
        }
    }
}
```

- Call `anchor.detach()` when the anchor is no longer needed to release ARCore resources. Leaking anchors degrades tracking performance.
- For persistent anchors that survive app restarts, use the Cloud Anchors API (`session.hostCloudAnchorAsync`) after obtaining camera permission and verifying Cloud Anchor availability.

### Hand tracking

- Access hand data via `session.getUpdatedHands()`, which returns up to two `Hand` objects (`.LEFT` and `.RIGHT`).
- Each `Hand` exposes `joints: Map<HandJoint, HandJointState>`. Check `joint.trackingState == TrackingState.TRACKING` before reading `joint.pose`.
- Common joints for pinch detection: `HandJoint.INDEX_FINGER_TIP` and `HandJoint.THUMB_TIP`. Compute distance between their poses to classify a pinch.
- Hand tracking is best-effort and degrades in poor lighting or when hands are partially occluded. Always provide a non-hand fallback interaction path (controller, gaze + dwell) so the app remains accessible.

### Frame update pattern

- Collect per-frame ARCore data inside a `LaunchedEffect` or a `produceState` that observes the XR session frame callback to stay on the correct dispatcher:

```kotlin
val planes by produceState(emptyList<Plane>()) {
    session.frameFlow().collect { frame ->
        value = frame.getUpdatedPlanes()
            .filter { it.trackingState == TrackingState.TRACKING }
    }
}
```

- Keep frame-callback work minimal. Heavy computation (mesh booleans, ML inference) should be dispatched to `Dispatchers.Default` and results posted back to the UI state.

## Platform notes

- ARCore for XR runs only on Android XR headsets; it is not available on phones or tablets. Guard feature entry points with `Session.isSupported(context)` and degrade gracefully on unsupported hardware.
- Plane detection accuracy depends on scene texture and lighting. Uniform surfaces (white walls, glass) may never produce a stable plane; design UX accordingly with fallback manual placement.
- The coordinate system is right-handed, Y-up, origin at the device's initial head pose. All poses returned by ARCore (anchors, planes, joints) are in this world coordinate system unless explicitly noted otherwise.
- Cloud Anchors require a Google account and an API key configured in the manifest; they also require an active internet connection at hosting time. Resolve does not require a connection if the anchor map is cached locally.
- On hand-tracking–capable XR devices, the system may switch between controller and hand input dynamically. Subscribe to `InputDevice` change events so your hit-test source stays current.

## Pitfalls

- Caching a `Plane` reference across frames and reading its geometry later. Plane geometry is only valid for the frame it was obtained from; re-query on the next frame update.
- Forgetting to call `anchor.detach()` when removing a placed object. ARCore tracks every live anchor continuously, even off-screen, which wastes CPU and degrades overall tracking quality.
- Creating anchors at `TrackingState.PAUSED` poses. A paused plane's pose has not been updated; an anchor placed there can jump significantly when tracking resumes.
- Using the classic ARCore SDK (`com.google.ar:core`) APIs in an XR Compose project. The two SDKs are not interchangeable; ARCore for XR (`androidx.xr.arcore`) is the correct dependency.
- Performing synchronous hit tests or `getUpdatedPlanes()` calls on the main thread in a tight loop. Both calls are fast but must happen inside the frame callback; calling them outside that context returns stale or empty results.
- Requesting `CAMERA` permission inside a `LaunchedEffect` without first checking whether it is already granted, causing repeated permission dialogs on recomposition.
- Assuming hand-tracking is always available. Older or entry-level XR headsets may not have the required sensor hardware; `session.getUpdatedHands()` returns an empty list in that case.
- Not pausing the ARCore session in `Activity.onPause()`. Leaving the session running when the app is backgrounded drains the battery and can starve other foreground AR apps of camera access.

## References

- **ARCore for Jetpack XR guide:** https://developer.android.com/develop/xr/jetpack-xr-sdk/arcore
- **Jetpack XR SDK overview:** https://developer.android.com/develop/xr/jetpack-xr-sdk
- **TrackingState reference:** https://developers.google.com/ar/reference/java/com/google/ar/core/TrackingState

## See also

For establishing the XR session and managing its lifecycle, see the XR session and activity skill. For placing and sizing panels in 3D space with `SubspaceModifier`, see the spatial layout skill. For handling XR-specific input events beyond hit testing (gaze dwell, controller triggers), see the XR input skill. For integrating ML model inference on perception data (e.g. object classification from plane meshes), see `core-ml` patterns adapted for Android's ML Kit or TensorFlow Lite on-device inference.
