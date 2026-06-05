---
name: swift-package-plugins
description: "Guidance for authoring and running SwiftPM plugins: build-tool plugins for code generation and command plugins for linting/formatting, declared in Package.swift with sandbox permissions. Use when generating source at build time, wiring a formatter or linter into a package, choosing prebuild vs build commands, or fixing plugin sandbox and write-permission errors in Xcode 26 or the swift CLI."
tags: [swiftpm, plugins, build-tools, code-generation, tooling]
x-skills-master:
  domain: apple
  class: lang-tooling
  category: build-packaging
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    xcode: "26"
  pairs_with: []
  sources:
    - https://docs.swift.org/swiftpm/documentation/packagemanagerdocs/plugins/
    - https://docs.swift.org/swiftpm/documentation/packagemanagerdocs/writingbuildtoolplugin/
    - https://developer.apple.com/documentation/packagedescription/target/plugincapability-swift.enum/command(intent:permissions:)
  snapshot_date: "2026-05-30"
  stability: stable
  version: 1.0.0
---

A SwiftPM plugin is a small Swift program that the package manager compiles and runs in a sandbox to extend your build. There are two kinds, and picking the right one is the first decision.

## When to use

- Reach for a **build-tool plugin** when output must exist before compilation: generating Swift from `.proto`, `.graphql`, or asset catalogs, or running a code generator scoped to specific source targets.
- Reach for a **command plugin** when a human or CI invokes the action on demand: formatting, linting, generating docs, or producing a release manifest.
- Use a plugin instead of a shell script or run-phase when you want the work reproducible across Xcode and the `swift` CLI, sandboxed, and shareable as a package dependency.
- Skip plugins for one-off local chores; a `Makefile` or script is simpler and not worth the sandbox friction.

## Core guidance

- **Declare the plugin as its own target, then attach it.** A `.plugin` target carries the `capability`; consuming targets list it under `plugins:`. Build-tool plugins run per consuming target; command plugins are invoked directly.
- **Choose `.buildCommand` over `.prebuildCommand` whenever you can name outputs.** Build commands declare `inputFiles`/`outputFiles`, so SwiftPM caches them and reruns only on change. Prebuild commands run on *every* build with no incremental skipping — reserve them for cases where outputs cannot be known up front.
- **Resolve tools, don't hardcode paths.** Use `context.tool(named:)` and pass its `.url` to commands; for external binaries, prefer a declared dependency over assuming a system install.
- **Prefer the URL-based API.** Since SwiftPM 6.0, `pluginWorkDirectory`, `tool(named:).path`, and the `Path` type are deprecated in favor of `pluginWorkDirectoryURL` and `.url`; write generated files under `pluginWorkDirectoryURL`, never into the source tree.
- **Request the narrowest permission.** Command plugins that touch the source tree need `.writeToPackageDirectory(reason:)`; network access needs `.allowNetworkConnections(scope:reason:)`. Build-tool plugins get no write or network permissions — keep their work inside the plugin work directory.
- **Don't write outside the work directory from a build-tool plugin**, and don't assume `$HOME`, absolute system paths, or network access exist — the sandbox blocks them and the build will fail opaquely.
- **Emit diagnostics via the plugin API** (`Diagnostics.error`/`.warning`) so Xcode and the CLI surface them correctly, rather than printing to stderr.

## Platform notes

- Plugins run on the build *host* (macOS), not the target device, so all six Apple platforms can consume a package that uses them.
- In Xcode 26, a command plugin appears under the target's right-click menu and in **File menu**; the first run prompts to trust and approve write/network permissions. Build-tool plugins also surface a one-time trust dialog per package.
- From the CLI: `swift package plugin --list` enumerates command plugins; invoke with `swift package <verb>`. Grant permissions non-interactively for CI with `--allow-writing-to-package-directory` and `--allow-network-connections`.
- Minimum `swift-tools-version` is 5.6 for plugins; use 6.0+ to access the URL-based context APIs.

## Pitfalls

- **Prebuild commands silently slowing builds** because they re-run unconditionally — convert to a build command with declared outputs once outputs are stable.
- **`Sandbox: deny(1) file-write` errors** from a build-tool plugin writing to the source directory; build-tool plugins are read-only outside `pluginWorkDirectoryURL`.
- **Forgetting `--allow-writing-to-package-directory` in CI**, causing the command to hang on a prompt or fail; the flag must precede or accompany the verb.
- **Deprecation warnings under Swift 6** from `Path`/`pluginWorkDirectory`; migrate to `URL` rather than suppressing.
- **Attaching a build-tool plugin to a target whose generated files it cannot enumerate**, leaving stale output — verify `outputFiles` matches what the tool actually emits.

## References

- **Documentation:** [Plugins (Swift Package Manager)](https://docs.swift.org/swiftpm/documentation/packagemanagerdocs/plugins/)
- **Documentation:** [Writing a build tool plugin](https://docs.swift.org/swiftpm/documentation/packagemanagerdocs/writingbuildtoolplugin/)
- **Documentation:** [PackagePlugin module reference](https://docs.swift.org/swiftpm/documentation/packageplugin/)
- **Documentation:** [Target.PluginCapability.command(intent:permissions:)](https://developer.apple.com/documentation/packagedescription/target/plugincapability-swift.enum/command(intent:permissions:))
- **WWDC:** [Meet Swift Package plugins (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/110359/)
- **WWDC:** [Create Swift Package plugins (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/110401/)

## See also

Pairs with a Swift Package Manager fundamentals skill for manifest structure and dependency resolution, and with a code-generation skill when the plugin wraps a generator like protoc or Sourcery. For formatter and linter wiring, see a swift-format / SwiftLint integration skill. For CI invocation patterns, see a continuous-integration skill covering the `swift package` CLI and permission flags.
