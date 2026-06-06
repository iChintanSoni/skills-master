---
name: tv-compose
description: Covers Compose for TV using the androidx.tv.material3 library — Cards, ImmersiveList, Carousel, TvNavigationDrawer, and focus-driven 10-foot navigation — for building browse and detail screens on Android TV. Use when building a new Android TV app with Jetpack Compose, migrating a Leanback-based app to Compose, designing browse/detail screen patterns, or wiring D-pad focus across a composable hierarchy on a TV form factor.
---

## When to use

Use this skill when building or migrating an Android TV app that targets the 10-foot experience with Jetpack Compose. It covers the full lifecycle from project setup through browse/detail screen construction, focus management, and the migration path out of Leanback. It does not cover Wear OS, automotive, or non-TV large-screen patterns; for those see the relevant sibling skills.

## Core guidance

### Project setup

- Add the `androidx.tv:tv-material` artifact (the `tv-compose` library) alongside the standard Compose BOM. The TV library provides its own `MaterialTheme` wrapper and focus-aware components separate from the phone-first `androidx.compose.material3` library.
- Declare the `android.software.leanback` feature in the manifest with `android:required="false"` and set `android:banner` on the launcher `<activity>` so the TV launcher shows the app tile.
- Set the Activity theme to `@style/Theme.AppCompat` (or `Theme.Material3`) and call `enableEdgeToEdge()` — TV uses a full-bleed immersive canvas without system bars.
- Target `android:minSdkVersion 21` (Lollipop) as the minimum for TV; the `tv-material` library enforces this floor.
- Turn off `android.hardware.touchscreen` in the manifest (`required="false"`); TV has no touchscreen and the Play Store filters by this feature.

### The 10-foot model

- Design for a **D-pad remote**: Up/Down/Left/Right arrows, Select (OK), Back, and optionally Home/Menu keys. Clicks from a touchpad on newer remotes map to Select.
- All interactive elements must be reachable via D-pad focus traversal. Never rely on swipe, pinch, or multi-touch gestures.
- Keep focus movement predictable: items in a row receive left/right, rows receive up/down, and the sidebar/drawer receives left from the first column. Compose TV's layout components set up the correct `FocusGroup` and `FocusRequester` wiring automatically when you use the `tv-material` composables.
- Apply the **3-metre viewing distance** visual hierarchy: minimum readable text ~18–24sp, large touch targets replaced by clearly bordered focus indicators, and high-contrast backgrounds. `tv-material` cards apply a focus scale animation and border highlight automatically.

### Core tv-material3 components

**StandardCardContainer / ClassicCard / CompactCard**

- Use `StandardCardContainer` as the outer scaffold that handles focus, scale animation, and the border focus indicator. Place image, title, and subtitle inside the provided slots.
- Do not create custom focus-indicator borders manually; let `CardDefaults.focusedBorder` provide the platform-consistent glow.
- `CompactCard` overlays text on the image — suitable for horizontal carousels. `ClassicCard` stacks image above text — suitable for verticals.

**ImmersiveList**

- `ImmersiveList` renders a background (typically a large hero image) that cross-fades as focus moves across its child list. Use it as the top section of a browse screen to create the Leanback-style featured content header.
- The `background` slot receives the currently focused item index as a parameter; use it to drive a `Crossfade` or `AnimatedContent` over the hero image. Hoist the focused-index state to a `rememberSaveable` so it survives brief back-stack pops.
- Keep the `ImmersiveList`'s child list shallow — typically 5–8 featured items — because the full list scrolls out of the immersive area and focus transfers to the next section.

**Carousel**

- `Carousel` auto-advances through slides with a configurable `autoScrollDurationMillis`. Pause auto-scroll when the user focuses the carousel with a D-pad arrow by using `CarouselState` and intercepting the `onFocus` callback.
- Each slide is a composable lambda; do not place heavy image decoding directly inside slides — load asynchronously with Coil and display a placeholder while loading.
- Use `CarouselDefaults.IndicatorRow` in the `indicatorContent` slot to display the dot indicator matching the platform look.

**TvLazyRow / TvLazyColumn**

- Prefer `TvLazyRow` / `TvLazyColumn` over the standard Compose `LazyRow` / `LazyColumn` on TV. The TV variants integrate with the focus model correctly and emit the right accessibility semantics for D-pad navigation.
- Set `pivotOffsets` on `TvLazyRow` to control how much of the first and last items peek into view at the edges — typically 10–15% inset on each side to signal to the user that the row scrolls.
- Use `contentPadding` to add lateral breathing room so the focus border is never clipped by the screen edge.

**TvNavigationDrawer / NavigationDrawer**

- The TV sidebar navigation pattern replaces phone bottom bars. Use `ModalNavigationDrawer` (or `NavigationDrawer`) from `tv-material` and keep it collapsed by default; it expands on left D-pad press from the content area.
- Mark each `NavigationDrawerItem` with its route and use a `NavController` from Navigation Compose to switch top-level sections.
- Do not use phone `BottomNavigation` or `TabRow` on TV — they are unreachable with a D-pad and clash with the TV UX pattern.

### Browse screen pattern

A standard TV browse screen consists of three vertical layers in a `TvLazyColumn`:
1. A `Carousel` or `ImmersiveList` hero section at the top.
2. One or more `TvLazyRow` content rows, each with a section header text above it.
3. Optionally, a footer row of genre links or settings shortcuts.

Keep each row's ViewModel-backed state independent so off-screen rows can load lazily without blocking the hero render.

### Detail screen pattern

- The detail screen shows a large background image/video and a foreground card with metadata. Use `Surface` with an `alpha`-blended overlay rather than a rigid split layout — this fills the 16:9 display without letterboxing.
- Place the action buttons (`WatchNow`, `Add to list`, `Trailer`) in a `Row` with `Spacer` between them and set `focusRestorer()` on the row so focus returns to the last-focused button when the user navigates back to this row.
- A `TvLazyRow` of related content sits below the detail card; load it after the main detail data so initial render is fast.

### Focus management

- Use `FocusRequester` to programmatically move focus to the first item when a screen enters composition: call `focusRequester.requestFocus()` inside a `LaunchedEffect(Unit)` after the list is ready.
- Use `Modifier.focusGroup()` on containers that should cycle focus internally before letting it escape to the parent layout — essential for the sidebar drawer items.
- Never suppress focus with `Modifier.focusable(false)` on a visible interactive item; instead, make it truly non-interactive (disable it) so D-pad traversal skips it predictably.
- Test all focus paths with an emulator and the virtual D-pad controller; focus bugs are invisible without physical testing.

### Leanback migration path

- Replace `BrowseSupportFragment` with a Compose `NavHost` whose start destination is your browse screen composable.
- Replace `RowsSupportFragment` with `TvLazyColumn` rows of `TvLazyRow` card groups.
- Replace `PlaybackSupportFragment` with a Compose detail/player screen using Media3's `PlayerView` via `AndroidView`.
- Replace `VerticalGridFragment` with a `TvLazyVerticalGrid`.
- Remove Leanback dependencies from `build.gradle` only after all Fragments are replaced; a mixed Leanback + Compose TV setup is supported but adds complexity.

```kotlin
// Browse screen: ImmersiveList hero + content rows
@Composable
fun BrowseScreen(
    viewModel: BrowseViewModel = hiltViewModel()
) {
    val featured by viewModel.featured.collectAsStateWithLifecycle()
    val rows by viewModel.rows.collectAsStateWithLifecycle()
    val focusRequester = remember { FocusRequester() }

    TvLazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 48.dp)
    ) {
        item {
            ImmersiveList(
                background = { index, _ ->
                    Crossfade(targetState = featured.getOrNull(index)) { item ->
                        item?.let {
                            AsyncImage(
                                model = it.backdropUrl,
                                contentDescription = null,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                    }
                }
            ) {
                TvLazyRow(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(start = 48.dp, bottom = 32.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    itemsIndexed(featured) { _, item ->
                        CompactCard(
                            onClick = { viewModel.onItemSelected(item) },
                            image = {
                                AsyncImage(model = item.thumbnailUrl, contentDescription = item.title)
                            },
                            title = { Text(item.title) },
                            modifier = Modifier.width(200.dp).height(120.dp)
                        )
                    }
                }
            }
        }
        items(rows) { row ->
            ContentRow(
                title = row.title,
                items = row.items,
                onItemClick = viewModel::onItemSelected,
                modifier = if (rows.indexOf(row) == 0)
                    Modifier.focusRequester(focusRequester) else Modifier
            )
        }
    }

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
    }
}
```

## Platform notes

- **Android TV vs. Google TV:** Both use the same Compose TV library. On Google TV the launcher is different (Leanback launcher vs. the newer Google TV home), but the app-side Compose code is identical.
- **HDMI input / no touchscreen:** The Play Store `android.hardware.touchscreen required="false"` filter is mandatory; apps that omit it do not appear in the TV Play Store.
- **Overscan:** Most modern TVs no longer crop the display, but apply at minimum 48 dp lateral padding to avoid content sitting flush against the bezel. `contentPadding` on `TvLazyColumn` and `TvLazyRow` is the idiomatic place for this.
- **Media playback:** Use `androidx.media3:media3-ui` with `PlayerView` wrapped in `AndroidView`. The TV library does not provide a native Compose player surface yet (as of `tv-material 1.0`).
- **Accessibility / TalkBack:** TV's "Switch Access" and TalkBack both use the same accessibility tree. Ensure all cards have `contentDescription` set (either directly or via the `title` slot composable returning non-empty text) so screen-reader users can navigate.
- **Window size class:** TV is always a single-pane, landscape, `WindowWidthSizeClass.Expanded` environment. Do not use `NavigableListDetailPaneScaffold` from the phone adaptive library; it is designed for foldables and tablets, not the TV sidebar pattern.

## Pitfalls

- Using standard `LazyRow` / `LazyColumn` instead of `TvLazyRow` / `TvLazyColumn` — the standard variants do not integrate with the TV focus model and produce erratic D-pad traversal.
- Forgetting `android.hardware.touchscreen required="false"` in the manifest — the app becomes invisible in the Android TV Play Store.
- Placing `requestFocus()` outside a `LaunchedEffect` — calling it during initial composition before the layout pass finishes causes a crash or a no-op.
- Building focus indicator borders manually (e.g., a `Border` modifier) that do not match `CardDefaults.focusedBorder` — inconsistent glow breaks the TV platform look.
- Auto-scrolling a `Carousel` without pausing on focus — the carousel advances mid-read, confusing D-pad users trying to select a slide.
- Using `BottomNavigation` or phone-style `TabRow` for top-level navigation — unreachable with a D-pad; always use the TV drawer pattern.
- Placing the `ImmersiveList` background content inside the item lambda instead of the `background` slot — the background will not fill the entire composable area and cross-fades will be clipped.
- Decoding large hero bitmaps synchronously inside list item composables — causes jank during D-pad scroll; always decode asynchronously via Coil or a similar loader.
- Keeping Leanback and Compose TV navigation hosts live simultaneously — two nav hosts fight over the back stack. Complete the migration of each screen before switching the nav host.
- Ignoring overscan padding — content rendered flush to the edge is physically cut off on some TV panels even in 2026.

## References

- **Documentation:** [Get started with TV apps](https://developer.android.com/training/tv/get-started)
- **Documentation:** [Jetpack TV library releases](https://developer.android.com/jetpack/androidx/releases/tv)

## See also

For the underlying Compose focus system (`FocusRequester`, `focusGroup`, focus traversal order) used throughout this skill, see `compose-foundation`. For connecting TV screens with type-safe routes and back-stack management, see `compose-navigation`. For asynchronous image loading in cards and carousel slides, see `compose-images`. For wiring Media3 `PlayerView` inside `AndroidView` on the detail screen, see `compose-view-interop`. For the Leanback-to-Compose migration decision and incremental strategy, see `adopting-compose`.
