---
name: gemini-nano-aicore
description: On-device generative AI with Gemini Nano via AICore and the ML Kit GenAI APIs — summarization, proofreading, rewrite, and image description on Android 16+. Use when integrating on-device text or image intelligence into an Android app without sending user data to a server, when choosing between on-device Gemini Nano and a cloud model, or when checking capability availability before invoking an AICore feature.
---

## When to use

Apply this guidance when:

- A feature requires text summarization, grammar/style proofreading, tone rewrite, or natural-language image description and user data must remain on device.
- Latency, offline operation, or privacy constraints make a cloud model unsuitable.
- The target device runs Android 16+ and you need to determine whether Gemini Nano is available before calling any GenAI API.
- You want to compare on-device versus cloud trade-offs for a specific intelligence task. For the broader decision across all Android ML approaches, defer to the `choosing-ml` overview skill.

## Core guidance

**Understand the stack**
- AICore is the Android system service that hosts and manages Gemini Nano on eligible devices. Apps never load the model weights themselves — they interact via the ML Kit GenAI APIs.
- The ML Kit GenAI APIs (`com.google.android.gms:play-services-tasks` + `com.google.mlkit:genai-*` artifacts) are the primary integration surface. Four first-party tasks ship: `Summarization`, `Proofreading`, `Rewriting`, and `ImageDescription`.
- All inference runs in-process on the Neural Processing Unit (NPU) or GPU. There is no network call; latency and throughput are bounded by device silicon.

**Always check availability before use**
- Call `GenerativeModel.getInstance(context, featureConfig).availability` (a suspend function returning `Availability`) before downloading or invoking any feature.
- `Availability.AVAILABLE` means the model is ready. `AVAILABLE_AFTER_DOWNLOAD` means the model exists but must be downloaded first (call `GenerativeModel.prepareFeature()`). `NOT_SUPPORTED` means the device cannot run this feature at any time.
- Do not swallow `NOT_SUPPORTED` silently; always design a graceful fallback path (cloud call, heuristic, or UI affordance removal).
- Cache the availability result in the ViewModel for the session. Re-checking on every inference adds latency with no benefit.

**Use `prepareFeature()` before first inference on eligible devices**
- When availability is `AVAILABLE_AFTER_DOWNLOAD`, call `prepareFeature()` to trigger model download. This is a suspend function; call it from a coroutine and show progress UI.
- Do not call `prepareFeature()` from the main thread or in composition. Launch from a `ViewModel` using `viewModelScope`.

**Invoke the right task API**
- Use `SummarizationSession` for long-form text (articles, documents). Provide `SummarizationConfig` to control output length.
- Use `ProofreadingSession` for grammar and style corrections; the response includes a corrected version and per-edit reasons.
- Use `RewritingSession` with a `RewritingStyle` enum (e.g., `ELABORATE`, `SHORTEN`, `EMOJIFY`) for tone and length rewrites.
- Use `ImageDescriptionSession` with a `Bitmap` input to get a natural-language description suitable for accessibility alt text or search indexing.
- All sessions are single-use: call `execute(request)` once, collect the streaming response via `collect { }`, then let the session go out of scope. Sessions are not thread-safe and must not be shared across coroutines.

**Stream responses for better perceived performance**
- Every session returns a `Flow<String>` from `execute()`. Collect incrementally and append tokens to a `StateFlow<String>` in the ViewModel so the UI updates live.
- Avoid `toList()` or `last()` shortcuts on the flow unless the entire latency is acceptable — streaming is the intended usage model.

**Scope resource management carefully**
- `GenerativeModel` instances are lightweight handles; create them once per ViewModel and reuse.
- Close session objects (they implement `Closeable`) if the coroutine is cancelled mid-stream to avoid holding NPU resources.

```kotlin
@HiltViewModel
class SummarizeViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
) : ViewModel() {

    private val _summaryState = MutableStateFlow<SummaryUiState>(SummaryUiState.Idle)
    val summaryState: StateFlow<SummaryUiState> = _summaryState.asStateFlow()

    private val model = GenerativeModel.getInstance(
        context,
        SummarizationConfig.Builder()
            .setOutputLength(SummarizationConfig.OutputLength.SHORT)
            .build()
    )

    fun checkAvailability() {
        viewModelScope.launch {
            _summaryState.value = when (model.availability()) {
                Availability.AVAILABLE -> SummaryUiState.Ready
                Availability.AVAILABLE_AFTER_DOWNLOAD -> {
                    model.prepareFeature()
                    SummaryUiState.Ready
                }
                else -> SummaryUiState.NotSupported
            }
        }
    }

    fun summarize(text: String) {
        viewModelScope.launch {
            _summaryState.value = SummaryUiState.Running("")
            val session = model.createSession()
            try {
                session.execute(SummarizationRequest(text))
                    .collect { token ->
                        val current = (_summaryState.value as? SummaryUiState.Running)?.partial ?: ""
                        _summaryState.value = SummaryUiState.Running(current + token)
                    }
                val finished = (_summaryState.value as? SummaryUiState.Running)?.partial ?: ""
                _summaryState.value = SummaryUiState.Done(finished)
            } finally {
                session.close()
            }
        }
    }
}

sealed interface SummaryUiState {
    data object Idle : SummaryUiState
    data object Ready : SummaryUiState
    data object NotSupported : SummaryUiState
    data class Running(val partial: String) : SummaryUiState
    data class Done(val text: String) : SummaryUiState
}
```

**On-device vs. cloud decision guide**
- Prefer on-device when: user content is sensitive (notes, health, finance), the UX requires offline support, the task fits one of the four first-party APIs, and response quality is sufficient.
- Prefer cloud when: the task requires broad world knowledge, multi-turn conversation, code generation, multilingual output beyond English, or the device does not support Gemini Nano.
- Consider a hybrid: run the availability check at startup, use Gemini Nano when available, fall back to a cloud endpoint transparently.

## Platform notes

- AICore and the ML Kit GenAI APIs require Android 16 (API 36). The device must also meet hardware criteria (NPU, sufficient RAM). Eligible device lists are maintained by Google Play Services.
- On foldables and large-screen devices, the app may run simultaneously in multiple windows. Keep `GenerativeModel` instances ViewModel-scoped, not Activity-scoped, to avoid creating duplicate NPU sessions per window.
- Gemini Nano is managed and updated by Google Play Services, not bundled in the APK. The on-device model version can change between Play Services updates; do not hard-code any assumptions about capability version.
- On tablets with dedicated NPUs (e.g., flagship Pixel Tablet), inference throughput is noticeably higher. Design streaming UI to handle both fast (full sentence per tick) and slow (token per tick) response rates.

## Pitfalls

- Calling any `GenerativeModel` or session API on the main thread — all capability checks and inference calls are suspending and must run on a background dispatcher.
- Ignoring `AVAILABLE_AFTER_DOWNLOAD` and calling `execute()` anyway — this throws an `IllegalStateException`. Always call `prepareFeature()` first and await its completion.
- Reusing a session across multiple `execute()` calls — sessions are single-use. Creating a new session per request is the correct pattern.
- Collecting the response flow with a blocking call (`runBlocking`, `toList()`) from the UI thread — this produces ANRs under slow inference.
- Treating Gemini Nano as a general knowledge base. The on-device model is tuned for the four task APIs with app-supplied context. It cannot reliably answer open-domain factual queries.
- Forgetting to `close()` sessions when a coroutine is cancelled — this holds NPU memory. Wrap `execute()` in a `try/finally` and close in the `finally` block.
- Requesting `prepareFeature()` on every screen entry instead of checking availability once per ViewModel — repeated download triggers waste bandwidth on metered connections.
- Confusing AICore with Firebase Vertex AI or the Gemini API — these are distinct products with separate SDKs, authentication, and pricing. AICore runs entirely on device with no API key.

## References

- **Documentation:** [Gemini Nano on Android](https://developer.android.com/ai/gemini-nano)
- **Documentation:** [Android AI overview](https://developer.android.com/ai)

## See also

For deciding between Gemini Nano, ML Kit task APIs, and cloud models at a feature-scoping stage, see `choosing-ml`. For integrating camera or image capture pipelines that feed bitmaps into `ImageDescriptionSession`, see `camerax-capture`. For exposing AI inference results as App Actions or voice shortcuts, see `app-actions`. For coroutine and Flow patterns used throughout this skill, see `kotlin-coroutines-flow`.
