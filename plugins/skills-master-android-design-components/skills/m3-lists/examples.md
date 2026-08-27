## Scenario 1: Settings list with section grouping and trailing controls

A settings screen groups preferences into labelled sections — "Appearance", "Notifications", "Account". Each section uses a subheader label in `labelMedium` at secondary emphasis, followed by inset-divider-separated rows.

The appearance section contains one-line items with trailing Switch controls (dark mode, bold text, high contrast). Because all rows are one-line toggle entries, no leading icon is needed — the label alone is sufficient. Placing an icon on every toggle would be decorative noise.

The notifications section uses two-line items: the headline names the notification category ("New messages") while the supporting text describes the current state ("Banners and sounds"). A trailing chevron-forward icon signals that tapping opens a sub-settings destination.

**Design decisions that matter here:**
- Switches sit in the trailing slot, not the leading slot, following M3 convention. A Switch in the leading slot would be mistaken for a decorative icon.
- Subheader labels ("Appearance", "Notifications") use a full-bleed divider above them only, not between every item in the section. Inset dividers between items keep the section cohesive.
- Tapping a switch row anywhere (not just the switch itself) toggles the value — the entire row is the touch target.

**Anti-pattern — what not to do:** Using a Card container for each settings row and stacking them in a vertical Column creates unnecessary elevation, rounded-corner noise, and padding between every item. Settings rows are set members, not standalone objects. Use a flat list with an inset divider.

---

## Scenario 2: Messaging inbox with avatars, multi-select, and swipe-to-archive

A messaging inbox shows conversation threads. Each row is a two-line item: a 40 dp circular avatar in the leading slot (contact photo or initials monogram), the contact name as headline, and a message preview as supporting text. Trailing metadata shows the timestamp at `labelSmall` right-aligned, and an unread indicator dot above it.

**Selection:** Long-pressing a row enters multi-select mode. The avatar smoothly crossfades into a filled Checkbox, and the top app bar transitions to a contextual action bar with a count badge ("3 selected") and bulk actions — archive, delete, mark read. The count badge in the action bar title is critical: without it users cannot verify how many items they are about to archive.

**Swipe actions:** Swiping right reveals an orange archive background with an archive icon. Swiping left reveals a red delete background with a trash icon. On release, a Snackbar appears with an Undo action. The swipe action is available only on conversation rows, not on any "New conversation" button or section header.

**Design decisions that matter here:**
- The avatar slot is held to a consistent 40 dp circle. If some contacts have no photo, an initials monogram fills the slot at the same size — the leading alignment of all headline text stays consistent.
- The unread indicator uses both a colored dot and a bold headline weight so colorblind users also perceive unread state.
- Swipe-to-archive and swipe-to-delete are on opposite directions so users do not accidentally delete when they intend to archive.

**Anti-pattern — what not to do:** Placing both a "archive" icon button and a "delete" icon button as visible trailing elements in every row. This clutters every single row with two permanent action targets, trains users to tap rather than swipe, and makes the list feel like a data table. Use swipe for these actions and reserve the trailing slot for metadata.

---

## Scenario 3: Contact directory — list versus grid decision

A contacts directory displays hundreds of entries. Each contact has a name, a phone number, and optionally a photo. The design question is whether to use a list or a grid.

**Why a list wins here:** Contacts are searched and navigated by name — a text-first scanning task. A grid would surface photos, but contacts photos are inconsistent in quality and availability, and browsing a grid of faces is slower than reading an alphabetically sorted list. A list with alphabetical sticky section headers (A, B, C…) and a fast-scroll thumb index on the trailing edge lets users jump to a section instantly.

Two-line items are correct: headline is the full name (primary scan target), supporting text is the phone number or label (secondary confirmation). A 40 dp avatar in the leading slot helps identification when photos are available; initials monograms fill the slot consistently when photos are absent.

**Large-screen adaptation:** On a tablet, the directory list occupies the leading pane (~360 dp) and the selected contact's detail view fills the trailing pane. The list does not stretch to full screen width — it retains its compact pane width to keep line lengths scannable.

**Anti-pattern — what not to do:** Displaying contact cards in a two-column grid because "it looks richer." A 2-up card grid cuts visible contacts per screen in half, makes alphabetical scanning harder, and breaks the fast-scroll index pattern. Visual richness at the cost of usability is not an M3 value.
