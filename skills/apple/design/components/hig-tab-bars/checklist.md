## Tab Bar Design Review

### Purpose and structure
- [ ] Every tab is a top-level, peer destination, not an action or verb.
- [ ] Sections in the tab bar are mutually exclusive and equally important.
- [ ] Actions (compose, share, add) live in a toolbar or button, not the tab bar.
- [ ] No destination is duplicated across both a tab bar and a sidebar.

### Count and labeling
- [ ] iPhone shows three to five tabs; iPad stays modest if it carries more.
- [ ] No More overflow tab is needed to hold extra destinations.
- [ ] Each tab pairs a distinct SF Symbol with a concise noun label.
- [ ] Labels never truncate, wrap, or change wording between states.

### Behavior and state
- [ ] Switching tabs and returning preserves scroll position and navigation depth.
- [ ] The selected tab is clearly indicated.

### iOS 26 Liquid Glass and search
- [ ] The bar uses the floating, inset Liquid Glass material, not an opaque custom background.
- [ ] Minimize-on-scroll is allowed where content benefits; key content is not hidden behind the bar.
- [ ] A search tab, if present, uses the search role and reads as search, not a primary action.

### Adaptation across devices
- [ ] iPad uses the sidebar-adaptable pattern (tab bar in portrait/compact, sidebar in landscape/wide).
- [ ] tvOS tabs are legible from a distance with short focus travel.
- [ ] visionOS tabs read clearly in the leading ornament.
- [ ] A tab bar and sidebar are never shown at the same time with conflicting section sets.
