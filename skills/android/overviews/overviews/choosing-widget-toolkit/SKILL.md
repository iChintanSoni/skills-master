---
name: choosing-widget-toolkit
description: "Decision router for Android glanceable surfaces — app widgets built with Jetpack Glance versus RemoteViews directly, Wear OS tiles and complications, Live Updates and ongoing notifications, and Quick Settings tiles. Use when deciding how to surface app content or an action outside the app, when choosing between Glance and RemoteViews for a new widget, or when a feature needs an ongoing status surface rather than a static glance."
tags: [widgets, glance, remoteviews, wear-os, tiles, notifications, decision]
x-skills-master:
  domain: android
  class: overview
  category: overviews
  platforms: ["android", "large-screen", "wear-os"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: [app-widgets-glance]
  sources:
    - https://developer.android.com/develop/ui/compose/glance
    - https://developer.android.com/develop/ui/views/appwidgets/overview
    - https://developer.android.com/training/wearables/tiles
  snapshot_date: "2026-08-25"
  stability: stable
  version: 1.0.0
---

## When to use

- A feature should be visible or actionable **without opening the app**, and the surface is undecided.
- A new home-screen widget is being scoped and someone is asking whether to use Glance or hand-write `RemoteViews`.
- An existing `AppWidgetProvider` with XML layouts is up for modernisation.
- A Wear OS app needs a glanceable presence and the tile/complication distinction is fuzzy.
- Someone proposes a "widget that updates every few seconds" — which is almost always the wrong surface.

## Core guidance

Pick by the **shape of the content and the shape of the interaction**, not by which API is nearest to hand. Five surfaces, each with a distinct lifecycle:

| Content shape | Surface |
|---|---|
| Static-ish glance, refreshed periodically | App widget (Glance) |
| A single field feeding a watch face | Wear complication |
| A glanceable card in the watch carousel | Wear tile |
| An ongoing, user-initiated, time-bounded activity | Live Update / ongoing notification |
| One frequent toggle or quick action | Quick Settings tile |

### App widgets — Glance is the answer for new work

Google's own app-widgets entry point now leads with the Compose path, and **Jetpack Glance is the default choice for any new widget.** You write `GlanceAppWidget` composables in Kotlin, get Compose-style state handling, responsive sizing from the runtime options bundle, and actions (`actionRunCallback`, `actionStartActivity`) without hand-rolled broadcast plumbing.

Understand what Glance actually is: it **translates your composables into `RemoteViews`** and hands those to the host. It is not Compose UI — it ships its own composable set, because the underlying `RemoteViews` contract is restrictive (a `Row` becomes a horizontal `LinearLayout`, a `LazyColumn` becomes a `ListView`). That translation is the whole value proposition and also the source of every limitation.

Note the library's own maturity when you plan: Glance's stable line sits at 1.1.x at this snapshot, with a 1.2 release candidate and a 1.3 alpha in flight, and the docs describe it as in active development. Check the release page before pinning a version.

### When RemoteViews directly is still the right call

Reach past Glance to raw `RemoteViews` when:

- You need a view type, attribute, or `RemoteViews` construct that Glance does not surface, and the widget's whole value depends on it.
- You are maintaining a large existing XML widget with no appetite for a rewrite — a working `AppWidgetProvider` is not a defect.
- The widget lives in a module that cannot take a Compose runtime dependency.
- Something outside the app-widget host consumes `RemoteViews` you construct yourself.

Glance offers interoperability for the mixed case, so "one stubborn subtree" is a reason to embed `RemoteViews` inside a Glance widget, not a reason to abandon Glance for the whole surface. **Do not hand-write `RemoteViews` for a new widget merely because the team already knows the API.**

### The Android 17 direction

At I/O 2026 Google framed Android 17 as a shift toward a **single, Compose-based development model for all widgets**, unifying mobile, Wear OS, and cars behind Glance, with RemoteCompose powering higher-fidelity animation on mobile and cars and letting Wear Widgets (the surface formerly called Tiles) render richer UI logic remotely. Some of this is stated as arriving rather than shipped, so treat it as direction, not as an API you can call today. The safe read: **investment in Glance is investment in the direction the platform is moving**, and the `androidx.glance:glance-wear-tiles` artifact is already deprecated in favour of a forthcoming Glance wear widgets library — so do not start Wear work on that artifact.

### Wear OS — tiles versus complications

These are not competing options; they answer different questions.

- A **tile** is a full card in the tile carousel, built declaratively with `androidx.wear.tiles` and `androidx.wear.protolayout`. Choose it when the user needs a glanceable summary plus a tap target. Tiles must be cheap to produce: cache in local storage and let WorkManager do the fetching — never run network calls or long async work inside the tile service. Route to `wear-tiles`.
- A **complication** is a small typed value your app supplies to somebody else's watch face through a `ComplicationDataSourceService`. Choose it when the value is a single number, short text, ranged value, or icon that belongs on the watch face itself. You do not control the presentation — the watch face does. Route to `wear-complications`.

Ship both when the data supports it: the complication is the always-visible hook, the tile is the one-swipe detail.

### Live Updates and ongoing notifications

When the thing you are surfacing has a **start and an end and is happening now** — navigation, an active call, a ride, a delivery — that is not widget territory. Android 16 introduced progress-centric Live Updates: `Notification.ProgressStyle` for points and segments along a journey, promoted to a more prominent presentation when the notification declares the `POST_PROMOTED_NOTIFICATIONS` manifest permission, requests promotion (`setRequestPromotedOngoing`), is ongoing, and uses a supported style.

Reserve this for activity that is ongoing, user-initiated, and time-sensitive. It is not a general "keep my app on screen" mechanism, and an activity with no natural end does not belong here — that is a widget. Where the work is genuinely long-running, pair with `foreground-services`.

### Quick Settings tiles

A Quick Settings tile is a `TileService` in `android.service.quicksettings`, declared with the `BIND_QUICK_SETTINGS_TILE` permission and a `QS_TILE` intent filter; from Android 13 you can prompt the user to add one with `StatusBarManager.requestAddTileService`.

Google's guidance is narrow and worth honouring: a QS tile is for an action that is **both frequent and needs to be fast** — typically a two-state toggle. It is explicitly not for launching the app, not for one-off actions, not for displaying information, and you should not ship more than a couple. Those cases belong to `app-shortcuts`, a notification, or a widget.

## Platform notes

- **Widget gestures are limited to touch and vertical swipe.** Any interaction design that assumes horizontal swipe, drag, or multi-touch is not implementable on a widget regardless of toolkit.
- **Everything on a widget runs in the host's process.** State must arrive as data, not as object references — feed widgets from DataStore or Room and refresh via WorkManager (`datastore`, `room`, `workmanager`).
- **Wear tiles are their own service class.** `androidx.wear.tiles.TileService` and the Quick Settings `android.service.quicksettings.TileService` share a name and nothing else; confusing them in a discussion (or an import) is common.
- **Widget picker previews matter for adoption.** Generated previews let the picker show real content instead of a static drawable — worth doing for any widget you expect users to discover.
- **Cars are a separate surface entirely.** Automotive glanceable content goes through the Car App Library today; see `car-app-library`.

## Pitfalls

- **Faking an ongoing event with a fast-refreshing widget.** Widget updates are budgeted and throttled by the host. Use a Live Update.
- **Hand-writing `RemoteViews` for a greenfield widget.** Familiarity is not a requirement; you are choosing more code and less platform direction.
- **Expecting Compose UI inside Glance.** Glance's composables are a different, deliberately smaller set. Code will not port across, and layouts that assume arbitrary measurement will not survive the `RemoteViews` translation.
- **Doing work inside `TileService` or the widget update path.** Network calls in a tile or widget callback produce stale, janky, or missing surfaces. Cache first, render from cache.
- **Building a tile when a complication was the ask.** If the user's mental model is "I want this number on my watch face", a tile is the wrong surface and will not appear where they look.
- **Starting new Wear work on `glance-wear-tiles`.** It is deprecated; use the tiles and protolayout libraries until the Glance wear replacement lands.
- **Shipping a Quick Settings tile that just opens the app.** That is an app shortcut, and reviewers and users both read it as clutter.

## References

- **Documentation:** [Jetpack Glance](https://developer.android.com/develop/ui/compose/glance)
- **Documentation:** [App widgets overview](https://developer.android.com/develop/ui/views/appwidgets/overview)
- **Documentation:** [Wear OS tiles](https://developer.android.com/training/wearables/tiles)
- **Documentation:** [Quick Settings tiles](https://developer.android.com/develop/ui/views/quicksettings-tiles)
- **Documentation:** [Progress-centric notifications](https://developer.android.com/about/versions/16/features/progress-centric-notifications)

## See also

Route into the chosen surface: `app-widgets-glance` for `GlanceAppWidget`, state, actions, and responsive sizing; `wear-tiles` for ProtoLayout and tile freshness; `wear-complications` for supplying watch-face data. For the notification path see `notifications` and `foreground-services`, and `m3-notifications` for the design side. For quick actions that do not need a surface of their own see `app-shortcuts`. Widget visual design is covered by `m3-widgets` and `m3-wear`; the data plumbing behind any of these belongs to `datastore`, `room`, and `workmanager`. When the question is which form factors to support at all, see `choosing-form-factors`.
