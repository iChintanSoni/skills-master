---
name: foundation-models
description: "Use when building on-device LLM features with the Foundation Models framework: prompting the system language model through LanguageModelSession, producing type-safe Swift output with the Generable macro and guided generation, adding tool calling, streaming partial responses, checking SystemLanguageModel availability, or adopting the iOS 27 additions — multimodal image prompts, Dynamic Profiles, Private Cloud Compute, and third-party model providers. Triggers on import FoundationModels, LanguageModelSession, Generable, Guide, SystemLanguageModel, or PrivateCloudComputeLanguageModel."
globs:
  - "**/*.swift"
tags: [apple-intelligence, generative-ai]
x-skills-master:
  domain: apple
  class: code
  category: app-services
  platforms: [ios, ipados, macos, visionos]
  requires:
    ios: "26"
    swift: "6.0"
  pairs_with: [choosing-ml-approach, core-ai]
  sources:
    - https://developer.apple.com/documentation/foundationmodels
    - https://developer.apple.com/documentation/foundationmodels/languagemodelsession
    - https://developer.apple.com/documentation/foundationmodels/systemlanguagemodel
  snapshot_date: "2026-08-25"
  stability: emerging
  version: 1.0.0
---

## When to use

Reach for Foundation Models when a feature needs open-ended language work over
app-provided content: summarization, extraction, classification, rewriting,
itinerary/plan generation, or tool-calling agents. The framework exposes
Apple's on-device model with no server, no per-token cost, and data that never
leaves the device by default. Do **not** use it as a general knowledge base
(the on-device model is small and hallucinates facts), for tasks a dedicated
framework already solves (Vision, Natural Language, Speech), or when you ship
your own trained model — that is Core AI (generative/neural, iOS 27) or
Core ML territory. If you have not picked an approach yet, start with the
choosing-ml-approach skill.

## Core guidance

- **Do** gate every entry point on `SystemLanguageModel.default.availability`
  and design the `.unavailable(reason)` path first — the model requires an
  Apple Intelligence-capable device with the feature enabled, so a meaningful
  fraction of your installed base will never have it.
- **Do** define output as a `@Generable` struct and pass it via
  `respond(to:generating:)` instead of parsing free-form text. Guided
  generation constrains decoding to your schema, so the result arrives as a
  typed Swift value; add `@Guide(description:)` to steer individual properties.
- **Do** put durable behavior ("you are…", tone, rules) in `Instructions` at
  session init and keep per-turn content in the prompt. A `LanguageModelSession`
  carries its whole transcript into every call — reuse one session for a
  conversation, start a fresh one for an unrelated task.
- **Do** use `streamResponse(to:)` for anything user-visible; on-device
  generation is not instant, and streaming partial output keeps the UI alive.
  Call `prewarm(promptPrefix:)` when a generation UI becomes likely.
- **Do** conform to `Tool` to let the model fetch live app data or trigger
  actions instead of stuffing everything into the prompt — the model decides
  when to call, and `ToolCallError` surfaces your tool's failures.
- **Don't** ignore `LanguageModelError.contextSizeExceeded(_:)`. The context
  window is fixed and the transcript grows every turn; catch it and recover by
  condensing the transcript into a summary and seeding a new session.
- **Don't** fire concurrent requests at one session — check `isResponding`
  before submitting, and serialize turns per session.
- **Don't** ship prompts untested against guardrails: safety filtering can
  refuse harmless-looking input, so handle refusals as a normal outcome.

```swift
import FoundationModels

@Generable
struct TripPlan {
    @Guide(description: "A short, catchy trip title")
    var title: String
    var days: [String]
}

guard case .available = SystemLanguageModel.default.availability else { return }
let session = LanguageModelSession(
    instructions: Instructions("You plan realistic weekend trips.")
)
let plan = try await session.respond(
    to: "Two days in Kyoto, temples and food",
    generating: TripPlan.self
)
show(plan.content)   // typed TripPlan, no string parsing
```

### iOS 27 (WWDC 2026)

- **Multimodal prompting:** attach images to prompts via `Attachment` and
  reason over them; the transcript tracks them with `ImageReference`.
- **Dynamic Profiles:** `LanguageModelSession.Profile` and the `DynamicProfile`
  protocol swap instructions, tools, and models mid-conversation based on app
  state, instead of rebuilding sessions by hand.
- **Private Cloud Compute:** `PrivateCloudComputeLanguageModel` runs a larger
  Apple model server-side with PCC's stateless, non-loggable privacy
  guarantees — same session API, bigger context. Requires the
  `com.apple.developer.private-cloud-compute` entitlement (initially gated to
  smaller apps), so treat it as a capability to request, not assume.
- **Third-party and custom providers:** the `LanguageModel` and
  `LanguageModelExecutor` protocols let a session run against cloud models or
  a model you ship yourself — including a Core AI model — keeping one session
  API across providers.

## Platform notes

- **Floors:** iOS/iPadOS/macOS/visionOS 26 for the core API; watchOS joins in
  the 27 cycle. Everything WWDC26 introduced (multimodal, profiles, PCC,
  providers) is 27-era — gate with `if #available` when your target is 26.
- **Hardware:** on-device inference needs Apple Intelligence-supported
  hardware even on a new OS; availability reports `.deviceNotEligible`-style
  reasons, so never infer eligibility from the OS version alone.
- **Privacy:** on-device runs require no entitlement or usage string; PCC is
  the only variant that leaves the device and is designed so Apple cannot read
  request content — still disclose cloud processing in your privacy story.

## Pitfalls

- Treating the model as an oracle: without grounding data from your app (or a
  `Tool`), factual questions produce fluent, confident nonsense.
- Checking availability once at launch and caching it — Apple Intelligence can
  be toggled or become ready later; re-check at the feature entry point.
- Letting a long-lived session grow until `contextSizeExceeded` fires in
  production instead of proactively summarizing history.
- Blocking the UI on a full `respond(to:)` round trip where
  `streamResponse(to:)` was the right call.
- Prompt-engineering stringly-typed JSON out of the model when `@Generable`
  guarantees the schema for free.
- Assuming model behavior is stable across OS updates — Apple revises the
  system model; re-run your prompt evaluations each cycle.

## References

- **Documentation:** [Foundation Models](https://developer.apple.com/documentation/foundationmodels)
- **Documentation:** [LanguageModelSession](https://developer.apple.com/documentation/foundationmodels/languagemodelsession)
- **Documentation:** [SystemLanguageModel](https://developer.apple.com/documentation/foundationmodels/systemlanguagemodel)
- **WWDC:** [Meet the Foundation Models framework (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/286/)
- **WWDC:** [What's new in the Foundation Models framework (WWDC26)](https://developer.apple.com/videos/play/wwdc2026/241/)
- **WWDC:** [Build with the new Apple Foundation Model on Private Cloud Compute (WWDC26)](https://developer.apple.com/videos/play/wwdc2026/319/)

## See also

Route the "which ML technology" decision through the choosing-ml-approach
skill before committing here. When you ship your own specialized model rather
than Apple's, the core-ai skill covers loading and running it on-device — and
its models can plug back into a Foundation Models session via the provider
protocols above.
