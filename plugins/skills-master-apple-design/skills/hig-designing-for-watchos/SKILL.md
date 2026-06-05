---
name: hig-designing-for-watchos
description: "Applies Apple Human Interface Guidelines to watchOS app and surface design — glanceable, short-session interactions, Digital Crown navigation, complications, the Smart Stack and widgets, notifications, and high-contrast layout on a tiny display. Use when designing or reviewing an Apple Watch app, choosing what belongs on the wrist versus the phone, scoping a single-glance task flow, designing complications or Smart Stack widgets, or critiquing a watchOS screen for legibility, hierarchy, or the 2025-2026 Liquid Glass look. Produces design critique and recommendations grounded in the HIG, not code. Triggers: watchOS design review, Apple Watch UX, glanceability, complications, Smart Stack, watch notifications, wrist-raise."
---

# hig-designing-for-watchos

## When to use

Use when designing or reviewing an Apple Watch experience and you need to judge what truly belongs on the wrist, how to compress a task to a single glance, and how the app, its complications, its Smart Stack widgets, and its notifications work together. Reach for it when scoping a watchOS app from an existing iPhone app, deciding whether something deserves a complication, or critiquing a screen for legibility and hierarchy on a tiny display. This is a design-judgment skill — it produces recommendations and do/don't critique, not Swift code. For implementation, hand off to the watchOS SwiftUI and WidgetKit code skills.

## Core guidance

- **Design for seconds, not minutes — "faster is more," not "less is more."** Assume the person is in motion with one hand free and looking for a few seconds at most. Lead with the single most relevant piece of information or action, defer the rest, and let people finish or get out fast. A watch app that needs sustained attention is a phone app on the wrong device.
- **Decide what belongs on the wrist.** The richest watch value usually lives in the surfaces *around* the app — complications, the Smart Stack, notifications, Live Activities — not in deep screens. Put timely, recurring, in-context tasks on the watch; leave configuration, browsing, and long-form content on iPhone.
- **Make every screen glanceable and high-contrast.** Use one clear focal point per screen, large type, and bold color/contrast against the typically black background so content reads instantly under glare and motion. Avoid dense layouts, small tap targets, and fine detail; respect the safe area and the screen's rounded corners.
- **Anchor navigation to the Digital Crown, but keep touch as an equal path.** Let the Crown scroll lists, paginate, and adjust values with feedback that moves in real time, and never make the Crown the *only* way to do something — every action must also work by tap or swipe. Reserve full-screen, swipe-back navigation for shallow hierarchies.
- **Make complications earn their slot and stay legible across faces.** A complication shows timely info at a glance and deep-links into the app; show only what's useful right now, keep it fresh, and provide a sensible placeholder. Support the relevant families/sizes, defer to the watch face's tint and the system look (including Liquid Glass complications in watchOS 26), and never use a complication purely for branding.
- **Use the Smart Stack and widgets for proactive, contextual moments.** Unlike face complications, Smart Stack widgets can carry your app's own color and identity; design them to surface the right thing at the right time (relevance signals like time, location, and routine) and to read in a single line or two. Keep widgets honest — don't fight the system for attention.
- **Treat notifications as a glance, not a read.** Watch notifications mirror from iPhone as a short look then a long look; front-load the essential fact, keep copy to a sentence, and offer at most a few clear actions so the person acts without opening the app. Earn each interruption and let Focus silence you.
- **Embrace the Liquid Glass system, don't reinvent it.** Let toolbars, controls, Smart Stack hints, and navigation use the standard translucent materials and motion rather than custom chrome; keep content opaque and legible *behind* glass, and rely on system components so your app feels native and stays readable.

## Platform notes

watchOS is its own design context, not a shrunk iPhone. The display is tiny, viewing is brief, and the Digital Crown plus touch are the primary inputs — so hierarchy, contrast, and a single focal point matter more than feature breadth. In watchOS 26, Liquid Glass extends to Smart Stack widgets, hints, notifications, Control Center, and in-app navigation, and the Smart Stack adds proactive "hints" that surface an actionable suggestion (such as a workout when you arrive at the gym); design widgets and complications so they slot cleanly into that proactive, glass-rendered system. Always pair the watch app with its iPhone counterpart conceptually: decide which jobs are wrist-worthy and route everything else to the phone.

## Pitfalls

- Porting an iPhone app screen-for-screen, producing deep navigation and dense layouts no one can use at a glance.
- Designing the core value into app screens while neglecting complications, the Smart Stack, and notifications.
- Low-contrast text, small targets, or fine detail that fails under glare, motion, or a quick wrist-raise.
- Making the Digital Crown the only way to scroll or adjust, with no touch equivalent or visible feedback.
- Complications that show stale or vanity content, ignore the face's tint, or lack placeholders.
- Notifications that read like a full message instead of a front-loaded glance, or that over-notify.
- Custom chrome that fights Liquid Glass and breaks legibility instead of using system materials.

## References

- **Human Interface Guidelines:** [Designing for watchOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-watchos)
- **Human Interface Guidelines:** [Complications](https://developer.apple.com/design/human-interface-guidelines/complications)
- **Human Interface Guidelines:** [Materials (Liquid Glass)](https://developer.apple.com/design/human-interface-guidelines/materials)
- **WWDC:** [Design widgets for the Smart Stack on Apple Watch (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10309/)
- **WWDC:** [Design Live Activities for Apple Watch (WWDC24)](https://developer.apple.com/videos/play/wwdc2024/10098/)
- **WWDC:** [Meet Liquid Glass (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/219/)
- **Documentation:** [Creating accessory widgets and watch complications](https://developer.apple.com/documentation/widgetkit/creating-accessory-widgets-and-watch-complications)

## See also

- Implementation: the watchOS SwiftUI app code skill and the WidgetKit code skill that build screens, accessory widgets, and watch complications.
- Apple HIG inputs skill `hig-digital-crown` for Crown-driven scrolling, value adjustment, and haptic detents on the wrist.
- Apple HIG patterns skill `hig-notifications` for interruption levels, copy, and actions that also govern watch alerts.
- Apple HIG foundations skill `hig-materials-liquid-glass` for how translucent materials and glass controls should read across surfaces.
- Apple HIG foundations skills `hig-color` and `hig-typography-sf-symbols` for high-contrast palettes and legible type on a small screen.
