## Choosing Android Form Factors — Decision Checklist

Work through this list top-to-bottom before committing to a form-factor roadmap.

---

### Step 1 — Baseline: large-screen Tier 1 compliance

- [ ] The app does NOT lock orientation with `screenOrientation="portrait"` (or equivalent) for any activity that can support landscape.
- [ ] The app does NOT crash on fold/unfold when tested with the resizable emulator or a physical foldable.
- [ ] Top-level composables use `fillMaxSize()` so the UI fills the available window at any width.
- [ ] The app handles configuration changes (rotation, window resize) without data loss.

If any box is unchecked, fix Tier 1 compliance before evaluating other form factors. Shipping with Tier 1 failures causes Play Store ranking demotion on large-screen devices.

---

### Step 2 — Large-screen reach assessment

- [ ] Check Play Console's device-type breakdown: what percentage of active users are on devices with screen width > 600 dp?
- [ ] If that percentage is above 10%, plan a Tier 2 large-screen sprint before investing in any other form factor.
- [ ] If it is below 5% and the app's category does not attract tablet users (e.g., pure telephony, on-the-go scanning), document the decision to defer and reassess in 6 months.

---

### Step 3 — Large-screen Tier 2 readiness

- [ ] Navigation chrome adapts to window width: bottom bar on compact, rail on medium, drawer on expanded (use `NavigationSuiteScaffold`).
- [ ] Master-detail flows use `ListDetailPaneScaffold` rather than full-screen navigation pushes.
- [ ] `WindowSizeClass` (COMPACT / MEDIUM / EXPANDED) drives all layout branches; no hardcoded dp breakpoints.
- [ ] Foldable posture (`FoldingFeature`) is handled for any layout that benefits from tabletop or book mode (camera, reading, video call).
- [ ] Keyboard and external pointer device (trackpad, mouse) input does not produce incorrect or broken interactions.

---

### Step 4 — ChromeOS viability

- [ ] Is the app's primary use case knowledge work, content creation, or productivity? (If yes, ChromeOS users are likely to find the app valuable in a desktop window.)
- [ ] `android:resizeableActivity="true"` is set (default for targetSdk 24+, but verify).
- [ ] The app declares appropriate `configChanges` to handle window resize without process restart.
- [ ] Keyboard shortcuts for the most common actions are implemented via `KeyEvent`.
- [ ] Right-click / secondary pointer actions produce context menus where appropriate.

If Tier 2 large-screen support is complete, ChromeOS keyboard and pointer work is typically a single small workstream.

---

### Step 5 — Wear OS viability

- [ ] Does the app's primary use case include any of: health tracking, fitness coaching, quick glanceable data, or time-critical notifications?
- [ ] Can the core watch use case be completed in under 3 seconds of focused interaction?
- [ ] A `wear` Gradle module can be created without major shared-module restructuring.
- [ ] Data synchronisation uses Health Connect or the Wearable Data Layer (not direct database access across modules).
- [ ] The team has at least one developer who has reviewed the `androidx.wear.compose` component set and confirmed it covers the needed UI patterns.

If fewer than 3 boxes are checked, defer Wear OS until the phone app's core loop is stable.

---

### Step 6 — Android TV / Google TV viability

- [ ] The app's primary use case is content consumption: video, music, games, or fitness video.
- [ ] A `tv` Gradle module is feasible without blocking other work.
- [ ] All primary interactions can be accomplished with D-pad only (no touch required).
- [ ] The content catalogue supports Widevine L1 DRM requirements for TV hardware (if applicable).
- [ ] The team has reviewed Compose for TV (`androidx.tv:tv-compose`) focus management APIs.

If the primary use case is not consumption-oriented, skip TV.

---

### Step 7 — Automotive OS viability

- [ ] The app's use case is directly travel- or vehicle-adjacent (navigation, parking, EV charging, media, communication).
- [ ] The team has reviewed the Driver Distraction Guidelines (DDJG) and confirmed the app's interactions comply.
- [ ] The Car App Library media/navigation/POI template covers the needed functionality, OR the team can commit to a full Automotive OS module with dedicated design resources.
- [ ] Play for Cars distribution requirements are understood and the app's content policy is compatible.

If fewer than 3 boxes are checked, do not invest in Automotive this cycle.

---

### Step 8 — Android XR viability

- [ ] The app's use case is immersive media, spatial productivity, or experiential education.
- [ ] Leadership has explicitly approved exploratory/early-adopter investment (XR reach is currently very small).
- [ ] The team has reviewed the Android XR SDK and confirmed it covers the needed spatial primitives.
- [ ] The phone/tablet Compose codebase already uses `WindowSizeClass` correctly (reduces the delta needed to host existing UI in XR flat panels).

If the product is not in an immersive category or the team cannot absorb experimental risk, defer XR.

---

### Final prioritisation sanity check

- [ ] Tier 1 large-screen compliance is shipped or planned for the next release.
- [ ] Each form factor being added has a dedicated module plan (or a clear argument for why it shares one).
- [ ] The team is not attempting more than two new form factors in a single roadmap cycle.
- [ ] Form-factor selection is driven by user need and reach data, not platform availability alone.
