---
name: hig-snippets
description: Applies Apple Human Interface Guidelines to snippets — the compact views Siri, Spotlight, and the Shortcuts app show when an app intent runs. Covers confirmation versus result snippets, the dialogue/custom-view/system-button anatomy, the 400-point height budget, legibility over the system background, descriptive confirmation button labels, and when to deep-link instead of adding detail. Use when designing or reviewing a snippet for an App Intents action, deciding between confirmation and result presentation, or critiquing snippet layout and content density. Produces design critique, not code.
---

> **Emerging** — this covers an API that was pre-1.0, newly shipped, or still moving as of 2026-08-25. Treat the specifics as provisional and confirm against current documentation before relying on them.

## When to use

Use when designing or reviewing a snippet — the compact view that appears when someone performs a task through Siri, Spotlight, or the Shortcuts app, either showing the result or asking for confirmation. Reach for it when deciding whether an intent needs a confirmation step, what the custom view should show, how much content fits, and what the confirmation button should say. Snippets are new as a distinct HIG page in the 2026 cycle; this skill produces design judgment, and the App Intents code skill implements the snippet.

## Core guidance

- **Pick the right snippet type for the moment.** A *confirmation* snippet lets the person confirm or cancel before the action runs and can carry options that affect the outcome; it's an optional step. A *result* snippet presents the outcome and asks nothing further — every app intent shows one. Don't add a confirmation to an action that's trivially reversible; don't skip it when the action spends money or is hard to undo.
- **Design around the three-part anatomy.** The system composes a snippet from the intent's *dialogue* (which Siri speaks, shown above the view by default), your *custom view*, and *system-provided buttons* — Cancel plus a customizable primary button for confirmations, a single Done button for results. Design only the custom view; let the system own the frame and buttons.
- **Don't restate the dialogue visually.** Dialogue exists for audio-only interactions. In the visual presentation, prefer omitting the dialogue text and letting the custom view communicate the information itself — a snippet that shows the same sentence it speaks wastes its space.
- **Keep it concise and inside the height budget.** Snippets are for lightweight, quick interactions. The custom view has a 400-point maximum height, and text renders at the person's preferred text size, so a layout that fits at default sizes can overflow at larger ones. When a result deserves more detail, deep-link into the app rather than packing the view.
- **Make it legible on the system background.** Verify contrast between your content and the system-provided snippet background in both light and dark appearances, and keep margins consistent so the layout reads quickly and reliably.
- **Label the confirmation button with the action.** Choose a fitting system-provided label or supply a custom verb — "Order" for a coffee order, never "OK" or "Proceed." The system falls back to "Continue" when you specify nothing, which is rarely the clearest choice.
- **Add buttons only for quick, relevant follow-ons.** The custom view can include buttons that modify the content, reveal more information, or take a related action — keep them few and purposeful so the snippet stays a glance, not a screen.

## Platform notes

- **iOS, iPadOS, macOS:** Snippets appear on these platforms with the same anatomy and behavior; the HIG lists no per-platform differences beyond that.
- **watchOS, tvOS, visionOS:** No snippet presentation — don't design an intent flow that depends on a visible snippet on these platforms.
- **Audio-only delivery:** The same intent can run where nothing is displayed, so the dialogue — not the snippet — must carry the complete response.

## Pitfalls

- A custom view that just repeats the spoken dialogue as text.
- Cramming detail into the view until it hits the 400-point ceiling instead of deep-linking into the app.
- Layouts verified only at default text size that clip or truncate at larger accessibility sizes.
- "OK"/"Continue" confirmation buttons that don't say what will happen.
- Low-contrast content that disappears against the system background in dark appearance.
- Confirmation steps on harmless actions, or none on destructive or paid ones.
- Treating a snippet as a mini app screen with navigation and many buttons rather than a compact, single-purpose view.

## References

- **Human Interface Guidelines:** [Snippets](https://developer.apple.com/design/human-interface-guidelines/snippets)
- **Human Interface Guidelines:** [Siri](https://developer.apple.com/design/human-interface-guidelines/siri)
- **Documentation:** [App Intents](https://developer.apple.com/documentation/appintents)
- **WWDC:** [Design interactive snippets (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/281/)

## See also

- `hig-siri-design` for the surrounding Siri experience — which actions to expose, response dialogue, and context sharing.
- `app-intents` — the code skill that implements the intent, its dialogue, and the snippet view.
- The Live Activities design skill for ongoing glanceable updates, versus a snippet's one-shot result.
