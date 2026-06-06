## Scenario 1: Requesting microphone access for a voice notes feature

A task management app adds voice notes as an attachment type. The design team debates whether to request microphone access during onboarding alongside the "Get started" flow.

**Why this is wrong.** The user has not yet taken any action that requires a microphone. Requesting it during onboarding is speculative — the user has not opened a task, not discovered the voice note button, and has no reason to evaluate whether microphone access is worthwhile. The vast majority of users who see this prompt in onboarding will deny it reflexively because the request carries no context.

**Recommended design.** Remove microphone from onboarding entirely. When the user taps the microphone icon inside the task detail composer for the first time, show a brief `AlertDialog` rationale: "Voice notes let you record and attach audio directly to tasks. Tap Continue to grant microphone access." Two actions: "Not now" on the leading side, "Continue" on the trailing side. After the user taps Continue, launch the system permission dialog. If they deny, the microphone icon should become tappable with a small in-context label: "Microphone access is off — tap to enable." If they have permanently denied, tapping the icon opens a modal dialog explaining the permanent state with a "Open Settings" action.

**Anti-pattern.** Showing no rationale at all and launching the system microphone dialog the instant the user taps the microphone icon. The system dialog says "Allow [App] to record audio?" — which tells the user nothing about the feature, why it needs persistent access, or what happens if they decline.

---

## Scenario 2: Location access for a restaurant discovery feature

A lifestyle app has a restaurant discovery tab that shows nearby places. The designer proposes requesting precise location (ACCESS_FINE_LOCATION) when the user opens the discovery tab.

**Why this partially misses the mark.** Opening the tab is a reasonable trigger — the user has expressed intent to discover restaurants. However, two things need correction: first, the feature needs nearby restaurants, not a precise GPS fix; approximate location (ACCESS_COARSE_LOCATION) is sufficient. Second, on Android 12 and above the system location dialog gives users the choice between precise and approximate; the app's design should account for and degrade gracefully on both. Requesting only FINE location and ignoring COARSE means the feature breaks for users who choose the "approximate only" option.

**Recommended design.** Request both ACCESS_FINE_LOCATION and ACCESS_COARSE_LOCATION to allow the user to choose from the system dialog. Before launching the dialog, show a small explanatory card within the tab: "Turn on location to see restaurants near you — or search by neighborhood below." The card has two actions: "Enable location" (launches the system dialog) and a search field below serves as the implicit fallback. When approximate location is granted, the map centers on a general area and a subtle banner says "Showing approximate results — enable precise location for better accuracy," with a tap-to-upgrade path.

**Anti-pattern.** Showing a full-screen blocking rationale modal before the user can see any content on the discovery tab, with no option to manually search. This makes the permission a gate rather than an enhancement, forces a binary choice before the user has even seen the feature, and abandons users in regions where location services are unavailable.

---

## Scenario 3: Handling permanent denial of notification permissions

A delivery tracking app requests `POST_NOTIFICATIONS` when the user places an order. The user has previously denied notification permission and ticked "Don't ask again." The designer proposes re-showing the rationale dialog each time the user visits the Orders tab.

**Why this is wrong.** Repeated rationale dialogs after permanent denial produce no system dialog — the request is silently ignored — and train the user to dismiss the rationale without reading it. It is also disrespectful: the user made a deliberate choice. Showing the same dialog every session after that choice is harassment, not onboarding.

**Recommended design.** Detect permanent denial the first time it occurs (after the system callback returns denied and `shouldShowRequestPermissionRationale` is false). Show a single modal `AlertDialog` explaining the situation: "Notification access is turned off. You won't receive updates when your order status changes. To enable them, go to Settings." Two actions: "Not now" (dismisses and stores the dismissed flag) and "Open Settings" (navigates directly to the app's system settings page). After the user dismisses, the Orders tab renders a non-blocking inline banner: "Notifications are off — tap to manage settings." That banner is the persistent but non-blocking reminder. Do not show the modal dialog again unless the user explicitly taps the banner.

**Anti-pattern.** Calling `launcher.launch(POST_NOTIFICATIONS)` every time the user opens the Orders tab after permanent denial, producing a silent no-op each time. From the user's perspective the app does nothing when they open this tab, and they cannot tell whether the feature is broken, loading, or intentionally absent.
