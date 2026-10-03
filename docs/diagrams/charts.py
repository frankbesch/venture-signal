#!/usr/bin/env python3
"""Draw the README evidence-stage picture as light and dark SVG.

Usage: python3 docs/diagrams/charts.py
Writes stages-light.svg and stages-dark.svg: the README's six-stage evidence
system, each stage with the method step in app/lib.ts that carries it. It pairs
with the Evaluate screenshot in docs/screens/, captured at the same shown height
by capture.mjs. main() checks every stage name is in the README and every step
text is in app/lib.ts. The drawing code is quoin_readme.py, a copy of the Quoin
README module.
"""
from pathlib import Path

from quoin_readme import THEMES, steps

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent

# (README stage, app/lib.ts method number and name, its text, box kind)
STAGES = [
    ("generate alternatives", "02 Opportunity set",
     "Generate customer × job × application combinations before choosing.", "external"),
    ("state causal logic", "03 Theory of value",
     "State what changed and why a buyer will switch, pay and stay.", "bus"),
    ("investigate behavior", "04 Buying-system discovery",
     "Reconstruct actual episodes across user, buyer, blocker and budget.", "bus"),
    ("test commitments", "08 Behavioral demand",
     "Escalate from opinion to deposits, payment, use and retention.", "backend"),
    ("model economics", "09 Feasibility + economics",
     "Prototype the bottleneck; model contribution, capacity and cash.", "database"),
    ("stage investment", "10 Decision gate",
     "Fund only the next uncertainty-reducing milestone.", "security"),
]

FLOW = dict(
    title="Six stages, evidence first",
    steps=[(stage.capitalize(), f"{method}: {text}", None, kind) for stage, method, text, kind in STAGES],
    note=("Attractiveness and evidence strength stay separate: a high score with weak evidence "
          "stays visibly weak. The app computes no probability of success."),
    desc=("The README's staged evidence system, each stage with the method step in app/lib.ts that "
          "carries it. " + " ".join(f"{s.capitalize()}: {m}, {t}" for s, m, t, _ in STAGES)
          + " Attractiveness and evidence strength stay separate: a high score with weak evidence stays "
            "visibly weak. The app computes no probability of success."),
)


def main():
    readme, lib = (ROOT / "README.md").read_text(), (ROOT / "app" / "lib.ts").read_text()
    method = " ".join((ROOT / "docs" / "method.md").read_text().split())
    for stage, m, text, _ in STAGES:
        assert stage in readme, stage
        num, name = m.split(" ", 1)
        assert f'["{num}", "{name}", "{text}"]' in lib, m
    assert "A high score with weak evidence must remain visibly weak." in method
    assert "The app does not compute a probability of success." in method
    for theme, c in THEMES.items():
        (HERE / f"stages-{theme}.svg").write_text(steps(FLOW, c))
    print("built stages")


if __name__ == "__main__":
    main()
