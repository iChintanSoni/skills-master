---
name: hig-sheets
description: Applies Apple Human Interface Guidelines to sheets and modal presentation — when to use a sheet versus full-screen or a popover, height/detents, and dismissal. Use when designing or reviewing a modal flow, choosing a presentation style, or critiquing a sheet's UX. Produces design critique, not code.
tags: [hig, design, sheets, modality, presentation]
x-skills-master:
  domain: apple
  class: design
  category: components
  platforms: [ios, ipados, macos, visionos]
  pairs_with: [swiftui-sheets]
  sources:
    - https://developer.apple.com/design/human-interface-guidelines/sheets
    - https://developer.apple.com/design/human-interface-guidelines/modality
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

## When to use

Use when designing or reviewing a modal presentation and deciding whether a sheet is the right container, how tall it should be, and how it should be dismissed. This is a design-judgment skill: it produces recommendations and do/don't critique, not Swift code. For the implementation, hand off to `swiftui-sheets`.

## Core guidance

- Reach for a sheet for a **self-contained, non-immersive subtask** the person will finish and dismiss — composing, editing a detail, a short form. Prefer full-screen for immersive content (media, multi-step creation) and a popover (on regular-width/iPad/Mac) for a small contextual cluster of options.
- Size the sheet to the content. Offer a **partial-height detent** when the task is light and the person benefits from seeing context behind it; expand to a larger detent only when needed.
- Keep a single, obvious primary action and an unambiguous way to cancel. Let people dismiss by swiping down, but **confirm before discarding unsaved work** rather than silently losing it.
- Don't stack sheets on sheets to model a flow; that buries context. Use navigation within one sheet instead.
- Give the sheet a clear title and, when it contains a form, conventional Cancel/Done affordances in its toolbar.

## Platform notes

Sheets are central on iPhone, where partial detents shine. On iPad and Mac, the same intent is often better served by a popover or a separate window; don't force a phone-style bottom sheet onto a regular-width layout. In visionOS, modal content appears as an ornament/sheet in the volume — keep it shallow and glanceable.

## Pitfalls

- Using a sheet for a primary, frequently-used destination that should be a tab or a pushed screen.
- Defaulting to full height when a partial detent would preserve context.
- Allowing swipe-to-dismiss to discard unsaved edits without confirmation.

## See also

- Implementation: `swiftui-sheets`
- Apple HIG: Sheets, Modality (see sources).
