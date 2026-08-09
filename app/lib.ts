export type Scores = Record<(typeof dimensions)[number]["key"], number>;

export type Percentile = "p10" | "p50" | "p90";
export type ForecastBand = Record<Percentile, number>;
export type ForecastModel = "audience" | "customer";
export type CreatorRevenueKey = "platform" | "sponsor" | "affiliate" | "owned";
export type CreatorRevenueMix = Record<CreatorRevenueKey, ForecastBand>;

export type CreatorProfile = {
  audiencePromise: string;
  repeatReason: string;
  contentSystem: string;
  discoveryLoop: string;
  monetizationOrder: string;
  trustBoundary: string;
};

export type IdeaForecast = {
  model: ForecastModel;
  basis: "guess" | "analog" | "observed";
  basisNote: string;
  initialCost: ForecastBand;
  weeklyCost: ForecastBand;
  initialEffort: ForecastBand;
  weeklyEffort: ForecastBand;
  weeklyReach: ForecastBand;
  weeklyConversions: ForecastBand;
  weeklyRevenue: ForecastBand;
  weeklyOutputs: ForecastBand;
  creatorRevenue: CreatorRevenueMix;
};

export type Idea = {
  id: string;
  name: string;
  pitch: string;
  sector: Sector;
  customer: string;
  trigger: string;
  channel: string;
  priceProof: string;
  founderEdge: string;
  nonNegotiable: string;
  evidence: number;
  scores: Scores;
  capex: number;
  opex: number;
  labor: number;
  price: number;
  variableCost: number;
  customers: number;
  acquisitionCost: number;
  physicalEffort: number;
  mentalEffort: number;
  creator: CreatorProfile;
  forecast: IdeaForecast;
  updatedAt: string;
};

export type Sector = "creator" | "professional" | "local" | "commerce" | "hospitality" | "software" | "manufacturing";

export const dimensions = [
  { key: "problem", label: "Problem", note: "Severity, frequency, urgency", positive: true },
  { key: "access", label: "Buyer access", note: "Reach and sales friction", positive: true },
  { key: "wtp", label: "WTP", note: "Observed willingness to pay", positive: true },
  { key: "advantage", label: "Advantage", note: "Gain over current substitute", positive: true },
  { key: "feasibility", label: "Feasibility", note: "Technical and operational", positive: true },
  { key: "economics", label: "Economics", note: "Contribution and cash cycle", positive: true },
  { key: "risk", label: "Low risk", note: "Regulation, liability, dependency", positive: true },
  { key: "defensibility", label: "Compounding", note: "Learning, data, reputation", positive: true },
  { key: "fit", label: "Founder fit", note: "Credibility, energy, resources", positive: true },
  { key: "options", label: "Option value", note: "Adjacency and reversibility", positive: true },
] as const;

export const defaultScores = Object.fromEntries(dimensions.map((d) => [d.key, 5])) as Scores;

export const percentiles: Percentile[] = ["p10", "p50", "p90"];
export const creatorRevenueKeys: CreatorRevenueKey[] = ["platform", "sponsor", "affiliate", "owned"];
export const emptyCreatorProfile: CreatorProfile = {
  audiencePromise: "", repeatReason: "", contentSystem: "", discoveryLoop: "", monetizationOrder: "", trustBoundary: "",
};

const zeroBand = (): ForecastBand => ({ p10: 0, p50: 0, p90: 0 });

export function createForecast(model: ForecastModel = "customer"): IdeaForecast {
  return {
    model,
    basis: "guess",
    basisNote: "",
    initialCost: { p10: 500, p50: 1800, p90: 4000 },
    weeklyCost: { p10: 50, p50: 150, p90: 350 },
    initialEffort: { p10: 12, p50: 30, p90: 60 },
    weeklyEffort: { p10: 8, p50: 18, p90: 30 },
    weeklyReach: model === "audience" ? { p10: 100, p50: 1000, p90: 10000 } : { p10: 1, p50: 4, p90: 12 },
    weeklyConversions: model === "audience" ? { p10: 2, p50: 25, p90: 250 } : { p10: 0, p50: 1, p90: 3 },
    weeklyRevenue: model === "audience" ? zeroBand() : { p10: 0, p50: 1000, p90: 5000 },
    weeklyOutputs: model === "audience" ? { p10: 0.5, p50: 1, p90: 2 } : { p10: 1, p50: 2, p90: 4 },
    creatorRevenue: { platform: zeroBand(), sponsor: zeroBand(), affiliate: zeroBand(), owned: zeroBand() },
  };
}

function mergeBand(value: Partial<ForecastBand> | undefined, fallback: ForecastBand): ForecastBand {
  return {
    p10: Number.isFinite(value?.p10) ? Number(value?.p10) : fallback.p10,
    p50: Number.isFinite(value?.p50) ? Number(value?.p50) : fallback.p50,
    p90: Number.isFinite(value?.p90) ? Number(value?.p90) : fallback.p90,
  };
}

export function normalizeForecast(value?: Partial<IdeaForecast>): IdeaForecast {
  const fallback = createForecast(value?.model ?? "customer");
  const migratedPlatformRevenue = value?.model === "audience" && !value.creatorRevenue
    ? mergeBand(value.weeklyRevenue, fallback.weeklyRevenue)
    : fallback.creatorRevenue.platform;
  return {
    ...fallback,
    ...value,
    initialCost: mergeBand(value?.initialCost, fallback.initialCost),
    weeklyCost: mergeBand(value?.weeklyCost, fallback.weeklyCost),
    initialEffort: mergeBand(value?.initialEffort, fallback.initialEffort),
    weeklyEffort: mergeBand(value?.weeklyEffort, fallback.weeklyEffort),
    weeklyReach: mergeBand(value?.weeklyReach, fallback.weeklyReach),
    weeklyConversions: mergeBand(value?.weeklyConversions, fallback.weeklyConversions),
    weeklyRevenue: mergeBand(value?.weeklyRevenue, fallback.weeklyRevenue),
    weeklyOutputs: mergeBand(value?.weeklyOutputs, fallback.weeklyOutputs),
    creatorRevenue: {
      platform: mergeBand(value?.creatorRevenue?.platform, migratedPlatformRevenue),
      sponsor: mergeBand(value?.creatorRevenue?.sponsor, fallback.creatorRevenue.sponsor),
      affiliate: mergeBand(value?.creatorRevenue?.affiliate, fallback.creatorRevenue.affiliate),
      owned: mergeBand(value?.creatorRevenue?.owned, fallback.creatorRevenue.owned),
    },
  };
}

export function inferForecastModel(text: string): ForecastModel {
  return /youtube|podcast|channel|newsletter|audience|creator|media|content|subscriber|viewer/i.test(text) ? "audience" : "customer";
}

export function scaleBand(band: ForecastBand, multiplier: number): ForecastBand {
  return Object.fromEntries(percentiles.map((p) => [p, band[p] * multiplier])) as ForecastBand;
}

export function isOrderedBand(band: ForecastBand) {
  return band.p10 <= band.p50 && band.p50 <= band.p90;
}

export function effectiveWeeklyRevenue(forecast: IdeaForecast): ForecastBand {
  if (forecast.model !== "audience") return forecast.weeklyRevenue;
  return Object.fromEntries(percentiles.map((p) => [p, creatorRevenueKeys.reduce((sum, key) => sum + forecast.creatorRevenue[key][p], 0)])) as ForecastBand;
}

export function ratioBand(numerator: ForecastBand, denominator: ForecastBand, scale = 1): ForecastBand {
  const safe = (top: number, bottom: number) => bottom > 0 ? top / bottom * scale : 0;
  return {
    p10: safe(numerator.p10, denominator.p90),
    p50: safe(numerator.p50, denominator.p50),
    p90: safe(numerator.p90, denominator.p10),
  };
}

export function yearOneCashBand(forecast: IdeaForecast): ForecastBand {
  const revenue = effectiveWeeklyRevenue(forecast);
  return {
    p10: revenue.p10 * 52 - forecast.weeklyCost.p90 * 52 - forecast.initialCost.p90,
    p50: revenue.p50 * 52 - forecast.weeklyCost.p50 * 52 - forecast.initialCost.p50,
    p90: revenue.p90 * 52 - forecast.weeklyCost.p10 * 52 - forecast.initialCost.p10,
  };
}

export const evidenceLevels = [
  "Assertion / desk estimate",
  "Expert or customer opinion",
  "Recent behavior, spend, workaround",
  "Nonbinding action",
  "Costly commitment",
  "Purchase + product use",
  "Repeat purchase / retention",
  "Repeatable acquisition + positive contribution",
];

export const creatorEvidenceLevels = [
  "Creator assertion / desk estimate",
  "Viewer or expert opinion",
  "Observed search, watch or community behavior",
  "Click, subscription, signup or explicit return intent",
  "Meaningful watch time or repeat viewing",
  "First realized platform, sponsor, affiliate or owned-offer revenue",
  "Returning viewers, repeat sponsor or recurring buyer behavior",
  "Repeatable organic distribution + positive contribution",
];

export function evidenceLevelsFor(model: ForecastModel) {
  return model === "audience" ? creatorEvidenceLevels : evidenceLevels;
}

export const methods = [
  ["01", "Fit & affordable loss", "Inventory goals, edge, network, time, capital and non-negotiables."],
  ["02", "Opportunity set", "Generate customer × job × application combinations before choosing."],
  ["03", "Theory of value", "State what changed and why a buyer will switch, pay and stay."],
  ["04", "Buying-system discovery", "Reconstruct actual episodes across user, buyer, blocker and budget."],
  ["05", "Reference class", "Build bottom-up market, substitute map and base rates."],
  ["06", "Business-model system", "Map value creation, delivery, capture and dependencies."],
  ["07", "Critical assumptions", "Rank consequence × uncertainty; pre-register falsification thresholds."],
  ["08", "Behavioral demand", "Escalate from opinion to deposits, payment, use and retention."],
  ["09", "Feasibility + economics", "Prototype the bottleneck; model contribution, capacity and cash."],
  ["10", "Decision gate", "Fund only the next uncertainty-reducing milestone."],
] as const;

type Automation = {
  title: string;
  task: string;
  why: string;
  test: string;
  risk: string;
  source: string;
  url: string;
};

const commonAi: Automation[] = [
  {
    title: "Human-in-loop service copilot",
    task: "Retrieve policy and draft responses; a person approves consequential output.",
    why: "A field study in technical support found productivity gains concentrated among less-experienced agents; this is a reference class, not a forecast.",
    test: "Shadow 50 cases. Compare handle time, resolution and correction rate against manual work.",
    risk: "Wrong answers, privacy leakage, automation bias.",
    source: "NBER — Generative AI at Work",
    url: "https://www.nber.org/papers/w31161",
  },
  {
    title: "Draft → critique → approve",
    task: "Create first drafts of proposals, summaries, SOPs and client updates from approved facts.",
    why: "Experimental evidence supports gains on bounded knowledge-work tasks, but performance falls outside the model’s competence frontier.",
    test: "Randomize 20 comparable deliverables. Track elapsed time, defects and reviewer minutes.",
    risk: "Plausible fabrication and homogenized output.",
    source: "HBS — Jagged Technological Frontier",
    url: "https://www.hbs.edu/faculty/Pages/item.aspx?num=64700",
  },
];

const commonNonAi: Automation[] = [
  {
    title: "Quote-to-cash workflow",
    task: "Connect intake, scope template, e-signature, invoice, payment and ledger without re-keying.",
    why: "Integrated record-keeping can reduce manual entry and errors; benefits depend on clean process design.",
    test: "Run 10 transactions. Measure touches, cycle time, exceptions and days-to-cash.",
    risk: "Brittle integrations and silent mapping errors.",
    source: "HMRC — Making Tax Digital evaluation",
    url: "https://www.gov.uk/government/publications/estimating-the-wider-economic-benefit-of-making-tax-digital",
  },
  {
    title: "Rules-based intake + routing",
    task: "Validate required fields, qualify by explicit rules, create tasks and send status updates.",
    why: "This removes deterministic handoffs before adding probabilistic AI; cloud tools shift spend from capital to operating expense.",
    test: "Automate one path for two weeks; log every exception and manual override.",
    risk: "Bad rules scale bad process; edge cases can disappear.",
    source: "OECD — Digital Transformation of SMEs",
    url: "https://www.oecd.org/en/publications/the-digital-transformation-of-smes_bdb9256a-en.html",
  },
];

const sectorAdditions: Record<Sector, { ai: Automation[]; nonAi: Automation[] }> = {
  creator: {
    ai: [{
      title: "Packaging variant copilot", task: "Draft materially different title and thumbnail concepts from the approved episode promise; a human rejects misleading variants.",
      why: "YouTube’s native thumbnail experiment uses watch-time share, not clicks alone. That supports controlled testing, not a claim that AI variants will win.",
      test: "For eligible long-form videos, test up to three honest variants. Record watch-time share, test certainty and downstream retention.", risk: "Clickbait can raise starts while damaging trust or retention; small audiences may not resolve a winner.",
      source: "YouTube — Test & compare thumbnails", url: "https://support.google.com/youtube/answer/13861714",
    }, {
      title: "Source-grounded production copilot", task: "Turn approved sources and host notes into an outline, claim ledger, edit brief, chapters and derivative clips for human review.",
      why: "YouTube permits creative tools that support original work, but repetitive, generic or mass-produced output may be ineligible for monetization. Policy fit is not audience demand evidence.",
      test: "Shadow five episodes. Measure research omissions, expert corrections, edit hours and whether each episode remains substantively distinct.", risk: "Fabricated claims, flattened expert voice, misleading edits and inauthentic-content risk.",
      source: "YouTube — Channel monetization policies", url: "https://support.google.com/youtube/answer/1311392",
    }],
    nonAi: [{
      title: "Publishing preflight gate", task: "Require source, rights, sponsor, affiliate, synthetic-media, description and final-expert-review checks before scheduling.",
      why: "YouTube requires disclosure for certain realistic altered or synthetic content; FTC guidance requires disclosure of material brand relationships. Exact obligations remain fact-specific.",
      test: "Run the checklist on the first ten releases; log blocked defects, exceptions and review time.", risk: "Checkbox compliance can miss misleading substance, jurisdiction differences or platform-policy changes.",
      source: "YouTube — Altered content disclosure", url: "https://support.google.com/youtube/answer/14328491",
    }, {
      title: "Episode experiment ledger", task: "Join topic hypothesis, format, packaging variant, impressions, watch behavior, returning viewers, revenue source and production effort by episode.",
      why: "YouTube warns against reading CTR in isolation and defines returning viewers as prior viewers who came back. These diagnostics do not reveal causality by themselves.",
      test: "Pre-register one learning question per episode for eight releases; review by traffic source and cohort instead of declaring winners from single videos.", risk: "Small samples, changing audiences, survivor bias and optimizing platform metrics instead of durable trust.",
      source: "YouTube — Understand your audience", url: "https://support.google.com/youtube/answer/9314416",
    }],
  },
  professional: {
    ai: [{
      title: "Evidence-grounded research assistant", task: "Search an approved corpus and return claim-to-source links for analyst review.",
      why: "High leverage where work is text-heavy and reviewable; source coverage and retrieval quality are the bottlenecks.",
      test: "Blind-score 30 answers for source support, omissions and expert correction time.", risk: "Citation laundering, stale sources, confidentiality.",
      source: "NIST — Generative AI Profile", url: "https://doi.org/10.6028/NIST.AI.600-1",
    }],
    nonAi: [{
      title: "Reusable delivery system", task: "Templates, checklists, scheduling, reminders and client portal milestones.",
      why: "Standardizing the repeatable layer reduces coordination without delegating judgment.", test: "Time three projects before/after; count rework and dropped handoffs.", risk: "Over-standardizing bespoke work.",
      source: "OECD — SME digital tools", url: "https://www.oecd.org/en/publications/the-digital-transformation-of-smes_bdb9256a-en.html",
    }],
  },
  local: {
    ai: [{
      title: "Call and message triage", task: "Summarize inbound requests, identify missing facts and draft a response for approval.", why: "Customer-support assistance has field evidence; local-service economics still require a measured pilot.",
      test: "Route after-hours inquiries for 14 days; measure booked jobs, errors and response time.", risk: "Misquoted scope, emergencies, consent and call-recording rules.", source: "NBER — Generative AI at Work", url: "https://www.nber.org/papers/w31161",
    }],
    nonAi: [{
      title: "Booking → dispatch → payment", task: "Self-serve slots, route constraints, reminders, digital completion and card-on-file.", why: "Booking and business-management software are common SME tools; integration—not mere adoption—is the value hypothesis.",
      test: "Use one service zone; compare no-shows, drive time and cash collection.", risk: "Poor routes, schedule gaming, platform dependency.", source: "UK Small Business Survey 2024", url: "https://www.gov.uk/government/statistics/small-business-survey-2024-businesses-with-employees",
    }],
  },
  commerce: {
    ai: [{
      title: "Catalog enrichment with QA", task: "Draft structured attributes, comparison copy and support answers from product records.", why: "A bounded corpus makes review possible; gains must be measured against error-driven returns and support load.",
      test: "A/B 50 SKUs; inspect conversion, return reasons and correction rate.", risk: "Invented claims, IP issues, inconsistent brand voice.", source: "NIST — Generative AI Profile", url: "https://doi.org/10.6028/NIST.AI.600-1",
    }],
    nonAi: [{
      title: "Inventory threshold + replenishment", task: "Trigger purchase suggestions from on-hand, lead time and service-level rules.", why: "Integrated information flows are a core ERP use case; start with recommendations, not autonomous buying.",
      test: "Backtest 12 weeks; compare stockouts, inventory days and expedited freight.", risk: "Bad lead-time data and demand shocks.", source: "OECD — E-business measurement", url: "https://www.oecd.org/en/publications/measuring-the-digital-transformation_9789264311992-en.html",
    }],
  },
  hospitality: {
    ai: [{
      title: "Multilingual guest-message copilot", task: "Draft replies from property policies, booking context and local guidance.", why: "Language-heavy support is a plausible transfer from customer-service studies, but property-specific accuracy is unproven.",
      test: "Pilot low-risk FAQs only; track escalation, correction and guest rating.", risk: "Unsafe local advice, policy errors, sensitive guest data.", source: "OECD — Generative AI and SME workforce", url: "https://www.oecd.org/en/publications/generative-ai-and-the-sme-workforce_2d08b99d-en.html",
    }],
    nonAi: [{
      title: "Booking + turnover orchestration", task: "Sync reservations, deposits, access codes, cleaning tasks and inspection exceptions.", why: "E-booking adoption is higher in hospitality in OECD survey data; the causal value still needs local measurement.",
      test: "One property for one month; measure coordination minutes and missed turnovers.", risk: "Lockout, double booking, vendor dependency.", source: "OECD — Western Balkans Enterprise Survey 2026", url: "https://www.oecd.org/en/publications/western-balkans-enterprise-survey_a1b14188-en.html",
    }],
  },
  software: {
    ai: [{
      title: "Support-to-product intelligence", task: "Cluster tickets, suggest known fixes and draft evidence-linked issue summaries.", why: "Support is the best-studied enterprise GenAI reference class; product-specific deployment effects remain uncertain.",
      test: "Shadow 100 tickets; measure resolution, deflection and incorrect suggestions.", risk: "Private data exposure and false fixes.", source: "NBER — Generative AI at Work", url: "https://www.nber.org/papers/w31161",
    }],
    nonAi: [{
      title: "Self-serve provisioning + billing", task: "Create tenant, enforce plan limits, meter usage, invoice and revoke on explicit events.", why: "Deterministic provisioning reduces manual marginal cost and exposes unit economics early.",
      test: "Automate the happy path; require manual approval for exceptions; measure failure rate.", risk: "Entitlement bugs and revenue leakage.", source: "OECD — Digital Transformation of SMEs", url: "https://www.oecd.org/en/publications/the-digital-transformation-of-smes_bdb9256a-en.html",
    }],
  },
  manufacturing: {
    ai: [{
      title: "Inspection decision support", task: "Flag visual anomalies for a trained operator; retain images and decisions for audit.", why: "NIST identifies machine vision and inspection as common automation applications; a site-specific gauge study is required.",
      test: "Blind compare against inspectors; pre-set false-negative tolerance.", risk: "Safety defects, distribution shift, inadequate traceability.", source: "NIST — Robotics and Manufacturing Automation", url: "https://www.nist.gov/mep/robotics-and-manufacturing-automation",
    }],
    nonAi: [{
      title: "Barcode + poka-yoke workflow", task: "Scan material and route only valid part/process combinations; stop exceptions.", why: "Simple sensors and rule controls may beat flexible AI when the process is stable and errors are costly.",
      test: "One cell; measure defects, cycle time and workarounds before expanding.", risk: "Workarounds, downtime and hidden process variation.", source: "NIST — Manufacturers’ Guide to Industry 4.0", url: "https://www.nist.gov/system/files/documents/2022/09/14/MEPNN%20Manufacturers%20Guide%20to%20Industry%204.0%20Technologies-508.pdf",
    }],
  },
};

export function automationsFor(sector: Sector) {
  return { ai: [...sectorAdditions[sector].ai, ...commonAi], nonAi: [...sectorAdditions[sector].nonAi, ...commonNonAi] };
}

export function inferSector(text: string): Sector {
  const value = text.toLowerCase();
  if (/youtube|podcast|newsletter|creator|channel|audience|subscriber|viewer|content business|media business/.test(value)) return "creator";
  if (/manufactur|factory|fabricat|warehouse|machine|robot/.test(value)) return "manufacturing";
  if (/hotel|rental|guest|travel|restaurant|cabin|lodg/.test(value)) return "hospitality";
  if (/shop|store|retail|e-?commerce|product|brand|marketplace/.test(value)) return "commerce";
  if (/software|saas|app|platform|api|data|developer/.test(value)) return "software";
  if (/home service|clean(?:ing)?|repair|landscap|plumb|electrician|hvac|mobile (?:service|detail|mechanic)|contractor/.test(value)) return "local";
  return "professional";
}

export function attractiveness(scores: Scores) {
  return Math.round(Object.values(scores).reduce((sum, value) => sum + value, 0) * 10) / Object.values(scores).length;
}

export function gateFor(score: number, evidence: number, model: ForecastModel = "customer") {
  if (score < 45) return { label: "PAUSE / REFRAME", tone: "red", reason: "The model is weak even before stronger evidence." };
  if (evidence < 2) return { label: "DISCOVER", tone: "amber", reason: "Use behavior-focused discovery; do not build yet." };
  if (evidence < 4) return model === "audience"
    ? { label: "TEST WATCH BEHAVIOR", tone: "amber", reason: "Publish the smallest coherent batch and pre-set watch/return thresholds." }
    : { label: "TEST COMMITMENT", tone: "amber", reason: "Seek a costly commitment with a pre-set threshold." };
  if (score < 65) return { label: "PIVOT / NARROW", tone: "amber", reason: "Evidence exists, but the opportunity design is still marginal." };
  if (evidence < 6) return model === "audience"
    ? { label: "TEST MONETIZATION", tone: "green", reason: "Test one trust-compatible revenue source; views alone are not a business." }
    : { label: "PAID PILOT", tone: "green", reason: "Fund only a manual or concierge proof of delivery." };
  return { label: "REPEATABILITY TEST", tone: "green", reason: "Test retention and repeatable acquisition before scaling." };
}

export function economics(idea: Idea) {
  const contribution = Math.max(0, idea.price - idea.variableCost - idea.acquisitionCost);
  const monthlyContribution = contribution * idea.customers;
  const ownerCash = monthlyContribution - idea.opex;
  const breakEven = contribution > 0 ? Math.ceil(idea.opex / contribution) : Infinity;
  const payback = ownerCash > 0 ? idea.capex / ownerCash : Infinity;
  return { contribution, monthlyContribution, ownerCash, breakEven, payback };
}

export const sources = [
  ["Entrepreneur-as-scientist RCT", "116 Italian startups; theory + rigorous hypothesis testing improved decision precision.", "https://pubsonline.informs.org/doi/10.1287/mnsc.2018.3249"],
  ["Scientific Method for Startups", "Theory-led experiments test causal beliefs, not merely convenient signals.", "https://journals.sagepub.com/doi/10.1177/01492063231226136"],
  ["Willingness-to-pay meta-analysis", "Hypothetical WTP averaged 21% above real WTP across the reviewed studies.", "https://link.springer.com/article/10.1007/s11747-019-00666-6"],
  ["Experimentation and startup performance", "A/B testing adoption was associated with improved startup performance; observational, high-tech setting.", "https://pubsonline.informs.org/doi/10.1287/mnsc.2021.4209"],
  ["NIST AI Risk Management Framework", "Voluntary framework for incorporating trustworthiness into AI design, use and evaluation.", "https://www.nist.gov/itl/ai-risk-management-framework"],
  ["OECD: Generative AI and SME workforce", "Survey and research synthesis; reports workload and performance effects with strong context dependence.", "https://www.oecd.org/en/publications/generative-ai-and-the-sme-workforce_2d08b99d-en.html"],
  ["HMRC: Making Tax Digital", "Survey-based estimates found record-keeping time savings; UK VAT context limits transferability.", "https://www.gov.uk/government/publications/estimating-the-wider-economic-benefit-of-making-tax-digital"],
  ["NIST: Robotics and automation", "Common small-manufacturer applications and a measurement-first implementation process.", "https://www.nist.gov/mep/robotics-and-manufacturing-automation"],
  ["YouTube Partner Program eligibility", "Eligibility thresholds permit application and review; they do not guarantee acceptance, reach or income.", "https://support.google.com/youtube/answer/72851"],
  ["YouTube channel monetization policies", "Original, authentic value matters; repetitive, generic or mass-produced content can be ineligible even when AI use itself is permitted.", "https://support.google.com/youtube/answer/1311392"],
  ["YouTube audience analytics", "Defines returning, new, casual and regular viewers; metrics describe behavior but do not establish why it occurred.", "https://support.google.com/youtube/answer/9314416"],
  ["FTC creator disclosure guidance", "Material connections to brands require clear disclosure; application remains fact- and jurisdiction-dependent.", "https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers"],
] as const;
