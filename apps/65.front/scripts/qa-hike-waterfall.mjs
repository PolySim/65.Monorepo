/* global document -- Browser callbacks executed by Playwright. */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { setTimeout as delay } from "node:timers/promises";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({ options: {
  playwright: { type: "string", default: "playwright" },
  chromium: { type: "string" },
  runs: { type: "string", default: "3" },
  "client-delay": { type: "string", default: "300" },
  verify: { type: "boolean" },
  origin: { type: "string", default: "http://127.0.0.1:46254" },
} });
const { chromium } = createRequire(import.meta.url)(args.playwright);
const { origin } = args;
assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
const collection = "/categories/ski/states/south";
const detail = `${collection}/hike/`;
const browser = await chromium.launch({ executablePath: args.chromium });
let sequence = 0;

async function scenario(mode = "normal", clientDelay = Number(args["client-delay"]), heldPosts) {
  const context = await browser.newContext();
  await context.addCookies([
    { name: "qa-ui", value: mode, url: origin },
    { name: "qa-run", value: `${Date.now()}-${++sequence}`, url: origin },
  ]);
  await context.route("**/*", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.origin !== origin) return route.abort();
    if (heldPosts && req.method() === "POST") await heldPosts;
    if (req.method() === "POST" || url.pathname.startsWith(detail) ||
        /^\/api\/(?:gpx|images|hikes)\b/.test(url.pathname)) await delay(clientDelay);
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  return { context, page };
}

try {
  for (const navigation of ["direct", "click"]) {
    for (let run = 1; run <= Number(args.runs); run++) {
      const { context, page } = await scenario();
      const requests = new Map();
      page.on("request", (req) => {
        const url = new URL(req.url());
        if (url.origin !== origin || url.pathname.startsWith("/_next/")) return;
        requests.set(req, { method: req.method(), path: url.pathname,
          rsc: url.searchParams.has("_rsc"), action: req.headers()["next-action"],
          start: Date.now() });
      });
      page.on("response", (resp) => {
        const row = requests.get(resp.request());
        if (row) Object.assign(row, { headers: Date.now(), status: resp.status() });
      });
      page.on("requestfinished", (req) => {
        const row = requests.get(req);
        if (row) row.end = Date.now();
      });
      const link = page.getByRole("link", { name: /Parcours wide/ });
      if (navigation === "click") {
        await page.goto(origin + collection);
        await link.waitFor();
      }
      const start = Date.now();
      if (navigation === "click") await link.click();
      else await page.goto(`${origin}${detail}wide`, { waitUntil: "commit" });
      const titleMark = await page.waitForFunction(() => {
        const heading = document.querySelector("h1#hike-title");
        return heading?.textContent === "Parcours wide" && heading.getClientRects().length && Date.now();
      });
      const title = await titleMark.jsonValue();
      await page.locator('button[aria-label="Ajouter aux favoris"]:enabled').waitFor();
      await page.waitForFunction(() => !!document.querySelector(".leaflet-container"));
      const waterfall = [...requests.values()].filter((r) => r.start >= start || r.path.startsWith(detail));
      const posts = waterfall.filter((r) => r.method === "POST" && r.path.startsWith(detail));
      console.log(JSON.stringify({ navigation, run, start, title, titleMs: title - start, posts: posts.length, waterfall }));
      if (args.verify) {
        for (const path of ["/api/gpx", "/api/hikes/wide/favorite"]) {
          assert.ok(waterfall.some((r) => r.method === "GET" && r.path === path && r.status === 200));
        }
      }
      await context.close();
    }
  }
  if (args.verify) {
    const { context, page } = await scenario("detail-retry", 0);
    await page.goto(`${origin}${detail}wide`);
    await page.getByRole("heading", { name: "Impossible de charger cette activité" }).waitFor();
    await page.getByRole("button", { name: "Réessayer", exact: true }).first().click();
    await page.getByRole("heading", { name: "Parcours wide", exact: true }).waitFor();
    await page.goto(`${origin}${detail}missing`);
    await page.getByRole("heading", { name: "Randonnée introuvable" }).waitFor();
    await page.goto(`${origin}${detail}missing-empty`);
    await page.getByRole("heading", { name: "Randonnée introuvable" }).waitFor();
    await page.getByRole("link", { name: "Activités du massif" }).click();
    await page.getByRole("link", { name: /Parcours single/ }).click();
    await page.locator("h1#hike-title").filter({ hasText: "Parcours single" }).waitFor();
    await page.goBack();
    await page.waitForURL(origin + collection);
    await page.getByRole("link", { name: /Parcours wide/ }).click();
    await page.locator("h1#hike-title").filter({ hasText: "Parcours wide" }).waitFor();
    // A fresh account session must receive its own server snapshot for the same URL.
    const other = await scenario("detail-other", 0);
    const response = await other.context.request.get(`${origin}${detail}wide`);
    assert.match(response.headers()["cache-control"], /private.*no-store/);
    const html = await response.text();
    assert.match(html, /id="hike-title"[^>]*>Autre compte fictif<\/h1>/);
    assert.match(html, /<img[^>]*alt="Paysage de la randonnée Autre compte fictif"/);
    await other.page.goto(`${origin}${detail}wide`);
    await other.page.getByRole("heading", { name: "Autre compte fictif", exact: true }).waitFor();
    const saved = await scenario("saved", 0);
    const favoritePath = `${origin}/api/hikes/wide/favorite`;
    const savedResponse = await saved.context.request.get(favoritePath);
    assert.match(savedResponse.headers()["cache-control"], /private.*no-store/);
    assert.deepEqual(await savedResponse.json(), { isFavorite: true });
    assert.deepEqual(await (await other.context.request.get(favoritePath)).json(), { isFavorite: false });
    const anonymous = await browser.newContext();
    assert.equal((await anonymous.request.get(favoritePath)).status(), 401);
    let releasePosts;
    const postsGate = new Promise((resolve) => { releasePosts = resolve; });
    const gated = await scenario("normal", 0, postsGate);
    try {
      await gated.page.goto(`${origin}${detail}wide`, { waitUntil: "commit" });
      await gated.page.locator("h1#hike-title").waitFor();
    } finally {
      releasePosts();
    }
    for (const ctx of [context, other.context, saved.context, anonymous, gated.context]) await ctx.close();
    console.log("OK: retry serveur, absence 404/200 vide, navigation retour, titre sans POST, HTML privé et sessions isolées");
  }
} finally {
  await browser.close();
}
