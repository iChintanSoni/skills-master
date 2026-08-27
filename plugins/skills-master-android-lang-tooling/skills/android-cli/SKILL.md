---
name: android-cli
description: "Covers Android CLI 1.0 — Google's agent-facing command-line toolchain for Android development: project scaffolding (android create), project metadata (android describe), SDK package management, emulator lifecycle, APK deployment (android run), screen capture and layout inspection, knowledge-base search, agent skills installation, and the Android Studio bridge commands (analyze-file, find-declaration, find-usages, render-compose-preview, version-lookup). Use when a coding agent needs to scaffold, inspect, deploy, or visually verify an Android app from the terminal, or when deciding whether a task belongs to Android CLI, ./gradlew, or Android Studio."
license: MIT
metadata:
  version: "1.0.0"
  snapshot-date: "2026-08-25"
---

> **Emerging** — this covers an API that was pre-1.0, newly shipped, or still moving as of 2026-08-25. Treat the specifics as provisional and confirm against current documentation before relying on them.

## When to use

Reach for Android CLI (stable 1.0 since Google I/O '26) when you are operating on an Android project from a terminal — scaffolding a new app, resolving what a project builds and where its artifacts land, managing SDK packages, driving an emulator, deploying an APK, or verifying UI visually. It is built for exactly this consumer: a coding agent that needs predictable, scriptable entry points into the Android toolchain instead of parsing Studio UI or guessing Gradle task names.

It complements — never replaces — the Gradle wrapper. Compilation, testing, and packaging still run through `./gradlew`; Android CLI covers everything around the build: environment, project context, device interaction, and verification. When a task needs IDE-grade semantics (symbol resolution, inspections, Compose rendering), the `android studio` bridge subcommands delegate to a running Android Studio instance rather than reimplementing it.

---

## Core guidance

### Setup and environment

- Install and update via the platform package managers Google supports — `apt-get`, `winget`, and `homebrew` — then keep the tool current with `android update`. Run `android init` once in an agent environment: it installs the official `android-cli` skill so the agent knows the command surface.
- `android info` prints the default SDK path; override per-invocation with `--sdk=<path>` or persistently via a `~/.androidrc` file (one flag per line). Pin the SDK explicitly on machines with more than one SDK installation.
- Every command self-documents: `android <command> -h`.

### Establish project context before acting

- `android create --output=<dir> [template]` scaffolds a project (`android create list` shows templates; the default is `empty-activity-agp-9`). Use `--dry-run --verbose` to preview what a template writes before committing to it.
- On an existing project, run `android describe` first. It reports build targets and artifact output locations — use that instead of inferring module names or APK paths from directory layout.
- `android docs search '<question>'` queries the Android Knowledge Base and `android docs fetch kb://...` retrieves a specific page — prefer this over stale training knowledge for platform questions.

### SDK, emulator, deploy, verify

- Manage SDK packages with `android sdk install|list|update|remove`, using `package[@version]` syntax (`platforms/android-34@2`) and `--beta`/`--canary` for pre-release channels.
- Drive virtual devices with `android emulator create --profile=<name>` (default `medium_phone`; `--list-profiles` enumerates options), then `android emulator list`, `android emulator start <device-name>`, and `android emulator stop <serial>`.
- Deploy with `android run --apks=<paths>` after `./gradlew` produces the APK. Add `--device=<serial>` when multiple devices are attached, `--activity` to launch a specific entry point, `--debug` for debuggable deploys, and `--type` for Wear surfaces (`WATCH_FACE`, `TILE`, `COMPLICATION`).
- Close the loop visually: `android screen capture --annotate` draws numbered boxes on interactive elements, `android screen resolve --screenshot=<png> --string="input tap #5"` converts a label into real coordinates, and `android layout` dumps the live view hierarchy as JSON (`--diff` returns only what changed since the last snapshot — cheaper for iterative UI work).

```bash
./gradlew :app:assembleDebug
android run --apks=app/build/outputs/apk/debug/app-debug.apk
android screen capture --annotate --output=ui.png
android screen resolve --screenshot=ui.png --string="input tap #3"
```

### The Android Studio bridge

- `android studio check` lists running Studio instances and their open projects — always run it before any other `studio` subcommand.
- `android studio analyze-file <path>` runs the IDE inspection engine (errors, warnings, lints) on a Kotlin or Java file; `find-declaration <symbol>` and `find-usages <symbol>` give IDE-accurate cross-references (`--short` for compact output, `--context-file` to disambiguate).
- `android studio render-compose-preview <file> <composable>` renders a `@Preview` composable to PNG; `--print-semantics` adds the accessibility semantics tree as JSON — the fastest way to see a Compose change without deploying.
- `android studio version-lookup <artifacts...>` resolves current versions for Maven coordinates (`androidx.compose.ui:ui`), plugin IDs (`com.android.application`), and toolchain keywords (`agp`, `kotlin`, `gradle`). Feed the answers into `gradle/libs.versions.toml` — the catalog stays the source of truth.

### Skills and Journeys

- `android skills list`, `android skills find <string>`, and `android skills add [--all] [--agent=<name>] [--skill=<name>]` install Google's official Android skills into detected agent skill directories; `android skills remove --skill=<name>` uninstalls.
- Journeys let an agent execute natural-language user flows against the app on a device and evaluate assertions from what it sees — usable from the terminal and deployable in CI/CD for experience-level regression checks.

---

## Platform notes

- Stable 1.0 shipped May 2026 (announced at Google I/O '26); the first public release was 0.7 in April 2026. Expect the surface to keep growing — re-check `-h` output rather than assuming this list is complete.
- The `studio` subcommands require Android Studio Quail 2 Canary 1 or later, running, with Gemini in Android Studio enabled and signed in. They are a bridge to a live IDE process, not a headless library.
- Windows caveats at 1.0: the `android emulator` command is disabled, and downloading the CLI from PowerShell is not supported.
- Telemetry collects command names and non-positional options (plus predefined values like emulator profile names and agent names); it does not collect command responses, file paths, or user-created identifiers.
- Android CLI and the skills library are integrated into Google Antigravity 2.0.

---

## Pitfalls

- **Treating Android CLI as a Gradle replacement.** There is no `android build`. Compile, test, and package with `./gradlew`; use the CLI for what surrounds the build. Scripts that skip the wrapper lose the project's pinned Gradle and AGP versions.
- **Calling `android studio ...` in a headless environment.** On CI or any machine without a running Studio preview, every bridge command fails. Gate on `android studio check`, and fall back to `./gradlew lint` for inspections and Gradle dependency reports for version questions when no IDE is available.
- **Guessing project structure instead of running `android describe`.** Module names, build targets, and artifact paths vary per project; `describe` answers in one call what several wrong `./gradlew` invocations would cost.
- **Reading annotated screenshot labels as coordinates.** The numbers `screen capture --annotate` draws are labels; only `screen resolve` maps them to tappable x/y positions.
- **Passing absolute-path assumptions to `android run`.** `--apks` paths resolve relative to the current directory; agents whose working directory resets between calls should pass paths deliberately.
- **Hand-editing versions that `version-lookup` reported.** Write resolved versions into the version catalog, not inline in build scripts — the catalog remains the single source of truth for the build.
- **Assuming a stable SDK path across environments.** CI images and developer machines differ; set `--sdk` in `.androidrc` or per invocation instead of relying on the default.

---

## References

- **Documentation:** [Android CLI reference — Android Developers](https://developer.android.com/tools/agents/android-cli)
- **Documentation:** [Test with Journeys — Android Developers](https://developer.android.com/tools/agents/android-cli/journeys)
- **Documentation:** [Android skills — Android Developers](https://developer.android.com/tools/agents/android-skills)
- **Release notes:** [Android CLI release notes](https://developer.android.com/tools/agents/android-cli/release-notes)
- **Announcement:** [Android CLI stable 1.0 — Android Developers Blog](https://android-developers.googleblog.com/2026/05/android-cli-stable-1-0-agent-development.html)

## See also

Android CLI drives the same wrapper and version catalog that `gradle-kotlin-dsl` structures — that skill covers where build logic and version pins live. For running builds, tests, and Journeys on headless runners, see `ci-cd`; remember the `studio` bridge commands are unavailable there. Version resolution via `version-lookup` feeds the catalog described in `version-catalogs`.
