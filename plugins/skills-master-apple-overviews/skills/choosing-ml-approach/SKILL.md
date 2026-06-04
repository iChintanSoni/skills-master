---
name: choosing-ml-approach
description: Decision router for picking an on-device machine learning or AI approach on Apple platforms, covering the Foundation Models framework, Core ML, Create ML, and the task-specific Vision, Natural Language, and Speech frameworks. Use when deciding which Apple ML technology fits a feature, comparing the on-device language model against a custom Core ML model, evaluating privacy or offline constraints, or routing a "should this be ML, an LLM, or a built-in framework" question before writing code.
---

# Choosing an on-device ML approach

This skill routes a feature to the right Apple machine learning technology. It does not teach any single API in depth; it helps decide which one to reach for before any code skill applies.

## When to use

- A team is scoping an intelligence feature and needs to decide between the system language model, a custom trained model, or a ready-made framework.
- Someone is tempted to call a cloud LLM and wants to know whether an on-device option covers the requirement.
- Privacy, offline operation, latency, or App Review constraints rule out sending user data off device.
- An existing Core ML or Vision pipeline is being reconsidered now that a system language model ships in the OS.

## Core guidance

- Prefer a built-in task framework first. Vision handles image and document analysis, Natural Language handles tokenization, language identification, and embeddings, and Speech (with `SpeechAnalyzer` and `SpeechTranscriber`) handles transcription. These ship tuned models, need no training, and stay on device.
- Reach for the Foundation Models framework when the task is open-ended text reasoning, summarization, classification, extraction, or tool calling over natural language. It exposes the system on-device language model with guided generation for type-safe Swift output, so structured results need no brittle string parsing.
- Choose Core ML when a problem-specific model already exists or must be trained on proprietary data that the system frameworks do not cover, such as a domain image classifier, a recommender, or a converted PyTorch model. Core ML runs the model efficiently across CPU, GPU, and the Neural Engine.
- Use Create ML to train or fine-tune that custom Core ML model from labeled data, then ship the result through Core ML. Create ML is the training step, not the runtime.
- Do not treat the system language model as a general knowledge base. It is small, can hallucinate facts, and is built for language tasks over app-provided context, not for answering arbitrary trivia. Supply grounding data rather than relying on its memory.
- Gate language-model code on availability. The model requires an Apple Intelligence capable device with the feature enabled, so check `SystemLanguageModel.default.availability` and design a graceful fallback path.

```swift
import FoundationModels

switch SystemLanguageModel.default.availability {
case .available:
    let session = LanguageModelSession()
    let reply = try await session.respond(to: prompt)
    use(reply.content)
case .unavailable(let reason):
    fallBackToHeuristic(reason)  // older device, model not ready, etc.
}
```

## Platform notes

- The Foundation Models framework, `SpeechAnalyzer`, and the current Vision and Natural Language updates target the iOS, iPadOS, macOS, and visionOS "26" cycle. Verify the deployment target before adopting them.
- The system language model needs Apple Intelligence hardware; Core ML, Vision, Natural Language, and the classic Speech APIs run on a far wider device range, which matters when the audience includes older models.
- visionOS shares these frameworks but has tighter memory and thermal budgets, so a large custom Core ML model that is fine on a Mac may need quantization to ship on device.
- All of these approaches run on device by default, which keeps user data local, works offline, and avoids a per-request server bill; reserve any cloud model for cases the on-device options genuinely cannot meet.

## Pitfalls

- Picking a language model for a job a task framework already solves wastes battery and memory; sentiment, language detection, and entity tagging belong in Natural Language, not a prompt.
- Forgetting the availability check ships a feature that silently fails on unsupported hardware.
- Expecting deterministic output from the language model; for fixed schemas use guided generation, and still validate the result.
- Confusing Create ML with a runtime. It produces a model; Core ML executes it. Shipping the training app is not the goal.
- Assuming the on-device transcription, vision, or language models are static across OS updates. Their behavior can shift, so test against the supported OS range rather than one build.

## See also

Pair this overview with a Foundation Models adoption skill for guided generation and tool calling, a `coreml-integration` skill for converting and running custom models, and a `vision-image-analysis` or speech-transcription skill for the task frameworks. For privacy framing of on-device versus cloud, see a `privacy-on-device-processing` skill.
