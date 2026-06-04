---
name: hig-modality
description: "Design critique and recommendations for modal experiences on Apple platforms, grounded in the Human Interface Guidelines. Use when reviewing or designing interruptions and focused tasks: deciding whether to go modal at all, choosing between sheets, full-screen covers, alerts, action sheets/menus, and popovers, keeping modal tasks short and focused, providing clear dismissal and confirming unsaved changes, and avoiding nested or stacked modals. Covers the 26 design cycle (Liquid Glass sheets that morph from their source, dimming for focus). Produces UX guidance and review notes, not code."
---

# HIG Modality

## When to use

Use this skill when critiquing or designing any experience that interrupts the
main flow to create a temporary, focused mode: a sheet for a scoped task, an
alert for critical information, a popover for contextual options, or a
full-screen cover for an immersive flow. Reach for it during design review when
you need to judge whether an interruption is justified, which modal style fits,
and whether dismissal and data-protection are handled well. It does not produce
implementation code — name the component (sheet, alert, popover) in prose and
hand off to the SwiftUI or UIKit skill for building.

## Core guidance

- **Go modal only when the interruption earns it.** Reserve modality for moments
  that are critical to get attention, tasks that must be completed or abandoned
  before continuing, or saving important data. If the content can live inline or
  in a pushed view, it should — every modal is a forced detour.
- **Match the style to the weight of the task.** Use a sheet for a short, scoped
  task related to the current context; an alert only for critical information
  with a clear choice; a popover for transient, contextual options on larger
  displays; and a full-screen cover only for genuinely immersive content. Don't
  use an alert as a generic notification or a sheet as a second navigation stack.
- **Keep modal tasks short, simple, and narrowly focused.** Don't build "an app
  within your app." Deep hierarchies inside a sheet hide a person's progress and
  exit; if a task needs multi-step navigation, reconsider whether it should be
  modal at all.
- **Always provide an obvious, safe way out.** Give every modal a clearly labeled
  Done/Cancel (or a visible close affordance), and let people swipe to dismiss
  sheets. Label confirmation buttons with specific verbs ("Save", "Delete"), not
  "OK", so the outcome is unambiguous.
- **Protect unsaved work on cancel.** If dismissing would discard meaningful
  edits, confirm with an action sheet or alert before discarding; never silently
  destroy input. Conversely, don't nag with a confirmation when nothing has
  changed.
- **Don't nest or stack modals.** Avoid presenting a modal over another modal,
  and never present a sheet over a popover — with the possible exception of an
  alert, nothing should appear above a popover. Stacked modals bury the dismiss
  path and disorient.
- **Use focus deliberately in the 26 cycle.** When a task interrupts the main
  flow, pair the Liquid Glass sheet with a dimming layer so it reads as a clear,
  purposeful space; when a task runs in parallel, let the glass create
  separation without dimming. Let sheets morph from the control that presents
  them and avoid overriding the system sheet background.

## Platform notes

- **iOS / iPadOS:** Sheets resize between detents and, in the 26 cycle, morph
  from their source control with a Liquid Glass background — don't apply a custom
  sheet background that defeats it. On iPad, prefer popovers for contextual
  choices and form/page sheets for focused tasks; reserve full-screen covers for
  immersive flows.
- **macOS:** Modality is heavier here — favor an inspector, a separate window, or
  a sheet attached to its window over a full-screen takeover. Use alerts
  sparingly; place the default button on the trailing side.
- **watchOS:** Keep modals to a single, glanceable decision; long modal tasks
  don't belong on the wrist. Sheets and full-screen modals should be dismissible
  with minimal effort.
- **tvOS:** Modal content must be readable and focus-navigable from a distance;
  avoid popovers and keep choices few so the remote can reach the exit quickly.
- **visionOS:** Prefer placing sheets and popovers within the app's window rather
  than as separate volumes; keep modal content close to its trigger and easy to
  dismiss without disrupting the surrounding space.

## Pitfalls

- Using an alert as a passive notification instead of for a critical, actionable
  decision, which trains people to dismiss alerts reflexively.
- Cramming a multi-step wizard into a single sheet so people lose track of where
  they are and how to leave.
- Discarding edits silently on swipe-to-dismiss with no confirmation of unsaved
  changes.
- Presenting a confirmation modal from inside another modal (nested modals) or a
  sheet over a popover.
- Overriding the system Liquid Glass sheet background or transition in the 26
  cycle, breaking the morph-from-source continuity and the focus dimming.
- Ambiguous button labels ("OK"/"Yes") that hide what the action will actually do.

## References

- **Human Interface Guidelines:** [Modality](https://developer.apple.com/design/human-interface-guidelines/modality)
- **Human Interface Guidelines:** [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- **Human Interface Guidelines:** [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts)
- **Human Interface Guidelines:** [Popovers](https://developer.apple.com/design/human-interface-guidelines/popovers)
- **WWDC:** [Build a UIKit app with the new design (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/284/)
- **Documentation:** [Adopting Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass)

## See also

- **hig-sheets-and-presentation** (or the SwiftUI/UIKit presentation skill that
  implements sheets, full-screen covers, and detents) for building the modal
  containers this critique recommends.
- **hig-alerts-and-action-sheets** for the deeper design rules on alert wording,
  destructive-action emphasis, and confirmation dialogs referenced above.
- **hig-navigation** for deciding when content belongs in a pushed view or split
  view instead of a modal, and **hig-liquid-glass** for the material, dimming,
  and morph-from-source behavior of 26-cycle sheets and popovers.
