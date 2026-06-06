---
name: choosing-ml
description: Decision router for on-device intelligence on Android — ML Kit, Gemini Nano via AICore, LiteRT and MediaPipe, and cloud models. Use when deciding which ML or AI technology fits a feature, weighing privacy versus capability tradeoffs, evaluating device support breadth, or routing a "should this be on-device or cloud" question before writing code.
tags: [ml, ai, on-device, gemini, mlkit]
x-skills-master:
  domain: android
  class: overview
  category: overviews
  platforms: ["android", "large-screen"]
  requires: { "android": "16", "kotlin": "2.2" }
  pairs_with: [ml-kit]
  sources:
    - https://developer.android.com/ai
    - https://developers.google.com/ml-kit
  snapshot_date: "2026-06-06"
  stability: stable
  version: 1.0.0
---

## When to use

- A feature needs intelligence — image recognition, text analysis, summarization, speech, translation — and the right technology stack is undecided.
- Privacy requirements or offline constraints make sending user data to a server unacceptable or legally complicated.
- The team is debating whether to use a cloud LLM versus an on-device model and needs a structured way to evaluate the tradeoff.
- An existing ML Kit integration is being reconsidered now that Gemini Nano is available on flagship devices.
- The feature must work across a wide device range, including low-end hardware, and capability gaps need to be understood up front.

## Core guidance

Four technology tiers apply to Android ML decisions in 2026. Choose the lowest tier that satisfies the requirement; each step up adds complexity, cost, or device constraints.

### Tier 1 — ML Kit (turnkey task APIs)

ML Kit covers a focused set of high-value tasks: barcode scanning, face detection, object detection and tracking, image labeling, text recognition (OCR), digital ink recognition, pose detection, selfie segmentation, entity extraction, language identification, translation, and smart reply. All of these run entirely on device, need no model management, and support Android API 16+.

Reach for ML Kit when the task matches one of these built-in APIs. The models are Google-tuned, versioned through Play Services so they do not bloat the APK, and well-tested against production traffic. There is almost no reason to build a custom model for a use case ML Kit already covers.

### Tier 2 — Gemini Nano via AICore (on-device generative AI)

Gemini Nano is the on-device language model distributed through AICore and available on devices that meet the hardware threshold (currently Pixel 6+ and select flagships with sufficient RAM and a capable NPU). It supports summarization, structured extraction, classification, rewriting, and conversational tasks with full data privacy — prompts never leave the device.

Reach for Gemini Nano when the task is open-ended natural language reasoning that ML Kit does not cover and privacy or latency rules out a cloud call. Because availability is device-gated, always check `FeatureClient` availability and provide a graceful fallback:

```kotlin
val generativeModel = GenerativeModel(
    modelName = "gemini-nano",
    generationConfig = generationConfig { temperature = 0.7f }
)

// Check availability before calling
val availability = GenerativeAIBackend.getInstance(context).checkFeatureAvailability()
if (availability == FeatureAvailability.AVAILABLE) {
    val response = generativeModel.generateContent(prompt)
    process(response.text)
} else {
    fallbackToCloud()
}
```

Do not position Gemini Nano as a knowledge base. Like all small on-device LLMs it can hallucinate; supply grounding context in the prompt rather than relying on the model's parametric memory.

### Tier 3 — LiteRT and MediaPipe (custom and domain models)

LiteRT (formerly TensorFlow Lite) is the runtime for custom or converted models — CNNs, transformers, recommenders, domain classifiers, any model architecture that no higher-level API covers. Models run on CPU, GPU, or NNAPI/NPU acceleration. MediaPipe provides task-level solutions built on LiteRT (hand tracking, face landmark detection, image segmentation, text classification, audio classification) and can be a faster starting point than building a raw inference pipeline.

Reach for LiteRT or MediaPipe when:
- The problem domain is proprietary (e.g., detecting defects in the company's own product images).
- A pre-trained model from TensorFlow Hub, PyTorch Mobile (converted via ONNX → LiteRT), or a Kaggle competition fits the task.
- ML Kit does not cover the task and the feature must work below the Gemini Nano hardware threshold.
- Fine-grained control over latency, quantization, or model versioning is required.

Quantize models (INT8 or FP16) before shipping. A 100 MB float32 model is impractical for APK distribution; use dynamic-range or full-integer quantization and measure accuracy impact before releasing.

### Tier 4 — Cloud model (Gemini Pro/Ultra, Vertex AI, or third-party LLM)

Move to a cloud model when:
- The task genuinely requires frontier capability (complex multi-step reasoning, code generation, long-context summarization of documents longer than a few thousand tokens).
- On-device options cannot meet accuracy requirements and the user has network access.
- The device population is too fragmented to rely on Gemini Nano availability.

Cloud calls carry per-request cost, require network access, and send user data off device — obtain appropriate consent and model your costs before committing. Streaming responses via Server-Sent Events are preferable to blocking for perceived latency.

### Decision summary

| Signal | Recommended tier |
|---|---|
| Task matches a built-in ML Kit API | ML Kit |
| Open-ended NLP, flagship-targeted feature, privacy required | Gemini Nano via AICore |
| Proprietary domain, custom model, wide device range | LiteRT / MediaPipe |
| Frontier capability needed, network available, cost acceptable | Cloud model |
| All tiers, offline fallback needed | ML Kit or LiteRT as fallback |

## Platform notes

- **Device support breadth** is the most consequential axis. ML Kit runs on API 16+ and nearly any Android device. Gemini Nano requires capable NPU hardware with sufficient RAM — coverage in 2026 is meaningful on flagships but not universal. LiteRT runs broadly but performance scales with hardware. If the app targets mass-market devices including low-end, ML Kit and LiteRT are more appropriate than relying on Gemini Nano.
- **Large screens and foldables** — ML and AI features work identically across form factors; the relevant question is UI integration. MediaPipe camera tasks need viewport-aware coordinate mapping when the app is in multi-window mode on a foldable.
- **APK size** — ML Kit models are distributed via Play Services (zero APK cost). LiteRT models ship in the APK or are downloaded on first use via Play Feature Delivery; plan for the latter when the model exceeds ~20 MB. Gemini Nano is device-resident through AICore and has no APK cost.
- **NNAPI and GPU delegates** — LiteRT delegates must be tested on the actual device SKUs in the target market; delegate availability and performance vary significantly by chipset vendor and Android version. Always have a CPU fallback path.
- **Privacy regulations** — on-device inference (ML Kit, Gemini Nano, LiteRT) keeps data local and simplifies GDPR/CCPA data-flow documentation. Cloud calls require explicit disclosure. This can be a forcing function for on-device even when cloud accuracy would be higher.

## Pitfalls

- **Skipping the ML Kit check** — reaching for LiteRT or a cloud model for tasks like barcode scanning, text recognition, or language ID when ML Kit already covers them. ML Kit is the fastest path and avoids model management entirely.
- **Assuming Gemini Nano availability** — shipping a feature that silently fails or crashes when AICore is unavailable. Always check availability and design the fallback first, not as an afterthought.
- **Shipping unquantized LiteRT models** — a float32 model that passed offline accuracy benchmarks may be too large or too slow on real devices. Quantize early and benchmark on representative low-end hardware.
- **Treating on-device LLMs as fact sources** — Gemini Nano is small by design. It is good at language tasks over provided context, not at recalling facts. Prompts should carry the necessary context rather than asking the model to "know" things.
- **Ignoring NNAPI delegate fragmentation** — a model that runs in 30 ms on a Pixel may run in 300 ms on a mid-range MediaTek device if the NNAPI delegate is unavailable or underperforms. Always measure on the tail of your device matrix.
- **Blocking the main thread with inference** — all inference calls, regardless of tier, must run on a background dispatcher (`Dispatchers.Default` or a dedicated `Executor`). ML Kit and AICore APIs are async by default; LiteRT inference is synchronous and must be moved off the main thread explicitly.
- **Conflating MediaPipe Tasks with raw LiteRT** — MediaPipe Solutions provide a task-level API that handles pre/post-processing; using raw LiteRT for the same task requires reimplementing that logic and is more error-prone. Prefer MediaPipe Tasks when a solution exists.

## References

- **Developer Guide:** [Android AI and Machine Learning](https://developer.android.com/ai)
- **Developer Guide:** [ML Kit for Android](https://developers.google.com/ml-kit)

## See also

For hands-on integration of ML Kit task APIs, see `core-ml` (structural parallel on the Apple side) and the Android-specific `android-on-device-ml` code skill. For LiteRT model conversion and quantization workflows, see `liteRT-custom-models`. For Gemini Nano prompt design and AICore setup, see `gemini-nano-aicore`. For privacy framing and data-flow documentation, see `android-privacy-manifests`.
