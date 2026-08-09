# venture signal agent contract

## product invariants

1. Keep attractiveness and evidence strength separate in UI and logic.
2. Never present a score, simulation or study effect as a probability of success.
3. Preserve low-capex and no-paid-acquisition defaults unless the user changes them.
4. Every automation opportunity names its task boundary, test, failure mode, source and transfer limit.
5. Prefer observable behavior and costly commitment over stated interest.
6. Fund only the next uncertainty-reducing milestone; do not imply a scale recommendation from levels 1–4 evidence.

## engineering invariants

1. Keep the app local-first; browser storage is acceptable for local snapshots, never call it a backup.
2. No external write, deployment, analytics or model call without explicit user authorization.
3. Method changes require an update to `docs/method.md` and the product contract tests.
4. Run build, rendered-output tests and lint before a completion claim.
5. Do not add probabilistic sophistication unless the required inputs and reference classes exist; visible uncertainty beats false precision.

## key files

- `app/idea-lab.tsx` — interaction and local persistence
- `app/lib.ts` — method, source library and decision logic
- `docs/method.md` — interpretation and extension rules
- `tests/rendered-html.test.mjs` — durable product guarantees
