# skills-master

**Tool-agnostic best-practice "skills" for building on Apple platforms — authored once, installed into any AI coding tool.**

Every AI coding tool has its own way of carrying project context — Claude Code has Agent Skills (`SKILL.md`), Cursor has `.cursor/rules/*.mdc`, GitHub Copilot has `.github/instructions/*.instructions.md`, and the cross-tool [`AGENTS.md`](https://agents.md) standard is read by many others. `skills-master` lets you author a skill **once** in a single canonical format and **compile** it into whatever a given tool expects, then install it into your project with one command.

The first domain is **Apple platform development** — SwiftUI, SwiftData, Swift concurrency, the Human Interface Guidelines, build & ship pipelines — distilled into original best-practice guidance (not copied from Apple's docs).

## Quick start

```bash
# In your app project:
npx skills-master init                       # detect your tools, write skills-master.json
npx skills-master add swiftdata-modeling      # install into every detected tool
npx skills-master add swiftui-navigation --target cursor,claude
npx skills-master list --class code           # browse the catalog
npx skills-master update                       # pull newer skill versions
```

Claude Code users can alternatively install via the plugin marketplace:

```
/plugin marketplace add github:<owner>/skills-master
/plugin install skills-master-code@skills-master
```

## How it works

```
                      ┌─────────────► .claude/skills/<name>/SKILL.md   (lossless)
  skills/<class>/     │
  <category>/<name>/  ├─ compile ───► .cursor/rules/<name>.mdc
    SKILL.md  ────────┤
    reference.md      ├─────────────► .github/instructions/<name>.instructions.md
    examples.md       │
    checklist.md      └─────────────► AGENTS.md   (managed block)
```

- **Canonical format** — Claude Agent Skills `SKILL.md` treated as a strict superset. A namespaced `x-skills-master:` frontmatter block carries our metadata and is stripped when compiling.
- **Emitters** — one per target tool, behind a common interface, so new tools plug in without touching the core.
- **Progressive disclosure** — a focused `SKILL.md` body plus optional on-demand `reference.md` / `examples.md` / `checklist.md`. Single-file targets get a condensed body.
- **Safe installs** — generated files are committed to your repo; shared files (`AGENTS.md`, `.github/copilot-instructions.md`) use `<!-- BEGIN/END skills-master:<name> -->` markers so updates touch only managed regions.

See [docs/architecture.md](docs/architecture.md) for the full design and [docs/authoring.md](docs/authoring.md) to write a skill.

## Repository layout

| Path | What |
|------|------|
| `packages/cli/` | the `skills-master` npm package (CLI + compiler + emitters) |
| `skills/` | the skill content library (`code/`, `design/`, `lang-tooling/`, `overviews/`) |
| `scripts/crawl/` | report-only crawler that flags new/stale Apple topics |
| `docs/` | architecture, authoring, and emitter documentation |

## License

Tooling is MIT (see [LICENSE](LICENSE)). Skill content is original prose that **summarizes** Apple's publicly documented best practices and **links** to the canonical Apple documentation; it does not reproduce Apple's copyrighted text or sample code.
