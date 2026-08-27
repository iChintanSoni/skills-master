## Scenario 1: Productivity app with a mandatory sign-in wall

A task-management app opens to a full-screen "Welcome to TaskFlow" screen with a large logo, a four-sentence description of the app's benefits, and a single "Sign in to continue" button. Below it, in small gray text, is "Create an account." There is no way to proceed without authenticating.

**What this gets right:** The sign-in and create-account paths are both present.

**What this gets wrong — and how to fix it:** The app asks for a commitment before demonstrating any value. A user who just installed the app has no reason to trust it yet. The correct pattern is to open directly into the task list (even a sample list showing what the app looks like populated) with an optional "Sign in to sync" nudge in a non-blocking banner or a `Snackbar` with an action. Defer the sign-in `ModalBottomSheet` or screen to the first moment the user taps "Add to another device" or "Enable reminders" — actions that genuinely require an account. Offering a guest mode ("Try without an account") as a `TextButton` alternative to the sign-in wall converts a gate into an invitation.

**Anti-pattern:** The app displays a full-screen loading spinner with "Checking your session…" for three seconds before showing the sign-in wall, adding latency to an already-friction-heavy first screen. Initialization that cannot be avoided should happen in parallel with displaying useful UI, not in serial before any UI appears.

---

## Scenario 2: Camera-based shopping app that requests permissions at launch

A shopping app that uses the camera to scan barcodes opens with a system permission dialog — "Allow Shopping App to access your camera?" — before the home screen has fully rendered. The user taps "Don't allow" because they do not yet understand why the camera is needed. On the home screen, the scan button is now grayed out with the label "Camera unavailable."

**What this gets right:** The app degrades gracefully rather than crashing, and the scan button is visually disabled.

**What this gets wrong — and how to fix it:** Firing the camera permission at launch produces the lowest possible grant rate because the user has no context. The correct pattern is to show the home screen immediately, with the scan-barcode entry point fully visible and tappable. When the user taps it for the first time, show a rationale screen — one `FilledButton` CTA, one sentence of explanation ("Scan a barcode to instantly find product prices and reviews") — and then trigger the system dialog. If the permission was previously denied, the rationale screen explains how to re-enable it in system settings via a "Open settings" `TextButton`, and the rest of the app remains fully browsable.

**Anti-pattern:** After denial, the app shows an `AlertDialog` that immediately re-requests the permission ("We really need your camera. Allow access?"). Immediate re-prompting after denial trains users to dismiss dialogs without reading them, and on Android 11 and later the system will suppress the prompt entirely after two denials — making the re-prompt pattern both annoying and futile.

---

## Scenario 3: Fitness app with a five-screen onboarding carousel

A fitness tracking app greets every new user with a five-step onboarding carousel: step 1 is a welcome screen, steps 2–4 explain three separate features (workout tracking, nutrition logging, sleep monitoring) with static illustration and two lines of text each, and step 5 asks the user to choose their primary goal. Each step has a "Next" `FilledButton` and a small "Skip" `TextButton` in the top-right corner. Returning users who update the app see the carousel again.

**What this gets right:** A skip control is present. The progression is linear and clear.

**What this gets wrong — and how to fix it:** Five screens is two too many for a cold-start user who has not yet touched the app. Steps 2–4 describe features the user has not encountered; without context, the descriptions are abstract and forgettable. The goal-selection step (step 5) would produce better data if deferred until after the user has completed their first logged workout, when they understand what "primary goal" means in practice.

The redesign collapses the flow to one screen: a direct invitation to start ("Log your first workout") with a `FilledButton`, and a secondary path ("I'll explore on my own") as a `TextButton`. Feature explanations become contextual `TooltipBox` coach marks on the relevant controls, surfaced the first time each feature is tapped. The goal-selection prompt becomes an optional nudge in a `ModalBottomSheet` after the first workout is saved. Most critically, returning users after an update go directly to their dashboard — the onboarding state is persisted in DataStore and checked at launch.

**Anti-pattern:** The carousel's "Skip" button in the top-right corner is 24 dp tall and 48 dp wide — the label text is large enough but the tappable area is smaller than the M3-recommended 48 dp minimum touch target. A user trying to skip quickly on a phone with a small display may tap the system status bar instead. All tappable controls in onboarding must meet the 48 dp minimum touch target regardless of label size.
