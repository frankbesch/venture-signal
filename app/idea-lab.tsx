"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Idea, Scores, attractiveness, automationsFor, defaultScores, dimensions,
  economics, evidenceLevels, gateFor, inferSector, methods, sources,
} from "./lib";

type View = "explore" | "evaluate" | "compare" | "automation" | "evidence";

const STORE_KEY = "venture-signal-v1";
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
  acquisitionCost: 0, physicalEffort: 2, mentalEffort: 7, updatedAt: "2026-08-09",
};

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="field"><span>{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>;
}

function Range({ label, value, onChange, min = 0, max = 10, suffix = "" }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; suffix?: string }) {
  return <label className="range-field"><span>{label}<b>{value}{suffix}</b></span><input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} /></label>;
}

export function IdeaLab() {
  const [view, setView] = useState<View>("explore");
  const [idea, setIdea] = useState<Idea>(starterIdea);
  const [ideas, setIdeas] = useState<Idea[]>([starterIdea]);
  const [grilling, setGrilling] = useState(false);
  const [saved, setSaved] = useState(false);
  const [automationMode, setAutomationMode] = useState<"ai" | "nonAi">("ai");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Idea[];
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
  const gate = gateFor(score, idea.evidence);
  const econ = economics(idea);
  const automations = useMemo(() => automationsFor(idea.sector), [idea.sector]);
  const missing = [idea.customer, idea.trigger, idea.channel, idea.priceProof, idea.founderEdge, idea.nonNegotiable].filter((v) => !v.trim()).length;

  const saveIdea = () => {
    const normalized = { ...idea, sector: inferSector(`${idea.pitch} ${idea.customer}`) };
    const next = [normalized, ...ideas.filter((item) => item.id !== normalized.id)].slice(0, 8);
    setIdea(normalized); setIdeas(next); localStorage.setItem(STORE_KEY, JSON.stringify(next)); setSaved(true);
  };

  const startNew = () => {
    const next: Idea = { ...starterIdea, ...{
      id: `idea-${Date.now()}`, name: "Untitled idea", pitch: "", customer: "", trigger: "", channel: "",
      priceProof: "", founderEdge: "", nonNegotiable: "≤ $2,500 initial capex; no paid acquisition initially",
      scores: { ...defaultScores }, evidence: 0, updatedAt: new Date().toISOString().slice(0, 10),
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
    setGrilling(true);
    window.setTimeout(() => {
      const questions = document.getElementById("grill-questions");
      questions?.scrollIntoView({ behavior: "smooth", block: "start" });
      questions?.focus({ preventScroll: true });
    }, 0);
  };

  const setScore = (key: keyof Scores, value: number) => update("scores", { ...idea.scores, [key]: value });

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
                <div className="ladder">{evidenceLevels.map((level, index) => <button key={level} className={idea.evidence === index ? "selected" : index < idea.evidence ? "passed" : ""} onClick={() => update("evidence", index)}><span>{index + 1}</span><p>{level}</p><i>{index === idea.evidence ? "STRONGEST OBSERVED" : ""}</i></button>)}</div>
              </div>
              <div className={`gate-card ${gate.tone}`}><span>NEXT GATE</span><h3>{gate.label}</h3><p>{gate.reason}</p><button onClick={() => setView("compare")}>Compare options →</button></div>
            </div>
          </div>
          <div className="theory-card panel"><div><span className="panel-label"><span>C</span> THEORY OF VALUE</span><h3>Because <mark>the trigger changed</mark>, if we deliver <mark>the offer</mark>, <mark>this buyer</mark> will obtain <mark>a measurable outcome</mark>, switch from <mark>the current substitute</mark>, and let us capture <mark>enough value</mark>.</h3></div><p>Every highlighted phrase is a premise. Convert the weakest one into a prediction with a threshold before you test it.</p></div>
        </section>}

        {view === "compare" && <section className="page-pad">
          <div className="section-heading"><div><span className="kicker">COMPARE + SIMULATE</span><h2>Find the cheap failure point.</h2></div><p>Ranges beat point forecasts. These figures are user assumptions, not predictions.</p></div>
          <div className="sim-grid">
            <div className="panel inputs-panel">
              <div className="panel-label"><span>01</span> OPERATING ASSUMPTIONS</div>
              <Range label="Initial capex" value={idea.capex} onChange={(v) => update("capex", v)} max={25000} suffix="" />
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
              <div className="panel risk-board"><div className="panel-label"><span>02</span> STRESS SIGNALS</div>
                {[
                  ["Capex discipline", idea.capex <= 2500, `${money.format(idea.capex)} initial`],
                  ["Zero paid acquisition", idea.acquisitionCost === 0, `${money.format(idea.acquisitionCost)} / customer`],
                  ["Capacity", idea.customers * 4 <= idea.labor * 4, `${idea.customers * 4} est. delivery hours`],
                  ["Effort load", idea.physicalEffort + idea.mentalEffort <= 12, `${idea.physicalEffort + idea.mentalEffort}/20 combined`],
                  ["Stress case", ((Math.max(0, idea.price * .8 - idea.variableCost * 1.25 - idea.acquisitionCost * 1.25) * Math.floor(idea.customers * .7)) - idea.opex * 1.25) >= 0, `${money.format((Math.max(0, idea.price * .8 - idea.variableCost * 1.25 - idea.acquisitionCost * 1.25) * Math.floor(idea.customers * .7)) - idea.opex * 1.25)} / mo`],
                ].map(([label, pass, value]) => <div className="risk-line" key={String(label)}><i className={pass ? "pass" : "fail"} /><span>{label}</span><b>{value}</b></div>)}
              </div>
            </div>
          </div>
          <div className="compare-section">
            <div className="panel-label"><span>03</span> SAVED OPTION SET</div>
            <div className="option-plot" aria-label="Ideas plotted by attractiveness and evidence">
              <div className="axis-y">EVIDENCE ↑</div><div className="axis-x">ATTRACTIVENESS →</div>
              <div className="quadrant q1">TEST COMMITMENT</div><div className="quadrant q2">INVEST NEXT TRANCHE</div><div className="quadrant q3">REFRAME</div><div className="quadrant q4">ATTRACTIVE FICTION</div>
              {ideas.map((item) => <button title={item.name} key={item.id} className={item.id === idea.id ? "plot-dot active" : "plot-dot"} style={{ left: `${Math.max(4, Math.min(94, attractiveness(item.scores)))}%`, bottom: `${Math.max(5, (item.evidence / 7) * 88)}%` }} onClick={() => setIdea(item)}><span>{item.name.slice(0, 18)}</span></button>)}
            </div>
            <div className="idea-table">{ideas.map((item) => <div key={item.id}><button className="idea-name" onClick={() => setIdea(item)}><b>{item.name}</b><span>{item.sector}</span></button><strong>{Math.round(attractiveness(item.scores))}</strong><span>L{item.evidence + 1} evidence</span><span>{gateFor(attractiveness(item.scores), item.evidence).label}</span><button className="delete" onClick={() => deleteIdea(item.id)} aria-label={`Delete ${item.name}`}>×</button></div>)}</div>
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
