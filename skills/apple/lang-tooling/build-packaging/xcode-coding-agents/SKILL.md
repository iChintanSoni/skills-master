---
name: xcode-coding-agents
description: "Operational guidance for the coding agents and coding assistant in Xcode 27 — setting up agents and chat models in Intelligence settings, plan mode before edits, reviewing agent changes in the artifacts pane, conversation-history rollback, command and tool permissions, AGENTS.md/CLAUDE.md configuration files, MCP servers and plug-ins, and the agent-driven localization workflow. Use when adopting Xcode's coding assistant on a project or team, deciding which tasks to hand to an agent, configuring permissions or agent instruction files, reviewing or rolling back agent edits, or running agent translations."
tags: [xcode, coding-agents, coding-assistant, intelligence, agents-md, workflow]
x-skills-master:
  domain: apple
  class: lang-tooling
  category: build-packaging
  platforms: [ios, ipados, macos, watchos, tvos, visionos]
  requires:
    xcode: "27"
  pairs_with: [xcode-project-conventions, localization]
  sources:
    - https://developer.apple.com/documentation/xcode/writing-code-with-intelligence-in-xcode
    - https://developer.apple.com/documentation/xcode/extending-and-customizing-agents
    - https://developer.apple.com/documentation/xcode/setting-up-coding-intelligence
  snapshot_date: "2026-08-25"
  stability: emerging
  version: 1.0.0
---

## When to use

Reach for this skill when bringing Xcode 27's coding agents into a project or team workflow: choosing between an agent and a plain chat model, deciding which tasks to delegate, setting up permissions and instruction files so agents behave predictably, and keeping every agent edit reviewable and reversible. It also covers the built-in localization agent. This is workflow and configuration guidance for using the tool well, not prompt-engineering or model advice.

## Core guidance

- **Know the agent/chat split before delegating.** In Intelligence settings, *agents* (Claude Agent out of the box; any Agent Client Protocol agent via Add an Agent) can use tools — build the project, render previews, run tests, search Apple documentation — and iterate until the code verifies. *Chat* providers (ChatGPT, Claude Sonnet & Opus, or any endpoint speaking the Chat Completions API) answer and propose. Hand multi-step work that needs verification to an agent; keep quick questions in chat with "automatically apply code changes" off so edits arrive as proposals you apply selectively.
- **Plan before the agent touches code.** Use the `/plan` command (type `/` to discover the other built-in skills) so the agent scopes the work into a markdown plan you can read, edit inline, and approve before any file changes. For larger goals, the plan can fan out to parallel subagents. Skipping the plan on non-trivial work trades a two-minute review for an unbounded diff review later.
- **Review through the artifacts pane, not the diff after the fact.** Agent conversations run as editor panes: transcript on the left (prompts, tool calls, permission grants), artifacts on the right with per-file comparison views as changes land. Annotate specific lines with `@` to direct targeted edits — the annotation carries surrounding code as context. Treat the transcript as the review record.
- **Keep rollback available: work in a git repository.** The conversation History slider unwinds agent changes chronologically and restores the project to any point — but it requires a git repo. An agent session on an untracked project has no history to rewind. This pairs with normal hygiene: agents on a clean working tree, human commits between agent tasks.
- **Scope context deliberately.** Xcode gathers project context automatically; on large projects, reference exact symbols and files with `@`, attach files explicitly, and turn off automatic search when you want the model confined to what you named. What you don't scope, the assistant guesses.
- **Set guardrails in Permissions, not in hope.** Intelligence settings list Allowed Commands and Allowed Tools per agent; agents ask in the transcript before using command-line tools outside the list. Grant narrowly and prune. Remember the privacy line: prompts can send project files to the configured provider — a real consideration for proprietary code. Managed fleets can disable external integrations entirely via the `CodingAssistantAllowExternalIntegrations` MDM key.
- **Write instructions files the agents actually read.** Xcode's agents honor `AGENTS.md`/`CLAUDE.md` configuration files — the same convention as standalone coding agents — so project conventions, architecture notes, and translation guidance belong there, versioned with the code. Per-agent environment folders under `~/Library/Developer/Xcode/CodingAssistant/` (e.g. `ClaudeAgentConfig`, `codex`, `gemini`) set a default model, add MCP servers, and define custom skills; plug-ins installed from Intelligence settings bundle subagents, MCP servers, and skills. These configurations apply only to agents launched from Xcode — keep shared conventions in the repo files, not the local folders.
- **Use the localization agent as a translation draft, not a release gate.** A prompt like "Translate my app into Italian" has the agent add the language, build all targets to populate String Catalogs, and translate with code context, terminology consistency, and plural variants. Guide it with a `TRANSLATION.md` (glossary, do-not-translate list, tone) referenced from `AGENTS.md`. Machine output is marked "Machine Translated" in the catalog editor and `state-qualifier="leveraged-mt"` in XLIFF exports — keep that trail, review layouts in the target language (truncation, tall scripts, right-to-left), and get native-speaker feedback via TestFlight before shipping. Prefer large-context models and check how well the provider covers the target language.

## Platform notes

- The assistant lives in Xcode on macOS; agent-built apps target every Apple platform, and agents validate through your run destinations — simulators and connected devices via Device Hub.
- Agent-driven localization and UI checks (rendering in a target language, RTL, Dynamic Type) run through the same preview and run tooling as manual work, so scheme language settings still apply.
- Custom chat providers can be locally hosted; agents beyond the built-ins integrate through the Agent Client Protocol.

## Pitfalls

- Letting an agent implement without an approved plan, then facing a sprawling multi-file diff with no structure to review it against.
- Running agents on a project without a git repository, forfeiting the History rollback.
- Broad Allowed Commands grants made once to silence prompts and never revisited.
- Duplicating team conventions into `~/Library/.../CodingAssistant` folders where teammates and CI never see them, instead of a committed `AGENTS.md`.
- Shipping agent translations unreviewed because the catalog looked complete — completeness is not correctness, and the `leveraged-mt` marker exists precisely to track what still needs human eyes.
- Pasting proprietary code into a provider-backed assistant without checking what the Intelligence privacy terms send off-device.
- Treating chat proposals and agent edits the same: proposals need applying, agent edits need reviewing — and confusing the two loses changes or ships unreviewed ones.

## References

- **Documentation:** [Writing code with intelligence in Xcode](https://developer.apple.com/documentation/xcode/writing-code-with-intelligence-in-xcode)
- **Documentation:** [Setting up coding intelligence](https://developer.apple.com/documentation/xcode/setting-up-coding-intelligence)
- **Documentation:** [Extending and customizing agents](https://developer.apple.com/documentation/xcode/extending-and-customizing-agents)
- **Documentation:** [Localizing your app using agents](https://developer.apple.com/documentation/xcode/localizing-your-app-using-agents)
- **WWDC:** [What's new in Xcode 27 (WWDC26)](https://developer.apple.com/videos/play/wwdc2026/258/)
- **WWDC:** [Xcode, agents, and you (WWDC26)](https://developer.apple.com/videos/play/wwdc2026/259/)
- **WWDC:** [Translate your app using agents in Xcode (WWDC26)](https://developer.apple.com/videos/play/wwdc2026/213/)

## See also

For the project layout, xcconfig discipline, and modularization that make a codebase agent-legible in the first place, see `xcode-project-conventions`. For String Catalogs, localizable APIs, and the export/import pipeline the localization agent builds on, see `localization`.
