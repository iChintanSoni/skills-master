---
name: hig-action-sheets
description: "Design critique and guidance for iOS/iPadOS action sheets (SwiftUI confirmation dialogs): presenting a short set of choices tied to a user-initiated action, ordering options, marking and placing the destructive choice, offering Cancel on iPhone, and choosing between an action sheet, a menu, and an alert. Use when reviewing a delete/discard/share flow, a multiple-choice prompt, a confirmation step, or any moment that asks the user to confirm an intentional action, and you need HIG-grounded design recommendations rather than code."
---

## When to use

Reach for this skill when critiquing any moment that offers a short set of choices in response to something the user just did: discarding a draft, deleting an item, choosing a share destination, or confirming a one-tap consequential action. Use it to decide whether the moment should be an action sheet (confirmation dialog), a menu, or an alert, and to review the ordering, styling, and Cancel affordance.

Do not use it for passive system-initiated warnings (those are alerts), for always-available navigation choices (those are menus), or for long lists of options that belong in their own screen.

## Core guidance

- **Use an action sheet for choices tied to an intentional action, not for warnings.** When the user deliberately taps something with consequences (Discard, Delete, Share), present the choices in an action sheet. Reserve alerts for unexpected, system-initiated situations the user did not ask for.
- **Keep it short and action-led.** An action sheet is for a handful of mutually exclusive choices. If you have more than a few options, or options that are persistently available rather than tied to one action, use a menu instead. If you have only a single binary confirm/cancel, an alert may read more clearly.
- **Put the destructive option at the top, styled destructive (red).** The most dangerous choice should be visually distinct and placed where it is noticed first. Never bury a destructive action mid-list where it can be tapped by mistake.
- **Do not apply destructive styling when the action is the user's stated intent.** If the user explicitly chose "Empty Trash" and the sheet simply confirms it, the confirming button performs their original intent and should not be styled as an accidental destructive action. Reserve red for the choice that destroys data the user did not set out to destroy.
- **Always give an explicit way out on iPhone.** Provide a Cancel choice so the user can back out without consequence. In SwiftUI confirmation dialogs the Cancel button is supplied by the system; make sure your custom buttons do not duplicate or obscure it.
- **Write choices as clear verbs, not yes/no.** Label each option with the action it performs ("Delete Draft", "Save Draft") so the consequence is legible without reading the title. Avoid generic "OK".
- **Use an optional title/message only to clarify consequences.** Add a short message when the outcome is irreversible or non-obvious; omit it when the button labels already make the result clear. Never use the title to ask a question the buttons already answer.

## Platform notes

- **iOS / iPadOS 26 (Liquid Glass):** Action sheets now anchor to the source view (the control that triggered them) on both iPhone and iPad, rendered as Liquid Glass that morphs out of the originating control. When presented inline/anchored this way, the cancel action becomes implicit — tapping outside dismisses — so the system may omit a visible Cancel button. Review designs so the user always understands that tapping away cancels; reserve a visible Cancel for full-screen contexts where there is no clear "outside" to tap.
- **iPadOS:** Because the sheet is anchored to its source, make sure the triggering control is unambiguous and large enough to anchor against; avoid triggering an action sheet from an off-screen or transient control.
- **Cross-platform note:** The same SwiftUI confirmation dialog adapts per platform — sheet-style on iPhone, anchored/popover-style on iPad. Critique the iPhone and iPad presentations separately; an ordering that reads well stacked may feel cramped when anchored.

## Pitfalls

- Using an action sheet for a passive warning the user did not initiate (should be an alert).
- Placing the destructive choice in the middle or bottom of the list, or leaving it un-styled.
- Styling a button red when it merely confirms the user's own deliberate destructive intent.
- Offering five or more choices in a sheet that should have been a menu or a dedicated screen.
- Labeling buttons "Yes"/"No"/"OK" so the consequence is unclear out of context.
- Relying solely on implicit tap-to-cancel in a full-screen flow where there is no obvious empty area to tap.

## References

- **Human Interface Guidelines:** [Action sheets](https://developer.apple.com/design/human-interface-guidelines/action-sheets)
- **Human Interface Guidelines:** [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts)
- **Human Interface Guidelines:** [Menus](https://developer.apple.com/design/human-interface-guidelines/menus)
- **WWDC:** [Get to know the new design system (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/356/)
- **Documentation:** [confirmationDialog(_:isPresented:titleVisibility:actions:message:)](https://developer.apple.com/documentation/swiftui/view/confirmationdialog(_:ispresented:titlevisibility:actions:message:))

## See also

For the SwiftUI implementation of this component (the `confirmationDialog` view modifier, button roles, and title visibility), pair this with the SwiftUI alerts-and-dialogs code skill. For deciding when a passive warning belongs in an alert instead, see the alerts design skill. For persistently available option lists, see the menus design skill. For the destructive-action color and styling conventions, see the color and button-styling design skills.
