---
name: core-ai
description: "Use when shipping your own neural or generative model on-device with the Core AI framework (iOS 27): converting a PyTorch model to the .aimodel format, specializing and caching it for the current device with AIModel and AIModelCache, compiling ahead of time with the coreai-build tool, running inference through InferenceFunction with NDArray inputs, encoding async work onto a ComputeStream, or bridging a custom LLM into a Foundation Models session. Triggers on import CoreAI, AIModel, AIModelAsset, InferenceFunction, NDArray, ComputeStream, or .aimodel/.aimodelc assets."
license: MIT
metadata:
  version: "1.0.0"
  snapshot-date: "2026-08-25"
---

> **Emerging** — this covers an API that was pre-1.0, newly shipped, or still moving as of 2026-08-25. Treat the specifics as provisional and confirm against current documentation before relying on them.

## When to use

Core AI (new in the 27 cycle) is the bring-your-own-model runtime for Apple
silicon: a memory-safe Swift API that loads, specializes, and runs neural and
generative models entirely on-device — compact vision models up to large
LLMs — with AOT compilation, fine-grained memory control, and stateful
execution. It sits between Foundation Models and Core ML in the decision tree:
use **Foundation Models** when Apple's system model covers the task (no model
to ship at all); use **Core AI** when you ship your own specialized neural
model and want the OS to handle device-specific compilation and execution; use
**Core ML** for non-neural models (decision trees, tabular pipelines) and for
existing `.mlpackage` pipelines on pre-27 deployment targets. Undecided? Start
with the choosing-ml-approach skill.

## Core guidance

- **Do** convert models with the Core AI PyTorch extensions (`coreai-torch`)
  into the `.aimodel` format, and run the Core AI optimization tooling
  (quantization/compression) at conversion time, not in the app.
- **Do** compile ahead of time: the `coreai-build` command-line tool and the
  Xcode build integration produce device-ready compiled artifacts
  (`.aimodelc`), cutting first-launch specialization from a heavy one-time
  cost to a fast load.
- **Do** specialize once and cache: `AIModel.specialize(contentsOf:options:cache:cachePolicy:)`
  with an `AIModelCache` stores the device-specialized artifact; persist
  `bookmarkData` and reload with `init(resolvingBookmark:)` so later launches
  skip the work entirely.
- **Do** treat `AIModel` as cheap and `InferenceFunction` as the heavy object:
  the model handle owns no weights — the function you get from
  `loadFunction(named:)` owns weights and intermediate buffers. Load the
  functions you need, keep them alive while inferring, release them to
  reclaim memory.
- **Do** inspect `functionNames` and `functionDescriptor(for:)` instead of
  hard-coding tensor shapes; the descriptor declares each function's inputs,
  outputs, and states.
- **Do** drive generative/stateful models through the `states` parameter of
  `run(inputs:states:outputViews:)` — that is where recurrent state such as a
  KV cache lives between steps — and use `encode(... to: ComputeStream)` to
  queue async work without blocking.
- **Don't** re-specialize per launch or per inference; specialization is the
  expensive step the cache exists to amortize.
- **Don't** port a working Core ML pipeline just because Core AI is newer —
  Core AI raises the floor to the 27 OS cycle, and Apple still routes
  non-neural models to Core ML.

```swift
import CoreAI

// AOT-compiled artifact shipped in the bundle, or specialize + cache on device.
let model = try await AIModel(contentsOf: modelURL)

guard let generate = model.loadFunction(named: "generate"),
      let signature = model.functionDescriptor(for: "generate") else { return }
// signature describes the NDArray inputs, outputs, and states to provide;
// then run steps with generate.run(inputs:states:outputViews:).
```

An `InferenceFunction` is `Sendable` and can be run from multiple tasks
concurrently; it allocates extra intermediate buffers as needed, so measure
memory if you fan out.

## Platform notes

- **Availability:** iOS/iPadOS/macOS/tvOS/visionOS/watchOS 27 across the
  board — there is no back-deployment story, so apps supporting 26 or earlier
  need a Core ML (or server) fallback path behind `if #available`.
- **Hardware:** execution spans CPU, GPU, and Neural Engine
  (`ComputeUnitKind`); specialization tailors the artifact to the current
  device's architecture (`AIModel.deviceArchitectureName`), which is why
  specialized artifacts are cached per device rather than shipped universally.
- **Foundation Models bridge:** a Core AI language model can back a
  `LanguageModelSession` via the Foundation Models provider protocols
  (`LanguageModel` / `LanguageModelExecutor`), so app code keeps the
  high-level session, guided-generation, and tool-calling API while your own
  model runs underneath.
- **Tooling:** the Core AI debug gauge and instrument in Xcode plus the
  Core AI Debugger app cover numeric debugging and performance inspection;
  profile there before hand-tuning memory.

## Pitfalls

- Shipping a raw `.aimodel` and eating full on-device specialization at first
  launch when `coreai-build` could have compiled it at build time.
- Letting the specialization cache grow unbounded across model updates —
  configure `AIModelCache` and a cache policy deliberately, and prune
  artifacts for model versions you no longer ship.
- Holding every `InferenceFunction` in memory "just in case": weights live in
  the function, so unused loaded functions are pure memory overhead —
  particularly on visionOS and older iPhones with tight budgets.
- Ignoring the `states` views for an autoregressive model and re-feeding the
  whole sequence each step, turning linear generation into quadratic work.
- Assuming a big LLM that runs on an M-series Mac fits every eligible device;
  memory headroom varies widely, so validate per device class and keep a
  smaller variant or cloud fallback.
- Hand-rolling tensor conversion into `NDArray` without checking the
  descriptor's expected scalar type and memory layout — shape-compatible but
  layout-wrong inputs fail (or worse, silently degrade).

## References

- **Documentation:** [Core AI](https://developer.apple.com/documentation/CoreAI)
- **Documentation:** [AIModel](https://developer.apple.com/documentation/coreai/aimodel)
- **Documentation:** [InferenceFunction](https://developer.apple.com/documentation/coreai/inferencefunction)
- **WWDC:** [Meet Core AI (WWDC26)](https://developer.apple.com/videos/play/wwdc2026/324/)
- **WWDC:** [Dive into Core AI model authoring and optimization (WWDC26)](https://developer.apple.com/videos/play/wwdc2026/325/)
- **WWDC:** [Integrate on-device AI models into your app using Core AI (WWDC26)](https://developer.apple.com/videos/play/wwdc2026/326/)

## See also

Decide between the three runtimes with the choosing-ml-approach skill. The
foundation-models skill covers the system-model path and the session API a
Core AI language model can plug into; the core-ml skill covers the classic
`.mlpackage` runtime you fall back to on pre-27 targets and for non-neural
models.
