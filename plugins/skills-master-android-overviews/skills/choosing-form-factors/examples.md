## Scenario 1 — Social photo-sharing app, currently phone-only

**Context:** A photo-sharing app with 5 M monthly active users ships phone-only. A product review flags that 18% of sessions come from devices with screens wider than 600 dp (tablets and foldables). The team has two sprints to improve the large-screen experience before a Play Store featuring opportunity.

**Decision:**

The 18% session share is significant. Reach-to-effort strongly favours large-screen investment over any other form factor. The team has enough time to reach Tier 2.

Sprint 1 — Tier 1 compliance:
- Remove any `screenOrientation="portrait"` locks from the photo viewer and feed activities.
- Verify the app does not crash on fold/unfold using the resizable emulator.
- Add `fillMaxSize()` to top-level composables so they fill the available window.

Sprint 2 — Tier 2 optimisation:
- Replace the bottom navigation bar with `NavigationSuiteScaffold`; it will automatically switch to a navigation rail on medium/expanded windows.
- Wrap the feed-to-detail flow in `ListDetailPaneScaffold` so the photo detail opens in a side pane on tablets rather than pushing the full back stack.
- Test with `WindowSizeClass.COMPACT`, `.MEDIUM`, and `.EXPANDED` using Compose Previews and the resizable emulator.

Skip Wear OS, TV, Automotive, and XR this cycle. The per-user value on those surfaces does not justify the effort when large-screen reach is this high.

---

## Scenario 2 — Fitness coaching app evaluating Wear OS investment

**Context:** A fitness coaching app offers guided workout sessions, heart-rate zone tracking, and a daily move goal. It has a solid phone experience built on Compose. Leadership asks whether to build a Wear OS companion this year.

**Decision:**

The app's core loop (real-time heart rate, move goal glanceability, workout start/stop) maps directly to Wear OS strengths: quick interactions, sensor access, ambient display. Wear OS investment is justified.

What the Wear OS app should do:
- Show the current move-goal ring on the watch face complication.
- Allow starting/stopping a tracked workout without reaching for the phone.
- Display live heart-rate zone during an active workout.
- Sync workout summaries back to the phone module via Health Connect.

What it should not do:
- Replicate the full coaching video library (screen too small, no practical value).
- Share UI composables with the phone module (different component library — use `androidx.wear.compose`).

Module structure: Create a `wear` Gradle module. Share domain models (workout session data classes, move goal calculation logic) via a `shared` module. Use Health Connect as the data bridge for completed workouts. Do not use the Wearable Data Layer for large payloads; reserve it for lightweight real-time updates like current heart-rate zone.

Skip TV, Automotive, and XR. The coaching use case is not consumption-primary (TV) or vehicle-adjacent (Automotive), and XR is not mature enough for fitness at scale.

---

## Scenario 3 — Video streaming app deciding between TV and tablet

**Context:** A video streaming app has phone and tablet support. Two potential form factors are on the roadmap: Android TV and Automotive OS. Engineering capacity allows one in the next two quarters.

**Decision:**

Choose Android TV. The decision axes are:

**Reach:** Android TV / Google TV has ~150 M+ active devices; Automotive OS reaches ~30 M vehicles, a much smaller addressable market for streaming content.

**Effort:** Both require dedicated modules. TV development (Compose for TV) is a more mature path with better documentation and a larger developer community than Automotive. Automotive also requires passing Driver Distraction Guidelines review, which is a substantial compliance overhead for a streaming app (video playback while moving is restricted).

**Content licensing:** Widevine L1 must be verified for TV hardware, but this is a known path for streaming services. Automotive requires the same verification but with additional OEM coordination.

**Code sharing:** TV can share the content catalogue API client, recommendation logic, and playback session management from the phone module. Only the UI layer needs to be rebuilt with D-pad-first, focus-managed composables.

**Automotive recommendation:** Revisit after TV ships. If the app's catalogue includes audio (music, podcasts), Automotive is a natural next step using the Car App Library's media template — that template has significantly lower effort than building a full Automotive UI from scratch and handles DDJG compliance automatically.
