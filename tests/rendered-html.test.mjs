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
});
