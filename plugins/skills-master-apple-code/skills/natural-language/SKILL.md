---
name: natural-language
description: "Use when analyzing or understanding text on-device with Apple's Natural Language framework: tokenizing, lemmatizing, tagging parts of speech, recognizing named entities, identifying language, computing word/sentence embeddings and similarity, running custom Create ML classifiers, or scoring sentiment, all without a network call."
---

# Natural Language

## When to use

Reach for Natural Language when you need lightweight, fully on-device text understanding: splitting text into words or sentences, finding lemmas and parts of speech, pulling out people/places/organizations, detecting the dominant language, measuring semantic similarity, or scoring sentiment. It is the right tool when latency, privacy, and offline operation matter more than the open-ended reasoning of a large language model. For generative or summarization tasks, prefer the Foundation Models framework instead.

## Core guidance

- Do reuse a single `NLTagger` per scheme and reset its `string` for each input; tagger setup is the expensive part, not tagging.
- Do set `tagger.setLanguage(_:range:)` when you already know the language so the model skips its own detection and stays accurate on short strings.
- Do enumerate with `enumerateTags(in:unit:scheme:options:)` and pass `.omitWhitespace`, `.omitPunctuation`, and `.joinNames` to get clean, merged tokens.
- Don't treat sentiment as a label: `.sentimentScore` returns a string you parse into a `Double` from `-1.0` (negative) to `1.0` (positive), evaluated per `.paragraph`.
- Don't assume embeddings exist everywhere: `NLEmbedding.wordEmbedding(for:)` and `sentenceEmbedding(for:)` cover only a fixed set of languages and return `nil` otherwise, so guard the optional.
- Prefer `NLContextualEmbedding` (iOS 17+, transformer-based, multilingual) for richer semantic vectors, but call `load()` first and handle the downloadable asset not being present yet.
- Wrap a Create ML `.mlmodel` in `NLModel` for custom classification or word tagging instead of touching Core ML directly.

```swift
let tagger = NLTagger(tagSchemes: [.lemma, .nameType])
tagger.string = "Ada Lovelace wrote algorithms in London."
let opts: NLTagger.Options = [.omitWhitespace, .omitPunctuation, .joinNames]
tagger.enumerateTags(in: tagger.string!.startIndex..<tagger.string!.endIndex,
                     unit: .word, scheme: .nameType, options: opts) { tag, range in
    if let tag, [.personalName, .placeName, .organizationName].contains(tag) {
        print(tagger.string![range], tag.rawValue)
    }
    return true
}
```

## Platform notes

- All current Apple platforms ship the framework; some assets (sentiment models, contextual embeddings) download on demand, so first use needs storage and may briefly fail offline before the asset is cached.
- No usage-description string or authorization is required — analysis runs locally and text never leaves the device, which is a key selling point versus server NLP.
- `NLContextualEmbedding` assets are large; gate `load()` behind a user action and call `presentAssetsRequest`/`requestAssets` so the system can fetch them, rather than blocking app launch.
- watchOS and tvOS support the APIs but have tighter memory budgets; favor `.word`/`.sentence` units over loading contextual-embedding models on those targets.

## Pitfalls

- Indices are `String.Index` into the tagger's current `string`; mutating or replacing the string invalidates ranges you captured from a prior pass.
- `dominantLanguage` on `NLLanguageRecognizer` can return `.undetermined` for very short or mixed text — check `languageHypotheses(withMaximum:)` and confidence before acting.
- Cosine-style "distance" from embeddings is a metric, not a probability; smaller means more similar, and scores are only comparable within the same embedding model.
- A custom `NLModel` built for classification cannot be used for word tagging (and vice versa); the `.mlmodel` type is fixed at training time in Create ML.

## References

- **Documentation:** [Natural Language](https://developer.apple.com/documentation/naturallanguage)
- **Documentation:** [NLTagger](https://developer.apple.com/documentation/naturallanguage/nltagger)
- **Documentation:** [NLContextualEmbedding](https://developer.apple.com/documentation/naturallanguage/nlcontextualembedding)
- **Sample Code:** [Identifying people, places, and organizations](https://developer.apple.com/documentation/naturallanguage/identifying-people-places-and-organizations)
- **Sample Code:** [Finding similarities between pieces of text](https://developer.apple.com/documentation/naturallanguage/finding-similarities-between-pieces-of-text)
- **WWDC:** [Explore Natural Language multilingual models (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10042/)

## See also

Pair this with the create-ml skill to train the classifiers and word taggers you load through NLModel, and with the foundation-models skill when a task needs open-ended generation rather than structured tagging. For speech-to-text input feeding these analyzers, see the speech-recognition skill.
