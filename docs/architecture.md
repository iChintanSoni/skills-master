# Architecture

`skills-master` has two halves: a **content library** (`skills/`) and a **compiler CLI** (`packages/cli`). You author a skill once in a canonical format; the CLI projects it into whatever each AI tool expects and installs it into a project.

## The canonical unit: a skill

A skill is a directory:

```
skills/<domain>/<class>/<category>/<name>/
├── SKILL.md        # frontmatter + body (Level 1 metadata + Level 2 instructions)
├── reference.md    # optional Level 3 — deep reference, loaded on demand
├── examples.md     # optional Level 3 — worked snippets
└── checklist.md    # optional Level 3 — review/migration rubric
```

- **domain** namespaces a technology ecosystem (`apple`, later `android`, `web`, …).
- **class** is one of `code` (produces code), `design` (produces UX critique), `lang-tooling` (cross-cutting language/build/test/ship), `overview` (decision routers). `class` maps to a directory via `CLASS_DIR` (`overview` → `overviews`).
- The folder name **is** the skill `name` (kebab-case), enforced by the linter.

The canonical format is Claude's Agent Skills `SKILL.md` treated as a **strict superset**. Our metadata lives in a namespaced `x-skills-master:` frontmatter block that is stripped from every projection. See [authoring.md](authoring.md) for the full schema.

## Progressive disclosure

| Level | Lives in | Loaded |
|------|----------|--------|
| 1 — metadata | `name` + `description` | always (drives auto-invocation) |
| 2 — instructions | `SKILL.md` body (≤ ~500 lines) | on invocation |
| 3 — resources | `reference.md` / `examples.md` / `checklist.md` | on demand |

Claude Code preserves all three levels natively. Single-file targets (Cursor, Copilot, AGENTS.md) get the Level-2 body **condensed**: links to Level-3 files are flattened and a pointer note is added.

## The compiler pipeline

```
discover → parse → validate → compile (per target) → write
```

- **discover** (`core/discover.ts`) — find every `SKILL.md` under the skills root.
- **parse** (`core/parse.ts`) — gray-matter splits frontmatter/body; resource files are read.
- **validate** (`schema/frontmatter.ts`, zod) — typed, normalized frontmatter; `core/lint.ts` adds content rules.
- **compile** (`core/compile.ts` + `emitters/`) — each enabled emitter projects the skill into `EmittedFile[]`.
- **write** (`core/writer.ts`) — applies files: `whole`-mode files are owned outright; `block`-mode regions are managed inside shared files via sentinel markers.

### Emitters

Every target implements one interface (`emitters/Emitter.ts`):

```ts
interface Emitter {
  id: string;
  label: string;
  detect(projectRoot: string): boolean;
  emit(skill: ParsedSkill, ctx: EmitContext): EmittedFile[];
}
```

Adding a tool (Windsurf, Cline, …) is a new file in `emitters/` plus one line in `emitters/index.ts`; the rest of the pipeline is generic. Shipped emitters: `claude` (lossless, copies Level-3), `cursor` (`.mdc`), `copilot` (`.instructions.md` + a pointer block in the root file), `agents` (`AGENTS.md` block). See [emitters.md](emitters.md).

### Sentinel markers

Shared files (`AGENTS.md`, `.github/copilot-instructions.md`) carry managed regions:

```
<!-- BEGIN skills-master:<name> v<version> -->
...generated...
<!-- END skills-master:<name> -->
```

Updates replace only the bytes between the markers, so hand-written content outside is always preserved (`core/markers.ts`).

## Install state

In a consuming project:

- `skills-master.json` — config (`contentRef`, `targets`, output `paths`, `commit`).
- `skills-master.lock.json` — per-skill resolved `version`, `sourceHash`, and per-target emitted files + a content `hash` (computed from disk) used to detect local edits.
- Generated files are committed by default; `commit: false` gitignores them instead.

`registry.json` (committed in `skills/`) is the generated catalog the CLI reads to `list`/`search`/`add` without scanning every skill. It is deterministic and CI-verified for drift.

## Distribution

Two channels over the same content:

1. **npx CLI** — `skills-master add …` fetches skill subtrees (via `giget`, pinned to `contentRef`) and compiles them for whichever tools a project uses.
2. **Claude marketplace** — `marketplace build` generates `.claude-plugin/marketplace.json` and one plugin per `(domain, class)` (e.g. `skills-master-apple-code`) for native `/plugin install`.
