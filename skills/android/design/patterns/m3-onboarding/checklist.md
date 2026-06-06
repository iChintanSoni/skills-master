## Design review checklist — M3 Onboarding

### Value-first and core task access
- [ ] The first screen the user sees shows the app's core functionality or real content, not a splash, logo animation, or welcome paragraph
- [ ] The core task (the reason the user installed the app) is reachable without completing any onboarding step, creating an account, or granting any permission
- [ ] A guest or preview mode is available if the app's primary value can be demonstrated without an account

### Sign-in and account prompts
- [ ] No mandatory sign-in prompt appears before the user has experienced the app's core value
- [ ] Sign-in is deferred to the moment an account-dependent action (sync, purchase, save to cloud) is first requested by the user
- [ ] The sign-in entry point clearly explains what the account unlocks in one sentence
- [ ] Google Sign-In or Credential Manager is offered to minimize form friction
- [ ] New-user and returning-user paths in the sign-in UI are visually distinct and clearly labeled

### Permission requests
- [ ] No sensitive permissions (camera, location, microphone, contacts, notifications) are requested at app launch
- [ ] Each permission request is triggered by the user tapping the feature that requires it
- [ ] A benefit-focused rationale screen appears in the app's own UI immediately before the system permission dialog
- [ ] The rationale is one sentence and names the specific benefit ("to scan barcodes" not "for a better experience")
- [ ] The app remains navigable and useful if any permission is denied
- [ ] There is no immediate re-prompt after a permission denial
- [ ] For a previously denied permission, the app offers a path to system settings rather than a dead end

### Onboarding flow and skippability
- [ ] Any upfront onboarding flow is three screens or fewer
- [ ] Every screen in a multi-step flow has a visible, accessible skip control
- [ ] The skip control meets the 48 dp minimum touch target
- [ ] Skipping onboarding lands the user in a fully functional app state, not a broken or empty state
- [ ] Returning users (post-update, post-restore, post-background) are never shown the first-run flow again
- [ ] Onboarding state is persisted so it survives app restarts

### Progressive disclosure and education
- [ ] Feature explanations are delivered contextually at the point of first use, not in a pre-use carousel
- [ ] Coach marks and tooltips are dismissible and do not block primary navigation
- [ ] Coach marks and tooltips have content descriptions for TalkBack
- [ ] Preference or personalization questions are deferred until the user has used the relevant feature
- [ ] No setup wizard asks for information that could be inferred from behavior or system settings

### Visual and motion design
- [ ] Each onboarding screen has a single primary CTA using a `FilledButton`; skip or secondary paths use `TextButton`
- [ ] Illustrations and graphics do not push the primary CTA below the fold on compact phone sizes
- [ ] Motion between onboarding steps uses M3 standard or emphasized easing — no theatrical or looping autoplay animations
- [ ] Color alone is not used to convey active step, required field, or any other semantic state

### Large-screen and adaptive layout
- [ ] Onboarding screens reflow meaningfully at tablet and foldable widths — not a stretched single-column phone layout
- [ ] Two-column layout (illustration + action) is considered for expanded window configurations
- [ ] Sign-in and permission rationale UIs are centered and appropriately sized on large screens

### Accessibility
- [ ] Step progress indicators have content descriptions for TalkBack
- [ ] All interactive controls in onboarding meet the 48 dp minimum touch target
- [ ] Focus order in onboarding screens is logical and TalkBack-readable
- [ ] Skip and navigation controls are reachable via keyboard/switch access without requiring a pointer
