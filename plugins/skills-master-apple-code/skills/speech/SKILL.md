---
name: speech
description: Guidance for speech-to-text and text-to-speech on Apple platforms using the Speech and AVFAudio frameworks. Use when transcribing microphone or file audio with SpeechAnalyzer/SpeechTranscriber or SFSpeechRecognizer, handling speech and microphone authorization, streaming audio buffers, or synthesizing spoken output with AVSpeechSynthesizer including Personal Voice.
---

## When to use

Reach for this skill when an app converts spoken audio into text (dictation, captions, voice commands, meeting notes) or speaks text aloud (reading assistants, accessibility, navigation prompts). On the "26" OS cycle, prefer the new `SpeechAnalyzer` pipeline with `SpeechTranscriber` for long-form, fully on-device transcription; fall back to `SFSpeechRecognizer` when you must support iOS 17/18 or need its custom-vocabulary contextual strings. For spoken output, use `AVSpeechSynthesizer`.

## Core guidance

- Do request both authorizations up front: `SFSpeechRecognizer.requestAuthorization` (or analyzer model access) and `AVAudioApplication.requestRecordPermission`. Never start audio capture before both return granted.
- Do add usage strings: `NSSpeechRecognitionUsageDescription` and `NSMicrophoneUsageDescription` are mandatory; the app crashes at the prompt without them.
- Prefer `SpeechAnalyzer` + `SpeechTranscriber` on the 26 cycle for accuracy and offline operation; ensure the locale model is present via `AssetInventory` before analyzing, since first use may need a download.
- Do feed the analyzer an `AsyncStream` of `AnalyzerInput` and read `transcriber.results` as an async sequence; each result carries `text` as `AttributedString` and an `isFinal` flag. Use `[.volatileResults]` reporting for live partials.
- Don't assume server recognition. Set `requiresOnDeviceRecognition = true` on `SFSpeechAudioBufferRecognitionRequest`, but first check `recognizer.supportsOnDeviceRecognition`; otherwise audio leaves the device.
- Do drive capture from `AVAudioEngine`: `installTap` on the input node, convert to the request's format, and `append` buffers. Remove the tap and finalize when done.
- Don't block the main actor. The analyzer and synthesizer expose async APIs; keep buffer handling off the UI thread and publish text back on `@MainActor`.

```swift
let transcriber = SpeechTranscriber(locale: .current,
                                    reportingOptions: [.volatileResults])
let analyzer = SpeechAnalyzer(modules: [transcriber])
let (stream, continuation) = AsyncStream.makeStream(of: AnalyzerInput.self)
try await analyzer.start(inputSequence: stream)
Task {
    for try await result in transcriber.results where result.isFinal {
        await store.append(String(result.text.characters))
    }
}
// feed continuation.yield(AnalyzerInput(buffer:)) from your audio tap
```

## Platform notes

- The `SpeechAnalyzer`/`SpeechTranscriber` pipeline requires the 26 OS cycle (iOS/iPadOS 26, macOS 26, visionOS 26); guard it with `if #available` and keep `SFSpeechRecognizer` as the fallback for iOS 17-18.
- `SFSpeechRecognizer` on-device support varies by locale and chip; always check `supportsOnDeviceRecognition` per recognizer locale rather than assuming.
- Personal Voice (`AVSpeechSynthesizer.requestPersonalVoiceAuthorization`) is iPhone/iPad/Mac only and only surfaces voices the user created and shared on that device.
- On visionOS, capture audio through `AVAudioEngine` as elsewhere, but verify microphone availability and respect immersive-space audio session rules.

## Pitfalls

- Forgetting to configure the `AVAudioSession` category (e.g. `.record` or `.playAndRecord`) before starting the engine, causing silent or failed capture.
- Reusing one `SFSpeechRecognitionRequest`/task across utterances; create a fresh request per session and call `endAudio` to flush.
- Treating volatile partial results as final text; only `isFinal` results are stable, and partials can be replaced.
- Allocating an `AVAudioFile` inside the `AVSpeechSynthesizer.write` callback; the closure fires repeatedly, so create the file once outside it.
- Assuming a downloaded transcription model exists; check `installedLocales` and trigger an `AssetInventory` installation request when missing.
- Holding a strong reference cycle to the synthesizer in its delegate, leaking the engine and audio resources.

## References

- **Documentation:** [SpeechAnalyzer](https://developer.apple.com/documentation/speech/speechanalyzer)
- **Documentation:** [SFSpeechRecognizer](https://developer.apple.com/documentation/speech/sfspeechrecognizer)
- **Documentation:** [AVSpeechSynthesizer](https://developer.apple.com/documentation/avfaudio/avspeechsynthesizer)
- **Documentation:** [Asking Permission to Use Speech Recognition](https://developer.apple.com/documentation/speech/asking-permission-to-use-speech-recognition)
- **WWDC:** [Bring advanced speech-to-text to your app with SpeechAnalyzer (WWDC25)](https://developer.apple.com/videos/play/wwdc2025/277/)
- **WWDC:** [Extend Speech Synthesis with personal and custom voices (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10033/)

## See also

Pair this with an audio-session skill for configuring `AVAudioSession` categories around capture and playback, and with a permissions/privacy skill for presenting authorization prompts and Info.plist usage strings. For surfacing live captions in the UI, combine with a SwiftUI text-presentation skill.
