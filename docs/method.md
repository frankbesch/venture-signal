# method and extension contract

## decision logic

The app does not compute a probability of success. It produces a staged recommendation from:

1. an equal-weight attractiveness score across ten dimensions;
2. the strongest observed evidence level;
3. a low-capex operating model supplied by the user.

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

## financial rule

Simulation outputs are arithmetic on user assumptions, not forecasts. Any future forecast module should add ranges, correlations, capacity constraints, working capital and explicit reference classes before adding Monte Carlo output. False precision is a larger risk than missing sophistication.

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
