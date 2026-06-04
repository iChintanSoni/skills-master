---
name: fixture-skill
description: A deterministic fixture skill for compiler tests. Use when exercising emitters, condensation, and the install lifecycle.
globs:
  - "**/*.swift"
tags: [fixture, test]
x-skills-master:
  domain: testdomain
  class: code
  category: fixtures
  platforms: [testos]
  requires:
    testos: "1"
  pairs_with: []
  sources:
    - https://example.com/docs/fixture
  snapshot_date: "2026-01-01"
  stability: contested
  version: 1.0.0
---

## When to use

Use this fixture to verify emitter output and the add/update/remove lifecycle.

## Core guidance

- Do the first deterministic thing.
- Do the second deterministic thing, referencing [examples.md](examples.md).
- Deeper notes live in [reference.md](reference.md).

## Platform notes

Runs only on the imaginary testos platform.

## Pitfalls

- A representative pitfall.

## Open question

Whether fixtures should be exhaustive is a tradeoff; this one stays minimal but covers every code path. See [checklist.md](checklist.md).

## See also

- Apple-equivalent docs live at the source URL.
