---
name: app-functions
description: "Use when making app features invocable by AI assistants and on-device agents: annotating Kotlin functions with @AppFunction, serving them through Android's on-device Model Context Protocol so Gemini can discover and execute them against local app state, or choosing between AppFunctions and the older App Actions path."
license: MIT
metadata:
  version: "1.0.1"
  snapshot-date: "2026-08-25"
---

> **Emerging** — this covers an API that was pre-1.0, newly shipped, or still moving as of 2026-08-25. Treat the specifics as provisional and confirm against current documentation before relying on them.

## When to use

Reach for AppFunctions (introduced with Android 17; the Jetpack library is in alpha) when you want an AI assistant or on-device agent to *do things* in your app — create a note, start a workout, add an item to a cart — rather than merely deep-link into a screen. It is the successor model to App Actions/BIIs: instead of mapping natural language onto a fixed catalog of built-in intents, you publish typed functions that agents discover and orchestrate through Android's on-device Model Context Protocol implementation. Stay on App Actions for shipping Assistant integrations; adopt AppFunctions for new agent-facing capability surface, accepting alpha-stage API churn.

## Core guidance

- Expose a capability by annotating a Kotlin function with `@AppFunction` and documenting it with a KDoc comment. The build generates the registration and serving code; the KDoc is not decoration — it is the description agents use to decide when to call the function, so write it like a good tool description: what it does, when to use it, what each parameter means.
- Design functions the way you would design a public API for an untrusted caller: small, single-purpose, explicitly parameterized, returning structured results. An agent composing three narrow functions beats one mega-function with modal flags.
- Functions run against the app's local state — treat every invocation as unauthenticated user intent: enforce the same validation, permission checks, and confirmation flows the equivalent in-app UI would perform. Do not expose destructive operations without an in-app confirmation step.
- Keep function signatures and semantics stable once shipped; agents and the system index them, and silent behavior changes break orchestrated workflows the user has come to rely on.
- Test with the tooling Google ships: a test agent app and adb commands exercise your functions without a full assistant loop, and the official agent skill (github.com/android/skills — `on-device/appfunctions`) accelerates coding-agent-driven adoption.
- Expect the surface to move: the library is alpha and enrolment for full assistant integration runs through Google's early-access program. Gate your integration behind a version catalog entry you can bump quickly.

## Platform notes

- **Android 17 (API 37)** is the platform floor; the serving path is the OS's on-device MCP implementation, so there is no Play Services dependency for the transport.
- **Assistant reach:** Gemini is the first consumer; the MCP framing means other agents (including development-time coding agents) can target the same functions.
- **Relationship to App Intents (Apple):** conceptually parallel to Apple's App Intents + App Schemas — if you maintain both platforms, design the capability inventory once and express it in both systems.

## Pitfalls

- **Writing throwaway KDoc** — a vague description means agents either never call your function or call it wrongly. The description is the trigger; invest in it like UI copy.
- **Exposing UI flows instead of capabilities** — "openCheckoutScreen()" forces the agent through your navigation; "addToCart(itemId, quantity)" lets it act. Expose the action, not the screen.
- **Skipping validation because "only the system calls this"** — orchestrated calls arrive with model-generated arguments; validate as strictly as a web endpoint.
- **Porting the entire BII catalog mechanically** — BIIs were constrained by the built-in intent vocabulary; AppFunctions are not. Redesign the surface around what your app can actually do.
- **Shipping load-bearing features on the alpha library without an escape hatch** — keep the App Actions path alive for anything users depend on until the library stabilizes.

## References

- **Android 17 announcement (AppFunctions section):** [https://android-developers.googleblog.com/2026/06/Android-17.html](https://android-developers.googleblog.com/2026/06/Android-17.html)
- **Android 17 overview:** [https://developer.android.com/about/versions/17](https://developer.android.com/about/versions/17)
- **Official agent skill:** [https://github.com/android/skills](https://github.com/android/skills)

## See also

For the established Assistant surface this succeeds — App Actions, BIIs, and the shortcuts.xml capability file — see `app-actions-assistant`. For runtime permission handling inside invoked functions, see `runtime-permissions`.
