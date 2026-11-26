/* global document -- Browser callbacks executed by Playwright. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
    output: { type: "string" },
    baseline: { type: "boolean" },
  },
});
const { chromium } = createRequire(import.meta.url)(values.playwright);
const origin = "http://127.0.0.1:46254";
if (values.output) await mkdir(values.output, { recursive: true });
const browser = await chromium.launch({ executablePath: values.chromium });
const screenshot = (page, name) =>
  values.output &&
  page.screenshot({ path: join(values.output, `${name}.png`) });

try {
  for (const [width, height, dpr] of [
    [390, 844, 1],
    [820, 850, 1],
    [1440, 900, 1],
    [1440, 900, 2],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: dpr,
    });
    await context.addCookies([
      { name: "qa-ui", value: "catalog", url: origin },
      { name: "qa-run", value: `${Date.now()}-${width}-${dpr}`, url: origin },
    ]);
    await context.route("**/*", (route) =>
      new URL(route.request().url()).origin === origin
        ? route.continue()
        : route.abort(),
    );
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const mediaRequests = [];
    const brokenResponses = [];
    let detailPrefetches = 0;
    page.on("request", (req) => {
      const url = new URL(req.url());
      if (url.pathname === "/api/images")
        mediaRequests.push(url.searchParams.get("path"));
      if (url.pathname.includes("/hike/catalog-")) detailPrefetches++;
    });
    page.on("response", (response) => {
      const url = new URL(response.url());
      if (
        url.pathname === "/api/images" &&
        url.searchParams.get("path") === "catalog-1.svg"
      )
        brokenResponses.push(response.status());
    });
    await page.goto(`${origin}/categories/ski`);
    const card = (i) =>
      page.getByRole("link", {
        name: new RegExp(`Activité catalogue ${i}(?!\\d)`),
      });
    const cover = card(0).locator("img");
    await cover.evaluate((img) => img.decode());
    await page.waitForLoadState("networkidle");
    const first = await cover.evaluate((img) => ({
      cssWidth: Math.round(img.getBoundingClientRect().width),
      url: img.currentSrc,
      loading: img.loading,
      priority: img.fetchPriority,
    }));
    const imageWidth = Number(new URL(first.url).searchParams.get("width"));
    const network = await page.evaluate(() => {
      const entries = performance
        .getEntriesByType("resource")
        .filter(({ name }) => new URL(name).pathname === "/api/images");
      return {
        responses: entries.length,
        transferBytes: entries.reduce(
          (sum, entry) => sum + entry.transferSize,
          0,
        ),
      };
    });
    console.log(
      JSON.stringify({
        width,
        height,
        dpr,
        cssWidth: first.cssWidth,
        imageWidth,
        priority: first.priority,
        loading: first.loading,
        imageRequests: mediaRequests.length,
        detailPrefetches,
        ...network,
      }),
    );
    if (values.baseline) {
      await context.close();
      continue;
    }

    assert.equal(first.loading, "eager");
    assert.equal(first.priority, "high");
    assert.ok(
      imageWidth >= first.cssWidth * dpr &&
        imageWidth <= first.cssWidth * dpr * 1.3,
    );
    assert.ok(
      mediaRequests.length < 23 && !mediaRequests.includes("catalog-23.svg"),
    );
    assert.equal(detailPrefetches, 0);
    assert.equal(
      await page.locator('img[loading="eager"][src*="catalog-"]').count(),
      1,
    );
    assert.deepEqual(brokenResponses, [404]);
    const missingImage = card(1).locator("img");
    await missingImage.waitFor({ state: "detached" });
    assert.equal(await card(2).locator("img").count(), 0);
    assert.ok(!mediaRequests.includes("null"));
    await card(0).focus();
    assert.deepEqual(
      await card(0).evaluate((el) => {
        const style = el.ownerDocument.defaultView.getComputedStyle(el);
        return {
          focus: el.matches(":focus-visible"),
          outline: style.outlineStyle,
          shadow: style.boxShadow,
        };
      }),
      { focus: true, outline: "solid", shadow: "none" },
    );
    await screenshot(page, `catalog-focus-${width}-${dpr}x`);
    const resting = await card(0).boundingBox();
    await card(0).hover();
    assert.deepEqual(await card(0).boundingBox(), resting);
    await page.keyboard.press("Tab");
    assert.ok(await card(1).evaluate((el) => el === document.activeElement));
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      width,
    );
    await screenshot(page, `catalog-${width}-${dpr}x`);

    if (width === 1440 && dpr === 1) {
      const trigger = page.getByRole("button", {
        name: "Catégories",
        exact: true,
      });
      await trigger.focus();
      await page.keyboard.press("Enter");
      const menu = page.getByRole("navigation", {
        name: "Catégories",
        exact: true,
      });
      const ski = menu.getByRole("button", { name: "Massifs : Ski fictif" });
      await ski.waitFor();
      assert.equal(await menu.getByRole("link", { name: /Massif/ }).count(), 0);
      assert.ok((await menu.boundingBox()).width <= 352);
      await screenshot(page, "categories-initial");
      await ski.focus();
      await page.keyboard.press("Space");
      const south = menu.getByRole("link", { name: "Massif Sud" });
      const east = menu.getByRole("link", { name: "Massif Est" });
      const west = menu.getByRole("link", { name: "Massif Ouest" });
      await south.locator("img").evaluate((img) => img.decode());
      assert.equal(await south.locator("img").getAttribute("loading"), "eager");
      await east.locator("img").waitFor({ state: "detached" });
      assert.equal(await west.locator("img").count(), 0);
      await page.keyboard.press("Tab");
      assert.ok(
        await south.evaluate(
          (el) =>
            el === document.activeElement &&
            el.ownerDocument.defaultView.getComputedStyle(el).outlineStyle ===
              "solid",
        ),
      );
      await screenshot(page, "categories-expanded");
      await page.keyboard.press("Escape");
      assert.ok(await trigger.evaluate((el) => el === document.activeElement));
      assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    }
    await context.close();
  }
} finally {
  await browser.close();
}
