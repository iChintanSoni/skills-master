---
name: m3-ai-glasses
description: "Design guidance and critique for Android XR AI/display glasses using the Glimmer design language: glanceable surfaces, audio-first and hands-free interaction patterns, world-sensing assistance UX, and adapting content to a constrained heads-up display. Use when designing or reviewing any experience targeting Android AI glasses, deciding what information belongs on the display versus in audio, or auditing a glasses UI for glanceability, cognitive load, and situational safety."
---

## When to use

Use this skill when designing or critiquing an Android experience that targets AI-enabled display glasses — devices where content is projected onto a small optical display in the user's field of view while they remain physically active in the world. It applies when you are choosing what information to surface on the display versus what to route to audio, designing interaction flows that work without hands (or with only brief hands-free gestures), building world-sensing assistance features that respond to what the user sees or hears, or auditing a glasses UI for cognitive overload, situational safety, and glanceability. Implementation detail is left to the xr-glimmer-glasses code skill.

## Core guidance

- **Design for a glance, not a gaze.** The glasses display is not a phone screen that happens to be in your eye line — it is an interrupt surface the user looks at for one to three seconds before returning attention to the physical world. Every surface must be readable and actionable in a single glance. Prioritize one piece of information per display moment; do not stack headlines, body text, lists, and metadata as you would in a feed. If the information requires sustained reading, it belongs in audio or deferred to a paired phone screen.

- **Treat audio as the primary output channel.** For the majority of glasses use cases, spatial audio or earpiece speech is faster to consume than text on a tiny display. Design information flows with audio-first: the display provides a brief visual anchor or confirmation of what audio is delivering, not the inverse. When crafting audio responses, keep them short and naturally spoken — a single sentence or two at most — so users can respond while in motion.

- **Use the Glimmer design language for all visual output.** Glimmer surfaces use translucent frosted panels that respect the real-world scene behind them, ensuring legibility over varied backgrounds. Use the system-provided Glimmer card and notification containers rather than custom opaque surfaces; a fully opaque panel obscures the user's view and breaks spatial presence. Glimmer typography is set at larger minimum sizes than phone norms — respect these minimums, as smaller text becomes unreadable on optical displays under varying lighting.

- **Limit each display surface to a single semantic unit.** A Glimmer card should carry one thing: a navigation cue, an incoming message preview, a measurement result, a contextual fact. If you find yourself adding a second concept — a timestamp plus an action label plus a status icon plus a follow-up suggestion — you have already exceeded what a glance can process. Strip to the essential noun and the essential action.

- **Hands-free interaction is the norm, not an edge case.** Users wearing glasses are often carrying objects, riding a bike, cooking, or working with their hands. Assume the user cannot tap a screen. Design primary flows around voice commands, head gestures (nod or shake), and automatic context triggers from world sensing. Tap or swipe on a temple button should be a secondary shortcut, not the only affordance. Never require multi-step sequential taps to reach a critical action.

- **Respect the world-sensing contract.** Glasses with cameras and microphones can recognize what the user sees and hears. Design world-sensing assistance to be assistive, not intrusive: surface context only when it is timely and genuinely relevant to what the user is focused on. An unsolicited, always-on identification overlay covering every object in view creates cognitive noise and erodes trust. Trigger contextual overlays on explicit user invocation or a clearly bounded ambient event (a barcode scan, a recognized face the user has consented to identify), not speculatively.

- **Anchor overlays to world objects with purpose.** When a Glimmer overlay is spatially anchored to a real-world object — a restaurant menu, a product on a shelf, a landmark — the anchor itself communicates relevance. Floating panels that drift or appear unconnected to any real-world trigger feel arbitrary and disorienting. Ensure every spatially anchored surface has a clear visual tether or proximity relationship to the object that caused it to appear.

- **Keep display time short and dismiss proactively.** A surface that lingers after the user has processed it occupies precious field-of-view space and creates fatigue. Design surfaces with a sensible auto-dismiss timing tied to content length; for simple confirmations, two to four seconds is typically sufficient. For navigation cues or live context that the user needs for a duration (turn-by-turn, active timer), provide a persistent but minimal indicator rather than a full card. Never leave a surface on screen indefinitely without a hands-free dismiss mechanism.

- **Convey urgency through display, routine information through audio alone.** The display captures foveal attention and should be reserved for time-critical or spatially relevant information. Calendar reminders, weather summaries, and read-aloud messages that do not need a visual anchor should arrive as audio only. Vibration on the frame combined with audio handles alert-level events; the display is reserved for when visual information changes the user's physical behavior (stop, turn, scan this object).

- **Use color and shape within Glimmer's constrained palette.** Glimmer uses a restrained palette — dominant neutrals, a single accent for the most critical interactive element, and system semantic colors (green for confirmation, red for warning, amber for attention). Do not introduce brand gradients or multi-color patterns onto the glasses display; chromatic complexity at small scale on an optical lens reads as noise, not brand expression. Shape should be consistently rounded and system-defined, not custom-clipped.

- **Design for variable ambient brightness and background complexity.** Users move between dim indoor environments and bright outdoor sunlight. Avoid thin strokes, hairline dividers, or low-contrast type on Glimmer surfaces; what passes WCAG AA on a phone screen may be unreadable on a lens in sunlight. Rely on the Glimmer material's system-managed luminance adaptation rather than setting fixed background colors.

- **Accommodate the short interaction window around driving and physical activity.** Safety-critical activities demand the most extreme form of glanceability. If your feature may be used while operating a vehicle or in a high-attention physical task, apply the most aggressive reduction: maximum one line of text, a single binary action, system voice confirmation. Many categories of display output are appropriate only when the user is stationary — design feature flags and context-awareness to suppress display output when motion sensors indicate active transit.

## Platform notes

- **Android XR glasses vs. headsets:** Android XR covers both full headsets (like the Samsung XR device) and lightweight display glasses. The Glimmer design language originated for glasses, where the display is smaller, the field of view is narrower, and the use cases are ambient rather than immersive. Do not apply headset-scale immersive space patterns (full environment replacement, large virtual screens) to glasses, and do not assume the glasses have six-degrees-of-freedom head tracking at headset fidelity.

- **Paired phone relationship:** Most AI glasses have a companion Android phone handling compute, app state, and configuration. Design the information split intentionally: the glasses surface just-in-time glanceable output while the phone holds the full context. Users should be able to pause and shift to the phone for any task that exceeds what the glasses surface can reasonably support — this handoff should be explicit and smooth.

- **Multimodal output composition:** On glasses-capable Android, apps can compose a response from audio, a Glimmer display card, and a haptic pulse simultaneously. Design the combination deliberately: audio plus display together reinforces the message; audio alone is the low-interruption baseline; display alone is reserved for silent environments (a library, a meeting) where the user has suppressed audio. Do not duplicate the same content verbatim in both channels — audio can carry elaboration while the display carries the summary anchor.

- **Privacy indicators and user trust:** Glasses with always-on cameras must surface privacy indicators visibly — typically an LED and a system overlay — when perception is active. Do not suppress or design around these indicators; they are trust infrastructure. Contextual sensing features should explain what they are observing and why, especially on first use, and offer quick voice commands to pause perception.

## Pitfalls

- Treating the glasses display like a small phone screen and attempting to show lists, multi-step wizards, or rich media.
- Routing every notification to the display instead of reserving the display for spatially relevant or time-critical content.
- Requiring a physical tap or multi-step voice interaction to dismiss a persistent display surface the user has already processed.
- Using Glimmer containers as decoration and then overriding them with fully opaque brand panels, blocking the user's view.
- Designing world-sensing assistance that triggers speculatively and constantly, training users to ignore all overlays.
- Setting small type sizes or thin hairline strokes that work on phone but become invisible on an optical lens in varying lighting.
- Ignoring the paired phone entirely and attempting to push long-form content to the glasses that should always live on the phone.
- Failing to account for safety-critical contexts — designing a rich display surface with no suppression logic for when the user is operating a vehicle.
- Introducing multi-color brand palettes or custom clip shapes that read as visual noise at glasses display scale.
- Anchoring overlays to world objects but never dismissing them, leaving a persistent overlay on a restaurant menu the user walked past.

## References

- **Documentation:** [Designing UI for AI Glasses — Android](https://developer.android.com/design/ui/ai-glasses)
- **Documentation:** [Android XR developer overview](https://developer.android.com/develop/xr)

## See also

- The xr-glimmer-glasses code skill covers composable and API implementation of Glimmer surfaces, anchored overlays, voice command integration, and display card construction — pair this design skill with it when moving from critique to code.
- The M3 motion design skill informs how transitions and durations apply even in constrained form; Glimmer's auto-dismiss animations should follow the M3 expressive duration curve principles rather than phone-centric spring curves.
- The M3 accessibility design skill covers contrast ratios and target sizes; apply its principles conservatively on glasses displays where ambient variance is much wider than on phone.
- The M3 adaptive layout design skill is relevant when designing the companion phone UI that pairs with the glasses experience, ensuring information is correctly partitioned between the two surfaces.
