#!/usr/bin/env python3
"""Validate emitted skill projections against the Agent Skills reference validator.

    python3 scripts/spec-validate.py [root ...]

Our snapshot tests pin what *this repo* expects each emitter to write, which is
our expectations agreeing with themselves. This pins what the **specification**
expects, using its reference implementation (agentskills/agentskills, published
to PyPI as `skills-ref`), so an emitter change cannot quietly drift off-spec.

Install the pinned validator first:

    pip install skills-ref==0.1.1

Roots default to the emitted output this repo commits: every plugin's skills and
the dogfood `.claude/skills/`. The canonical `skills/` tree is deliberately a
superset of the spec (`globs`, `tags`, `x-skills-master` are extra top-level
keys) and is *expected* to fail this check — projections are the conformance
surface. See docs/architecture.md.

The library is imported rather than shelled out to: 0.1.1 renamed its console
script from `skills-ref` to `agentskills`, and the Python API is the part that
did not move.
"""

import sys
from pathlib import Path

PIN = "skills-ref==0.1.1"
DEFAULT_ROOTS = ("plugins", "packages/cli/.claude/skills")

try:
    from skills_ref import validate
except ImportError:
    sys.exit(f"skills_ref is not installed. Run: pip install {PIN}")


def main(argv: list[str]) -> int:
    roots = [Path(a) for a in argv] or [Path(r) for r in DEFAULT_ROOTS]

    missing = [r for r in roots if not r.is_dir()]
    if missing:
        print(f"✗ no such directory: {', '.join(str(m) for m in missing)}", file=sys.stderr)
        return 1

    skill_dirs = sorted({p.parent for root in roots for p in root.rglob("SKILL.md")})
    if not skill_dirs:
        # A gate that silently checks nothing reads as "everything passed".
        print(f"✗ found no SKILL.md under: {', '.join(str(r) for r in roots)}", file=sys.stderr)
        return 1

    invalid = 0
    for skill_dir in skill_dirs:
        errors = validate(skill_dir)
        if errors:
            invalid += 1
            print(f"✗ {skill_dir}", file=sys.stderr)
            for error in errors:
                print(f"    - {error}", file=sys.stderr)

    print(f"\nValidated {len(skill_dirs)} emitted skill(s) against {PIN}: {invalid} invalid.")
    return 1 if invalid else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
