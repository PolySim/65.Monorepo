/* global document, MutationObserver, window -- Playwright callbacks. */
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { once } from "node:events";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { setTimeout as sleep } from "node:timers/promises";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
  },
});
const { chromium } = createRequire(import.meta.url)(values.playwright);
const origin = "http://localhost:46264";
const categoryPath = "/categories/ski";
const statePath = `${categoryPath}/states/south`;
const hikePath = `${statePath}/hike/crest`;
const statusPath = "/hikes/crest/favorite";
const listPath = "/hikes/favorites";
const state = { id: "south", name: "Massif fictif", image_path: null };
const category = { id: "ski", name: "Ski fictif", image_path: null };
const hike = {
  id: "crest",
  title: "Crête fictive",
  state,
  category,
  images: [],
  gpxFiles: [],
};
const favorites = { a: true, b: false };
const calls = [];
const gates = new Map();
for (const path of ["/users", listPath, statusPath]) {
  let resolve;
  const promise = new Promise((release) => {
    resolve = release;
  });
  gates.set(path, { promise, resolve });
}

async function body(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString());
}

const fixture = createServer(async (req, res) => {
  const { pathname: path } = new URL(req.url, origin);
  const account = /(?:^|;\s*)qa-data=([ab])(?:;|$)/.exec(
    req.headers.cookie ?? "",
  )?.[1];
  const user = (id) => ({
    id,
    email: `${id}@example.test`,
    name: `Compte ${id}`,
  });
  const json = (data, status = 200, headers = {}) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...headers,
    });
    res.end(JSON.stringify(data));
  };

  if (path === "/api/auth/sign-in/email" && req.method === "POST") {
    const { email, password } = await body(req);
    const id = { "a@example.test": "a", "b@example.test": "b" }[email];
    if (!id || password !== "fixture-password")
      return json({ message: "Invalid fixture account" }, 401);
    return json({ user: user(id), redirect: false }, 200, {
      "Set-Cookie": `qa-data=${id}; Path=/; HttpOnly; SameSite=Lax`,
    });
  }
  if (path === "/api/auth/sign-out" && req.method === "POST") {
    return json({ success: true }, 200, {
      "Set-Cookie": "qa-data=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax",
    });
  }
  if (path === "/api/auth/get-session")
    return json(account ? { user: user(account) } : null);
  if (!account) return json(null, 401);

  calls.push({ account, path, method: req.method });
  if (account === "b" && req.method === "GET") await gates.get(path)?.promise;
  if (path === "/users")
    return json({
      ...user(account),
      authUserId: account,
      roleId: account === "a" ? 1 : 0,
    });
  if (path === "/categories") return json([{ ...category, states: [state] }]);
  if (path === "/hikes/filters") return json([hike]);
  if (path === listPath) return json(favorites[account] ? [hike] : []);
  if (path === statusPath) {
    if (req.method === "PUT") favorites[account] = (await body(req)).isFavorite;
    return json({ isFavorite: favorites[account] });
  }
  if (path === "/hikes/crest") return json(hike);
  return json(null, 404);
});

const count = (path, account, method = "GET") =>
  calls.filter(
    (call) =>
      call.path === path && call.account === account && call.method === method,
  ).length;
async function waitForRead(path) {
  for (let i = 0; i < 200; i++) {
    if (count(path, "b")) return;
    await sleep(50);
  }
  assert.fail(`Pas de GET de B sur ${path}`);
}

let browser;
try {
  fixture.listen(46263, "127.0.0.1");
  await once(fixture, "listening");
  browser = await chromium.launch({ executablePath: values.chromium });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 850 },
  });
  page.setDefaultTimeout(10_000);
  await page.route("**/*", (route) =>
    new URL(route.request().url()).origin === origin
      ? route.continue()
      : route.abort(),
  );
  await page.goto(`${origin}/auth/signIn`);
  // Track transient renders, not just the settled DOM after the request.
  await page.evaluate(() => {
    window.dataQa = { watch: false, leaks: [] };
    new MutationObserver(() => {
      if (!window.dataQa.watch) return;
      const record = (leak) => window.dataQa.leaks.push(leak);
      if (document.querySelector('header a[href="/admin"]')) record("rôle A");
      if (
        location.pathname === "/favorites" &&
        document.querySelector("main")?.textContent.includes("Crête fictive")
      )
        record("liste A");
      if (
        document.querySelector(
          'button[aria-label="Retirer des favoris"][aria-pressed="true"]',
        )
      )
        record("cœur A");
    }).observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    });
  });

  const signIn = async (account) => {
    await page
      .getByRole("textbox", { name: "Adresse e-mail" })
      .fill(`${account}@example.test`);
    await page.getByLabel("Mot de passe").fill("fixture-password");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.waitForURL(`${origin}/`);
  };
  const favoriteLink = page
    .getByRole("banner")
    .getByRole("link", { name: "Favoris", exact: true });
  const adminLink = page.getByRole("link", {
    name: "Administration",
    exact: true,
  });
  const hikeLink = page.locator(`main a[href="${hikePath}"]`);
  const heart = page.locator(
    'nav[aria-label="Actions de la randonnée"] button[aria-label$="favoris"]',
  );
  const openCategory = async () => {
    await page
      .getByRole("link", { name: /^Ski fictif/, exact: false })
      .first()
      .click();
    await page.waitForURL(`${origin}${categoryPath}`);
    await hikeLink.waitFor();
  };

  await signIn("a");
  assert.equal(
    await page.evaluate(() => !!window.dataQa),
    true,
    "Navigation complète au login A",
  );
  await adminLink.waitFor();
  await openCategory();
  await page.waitForLoadState("networkidle");
  assert.equal(
    count(listPath, "a"),
    0,
    "Liste demandée depuis la catégorie à cache froid",
  );
  await page.getByRole("button", { name: "Catégories", exact: true }).click();
  await page.getByRole("button", { name: "Massifs : Ski fictif" }).click();
  await page.getByRole("link", { name: "Massif fictif", exact: true }).click();
  await page.waitForURL(`${origin}${statePath}`);
  await hikeLink.waitFor();
  await page.waitForLoadState("networkidle");
  assert.equal(
    count(listPath, "a"),
    0,
    "Liste demandée depuis le massif à cache froid",
  );
  await favoriteLink.click();
  await page.waitForURL(`${origin}/favorites`);
  await hikeLink.waitFor();
  assert.equal(count(listPath, "a"), 1);
  await hikeLink.click();
  await page.getByRole("button", { name: "Retirer des favoris" }).waitFor();
  assert.equal(await heart.getAttribute("aria-pressed"), "true");
  assert.equal(
    await page.evaluate(() => !!window.dataQa),
    true,
    "Navigation complète avant logout A",
  );
  await page.getByRole("button", { name: "Déconnexion", exact: true }).click();
  await page.waitForURL(`${origin}/auth/signIn`);
  assert.equal(
    await page.evaluate(() => !!window.dataQa),
    true,
    "Navigation complète au logout A",
  );
  await page.evaluate(() => {
    window.dataQa.watch = true;
  });

  await signIn("b");
  await waitForRead("/users");
  assert.equal(
    await adminLink.count(),
    0,
    "Lien admin de A pendant la lecture du profil B",
  );
  gates.get("/users").resolve();

  await favoriteLink.click();
  await page.waitForURL(`${origin}/favorites`);
  await waitForRead(listPath);
  await page
    .getByText("Chargement des activités", { exact: true })
    .waitFor({ state: "attached" });
  assert.equal(
    await hikeLink.count(),
    0,
    "Liste de A pendant la lecture de la liste B",
  );
  gates.get(listPath).resolve();
  await page
    .getByRole("heading", { name: "Aucun favori enregistré" })
    .waitFor();
  assert.equal(count(listPath, "b"), 1);

  await page.getByRole("link", { name: "Explorer les activités" }).click();
  await openCategory();
  await hikeLink.click();
  await page.waitForURL(`${origin}${hikePath}`);
  await waitForRead(statusPath);
  await heart.waitFor();
  assert.equal(
    await heart.getAttribute("aria-pressed"),
    null,
    "Cœur de A pendant la lecture du statut B",
  );
  assert.equal(await heart.isDisabled(), true);
  assert.equal(
    count(listPath, "b"),
    1,
    "Le parcours catégorie → fiche ne doit pas relire la liste B",
  );
  gates.get(statusPath).resolve();
  await page.waitForFunction(() =>
    document.querySelector(
      'button[aria-label="Ajouter aux favoris"][aria-pressed="false"]:enabled',
    ),
  );
  assert.deepEqual(
    await page.evaluate(() => window.dataQa.leaks),
    [],
    "Flash du compte A après reconnexion",
  );
  await page.evaluate(() => {
    window.dataQa.watch = false;
  });

  await heart.click();
  await page.getByRole("button", { name: "Retirer des favoris" }).waitFor();
  await favoriteLink.click();
  await hikeLink.waitFor();
  assert.equal(count(statusPath, "b", "PUT"), 1);
  assert.equal(
    count(listPath, "b"),
    2,
    "La liste B doit être invalidée après le PUT",
  );
  assert.equal(await adminLink.count(), 0);
  const denied = await page.request.get(`${origin}/admin`, { maxRedirects: 0 });
  assert.equal(denied.status(), 307);
  console.log(
    "Catégorie/massif à cache froid : 0 GET liste ; /favorites : 1 GET par compte.",
  );
  console.log(
    "Même document A → B : 0 flash liste/cœur/administration ; lectures B bloquées puis relâchées.",
  );
  console.log("PUT de B : 1 ; liste B rechargée, accès admin refusé (307).");
} finally {
  for (const gate of gates.values()) gate.resolve();
  await browser?.close();
  fixture.closeAllConnections();
  fixture.close();
}
