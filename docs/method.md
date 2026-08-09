# method and extension contract

## decision logic

The app does not compute a probability of success. It produces a staged recommendation from:

1. an equal-weight attractiveness score across ten dimensions;
2. the strongest observed evidence level;
3. a low-capex operating model supplied by the user;
4. user-authored uncertainty ranges for cost, effort, reach, conversion and revenue.

Current gate rules are intentionally legible in `app/lib.ts`:

- attractiveness below 45 → pause or reframe;
- evidence below recent behavior → discover;
- evidence below costly commitment → test commitment;
- evidence exists but attractiveness below 65 → pivot or narrow;
- commitment exists but repeat use is absent → paid pilot;
- repeat use or stronger → test repeatability.

These are governance defaults, not empirically calibrated cutoffs. Change them only with an explicit decision record and updated tests.

## evidence rule

Evidence quality never gets blended into the attractiveness score. A high score with weak evidence must remain visibly weak. The ladder is ordinal: do not average levels or treat the distance between levels as equal.

## forecast and financial rules

The scenario module stores three editable bounds for each input:

- P10 = lower numeric outcome;
- P50 = central numeric outcome;
- P90 = higher numeric outcome.

These labels describe the user’s scenario ordering. They are not empirically
calibrated quantiles, confidence intervals, or probabilities of success. For cost
and effort, P90 is adverse; for reach, conversion and revenue, P90 is favorable.
The interface rejects neither speculation nor wide ranges, but it labels each idea’s
basis as guess, named analog, or observed data and asks for a source note.

Weekly inputs are the source of truth. Month uses `52 / 12` weeks and year uses
`52` weeks. Initial cost and effort remain one-time values. Year-one owner cash is:

- P10: P10 revenue − P90 ongoing cost − P90 initial cost;
- P50: aligned P50 inputs;
- P90: P90 revenue − P10 ongoing cost − P10 initial cost.

This deliberately visible stress range does not model correlation, capacity,
working capital, tax, founder compensation, bad debt, platform-policy risk, or a
reference-class distribution. Do not add Monte Carlo or success probabilities
until those inputs exist. The separate unit-economics cross-check remains simple
arithmetic on point assumptions.

Ideas are ranked by one user-selected dimension at a time. Attractiveness and
evidence remain separate columns; neither is blended into forecast outputs. Cost
and effort rank ascending, while evidence, attractiveness, revenue and owner cash
rank descending. No default composite rank is permitted because its weights would
hide the user’s tradeoffs.

## content-creator rule

A content channel is not evaluated as a conventional customer-acquisition funnel.
The creator path changes five parts of the product:

1. **Causal thesis:** state the repeatable episode promise and why a viewer returns,
   not merely why one topic could receive a click.
2. **Evidence:** observed search/watch behavior, meaningful watch time, returning
   viewers and realized revenue replace purchase-only milestones. A subscription
   remains a nonbinding action; it is not retention.
3. **Capacity:** model published outputs and founder effort together. A forecast
   requiring a cadence the host/producer cannot sustain is operationally infeasible.
4. **Revenue:** platform payouts, sponsors, affiliates and owned offers are entered
   separately. Untested sources default to zero. Total creator revenue is the sum
   of aligned P10, P50 and P90 inputs, not a view-count multiplier supplied by the app.
5. **Trust and dependency:** record sponsor conflicts, disclosure boundaries,
   originality/rights risk, host key-person risk and platform-policy dependence.

The displayed subscriber-add rate and blended revenue per 1,000 views are arithmetic
diagnostics. Their outer bounds combine low numerators with high denominators and
vice versa, so they can be intentionally wide. They are not platform benchmarks.

YouTube eligibility thresholds are displayed only as linked, date-sensitive context.
Crossing a threshold permits application and review; it does not establish acceptance,
distribution, revenue, or business viability. Creator automation must preserve original
expert contribution, disclose applicable synthetic media and material connections, and
be tested against correction time, defects, retention and audience trust—not output volume.

## automation rule

Each automation card must include:

- task boundary;
- why the source is relevant;
- cheapest valid test;
- salient failure mode;
- direct source link.

Research from another sector is labeled a reference class or analogy. Do not convert reported study effects into an ROI estimate for the user’s idea.

Prefer deterministic workflow automation when states and correct actions are explicit. Use AI assistance when inputs are ambiguous or language-heavy and output can be reviewed. Start AI in shadow mode and measure correction rate before expanding autonomy.

## adding a sector

1. Extend the `Sector` union and `inferSector` rules in `app/lib.ts`.
2. Add at least one AI and one deterministic opportunity.
3. Link a primary or authoritative source and state transfer limits.
4. Add a test fixture if the new sector changes rendered product guarantees.
5. Re-run build, tests and lint.
