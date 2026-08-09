import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the decision workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Venture Signal/);
  assert.match(html, /Evidence before enthusiasm/i);
  assert.match(html, /Grill this idea/i);
  assert.match(html, /aria-controls="grill-questions"/i);
  assert.match(html, /Ten lenses\. One staged decision/);
  assert.match(html, /Local only/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("ships the evidence hierarchy and source provenance", async () => {
  const [library, interfaceSource] = await Promise.all([
    readFile(new URL("../app/lib.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/idea-lab.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(library, /Assertion \/ desk estimate/);
  assert.match(library, /Repeatable acquisition/);
  assert.match(library, /Entrepreneur-as-scientist RCT/);
  assert.match(library, /NIST AI Risk Management Framework/);
  assert.match(interfaceSource, /Experiments update beliefs/);
  assert.match(interfaceSource, /scrollIntoView/);
  assert.match(interfaceSource, /Review grill questions/);
});

test("keeps scenario ranges explicit and rankings dimension-specific", async () => {
  const [library, interfaceSource, method] = await Promise.all([
    readFile(new URL("../app/lib.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/idea-lab.tsx", import.meta.url), "utf8"),
    readFile(new URL("../docs/method.md", import.meta.url), "utf8"),
  ]);

  assert.match(library, /type Percentile = "p10" \| "p50" \| "p90"/);
  assert.match(library, /weeklyReach: ForecastBand/);
  assert.match(library, /weeklyConversions: ForecastBand/);
  assert.match(library, /weeklyRevenue: ForecastBand/);
  assert.match(library, /revenue\.p10 \* 52 - forecast\.weeklyCost\.p90 \* 52 - forecast\.initialCost\.p90/);
  assert.match(interfaceSource, /MONTH_WEEKS = 52 \/ 12/);
  assert.match(interfaceSource, /P10\/P50\/P90 are editable scenario bounds/);
  assert.match(interfaceSource, /Rank one dimension at a time/);
  assert.match(interfaceSource, /Rank ideas by/);
  assert.match(interfaceSource, /P50 year-one cash/);
  assert.match(method, /not empirically\s+calibrated quantiles, confidence intervals, or probabilities of success/i);
  assert.match(method, /No default composite rank is permitted/i);
});

test("treats creator businesses as audience, production, revenue, and trust systems", async () => {
  const [library, interfaceSource, method] = await Promise.all([
    readFile(new URL("../app/lib.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/idea-lab.tsx", import.meta.url), "utf8"),
    readFile(new URL("../docs/method.md", import.meta.url), "utf8"),
  ]);

  assert.match(library, /"creator" \| "professional"/);
  assert.match(library, /Meaningful watch time or repeat viewing/);
  assert.match(library, /First realized platform, sponsor, affiliate or owned-offer revenue/);
  assert.match(library, /creatorRevenueKeys\.reduce/);
  assert.match(library, /TEST WATCH BEHAVIOR/);
  assert.match(library, /YouTube — Channel monetization policies/);
  assert.match(interfaceSource, /CREATOR BUSINESS LENS/);
  assert.match(interfaceSource, /Views are an intermediate outcome/);
  assert.match(interfaceSource, /Keep untested sources at \$0/);
  assert.match(interfaceSource, /Eligibility ≠ income/);
  assert.match(interfaceSource, /Subscriber adds \/ view/);
  assert.match(interfaceSource, /CREATOR OPERATING CROSS-CHECK/);
  assert.match(interfaceSource, /P50 hours \/ output/);
  assert.match(method, /A subscription\s+remains a nonbinding action; it is not retention/i);
  assert.match(method, /not platform benchmarks/i);
});
