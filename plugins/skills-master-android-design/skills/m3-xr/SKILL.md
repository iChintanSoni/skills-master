---
name: m3-xr
description: "Design critique and judgment for Android XR headset UIs: spatial panels and orbiters, depth and elevation in three-dimensional space, viewer comfort and accessibility at distance, environment design, and adapting 2D Material 3 layouts into immersive XR experiences. Use when reviewing or specifying UI for Android XR headsets, evaluating whether a panel layout respects spatial comfort zones, deciding how 2D screens translate into the volumetric canvas, or critiquing depth hierarchy and orbiter placement."
---

## When to use

- Critiquing a spatial UI mockup for Android XR headsets — evaluating panel placement, depth hierarchy, and how the viewer's gaze and comfort zones are respected.
- Specifying how a 2D phone or tablet screen should be adapted for the volumetric canvas before engineers begin building.
- Reviewing whether orbiters, floating toolbars, and supplementary panels are placed at appropriate angular distances from the primary panel.
- Evaluating whether depth and elevation choices communicate hierarchy clearly without inducing viewer fatigue.
- Deciding how much of the physical environment should be visible (passthrough, mixed reality, full immersion) for a given task context.
- Auditing a spatial layout for comfort, accessibility, and minimum interaction distances.

## Core guidance

### Spatial panels as the primary surface

- **Treat panels as windows into the world, not flat posters pinned to a virtual wall.** A panel in Android XR occupies a position in the user's space and must be authored with awareness of distance, angular size, and the viewer's natural resting gaze. The default comfortable viewing distance is roughly 1–2 meters; panels placed at extreme near or far distances distort readability and impose focusing strain.
- **Constrain primary panel width to what subtends a comfortable horizontal field of view.** An angular width of roughly 30–45 degrees is a comfortable reading zone for most tasks. Wider panels force the viewer to turn their head repeatedly, which adds fatigue and breaks immersion.
- **Establish a clear primary panel as the anchor for the session.** Secondary panels and orbiters should be positioned relative to the primary panel, not scattered independently in space. A floating media player, a notification feed, and a settings drawer that each drift to arbitrary world positions create a disorganized, hard-to-recall layout.
- **Use the SpatialPanel and SpatialRow composables as the structural skeleton.** Panels created with these components inherit the Android XR system's depth and input handling. Avoid hand-rolling floating surfaces that bypass the spatial layout system.

### Orbiters and supplementary surfaces

- **Position orbiters at the edge of their parent panel, not in front of the viewer's face.** An orbiter — a floating control cluster anchored to a panel — should sit at the natural margin of its parent surface, typically just outside the panel boundary at the same or slightly shallower depth. Placing a toolbar in the center of the viewer's visual field blocks content and is the spatial equivalent of covering a phone screen with a notification shade permanently.
- **Keep orbiter density low.** An orbiter is for the single most important contextual action (play/pause, close, share). Cramming six buttons into an orbiter defeats the spatial advantage of having surfaces distributed in space. If more controls are needed, they belong inside the primary panel as a toolbar or a bottom action bar, not on a floating orbiter.
- **Anchor orbiters spatially, not screen-locked.** A screen-locked orbiter — one that moves with the headset as the viewer turns — is appropriate only for system-level controls (volume, home) and creates disorientation when applied to app-level elements. App orbiters should stay tethered to their parent panel in world space.

### Depth and elevation

- **Use depth to express hierarchy, not decoration.** In 2D Material 3, elevation is conveyed through surface tint and shadow. In XR, actual depth offset is available — but every step back in Z creates focus demand. Reserve meaningful Z-axis separation for genuinely distinct content layers: a confirmation dialog that must command attention may step 0.1–0.2 m forward from the primary panel; ambient secondary panels may step slightly behind. Avoid decorative depth that has no semantic meaning.
- **Do not let depth compete with panel size for attention.** A very close, small panel can be visually louder than a large far panel; calibrate both distance and scale together when establishing hierarchy.
- **Maintain consistent depth anchoring within a panel.** Content inside a single panel should feel flat and coplanar unless a specific interaction (expanding a card, opening a popover) justifies a local depth offset. Scattered Z positions within one surface create a fragmented, unstable feel.
- **Map Material 3 elevation tokens to conservative depth offsets.** A card that carries the M3 Level 2 tonal elevation does not need a dramatic Z pop in XR — a subtle 0.02–0.05 m forward position communicates "interactive and lifted" without becoming a focal distraction.

### Viewer comfort and fatigue

- **Respect the viewer's natural gaze rest point.** The ergonomic resting position for a head-mounted display is roughly 10–15 degrees below horizontal. Place primary content — the headline, the primary action — near that rest point rather than at the exact geometric center of the panel or at the very top.
- **Avoid requiring sustained upward or sideward head tilt.** Content placed above 30 degrees of elevation or beyond 45 degrees of horizontal offset from center forces neck strain within minutes. These zones are appropriate for ambient indicators or glanceable widgets — not primary reading surfaces.
- **Minimize content that requires fine convergence at close range.** Small text or dense information at distances below 0.5 m causes vergence-accommodation conflict — the eyes converge for near distance while the display optics focus at a fixed plane. Keep primary text at a comfortable distance and ensure type size scales accordingly (see typography notes below).
- **Allow gaze-rest breaks.** Designs that fill every degree of the field of view with active content or motion prevent the natural breaks in attention that make extended use comfortable. Leave visual quiet zones: uncluttered environment, sparse panel backgrounds, and generous internal padding.

### Adapting 2D layouts to the spatial canvas

- **Start from the tablet expanded layout, not the phone compact layout.** The XR panel canvas most closely resembles a wide expanded display. A compact single-column phone layout ported directly to XR wastes the available width and produces an overly narrow panel that looks undersized in space.
- **Promote navigation structures.** A bottom navigation bar from a phone layout should become a navigation rail or a persistent side panel in XR, matching the spatial equivalent of an expanded-window navigation pattern. The thumb-zone logic of a phone layout does not apply when the interaction model shifts to gaze, hand tracking, or controller.
- **Evaluate which 2D modal patterns require spatial alternatives.** Full-screen modals and bottom sheets that work on a phone can become disorienting in XR — they can block the environment and feel claustrophobic. Prefer dialogs and compact panels that appear as overlay panels at slight depth separation rather than covering the entire visual field.
- **Let the environment do work that backgrounds and gradients would do on 2D.** In XR the user can see a curated environment (a sky, a studio, a nature scene) behind the panels. Panels should use transparent or lightly tinted backgrounds that allow the environment to remain perceptible, rather than solid opaque fills that replicate a phone screen in space.

### Environment design

- **Choose environment intensity to match task type.** A focus-intensive task (coding, reading, document editing) benefits from a neutral, low-distraction environment — a plain studio or a dimly lit room. A creative, exploratory, or media task can use a richer environment (a landscape, a stylized space) that adds mood without competing with content.
- **Avoid environments with high-frequency motion or complex animation.** A moving waterfall, a storm, or a particle system in the background becomes visually competing noise when the foreground panels require sustained attention. Reserve animated environments for idle states or immersive media playback.
- **Respect the user's choice to remain in passthrough.** Passthrough mode (seeing the physical room) is the default safety orientation and some users will prefer it always. Design panel layouts and color choices that remain readable and visually coherent over a real-world background, not just over a curated virtual environment.

### Typography at distance

- **Scale type to angular size, not absolute dp.** A 14 sp body text that is perfectly legible on a phone held 30 cm away will be illegible on a panel placed 1.5 m from the viewer at the same dp value. Angular size — the degrees subtended by the text — should guide minimum readable type size. Body text should subtend at least 0.3–0.4 degrees of visual angle at the intended panel distance; headlines can be larger.
- **Prefer the M3 Display and Headline type roles for primary panel headings.** At comfortable reading distances, even Display-sized type appears modest in angular terms. Do not fear large type on spatial panels — what feels oversized in a 2D mockup tool often looks right in headset.

### Input and interaction model

- **Design for ray casting and hand-tracking, not finger touch.** On a touchscreen, a 48 dp target is a minimum. In XR, the precision of ray-cast pointing means targets can be somewhat smaller, but interactive controls that are very small or placed at panel edges are still difficult to hit. Maintain comfortable target sizes (roughly 32–48 dp equivalent) and err toward generosity at panel margins where ray angle is shallower.
- **Never rely on hover states as the sole affordance.** Eye-gaze hover can activate subtle highlights, but not all users have reliable eye tracking and some interactions are driven by hand gestures or controllers without a persistent cursor. Ensure interactive elements communicate their affordance through shape, label, and icon — not hover feedback alone.
- **Give every interactive element a visible focus state.** In a spatial environment, the system focus ring or highlight must be clearly visible against both the panel surface and the environment visible around the panel.

## Platform notes

- **Android XR is the design target.** The principles here address Samsung and AOSP-based Android XR headsets, which run a version of Android extended with spatial APIs. The platform is emergent — design guidance will evolve as hardware generations mature and user research accumulates.
- **Phone and tablet equivalents:** These platforms are not in scope here; see the m3-adaptive-layout skill for adapting layouts across compact, medium, and expanded window sizes on flat screens.
- **Wear OS, Android TV, and CarPlay:** These platforms have no meaningful overlap with XR spatial panel design and should be addressed by their own platform-specific skills.

## Pitfalls

- **Porting the phone layout unchanged into a panel.** A narrow single-column phone layout inside a spatial panel wastes the canvas, forces unnecessary scrolling, and looks mismatched in the space around it.
- **Placing primary actions in high-elevation angles.** Content requiring sustained head-up gaze of more than 20–25 degrees induces rapid neck fatigue. Primary calls-to-action must be near the ergonomic gaze rest zone.
- **Overloading orbiters with controls.** An orbiter with many buttons is not a toolbar — it is a spatially displaced toolbar that is harder to find and harder to use. Keep orbiters to one or two actions maximum.
- **Using heavy solid backgrounds on panels.** A fully opaque white or dark panel erases the environment and turns the XR experience into a floating phone screen. Semi-transparent or environment-aware panel surfaces allow spatial presence to remain.
- **Ignoring vergence-accommodation conflict at close distances.** Small, dense text placed at near range (below 0.5 m) is a common source of discomfort complaints. Always validate content density and minimum distance together.
- **Assuming the virtual environment is always active.** Passthrough users see their physical room. Panel designs must be tested over real-world backgrounds, not only over controlled virtual environments.
- **Treating depth as decoration.** Arbitrary Z offsets on cards, list items, or icons create visual clutter and undermine the semantic clarity that depth should provide. Every depth offset should communicate something — hierarchy, focus, selection, or distance.
- **Neglecting quiet visual zones.** Filling the full field of view with content, animation, and overlapping panels leads to fatigue within minutes and overwhelms users new to XR.

## References

- **Material 3 Guidelines / Documentation:** [Designing for Android XR](https://developer.android.com/design/ui/xr)
- **Documentation:** [Developing for Android XR](https://developer.android.com/develop/xr)

## See also

For adapting the foundational M3 layout structure before promoting it to XR — window size classes, pane strategies, and the expanded-width canonical layouts that form the starting point for spatial panels — see the m3-adaptive-layout skill. For canonical navigation patterns (rail vs drawer vs bottom bar) that inform spatial navigation structure, see the m3-navigation skill. For the M3 elevation tokens and tonal surface system that map into XR depth decisions, see the m3-elevation skill. All implementation work — SpatialPanel, SpatialRow, orbiter placement, and the Android XR Compose APIs — should be handed to the xr-compose-spatial code skill.
