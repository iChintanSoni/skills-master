---
name: m3-tooltips
description: Design critique and guidance for Material 3 tooltips on Android, covering plain vs rich variants, hover and long-press triggers, helper-text conciseness, and the rule that tooltips must never carry information essential to task completion. Use when designing or reviewing tooltip placement, variant selection, and copy for Compose-first Android apps.
---

## When to use

Use this skill when designing or reviewing tooltips in a Material 3 Android app — deciding between a plain and a rich tooltip, choosing the right trigger gesture, writing concise helper text, or checking whether a tooltip is carrying information that should live somewhere more permanent. This skill gives design judgment grounded in Material 3 (Material You / M3 Expressive); for the Compose implementation use the `TooltipBox`, `PlainTooltip`, and `RichTooltip` composables covered by the compose-ui code skill.

## Core guidance

### Plain vs rich tooltips

- **Choose a plain tooltip for a single, short label.** Plain tooltips show one brief phrase — typically the name of an icon button or a keyboard shortcut — and nothing else. If you need more than a few words, you have already outgrown the plain variant.
- **Choose a rich tooltip when the helper content needs structure.** Rich tooltips support a title, a body of up to a sentence or two, and an optional action link. Use them when the label alone cannot communicate purpose — for example, a feature that genuinely requires a short explanation or a "Learn more" escape hatch. Do not use rich tooltips as inline documentation panels; if the explanation is that long, surface it in the UI itself.
- **Never mix the two variants on the same trigger.** A single control should have exactly one tooltip type. Switching between plain and rich for similar controls on the same screen creates an inconsistent hierarchy of importance.

### Triggers

- **Honor both hover and long-press as first-class triggers.** On touch-only devices, long-press is the only path to a tooltip, so every tooltip must be discoverable that way. On devices with a pointing device (foldables with trackpads, desktops), hover triggers the tooltip. Design with both input modes in mind before finalizing placement and delay.
- **Pair tooltips only with interactive, non-labeled controls.** The canonical use case is a standalone icon button without a visible text label. If a control already has a visible label, the tooltip is redundant and adds noise. Avoid adding tooltips to text links, labeled buttons, or any control whose purpose is already obvious in context.
- **Do not rely on tooltip timing as part of the interaction.** Tooltips appear after a delay and disappear on interaction. They cannot carry timed feedback or progress state. If information must appear immediately, on every touch, or stay visible, it belongs in a different component — a label, a supporting text node, or a snackbar.

### Copy

- **Write as a noun phrase or a short verb phrase, not a sentence.** Plain tooltip text should be "Copy to clipboard" or "Share", not "Tap to copy this item to your clipboard." Brevity signals that the information is supplemental, not essential.
- **Do not end plain tooltip text with a period.** The text is a label fragment, not a sentence.
- **For rich tooltip titles, mirror the control's purpose concisely.** The title should echo what the button does; the body adds one layer of why or how. Keep the total reading burden under five seconds; if it exceeds that, the feature probably needs in-product onboarding, not a tooltip.
- **Avoid passive or hedging language.** "May help you share" is weaker than "Share with others." Be direct about what the action does.

### Essential information

- **Never put information in a tooltip that the user needs to complete the task.** A tooltip is supplemental by definition — it is hidden until triggered and invisible to users who never discover the gesture. Any information essential to understanding, enabling, or completing an action must appear as persistent UI: a label, a subtitle, helper text beneath a field, or an inline explanation. Burying required information in a tooltip creates an accessibility failure and a discoverability trap.
- **Treat the no-tooltip state as the baseline experience.** Ask: can the user accomplish the task without ever seeing this tooltip? If the answer is no, move the information out of the tooltip.

### Sizing and placement

- **Trust the system for positioning.** M3's `TooltipBox` computes placement automatically to avoid clipping. Do not attempt to override position to enforce a specific edge unless the automated result consistently clips against a navigation bar or system UI — and even then, prefer adjusting the anchor's padding before overriding tooltip placement.
- **Keep rich tooltip width bounded.** Rich tooltips have a defined maximum width. Copy that overflows or wraps excessively is a signal that the content belongs elsewhere. Aim for body text that reads in two lines or fewer.

### States and accessibility

- **Ensure every tooltip-bearing control has a meaningful content description.** The tooltip is not a substitute for an accessibility label; the composable's `contentDescription` (or semantics node) must describe the action independently for screen readers. A tooltip is a visual enhancement, not an accessibility affordance.
- **Do not suppress or conditionally show tooltips based on user expertise.** Hiding tooltips from "advanced" users via a preference is fragile and unnecessary. Well-written tooltip copy is brief enough that it never feels condescending to experienced users.

## Platform notes

**Compact phones (portrait, single pane):** Long-press is the only trigger. Keep tooltip copy especially short because the tooltip floats over content the user is interacting with. Rich tooltips with action links should be used sparingly since they compete with the primary task on a small screen.

**Large screens and foldables (expanded width, split pane):** Hover becomes a real interaction path. Ensure tooltip delays feel natural with a pointing device — the system default is appropriate for most cases. On large screens, rich tooltips are slightly more at home because there is more visual breathing room, but the essential-information rule applies equally.

**Foldable with keyboard/trackpad attached:** Both hover and long-press paths must work. Test hover behavior explicitly; a tooltip that only appears on long-press feels broken when a trackpad is connected.

**Wear OS:** Tooltips as defined in M3 phone/tablet guidelines do not translate to Wear OS, where the interaction model is crown and tap, not hover or long-press. Use brief labels and contextual confirmations instead.

**Android TV:** Focus-based navigation means neither hover nor long-press is a natural discovery path for tooltips. Avoid relying on tooltips for any information on TV; prefer visible labels alongside icon controls.

## Pitfalls

- Putting essential task information — an error explanation, a required field note, a constraint — inside a tooltip where it is invisible until the user discovers the trigger.
- Using a plain tooltip for content that actually needs a title and body (or vice versa, inflating a simple label into a rich tooltip).
- Adding tooltips to already-labeled controls, which teaches users that hovering or long-pressing always reveals additional content and creates false expectations throughout the app.
- Writing tooltip copy in full sentences with terminal punctuation, which makes supplemental helper text feel like a warning or an error message.
- Forgetting the long-press path on touch-only devices, leaving the tooltip unreachable for the majority of Android users.
- Relying on tooltip visibility to satisfy an accessibility audit — tooltips are not a substitute for content descriptions or persistent in-context labels.
- Overloading rich tooltips with paragraphs of explanatory text; if the feature requires that much explanation, the design itself needs reconsideration.

## References

- **Material 3 Guidelines:** [Tooltips overview](https://m3.material.io/components/tooltips/overview)
- **Documentation:** [Compose UI components](https://developer.android.com/develop/ui/compose/components)

## See also

The compose-ui code skill covers the `TooltipBox`, `PlainTooltip`, and `RichTooltip` composables and handles all implementation detail. For related guidance on surfacing ephemeral messages (feedback that must always be seen), see the m3-snackbars design skill — snackbars and tooltips are frequently confused but serve opposite visibility guarantees. For persistent contextual helper text beneath fields, see the m3-text-fields design skill. For popover-style anchored panels carrying richer interactive content, the m3-menus and m3-dialogs design skills cover those alternatives.
