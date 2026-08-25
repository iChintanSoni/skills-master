---
name: fixture-tool-skill
description: A second deterministic fixture skill in another class. Use when exercising marketplace grouping across plugins.
tags: [fixture, test]
x-skills-master:
  domain: testdomain
  class: lang-tooling
  category: fixtures
  platforms: [testos]
  requires:
    testos: "1"
  pairs_with: []
  sources:
    - https://example.com/docs/fixture-tool
  snapshot_date: "2026-01-01"
  stability: stable
  version: 1.0.0
---

## When to use

Use this fixture whenever a test needs two skills in two different classes.

## Core guidance

- Stay deterministic.

## Pitfalls

- A representative pitfall.

## References

- [Fixture docs](https://example.com/docs/fixture-tool)

## See also

- [fixture-skill](../../../code/fixtures/fixture-skill/SKILL.md)
