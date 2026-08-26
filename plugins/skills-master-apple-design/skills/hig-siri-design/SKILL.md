---
name: hig-siri-design
description: "Design guidance for Siri experiences per the Human Interface Guidelines Siri section, revised in the 2026 cycle for Siri AI and Apple Intelligence. Use when deciding which app actions and content to expose to Siri through App Intents, sharing onscreen context via view annotations and donations, writing response dialogue that works aloud and onscreen, reviewing App Shortcuts phrasing, or applying Apple's editorial rules for referring to Siri. Produces UX critique and copy guidance grounded in the HIG, not code. Triggers: Siri design review, response dialogue, App Shortcuts phrases, exposing actions to Siri, Siri AI, Apple Intelligence integration."
license: MIT
---

> **Emerging** — this covers an API that was pre-1.0, newly shipped, or still moving as of 2026-08-25. Treat the specifics as provisional and confirm against current documentation before relying on them.

# hig-siri-design

## When to use

Use this skill to design or critique how an app shows up in Siri: which actions
and content it exposes, how it shares onscreen context, and how its responses
sound and read. Reach for it when choosing what to surface as intents and
entities, when writing or reviewing response dialogue, when naming App Shortcuts
phrases, or when auditing an integration against Apple's editorial rules. With
Siri AI on Apple Intelligence devices, people can invoke app actions from
anywhere in the system, reference what's onscreen, and chain follow-up requests
— so the design question is no longer "does my app have a Siri feature" but
"how does my whole app behave as part of a conversation." This skill produces
design and copy judgment, not implementation; the App Intents code skill is the
implementation counterpart.

## Core guidance

- **Expose actions and content through App Intents.** Intents describe what the
  app can do; entities describe what it contains. That one definition feeds
  Siri, Spotlight, the Shortcuts app, and Apple Intelligence. Where the app fits
  a common domain (email, music, photos), adopt the preset app schema domains to
  get system behavior without custom design; use App Shortcuts for functionality
  outside the schemas.
- **Prioritize the actions people actually use.** Map where each action is
  relevant — hands-free moments, particular devices — and expose the popular,
  high-value ones first rather than mirroring the whole feature set. The
  priority list you choose is the Siri experience.
- **Speak the person's vocabulary.** Name actions and entities with terms people
  already use for the content ("song," "track," "podcast"), not internal product
  jargon, so requests feel natural to phrase.
- **Offer personally relevant content, not the whole catalog.** Surface recents,
  favorites, bookmarks, and wishlists rather than everything the app can reach.
  (Mail and messaging apps are the reasonable exception, since broad access is
  the point.) Never route advertising, marketing, or purchase upsells through a
  Siri response.
- **Share context so Siri can resolve "this" and "that."** Annotate views with
  the app entities they display so onscreen references work mid-conversation;
  donate entities to the Spotlight index for discoverability; donate intents
  after in-app actions so the system can anticipate and suggest them later.
- **Prefer built-in responses; customize only when they fall short.** Siri
  handles a wide range of natural-language requests without extra dialogue. When
  you do customize, make it specific: "Which soup?" beats "Which one?", and an
  error like "Sorry, we're out of chicken noodle soup" beats a generic apology.
- **Write dialogue for ears and eyes at once.** People hear responses many times
  — keep them succinct, skip the joke, and let conversation context carry
  detail. Every response must stand alone as audio, because some contexts never
  show a screen; treat any visual presentation as reinforcement, not the
  message. Ask open-ended questions ("What kind of shoes?") instead of reading
  long option lists aloud.
- **Keep responses inclusive, device-independent, and unbranded.** Avoid
  gendered pronouns ("Who should I send it to?" rather than "What's his or her
  name?"). A request can start on one device and finish on another, so avoid
  wording tied to one device. Don't say the app's name — the system already
  attributes the response — and respect parental-controls settings for
  restricted content, since responses are audible to whoever is nearby.
- **Follow the editorial rules.** Refer to Siri as "Siri," never "she" or
  "her." Never imitate Siri, present responses as if they came from Apple, or
  use reserved phrases. In localized marketing of "Hey Siri," only "Hey" is
  translated — Siri is an Apple trademark and stays as-is.

## Platform notes

- **All platforms:** The Siri section applies across iOS, iPadOS, macOS, tvOS,
  visionOS, and watchOS. The constants everywhere: audio-first responses,
  personally relevant content, and honest attribution.
- **Apple Intelligence devices:** Siri AI adds onscreen awareness and
  conversation chaining, which is what makes view annotation and entity
  donation load-bearing design work rather than optional polish.
- **iOS, iPadOS, macOS:** Visual results and confirmations render as snippets —
  compact views with their own anatomy and rules; design those with the
  snippets skill.
- **Audio-only contexts:** Responses don't always have a display, so optional
  visual properties may never appear. Never let the spoken response depend on
  them.

## Pitfalls

- Exposing the entire feature surface as intents instead of a prioritized set,
  drowning the useful actions.
- Dialogue that only makes sense with a screen attached, or that repeats the
  app's name the system already announces.
- Cute or humorous responses that grate by the tenth hearing.
- Reading a long list of options aloud instead of narrowing with a question.
- Marketing, ads, or upsell copy delivered through a Siri response.
- Skipping view annotations and donations, so "add this to my album" fails even
  though the intent exists.
- Copy that calls Siri "she," mimics Siri's voice/persona, or translates the
  "Siri" trademark.

## References

- **Human Interface Guidelines:** [Siri](https://developer.apple.com/design/human-interface-guidelines/siri)
- **Human Interface Guidelines:** [Snippets](https://developer.apple.com/design/human-interface-guidelines/snippets)
- **Documentation:** [App Intents](https://developer.apple.com/documentation/appintents)

## See also

- `hig-snippets` for designing the compact confirmation and result views that
  Siri, Spotlight, and Shortcuts display when an intent runs.
- `app-intents` — the code skill that implements the intents, entities, app
  schemas, view annotations, and donations this skill decides on.
- The widgets and controls design skills for other surfaces the same App
  Intents definitions can power.
