"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CreatorRevenueKey, ForecastBand, Idea, IdeaForecast, Percentile, Scores, attractiveness, automationsFor,
  createForecast, defaultScores, dimensions, economics, effectiveWeeklyRevenue, emptyCreatorProfile,
  evidenceLevelsFor, gateFor, inferForecastModel, inferSector, isOrderedBand, methods, normalizeForecast,
  percentiles, ratioBand, scaleBand, sources, yearOneCashBand,
} from "./lib";

type View = "explore" | "evaluate" | "compare" | "automation" | "evidence";
type ForecastPeriod = "week" | "month" | "year";
type RankKey = "evidence" | "attractiveness" | "initialCost" | "weeklyEffort" | "p50Revenue" | "p10Revenue" | "yearOneCash";

const STORE_KEY = "venture-signal-v1";
const MONTH_WEEKS = 52 / 12;
const starterIdea: Idea = {
  id: "sample-studio",
  name: "Workflow automation studio",
  pitch: "A productized workflow-automation service for independent dental practices, sold through owner referrals and professional associations.",
  sector: "professional",
  customer: "Independent dental practices with 5–25 staff",
  trigger: "Front-office overtime, missed follow-ups, or a practice-management migration",
  channel: "Founder network, referrals, associations — no paid acquisition initially",
  priceProof: "Unverified: no deposit, contract, or purchase yet",
  founderEdge: "Enterprise workflow discovery and AI/automation solution design",
  nonNegotiable: "≤ $2,500 initial capex; no employees before repeatable delivery",
  evidence: 1,
  scores: { ...defaultScores, fit: 8, feasibility: 7, access: 6, risk: 6, defensibility: 4, wtp: 4 },
  capex: 1800, opex: 650, labor: 18, price: 3500, variableCost: 450, customers: 2,
  acquisitionCost: 0, physicalEffort: 2, mentalEffort: 7,
  creator: { ...emptyCreatorProfile },
  forecast: createForecast("customer"), updatedAt: "2026-08-09",
};

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

function normalizeIdea(value: Partial<Idea>): Idea {
  return {
    ...starterIdea,
    ...value,
    scores: { ...defaultScores, ...(value.scores ?? {}) },
    creator: { ...emptyCreatorProfile, ...(value.creator ?? {}) },
    forecast: normalizeForecast(value.forecast),
  };
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="field"><span>{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>;
}

function Range({ label, value, onChange, min = 0, max = 10, suffix = "" }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; suffix?: string }) {
  return <label className="range-field"><span>{label}<b>{value}{suffix}</b></span><input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} /></label>;
}

function BandEditor({ label, unit, band, onChange }: { label: string; unit: string; band: ForecastBand; onChange: (band: ForecastBand) => void }) {
  const ordered = isOrderedBand(band);
  return <div className={`band-editor ${ordered ? "" : "invalid"}`}>
    <div className="band-editor-title"><b>{label}</b><span>{unit}</span></div>
    <div className="band-inputs">{percentiles.map((p) => <label key={p}><span>{p.toUpperCase()}</span><input aria-label={`${label} ${p.toUpperCase()}`} type="number" min="0" step="any" value={band[p]} onChange={(e) => onChange({ ...band, [p]: Math.max(0, Number(e.target.value)) })} /></label>)}</div>
    {!ordered && <p>P10 ≤ P50 ≤ P90 required.</p>}
  </div>;
}

function ForecastBars({ label, band, formatter, adverseHigh = false }: { label: string; band: ForecastBand; formatter: (value: number) => string; adverseHigh?: boolean }) {
  const ceiling = Math.max(1, ...Object.values(band).map((value) => Math.abs(value)));
  return <article className="forecast-card">
    <header><b>{label}</b><span>{adverseHigh ? "higher is worse" : "higher is better"}</span></header>
    <div className="forecast-bars">{percentiles.map((p) => <div key={p}><span>{p.toUpperCase()}</span><i><em className={p} style={{ width: `${Math.max(2, Math.abs(band[p]) / ceiling * 100)}%` }} /></i><b>{formatter(band[p])}</b></div>)}</div>
  </article>;
}

const horizonPoints = [{ label: "1 week", weeks: 1 }, { label: "1 month", weeks: MONTH_WEEKS }, { label: "1 year", weeks: 52 }];
const scenarioNames: Record<Percentile, string> = { p10: "P10 downside", p50: "P50 central", p90: "P90 upside" };

function compactMoney(value: number) {
  const absolute = Math.abs(value);
  const formatted = absolute >= 1000 ? `$${compact.format(absolute)}` : money.format(absolute);
  return value < 0 ? `−${formatted}` : formatted;
}

function scenarioHorizonPoints(forecast: IdeaForecast, scenario: Percentile) {
  const costScenario: Percentile = scenario === "p10" ? "p90" : scenario === "p90" ? "p10" : "p50";
  const revenueRate = effectiveWeeklyRevenue(forecast)[scenario];
  return horizonPoints.map(({ label, weeks }) => {
    const revenue = revenueRate * weeks;
    const cost = forecast.initialCost[costScenario] + forecast.weeklyCost[costScenario] * weeks;
    return { label, revenue, cost, profit: revenue - cost };
  });
}

function HorizonAreaChart({ scenario, forecast, domain }: { scenario: Percentile; forecast: IdeaForecast; domain: [number, number] }) {
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(420);
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(250, Math.round(entry.contentRect.width))));
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);

  const points = scenarioHorizonPoints(forecast, scenario);
  const height = 286;
  const margin = { top: 22, right: 18, bottom: 42, left: 62 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const [domainMin, domainMax] = domain;
  const x = (index: number) => margin.left + chartWidth * (index / (points.length - 1));
  const y = (value: number) => margin.top + (domainMax - value) / (domainMax - domainMin) * chartHeight;
  const zeroY = y(0);
  const series = [
    { key: "cost" as const, label: "Total cost", className: "cost" },
    { key: "revenue" as const, label: "Revenue", className: "revenue" },
    { key: "profit" as const, label: "Owner cash", className: "profit" },
  ];
  const linePath = (key: "cost" | "revenue" | "profit") => points.map((point, index) => `${index ? "L" : "M"}${x(index)},${y(point[key])}`).join(" ");
  const areaPath = (key: "cost" | "revenue" | "profit") => `${linePath(key)} L${x(points.length - 1)},${zeroY} L${x(0)},${zeroY} Z`;
  const ticks = Array.from({ length: 5 }, (_, index) => domainMin + (domainMax - domainMin) * (index / 4));
  const description = points.map((point) => `${point.label}: revenue ${money.format(point.revenue)}, total cost ${money.format(point.cost)}, owner cash ${money.format(point.profit)}`).join("; ");

  return <article className="horizon-chart">
    <header><div><span>{scenario.toUpperCase()}</span><b>{scenarioNames[scenario]}</b></div><strong>{compactMoney(points[2].profit)} <small>year 1</small></strong></header>
    <div ref={host} className="horizon-chart-host">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${scenarioNames[scenario]} cost, revenue, and owner cash. ${description}`}>
        <rect data-chart-frame x={margin.left} y={margin.top} width={chartWidth} height={chartHeight} />
        {ticks.map((tick) => <g key={tick}><line className="grid-line" x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} /><text className="y-tick" x={margin.left - 9} y={y(tick) + 4} textAnchor="end">{compactMoney(tick)}</text></g>)}
        <line className="zero-line" x1={margin.left} x2={width - margin.right} y1={zeroY} y2={zeroY} />
        {series.map((item) => <g key={item.key} className={`chart-series ${item.className}`}><path className="area" d={areaPath(item.key)} /><path className="line" d={linePath(item.key)} />{points.map((point, index) => <circle key={point.label} cx={x(index)} cy={y(point[item.key])} r="4" />)}</g>)}
        {points.map((point, index) => <text key={point.label} className="x-tick" x={x(index)} y={height - 15} textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}>{point.label}</text>)}
        <text className="axis-title" data-axis="y" transform={`translate(15 ${margin.top + chartHeight / 2}) rotate(-90)`} textAnchor="middle">Cumulative USD</text>
        <text className="axis-title" data-axis="x" x={margin.left + chartWidth / 2} y={height - 1} textAnchor="middle">Categorical horizon</text>
      </svg>
    </div>
  </article>;
}

export function IdeaLab() {
  const [view, setView] = useState<View>("explore");
  const [idea, setIdea] = useState<Idea>(starterIdea);
  const [ideas, setIdeas] = useState<Idea[]>([starterIdea]);
  const [grilling, setGrilling] = useState(false);
  const [saved, setSaved] = useState(false);
  const [automationMode, setAutomationMode] = useState<"ai" | "nonAi">("ai");
  const [forecastPeriod, setForecastPeriod] = useState<ForecastPeriod>("month");
  const [rankBy, setRankBy] = useState<RankKey>("evidence");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORE_KEY);
        if (stored) {
          const parsed = (JSON.parse(stored) as Partial<Idea>[]).map(normalizeIdea);
          if (parsed.length) { setIdeas(parsed); setIdea(parsed[0]); }
        }
      } catch { /* local storage is optional */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const update = <K extends keyof Idea>(key: K, value: Idea[K]) => {
    setSaved(false);
    setIdea((current) => ({ ...current, [key]: value, updatedAt: new Date().toISOString().slice(0, 10) }));
  };
  const score = attractiveness(idea.scores);
  const forecast = normalizeForecast(idea.forecast);
  const gate = gateFor(score, idea.evidence, forecast.model);
  const econ = economics(idea);
  const automations = useMemo(() => automationsFor(idea.sector), [idea.sector]);
  const coreMissing = [idea.customer, idea.trigger, idea.channel, idea.priceProof, idea.founderEdge, idea.nonNegotiable].filter((v) => !v.trim()).length;
  const creatorMissing = forecast.model === "audience" ? Object.values(idea.creator).filter((v) => !v.trim()).length : 0;
  const missing = coreMissing + creatorMissing;
  const activeEvidenceLevels = evidenceLevelsFor(forecast.model);
  const periodMultiplier = forecastPeriod === "week" ? 1 : forecastPeriod === "month" ? MONTH_WEEKS : 52;
  const reachLabel = forecast.model === "audience" ? "Views" : "Qualified leads";
  const conversionLabel = forecast.model === "audience" ? "Subscribers added" : "Customers added";
  const weeklyRevenue = effectiveWeeklyRevenue(forecast);
  const subscriberRate = ratioBand(forecast.weeklyConversions, forecast.weeklyReach, 100);
  const revenuePerThousandViews = ratioBand(weeklyRevenue, forecast.weeklyReach, 1000);
  const p50Outputs = forecast.weeklyOutputs.p50;
  const perOutput = (value: number) => p50Outputs > 0 ? value / p50Outputs : 0;
  const largestCreatorRevenue = Math.max(...Object.values(forecast.creatorRevenue).map((band) => band.p50));
  const revenueConcentration = weeklyRevenue.p50 > 0 ? largestCreatorRevenue / weeklyRevenue.p50 * 100 : 0;
  const yearOneCash = yearOneCashBand(forecast);
  const allHorizonValues = percentiles.flatMap((scenario) => scenarioHorizonPoints(forecast, scenario).flatMap((point) => [point.revenue, point.cost, point.profit]));
  const horizonMinimum = Math.min(0, ...allHorizonValues);
  const horizonMaximum = Math.max(0, ...allHorizonValues);
  const horizonPadding = Math.max(1, (horizonMaximum - horizonMinimum) * .12);
  const horizonDomain: [number, number] = [horizonMinimum - horizonPadding, horizonMaximum + horizonPadding];
  const comparisonIdeas = useMemo(() => [normalizeIdea(idea), ...ideas.filter((item) => item.id !== idea.id).map(normalizeIdea)], [idea, ideas]);
  const rankedIdeas = useMemo(() => {
    const direction = ["initialCost", "weeklyEffort"].includes(rankBy) ? 1 : -1;
    const value = (item: Idea) => {
      const itemForecast = normalizeForecast(item.forecast);
      if (rankBy === "evidence") return item.evidence;
      if (rankBy === "attractiveness") return attractiveness(item.scores);
      if (rankBy === "initialCost") return itemForecast.initialCost.p50;
      if (rankBy === "weeklyEffort") return itemForecast.weeklyEffort.p50;
      const itemRevenue = effectiveWeeklyRevenue(itemForecast);
      if (rankBy === "p50Revenue") return itemRevenue.p50 * 52;
      if (rankBy === "p10Revenue") return itemRevenue.p10 * 52;
      return yearOneCashBand(itemForecast).p50;
    };
    return [...comparisonIdeas].sort((a, b) => (value(a) - value(b)) * direction);
  }, [comparisonIdeas, rankBy]);

  const saveIdea = () => {
    const normalized = normalizeIdea({ ...idea, sector: inferSector(`${idea.pitch} ${idea.customer}`) });
    const next = [normalized, ...ideas.filter((item) => item.id !== normalized.id)].slice(0, 8);
    setIdea(normalized); setIdeas(next); localStorage.setItem(STORE_KEY, JSON.stringify(next)); setSaved(true);
  };

  const startNew = () => {
    const next: Idea = { ...starterIdea, ...{
      id: `idea-${Date.now()}`, name: "Untitled idea", pitch: "", customer: "", trigger: "", channel: "",
      priceProof: "", founderEdge: "", nonNegotiable: "≤ $2,500 initial capex; no paid acquisition initially",
      scores: { ...defaultScores }, evidence: 0, creator: { ...emptyCreatorProfile }, forecast: createForecast("customer"), updatedAt: new Date().toISOString().slice(0, 10),
    }};
    setIdea(next); setGrilling(false); setView("explore"); setSaved(false);
  };

  const deleteIdea = (id: string) => {
    const next = ideas.filter((item) => item.id !== id);
    setIdeas(next.length ? next : [starterIdea]);
    setIdea(next[0] ?? starterIdea);
    localStorage.setItem(STORE_KEY, JSON.stringify(next.length ? next : [starterIdea]));
  };

  const branchIdea = (label: string, prefix: string) => {
    const base = idea.pitch.trim() || "the current idea";
    const branch: Idea = {
      ...idea,
      id: `idea-${Date.now()}`,
      name: label,
      pitch: `${prefix}: ${base}`,
      evidence: 0,
      scores: { ...idea.scores, wtp: 5, options: Math.min(10, idea.scores.options + 1) },
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    const next = [branch, idea, ...ideas.filter((item) => item.id !== idea.id)].slice(0, 8);
    setIdeas(next); setIdea(branch); setGrilling(true); setSaved(true);
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  };

  const runGrill = () => {
    update("sector", inferSector(idea.pitch));
    if (idea.pitch.trim()) update("name", idea.pitch.split(/[.!?]/)[0].slice(0, 52) || "Untitled idea");
    const inferredModel = inferForecastModel(idea.pitch);
    if (inferredModel !== forecast.model) update("forecast", createForecast(inferredModel));
    setGrilling(true);
    window.setTimeout(() => {
      const questions = document.getElementById("grill-questions");
      questions?.scrollIntoView({ behavior: "smooth", block: "start" });
      questions?.focus({ preventScroll: true });
    }, 0);
  };

  const setScore = (key: keyof Scores, value: number) => update("scores", { ...idea.scores, [key]: value });
  const setForecastBand = (key: keyof Pick<IdeaForecast, "initialCost" | "weeklyCost" | "initialEffort" | "weeklyEffort" | "weeklyReach" | "weeklyConversions" | "weeklyRevenue" | "weeklyOutputs">, band: ForecastBand) => update("forecast", { ...forecast, [key]: band });
  const setCreatorRevenue = (key: CreatorRevenueKey, band: ForecastBand) => update("forecast", { ...forecast, creatorRevenue: { ...forecast.creatorRevenue, [key]: band } });
  const setCreatorField = (key: keyof Idea["creator"], value: string) => update("creator", { ...idea.creator, [key]: value });
  const setForecastModel = (model: IdeaForecast["model"]) => {
    const defaults = createForecast(model);
    update("forecast", { ...forecast, model, weeklyReach: defaults.weeklyReach, weeklyConversions: defaults.weeklyConversions });
  };
  const selectIdea = (item: Idea) => { setIdea(normalizeIdea(item)); setSaved(ideas.some((savedIdea) => savedIdea.id === item.id)); };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setView("explore")} aria-label="Go to idea lab">
          <span className="brand-mark">VS</span><span>VENTURE<br />SIGNAL</span>
        </button>
        <nav aria-label="Workspace">
          {(["explore", "evaluate", "compare", "automation", "evidence"] as View[]).map((item, index) => (
            <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>
              <span>0{index + 1}</span>{item}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-badge"><i /> LOCAL ONLY</div>
          <p>Ideas persist in this browser.<br />No data leaves this device.</p>
          <button className="new-button" onClick={startNew}>＋ New idea</button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><span className="eyebrow">DECISION WORKSPACE</span><strong>{idea.name}</strong></div>
          <div className="top-actions"><span className={`saved-state ${saved ? "done" : ""}`}>{saved ? "Saved locally" : "Unsaved changes"}</span><button className="save-button" onClick={saveIdea}>Save snapshot</button></div>
        </header>

        {view === "explore" && <>
          <section className="hero-grid">
            <div className="hero-copy">
              <span className="kicker">EVIDENCE BEFORE ENTHUSIASM</span>
              <h1>Decide what deserves the next <em>$500.</em></h1>
              <p>Turn a business idea into a falsifiable thesis, a low-capex experiment, and a decision gate.</p>
            </div>
            <div className="signal-card">
              <span>Current signal</span><b>{Math.round(score)}<small>/100</small></b>
              <div className="signal-bar"><i style={{ width: `${score}%` }} /></div>
              <strong className={gate.tone}>{gate.label}</strong><p>{gate.reason}</p>
            </div>
          </section>

          <section className="idea-entry panel">
            <div className="panel-label"><span>01</span> START WITH THE RAW IDEA</div>
            <textarea aria-label="Business idea" value={idea.pitch} onChange={(e) => update("pitch", e.target.value)} placeholder="Describe the customer, painful job, offer, and why now. Rough is fine." />
            <div className="entry-footer"><span>{idea.pitch.length} characters · {missing} critical gaps</span><button onClick={runGrill} disabled={!idea.pitch.trim()} aria-expanded={grilling} aria-controls="grill-questions">{grilling ? "Review grill questions" : "Grill this idea"} <b>→</b></button></div>
          </section>

          <section className="branch-strip">
            <div><span className="kicker">GENERATE AN OPTION SET</span><b>Don’t let the first form of the idea become the idea.</b></div>
            <div className="branch-options">
              <button onClick={() => branchIdea("Concierge proof", "A manual, paid concierge proof of")}>Concierge proof <span>lowest build risk</span></button>
              <button onClick={() => branchIdea("Narrow beachhead", "For one urgent, reachable subsegment only")}>Narrow beachhead <span>lower channel risk</span></button>
              <button onClick={() => branchIdea("Diagnostic wedge", "A fixed-fee diagnostic before implementation of")}>Diagnostic wedge <span>test WTP sooner</span></button>
              <button onClick={() => branchIdea("Enablement product", "A toolkit, template or training layer derived from")}>Enablement product <span>lower delivery load</span></button>
            </div>
          </section>

          {grilling && <section className="grill-section" id="grill-questions" tabIndex={-1}>
            <div className="section-heading"><div><span className="kicker">THE GRILL</span><h2>Replace adjectives with episodes.</h2></div><p>Answer what you know. “Unknown” is a valid answer and becomes an experiment.</p></div>
            <div className="question-grid">
              <Field label="Who has the problem—and who controls budget?" value={idea.customer} onChange={(v) => update("customer", v)} placeholder="User, buyer, budget owner" />
              <Field label="What recent event creates urgency?" value={idea.trigger} onChange={(v) => update("trigger", v)} placeholder="Observed trigger, frequency, workaround" />
              <Field label="How do the first 10 buyers find you?" value={idea.channel} onChange={(v) => update("channel", v)} placeholder="Named path; default is no paid acquisition" />
              <Field label="What have buyers actually committed?" value={idea.priceProof} onChange={(v) => update("priceProof", v)} placeholder="Opinion, meeting, deposit, purchase, repeat use" />
              <Field label="Why are you unusually credible here?" value={idea.founderEdge} onChange={(v) => update("founderEdge", v)} placeholder="Knowledge, network, access, reputation" />
              <Field label="What is the affordable-loss boundary?" value={idea.nonNegotiable} onChange={(v) => update("nonNegotiable", v)} placeholder="Cash, time, risk, lifestyle constraints" />
            </div>
            {forecast.model === "audience" && <div className="creator-grill">
              <div className="creator-grill-intro"><span className="kicker">CREATOR BUSINESS LENS</span><h3>Views are an intermediate outcome.</h3><p>Define why someone returns, what can be produced repeatedly, and how income can coexist with audience trust.</p></div>
              <div className="question-grid">
                <Field label="What repeatable promise does each episode make?" value={idea.creator.audiencePromise} onChange={(v) => setCreatorField("audiencePromise", v)} placeholder="For this viewer, after this trigger, every episode helps…" />
                <Field label="Why return instead of watching one answer?" value={idea.creator.repeatReason} onChange={(v) => setCreatorField("repeatReason", v)} placeholder="Recurring decisions, changing conditions, series or identity" />
                <Field label="What cadence can the team sustain for 12 weeks?" value={idea.creator.contentSystem} onChange={(v) => setCreatorField("contentSystem", v)} placeholder="Format, host hours, producer hours, bottleneck, fallback" />
                <Field label="How will the first 10 episodes earn discovery?" value={idea.creator.discoveryLoop} onChange={(v) => setCreatorField("discoveryLoop", v)} placeholder="Named queries, communities, collaborators, owned audience" />
                <Field label="Which revenue source is tested first—and why?" value={idea.creator.monetizationOrder} onChange={(v) => setCreatorField("monetizationOrder", v)} placeholder="Platform, sponsor, affiliate, service or owned offer" />
                <Field label="What trust boundary cannot be monetized away?" value={idea.creator.trustBoundary} onChange={(v) => setCreatorField("trustBoundary", v)} placeholder="Conflicts, disclosures, advice limits, sponsor exclusions" />
              </div>
            </div>}
            <div className="grill-actions"><button onClick={() => setView("evaluate")}>Build evaluation <b>→</b></button><span>{missing === 0 ? "Enough structure to evaluate; not proof." : `${missing} unknowns will be treated as risks.`}</span></div>
          </section>}

          <section className="process-strip">
            <div className="section-heading compact"><div><span className="kicker">THE ENSEMBLE</span><h2>Ten lenses. One staged decision.</h2></div><p>No framework gets a veto. Evidence does.</p></div>
            <div className="method-row">{methods.map(([n, title]) => <button key={n} onClick={() => setView("evidence")}><span>{n}</span><b>{title}</b></button>)}</div>
          </section>
        </>}

        {view === "evaluate" && <section className="page-pad">
          <div className="section-heading"><div><span className="kicker">EVALUATE</span><h2>Attractiveness ≠ evidence.</h2></div><p>Score the design, then declare the strongest behavior you have actually observed.</p></div>
          <div className="evaluation-grid">
            <div className="panel score-panel">
              <div className="panel-label"><span>A</span> ATTRACTIVENESS</div>
              {dimensions.map((d) => <Range key={d.key} label={`${d.label} — ${d.note}`} value={idea.scores[d.key]} onChange={(v) => setScore(d.key, v)} />)}
            </div>
            <div className="evaluation-right">
              <div className="panel evidence-panel">
                <div className="panel-label"><span>B</span> EVIDENCE STRENGTH</div>
                <div className="ladder">{activeEvidenceLevels.map((level, index) => <button key={level} className={idea.evidence === index ? "selected" : index < idea.evidence ? "passed" : ""} onClick={() => update("evidence", index)}><span>{index + 1}</span><p>{level}</p><i>{index === idea.evidence ? "STRONGEST OBSERVED" : ""}</i></button>)}</div>
              </div>
              <div className={`gate-card ${gate.tone}`}><span>NEXT GATE</span><h3>{gate.label}</h3><p>{gate.reason}</p><button onClick={() => setView("compare")}>Compare options →</button></div>
            </div>
          </div>
          <div className="theory-card panel"><div><span className="panel-label"><span>C</span> THEORY OF VALUE</span><h3>Because <mark>the trigger changed</mark>, if we deliver <mark>the offer</mark>, <mark>this buyer</mark> will obtain <mark>a measurable outcome</mark>, switch from <mark>the current substitute</mark>, and let us capture <mark>enough value</mark>.</h3></div><p>Every highlighted phrase is a premise. Convert the weakest one into a prediction with a threshold before you test it.</p></div>
          {forecast.model === "audience" && <div className="creator-thesis panel"><div className="panel-label"><span>D</span> CREATOR THESIS</div><div className="creator-thesis-grid">
            <div><span>Episode promise</span><b>{idea.creator.audiencePromise || "Unknown"}</b></div><div><span>Repeat-view reason</span><b>{idea.creator.repeatReason || "Unknown"}</b></div><div><span>12-week system</span><b>{idea.creator.contentSystem || "Unknown"}</b></div><div><span>First discovery loop</span><b>{idea.creator.discoveryLoop || "Unknown"}</b></div><div><span>Monetization order</span><b>{idea.creator.monetizationOrder || "Unknown"}</b></div><div><span>Trust boundary</span><b>{idea.creator.trustBoundary || "Unknown"}</b></div>
          </div></div>}
        </section>}

        {view === "compare" && <section className="page-pad">
          <div className="section-heading"><div><span className="kicker">COMPARE + SIMULATE</span><h2>Expose the range. Rank the tradeoff.</h2></div><p>P10/P50/P90 are editable scenario bounds—not calculated probabilities or a forecast of success.</p></div>

          <div className="forecast-layout">
            <div className="panel forecast-inputs">
              <div className="panel-label"><span>01</span> SCENARIO INPUTS</div>
              <div className="model-switch" aria-label="Forecast model">
                <button className={forecast.model === "audience" ? "active" : ""} onClick={() => setForecastModel("audience")}>Content creator</button>
                <button className={forecast.model === "customer" ? "active" : ""} onClick={() => setForecastModel("customer")}>Customer</button>
              </div>
              <div className="basis-row">
                <label><span>Basis</span><select aria-label="Forecast evidence basis" value={forecast.basis} onChange={(e) => update("forecast", { ...forecast, basis: e.target.value as IdeaForecast["basis"] })}><option value="guess">Guess</option><option value="analog">Named analog</option><option value="observed">Observed data</option></select></label>
                <label><span>Basis note</span><input aria-label="Forecast basis note" value={forecast.basisNote} onChange={(e) => update("forecast", { ...forecast, basisNote: e.target.value })} placeholder="Source, sample, date, or why unknown" /></label>
              </div>
              <BandEditor label="Initial cost" unit="$ one-time" band={forecast.initialCost} onChange={(band) => setForecastBand("initialCost", band)} />
              <BandEditor label="Ongoing cost" unit="$ / week" band={forecast.weeklyCost} onChange={(band) => setForecastBand("weeklyCost", band)} />
              <BandEditor label="Initial effort" unit="hours one-time" band={forecast.initialEffort} onChange={(band) => setForecastBand("initialEffort", band)} />
              <BandEditor label="Ongoing effort" unit="hours / week" band={forecast.weeklyEffort} onChange={(band) => setForecastBand("weeklyEffort", band)} />
              {forecast.model === "audience" && <BandEditor label="Published outputs" unit="episodes / week" band={forecast.weeklyOutputs} onChange={(band) => setForecastBand("weeklyOutputs", band)} />}
              <BandEditor label={reachLabel} unit="/ week" band={forecast.weeklyReach} onChange={(band) => setForecastBand("weeklyReach", band)} />
              <BandEditor label={conversionLabel} unit="/ week" band={forecast.weeklyConversions} onChange={(band) => setForecastBand("weeklyConversions", band)} />
              {forecast.model === "audience" ? <div className="revenue-mix-inputs"><div className="subsection-label">WEEKLY REVENUE MIX <span>Keep untested sources at $0</span></div>
                <BandEditor label="Platform payouts" unit="$ / week" band={forecast.creatorRevenue.platform} onChange={(band) => setCreatorRevenue("platform", band)} />
                <BandEditor label="Sponsors" unit="$ / week" band={forecast.creatorRevenue.sponsor} onChange={(band) => setCreatorRevenue("sponsor", band)} />
                <BandEditor label="Affiliate" unit="$ / week" band={forecast.creatorRevenue.affiliate} onChange={(band) => setCreatorRevenue("affiliate", band)} />
                <BandEditor label="Owned offer / service" unit="$ / week" band={forecast.creatorRevenue.owned} onChange={(band) => setCreatorRevenue("owned", band)} />
              </div> : <BandEditor label="Revenue" unit="$ / week" band={forecast.weeklyRevenue} onChange={(band) => setForecastBand("weeklyRevenue", band)} />}
            </div>

            <div className="forecast-output">
              <div className={`basis-banner ${forecast.basis}`}><b>{forecast.basis === "guess" ? "Uncalibrated assumptions" : forecast.basis === "analog" ? "Analog-based assumptions" : "Observed-input assumptions"}</b><span>{forecast.basisNote || "No source or sample recorded. Use these ranges to expose uncertainty—not to imply confidence."}</span></div>
              <div className="initial-strip">
                <ForecastBars label="Initial cost" band={forecast.initialCost} formatter={money.format} adverseHigh />
                <ForecastBars label="Initial effort" band={forecast.initialEffort} formatter={(value) => `${compact.format(value)}h`} adverseHigh />
              </div>
              <div className="horizon-head"><div><span className="panel-label"><span>02</span> ONGOING RANGE</span><p>Week uses inputs; month = 52/12 weeks; year = 52 weeks.</p></div><div className="period-tabs" aria-label="Forecast period">{(["week", "month", "year"] as ForecastPeriod[]).map((period) => <button key={period} className={forecastPeriod === period ? "active" : ""} onClick={() => setForecastPeriod(period)}>{period}</button>)}</div></div>
              <div className="forecast-grid">
                <ForecastBars label="Cost" band={scaleBand(forecast.weeklyCost, periodMultiplier)} formatter={money.format} adverseHigh />
                <ForecastBars label="Effort" band={scaleBand(forecast.weeklyEffort, periodMultiplier)} formatter={(value) => `${compact.format(value)}h`} adverseHigh />
                {forecast.model === "audience" && <ForecastBars label="Published outputs" band={scaleBand(forecast.weeklyOutputs, periodMultiplier)} formatter={compact.format} />}
                <ForecastBars label={reachLabel} band={scaleBand(forecast.weeklyReach, periodMultiplier)} formatter={compact.format} />
                <ForecastBars label={conversionLabel} band={scaleBand(forecast.weeklyConversions, periodMultiplier)} formatter={compact.format} />
                <ForecastBars label={forecast.model === "audience" ? "Total creator revenue" : "Revenue"} band={scaleBand(weeklyRevenue, periodMultiplier)} formatter={money.format} />
                <ForecastBars label="Year-one owner cash*" band={yearOneCash} formatter={money.format} />
              </div>
              <p className="footnote">*Revenue less initial and ongoing forecast costs; before founder compensation, tax, working capital, bad debt and capacity constraints. P10 cash combines low revenue with high costs; P90 does the reverse.</p>
              <section className="horizon-figure" aria-labelledby="horizon-figure-title">
                <div className="horizon-figure-head"><div><span className="panel-label"><span>↗</span> HORIZON COMPARISON</span><h3 id="horizon-figure-title">Cost vs revenue vs owner cash</h3><p>Same run-rate assumptions at three categorical horizons—not a growth curve.</p></div><div className="chart-legend" aria-label="Chart legend"><span className="cost">Total cost</span><span className="revenue">Revenue</span><span className="profit">Owner cash / profit proxy</span></div></div>
                <div className="horizon-chart-grid">{percentiles.map((scenario) => <HorizonAreaChart key={scenario} scenario={scenario} forecast={forecast} domain={horizonDomain} />)}</div>
                <p className="chart-method">P10 pairs P10 revenue with P90 costs; P50 aligns central inputs; P90 pairs P90 revenue with P10 costs. Total cost includes initial plus ongoing cost. Owner cash excludes founder compensation, tax, working capital, bad debt and capacity effects.</p>
              </section>
              {forecast.model === "audience" && <>
                <div className="creator-ratios">
                  <ForecastBars label="Subscriber adds / view" band={subscriberRate} formatter={(value) => `${value.toFixed(1)}%`} />
                  <ForecastBars label="Blended revenue / 1K views" band={revenuePerThousandViews} formatter={money.format} />
                </div>
                <div className="creator-reality panel"><div className="panel-label"><span>!</span> CREATOR REALITY CHECKS</div><div>
                  <a href="https://support.google.com/youtube/answer/72851" target="_blank" rel="noreferrer"><b>Eligibility ≠ income</b><span>YouTube thresholds permit application and review; they do not guarantee acceptance, distribution or revenue.</span></a>
                  <a href="https://support.google.com/youtube/answer/9314416" target="_blank" rel="noreferrer"><b>Subscribers ≠ repeat use</b><span>Track returning viewers and watch behavior to test whether the channel creates a recurring habit.</span></a>
                  <a href="https://support.google.com/youtube/answer/1311392" target="_blank" rel="noreferrer"><b>Automation ≠ authentic value</b><span>AI can assist original work; generic, repetitive or mass-produced output can jeopardize monetization.</span></a>
                  <a href="https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers" target="_blank" rel="noreferrer"><b>Sponsor money ≠ neutral advice</b><span>Material relationships require clear disclosure; define conflicts and exclusions before accepting sponsors.</span></a>
                </div></div>
              </>}
            </div>
          </div>

          {forecast.model === "audience" ? <div className="crosscheck-section">
            <div className="panel-label"><span>03</span> CREATOR OPERATING CROSS-CHECK</div>
            <p>These ratios expose production load and concentration. They are arithmetic diagnostics, not creator benchmarks.</p>
            <div className="creator-ops-grid">
              <div className="metric-grid">
                <div><span>P50 hours / output</span><b>{p50Outputs > 0 ? `${perOutput(forecast.weeklyEffort.p50).toFixed(1)}h` : "—"}</b></div>
                <div><span>P50 cost / output</span><b>{p50Outputs > 0 ? money.format(perOutput(forecast.weeklyCost.p50)) : "—"}</b></div>
                <div><span>P50 views / output</span><b>{p50Outputs > 0 ? compact.format(perOutput(forecast.weeklyReach.p50)) : "—"}</b></div>
                <div><span>P50 revenue / output</span><b>{p50Outputs > 0 ? money.format(perOutput(weeklyRevenue.p50)) : "—"}</b></div>
              </div>
              <div className="panel creator-diagnostics">
                <div><span>Largest P50 revenue source</span><b>{weeklyRevenue.p50 > 0 ? `${revenueConcentration.toFixed(0)}% of total` : "No revenue assumed"}</b><p>Concentration creates sponsor, platform or offer dependency even when total revenue looks attractive.</p></div>
                <div><span>P50 weekly owner cash</span><b>{money.format(weeklyRevenue.p50 - forecast.weeklyCost.p50)}</b><p>Before founder compensation, tax, working capital, bad debt and production-capacity effects.</p></div>
                <div><span>12-week production load</span><b>{compact.format(forecast.weeklyEffort.p50 * 12)} hours</b><p>Compare this with the host and producer commitments stated in the creator thesis.</p></div>
                <div><span>Strongest creator evidence</span><b>L{idea.evidence + 1}: {activeEvidenceLevels[idea.evidence]}</b><p>Views and subscriptions can justify another test; repeat behavior and realized revenue justify stronger claims.</p></div>
              </div>
            </div>
          </div> : <div className="crosscheck-section">
            <div className="panel-label"><span>03</span> UNIT-ECONOMICS CROSS-CHECK</div>
            <p>Point assumptions answer a different question: if volume and unit contribution are true, does the operating model work?</p>
            <div className="sim-grid">
              <div className="panel inputs-panel">
                <Range label="Initial capex" value={idea.capex} onChange={(v) => update("capex", v)} max={25000} />
                <Range label="Monthly fixed opex" value={idea.opex} onChange={(v) => update("opex", v)} max={10000} />
                <Range label="Founder labor / week" value={idea.labor} onChange={(v) => update("labor", v)} max={80} suffix="h" />
                <Range label="Revenue / customer" value={idea.price} onChange={(v) => update("price", v)} max={20000} />
                <Range label="Variable cost / customer" value={idea.variableCost} onChange={(v) => update("variableCost", v)} max={10000} />
                <Range label="Customers / month" value={idea.customers} onChange={(v) => update("customers", v)} max={40} />
                <Range label="Paid acquisition / customer" value={idea.acquisitionCost} onChange={(v) => update("acquisitionCost", v)} max={5000} />
                <Range label="Physical effort" value={idea.physicalEffort} onChange={(v) => update("physicalEffort", v)} />
                <Range label="Mental complexity" value={idea.mentalEffort} onChange={(v) => update("mentalEffort", v)} />
              </div>
              <div className="sim-output">
                <div className="metric-grid">
                  <div><span>Contribution / customer</span><b>{money.format(econ.contribution)}</b></div>
                  <div><span>Monthly owner cash*</span><b className={econ.ownerCash >= 0 ? "positive" : "negative"}>{money.format(econ.ownerCash)}</b></div>
                  <div><span>Break-even customers</span><b>{Number.isFinite(econ.breakEven) ? econ.breakEven : "—"}</b></div>
                  <div><span>Capex payback*</span><b>{Number.isFinite(econ.payback) ? `${econ.payback.toFixed(1)} mo` : "—"}</b></div>
                </div>
                <p className="footnote">*Before founder compensation, tax, working capital, bad debt and capacity constraints.</p>
                <div className="panel risk-board">{[
                  ["Capex discipline", idea.capex <= 2500, `${money.format(idea.capex)} initial`],
                  ["Zero paid acquisition", idea.acquisitionCost === 0, `${money.format(idea.acquisitionCost)} / customer`],
                  ["Capacity", idea.customers * 4 <= idea.labor * 4, `${idea.customers * 4} est. delivery hours`],
                  ["Effort load", idea.physicalEffort + idea.mentalEffort <= 12, `${idea.physicalEffort + idea.mentalEffort}/20 combined`],
                  ["Stress case", ((Math.max(0, idea.price * .8 - idea.variableCost * 1.25 - idea.acquisitionCost * 1.25) * Math.floor(idea.customers * .7)) - idea.opex * 1.25) >= 0, `${money.format((Math.max(0, idea.price * .8 - idea.variableCost * 1.25 - idea.acquisitionCost * 1.25) * Math.floor(idea.customers * .7)) - idea.opex * 1.25)} / mo`],
                ].map(([label, pass, value]) => <div className="risk-line" key={String(label)}><i className={pass ? "pass" : "fail"} /><span>{label}</span><b>{value}</b></div>)}</div>
              </div>
            </div>
          </div>}

          <div className="compare-section">
            <div className="compare-title"><div><div className="panel-label"><span>04</span> RANK + COMPARE IDEAS</div><p>Rank one dimension at a time. No composite score can decide your tradeoff weights for you.</p></div><label><span>Rank by</span><select aria-label="Rank ideas by" value={rankBy} onChange={(e) => setRankBy(e.target.value as RankKey)}><option value="evidence">Evidence strength</option><option value="attractiveness">Attractiveness</option><option value="initialCost">Lowest P50 initial cost</option><option value="weeklyEffort">Lowest P50 weekly effort</option><option value="p10Revenue">P10 annual revenue</option><option value="p50Revenue">P50 annual revenue</option><option value="yearOneCash">P50 year-one cash</option></select></label></div>
            <div className="rank-table">
              <div className="rank-head"><span>#</span><span>Idea</span><span>Evidence</span><span>Attract.</span><span>P50 initial</span><span>P50 hrs/wk</span><span>P10 rev/yr</span><span>P50 rev/yr</span><span>P50 cash yr 1</span><span /></div>
              {rankedIdeas.map((item, index) => { const itemForecast = normalizeForecast(item.forecast); const itemRevenue = effectiveWeeklyRevenue(itemForecast); return <div className={item.id === idea.id ? "active" : ""} key={item.id}><b>{index + 1}</b><button className="idea-name" onClick={() => selectIdea(item)}><b>{item.name}</b><span>{item.sector}</span></button><span>L{item.evidence + 1}</span><span>{Math.round(attractiveness(item.scores))}</span><span>{money.format(itemForecast.initialCost.p50)}</span><span>{compact.format(itemForecast.weeklyEffort.p50)}</span><span>{money.format(itemRevenue.p10 * 52)}</span><span>{money.format(itemRevenue.p50 * 52)}</span><span>{money.format(yearOneCashBand(itemForecast).p50)}</span>{ideas.some((savedIdea) => savedIdea.id === item.id) ? <button className="delete" onClick={() => deleteIdea(item.id)} aria-label={`Delete ${item.name}`}>×</button> : <span />}</div>; })}
            </div>
            <div className="option-plot" aria-label="Ideas plotted by attractiveness and evidence">
              <div className="axis-y">EVIDENCE ↑</div><div className="axis-x">ATTRACTIVENESS →</div>
              <div className="quadrant q1">TEST COMMITMENT</div><div className="quadrant q2">INVEST NEXT TRANCHE</div><div className="quadrant q3">REFRAME</div><div className="quadrant q4">ATTRACTIVE FICTION</div>
              {comparisonIdeas.map((item) => <button title={item.name} key={item.id} className={item.id === idea.id ? "plot-dot active" : "plot-dot"} style={{ left: `${Math.max(4, Math.min(94, attractiveness(item.scores)))}%`, bottom: `${Math.max(5, (item.evidence / 7) * 88)}%` }} onClick={() => selectIdea(item)}><span>{item.name.slice(0, 18)}</span></button>)}
            </div>
          </div>
        </section>}

        {view === "automation" && <section className="page-pad">
          <div className="section-heading"><div><span className="kicker">AUTOMATION OPPORTUNITY MAP</span><h2>Automate the task, not the mythology.</h2></div><p>Sector match: <b>{idea.sector}</b>. These are research-backed analogies—not ROI claims for this idea.</p></div>
          <div className="automation-tabs"><button className={automationMode === "ai" ? "active" : ""} onClick={() => setAutomationMode("ai")}>AI-assisted</button><button className={automationMode === "nonAi" ? "active" : ""} onClick={() => setAutomationMode("nonAi")}>Deterministic / non-AI</button></div>
          <div className="automation-principle"><b>{automationMode === "ai" ? "Use AI where language, ambiguity and reviewability coexist." : "Prefer rules where the state, trigger and correct action are explicit."}</b><span>Start in shadow mode → measure exceptions → add human approval → expand only after error bounds are known.</span></div>
          <div className="automation-grid">{automations[automationMode].map((item, index) => <article key={item.title} className="automation-card">
            <div className="auto-head"><span>0{index + 1}</span><i>{automationMode === "ai" ? "AI" : "RULES"}</i></div><h3>{item.title}</h3><p>{item.task}</p>
            <dl><div><dt>Why it belongs</dt><dd>{item.why}</dd></div><div><dt>Cheapest valid test</dt><dd>{item.test}</dd></div><div><dt>Failure mode</dt><dd>{item.risk}</dd></div></dl>
            <a href={item.url} target="_blank" rel="noreferrer">{item.source} ↗</a>
          </article>)}</div>
          <div className="risk-callout"><b>AI risk gate</b><span>Do not automate consequential pricing, eligibility, medical/legal claims, safety decisions, or irreversible actions without domain review, auditability and a tested fallback. NIST AI RMF 1.0 is under revision as of August 2026.</span><a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noreferrer">NIST AI RMF ↗</a></div>
        </section>}

        {view === "evidence" && <section className="page-pad">
          <div className="section-heading"><div><span className="kicker">METHOD + PROVENANCE</span><h2>A decision system, not a score generator.</h2></div><p>Last research review: 9 Aug 2026. Links open the underlying source.</p></div>
          <div className="methodology-list">{methods.map(([n, title, text]) => <article key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
          <div className="evidence-contract panel"><div className="panel-label"><span>!</span> EVIDENCE CONTRACT</div><h3>Levels 1–4 can justify another experiment. They rarely justify scaling.</h3><div className="contract-grid"><div><b>Attractiveness</b><p>How good the opportunity would be if its premises were true.</p></div><div><b>Evidence quality</b><p>How costly and repeatable the observed customer behavior is.</p></div><div><b>Decision</b><p>The smallest next tranche that resolves the most dangerous uncertainty.</p></div></div></div>
          <div className="source-list"><div className="panel-label"><span>↗</span> SOURCES + LIMITS</div>{sources.map(([title, note, url]) => <a key={title} href={url} target="_blank" rel="noreferrer"><b>{title}</b><p>{note}</p><span>Open source ↗</span></a>)}</div>
        </section>}

        <footer><span>VENTURE SIGNAL / LOCAL-FIRST</span><p>Experiments update beliefs. They do not certify a business.</p></footer>
      </section>
    </main>
  );
}
