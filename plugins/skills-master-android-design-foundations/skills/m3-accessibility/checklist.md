## M3 Accessibility Design Review Checklist

### Color contrast
- [ ] Body text (below 18sp regular / 14sp bold) meets 4.5:1 contrast against its background in both light and dark themes
- [ ] Large and bold text meets at least 3:1 contrast
- [ ] Meaningful graphical elements, icons, and chart lines meet at least 3:1 contrast against their background
- [ ] Dynamic color (Material You) pairings have been audited across a representative range of wallpaper-derived palettes
- [ ] Focus indicators and selection outlines meet 3:1 contrast against adjacent colors

### Color-alone signals
- [ ] Error states pair color with a text message, icon, or shape change
- [ ] Success and warning states include a non-color indicator (icon, label, or border)
- [ ] Selected, active, or disabled states do not rely exclusively on color or opacity shifts
- [ ] Charts and data visualizations use distinct shapes or labels in addition to color coding

### Touch targets
- [ ] Every interactive element has a minimum 48 x 48dp touch target
- [ ] Adjacent interactive targets are separated by at least 8dp of non-interactive space
- [ ] Custom icon buttons and compact list actions have been verified with developer options "Show Tap Areas" enabled

### Text and dynamic font scaling
- [ ] All text uses sp units and Material 3 type scale roles, not fixed pixel or dp sizes
- [ ] Layouts have been reviewed at 200% system font scale with no clipping or overlap
- [ ] No text container is constrained to a fixed height that cannot accommodate larger text
- [ ] Multi-line text that may wrap at large sizes does not cause adjacent elements to overlap

### Content descriptions and semantics
- [ ] All icon-only interactive elements have purposeful content descriptions that name their action or destination
- [ ] Content descriptions are localized string resources, not hard-coded English strings
- [ ] Decorative images and icons are hidden from the accessibility tree
- [ ] Visible text labels are not duplicated by matching content descriptions on the same node
- [ ] Headings and section titles are designated as headings in the semantic tree so TalkBack jump shortcuts work
- [ ] Custom interactive components have an explicit semantic role declared

### State descriptions
- [ ] Toggles, checkboxes, and switches report their on/off state to assistive technology independently of their visual icon
- [ ] Loading, progress, and busy states are communicated through a live region or state description
- [ ] Error fields communicate the error condition to assistive technology, not only through visual color or border changes
- [ ] Multi-step processes (step 2 of 5, uploading 60%) expose their progress state semantically

### TalkBack traversal order
- [ ] The TalkBack reading order has been verified in TalkBack exploration mode on a physical device or emulator
- [ ] Two-pane and multi-column layouts define traversal boundaries so reading does not jump between unrelated regions
- [ ] Floating elements (FABs, banners, overlapping cards) are ordered logically relative to main content
- [ ] Modal dialogs, bottom sheets, and menus trap focus correctly and do not allow swipe navigation outside the overlay

### Motion sensitivity
- [ ] All non-essential animations have a reduced-motion alternative designed and documented
- [ ] Continuous or repeating animations are absent or suppressible when Reduce Animations is active
- [ ] Transition animations that involve large displacement, zoom, or parallax have a cross-fade or instant alternative
- [ ] The reduced-motion experience has been reviewed as a first-class design path, not an afterthought

### Large screen and foldable
- [ ] Multi-pane layouts designate each pane as a separate traversal group
- [ ] Touch targets remain at least 48dp on large-screen layouts where components may be resized
- [ ] No content is placed outside the usable display area when the device is unfolded or a large display is used
