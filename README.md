# venture signal

A local-first decision lab for pressure-testing business ideas before committing material capital.

## product contract

Venture Signal implements a staged evidence system:

`generate alternatives → state causal logic → investigate behavior → test commitments → model economics → stage investment`

It deliberately keeps two quantities separate:

- **attractiveness** — how good the opportunity would be if its premises were true;
- **evidence strength** — the strongest costly, observable customer behavior actually seen.

The default posture is low initial capex and no paid acquisition. “Zero acquisition” means zero **paid** acquisition initially; every business still needs a credible path to customers.

## capabilities

- guided idea intake and missing-variable grill;
- creator-specific repeat-viewer, production-system, discovery, monetization and trust grill;
- ten-lens opportunity scorecard plus eight-level evidence ladder;
- evidence-weighted decision gate;
- editable P10/P50/P90 ranges for initial and ongoing cost, effort, reach, conversion and revenue;
- content cadence plus separate platform, sponsor, affiliate and owned-offer revenue ranges;
- week, month and year graphs plus a deliberately conservative year-one cash range;
- capex, opex, labor, contribution, break-even, payback and effort cross-check;
- local idea snapshots, dimension-specific rankings and a two-axis option-set comparison;
- sector-inferred AI and deterministic automation opportunities;
- source links, transfer limits, failure modes and cheapest-valid-test guidance.

Saved ideas use browser `localStorage`. They are device-local, are not synced, and are not a backup. No model or external API receives idea data in this version.

## run locally

Prerequisite: Node.js 22.13+ and pnpm.

```bash
pnpm install
pnpm run dev
```

Then open `http://localhost:3000`.

## verify

```bash
pnpm test
pnpm run lint
```

## important limits

- Scores are structured judgment, not a validated prediction of venture success.
- Automation cards are research-backed analogies, not sector-specific ROI forecasts.
- P10/P50/P90 values are user-authored scenarios, not calibrated quantiles or success probabilities.
- Creator ratios are arithmetic diagnostics, not platform benchmarks; monetization eligibility is not income evidence.
- Financial outputs omit founder compensation, tax, working capital, bad debt and capacity interactions.
- Research links were reviewed on 2026-08-09; re-check them before using the app for a consequential or regulated decision.

## repo map

- `app/idea-lab.tsx` — UI, interaction and local persistence
- `app/lib.ts` — methodology, automation library and decision logic
- `app/globals.css` — responsive visual system
- `tests/rendered-html.test.mjs` — build-level product contract checks
- `docs/method.md` — methodology, scoring and extension rules
